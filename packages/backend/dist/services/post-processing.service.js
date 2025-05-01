"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postProcessingService = exports.PostProcessingService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const storage_service_1 = require("./storage.service");
const stream_1 = require("stream");
const download_queue_service_1 = require("./download-queue.service");
// Promisify fs functions
const readFile = (0, util_1.promisify)(fs.readFile);
const writeFile = (0, util_1.promisify)(fs.writeFile);
const mkdir = (0, util_1.promisify)(fs.mkdir);
const stat = (0, util_1.promisify)(fs.stat);
const rename = (0, util_1.promisify)(fs.rename);
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
/**
 * Service for post-processing downloaded files
 */
class PostProcessingService {
    config;
    activeProcesses = new Map();
    /**
     * Creates a new instance of PostProcessingService
     */
    constructor(config) {
        // Default configuration
        this.config = {
            enabled: true,
            ffmpegPath: 'ffmpeg',
            ffprobePath: 'ffprobe',
            maxConcurrentProcesses: 2,
            defaultMetadataOptions: {
                extractThumbnail: true,
                extractSubtitles: true,
                extractChapters: true,
                extractDescription: true,
                extractComments: false,
                includeRawMetadata: true,
            },
            defaultVideoConversionOptions: {
                targetFormat: 'mp4',
                videoCodec: 'libx264',
                audioCodec: 'aac',
                preserveOriginal: true,
            },
            defaultAudioConversionOptions: {
                targetFormat: 'mp3',
                audioBitrate: '192k',
                preserveOriginal: true,
            },
            defaultFileOrganizationOptions: {
                structureTemplate: '{channelName}/{playlistName}/{videoTitle}',
                renameFiles: true,
                filenameTemplate: '{videoId}-{title}',
                createMetadataFile: true,
                createNfoFile: false,
            },
            tempDirectory: path.join(process.cwd(), 'temp'),
            processAutomatically: true,
            ...config
        };
        // Ensure temp directory exists
        this.ensureTempDirectory();
        (0, logger_1.logInfo)('PostProcessingService initialized with config:', this.config);
        // Listen for download job completion events to automatically process
        this.setupEventListeners();
    }
    /**
     * Ensure the temporary directory exists
     */
    ensureTempDirectory() {
        try {
            if (!fs.existsSync(this.config.tempDirectory)) {
                fs.mkdirSync(this.config.tempDirectory, { recursive: true });
                (0, logger_1.logDebug)(`Created temp directory: ${this.config.tempDirectory}`);
            }
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create temp directory:', error);
        }
    }
    /**
     * Set up event listeners for download job events
     */
    setupEventListeners() {
        if (this.config.processAutomatically) {
            download_queue_service_1.downloadQueueService.on(download_queue_service_1.DownloadQueueService.EVENTS.JOB_COMPLETED, async (job, result) => {
                try {
                    if (result.success && result.outputPath) {
                        (0, logger_1.logInfo)(`Auto-processing completed download job: ${job._id}`);
                        await this.processDownloadedFile(result.outputPath, job, result);
                    }
                }
                catch (error) {
                    (0, logger_1.logError)(`Error auto-processing download job ${job._id}:`, error);
                }
            });
        }
    }
    /**
     * Process a downloaded file
     * @param filePath Path to the downloaded file
     * @param job The download job document
     * @param downloadResult The download result
     * @param options Processing options
     * @returns Processing result
     */
    async processDownloadedFile(filePath, job, downloadResult, options) {
        if (!this.config.enabled) {
            return { success: false, errorMessage: 'Post-processing is disabled' };
        }
        const jobId = job._id.toString();
        const videoId = job.videoId.toString();
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File does not exist: ${filePath}`);
            }
            // Determine if this is an audio-only file
            const isAudioOnly = path.extname(filePath).toLowerCase() === '.mp3' ||
                path.extname(filePath).toLowerCase() === '.opus' ||
                path.extname(filePath).toLowerCase() === '.aac' ||
                path.extname(filePath).toLowerCase() === '.flac' ||
                path.extname(filePath).toLowerCase() === '.wav';
            // Get processing options
            const metadataOptions = {
                ...this.config.defaultMetadataOptions,
                ...options?.metadataOptions
            };
            const videoConversionOptions = {
                ...this.config.defaultVideoConversionOptions,
                ...options?.videoConversionOptions
            };
            const audioConversionOptions = {
                ...this.config.defaultAudioConversionOptions,
                ...options?.audioConversionOptions
            };
            const fileOrganizationOptions = {
                ...this.config.defaultFileOrganizationOptions,
                ...options?.fileOrganizationOptions
            };
            // Start with the download result
            const result = {
                success: true,
                outputPath: filePath,
                thumbnailPath: downloadResult.thumbnailPath,
                metadataPath: downloadResult.metadataPath,
                subtitlePaths: downloadResult.subtitlePaths,
                duration: downloadResult.duration,
            };
            // Extract metadata from the file using ffprobe
            const metadata = await this.extractMetadata(filePath);
            result.duration = metadata.duration;
            // Extract thumbnail if not already extracted
            if (metadataOptions.extractThumbnail && !result.thumbnailPath) {
                try {
                    const thumbnailPath = await this.extractThumbnail(filePath, path.dirname(filePath));
                    result.thumbnailPath = thumbnailPath;
                }
                catch (error) {
                    (0, logger_1.logError)(`Error extracting thumbnail for ${filePath}:`, error);
                }
            }
            // Convert video format if needed
            if (!isAudioOnly && this.shouldConvertVideoFormat(filePath, videoConversionOptions)) {
                try {
                    const convertedPath = await this.convertVideoFormat(filePath, videoConversionOptions);
                    if (convertedPath) {
                        result.outputPath = convertedPath;
                    }
                }
                catch (error) {
                    (0, logger_1.logError)(`Error converting video format for ${filePath}:`, error);
                }
            }
            // Convert audio format if needed (for audio-only files)
            if (isAudioOnly && this.shouldConvertAudioFormat(filePath, audioConversionOptions)) {
                try {
                    const convertedPath = await this.convertAudioFormat(filePath, audioConversionOptions);
                    if (convertedPath) {
                        result.outputPath = convertedPath;
                    }
                }
                catch (error) {
                    (0, logger_1.logError)(`Error converting audio format for ${filePath}:`, error);
                }
            }
            // Create rich metadata files if needed
            if (fileOrganizationOptions.createMetadataFile) {
                try {
                    const metadataFilePath = await this.createRichMetadataFile(filePath, metadata, job);
                    result.metadataPath = metadataFilePath;
                }
                catch (error) {
                    (0, logger_1.logError)(`Error creating metadata file for ${filePath}:`, error);
                }
            }
            // Extract chapters if requested
            if (metadataOptions.extractChapters && metadata.chapters && metadata.chapters.length > 0) {
                result.chapters = metadata.chapters;
                // Create chapters file
                try {
                    const chaptersPath = path.join(path.dirname(filePath), `${path.basename(filePath, path.extname(filePath))}-chapters.json`);
                    await writeFile(chaptersPath, JSON.stringify(metadata.chapters, null, 2), 'utf8');
                }
                catch (error) {
                    (0, logger_1.logError)(`Error writing chapters file for ${filePath}:`, error);
                }
            }
            // Update video document with processed information
            await this.updateVideoDocument(videoId, result);
            (0, logger_1.logInfo)(`Post-processing completed for ${filePath}`);
            return result;
        }
        catch (error) {
            (0, logger_1.logError)(`Error processing file ${filePath}:`, error);
            return {
                success: false,
                errorMessage: error.message || 'Unknown error during post-processing',
            };
        }
    }
    /**
     * Extract metadata from a media file using ffprobe
     * @param filePath Path to the media file
     * @returns Metadata information
     */
    async extractMetadata(filePath) {
        return new Promise((resolve, reject) => {
            const args = [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                '-show_chapters',
                filePath
            ];
            const ffprobe = (0, child_process_1.spawn)(this.config.ffprobePath, args);
            let stdout = '';
            let stderr = '';
            ffprobe.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            ffprobe.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            ffprobe.on('close', (code) => {
                if (code === 0) {
                    try {
                        const metadata = JSON.parse(stdout);
                        // Extract duration
                        let duration = 0;
                        if (metadata.format && metadata.format.duration) {
                            duration = parseFloat(metadata.format.duration);
                        }
                        resolve({
                            ...metadata,
                            duration,
                        });
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse metadata: ${error}`));
                    }
                }
                else {
                    reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
                }
            });
            ffprobe.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Extract a thumbnail from a video file
     * @param filePath Path to the video file
     * @param outputDir Directory to save the thumbnail
     * @returns Path to the extracted thumbnail
     */
    async extractThumbnail(filePath, outputDir) {
        const basename = path.basename(filePath, path.extname(filePath));
        const thumbnailPath = path.join(outputDir, `${basename}.jpg`);
        return new Promise((resolve, reject) => {
            // Use ffmpeg to extract a thumbnail from the middle of the video
            const args = [
                '-i', filePath,
                '-ss', '00:00:05', // 5 seconds in
                '-frames:v', '1',
                '-vf', 'scale=640:-1', // Resize to 640px width
                '-q:v', '2', // High quality
                thumbnailPath
            ];
            const ffmpeg = (0, child_process_1.spawn)(this.config.ffmpegPath, args);
            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(thumbnailPath);
                }
                else {
                    // Try again with the beginning of the video
                    const retryArgs = [
                        '-i', filePath,
                        '-frames:v', '1',
                        '-vf', 'scale=640:-1',
                        '-q:v', '2',
                        thumbnailPath
                    ];
                    const retryFfmpeg = (0, child_process_1.spawn)(this.config.ffmpegPath, retryArgs);
                    let retryStderr = '';
                    retryFfmpeg.stderr.on('data', (data) => {
                        retryStderr += data.toString();
                    });
                    retryFfmpeg.on('close', (retryCode) => {
                        if (retryCode === 0) {
                            resolve(thumbnailPath);
                        }
                        else {
                            reject(new Error(`Failed to extract thumbnail: ${retryStderr}`));
                        }
                    });
                    retryFfmpeg.on('error', (error) => {
                        reject(error);
                    });
                }
            });
            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Check if a video file should be converted
     * @param filePath Path to the video file
     * @param options Conversion options
     * @returns True if conversion is needed
     */
    shouldConvertVideoFormat(filePath, options) {
        const ext = path.extname(filePath).toLowerCase();
        const targetExt = `.${options.targetFormat.toLowerCase()}`;
        // If current format matches target format, no conversion needed
        if (ext === targetExt) {
            return false;
        }
        return true;
    }
    /**
     * Check if an audio file should be converted
     * @param filePath Path to the audio file
     * @param options Conversion options
     * @returns True if conversion is needed
     */
    shouldConvertAudioFormat(filePath, options) {
        const ext = path.extname(filePath).toLowerCase();
        const targetExt = `.${options.targetFormat.toLowerCase()}`;
        // If current format matches target format, no conversion needed
        if (ext === targetExt) {
            return false;
        }
        return true;
    }
    /**
     * Convert video to a different format
     * @param filePath Path to the video file
     * @param options Conversion options
     * @returns Path to the converted video
     */
    async convertVideoFormat(filePath, options) {
        const basename = path.basename(filePath, path.extname(filePath));
        const outputPath = path.join(path.dirname(filePath), `${basename}.${options.targetFormat}`);
        return new Promise((resolve, reject) => {
            const args = [
                '-i', filePath,
                '-c:v', options.videoCodec,
                '-c:a', options.audioCodec,
            ];
            // Add resolution if specified
            if (options.resolution) {
                args.push('-vf', `scale=${options.resolution}:-1`);
            }
            // Add video bitrate if specified
            if (options.videoBitrate) {
                args.push('-b:v', options.videoBitrate);
            }
            // Add audio bitrate if specified
            if (options.audioBitrate) {
                args.push('-b:a', options.audioBitrate);
            }
            // Copy subtitles if present
            args.push('-c:s', 'copy');
            // Add output path
            args.push(outputPath);
            const ffmpeg = (0, child_process_1.spawn)(this.config.ffmpegPath, args);
            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    // Delete original file if not preserving
                    if (!options.preserveOriginal) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                (0, logger_1.logError)(`Failed to delete original file ${filePath}:`, err);
                            }
                        });
                    }
                    resolve(outputPath);
                }
                else {
                    reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
                }
            });
            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Convert audio to a different format
     * @param filePath Path to the audio file
     * @param options Conversion options
     * @returns Path to the converted audio
     */
    async convertAudioFormat(filePath, options) {
        const basename = path.basename(filePath, path.extname(filePath));
        const outputPath = path.join(path.dirname(filePath), `${basename}.${options.targetFormat}`);
        return new Promise((resolve, reject) => {
            const args = [
                '-i', filePath,
            ];
            // Set codec based on target format
            switch (options.targetFormat) {
                case 'mp3':
                    args.push('-c:a', 'libmp3lame');
                    break;
                case 'opus':
                    args.push('-c:a', 'libopus');
                    break;
                case 'aac':
                    args.push('-c:a', 'aac');
                    break;
                case 'flac':
                    args.push('-c:a', 'flac');
                    break;
                case 'wav':
                    args.push('-c:a', 'pcm_s16le');
                    break;
            }
            // Add audio bitrate if specified
            if (options.audioBitrate) {
                args.push('-b:a', options.audioBitrate);
            }
            // Add output path
            args.push(outputPath);
            const ffmpeg = (0, child_process_1.spawn)(this.config.ffmpegPath, args);
            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    // Delete original file if not preserving
                    if (!options.preserveOriginal) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                (0, logger_1.logError)(`Failed to delete original file ${filePath}:`, err);
                            }
                        });
                    }
                    resolve(outputPath);
                }
                else {
                    reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
                }
            });
            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Create a rich metadata file
     * @param filePath Path to the media file
     * @param metadata Extracted metadata
     * @param job Download job
     * @returns Path to the metadata file
     */
    async createRichMetadataFile(filePath, metadata, job) {
        const basename = path.basename(filePath, path.extname(filePath));
        const metadataPath = path.join(path.dirname(filePath), `${basename}-metadata.json`);
        // Combine metadata from various sources
        const richMetadata = {
            // Basic file info
            filePath,
            fileSize: (await stat(filePath)).size,
            fileCreated: (await stat(filePath)).birthtime,
            fileModified: (await stat(filePath)).mtime,
            // Media metadata from ffprobe
            duration: metadata.duration,
            format: metadata.format,
            streams: metadata.streams,
            chapters: metadata.chapters,
            // Download job info
            downloadJob: {
                id: job._id ? job._id.toString() : 'unknown',
                userId: job.userId.toString(),
                videoId: job.videoId.toString(),
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                options: job.ytdlpOptions,
            },
            // Processing timestamp
            processedAt: new Date(),
        };
        // Write metadata to file
        await writeFile(metadataPath, JSON.stringify(richMetadata, null, 2), 'utf8');
        return metadataPath;
    }
    /**
     * Update the video document with processed information
     * @param videoId Video ID
     * @param result Processing result
     */
    async updateVideoDocument(videoId, result) {
        try {
            const video = await mongoose_1.default.model('Video').findById(videoId);
            if (!video) {
                throw new Error(`Video not found: ${videoId}`);
            }
            // Update video with processed information
            if (result.outputPath) {
                video.filePath = result.outputPath;
                video.fileSize = (await stat(result.outputPath)).size;
                video.format = path.extname(result.outputPath).slice(1).toLowerCase();
            }
            if (result.thumbnailPath) {
                // Generate URL for thumbnail
                const relativePath = path.relative(storage_service_1.storageService.getProvider().getBasePath(), result.thumbnailPath);
                video.thumbnailUrl = await storage_service_1.storageService.getPublicUrl(relativePath);
            }
            if (result.duration) {
                video.duration = result.duration;
            }
            if (result.subtitlePaths && result.subtitlePaths.length > 0) {
                video.hasSubtitles = true;
                // Extract languages from subtitle filenames
                // Format is typically videoname.LANG.srt
                const subtitleLanguages = result.subtitlePaths.map(subtitlePath => {
                    const fileName = path.basename(subtitlePath);
                    const match = fileName.match(/\.([a-z]{2,3}(-[A-Z]{2})?)\.srt$/);
                    return match ? match[1] : 'unknown';
                });
                video.subtitleLanguages = subtitleLanguages.filter(lang => lang !== 'unknown');
            }
            if (result.metadataPath) {
                video.metadataPath = result.metadataPath;
            }
            await video.save();
        }
        catch (error) {
            (0, logger_1.logError)(`Error updating video document ${videoId}:`, error);
            throw error;
        }
    }
    /**
     * Get information about available ffmpeg
     * @returns FFmpeg version and codec information
     */
    async getFfmpegInfo() {
        return new Promise((resolve, reject) => {
            const ffmpeg = (0, child_process_1.spawn)(this.config.ffmpegPath, ['-version']);
            let stdout = '';
            let stderr = '';
            ffmpeg.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        version: stdout.split('\n')[0],
                        output: stdout,
                    });
                }
                else {
                    reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
                }
            });
            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Get current configuration
     * @returns A copy of the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     * @param config New configuration values
     */
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config,
            defaultMetadataOptions: {
                ...this.config.defaultMetadataOptions,
                ...(config.defaultMetadataOptions || {}),
            },
            defaultVideoConversionOptions: {
                ...this.config.defaultVideoConversionOptions,
                ...(config.defaultVideoConversionOptions || {}),
            },
            defaultAudioConversionOptions: {
                ...this.config.defaultAudioConversionOptions,
                ...(config.defaultAudioConversionOptions || {}),
            },
            defaultFileOrganizationOptions: {
                ...this.config.defaultFileOrganizationOptions,
                ...(config.defaultFileOrganizationOptions || {}),
            },
        };
        (0, logger_1.logInfo)('Updated post-processing configuration');
    }
}
exports.PostProcessingService = PostProcessingService;
// Create singleton instance
exports.postProcessingService = new PostProcessingService();
//# sourceMappingURL=post-processing.service.js.map