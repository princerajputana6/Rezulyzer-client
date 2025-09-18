import axios from 'axios';

// Create React App uses process.env.REACT_APP_*
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (window?.location?.origin ? `${window.location.origin.replace(/\/$/, '')}/api` : 'http://localhost:8000/api');

export const candidateApiClient = axios.create({
  baseURL: API_BASE_URL,
});

candidateApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('candidate_token');
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer') ? token : `Bearer ${token}`;
  }
  return config;
});
