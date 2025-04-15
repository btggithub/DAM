// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Debug token on context initialization
  useEffect(() => {
    console.log('Auth Context initialized. Token exists:', !!token);
  }, []);

  // Set up axios with auth token for all requests
  useEffect(() => {
    console.log('Setting up axios interceptor with token:', token ? 'exists' : 'none');
    
    // Create request interceptor
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          console.log('Adding token to request:', config.url);
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Create response interceptor to handle auth errors globally
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // If we get a 401 error, clear the token
        if (error.response && error.response.status === 401) {
          console.log('Received 401 from:', error.config.url);
          
          // Don't logout when trying to login
          if (!error.config.url.includes('/auth/login')) {
            console.log('Unauthorized request - clearing token');
            localStorage.removeItem('token');
            setToken(null);
            setCurrentUser(null);
            
            // Only redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
              navigate('/login');
            }
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up function
    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, navigate]);
  
  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        console.log('No token available, skipping user load');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Attempting to load user with token');
        const res = await axios.get('/api/auth/me');
        console.log('User loaded successfully:', res.data.user);
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error('Error loading user:', err.response?.data || err.message);
        // Error handling moved to response interceptor
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = (newToken, user) => {
    console.log('Login function called with token:', newToken ? 'exists' : 'none');
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    
    // Set the default header right away
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    console.log('Token saved and axios defaults updated');
  };

  // Logout function
  const logout = () => {
    console.log('Logging out, clearing token');
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // Update user data
  const updateUser = (userData) => {
    console.log('Updating user data');
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };

  // Context value
  const value = {
    currentUser,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isAdmin: currentUser?.role === 'admin',
    isLoading: loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;