const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const API_BASE_URL = baseUrl;

export const KEYCLOAK_CONFIG = {
  url: import.meta.env.VITE_KEYCLOAK_URL || '',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || '',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || ''
};