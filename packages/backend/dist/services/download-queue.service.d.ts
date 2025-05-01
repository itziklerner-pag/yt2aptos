import mongoose from 'mongoose';
import { DownloadJobDocument } from '../models/download-job.model';
import EventEmitter from 'events';
/**
 * Job priority levels
 */
export declare enum JobPriority {
    LOW = 0,
    NORMAL = 5,
    HIGH = 10,
    URGENT = 20
}
/**
 * Download queue configuration
 */
export interface DownloadQueueConfig {
    pollInterval: number;
    maxConcurrentDownloads: number;
    maxRetriesPerJob: number;
    retryDelayBase: number;
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
export declare class DownloadQueueService extends EventEmitter {
    private config;
    private isRunning;
    private isPaused;
    private activeJobs;
    private pollingInterval;
    private jobTimeouts;
    /**
     * Download Queue Service events
     */
    static readonly EVENTS: {
        JOB_STARTED: string;
        JOB_COMPLETED: string;
        JOB_FAILED: string;
        JOB_PAUSED: string;
        JOB_RESUMED: string;
        JOB_CANCELED: string;
        QUEUE_STARTED: string;
        QUEUE_STOPPED: string;
        QUEUE_PAUSED: string;
        QUEUE_RESUMED: string;
        ERROR: string;
    };
    /**
     * Create a new Download Queue Service
     * @param config Configuration options
     */
    constructor(config?: Partial<DownloadQueueConfig>);
    /**
     * Set up event handlers for the queue
     */
    private setupEventHandlers;
    /**
     * Set a timeout for a job
     * @param job The job to set a timeout for
     */
    private setJobTimeout;
    /**
     * Clear a job timeout
     * @param jobId The job ID to clear timeout for
     */
    private clearJobTimeout;
    /**
     * Start the download queue processor
     */
    startQueue(): Promise<void>;
    /**
     * Stop the download queue processor
     */
    stopQueue(): Promise<void>;
    /**
     * Pause the download queue
     */
    pauseQueue(): void;
    /**
     * Resume the download queue
     */
    resumeQueue(): void;
    /**
     * Process the download queue
     * - Find jobs to process
     * - Process jobs in parallel up to maxConcurrentDownloads
     */
    private processQueue;
    /**
     * Process a single download job
     * @param job The job to process
     */
    private processJob;
    /**
     * Add a new download job to the queue
     * @param videoId ID of the video to download
     * @param userId ID of the user who initiated the download
     * @param options Additional options for the download
     * @returns The created download job
     */
    addJob(videoId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId, options?: {
        priority?: JobPriority;
        profileName?: string;
        ytdlpOptions?: Record<string, any>;
        outputPath?: string;
        maxRetries?: number;
    }): Promise<DownloadJobDocument>;
    /**
     * Pause a download job
     * @param jobId ID of the job to pause
     * @returns True if paused successfully, false otherwise
     */
    pauseJob(jobId: string): Promise<boolean>;
    /**
     * Resume a paused download job
     * @param jobId ID of the job to resume
     * @returns True if resumed successfully, false otherwise
     */
    resumeJob(jobId: string): Promise<boolean>;
    /**
     * Cancel a download job
     * @param jobId ID of the job to cancel
     * @returns True if canceled successfully, false otherwise
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * Retry a failed download job
     * @param jobId ID of the job to retry
     * @returns True if retry was initiated successfully, false otherwise
     */
    retryJob(jobId: string): Promise<boolean>;
    /**
     * Update the priority of a download job
     * @param jobId ID of the job to update
     * @param priority New priority level
     * @returns True if priority was updated successfully, false otherwise
     */
    updateJobPriority(jobId: string, priority: JobPriority): Promise<boolean>;
    /**
     * Get stats about the download queue
     * @returns Statistics about the queue
     */
    getQueueStats(): Promise<{
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
    }>;
    /**
     * Clean up old jobs based on configuration
     */
    cleanupOldJobs(): Promise<void>;
    /**
     * Get the current configuration
     * @returns A copy of the current configuration
     */
    getConfig(): DownloadQueueConfig;
    /**
     * Update the configuration
     * @param config New configuration values
     */
    updateConfig(config: Partial<DownloadQueueConfig>): void;
}
export declare const downloadQueueService: DownloadQueueService;
