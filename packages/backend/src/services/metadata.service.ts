import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { logInfo, logError, logDebug, logWarning } from '../utils/logger';
import { storageService } from './storage.service';
import { ytdlpService } from './ytdlp.service';
import { youtubeService } from './youtube.service';
import { postProcessingService } from './post-processing.service';
import { VideoDocument } from '../models/video.model';

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

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
  // Basic video information
  id: string;
  title: string;
  description?: string;
  uploadDate?: string;
  publishedAt?: Date;
  duration?: number;
  
  // Statistics
  viewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  
  // Channel information
  channelId?: string;
  channelTitle?: string;
  channelUrl?: string;
  
  // Media information
  thumbnails?: {
    default?: string;
    medium?: string;
    high?: string;
    standard?: string;
    maxres?: string;
    local?: string; // Path to locally stored thumbnail
  };
  width?: number;
  height?: number;
  resolution?: string;
  fps?: number;
  audioChannels?: number;
  audioSampleRate?: string;
  audioCodec?: string;
  videoCodec?: string;
  
  // Content details
  tags?: string[];
  categories?: string[];
  language?: string;
  subtitleLanguages?: string[];
  chapters?: Array<{
    title: string;
    startTime: number;
    endTime?: number;
  }>;
  
  // File information
  fileSize?: number;
  filePath?: string;
  fileUrl?: string;
  format?: string;
  
  // Additional assets
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
  
  // Processing information
  metadataVersion: string;
  extractedAt: Date;
  sources: string[]; // Which sources were used to build this metadata
  
  // Enriched metadata
  keywords?: string[];
  sentiment?: {
    score: number;
    magnitude: number;
  };
  topics?: string[];
  contentRating?: string;
  
  // Search optimization
  searchableText?: string; // Combined text content for full-text search
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
export class MetadataService {
  private readonly METADATA_VERSION = '1.0.0';
  private readonly DEFAULT_OPTIONS: MetadataExtractionOptions = {
    extractThumbnails: true,
    thumbnailQuality: 'high',
    extractSubtitles: true,
    subtitleLanguages: ['en'],
    extractComments: false,
    commentCount: 100,
    extractChapters: true,
    generateSearchIndex: true,
    includeRawMetadata: true,
    extractKeywords: true,
    persistToStorage: true
  };
  
  /**
   * Creates a new instance of MetadataService
   */
  constructor() {
    logInfo('MetadataService initialized');
  }
  
  /**
   * Extract and process metadata for a YouTube video
   * @param videoId YouTube video ID
   * @param options Metadata extraction options
   * @returns Metadata extraction result
   */
  public async extractMetadata(
    videoId: string,
    options?: Partial<MetadataExtractionOptions>
  ): Promise<MetadataExtractionResult> {
    const fullOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      logInfo(`Extracting metadata for video: ${videoId}`);
      
      // Collect metadata from multiple sources for comprehensive coverage
      const sources: string[] = [];
      let rawMetadata: RawMetadata = {};
      
      // 1. Get metadata from YouTube API
      try {
        const youtubeMetadata = await youtubeService.getVideo(videoId);
        sources.push('youtube-api');
        rawMetadata.youtubeApi = youtubeMetadata;
      } catch (error) {
        logWarning(`Failed to get metadata from YouTube API for ${videoId}:`, error as Error);
      }
      
      // 2. Get metadata from yt-dlp
      try {
        const ytdlpMetadata = await ytdlpService.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`);
        sources.push('yt-dlp');
        rawMetadata.ytdlp = ytdlpMetadata;
      } catch (error) {
        logWarning(`Failed to get metadata from yt-dlp for ${videoId}:`, error as Error);
      }
      
      // 3. Look for existing metadata file
      const videoDoc = await mongoose.model('Video').findOne({ youtubeId: videoId }) as VideoDocument;
      if (videoDoc?.metadataPath) {
        try {
          const existingMetadataContent = await readFile(videoDoc.metadataPath, 'utf8');
          const existingMetadata = JSON.parse(existingMetadataContent);
          sources.push('existing-file');
          rawMetadata.existingFile = existingMetadata;
        } catch (error) {
          logWarning(`Failed to read existing metadata file for ${videoId}:`, error as Error);
        }
      }
      
      // If we don't have any metadata sources, return an error
      if (sources.length === 0) {
        return {
          success: false,
          errorMessage: `Failed to extract metadata from any source for video: ${videoId}`
        };
      }
      
      // Process and standardize the metadata
      const standardizedMetadata = this.standardizeMetadata(rawMetadata, sources, videoId);
      
      // Extract and process additional assets based on options
      const result: MetadataExtractionResult = {
        success: true,
        metadata: standardizedMetadata,
      };
      
      if (fullOptions.includeRawMetadata) {
        result.rawMetadata = rawMetadata;
      }
      
      // Process thumbnails if requested
      if (fullOptions.extractThumbnails && videoDoc) {
        try {
          const thumbnailPath = await this.processThumbnail(
            videoId,
            standardizedMetadata,
            videoDoc,
            fullOptions.thumbnailQuality
          );
          
          if (thumbnailPath) {
            result.thumbnailPath = thumbnailPath;
            standardizedMetadata.thumbnails = {
              ...standardizedMetadata.thumbnails,
              local: thumbnailPath
            };
          }
        } catch (error) {
          logWarning(`Failed to process thumbnail for ${videoId}:`, error as Error);
        }
      }
      
      // Process subtitles if requested
      if (fullOptions.extractSubtitles && videoDoc) {
        try {
          const subtitlePaths = await this.processSubtitles(
            videoId,
            standardizedMetadata,
            videoDoc,
            fullOptions.subtitleLanguages
          );
          
          if (subtitlePaths && subtitlePaths.length > 0) {
            result.subtitlePaths = subtitlePaths;
          }
        } catch (error) {
          logWarning(`Failed to process subtitles for ${videoId}:`, error as Error);
        }
      }
      
      // Generate search index if requested
      if (fullOptions.generateSearchIndex) {
        standardizedMetadata.searchableText = this.generateSearchableText(standardizedMetadata);
      }
      
      // Extract keywords if requested
      if (fullOptions.extractKeywords) {
        standardizedMetadata.keywords = this.extractKeywords(standardizedMetadata);
      }
      
      // Persist metadata to storage if requested
      if (fullOptions.persistToStorage && videoDoc) {
        try {
          const storagePath = await this.persistMetadata(videoId, standardizedMetadata, rawMetadata, videoDoc);
          result.storagePath = storagePath;
          
          // Update video document with the new metadata path
          await mongoose.model('Video').findByIdAndUpdate(videoDoc._id, {
            metadataPath: storagePath
          });
        } catch (error) {
          logWarning(`Failed to persist metadata for ${videoId}:`, error as Error);
        }
      }
      
      return result;
    } catch (error) {
      logError(`Error extracting metadata for ${videoId}:`, error as Error);
      return {
        success: false,
        errorMessage: `Error extracting metadata: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Standardize metadata from multiple sources into a consistent format
   * @param rawMetadata Raw metadata from different sources
   * @param sources Array of source names that were used
   * @param videoId YouTube video ID
   * @returns Standardized metadata object
   */
  private standardizeMetadata(
    rawMetadata: RawMetadata,
    sources: string[],
    videoId: string
  ): StandardizedMetadata {
    // Start with basic structure and required fields
    const metadata: StandardizedMetadata = {
      id: videoId,
      title: '',
      metadataVersion: this.METADATA_VERSION,
      extractedAt: new Date(),
      sources
    };
    
    // Process YouTube API metadata if available
    if (rawMetadata.youtubeApi) {
      const api = rawMetadata.youtubeApi;
      
      // Basic video information
      if (api.snippet) {
        metadata.title = api.snippet.title || metadata.title;
        metadata.description = api.snippet.description;
        metadata.publishedAt = api.snippet.publishedAt ? new Date(api.snippet.publishedAt) : undefined;
        metadata.channelId = api.snippet.channelId;
        metadata.channelTitle = api.snippet.channelTitle;
        metadata.tags = api.snippet.tags;
        
        // Thumbnails
        if (api.snippet.thumbnails) {
          metadata.thumbnails = {};
          for (const [quality, thumbnail] of Object.entries(api.snippet.thumbnails)) {
            const qualityKey = quality as keyof typeof metadata.thumbnails;
            metadata.thumbnails[qualityKey] = (thumbnail as any).url;
          }
        }
      }
      
      // Statistics
      if (api.statistics) {
        metadata.viewCount = parseInt(api.statistics.viewCount, 10) || undefined;
        metadata.likeCount = parseInt(api.statistics.likeCount, 10) || undefined;
        metadata.dislikeCount = parseInt(api.statistics.dislikeCount, 10) || undefined;
        metadata.commentCount = parseInt(api.statistics.commentCount, 10) || undefined;
      }
      
      // Content details
      if (api.contentDetails) {
        metadata.duration = this.convertIsoDurationToSeconds(api.contentDetails.duration);
        
        if (api.contentDetails.contentRating) {
          metadata.contentRating = Object.keys(api.contentDetails.contentRating)[0];
        }
      }
    }
    
    // Process yt-dlp metadata if available
    if (rawMetadata.ytdlp) {
      const ytdlp = rawMetadata.ytdlp;
      
      // Override or set fields with yt-dlp data (which is often more detailed)
      metadata.title = ytdlp.title || metadata.title;
      metadata.description = ytdlp.description || metadata.description;
      metadata.uploadDate = ytdlp.upload_date || metadata.uploadDate;
      
      if (ytdlp.upload_date && !metadata.publishedAt) {
        // Convert YYYYMMDD to Date
        const dateStr = ytdlp.upload_date;
        if (/^\d{8}$/.test(dateStr)) {
          const year = parseInt(dateStr.substring(0, 4), 10);
          const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-based
          const day = parseInt(dateStr.substring(6, 8), 10);
          metadata.publishedAt = new Date(year, month, day);
        }
      }
      
      metadata.duration = ytdlp.duration || metadata.duration;
      metadata.viewCount = ytdlp.view_count || metadata.viewCount;
      metadata.likeCount = ytdlp.like_count || metadata.likeCount;
      metadata.dislikeCount = ytdlp.dislike_count || metadata.dislikeCount;
      metadata.commentCount = ytdlp.comment_count || metadata.commentCount;
      
      metadata.channelId = ytdlp.channel_id || metadata.channelId;
      metadata.channelTitle = ytdlp.channel || metadata.channelTitle;
      metadata.channelUrl = ytdlp.channel_url;
      
      // Tags handling
      if (ytdlp.tags && (!metadata.tags || metadata.tags.length === 0)) {
        metadata.tags = ytdlp.tags;
      }
      
      // Categories
      if (ytdlp.categories) {
        metadata.categories = ytdlp.categories;
      }
      
      // Thumbnails
      if (ytdlp.thumbnails && (!metadata.thumbnails || Object.keys(metadata.thumbnails).length === 0)) {
        metadata.thumbnails = metadata.thumbnails || {};
        
        // Map yt-dlp thumbnails to our standardized format
        for (const thumbnail of ytdlp.thumbnails) {
          let quality;
          if (thumbnail.preference && thumbnail.preference > 0) {
            // Convert yt-dlp preference to quality level
            if (thumbnail.preference >= 10) quality = 'maxres';
            else if (thumbnail.preference >= 5) quality = 'high';
            else if (thumbnail.preference >= 0) quality = 'medium';
            else quality = 'default';
          } else if (thumbnail.id === 'maxres') {
            quality = 'maxres';
          } else if (thumbnail.id === 'high') {
            quality = 'high';
          } else if (thumbnail.id === 'medium') {
            quality = 'medium';
          } else if (thumbnail.id === 'default') {
            quality = 'default';
          } else {
            // Use resolution to determine quality
            const resolution = thumbnail.resolution || '';
            const [width, height] = resolution.split('x').map((n: string) => parseInt(n, 10));
            
            if (width >= 1280) quality = 'maxres';
            else if (width >= 640) quality = 'standard';
            else if (width >= 480) quality = 'high';
            else if (width >= 320) quality = 'medium';
            else quality = 'default';
          }
          
          const qualityKey = quality as keyof typeof metadata.thumbnails;
          metadata.thumbnails[qualityKey] = thumbnail.url;
        }
      }
      
      // Media information from the best format
      if (ytdlp.formats && ytdlp.formats.length > 0) {
        const bestFormat = ytdlp.formats.find((f: any) => f.format_id === ytdlp.format_id) || ytdlp.formats[0];
        
        metadata.width = bestFormat.width || undefined;
        metadata.height = bestFormat.height || undefined;
        metadata.fps = bestFormat.fps || undefined;
        metadata.audioChannels = bestFormat.audio_channels || undefined;
        metadata.audioSampleRate = bestFormat.asr ? `${bestFormat.asr}Hz` : undefined;
        metadata.audioCodec = bestFormat.acodec !== 'none' ? bestFormat.acodec : undefined;
        metadata.videoCodec = bestFormat.vcodec !== 'none' ? bestFormat.vcodec : undefined;
        
        if (metadata.width && metadata.height) {
          metadata.resolution = `${metadata.width}x${metadata.height}`;
        }
      }
      
      // Chapters
      if (ytdlp.chapters && ytdlp.chapters.length > 0) {
        metadata.chapters = ytdlp.chapters.map((chapter: any) => ({
          title: chapter.title,
          startTime: chapter.start_time,
          endTime: chapter.end_time
        }));
      }
      
      // Subtitles
      if (ytdlp.subtitles && Object.keys(ytdlp.subtitles).length > 0) {
        metadata.subtitleLanguages = Object.keys(ytdlp.subtitles);
      }
      
      // Approximate language detection based on various sources
      if (ytdlp.language || ytdlp.language_info) {
        metadata.language = ytdlp.language || 
                          (ytdlp.language_info ? ytdlp.language_info.language : undefined);
      }
    }
    
    // Merge with any existing metadata file information
    if (rawMetadata.existingFile) {
      const existing = rawMetadata.existingFile;
      
      // Only override fields that are not already set and are available in the existing metadata
      if (!metadata.duration && existing.duration) metadata.duration = existing.duration;
      if (!metadata.viewCount && existing.viewCount) metadata.viewCount = existing.viewCount;
      if (!metadata.fileSize && existing.fileSize) metadata.fileSize = existing.fileSize;
      if (!metadata.filePath && existing.filePath) metadata.filePath = existing.filePath;
      if (!metadata.format && existing.format) metadata.format = existing.format;
      
      // Add local paths if they exist
      if (existing.thumbnails?.local) {
        metadata.thumbnails = metadata.thumbnails || {};
        metadata.thumbnails.local = existing.thumbnails.local;
      }
      
      if (existing.subtitles && (!metadata.subtitles || metadata.subtitles.length === 0)) {
        metadata.subtitles = existing.subtitles;
      }
      
      // Use existing keywords and topics if available
      if (existing.keywords && (!metadata.keywords || metadata.keywords.length === 0)) {
        metadata.keywords = existing.keywords;
      }
      
      if (existing.topics && (!metadata.topics || metadata.topics.length === 0)) {
        metadata.topics = existing.topics;
      }
    }
    
    return metadata;
  }
  
  /**
   * Process and store thumbnail for a video
   * @param videoId YouTube video ID
   * @param metadata Standardized metadata
   * @param videoDoc Video document
   * @param quality Thumbnail quality to use
   * @returns Path to stored thumbnail
   */
  private async processThumbnail(
    videoId: string,
    metadata: StandardizedMetadata,
    videoDoc: VideoDocument,
    quality: 'low' | 'medium' | 'high' | 'max'
  ): Promise<string | undefined> {
    if (!metadata.thumbnails) {
      return undefined;
    }
    
    // Select thumbnail URL based on requested quality
    let thumbnailUrl: string | undefined;
    switch (quality) {
      case 'max':
        thumbnailUrl = metadata.thumbnails.maxres || 
                     metadata.thumbnails.standard || 
                     metadata.thumbnails.high ||
                     metadata.thumbnails.medium ||
                     metadata.thumbnails.default;
        break;
      case 'high':
        thumbnailUrl = metadata.thumbnails.high ||
                     metadata.thumbnails.medium ||
                     metadata.thumbnails.default;
        break;
      case 'medium':
        thumbnailUrl = metadata.thumbnails.medium ||
                     metadata.thumbnails.default;
        break;
      case 'low':
        thumbnailUrl = metadata.thumbnails.default;
        break;
    }
    
    if (!thumbnailUrl) {
      return undefined;
    }
    
    // If the video document already has a thumbnail path and it exists, use that
    if (videoDoc.thumbnailUrl && videoDoc.thumbnailUrl.startsWith('http')) {
      try {
        // Check if we already have a local thumbnail file
        if (metadata.thumbnails?.local) {
          const localPath = metadata.thumbnails.local;
          if (await exists(localPath)) {
            return localPath;
          }
        }
        
        // Determine the storage path
        let storagePath: string;
        if (videoDoc.filePath) {
          // Store alongside the video file
          const videoDir = path.dirname(videoDoc.filePath);
          storagePath = path.join(videoDir, `${videoId}-thumbnail.jpg`);
        } else {
          // Create a temporary path
          const tempDir = path.join(process.cwd(), 'temp', 'thumbnails');
          await mkdir(tempDir, { recursive: true });
          storagePath = path.join(tempDir, `${videoId}-thumbnail.jpg`);
        }
        
        // Download and save the thumbnail
        const response = await fetch(thumbnailUrl);
        if (!response.ok) {
          throw new Error(`Failed to download thumbnail: ${response.status} ${response.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(storagePath, buffer);
        
        // If we have a storage provider, store it properly
        if (videoDoc.filePath) {
          const relativePath = path.relative(storageService.getProvider().getBasePath(), storagePath);
          const publicUrl = await storageService.getPublicUrl(relativePath);
          
          // Update the video document with the thumbnail URL
          await mongoose.model('Video').findByIdAndUpdate(videoDoc._id, {
            thumbnailUrl: publicUrl
          });
        }
        
        return storagePath;
      } catch (error) {
        logWarning(`Failed to process thumbnail for ${videoId}:`, error as Error);
        return undefined;
      }
    } else if (videoDoc.thumbnailUrl && !videoDoc.thumbnailUrl.startsWith('http')) {
      // We already have a local thumbnail
      return videoDoc.thumbnailUrl;
    }
    
    // No existing thumbnail, but we have a URL - download it
    try {
      // Determine the storage path
      let storagePath: string;
      if (videoDoc.filePath) {
        // Store alongside the video file
        const videoDir = path.dirname(videoDoc.filePath);
        storagePath = path.join(videoDir, `${videoId}-thumbnail.jpg`);
      } else {
        // Create a temporary path
        const tempDir = path.join(process.cwd(), 'temp', 'thumbnails');
        await mkdir(tempDir, { recursive: true });
        storagePath = path.join(tempDir, `${videoId}-thumbnail.jpg`);
      }
      
      // Download and save the thumbnail
      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        throw new Error(`Failed to download thumbnail: ${response.status} ${response.statusText}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(storagePath, buffer);
      
      // If we have a storage provider, store it properly
      if (videoDoc.filePath) {
        const relativePath = path.relative(storageService.getProvider().getBasePath(), storagePath);
        const publicUrl = await storageService.getPublicUrl(relativePath);
        
        // Update the video document with the thumbnail URL
        await mongoose.model('Video').findByIdAndUpdate(videoDoc._id, {
          thumbnailUrl: publicUrl
        });
      }
      
      return storagePath;
    } catch (error) {
      logWarning(`Failed to download thumbnail for ${videoId}:`, error as Error);
      return undefined;
    }
  }
  
  /**
   * Process and store subtitles for a video
   * @param videoId YouTube video ID
   * @param metadata Standardized metadata
   * @param videoDoc Video document
   * @param languages Languages to extract
   * @returns Paths to stored subtitle files
   */
  private async processSubtitles(
    videoId: string,
    metadata: StandardizedMetadata,
    videoDoc: VideoDocument,
    languages?: string[]
  ): Promise<string[]> {
    // If the video document already has subtitles and there are no additional languages requested, use those
    if (videoDoc.hasSubtitles && 
        videoDoc.subtitleLanguages && 
        videoDoc.subtitleLanguages.length > 0 &&
        metadata.subtitles &&
        metadata.subtitles.length > 0) {
      // Check if we already have all the requested languages
      if (languages) {
        const missingLanguages = languages.filter(
          lang => !videoDoc.subtitleLanguages?.includes(lang)
        );
        
        if (missingLanguages.length === 0) {
          // We have all the requested languages, return the existing subtitles
          return metadata.subtitles.map(sub => sub.path);
        }
      } else {
        // No specific languages requested, return existing subtitles
        return metadata.subtitles.map(sub => sub.path);
      }
    }
    
    // Need to download subtitles with yt-dlp
    try {
      // Determine the storage path
      let outputDir: string;
      if (videoDoc.filePath) {
        // Store alongside the video file
        outputDir = path.dirname(videoDoc.filePath);
      } else {
        // Create a temporary path
        outputDir = path.join(process.cwd(), 'temp', 'subtitles', videoId);
        await mkdir(outputDir, { recursive: true });
      }
      
      // Build options for subtitle download
      const options: Record<string, any> = {
        'skip-download': true,
        'write-subs': true,
        'sub-langs': languages ? languages.join(',') : 'all',
        'write-auto-subs': true,
        'convert-subs': 'srt'
      };
      
      // Use yt-dlp to download subtitles
      const result = await ytdlpService.downloadVideo(
        `https://www.youtube.com/watch?v=${videoId}`,
        outputDir,
        'standard', // Use standard profile
        options,
        `subtitle-${Date.now()}`, // Generate a unique job ID
        videoDoc._id ? videoDoc._id.toString() : videoDoc.youtubeId,
        'system'
      );
      
      if (!result.success) {
        throw new Error(`Failed to download subtitles: ${result.error}`);
      }
      
      // Find all downloaded subtitle files
      const subtitleFiles = fs.readdirSync(outputDir)
        .filter(file => file.includes(videoId) && file.endsWith('.srt'));
      
      const subtitlePaths = subtitleFiles.map(file => path.join(outputDir, file));
      
      // Update the video document with subtitle information
      const subtitleLanguages = subtitleFiles.map(file => {
        // Extract language code from filename
        // Format is typically videoId.LANG.srt
        const match = file.match(/\.([a-z]{2,3}(-[A-Z]{2})?)\.srt$/);
        return match ? match[1] : 'unknown';
      }).filter(lang => lang !== 'unknown');
      
      // Update the video document with subtitle information
      await mongoose.model('Video').findByIdAndUpdate(videoDoc._id, {
        hasSubtitles: subtitlePaths.length > 0,
        subtitleLanguages: subtitleLanguages.length > 0 ? subtitleLanguages : undefined
      });
      
      // Add subtitle information to metadata
      metadata.subtitles = subtitlePaths.map((path, index) => ({
        language: subtitleLanguages[index] || 'unknown',
        path
      }));
      
      return subtitlePaths;
    } catch (error) {
      logWarning(`Failed to process subtitles for ${videoId}:`, error as Error);
      return [];
    }
  }
  
  /**
   * Generate a searchable text string for full-text search
   * @param metadata Standardized metadata
   * @returns Searchable text string
   */
  private generateSearchableText(metadata: StandardizedMetadata): string {
    const textParts: string[] = [];
    
    // Add title (with high weighting by repeating)
    if (metadata.title) {
      textParts.push(metadata.title, metadata.title, metadata.title);
    }
    
    // Add channel information
    if (metadata.channelTitle) {
      textParts.push(metadata.channelTitle, metadata.channelTitle);
    }
    
    // Add description
    if (metadata.description) {
      textParts.push(metadata.description);
    }
    
    // Add tags
    if (metadata.tags && metadata.tags.length > 0) {
      textParts.push(metadata.tags.join(' '));
    }
    
    // Add categories
    if (metadata.categories && metadata.categories.length > 0) {
      textParts.push(metadata.categories.join(' '));
    }
    
    // Add chapter titles
    if (metadata.chapters && metadata.chapters.length > 0) {
      textParts.push(metadata.chapters.map(chapter => chapter.title).join(' '));
    }
    
    return textParts.join(' ').replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Extract keywords from metadata
   * @param metadata Standardized metadata
   * @returns Array of keywords
   */
  private extractKeywords(metadata: StandardizedMetadata): string[] {
    const keywords = new Set<string>();
    
    // Add tags directly as keywords
    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }
    
    // Add categories
    if (metadata.categories && metadata.categories.length > 0) {
      metadata.categories.forEach(category => keywords.add(category.toLowerCase()));
    }
    
    // Extract potential keywords from title and description
    if (metadata.title) {
      this.extractPotentialKeywords(metadata.title).forEach(keyword => keywords.add(keyword));
    }
    
    if (metadata.description) {
      this.extractPotentialKeywords(metadata.description).forEach(keyword => keywords.add(keyword));
    }
    
    return Array.from(keywords);
  }
  
  /**
   * Extract potential keywords from text
   * @param text Input text
   * @returns Array of potential keywords
   */
  private extractPotentialKeywords(text: string): string[] {
    // Very simple keyword extraction - in a production system, this would be more sophisticated
    // Split by non-alphanumeric characters
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3) // Filter out short words
      .filter(word => !this.isStopWord(word)); // Filter out stop words
    
    return Array.from(new Set(words)); // Remove duplicates
  }
  
  /**
   * Check if a word is a common stop word (should be excluded from keywords)
   * @param word Word to check
   * @returns True if the word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'that', 'have', 'this', 'with', 'from', 'they', 'will',
      'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make',
      'like', 'time', 'just', 'know', 'people', 'year', 'your', 'good', 'some',
      'could', 'them', 'other', 'than', 'then', 'only', 'look', 'come', 'over',
      'think', 'also', 'back', 'after', 'work', 'first', 'well', 'even', 'want',
      'because', 'these', 'give', 'most'
    ];
    
    return stopWords.includes(word);
  }
  
  /**
   * Persist metadata to storage
   * @param videoId YouTube video ID
   * @param standardizedMetadata Standardized metadata
   * @param rawMetadata Raw metadata
   * @param videoDoc Video document
   * @returns Path to stored metadata file
   */
  private async persistMetadata(
    videoId: string,
    standardizedMetadata: StandardizedMetadata,
    rawMetadata: RawMetadata,
    videoDoc: VideoDocument
  ): Promise<string> {
    // Determine storage path
    let storagePath: string;
    if (videoDoc.filePath) {
      // Store alongside the video file
      const videoDir = path.dirname(videoDoc.filePath);
      storagePath = path.join(videoDir, `${videoId}-metadata.json`);
    } else {
      // Create a temporary path
      const tempDir = path.join(process.cwd(), 'temp', 'metadata');
      await mkdir(tempDir, { recursive: true });
      storagePath = path.join(tempDir, `${videoId}-metadata.json`);
    }
    
    // Create the metadata content
    const metadataContent = {
      standardized: standardizedMetadata,
      raw: rawMetadata
    };
    
    // Write to file
    await writeFile(storagePath, JSON.stringify(metadataContent, null, 2), 'utf8');
    
    return storagePath;
  }
  
  /**
   * Search for videos using metadata
   * @param query Search query
   * @param options Search options
   * @returns Array of matching videos with metadata
   */
  public async searchVideosByMetadata(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      filter?: Record<string, any>;
    }
  ): Promise<{ videos: VideoDocument[], total: number }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'publishedAt';
    const sortDirection = options?.sortDirection || 'desc';
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDirection === 'asc' ? 1 : -1 };
    
    // Create the search filter
    const filter: Record<string, any> = {
      ...(options?.filter || {})
    };
    
    // If there's a query, add text search
    if (query && query.trim()) {
      filter.$text = { $search: query };
    }
    
    // Execute the search
    try {
      const Video = mongoose.model('Video');
      
      const [videos, total] = await Promise.all([
        Video.find(filter)
          .sort(sortOptions)
          .skip(offset)
          .limit(limit)
          .exec(),
        Video.countDocuments(filter).exec()
      ]);
      
      return { videos, total };
    } catch (error) {
      logError(`Error searching videos by metadata:`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get detailed metadata for a video
   * @param videoId Video ID (MongoDB ID)
   * @param includeRaw Whether to include raw metadata
   * @returns Detailed metadata
   */
  public async getDetailedMetadata(
    videoId: string,
    includeRaw: boolean = false
  ): Promise<StandardizedMetadata> {
    try {
      const videoDoc = await mongoose.model('Video').findById(videoId) as VideoDocument;
      
      if (!videoDoc) {
        throw new Error(`Video not found: ${videoId}`);
      }
      
      // Check if we have a metadata file
      if (videoDoc.metadataPath && fs.existsSync(videoDoc.metadataPath)) {
        const metadataContent = await readFile(videoDoc.metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        
        return includeRaw ? metadata : metadata.standardized;
      }
      
      // No metadata file, extract from the video document
      const basicMetadata: StandardizedMetadata = {
        id: videoDoc.youtubeId,
        title: videoDoc.title,
        description: videoDoc.description,
        duration: videoDoc.duration,
        viewCount: videoDoc.viewCount,
        likeCount: videoDoc.likeCount,
        publishedAt: videoDoc.publishedAt,
        thumbnails: videoDoc.thumbnailUrl ? { default: videoDoc.thumbnailUrl } : undefined,
        tags: videoDoc.tags,
        fileSize: videoDoc.fileSize,
        filePath: videoDoc.filePath,
        fileUrl: videoDoc.fileUrl,
        format: videoDoc.format,
        subtitleLanguages: videoDoc.subtitleLanguages,
        metadataVersion: this.METADATA_VERSION,
        extractedAt: new Date(),
        sources: ['video-document']
      };
      
      return basicMetadata;
    } catch (error) {
      logError(`Error getting detailed metadata for ${videoId}:`, error as Error);
      throw error;
    }
  }
  
  /**
   * Process metadata for a batch of videos
   * @param videoIds Array of YouTube video IDs
   * @param options Metadata extraction options
   * @returns Object mapping video IDs to extraction results
   */
  public async batchProcessMetadata(
    videoIds: string[],
    options?: Partial<MetadataExtractionOptions>
  ): Promise<Record<string, MetadataExtractionResult>> {
    const results: Record<string, MetadataExtractionResult> = {};
    
    // Process videos sequentially to avoid overwhelming the API
    for (const videoId of videoIds) {
      try {
        results[videoId] = await this.extractMetadata(videoId, options);
      } catch (error) {
        logError(`Error processing metadata for ${videoId}:`, error as Error);
        results[videoId] = {
          success: false,
          errorMessage: `Error processing metadata: ${(error as Error).message}`
        };
      }
    }
    
    return results;
  }
  
  /**
   * Extract metadata from a video file that has already been downloaded
   * @param filePath Path to the video file
   * @param videoId Optional YouTube video ID for additional metadata
   * @param options Metadata extraction options
   * @returns Metadata extraction result
   */
  public async extractMetadataFromFile(
    filePath: string,
    videoId?: string,
    options?: Partial<MetadataExtractionOptions>
  ): Promise<MetadataExtractionResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          errorMessage: `File does not exist: ${filePath}`
        };
      }
      
      // Get file metadata using ffprobe
      const mediaMetadata = await postProcessingService.extractMetadata(filePath);
      
      // Start with basic metadata from the file
      const standardizedMetadata: StandardizedMetadata = {
        id: videoId || path.basename(filePath, path.extname(filePath)),
        title: path.basename(filePath, path.extname(filePath)),
        duration: mediaMetadata.duration,
        fileSize: (await stat(filePath)).size,
        filePath: filePath,
        format: path.extname(filePath).slice(1).toLowerCase(),
        metadataVersion: this.METADATA_VERSION,
        extractedAt: new Date(),
        sources: ['file']
      };
      
      // If we have a YouTube video ID, get additional metadata
      let youtubeMetadata: StandardizedMetadata | undefined;
      if (videoId) {
        try {
          const extractionResult = await this.extractMetadata(videoId, {
            ...options,
            persistToStorage: false
          });
          
          if (extractionResult.success && extractionResult.metadata) {
            youtubeMetadata = extractionResult.metadata;
            
            // Merge with file metadata
            Object.assign(standardizedMetadata, {
              ...youtubeMetadata,
              filePath,
              fileSize: standardizedMetadata.fileSize,
              format: standardizedMetadata.format,
              sources: [...standardizedMetadata.sources, ...youtubeMetadata.sources]
            });
          }
        } catch (error) {
          logWarning(`Failed to get YouTube metadata for ${videoId}:`, error as Error);
        }
      }
      
      // Extract media streams information
      if (mediaMetadata.streams) {
        // Find video and audio streams
        const videoStream = mediaMetadata.streams.find((s: any) => s.codec_type === 'video');
        const audioStream = mediaMetadata.streams.find((s: any) => s.codec_type === 'audio');
        
        if (videoStream) {
          standardizedMetadata.width = videoStream.width;
          standardizedMetadata.height = videoStream.height;
          standardizedMetadata.fps = videoStream.r_frame_rate ? 
            eval(videoStream.r_frame_rate) : undefined;
          standardizedMetadata.videoCodec = videoStream.codec_name;
          
          if (standardizedMetadata.width && standardizedMetadata.height) {
            standardizedMetadata.resolution = `${standardizedMetadata.width}x${standardizedMetadata.height}`;
          }
        }
        
        if (audioStream) {
          standardizedMetadata.audioChannels = audioStream.channels;
          standardizedMetadata.audioSampleRate = audioStream.sample_rate ? 
            `${audioStream.sample_rate}Hz` : undefined;
          standardizedMetadata.audioCodec = audioStream.codec_name;
        }
      }
      
      // Extract thumbnail if requested
      if (options?.extractThumbnails) {
        try {
          const thumbnailPath = await postProcessingService.extractThumbnail(
            filePath,
            path.dirname(filePath)
          );
          
          if (thumbnailPath) {
            standardizedMetadata.thumbnails = {
              ...standardizedMetadata.thumbnails,
              local: thumbnailPath
            };
          }
        } catch (error) {
          logWarning(`Failed to extract thumbnail from ${filePath}:`, error as Error);
        }
      }
      
      // Extract chapters if available
      if (options?.extractChapters && mediaMetadata.chapters) {
        standardizedMetadata.chapters = mediaMetadata.chapters.map((chapter: any) => ({
          title: chapter.tags?.title || `Chapter ${chapter.id}`,
          startTime: chapter.start_time,
          endTime: chapter.end_time
        }));
      }
      
      // Generate search index if requested
      if (options?.generateSearchIndex) {
        standardizedMetadata.searchableText = this.generateSearchableText(standardizedMetadata);
      }
      
      // Extract keywords if requested
      if (options?.extractKeywords) {
        standardizedMetadata.keywords = this.extractKeywords(standardizedMetadata);
      }
      
      // For files with no YouTube ID, create a Video document if it doesn't exist
      if (!videoId) {
        // Check if a document exists for this file path
        const videoDoc = await mongoose.model('Video').findOne({ filePath }) as VideoDocument;
        
        if (!videoDoc) {
          // Create a new video document
          const Video = mongoose.model('Video');
          const newVideo = new Video({
            title: standardizedMetadata.title,
            description: standardizedMetadata.description,
            duration: standardizedMetadata.duration,
            filePath: standardizedMetadata.filePath,
            fileSize: standardizedMetadata.fileSize,
            format: standardizedMetadata.format,
            isArchived: true,
            archiveStatus: 'completed',
            downloadedAt: new Date()
          });
          
          await newVideo.save();
        }
      }
      
      // Persist metadata if requested
      if (options?.persistToStorage) {
        try {
          const storagePath = path.join(
            path.dirname(filePath),
            `${path.basename(filePath, path.extname(filePath))}-metadata.json`
          );
          
          const metadataContent = {
            standardized: standardizedMetadata,
            raw: {
              file: mediaMetadata,
              youtube: youtubeMetadata
            }
          };
          
          await writeFile(storagePath, JSON.stringify(metadataContent, null, 2), 'utf8');
          
          return {
            success: true,
            metadata: standardizedMetadata,
            storagePath,
            rawMetadata: options?.includeRawMetadata ? {
              file: mediaMetadata,
              youtube: youtubeMetadata
            } : undefined
          };
        } catch (error) {
          logWarning(`Failed to persist metadata for ${filePath}:`, error as Error);
        }
      }
      
      return {
        success: true,
        metadata: standardizedMetadata,
        rawMetadata: options?.includeRawMetadata ? {
          file: mediaMetadata,
          youtube: youtubeMetadata
        } : undefined
      };
    } catch (error) {
      logError(`Error extracting metadata from file ${filePath}:`, error as Error);
      return {
        success: false,
        errorMessage: `Error extracting metadata from file: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Convert ISO 8601 duration string to seconds
   * @param isoDuration ISO 8601 duration string (e.g., "PT1H2M3S")
   * @returns Duration in seconds
   */
  private convertIsoDurationToSeconds(isoDuration?: string): number | undefined {
    if (!isoDuration) return undefined;
    
    // Format: PT#H#M#S
    const hours = isoDuration.match(/(\d+)H/);
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    
    let totalSeconds = 0;
    
    if (hours) totalSeconds += parseInt(hours[1], 10) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60;
    if (seconds) totalSeconds += parseInt(seconds[1], 10);
    
    return totalSeconds;
  }
}

// Create singleton instance
export const metadataService = new MetadataService();