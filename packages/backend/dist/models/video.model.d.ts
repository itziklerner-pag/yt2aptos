import mongoose from 'mongoose';
import { BaseDocument } from './base.model';
/**
 * Video document interface
 */
export interface VideoDocument extends BaseDocument {
    youtubeId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
    viewCount?: number;
    likeCount?: number;
    publishedAt?: Date;
    tags?: string[];
    channelId: mongoose.Types.ObjectId;
    playlistId?: mongoose.Types.ObjectId;
    isArchived: boolean;
    archiveStatus: 'pending' | 'downloading' | 'completed' | 'failed';
    downloadedAt?: Date;
    fileSize?: number;
    filePath?: string;
    fileUrl?: string;
    format?: string;
    quality?: string;
    hasSubtitles: boolean;
    subtitleLanguages?: string[];
    metadataPath?: string;
    errorMessage?: string;
}
/**
 * Video model
 */
export declare const Video: mongoose.Model<VideoDocument, {}, {}, {}, mongoose.Document<unknown, {}, VideoDocument, {}> & VideoDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
