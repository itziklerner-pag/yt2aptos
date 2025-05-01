import mongoose from 'mongoose';
import { BaseDocument } from './base.model';
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
 * Channel model
 */
export declare const Channel: mongoose.Model<ChannelDocument, {}, {}, {}, mongoose.Document<unknown, {}, ChannelDocument, {}> & ChannelDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
