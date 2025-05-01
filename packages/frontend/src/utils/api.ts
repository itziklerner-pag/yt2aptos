/**
 * API utilities for making requests to the backend
 */

// API base URL - using proxy defined in vite.config.ts
const API_BASE_URL = '/api';

/**
 * Interface for API response structure
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

/**
 * Options for making API requests
 */
export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
  baseUrl?: string;
}

/**
 * Get request headers including authorization if token exists
 * @returns Headers object
 */
export const getHeaders = (): Headers => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  // Add authorization header if token exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  return headers;
};

/**
 * Construct URL with query parameters
 * @param baseUrl Base URL for the request
 * @param path API endpoint path
 * @param params Object containing query parameters
 * @returns Full URL with query parameters
 */
export const buildUrl = (baseUrl: string, path: string, params?: Record<string, any>): string => {
  const url = new URL(`${baseUrl}${path}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  return url.toString();
};

/**
 * Parse API response
 * @param response Fetch Response object
 * @returns Parsed response data
 */
export const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: 'Failed to parse response',
      status: response.status,
    };
  }
};

/**
 * Make a GET request
 * @param path API endpoint path
 * @param options Request options
 * @returns API response
 */
export const get = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = options.baseUrl || API_BASE_URL;
    const url = buildUrl(baseUrl, path, options.params);
    const headers = options.headers ? new Headers(options.headers) : getHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: options.signal,
    });
    
    return parseResponse<T>(response);
  } catch (error) {
    return {
      error: (error as Error).message || 'Request failed',
      status: 500,
    };
  }
};

/**
 * Make a POST request
 * @param path API endpoint path
 * @param data Request body data
 * @param options Request options
 * @returns API response
 */
export const post = async <T>(path: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = options.baseUrl || API_BASE_URL;
    const url = buildUrl(baseUrl, path, options.params);
    const headers = options.headers ? new Headers(options.headers) : getHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: options.signal,
    });
    
    return parseResponse<T>(response);
  } catch (error) {
    return {
      error: (error as Error).message || 'Request failed',
      status: 500,
    };
  }
};

/**
 * Make a PUT request
 * @param path API endpoint path
 * @param data Request body data
 * @param options Request options
 * @returns API response
 */
export const put = async <T>(path: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = options.baseUrl || API_BASE_URL;
    const url = buildUrl(baseUrl, path, options.params);
    const headers = options.headers ? new Headers(options.headers) : getHeaders();
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      signal: options.signal,
    });
    
    return parseResponse<T>(response);
  } catch (error) {
    return {
      error: (error as Error).message || 'Request failed',
      status: 500,
    };
  }
};

/**
 * Make a DELETE request
 * @param path API endpoint path
 * @param options Request options
 * @returns API response
 */
export const del = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = options.baseUrl || API_BASE_URL;
    const url = buildUrl(baseUrl, path, options.params);
    const headers = options.headers ? new Headers(options.headers) : getHeaders();
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: options.signal,
    });
    
    return parseResponse<T>(response);
  } catch (error) {
    return {
      error: (error as Error).message || 'Request failed',
      status: 500,
    };
  }
};