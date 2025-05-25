import { create } from 'zustand';
import api from '../api/axios';

interface User {
  id: number;
  username: string;
  name?: string;
  role: 'ADMIN' | 'STAFF';
  createdAt?: string;
  updatedAt?: string;
}

interface AuthResponse {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
  updatedAt: string;
  token: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  registerUser: (userData: RegisterUserData) => Promise<boolean>;
}

interface RegisterUserData {
  username: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'STAFF';
}

// Get initial state from localStorage
const getInitialState = (): { user: User | null; isAuthenticated: boolean; isAdmin: boolean } => {
  try {
    console.log('AuthStore - Getting initial state');
    
    // Check if token exists
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('AuthStore - No token found');
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      };
    }
    
    // Check if user data exists
    const storedUser = localStorage.getItem('user');
    console.log('AuthStore - Stored user from localStorage:', storedUser);
    
    if (storedUser) {
      const user = JSON.parse(storedUser) as User;
      console.log('AuthStore - Parsed user:', user);
      return {
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
      };
    }
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
  
  console.log('AuthStore - No stored user, returning default state');
  return {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
  };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...getInitialState(),

  login: async (username: string, password: string) => {
    try {
    console.log('AuthStore - Login attempt:', username);
      
      const response = await api.post<AuthResponse>('/auth/login', {
        username,
        password
      });
      
      if (response.status === 200 && response.data) {
        const { token, ...userData } = response.data;
        
        // Store token in localStorage
        localStorage.setItem('authToken', token);
        
        // Store user data
      const user = {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        
        localStorage.setItem('user', JSON.stringify(user));
      
      console.log('AuthStore - Login successful, setting state with user:', user);
      set({
        user,
        isAuthenticated: true,
          isAdmin: user.role === 'ADMIN',
      });
      
      return true;
    }
    
      console.log('AuthStore - Login failed, unexpected response:', response);
      return false;
    } catch (error) {
      console.error('AuthStore - Login error:', error);
    return false;
    }
  },

  logout: () => {
    console.log('AuthStore - Logout called');
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    
    // Clear localStorage
    console.log('AuthStore - Clearing localStorage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  checkAuth: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('AuthStore - No token found for checkAuth');
        return false;
      }
      
      console.log('AuthStore - Validating token');
      const response = await api.get('/auth/me');
      
      if (response.status === 200 && response.data) {
        // Update user data if needed
        localStorage.setItem('user', JSON.stringify(response.data));
        
        set({
          user: response.data,
          isAuthenticated: true,
          isAdmin: response.data.role === 'ADMIN',
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuthStore - Token validation failed:', error);
      // Clear invalid auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      });
      
      return false;
    }
  },
  
  registerUser: async (userData: RegisterUserData) => {
    try {
      // Remove the isAdmin check that was blocking the API call
      // const { isAdmin } = get();
      
      // Only allow admins to register new users
      // if (!isAdmin) {
      //   console.error('AuthStore - Only admins can register new users');
      //   return false;
      // }
      
      console.log('AuthStore - Registering new user:', userData.username);
      
      // Make API call to register endpoint
      const response = await api.post('/auth/register', {
        username: userData.username,
        password: userData.password,
        name: userData.name,
        role: userData.role || 'STAFF'
      });
      
      if (response.status === 201 || response.status === 200) {
        console.log('AuthStore - Registration successful for:', userData.username);
        return true;
      } else {
        console.error('AuthStore - Registration failed with status:', response.status);
        return false;
      }
    } catch (error: any) {
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.error || 'Unknown server error';
        
        if (error.response.status === 400) {
          console.error('AuthStore - Registration validation error:', errorMessage);
          
          // Check specific error reasons
          if (errorMessage.includes('already taken')) {
            console.error('AuthStore - Username already exists');
          } else if (errorMessage.includes('required')) {
            console.error('AuthStore - Missing required fields');
          }
        } else {
          console.error(`AuthStore - Server returned ${error.response.status}:`, errorMessage);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('AuthStore - No response received from server. Network error?');
      } else {
        // Something happened in setting up the request
        console.error('AuthStore - Error setting up request:', error.message);
      }
      
      return false;
    }
  }
})); 