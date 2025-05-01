"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeService = exports.YouTubeService = void 0;
const googleapis_1 = require("googleapis");
const node_cache_1 = __importDefault(require("node-cache"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
/**
 * Custom abort error class for retry operations
 */
class AbortError extends Error {
    constructor(message) {
        super(typeof message === 'string' ? message : message.message);
        this.name = 'AbortError';
        if (typeof message !== 'string' && message.stack) {
            this.stack = message.stack;
        }
    }
}
/**
 * Service for interacting with the YouTube Data API
 */
class YouTubeService {
    youtube;
    cache;
    quotaUsage;
    defaultMaxResults;
    retryAttempts;
    retryDelay;
    /**
     * Creates a new instance of YouTubeService
     */
    constructor() {
        // Initialize YouTube API client
        this.youtube = googleapis_1.google.youtube({
            version: 'v3',
            auth: env_1.env.YOUTUBE_API_KEY
        });
        // Initialize cache with default TTL from environment
        this.cache = new node_cache_1.default({
            stdTTL: env_1.env.YOUTUBE_API_CACHE_TTL,
            checkperiod: env_1.env.YOUTUBE_API_CACHE_TTL / 10, // Check for expired keys at 1/10 of TTL
            useClones: false // Don't clone objects on get/set for better performance
        });
        // Initialize quota counter
        this.quotaUsage = {
            used: 0,
            limit: env_1.env.YOUTUBE_API_QUOTA_LIMIT,
            resetTime: this.calculateResetTime(env_1.env.YOUTUBE_API_QUOTA_RESET_INTERVAL)
        };
        this.defaultMaxResults = env_1.env.YOUTUBE_API_MAX_RESULTS;
        this.retryAttempts = env_1.env.YOUTUBE_API_RETRY_ATTEMPTS;
        this.retryDelay = env_1.env.YOUTUBE_API_RETRY_DELAY;
        (0, logger_1.logInfo)('Initialized YouTube API service', {
            quotaLimit: this.quotaUsage.limit,
            resetInterval: env_1.env.YOUTUBE_API_QUOTA_RESET_INTERVAL,
            cacheTTL: env_1.env.YOUTUBE_API_CACHE_TTL
        });
    }
    /**
     * Custom implementation of retry logic since p-retry is ESM-only
     * @param fn Function to retry
     * @param options Retry options
     * @returns Promise with the result of the function
     */
    async retry(fn, options) {
        const { retries, minTimeout, onFailedAttempt } = options;
        let lastError;
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                // Cast error to proper type
                const err = error instanceof Error ? error : new Error(String(error));
                // If it's an abort error, don't retry
                if (err instanceof AbortError) {
                    throw err;
                }
                // Last attempt, throw the error
                if (attempt > retries) {
                    throw err;
                }
                // Call the onFailedAttempt callback
                if (onFailedAttempt) {
                    try {
                        onFailedAttempt(err, attempt);
                    }
                    catch (cbError) {
                        throw cbError;
                    }
                }
                // Calculate delay with exponential backoff
                const delay = minTimeout * Math.pow(2, attempt - 1);
                // Wait before next retry
                await new Promise(resolve => setTimeout(resolve, delay));
                lastError = err;
            }
        }
        // This code should never be reached, but TypeScript requires a return
        throw lastError;
    }
    /**
     * Calculate the next quota reset time based on interval string (e.g. '24h')
     * @param interval Reset interval as string (e.g. '24h', '1d')
     * @returns Date object for next reset time
     */
    calculateResetTime(interval) {
        const resetTime = new Date();
        const match = interval.match(/^(\d+)([hd])$/);
        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2];
            if (unit === 'h') {
                resetTime.setHours(resetTime.getHours() + value);
            }
            else if (unit === 'd') {
                resetTime.setDate(resetTime.getDate() + value);
            }
        }
        else {
            // Default to 24 hours if invalid format
            resetTime.setHours(resetTime.getHours() + 24);
        }
        return resetTime;
    }
    /**
     * Reset quota usage counter if the reset time has passed
     */
    checkAndResetQuota() {
        const now = new Date();
        if (now >= this.quotaUsage.resetTime) {
            (0, logger_1.logInfo)('Resetting YouTube API quota counter', {
                previousUsage: this.quotaUsage.used,
                limit: this.quotaUsage.limit,
            });
            this.quotaUsage.used = 0;
            this.quotaUsage.resetTime = this.calculateResetTime(env_1.env.YOUTUBE_API_QUOTA_RESET_INTERVAL);
        }
    }
    /**
     * Track quota usage for an API call
     * @param cost Quota cost of the API call
     * @throws Error if quota limit is exceeded
     */
    trackQuotaUsage(cost) {
        this.checkAndResetQuota();
        if (this.quotaUsage.used + cost > this.quotaUsage.limit) {
            const error = new Error('YouTube API quota limit exceeded');
            (0, logger_1.logError)('Quota limit exceeded', error);
            throw error;
        }
        this.quotaUsage.used += cost;
        (0, logger_1.logDebug)(`YouTube API quota usage: ${this.quotaUsage.used}/${this.quotaUsage.limit}`);
    }
    /**
     * Get cached data or execute API call if not cached
     * @param options Cache options
     * @param apiCall API call function
     * @param quotaCost Quota cost of the API call
     * @returns API call result
     */
    async getCachedData(options, apiCall, quotaCost = 1) {
        const { key, ttl } = options;
        // Try to get from cache first
        const cachedData = this.cache.get(key);
        if (cachedData) {
            (0, logger_1.logDebug)(`Cache hit for: ${key}`);
            return cachedData;
        }
        // Track quota usage before making the API call
        this.trackQuotaUsage(quotaCost);
        // Execute API call with retry logic
        try {
            const data = await this.retry(async () => {
                try {
                    return await apiCall();
                }
                catch (error) {
                    const apiError = error;
                    // Handle API errors
                    if (apiError.code === 403 && apiError.errors?.[0]?.reason === 'quotaExceeded') {
                        (0, logger_1.logError)('YouTube API quota exceeded', apiError);
                        // Abort retry for quota issues
                        throw new AbortError(apiError);
                    }
                    if (apiError.code === 404) {
                        (0, logger_1.logWarning)(`YouTube API resource not found: ${key}`, apiError);
                        // Abort retry for not found errors
                        throw new AbortError(apiError);
                    }
                    // Log and allow retry for other errors
                    (0, logger_1.logWarning)(`YouTube API error (will retry): ${apiError.message || 'Unknown error'}`, apiError);
                    throw apiError;
                }
            }, {
                retries: this.retryAttempts,
                minTimeout: this.retryDelay,
                onFailedAttempt: (error, attempt) => {
                    const retriesLeft = this.retryAttempts - attempt + 1;
                    (0, logger_1.logWarning)(`Attempt ${attempt} failed. ${retriesLeft} retries left.`, error);
                }
            });
            // Cache the successful result with optional TTL
            if (ttl !== undefined) {
                this.cache.set(key, data, ttl);
            }
            else {
                this.cache.set(key, data);
            }
            (0, logger_1.logDebug)(`Cached data for: ${key}`);
            return data;
        }
        catch (error) {
            const finalError = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(`YouTube API error after retries: ${finalError.message}`, finalError);
            throw finalError;
        }
    }
    /**
     * Get information about a YouTube channel by ID
     * @param channelId YouTube channel ID
     * @returns Channel information
     */
    async getChannel(channelId) {
        const cacheKey = `channel:${channelId}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.channels.list({
                id: [channelId],
                part: ['snippet', 'contentDetails', 'statistics']
            });
            const channel = response.data.items?.[0];
            if (!channel) {
                throw new Error(`Channel not found: ${channelId}`);
            }
            return channel;
        }, 1 // Quota cost for channels.list
        );
    }
    /**
     * Search for YouTube channels
     * @param query Search query
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Search results with channels
     */
    async searchChannels(query, maxResults = this.defaultMaxResults, pageToken) {
        const cacheKey = `search:channels:${query}:${maxResults}:${pageToken || 'first'}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.search.list({
                q: query,
                maxResults,
                pageToken,
                part: ['snippet'],
                type: ['channel'],
                safeSearch: 'none'
            });
            return response.data;
        }, 100 // Quota cost for search.list
        );
    }
    /**
     * Get playlists for a YouTube channel
     * @param channelId YouTube channel ID
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Playlists for the channel
     */
    async getChannelPlaylists(channelId, maxResults = this.defaultMaxResults, pageToken) {
        const cacheKey = `playlists:channel:${channelId}:${maxResults}:${pageToken || 'first'}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.playlists.list({
                channelId,
                maxResults,
                pageToken,
                part: ['snippet', 'contentDetails'],
            });
            return response.data;
        }, 1 // Quota cost for playlists.list
        );
    }
    /**
     * Get information about a YouTube playlist by ID
     * @param playlistId YouTube playlist ID
     * @returns Playlist information
     */
    async getPlaylist(playlistId) {
        const cacheKey = `playlist:${playlistId}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.playlists.list({
                id: [playlistId],
                part: ['snippet', 'contentDetails']
            });
            const playlist = response.data.items?.[0];
            if (!playlist) {
                throw new Error(`Playlist not found: ${playlistId}`);
            }
            return playlist;
        }, 1 // Quota cost for playlists.list
        );
    }
    /**
     * Get videos in a YouTube playlist
     * @param playlistId YouTube playlist ID
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Videos in the playlist
     */
    async getPlaylistVideos(playlistId, maxResults = this.defaultMaxResults, pageToken) {
        const cacheKey = `playlistItems:${playlistId}:${maxResults}:${pageToken || 'first'}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.playlistItems.list({
                playlistId,
                maxResults,
                pageToken,
                part: ['snippet', 'contentDetails', 'status']
            });
            return response.data;
        }, 1 // Quota cost for playlistItems.list
        );
    }
    /**
     * Get information about a YouTube video by ID
     * @param videoId YouTube video ID
     * @returns Video information
     */
    async getVideo(videoId) {
        const cacheKey = `video:${videoId}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.videos.list({
                id: [videoId],
                part: ['snippet', 'contentDetails', 'statistics']
            });
            const video = response.data.items?.[0];
            if (!video) {
                throw new Error(`Video not found: ${videoId}`);
            }
            return video;
        }, 1 // Quota cost for videos.list
        );
    }
    /**
     * Get videos from a YouTube channel (from uploads playlist)
     * @param channelId YouTube channel ID
     * @param maxResults Maximum number of results to return
     * @param pageToken Page token for pagination
     * @returns Videos uploaded by the channel
     */
    async getChannelVideos(channelId, maxResults = this.defaultMaxResults, pageToken) {
        // First get the channel to find the uploads playlist ID
        const channel = await this.getChannel(channelId);
        const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) {
            throw new Error(`Uploads playlist not found for channel: ${channelId}`);
        }
        // Then get the videos from the uploads playlist
        return this.getPlaylistVideos(uploadsPlaylistId, maxResults, pageToken);
    }
    /**
     * Search for YouTube content (videos, channels, playlists)
     * @param params Search parameters
     * @returns Search results
     */
    async search(params) {
        const { query, maxResults = this.defaultMaxResults, pageToken, type, order = 'relevance', publishedAfter, publishedBefore, channelId } = params;
        // Create a cache key based on the search parameters
        const cacheKey = `search:${query}:${type || 'all'}:${order}:${maxResults}:${pageToken || 'first'}:${channelId || 'any'}:${publishedAfter?.toISOString() || 'any'}:${publishedBefore?.toISOString() || 'any'}`;
        return this.getCachedData({ key: cacheKey }, async () => {
            const response = await this.youtube.search.list({
                q: query,
                maxResults,
                pageToken,
                part: ['snippet'],
                type: type ? [type] : ['video', 'channel', 'playlist'],
                order,
                publishedAfter: publishedAfter?.toISOString(),
                publishedBefore: publishedBefore?.toISOString(),
                channelId,
                safeSearch: 'none'
            });
            return response.data;
        }, 100 // Quota cost for search.list
        );
    }
    /**
     * Get current quota usage and limits
     * @returns Current quota usage information
     */
    getQuotaUsage() {
        this.checkAndResetQuota();
        return { ...this.quotaUsage };
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.flushAll();
        (0, logger_1.logInfo)('YouTube API cache cleared');
    }
    /**
     * Clear specific cached data by key pattern
     * @param pattern Key pattern to match (e.g., 'video:*')
     */
    clearCacheByPattern(pattern) {
        const keys = this.cache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        let cleared = 0;
        keys.forEach(key => {
            if (regex.test(key)) {
                this.cache.del(key);
                cleared++;
            }
        });
        (0, logger_1.logInfo)(`Cleared ${cleared} items from YouTube API cache matching: ${pattern}`);
    }
}
exports.YouTubeService = YouTubeService;
// Create singleton instance
exports.youtubeService = new YouTubeService();
//# sourceMappingURL=youtube.service.js.map