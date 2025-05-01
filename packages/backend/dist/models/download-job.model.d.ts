import mongoose from 'mongoose';
import { BaseDocument } from './base.model';
/**
 * Download job status types
 */
export type DownloadJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'paused' | 'canceled';
/**
 * Download job document interface
 */
export interface DownloadJobDocument extends BaseDocument {
    videoId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
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
}
/**
 * Download job model
 */
export declare const DownloadJob: mongoose.Model<DownloadJobDocument, {}, {}, {}, mongoose.Document<unknown, {}, DownloadJobDocument, {}> & DownloadJobDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
