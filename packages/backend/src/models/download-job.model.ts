import mongoose from 'mongoose';
import { BaseDocument, createSchema } from './base.model';

/**
 * Download job status types
 */
export type DownloadJobStatus = 
  | 'queued'     // Job is in queue waiting to be processed
  | 'processing' // Job is currently being processed
  | 'completed'  // Job completed successfully
  | 'failed'     // Job failed with an error
  | 'paused'     // Job was paused by user
  | 'canceled';  // Job was canceled by user

/**
 * Download job document interface
 */
export interface DownloadJobDocument extends BaseDocument {
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: DownloadJobStatus;
  priority: number;
  progress: number; // 0-100 percentage
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
 * Download job schema definition
 */
const downloadJobSchema = createSchema<DownloadJobDocument>({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', 'paused', 'canceled'],
    default: 'queued',
    index: true,
  },
  priority: {
    type: Number,
    default: 0,
    index: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  errorMessage: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
  ytdlpOptions: {
    type: mongoose.Schema.Types.Mixed,
  },
  outputPath: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
});

// Indexes
downloadJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
downloadJobSchema.index({ userId: 1, status: 1 });
downloadJobSchema.index({ videoId: 1, status: 1 });
downloadJobSchema.index({ startedAt: 1 }, { sparse: true });

/**
 * Download job model
 */
export const DownloadJob = mongoose.model<DownloadJobDocument>('DownloadJob', downloadJobSchema);