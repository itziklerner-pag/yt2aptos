import * as apiClient from '../utils/api';
import { socketService } from './socket.service';
import { SocketEventType, SocketNamespace } from '../types/socket.types';

/**
 * Download job status type
 */
export type DownloadJobStatus = 
  | 'queued'     // Job is in queue waiting to be processed
  | 'processing' // Job is currently being processed
  | 'completed'  // Job completed successfully
  | 'failed'     // Job failed with an error
  | 'paused'     // Job was paused by user
  | 'canceled';  // Job was canceled by user

/**
 * Download job interface
 */
export interface DownloadJob {
  _id: string;
  videoId: any;
  userId: string;
  status: DownloadJobStatus;
  priority: number;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  ytdlpOptions?: Record<string, any>;
  outputPath?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Priority levels for downloads
 */
export enum DownloadPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 10,
  URGENT = 20
}

/**
 * Quality profile interface
 */
export interface QualityProfile {
  name: string;
  description: string;
  format: string;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioBitrate?: string;
  extractThumbnail: boolean;
  extractSubtitles: boolean;
  subtitleLanguages?: string[];
  extractMetadata: boolean;
  limitBandwidth?: string;
}

/**
 * Active download information
 */
export interface ActiveDownload {
  job: DownloadJob;
  progress: {
    percent: number;
    totalSize: string;
    downloadedSize: string;
    speed: string;
    eta: string;
    timestamp: Date;
  } | null;
  startTime: Date;
}

/**
 * Download queue statistics
 */
export interface QueueStats {
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
}

/**
 * New download job options
 */
export interface CreateDownloadOptions {
  videoId: string;
  priority?: DownloadPriority;
  profileName?: string;
  options?: Record<string, any>;
}

/**
 * Available download format
 */
export interface AvailableFormat {
  formatId: string;
  ext: string;
  resolution: string;
  note: string;
}

/**
 * Service for interacting with download APIs
 */
class DownloadService {
  /**
   * Subscribe to real-time updates for downloads
   * @param callback Callback function for download updates
   * @returns Cleanup function to unsubscribe
   */
  public subscribeToDownloadUpdates(callback: (update: any) => void): () => void {
    // Initialize socket connection
    socketService.initialize();
    
    // Subscribe to all download events
    const eventTypes = [
      SocketEventType.DOWNLOAD_UPDATED,
      SocketEventType.DOWNLOAD_STATUS_CHANGED,
      SocketEventType.DOWNLOAD_PROGRESS
    ];
    
    // Create unsubscribe functions array
    const unsubscribeFunctions: Array<() => void> = [];
    
    // Add event listeners
    eventTypes.forEach(eventType => {
      const unsubscribe = socketService.subscribe(SocketNamespace.DOWNLOADS, eventType, callback);
      unsubscribeFunctions.push(unsubscribe);
    });
    
    // Return cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Subscribe to specific download job updates
   * @param jobId Download job ID
   * @param callback Callback function for job updates
   * @returns Cleanup function to unsubscribe
   */
  public subscribeToJobUpdates(jobId: string, callback: (update: any) => void): () => void {
    // Initialize socket connection
    socketService.initialize();
    
    // Subscribe to specific job
    socketService.emit(SocketNamespace.DOWNLOADS, 'subscribe:job', jobId);
    
    // Subscribe to download events
    const eventTypes = [
      SocketEventType.DOWNLOAD_UPDATED,
      SocketEventType.DOWNLOAD_STATUS_CHANGED,
      SocketEventType.DOWNLOAD_PROGRESS
    ];
    
    // Create unsubscribe functions array
    const unsubscribeFunctions: Array<() => void> = [];
    
    // Add event listeners
    eventTypes.forEach(eventType => {
      const unsubscribe = socketService.subscribe(
        SocketNamespace.DOWNLOADS,
        eventType,
        (data: any) => {
          if (data.jobId === jobId) {
            callback(data);
          }
        }
      );
      unsubscribeFunctions.push(unsubscribe);
    });
    
    // Return cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Get all download jobs for the current user
   * @returns Array of download jobs
   */
  public async getUserJobs(): Promise<DownloadJob[]> {
    try {
      const response = await apiClient.get<DownloadJob[]>('/downloads');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user download jobs:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific download job by ID
   * @param jobId Download job ID
   * @returns Download job information
   */
  public async getJob(jobId: string): Promise<DownloadJob> {
    try {
      const response = await apiClient.get<DownloadJob>(`/downloads/${jobId}`);
      if (!response.data) {
        throw new Error(`Job ${jobId} not found`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching download job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new download job
   * @param options Download options
   * @returns Created download job
   */
  public async createJob(options: CreateDownloadOptions): Promise<DownloadJob> {
    try {
      const response = await apiClient.post<DownloadJob>('/downloads', options);
      if (!response.data) {
        throw new Error('Failed to create download job');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating download job:', error);
      throw error;
    }
  }
  
  /**
   * Pause a download job
   * @param jobId Download job ID
   * @returns Operation result
   */
  public async pauseJob(jobId: string): Promise<{ success: boolean; status: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; status: string }>(`/downloads/${jobId}/pause`, {});
      if (!response.data) {
        throw new Error(`Failed to pause job ${jobId}`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error pausing download job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Resume a paused download job
   * @param jobId Download job ID
   * @returns Operation result
   */
  public async resumeJob(jobId: string): Promise<{ success: boolean; status: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; status: string }>(`/downloads/${jobId}/resume`, {});
      if (!response.data) {
        throw new Error(`Failed to resume job ${jobId}`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error resuming download job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Cancel a download job
   * @param jobId Download job ID
   * @returns Operation result
   */
  public async cancelJob(jobId: string): Promise<{ success: boolean; status: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; status: string }>(`/downloads/${jobId}/cancel`, {});
      if (!response.data) {
        throw new Error(`Failed to cancel job ${jobId}`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error canceling download job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Retry a failed download job
   * @param jobId Download job ID
   * @returns Operation result
   */
  public async retryJob(jobId: string): Promise<{ success: boolean; status: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; status: string }>(`/downloads/${jobId}/retry`, {});
      if (!response.data) {
        throw new Error(`Failed to retry job ${jobId}`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error retrying download job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update a job's priority
   * @param jobId Download job ID
   * @param priority New priority level
   * @returns Operation result
   */
  public async updateJobPriority(
    jobId: string,
    priority: DownloadPriority
  ): Promise<{ success: boolean; priority: number }> {
    try {
      const response = await apiClient.post<{ success: boolean; priority: number }>(
        `/downloads/${jobId}/priority`,
        { priority }
      );
      if (!response.data) {
        throw new Error(`Failed to update priority for job ${jobId}`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error updating priority for job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get download queue statistics
   * @returns Queue statistics
   */
  public async getQueueStats(): Promise<QueueStats> {
    try {
      const response = await apiClient.get<QueueStats>('/downloads/queue/stats');
      if (!response.data) {
        throw new Error('Failed to fetch queue stats');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      throw error;
    }
  }
  
  /**
   * Get active downloads
   * @returns Array of active downloads
   */
  public async getActiveDownloads(): Promise<ActiveDownload[]> {
    try {
      const response = await apiClient.get<ActiveDownload[]>('/downloads/active');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching active downloads:', error);
      throw error;
    }
  }
  
  /**
   * Get available quality profiles
   * @returns Map of quality profiles
   */
  public async getQualityProfiles(): Promise<Record<string, QualityProfile>> {
    try {
      const response = await apiClient.get<Record<string, QualityProfile>>('/downloads/profiles');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching quality profiles:', error);
      throw error;
    }
  }
  
  /**
   * Get available formats for a YouTube URL
   * @param url YouTube video URL
   * @returns Array of available formats
   */
  public async getAvailableFormats(url: string): Promise<AvailableFormat[]> {
    try {
      const response = await apiClient.get<AvailableFormat[]>('/downloads/formats', { params: { url } });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching available formats:', error);
      throw error;
    }
  }
  
  /**
   * Get video info without downloading
   * @param url YouTube video URL
   * @returns Video information
   */
  public async getVideoInfo(url: string): Promise<any> {
    try {
      const response = await apiClient.get<any>('/downloads/info', { params: { url } });
      return response.data;
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    }
  }
  
  /**
   * Process a downloaded file
   * @param jobId Download job ID
   * @param options Processing options
   * @returns Processing result
   */
  public async processFile(jobId: string, options: any): Promise<any> {
    try {
      const response = await apiClient.post<any>(`/downloads/${jobId}/process`, options);
      return response.data;
    } catch (error) {
      console.error(`Error processing file for job ${jobId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const downloadService = new DownloadService();

export default downloadService;