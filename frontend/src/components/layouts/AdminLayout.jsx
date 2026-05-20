import React from 'react';
import BaseLayout from './BaseLayout';
import LucideIcon from '../LucideIcon';

/**
 * AdminLayout - Layout para el rol Administrador
 * Acceso completo al sistema: usuarios, reportes, configuración
 */

const ADMIN_NAV_ITEMS = [
  { path: '/admin', icon: 'bar-chart', label: 'Panel Admin' },
  { path: '/admin/usuarios', icon: 'users', label: 'Usuarios' },
  { path: '/admin/especialistas', icon: 'stethoscope', label: 'Especialistas' },
  { path: '/admin/pacientes', icon: 'hospital', label: 'Usuarios' },
  { path: '/admin/reportes', icon: 'trending-up', label: 'Reportes' },
  { path: '/admin/citas', icon: 'calendar', label: 'Citas' },
  { path: '/admin/contenido', icon: 'pen-line', label: 'Contenido' },
  { path: '/admin/notificaciones', icon: 'bell', label: 'Notificaciones' },
  { path: '/admin/configuracion', icon: 'settings', label: 'Configuración' },
  { path: '/admin/logs', icon: 'clipboard', label: 'Registros' },
];

const AdminLayout = ({
  children,
  title = 'Administración',
  subtitle,
  showBackButton = false,
  backPath = '/admin',
  headerActions,
  stats,
}) => {
  const sidebarContent = stats ? (
    <div className="sidebar-stats">
      <h3 className="stats-title">Resumen del Sistema</h3>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
            {stat.trend && (
              <span className={`stat-trend ${stat.trend > 0 ? 'positive' : 'negative'}`}>
                {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <BaseLayout
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      backPath={backPath}
      headerActions={headerActions}
      navItems={ADMIN_NAV_ITEMS}
      sidebarContent={sidebarContent}
      role="admin"
      className="admin-layout"
    >
      {children}
    </BaseLayout>
  );
};

export default AdminLayout;
