"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeController = void 0;
const youtube_service_1 = require("../services/youtube.service");
const logger_1 = require("../utils/logger");
const channel_model_1 = require("../models/channel.model");
const playlist_model_1 = require("../models/playlist.model");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Controller for YouTube API operations
 */
class YouTubeController {
    /**
     * Search YouTube for channels
     * @param req Express request
     * @param res Express response
     */
    static async searchChannels(req, res) {
        try {
            const { query, maxResults = 10, pageToken } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    message: 'Query parameter is required'
                });
            }
            const searchResults = await youtube_service_1.youtubeService.searchChannels(query, Number(maxResults), pageToken);
            return res.status(200).json(searchResults);
        }
        catch (error) {
            (0, logger_1.logError)('Error searching channels', error);
            return res.status(500).json({
                message: 'Failed to search channels',
                error: error.message
            });
        }
    }
    /**
     * Get channel details from YouTube
     * @param req Express request
     * @param res Express response
     */
    static async getChannelDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    message: 'Channel ID is required'
                });
            }
            const channel = await youtube_service_1.youtubeService.getChannel(id);
            return res.status(200).json(channel);
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching channel details for ID: ${req.params.id}`, error);
            return res.status(500).json({
                message: 'Failed to fetch channel details',
                error: error.message
            });
        }
    }
    /**
     * Add a channel to track from YouTube
     * @param req Express request
     * @param res Express response
     */
    static async addChannel(req, res) {
        try {
            const { channelId } = req.body;
            const userId = req.body.userId || req.user?.userId; // Assuming auth middleware sets req.user
            if (!channelId) {
                return res.status(400).json({
                    message: 'Channel ID is required'
                });
            }
            if (!userId) {
                return res.status(401).json({
                    message: 'User authentication required'
                });
            }
            // Check if channel already exists
            const existingChannel = await channel_model_1.Channel.findOne({ youtubeId: channelId });
            if (existingChannel) {
                return res.status(409).json({
                    message: 'Channel already exists',
                    channel: existingChannel
                });
            }
            // Fetch channel details from YouTube
            const channelData = await youtube_service_1.youtubeService.getChannel(channelId);
            // Create new channel in database
            const newChannel = new channel_model_1.Channel({
                youtubeId: channelId,
                name: channelData.snippet?.title || 'Unknown Channel',
                description: channelData.snippet?.description,
                customUrl: channelData.snippet?.customUrl,
                thumbnailUrl: channelData.snippet?.thumbnails?.high?.url || channelData.snippet?.thumbnails?.default?.url,
                subscriberCount: channelData.statistics?.subscriberCount,
                videoCount: channelData.statistics?.videoCount,
                country: channelData.snippet?.country,
                publishedAt: channelData.snippet?.publishedAt,
                lastChecked: new Date(),
                isArchived: false,
                archiveStatus: 'none',
                createdBy: new mongoose_1.default.Types.ObjectId(userId)
            });
            await newChannel.save();
            return res.status(201).json({
                message: 'Channel added successfully',
                channel: newChannel
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error adding channel: ${req.body.channelId}`, error);
            return res.status(500).json({
                message: 'Failed to add channel',
                error: error.message
            });
        }
    }
    /**
     * Get playlists for a YouTube channel
     * @param req Express request
     * @param res Express response
     */
    static async getChannelPlaylists(req, res) {
        try {
            const { channelId } = req.params;
            const { maxResults = 10, pageToken } = req.query;
            if (!channelId) {
                return res.status(400).json({
                    message: 'Channel ID is required'
                });
            }
            const playlists = await youtube_service_1.youtubeService.getChannelPlaylists(channelId, Number(maxResults), pageToken);
            return res.status(200).json(playlists);
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching playlists for channel ID: ${req.params.channelId}`, error);
            return res.status(500).json({
                message: 'Failed to fetch channel playlists',
                error: error.message
            });
        }
    }
    /**
     * Get playlist details from YouTube
     * @param req Express request
     * @param res Express response
     */
    static async getPlaylistDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    message: 'Playlist ID is required'
                });
            }
            const playlist = await youtube_service_1.youtubeService.getPlaylist(id);
            return res.status(200).json(playlist);
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching playlist details for ID: ${req.params.id}`, error);
            return res.status(500).json({
                message: 'Failed to fetch playlist details',
                error: error.message
            });
        }
    }
    /**
     * Add a playlist to track from YouTube
     * @param req Express request
     * @param res Express response
     */
    static async addPlaylist(req, res) {
        try {
            const { playlistId, channelId } = req.body;
            const userId = req.body.userId || req.user?.userId; // Assuming auth middleware sets req.user
            if (!playlistId || !channelId) {
                return res.status(400).json({
                    message: 'Playlist ID and Channel ID are required'
                });
            }
            if (!userId) {
                return res.status(401).json({
                    message: 'User authentication required'
                });
            }
            // Check if channel exists
            const channel = await channel_model_1.Channel.findOne({ youtubeId: channelId });
            if (!channel) {
                return res.status(404).json({
                    message: 'Channel not found, please add the channel first'
                });
            }
            // Check if playlist already exists
            const existingPlaylist = await playlist_model_1.Playlist.findOne({ youtubeId: playlistId });
            if (existingPlaylist) {
                return res.status(409).json({
                    message: 'Playlist already exists',
                    playlist: existingPlaylist
                });
            }
            // Fetch playlist details from YouTube
            const playlistData = await youtube_service_1.youtubeService.getPlaylist(playlistId);
            // Create new playlist in database
            const newPlaylist = new playlist_model_1.Playlist({
                youtubeId: playlistId,
                title: playlistData.snippet?.title || 'Unknown Playlist',
                description: playlistData.snippet?.description,
                thumbnailUrl: playlistData.snippet?.thumbnails?.high?.url || playlistData.snippet?.thumbnails?.default?.url,
                itemCount: playlistData.contentDetails?.itemCount,
                publishedAt: playlistData.snippet?.publishedAt,
                lastChecked: new Date(),
                isArchived: false,
                archiveStatus: 'none',
                channelId: channel._id,
                createdBy: new mongoose_1.default.Types.ObjectId(userId)
            });
            await newPlaylist.save();
            return res.status(201).json({
                message: 'Playlist added successfully',
                playlist: newPlaylist
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error adding playlist: ${req.body.playlistId}`, error);
            return res.status(500).json({
                message: 'Failed to add playlist',
                error: error.message
            });
        }
    }
    /**
     * Get videos in a YouTube playlist
     * @param req Express request
     * @param res Express response
     */
    static async getPlaylistVideos(req, res) {
        try {
            const { playlistId } = req.params;
            const { maxResults = 10, pageToken } = req.query;
            if (!playlistId) {
                return res.status(400).json({
                    message: 'Playlist ID is required'
                });
            }
            const videos = await youtube_service_1.youtubeService.getPlaylistVideos(playlistId, Number(maxResults), pageToken);
            return res.status(200).json(videos);
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching videos for playlist ID: ${req.params.playlistId}`, error);
            return res.status(500).json({
                message: 'Failed to fetch playlist videos',
                error: error.message
            });
        }
    }
    /**
     * Get video details from YouTube
     * @param req Express request
     * @param res Express response
     */
    static async getVideoDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    message: 'Video ID is required'
                });
            }
            const video = await youtube_service_1.youtubeService.getVideo(id);
            return res.status(200).json(video);
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching video details for ID: ${req.params.id}`, error);
            return res.status(500).json({
                message: 'Failed to fetch video details',
                error: error.message
            });
        }
    }
    /**
     * Search YouTube for channels, videos, or playlists
     * @param req Express request
     * @param res Express response
     */
    static async search(req, res) {
        try {
            const { query, maxResults = 10, pageToken, type, order = 'relevance', channelId } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    message: 'Query parameter is required'
                });
            }
            // Parse date parameters if provided
            let publishedAfter;
            let publishedBefore;
            if (req.query.publishedAfter && typeof req.query.publishedAfter === 'string') {
                publishedAfter = new Date(req.query.publishedAfter);
            }
            if (req.query.publishedBefore && typeof req.query.publishedBefore === 'string') {
                publishedBefore = new Date(req.query.publishedBefore);
            }
            const searchResults = await youtube_service_1.youtubeService.search({
                query,
                maxResults: Number(maxResults),
                pageToken: pageToken,
                type: type,
                order: order,
                publishedAfter,
                publishedBefore,
                channelId: channelId
            });
            return res.status(200).json(searchResults);
        }
        catch (error) {
            (0, logger_1.logError)('Error searching YouTube', error);
            return res.status(500).json({
                message: 'Failed to search YouTube',
                error: error.message
            });
        }
    }
    /**
     * Get channels popular among users in the system
     * @param req Express request
     * @param res Express response
     */
    static async getPopularChannels(req, res) {
        try {
            const { limit = 10 } = req.query;
            // Get channels with most users tracking them
            const popularChannels = await channel_model_1.Channel.aggregate([
                { $group: { _id: "$youtubeId", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: Number(limit) }
            ]);
            // Get full channel details for the popular channels
            const channelDetails = await Promise.all(popularChannels.map(async (channel) => {
                const details = await channel_model_1.Channel.findOne({ youtubeId: channel._id });
                return {
                    ...details?.toObject(),
                    trackingCount: channel.count
                };
            }));
            return res.status(200).json(channelDetails);
        }
        catch (error) {
            (0, logger_1.logError)('Error fetching popular channels', error);
            return res.status(500).json({
                message: 'Failed to fetch popular channels',
                error: error.message
            });
        }
    }
    /**
     * Get recommendations based on user history
     * @param req Express request
     * @param res Express response
     */
    static async getRecommendations(req, res) {
        try {
            const userId = req.params.userId || req.user?.userId; // Assuming auth middleware sets req.user
            if (!userId) {
                return res.status(401).json({
                    message: 'User authentication required'
                });
            }
            // Get user's tracked channels
            const userChannels = await channel_model_1.Channel.find({
                createdBy: new mongoose_1.default.Types.ObjectId(userId)
            });
            if (userChannels.length === 0) {
                return res.status(200).json({
                    message: 'No tracked channels found to base recommendations on',
                    recommendations: []
                });
            }
            // Get random channel from user's collection to base recommendations on
            const randomIndex = Math.floor(Math.random() * userChannels.length);
            const baseChannel = userChannels[randomIndex];
            // Search for similar channels
            const searchResults = await youtube_service_1.youtubeService.searchChannels(baseChannel.name, 10);
            // Filter out channels the user is already tracking
            const trackedIds = userChannels.map(c => c.youtubeId);
            const recommendations = searchResults.items?.filter(item => !trackedIds.includes(item.id?.channelId || ''));
            return res.status(200).json({
                baseChannelName: baseChannel.name,
                recommendations
            });
        }
        catch (error) {
            (0, logger_1.logError)('Error generating recommendations', error);
            return res.status(500).json({
                message: 'Failed to generate recommendations',
                error: error.message
            });
        }
    }
    /**
     * Get trending videos from YouTube
     * @param req Express request
     * @param res Express response
     */
    static async getTrendingVideos(req, res) {
        try {
            const { maxResults = 10, pageToken } = req.query;
            // For trending videos, we search with empty query and sort by viewCount
            const trendingVideos = await youtube_service_1.youtubeService.search({
                query: '',
                maxResults: Number(maxResults),
                pageToken: pageToken,
                type: 'video',
                order: 'viewCount'
            });
            return res.status(200).json(trendingVideos);
        }
        catch (error) {
            (0, logger_1.logError)('Error fetching trending videos', error);
            return res.status(500).json({
                message: 'Failed to fetch trending videos',
                error: error.message
            });
        }
    }
    /**
     * Get YouTube API quota usage
     * @param req Express request
     * @param res Express response
     */
    static async getQuotaUsage(req, res) {
        try {
            const quotaUsage = youtube_service_1.youtubeService.getQuotaUsage();
            return res.status(200).json(quotaUsage);
        }
        catch (error) {
            (0, logger_1.logError)('Error fetching quota usage', error);
            return res.status(500).json({
                message: 'Failed to fetch quota usage',
                error: error.message
            });
        }
    }
}
exports.YouTubeController = YouTubeController;
//# sourceMappingURL=youtube.controller.js.map