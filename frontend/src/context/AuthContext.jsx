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
  // ⚡ TRUCO: Forzamos que el usuario logueado por defecto sea el Técnico de Prótesis
  const [user, setUser] = useState({
    id: 5, // ID simulado en la base de datos
    email: "lic.rodriguez@azaria.app",
    role: "medicina", // o "protesis"/"tecnico" según los nombres de tu sistema
    nombre: "medicina"
  });
  
  // ⚡ TRUCO: Desactivamos la pantalla de carga para que cargue la interfaz directo
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('token-falso-de-prueba');

  useEffect(() => {
    // Comentamos la revisión de sesión original para que no intente buscar en internet
    // checkSession();
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

      console.log('Login response:', response);
      console.log('Usuario:', response.data.data);

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