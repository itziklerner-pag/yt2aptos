import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Base API client configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Default error handler
const handleError = (error: AxiosError) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error Response:', error.response.data);
    console.error('Status:', error.response.status);
    console.error('Headers:', error.response.headers);
    console.error('Request URL:', error.config?.url);
    console.error('Request Method:', error.config?.method);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Error Request:', error.request);
    console.error('No response received from server. Is the backend running?');
    console.error('Request URL:', error.config?.url);
    console.error('Request Method:', error.config?.method);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Error Message:', error.message);
    console.error('Request Config:', error.config);
  }
  return Promise.reject(error);
};

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => handleError(error)
);

export default apiClient;