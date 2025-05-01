import { youtube_v3 } from 'googleapis';
/**
 * YouTube API quota counter interface
 */
interface QuotaUsage {
    used: number;
    limit: number;
    resetTime: Date;
}
/**
 * YouTube API search parameters
 */
export interface YouTubeSearchParams {
    query: string;
    maxResults?: number;
    pageToken?: string;
    type?: 'video' | 'channel' | 'playlist';
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
    publishedAfter?: Date;
    publishedBefore?: Date;
    channelId?: string;
}
/**
 * Service for interacting with the YouTube Data API
 */
export declare class YouTubeService {
    private youtube;
    private cache;
    private quotaUsage;
    private defaultMaxResults;
    private retryAttempts;
    private retryDelay;
    /**
     * Creates a new instance of YouTubeService
     */
    constructor();
    /**
     * Custom implementation of retry logic since p-retry is ESM-only
     * @param fn Function to retry
     * @param options Retry options
     * @returns Promise with the result of the function
     */
    private retry;
    /**
     * Calculate the next quota reset time based on interval string (e.g. '24h')
     * @param interval Reset interval as string (e.g. '24h', '1d')
     * @returns Date object for next reset time
     */
    private calculateResetTime;
    /**
     * Reset quota usage counter if the reset time has passed
     */
    private checkAndResetQuota;
    /**
     * Track quota usage for an API call
     * @param cost Quota cost of the API call
     * @throws Error if quota limit is exceeded
     */
    private trackQuotaUsage;
    /**
     * Get cached data or execute API call if not cached
     * @param options Cache options
     * @param apiCall API call function
     * @param quotaCost Quota cost of the API call
     * @returns API call result
     */
    private getCachedData;
    /**
     * Get information about a YouTube channel by ID
     * @param channelId YouTube channel ID
     * @returns Channel information
     */
    getChannel(channelId: string): Promise<youtube_v3.Schema$Channel>;
    /**
     * Search for YouTube channels
     * @param query Search query
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Search results with channels
     */
    searchChannels(query: string, maxResults?: number, pageToken?: string): Promise<youtube_v3.Schema$SearchListResponse>;
    /**
     * Get playlists for a YouTube channel
     * @param channelId YouTube channel ID
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Playlists for the channel
     */
    getChannelPlaylists(channelId: string, maxResults?: number, pageToken?: string): Promise<youtube_v3.Schema$PlaylistListResponse>;
    /**
     * Get information about a YouTube playlist by ID
     * @param playlistId YouTube playlist ID
     * @returns Playlist information
     */
    getPlaylist(playlistId: string): Promise<youtube_v3.Schema$Playlist>;
    /**
     * Get videos in a YouTube playlist
     * @param playlistId YouTube playlist ID
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Videos in the playlist
     */
    getPlaylistVideos(playlistId: string, maxResults?: number, pageToken?: string): Promise<youtube_v3.Schema$PlaylistItemListResponse>;
    /**
     * Get information about a YouTube video by ID
     * @param videoId YouTube video ID
     * @returns Video information
     */
    getVideo(videoId: string): Promise<youtube_v3.Schema$Video>;
    /**
     * Get videos from a YouTube channel (from uploads playlist)
     * @param channelId YouTube channel ID
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Videos uploaded by the channel
     */
    getChannelVideos(channelId: string, maxResults?: number, pageToken?: string): Promise<youtube_v3.Schema$PlaylistItemListResponse>;
    /**
     * Search for YouTube content (videos, channels, playlists)
     * @param params Search parameters
     * @returns Search results
     */
    search(params: YouTubeSearchParams): Promise<youtube_v3.Schema$SearchListResponse>;
    /**
     * Get current quota usage and limits
     * @returns Current quota usage information
     */
    getQuotaUsage(): QuotaUsage;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Clear specific cached data by key pattern
     * @param pattern Key pattern to match (e.g., 'video:*')
     */
    clearCacheByPattern(pattern: string): void;
}
export declare const youtubeService: YouTubeService;
export {};
