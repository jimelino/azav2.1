import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './PlanesTratamiento.css';

const ESTADO_CONFIG = {
  activo: { label: 'Activo', color: '#4CAF50', icon: 'circle-check' },
  pausado: { label: 'Pausado', color: '#FF9800', icon: 'clock' },
  completado: { label: 'Completado', color: '#2196F3', icon: 'trophy' },
  cancelado: { label: 'Cancelado', color: '#F44336', icon: 'circle-x' },
};

const EMPTY_FORM = {
  nombre: '',
  objetivo: '',
  duracion_semanas: '4',
  frecuencia_semanal: '3',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  notas: '',
  ejercicios: [],
};

const PlanesTratamiento = ({ pacienteId, onBack }) => {
  const [planes, setPlanes] = useState([]);
  const [videosDisponibles, setVideosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('lista'); // lista | form | detalle
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editandoId, setEditandoId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detallePlan, setDetallePlan] = useState(null);
  const [showVideoSelector, setShowVideoSelector] = useState(false);

  useEffect(() => { cargarDatos(); }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [planesRes, videosRes] = await Promise.all([
        api.get(`/fisioterapia/planes/paciente/${pacienteId}`),
        api.get('/fisioterapia/videos')
      ]);
      const toArr = (r) => { const d = r?.data ?? r; return Array.isArray(d) ? d : []; };
      setPlanes(toArr(planesRes));
      setVideosDisponibles(toArr(videosRes));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const nuevoPlan = () => {
    setFormData({ ...EMPTY_FORM });
    setEditandoId(null);
    setVista('form');
  };

  const editarPlan = (plan) => {
    setFormData({
      nombre: plan.nombre || '',
      objetivo: plan.objetivo || '',
      duracion_semanas: String(plan.duracion_semanas || 4),
      frecuencia_semanal: String(plan.frecuencia_semanal || 3),
      fecha_inicio: plan.fecha_inicio ? plan.fecha_inicio.split('T')[0] : '',
      fecha_fin: plan.fecha_fin ? plan.fecha_fin.split('T')[0] : '',
      notas: plan.notas || '',
      ejercicios: (plan.ejercicios || []).map(ej => ({
        video_id: ej.video_id,
        titulo: ej.titulo,
        series: String(ej.series || 3),
        repeticiones: ej.repeticiones || '10',
        descanso_segundos: String(ej.descanso_segundos || 30),
        notas: ej.notas || '',
      })),
    });
    setEditandoId(plan.id);
    setVista('form');
  };

  const verDetalle = async (plan) => {
    try {
      const res = await api.get(`/fisioterapia/planes/${plan.id}`);
      setDetallePlan(res?.data && typeof res.data === 'object' ? res.data : (typeof res === 'object' ? res : null));
      setVista('detalle');
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const agregarEjercicio = (video) => {
    const yaExiste = formData.ejercicios.some(ej => ej.video_id === video.id);
    if (yaExiste) return;
    setFormData({
      ...formData,
      ejercicios: [...formData.ejercicios, {
        video_id: video.id,
        titulo: video.titulo,
        series: '3',
        repeticiones: '10',
        descanso_segundos: '30',
        notas: '',
      }]
    });
    setShowVideoSelector(false);
  };

  const removerEjercicio = (index) => {
    const updated = [...formData.ejercicios];
    updated.splice(index, 1);
    setFormData({ ...formData, ejercicios: updated });
  };

  const updateEjercicio = (index, key, value) => {
    const updated = [...formData.ejercicios];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, ejercicios: updated });
  };

  const moverEjercicio = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.ejercicios.length) return;
    const updated = [...formData.ejercicios];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormData({ ...formData, ejercicios: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.fecha_inicio) {
      alert('Nombre y fecha de inicio son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        paciente_id: pacienteId,
        nombre: formData.nombre,
        objetivo: formData.objetivo || null,
        duracion_semanas: parseInt(formData.duracion_semanas, 10),
        frecuencia_semanal: parseInt(formData.frecuencia_semanal, 10),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin || null,
        notas: formData.notas || null,
        ejercicios: formData.ejercicios.map((ej, i) => ({
          video_id: ej.video_id,
          orden: i,
          series: parseInt(ej.series, 10),
          repeticiones: ej.repeticiones,
          descanso_segundos: parseInt(ej.descanso_segundos, 10),
          notas: ej.notas || null,
        })),
      };

      if (editandoId) {
        await api.put(`/fisioterapia/planes/${editandoId}`, payload);
      } else {
        await api.post('/fisioterapia/planes', payload);
      }
      await cargarDatos();
      setVista('lista');
    } catch (error) {
      console.error('Error guardando plan:', error);
      alert('Error al guardar el plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (planId, estado) => {
    try {
      await api.put(`/fisioterapia/planes/${planId}/estado`, { estado });
      await cargarDatos();
      if (detallePlan && detallePlan.id === planId) {
        const res = await api.get(`/fisioterapia/planes/${planId}`);
        setDetallePlan(res?.data && typeof res.data === 'object' ? res.data : (typeof res === 'object' ? res : null));
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  if (loading) {
    return (
      <section className="module-view planes-tratamiento">
        <div className="module-header">
          <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2 className="module-title"><LucideIcon name="clipboard" size={22} /> Planes de Tratamiento</h2>
        </div>
        <div className="loading-state"><div className="loading-spinner"></div><p>Cargando planes...</p></div>
      </section>
    );
  }

  return (
    <section className="module-view planes-tratamiento">
      <div className="module-header">
        <button className="back-btn" onClick={vista === 'lista' ? onBack : () => setVista('lista')}>
          <LucideIcon name="arrow-left" size={18} /> {vista === 'lista' ? 'Volver' : 'Lista'}
        </button>
        <h2 className="module-title"><LucideIcon name="clipboard" size={22} /> Planes de Tratamiento</h2>
        {vista === 'lista' && (
          <button className="btn-primary" onClick={nuevoPlan}>
            <LucideIcon name="plus" size={16} /> Nuevo Plan
          </button>
        )}
      </div>

      {/* VISTA LISTA */}
      {vista === 'lista' && (
        <div className="planes-lista">
          {planes.length === 0 ? (
            <div className="empty-state">
              <LucideIcon name="clipboard" size={48} />
              <h3>Sin planes de tratamiento</h3>
              <p>Crea un plan de rehabilitación para este usuario.</p>
              <button className="btn-primary" onClick={nuevoPlan}>
                <LucideIcon name="plus" size={16} /> Nuevo Plan
              </button>
            </div>
          ) : (
            <div className="planes-cards">
              {planes.map(plan => {
                const est = ESTADO_CONFIG[plan.estado] || ESTADO_CONFIG.activo;
                return (
                  <div key={plan.id} className="plan-card" onClick={() => verDetalle(plan)}>
                    <div className="plan-card-top">
                      <h4>{plan.nombre}</h4>
                      <span className="estado-badge" style={{ color: est.color, borderColor: est.color }}>
                        <LucideIcon name={est.icon} size={14} /> {est.label}
                      </span>
                    </div>
                    {plan.objetivo && <p className="plan-objetivo">{plan.objetivo.substring(0, 100)}</p>}
                    <div className="plan-meta">
                      <span><LucideIcon name="calendar" size={14} /> {new Date(plan.fecha_inicio).toLocaleDateString('es-MX')}</span>
                      <span><LucideIcon name="clock" size={14} /> {plan.duracion_semanas} semanas</span>
                      <span><LucideIcon name="refresh-cw" size={14} /> {plan.frecuencia_semanal}x/sem</span>
                      <span><LucideIcon name="dumbbell" size={14} /> {plan.total_ejercicios || 0} ejercicios</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA FORMULARIO */}
      {vista === 'form' && (
        <form className="plan-form" onSubmit={handleSubmit}>
          <h3 className="form-section-title">
            {editandoId ? 'Editar Plan' : 'Nuevo Plan de Tratamiento'}
          </h3>

          <div className="form-section">
            <h4 className="section-label"><LucideIcon name="info" size={18} /> Información General</h4>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nombre del plan *</label>
                <input type="text" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Ej: Plan de fortalecimiento fase 2" required />
              </div>
              <div className="form-group full-width">
                <label>Objetivo</label>
                <textarea rows="2" value={formData.objetivo} onChange={e => handleChange('objetivo', e.target.value)} placeholder="Describir el objetivo del plan..." />
              </div>
              <div className="form-group">
                <label>Fecha de inicio *</label>
                <input type="date" value={formData.fecha_inicio} onChange={e => handleChange('fecha_inicio', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Fecha fin (opcional)</label>
                <input type="date" value={formData.fecha_fin} onChange={e => handleChange('fecha_fin', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Duración (semanas)</label>
                <input type="number" min="1" max="52" value={formData.duracion_semanas} onChange={e => handleChange('duracion_semanas', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Frecuencia semanal</label>
                <input type="number" min="1" max="7" value={formData.frecuencia_semanal} onChange={e => handleChange('frecuencia_semanal', e.target.value)} />
              </div>
              <div className="form-group full-width">
                <label>Notas</label>
                <textarea rows="2" value={formData.notas} onChange={e => handleChange('notas', e.target.value)} placeholder="Notas adicionales..." />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header-row">
              <h4 className="section-label"><LucideIcon name="dumbbell" size={18} /> Ejercicios ({formData.ejercicios.length})</h4>
              <button type="button" className="btn-secondary-sm" onClick={() => setShowVideoSelector(true)}>
                <LucideIcon name="plus" size={14} /> Agregar Ejercicio
              </button>
            </div>

            {formData.ejercicios.length === 0 ? (
              <div className="empty-ejercicios">
                <p>No hay ejercicios en el plan. Agrega ejercicios del catálogo.</p>
              </div>
            ) : (
              <div className="ejercicios-list">
                {formData.ejercicios.map((ej, index) => (
                  <div key={index} className="ejercicio-item">
                    <div className="ejercicio-order">
                      <button type="button" className="order-btn" onClick={() => moverEjercicio(index, -1)} disabled={index === 0}>
                        <LucideIcon name="chevron-up" size={14} />
                      </button>
                      <span className="order-num">{index + 1}</span>
                      <button type="button" className="order-btn" onClick={() => moverEjercicio(index, 1)} disabled={index === formData.ejercicios.length - 1}>
                        <LucideIcon name="chevron-down" size={14} />
                      </button>
                    </div>
                    <div className="ejercicio-info">
                      <strong>{ej.titulo}</strong>
                      <div className="ejercicio-params">
                        <div className="param-group">
                          <label>Series</label>
                          <input type="number" min="1" max="10" value={ej.series} onChange={e => updateEjercicio(index, 'series', e.target.value)} />
                        </div>
                        <div className="param-group">
                          <label>Reps</label>
                          <input type="text" value={ej.repeticiones} onChange={e => updateEjercicio(index, 'repeticiones', e.target.value)} placeholder="10" />
                        </div>
                        <div className="param-group">
                          <label>Descanso (s)</label>
                          <input type="number" min="0" max="300" value={ej.descanso_segundos} onChange={e => updateEjercicio(index, 'descanso_segundos', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <button type="button" className="remove-btn" onClick={() => removerEjercicio(index)}>
                      <LucideIcon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <LucideIcon name="save" size={16} /> {submitting ? 'Guardando...' : 'Guardar Plan'}
            </button>
          </div>
        </form>
      )}

      {/* VISTA DETALLE */}
      {vista === 'detalle' && detallePlan && (
        <div className="plan-detalle">
          <div className="detalle-header">
            <div>
              <h3>{detallePlan.nombre}</h3>
              <span className="estado-badge" style={{ color: ESTADO_CONFIG[detallePlan.estado]?.color, borderColor: ESTADO_CONFIG[detallePlan.estado]?.color }}>
                <LucideIcon name={ESTADO_CONFIG[detallePlan.estado]?.icon || 'circle'} size={14} /> {ESTADO_CONFIG[detallePlan.estado]?.label}
              </span>
            </div>
            <div className="detalle-actions">
              <button className="btn-secondary" onClick={() => editarPlan(detallePlan)}>
                <LucideIcon name="pencil" size={14} /> Editar
              </button>
              {detallePlan.estado === 'activo' && (
                <>
                  <button className="btn-secondary" onClick={() => cambiarEstado(detallePlan.id, 'pausado')}>
                    <LucideIcon name="clock" size={14} /> Pausar
                  </button>
                  <button className="btn-primary" onClick={() => cambiarEstado(detallePlan.id, 'completado')}>
                    <LucideIcon name="trophy" size={14} /> Completar
                  </button>
                </>
              )}
              {detallePlan.estado === 'pausado' && (
                <button className="btn-primary" onClick={() => cambiarEstado(detallePlan.id, 'activo')}>
                  <LucideIcon name="play" size={14} /> Reactivar
                </button>
              )}
            </div>
          </div>

          <div className="plan-info-grid">
            {detallePlan.objetivo && (
              <div className="info-item full-width">
                <span className="info-label">Objetivo</span>
                <span className="info-value">{detallePlan.objetivo}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Inicio</span>
              <span className="info-value">{new Date(detallePlan.fecha_inicio).toLocaleDateString('es-MX')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Duración</span>
              <span className="info-value">{detallePlan.duracion_semanas} semanas</span>
            </div>
            <div className="info-item">
              <span className="info-label">Frecuencia</span>
              <span className="info-value">{detallePlan.frecuencia_semanal}x por semana</span>
            </div>
            {detallePlan.fecha_fin && (
              <div className="info-item">
                <span className="info-label">Fin</span>
                <span className="info-value">{new Date(detallePlan.fecha_fin).toLocaleDateString('es-MX')}</span>
              </div>
            )}
          </div>

          {/* Ejercicios del plan */}
          <div className="detalle-section">
            <h4><LucideIcon name="dumbbell" size={16} /> Ejercicios ({detallePlan.ejercicios?.length || 0})</h4>
            {detallePlan.ejercicios && detallePlan.ejercicios.length > 0 ? (
              <div className="detalle-ejercicios">
                {detallePlan.ejercicios.map((ej, i) => (
                  <div key={i} className="detalle-ej-card">
                    <span className="ej-num">{i + 1}</span>
                    <div className="ej-content">
                      <strong>{ej.titulo}</strong>
                      {ej.video_descripcion && <p className="ej-desc">{ej.video_descripcion.substring(0, 80)}</p>}
                      <div className="ej-params">
                        <span><LucideIcon name="rotate-ccw" size={12} /> {ej.series} series × {ej.repeticiones} reps</span>
                        <span><LucideIcon name="clock" size={12} /> {ej.descanso_segundos}s descanso</span>
                        {ej.nivel_nombre && <span className="ej-nivel">{ej.nivel_nombre}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-ejercicios">Este plan no tiene ejercicios asignados.</p>
            )}
          </div>

          {detallePlan.notas && (
            <div className="detalle-section">
              <h4><LucideIcon name="pen-line" size={16} /> Notas</h4>
              <p>{detallePlan.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Selector de Videos */}
      {showVideoSelector && (
        <div className="modal-overlay" onClick={() => setShowVideoSelector(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><LucideIcon name="dumbbell" size={20} /> Seleccionar Ejercicio</h3>
              <button className="modal-close" onClick={() => setShowVideoSelector(false)}>
                <LucideIcon name="x" size={20} />
              </button>
            </div>
            <div className="modal-body">
              {videosDisponibles.length === 0 ? (
                <p>No hay videos disponibles en el catálogo.</p>
              ) : (
                <div className="video-selector-list">
                  {videosDisponibles.map(video => {
                    const yaEnPlan = formData.ejercicios.some(ej => ej.video_id === video.id);
                    return (
                      <div key={video.id} className={`video-selector-item ${yaEnPlan ? 'disabled' : ''}`} onClick={() => !yaEnPlan && agregarEjercicio(video)}>
                        <div className="vs-info">
                          <strong>{video.titulo}</strong>
                          <span className="vs-meta">
                            {video.categoria_nombre} · {video.nivel_nombre} {video.duracion_minutos ? `· ${video.duracion_minutos} min` : ''}
                          </span>
                        </div>
                        {yaEnPlan ? (
                          <span className="vs-added"><LucideIcon name="circle-check" size={16} /></span>
                        ) : (
                          <span className="vs-add"><LucideIcon name="plus" size={16} /></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlanesTratamiento;
