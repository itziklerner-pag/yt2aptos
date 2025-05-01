import mongoose from 'mongoose';
import { BaseDocument, createSchema } from './base.model';

/**
 * Video document interface
 */
export interface VideoDocument extends BaseDocument {
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number; // Duration in seconds
  viewCount?: number;
  likeCount?: number;
  publishedAt?: Date;
  tags?: string[];
  channelId: mongoose.Types.ObjectId;
  playlistId?: mongoose.Types.ObjectId; // Optional, as video can be independent
  isArchived: boolean;
  archiveStatus: 'pending' | 'downloading' | 'completed' | 'failed';
  downloadedAt?: Date;
  fileSize?: number; // Size in bytes
  filePath?: string; // Relative path in storage
  fileUrl?: string; // URL to access the file
  format?: string; // Video format (mp4, webm, etc)
  quality?: string; // Video quality (1080p, 720p, etc)
  hasSubtitles: boolean;
  subtitleLanguages?: string[];
  metadataPath?: string; // Path to metadata JSON
  errorMessage?: string; // Error message if download failed
}

/**
 * Video schema definition
 */
const videoSchema = createSchema<VideoDocument>({
  youtubeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
  },
  duration: {
    type: Number,
  },
  viewCount: {
    type: Number,
  },
  likeCount: {
    type: Number,
  },
  publishedAt: {
    type: Date,
  },
  tags: [{
    type: String,
  }],
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    index: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
  archiveStatus: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  downloadedAt: {
    type: Date,
  },
  fileSize: {
    type: Number,
  },
  filePath: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  format: {
    type: String,
  },
  quality: {
    type: String,
  },
  hasSubtitles: {
    type: Boolean,
    default: false,
  },
  subtitleLanguages: [{
    type: String,
  }],
  metadataPath: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
});

// Indexes
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ publishedAt: -1 });
videoSchema.index({ channelId: 1, playlistId: 1 });
videoSchema.index({ isArchived: 1, archiveStatus: 1 });

/**
 * Video model
 */
export const Video = mongoose.model<VideoDocument>('Video', videoSchema);