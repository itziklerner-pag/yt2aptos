import { useState, useCallback } from 'react';
import { YouTubeService, SearchParams, SearchResults } from '../services';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ApiResponse } from '../utils/api';

/**
 * Hook for loading state
 */
interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Combined response type
 */
type ResponseWithLoading<T> = LoadingState & {
  data: T | null;
  refetch: () => Promise<void>;
};

/**
 * Hook for searching YouTube channels
 */
export function useSearchChannels(initialQuery: string = '', initialMaxResults: number = 10) {
  const [response, setResponse] = useState<ResponseWithLoading<SearchResults>>({
    isLoading: false,
    error: null,
    data: null,
    refetch: async () => {}
  });

  const [params, setParams] = useState({
    query: initialQuery,
    maxResults: initialMaxResults,
    pageToken: undefined as string | undefined
  });

  const searchChannels = useCallback(async (
    query?: string,
    maxResults?: number,
    pageToken?: string
  ) => {
    // Update params if provided
    if (query !== undefined) setParams(prev => ({ ...prev, query }));
    if (maxResults !== undefined) setParams(prev => ({ ...prev, maxResults }));
    if (pageToken !== undefined) setParams(prev => ({ ...prev, pageToken }));

    // Use current params if not provided
    const q = query ?? params.query;
    const max = maxResults ?? params.maxResults;
    const token = pageToken ?? params.pageToken;

    setResponse(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await YouTubeService.searchChannels(q, max, token);
      
      if (result.error) {
        setResponse({
          isLoading: false,
          error: result.error,
          data: null,
          refetch: () => searchChannels(q, max, token)
        });
      } else {
        setResponse({
          isLoading: false,
          error: null,
          data: result.data || null,
          refetch: () => searchChannels(q, max, token)
        });
      }
    } catch (error) {
      setResponse({
        isLoading: false,
        error: (error as Error).message || 'An error occurred',
        data: null,
        refetch: () => searchChannels(q, max, token)
      });
    }
  }, [params]);

  // Setup refetch function
  useState(() => {
    setResponse(prev => ({
      ...prev,
      refetch: () => searchChannels(params.query, params.maxResults, params.pageToken)
    }));
  });

  return {
    ...response,
    searchChannels,
    nextPage: useCallback(() => {
      if (response.data?.nextPageToken) {
        searchChannels(params.query, params.maxResults, response.data.nextPageToken);
      }
    }, [response.data, params, searchChannels]),
    prevPage: useCallback(() => {
      if (response.data?.prevPageToken) {
        searchChannels(params.query, params.maxResults, response.data.prevPageToken);
      }
    }, [response.data, params, searchChannels]),
    setQuery: useCallback((query: string) => {
      setParams(prev => ({ ...prev, query, pageToken: undefined }));
    }, []),
    setMaxResults: useCallback((maxResults: number) => {
      setParams(prev => ({ ...prev, maxResults, pageToken: undefined }));
    }, [])
  };
}

/**
 * Hook for searching YouTube content
 */
export function useSearch(initialParams: Partial<SearchParams> = {}) {
  const [response, setResponse] = useState<ResponseWithLoading<SearchResults>>({
    isLoading: false,
    error: null,
    data: null,
    refetch: async () => {}
  });

  const defaultParams: SearchParams = {
    query: '',
    maxResults: 10,
    pageToken: undefined,
    type: undefined,
    order: 'relevance',
    publishedAfter: undefined,
    publishedBefore: undefined,
    channelId: undefined
  };

  const [params, setParams] = useState<SearchParams>({
    ...defaultParams,
    ...initialParams
  });

  const search = useCallback(async (newParams?: Partial<SearchParams>) => {
    // Update params if provided
    if (newParams) {
      setParams(prev => ({ ...prev, ...newParams }));
    }

    // Use current params if not provided
    const searchParams = newParams ? { ...params, ...newParams } : params;

    setResponse(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await YouTubeService.search(searchParams);
      
      if (result.error) {
        setResponse({
          isLoading: false,
          error: result.error,
          data: null,
          refetch: () => search(searchParams)
        });
      } else {
        setResponse({
          isLoading: false,
          error: null,
          data: result.data || null,
          refetch: () => search(searchParams)
        });
      }
    } catch (error) {
      setResponse({
        isLoading: false,
        error: (error as Error).message || 'An error occurred',
        data: null,
        refetch: () => search(searchParams)
      });
    }
  }, [params]);

  // Setup refetch function
  useState(() => {
    setResponse(prev => ({
      ...prev,
      refetch: () => search()
    }));
  });

  return {
    ...response,
    search,
    nextPage: useCallback(() => {
      if (response.data?.nextPageToken) {
        search({ ...params, pageToken: response.data.nextPageToken });
      }
    }, [response.data, params, search]),
    prevPage: useCallback(() => {
      if (response.data?.prevPageToken) {
        search({ ...params, pageToken: response.data.prevPageToken });
      }
    }, [response.data, params, search]),
    updateParams: useCallback((newParams: Partial<SearchParams>) => {
      // Reset page token when changing search parameters
      setParams(prev => ({ ...prev, ...newParams, pageToken: undefined }));
    }, [])
  };
}

/**
 * Hook for fetching trending videos
 */
export function useTrendingVideos(initialMaxResults: number = 10) {
  const [response, setResponse] = useState<ResponseWithLoading<SearchResults>>({
    isLoading: false,
    error: null,
    data: null,
    refetch: async () => {}
  });

  const [params, setParams] = useState({
    maxResults: initialMaxResults,
    pageToken: undefined as string | undefined
  });

  const fetchTrending = useCallback(async (
    maxResults?: number,
    pageToken?: string
  ) => {
    // Update params if provided
    if (maxResults !== undefined) setParams(prev => ({ ...prev, maxResults }));
    if (pageToken !== undefined) setParams(prev => ({ ...prev, pageToken }));

    // Use current params if not provided
    const max = maxResults ?? params.maxResults;
    const token = pageToken ?? params.pageToken;

    setResponse(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await YouTubeService.getTrendingVideos(max, token);
      
      if (result.error) {
        setResponse({
          isLoading: false,
          error: result.error,
          data: null,
          refetch: () => fetchTrending(max, token)
        });
      } else {
        setResponse({
          isLoading: false,
          error: null,
          data: result.data || null,
          refetch: () => fetchTrending(max, token)
        });
      }
    } catch (error) {
      setResponse({
        isLoading: false,
        error: (error as Error).message || 'An error occurred',
        data: null,
        refetch: () => fetchTrending(max, token)
      });
    }
  }, [params]);

  // Setup refetch function
  useState(() => {
    setResponse(prev => ({
      ...prev,
      refetch: () => fetchTrending(params.maxResults, params.pageToken)
    }));
  });

  return {
    ...response,
    fetchTrending,
    nextPage: useCallback(() => {
      if (response.data?.nextPageToken) {
        fetchTrending(params.maxResults, response.data.nextPageToken);
      }
    }, [response.data, params, fetchTrending]),
    prevPage: useCallback(() => {
      if (response.data?.prevPageToken) {
        fetchTrending(params.maxResults, response.data.prevPageToken);
      }
    }, [response.data, params, fetchTrending]),
    setMaxResults: useCallback((maxResults: number) => {
      setParams(prev => ({ ...prev, maxResults, pageToken: undefined }));
    }, [])
  };
}

/**
 * Hook for fetching channel recommendations
 */
export function useRecommendations(userId?: string) {
  const [response, setResponse] = useState<ResponseWithLoading<{ baseChannelName: string, recommendations: any[] }>>({
    isLoading: false,
    error: null,
    data: null,
    refetch: async () => {}
  });

  const fetchRecommendations = useCallback(async () => {
    setResponse(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await YouTubeService.getRecommendations(userId);
      
      if (result.error) {
        setResponse({
          isLoading: false,
          error: result.error,
          data: null,
          refetch: fetchRecommendations
        });
      } else {
        setResponse({
          isLoading: false,
          error: null,
          data: result.data || null,
          refetch: fetchRecommendations
        });
      }
    } catch (error) {
      setResponse({
        isLoading: false,
        error: (error as Error).message || 'An error occurred',
        data: null,
        refetch: fetchRecommendations
      });
    }
  }, [userId]);

  // Setup refetch function
  useState(() => {
    setResponse(prev => ({
      ...prev,
      refetch: fetchRecommendations
    }));
  });

  return {
    ...response,
    fetchRecommendations
  };
}

/**
 * Hook for checking API quota usage
 */
export function useQuotaUsage() {
  const [response, setResponse] = useState<ResponseWithLoading<any>>({
    isLoading: false,
    error: null,
    data: null,
    refetch: async () => {}
  });

  const fetchQuotaUsage = useCallback(async () => {
    setResponse(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await YouTubeService.getQuotaUsage();
      
      if (result.error) {
        setResponse({
          isLoading: false,
          error: result.error,
          data: null,
          refetch: fetchQuotaUsage
        });
      } else {
        setResponse({
          isLoading: false,
          error: null,
          data: result.data || null,
          refetch: fetchQuotaUsage
        });
      }
    } catch (error) {
      setResponse({
        isLoading: false,
        error: (error as Error).message || 'An error occurred',
        data: null,
        refetch: fetchQuotaUsage
      });
    }
  }, []);

  // Setup refetch function
  useState(() => {
    setResponse(prev => ({
      ...prev,
      refetch: fetchQuotaUsage
    }));
  });

  return {
    ...response,
    fetchQuotaUsage
  };
}

// Combined export of all hooks
export default {
  useSearchChannels,
  useSearch,
  useTrendingVideos,
  useRecommendations,
  useQuotaUsage
};