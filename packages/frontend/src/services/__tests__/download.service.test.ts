import * as apiClient from '../../utils/api';
import downloadService, { DownloadPriority } from '../download.service';
import { socketService } from '../socket.service';
import { SocketNamespace, SocketEventType } from '../../types/socket.types';

// Mock the API client
jest.mock('../../utils/api');
// Mock the socket service
jest.mock('../socket.service');

describe('Download Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribeToDownloadUpdates', () => {
    it('should initialize socket and subscribe to events', () => {
      // Setup mocks
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      (socketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);

      // Call the method
      const unsubscribe = downloadService.subscribeToDownloadUpdates(mockCallback);

      // Check socket initialization
      expect(socketService.initialize).toHaveBeenCalled();

      // Check event subscriptions
      expect(socketService.subscribe).toHaveBeenCalledTimes(3);
      expect(socketService.subscribe).toHaveBeenCalledWith(
        SocketNamespace.DOWNLOADS,
        SocketEventType.DOWNLOAD_UPDATED,
        mockCallback
      );
      expect(socketService.subscribe).toHaveBeenCalledWith(
        SocketNamespace.DOWNLOADS,
        SocketEventType.DOWNLOAD_STATUS_CHANGED,
        mockCallback
      );
      expect(socketService.subscribe).toHaveBeenCalledWith(
        SocketNamespace.DOWNLOADS,
        SocketEventType.DOWNLOAD_PROGRESS,
        mockCallback
      );

      // Check that unsubscribe function is returned and works correctly
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('subscribeToJobUpdates', () => {
    it('should initialize socket, emit subscription and subscribe to events', () => {
      // Setup mocks
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      (socketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);

      // Call the method
      const unsubscribe = downloadService.subscribeToJobUpdates('job-123', mockCallback);

      // Check socket initialization
      expect(socketService.initialize).toHaveBeenCalled();

      // Check job subscription
      expect(socketService.emit).toHaveBeenCalledWith(
        SocketNamespace.DOWNLOADS,
        'subscribe:job',
        'job-123'
      );

      // Check event subscriptions
      expect(socketService.subscribe).toHaveBeenCalledTimes(3);

      // Call the unsubscribe function
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });

    it('should filter events for the specific job', () => {
      // Setup mocks
      const mockCallback = jest.fn();
      const subscribeCallbacks: ((data: any) => void)[] = [];
      
      (socketService.subscribe as jest.Mock).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (namespace, event, callback) => {
          subscribeCallbacks.push(callback);
          return jest.fn();
        }
      );

      // Call the method
      downloadService.subscribeToJobUpdates('job-123', mockCallback);

      // Verify callback behavior for matching jobId
      subscribeCallbacks.forEach(callback => {
        // Call with matching job ID
        callback({ jobId: 'job-123', status: 'processing' });
        // Call with non-matching job ID
        callback({ jobId: 'other-job', status: 'completed' });
      });

      // The callback should only be called for the matching job ID
      expect(mockCallback).toHaveBeenCalledTimes(subscribeCallbacks.length);
      mockCallback.mock.calls.forEach(call => {
        expect(call[0].jobId).toBe('job-123');
      });
    });
  });

  describe('getUserJobs', () => {
    it('should fetch user jobs', async () => {
      // Setup mock response
      const mockJobs = [
        { _id: 'job-1', status: 'completed' },
        { _id: 'job-2', status: 'processing' }
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockJobs });

      // Call the method
      const result = await downloadService.getUserJobs();

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads');
      expect(result).toEqual(mockJobs);
    });

    it('should handle API errors', async () => {
      // Setup mock error
      const mockError = new Error('API error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      // Mock console.error to prevent test output noise
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the method and expect it to throw
      await expect(downloadService.getUserJobs()).rejects.toThrow(mockError);

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads');
      expect(console.error).toHaveBeenCalled();
    });

    it('should return empty array if no data is returned', async () => {
      // Setup mock response with no data
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      // Call the method
      const result = await downloadService.getUserJobs();

      // Verify API call and result
      expect(apiClient.get).toHaveBeenCalledWith('/downloads');
      expect(result).toEqual([]);
    });
  });

  describe('getJob', () => {
    it('should fetch job details by ID', async () => {
      // Setup mock response
      const mockJob = { _id: 'job-123', status: 'completed' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockJob });

      // Call the method
      const result = await downloadService.getJob('job-123');

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/job-123');
      expect(result).toEqual(mockJob);
    });

    it('should throw error if job is not found', async () => {
      // Setup mock response with no data
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      // Mock console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the method and expect it to throw
      await expect(downloadService.getJob('nonexistent-job')).rejects.toThrow('Job nonexistent-job not found');

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/nonexistent-job');
    });
  });

  describe('createJob', () => {
    it('should create a new download job', async () => {
      // Setup mock response
      const mockJob = { _id: 'new-job', status: 'queued' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockJob });

      // Job creation options
      const options = {
        videoId: 'video-123',
        priority: DownloadPriority.HIGH,
        profileName: 'high-quality',
        options: { format: 'mp4' }
      };

      // Call the method
      const result = await downloadService.createJob(options);

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads', options);
      expect(result).toEqual(mockJob);
    });

    it('should throw error if creation fails', async () => {
      // Setup mock response with no data
      (apiClient.post as jest.Mock).mockResolvedValue({ data: null });

      // Mock console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the method and expect it to throw
      await expect(downloadService.createJob({ videoId: 'video-123' }))
        .rejects.toThrow('Failed to create download job');

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads', { videoId: 'video-123' });
    });
  });

  describe('Job control operations', () => {
    it('should pause a job', async () => {
      // Setup mock response
      const mockResponse = { success: true, status: 'paused' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Call the method
      const result = await downloadService.pauseJob('job-123');

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads/job-123/pause', {});
      expect(result).toEqual(mockResponse);
    });

    it('should resume a job', async () => {
      // Setup mock response
      const mockResponse = { success: true, status: 'queued' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Call the method
      const result = await downloadService.resumeJob('job-123');

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads/job-123/resume', {});
      expect(result).toEqual(mockResponse);
    });

    it('should cancel a job', async () => {
      // Setup mock response
      const mockResponse = { success: true, status: 'canceled' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Call the method
      const result = await downloadService.cancelJob('job-123');

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads/job-123/cancel', {});
      expect(result).toEqual(mockResponse);
    });

    it('should retry a failed job', async () => {
      // Setup mock response
      const mockResponse = { success: true, status: 'queued' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Call the method
      const result = await downloadService.retryJob('job-123');

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads/job-123/retry', {});
      expect(result).toEqual(mockResponse);
    });

    it('should update job priority', async () => {
      // Setup mock response
      const mockResponse = { success: true, priority: DownloadPriority.HIGH };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Call the method
      const result = await downloadService.updateJobPriority('job-123', DownloadPriority.HIGH);

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads/job-123/priority', { priority: DownloadPriority.HIGH });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getQueueStats', () => {
    it('should fetch queue statistics', async () => {
      // Setup mock response
      const mockStats = {
        queuedCount: 5,
        processingCount: 2,
        completedCount: 10,
        totalCount: 17
      };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockStats });

      // Call the method
      const result = await downloadService.getQueueStats();

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/queue/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getActiveDownloads', () => {
    it('should fetch active downloads', async () => {
      // Setup mock response
      const mockDownloads = [
        { job: { _id: 'job-1' }, progress: { percent: 50 } }
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockDownloads });

      // Call the method
      const result = await downloadService.getActiveDownloads();

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/active');
      expect(result).toEqual(mockDownloads);
    });
  });

  describe('getQualityProfiles', () => {
    it('should fetch quality profiles', async () => {
      // Setup mock response
      const mockProfiles = {
        'high': { name: 'high', description: 'High quality', format: 'mp4' }
      };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProfiles });

      // Call the method
      const result = await downloadService.getQualityProfiles();

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/profiles');
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('getAvailableFormats', () => {
    it('should fetch available formats for a URL', async () => {
      // Setup mock response
      const mockFormats = [
        { formatId: '22', ext: 'mp4', resolution: '720p' }
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockFormats });

      // Call the method
      const result = await downloadService.getAvailableFormats('https://youtube.com/watch?v=123');

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/formats', { 
        params: { url: 'https://youtube.com/watch?v=123' } 
      });
      expect(result).toEqual(mockFormats);
    });
  });

  describe('getVideoInfo', () => {
    it('should fetch video info for a URL', async () => {
      // Setup mock response
      const mockInfo = { id: 'video123', title: 'Test Video' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockInfo });

      // Call the method
      const result = await downloadService.getVideoInfo('https://youtube.com/watch?v=123');

      // Verify API call
      expect(apiClient.get).toHaveBeenCalledWith('/downloads/info', { 
        params: { url: 'https://youtube.com/watch?v=123' } 
      });
      expect(result).toEqual(mockInfo);
    });
  });

  describe('processFile', () => {
    it('should request post-processing for a downloaded file', async () => {
      // Setup mock response
      const mockResult = { success: true, outputPath: '/processed/video.mp4' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResult });

      // Processing options
      const options = { trim: { start: 10, end: 60 } };

      // Call the method
      const result = await downloadService.processFile('job-123', options);

      // Verify API call
      expect(apiClient.post).toHaveBeenCalledWith('/downloads/job-123/process', options);
      expect(result).toEqual(mockResult);
    });
  });
});