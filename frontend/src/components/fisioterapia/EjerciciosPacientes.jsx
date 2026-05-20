import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './EjerciciosPacientes.css';

const EjerciciosPacientes = ({ pacienteId, onBack }) => {
  const [activeTab, setActiveTab] = useState('asignados');
  const [videosAsignados, setVideosAsignados] = useState([]);
  const [catalogoVideos, setCatalogoVideos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias] = useState(['fortalecimiento', 'estiramiento', 'balance', 'cardio']);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [videoSeleccionado, setVideoSeleccionado] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [formAsignar, setFormAsignar] = useState({ frecuencia: '', repeticiones: '' });

  useEffect(() => { cargarDatos(); }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [asigRes, catRes, histRes] = await Promise.all([
        api.get(`/fisioterapia/rutina/${pacienteId}`),
        api.get('/fisioterapia/videos'),
        api.get(`/fisioterapia/progreso/${pacienteId}`)
      ]);
      const toArr = (r) => { const d = r?.data ?? r; return Array.isArray(d) ? d : []; };
      setVideosAsignados(toArr(asigRes));
      setCatalogoVideos(toArr(catRes));
      setHistorial(toArr(histRes));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!videoSeleccionado) return;
    setAsignando(true);
    try {
      await api.post(`/fisioterapia/videos/asignar/${pacienteId}/${videoSeleccionado.id}`, {
        frecuencia: formAsignar.frecuencia || null,
        repeticiones: formAsignar.repeticiones || null,
      });
      setShowAsignarModal(false);
      setVideoSeleccionado(null);
      setFormAsignar({ frecuencia: '', repeticiones: '' });
      await cargarDatos();
    } catch (error) {
      console.error('Error asignando video:', error);
      alert('Error al asignar el video. Puede que ya esté asignado.');
    } finally {
      setAsignando(false);
    }
  };

  const abrirModalAsignar = (video) => {
    setVideoSeleccionado(video);
    setShowAsignarModal(true);
  };

  const videosFiltrados = catalogoVideos.filter(v => {
    if (filtroCategoria && v.categoria_nombre !== filtroCategoria) return false;
    if (filtroNivel && v.nivel_nombre !== filtroNivel) return false;
    return true;
  });

  const idsAsignados = new Set(videosAsignados.map(v => v.id));

  const getThumbnail = (video) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.youtube_video_id) return `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;
    return null;
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'basico': return '#4CAF50';
      case 'intermedio': return '#FF9800';
      case 'avanzado': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <section className="module-view ejercicios-pacientes">
        <div className="module-header">
          <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2 className="module-title"><LucideIcon name="dumbbell" size={22} /> Ejercicios de Usuarios</h2>
        </div>
        <div className="loading-state"><div className="loading-spinner"></div><p>Cargando ejercicios...</p></div>
      </section>
    );
  }

  return (
    <section className="module-view ejercicios-pacientes">
      <div className="module-header">
        <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
        <h2 className="module-title"><LucideIcon name="dumbbell" size={22} /> Ejercicios de Usuarios</h2>
      </div>

      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'asignados' ? 'active' : ''}`} onClick={() => setActiveTab('asignados')}>
          <LucideIcon name="check" size={16} /> Asignados ({videosAsignados.length})
        </button>
        <button className={`tab-btn ${activeTab === 'catalogo' ? 'active' : ''}`} onClick={() => setActiveTab('catalogo')}>
          <LucideIcon name="list" size={16} /> Catálogo
        </button>
        <button className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
          <LucideIcon name="clock" size={16} /> Historial
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'asignados' && (
          <div className="tab-asignados">
            {videosAsignados.length === 0 ? (
              <div className="empty-state">
                <LucideIcon name="dumbbell" size={48} />
                <h3>Sin ejercicios asignados</h3>
                <p>Ve al catálogo para asignar videos de ejercicio a este usuario.</p>
                <button className="btn-primary" onClick={() => setActiveTab('catalogo')}>
                  <LucideIcon name="plus" size={16} /> Ir al Catálogo
                </button>
              </div>
            ) : (
              <div className="videos-grid">
                {videosAsignados.map(video => (
                  <div key={video.id} className="video-card asignado">
                    <div className="video-thumb">
                      {getThumbnail(video) ? (
                        <img src={getThumbnail(video)} alt={video.titulo} />
                      ) : (
                        <div className="thumb-placeholder"><LucideIcon name="play" size={32} /></div>
                      )}
                      {video.duracion_minutos && (
                        <span className="video-duration">{video.duracion_minutos} min</span>
                      )}
                    </div>
                    <div className="video-info">
                      <h4>{video.titulo}</h4>
                      {video.descripcion && <p className="video-desc">{video.descripcion.substring(0, 100)}</p>}
                      <div className="video-meta">
                        {video.nivel_nombre && (
                          <span className="badge-nivel" style={{ color: getNivelColor(video.nivel_nombre) }}>
                            {video.nivel_nombre}
                          </span>
                        )}
                        {video.categoria_nombre && <span className="badge-cat">{video.categoria_nombre}</span>}
                      </div>
                      {video.frecuencia_recomendada && (
                        <p className="video-freq"><LucideIcon name="refresh-cw" size={14} /> {video.frecuencia_recomendada}</p>
                      )}
                      {video.repeticiones && (
                        <p className="video-reps"><LucideIcon name="rotate-ccw" size={14} /> {video.repeticiones}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'catalogo' && (
          <div className="tab-catalogo">
            <div className="filtros-bar">
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}>
                <option value="">Todos los niveles</option>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>

            {videosFiltrados.length === 0 ? (
              <div className="empty-state">
                <LucideIcon name="search" size={48} />
                <h3>No se encontraron videos</h3>
                <p>Intenta ajustar los filtros.</p>
              </div>
            ) : (
              <div className="videos-grid">
                {videosFiltrados.map(video => {
                  const yaAsignado = idsAsignados.has(video.id);
                  return (
                    <div key={video.id} className={`video-card catalogo ${yaAsignado ? 'ya-asignado' : ''}`}>
                      <div className="video-thumb">
                        {getThumbnail(video) ? (
                          <img src={getThumbnail(video)} alt={video.titulo} />
                        ) : (
                          <div className="thumb-placeholder"><LucideIcon name="play" size={32} /></div>
                        )}
                        {video.duracion_minutos && (
                          <span className="video-duration">{video.duracion_minutos} min</span>
                        )}
                      </div>
                      <div className="video-info">
                        <h4>{video.titulo}</h4>
                        {video.descripcion && <p className="video-desc">{video.descripcion.substring(0, 80)}</p>}
                        <div className="video-meta">
                          {video.nivel_nombre && (
                            <span className="badge-nivel" style={{ color: getNivelColor(video.nivel_nombre) }}>
                              {video.nivel_nombre}
                            </span>
                          )}
                          {video.categoria_nombre && <span className="badge-cat">{video.categoria_nombre}</span>}
                        </div>
                        <div className="video-actions">
                          {yaAsignado ? (
                            <span className="asignado-badge"><LucideIcon name="circle-check" size={14} /> Asignado</span>
                          ) : (
                            <button className="btn-asignar" onClick={() => abrirModalAsignar(video)}>
                              <LucideIcon name="plus" size={14} /> Asignar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="tab-historial">
            {historial.length === 0 ? (
              <div className="empty-state">
                <LucideIcon name="clock" size={48} />
                <h3>Sin historial</h3>
                <p>El usuario aún no ha realizado ejercicios registrados.</p>
              </div>
            ) : (
              <div className="historial-list">
                {historial.map((reg, idx) => (
                  <div key={idx} className="historial-item">
                    <div className="historial-fecha">
                      <LucideIcon name="calendar" size={14} />
                      {new Date(reg.fecha || reg.created_at).toLocaleDateString('es-MX')}
                    </div>
                    <div className="historial-detalle">
                      <span className="historial-titulo">{reg.titulo || `Video #${reg.video_id}`}</span>
                      {reg.porcentaje_visto !== undefined && (
                        <div className="progress-bar-mini">
                          <div className="progress-fill" style={{ width: `${reg.porcentaje_visto}%` }}></div>
                          <span>{reg.porcentaje_visto}%</span>
                        </div>
                      )}
                    </div>
                    {reg.completado === 1 && (
                      <span className="badge-completado"><LucideIcon name="circle-check" size={14} /></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Asignar Video */}
      {showAsignarModal && videoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowAsignarModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><LucideIcon name="plus" size={20} /> Asignar Video</h3>
              <button className="modal-close" onClick={() => setShowAsignarModal(false)}>
                <LucideIcon name="x" size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="video-preview">
                <h4>{videoSeleccionado.titulo}</h4>
                {videoSeleccionado.descripcion && <p>{videoSeleccionado.descripcion}</p>}
              </div>
              <div className="form-group">
                <label>Frecuencia recomendada</label>
                <input
                  type="text"
                  placeholder="Ej: 3 veces por semana"
                  value={formAsignar.frecuencia}
                  onChange={e => setFormAsignar({ ...formAsignar, frecuencia: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Repeticiones</label>
                <input
                  type="text"
                  placeholder="Ej: 3 series de 10"
                  value={formAsignar.repeticiones}
                  onChange={e => setFormAsignar({ ...formAsignar, repeticiones: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAsignarModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAsignar} disabled={asignando}>
                {asignando ? 'Asignando...' : 'Asignar Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default EjerciciosPacientes;
