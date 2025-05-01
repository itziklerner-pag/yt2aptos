import { Request, Response, NextFunction } from 'express';
/**
 * Controller for download-related operations
 */
export declare class DownloadController {
    /**
     * Get all download jobs for the current user
     */
    getUserJobs(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get a specific download job
     */
    getJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a new download job
     */
    createJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Pause a download job
     */
    pauseJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Resume a paused download job
     */
    resumeJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Cancel a download job
     */
    cancelJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Retry a failed download job
     */
    retryJob(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a job's priority
     */
    updateJobPriority(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get download queue stats
     */
    getQueueStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get active downloads
     */
    getActiveDownloads(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get available quality profiles
     */
    getQualityProfiles(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get available formats for a YouTube URL
     */
    getAvailableFormats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get video info without downloading
     */
    getVideoInfo(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Process a downloaded file
     */
    processFile(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const downloadController: DownloadController;
