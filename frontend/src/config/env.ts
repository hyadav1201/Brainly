// Environment configuration utility
const getBackendUrl = () => {
  // Check if we're in development or production
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
  
  if (isDevelopment) {
    return import.meta.env.VITE_BACKEND_URL_DEV || 'http://localhost:3000';
  } else {
    // In production, try to get the backend URL from environment variables
    // If not set, construct it based on the current domain or use a default
    return import.meta.env.VITE_BACKEND_URL_PROD || 
           import.meta.env.VITE_BACKEND_URL || 
           'https://your-backend-deployment-url.vercel.app';
  }
};

export const BACKEND_URL = getBackendUrl();
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

console.log('Environment:', import.meta.env.DEV ? 'development' : 'production');
console.log('Backend URL:', BACKEND_URL);
console.log('API Base URL:', API_BASE_URL);