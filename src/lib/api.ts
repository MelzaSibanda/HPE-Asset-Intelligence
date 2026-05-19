import axios from 'axios';

// Production default is /api (same-domain Railway deployment).
// For local dev, set VITE_API_URL=http://localhost/hpe-api/public/api in .env.local
export const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('hpe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hpe_token');
      localStorage.removeItem('hpe_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
