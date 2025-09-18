import axios from 'axios';
import { store } from '../redux/store';
import { logout, setCredentials } from '../redux/slices/authSlice';
import { showToast } from '../redux/slices/uiSlice';

// Create axios instance
const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (process.env.REACT_APP_API_URL || 'http://localhost:8000/api');

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    console.log('API Request Debug:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
      authState: {
        isAuthenticated: state.auth.isAuthenticated,
        user: state.auth.user
      }
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No token available for request to:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update the authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logout());
        store.dispatch(showToast({
          message: 'Session expired. Please login again.',
          type: 'warning'
        }));
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    const message = error.response?.data?.message || 'An error occurred';
    
    // Don't show toast for certain errors
    const silentErrors = [401, 404];
    if (!silentErrors.includes(error.response?.status)) {
      store.dispatch(showToast({
        message,
        type: 'error'
      }));
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
