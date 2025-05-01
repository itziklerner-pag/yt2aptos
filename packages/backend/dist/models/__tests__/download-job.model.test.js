"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const download_job_model_1 = require("../download-job.model");
const video_model_1 = require("../video.model");
const channel_model_1 = require("../channel.model");
const user_model_1 = require("../user.model");
// Use in-memory MongoDB instance setup in setup.ts
describe('DownloadJob Model', () => {
    // Reference to test user, channel, and video IDs
    let testUserId;
    let testChannelId;
    let testVideoId;
    // Valid status values
    const validStatuses = [
        'queued',
        'processing',
        'completed',
        'failed',
        'paused',
        'canceled'
    ];
    // Setup test dependencies before running tests
    beforeAll(async () => {
        // Create a test user
        const user = new user_model_1.UserModel({
            username: 'jobtester',
            email: 'job@example.com',
            password: 'password123',
        });
        const savedUser = await user.save();
        testUserId = savedUser._id;
        // Create a test channel
        const channel = new channel_model_1.Channel({
            youtubeId: 'UC_job_test',
            name: 'Job Test Channel',
            createdBy: testUserId,
        });
        const savedChannel = await channel.save();
        testChannelId = savedChannel._id;
        // Create a test video
        const video = new video_model_1.Video({
            youtubeId: 'v_job_test',
            title: 'Job Test Video',
            channelId: testChannelId,
        });
        const savedVideo = await video.save();
        testVideoId = savedVideo._id;
    });
    // Clean up after tests
    afterAll(async () => {
        await download_job_model_1.DownloadJob.deleteMany({});
        await video_model_1.Video.deleteMany({});
        await channel_model_1.Channel.deleteMany({});
        await user_model_1.UserModel.deleteMany({});
    });
    it('should create a download job with minimal required fields', async () => {
        // Create minimal job with only required fields
        const job = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
        });
        const savedJob = await job.save();
        // Check required fields
        expect(savedJob._id).toBeDefined();
        expect(savedJob.videoId.toString()).toBe(testVideoId.toString());
        expect(savedJob.userId.toString()).toBe(testUserId.toString());
        // Check default values
        expect(savedJob.status).toBe('queued');
        expect(savedJob.priority).toBe(0);
        expect(savedJob.progress).toBe(0);
        expect(savedJob.retryCount).toBe(0);
        expect(savedJob.maxRetries).toBe(3);
        expect(savedJob.createdAt).toBeDefined();
        expect(savedJob.updatedAt).toBeDefined();
    });
    it('should create a download job with all fields', async () => {
        const ytdlpOptions = {
            format: 'bestvideo+bestaudio/best',
            writeSubtitles: true,
            subtitlesLanguages: ['en'],
        };
        const metadata = {
            requestedBy: 'test-user',
            estimatedSize: '250MB',
            downloadSpeed: '5.2MB/s',
        };
        const startedAt = new Date();
        const completedAt = new Date(startedAt.getTime() + 30000); // 30 seconds later
        const job = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
            status: 'completed',
            priority: 5,
            progress: 100,
            startedAt,
            completedAt,
            retryCount: 1,
            maxRetries: 5,
            ytdlpOptions,
            outputPath: '/videos/test-video.mp4',
            metadata,
        });
        const savedJob = await job.save();
        // Check all fields
        expect(savedJob.videoId.toString()).toBe(testVideoId.toString());
        expect(savedJob.userId.toString()).toBe(testUserId.toString());
        expect(savedJob.status).toBe('completed');
        expect(savedJob.priority).toBe(5);
        expect(savedJob.progress).toBe(100);
        expect(savedJob.startedAt?.toISOString()).toBe(startedAt.toISOString());
        expect(savedJob.completedAt?.toISOString()).toBe(completedAt.toISOString());
        expect(savedJob.retryCount).toBe(1);
        expect(savedJob.maxRetries).toBe(5);
        expect(savedJob.ytdlpOptions).toEqual(ytdlpOptions);
        expect(savedJob.outputPath).toBe('/videos/test-video.mp4');
        expect(savedJob.metadata).toEqual(metadata);
    });
    it('should require videoId and userId fields', async () => {
        // Test without videoId
        const jobWithoutVideoId = new download_job_model_1.DownloadJob({
            userId: testUserId,
        });
        // Test without userId
        const jobWithoutUserId = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
        });
        // Validate each case
        await expect(jobWithoutVideoId.validate()).rejects.toThrow();
        await expect(jobWithoutUserId.validate()).rejects.toThrow();
    });
    it('should only allow valid enum values for status', async () => {
        // Test each valid status
        for (const status of validStatuses) {
            const job = new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status,
            });
            const savedJob = await job.save();
            expect(savedJob.status).toBe(status);
        }
        // Test invalid status
        const jobWithInvalidStatus = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
            status: 'invalid', // Intentionally testing an invalid value
        });
        await expect(jobWithInvalidStatus.validate()).rejects.toThrow();
    });
    it('should validate progress is between 0 and 100', async () => {
        // Test with valid progress values
        const validProgressValues = [0, 50, 100];
        for (const progress of validProgressValues) {
            const job = new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                progress,
            });
            const savedJob = await job.save();
            expect(savedJob.progress).toBe(progress);
        }
        // Test with invalid progress values
        const invalidProgressValues = [-1, 101, 150];
        for (const progress of invalidProgressValues) {
            const job = new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                progress,
            });
            await expect(job.validate()).rejects.toThrow();
        }
    });
    it('should track job lifecycle through status updates', async () => {
        // Create initial job with queued status
        const job = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
        });
        let savedJob = await job.save();
        expect(savedJob.status).toBe('queued');
        // Update to processing status
        savedJob.status = 'processing';
        savedJob.startedAt = new Date();
        savedJob.progress = 10;
        const processingJob = await savedJob.save();
        expect(processingJob.status).toBe('processing');
        expect(processingJob.startedAt).toBeDefined();
        expect(processingJob.progress).toBe(10);
        // Update progress
        processingJob.progress = 50;
        const progressJob = await processingJob.save();
        expect(progressJob.progress).toBe(50);
        // Complete the job
        progressJob.status = 'completed';
        progressJob.progress = 100;
        progressJob.completedAt = new Date();
        const completedJob = await progressJob.save();
        expect(completedJob.status).toBe('completed');
        expect(completedJob.progress).toBe(100);
        expect(completedJob.completedAt).toBeDefined();
    });
    it('should track failed jobs with error messages', async () => {
        // Create initial job
        const job = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
        });
        let savedJob = await job.save();
        // Update to failed status
        savedJob.status = 'failed';
        savedJob.errorMessage = 'Network connection error';
        savedJob.retryCount = 1;
        const failedJob = await savedJob.save();
        expect(failedJob.status).toBe('failed');
        expect(failedJob.errorMessage).toBe('Network connection error');
        expect(failedJob.retryCount).toBe(1);
    });
    it('should handle job retry logic', async () => {
        // Create initial job that has failed
        const job = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
            status: 'failed',
            retryCount: 2,
            maxRetries: 3,
            errorMessage: 'Temporary failure',
        });
        let savedJob = await job.save();
        // Check if we can retry
        const canRetry = savedJob.retryCount < savedJob.maxRetries;
        expect(canRetry).toBe(true);
        // Retry the job
        if (canRetry) {
            savedJob.status = 'queued';
            savedJob.retryCount += 1;
            savedJob.errorMessage = undefined;
            savedJob.progress = 0;
        }
        const retriedJob = await savedJob.save();
        expect(retriedJob.status).toBe('queued');
        expect(retriedJob.retryCount).toBe(3);
        expect(retriedJob.errorMessage).toBeUndefined();
        // Now we've reached max retries
        const canRetryAgain = retriedJob.retryCount < retriedJob.maxRetries;
        expect(canRetryAgain).toBe(false);
    });
    it('should handle pausing and canceling jobs', async () => {
        // Create a processing job
        const job = new download_job_model_1.DownloadJob({
            videoId: testVideoId,
            userId: testUserId,
            status: 'processing',
            progress: 45,
            startedAt: new Date(),
        });
        let savedJob = await job.save();
        // Pause the job
        savedJob.status = 'paused';
        const pausedJob = await savedJob.save();
        expect(pausedJob.status).toBe('paused');
        expect(pausedJob.progress).toBe(45); // Progress should be preserved
        // Resume the job
        pausedJob.status = 'processing';
        const resumedJob = await pausedJob.save();
        expect(resumedJob.status).toBe('processing');
        // Cancel the job
        resumedJob.status = 'canceled';
        const canceledJob = await resumedJob.save();
        expect(canceledJob.status).toBe('canceled');
    });
    it('should query jobs by status and priority', async () => {
        // Create test jobs with different status and priority
        await Promise.all([
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'queued',
                priority: 1,
            }).save(),
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'queued',
                priority: 5,
            }).save(),
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'processing',
                priority: 3,
            }).save(),
        ]);
        // Query queued jobs by priority (highest first)
        const queuedJobs = await download_job_model_1.DownloadJob.find({ status: 'queued' })
            .sort({ priority: -1 });
        expect(queuedJobs.length).toBe(2);
        // First job should have higher priority
        expect(queuedJobs[0].priority).toBe(5);
        expect(queuedJobs[1].priority).toBe(1);
        // Query processing jobs
        const processingJobs = await download_job_model_1.DownloadJob.find({ status: 'processing' });
        expect(processingJobs.length).toBe(1);
        expect(processingJobs[0].priority).toBe(3);
    });
    it('should find jobs by user ID', async () => {
        // Create another user
        const anotherUser = new user_model_1.UserModel({
            username: 'anotherjobuser',
            email: 'anotherjob@example.com',
            password: 'password123',
        });
        const savedAnotherUser = await anotherUser.save();
        // Create jobs for different users
        await Promise.all([
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'completed',
            }).save(),
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: savedAnotherUser._id,
                status: 'queued',
            }).save(),
        ]);
        // Query jobs by test user
        const userJobs = await download_job_model_1.DownloadJob.find({ userId: testUserId });
        // Should find jobs for the test user
        expect(userJobs.length).toBeGreaterThan(0);
        expect(userJobs.every(job => job.userId.toString() === testUserId.toString())).toBe(true);
        // Query jobs by other user
        const otherUserJobs = await download_job_model_1.DownloadJob.find({ userId: savedAnotherUser._id });
        expect(otherUserJobs.length).toBe(1);
    });
    it('should find jobs by video ID', async () => {
        // Create another video
        const anotherVideo = new video_model_1.Video({
            youtubeId: 'v_another_job_test',
            title: 'Another Job Test Video',
            channelId: testChannelId,
        });
        const savedAnotherVideo = await anotherVideo.save();
        // Create jobs for different videos
        await Promise.all([
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'completed',
            }).save(),
            new download_job_model_1.DownloadJob({
                videoId: savedAnotherVideo._id,
                userId: testUserId,
                status: 'queued',
            }).save(),
        ]);
        // Query jobs by test video
        const videoJobs = await download_job_model_1.DownloadJob.find({ videoId: testVideoId });
        // Should find jobs for the test video
        expect(videoJobs.length).toBeGreaterThan(0);
        expect(videoJobs.every(job => job.videoId.toString() === testVideoId.toString())).toBe(true);
        // Query jobs by other video
        const otherVideoJobs = await download_job_model_1.DownloadJob.find({ videoId: savedAnotherVideo._id });
        expect(otherVideoJobs.length).toBe(1);
    });
    it('should support searching with various criteria combinations', async () => {
        // Create jobs with different combinations of properties
        await Promise.all([
            // Job 1: High priority, queued
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'queued',
                priority: 10,
                progress: 0,
            }).save(),
            // Job 2: Medium priority, completed recently
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'completed',
                priority: 5,
                progress: 100,
                completedAt: new Date(),
            }).save(),
            // Job 3: Low priority, failed
            new download_job_model_1.DownloadJob({
                videoId: testVideoId,
                userId: testUserId,
                status: 'failed',
                priority: 1,
                progress: 30,
                errorMessage: 'Failed to download',
            }).save(),
        ]);
        // Find active jobs (queued or processing)
        const activeJobs = await download_job_model_1.DownloadJob.find({
            status: { $in: ['queued', 'processing'] },
        });
        expect(activeJobs.length).toBeGreaterThan(0);
        expect(activeJobs.every(job => ['queued', 'processing'].includes(job.status))).toBe(true);
        // Find completed jobs with 100% progress
        const completedJobs = await download_job_model_1.DownloadJob.find({
            status: 'completed',
            progress: 100,
        });
        expect(completedJobs.length).toBeGreaterThan(0);
        expect(completedJobs.every(job => job.status === 'completed' && job.progress === 100)).toBe(true);
        // Find failed jobs with error messages
        const failedJobs = await download_job_model_1.DownloadJob.find({
            status: 'failed',
            errorMessage: { $exists: true, $ne: '' },
        });
        expect(failedJobs.length).toBeGreaterThan(0);
        expect(failedJobs.every(job => job.status === 'failed' &&
            job.errorMessage !== undefined &&
            job.errorMessage !== '')).toBe(true);
    });
});
//# sourceMappingURL=download-job.model.test.js.map