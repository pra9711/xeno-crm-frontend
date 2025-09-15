import axios from 'axios';
import Cookies from 'js-cookie';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Exported helper to change base URL at runtime (useful for tests/dev)
export function setApiBaseUrl(url: string) {
  API_URL = url.replace(/\/$/, '')
  api.defaults.baseURL = API_URL
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    let token: string | undefined | null = undefined
    try {
      if (typeof window !== 'undefined') {
        // For production (cross-domain), read from localStorage
        if (process.env.NODE_ENV === 'production') {
          token = localStorage.getItem('auth_token')
        } else {
          // For development (same-domain), read from cookies
          // httpOnly cookie will be sent automatically because withCredentials is true.
          token = Cookies.get('auth_token')
        }
      }
    } catch (err) {
      token = undefined
    }
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token from both localStorage and cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        Cookies.remove('auth_token')
      }
      // Don't perform client-side redirects here; let callers decide how to surface the unauthenticated state.
    }
    return Promise.reject(error);
  }
);

export default api;

// Returns the proper NL->rules endpoint depending on environment.
// In development, you can enable an unauthenticated public route by
// setting `NEXT_PUBLIC_ENABLE_PUBLIC_AI_ROUTE=true` OR by running with
// `NODE_ENV` not equal to 'production'. In production this will always
// return the authenticated endpoint.
export function aiNlToRulesUrl(): string {
  // Respect explicit opt-in via NEXT_PUBLIC_ENABLE_PUBLIC_AI_ROUTE
  const enabledFlag = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_AI_ROUTE === 'true';
  const devEnv = process.env.NODE_ENV !== 'production';

  if (enabledFlag || devEnv) {
    // Return the path expected by the axios instance (baseURL already contains '/api')
    return '/ai/nl-to-rules-public';
  }

  return '/ai/nl-to-rules';
}
