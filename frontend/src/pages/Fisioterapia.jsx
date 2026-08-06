import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoice, Speakable } from '../components/VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Fisioterapia.css';

/**
 * Fisioterapia - Módulo de ejercicios y rehabilitación
 * Diseño accesible para usuarios de 10 a 80 años
 */
const Fisioterapia = () => {
  const { user } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, isSpeaking, stop, speakModule } = useVoice();
  const mainContentRef = useRef(null);

  const [activeTab, setActiveTab] = useState('videos');
  const [rutinaDiaria, setRutinaDiaria] = useState([]);
  const [videos, setVideos] = useState([]);
  const [progreso, setProgreso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [completadosHoy, setCompletadosHoy] = useState(new Set());
  const [marcandoCompletado, setMarcandoCompletado] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  // Bienvenida por voz al entrar al módulo
  useEffect(() => {
    if (settings.voiceNavigation) {
      speak('Bienvenido al módulo de Fisioterapia. Aquí encontrarás tu rutina de ejercicios, videos explicativos y tu progreso.');
    }
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'videos') {
        const response = await api.get('/fisioterapia/videos');
        setVideos(response.data || []);
      } else if (activeTab === 'progreso') {
        // Cargar rutina para calcular progreso
        const rutinaRes = await api.get(`/fisioterapia/rutina/${user.paciente_id}`);
        setRutinaDiaria(rutinaRes.data || []);
        const progresoRes = await api.get(`/fisioterapia/progreso/${user.paciente_id}`);
        const raw = progresoRes.data || [];
        setProgreso(raw.map(d => ({
          ...d,
          fecha: d.fecha || d.created_at || new Date().toISOString(),
          porcentaje: d.porcentaje ?? d.percentage ?? 0,
          ejercicios_completados: d.ejercicios_completados ?? d.total_items ?? 0
        })));
      }
    } catch (err) {
      console.error('Error al cargar datos de fisioterapia:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarEjercicioCompletado = async (ejercicioId) => {
    setMarcandoCompletado(true);
    try {
      await api.post('/fisioterapia/ejercicio/completar', {
        paciente_id: user.paciente_id,
        ejercicio_id: ejercicioId,
        fecha: new Date().toISOString().split('T')[0]
      });

      setCompletadosHoy(prev => new Set(prev).add(ejercicioId));
      setRutinaDiaria(prev => prev.map(ej =>
        ej.id === ejercicioId ? { ...ej, completado: true } : ej
      ));

      // Feedback por voz
      if (settings.voiceNavigation) {
        speak('¡Excelente! Ejercicio completado.');
      }
    } catch (err) {
      console.error('Error al marcar ejercicio:', err);
      alert('No se pudo registrar el ejercicio como completado. Intenta de nuevo.');
    } finally {
      setMarcandoCompletado(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : '';
  };

  const calcularProgresoRutina = () => {
    if (rutinaDiaria.length === 0) return 0;
    const completados = rutinaDiaria.filter(ej => ej.completado).length;
    return Math.round((completados / rutinaDiaria.length) * 100);
  };

  const speakEjercicio = (ejercicio) => {
    const texto = `${ejercicio.nombre}. ${ejercicio.descripcion}. ${ejercicio.repeticiones} repeticiones, ${ejercicio.series} series${ejercicio.duracion ? `, duración ${ejercicio.duracion} minutos` : ''}. ${ejercicio.completado ? 'Ya completado.' : 'Pendiente.'}`;
    speak(texto);
  };

  return (
    <div
      className="fisioterapia-page"
      data-theme={settings.theme}
      data-font-scale={settings.fontScale}
      data-contrast={settings.contrast}
      data-age-mode={settings.ageMode}
      data-reduced-motion={settings.reducedMotion}
    >
      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <a href="#ejercicios-list" className="skip-link">
        Saltar a la lista de ejercicios
      </a>

      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 id="page-title">Fisioterapia</h1>
            <p className="subtitle">Ejercicios y rehabilitación para tu recuperación</p>
          </div>

          <div className="header-controls">
            {/* Botón de voz */}
            <button
              className={`control-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => isSpeaking ? stop() : speakModule('fisioterapia')}
              aria-label={isSpeaking ? 'Detener audio' : 'Escuchar ayuda del módulo'}
              aria-pressed={isSpeaking}
            >
              <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
            </button>

            {/* Botón de accesibilidad */}
            <button
              className="control-btn accessibility-btn"
              onClick={togglePanel}
              aria-label="Abrir configuración de accesibilidad"
            >
              <LucideIcon name="accessibility" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Navegación por pestañas */}
      <nav className="tabs" role="tablist" aria-label="Secciones de fisioterapia">
        <button
          role="tab"
          aria-selected={activeTab === 'videos'}
          className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <span className="tab-icon" aria-hidden="true"><LucideIcon name="play" size={18} /></span>
          <span className="tab-text">Videos</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'progreso'}
          className={`tab ${activeTab === 'progreso' ? 'active' : ''}`}
          onClick={() => setActiveTab('progreso')}
        >
          <span className="tab-icon" aria-hidden="true"><LucideIcon name="bar-chart" size={18} /></span>
          <span className="tab-text">Mi Progreso</span>
        </button>
      </nav>

      {/* Contenido principal */}
      <main id="main-content" ref={mainContentRef} tabIndex="-1">
        {loading ? (
          <div className="loading-container" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>Cargando información...</p>
          </div>
        ) : (
          <div className="tab-content">
            {/* Panel de Videos */}
            {activeTab === 'videos' && (
              <div className="videos-section">
                <div className="videos-grid" role="list" aria-label="Lista de videos de ejercicios">
                  {videos.length > 0 ? videos.map(video => (
                    <article
                      key={video.id}
                      className="video-card"
                      role="listitem"
                      onClick={() => setSelectedVideo(video)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedVideo(video)}
                      tabIndex="0"
                      aria-label={`Video: ${video.titulo}. Duración ${video.duracion} minutos.`}
                    >
                      <div className="video-thumbnail">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                          alt=""
                          aria-hidden="true"
                        />
                        <div className="play-icon" aria-hidden="true">▶</div>
                      </div>
                      <div className="video-info">
                        <h3>{video.titulo}</h3>
                        <p className="video-descripcion">{video.descripcion}</p>
                        <div className="video-meta">
                          {video.fase && <span className="video-fase">Fase: {video.fase}</span>}
                          <span className="video-duracion">
                            <LucideIcon name="alarm-clock" size={14} /> {video.duracion} min
                          </span>
                        </div>
                      </div>
                    </article>
                  )) : (
                    <div className="empty-state" role="status">
                      <span className="empty-icon" aria-hidden="true"><LucideIcon name="play" size={32} /></span>
                      <p>No hay videos disponibles</p>
                      <p className="help-text">Tu especialista agregará videos de ejercicios para ti</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Panel de Progreso */}
            {activeTab === 'progreso' && (
              <div className="progreso-section">
                {/* Progreso del día */}
                <Speakable text={`Progreso de hoy: ${calcularProgresoRutina()} por ciento. ${rutinaDiaria.filter(e => e.completado).length} de ${rutinaDiaria.length} ejercicios completados.`}>
                  <section className="progreso-header" aria-labelledby="progreso-title">
                    <div
                      className="progreso-circle"
                      role="progressbar"
                      aria-valuenow={calcularProgresoRutina()}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Progreso de hoy: ${calcularProgresoRutina()}%`}
                    >
                      <svg viewBox="0 0 36 36" aria-hidden="true">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--border-color, #eee)"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--color-success, #2E7D32)"
                          strokeWidth="3"
                          strokeDasharray={`${calcularProgresoRutina()}, 100`}
                        />
                      </svg>
                      <span className="progreso-text" aria-hidden="true">{calcularProgresoRutina()}%</span>
                    </div>
                    <div className="progreso-info">
                      <h3>Progreso de hoy</h3>
                      <p>{rutinaDiaria.filter(e => e.completado).length} de {rutinaDiaria.length} ejercicios</p>
                    </div>
                  </section>
                </Speakable>

                {/* Calendario últimos 7 días */}
                <div className="calendario-progreso" aria-labelledby="calendario-title">
                  <h3 id="calendario-title">Últimos 7 días</h3>
                  <div className="dias-semana" role="list" aria-label="Progreso de los últimos 7 días">
                    {generateWeekDays(progreso).map((dia, index) => {
                      const pct = dia.porcentaje ?? 0;
                      return (
                        <div key={index} className="dia-progreso" role="listitem">
                          <span className="dia-nombre">{dia.diaCorto}</span>
                          <div className={`dia-indicador ${pct >= 100 ? 'completo' : pct > 0 ? 'parcial' : 'vacio'}`}>
                            {pct >= 100 ? '✓' : `${pct}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="estadisticas-progreso" role="region">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-icon" aria-hidden="true"><LucideIcon name="zap" size={20} /></span>
                      <span className="stat-value">{progreso.reduce((acc, d) => acc + (d.ejercicios_completados || 0), 0)}</span>
                      <span className="stat-label">Ejercicios esta semana</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon" aria-hidden="true"><LucideIcon name="zap" size={20} /></span>
                      <span className="stat-value">{calcularRacha(progreso)} días</span>
                      <span className="stat-label">Racha actual</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon" aria-hidden="true"><LucideIcon name="trending-up" size={20} /></span>
                      <span className="stat-value">{calcularPromedioSemanal(progreso)}%</span>
                      <span className="stat-label">Promedio semanal</span>
                    </div>
                  </div>
                </div>

                {progreso.length === 0 && (
                  <div className="empty-state" role="status">
                    <span className="empty-icon" aria-hidden="true"><LucideIcon name="bar-chart" size={32} /></span>
                    <p>Aún no hay historial de progreso</p>
                    <p className="help-text">Completa tu primera rutina para comenzar a ver tu progreso</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de video */}
      {selectedVideo && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content modal-video" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedVideo(null)}
              aria-label="Cerrar video"
            >
              ×
            </button>
            <h2 id="modal-title">{selectedVideo.titulo || selectedVideo.nombre}</h2>
            <div className="video-container">
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo.video_url || selectedVideo.url)}
                title={selectedVideo.titulo || selectedVideo.nombre}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="video-details">
              <p>{selectedVideo.descripcion}</p>
              {selectedVideo.instrucciones && (
                <div className="instrucciones">
                  <h4>Instrucciones:</h4>
                  <p>{selectedVideo.instrucciones}</p>
                </div>
              )}
              <div className="video-modal-acciones">
                <button
                  className="btn btn-voice"
                  onClick={() => speak(`${selectedVideo.titulo || selectedVideo.nombre}. ${selectedVideo.descripcion}. ${selectedVideo.instrucciones || ''}`)}
                  aria-label="Escuchar descripción del video"
                >
                  <LucideIcon name="volume" size={16} /> Escuchar descripción
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => marcarEjercicioCompletado(selectedVideo.id)}
                  disabled={marcandoCompletado || completadosHoy.has(selectedVideo.id)}
                  aria-label="Marcar este ejercicio como completado hoy"
                >
                  <LucideIcon name={completadosHoy.has(selectedVideo.id) ? 'check' : 'circle-check'} size={16} />
                  {completadosHoy.has(selectedVideo.id) ? ' Completado hoy' : (marcandoCompletado ? ' Guardando...' : ' Marcar como completado')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

const calcularRacha = (progreso) => {
  if (!progreso || progreso.length === 0) return 0;
  let racha = 0;
  const ordenado = [...progreso].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  for (const dia of ordenado) {
    if ((dia.porcentaje || 0) >= 100) racha++;
    else break;
  }
  return racha;
};

const calcularPromedioSemanal = (progreso) => {
  if (!progreso || progreso.length === 0) return 0;
  const ultimos7 = progreso.slice(-7);
  const suma = ultimos7.reduce((acc, d) => acc + (d.porcentaje || 0), 0);
  return Math.round(suma / ultimos7.length);
};

const generateWeekDays = (progreso) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const fechaStr = date.toISOString().split('T')[0];
    const diaData = (progreso || []).find(d => (d.fecha || '').split('T')[0] === fechaStr);
    days.push({
      diaCorto: date.toLocaleDateString('es-MX', { weekday: 'short' }),
      porcentaje: diaData?.porcentaje ?? 0,
      ejercicios_completados: diaData?.ejercicios_completados ?? 0
    });
  }
  return days;
};

export default Fisioterapia;
