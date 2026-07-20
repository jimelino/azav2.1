import {
  Home, Salad, Dumbbell, Pill, Brain, Accessibility,
  Users, Calendar, AlarmClock, BookOpen, User,
  GlassWater, Scale, TrendingUp, HeartPulse, MessageCircle,
  CircleHelp, Settings, Bell, CircleCheck, CircleX
} from 'lucide-react';
import '../styles/ModuleIcon.css';

/**
 * ModuleIcon - Iconos visuales grandes para cada módulo
 * Diseñado para adultos mayores con iconos claros y descriptivos
 * Usa Lucide React (tree-shakeable, sin CDN externo)
 */

// Mapeo de módulos a iconos Lucide
const MODULE_ICONS = {
  dashboard: {
    icon: Home,
    label: 'Inicio',
    color: '#1976D2'
  },
  nutricion: {
    icon: Salad,
    label: 'Nutrición',
    color: '#2E7D32'
  },
  fisioterapia: {
    icon: Dumbbell,
    label: 'Ejercicios',
    color: '#E65100'
  },
  medicina: {
    icon: Pill,
    label: 'Medicina',
    color: '#C62828'
  },
  neuropsicologia: {
    icon: Brain,
    label: 'Mente',
    color: '#6A1B9A'
  },
  ortesis: {
    icon: Accessibility,
    label: 'Órtesis y prótesis',
    color: '#1565C0'
  },
  comunidad: {
    icon: Users,
    label: 'Comunidad',
    color: '#AD1457'
  },
  citas: {
    icon: Calendar,
    label: 'Citas',
    color: '#1B5E20'
  },
  recordatorios: {
    icon: AlarmClock,
    label: 'Recordatorios',
    color: '#F57F17'
  },
  blog: {
    icon: BookOpen,
    label: 'Artículos',
    color: '#283593'
  },
  perfil: {
    icon: User,
    label: 'Perfil',
    color: '#455A64'
  },
  agua: {
    icon: GlassWater,
    label: 'Agua',
    color: '#0277BD'
  },
  peso: {
    icon: Scale,
    label: 'Peso',
    color: '#5D4037'
  },
  glucosa: {
    icon: TrendingUp,
    label: 'Glucosa',
    color: '#C62828'
  },
  presion: {
    icon: HeartPulse,
    label: 'Presión',
    color: '#AD1457'
  },
  chat: {
    icon: MessageCircle,
    label: 'Chat',
    color: '#00838F'
  },
  ayuda: {
    icon: CircleHelp,
    label: 'Ayuda',
    color: '#E65100'
  },
  config: {
    icon: Settings,
    label: 'Ajustes',
    color: '#455A64'
  },
  notificacion: {
    icon: Bell,
    label: 'Alertas',
    color: '#F57F17'
  },
  exito: {
    icon: CircleCheck,
    label: 'Éxito',
    color: '#2E7D32'
  },
  error: {
    icon: CircleX,
    label: 'Error',
    color: '#C62828'
  }
};

// Tamaños de icono en px
const ICON_SIZES = { sm: 20, md: 28, lg: 36, xl: 48 };

const ModuleIcon = ({
  module,
  size = 'md',
  showLabel = false,
  onClick,
  className = '',
  style = {}
}) => {
  const iconData = MODULE_ICONS[module] || MODULE_ICONS.dashboard;
  const IconComponent = iconData.icon;
  const iconSize = ICON_SIZES[size] || ICON_SIZES.md;

  const sizeClasses = {
    sm: 'icon-sm',
    md: 'icon-md',
    lg: 'icon-lg',
    xl: 'icon-xl'
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <div
      className={`module-icon-wrapper ${sizeClasses[size]} ${className} ${onClick ? 'clickable' : ''}`}
      style={{
        '--icon-color': iconData.color,
        '--icon-color-light': `${iconData.color}22`,
        ...style
      }}
      onClick={handleClick}
      role={onClick ? 'button' : 'img'}
      aria-label={iconData.label}
      tabIndex={onClick ? 0 : -1}
    >
      <div className="module-icon-circle">
        <IconComponent
          size={iconSize}
          className="module-icon-lucide"
          strokeWidth={1.8}
        />
      </div>
      {showLabel && (
        <span className="module-icon-label">{iconData.label}</span>
      )}
    </div>
  );
};

// Componente para grid de módulos
export const ModuleGrid = ({ modules, onModuleClick, columns = 3 }) => {
  return (
    <div className={`module-grid module-grid-${columns}`}>
      {modules.map((mod) => (
        <div
          key={mod.id}
          className="module-grid-item"
          onClick={() => onModuleClick && onModuleClick(mod)}
        >
          <ModuleIcon
            module={mod.id}
            size="lg"
            showLabel={true}
            onClick={() => onModuleClick && onModuleClick(mod)}
          />
          {mod.badge && (
            <span className="module-badge">{mod.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
};

// Componente de tarjeta de módulo completa
export const ModuleCard = ({
  module,
  title,
  description,
  onClick,
  badge,
  progress
}) => {
  const iconData = MODULE_ICONS[module] || MODULE_ICONS.dashboard;

  return (
    <div
      className="module-card-full"
      style={{ '--card-color': iconData.color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="module-card-header">
        <ModuleIcon module={module} size="lg" />
        {badge && <span className="module-card-badge">{badge}</span>}
      </div>

      <div className="module-card-content">
        <h3 className="module-card-title">{title || iconData.label}</h3>
        {description && (
          <p className="module-card-description">{description}</p>
        )}
      </div>

      {progress !== undefined && (
        <div className="module-card-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}

      <div className="module-card-arrow">→</div>
    </div>
  );
};

export default ModuleIcon;
