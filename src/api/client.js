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

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth_logout'));
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

// Auto refresh token in response interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle blocked user (403 or 401 with blocked message)
    const isBlocked = error.response && 
      (error.response.status === 401 || error.response.status === 403) && 
      error.response.data?.message?.toLowerCase().includes('blocked');

    if (isBlocked) {
      logout();
      return Promise.reject(error);
    }

    // Try silent refresh token if 401 Unauthorized occurs and has not been retried
    if (error.response && error.response.status === 401 && !originalRequest._isRetryAuth) {
      originalRequest._isRetryAuth = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          if (res.data && res.data.accessToken) {
            const newToken = res.data.accessToken;
            localStorage.setItem('token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          logout();
          toast.error('Session expired. Please sign in again.');
          return Promise.reject(refreshError);
        }
      } else {
        logout();
        toast.error('Session expired. Please sign in again.');
        return Promise.reject(error);
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
      if (error.response.status !== 401 && error.response.status !== 403) {
        toast.error(message);
      }
    }
    
    return Promise.reject(error);
  }
);

// INACTIVITY TIMER SYSTEM
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const WARNING_LIMIT = 28 * 60 * 1000;    // 28 minutes

let inactivityTimer;
let warningTimer;

export const resetInactivityTimer = () => {
  if (!localStorage.getItem('token')) return;

  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);

  window.dispatchEvent(new CustomEvent('inactivity-reset'));

  warningTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('inactivity-warning'));
  }, WARNING_LIMIT);

  inactivityTimer = setTimeout(() => {
    logout();
    toast.error("Session expired due to inactivity");
  }, INACTIVITY_LIMIT);
};

if (typeof window !== 'undefined') {
  ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      resetInactivityTimer();
    }
  });

  // Start the timer initially
  resetInactivityTimer();
}

export default client;
