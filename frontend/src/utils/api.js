import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Sisipkan JWT token dari localStorage secara otomatis jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('warkop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tangani token kedaluwarsa / 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('warkop_token');
        localStorage.removeItem('warkop_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
