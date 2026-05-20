import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useVoice } from '../VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../accessibility/AccessibilityPanel';
import LucideIcon from '../LucideIcon';
import './layouts.css';

/**
 * BaseLayout - Layout base con funcionalidades comunes
 * Incluye: Header, navegación, accesibilidad, voz
 */
const BaseLayout = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  backPath = '/',
  headerActions,
  navItems = [],
  sidebarContent,
  role = 'paciente',
  showBottomNav = true,
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, isSpeaking, stop } = useVoice();

  const handleLogout = async () => {
    speak('Cerrando sesión');
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    speak('Volviendo atrás');
    navigate(backPath);
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin': return 'var(--color-medicina)';
      case 'especialista': return 'var(--color-neuropsicologia)';
      default: return 'var(--color-primary)';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'especialista': return 'Especialista';
      default: return 'Usuario';
    }
  };

  return (
    <div className={`layout layout-${role} ${className}`}>
      {/* Skip Links para accesibilidad */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <a href="#main-nav" className="skip-link">
        Saltar a la navegación
      </a>

      {/* Header */}
      <header className="layout-header" role="banner">
        <div className="header-left">
          {showBackButton && (
            <button
              className="back-btn"
              onClick={handleBack}
              aria-label="Volver atrás"
            >
              ←
            </button>
          )}
          <div className="header-title-group">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="header-right">
          {headerActions}

          {/* Botón de voz rápida */}
          <button
            className={`header-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => isSpeaking ? stop() : speak(`Estás en ${title}. ${subtitle || ''}`)}
            aria-label={isSpeaking ? 'Detener audio' : 'Escuchar descripción de página'}
          >
            <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
          </button>

          {/* Botón de accesibilidad */}
          <button
            className="header-btn accessibility-btn"
            onClick={togglePanel}
            aria-label="Abrir configuración de accesibilidad"
          >
            <LucideIcon name="accessibility" size={20} />
          </button>

          {/* Perfil de usuario */}
          <div className="header-user">
            <Link to="/perfil" className="user-avatar" aria-label="Ver mi perfil">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" />
              ) : (
                <span>{user?.nombre?.charAt(0) || 'U'}</span>
              )}
            </Link>
            <div className="user-info">
              <span className="user-name">{user?.nombre || 'Usuario'}</span>
              <span className="user-role" style={{ color: getRoleColor() }}>
                {getRoleLabel()}
              </span>
            </div>
          </div>

          {/* Botón de logout */}
          <button
            className="header-btn logout-btn"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LucideIcon name="logout" size={20} />
          </button>
        </div>
      </header>

      {/* Contenido principal con sidebar opcional */}
      <div className="layout-body">
        {sidebarContent && (
          <aside className="layout-sidebar" role="complementary" aria-label="Barra lateral">
            <nav id="main-nav" className="sidebar-nav" aria-label="Navegación principal">
              {navItems.map((item, index) => (
                <Link
                  key={item.path || index}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  onFocus={() => settings.autoSpeak && speak(item.label)}
                >
                  <span className="nav-icon" aria-hidden="true"><LucideIcon name={item.icon} size={20} /></span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge" aria-label={`${item.badge} pendientes`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            {sidebarContent}
          </aside>
        )}

        <main id="main-content" className="layout-main" role="main" tabIndex="-1">
          {children}
        </main>
      </div>

      {/* Navegación inferior para móvil */}
      {showBottomNav && navItems.length > 0 && (
        <nav className="bottom-nav" role="navigation" aria-label="Navegación móvil">
          {navItems.slice(0, 5).map((item, index) => (
            <Link
              key={item.path || index}
              to={item.path}
              className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true"><LucideIcon name={item.icon} size={20} /></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Panel de accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default BaseLayout;
