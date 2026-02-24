import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // 🔁 Use sessionStorage so session ends when the browser closes
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // ✅ Restore session on refresh (same browser session only)
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Verify token is not expired
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            setToken(storedToken);
            setUser(userData);
            console.log('✅ Session restored on refresh:', userData.name);
          } else {
            console.log('❌ Token expired');
            // Only clear if token is expired
            logout();
          }
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          // Only clear if there's an error
          logout();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = async (userData, authToken) => {
    try {
      setUser(userData);
      setToken(authToken);

      // 👉 Store in sessionStorage so it disappears after browser close
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      console.log('🔐 User logged in:', userData.name);
    } catch (error) {
      console.error('❌ Login storage error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 User logging out...');

    // Clear state
    setUser(null);
    setToken(null);

    // Clear sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginTime');

    console.log('✅ User logged out successfully');

    // Navigate to start page
    window.location.href = '/';
  };

  // Check if token is expired
  const isTokenExpired = () => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !isTokenExpired(),
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
