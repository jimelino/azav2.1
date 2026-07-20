import React from 'react';
import BaseLayout from './BaseLayout';
import LucideIcon from '../LucideIcon';
import VoiceHelper from '../VoiceHelper';

/**
 * PacienteLayout - Layout para usuarios pacientes (10-80 años)
 * Diseño simplificado, altamente accesible, con soporte de voz
 */

const PACIENTE_NAV_ITEMS = [
  { path: '/', icon: 'home', label: 'Inicio' },
  { path: '/citas', icon: 'calendar', label: 'Citas' },
  { path: '/recordatorios', icon: 'alarm-clock', label: 'Recordatorios' },
  { path: '/chat', icon: 'message', label: 'Mensajes' },
  { path: '/perfil', icon: 'user', label: 'Mi Perfil' },
];

// Módulos de salud para navegación expandida
const HEALTH_MODULES = [
  { path: '/nutricion', icon: 'salad', label: 'Nutrición', color: 'var(--color-nutricion)' },
  { path: '/medicina', icon: 'pill', label: 'Medicina', color: 'var(--color-medicina)' },
  { path: '/fisioterapia', icon: 'dumbbell', label: 'Fisioterapia', color: 'var(--color-fisioterapia)' },
  { path: '/neuropsicologia', icon: 'brain', label: 'Neuropsicología', color: 'var(--color-neuropsicologia)' },
  { path: '/ortesis', icon: 'accessibility', label: 'Órtesis y prótesis', color: 'var(--color-ortesis)' },
];

const SECONDARY_NAV = [
  { path: '/comunidad', icon: 'users', label: 'Comunidad' },
  { path: '/blog', icon: 'book-open', label: 'Artículos' },
  { path: '/faqs', icon: 'circle-help', label: 'Ayuda' },
  { path: '/configuracion', icon: 'settings', label: 'Ajustes' },
];

const PacienteLayout = ({
  children,
  title = 'Azaria',
  subtitle,
  showBackButton = false,
  backPath = '/',
  headerActions,
  currentModule = 'dashboard',
  showHealthModules = false,
  quickStats,
}) => {
  // Contenido adicional del sidebar para pacientes
  const sidebarContent = (
    <>
      {/* Estadísticas rápidas */}
      {quickStats && (
        <div className="sidebar-quick-stats">
          <h3 className="sidebar-section-title">Tu Progreso</h3>
          <div className="quick-stats-grid">
            {quickStats.map((stat, index) => (
              <div key={index} className="quick-stat">
                <span className="quick-stat-icon" aria-hidden="true">{stat.icon}</span>
                <span className="quick-stat-value">{stat.value}</span>
                <span className="quick-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Módulos de salud (expandible) */}
      {showHealthModules && (
        <div className="sidebar-health-modules">
          <h3 className="sidebar-section-title">Módulos de Salud</h3>
          <nav className="health-modules-nav" aria-label="Módulos de salud">
            {HEALTH_MODULES.map((module, index) => (
              <a
                key={module.path || index}
                href={module.path}
                className="health-module-link"
                style={{ '--module-color': module.color }}
              >
                <span className="module-icon" aria-hidden="true"><LucideIcon name={module.icon} size={20} /></span>
                <span className="module-label">{module.label}</span>
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Navegación secundaria */}
      <div className="sidebar-secondary-nav">
        <h3 className="sidebar-section-title">Más Opciones</h3>
        <nav aria-label="Opciones adicionales">
          {SECONDARY_NAV.map((item, index) => (
            <a key={item.path || index} href={item.path} className="secondary-nav-link">
              <span className="nav-icon" aria-hidden="true"><LucideIcon name={item.icon} size={20} /></span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );

  return (
    <BaseLayout
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      backPath={backPath}
      headerActions={headerActions}
      navItems={PACIENTE_NAV_ITEMS}
      sidebarContent={sidebarContent}
      role="paciente"
      showBottomNav={true}
      className="paciente-layout"
    >
      {children}

      {/* Ayudante de voz flotante */}
      <VoiceHelper currentModule={currentModule} showShortcuts={true} />
    </BaseLayout>
  );
};

export default PacienteLayout;
