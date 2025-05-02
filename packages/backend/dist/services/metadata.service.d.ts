import { VideoDocument } from '../models/video.model';
/**
 * Interface for raw extracted metadata
 */
export interface RawMetadata {
    [key: string]: any;
}
/**
 * Interface for standardized video metadata
 */
export interface StandardizedMetadata {
    id: string;
    title: string;
    description?: string;
    uploadDate?: string;
    publishedAt?: Date;
    duration?: number;
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    commentCount?: number;
    channelId?: string;
    channelTitle?: string;
    channelUrl?: string;
    thumbnails?: {
        default?: string;
        medium?: string;
        high?: string;
        standard?: string;
        maxres?: string;
        local?: string;
    };
    width?: number;
    height?: number;
    resolution?: string;
    fps?: number;
    audioChannels?: number;
    audioSampleRate?: string;
    audioCodec?: string;
    videoCodec?: string;
    tags?: string[];
    categories?: string[];
    language?: string;
    subtitleLanguages?: string[];
    chapters?: Array<{
        title: string;
        startTime: number;
        endTime?: number;
    }>;
    fileSize?: number;
    filePath?: string;
    fileUrl?: string;
    format?: string;
    subtitles?: Array<{
        language: string;
        path: string;
        url?: string;
    }>;
    comments?: Array<{
        id: string;
        author: string;
        authorId: string;
        text: string;
        likeCount?: number;
        publishedAt?: Date;
        replies?: Array<{
            id: string;
            author: string;
            authorId: string;
            text: string;
            likeCount?: number;
            publishedAt?: Date;
        }>;
    }>;
    metadataVersion: string;
    extractedAt: Date;
    sources: string[];
    keywords?: string[];
    sentiment?: {
        score: number;
        magnitude: number;
    };
    topics?: string[];
    contentRating?: string;
    searchableText?: string;
}
/**
 * Metadata extraction options
 */
export interface MetadataExtractionOptions {
    extractThumbnails: boolean;
    thumbnailQuality: 'low' | 'medium' | 'high' | 'max';
    extractSubtitles: boolean;
    subtitleLanguages?: string[];
    extractComments: boolean;
    commentCount?: number;
    extractChapters: boolean;
    generateSearchIndex: boolean;
    includeRawMetadata: boolean;
    extractKeywords: boolean;
    persistToStorage: boolean;
}
/**
 * Result of metadata extraction
 */
export interface MetadataExtractionResult {
    success: boolean;
    metadata?: StandardizedMetadata;
    rawMetadata?: RawMetadata;
    storagePath?: string;
    thumbnailPath?: string;
    subtitlePaths?: string[];
    errorMessage?: string;
}
/**
 * Service for enhanced metadata extraction and processing
 */
export declare class MetadataService {
    private readonly METADATA_VERSION;
    private readonly DEFAULT_OPTIONS;
    /**
     * Creates a new instance of MetadataService
     */
    constructor();
    /**
     * Extract and process metadata for a YouTube video
     * @param videoId YouTube video ID
     * @param options Metadata extraction options
     * @returns Metadata extraction result
     */
    extractMetadata(videoId: string, options?: Partial<MetadataExtractionOptions>): Promise<MetadataExtractionResult>;
    /**
     * Standardize metadata from multiple sources into a consistent format
     * @param rawMetadata Raw metadata from different sources
     * @param sources Array of source names that were used
     * @param videoId YouTube video ID
     * @returns Standardized metadata object
     */
    private standardizeMetadata;
    /**
     * Process and store thumbnail for a video
     * @param videoId YouTube video ID
     * @param metadata Standardized metadata
     * @param videoDoc Video document
     * @param quality Thumbnail quality to use
     * @returns Path to stored thumbnail
     */
    private processThumbnail;
    /**
     * Process and store subtitles for a video
     * @param videoId YouTube video ID
     * @param metadata Standardized metadata
     * @param videoDoc Video document
     * @param languages Languages to extract
     * @returns Paths to stored subtitle files
     */
    private processSubtitles;
    /**
     * Generate a searchable text string for full-text search
     * @param metadata Standardized metadata
     * @returns Searchable text string
     */
    private generateSearchableText;
    /**
     * Extract keywords from metadata
     * @param metadata Standardized metadata
     * @returns Array of keywords
     */
    private extractKeywords;
    /**
     * Extract potential keywords from text
     * @param text Input text
     * @returns Array of potential keywords
     */
    private extractPotentialKeywords;
    /**
     * Check if a word is a common stop word (should be excluded from keywords)
     * @param word Word to check
     * @returns True if the word is a stop word
     */
    private isStopWord;
    /**
     * Persist metadata to storage
     * @param videoId YouTube video ID
     * @param standardizedMetadata Standardized metadata
     * @param rawMetadata Raw metadata
     * @param videoDoc Video document
     * @returns Path to stored metadata file
     */
    private persistMetadata;
    /**
     * Search for videos using metadata
     * @param query Search query
     * @param options Search options
     * @returns Array of matching videos with metadata
     */
    searchVideosByMetadata(query: string, options?: {
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
        filter?: Record<string, any>;
    }): Promise<{
        videos: VideoDocument[];
        total: number;
    }>;
    /**
     * Get detailed metadata for a video
     * @param videoId Video ID (MongoDB ID)
     * @param includeRaw Whether to include raw metadata
     * @returns Detailed metadata
     */
    getDetailedMetadata(videoId: string, includeRaw?: boolean): Promise<StandardizedMetadata>;
    /**
     * Process metadata for a batch of videos
     * @param videoIds Array of YouTube video IDs
     * @param options Metadata extraction options
     * @returns Object mapping video IDs to extraction results
     */
    batchProcessMetadata(videoIds: string[], options?: Partial<MetadataExtractionOptions>): Promise<Record<string, MetadataExtractionResult>>;
    /**
     * Extract metadata from a video file that has already been downloaded
     * @param filePath Path to the video file
     * @param videoId Optional YouTube video ID for additional metadata
     * @param options Metadata extraction options
     * @returns Metadata extraction result
     */
    extractMetadataFromFile(filePath: string, videoId?: string, options?: Partial<MetadataExtractionOptions>): Promise<MetadataExtractionResult>;
    /**
     * Convert ISO 8601 duration string to seconds
     * @param isoDuration ISO 8601 duration string (e.g., "PT1H2M3S")
     * @returns Duration in seconds
     */
    private convertIsoDurationToSeconds;
}
export declare const metadataService: MetadataService;
