import { Request, Response } from 'express';
/**
 * Controller for YouTube API operations
 */
export declare class YouTubeController {
    /**
     * Search YouTube for channels
     * @param req Express request
     * @param res Express response
     */
    static searchChannels(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get channel details from YouTube
     * @param req Express request
     * @param res Express response
     */
    static getChannelDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Add a channel to track from YouTube
     * @param req Express request
     * @param res Express response
     */
    static addChannel(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get playlists for a YouTube channel
     * @param req Express request
     * @param res Express response
     */
    static getChannelPlaylists(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get playlist details from YouTube
     * @param req Express request
     * @param res Express response
     */
    static getPlaylistDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Add a playlist to track from YouTube
     * @param req Express request
     * @param res Express response
     */
    static addPlaylist(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get videos in a YouTube playlist
     * @param req Express request
     * @param res Express response
     */
    static getPlaylistVideos(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get video details from YouTube
     * @param req Express request
     * @param res Express response
     */
    static getVideoDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Search YouTube for channels, videos, or playlists
     * @param req Express request
     * @param res Express response
     */
    static search(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get channels popular among users in the system
     * @param req Express request
     * @param res Express response
     */
    static getPopularChannels(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get recommendations based on user history
     * @param req Express request
     * @param res Express response
     */
    static getRecommendations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get trending videos from YouTube
     * @param req Express request
     * @param res Express response
     */
    static getTrendingVideos(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get YouTube API quota usage
     * @param req Express request
     * @param res Express response
     */
    static getQuotaUsage(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
