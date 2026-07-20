import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import VoiceHelper, { useVoice } from '../components/VoiceHelper';
import ModuleIcon from '../components/ModuleIcon';
import LucideIcon from '../components/LucideIcon';
import { Volume2 } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faseActual, setFaseActual] = useState(null);
  const { speak } = useVoice();

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    try {
      const [resumenRes, faseRes] = await Promise.all([
        api.get(`/dashboard/resumen/${user.id}`),
        user.rol === 'paciente' ? api.get(`/fases/actual/${user.paciente_id || user.id}`) : Promise.resolve(null)
      ]);
      setResumen(resumenRes.data || getResumenDefault());
      if (faseRes) setFaseActual(faseRes.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
      setResumen(getResumenDefault());
    } finally {
      setLoading(false);
    }
  };

  const getResumenDefault = () => ({
    citas_proximas: 0,
    recordatorios_hoy: 0,
    ejercicios_pendientes: 0,
    mensajes_no_leidos: 0
  });

  // Módulos con colores del sistema de diseño
  const modulosPaciente = [
    { id: 'nutricion', nombre: 'Nutrición', ruta: '/nutricion', color: 'var(--color-nutricion)', desc: 'Recetas y seguimiento', voiceDesc: 'Registra tu alimentación y agua' },
    { id: 'medicina', nombre: 'Medicina', ruta: '/medicina', color: 'var(--color-medicina)', desc: 'Control de signos vitales', voiceDesc: 'Registra presión, glucosa y peso' },
    { id: 'fisioterapia', nombre: 'Fisioterapia', ruta: '/fisioterapia', color: 'var(--color-fisioterapia)', desc: 'Ejercicios y rutinas', voiceDesc: 'Tus ejercicios de rehabilitación' },
    { id: 'neuropsicologia', nombre: 'Neuropsicología', ruta: '/neuropsicologia', color: 'var(--color-neuropsicologia)', desc: 'Bienestar emocional', voiceDesc: 'Cuida tu salud mental' },
    { id: 'ortesis', nombre: 'Órtesis y prótesis', ruta: '/ortesis', color: 'var(--color-ortesis)', desc: 'Cuidado de dispositivos ortopédicos', voiceDesc: 'Seguimiento de tu órtesis o prótesis' },
    { id: 'citas', nombre: 'Citas', ruta: '/citas', color: 'var(--color-citas)', desc: 'Agendar y ver citas', voiceDesc: 'Tus citas médicas' },
    { id: 'chat', nombre: 'Chat', ruta: '/chat', color: 'var(--color-chat)', desc: 'Mensajes', voiceDesc: 'Mensajes con tu equipo médico' },
    { id: 'recordatorios', nombre: 'Recordatorios', ruta: '/recordatorios', color: 'var(--color-recordatorios)', desc: 'Alarmas y avisos', voiceDesc: 'Configura tus recordatorios' },
    { id: 'ayuda', nombre: 'Ayuda', ruta: '/faqs', color: 'var(--color-faqs)', desc: 'Preguntas frecuentes', voiceDesc: 'Preguntas y respuestas comunes' },
    { id: 'blog', nombre: 'Artículos', ruta: '/blog', color: 'var(--color-blog)', desc: 'Artículos de salud', voiceDesc: 'Lee artículos sobre tu salud' },
    { id: 'comunidad', nombre: 'Comunidad', ruta: '/comunidad', color: 'var(--color-comunidad)', desc: 'Conecta con otros', voiceDesc: 'Conecta con otros usuarios' }
  ];

  const getSaludoHora = () => {
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

  // Función para leer módulo en voz alta
  const speakModule = (modulo) => {
    speak(`${modulo.nombre}. ${modulo.voiceDesc || modulo.desc}`);
  };

  if (loading) {
    return (
      <div className="dashboard loading-state">
        <div className="spinner"></div>
        <p>Cargando su información...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Botón de ayuda por voz flotante */}
      <VoiceHelper currentModule="dashboard" />

      {/* Header con saludo */}
      <header className="dashboard-header">
        <div className="saludo">
          <h1>{getSaludoHora()}, {user?.nombre_completo?.split(' ')[0]}</h1>
          <p className="fecha-actual">
            {new Date().toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>
        <Link to="/perfil" className="perfil-link" aria-label="Ver mi perfil">
          <div className="avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span>{user?.nombre_completo?.charAt(0) || 'U'}</span>
            )}
          </div>
        </Link>
      </header>

      {/* Fase actual (solo pacientes) */}
      {user?.rol === 'paciente' && faseActual && (
        <div className="fase-card">
          <div className="fase-info">
            <span className="fase-label">Tu fase actual</span>
            <h3 className="fase-nombre">{getFaseNombre(faseActual.fase)}</h3>
          </div>
          <div className="fase-progreso">
            <div className="progreso-bar">
              <div
                className="progreso-fill"
                style={{ width: `${faseActual.progreso || 25}%` }}
              ></div>
            </div>
            <span className="progreso-texto">{faseActual.progreso || 25}% completado</span>
          </div>
        </div>
      )}

      {/* Resumen rápido */}
      <div className="resumen-cards">
        <Link to="/citas" className="resumen-card">
          <span className="resumen-icon"><LucideIcon name="calendar" size={18} /></span>
          <div className="resumen-info">
            <span className="resumen-numero">{resumen?.citas_proximas || 0}</span>
            <span className="resumen-label">Citas próximas</span>
          </div>
        </Link>
        <Link to="/recordatorios" className="resumen-card">
          <span className="resumen-icon"><LucideIcon name="bell" size={18} /></span>
          <div className="resumen-info">
            <span className="resumen-numero">{resumen?.recordatorios_hoy || 0}</span>
            <span className="resumen-label">Recordatorios hoy</span>
          </div>
        </Link>
        <Link to="/fisioterapia" className="resumen-card">
          <span className="resumen-icon"><LucideIcon name="dumbbell" size={18} /></span>
          <div className="resumen-info">
            <span className="resumen-numero">{resumen?.ejercicios_pendientes || 0}</span>
            <span className="resumen-label">Ejercicios</span>
          </div>
        </Link>
        <Link to="/chat" className="resumen-card">
          <span className="resumen-icon"><LucideIcon name="message" size={18} /></span>
          <div className="resumen-info">
            <span className="resumen-numero">{resumen?.mensajes_no_leidos || 0}</span>
            <span className="resumen-label">Mensajes</span>
          </div>
        </Link>
      </div>

      {/* Módulos principales */}
      <section className="modulos-section">
        <h2>Módulos</h2>
        <div className="modulos-grid">
          {modulosPaciente.map(modulo => (
            <Link
              key={modulo.id}
              to={modulo.ruta}
              className="modulo-card"
              style={{ '--modulo-color': modulo.color }}
              aria-label={`${modulo.nombre}: ${modulo.desc}`}
            >
              <ModuleIcon module={modulo.id} size="lg" />
              <div className="modulo-info">
                <h3>{modulo.nombre}</h3>
                <p>{modulo.desc}</p>
              </div>
              <button
                className="modulo-voice-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  speakModule(modulo);
                }}
                aria-label={`Escuchar descripción de ${modulo.nombre}`}
              >
                <Volume2 size={20} />
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="accesos-rapidos">
        <h2>Accesos rápidos</h2>
        <div className="accesos-grid">
          <Link to="/medicina" className="acceso-btn acceso-glucosa">
            <ModuleIcon module="glucosa" size="sm" />
            <span>Registrar glucosa</span>
          </Link>
          <Link to="/neuropsicologia" className="acceso-btn acceso-animo">
            <ModuleIcon module="neuropsicologia" size="sm" />
            <span>¿Cómo me siento?</span>
          </Link>
          <Link to="/citas" className="acceso-btn acceso-cita">
            <ModuleIcon module="citas" size="sm" />
            <span>Agendar cita</span>
          </Link>
          <Link to="/configuracion" className="acceso-btn acceso-config">
            <ModuleIcon module="config" size="sm" />
            <span>Configuración</span>
          </Link>
        </div>
      </section>

      {/* Navegación inferior - PWA optimizada */}
      <nav className="nav-bottom">
        <Link to="/" className="nav-item active" aria-current="page">
          <ModuleIcon module="dashboard" size="sm" />
          <span className="nav-label">Inicio</span>
        </Link>
        <Link to="/citas" className="nav-item">
          <ModuleIcon module="citas" size="sm" />
          <span className="nav-label">Citas</span>
        </Link>
        <Link to="/chat" className="nav-item">
          <ModuleIcon module="chat" size="sm" />
          <span className="nav-label">Chat</span>
        </Link>
        <Link to="/perfil" className="nav-item">
          <ModuleIcon module="perfil" size="sm" />
          <span className="nav-label">Perfil</span>
        </Link>
      </nav>

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default Dashboard;
