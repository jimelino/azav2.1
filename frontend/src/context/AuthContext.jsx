import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = async () => {
    if (token) {
      try {
        const response = await authService.checkSession();
        if (response && response.success && response.data) {
          setUser(response.data);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (error) {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, credential, remember = false) => {
    try {
      const response = await authService.login(email, credential, remember);

      if (response && response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        return { success: true, firstLogin: response.data.first_login };
      }

      return { success: false, message: response?.message || 'Credenciales incorrectas' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error?.message || 'Error al iniciar sesión' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const setupPIN = async (pin, pinConfirmation) => {
    try {
      const response = await authService.setupPIN(user.id, pin, pinConfirmation);
      return response;
    } catch (error) {
      return { success: false, message: 'Error al configurar PIN' };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    setupPIN,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};