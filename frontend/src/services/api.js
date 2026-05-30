import axios from 'axios';

const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : rawApiUrl.replace(/\/+$|$/, '') + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      // Token expirado o inválido (pero no en login)
      localStorage.removeItem('token');
      const basename = process.env.REACT_APP_BASENAME || '';
      window.location.href = `${basename}/login`;
    }

    // Para errores de login, devolver los datos del error sin rechazar
    if (isLoginEndpoint && error.response?.data) {
      return error.response.data;
    }

    return Promise.reject(error.response?.data || { message: 'Error de conexión' });
  }
);

export default api;
