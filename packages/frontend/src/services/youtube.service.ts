import { get, post, ApiResponse } from '../utils/api';

/**
 * YouTube channel interface
 */
export interface Channel {
  _id: string;
  youtubeId: string;
  name: string;
  description?: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  country?: string;
  publishedAt?: string;
  lastChecked?: string;
  isArchived: boolean;
  archiveStatus: 'none' | 'partial' | 'complete';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * YouTube playlist interface
 */
export interface Playlist {
  _id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  itemCount?: number;
  publishedAt?: string;
  lastChecked?: string;
  isArchived: boolean;
  archiveStatus: 'none' | 'partial' | 'complete';
  channelId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * YouTube video interface
 */
export interface Video {
  _id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  publishedAt?: string;
  tags?: string[];
  channelId: string;
  playlistId?: string;
  isArchived: boolean;
  archiveStatus: 'pending' | 'downloading' | 'completed' | 'failed';
  downloadedAt?: string;
  fileSize?: number;
  filePath?: string;
  fileUrl?: string;
  format?: string;
  quality?: string;
  hasSubtitles: boolean;
  subtitleLanguages?: string[];
  metadataPath?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search parameters for YouTube requests
 */
export interface SearchParams {
  query: string;
  maxResults?: number;
  pageToken?: string;
  type?: 'video' | 'channel' | 'playlist';
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  publishedAfter?: string;
  publishedBefore?: string;
  channelId?: string;
}

/**
 * YouTube quota usage information
 */
export interface QuotaUsage {
  used: number;
  limit: number;
  resetTime: string;
}

/**
 * YouTube API search results
 */
export interface SearchResults {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: Array<any>;
}

/**
 * YouTube API service
 */
export class YouTubeService {
  /**
   * Search YouTube for channels
   * @param query Search query
   * @param maxResults Maximum results per page
   * @param pageToken Page token for pagination
   * @returns Search results
   */
  static async searchChannels(query: string, maxResults: number = 10, pageToken?: string): Promise<ApiResponse<SearchResults>> {
    return get<SearchResults>('/youtube/channels/search', {
      params: { query, maxResults, pageToken }
    });
  }

  /**
   * Get channel details from YouTube
   * @param channelId YouTube channel ID
   * @returns Channel details
   */
  static async getChannelDetails(channelId: string): Promise<ApiResponse<any>> {
    return get<any>(`/youtube/channels/${channelId}`);
  }

  /**
   * Add a channel to track
   * @param channelId YouTube channel ID
   * @param userId Optional user ID
   * @returns Created channel
   */
  static async addChannel(channelId: string, userId?: string): Promise<ApiResponse<{ message: string, channel: Channel }>> {
    return post<{ message: string, channel: Channel }>('/youtube/channels', { 
      channelId, 
      userId 
    });
  }

  /**
   * Get playlists for a channel
   * @param channelId YouTube channel ID
   * @param maxResults Maximum results per page
   * @param pageToken Page token for pagination
   * @returns Playlists for the channel
   */
  static async getChannelPlaylists(channelId: string, maxResults: number = 10, pageToken?: string): Promise<ApiResponse<SearchResults>> {
    return get<SearchResults>(`/youtube/channels/${channelId}/playlists`, {
      params: { maxResults, pageToken }
    });
  }

  /**
   * Get playlist details
   * @param playlistId YouTube playlist ID
   * @returns Playlist details
   */
  static async getPlaylistDetails(playlistId: string): Promise<ApiResponse<any>> {
    return get<any>(`/youtube/playlists/${playlistId}`);
  }

  /**
   * Add a playlist to track
   * @param playlistId YouTube playlist ID
   * @param channelId YouTube channel ID
   * @param userId Optional user ID
   * @returns Created playlist
   */
  static async addPlaylist(playlistId: string, channelId: string, userId?: string): Promise<ApiResponse<{ message: string, playlist: Playlist }>> {
    return post<{ message: string, playlist: Playlist }>('/youtube/playlists', { 
      playlistId, 
      channelId, 
      userId 
    });
  }

  /**
   * Get videos in a playlist
   * @param playlistId YouTube playlist ID
   * @param maxResults Maximum results per page
   * @param pageToken Page token for pagination
   * @returns Videos in the playlist
   */
  static async getPlaylistVideos(playlistId: string, maxResults: number = 10, pageToken?: string): Promise<ApiResponse<SearchResults>> {
    return get<SearchResults>(`/youtube/playlists/${playlistId}/videos`, {
      params: { maxResults, pageToken }
    });
  }

  /**
   * Get video details
   * @param videoId YouTube video ID
   * @returns Video details
   */
  static async getVideoDetails(videoId: string): Promise<ApiResponse<any>> {
    return get<any>(`/youtube/videos/${videoId}`);
  }

  /**
   * Search YouTube
   * @param params Search parameters
   * @returns Search results
   */
  static async search(params: SearchParams): Promise<ApiResponse<SearchResults>> {
    // Convert SearchParams to a valid Record<string, string | number | boolean | null | undefined>
    const queryParams: Record<string, string | number | boolean | undefined | null> = {
      query: params.query,
      maxResults: params.maxResults,
      pageToken: params.pageToken,
      type: params.type,
      order: params.order,
      publishedAfter: params.publishedAfter,
      publishedBefore: params.publishedBefore,
      channelId: params.channelId
    };
    
    return get<SearchResults>('/youtube/search', { params: queryParams });
  }

  /**
   * Get popular channels
   * @param limit Maximum number of results
   * @returns Popular channels
   */
  static async getPopularChannels(limit: number = 10): Promise<ApiResponse<Channel[]>> {
    return get<Channel[]>('/youtube/channels/discover/popular', {
      params: { limit }
    });
  }

  /**
   * Get personalized recommendations
   * @param userId User ID
   * @returns Recommended channels
   */
  static async getRecommendations(userId?: string): Promise<ApiResponse<{ baseChannelName: string, recommendations: any[] }>> {
    const path = userId ? `/youtube/discover/recommendations/${userId}` : '/youtube/discover/recommendations';
    return get<{ baseChannelName: string, recommendations: any[] }>(path);
  }

  /**
   * Get trending videos
   * @param maxResults Maximum results per page
   * @param pageToken Page token for pagination
   * @returns Trending videos
   */
  static async getTrendingVideos(maxResults: number = 10, pageToken?: string): Promise<ApiResponse<SearchResults>> {
    return get<SearchResults>('/youtube/discover/trending', {
      params: { maxResults, pageToken }
    });
  }

  /**
   * Get API quota usage
   * @returns Quota usage information
   */
  static async getQuotaUsage(): Promise<ApiResponse<QuotaUsage>> {
    return get<QuotaUsage>('/youtube/quota');
  }
}

// Export a default instance
export default YouTubeService;