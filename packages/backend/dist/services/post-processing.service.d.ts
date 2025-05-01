import { DownloadJobDocument } from '../models/download-job.model';
/**
 * Metadata extraction options
 */
export interface MetadataExtractionOptions {
    extractThumbnail: boolean;
    extractSubtitles: boolean;
    extractChapters: boolean;
    extractDescription: boolean;
    extractComments: boolean;
    includeRawMetadata: boolean;
}
/**
 * Video format conversion options
 */
export interface VideoConversionOptions {
    targetFormat: 'mp4' | 'webm' | 'mkv';
    videoCodec: string;
    audioCodec: string;
    videoBitrate?: string;
    audioBitrate?: string;
    resolution?: string;
    preserveOriginal: boolean;
}
/**
 * Audio format conversion options
 */
export interface AudioConversionOptions {
    targetFormat: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
    audioBitrate?: string;
    preserveOriginal: boolean;
}
/**
 * File organization options
 */
export interface FileOrganizationOptions {
    structureTemplate: string;
    renameFiles: boolean;
    filenameTemplate: string;
    createMetadataFile: boolean;
    createNfoFile: boolean;
}
/**
 * Post-processing configuration
 */
export interface PostProcessingConfig {
    enabled: boolean;
    ffmpegPath: string;
    ffprobePath: string;
    atomicparsleyPath?: string;
    imagemagickPath?: string;
    maxConcurrentProcesses: number;
    defaultMetadataOptions: MetadataExtractionOptions;
    defaultVideoConversionOptions: VideoConversionOptions;
    defaultAudioConversionOptions: AudioConversionOptions;
    defaultFileOrganizationOptions: FileOrganizationOptions;
    tempDirectory: string;
    processAutomatically: boolean;
}
/**
 * Processing result
 */
export interface ProcessingResult {
    success: boolean;
    outputPath?: string;
    thumbnailPath?: string;
    metadataPath?: string;
    subtitlePaths?: string[];
    chapters?: any[];
    duration?: number;
    errorMessage?: string;
}
/**
 * Service for post-processing downloaded files
 */
export declare class PostProcessingService {
    private config;
    private activeProcesses;
    /**
     * Creates a new instance of PostProcessingService
     */
    constructor(config?: Partial<PostProcessingConfig>);
    /**
     * Ensure the temporary directory exists
     */
    private ensureTempDirectory;
    /**
     * Set up event listeners for download job events
     */
    private setupEventListeners;
    /**
     * Process a downloaded file
     * @param filePath Path to the downloaded file
     * @param job The download job document
     * @param downloadResult The download result
     * @param options Processing options
     * @returns Processing result
     */
    processDownloadedFile(filePath: string, job: DownloadJobDocument & {
        _id: any;
    }, downloadResult: any, options?: {
        metadataOptions?: Partial<MetadataExtractionOptions>;
        videoConversionOptions?: Partial<VideoConversionOptions>;
        audioConversionOptions?: Partial<AudioConversionOptions>;
        fileOrganizationOptions?: Partial<FileOrganizationOptions>;
    }): Promise<ProcessingResult>;
    /**
     * Extract metadata from a media file using ffprobe
     * @param filePath Path to the media file
     * @returns Metadata information
     */
    extractMetadata(filePath: string): Promise<any>;
    /**
     * Extract a thumbnail from a video file
     * @param filePath Path to the video file
     * @param outputDir Directory to save the thumbnail
     * @returns Path to the extracted thumbnail
     */
    extractThumbnail(filePath: string, outputDir: string): Promise<string>;
    /**
     * Check if a video file should be converted
     * @param filePath Path to the video file
     * @param options Conversion options
     * @returns True if conversion is needed
     */
    private shouldConvertVideoFormat;
    /**
     * Check if an audio file should be converted
     * @param filePath Path to the audio file
     * @param options Conversion options
     * @returns True if conversion is needed
     */
    private shouldConvertAudioFormat;
    /**
     * Convert video to a different format
     * @param filePath Path to the video file
     * @param options Conversion options
     * @returns Path to the converted video
     */
    convertVideoFormat(filePath: string, options: VideoConversionOptions): Promise<string>;
    /**
     * Convert audio to a different format
     * @param filePath Path to the audio file
     * @param options Conversion options
     * @returns Path to the converted audio
     */
    convertAudioFormat(filePath: string, options: AudioConversionOptions): Promise<string>;
    /**
     * Create a rich metadata file
     * @param filePath Path to the media file
     * @param metadata Extracted metadata
     * @param job Download job
     * @returns Path to the metadata file
     */
    private createRichMetadataFile;
    /**
     * Update the video document with processed information
     * @param videoId Video ID
     * @param result Processing result
     */
    private updateVideoDocument;
    /**
     * Get information about available ffmpeg
     * @returns FFmpeg version and codec information
     */
    getFfmpegInfo(): Promise<any>;
    /**
     * Get current configuration
     * @returns A copy of the current configuration
     */
    getConfig(): PostProcessingConfig;
    /**
     * Update configuration
     * @param config New configuration values
     */
    updateConfig(config: Partial<PostProcessingConfig>): void;
}
export declare const postProcessingService: PostProcessingService;
