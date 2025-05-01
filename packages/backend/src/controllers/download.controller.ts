import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { DownloadJob, DownloadJobStatus } from '../models/download-job.model';
import { Video } from '../models/video.model';
import { ytdlpService } from '../services/ytdlp.service';
import { downloadQueueService, JobPriority } from '../services/download-queue.service';
import { postProcessingService } from '../services/post-processing.service';
import { logInfo, logError } from '../utils/logger';

/**
 * Controller for download-related operations
 */
export class DownloadController {
  /**
   * Get all download jobs for the current user
   */
  public async getUserJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const jobs = await DownloadJob.find({ userId })
        .sort({ createdAt: -1 })
        .populate('videoId', 'title youtubeId thumbnailUrl')
        .exec();
      
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get a specific download job
   */
  public async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = req.params.id;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      })
        .populate('videoId', 'title youtubeId thumbnailUrl duration publishedAt')
        .exec();
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      res.json(job);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a new download job
   */
  public async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { videoId, priority, profileName, options } = req.body;
      
      if (!videoId) {
        res.status(400).json({ error: 'Video ID is required' });
        return;
      }
      
      // Validate that the video exists
      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      
      // Check if job already exists for this video and user
      const existingJob = await DownloadJob.findOne({
        videoId,
        userId,
        status: { $in: ['queued', 'processing', 'paused'] }
      });
      
      if (existingJob) {
        res.status(409).json({
          error: 'Download job already exists for this video',
          jobId: existingJob._id
        });
        return;
      }
      
      // Create new job
      const job = await downloadQueueService.addJob(
        videoId,
        userId,
        {
          priority: priority !== undefined ? priority : JobPriority.NORMAL,
          profileName,
          ytdlpOptions: options
        }
      );
      
      // Return created job
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Pause a download job
   */
  public async pauseJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = req.params.id;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Check that job exists and belongs to user
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      });
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      // Can only pause queued or processing jobs
      if (job.status !== 'queued' && job.status !== 'processing') {
        res.status(400).json({
          error: `Cannot pause job with status: ${job.status}`
        });
        return;
      }
      
      // Pause the job
      const paused = await downloadQueueService.pauseJob(jobId);
      
      if (paused) {
        res.json({ success: true, status: 'paused' });
      } else {
        res.status(500).json({ error: 'Failed to pause job' });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Resume a paused download job
   */
  public async resumeJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = req.params.id;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Check that job exists and belongs to user
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      });
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      // Can only resume paused jobs
      if (job.status !== 'paused') {
        res.status(400).json({
          error: `Cannot resume job with status: ${job.status}`
        });
        return;
      }
      
      // Resume the job
      const resumed = await downloadQueueService.resumeJob(jobId);
      
      if (resumed) {
        res.json({ success: true, status: 'queued' });
      } else {
        res.status(500).json({ error: 'Failed to resume job' });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cancel a download job
   */
  public async cancelJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = req.params.id;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Check that job exists and belongs to user
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      });
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      // Can only cancel queued, processing, or paused jobs
      if (job.status !== 'queued' && job.status !== 'processing' && job.status !== 'paused') {
        res.status(400).json({
          error: `Cannot cancel job with status: ${job.status}`
        });
        return;
      }
      
      // Cancel the job
      const canceled = await downloadQueueService.cancelJob(jobId);
      
      if (canceled) {
        res.json({ success: true, status: 'canceled' });
      } else {
        res.status(500).json({ error: 'Failed to cancel job' });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Retry a failed download job
   */
  public async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = req.params.id;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Check that job exists and belongs to user
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      });
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      // Can only retry failed jobs
      if (job.status !== 'failed') {
        res.status(400).json({
          error: `Cannot retry job with status: ${job.status}`
        });
        return;
      }
      
      // Retry the job
      const retried = await downloadQueueService.retryJob(jobId);
      
      if (retried) {
        res.json({ success: true, status: 'queued' });
      } else {
        res.status(500).json({ error: 'Failed to retry job' });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update a job's priority
   */
  public async updateJobPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = req.params.id;
      const userId = req.user?.userId;
      const { priority } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      if (priority === undefined || 
          !Object.values(JobPriority).includes(priority as JobPriority)) {
        res.status(400).json({ error: 'Valid priority value is required' });
        return;
      }
      
      // Check that job exists and belongs to user
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      });
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      // Can only update priority for queued or paused jobs
      if (job.status !== 'queued' && job.status !== 'paused') {
        res.status(400).json({
          error: `Cannot update priority for job with status: ${job.status}`
        });
        return;
      }
      
      // Update priority
      const updated = await downloadQueueService.updateJobPriority(jobId, priority);
      
      if (updated) {
        res.json({ success: true, priority });
      } else {
        res.status(500).json({ error: 'Failed to update job priority' });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get download queue stats
   */
  public async getQueueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await downloadQueueService.getQueueStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get active downloads
   */
  public async getActiveDownloads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Get all processing jobs
      const activeJobs = await DownloadJob.find({
        status: 'processing'
      })
        .populate('videoId', 'title youtubeId thumbnailUrl')
        .sort({ priority: -1, createdAt: 1 })
        .exec();
      
      // Get download progress from ytdlp service
      const activeDownloads = ytdlpService.getActiveDownloads();
      
      // Combine data
      const result = activeJobs.map(job => {
        const jobId = (job._id as mongoose.Types.ObjectId).toString();
        
        // Find matching active download
        const downloadInfo = Array.from(activeDownloads.entries())
          .find(([_, info]) => info.jobId === jobId);
        
        return {
          job,
          progress: downloadInfo ? downloadInfo[1].progress : null,
          startTime: downloadInfo ? downloadInfo[1].startTime : job.startedAt,
        };
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get available quality profiles
   */
  public async getQualityProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profiles = ytdlpService.getConfig().qualityProfiles;
      res.json(profiles);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get available formats for a YouTube URL
   */
  public async getAvailableFormats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'YouTube URL is required' });
        return;
      }
      
      // Get formats
      const formats = await ytdlpService.getAvailableFormats(url);
      res.json(formats);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get video info without downloading
   */
  public async getVideoInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'YouTube URL is required' });
        return;
      }
      
      // Get video info
      const info = await ytdlpService.getVideoInfo(url);
      res.json(info);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Process a downloaded file
   */
  public async processFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Find the job
      const job = await DownloadJob.findOne({
        _id: jobId,
        userId
      });
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      
      // Can only process completed jobs
      if (job.status !== 'completed') {
        res.status(400).json({
          error: `Cannot process job with status: ${job.status}`
        });
        return;
      }
      
      // File path must exist
      if (!job.outputPath) {
        res.status(400).json({ error: 'Job has no output path' });
        return;
      }
      
      // Process options
      const options = req.body;
      
      // Process the file
      const result = await postProcessingService.processDownloadedFile(
        job.outputPath,
        job as any,
        job.metadata || {},
        options
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({
          error: result.errorMessage || 'Failed to process file'
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

// Create singleton instance
export const downloadController = new DownloadController();