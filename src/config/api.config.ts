// API Configuration
export const API_CONFIG = {
  // Update these URLs to match your PMK backend
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.8:5000/api/v1',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.8:5000',
  TIMEOUT: 30000,
  // Google Maps API Key - MUST be set in .env file
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

export const API_ENDPOINTS = {
  // Device registration with access key
  REGISTER_DEVICE: '/device-access/register',
  VALIDATE_DEVICE: '/device-access/validate',
  AUTHENTICATE_DEVICE: '/devices/authenticate',

  // Location
  UPDATE_LOCATION: (deviceId: string) => `/devices/${deviceId}/location`,

  // Metrics
  UPDATE_METRICS: (deviceId: string) => `/devices/${deviceId}/metrics`,

  // Device config
  GET_CONFIG: (deviceId: string) => `/devices/${deviceId}/config`,
};

export const SOCKET_EVENTS = {
  // Client emits
  DEVICE_CONNECT: 'device:connect',
  LOCATION_UPDATE: 'location:update',
  METRICS_UPDATE: 'metrics:update',
  HEARTBEAT_SEND: 'heartbeat:send',

  // Server emits (listeners)
  CONFIG_UPDATED: 'config:updated',
  DEVICE_LOCK: 'device:lock',
  DEVICE_UNLOCK: 'device:unlock',
  DEVICE_LOCATE_REQUEST: 'device:locate-request',
};
