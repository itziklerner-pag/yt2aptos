import mongoose from 'mongoose';
import { BaseDocument, createSchema } from './base.model';

/**
 * Playlist document interface
 */
export interface PlaylistDocument extends BaseDocument {
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  itemCount?: number;
  publishedAt?: Date;
  lastChecked?: Date;
  isArchived: boolean;
  archiveStatus: 'none' | 'partial' | 'complete';
  channelId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

/**
 * Playlist schema definition
 */
const playlistSchema = createSchema<PlaylistDocument>({
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
  itemCount: {
    type: Number,
  },
  publishedAt: {
    type: Date,
  },
  lastChecked: {
    type: Date,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  archiveStatus: {
    type: String,
    enum: ['none', 'partial', 'complete'],
    default: 'none',
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
});

// Indexes
playlistSchema.index({ title: 'text', description: 'text' });
playlistSchema.index({ isArchived: 1 });
playlistSchema.index({ channelId: 1, createdBy: 1 });

/**
 * Playlist model
 */
export const Playlist = mongoose.model<PlaylistDocument>('Playlist', playlistSchema);