"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const download_controller_1 = require("../download.controller");
const download_job_model_1 = require("../../models/download-job.model");
const video_model_1 = require("../../models/video.model");
const ytdlp_service_1 = require("../../services/ytdlp.service");
const download_queue_service_1 = require("../../services/download-queue.service");
// Mocking dependencies
jest.mock('../../models/download-job.model');
jest.mock('../../models/video.model');
jest.mock('../../services/ytdlp.service');
jest.mock('../../services/download-queue.service');
jest.mock('../../services/post-processing.service');
jest.mock('../../utils/logger');
describe('DownloadController', () => {
    // Create a new instance of the controller
    const downloadController = new download_controller_1.DownloadController();
    // Setup mock request and response
    let mockRequest;
    let mockResponse;
    let mockNext;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        // Reset mocks between tests
        jest.clearAllMocks();
        // Setup response mock with status and json methods
        responseJson = jest.fn().mockReturnThis();
        responseStatus = jest.fn().mockReturnValue({ json: responseJson });
        mockResponse = {
            status: responseStatus,
            json: responseJson,
        };
        // Setup default request mock
        mockRequest = {
            params: {},
            query: {},
            body: {},
            user: { userId: 'test-user-id' }
        };
        // Setup next function
        mockNext = jest.fn();
    });
    describe('getUserJobs', () => {
        it('should return all user jobs', async () => {
            // Setup
            const mockJobs = [
                { _id: 'job-1', status: 'completed' },
                { _id: 'job-2', status: 'processing' }
            ];
            const findMock = jest.fn().mockReturnThis();
            const sortMock = jest.fn().mockReturnThis();
            const populateMock = jest.fn().mockReturnThis();
            const execMock = jest.fn().mockResolvedValue(mockJobs);
            download_job_model_1.DownloadJob.find.mockImplementation(() => ({
                sort: sortMock,
                populate: populateMock,
                exec: execMock
            }));
            // Execute
            await downloadController.getUserJobs(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_job_model_1.DownloadJob.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(populateMock).toHaveBeenCalledWith('videoId', 'title youtubeId thumbnailUrl');
            expect(execMock).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockJobs);
        });
        it('should handle unauthorized requests', async () => {
            // Setup - no user
            mockRequest.user = undefined;
            // Execute
            await downloadController.getUserJobs(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_job_model_1.DownloadJob.find).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should handle errors with next()', async () => {
            // Setup
            const mockError = new Error('Database error');
            download_job_model_1.DownloadJob.find.mockImplementation(() => {
                throw mockError;
            });
            // Execute
            await downloadController.getUserJobs(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
    describe('getJob', () => {
        it('should return job details for valid ID', async () => {
            // Setup
            const mockJob = {
                _id: 'job-1',
                videoId: {
                    title: 'Test Video',
                    youtubeId: 'vid123',
                    thumbnailUrl: 'http://example.com/thumb.jpg',
                    duration: 120,
                    publishedAt: '2023-01-01T00:00:00Z'
                },
                status: 'completed',
                progress: 100
            };
            const findOneMock = jest.fn().mockReturnThis();
            const populateMock = jest.fn().mockReturnThis();
            const execMock = jest.fn().mockResolvedValue(mockJob);
            download_job_model_1.DownloadJob.findOne.mockImplementation(() => ({
                populate: populateMock,
                exec: execMock
            }));
            mockRequest.params = { id: 'job-1' };
            // Execute
            await downloadController.getJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_job_model_1.DownloadJob.findOne).toHaveBeenCalledWith({
                _id: 'job-1',
                userId: 'test-user-id'
            });
            expect(populateMock).toHaveBeenCalledWith('videoId', 'title youtubeId thumbnailUrl duration publishedAt');
            expect(execMock).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockJob);
        });
        it('should handle unauthorized requests', async () => {
            // Setup - no user
            mockRequest.user = undefined;
            mockRequest.params = { id: 'job-1' };
            // Execute
            await downloadController.getJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_job_model_1.DownloadJob.findOne).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should handle job not found', async () => {
            // Setup
            const findOneMock = jest.fn().mockReturnThis();
            const populateMock = jest.fn().mockReturnThis();
            const execMock = jest.fn().mockResolvedValue(null);
            download_job_model_1.DownloadJob.findOne.mockImplementation(() => ({
                populate: populateMock,
                exec: execMock
            }));
            mockRequest.params = { id: 'nonexistent-job' };
            // Execute
            await downloadController.getJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Job not found' });
        });
        it('should handle errors with next()', async () => {
            // Setup
            const mockError = new Error('Database error');
            download_job_model_1.DownloadJob.findOne.mockImplementation(() => {
                throw mockError;
            });
            mockRequest.params = { id: 'job-1' };
            // Execute
            await downloadController.getJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
    describe('createJob', () => {
        it('should create a download job successfully', async () => {
            // Setup
            const videoId = 'video-123';
            const userId = 'test-user-id';
            const newJob = {
                _id: 'new-job-id',
                videoId,
                userId,
                status: 'queued',
                priority: download_queue_service_1.JobPriority.NORMAL
            };
            // Mock Video.findById to return a video
            video_model_1.Video.findById.mockResolvedValue({
                _id: videoId,
                title: 'Test Video'
            });
            // Mock DownloadJob.findOne to return null (no existing job)
            download_job_model_1.DownloadJob.findOne.mockResolvedValue(null);
            // Mock downloadQueueService.addJob
            download_queue_service_1.downloadQueueService.addJob.mockResolvedValue(newJob);
            // Request body
            mockRequest.body = {
                videoId,
                priority: download_queue_service_1.JobPriority.HIGH,
                profileName: 'high-quality',
                options: { format: 'mp4' }
            };
            // Execute
            await downloadController.createJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(video_model_1.Video.findById).toHaveBeenCalledWith(videoId);
            expect(download_job_model_1.DownloadJob.findOne).toHaveBeenCalledWith({
                videoId,
                userId,
                status: { $in: ['queued', 'processing', 'paused'] }
            });
            expect(download_queue_service_1.downloadQueueService.addJob).toHaveBeenCalledWith(videoId, userId, {
                priority: download_queue_service_1.JobPriority.HIGH,
                profileName: 'high-quality',
                ytdlpOptions: { format: 'mp4' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(newJob);
        });
        it('should handle unauthorized requests', async () => {
            // Setup - no user
            mockRequest.user = undefined;
            mockRequest.body = { videoId: 'video-123' };
            // Execute
            await downloadController.createJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(video_model_1.Video.findById).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should handle missing video ID', async () => {
            // Setup - missing videoId
            mockRequest.body = { priority: download_queue_service_1.JobPriority.NORMAL };
            // Execute
            await downloadController.createJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(video_model_1.Video.findById).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Video ID is required' });
        });
        it('should handle video not found', async () => {
            // Setup
            video_model_1.Video.findById.mockResolvedValue(null);
            mockRequest.body = { videoId: 'nonexistent-video' };
            // Execute
            await downloadController.createJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Video not found' });
        });
        it('should handle existing job', async () => {
            // Setup
            const videoId = 'video-123';
            const existingJob = {
                _id: 'existing-job-id',
                videoId,
                status: 'queued'
            };
            // Mock Video.findById to return a video
            video_model_1.Video.findById.mockResolvedValue({
                _id: videoId,
                title: 'Test Video'
            });
            // Mock DownloadJob.findOne to return an existing job
            download_job_model_1.DownloadJob.findOne.mockResolvedValue(existingJob);
            // Request body
            mockRequest.body = { videoId };
            // Execute
            await downloadController.createJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_queue_service_1.downloadQueueService.addJob).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Download job already exists for this video',
                jobId: 'existing-job-id'
            });
        });
        it('should handle errors with next()', async () => {
            // Setup
            const mockError = new Error('Database error');
            video_model_1.Video.findById.mockImplementation(() => {
                throw mockError;
            });
            mockRequest.body = { videoId: 'video-123' };
            // Execute
            await downloadController.createJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
    describe('pauseJob', () => {
        it('should pause a job successfully', async () => {
            // Setup
            const jobId = 'job-123';
            const mockJob = {
                _id: jobId,
                userId: 'test-user-id',
                status: 'processing'
            };
            // Mock DownloadJob.findOne
            download_job_model_1.DownloadJob.findOne.mockResolvedValue(mockJob);
            // Mock downloadQueueService.pauseJob
            download_queue_service_1.downloadQueueService.pauseJob.mockResolvedValue(true);
            // Request params
            mockRequest.params = { id: jobId };
            // Execute
            await downloadController.pauseJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_job_model_1.DownloadJob.findOne).toHaveBeenCalledWith({
                _id: jobId,
                userId: 'test-user-id'
            });
            expect(download_queue_service_1.downloadQueueService.pauseJob).toHaveBeenCalledWith(jobId);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, status: 'paused' });
        });
        it('should handle unauthorized requests', async () => {
            // Setup - no user
            mockRequest.user = undefined;
            mockRequest.params = { id: 'job-123' };
            // Execute
            await downloadController.pauseJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_job_model_1.DownloadJob.findOne).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
        it('should handle job not found', async () => {
            // Setup
            download_job_model_1.DownloadJob.findOne.mockResolvedValue(null);
            mockRequest.params = { id: 'nonexistent-job' };
            // Execute
            await downloadController.pauseJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_queue_service_1.downloadQueueService.pauseJob).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Job not found' });
        });
        it('should handle invalid job status', async () => {
            // Setup
            const mockJob = {
                _id: 'job-123',
                userId: 'test-user-id',
                status: 'completed' // Can't pause a completed job
            };
            download_job_model_1.DownloadJob.findOne.mockResolvedValue(mockJob);
            mockRequest.params = { id: 'job-123' };
            // Execute
            await downloadController.pauseJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_queue_service_1.downloadQueueService.pauseJob).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Cannot pause job with status: completed'
            });
        });
        it('should handle pause operation failure', async () => {
            // Setup
            const mockJob = {
                _id: 'job-123',
                userId: 'test-user-id',
                status: 'processing'
            };
            download_job_model_1.DownloadJob.findOne.mockResolvedValue(mockJob);
            download_queue_service_1.downloadQueueService.pauseJob.mockResolvedValue(false);
            mockRequest.params = { id: 'job-123' };
            // Execute
            await downloadController.pauseJob(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to pause job' });
        });
    });
    // Additional controller method tests would follow the same pattern
    describe('getQueueStats', () => {
        it('should return queue stats', async () => {
            // Setup
            const mockStats = {
                queuedCount: 5,
                processingCount: 2,
                completedCount: 10,
                failedCount: 1,
                pausedCount: 0,
                canceledCount: 3,
                totalCount: 21,
                activeJobs: 2,
                isRunning: true,
                isPaused: false
            };
            download_queue_service_1.downloadQueueService.getQueueStats.mockResolvedValue(mockStats);
            // Execute
            await downloadController.getQueueStats(mockRequest, mockResponse, mockNext);
            // Assert
            expect(download_queue_service_1.downloadQueueService.getQueueStats).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockStats);
        });
        it('should handle errors with next()', async () => {
            // Setup
            const mockError = new Error('Service error');
            download_queue_service_1.downloadQueueService.getQueueStats.mockRejectedValue(mockError);
            // Execute
            await downloadController.getQueueStats(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
    describe('getQualityProfiles', () => {
        it('should return available quality profiles', async () => {
            // Setup
            const mockProfiles = {
                'high': {
                    name: 'high',
                    description: 'High quality',
                    format: 'mp4',
                    resolution: '1080p',
                    extractThumbnail: true,
                    extractSubtitles: true
                },
                'medium': {
                    name: 'medium',
                    description: 'Medium quality',
                    format: 'mp4',
                    resolution: '720p',
                    extractThumbnail: true,
                    extractSubtitles: false
                }
            };
            ytdlp_service_1.ytdlpService.getConfig.mockReturnValue({
                qualityProfiles: mockProfiles
            });
            // Execute
            await downloadController.getQualityProfiles(mockRequest, mockResponse, mockNext);
            // Assert
            expect(ytdlp_service_1.ytdlpService.getConfig).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockProfiles);
        });
        it('should handle errors with next()', async () => {
            // Setup
            const mockError = new Error('Service error');
            ytdlp_service_1.ytdlpService.getConfig.mockImplementation(() => {
                throw mockError;
            });
            // Execute
            await downloadController.getQualityProfiles(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
    describe('getVideoInfo', () => {
        it('should return video info for valid URL', async () => {
            // Setup
            const mockVideoInfo = {
                id: 'video123',
                title: 'Test Video',
                duration: 120,
                formats: ['mp4', 'webm']
            };
            ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue(mockVideoInfo);
            mockRequest.query = { url: 'https://youtube.com/watch?v=video123' };
            // Execute
            await downloadController.getVideoInfo(mockRequest, mockResponse, mockNext);
            // Assert
            expect(ytdlp_service_1.ytdlpService.getVideoInfo).toHaveBeenCalledWith('https://youtube.com/watch?v=video123');
            expect(mockResponse.json).toHaveBeenCalledWith(mockVideoInfo);
        });
        it('should handle missing URL', async () => {
            // Setup - missing url parameter
            mockRequest.query = {};
            // Execute
            await downloadController.getVideoInfo(mockRequest, mockResponse, mockNext);
            // Assert
            expect(ytdlp_service_1.ytdlpService.getVideoInfo).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ error: 'YouTube URL is required' });
        });
        it('should handle invalid URL type', async () => {
            // Setup - url is not a string
            mockRequest.query = { url: 123 };
            // Execute
            await downloadController.getVideoInfo(mockRequest, mockResponse, mockNext);
            // Assert
            expect(ytdlp_service_1.ytdlpService.getVideoInfo).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ error: 'YouTube URL is required' });
        });
        it('should handle errors with next()', async () => {
            // Setup
            const mockError = new Error('Service error');
            ytdlp_service_1.ytdlpService.getVideoInfo.mockRejectedValue(mockError);
            mockRequest.query = { url: 'https://youtube.com/watch?v=video123' };
            // Execute
            await downloadController.getVideoInfo(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});
//# sourceMappingURL=download.controller.test.js.map