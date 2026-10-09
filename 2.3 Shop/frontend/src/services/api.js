import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shop_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('shop_token');
      localStorage.removeItem('shop_user');
      window.dispatchEvent(new CustomEvent('shop-auth-expired'));
    }
    return Promise.reject(error);
  },
);

export const getApiError = (error, fallback = 'ไม่สามารถเชื่อมต่อ Backend ได้') =>
  error.response?.data?.message || (error.request ? 'ไม่สามารถเชื่อมต่อ Backend ได้' : fallback);

export default api;
