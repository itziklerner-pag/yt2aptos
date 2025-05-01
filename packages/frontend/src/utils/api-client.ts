import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API base URL - using proxy defined in vite.config.ts
const API_BASE_URL = '/api';

/**
 * Create and configure an Axios instance for API requests
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

/**
 * Configure request interceptor
 * This will be used to add authentication tokens to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Configure response interceptor
 * This can be used for error handling, token refresh, etc.
 */
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error) => {
    // Handle specific error cases here if needed
    return Promise.reject(error);
  }
);

export default api;