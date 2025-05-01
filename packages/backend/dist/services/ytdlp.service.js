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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ytdlpService = exports.YtdlpService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const websocket_service_1 = require("./websocket.service");
const storage_service_1 = require("./storage.service");
/**
 * Service for interacting with yt-dlp
 */
class YtdlpService {
    config;
    activeDownloads = new Map();
    /**
     * Creates a new instance of YtdlpService
     */
    constructor(config) {
        // Default configuration
        this.config = {
            outputTemplate: '%(id)s-%(upload_date)s-%(title)s.%(ext)s',
            outputDirectory: path.join(process.cwd(), 'downloads'),
            tempDirectory: path.join(process.cwd(), 'temp'),
            maxConcurrentDownloads: 3,
            retryCount: 3,
            defaultQualityProfile: 'standard',
            qualityProfiles: {
                standard: {
                    name: 'Standard',
                    description: 'Standard quality (720p)',
                    format: 'mp4',
                    resolution: '720',
                    videoCodec: 'h264',
                    audioCodec: 'aac',
                    audioBitrate: '128K',
                    extractThumbnail: true,
                    extractSubtitles: true,
                    subtitleLanguages: ['en'],
                    extractMetadata: true,
                },
                high: {
                    name: 'High',
                    description: 'High quality (1080p)',
                    format: 'mp4',
                    resolution: '1080',
                    videoCodec: 'h264',
                    audioCodec: 'aac',
                    audioBitrate: '192K',
                    extractThumbnail: true,
                    extractSubtitles: true,
                    subtitleLanguages: ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'ru', 'zh-Hans'],
                    extractMetadata: true,
                },
                audio: {
                    name: 'Audio Only',
                    description: 'Audio only (mp3)',
                    format: 'mp3',
                    audioCodec: 'mp3',
                    audioBitrate: '192K',
                    extractThumbnail: true,
                    extractMetadata: true,
                    extractSubtitles: false,
                },
                archival: {
                    name: 'Archival',
                    description: 'Best quality for archiving',
                    format: 'bestvideo*+bestaudio',
                    extractThumbnail: true,
                    extractSubtitles: true,
                    subtitleLanguages: ['all'],
                    extractMetadata: true,
                },
                minimal: {
                    name: 'Minimal',
                    description: 'Minimal quality (480p)',
                    format: 'mp4',
                    resolution: '480',
                    videoCodec: 'h264',
                    audioCodec: 'aac',
                    audioBitrate: '96K',
                    extractThumbnail: true,
                    extractSubtitles: false,
                    extractMetadata: true,
                    limitBandwidth: '500K',
                },
            },
            includeAds: false,
            includeComments: false,
            downloadDescription: true,
            extractChapters: true,
            embedThumbnail: true,
            embedMetadata: true,
            convertToMp4: true,
            downloadPlaylist: false,
            downloadAll: false,
            includeFormats: [],
            excludeFormats: [],
            additionalOptions: [],
        };
        // Override defaults with provided configuration
        if (config) {
            this.config = {
                ...this.config,
                ...config,
                qualityProfiles: {
                    ...this.config.qualityProfiles,
                    ...(config.qualityProfiles || {}),
                }
            };
        }
        // Ensure directories exist
        this.ensureDirectories();
        (0, logger_1.logInfo)(`YtdlpService initialized with ${Object.keys(this.config.qualityProfiles).length} quality profiles`);
    }
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        try {
            if (!fs.existsSync(this.config.outputDirectory)) {
                fs.mkdirSync(this.config.outputDirectory, { recursive: true });
                (0, logger_1.logDebug)(`Created output directory: ${this.config.outputDirectory}`);
            }
            if (!fs.existsSync(this.config.tempDirectory)) {
                fs.mkdirSync(this.config.tempDirectory, { recursive: true });
                (0, logger_1.logDebug)(`Created temp directory: ${this.config.tempDirectory}`);
            }
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create directories', error);
        }
    }
    /**
     * Build yt-dlp command arguments based on quality profile and options
     * @param url YouTube URL to download
     * @param outputPath Path to save the output
     * @param profileName Quality profile name to use
     * @param options Additional options
     * @returns Array of command arguments
     */
    buildCommandArgs(url, outputPath, profileName = this.config.defaultQualityProfile, options = {}) {
        const profile = this.config.qualityProfiles[profileName] || this.config.qualityProfiles[this.config.defaultQualityProfile];
        const args = [
            url,
            '-o', path.join(outputPath, this.config.outputTemplate),
            '--force-overwrites',
            '--no-playlist', // Don't download playlists by default
            '--no-continue', // Don't use .part files
            '--newline', // Ensure each progress update is on a new line
        ];
        // Format selection
        if (profile.format) {
            args.push('-f', profile.format);
            // Resolution constraint
            if (profile.resolution) {
                const formatModifier = args.findIndex(arg => arg === '-f');
                if (formatModifier !== -1) {
                    args[formatModifier + 1] += `[height<=?${profile.resolution}]`;
                }
            }
        }
        // Extract thumbnails
        if (profile.extractThumbnail) {
            args.push('--write-thumbnail');
            // Convert thumbnail to jpg if embedding
            if (this.config.embedThumbnail) {
                args.push('--convert-thumbnails', 'jpg');
            }
        }
        // Extract subtitles
        if (profile.extractSubtitles) {
            if (profile.subtitleLanguages && profile.subtitleLanguages.length > 0) {
                if (profile.subtitleLanguages.includes('all')) {
                    args.push('--all-subs');
                }
                else {
                    args.push('--sub-langs', profile.subtitleLanguages.join(','));
                }
                args.push('--write-auto-subs');
            }
            else {
                args.push('--write-subs');
            }
            // Convert subtitles to srt
            args.push('--convert-subs', 'srt');
        }
        // Extract metadata
        if (profile.extractMetadata || this.config.embedMetadata) {
            args.push('--write-info-json');
        }
        // Extract description
        if (this.config.downloadDescription) {
            args.push('--write-description');
        }
        // Extract chapters
        if (this.config.extractChapters) {
            args.push('--write-chapters');
        }
        // Embed thumbnail
        if (this.config.embedThumbnail) {
            args.push('--embed-thumbnail');
        }
        // Embed metadata
        if (this.config.embedMetadata) {
            args.push('--embed-metadata');
        }
        // Convert to MP4
        if (this.config.convertToMp4 && profile.format !== 'mp3' && profile.format !== 'opus' && profile.format !== 'vorbis' && profile.format !== 'wav') {
            args.push('--merge-output-format', 'mp4');
        }
        // Rate limiting
        if (profile.limitBandwidth) {
            args.push('--limit-rate', profile.limitBandwidth);
        }
        else if (this.config.rateLimitKbps) {
            args.push('--limit-rate', `${this.config.rateLimitKbps}K`);
        }
        // Retry options
        args.push('--retries', this.config.retryCount.toString());
        // User agent
        if (this.config.userAgent) {
            args.push('--user-agent', this.config.userAgent);
        }
        // Proxy
        if (this.config.useProxy && this.config.proxyUrl) {
            args.push('--proxy', this.config.proxyUrl);
        }
        // Cookies
        if (this.config.cookiesFile) {
            args.push('--cookies', this.config.cookiesFile);
        }
        // Additional options from config
        if (this.config.additionalOptions.length > 0) {
            args.push(...this.config.additionalOptions);
        }
        // Additional options from function call
        if (options && Object.keys(options).length > 0) {
            for (const [key, value] of Object.entries(options)) {
                if (value === true) {
                    args.push(`--${key}`);
                }
                else if (value !== false && value !== undefined && value !== null) {
                    args.push(`--${key}`, value.toString());
                }
            }
        }
        return args;
    }
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
    async downloadVideo(url, outputPath, profileName = this.config.defaultQualityProfile, options = {}, jobId, videoId, userId) {
        return new Promise((resolve, reject) => {
            try {
                // Check if we're already downloading this URL
                if (this.activeDownloads.has(url)) {
                    const error = `Already downloading: ${url}`;
                    (0, logger_1.logError)(error);
                    return reject(new Error(error));
                }
                // Build command arguments
                const args = this.buildCommandArgs(url, outputPath, profileName, options);
                (0, logger_1.logInfo)(`Starting download for ${url} with profile ${profileName}:`, args.join(' '));
                // Spawn yt-dlp process
                const ytdlpProcess = (0, child_process_1.spawn)('yt-dlp', args, {
                    stdio: ['ignore', 'pipe', 'pipe'],
                });
                // Initialize result object
                const result = {
                    success: false,
                };
                // Store active download info
                this.activeDownloads.set(url, {
                    process: ytdlpProcess,
                    jobId,
                    videoId,
                    userId,
                    startTime: new Date(),
                    progress: null
                });
                // Process stdout for progress updates
                let outputPathMatch = null;
                let outputData = '';
                ytdlpProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    outputData += output;
                    // Check for file output path in the output
                    const filePathRegex = /\[download\] Destination: (.+)/;
                    const filePathMatch = output.match(filePathRegex);
                    if (filePathMatch && filePathMatch[1]) {
                        outputPathMatch = filePathMatch;
                    }
                    // Check for progress in the output
                    // Example: [download]   5.7% of ~52.28MiB at  1.25MiB/s ETA 00:39
                    const progressRegex = /\[download\]\s+(\d+\.\d+)%\s+of\s+~?(\d+\.\d+)?(MiB|GiB|KiB|B)?\s+at\s+(\d+\.\d+)?(MiB|GiB|KiB|B)\/s\s+ETA\s+(\d+):(\d+)/;
                    const progressMatch = output.match(progressRegex);
                    if (progressMatch) {
                        const percent = parseFloat(progressMatch[1]);
                        const totalSize = progressMatch[2] && progressMatch[3] ? `${progressMatch[2]}${progressMatch[3]}` : 'Unknown';
                        const speed = progressMatch[4] && progressMatch[5] ? `${progressMatch[4]}${progressMatch[5]}/s` : 'Unknown';
                        const etaMinutes = progressMatch[6] ? parseInt(progressMatch[6]) : 0;
                        const etaSeconds = progressMatch[7] ? parseInt(progressMatch[7]) : 0;
                        const eta = `${etaMinutes}:${etaSeconds.toString().padStart(2, '0')}`;
                        // Calculate downloaded size
                        let downloadedSize = 'Unknown';
                        if (progressMatch[2] && progressMatch[3] && percent) {
                            const totalSizeNum = parseFloat(progressMatch[2]);
                            const totalSizeUnit = progressMatch[3];
                            const downloadedSizeNum = totalSizeNum * (percent / 100);
                            downloadedSize = `${downloadedSizeNum.toFixed(2)}${totalSizeUnit}`;
                        }
                        const progress = {
                            percent,
                            totalSize,
                            downloadedSize,
                            speed,
                            eta,
                            timestamp: new Date(),
                        };
                        const downloadInfo = this.activeDownloads.get(url);
                        if (downloadInfo) {
                            downloadInfo.progress = progress;
                            // Broadcast progress update
                            this.broadcastProgressUpdate(downloadInfo.jobId, downloadInfo.videoId, downloadInfo.userId, progress);
                        }
                    }
                });
                // Process stderr for errors
                let errorData = '';
                ytdlpProcess.stderr.on('data', (data) => {
                    const error = data.toString();
                    errorData += error;
                    (0, logger_1.logError)(`yt-dlp error for ${url}:`, error);
                });
                // Handle process completion
                ytdlpProcess.on('close', async (code) => {
                    this.activeDownloads.delete(url);
                    if (code === 0) {
                        (0, logger_1.logInfo)(`Download completed for ${url} with exit code ${code}`);
                        // Set output path from stdout if possible
                        let finalOutputPath = '';
                        if (outputPathMatch && outputPathMatch[1]) {
                            finalOutputPath = outputPathMatch[1];
                            // Handle file extension changes due to format conversion
                            const dirName = path.dirname(finalOutputPath);
                            const baseName = path.basename(finalOutputPath, path.extname(finalOutputPath));
                            // Check for merged file if format is 'bestvideo+bestaudio'
                            const potentialMergedFiles = fs.readdirSync(dirName)
                                .filter(file => file.startsWith(baseName) &&
                                !file.endsWith('.description') &&
                                !file.endsWith('.info.json') &&
                                !file.endsWith('.jpg') &&
                                !file.endsWith('.png') &&
                                !file.endsWith('.webp') &&
                                !file.endsWith('.srt'));
                            if (potentialMergedFiles.length > 0) {
                                finalOutputPath = path.join(dirName, potentialMergedFiles[0]);
                            }
                        }
                        else {
                            // Try to determine the output file from the directory listing
                            try {
                                const files = fs.readdirSync(outputPath);
                                // Get the most recently modified video file
                                const videoFiles = files.filter(file => !file.endsWith('.description') &&
                                    !file.endsWith('.info.json') &&
                                    !file.endsWith('.jpg') &&
                                    !file.endsWith('.png') &&
                                    !file.endsWith('.webp') &&
                                    !file.endsWith('.srt'));
                                if (videoFiles.length > 0) {
                                    const mostRecentFile = videoFiles.reduce((latest, file) => {
                                        const fileStat = fs.statSync(path.join(outputPath, file));
                                        const latestStat = fs.statSync(path.join(outputPath, latest));
                                        return fileStat.mtime > latestStat.mtime ? file : latest;
                                    });
                                    finalOutputPath = path.join(outputPath, mostRecentFile);
                                }
                            }
                            catch (error) {
                                (0, logger_1.logError)('Error determining output file:', error);
                            }
                        }
                        if (finalOutputPath) {
                            result.outputPath = finalOutputPath;
                            // Get file information
                            try {
                                const fileStat = fs.statSync(finalOutputPath);
                                result.fileSize = fileStat.size;
                                // Get format and quality from file extension
                                result.format = path.extname(finalOutputPath).slice(1).toLowerCase();
                                // Get quality profile
                                const profile = this.config.qualityProfiles[profileName];
                                if (profile) {
                                    result.quality = profile.resolution ? `${profile.resolution}p` : profile.name;
                                }
                                // Handle associated files
                                const dirName = path.dirname(finalOutputPath);
                                const baseName = path.basename(finalOutputPath, path.extname(finalOutputPath));
                                // Check for thumbnail
                                const thumbnailFormats = ['.jpg', '.png', '.webp'];
                                for (const format of thumbnailFormats) {
                                    const thumbnailPath = path.join(dirName, `${baseName}${format}`);
                                    if (fs.existsSync(thumbnailPath)) {
                                        result.thumbnailPath = thumbnailPath;
                                        break;
                                    }
                                }
                                // Check for subtitles
                                const subtitlePaths = [];
                                try {
                                    const files = fs.readdirSync(dirName);
                                    const subtitleFiles = files.filter(file => file.startsWith(baseName) && file.endsWith('.srt'));
                                    subtitleFiles.forEach(file => {
                                        subtitlePaths.push(path.join(dirName, file));
                                    });
                                    if (subtitlePaths.length > 0) {
                                        result.subtitlePaths = subtitlePaths;
                                    }
                                }
                                catch (error) {
                                    (0, logger_1.logError)('Error finding subtitle files:', error);
                                }
                                // Check for metadata file
                                const metadataPath = path.join(dirName, `${baseName}.info.json`);
                                if (fs.existsSync(metadataPath)) {
                                    result.metadataPath = metadataPath;
                                    // Extract duration from metadata if possible
                                    try {
                                        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                                        if (metadata.duration) {
                                            result.duration = metadata.duration;
                                        }
                                    }
                                    catch (error) {
                                        (0, logger_1.logError)('Error reading metadata file:', error);
                                    }
                                }
                                result.success = true;
                            }
                            catch (error) {
                                (0, logger_1.logError)('Error getting file information:', error);
                                result.error = `Error getting file information: ${error.message}`;
                            }
                        }
                        else {
                            result.error = 'Output file not found';
                        }
                    }
                    else {
                        (0, logger_1.logError)(`Download failed for ${url} with exit code ${code}`);
                        result.success = false;
                        result.error = errorData || `Process exited with code ${code}`;
                    }
                    resolve(result);
                });
                // Handle process error
                ytdlpProcess.on('error', (error) => {
                    this.activeDownloads.delete(url);
                    (0, logger_1.logError)(`Process error for ${url}:`, error);
                    result.success = false;
                    result.error = error.message;
                    reject(error);
                });
            }
            catch (error) {
                (0, logger_1.logError)(`Exception during download for ${url}:`, error);
                reject(error);
            }
        });
    }
    /**
     * Cancel an active download
     * @param url YouTube URL of the download to cancel
     * @returns True if download was canceled, false if not found
     */
    cancelDownload(url) {
        const download = this.activeDownloads.get(url);
        if (download && download.process) {
            try {
                // On Windows, use taskkill for more reliable termination
                if (process.platform === 'win32') {
                    (0, child_process_1.spawn)('taskkill', ['/pid', download.process.pid, '/f', '/t']);
                }
                else {
                    download.process.kill('SIGTERM');
                }
                this.activeDownloads.delete(url);
                (0, logger_1.logInfo)(`Download canceled for ${url}`);
                return true;
            }
            catch (error) {
                (0, logger_1.logError)(`Failed to cancel download for ${url}:`, error);
                return false;
            }
        }
        return false;
    }
    /**
     * Get a list of active downloads
     * @returns Map of active downloads
     */
    getActiveDownloads() {
        // Return copy of active downloads without the process objects
        const result = new Map();
        this.activeDownloads.forEach((download, url) => {
            result.set(url, {
                jobId: download.jobId,
                videoId: download.videoId,
                userId: download.userId,
                startTime: download.startTime,
                progress: download.progress,
            });
        });
        return result;
    }
    /**
     * Get information about a video without downloading
     * @param url YouTube URL to get information about
     * @returns Promise resolving to video metadata
     */
    async getVideoInfo(url) {
        return new Promise((resolve, reject) => {
            try {
                const args = [
                    url,
                    '--dump-json',
                    '--no-playlist',
                    '--skip-download',
                ];
                const ytdlpProcess = (0, child_process_1.spawn)('yt-dlp', args);
                let jsonData = '';
                let errorData = '';
                ytdlpProcess.stdout.on('data', (data) => {
                    jsonData += data.toString();
                });
                ytdlpProcess.stderr.on('data', (data) => {
                    errorData += data.toString();
                });
                ytdlpProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const info = JSON.parse(jsonData);
                            resolve(info);
                        }
                        catch (error) {
                            reject(new Error(`Failed to parse video info: ${error.message}`));
                        }
                    }
                    else {
                        reject(new Error(`Failed to get video info: ${errorData}`));
                    }
                });
                ytdlpProcess.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Get available formats for a video
     * @param url YouTube URL to get formats for
     * @returns Promise resolving to list of available formats
     */
    async getAvailableFormats(url) {
        return new Promise((resolve, reject) => {
            try {
                const args = [
                    url,
                    '--list-formats',
                    '--no-playlist',
                ];
                const ytdlpProcess = (0, child_process_1.spawn)('yt-dlp', args);
                let outputData = '';
                let errorData = '';
                ytdlpProcess.stdout.on('data', (data) => {
                    outputData += data.toString();
                });
                ytdlpProcess.stderr.on('data', (data) => {
                    errorData += data.toString();
                });
                ytdlpProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            // Parse format list from output
                            const formatLines = outputData.split('\n').filter(line => line.trim().match(/^\d+/));
                            const formats = formatLines.map(line => {
                                const parts = line.trim().split(/\s+/);
                                const formatId = parts[0];
                                const ext = parts[1] || '';
                                const resolution = parts[2] || '';
                                const note = parts.slice(3).join(' ');
                                return {
                                    formatId,
                                    ext,
                                    resolution,
                                    note
                                };
                            });
                            resolve(formats);
                        }
                        catch (error) {
                            reject(new Error(`Failed to parse format list: ${error.message}`));
                        }
                    }
                    else {
                        reject(new Error(`Failed to get format list: ${errorData}`));
                    }
                });
                ytdlpProcess.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Broadcast progress update through WebSocket
     * @param jobId ID of the download job
     * @param videoId ID of the video
     * @param userId ID of the user
     * @param progress Download progress information
     */
    broadcastProgressUpdate(jobId, videoId, userId, progress) {
        websocket_service_1.websocketService.broadcastDownloadUpdate({
            jobId,
            videoId,
            progress: progress.percent,
            status: 'processing',
            timestamp: new Date(),
            message: `Downloading at ${progress.speed}, ETA: ${progress.eta}`,
        });
    }
    /**
     * Generate a permanent URL for a downloaded video
     * @param videoDocument The video document
     * @returns Promise resolving to public URL
     */
    async generateVideoUrl(videoDocument) {
        if (!videoDocument.filePath) {
            throw new Error('Video has no file path');
        }
        return await storage_service_1.storageService.getPublicUrl(videoDocument.filePath);
    }
    /**
     * Generate a temporary URL for a downloaded video with expiration
     * @param videoDocument The video document
     * @param expirySeconds Expiration time in seconds
     * @returns Promise resolving to signed URL
     */
    async generateTemporaryVideoUrl(videoDocument, expirySeconds = 3600) {
        if (!videoDocument.filePath) {
            throw new Error('Video has no file path');
        }
        return await storage_service_1.storageService.getSignedUrl(videoDocument.filePath, expirySeconds);
    }
    /**
     * Create a copy of current yt-dlp config
     * @returns Copy of the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update yt-dlp configuration
     * @param config New configuration to apply
     */
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config,
            qualityProfiles: {
                ...this.config.qualityProfiles,
                ...(config.qualityProfiles || {}),
            }
        };
        (0, logger_1.logInfo)('Updated YtdlpService configuration');
    }
}
exports.YtdlpService = YtdlpService;
// Create singleton instance
exports.ytdlpService = new YtdlpService();
//# sourceMappingURL=ytdlp.service.js.map