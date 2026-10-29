// Konfigurasi terpusat untuk koneksi ke backend
const backendBaseUrl = `${window.location.protocol}//${window.location.hostname}:5000`;

export const API_BASE_URL    = import.meta.env.VITE_API_URL    || `${backendBaseUrl}/api`;
export const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || backendBaseUrl;
