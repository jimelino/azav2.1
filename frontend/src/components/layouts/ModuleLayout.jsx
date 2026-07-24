import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InstitutionalHeader from './InstitutionalHeader';
import InstitutionalFooter from './InstitutionalFooter';
import LucideIcon from '../LucideIcon';
import './layouts.css';
import './institutional.css';

/**
 * ModuleLayout - Wrapper para páginas de módulos que agrega
 * la barra de navegación inferior según el rol del usuario.
 * Las páginas mantienen su propio header/contenido.
 */

const PACIENTE_NAV = [
  { path: '/paciente', icon: 'home', label: 'Inicio' },
  { path: '/citas', icon: 'calendar', label: 'Citas' },
  { path: '/recordatorios', icon: 'alarm-clock', label: 'Recordatorios' },
  { path: '/chat', icon: 'message', label: 'Mensajes' },
  { path: '/perfil', icon: 'user', label: 'Perfil' },
];

const ESPECIALISTA_NAV = [
  { path: '/especialista', icon: 'home', label: 'Inicio' },
  { path: '/especialista/pacientes', icon: 'users', label: 'Usuarios' },
  { path: '/especialista/citas', icon: 'calendar', label: 'Citas' },
  { path: '/chat', icon: 'message', label: 'Mensajes' },
  { path: '/perfil', icon: 'user', label: 'Perfil' },
];

const ADMIN_NAV = [
  { path: '/admin', icon: 'bar-chart', label: 'Panel' },
  { path: '/admin/usuarios', icon: 'users', label: 'Usuarios' },
  { path: '/admin/reportes', icon: 'trending-up', label: 'Reportes' },
  { path: '/admin/citas', icon: 'calendar', label: 'Citas' },
  { path: '/admin/configuracion', icon: 'settings', label: 'Ajustes' },
];

const ModuleLayout = ({ children, showBackButton = true }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const rol = user?.rol || user?.role || 'paciente';

  const getNavItems = () => {
    switch (rol) {
      case 'administrador': return ADMIN_NAV;
      case 'especialista': return ESPECIALISTA_NAV;
      default: return PACIENTE_NAV;
    }
  };

  const getBackPath = () => {
    switch (rol) {
      case 'administrador': return '/admin';
      case 'especialista': return '/especialista';
      default: return '/paciente';
    }
  };

  const navItems = getNavItems();
  const currentNavItem = navItems.find((item) => item.path === location.pathname);
  const currentPageLabel = currentNavItem?.label || 'esta sección';
  const headerSpeechText = `Azaria. Plataforma de Rehabilitación. Estás en ${currentPageLabel}. Sistema de Adherencia Terapéutica.`;

  return (
    <div className="module-layout">
      {/* Header institucional DGTIC */}
      <InstitutionalHeader speechText={headerSpeechText} />

      {/* Botón flotante de volver al inicio */}
      {showBackButton && (
      <button
        className="module-back-fab"
        onClick={() => navigate(getBackPath())}
        aria-label="Volver al inicio"
      >
        ←
      </button>
      )}

      {/* Contenido de la página */}
      <div className="module-content">
        {children}
      </div>

      {/* Footer institucional DGTIC */}
      <InstitutionalFooter />

      {/* Barra de navegación inferior */}
      <nav className="module-bottom-nav" role="navigation" aria-label="Navegación principal">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`module-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            <span className="module-nav-icon" aria-hidden="true"><LucideIcon name={item.icon} size={20} /></span>
            <span className="module-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default ModuleLayout;
