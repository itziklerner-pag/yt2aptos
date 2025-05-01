"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const youtube_controller_1 = require("../controllers/youtube.controller");
const router = express_1.default.Router();
/**
 * Channel Routes
 */
// Search channels
router.get('/channels/search', youtube_controller_1.YouTubeController.searchChannels);
// Get channel details
router.get('/channels/:id', youtube_controller_1.YouTubeController.getChannelDetails);
// Add channel to track
router.post('/channels', youtube_controller_1.YouTubeController.addChannel);
// Get playlists for a channel
router.get('/channels/:channelId/playlists', youtube_controller_1.YouTubeController.getChannelPlaylists);
// Get popular channels
router.get('/channels/discover/popular', youtube_controller_1.YouTubeController.getPopularChannels);
/**
 * Playlist Routes
 */
// Get playlist details
router.get('/playlists/:id', youtube_controller_1.YouTubeController.getPlaylistDetails);
// Add playlist to track
router.post('/playlists', youtube_controller_1.YouTubeController.addPlaylist);
// Get videos in a playlist
router.get('/playlists/:playlistId/videos', youtube_controller_1.YouTubeController.getPlaylistVideos);
/**
 * Video Routes
 */
// Get video details
router.get('/videos/:id', youtube_controller_1.YouTubeController.getVideoDetails);
/**
 * Search Routes
 */
// Search YouTube content
router.get('/search', youtube_controller_1.YouTubeController.search);
/**
 * Discovery Routes
 */
// Get trending videos
router.get('/discover/trending', youtube_controller_1.YouTubeController.getTrendingVideos);
// Get personalized recommendations
router.get('/discover/recommendations/:userId?', youtube_controller_1.YouTubeController.getRecommendations);
/**
 * System Routes
 */
// Get API quota usage
router.get('/quota', youtube_controller_1.YouTubeController.getQuotaUsage);
exports.default = router;
//# sourceMappingURL=youtube.routes.js.map