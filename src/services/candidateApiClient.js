import axios from 'axios';

// Prefer Vite env, fallback to CRA env, then window origin, then localhost
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : (process.env.REACT_APP_API_BASE_URL ||
      (window?.location?.origin && `${window.location.origin.replace(/\/$/, '')}/api`));

export const candidateApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for AI operations and file uploads
});

candidateApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('candidate_token');
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer') ? token : `Bearer ${token}`;
  }
  return config;
});
