import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Fases.css';

const FASES_INFO = [
  { numero: 1, nombre: 'Evaluacion Inicial', icono: 'search', descripcion: 'Primera aproximacion al dispositivo, evaluaciones medicas y plan de tratamiento.' },
  { numero: 2, nombre: 'Adaptacion y Aprendizaje', icono: 'book-open', descripcion: 'Aprendizaje de uso del dispositivo, ejercicios basicos y ajustes iniciales.' },
  { numero: 3, nombre: 'Seguimiento Activo', icono: 'bar-chart', descripcion: 'Uso regular del dispositivo, monitoreo constante y correcciones necesarias.' },
  { numero: 4, nombre: 'Autonomia Completa', icono: 'trophy', descripcion: 'Uso independiente del dispositivo con seguimiento periodico.' },
];

const Fases = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cambioForm, setCambioForm] = useState({ nueva_fase: '', motivo: '' });

  const esEspecialista = user?.rol === 'especialista';
  const pacienteId = esEspecialista
    ? searchParams.get('pacienteId')
    : (user?.paciente_id || user?.id);

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/fases/dashboard/${pacienteId}`);
      setDashboard(res?.data || null);
    } catch (error) {
      console.error('Error cargando fases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarFase = async () => {
    if (!cambioForm.nueva_fase || !cambioForm.motivo.trim()) return;
    try {
      setSaving(true);
      await api.put(`/fases/cambiar/${pacienteId}`, {
        nueva_fase: parseInt(cambioForm.nueva_fase),
        motivo: cambioForm.motivo.trim()
      });
      setShowModal(false);
      setCambioForm({ nueva_fase: '', motivo: '' });
      await cargarDatos();
    } catch (error) {
      console.error('Error cambiando fase:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFaseNumero = () => {
    return dashboard?.fase_actual?.numero || dashboard?.estadisticas?.fase_numero || 1;
  };

  const getProgreso = () => {
    return dashboard?.progreso?.progreso_porcentaje || dashboard?.estadisticas?.progreso_general || 0;
  };

  const getDiasRehabilitacion = () => {
    return dashboard?.estadisticas?.dias_en_rehabilitacion || 0;
  };

  const getTotalCambios = () => {
    return dashboard?.estadisticas?.total_cambios_fase || 0;
  };

  const getHistorial = () => {
    return dashboard?.progreso?.historial || [];
  };

  const getFaseEstado = (numero) => {
    const actual = getFaseNumero();
    if (numero < actual) return 'completed';
    if (numero === actual) return 'current';
    return 'future';
  };

  const getProgressMessage = () => {
    const progreso = getProgreso();
    if (progreso >= 100) return 'Has completado todas las fases. Sigue con tu seguimiento periodico.';
    if (progreso >= 75) return 'Excelente progreso. Estas muy cerca de la autonomia completa.';
    if (progreso >= 50) return 'Vas por muy buen camino. Sigue asi.';
    if (progreso >= 25) return 'Buen inicio. Cada paso cuenta en tu rehabilitacion.';
    return 'Estas comenzando tu proceso de rehabilitacion. Animo.';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  if (loading) {
    return (
      <div className="fases-page loading" role="status" aria-live="polite">
        <div className="loading-content">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  const faseActualNum = getFaseNumero();
  const progreso = getProgreso();
  const faseActualInfo = FASES_INFO.find(f => f.numero === faseActualNum) || FASES_INFO[0];

  return (
    <div className="fases-page">
      {/* Header */}
      <header className="fases-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon" aria-hidden="true"><LucideIcon name={faseActualInfo.icono} size={24} /></div>
            <div className="header-text">
              <h1>Mi Rehabilitacion</h1>
              <p>Fase {faseActualNum}: {faseActualInfo.nombre}</p>
            </div>
          </div>
          <span className="header-badge">{Math.round(progreso)}%</span>
        </div>
      </header>

      <main className="fases-content">
        {/* Progreso general */}
        <section className="progress-section" aria-labelledby="progress-heading">
          <div className="progress-card">
            <div className="progress-header">
              <h3 id="progress-heading">Progreso General</h3>
              <span className="progress-percentage">{Math.round(progreso)}%</span>
            </div>
            <div className="progress-bar-container" role="progressbar" aria-valuenow={progreso} aria-valuemin="0" aria-valuemax="100" aria-label={`Progreso: ${Math.round(progreso)}%`}>
              <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
            </div>
            <p className="progress-message">{getProgressMessage()}</p>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-section" aria-label="Estadisticas">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true"><LucideIcon name="calendar" size={20} /></div>
              <p className="stat-value">{getDiasRehabilitacion()}</p>
              <p className="stat-label">Dias en rehabilitacion</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true"><LucideIcon name="target" size={20} /></div>
              <p className="stat-value">{faseActualNum}/4</p>
              <p className="stat-label">Fase actual</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true"><LucideIcon name="activity" size={20} /></div>
              <p className="stat-value">{getTotalCambios()}</p>
              <p className="stat-label">Cambios de fase</p>
            </div>
          </div>
        </section>

        {/* Boton cambiar fase (solo especialista) */}
        {esEspecialista && pacienteId && (
          <button className="btn-cambiar-fase" onClick={() => setShowModal(true)}>
            <span aria-hidden="true"><LucideIcon name="zap" size={18} /></span> Cambiar Fase del Usuario
          </button>
        )}

        {/* Timeline */}
        <section className="timeline-section" aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="section-title">Fases del Tratamiento</h2>
          <div className="timeline" role="list">
            {FASES_INFO.map((fase) => {
              const estado = getFaseEstado(fase.numero);
              return (
                <div key={fase.numero} className={`timeline-item ${estado}`} role="listitem">
                  <div className="timeline-dot" aria-hidden="true">
                    {estado === 'completed' ? '✓' : fase.numero}
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-card-header">
                      <h3><LucideIcon name={fase.icono} size={18} /> {fase.nombre}</h3>
                      <span className={`fase-badge ${estado === 'completed' ? 'completada' : estado === 'current' ? 'actual' : 'pendiente'}`}>
                        {estado === 'completed' ? 'Completada' : estado === 'current' ? 'En curso' : 'Pendiente'}
                      </span>
                    </div>
                    <p>{fase.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Historial */}
        <section className="historial-section" aria-labelledby="historial-heading">
          <h2 id="historial-heading" className="section-title">Historial de Cambios</h2>
          {getHistorial().length > 0 ? (
            <div className="historial-list">
              {getHistorial().map((item, idx) => (
                <div key={idx} className="historial-item">
                  <div className="historial-item-header">
                    <div className="historial-arrow">
                      <span>{item.fase_anterior_nombre || 'Inicio'}</span>
                      <span className="arrow-icon">→</span>
                      <span>{item.fase_nueva_nombre}</span>
                    </div>
                  </div>
                  <div className="historial-meta">
                    <span><LucideIcon name="calendar" size={14} /> {formatFecha(item.created_at)}</span>
                    {item.especialista_nombre && (
                      <span><LucideIcon name="stethoscope" size={14} /> {item.especialista_nombre}</span>
                    )}
                  </div>
                  {item.notas && (
                    <p className="historial-notas">"{item.notas}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-historial">
              <div className="empty-icon" aria-hidden="true"><LucideIcon name="clipboard" size={32} /></div>
              <p>Estas en tu fase inicial. Tu historial aparecera aqui cuando avances.</p>
            </div>
          )}
        </section>
      </main>

      {/* Modal cambiar fase */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-title">
            <div className="modal-header">
              <h2 id="modal-title">Cambiar Fase</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="nueva-fase">Nueva fase</label>
                <select
                  id="nueva-fase"
                  value={cambioForm.nueva_fase}
                  onChange={e => setCambioForm(prev => ({ ...prev, nueva_fase: e.target.value }))}
                >
                  <option value="">Seleccionar fase...</option>
                  {FASES_INFO.filter(f => f.numero !== faseActualNum).map(f => (
                    <option key={f.numero} value={f.numero}>
                      Fase {f.numero}: {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="motivo">Motivo del cambio</label>
                <textarea
                  id="motivo"
                  placeholder="Describe el motivo del cambio de fase..."
                  value={cambioForm.motivo}
                  onChange={e => setCambioForm(prev => ({ ...prev, motivo: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  className="btn-confirm"
                  onClick={handleCambiarFase}
                  disabled={!cambioForm.nueva_fase || !cambioForm.motivo.trim() || saving}
                >
                  {saving ? 'Guardando...' : 'Confirmar Cambio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fases;
