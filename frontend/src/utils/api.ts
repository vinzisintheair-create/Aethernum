import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Crucial for transferring HTTP-only cookies
});

// Request Interceptor: Inject x-space-id header dynamically from URL scope
api.interceptors.request.use(
  (config) => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/space\/([^/]+)/);
    const spaceId = match ? match[1] : null;

    if (spaceId) {
      config.headers['x-space-id'] = spaceId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Redirect to login on authentication or permission expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.warn(`[API Security Gate]: Received status ${status}. Redirecting to auth portal.`);
        
        // Suppress redirect if already on login/register pages
        const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
