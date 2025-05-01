import { Request as ExpressRequest, Response } from 'express';

// Extended request interface with optional user property
interface Request extends ExpressRequest {
  user?: {
    id: string;
    [key: string]: any;
  };
}
import { youtubeService } from '../services/youtube.service';
import { logError } from '../utils/logger';
import { Channel } from '../models/channel.model';
import { Playlist } from '../models/playlist.model';
import { Video } from '../models/video.model';
import mongoose from 'mongoose';

/**
 * Controller for YouTube API operations
 */
export class YouTubeController {
  /**
   * Search YouTube for channels
   * @param req Express request
   * @param res Express response
   */
  static async searchChannels(req: Request, res: Response) {
    try {
      const { query, maxResults = 10, pageToken } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          message: 'Query parameter is required' 
        });
      }
      
      const searchResults = await youtubeService.searchChannels(
        query, 
        Number(maxResults), 
        pageToken as string
      );
      
      return res.status(200).json(searchResults);
    } catch (error) {
      logError('Error searching channels', error as Error);
      return res.status(500).json({ 
        message: 'Failed to search channels',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get channel details from YouTube
   * @param req Express request
   * @param res Express response
   */
  static async getChannelDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          message: 'Channel ID is required' 
        });
      }
      
      const channel = await youtubeService.getChannel(id);
      return res.status(200).json(channel);
    } catch (error) {
      logError(`Error fetching channel details for ID: ${req.params.id}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch channel details',
        error: (error as Error).message
      });
    }
  }

  /**
   * Add a channel to track from YouTube
   * @param req Express request
   * @param res Express response
   */
  static async addChannel(req: Request, res: Response) {
    try {
      const { channelId } = req.body;
      const userId = req.body.userId || req.user?.id; // Assuming auth middleware sets req.user
      
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
      const existingChannel = await Channel.findOne({ youtubeId: channelId });
      if (existingChannel) {
        return res.status(409).json({
          message: 'Channel already exists',
          channel: existingChannel
        });
      }
      
      // Fetch channel details from YouTube
      const channelData = await youtubeService.getChannel(channelId);
      
      // Create new channel in database
      const newChannel = new Channel({
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
        createdBy: new mongoose.Types.ObjectId(userId as string)
      });
      
      await newChannel.save();
      
      return res.status(201).json({
        message: 'Channel added successfully',
        channel: newChannel
      });
    } catch (error) {
      logError(`Error adding channel: ${req.body.channelId}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to add channel',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get playlists for a YouTube channel
   * @param req Express request
   * @param res Express response
   */
  static async getChannelPlaylists(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { maxResults = 10, pageToken } = req.query;
      
      if (!channelId) {
        return res.status(400).json({ 
          message: 'Channel ID is required' 
        });
      }
      
      const playlists = await youtubeService.getChannelPlaylists(
        channelId, 
        Number(maxResults), 
        pageToken as string
      );
      
      return res.status(200).json(playlists);
    } catch (error) {
      logError(`Error fetching playlists for channel ID: ${req.params.channelId}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch channel playlists',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get playlist details from YouTube
   * @param req Express request
   * @param res Express response
   */
  static async getPlaylistDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          message: 'Playlist ID is required' 
        });
      }
      
      const playlist = await youtubeService.getPlaylist(id);
      return res.status(200).json(playlist);
    } catch (error) {
      logError(`Error fetching playlist details for ID: ${req.params.id}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch playlist details',
        error: (error as Error).message
      });
    }
  }

  /**
   * Add a playlist to track from YouTube
   * @param req Express request
   * @param res Express response
   */
  static async addPlaylist(req: Request, res: Response) {
    try {
      const { playlistId, channelId } = req.body;
      const userId = req.body.userId || req.user?.id; // Assuming auth middleware sets req.user
      
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
      const channel = await Channel.findOne({ youtubeId: channelId });
      if (!channel) {
        return res.status(404).json({
          message: 'Channel not found, please add the channel first'
        });
      }
      
      // Check if playlist already exists
      const existingPlaylist = await Playlist.findOne({ youtubeId: playlistId });
      if (existingPlaylist) {
        return res.status(409).json({
          message: 'Playlist already exists',
          playlist: existingPlaylist
        });
      }
      
      // Fetch playlist details from YouTube
      const playlistData = await youtubeService.getPlaylist(playlistId);
      
      // Create new playlist in database
      const newPlaylist = new Playlist({
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
        createdBy: new mongoose.Types.ObjectId(userId as string)
      });
      
      await newPlaylist.save();
      
      return res.status(201).json({
        message: 'Playlist added successfully',
        playlist: newPlaylist
      });
    } catch (error) {
      logError(`Error adding playlist: ${req.body.playlistId}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to add playlist',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get videos in a YouTube playlist
   * @param req Express request
   * @param res Express response
   */
  static async getPlaylistVideos(req: Request, res: Response) {
    try {
      const { playlistId } = req.params;
      const { maxResults = 10, pageToken } = req.query;
      
      if (!playlistId) {
        return res.status(400).json({ 
          message: 'Playlist ID is required' 
        });
      }
      
      const videos = await youtubeService.getPlaylistVideos(
        playlistId, 
        Number(maxResults), 
        pageToken as string
      );
      
      return res.status(200).json(videos);
    } catch (error) {
      logError(`Error fetching videos for playlist ID: ${req.params.playlistId}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch playlist videos',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get video details from YouTube
   * @param req Express request
   * @param res Express response
   */
  static async getVideoDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          message: 'Video ID is required' 
        });
      }
      
      const video = await youtubeService.getVideo(id);
      return res.status(200).json(video);
    } catch (error) {
      logError(`Error fetching video details for ID: ${req.params.id}`, error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch video details',
        error: (error as Error).message
      });
    }
  }

  /**
   * Search YouTube for channels, videos, or playlists
   * @param req Express request
   * @param res Express response
   */
  static async search(req: Request, res: Response) {
    try {
      const { 
        query, 
        maxResults = 10, 
        pageToken, 
        type, 
        order = 'relevance',
        channelId
      } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          message: 'Query parameter is required' 
        });
      }

      // Parse date parameters if provided
      let publishedAfter: Date | undefined;
      let publishedBefore: Date | undefined;
      
      if (req.query.publishedAfter && typeof req.query.publishedAfter === 'string') {
        publishedAfter = new Date(req.query.publishedAfter);
      }
      
      if (req.query.publishedBefore && typeof req.query.publishedBefore === 'string') {
        publishedBefore = new Date(req.query.publishedBefore);
      }
      
      const searchResults = await youtubeService.search({
        query,
        maxResults: Number(maxResults),
        pageToken: pageToken as string,
        type: type as 'video' | 'channel' | 'playlist' | undefined,
        order: order as any,
        publishedAfter,
        publishedBefore,
        channelId: channelId as string
      });
      
      return res.status(200).json(searchResults);
    } catch (error) {
      logError('Error searching YouTube', error as Error);
      return res.status(500).json({ 
        message: 'Failed to search YouTube',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get channels popular among users in the system
   * @param req Express request
   * @param res Express response
   */
  static async getPopularChannels(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;
      
      // Get channels with most users tracking them
      const popularChannels = await Channel.aggregate([
        { $group: { _id: "$youtubeId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: Number(limit) }
      ]);
      
      // Get full channel details for the popular channels
      const channelDetails = await Promise.all(
        popularChannels.map(async (channel) => {
          const details = await Channel.findOne({ youtubeId: channel._id });
          return {
            ...details?.toObject(),
            trackingCount: channel.count
          };
        })
      );
      
      return res.status(200).json(channelDetails);
    } catch (error) {
      logError('Error fetching popular channels', error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch popular channels',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get recommendations based on user history
   * @param req Express request
   * @param res Express response
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.id; // Assuming auth middleware sets req.user
      
      if (!userId) {
        return res.status(401).json({ 
          message: 'User authentication required' 
        });
      }
      
      // Get user's tracked channels
      const userChannels = await Channel.find({ 
        createdBy: new mongoose.Types.ObjectId(userId as string) 
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
      const searchResults = await youtubeService.searchChannels(
        baseChannel.name, 
        10
      );
      
      // Filter out channels the user is already tracking
      const trackedIds = userChannels.map(c => c.youtubeId);
      const recommendations = searchResults.items?.filter(item => 
        !trackedIds.includes(item.id?.channelId || '')
      );
      
      return res.status(200).json({
        baseChannelName: baseChannel.name,
        recommendations
      });
    } catch (error) {
      logError('Error generating recommendations', error as Error);
      return res.status(500).json({ 
        message: 'Failed to generate recommendations',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get trending videos from YouTube
   * @param req Express request
   * @param res Express response
   */
  static async getTrendingVideos(req: Request, res: Response) {
    try {
      const { maxResults = 10, pageToken } = req.query;
      
      // For trending videos, we search with empty query and sort by viewCount
      const trendingVideos = await youtubeService.search({
        query: '',
        maxResults: Number(maxResults),
        pageToken: pageToken as string,
        type: 'video',
        order: 'viewCount'
      });
      
      return res.status(200).json(trendingVideos);
    } catch (error) {
      logError('Error fetching trending videos', error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch trending videos',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get YouTube API quota usage
   * @param req Express request
   * @param res Express response
   */
  static async getQuotaUsage(req: Request, res: Response) {
    try {
      const quotaUsage = youtubeService.getQuotaUsage();
      return res.status(200).json(quotaUsage);
    } catch (error) {
      logError('Error fetching quota usage', error as Error);
      return res.status(500).json({ 
        message: 'Failed to fetch quota usage',
        error: (error as Error).message
      });
    }
  }
}