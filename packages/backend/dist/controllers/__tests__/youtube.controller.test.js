"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const youtube_controller_1 = require("../youtube.controller");
const channel_model_1 = require("../../models/channel.model");
const youtube_service_1 = require("../../services/youtube.service");
// Mocking dependencies
jest.mock('../../services/youtube.service');
jest.mock('../../utils/logger');
jest.mock('../../models/channel.model');
jest.mock('../../models/playlist.model');
jest.mock('../../models/video.model');
describe('YouTubeController', () => {
    // Setup mock request and response
    let mockRequest;
    let mockResponse;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        // Reset mocks between tests
        jest.clearAllMocks();
        // Setup response mock with status and json methods
        responseJson = jest.fn().mockReturnThis();
        responseStatus = jest.fn().mockReturnValue({ json: responseJson });
        mockResponse = {
            status: responseStatus,
            json: responseJson,
        };
        // Setup default request mock
        mockRequest = {
            params: {},
            query: {},
            body: {},
            user: { id: 'test-user-id' }
        };
    });
    describe('searchChannels', () => {
        it('should return search results for valid query', async () => {
            // Setup
            const mockSearchResults = {
                items: [{ id: { channelId: 'test-channel-id' }, snippet: { title: 'Test Channel' } }],
                nextPageToken: 'next-token',
                pageInfo: { totalResults: 1 }
            };
            youtube_service_1.youtubeService.searchChannels.mockResolvedValue(mockSearchResults);
            mockRequest.query = { query: 'test channel', maxResults: '5' };
            // Execute
            await youtube_controller_1.YouTubeController.searchChannels(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.searchChannels).toHaveBeenCalledWith('test channel', 5, undefined);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResults);
        });
        it('should handle missing query parameter', async () => {
            // Setup - missing query parameter
            mockRequest.query = { maxResults: '5' };
            // Ensure query is undefined or not a string
            delete mockRequest.query.query;
            // Execute
            await youtube_controller_1.YouTubeController.searchChannels(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.searchChannels).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ message: 'Query parameter is required' });
        });
        it('should handle service errors', async () => {
            // Setup
            const mockError = new Error('API error');
            youtube_service_1.youtubeService.searchChannels.mockRejectedValue(mockError);
            mockRequest.query = { query: 'test' };
            // Execute
            await youtube_controller_1.YouTubeController.searchChannels(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Failed to search channels',
                error: 'API error'
            });
        });
        it('should use default maxResults value when not provided', async () => {
            // Setup
            const mockSearchResults = { items: [] };
            youtube_service_1.youtubeService.searchChannels.mockResolvedValue(mockSearchResults);
            mockRequest.query = { query: 'test' }; // No maxResults
            // Execute
            await youtube_controller_1.YouTubeController.searchChannels(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.searchChannels).toHaveBeenCalledWith('test', 10, undefined);
        });
        it('should forward pageToken when provided', async () => {
            // Setup
            const mockSearchResults = { items: [] };
            youtube_service_1.youtubeService.searchChannels.mockResolvedValue(mockSearchResults);
            mockRequest.query = { query: 'test', pageToken: 'next-page' };
            // Execute
            await youtube_controller_1.YouTubeController.searchChannels(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.searchChannels).toHaveBeenCalledWith('test', 10, 'next-page');
        });
    });
    describe('getChannelDetails', () => {
        it('should return channel details for valid ID', async () => {
            // Setup
            const mockChannel = {
                id: 'test-channel-id',
                snippet: { title: 'Test Channel' },
                statistics: { subscriberCount: 1000 }
            };
            youtube_service_1.youtubeService.getChannel.mockResolvedValue(mockChannel);
            mockRequest.params = { id: 'test-channel-id' };
            // Execute
            await youtube_controller_1.YouTubeController.getChannelDetails(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getChannel).toHaveBeenCalledWith('test-channel-id');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockChannel);
        });
        it('should handle missing channel ID', async () => {
            // Setup - missing ID parameter
            mockRequest.params = {};
            // Execute
            await youtube_controller_1.YouTubeController.getChannelDetails(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getChannel).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ message: 'Channel ID is required' });
        });
        it('should handle service errors', async () => {
            // Setup
            const mockError = new Error('API error');
            youtube_service_1.youtubeService.getChannel.mockRejectedValue(mockError);
            mockRequest.params = { id: 'invalid-id' };
            // Execute
            await youtube_controller_1.YouTubeController.getChannelDetails(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Failed to fetch channel details',
                error: 'API error'
            });
        });
    });
    describe('addChannel', () => {
        it('should add a new channel successfully', async () => {
            // Setup
            const channelId = 'test-channel-id';
            const userId = 'test-user-id';
            // Update the request user object to match expected type
            mockRequest.body = { channelId };
            const mockChannelData = {
                snippet: {
                    title: 'Test Channel',
                    description: 'Description',
                    customUrl: 'testchannel',
                    thumbnails: {
                        high: { url: 'http://example.com/high.jpg' },
                        default: { url: 'http://example.com/default.jpg' }
                    },
                    publishedAt: '2020-01-01T00:00:00Z',
                    country: 'US'
                },
                statistics: {
                    subscriberCount: 1000,
                    videoCount: 100
                }
            };
            // Mock Channel.findOne to return null (channel doesn't exist)
            channel_model_1.Channel.findOne.mockResolvedValue(null);
            // Mock youtubeService.getChannel
            youtube_service_1.youtubeService.getChannel.mockResolvedValue(mockChannelData);
            // Mock Channel constructor and save method
            const saveMock = jest.fn().mockResolvedValue(true);
            const mockChannelInstance = { save: saveMock };
            channel_model_1.Channel.mockImplementation(() => mockChannelInstance);
            // Execute
            await youtube_controller_1.YouTubeController.addChannel(mockRequest, mockResponse);
            // Assert
            expect(channel_model_1.Channel.findOne).toHaveBeenCalledWith({ youtubeId: channelId });
            expect(youtube_service_1.youtubeService.getChannel).toHaveBeenCalledWith(channelId);
            expect(channel_model_1.Channel).toHaveBeenCalledWith(expect.objectContaining({
                youtubeId: channelId,
                name: 'Test Channel',
                description: 'Description',
                customUrl: 'testchannel',
                thumbnailUrl: 'http://example.com/high.jpg',
                subscriberCount: 1000,
                videoCount: 100,
                country: 'US',
            }));
            expect(saveMock).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Channel added successfully',
                channel: mockChannelInstance
            });
        });
        it('should return 409 if channel already exists', async () => {
            // Setup
            const existingChannel = { _id: 'channel-db-id', youtubeId: 'test-channel-id' };
            channel_model_1.Channel.findOne.mockResolvedValue(existingChannel);
            mockRequest.body = { channelId: 'test-channel-id' };
            // Execute
            await youtube_controller_1.YouTubeController.addChannel(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getChannel).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Channel already exists',
                channel: existingChannel
            });
        });
        it('should handle missing channel ID', async () => {
            // Setup - missing channelId
            mockRequest.body = {};
            // Execute
            await youtube_controller_1.YouTubeController.addChannel(mockRequest, mockResponse);
            // Assert
            expect(channel_model_1.Channel.findOne).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ message: 'Channel ID is required' });
        });
        it('should handle missing user authentication', async () => {
            // Setup - no user ID
            mockRequest.body = { channelId: 'test-channel-id' };
            // Remove user to simulate unauthenticated request
            mockRequest.user = undefined;
            // Execute
            await youtube_controller_1.YouTubeController.addChannel(mockRequest, mockResponse);
            // Assert
            expect(channel_model_1.Channel.findOne).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseJson).toHaveBeenCalledWith({ message: 'User authentication required' });
        });
        it('should handle service errors', async () => {
            // Setup
            const mockError = new Error('API error');
            channel_model_1.Channel.findOne.mockResolvedValue(null);
            youtube_service_1.youtubeService.getChannel.mockRejectedValue(mockError);
            mockRequest.body = { channelId: 'test-channel-id' };
            // Execute
            await youtube_controller_1.YouTubeController.addChannel(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Failed to add channel',
                error: 'API error'
            });
        });
    });
    // Testing one more endpoint to show comprehensive approach
    describe('getPlaylistVideos', () => {
        it('should return videos for valid playlist ID', async () => {
            // Setup
            const mockVideos = {
                items: [
                    { id: 'video1', snippet: { title: 'Video 1' } },
                    { id: 'video2', snippet: { title: 'Video 2' } }
                ],
                nextPageToken: 'next-token'
            };
            youtube_service_1.youtubeService.getPlaylistVideos.mockResolvedValue(mockVideos);
            mockRequest.params = { playlistId: 'test-playlist-id' };
            mockRequest.query = { maxResults: '5' };
            // Execute
            await youtube_controller_1.YouTubeController.getPlaylistVideos(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getPlaylistVideos).toHaveBeenCalledWith('test-playlist-id', 5, undefined);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockVideos);
        });
        it('should handle missing playlist ID', async () => {
            // Setup - missing playlistId
            mockRequest.params = {};
            // Execute
            await youtube_controller_1.YouTubeController.getPlaylistVideos(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getPlaylistVideos).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({ message: 'Playlist ID is required' });
        });
        it('should use default maxResults when not provided', async () => {
            // Setup
            const mockVideos = { items: [] };
            youtube_service_1.youtubeService.getPlaylistVideos.mockResolvedValue(mockVideos);
            mockRequest.params = { playlistId: 'test-playlist-id' };
            // No maxResults
            // Execute
            await youtube_controller_1.YouTubeController.getPlaylistVideos(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getPlaylistVideos).toHaveBeenCalledWith('test-playlist-id', 10, undefined);
        });
        it('should handle service errors', async () => {
            // Setup
            const mockError = new Error('API error');
            youtube_service_1.youtubeService.getPlaylistVideos.mockRejectedValue(mockError);
            mockRequest.params = { playlistId: 'invalid-id' };
            // Execute
            await youtube_controller_1.YouTubeController.getPlaylistVideos(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Failed to fetch playlist videos',
                error: 'API error'
            });
        });
    });
    // Add just a few more test examples to illustrate comprehensive coverage
    describe('getQuotaUsage', () => {
        it('should return quota usage', async () => {
            // Setup
            const mockQuotaUsage = {
                daily: 5000,
                used: 1200,
                remaining: 3800,
                resetTime: '2023-01-01T00:00:00Z'
            };
            youtube_service_1.youtubeService.getQuotaUsage.mockReturnValue(mockQuotaUsage);
            // Execute
            await youtube_controller_1.YouTubeController.getQuotaUsage(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.getQuotaUsage).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockQuotaUsage);
        });
        it('should handle errors', async () => {
            // Setup
            const mockError = new Error('Service error');
            youtube_service_1.youtubeService.getQuotaUsage.mockImplementation(() => {
                throw mockError;
            });
            // Execute
            await youtube_controller_1.YouTubeController.getQuotaUsage(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({
                message: 'Failed to fetch quota usage',
                error: 'Service error'
            });
        });
    });
    describe('search', () => {
        it('should perform search with all parameters', async () => {
            // Setup
            const mockSearchResults = { items: [] };
            youtube_service_1.youtubeService.search.mockResolvedValue(mockSearchResults);
            mockRequest.query = {
                query: 'test',
                maxResults: '15',
                pageToken: 'token',
                type: 'video',
                order: 'date',
                publishedAfter: '2022-01-01T00:00:00Z',
                publishedBefore: '2022-12-31T23:59:59Z',
                channelId: 'channel-id'
            };
            // Execute
            await youtube_controller_1.YouTubeController.search(mockRequest, mockResponse);
            // Assert
            expect(youtube_service_1.youtubeService.search).toHaveBeenCalledWith({
                query: 'test',
                maxResults: 15,
                pageToken: 'token',
                type: 'video',
                order: 'date',
                publishedAfter: expect.any(Date),
                publishedBefore: expect.any(Date),
                channelId: 'channel-id'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=youtube.controller.test.js.map