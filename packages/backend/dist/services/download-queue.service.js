"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadQueueService = exports.DownloadQueueService = exports.JobPriority = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const download_job_model_1 = require("../models/download-job.model");
const video_model_1 = require("../models/video.model");
const user_model_1 = require("../models/user.model");
const ytdlp_service_1 = require("./ytdlp.service");
const storage_service_1 = require("./storage.service");
const websocket_service_1 = require("./websocket.service");
const socket_types_1 = require("../types/socket.types");
const logger_1 = require("../utils/logger");
const events_1 = __importDefault(require("events"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("timers/promises");
/**
 * Job priority levels
 */
var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["LOW"] = 0] = "LOW";
    JobPriority[JobPriority["NORMAL"] = 5] = "NORMAL";
    JobPriority[JobPriority["HIGH"] = 10] = "HIGH";
    JobPriority[JobPriority["URGENT"] = 20] = "URGENT";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
/**
 * Class handling the download job queue
 */
class DownloadQueueService extends events_1.default {
    config;
    isRunning = false;
    isPaused = false;
    activeJobs = new Map();
    pollingInterval = null;
    jobTimeouts = new Map();
    /**
     * Download Queue Service events
     */
    static EVENTS = {
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
    constructor(config) {
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
        (0, logger_1.logInfo)('Download Queue Service initialized with config:', this.config);
    }
    /**
     * Set up event handlers for the queue
     */
    setupEventHandlers() {
        // Handle job started
        this.on(DownloadQueueService.EVENTS.JOB_STARTED, (job) => {
            websocket_service_1.websocketService.broadcastDownloadUpdate({
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
        this.on(DownloadQueueService.EVENTS.JOB_COMPLETED, (job, result) => {
            this.clearJobTimeout(job._id.toString());
            if (this.config.notifyOnCompletion) {
                websocket_service_1.websocketService.broadcastDownloadUpdate({
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
        this.on(DownloadQueueService.EVENTS.JOB_FAILED, (job, error) => {
            this.clearJobTimeout(job._id.toString());
            if (this.config.notifyOnFailure) {
                websocket_service_1.websocketService.broadcastDownloadUpdate({
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
            websocket_service_1.websocketService.broadcast(socket_types_1.SocketEventType.SYSTEM_NOTIFICATION, {
                level: 'info',
                message: 'Download queue started',
                timestamp: new Date(),
            });
        });
        // Handle queue stopped
        this.on(DownloadQueueService.EVENTS.QUEUE_STOPPED, () => {
            websocket_service_1.websocketService.broadcast(socket_types_1.SocketEventType.SYSTEM_NOTIFICATION, {
                level: 'info',
                message: 'Download queue stopped',
                timestamp: new Date(),
            });
        });
        // Handle errors
        this.on(DownloadQueueService.EVENTS.ERROR, (error) => {
            (0, logger_1.logError)('Download queue error:', error);
            websocket_service_1.websocketService.broadcast(socket_types_1.SocketEventType.SYSTEM_ERROR, {
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
    setJobTimeout(job) {
        const jobId = job._id.toString();
        // Clear any existing timeout
        this.clearJobTimeout(jobId);
        // Set new timeout
        const timeout = setTimeout(async () => {
            try {
                (0, logger_1.logError)(`Job ${jobId} timed out after ${this.config.jobTimeoutMinutes} minutes`);
                // Get fresh job data
                const updatedJob = await download_job_model_1.DownloadJob.findById(jobId);
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
            }
            catch (error) {
                (0, logger_1.logError)(`Error handling job timeout for ${jobId}:`, error);
            }
        }, this.config.jobTimeoutMinutes * 60 * 1000);
        this.jobTimeouts.set(jobId, timeout);
    }
    /**
     * Clear a job timeout
     * @param jobId The job ID to clear timeout for
     */
    clearJobTimeout(jobId) {
        const timeout = this.jobTimeouts.get(jobId);
        if (timeout) {
            clearTimeout(timeout);
            this.jobTimeouts.delete(jobId);
        }
    }
    /**
     * Start the download queue processor
     */
    async startQueue() {
        if (this.isRunning) {
            (0, logger_1.logInfo)('Download queue is already running');
            return;
        }
        this.isRunning = true;
        this.isPaused = false;
        // Start polling for jobs
        this.pollingInterval = setInterval(() => this.processQueue(), this.config.pollInterval);
        // Process immediately
        this.processQueue();
        this.emit(DownloadQueueService.EVENTS.QUEUE_STARTED);
        (0, logger_1.logInfo)('Download queue started');
    }
    /**
     * Stop the download queue processor
     */
    async stopQueue() {
        if (!this.isRunning) {
            (0, logger_1.logInfo)('Download queue is already stopped');
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
        (0, logger_1.logInfo)('Download queue stopped');
    }
    /**
     * Pause the download queue
     */
    pauseQueue() {
        if (!this.isRunning || this.isPaused) {
            return;
        }
        this.isPaused = true;
        this.emit(DownloadQueueService.EVENTS.QUEUE_PAUSED);
        (0, logger_1.logInfo)('Download queue paused');
    }
    /**
     * Resume the download queue
     */
    resumeQueue() {
        if (!this.isRunning || !this.isPaused) {
            return;
        }
        this.isPaused = false;
        // Process immediately when resumed
        this.processQueue();
        this.emit(DownloadQueueService.EVENTS.QUEUE_RESUMED);
        (0, logger_1.logInfo)('Download queue resumed');
    }
    /**
     * Process the download queue
     * - Find jobs to process
     * - Process jobs in parallel up to maxConcurrentDownloads
     */
    async processQueue() {
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
            const jobs = await download_job_model_1.DownloadJob.find({
                status: 'queued',
            })
                .sort({ priority: -1, createdAt: 1 }) // Higher priority first, then oldest first
                .limit(availableSlots);
            if (jobs.length === 0) {
                return;
            }
            (0, logger_1.logDebug)(`Found ${jobs.length} jobs to process`);
            // Process each job
            for (const job of jobs) {
                const typedJob = job;
                this.processJob(typedJob).catch(error => {
                    (0, logger_1.logError)(`Error processing job ${typedJob._id}:`, error);
                    this.emit(DownloadQueueService.EVENTS.ERROR, error);
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)('Error in queue processing:', error);
            this.emit(DownloadQueueService.EVENTS.ERROR, error);
        }
    }
    /**
     * Process a single download job
     * @param job The job to process
     */
    async processJob(job) {
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
            const video = await video_model_1.Video.findById(job.videoId);
            if (!video) {
                throw new Error(`Video not found: ${job.videoId}`);
            }
            // Update video status
            video.archiveStatus = 'downloading';
            await video.save();
            // Emit job started event
            this.emit(DownloadQueueService.EVENTS.JOB_STARTED, job);
            // Create output directory path
            let outputPath;
            if (job.outputPath) {
                outputPath = job.outputPath;
            }
            else {
                // Generate path based on channel and video
                const channelId = video.channelId.toString();
                const channel = await mongoose_1.default.model('Channel').findById(channelId);
                if (!channel) {
                    throw new Error(`Channel not found: ${channelId}`);
                }
                const channelPath = storage_service_1.storageService.generateChannelPath(channel.youtubeId, channel.title);
                // Create channel directory if needed
                await storage_service_1.storageService.createDirectory(channelPath);
                // Check if video belongs to a playlist
                let playlistPath = channelPath;
                if (video.playlistId) {
                    const playlist = await mongoose_1.default.model('Playlist').findById(video.playlistId);
                    if (playlist) {
                        playlistPath = storage_service_1.storageService.generatePlaylistPath(channelPath, playlist.youtubeId, playlist.title);
                        // Create playlist directory if needed
                        await storage_service_1.storageService.createDirectory(playlistPath);
                    }
                }
                // Create video directory based on YouTube ID and title
                const uploadDate = video.publishedAt ?
                    video.publishedAt.toISOString().split('T')[0] :
                    'unknown-date';
                const videoPath = storage_service_1.storageService.generateVideoPath(playlistPath, video.youtubeId, uploadDate, video.title);
                // Create video directory
                await storage_service_1.storageService.createDirectory(videoPath);
                outputPath = videoPath;
                // Update job with output path
                job.outputPath = outputPath;
                await job.save();
            }
            // Get the quality profile from job options or use default
            const profileName = job.ytdlpOptions?.profile || ytdlp_service_1.ytdlpService.getConfig().defaultQualityProfile;
            // Download the video
            (0, logger_1.logInfo)(`Starting download for video ${video.youtubeId} (${job._id}) with profile ${profileName}`);
            const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
            const downloadResult = await ytdlp_service_1.ytdlpService.downloadVideo(youtubeUrl, outputPath, profileName, job.ytdlpOptions, jobId, job.videoId.toString(), job.userId.toString());
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
                    const thumbnailFileName = path_1.default.basename(downloadResult.thumbnailPath);
                    const thumbnailRelativePath = path_1.default.join(path_1.default.relative(storage_service_1.storageService.getProvider().getBasePath(), outputPath), thumbnailFileName);
                    video.thumbnailUrl = await storage_service_1.storageService.getPublicUrl(thumbnailRelativePath);
                }
                // Handle subtitles
                if (downloadResult.subtitlePaths && downloadResult.subtitlePaths.length > 0) {
                    video.hasSubtitles = true;
                    // Extract languages from subtitle filenames
                    // Format is typically videoname.LANG.srt
                    const subtitleLanguages = downloadResult.subtitlePaths.map(subtitlePath => {
                        const fileName = path_1.default.basename(subtitlePath);
                        const match = fileName.match(/\.([a-z]{2,3}(-[A-Z]{2})?)\.srt$/);
                        return match ? match[1] : 'unknown';
                    });
                    video.subtitleLanguages = subtitleLanguages.filter(lang => lang !== 'unknown');
                }
                // Generate a public URL for the video file
                if (downloadResult.outputPath) {
                    video.fileUrl = await ytdlp_service_1.ytdlpService.generateVideoUrl(video);
                }
                // Save metadata path
                if (downloadResult.metadataPath) {
                    video.metadataPath = downloadResult.metadataPath;
                }
                await video.save();
                // Remove from active jobs
                this.activeJobs.delete(jobId);
                // Emit job completed event
                this.emit(DownloadQueueService.EVENTS.JOB_COMPLETED, job, downloadResult);
                (0, logger_1.logInfo)(`Download completed for video ${video.youtubeId} (${job._id})`);
            }
            else {
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
                    (0, logger_1.logInfo)(`Scheduling retry ${job.retryCount}/${job.maxRetries} for job ${job._id} in ${retryDelay}ms`);
                    // Wait before processing again
                    await (0, promises_1.setTimeout)(retryDelay);
                    // Remove from active jobs to allow retry
                    this.activeJobs.delete(jobId);
                }
                else {
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
                    (0, logger_1.logError)(`Download failed for video ${video.youtubeId} (${job._id}): ${errorMessage}`);
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error processing job ${jobId}:`, error);
            try {
                // Update job status
                job.status = 'failed';
                job.completedAt = new Date();
                job.errorMessage = error.message || 'Unknown error';
                await job.save();
                // Update video status if possible
                try {
                    const video = await video_model_1.Video.findById(job.videoId);
                    if (video) {
                        video.archiveStatus = 'failed';
                        video.errorMessage = error.message || 'Unknown error';
                        await video.save();
                    }
                }
                catch (videoError) {
                    (0, logger_1.logError)(`Error updating video status for job ${jobId}:`, videoError);
                }
                // Remove from active jobs
                this.activeJobs.delete(jobId);
                // Emit job failed event
                this.emit(DownloadQueueService.EVENTS.JOB_FAILED, job, error);
            }
            catch (updateError) {
                (0, logger_1.logError)(`Error updating job ${jobId} status:`, updateError);
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
    async addJob(videoId, userId, options = {}) {
        try {
            // Verify video exists
            const video = await video_model_1.Video.findById(videoId);
            if (!video) {
                throw new Error(`Video not found: ${videoId}`);
            }
            // Verify user exists
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }
            // Check if job already exists for this video
            const existingJob = await download_job_model_1.DownloadJob.findOne({
                videoId,
                status: { $in: ['queued', 'processing', 'paused'] },
            });
            if (existingJob) {
                (0, logger_1.logInfo)(`Job already exists for video ${videoId}: ${existingJob._id}`);
                return existingJob;
            }
            // Create new job
            const job = new download_job_model_1.DownloadJob({
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
            (0, logger_1.logInfo)(`Added download job ${job._id} for video ${videoId} with priority ${job.priority}`);
            // Process queue immediately if running
            if (this.isRunning && !this.isPaused) {
                this.processQueue();
            }
            return job;
        }
        catch (error) {
            (0, logger_1.logError)('Error adding download job:', error);
            throw error;
        }
    }
    /**
     * Pause a download job
     * @param jobId ID of the job to pause
     * @returns True if paused successfully, false otherwise
     */
    async pauseJob(jobId) {
        try {
            const job = await download_job_model_1.DownloadJob.findById(jobId);
            if (!job) {
                (0, logger_1.logError)(`Job not found: ${jobId}`);
                return false;
            }
            // Only queued or processing jobs can be paused
            if (job.status !== 'queued' && job.status !== 'processing') {
                (0, logger_1.logError)(`Cannot pause job ${jobId} with status ${job.status}`);
                return false;
            }
            // If the job is processing, we need to stop the download
            if (job.status === 'processing') {
                // Get the video
                const video = await video_model_1.Video.findById(job.videoId);
                if (!video) {
                    (0, logger_1.logError)(`Video not found for job ${jobId}: ${job.videoId}`);
                    return false;
                }
                // Create YouTube URL
                const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
                // Cancel the download
                const canceled = ytdlp_service_1.ytdlpService.cancelDownload(youtubeUrl);
                if (!canceled) {
                    (0, logger_1.logError)(`Failed to cancel download for job ${jobId}`);
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
            (0, logger_1.logInfo)(`Paused job ${jobId}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`Error pausing job ${jobId}:`, error);
            return false;
        }
    }
    /**
     * Resume a paused download job
     * @param jobId ID of the job to resume
     * @returns True if resumed successfully, false otherwise
     */
    async resumeJob(jobId) {
        try {
            const job = await download_job_model_1.DownloadJob.findById(jobId);
            if (!job) {
                (0, logger_1.logError)(`Job not found: ${jobId}`);
                return false;
            }
            // Only paused jobs can be resumed
            if (job.status !== 'paused') {
                (0, logger_1.logError)(`Cannot resume job ${jobId} with status ${job.status}`);
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
            (0, logger_1.logInfo)(`Resumed job ${jobId}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`Error resuming job ${jobId}:`, error);
            return false;
        }
    }
    /**
     * Cancel a download job
     * @param jobId ID of the job to cancel
     * @returns True if canceled successfully, false otherwise
     */
    async cancelJob(jobId) {
        try {
            const job = await download_job_model_1.DownloadJob.findById(jobId);
            if (!job) {
                (0, logger_1.logError)(`Job not found: ${jobId}`);
                return false;
            }
            // Only queued, processing, or paused jobs can be canceled
            if (job.status !== 'queued' && job.status !== 'processing' && job.status !== 'paused') {
                (0, logger_1.logError)(`Cannot cancel job ${jobId} with status ${job.status}`);
                return false;
            }
            // If the job is processing, we need to stop the download
            if (job.status === 'processing') {
                // Get the video
                const video = await video_model_1.Video.findById(job.videoId);
                if (!video) {
                    (0, logger_1.logError)(`Video not found for job ${jobId}: ${job.videoId}`);
                    return false;
                }
                // Create YouTube URL
                const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
                // Cancel the download
                const canceled = ytdlp_service_1.ytdlpService.cancelDownload(youtubeUrl);
                if (!canceled) {
                    (0, logger_1.logError)(`Failed to cancel download for job ${jobId}`);
                    return false;
                }
            }
            // Update job status
            job.status = 'canceled';
            job.completedAt = new Date();
            await job.save();
            // Update video status if needed
            const video = await video_model_1.Video.findById(job.videoId);
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
            (0, logger_1.logInfo)(`Canceled job ${jobId}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`Error canceling job ${jobId}:`, error);
            return false;
        }
    }
    /**
     * Retry a failed download job
     * @param jobId ID of the job to retry
     * @returns True if retry was initiated successfully, false otherwise
     */
    async retryJob(jobId) {
        try {
            const job = await download_job_model_1.DownloadJob.findById(jobId);
            if (!job) {
                (0, logger_1.logError)(`Job not found: ${jobId}`);
                return false;
            }
            // Only failed jobs can be retried
            if (job.status !== 'failed') {
                (0, logger_1.logError)(`Cannot retry job ${jobId} with status ${job.status}`);
                return false;
            }
            // Update job status
            job.status = 'queued';
            job.progress = 0;
            job.errorMessage = undefined;
            await job.save();
            // Update video status
            const video = await video_model_1.Video.findById(job.videoId);
            if (video) {
                video.archiveStatus = 'pending';
                video.errorMessage = undefined;
                await video.save();
            }
            // Process queue immediately if running
            if (this.isRunning && !this.isPaused) {
                this.processQueue();
            }
            (0, logger_1.logInfo)(`Retrying job ${jobId}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`Error retrying job ${jobId}:`, error);
            return false;
        }
    }
    /**
     * Update the priority of a download job
     * @param jobId ID of the job to update
     * @param priority New priority level
     * @returns True if priority was updated successfully, false otherwise
     */
    async updateJobPriority(jobId, priority) {
        try {
            const job = await download_job_model_1.DownloadJob.findById(jobId);
            if (!job) {
                (0, logger_1.logError)(`Job not found: ${jobId}`);
                return false;
            }
            // Only queued or paused jobs can have their priority updated
            if (job.status !== 'queued' && job.status !== 'paused') {
                (0, logger_1.logError)(`Cannot update priority for job ${jobId} with status ${job.status}`);
                return false;
            }
            // Update priority
            job.priority = priority;
            await job.save();
            (0, logger_1.logInfo)(`Updated priority for job ${jobId} to ${priority}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`Error updating priority for job ${jobId}:`, error);
            return false;
        }
    }
    /**
     * Get stats about the download queue
     * @returns Statistics about the queue
     */
    async getQueueStats() {
        try {
            // Get counts for each status
            const [queuedCount, processingCount, completedCount, failedCount, pausedCount, canceledCount, totalCount] = await Promise.all([
                download_job_model_1.DownloadJob.countDocuments({ status: 'queued' }),
                download_job_model_1.DownloadJob.countDocuments({ status: 'processing' }),
                download_job_model_1.DownloadJob.countDocuments({ status: 'completed' }),
                download_job_model_1.DownloadJob.countDocuments({ status: 'failed' }),
                download_job_model_1.DownloadJob.countDocuments({ status: 'paused' }),
                download_job_model_1.DownloadJob.countDocuments({ status: 'canceled' }),
                download_job_model_1.DownloadJob.countDocuments({}),
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
        }
        catch (error) {
            (0, logger_1.logError)('Error getting queue stats:', error);
            throw error;
        }
    }
    /**
     * Clean up old jobs based on configuration
     */
    async cleanupOldJobs() {
        try {
            // Calculate cutoff dates
            const completedCutoff = new Date();
            completedCutoff.setDate(completedCutoff.getDate() - this.config.cleanupCompletedJobsAfterDays);
            const failedCutoff = new Date();
            failedCutoff.setDate(failedCutoff.getDate() - this.config.cleanupFailedJobsAfterDays);
            // Delete completed jobs older than cutoff
            const completedResult = await download_job_model_1.DownloadJob.deleteMany({
                status: 'completed',
                completedAt: { $lt: completedCutoff },
            });
            // Delete failed/canceled jobs older than cutoff
            const failedResult = await download_job_model_1.DownloadJob.deleteMany({
                status: { $in: ['failed', 'canceled'] },
                completedAt: { $lt: failedCutoff },
            });
            (0, logger_1.logInfo)(`Cleaned up ${completedResult.deletedCount} completed jobs and ${failedResult.deletedCount} failed/canceled jobs`);
        }
        catch (error) {
            (0, logger_1.logError)('Error cleaning up old jobs:', error);
            this.emit(DownloadQueueService.EVENTS.ERROR, error);
        }
    }
    /**
     * Get the current configuration
     * @returns A copy of the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update the configuration
     * @param config New configuration values
     */
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config,
        };
        (0, logger_1.logInfo)('Updated download queue configuration');
    }
}
exports.DownloadQueueService = DownloadQueueService;
// Create singleton instance
exports.downloadQueueService = new DownloadQueueService();
//# sourceMappingURL=download-queue.service.js.map