/**
 * Central Application Configuration & Environment Bridge
 */

const FALLBACK_PROD_API = 'https://vidyaos-backend.onrender.com/api/v1';
const FALLBACK_PROD_UPLOADS = 'https://vidyaos-backend.onrender.com/uploads';
const FALLBACK_PROD_WEB = 'https://vidya-os.vercel.app';

export const CONFIG = {
  API_BASE_URL: (process.env.EXPO_PUBLIC_API_URL || FALLBACK_PROD_API).replace(/\/$/, ''),
  API_URL: (process.env.EXPO_PUBLIC_API_URL || FALLBACK_PROD_API).replace(/\/$/, ''),
  UPLOADS_BASE_URL: (process.env.EXPO_PUBLIC_UPLOADS_URL || FALLBACK_PROD_UPLOADS).replace(/\/$/, ''),
  WEB_BASE_URL: (process.env.EXPO_PUBLIC_WEB_URL || FALLBACK_PROD_WEB).replace(/\/$/, ''),
  INSTITUTION_NAME: process.env.EXPO_PUBLIC_INSTITUTION_NAME || 'Government Polytechnic Nainital',
  APP_NAME: 'VidyaOS',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  DEVICE_ID_KEY: 'vidyaos_device_id',
  ACCESS_TOKEN_KEY: 'vidyaos_access_token',
  REFRESH_TOKEN_KEY: 'vidyaos_refresh_token',
  USER_DATA_KEY: 'vidyaos_user_data',
  MAX_COLD_START_ATTEMPTS: 12,
  COLD_START_INTERVAL_MS: 3000,
  NOTIFICATION_POLL_INTERVAL_MS: 20000, // 20s polling as in web version
};

