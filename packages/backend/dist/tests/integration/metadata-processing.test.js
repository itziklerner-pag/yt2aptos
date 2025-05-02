"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_service_1 = require("../../services/metadata.service");
const storage_service_1 = require("../../services/storage.service");
const youtube_service_1 = require("../../services/youtube.service");
const ytdlp_service_1 = require("../../services/ytdlp.service");
const post_processing_service_1 = require("../../services/post-processing.service");
const provider_factory_1 = require("@yt2aptos/shared/src/storage/provider.factory");
const types_1 = require("@yt2aptos/shared/src/storage/types");
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
jest.mock('../../services/youtube.service');
jest.mock('../../services/ytdlp.service');
jest.mock('../../services/post-processing.service');
describe('Metadata Processing Integration Tests', () => {
    let testDir;
    const mockVideoId = 'test-video-123';
    let mockVideoDoc;
    // Setup temp storage
    beforeAll(async () => {
        // Create a temp directory for testing
        testDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'metadata-test-'));
        // Configure storage service with local provider for testing
        const localConfig = {
            type: types_1.StorageProviderType.LOCAL,
            basePath: testDir
        };
        // Mock storage provider setup
        jest.spyOn(storage_service_1.storageService, 'getProvider').mockReturnValue(provider_factory_1.StorageProviderFactory.createProvider(localConfig));
        // Setup MongoDB connection (mock)
        jest.spyOn(mongoose_1.default, 'connect').mockResolvedValue(mongoose_1.default);
        jest.spyOn(mongoose_1.default.connection, 'close').mockResolvedValue(undefined);
        jest.spyOn(mongoose_1.default.Model.prototype, 'save').mockResolvedValue({});
        // Mock mongoose model operations for Video
        const VideoModel = mongoose_1.default.model('Video');
        jest.spyOn(VideoModel, 'findOne').mockImplementation((query) => {
            const mockQuery = {
                exec: () => query.youtubeId === mockVideoId || query._id === mockVideoId
                    ? Promise.resolve(mockVideoDoc)
                    : Promise.resolve(null)
            };
            // Add all the mongoose Query methods that might be used
            return mockQuery;
        });
        jest.spyOn(VideoModel, 'findById').mockImplementation((id) => {
            const mockQuery = {
                exec: () => id === mockVideoId
                    ? Promise.resolve(mockVideoDoc)
                    : Promise.resolve(null)
            };
            // Add all the mongoose Query methods that might be used
            return mockQuery;
        });
        jest.spyOn(VideoModel, 'findByIdAndUpdate').mockResolvedValue({});
    });
    afterAll(() => {
        // Clean up
        if (fs_1.default.existsSync(testDir)) {
            fs_1.default.rmSync(testDir, { recursive: true, force: true });
        }
        jest.restoreAllMocks();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mock video document for testing
        mockVideoDoc = {
            _id: mockVideoId,
            youtubeId: mockVideoId,
            title: 'Test Video',
            description: 'This is a test video description',
            duration: 120,
            viewCount: 1000,
            likeCount: 100,
            publishedAt: new Date(),
            filePath: path_1.default.join(testDir, `${mockVideoId}.mp4`),
            fileSize: 1024 * 1024 * 10, // 10 MB
            metadataPath: path_1.default.join(testDir, `${mockVideoId}-metadata.json`),
            thumbnailUrl: `https://example.com/thumbnails/${mockVideoId}.jpg`,
            hasSubtitles: false,
            subtitleLanguages: [],
            tags: ['test', 'video', 'metadata'],
            format: 'mp4'
        };
    });
    describe('Metadata Extraction from Multiple Sources', () => {
        it('should extract and combine metadata from multiple sources', async () => {
            // Mock YouTube API response
            youtube_service_1.youtubeService.getVideo.mockResolvedValue({
                id: mockVideoId,
                snippet: {
                    title: 'YouTube API Title',
                    description: 'YouTube API Description',
                    publishedAt: '2023-01-01T00:00:00Z',
                    channelId: 'channel-123',
                    channelTitle: 'Test Channel',
                    tags: ['youtube', 'api', 'test'],
                    thumbnails: {
                        default: { url: 'https://example.com/thumb-default.jpg' },
                        medium: { url: 'https://example.com/thumb-medium.jpg' },
                        high: { url: 'https://example.com/thumb-high.jpg' }
                    }
                },
                statistics: {
                    viewCount: '2000',
                    likeCount: '200',
                    dislikeCount: '10',
                    commentCount: '50'
                },
                contentDetails: {
                    duration: 'PT2M30S',
                    contentRating: { ytRating: 'ytAgeRestricted' }
                }
            });
            // Mock yt-dlp response
            ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue({
                title: 'yt-dlp Title',
                description: 'yt-dlp Description',
                upload_date: '20230101',
                duration: 150,
                view_count: 1500,
                like_count: 150,
                channel: 'yt-dlp Channel',
                channel_id: 'channel-123',
                channel_url: 'https://youtube.com/channel/channel-123',
                categories: ['Education'],
                tags: ['yt-dlp', 'test', 'video'],
                thumbnails: [
                    { id: 'default', url: 'https://example.com/yt-dlp-thumb-default.jpg', preference: 0 },
                    { id: 'high', url: 'https://example.com/yt-dlp-thumb-high.jpg', preference: 5 }
                ],
                formats: [
                    {
                        format_id: 'best',
                        width: 1920,
                        height: 1080,
                        fps: 30,
                        audio_channels: 2,
                        asr: 44100,
                        acodec: 'aac',
                        vcodec: 'h264'
                    }
                ],
                chapters: [
                    { title: 'Introduction', start_time: 0, end_time: 30 },
                    { title: 'Main Content', start_time: 30, end_time: 120 }
                ],
                subtitles: { en: [{ url: 'https://example.com/subtitles-en.vtt' }] }
            });
            // Setup extraction options
            const options = {
                extractThumbnails: true,
                thumbnailQuality: 'high',
                extractSubtitles: true,
                extractChapters: true,
                generateSearchIndex: true,
                extractKeywords: true,
                persistToStorage: true
            };
            // Fetch file contents doesn't work in jest, so mock it
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('mock image data')),
            });
            // Execute metadata extraction
            const result = await metadata_service_1.metadataService.extractMetadata(mockVideoId, options);
            // Assertions
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            const metadata = result.metadata;
            // Check that data was merged from both sources
            expect(metadata.id).toBe(mockVideoId);
            expect(metadata.title).toBe('yt-dlp Title'); // yt-dlp takes precedence
            expect(metadata.description).toBe('yt-dlp Description');
            expect(metadata.viewCount).toBe(1500);
            expect(metadata.likeCount).toBe(150);
            expect(metadata.duration).toBe(150);
            expect(metadata.channelTitle).toBe('yt-dlp Channel');
            expect(metadata.sources).toContain('youtube-api');
            expect(metadata.sources).toContain('yt-dlp');
            // Check that rich media metadata was properly extracted
            expect(metadata.width).toBe(1920);
            expect(metadata.height).toBe(1080);
            expect(metadata.resolution).toBe('1920x1080');
            expect(metadata.fps).toBe(30);
            expect(metadata.audioChannels).toBe(2);
            // Check that chapters were extracted
            expect(metadata.chapters).toHaveLength(2);
            expect(metadata.chapters?.[0].title).toBe('Introduction');
            // Verify service interactions
            expect(youtube_service_1.youtubeService.getVideo).toHaveBeenCalledWith(mockVideoId);
            expect(ytdlp_service_1.ytdlpService.getVideoInfo).toHaveBeenCalledWith(`https://www.youtube.com/watch?v=${mockVideoId}`);
        });
        it('should handle missing data from some sources', async () => {
            // Mock YouTube API failure
            youtube_service_1.youtubeService.getVideo.mockRejectedValue(new Error('API error'));
            // Mock yt-dlp success
            ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue({
                title: 'yt-dlp Only Title',
                duration: 180,
                upload_date: '20230202'
            });
            // Execute metadata extraction
            const result = await metadata_service_1.metadataService.extractMetadata(mockVideoId);
            // Assertions
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            expect(result.metadata?.title).toBe('yt-dlp Only Title');
            expect(result.metadata?.duration).toBe(180);
            expect(result.metadata?.sources).not.toContain('youtube-api');
            expect(result.metadata?.sources).toContain('yt-dlp');
        });
        it('should fail if no metadata sources are available', async () => {
            // Mock both sources failing
            youtube_service_1.youtubeService.getVideo.mockRejectedValue(new Error('API error'));
            ytdlp_service_1.ytdlpService.getVideoInfo.mockRejectedValue(new Error('yt-dlp error'));
            // No existing metadata file
            mockVideoDoc.metadataPath = null;
            // Execute metadata extraction
            const result = await metadata_service_1.metadataService.extractMetadata(mockVideoId);
            // Assertions
            expect(result.success).toBe(false);
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage).toContain('Failed to extract metadata from any source');
        });
    });
    describe('Thumbnail Processing', () => {
        it('should process and store thumbnails', async () => {
            // Mock YouTube API with thumbnails
            youtube_service_1.youtubeService.getVideo.mockResolvedValue({
                id: mockVideoId,
                snippet: {
                    title: 'Test Video',
                    thumbnails: {
                        default: { url: 'https://example.com/thumb-default.jpg' },
                        medium: { url: 'https://example.com/thumb-medium.jpg' },
                        high: { url: 'https://example.com/thumb-high.jpg' }
                    }
                }
            });
            // Mock ytdlp with minimal data
            ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue({
                title: 'Test Video'
            });
            // Mock fetch response for thumbnail download
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('mock image data')),
            });
            // Create a writable stream mock
            const mockWriteFile = jest.spyOn(fs_1.default.promises, 'writeFile').mockResolvedValue();
            // Mock storageService.getPublicUrl
            jest.spyOn(storage_service_1.storageService, 'getPublicUrl').mockResolvedValue('https://storage.example.com/thumbnails/test-video-123.jpg');
            // Execute metadata extraction with thumbnail extraction enabled
            const result = await metadata_service_1.metadataService.extractMetadata(mockVideoId, {
                extractThumbnails: true,
                thumbnailQuality: 'high',
                persistToStorage: true
            });
            // Assertions
            expect(result.success).toBe(true);
            expect(result.thumbnailPath).toBeDefined();
            expect(result.metadata?.thumbnails?.local).toBe(result.thumbnailPath);
            // Verify file was written
            expect(mockWriteFile).toHaveBeenCalled();
            expect(mockWriteFile.mock.calls[0][0].toString()).toContain(mockVideoId);
        });
    });
    describe('Search Index Generation', () => {
        it('should generate searchable text from metadata', async () => {
            // Mock minimal metadata sources
            youtube_service_1.youtubeService.getVideo.mockResolvedValue({
                id: mockVideoId,
                snippet: {
                    title: 'Test Video Title for Search',
                    description: 'This is a test description with some searchable keywords',
                    tags: ['search', 'test', 'index']
                }
            });
            ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue({
                title: 'Test Video Title',
                categories: ['Education', 'Technology']
            });
            // Execute metadata extraction with search index generation
            const result = await metadata_service_1.metadataService.extractMetadata(mockVideoId, {
                generateSearchIndex: true,
                extractKeywords: true
            });
            // Assertions
            expect(result.success).toBe(true);
            expect(result.metadata?.searchableText).toBeDefined();
            // Check searchable text contains important content
            const searchText = result.metadata?.searchableText;
            expect(searchText).toContain('Test Video Title');
            expect(searchText).toContain('searchable keywords');
            expect(searchText).toContain('search test index');
            // Check keywords extraction
            expect(result.metadata?.keywords).toContain('search');
            expect(result.metadata?.keywords).toContain('test');
            expect(result.metadata?.keywords).toContain('education');
            expect(result.metadata?.keywords).toContain('technology');
        });
    });
    describe('Subtitle Processing', () => {
        it('should process subtitles when available', async () => {
            // Minimal metadata sources
            youtube_service_1.youtubeService.getVideo.mockResolvedValue({
                id: mockVideoId,
                snippet: { title: 'Test Video' }
            });
            // Mock yt-dlp response with subtitle info
            ytdlp_service_1.ytdlpService.getVideoInfo.mockResolvedValue({
                title: 'Test Video',
                subtitles: {
                    en: [{ url: 'https://example.com/subtitles-en.vtt' }],
                    fr: [{ url: 'https://example.com/subtitles-fr.vtt' }]
                }
            });
            // Mock ytdlpService.downloadVideo for subtitle download
            ytdlp_service_1.ytdlpService.downloadVideo.mockResolvedValue({
                success: true,
                filePath: path_1.default.join(testDir, `${mockVideoId}.mp4`)
            });
            // Mock fs.readdirSync for subtitle file discovery
            jest.spyOn(fs_1.default, 'readdirSync').mockReturnValue([
                { name: `${mockVideoId}.en.srt`, isDirectory: () => false, isFile: () => true },
                { name: `${mockVideoId}.fr.srt`, isDirectory: () => false, isFile: () => true }
            ]);
            // Execute metadata extraction with subtitle extraction
            const result = await metadata_service_1.metadataService.extractMetadata(mockVideoId, {
                extractSubtitles: true,
                subtitleLanguages: ['en', 'fr']
            });
            // Assertions
            expect(result.success).toBe(true);
            expect(result.subtitlePaths).toBeDefined();
            expect(result.subtitlePaths?.length).toBe(2);
            expect(result.metadata?.subtitles).toHaveLength(2);
            // Verify yt-dlp was called with correct parameters
            expect(ytdlp_service_1.ytdlpService.downloadVideo).toHaveBeenCalled();
            const downloadOptions = ytdlp_service_1.ytdlpService.downloadVideo.mock.calls[0][3];
            expect(downloadOptions['skip-download']).toBe(true);
            expect(downloadOptions['write-subs']).toBe(true);
            expect(downloadOptions['sub-langs']).toBe('en,fr');
        });
    });
    describe('Integration with Download Service', () => {
        it('should extract metadata from already downloaded file', async () => {
            // Create a mock test video file
            const mockFilePath = path_1.default.join(testDir, `${mockVideoId}.mp4`);
            fs_1.default.writeFileSync(mockFilePath, Buffer.alloc(1024)); // 1KB dummy file
            // Mock ffprobe result from post-processing service
            post_processing_service_1.postProcessingService.extractMetadata.mockResolvedValue({
                duration: 125.5,
                streams: [
                    {
                        codec_type: 'video',
                        width: 1280,
                        height: 720,
                        r_frame_rate: '30/1', // 30 fps
                        codec_name: 'h264'
                    },
                    {
                        codec_type: 'audio',
                        channels: 2,
                        sample_rate: '44100',
                        codec_name: 'aac'
                    }
                ]
            });
            // Execute file metadata extraction
            const result = await metadata_service_1.metadataService.extractMetadataFromFile(mockFilePath, mockVideoId);
            // Assertions
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            // Check file-based metadata
            const metadata = result.metadata;
            expect(metadata.filePath).toBe(mockFilePath);
            expect(metadata.format).toBe('mp4');
            expect(metadata.duration).toBe(125.5);
            // Check media stream extraction
            expect(metadata.width).toBe(1280);
            expect(metadata.height).toBe(720);
            expect(metadata.resolution).toBe('1280x720');
            expect(metadata.fps).toBe(30);
            expect(metadata.videoCodec).toBe('h264');
            expect(metadata.audioCodec).toBe('aac');
            expect(metadata.audioChannels).toBe(2);
            expect(metadata.audioSampleRate).toBe('44100Hz');
            // Verify post-processing service was called
            expect(post_processing_service_1.postProcessingService.extractMetadata).toHaveBeenCalledWith(mockFilePath);
        });
    });
    describe('Search and Indexing', () => {
        it('should search videos by metadata', async () => {
            // Mock mongoose methods for search
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([mockVideoDoc])
            };
            jest.spyOn(mongoose_1.default.Model, 'find').mockReturnValue(mockFind);
            jest.spyOn(mongoose_1.default.Model, 'countDocuments').mockReturnValue({
                exec: jest.fn().mockResolvedValue(1)
            });
            // Execute search
            const searchResult = await metadata_service_1.metadataService.searchVideosByMetadata('test video');
            // Assertions
            expect(searchResult.videos).toHaveLength(1);
            expect(searchResult.total).toBe(1);
            // Verify search query
            expect(mongoose_1.default.Model.find).toHaveBeenCalledWith({ $text: { $search: 'test video' } });
            expect(mockFind.sort).toHaveBeenCalledWith({ publishedAt: -1 }); // Default sort
            expect(mockFind.limit).toHaveBeenCalledWith(20); // Default limit
        });
        it('should get detailed metadata for a video', async () => {
            // Mock file read
            const mockMetadataContent = JSON.stringify({
                standardized: {
                    id: mockVideoId,
                    title: 'Detailed Metadata Test',
                    metadataVersion: '1.0.0',
                    extractedAt: new Date(),
                    sources: ['test']
                },
                raw: { test: 'data' }
            });
            jest.spyOn(fs_1.default.promises, 'readFile').mockResolvedValue(mockMetadataContent);
            jest.spyOn(fs_1.default, 'existsSync').mockReturnValue(true);
            // Execute detailed metadata request
            const detailedResult = await metadata_service_1.metadataService.getDetailedMetadata(mockVideoId);
            // Assertions
            expect(detailedResult).toBeDefined();
            expect(detailedResult.id).toBe(mockVideoId);
            expect(detailedResult.title).toBe('Detailed Metadata Test');
        });
    });
});
//# sourceMappingURL=metadata-processing.test.js.map