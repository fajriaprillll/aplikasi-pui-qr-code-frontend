import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Extend the AxiosRequestConfig type to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Define fallback URLs for different environments
const API_FALLBACK_URL = 'http://localhost:3000/api';

// Get the API URL from environment or use fallback
const getApiUrl = () => {
  // Try to get from environment
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Try to use the same origin as the frontend
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin !== 'http://localhost:5173') {
      return `${origin}/api`;
    }
  }

  // Fallback to default
  return API_FALLBACK_URL;
};

// Create an axios instance with base URL and default configs
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a timeout to avoid long-running requests
  timeout: 30000,
  // Enable sending cookies across domains if needed
  withCredentials: false,
});

// Log the baseURL for debugging
console.log('API is configured with baseURL:', api.defaults.baseURL);

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('authToken');
      
    // If token exists, add it to the headers
    if (token) {
      // Ensure token is properly formatted and trimmed
      config.headers.Authorization = `Bearer ${token.trim()}`;
      console.log('Added auth token to request');
    } else {
      console.warn('No auth token found in localStorage');
    }
    
    // Special handling for FormData requests
    if (config.data instanceof FormData) {
      // FormData requires removing the Content-Type header
      // to let the browser set the correct multipart boundary
      delete config.headers['Content-Type'];
      
      // For browsers that don't properly remove Content-Type
      // This ensures the correct multipart boundary is generated
      config.headers['Content-Type'] = undefined; 
      
      // Make sure Authorization header is preserved for FormData requests
      if (token) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }

      console.log(`FormData request detected for ${config.url}`);
      
      // Log FormData contents for debugging
      if (config.data instanceof FormData) {
        console.log('FormData contents:');
        for (const pair of config.data.entries()) {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }
    } else {
      // Ensure JSON content type for non-FormData requests
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Special handling for DELETE requests
    if (config.method?.toLowerCase() === 'delete') {
      console.log('DELETE request detected, ensuring proper headers');
      // Ensure Authorization header is set for DELETE requests
      if (token) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    }
    
    // Enhance request logging with more details
    console.log(`-----------------------------------------------------------`);
    console.log(`OUTGOING API REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`Headers:`, config.headers);
    
    if (config.data && !(config.data instanceof FormData)) {
      console.log('Request payload:', config.data);
      
      // Add special handling for status updates to help diagnose format issues
      if (config.url?.includes('/status') && config.data.status) {
        console.log('Status update detected!');
        console.log('Status value type:', typeof config.data.status);
        console.log('Status value:', config.data.status);
        
        // Ensure status is always a proper string
        if (typeof config.data.status !== 'string') {
          console.log('Converting status to string...');
          config.data.status = String(config.data.status).toUpperCase();
          console.log('New status value:', config.data.status);
        }
      }
    }
    
    // Include timestamp for tracking request duration
    config.metadata = { startTime: new Date().getTime() };
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and handling token expiration
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = response.config.metadata 
      ? new Date().getTime() - response.config.metadata.startTime 
      : 'unknown';
    
    console.log(`INCOMING API RESPONSE: ${response.status} from ${response.config.url}`);
    console.log(`Response time: ${duration}ms`);
    
    // Log only a preview of large responses to avoid console clutter
    const responseData = response.data;
    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData) && responseData.length > 5) {
        console.log(`Response data (showing 5/${responseData.length} items):`, responseData.slice(0, 5));
      } else {
        console.log('Response data:', responseData);
      }
    } else {
      console.log('Response data:', responseData);
    }
    console.log(`-----------------------------------------------------------`);
    
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    
    // Calculate request duration even for failed requests
    const duration = error.config?.metadata 
      ? new Date().getTime() - error.config.metadata.startTime 
      : 'unknown';
    
    console.log(`-----------------------------------------------------------`);
    console.log(`❌ API ERROR: Failed request took ${duration}ms`);
    
    // Handle authentication errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.log('Authentication error, clearing user data and redirecting to login...');
      // Clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/admin/login')) {
        // Redirect to login page
        console.log('Redirecting to login page');
        window.location.href = '/admin/login';
      } else {
        console.log('Already on login page, not redirecting');
      }
      
      return Promise.reject(new Error('Authentication expired. Please login again.'));
    }
    
    if (error.response) {
      console.error(`Error ${error.response.status} from ${error.config?.url}:`, error.response.statusText);
      console.error('Error details:', error.response.data);
      
      // Special handling for 400 errors which often indicate validation problems
      if (error.response.status === 400) {
        console.error('400 Bad Request Error - Validation problem!');
        console.error('Original request data:', error.config?.data);
        
        // If this was a status update, give more specific debugging info
        if (error.config?.url?.includes('/status')) {
          console.error('Status update failed! This is likely a format issue.');
          
          try {
            // Try to parse the data if it's a string
            const requestData = typeof error.config.data === 'string' 
              ? JSON.parse(error.config.data) 
              : error.config.data;
              
            console.error('Status being sent:', requestData?.status);
            console.error('Status type:', typeof requestData?.status);
          } catch (e) {
            console.error('Could not parse request data');
          }
        }
      }
    } else if (error.request) {
      console.error(`No response received from ${error.config?.url}`);
      console.error('Is the backend server running on the correct port?');
    } else {
      console.error('Request setup error:', error.message);
    }
    console.log(`-----------------------------------------------------------`);
    
    return Promise.reject(error);
  }
);

export default api; 