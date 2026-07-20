import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useVoice, Speakable } from '../../components/VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../../components/accessibility/AccessibilityPanel';
import InstitutionalHeader from '../../components/layouts/InstitutionalHeader';
import InstitutionalFooter from '../../components/layouts/InstitutionalFooter';
import LucideIcon from '../../components/LucideIcon';
import api from '../../services/api';
import '../../components/layouts/institutional.css';
import './PacienteDashboard.css';

/**
 * PacienteDashboard - Dashboard principal para pacientes
 * Diseño accesible para usuarios de 10 a 80 años
 * Basado en principios de Doctor's Helpline UI
 */

// Categorías de especialidades (similar a la imagen de referencia)
const CATEGORIAS = [
  { id: 'nutricion', nombre: 'Nutrición', icon: 'salad', color: '#66BB6A', ruta: '/nutricion', desc: 'Alimentación saludable' },
  { id: 'medicina', nombre: 'Medicina', icon: 'heart', color: '#E57373', ruta: '/medicina', desc: 'Control de salud' },
  { id: 'fisioterapia', nombre: 'Fisioterapia', icon: 'dumbbell', color: '#FFB74D', ruta: '/fisioterapia', desc: 'Ejercicios' },
  { id: 'neuropsicologia', nombre: 'Neurpsicologia', icon: 'brain', color: '#BA68C8', ruta: '/neuropsicologia', desc: 'Bienestar mental' },
  { id: 'ortesis', nombre: 'Órtesis y prótesis', icon: 'accessibility', color: '#64B5F6', ruta: '/ortesis', desc: 'Dispositivos ortopédicos' },
  { id: 'fases', nombre: 'Mi Progreso', icon: 'trending-up', color: '#4DB6AC', ruta: '/fases', desc: 'Tu rehabilitación' },
];

// Accesos rápidos principales
const ACCESOS_RAPIDOS = [
  { id: 'expediente', nombre: 'Mi Expediente', icon: 'clipboard', color: '#E57373', ruta: '/expediente', desc: 'Tu historial medico' },
  { id: 'citas', nombre: 'Mis Citas', icon: 'calendar', color: '#66BB6A', ruta: '/citas', desc: 'Ver y agendar citas' },
  { id: 'recordatorios', nombre: 'Recordatorios', icon: 'alarm-clock', color: '#FFD54F', ruta: '/recordatorios', desc: 'Tus alarmas' },
  { id: 'chat', nombre: 'Mensajes', icon: 'message', color: '#4DD0E1', ruta: '/chat', desc: 'Habla con tu equipo' },
  { id: 'comunidad', nombre: 'Comunidad', icon: 'users', color: '#F06292', ruta: '/comunidad', desc: 'Conecta con otros' },
];

const PacienteDashboard = () => {
  const { user } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, speakModule, isSpeaking, stop } = useVoice();
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [faseActual, setFaseActual] = useState(null);
  const [proximaCita, setProximaCita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();

    // Bienvenida por voz si está activado
    if (settings.voiceNavigation) {
      const nombre = user?.nombre?.split(' ')[0] || 'usuario';
      speak(`Bienvenido ${nombre}. Estás en tu panel principal. Usa las flechas para navegar.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resumenRes, faseRes] = await Promise.all([
        api.get(`/dashboard/resumen/${user?.id}`).catch(() => ({ data: null })),
        api.get(`/fases/actual/${user?.paciente_id || user?.id}`).catch(() => ({ data: null })),
      ]);

      setResumen(resumenRes.data || {
        citas_proximas: 2,
        recordatorios_hoy: 3,
        ejercicios_pendientes: 5,
        mensajes_no_leidos: 1
      });

      const fData = faseRes?.data || faseRes;
      setFaseActual({
        fase: fData?.numero || fData?.fase || 1,
        nombre: fData?.nombre || null,
        progreso: fData?.progreso_general ?? fData?.progreso ?? 0
      });

      // Simular próxima cita
      setProximaCita({
        especialista: 'Dr. García',
        especialidad: 'Fisioterapia',
        fecha: 'Mañana',
        hora: '10:00 AM'
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getFaseNombre = (fase) => {
    const fases = {
      1: 'Pre-operatorio',
      2: 'Post-operatorio',
      3: 'Rehabilitación',
      4: 'Mantenimiento'
    };
    return fases[fase] || `Fase ${fase}`;
  };

  const handleCategoriaClick = (categoria) => {
    if (settings.voiceNavigation) {
      speak(`Abriendo ${categoria.nombre}. ${categoria.desc}`);
    }
    navigate(categoria.ruta);
  };

  if (loading) {
    return (
      <div className="paciente-dashboard loading" role="status" aria-live="polite">
        <div className="loading-content">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Cargando tu información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="paciente-dashboard" data-age-mode={settings.ageMode}>
      {/* Header institucional DGTIC */}
      <InstitutionalHeader />

      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Barra de acciones rapidas */}
      <div className="dashboard-actions-bar">
        <div className="header-right">
          {/* Botón de voz */}
          <button
            className={`header-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => isSpeaking ? stop() : speakModule('dashboard')}
            aria-label={isSpeaking ? 'Detener audio' : 'Escuchar ayuda'}
          >
            <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
          </button>

          {/* Botón de accesibilidad */}
          <button
            className="header-btn accessibility-btn"
            onClick={togglePanel}
            aria-label="Configuración de accesibilidad"
          >
            ♿
          </button>

          {/* Perfil */}
          <Link to="/perfil" className="user-avatar-link" aria-label="Mi perfil">
            <div className="user-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" />
              ) : (
                <span>{user?.nombre?.charAt(0) || 'U'}</span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Contenido Principal */}
      <main id="main-content" className="dashboard-content" tabIndex="-1">
        {/* Sección de Bienvenida */}
        <section className="welcome-section" aria-labelledby="welcome-heading">
          <div className="welcome-text">
            <h1 id="welcome-heading">{getSaludo()},</h1>
            <p className="user-name">{user?.nombre?.split(' ')[0] || 'Usuario'}</p>
            <p className="welcome-subtitle">¿Cómo te sientes hoy?</p>
          </div>
          <div className="welcome-illustration" aria-hidden="true">
            <LucideIcon name="stethoscope" size={32} />
          </div>
        </section>

        {/* Próxima Cita (destacada) */}
        {proximaCita && (
          <Speakable
            text={`Tu próxima cita es ${proximaCita.fecha} a las ${proximaCita.hora} con ${proximaCita.especialista}, especialidad ${proximaCita.especialidad}`}
          >
            <section className="next-appointment" aria-labelledby="next-appointment-heading">
              <h2 id="next-appointment-heading" className="sr-only">Próxima cita</h2>
              <div className="appointment-card">
                <div className="appointment-icon" aria-hidden="true"><LucideIcon name="calendar" size={20} /></div>
                <div className="appointment-info">
                  <span className="appointment-label">Próxima cita</span>
                  <span className="appointment-doctor">{proximaCita.especialista}</span>
                  <span className="appointment-specialty">{proximaCita.especialidad}</span>
                </div>
                <div className="appointment-time">
                  <span className="time-date">{proximaCita.fecha}</span>
                  <span className="time-hour">{proximaCita.hora}</span>
                </div>
                <Link to="/citas" className="appointment-action" aria-label="Ver todas las citas">
                  Ver →
                </Link>
              </div>
            </section>
          </Speakable>
        )}

        {/* Categorías de Especialidades */}
        <section className="categories-section" aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="section-title">Categorías</h2>
          <div className="categories-grid" role="list">
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria.id}
                className="category-card"
                style={{ '--category-color': categoria.color }}
                onClick={() => handleCategoriaClick(categoria)}
                onFocus={() => settings.autoSpeak && speak(categoria.nombre)}
                role="listitem"
                aria-label={`${categoria.nombre}: ${categoria.desc}`}
              >
                <div className="category-icon-wrapper">
                  <span className="category-icon" aria-hidden="true"><LucideIcon name={categoria.icon} size={24} /></span>
                </div>
                <span className="category-name">{categoria.nombre}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Resumen Rápido */}
        <section className="summary-section" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="section-title">Tu Resumen</h2>
          <div className="summary-grid">
            <Link to="/citas" className="summary-card citas">
              <span className="summary-icon" aria-hidden="true"><LucideIcon name="calendar" size={20} /></span>
              <span className="summary-value">{resumen?.citas_proximas || 0}</span>
              <span className="summary-label">Citas</span>
            </Link>

            <Link to="/recordatorios" className="summary-card recordatorios">
              <span className="summary-icon" aria-hidden="true"><LucideIcon name="alarm-clock" size={20} /></span>
              <span className="summary-value">{resumen?.recordatorios_hoy || 0}</span>
              <span className="summary-label">Recordatorios</span>
            </Link>

            <Link to="/fisioterapia" className="summary-card ejercicios">
              <span className="summary-icon" aria-hidden="true"><LucideIcon name="dumbbell" size={20} /></span>
              <span className="summary-value">{resumen?.ejercicios_pendientes || 0}</span>
              <span className="summary-label">Ejercicios</span>
            </Link>

            <Link to="/chat" className="summary-card mensajes">
              <span className="summary-icon" aria-hidden="true"><LucideIcon name="message" size={20} /></span>
              <span className="summary-value">{resumen?.mensajes_no_leidos || 0}</span>
              <span className="summary-label">Mensajes</span>
            </Link>
          </div>
        </section>

        {/* Mi Progreso */}
        {faseActual && (
          <section className="progress-section" aria-labelledby="progress-heading">
            <h2 id="progress-heading" className="section-title">Mi Progreso</h2>
            <Link to="/fases" className="progress-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="progress-header">
                <div className="progress-phase-info">
                  <span className="progress-motivational-icon" aria-hidden="true">
                    <LucideIcon name={faseActual.progreso >= 75 ? 'trophy' : faseActual.progreso >= 50 ? 'zap' : faseActual.progreso >= 25 ? 'sprout' : 'rocket'} size={24} />
                  </span>
                  <span className="progress-phase">{faseActual.nombre || getFaseNombre(faseActual.fase)}</span>
                </div>
                <span className="progress-percentage">{faseActual.progreso}%</span>
              </div>
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={faseActual.progreso}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Progreso: ${faseActual.progreso}%`}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${faseActual.progreso}%` }}
                ></div>
              </div>
              <p className="progress-message">
                {faseActual.progreso >= 75
                  ? '¡Increíble! Estás muy cerca de tu meta.'
                  : faseActual.progreso >= 50
                  ? '¡Excelente progreso! Ya casi llegas.'
                  : faseActual.progreso >= 25
                  ? '¡Sigue así! Vas por buen camino.'
                  : '¡Tu camino comienza aquí! Cada paso cuenta.'}
              </p>
            </Link>
          </section>
        )}

        {/* Accesos Rápidos */}
        <section className="quick-access-section" aria-labelledby="quick-access-heading">
          <h2 id="quick-access-heading" className="section-title">Acceso Rápido</h2>
          <div className="quick-access-grid">
            {ACCESOS_RAPIDOS.map((acceso) => (
              <Link
                key={acceso.id}
                to={acceso.ruta}
                className="quick-access-card"
                style={{ '--access-color': acceso.color }}
                onFocus={() => settings.autoSpeak && speak(`${acceso.nombre}. ${acceso.desc}`)}
              >
                <span className="access-icon" aria-hidden="true"><LucideIcon name={acceso.icon} size={20} /></span>
                <span className="access-name">{acceso.nombre}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección de Ayuda */}
        <section className="help-section" aria-labelledby="help-heading">
          <h2 id="help-heading" className="sr-only">Ayuda y soporte</h2>
          <div className="help-card">
            <div className="help-icon" aria-hidden="true"><LucideIcon name="circle-help" size={24} /></div>
            <div className="help-content">
              <h3>¿Necesitas ayuda?</h3>
              <p>Estamos aquí para asistirte en todo momento.</p>
            </div>
            <Link to="/faqs" className="help-btn">Ver Ayuda</Link>
          </div>
        </section>
      </main>

      {/* Navegación Inferior */}
      <nav className="bottom-navigation" role="navigation" aria-label="Navegación principal">
        <Link to="/" className="nav-item active" aria-current="page">
          <span className="nav-icon" aria-hidden="true"><LucideIcon name="home" size={20} /></span>
          <span className="nav-label">Inicio</span>
        </Link>
        <Link to="/citas" className="nav-item">
          <span className="nav-icon" aria-hidden="true"><LucideIcon name="calendar" size={20} /></span>
          <span className="nav-label">Citas</span>
        </Link>
        <Link to="/chat" className="nav-item">
          <span className="nav-icon" aria-hidden="true"><LucideIcon name="message" size={20} /></span>
          <span className="nav-label">Mensajes</span>
          {resumen?.mensajes_no_leidos > 0 && (
            <span className="nav-badge" aria-label={`${resumen.mensajes_no_leidos} mensajes nuevos`}>
              {resumen.mensajes_no_leidos}
            </span>
          )}
        </Link>
        <Link to="/perfil" className="nav-item">
          <span className="nav-icon" aria-hidden="true"><LucideIcon name="user" size={20} /></span>
          <span className="nav-label">Perfil</span>
        </Link>
      </nav>

      {/* Footer institucional DGTIC */}
      <InstitutionalFooter />

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default PacienteDashboard;
