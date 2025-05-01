import { VideoDocument } from '../models/video.model';
/**
 * Output format types supported by yt-dlp
 */
export type YtdlpOutputFormat = 'best' | 'bestvideo+bestaudio' | 'bestvideo*+bestaudio' | 'mp4' | 'webm' | 'mp3' | 'opus' | 'vorbis' | 'wav';
/**
 * Quality profile for different content types
 */
export interface QualityProfile {
    name: string;
    description: string;
    format: YtdlpOutputFormat;
    resolution?: string;
    videoCodec?: string;
    audioCodec?: string;
    audioBitrate?: string;
    extractThumbnail: boolean;
    extractSubtitles: boolean;
    subtitleLanguages?: string[];
    extractMetadata: boolean;
    limitBandwidth?: string;
}
/**
 * Configuration for yt-dlp
 */
export interface YtdlpConfig {
    outputTemplate: string;
    outputDirectory: string;
    tempDirectory: string;
    maxConcurrentDownloads: number;
    retryCount: number;
    rateLimitKbps?: number;
    useProxy?: boolean;
    proxyUrl?: string;
    cookiesFile?: string;
    userAgent?: string;
    defaultQualityProfile: string;
    qualityProfiles: Record<string, QualityProfile>;
    includeAds: boolean;
    includeComments: boolean;
    downloadDescription: boolean;
    extractChapters: boolean;
    embedThumbnail: boolean;
    embedMetadata: boolean;
    convertToMp4: boolean;
    downloadPlaylist: boolean;
    downloadAll: boolean;
    includeFormats: string[];
    excludeFormats: string[];
    additionalOptions: string[];
}
/**
 * Progress information emitted by yt-dlp
 */
export interface DownloadProgress {
    percent: number;
    totalSize: string;
    downloadedSize: string;
    speed: string;
    eta: string;
    timestamp: Date;
}
/**
 * Result of a completed download
 */
export interface DownloadResult {
    success: boolean;
    outputPath?: string;
    fileSize?: number;
    format?: string;
    quality?: string;
    thumbnailPath?: string;
    subtitlePaths?: string[];
    metadataPath?: string;
    duration?: number;
    error?: string;
}
/**
 * Service for interacting with yt-dlp
 */
export declare class YtdlpService {
    private config;
    private activeDownloads;
    /**
     * Creates a new instance of YtdlpService
     */
    constructor(config?: Partial<YtdlpConfig>);
    /**
     * Ensure required directories exist
     */
    private ensureDirectories;
    /**
     * Build yt-dlp command arguments based on quality profile and options
     * @param url YouTube URL to download
     * @param outputPath Path to save the output
     * @param profileName Quality profile name to use
     * @param options Additional options
     * @returns Array of command arguments
     */
    private buildCommandArgs;
    /**
     * Download a video using yt-dlp
     * @param url YouTube URL to download
     * @param outputPath Path to save the output
     * @param profileName Quality profile name to use
     * @param options Additional options
     * @param jobId ID of the download job
     * @param videoId ID of the video
     * @param userId ID of the user
     * @returns Promise resolving to download result
     */
    downloadVideo(url: string, outputPath: string, profileName: string | undefined, options: Record<string, any> | undefined, jobId: string, videoId: string, userId: string): Promise<DownloadResult>;
    /**
     * Cancel an active download
     * @param url YouTube URL of the download to cancel
     * @returns True if download was canceled, false if not found
     */
    cancelDownload(url: string): boolean;
    /**
     * Get a list of active downloads
     * @returns Map of active downloads
     */
    getActiveDownloads(): Map<string, {
        jobId: string;
        videoId: string;
        userId: string;
        startTime: Date;
        progress: DownloadProgress | null;
    }>;
    /**
     * Get information about a video without downloading
     * @param url YouTube URL to get information about
     * @returns Promise resolving to video metadata
     */
    getVideoInfo(url: string): Promise<Record<string, any>>;
    /**
     * Get available formats for a video
     * @param url YouTube URL to get formats for
     * @returns Promise resolving to list of available formats
     */
    getAvailableFormats(url: string): Promise<any[]>;
    /**
     * Broadcast progress update through WebSocket
     * @param jobId ID of the download job
     * @param videoId ID of the video
     * @param userId ID of the user
     * @param progress Download progress information
     */
    private broadcastProgressUpdate;
    /**
     * Generate a permanent URL for a downloaded video
     * @param videoDocument The video document
     * @returns Promise resolving to public URL
     */
    generateVideoUrl(videoDocument: VideoDocument): Promise<string>;
    /**
     * Generate a temporary URL for a downloaded video with expiration
     * @param videoDocument The video document
     * @param expirySeconds Expiration time in seconds
     * @returns Promise resolving to signed URL
     */
    generateTemporaryVideoUrl(videoDocument: VideoDocument, expirySeconds?: number): Promise<string>;
    /**
     * Create a copy of current yt-dlp config
     * @returns Copy of the current configuration
     */
    getConfig(): YtdlpConfig;
    /**
     * Update yt-dlp configuration
     * @param config New configuration to apply
     */
    updateConfig(config: Partial<YtdlpConfig>): void;
}
export declare const ytdlpService: YtdlpService;
