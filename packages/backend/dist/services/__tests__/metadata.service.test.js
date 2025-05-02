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
const mongoose_1 = __importDefault(require("mongoose"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const metadata_service_1 = require("../metadata.service");
const youtube_service_1 = require("../youtube.service");
const ytdlp_service_1 = require("../ytdlp.service");
const storage_service_1 = require("../storage.service");
const post_processing_service_1 = require("../post-processing.service");
// Mock the dependencies
jest.mock('../youtube.service');
jest.mock('../ytdlp.service');
jest.mock('../storage.service');
jest.mock('../post-processing.service');
jest.mock('mongoose');
// Mock fs functions that are used directly
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
}));
// Set up mocks for promisified fs functions
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();
const mockStat = jest.fn();
const mockExists = jest.fn();
// Replace the original implementations with mocks
jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: (fn) => {
        if (fn === fs.readFile)
            return mockReadFile;
        if (fn === fs.writeFile)
            return mockWriteFile;
        if (fn === fs.mkdir)
            return mockMkdir;
        if (fn === fs.stat)
            return mockStat;
        if (fn === fs.exists)
            return mockExists;
        return (0, util_1.promisify)(fn);
    },
}));
describe('MetadataService', () => {
    // Sample data for testing
    const videoId = 'test-video-id';
    const filePath = '/test/path/video.mp4';
    const metadataPath = '/test/path/test-video-id-metadata.json';
    const thumbnailPath = '/test/path/test-video-id-thumbnail.jpg';
    // Mock mongoose model
    const mockVideoModel = {
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        find: jest.fn(),
        countDocuments: jest.fn(),
    };
    // Mock YouTube API video data
    const mockYoutubeApiData = {
        snippet: {
            title: 'Test Video Title',
            description: 'Test video description',
            publishedAt: '2023-01-01T00:00:00Z',
            channelId: 'test-channel-id',
            channelTitle: 'Test Channel',
            tags: ['test', 'video', 'tags']
        },
        statistics: {
            viewCount: '1000',
            likeCount: '100',
            dislikeCount: '10',
            commentCount: '50'
        },
        contentDetails: {
            duration: 'PT10M30S',
            contentRating: { ytRating: 'ytAgeRestricted' }
        }
    };
    // Mock yt-dlp data
    const mockYtdlpData = {
        title: 'Test Video Title from yt-dlp',
        description: 'Test video description from yt-dlp',
        upload_date: '20230101',
        duration: 630,
        view_count: 1001,
        like_count: 101,
        channel_id: 'test-channel-id',
        channel: 'Test Channel from yt-dlp',
        channel_url: 'https://youtube.com/channel/test-channel-id',
        tags: ['test', 'video', 'tags', 'ytdlp'],
        categories: ['Education'],
        thumbnails: [
            {
                id: 'maxres',
                url: 'https://i.ytimg.com/vi/test-video-id/maxresdefault.jpg',
                preference: 10
            }
        ],
        formats: [
            {
                format_id: 'test-format',
                width: 1920,
                height: 1080,
                fps: 30,
                acodec: 'aac',
                vcodec: 'h264',
                audio_channels: 2
            }
        ],
        chapters: [
            { title: 'Intro', start_time: 0, end_time: 60 },
            { title: 'Main Content', start_time: 60, end_time: 600 },
            { title: 'Conclusion', start_time: 600, end_time: 630 }
        ],
        subtitles: {
            'en': [{ url: 'https://subtitle/url/en' }],
            'es': [{ url: 'https://subtitle/url/es' }]
        }
    };
    // Mock video document
    const mockVideoDoc = {
        _id: new mongoose_1.default.Types.ObjectId(),
        youtubeId: videoId,
        title: 'Test Video',
        filePath,
        metadataPath,
        hasSubtitles: false,
    };
    beforeEach(() => {
        jest.clearAllMocks();
        // Set up mongoose mock
        mongoose_1.default.model.mockReturnValue(mockVideoModel);
        // Set up youtubeService mock
        youtube_service_1.youtubeService.getVideo.mockResolvedValue(mockYoutubeApiData);
        // Set up ytdlpService mock
        ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue(mockYtdlpData);
        ytdlp_service_1.ytdlpService.downloadVideo.mockResolvedValue({
            success: true,
            outputPath: '/test/path/subtitles/test-video-id.en.srt'
        });
        // Set up fs mocks
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['test-video-id.en.srt', 'test-video-id.es.srt']);
        // Set up promisified fs mocks
        mockReadFile.mockResolvedValue(JSON.stringify({
            standardized: {
                id: videoId,
                title: 'Test Video from File',
                metadataVersion: '1.0.0',
                extractedAt: new Date().toISOString(),
                sources: ['file']
            },
            raw: {}
        }));
        mockWriteFile.mockResolvedValue(undefined);
        mockMkdir.mockResolvedValue(undefined);
        mockStat.mockResolvedValue({ size: 1024000, birthtime: new Date(), mtime: new Date() });
        mockExists.mockResolvedValue(true);
        // Set up video model mock
        mockVideoModel.findOne.mockResolvedValue(mockVideoDoc);
        mockVideoModel.findById.mockResolvedValue(mockVideoDoc);
        mockVideoModel.findByIdAndUpdate.mockResolvedValue(mockVideoDoc);
        // Set up storage service mock
        storage_service_1.storageService.getPublicUrl.mockResolvedValue('https://storage/url/thumbnail.jpg');
        // Set up post-processing service mock
        post_processing_service_1.postProcessingService.extractMetadata.mockResolvedValue({
            duration: 630,
            streams: [
                { codec_type: 'video', width: 1920, height: 1080, r_frame_rate: '30/1', codec_name: 'h264' },
                { codec_type: 'audio', channels: 2, sample_rate: '44100', codec_name: 'aac' }
            ]
        });
        post_processing_service_1.postProcessingService.extractThumbnail.mockResolvedValue(thumbnailPath);
        // Mock fetch for thumbnail downloads
        global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        }));
    });
    describe('extractMetadata', () => {
        it('should extract metadata from multiple sources and standardize it', async () => {
            // Arrange
            mockVideoModel.findOne.mockResolvedValue(mockVideoDoc);
            // Act
            const result = await metadata_service_1.metadataService.extractMetadata(videoId);
            // Assert
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            expect(youtube_service_1.youtubeService.getVideo).toHaveBeenCalledWith(videoId);
            expect(ytdlp_service_1.ytdlpService.getVideoInfo).toHaveBeenCalledWith(`https://www.youtube.com/watch?v=${videoId}`);
            // Check standardized metadata
            const metadata = result.metadata;
            expect(metadata.id).toBe(videoId);
            expect(metadata.title).toBe('Test Video Title from yt-dlp'); // yt-dlp has precedence
            expect(metadata.duration).toBe(630);
            expect(metadata.viewCount).toBe(1001);
            expect(metadata.channelTitle).toBe('Test Channel from yt-dlp');
            expect(metadata.sources).toContain('youtube-api');
            expect(metadata.sources).toContain('yt-dlp');
        });
        it('should handle failure to fetch from any source', async () => {
            // Arrange
            youtube_service_1.youtubeService.getVideo.mockRejectedValue(new Error('API error'));
            ytdlp_service_1.ytdlpService.getVideoInfo.mockRejectedValue(new Error('yt-dlp error'));
            mockVideoModel.findOne.mockResolvedValue({ ...mockVideoDoc, metadataPath: undefined });
            // Act
            const result = await metadata_service_1.metadataService.extractMetadata(videoId);
            // Assert
            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('Failed to extract metadata from any source');
        });
        it('should process thumbnails when requested', async () => {
            // Arrange
            mockVideoModel.findOne.mockResolvedValue(mockVideoDoc);
            // Act
            const result = await metadata_service_1.metadataService.extractMetadata(videoId, {
                extractThumbnails: true,
                thumbnailQuality: 'high'
            });
            // Assert
            expect(result.success).toBe(true);
            expect(result.thumbnailPath).toBeDefined();
            expect(global.fetch).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalled();
        });
        it('should process subtitles when requested', async () => {
            // Arrange
            mockVideoModel.findOne.mockResolvedValue({
                ...mockVideoDoc,
                hasSubtitles: false,
                subtitleLanguages: []
            });
            // Act
            const result = await metadata_service_1.metadataService.extractMetadata(videoId, {
                extractSubtitles: true,
                subtitleLanguages: ['en', 'es']
            });
            // Assert
            expect(result.success).toBe(true);
            expect(ytdlp_service_1.ytdlpService.downloadVideo).toHaveBeenCalled();
            expect(mockVideoModel.findByIdAndUpdate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                hasSubtitles: true,
                subtitleLanguages: expect.arrayContaining(['en', 'es'])
            }));
        });
        it('should persist metadata to storage when requested', async () => {
            // Arrange
            mockVideoModel.findOne.mockResolvedValue(mockVideoDoc);
            // Act
            const result = await metadata_service_1.metadataService.extractMetadata(videoId, {
                persistToStorage: true
            });
            // Assert
            expect(result.success).toBe(true);
            expect(result.storagePath).toBeDefined();
            expect(mockWriteFile).toHaveBeenCalled();
            expect(mockVideoModel.findByIdAndUpdate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                metadataPath: expect.any(String)
            }));
        });
    });
    describe('extractMetadataFromFile', () => {
        it('should extract metadata from a video file', async () => {
            // Arrange
            fs.existsSync.mockReturnValue(true);
            // Act
            const result = await metadata_service_1.metadataService.extractMetadataFromFile(filePath, videoId);
            // Assert
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            expect(post_processing_service_1.postProcessingService.extractMetadata).toHaveBeenCalledWith(filePath);
            // Check standardized metadata
            const metadata = result.metadata;
            expect(metadata.id).toBe(videoId);
            expect(metadata.filePath).toBe(filePath);
            expect(metadata.format).toBe('mp4');
            expect(metadata.sources).toContain('file');
        });
        it('should handle non-existent files', async () => {
            // Arrange
            fs.existsSync.mockReturnValue(false);
            // Act
            const result = await metadata_service_1.metadataService.extractMetadataFromFile('/non/existent/file.mp4');
            // Assert
            expect(result.success).toBe(false);
            expect(result.errorMessage).toContain('File does not exist');
        });
        it('should extract thumbnails from file when requested', async () => {
            // Act
            const result = await metadata_service_1.metadataService.extractMetadataFromFile(filePath, videoId, {
                extractThumbnails: true
            });
            // Assert
            expect(result.success).toBe(true);
            expect(post_processing_service_1.postProcessingService.extractThumbnail).toHaveBeenCalledWith(filePath, path.dirname(filePath));
            expect(result.metadata?.thumbnails?.local).toBe(thumbnailPath);
        });
        it('should merge YouTube metadata when videoId is provided', async () => {
            // Act
            const result = await metadata_service_1.metadataService.extractMetadataFromFile(filePath, videoId);
            // Assert
            expect(result.success).toBe(true);
            expect(youtube_service_1.youtubeService.getVideo).toHaveBeenCalledWith(videoId);
            expect(result.metadata?.sources).toContain('youtube-api');
            expect(result.metadata?.sources).toContain('file');
        });
    });
    describe('searchVideosByMetadata', () => {
        it('should search videos using metadata with text search', async () => {
            // Arrange
            const mockVideos = [{ _id: 'video1' }, { _id: 'video2' }];
            mockVideoModel.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockVideos)
            });
            mockVideoModel.countDocuments = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(2)
            });
            // Act
            const result = await metadata_service_1.metadataService.searchVideosByMetadata('test query');
            // Assert
            expect(result.videos).toEqual(mockVideos);
            expect(result.total).toBe(2);
            expect(mockVideoModel.find).toHaveBeenCalledWith(expect.objectContaining({
                $text: { $search: 'test query' }
            }));
        });
        it('should handle search with custom filtering and sorting', async () => {
            // Arrange
            mockVideoModel.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([])
            });
            mockVideoModel.countDocuments = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(0)
            });
            // Act
            const result = await metadata_service_1.metadataService.searchVideosByMetadata('', {
                limit: 10,
                offset: 20,
                sortBy: 'viewCount',
                sortDirection: 'desc',
                filter: { channelId: 'test-channel' }
            });
            // Assert
            expect(mockVideoModel.find).toHaveBeenCalledWith(expect.objectContaining({
                channelId: 'test-channel'
            }));
        });
    });
    describe('getDetailedMetadata', () => {
        it('should get detailed metadata from a metadata file', async () => {
            // Arrange
            const mockMetadataContent = {
                standardized: {
                    id: videoId,
                    title: 'Test Video',
                    metadataVersion: '1.0.0',
                    extractedAt: new Date().toISOString(),
                    sources: ['file', 'youtube-api']
                },
                raw: { file: {}, youtube: {} }
            };
            mockReadFile.mockResolvedValue(JSON.stringify(mockMetadataContent));
            // Act
            const result = await metadata_service_1.metadataService.getDetailedMetadata('video-doc-id');
            // Assert
            expect(result).toEqual(mockMetadataContent.standardized);
            expect(mockVideoModel.findById).toHaveBeenCalledWith('video-doc-id');
            expect(mockReadFile).toHaveBeenCalledWith(metadataPath, 'utf8');
        });
        it('should extract basic metadata from video document when no metadata file exists', async () => {
            // Arrange
            fs.existsSync.mockReturnValue(false);
            mockVideoModel.findById.mockResolvedValue({
                ...mockVideoDoc,
                youtubeId: videoId,
                title: 'Test Video Title',
                thumbnailUrl: 'https://example.com/thumbnail.jpg'
            });
            // Act
            const result = await metadata_service_1.metadataService.getDetailedMetadata('video-doc-id');
            // Assert
            expect(result.id).toBe(videoId);
            expect(result.title).toBe('Test Video Title');
            expect(result.thumbnails?.default).toBe('https://example.com/thumbnail.jpg');
            expect(result.metadataVersion).toBe('1.0.0');
            expect(result.sources).toContain('video-document');
        });
    });
});
//# sourceMappingURL=metadata.service.test.js.map