import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { logInfo, logError, logDebug } from '../utils/logger';
import { storageService } from './storage.service';
import { VideoDocument } from '../models/video.model';
import { DownloadJobDocument } from '../models/download-job.model';
import { pipeline } from 'stream';
import { downloadQueueService, DownloadQueueService } from './download-queue.service';
import { websocketService } from './websocket.service';
import { SocketEventType } from '../types/socket.types';

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const streamPipeline = promisify(pipeline);

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
export class PostProcessingService {
  private config: PostProcessingConfig;
  private activeProcesses: Map<string, {
    process: any,
    jobId: string,
    videoId: string,
    userId: string,
    startTime: Date
  }> = new Map();
  
  /**
   * Creates a new instance of PostProcessingService
   */
  constructor(config?: Partial<PostProcessingConfig>) {
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
    
    logInfo('PostProcessingService initialized with config:', this.config);
    
    // Listen for download job completion events to automatically process
    this.setupEventListeners();
  }
  
  /**
   * Ensure the temporary directory exists
   */
  private ensureTempDirectory(): void {
    try {
      if (!fs.existsSync(this.config.tempDirectory)) {
        fs.mkdirSync(this.config.tempDirectory, { recursive: true });
        logDebug(`Created temp directory: ${this.config.tempDirectory}`);
      }
    } catch (error) {
      logError('Failed to create temp directory:', error as Error);
    }
  }
  
  /**
   * Set up event listeners for download job events
   */
  private setupEventListeners(): void {
    // Defer event binding to avoid circular dependency issues
    process.nextTick(() => {
      if (this.config.processAutomatically && downloadQueueService) {
        try {
          logDebug('Setting up download queue event listeners');
          downloadQueueService.on(DownloadQueueService.EVENTS.JOB_COMPLETED, async (job, result) => {
            try {
              if (result.success && result.outputPath) {
                logInfo(`Auto-processing completed download job: ${job._id}`);
                await this.processDownloadedFile(result.outputPath, job, result);
              }
            } catch (error) {
              logError(`Error auto-processing download job ${job._id}:`, error as Error);
            }
          });
          logDebug('Download queue event listeners set up successfully');
        } catch (error) {
          logError('Failed to set up download queue event listeners:', error as Error);
        }
      }
    });
  }
  
  /**
   * Process a downloaded file
   * @param filePath Path to the downloaded file
   * @param job The download job document
   * @param downloadResult The download result
   * @param options Processing options
   * @returns Processing result
   */
  public async processDownloadedFile(
    filePath: string,
    job: DownloadJobDocument & { _id: any },
    downloadResult: any,
    options?: {
      metadataOptions?: Partial<MetadataExtractionOptions>,
      videoConversionOptions?: Partial<VideoConversionOptions>,
      audioConversionOptions?: Partial<AudioConversionOptions>,
      fileOrganizationOptions?: Partial<FileOrganizationOptions>
    }
  ): Promise<ProcessingResult> {
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
      const result: ProcessingResult = {
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
        } catch (error) {
          logError(`Error extracting thumbnail for ${filePath}:`, error as Error);
        }
      }
      
      // Convert video format if needed
      if (!isAudioOnly && this.shouldConvertVideoFormat(filePath, videoConversionOptions)) {
        try {
          const convertedPath = await this.convertVideoFormat(
            filePath,
            videoConversionOptions
          );
          
          if (convertedPath) {
            result.outputPath = convertedPath;
          }
        } catch (error) {
          logError(`Error converting video format for ${filePath}:`, error as Error);
        }
      }
      
      // Convert audio format if needed (for audio-only files)
      if (isAudioOnly && this.shouldConvertAudioFormat(filePath, audioConversionOptions)) {
        try {
          const convertedPath = await this.convertAudioFormat(
            filePath,
            audioConversionOptions
          );
          
          if (convertedPath) {
            result.outputPath = convertedPath;
          }
        } catch (error) {
          logError(`Error converting audio format for ${filePath}:`, error as Error);
        }
      }
      
      // Create rich metadata files if needed
      if (fileOrganizationOptions.createMetadataFile) {
        try {
          const metadataFilePath = await this.createRichMetadataFile(
            filePath,
            metadata,
            job
          );
          
          result.metadataPath = metadataFilePath;
        } catch (error) {
          logError(`Error creating metadata file for ${filePath}:`, error as Error);
        }
      }
      
      // Extract chapters if requested
      if (metadataOptions.extractChapters && metadata.chapters && metadata.chapters.length > 0) {
        result.chapters = metadata.chapters;
        
        // Create chapters file
        try {
          const chaptersPath = path.join(
            path.dirname(filePath),
            `${path.basename(filePath, path.extname(filePath))}-chapters.json`
          );
          
          await writeFile(chaptersPath, JSON.stringify(metadata.chapters, null, 2), 'utf8');
        } catch (error) {
          logError(`Error writing chapters file for ${filePath}:`, error as Error);
        }
      }
      
      // Update video document with processed information
      await this.updateVideoDocument(videoId, result);
      
      logInfo(`Post-processing completed for ${filePath}`);
      return result;
    } catch (error) {
      logError(`Error processing file ${filePath}:`, error as Error);
      
      return {
        success: false,
        errorMessage: (error as Error).message || 'Unknown error during post-processing',
      };
    }
  }
  
  /**
   * Extract metadata from a media file using ffprobe
   * @param filePath Path to the media file
   * @returns Metadata information
   */
  public async extractMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        '-show_chapters',
        filePath
      ];
      
      const ffprobe = spawn(this.config.ffprobePath, args);
      
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
          } catch (error) {
            reject(new Error(`Failed to parse metadata: ${error}`));
          }
        } else {
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
  public async extractThumbnail(filePath: string, outputDir: string): Promise<string> {
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
      
      const ffmpeg = spawn(this.config.ffmpegPath, args);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(thumbnailPath);
        } else {
          // Try again with the beginning of the video
          const retryArgs = [
            '-i', filePath,
            '-frames:v', '1',
            '-vf', 'scale=640:-1',
            '-q:v', '2',
            thumbnailPath
          ];
          
          const retryFfmpeg = spawn(this.config.ffmpegPath, retryArgs);
          
          let retryStderr = '';
          
          retryFfmpeg.stderr.on('data', (data) => {
            retryStderr += data.toString();
          });
          
          retryFfmpeg.on('close', (retryCode) => {
            if (retryCode === 0) {
              resolve(thumbnailPath);
            } else {
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
  private shouldConvertVideoFormat(filePath: string, options: VideoConversionOptions): boolean {
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
  private shouldConvertAudioFormat(filePath: string, options: AudioConversionOptions): boolean {
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
  public async convertVideoFormat(
    filePath: string,
    options: VideoConversionOptions
  ): Promise<string> {
    const basename = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(
      path.dirname(filePath),
      `${basename}.${options.targetFormat}`
    );
    
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
      
      const ffmpeg = spawn(this.config.ffmpegPath, args);
      
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
                logError(`Failed to delete original file ${filePath}:`, err);
              }
            });
          }
          
          resolve(outputPath);
        } else {
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
  public async convertAudioFormat(
    filePath: string,
    options: AudioConversionOptions
  ): Promise<string> {
    const basename = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(
      path.dirname(filePath),
      `${basename}.${options.targetFormat}`
    );
    
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
      
      const ffmpeg = spawn(this.config.ffmpegPath, args);
      
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
                logError(`Failed to delete original file ${filePath}:`, err);
              }
            });
          }
          
          resolve(outputPath);
        } else {
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
  private async createRichMetadataFile(
    filePath: string,
    metadata: any,
    job: DownloadJobDocument
  ): Promise<string> {
    const basename = path.basename(filePath, path.extname(filePath));
    const metadataPath = path.join(
      path.dirname(filePath),
      `${basename}-metadata.json`
    );
    
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
  private async updateVideoDocument(videoId: string, result: ProcessingResult): Promise<void> {
    try {
      const video = await mongoose.model('Video').findById(videoId) as VideoDocument;
      
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
        const relativePath = path.relative(storageService.getProvider().getBasePath(), result.thumbnailPath);
        video.thumbnailUrl = await storageService.getPublicUrl(relativePath);
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
    } catch (error) {
      logError(`Error updating video document ${videoId}:`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get information about available ffmpeg 
   * @returns FFmpeg version and codec information
   */
  public async getFfmpegInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.config.ffmpegPath, ['-version']);
      
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
        } else {
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
  public getConfig(): PostProcessingConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   * @param config New configuration values
   */
  public updateConfig(config: Partial<PostProcessingConfig>): void {
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
    
    logInfo('Updated post-processing configuration');
  }
}

// Create singleton instance
export const postProcessingService = new PostProcessingService();