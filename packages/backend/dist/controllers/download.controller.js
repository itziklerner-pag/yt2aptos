"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadController = exports.DownloadController = void 0;
const download_job_model_1 = require("../models/download-job.model");
const video_model_1 = require("../models/video.model");
const ytdlp_service_1 = require("../services/ytdlp.service");
const download_queue_service_1 = require("../services/download-queue.service");
const post_processing_service_1 = require("../services/post-processing.service");
/**
 * Controller for download-related operations
 */
class DownloadController {
    /**
     * Get all download jobs for the current user
     */
    async getUserJobs(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const jobs = await download_job_model_1.DownloadJob.find({ userId })
                .sort({ createdAt: -1 })
                .populate('videoId', 'title youtubeId thumbnailUrl')
                .exec();
            res.json(jobs);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get a specific download job
     */
    async getJob(req, res, next) {
        try {
            const jobId = req.params.id;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const job = await download_job_model_1.DownloadJob.findOne({
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a new download job
     */
    async createJob(req, res, next) {
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
            const video = await video_model_1.Video.findById(videoId);
            if (!video) {
                res.status(404).json({ error: 'Video not found' });
                return;
            }
            // Check if job already exists for this video and user
            const existingJob = await download_job_model_1.DownloadJob.findOne({
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
            const job = await download_queue_service_1.downloadQueueService.addJob(videoId, userId, {
                priority: priority !== undefined ? priority : download_queue_service_1.JobPriority.NORMAL,
                profileName,
                ytdlpOptions: options
            });
            // Return created job
            res.status(201).json(job);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Pause a download job
     */
    async pauseJob(req, res, next) {
        try {
            const jobId = req.params.id;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Check that job exists and belongs to user
            const job = await download_job_model_1.DownloadJob.findOne({
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
            const paused = await download_queue_service_1.downloadQueueService.pauseJob(jobId);
            if (paused) {
                res.json({ success: true, status: 'paused' });
            }
            else {
                res.status(500).json({ error: 'Failed to pause job' });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Resume a paused download job
     */
    async resumeJob(req, res, next) {
        try {
            const jobId = req.params.id;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Check that job exists and belongs to user
            const job = await download_job_model_1.DownloadJob.findOne({
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
            const resumed = await download_queue_service_1.downloadQueueService.resumeJob(jobId);
            if (resumed) {
                res.json({ success: true, status: 'queued' });
            }
            else {
                res.status(500).json({ error: 'Failed to resume job' });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Cancel a download job
     */
    async cancelJob(req, res, next) {
        try {
            const jobId = req.params.id;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Check that job exists and belongs to user
            const job = await download_job_model_1.DownloadJob.findOne({
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
            const canceled = await download_queue_service_1.downloadQueueService.cancelJob(jobId);
            if (canceled) {
                res.json({ success: true, status: 'canceled' });
            }
            else {
                res.status(500).json({ error: 'Failed to cancel job' });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retry a failed download job
     */
    async retryJob(req, res, next) {
        try {
            const jobId = req.params.id;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Check that job exists and belongs to user
            const job = await download_job_model_1.DownloadJob.findOne({
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
            const retried = await download_queue_service_1.downloadQueueService.retryJob(jobId);
            if (retried) {
                res.json({ success: true, status: 'queued' });
            }
            else {
                res.status(500).json({ error: 'Failed to retry job' });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a job's priority
     */
    async updateJobPriority(req, res, next) {
        try {
            const jobId = req.params.id;
            const userId = req.user?.userId;
            const { priority } = req.body;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            if (priority === undefined ||
                !Object.values(download_queue_service_1.JobPriority).includes(priority)) {
                res.status(400).json({ error: 'Valid priority value is required' });
                return;
            }
            // Check that job exists and belongs to user
            const job = await download_job_model_1.DownloadJob.findOne({
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
            const updated = await download_queue_service_1.downloadQueueService.updateJobPriority(jobId, priority);
            if (updated) {
                res.json({ success: true, priority });
            }
            else {
                res.status(500).json({ error: 'Failed to update job priority' });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get download queue stats
     */
    async getQueueStats(req, res, next) {
        try {
            const stats = await download_queue_service_1.downloadQueueService.getQueueStats();
            res.json(stats);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get active downloads
     */
    async getActiveDownloads(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Get all processing jobs
            const activeJobs = await download_job_model_1.DownloadJob.find({
                status: 'processing'
            })
                .populate('videoId', 'title youtubeId thumbnailUrl')
                .sort({ priority: -1, createdAt: 1 })
                .exec();
            // Get download progress from ytdlp service
            const activeDownloads = ytdlp_service_1.ytdlpService.getActiveDownloads();
            // Combine data
            const result = activeJobs.map(job => {
                const jobId = job._id.toString();
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get available quality profiles
     */
    async getQualityProfiles(req, res, next) {
        try {
            const profiles = ytdlp_service_1.ytdlpService.getConfig().qualityProfiles;
            res.json(profiles);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get available formats for a YouTube URL
     */
    async getAvailableFormats(req, res, next) {
        try {
            const { url } = req.query;
            if (!url || typeof url !== 'string') {
                res.status(400).json({ error: 'YouTube URL is required' });
                return;
            }
            // Get formats
            const formats = await ytdlp_service_1.ytdlpService.getAvailableFormats(url);
            res.json(formats);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get video info without downloading
     */
    async getVideoInfo(req, res, next) {
        try {
            const { url } = req.query;
            if (!url || typeof url !== 'string') {
                res.status(400).json({ error: 'YouTube URL is required' });
                return;
            }
            // Get video info
            const info = await ytdlp_service_1.ytdlpService.getVideoInfo(url);
            res.json(info);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Process a downloaded file
     */
    async processFile(req, res, next) {
        try {
            const { jobId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Find the job
            const job = await download_job_model_1.DownloadJob.findOne({
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
            const result = await post_processing_service_1.postProcessingService.processDownloadedFile(job.outputPath, job, job.metadata || {}, options);
            if (result.success) {
                res.json(result);
            }
            else {
                res.status(500).json({
                    error: result.errorMessage || 'Failed to process file'
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DownloadController = DownloadController;
// Create singleton instance
exports.downloadController = new DownloadController();
//# sourceMappingURL=download.controller.js.map