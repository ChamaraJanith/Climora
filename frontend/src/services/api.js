import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token and log requests
api.interceptors.request.use(
  (config) => {
    console.log(`[Axios] Sending ${config.method.toUpperCase()} request to ${config.baseURL}${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Axios] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default api;