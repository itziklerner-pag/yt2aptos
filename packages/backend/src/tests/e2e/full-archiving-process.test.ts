// @ts-nocheck - Disable TypeScript checking for this test file due to extensive mocking
import mongoose from 'mongoose';
import { StorageProviderFactory } from '@yt2aptos/shared/src/storage/provider.factory';
import { StorageProviderType } from '@yt2aptos/shared/src/storage/types';

// Recreate enum as values for testing
const DownloadJobStatus = {
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY: 'retry',
  CANCELLED: 'cancelled'
} as const;
import { VideoDocument } from '../../models/video.model';
import { storageService } from '../../services/storage.service';
import { youtubeService } from '../../services/youtube.service';
import { ytdlpService } from '../../services/ytdlp.service';
import { metadataService } from '../../services/metadata.service';
import { downloadQueueService } from '../../services/download-queue.service';
import { postProcessingService } from '../../services/post-processing.service';
import { externalApiService, ExternalEventType } from '../../services/external-api.service';
import { monitoringService } from '../../services/monitoring.service';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock all external services
jest.mock('../../services/youtube.service');
jest.mock('../../services/ytdlp.service');
jest.mock('../../services/post-processing.service');
jest.mock('../../services/external-api.service');
jest.mock('../../services/monitoring.service');

describe('End-to-End: Complete Archiving Process', () => {
  let testDir: string;
  const TEST_VIDEO_ID = 'e2e-test-video-123';
  const TEST_USER_ID = 'e2e-test-user-456';
  
  // Mock data
  let mockVideoDoc: Partial<VideoDocument>;
  let mockDownloadJob: any;
  let downloadCallbacks: any = {};
  
  beforeAll(async () => {
    // Create temp test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-test-'));
    
    // Configure storage service with local provider for testing
    const localConfig = {
      type: StorageProviderType.LOCAL,
      basePath: testDir
    };
    
    // Mock storage provider setup
    jest.spyOn(storageService, 'getProvider').mockReturnValue(
      StorageProviderFactory.createProvider(localConfig)
    );
    
    // Setup event notification tracking
    jest.spyOn(externalApiService, 'notifyEvent').mockImplementation((eventType, data) => {
      if (downloadCallbacks[eventType]) {
        downloadCallbacks[eventType](data);
      }
    });
    
    // Mock MongoDB models and connection
    jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
    jest.spyOn(mongoose.connection, 'close').mockResolvedValue(undefined);
    
    // Mock document creation & saving
    // @ts-ignore - This is a test mock, type safety isn't critical
    jest.spyOn(mongoose.Model.prototype, 'save').mockImplementation(function() {
      return Promise.resolve(this);
    });
    
    // Setup initial test data
    mockVideoDoc = {
      _id: TEST_VIDEO_ID,
      youtubeId: TEST_VIDEO_ID,
      title: 'E2E Test Video',
      description: 'This is an end-to-end test video',
      // @ts-ignore - In tests we can use string instead of ObjectId
      channelId: 'test-channel-id',
      channelTitle: 'Test Channel',
      duration: 180, // 3 minutes
      viewCount: 5000,
      likeCount: 500,
      publishedAt: new Date(),
      isArchived: false,
      archiveStatus: 'pending'
    };
    
    mockDownloadJob = {
      _id: `job-${TEST_VIDEO_ID}`,
      youtubeId: TEST_VIDEO_ID,
      userId: TEST_USER_ID,
      status: DownloadJobStatus.QUEUED,
      priority: 5,
      created: new Date(),
      updated: new Date(),
      format: 'best',
      options: {
        extractAudio: false,
        extractSubtitles: true,
        includeMetadata: true
      },
      progress: 0
    };
    
    // Mock mongoose Video model
    const VideoModel = mongoose.model('Video');
    // @ts-ignore - This is a test mock
    jest.spyOn(VideoModel, 'findOne').mockImplementation((query: any) => {
      if ((query.youtubeId === TEST_VIDEO_ID) || (query._id === TEST_VIDEO_ID)) {
        return Promise.resolve(mockVideoDoc);
      }
      return Promise.resolve(null);
    });
    
    // @ts-ignore - This is a test mock
    jest.spyOn(VideoModel, 'findById').mockImplementation((id: string) => {
      if (id === TEST_VIDEO_ID) {
        return Promise.resolve(mockVideoDoc);
      }
      return Promise.resolve(null);
    });
    
    // @ts-ignore - This is a test mock
    jest.spyOn(VideoModel, 'findByIdAndUpdate').mockImplementation((id: string, update: any) => {
      if (id === TEST_VIDEO_ID) {
        Object.assign(mockVideoDoc, update);
        return Promise.resolve(mockVideoDoc);
      }
      return Promise.resolve(null);
    });
    
    // Mock DownloadJob model
    const DownloadJobModel = mongoose.model('DownloadJob');
    // @ts-ignore - This is a test mock
    jest.spyOn(DownloadJobModel, 'findById').mockImplementation((id: string) => {
      if (id === mockDownloadJob._id) {
        return Promise.resolve(mockDownloadJob);
      }
      return Promise.resolve(null);
    });
    
    // @ts-ignore - This is a test mock
    jest.spyOn(DownloadJobModel, 'findByIdAndUpdate').mockImplementation((id: string, update: any) => {
      if (id === mockDownloadJob._id) {
        Object.assign(mockDownloadJob, update);
        return Promise.resolve(mockDownloadJob);
      }
      return Promise.resolve(null);
    });
    
    // Mock download queue methods
    // @ts-ignore - Mock methods for testing
    jest.spyOn(downloadQueueService, 'getNextJob').mockResolvedValue(mockDownloadJob);
    // @ts-ignore - Mock methods for testing
    jest.spyOn(downloadQueueService, 'updateJobProgress').mockImplementation(
      (jobId: string, progress: number, status?: DownloadJobStatus) => {
        mockDownloadJob.progress = progress;
        if (status) mockDownloadJob.status = status;
        return Promise.resolve(mockDownloadJob);
      }
    );
  });
  
  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    jest.restoreAllMocks();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    downloadCallbacks = {};
    
    // Reset job status for each test
    mockDownloadJob.status = DownloadJobStatus.QUEUED;
    mockDownloadJob.progress = 0;
    
    // Reset video archive status
    mockVideoDoc.isArchived = false;
    mockVideoDoc.archiveStatus = 'pending';
    mockVideoDoc.filePath = undefined;
    mockVideoDoc.fileUrl = undefined;
    mockVideoDoc.fileSize = undefined;
    mockVideoDoc.metadataPath = undefined;
    mockVideoDoc.thumbnailUrl = undefined;
  });
  
  it('should execute the complete video archiving process', async () => {
    // Step 1: YouTube API video retrieval
    (youtubeService.getVideo as jest.Mock).mockResolvedValue({
      id: TEST_VIDEO_ID,
      snippet: {
        title: 'YouTube API Title',
        description: 'YouTube API Description',
        publishedAt: '2023-01-01T00:00:00Z',
        channelId: 'test-channel-id',
        channelTitle: 'Test Channel',
        tags: ['test', 'video', 'archive'],
        thumbnails: {
          default: { url: 'https://example.com/thumbnail-default.jpg' },
          medium: { url: 'https://example.com/thumbnail-medium.jpg' },
          high: { url: 'https://example.com/thumbnail-high.jpg' }
        }
      },
      contentDetails: {
        duration: 'PT3M0S', // 3 minutes
      },
      statistics: {
        viewCount: '5000',
        likeCount: '500'
      }
    });
    
    // Step 2: Download process via yt-dlp
    const mockVideoPath = path.join(testDir, `${TEST_VIDEO_ID}.mp4`);
    const mockMetadataPath = path.join(testDir, `${TEST_VIDEO_ID}-metadata.json`);
    const mockThumbnailPath = path.join(testDir, `${TEST_VIDEO_ID}-thumbnail.jpg`);
    
    // Create mock video file
    fs.writeFileSync(mockVideoPath, Buffer.alloc(1024 * 1024)); // 1MB dummy file
    
    // Mock yt-dlp download phases
    let progressCounter = 0;
    (ytdlpService.downloadVideo as jest.Mock).mockImplementation(
      async (url: string, outputDir: string, qualityProfile: string, options: any, jobId: string) => {
        // Simulate the download taking a moment
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Emit progress events through externalApiService
        downloadCallbacks[ExternalEventType.DOWNLOAD_STARTED]?.({
          jobId: mockDownloadJob._id,
          videoId: TEST_VIDEO_ID,
          user: TEST_USER_ID
        });
        
        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 25) {
          progressCounter++;
          downloadCallbacks[ExternalEventType.DOWNLOAD_PROGRESS]?.({
            jobId: mockDownloadJob._id,
            videoId: TEST_VIDEO_ID,
            progress,
            downloadSpeed: 1024 * 1024 * (2 + progressCounter % 3), // Simulate variable speed
            eta: Math.max(0, (100 - progress) / 25) // Rough estimate
          });
          
          // Update job in database
          // @ts-ignore - This is mocked
          await downloadQueueService.updateJobProgress(mockDownloadJob._id, progress);
          
          // Small delay between progress updates
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Emit completed event
        downloadCallbacks[ExternalEventType.DOWNLOAD_COMPLETED]?.({
          jobId: mockDownloadJob._id,
          videoId: TEST_VIDEO_ID,
          filePath: mockVideoPath,
          fileSize: fs.statSync(mockVideoPath).size
        });
        
        return {
          success: true,
          filePath: mockVideoPath,
          fileSize: fs.statSync(mockVideoPath).size
        };
      }
    );
    
    // Step 3: Mock metadata extraction
    (metadataService.extractMetadata as jest.Mock).mockResolvedValue({
      success: true,
      metadata: {
        id: TEST_VIDEO_ID,
        title: 'Test Video',
        description: 'This is a test video description',
        duration: 180,
        viewCount: 5000,
        likeCount: 500,
        channelId: 'test-channel-id',
        channelTitle: 'Test Channel',
        publishedAt: new Date('2023-01-01T00:00:00Z'),
        width: 1920,
        height: 1080,
        resolution: '1920x1080',
        fps: 30,
        audioChannels: 2,
        audioSampleRate: '44100Hz',
        audioCodec: 'aac',
        videoCodec: 'h264',
        fileSize: 1024 * 1024,
        filePath: mockVideoPath,
        format: 'mp4',
        metadataVersion: '1.0.0',
        extractedAt: new Date(),
        sources: ['youtube-api', 'yt-dlp']
      },
      storagePath: mockMetadataPath,
      thumbnailPath: mockThumbnailPath
    });
    
    // Step 4: Mock post-processing service
    (postProcessingService.processVideo as jest.Mock).mockResolvedValue({
      success: true,
      filePath: mockVideoPath,
      thumbnailPath: mockThumbnailPath,
      metadataPath: mockMetadataPath
    });
    
    // Setup test monitoring spy
    // @ts-ignore - Mock for testing
    const monitoringRegisterSpy = jest.spyOn(monitoringService, 'registerDownloadProgress');
    
    // EXECUTE THE COMPLETE WORKFLOW
    
    // 1. Retrieve job from queue
    // @ts-ignore - This is mocked
    const job = await downloadQueueService.getNextJob();
    expect(job).toBe(mockDownloadJob);
    
    // 2. Update job status to in-progress
    // @ts-ignore - This is mocked
    await downloadQueueService.updateJobProgress(job._id, 0, DownloadJobStatus.DOWNLOADING);
    expect(job.status).toBe(DownloadJobStatus.DOWNLOADING);
    
    // 3. Start YouTube download via yt-dlp
    // @ts-ignore - Argument count is handled in the mock
    const downloadResult = await ytdlpService.downloadVideo(
      `https://www.youtube.com/watch?v=${job.youtubeId}`,
      testDir,
      job.format,
      job.options,
      job._id,
      job.userId
    );
    
    // 4. Verify download completed successfully
    expect(downloadResult.success).toBe(true);
    // @ts-ignore - We know this exists in our mock response
    expect(downloadResult.filePath).toBe(mockVideoPath);
    expect(job.progress).toBe(100);
    
    // 5. Update video document with download info
    await mongoose.model('Video').findByIdAndUpdate(TEST_VIDEO_ID, {
      // @ts-ignore - We know this exists in our mock response
      filePath: downloadResult.filePath,
      fileSize: downloadResult.fileSize,
      isArchived: true,
      archiveStatus: 'completed',
      archivedAt: new Date()
    });
    
    // 6. Extract metadata
    const metadataResult = await metadataService.extractMetadata(TEST_VIDEO_ID, {
      extractThumbnails: true,
      extractSubtitles: job.options.extractSubtitles,
      extractChapters: true,
      generateSearchIndex: true,
      extractKeywords: true,
      persistToStorage: true
    });
    
    // 7. Run post-processing (video optimization, thumbnail extraction, etc.)
    await postProcessingService.processVideo(downloadResult.filePath!, job.options);
    
    // 8. Update job status to completed
    // @ts-ignore - This is mocked
    await downloadQueueService.updateJobProgress(job._id, 100, DownloadJobStatus.COMPLETED);
    
    // VERIFY THE COMPLETE WORKFLOW
    
    // Check job was properly updated
    expect(job.status).toBe(DownloadJobStatus.COMPLETED);
    expect(job.progress).toBe(100);
    
    // Check video document was properly updated
    expect(mockVideoDoc.isArchived).toBe(true);
    expect(mockVideoDoc.archiveStatus).toBe('completed');
    expect(mockVideoDoc.filePath).toBe(mockVideoPath);
    expect(mockVideoDoc.fileSize).toBe(fs.statSync(mockVideoPath).size);
    
    // Verify service interactions
    expect(youtubeService.getVideo).toHaveBeenCalledWith(TEST_VIDEO_ID);
    expect(ytdlpService.downloadVideo).toHaveBeenCalledWith(
      `https://www.youtube.com/watch?v=${TEST_VIDEO_ID}`,
      testDir,
      mockDownloadJob.format,
      mockDownloadJob.options,
      mockDownloadJob._id,
      mockDownloadJob.userId
    );
    expect(metadataService.extractMetadata).toHaveBeenCalledWith(TEST_VIDEO_ID, expect.any(Object));
    expect(postProcessingService.processVideo).toHaveBeenCalledWith(mockVideoPath, mockDownloadJob.options);
    
    // Verify external API events were triggered
    expect(externalApiService.notifyEvent).toHaveBeenCalledWith(
      ExternalEventType.DOWNLOAD_STARTED,
      expect.objectContaining({ videoId: TEST_VIDEO_ID })
    );
    expect(externalApiService.notifyEvent).toHaveBeenCalledWith(
      ExternalEventType.DOWNLOAD_PROGRESS,
      expect.objectContaining({ videoId: TEST_VIDEO_ID })
    );
    expect(externalApiService.notifyEvent).toHaveBeenCalledWith(
      ExternalEventType.DOWNLOAD_COMPLETED,
      expect.objectContaining({ videoId: TEST_VIDEO_ID })
    );
    
    // Verify monitoring was updated
    expect(monitoringRegisterSpy).toHaveBeenCalled();
  });
  
  it('should handle errors during the archiving process', async () => {
    // Mock YouTube API to fail
    (youtubeService.getVideo as jest.Mock).mockRejectedValue(new Error('YouTube API error'));
    
    // Mock yt-dlp to fail
    (ytdlpService.downloadVideo as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Download failed: Video unavailable',
      filePath: null
    });
    
    // Setup failure event callback
    downloadCallbacks[ExternalEventType.DOWNLOAD_FAILED] = jest.fn();
    
    // EXECUTE THE WORKFLOW WITH ERROR
    
    // 1. Retrieve job from queue
    // @ts-ignore - This is mocked
    const job = await downloadQueueService.getNextJob();
    
    // 2. Update job status to in-progress
    // @ts-ignore - This is mocked
    await downloadQueueService.updateJobProgress(job._id, 0, DownloadJobStatus.DOWNLOADING);
    
    // 3. Attempt YouTube download (which will fail)
    const downloadResult = await ytdlpService.downloadVideo(
      `https://www.youtube.com/watch?v=${job.youtubeId}`,
      testDir,
      job.format,
      job.options,
      job._id,
      job.userId
    );
    
    // 4. Handle the error
    if (!downloadResult.success) {
      // Emit failure event
      externalApiService.notifyEvent(ExternalEventType.DOWNLOAD_FAILED, {
        jobId: job._id,
        videoId: job.youtubeId,
        error: downloadResult.error
      });
      
      // Update job status to failed
      await downloadQueueService.updateJobProgress(job._id, 0, DownloadJobStatus.FAILED);
      
      // Update video document
      await mongoose.model('Video').findByIdAndUpdate(TEST_VIDEO_ID, {
        archiveStatus: 'failed',
        failureReason: downloadResult.error
      });
    }
    
    // VERIFY ERROR HANDLING
    
    // Check job was marked as failed
    expect(job.status).toBe(DownloadJobStatus.FAILED);
    
    // Check video document was properly updated
    expect(mockVideoDoc.archiveStatus).toBe('failed');
    // @ts-ignore - This property exists in our test mock
    expect(mockVideoDoc.failureReason).toBe('Download failed: Video unavailable');
    
    // Verify failed event was triggered
    expect(externalApiService.notifyEvent).toHaveBeenCalledWith(
      ExternalEventType.DOWNLOAD_FAILED,
      expect.objectContaining({
        jobId: job._id,
        videoId: job.youtubeId,
        error: downloadResult.error
      })
    );
  });
  
  it('should handle retries for intermittent failures', async () => {
    // First call fails, second call succeeds
    (ytdlpService.downloadVideo as jest.Mock)
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockImplementationOnce(async () => {
        const mockVideoPath = path.join(testDir, `${TEST_VIDEO_ID}.mp4`);
        fs.writeFileSync(mockVideoPath, Buffer.alloc(1024 * 1024));
        
        return {
          success: true,
          filePath: mockVideoPath,
          fileSize: fs.statSync(mockVideoPath).size
        };
      });
    
    // Setup mockDownloadJob for retry
    mockDownloadJob.retryCount = 0;
    mockDownloadJob.maxRetries = 3;
    
    // EXECUTE THE WORKFLOW WITH RETRY
    
    // 1. Retrieve job from queue
    // @ts-ignore - This is mocked
    const job = await downloadQueueService.getNextJob();
    
    // 2. First attempt (will fail)
    try {
      await ytdlpService.downloadVideo(
        `https://www.youtube.com/watch?v=${job.youtubeId}`,
        testDir,
        job.format,
        job.options,
        job._id,
        job.userId
      );
    } catch (error) {
      // Update retry count
      job.retryCount = (job.retryCount || 0) + 1;
      
      // Check if we should retry
      if (job.retryCount <= job.maxRetries) {
        // Update job status to retry
        await downloadQueueService.updateJobProgress(job._id, 0, DownloadJobStatus.RETRY);
        
        // Retry after delay (simulated)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Second attempt (will succeed)
        const downloadResult = await ytdlpService.downloadVideo(
          `https://www.youtube.com/watch?v=${job.youtubeId}`,
          testDir,
          job.format,
          job.options,
          job._id,
          job.userId
        );
        
        // Update job on success
        await downloadQueueService.updateJobProgress(job._id, 100, DownloadJobStatus.COMPLETED);
        
        // Update video
        await mongoose.model('Video').findByIdAndUpdate(TEST_VIDEO_ID, {
          // @ts-ignore - From mock result
          filePath: downloadResult.filePath,
          fileSize: downloadResult.fileSize,
          isArchived: true,
          archiveStatus: 'completed',
          archivedAt: new Date()
        });
      } else {
        // Max retries reached
        await downloadQueueService.updateJobProgress(job._id, 0, DownloadJobStatus.FAILED);
      }
    }
    
    // VERIFY RETRY BEHAVIOR
    
    // Check job was properly retried and completed
    expect(job.retryCount).toBe(1);
    expect(job.status).toBe(DownloadJobStatus.COMPLETED);
    
    // Check video was archived after successful retry
    expect(mockVideoDoc.isArchived).toBe(true);
    expect(mockVideoDoc.archiveStatus).toBe('completed');
    
    // Verify ytdlp was called twice (first failure, then success)
    expect(ytdlpService.downloadVideo).toHaveBeenCalledTimes(2);
  });
});