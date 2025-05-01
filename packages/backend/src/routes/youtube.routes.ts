import express, { Router } from 'express';
import { YouTubeController } from '../controllers/youtube.controller';

const router: Router = express.Router();

/**
 * Channel Routes
 */
// Search channels
router.get('/channels/search', YouTubeController.searchChannels);

// Get channel details
router.get('/channels/:id', YouTubeController.getChannelDetails);

// Add channel to track
router.post('/channels', YouTubeController.addChannel);

// Get playlists for a channel
router.get('/channels/:channelId/playlists', YouTubeController.getChannelPlaylists);

// Get popular channels
router.get('/channels/discover/popular', YouTubeController.getPopularChannels);

/**
 * Playlist Routes
 */
// Get playlist details
router.get('/playlists/:id', YouTubeController.getPlaylistDetails);

// Add playlist to track
router.post('/playlists', YouTubeController.addPlaylist);

// Get videos in a playlist
router.get('/playlists/:playlistId/videos', YouTubeController.getPlaylistVideos);

/**
 * Video Routes
 */
// Get video details
router.get('/videos/:id', YouTubeController.getVideoDetails);

/**
 * Search Routes
 */
// Search YouTube content
router.get('/search', YouTubeController.search);

/**
 * Discovery Routes
 */
// Get trending videos
router.get('/discover/trending', YouTubeController.getTrendingVideos);

// Get personalized recommendations
router.get('/discover/recommendations/:userId?', YouTubeController.getRecommendations);

/**
 * System Routes
 */
// Get API quota usage
router.get('/quota', YouTubeController.getQuotaUsage);

export default router;