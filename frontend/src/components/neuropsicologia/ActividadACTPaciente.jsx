import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import { ACT_CATEGORIAS, ACT_HERRAMIENTAS } from '../../data/neuropsicologiaData';
import './NeuropsicologiaEsp.css';

const CAT_CONFIG = {
  yo: { label: 'Yo (Self)', color: '#6A1B9A', icon: 'user' },
  valores: { label: 'Valores', color: '#AD1457', icon: 'heart' },
  defusion: { label: 'Defusión', color: '#F57F17', icon: 'cloud' },
  presencia: { label: 'Presencia', color: '#2E7D32', icon: 'eye' },
  compromiso: { label: 'Compromiso', color: '#1976D2', icon: 'check-circle' },
  aceptacion: { label: 'Aceptación', color: '#00838F', icon: 'shield' },
  personalizada: { label: 'Personalizada', color: '#9C27B0', icon: 'sparkles' },
};

const ActividadACTPaciente = ({ pacienteId, onBack }) => {
  const [sesiones, setSesiones] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('historial');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [asignarForm, setAsignarForm] = useState({
    herramienta_id: '',
    notas_especialista: '',
    prioridad: 'normal'
  });

  // Form para crear herramienta personalizada
  const [crearForm, setCrearForm] = useState({
    nombre: '',
    categoria: 'yo',
    tipo_actividad: 'reflexion',
    descripcion: '',
    instrucciones: '',
    pasos: [{ texto: '' }],
    duracion: 10,
    prioridad: 'normal',
    notas_especialista: ''
  });

  useEffect(() => { cargarDatos(); }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [sesRes, asigRes] = await Promise.all([
        api.get(`/neuropsicologia/act/historial/${pacienteId}`),
        api.get(`/neuropsicologia/act/asignaciones/${pacienteId}`)
      ]);
      const rawSes = sesRes?.data ?? sesRes;
      setSesiones(Array.isArray(rawSes) ? rawSes : []);
      const rawAsig = asigRes?.data ?? asigRes;
      setAsignaciones(Array.isArray(rawAsig) ? rawAsig : []);
    } catch (error) {
      console.error('Error cargando datos ACT:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!asignarForm.herramienta_id) return;
    setGuardando(true);
    try {
      const herramienta = ACT_HERRAMIENTAS.find(h => h.id === asignarForm.herramienta_id);
      await api.post(`/neuropsicologia/act/asignar`, {
        paciente_id: pacienteId,
        herramienta_id: asignarForm.herramienta_id,
        herramienta_nombre: herramienta?.nombre || asignarForm.herramienta_id,
        categoria: herramienta?.categoriaId || '',
        notas_especialista: asignarForm.notas_especialista,
        prioridad: asignarForm.prioridad
      });
      setShowAsignarModal(false);
      setCategoriaSeleccionada(null);
      setAsignarForm({ herramienta_id: '', notas_especialista: '', prioridad: 'normal' });
      cargarDatos();
    } catch (err) {
      console.error('Error asignando herramienta:', err);
    } finally {
      setGuardando(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!crearForm.nombre || !crearForm.descripcion) return;
    setGuardando(true);
    try {
      const pasosLimpios = crearForm.pasos.filter(p => p.texto.trim());
      await api.post(`/neuropsicologia/act/asignar`, {
        paciente_id: pacienteId,
        herramienta_id: 'custom_' + Date.now(),
        herramienta_nombre: crearForm.nombre,
        categoria: crearForm.categoria,
        tipo_actividad: crearForm.tipo_actividad,
        notas_especialista: crearForm.notas_especialista,
        prioridad: crearForm.prioridad,
        es_personalizada: true,
        contenido: JSON.stringify({
          descripcion: crearForm.descripcion,
          instrucciones: crearForm.instrucciones,
          pasos: pasosLimpios,
          duracion: crearForm.duracion,
          tipo_actividad: crearForm.tipo_actividad
        })
      });
      setShowCrearModal(false);
      setCrearForm({
        nombre: '', categoria: 'yo', tipo_actividad: 'reflexion',
        descripcion: '', instrucciones: '', pasos: [{ texto: '' }],
        duracion: 10, prioridad: 'normal', notas_especialista: ''
      });
      cargarDatos();
    } catch (err) {
      console.error('Error creando herramienta:', err);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarAsignacion = async (asignacionId) => {
    try {
      await api.delete(`/neuropsicologia/act/asignaciones/${asignacionId}`);
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando asignación:', err);
    }
  };

  const handleCambiarEstado = async (asignacionId, nuevoEstado) => {
    try {
      await api.put(`/neuropsicologia/act/asignaciones/${asignacionId}/estado`, { estado: nuevoEstado });
      cargarDatos();
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  const agregarPaso = () => {
    setCrearForm({ ...crearForm, pasos: [...crearForm.pasos, { texto: '' }] });
  };

  const actualizarPaso = (idx, texto) => {
    const nuevos = [...crearForm.pasos];
    nuevos[idx] = { texto };
    setCrearForm({ ...crearForm, pasos: nuevos });
  };

  const eliminarPaso = (idx) => {
    if (crearForm.pasos.length <= 1) return;
    setCrearForm({ ...crearForm, pasos: crearForm.pasos.filter((_, i) => i !== idx) });
  };

  // Historial stats
  const totalSesiones = sesiones.length;
  const categoriasCount = {};
  sesiones.forEach(s => {
    const cat = s.categoria?.toLowerCase() || 'otro';
    categoriasCount[cat] = (categoriasCount[cat] || 0) + 1;
  });
  const categoriasOrdenadas = Object.entries(categoriasCount).sort((a, b) => b[1] - a[1]);

  // Herramientas filtradas
  const herramientasFiltradas = categoriaSeleccionada
    ? ACT_HERRAMIENTAS.filter(h => h.categoriaId === categoriaSeleccionada)
    : [];

  const TIPOS_ACTIVIDAD = [
    { id: 'reflexion', nombre: 'Reflexión', icon: 'brain', desc: 'Pensamiento guiado' },
    { id: 'escritura', nombre: 'Escritura', icon: 'pencil', desc: 'Escribir texto libre' },
    { id: 'meditacion', nombre: 'Meditación', icon: 'eye', desc: 'Atención plena' },
    { id: 'accion', nombre: 'Acción', icon: 'zap', desc: 'Actividad práctica' },
    { id: 'formato', nombre: 'Formato/Cuestionario', icon: 'clipboard-list', desc: 'Preguntas y respuestas' },
  ];

  return (
    <div className="neuro-esp-module">
      <div className="neuro-esp-header">
        <button className="neuro-back-btn" onClick={onBack}>
          <LucideIcon name="arrow-left" size={18} /> Cambiar usuario
        </button>
        <h2><LucideIcon name="sparkles" size={22} /> Herramientas ACT</h2>
      </div>

      {/* Tabs */}
      <div className="neuro-tabs" style={{ marginBottom: '16px' }}>
        <button className={`neuro-tab ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>
          <LucideIcon name="clock" size={14} /> Historial
        </button>
        <button className={`neuro-tab ${tab === 'asignaciones' ? 'active' : ''}`} onClick={() => setTab('asignaciones')}>
          <LucideIcon name="clipboard-list" size={14} /> Asignaciones
          {asignaciones.filter(a => a.estado === 'pendiente').length > 0 && (
            <span style={{
              marginLeft: '6px', background: '#9C27B0', color: '#fff',
              borderRadius: '10px', padding: '1px 7px', fontSize: '12px', fontWeight: 700
            }}>
              {asignaciones.filter(a => a.estado === 'pendiente').length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="neuro-loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      ) : tab === 'historial' ? (
        /* ========== TAB HISTORIAL ========== */
        sesiones.length === 0 ? (
          <div className="neuro-empty">
            <LucideIcon name="sparkles" size={40} />
            <p>No hay sesiones ACT registradas</p>
            <p className="neuro-empty-sub">El usuario aún no ha completado herramientas ACT.</p>
          </div>
        ) : (
          <>
            <div className="neuro-resumen-cards">
              <div className="neuro-resumen-card morado">
                <span className="resumen-num">{totalSesiones}</span>
                <span className="resumen-label">Sesiones</span>
              </div>
              <div className="neuro-resumen-card azul">
                <span className="resumen-num">{Object.keys(categoriasCount).length}</span>
                <span className="resumen-label">Categorías</span>
              </div>
            </div>

            {categoriasOrdenadas.length > 0 && (
              <div className="neuro-act-categorias">
                <h3>Categorías más practicadas</h3>
                <div className="neuro-act-barras">
                  {categoriasOrdenadas.map(([cat, count]) => {
                    const config = CAT_CONFIG[cat] || { label: cat, color: '#9C27B0', icon: 'circle' };
                    const pct = (count / totalSesiones) * 100;
                    return (
                      <div key={cat} className="neuro-act-barra-item">
                        <div className="neuro-act-barra-label">
                          <LucideIcon name={config.icon} size={16} />
                          <span>{config.label}</span>
                          <span className="neuro-act-count">{count}</span>
                        </div>
                        <div className="neuro-barra-track">
                          <div className="neuro-barra-fill" style={{ width: `${pct}%`, background: config.color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="neuro-sesiones-lista">
              <h3>Historial de sesiones</h3>
              {sesiones.map((sesion, idx) => {
                const cat = sesion.categoria?.toLowerCase() || 'otro';
                const config = CAT_CONFIG[cat] || { label: cat, color: '#9C27B0', icon: 'circle' };
                return (
                  <div key={sesion.id || idx} className="neuro-sesion-item">
                    <div className="neuro-sesion-icon" style={{ background: config.color + '22', color: config.color }}>
                      <LucideIcon name={config.icon} size={20} />
                    </div>
                    <div className="neuro-sesion-info">
                      <span className="neuro-sesion-herramienta">{sesion.herramienta || 'Herramienta ACT'}</span>
                      <span className="neuro-sesion-categoria" style={{ color: config.color }}>{config.label}</span>
                      {sesion.notas_usuario && <p className="neuro-sesion-notas">{sesion.notas_usuario}</p>}
                    </div>
                    <span className="neuro-sesion-fecha">
                      {sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* ========== TAB ASIGNACIONES ========== */
        <>
          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAsignarModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 18px', borderRadius: '12px', border: 'none',
                background: '#9C27B0', color: '#fff', fontSize: '15px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              <LucideIcon name="list-plus" size={18} /> Asignar Existente
            </button>
            <button
              onClick={() => setShowCrearModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 18px', borderRadius: '12px', border: '2px solid #9C27B0',
                background: 'transparent', color: '#9C27B0', fontSize: '15px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              <LucideIcon name="plus-circle" size={18} /> Crear Personalizada
            </button>
          </div>

          {asignaciones.length === 0 ? (
            <div className="neuro-empty">
              <LucideIcon name="clipboard-list" size={40} />
              <p>Sin asignaciones</p>
              <p className="neuro-empty-sub">Asigna herramientas existentes o crea nuevas personalizadas.</p>
            </div>
          ) : (
            <div className="neuro-sesiones-lista">
              {asignaciones.map(asig => {
                const cat = asig.categoria?.toLowerCase() || 'personalizada';
                const config = CAT_CONFIG[cat] || CAT_CONFIG.personalizada;
                const isPendiente = asig.estado === 'pendiente';
                const isCompletada = asig.estado === 'completada';
                const esPersonalizada = asig.herramienta_id?.startsWith('custom_');
                let contenido = null;
                if (asig.contenido) {
                  try { contenido = JSON.parse(asig.contenido); } catch (e) { /* ignore */ }
                }

                return (
                  <div key={asig.id} className="neuro-sesion-item" style={{
                    borderLeft: `4px solid ${isPendiente ? '#FF9800' : isCompletada ? '#4CAF50' : asig.estado === 'cancelada' ? '#f44336' : config.color}`,
                    opacity: asig.estado === 'cancelada' ? 0.6 : 1
                  }}>
                    <div className="neuro-sesion-icon" style={{
                      background: config.color + '22', color: config.color
                    }}>
                      <LucideIcon name={esPersonalizada ? 'sparkles' : config.icon} size={20} />
                    </div>
                    <div className="neuro-sesion-info" style={{ flex: 1 }}>
                      <span className="neuro-sesion-herramienta">
                        {asig.herramienta_nombre}
                        {esPersonalizada && (
                          <span style={{
                            marginLeft: '8px', padding: '1px 8px', borderRadius: '8px',
                            background: '#9C27B022', color: '#9C27B0', fontSize: '11px', fontWeight: 600
                          }}>
                            Personalizada
                          </span>
                        )}
                      </span>
                      <span className="neuro-sesion-categoria" style={{ color: config.color }}>{config.label}</span>

                      {/* Mostrar contenido personalizado */}
                      {contenido && (
                        <div style={{ marginTop: '6px', padding: '8px 10px', background: 'var(--surface-secondary)', borderRadius: '8px' }}>
                          {contenido.descripcion && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              {contenido.descripcion}
                            </p>
                          )}
                          {contenido.tipo_actividad && (
                            <span style={{
                              fontSize: '11px', padding: '1px 6px', borderRadius: '6px',
                              background: 'var(--surface-tertiary)', color: 'var(--text-muted)'
                            }}>
                              {TIPOS_ACTIVIDAD.find(t => t.id === contenido.tipo_actividad)?.nombre || contenido.tipo_actividad}
                              {contenido.duracion ? ` · ${contenido.duracion} min` : ''}
                            </span>
                          )}
                          {contenido.pasos && contenido.pasos.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pasos:</p>
                              {contenido.pasos.map((paso, i) => (
                                <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '2px 0' }}>
                                  {i + 1}. {paso.texto}
                                </p>
                              ))}
                            </div>
                          )}
                          {contenido.instrucciones && (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                              Instrucciones: {contenido.instrucciones}
                            </p>
                          )}
                        </div>
                      )}

                      {asig.notas_especialista && !contenido && (
                        <p className="neuro-sesion-notas" style={{ fontStyle: 'italic' }}>
                          Nota: {asig.notas_especialista}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                          background: isPendiente ? '#FF980022' : isCompletada ? '#4CAF5022' : asig.estado === 'cancelada' ? '#f4433622' : '#9E9E9E22',
                          color: isPendiente ? '#FF9800' : isCompletada ? '#4CAF50' : asig.estado === 'cancelada' ? '#f44336' : '#9E9E9E'
                        }}>
                          {isPendiente ? 'Pendiente' : isCompletada ? 'Completada' : asig.estado === 'cancelada' ? 'Dada de baja' : asig.estado}
                        </span>
                        {asig.prioridad === 'alta' && (
                          <span style={{
                            padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                            background: '#f4433622', color: '#f44336'
                          }}>
                            Prioridad alta
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className="neuro-sesion-fecha">
                        {asig.created_at ? new Date(asig.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {isPendiente && (
                          <button
                            onClick={() => handleCambiarEstado(asig.id, 'cancelada')}
                            title="Dar de baja"
                            style={{
                              background: '#FF980022', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', color: '#FF9800', padding: '5px 8px',
                              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600
                            }}
                          >
                            <LucideIcon name="pause-circle" size={14} /> Baja
                          </button>
                        )}
                        {asig.estado === 'cancelada' && (
                          <button
                            onClick={() => handleCambiarEstado(asig.id, 'pendiente')}
                            title="Reactivar asignación"
                            style={{
                              background: '#4CAF5022', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', color: '#4CAF50', padding: '5px 8px',
                              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600
                            }}
                          >
                            <LucideIcon name="play-circle" size={14} /> Reactivar
                          </button>
                        )}
                        {(isPendiente || asig.estado === 'cancelada') && (
                          <button
                            onClick={() => handleEliminarAsignacion(asig.id)}
                            title="Eliminar asignación"
                            style={{
                              background: '#f4433622', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', color: '#f44336', padding: '5px',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <LucideIcon name="trash-2" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========== MODAL: Asignar Existente ========== */}
      {showAsignarModal && (
        <div className="neuro-modal-overlay" onClick={() => { setShowAsignarModal(false); setCategoriaSeleccionada(null); }}>
          <div className="neuro-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                <LucideIcon name="list-plus" size={20} /> Asignar Herramienta Existente
              </h3>
              <button onClick={() => { setShowAsignarModal(false); setCategoriaSeleccionada(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                <LucideIcon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleAsignar}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  1. Selecciona una categoría
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {ACT_CATEGORIAS.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => { setCategoriaSeleccionada(cat.id); setAsignarForm({ ...asignarForm, herramienta_id: '' }); }}
                      style={{
                        padding: '10px 8px', borderRadius: '10px', border: '2px solid',
                        borderColor: categoriaSeleccionada === cat.id ? cat.color : 'var(--border-color)',
                        background: categoriaSeleccionada === cat.id ? cat.color + '18' : 'var(--surface-secondary)',
                        color: categoriaSeleccionada === cat.id ? cat.color : 'var(--text-secondary)',
                        cursor: 'pointer', textAlign: 'center', fontSize: '13px', fontWeight: 600
                      }}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {categoriaSeleccionada && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    2. Selecciona una herramienta
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {herramientasFiltradas.map(h => {
                      const catConfig = ACT_CATEGORIAS.find(c => c.id === categoriaSeleccionada);
                      const isSelected = asignarForm.herramienta_id === h.id;
                      return (
                        <button key={h.id} type="button"
                          onClick={() => setAsignarForm({ ...asignarForm, herramienta_id: h.id })}
                          style={{
                            padding: '12px 14px', borderRadius: '10px', border: '2px solid',
                            borderColor: isSelected ? (catConfig?.color || '#9C27B0') : 'var(--border-color)',
                            background: isSelected ? (catConfig?.color || '#9C27B0') + '15' : 'var(--surface-secondary)',
                            color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>{h.nombre}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {h.descripcion.length > 80 ? h.descripcion.substring(0, 80) + '...' : h.descripcion}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {h.duracion} min {h.tieneEscritura ? '· Incluye escritura' : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {asignarForm.herramienta_id && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Prioridad</label>
                    <select value={asignarForm.prioridad} onChange={e => setAsignarForm({ ...asignarForm, prioridad: e.target.value })}
                      className="neuro-select">
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Notas para el paciente (opcional)
                    </label>
                    <textarea value={asignarForm.notas_especialista}
                      onChange={e => setAsignarForm({ ...asignarForm, notas_especialista: e.target.value })}
                      placeholder="Indicaciones o contexto..."
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                        border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                        color: 'var(--text-primary)', fontSize: '15px', minHeight: '60px',
                        resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowAsignarModal(false); setCategoriaSeleccionada(null); }}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface-secondary)', color: 'var(--text-secondary)', fontSize: '15px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={!asignarForm.herramienta_id || guardando}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: asignarForm.herramienta_id ? '#9C27B0' : '#9E9E9E', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: asignarForm.herramienta_id ? 'pointer' : 'not-allowed', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Asignando...' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL: Crear Personalizada ========== */}
      {showCrearModal && (
        <div className="neuro-modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="neuro-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                <LucideIcon name="plus-circle" size={20} /> Crear Herramienta Personalizada
              </h3>
              <button onClick={() => setShowCrearModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                <LucideIcon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleCrear}>
              {/* Nombre */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nombre de la herramienta *
                </label>
                <input type="text" value={crearForm.nombre}
                  onChange={e => setCrearForm({ ...crearForm, nombre: e.target.value })}
                  placeholder="Ej: Diario de gratitud, Ejercicio de respiración..."
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)', fontSize: '15px', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Categoría + Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Categoría ACT</label>
                  <select value={crearForm.categoria}
                    onChange={e => setCrearForm({ ...crearForm, categoria: e.target.value })}
                    className="neuro-select">
                    {ACT_CATEGORIAS.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Tipo de actividad</label>
                  <select value={crearForm.tipo_actividad}
                    onChange={e => setCrearForm({ ...crearForm, tipo_actividad: e.target.value })}
                    className="neuro-select">
                    {TIPOS_ACTIVIDAD.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} - {t.desc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Descripción *
                </label>
                <textarea value={crearForm.descripcion}
                  onChange={e => setCrearForm({ ...crearForm, descripcion: e.target.value })}
                  placeholder="Describe brevemente en qué consiste la actividad..."
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)', fontSize: '15px', minHeight: '60px',
                    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Instrucciones generales */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Instrucciones generales
                </label>
                <textarea value={crearForm.instrucciones}
                  onChange={e => setCrearForm({ ...crearForm, instrucciones: e.target.value })}
                  placeholder="Instrucciones o contexto adicional para el paciente..."
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)', fontSize: '15px', minHeight: '50px',
                    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Pasos */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Pasos de la actividad
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {crearForm.pasos.map((paso, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{
                        minWidth: '28px', height: '28px', borderRadius: '50%',
                        background: '#9C27B022', color: '#9C27B0', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                        fontWeight: 700, marginTop: '8px', flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <textarea
                        value={paso.texto}
                        onChange={e => actualizarPaso(idx, e.target.value)}
                        placeholder={`Paso ${idx + 1}...`}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: '8px',
                          border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                          color: 'var(--text-primary)', fontSize: '14px', minHeight: '38px',
                          resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                        }}
                      />
                      {crearForm.pasos.length > 1 && (
                        <button type="button" onClick={() => eliminarPaso(idx)}
                          style={{ background: '#f4433622', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#f44336', marginTop: '6px' }}>
                          <LucideIcon name="x" size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={agregarPaso}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', border: '2px dashed var(--border-color)', borderRadius: '10px',
                      background: 'transparent', color: '#9C27B0', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}>
                    <LucideIcon name="plus" size={16} /> Agregar paso
                  </button>
                </div>
              </div>

              {/* Duración + Prioridad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Duración (min)
                  </label>
                  <input type="number" min="1" max="120" value={crearForm.duracion}
                    onChange={e => setCrearForm({ ...crearForm, duracion: parseInt(e.target.value) || 10 })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                      color: 'var(--text-primary)', fontSize: '15px', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Prioridad</label>
                  <select value={crearForm.prioridad}
                    onChange={e => setCrearForm({ ...crearForm, prioridad: e.target.value })}
                    className="neuro-select">
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Notas del especialista (opcional)
                </label>
                <textarea value={crearForm.notas_especialista}
                  onChange={e => setCrearForm({ ...crearForm, notas_especialista: e.target.value })}
                  placeholder="Notas internas sobre por qué se asigna esta actividad..."
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)', fontSize: '15px', minHeight: '50px',
                    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCrearModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface-secondary)', color: 'var(--text-secondary)', fontSize: '15px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={!crearForm.nombre || !crearForm.descripcion || guardando}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: crearForm.nombre && crearForm.descripcion ? '#9C27B0' : '#9E9E9E', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: crearForm.nombre && crearForm.descripcion ? 'pointer' : 'not-allowed', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Creando...' : 'Crear y Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActividadACTPaciente;
