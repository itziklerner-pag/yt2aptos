import mongoose from 'mongoose';
import { BaseDocument } from './base.model';
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
 * Playlist model
 */
export declare const Playlist: mongoose.Model<PlaylistDocument, {}, {}, {}, mongoose.Document<unknown, {}, PlaylistDocument, {}> & PlaylistDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
