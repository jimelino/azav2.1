import React from 'react';
import BaseLayout from './BaseLayout';
import LucideIcon from '../LucideIcon';

/**
 * EspecialistaLayout - Layout para el rol Especialista
 * Acceso a: pacientes asignados, citas, chat, reportes
 */

const ESPECIALISTA_NAV_ITEMS = [
  { path: '/especialista', icon: 'home', label: 'Inicio' },
  { path: '/especialista/pacientes', icon: 'users', label: 'Mis Usuarios' },
  { path: '/especialista/citas', icon: 'calendar', label: 'Mis Citas' },
  { path: '/especialista/agenda', icon: 'calendar-days', label: 'Agenda' },
  { path: '/especialista/chat', icon: 'message', label: 'Mensajes' },
  { path: '/especialista/seguimientos', icon: 'clipboard', label: 'Seguimientos' },
  { path: '/especialista/reportes', icon: 'bar-chart', label: 'Reportes' },
  { path: '/especialista/recursos', icon: 'book-open', label: 'Recursos' },
  { path: '/perfil', icon: 'user', label: 'Mi Perfil' },
  { path: '/configuracion', icon: 'settings', label: 'Configuración' },
];

const EspecialistaLayout = ({
  children,
  title = 'Portal Especialista',
  subtitle,
  showBackButton = false,
  backPath = '/especialista',
  headerActions,
  pendingTasks,
}) => {
  const sidebarContent = pendingTasks && pendingTasks.length > 0 ? (
    <div className="sidebar-tasks">
      <h3 className="tasks-title">Tareas Pendientes</h3>
      <ul className="tasks-list">
        {pendingTasks.slice(0, 5).map((task, index) => (
          <li key={index} className={`task-item priority-${task.priority || 'normal'}`}>
            <span className="task-icon" aria-hidden="true">
              <LucideIcon name="circle" size={12} color={task.priority === 'high' ? '#C62828' : task.priority === 'medium' ? '#F57F17' : '#2E7D32'} />
            </span>
            <div className="task-content">
              <span className="task-title">{task.title}</span>
              <span className="task-patient">{task.patient}</span>
            </div>
            <span className="task-time">{task.time}</span>
          </li>
        ))}
      </ul>
      {pendingTasks.length > 5 && (
        <p className="tasks-more">+{pendingTasks.length - 5} tareas más</p>
      )}
    </div>
  ) : null;

  return (
    <BaseLayout
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      backPath={backPath}
      headerActions={headerActions}
      navItems={ESPECIALISTA_NAV_ITEMS}
      sidebarContent={sidebarContent}
      role="especialista"
      className="especialista-layout"
    >
      {children}
    </BaseLayout>
  );
};

export default EspecialistaLayout;
