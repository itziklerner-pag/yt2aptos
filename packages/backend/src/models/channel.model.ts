import mongoose from 'mongoose';
import { BaseDocument, createSchema } from './base.model';

/**
 * Channel document interface
 */
export interface ChannelDocument extends BaseDocument {
  youtubeId: string;
  name: string;
  description?: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  country?: string;
  publishedAt?: Date;
  lastChecked?: Date;
  isArchived: boolean;
  archiveStatus: 'none' | 'partial' | 'complete';
  createdBy: mongoose.Types.ObjectId;
}

/**
 * Channel schema definition
 */
const channelSchema = createSchema<ChannelDocument>({
  youtubeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
  },
  customUrl: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
  },
  subscriberCount: {
    type: Number,
  },
  videoCount: {
    type: Number,
  },
  country: {
    type: String,
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Indexes
channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ isArchived: 1 });
channelSchema.index({ createdBy: 1 });

/**
 * Channel model
 */
export const Channel = mongoose.model<ChannelDocument>('Channel', channelSchema);