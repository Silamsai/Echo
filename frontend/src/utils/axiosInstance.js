import axios from 'axios';
import { getApiBaseUrl } from './runtimeConfig';

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('echo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    const status = err.response?.status;

    // Retry transient Worker/DB failures (common on Cloudflare cold/stale isolates)
    const method = (config?.method || 'get').toLowerCase();
    const retriable =
      config &&
      method === 'get' &&
      !config.__retryCount &&
      (!err.response || status >= 500 || status === 429);

    if (retriable) {
      config.__retryCount = 1;
      await new Promise((r) => setTimeout(r, 500));
      return axiosInstance(config);
    }

    if (status === 401) {
      localStorage.removeItem('echo_token');
      // Don't hard-redirect during Google success handoff
      if (!window.location.pathname.includes('google-success')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
