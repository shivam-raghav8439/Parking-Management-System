import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT Bearer token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic retry once, 401 redirects, and toast notifications
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration or invalidation (401 Unauthorized)
    const isBlocked = error.response && 
      (error.response.status === 401 || error.response.status === 403) && 
      error.response.data?.message?.toLowerCase().includes('blocked');

    if (isBlocked) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?blocked=true';
      }
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._isRetryAuth) {
      originalRequest._isRetryAuth = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect unauthenticated operations to login view
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        toast.error('Session expired. Please sign in again.');
        window.location.href = '/login';
      }
    }

    // Retry once if it is a network or timeout error and has not been retried yet
    if (
      (!error.response || error.code === 'ECONNABORTED') && 
      originalRequest && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        return await client(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    
    // Show toast for API errors
    if (error.response) {
      const message = error.response.data?.message || `Server error: ${error.response.status}`;
      toast.error(message);
    } else {
      // Don't show network errors as toast to prevent spamming while testing offline fallback
    }
    
    return Promise.reject(error);
  }
);

export default client;
