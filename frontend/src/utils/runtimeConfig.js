const DEFAULT_LOCAL_API_URL = 'http://localhost:5000';
const DEFAULT_PRODUCTION_API_URL = 'https://echo-backend-server.tomai-backend.workers.dev';

const LEGACY_API_URLS = new Set([
  'https://echo-backend.tomai-backend.workers.dev',
  'https://echo-backend.echo-backend.workers.dev',
  'https://tomai-backend.workers.dev',
]);

const normalizeUrl = (url) => (url || '').trim().replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configuredUrl = normalizeUrl(import.meta.env.VITE_API_URL);
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (isLocalHost) {
    // Prefer explicit local env, otherwise local backend
    if (configuredUrl && !LEGACY_API_URLS.has(configuredUrl) && configuredUrl.includes('localhost')) {
      return configuredUrl;
    }
    return DEFAULT_LOCAL_API_URL;
  }

  // Production: never keep stale/legacy Worker URLs from old Vercel env
  if (configuredUrl && !LEGACY_API_URLS.has(configuredUrl)) {
    return configuredUrl;
  }

  return DEFAULT_PRODUCTION_API_URL;
};

export const getGoogleAuthUrl = () => `${getApiBaseUrl()}/auth/google`;
