import mongoose from 'mongoose';
import { DownloadJob, DownloadJobDocument, DownloadJobStatus } from '../models/download-job.model';
import { Video, VideoDocument } from '../models/video.model';
import { User } from '../models/user.model';
import { ytdlpService, DownloadResult, QualityProfile } from './ytdlp.service';
import { storageService } from './storage.service';
import { metadataService } from './metadata.service';
import { websocketService } from './websocket.service';
import { SocketEventType } from '../types/socket.types';
import { logInfo, logError, logDebug, logWarning } from '../utils/logger';
import EventEmitter from 'events';
import path from 'path';
import { setTimeout as sleep } from 'timers/promises';

/**
 * Job priority levels
 */
export enum JobPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 10,
  URGENT = 20
}

/**
 * Download queue configuration
 */
export interface DownloadQueueConfig {
  pollInterval: number; // milliseconds
  maxConcurrentDownloads: number;
  maxRetriesPerJob: number;
  retryDelayBase: number; // milliseconds
  defaultPriority: JobPriority;
  jobTimeoutMinutes: number;
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  pauseOnError: boolean;
  allowAutomaticRetry: boolean;
  allowUserPause: boolean;
  allowUserCancel: boolean;
  cleanupCompletedJobsAfterDays: number;
  cleanupFailedJobsAfterDays: number;
}

/**
 * Class handling the download job queue
 */
export class DownloadQueueService extends EventEmitter {
  private config: DownloadQueueConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private activeJobs: Map<string, DownloadJobDocument> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private jobTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Download Queue Service events
   */
  static readonly EVENTS = {
    JOB_STARTED: 'job:started',
    JOB_COMPLETED: 'job:completed',
    JOB_FAILED: 'job:failed',
    JOB_PAUSED: 'job:paused',
    JOB_RESUMED: 'job:resumed',
    JOB_CANCELED: 'job:canceled',
    QUEUE_STARTED: 'queue:started',
    QUEUE_STOPPED: 'queue:stopped',
    QUEUE_PAUSED: 'queue:paused',
    QUEUE_RESUMED: 'queue:resumed',
    ERROR: 'error',
  };
  
  /**
   * Create a new Download Queue Service
   * @param config Configuration options
   */
  constructor(config?: Partial<DownloadQueueConfig>) {
    super();
    
    // Default configuration
    this.config = {
      pollInterval: 5000, // 5 seconds
      maxConcurrentDownloads: 3,
      maxRetriesPerJob: 3,
      retryDelayBase: 5000, // 5 seconds
      defaultPriority: JobPriority.NORMAL,
      jobTimeoutMinutes: 120, // 2 hours
      notifyOnCompletion: true,
      notifyOnFailure: true,
      pauseOnError: false,
      allowAutomaticRetry: true,
      allowUserPause: true,
      allowUserCancel: true,
      cleanupCompletedJobsAfterDays: 30,
      cleanupFailedJobsAfterDays: 14,
      ...config
    };
    
    // Register event handlers
    this.setupEventHandlers();
    
    logInfo('Download Queue Service initialized with config:', this.config);
  }
  
  /**
   * Set up event handlers for the queue
   */
  private setupEventHandlers(): void {
    // Handle job started
    this.on(DownloadQueueService.EVENTS.JOB_STARTED, (job: DownloadJobDocument & { _id: mongoose.Types.ObjectId }) => {
      websocketService.broadcastDownloadUpdate({
        jobId: job._id.toString(),
        videoId: job.videoId.toString(),
        status: job.status,
        progress: job.progress,
        timestamp: new Date(),
        message: `Download started: ${job._id}`,
      });
      
      // Set a timeout for the job
      this.setJobTimeout(job);
    });
    
    // Handle job completed
    this.on(DownloadQueueService.EVENTS.JOB_COMPLETED, (job: DownloadJobDocument & { _id: mongoose.Types.ObjectId }, result: DownloadResult) => {
      this.clearJobTimeout(job._id.toString());
      
      if (this.config.notifyOnCompletion) {
        websocketService.broadcastDownloadUpdate({
          jobId: job._id.toString(),
          videoId: job.videoId.toString(),
          status: job.status,
          progress: job.progress,
          timestamp: new Date(),
          message: `Download completed: ${result.outputPath}`,
        });
      }
    });
    
    // Handle job failed
    this.on(DownloadQueueService.EVENTS.JOB_FAILED, (job: DownloadJobDocument & { _id: mongoose.Types.ObjectId }, error: Error) => {
      this.clearJobTimeout(job._id.toString());
      
      if (this.config.notifyOnFailure) {
        websocketService.broadcastDownloadUpdate({
          jobId: job._id.toString(),
          videoId: job.videoId.toString(),
          status: job.status,
          progress: job.progress,
          timestamp: new Date(),
          message: `Download failed: ${error.message}`,
          error: error.message,
        });
      }
      
      // Pause queue if configured to do so
      if (this.config.pauseOnError) {
        this.pauseQueue();
      }
    });
    
    // Handle queue started
    this.on(DownloadQueueService.EVENTS.QUEUE_STARTED, () => {
      websocketService.broadcast(SocketEventType.SYSTEM_NOTIFICATION, {
        level: 'info',
        message: 'Download queue started',
        timestamp: new Date(),
      });
    });
    
    // Handle queue stopped
    this.on(DownloadQueueService.EVENTS.QUEUE_STOPPED, () => {
      websocketService.broadcast(SocketEventType.SYSTEM_NOTIFICATION, {
        level: 'info',
        message: 'Download queue stopped',
        timestamp: new Date(),
      });
    });
    
    // Handle errors
    this.on(DownloadQueueService.EVENTS.ERROR, (error: Error) => {
      logError('Download queue error:', error);
      
      websocketService.broadcast(SocketEventType.SYSTEM_ERROR, {
        level: 'error',
        message: `Download queue error: ${error.message}`,
        timestamp: new Date(),
      });
    });
  }
  
  /**
   * Set a timeout for a job
   * @param job The job to set a timeout for
   */
  private setJobTimeout(job: DownloadJobDocument & { _id: mongoose.Types.ObjectId }): void {
    const jobId = job._id.toString();
    
    // Clear any existing timeout
    this.clearJobTimeout(jobId);
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        logError(`Job ${jobId} timed out after ${this.config.jobTimeoutMinutes} minutes`);
        
        // Get fresh job data
        const updatedJob = await DownloadJob.findById(jobId);
        if (!updatedJob || updatedJob.status !== 'processing') {
          return;
        }
        
        // Mark as failed
        updatedJob.status = 'failed';
        updatedJob.errorMessage = `Job timed out after ${this.config.jobTimeoutMinutes} minutes`;
        updatedJob.completedAt = new Date();
        await updatedJob.save();
        
        // Remove from active jobs
        this.activeJobs.delete(jobId);
        
        // Emit event
        this.emit(DownloadQueueService.EVENTS.JOB_FAILED, updatedJob, new Error(`Job timed out after ${this.config.jobTimeoutMinutes} minutes`));
      } catch (error) {
        logError(`Error handling job timeout for ${jobId}:`, error as Error);
      }
    }, this.config.jobTimeoutMinutes * 60 * 1000);
    
    this.jobTimeouts.set(jobId, timeout);
  }
  
  /**
   * Clear a job timeout
   * @param jobId The job ID to clear timeout for
   */
  private clearJobTimeout(jobId: string): void {
    const timeout = this.jobTimeouts.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.jobTimeouts.delete(jobId);
    }
  }
  
  /**
   * Start the download queue processor
   */
  public async startQueue(): Promise<void> {
    if (this.isRunning) {
      logInfo('Download queue is already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    
    // Start polling for jobs
    this.pollingInterval = setInterval(() => this.processQueue(), this.config.pollInterval);
    
    // Process immediately
    this.processQueue();
    
    this.emit(DownloadQueueService.EVENTS.QUEUE_STARTED);
    logInfo('Download queue started');
  }
  
  /**
   * Stop the download queue processor
   */
  public async stopQueue(): Promise<void> {
    if (!this.isRunning) {
      logInfo('Download queue is already stopped');
      return;
    }
    
    this.isRunning = false;
    
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Cancel active job timeouts
    for (const [jobId, timeout] of this.jobTimeouts.entries()) {
      clearTimeout(timeout);
      this.jobTimeouts.delete(jobId);
    }
    
    this.emit(DownloadQueueService.EVENTS.QUEUE_STOPPED);
    logInfo('Download queue stopped');
  }
  
  /**
   * Pause the download queue
   */
  public pauseQueue(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    this.isPaused = true;
    
    this.emit(DownloadQueueService.EVENTS.QUEUE_PAUSED);
    logInfo('Download queue paused');
  }
  
  /**
   * Resume the download queue
   */
  public resumeQueue(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    
    // Process immediately when resumed
    this.processQueue();
    
    this.emit(DownloadQueueService.EVENTS.QUEUE_RESUMED);
    logInfo('Download queue resumed');
  }
  
  /**
   * Process the download queue
   * - Find jobs to process
   * - Process jobs in parallel up to maxConcurrentDownloads
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    try {
      // Check if we have capacity to process more jobs
      const availableSlots = this.config.maxConcurrentDownloads - this.activeJobs.size;
      if (availableSlots <= 0) {
        return;
      }
      
      // Find jobs to process
      const jobs = await DownloadJob.find({
        status: 'queued',
      })
        .sort({ priority: -1, createdAt: 1 }) // Higher priority first, then oldest first
        .limit(availableSlots);
      
      if (jobs.length === 0) {
        return;
      }
      
      logDebug(`Found ${jobs.length} jobs to process`);
      
      // Process each job
      for (const job of jobs) {
        const typedJob = job as unknown as DownloadJobDocument & { _id: mongoose.Types.ObjectId };
        this.processJob(typedJob).catch(error => {
          logError(`Error processing job ${typedJob._id}:`, error as Error);
          this.emit(DownloadQueueService.EVENTS.ERROR, error);
        });
      }
    } catch (error) {
      logError('Error in queue processing:', error as Error);
      this.emit(DownloadQueueService.EVENTS.ERROR, error);
    }
  }
  
  /**
   * Process a single download job
   * @param job The job to process
   */
  private async processJob(job: DownloadJobDocument & { _id: mongoose.Types.ObjectId }): Promise<void> {
    const jobId = job._id.toString();
    
    // Skip if already processing
    if (this.activeJobs.has(jobId)) {
      return;
    }
    
    try {
      // Mark job as processing
      job.status = 'processing';
      job.startedAt = new Date();
      await job.save();
      
      // Add to active jobs
      this.activeJobs.set(jobId, job);
      
      // Find the video
      const video = await Video.findById(job.videoId);
      if (!video) {
        throw new Error(`Video not found: ${job.videoId}`);
      }
      
      // Update video status
      video.archiveStatus = 'downloading';
      await video.save();
      
      // Emit job started event
      this.emit(DownloadQueueService.EVENTS.JOB_STARTED, job);
      
      // Create output directory path
      let outputPath: string;
      if (job.outputPath) {
        outputPath = job.outputPath;
      } else {
        // Generate path based on channel and video
        const channelId = video.channelId.toString();
        const channel = await mongoose.model('Channel').findById(channelId);
        
        if (!channel) {
          throw new Error(`Channel not found: ${channelId}`);
        }
        
        const channelPath = storageService.generateChannelPath(
          channel.youtubeId, 
          channel.title
        );
        
        // Create channel directory if needed
        await storageService.createDirectory(channelPath);
        
        // Check if video belongs to a playlist
        let playlistPath = channelPath;
        if (video.playlistId) {
          const playlist = await mongoose.model('Playlist').findById(video.playlistId);
          if (playlist) {
            playlistPath = storageService.generatePlaylistPath(
              channelPath,
              playlist.youtubeId,
              playlist.title
            );
            
            // Create playlist directory if needed
            await storageService.createDirectory(playlistPath);
          }
        }
        
        // Create video directory based on YouTube ID and title
        const uploadDate = video.publishedAt ? 
          video.publishedAt.toISOString().split('T')[0] : 
          'unknown-date';
        
        const videoPath = storageService.generateVideoPath(
          playlistPath,
          video.youtubeId,
          uploadDate,
          video.title
        );
        
        // Create video directory
        await storageService.createDirectory(videoPath);
        
        outputPath = videoPath;
        
        // Update job with output path
        job.outputPath = outputPath;
        await job.save();
      }
      
      // Get the quality profile from job options or use default
      const profileName = job.ytdlpOptions?.profile || ytdlpService.getConfig().defaultQualityProfile;
      
      // Download the video
      logInfo(`Starting download for video ${video.youtubeId} (${job._id}) with profile ${profileName}`);
      
      const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
      const downloadResult = await ytdlpService.downloadVideo(
        youtubeUrl,
        outputPath,
        profileName,
        job.ytdlpOptions,
        jobId,
        job.videoId.toString(),
        job.userId.toString()
      );
      
      // Process the result
      if (downloadResult.success) {
        // Mark job as completed
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date();
        job.metadata = {
          ...job.metadata,
          fileSize: downloadResult.fileSize,
          format: downloadResult.format,
          quality: downloadResult.quality,
          duration: downloadResult.duration,
        };
        await job.save();
        
        // Update video record
        video.isArchived = true;
        video.archiveStatus = 'completed';
        video.downloadedAt = new Date();
        video.fileSize = downloadResult.fileSize;
        video.filePath = downloadResult.outputPath;
        video.format = downloadResult.format;
        video.quality = downloadResult.quality;
        
        // Handle thumbnails
        if (downloadResult.thumbnailPath) {
          const thumbnailFileName = path.basename(downloadResult.thumbnailPath);
          const thumbnailRelativePath = path.join(
            path.relative(storageService.getProvider().getBasePath(), outputPath),
            thumbnailFileName
          );
          video.thumbnailUrl = await storageService.getPublicUrl(thumbnailRelativePath);
        }
        
        // Handle subtitles
        if (downloadResult.subtitlePaths && downloadResult.subtitlePaths.length > 0) {
          video.hasSubtitles = true;
          
          // Extract languages from subtitle filenames
          // Format is typically videoname.LANG.srt
          const subtitleLanguages = downloadResult.subtitlePaths.map(subtitlePath => {
            const fileName = path.basename(subtitlePath);
            const match = fileName.match(/\.([a-z]{2,3}(-[A-Z]{2})?)\.srt$/);
            return match ? match[1] : 'unknown';
          });
          
          video.subtitleLanguages = subtitleLanguages.filter(lang => lang !== 'unknown');
        }
        
        // Generate a public URL for the video file
        if (downloadResult.outputPath) {
          video.fileUrl = await ytdlpService.generateVideoUrl(video);
        }
        
        // Save metadata path
        if (downloadResult.metadataPath) {
          video.metadataPath = downloadResult.metadataPath;
        }
        
        await video.save();
        
        // Process enhanced metadata with the new metadata service
        try {
          logInfo(`Processing enhanced metadata for video ${video.youtubeId}`);
          
          // Extract comprehensive metadata using either file-based or API-based methods
          let metadataResult;
          
          if (downloadResult.outputPath) {
            // If we have a video file, use file-based extraction for most accurate metadata
            metadataResult = await metadataService.extractMetadataFromFile(
              downloadResult.outputPath,
              video.youtubeId,
              {
                extractThumbnails: !downloadResult.thumbnailPath, // Skip if we already have a thumbnail
                extractSubtitles: !video.hasSubtitles, // Skip if we already have subtitles
                extractChapters: true,
                generateSearchIndex: true,
                includeRawMetadata: true,
                extractKeywords: true,
                persistToStorage: true
              }
            );
          } else {
            // Otherwise use API-based extraction
            metadataResult = await metadataService.extractMetadata(
              video.youtubeId,
              {
                extractThumbnails: !video.thumbnailUrl,
                extractSubtitles: !video.hasSubtitles,
                generateSearchIndex: true,
                includeRawMetadata: true,
                extractKeywords: true
              }
            );
          }
          
          if (metadataResult.success && metadataResult.metadata) {
            // Update the video with any additional metadata found
            if (metadataResult.storagePath && (!video.metadataPath || video.metadataPath !== metadataResult.storagePath)) {
              video.metadataPath = metadataResult.storagePath;
              await video.save();
            }
            
            logInfo(`Enhanced metadata processed successfully for video ${video.youtubeId}`);
          } else if (!metadataResult.success) {
            logWarning(`Enhanced metadata extraction failed for video ${video.youtubeId}: ${metadataResult.errorMessage}`);
          }
        } catch (metadataError) {
          // Log but don't fail the download job if metadata extraction fails
          logError(`Error processing enhanced metadata for video ${video.youtubeId}:`, metadataError as Error);
        }
        
        // Remove from active jobs
        this.activeJobs.delete(jobId);
        
        // Emit job completed event
        this.emit(DownloadQueueService.EVENTS.JOB_COMPLETED, job, downloadResult);
        
        logInfo(`Download completed for video ${video.youtubeId} (${job._id})`);
      } else {
        // Handle download failure
        const errorMessage = downloadResult.error || 'Unknown error during download';
        
        // Check if we should retry
        if (this.config.allowAutomaticRetry && job.retryCount < job.maxRetries) {
          // Increment retry count
          job.retryCount += 1;
          job.status = 'queued';
          job.errorMessage = `Failed attempt ${job.retryCount}/${job.maxRetries}: ${errorMessage}`;
          await job.save();
          
          // Exponential backoff for retries
          const retryDelay = this.config.retryDelayBase * Math.pow(2, job.retryCount - 1);
          
          logInfo(`Scheduling retry ${job.retryCount}/${job.maxRetries} for job ${job._id} in ${retryDelay}ms`);
          
          // Wait before processing again
          await sleep(retryDelay);
          
          // Remove from active jobs to allow retry
          this.activeJobs.delete(jobId);
        } else {
          // Mark as failed
          job.status = 'failed';
          job.completedAt = new Date();
          job.errorMessage = errorMessage;
          await job.save();
          
          // Update video status
          video.archiveStatus = 'failed';
          video.errorMessage = errorMessage;
          await video.save();
          
          // Remove from active jobs
          this.activeJobs.delete(jobId);
          
          // Emit job failed event
          const error = new Error(errorMessage);
          this.emit(DownloadQueueService.EVENTS.JOB_FAILED, job, error);
          
          logError(`Download failed for video ${video.youtubeId} (${job._id}): ${errorMessage}`);
        }
      }
    } catch (error) {
      logError(`Error processing job ${jobId}:`, error as Error);
      
      try {
        // Update job status
        job.status = 'failed';
        job.completedAt = new Date();
        job.errorMessage = (error as Error).message || 'Unknown error';
        await job.save();
        
        // Update video status if possible
        try {
          const video = await Video.findById(job.videoId);
          if (video) {
            video.archiveStatus = 'failed';
            video.errorMessage = (error as Error).message || 'Unknown error';
            await video.save();
          }
        } catch (videoError) {
          logError(`Error updating video status for job ${jobId}:`, videoError as Error);
        }
        
        // Remove from active jobs
        this.activeJobs.delete(jobId);
        
        // Emit job failed event
        this.emit(DownloadQueueService.EVENTS.JOB_FAILED, job, error as Error);
      } catch (updateError) {
        logError(`Error updating job ${jobId} status:`, updateError as Error);
      }
    }
  }
  
  /**
   * Add a new download job to the queue
   * @param videoId ID of the video to download
   * @param userId ID of the user who initiated the download
   * @param options Additional options for the download
   * @returns The created download job
   */
  public async addJob(
    videoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    options: {
      priority?: JobPriority;
      profileName?: string;
      ytdlpOptions?: Record<string, any>;
      outputPath?: string;
      maxRetries?: number;
    } = {}
  ): Promise<DownloadJobDocument> {
    try {
      // Verify video exists
      const video = await Video.findById(videoId);
      if (!video) {
        throw new Error(`Video not found: ${videoId}`);
      }
      
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Check if job already exists for this video
      const existingJob = await DownloadJob.findOne({
        videoId,
        status: { $in: ['queued', 'processing', 'paused'] },
      });
      
      if (existingJob) {
        logInfo(`Job already exists for video ${videoId}: ${existingJob._id}`);
        return existingJob;
      }
      
      // Create new job
      const job = new DownloadJob({
        videoId,
        userId,
        status: 'queued',
        priority: options.priority || this.config.defaultPriority,
        progress: 0,
        retryCount: 0,
        maxRetries: options.maxRetries || this.config.maxRetriesPerJob,
        ytdlpOptions: {
          profile: options.profileName,
          ...options.ytdlpOptions
        },
        outputPath: options.outputPath,
      });
      
      await job.save();
      
      // Update video status
      video.archiveStatus = 'pending';
      await video.save();
      
      logInfo(`Added download job ${job._id} for video ${videoId} with priority ${job.priority}`);
      
      // Process queue immediately if running
      if (this.isRunning && !this.isPaused) {
        this.processQueue();
      }
      
      return job;
    } catch (error) {
      logError('Error adding download job:', error as Error);
      throw error;
    }
  }
  
  /**
   * Pause a download job
   * @param jobId ID of the job to pause
   * @returns True if paused successfully, false otherwise
   */
  public async pauseJob(jobId: string): Promise<boolean> {
    try {
      const job = await DownloadJob.findById(jobId);
      if (!job) {
        logError(`Job not found: ${jobId}`);
        return false;
      }
      
      // Only queued or processing jobs can be paused
      if (job.status !== 'queued' && job.status !== 'processing') {
        logError(`Cannot pause job ${jobId} with status ${job.status}`);
        return false;
      }
      
      // If the job is processing, we need to stop the download
      if (job.status === 'processing') {
        // Get the video
        const video = await Video.findById(job.videoId);
        if (!video) {
          logError(`Video not found for job ${jobId}: ${job.videoId}`);
          return false;
        }
        
        // Create YouTube URL
        const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
        
        // Cancel the download
        const canceled = ytdlpService.cancelDownload(youtubeUrl);
        if (!canceled) {
          logError(`Failed to cancel download for job ${jobId}`);
          return false;
        }
      }
      
      // Update job status
      job.status = 'paused';
      await job.save();
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Clear job timeout
      this.clearJobTimeout(jobId);
      
      // Emit job paused event
      this.emit(DownloadQueueService.EVENTS.JOB_PAUSED, job);
      
      logInfo(`Paused job ${jobId}`);
      return true;
    } catch (error) {
      logError(`Error pausing job ${jobId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Resume a paused download job
   * @param jobId ID of the job to resume
   * @returns True if resumed successfully, false otherwise
   */
  public async resumeJob(jobId: string): Promise<boolean> {
    try {
      const job = await DownloadJob.findById(jobId);
      if (!job) {
        logError(`Job not found: ${jobId}`);
        return false;
      }
      
      // Only paused jobs can be resumed
      if (job.status !== 'paused') {
        logError(`Cannot resume job ${jobId} with status ${job.status}`);
        return false;
      }
      
      // Update job status
      job.status = 'queued';
      await job.save();
      
      // Emit job resumed event
      this.emit(DownloadQueueService.EVENTS.JOB_RESUMED, job);
      
      // Process queue immediately if running
      if (this.isRunning && !this.isPaused) {
        this.processQueue();
      }
      
      logInfo(`Resumed job ${jobId}`);
      return true;
    } catch (error) {
      logError(`Error resuming job ${jobId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Cancel a download job
   * @param jobId ID of the job to cancel
   * @returns True if canceled successfully, false otherwise
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await DownloadJob.findById(jobId);
      if (!job) {
        logError(`Job not found: ${jobId}`);
        return false;
      }
      
      // Only queued, processing, or paused jobs can be canceled
      if (job.status !== 'queued' && job.status !== 'processing' && job.status !== 'paused') {
        logError(`Cannot cancel job ${jobId} with status ${job.status}`);
        return false;
      }
      
      // If the job is processing, we need to stop the download
      if (job.status === 'processing') {
        // Get the video
        const video = await Video.findById(job.videoId);
        if (!video) {
          logError(`Video not found for job ${jobId}: ${job.videoId}`);
          return false;
        }
        
        // Create YouTube URL
        const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
        
        // Cancel the download
        const canceled = ytdlpService.cancelDownload(youtubeUrl);
        if (!canceled) {
          logError(`Failed to cancel download for job ${jobId}`);
          return false;
        }
      }
      
      // Update job status
      job.status = 'canceled';
      job.completedAt = new Date();
      await job.save();
      
      // Update video status if needed
      const video = await Video.findById(job.videoId);
      if (video && video.archiveStatus === 'downloading') {
        video.archiveStatus = 'pending';
        await video.save();
      }
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Clear job timeout
      this.clearJobTimeout(jobId);
      
      // Emit job canceled event
      this.emit(DownloadQueueService.EVENTS.JOB_CANCELED, job);
      
      logInfo(`Canceled job ${jobId}`);
      return true;
    } catch (error) {
      logError(`Error canceling job ${jobId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Retry a failed download job
   * @param jobId ID of the job to retry
   * @returns True if retry was initiated successfully, false otherwise
   */
  public async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await DownloadJob.findById(jobId);
      if (!job) {
        logError(`Job not found: ${jobId}`);
        return false;
      }
      
      // Only failed jobs can be retried
      if (job.status !== 'failed') {
        logError(`Cannot retry job ${jobId} with status ${job.status}`);
        return false;
      }
      
      // Update job status
      job.status = 'queued';
      job.progress = 0;
      job.errorMessage = undefined;
      await job.save();
      
      // Update video status
      const video = await Video.findById(job.videoId);
      if (video) {
        video.archiveStatus = 'pending';
        video.errorMessage = undefined;
        await video.save();
      }
      
      // Process queue immediately if running
      if (this.isRunning && !this.isPaused) {
        this.processQueue();
      }
      
      logInfo(`Retrying job ${jobId}`);
      return true;
    } catch (error) {
      logError(`Error retrying job ${jobId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Update the priority of a download job
   * @param jobId ID of the job to update
   * @param priority New priority level
   * @returns True if priority was updated successfully, false otherwise
   */
  public async updateJobPriority(jobId: string, priority: JobPriority): Promise<boolean> {
    try {
      const job = await DownloadJob.findById(jobId);
      if (!job) {
        logError(`Job not found: ${jobId}`);
        return false;
      }
      
      // Only queued or paused jobs can have their priority updated
      if (job.status !== 'queued' && job.status !== 'paused') {
        logError(`Cannot update priority for job ${jobId} with status ${job.status}`);
        return false;
      }
      
      // Update priority
      job.priority = priority;
      await job.save();
      
      logInfo(`Updated priority for job ${jobId} to ${priority}`);
      return true;
    } catch (error) {
      logError(`Error updating priority for job ${jobId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Get stats about the download queue
   * @returns Statistics about the queue
   */
  public async getQueueStats(): Promise<{
    queuedCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
    pausedCount: number;
    canceledCount: number;
    totalCount: number;
    activeJobs: number;
    isRunning: boolean;
    isPaused: boolean;
  }> {
    try {
      // Get counts for each status
      const [
        queuedCount,
        processingCount,
        completedCount,
        failedCount,
        pausedCount,
        canceledCount,
        totalCount
      ] = await Promise.all([
        DownloadJob.countDocuments({ status: 'queued' }),
        DownloadJob.countDocuments({ status: 'processing' }),
        DownloadJob.countDocuments({ status: 'completed' }),
        DownloadJob.countDocuments({ status: 'failed' }),
        DownloadJob.countDocuments({ status: 'paused' }),
        DownloadJob.countDocuments({ status: 'canceled' }),
        DownloadJob.countDocuments({}),
      ]);
      
      return {
        queuedCount,
        processingCount,
        completedCount,
        failedCount,
        pausedCount,
        canceledCount,
        totalCount,
        activeJobs: this.activeJobs.size,
        isRunning: this.isRunning,
        isPaused: this.isPaused,
      };
    } catch (error) {
      logError('Error getting queue stats:', error as Error);
      throw error;
    }
  }
  
  /**
   * Clean up old jobs based on configuration
   */
  public async cleanupOldJobs(): Promise<void> {
    try {
      // Calculate cutoff dates
      const completedCutoff = new Date();
      completedCutoff.setDate(completedCutoff.getDate() - this.config.cleanupCompletedJobsAfterDays);
      
      const failedCutoff = new Date();
      failedCutoff.setDate(failedCutoff.getDate() - this.config.cleanupFailedJobsAfterDays);
      
      // Delete completed jobs older than cutoff
      const completedResult = await DownloadJob.deleteMany({
        status: 'completed',
        completedAt: { $lt: completedCutoff },
      });
      
      // Delete failed/canceled jobs older than cutoff
      const failedResult = await DownloadJob.deleteMany({
        status: { $in: ['failed', 'canceled'] },
        completedAt: { $lt: failedCutoff },
      });
      
      logInfo(`Cleaned up ${completedResult.deletedCount} completed jobs and ${failedResult.deletedCount} failed/canceled jobs`);
    } catch (error) {
      logError('Error cleaning up old jobs:', error as Error);
      this.emit(DownloadQueueService.EVENTS.ERROR, error);
    }
  }
  
  /**
   * Get the current configuration
   * @returns A copy of the current configuration
   */
  public getConfig(): DownloadQueueConfig {
    return { ...this.config };
  }
  
  /**
   * Update the configuration
   * @param config New configuration values
   */
  public updateConfig(config: Partial<DownloadQueueConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    
    logInfo('Updated download queue configuration');
  }
}

// Create singleton instance
export const downloadQueueService = new DownloadQueueService();