const DEFAULT_LOCAL_API_URL = 'http://localhost:5000';
const DEFAULT_PRODUCTION_API_URL = 'https://echo-backend.tomai-backend.workers.dev';

const normalizeUrl = (url) => (url || '').trim().replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configuredUrl = normalizeUrl(import.meta.env.VITE_API_URL);
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (isLocalHost) {
    return DEFAULT_LOCAL_API_URL;
  }

  return DEFAULT_PRODUCTION_API_URL;
};

export const getGoogleAuthUrl = () => `${getApiBaseUrl()}/auth/google`;
