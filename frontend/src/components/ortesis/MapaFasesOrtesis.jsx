import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './MapaFasesOrtesis.css';

const ICONOS_FASE = {
  1: 'search',
  2: 'clipboard',
  3: 'clock',
  4: 'target',
  5: 'wrench',
  6: 'circle-check',
  7: 'activity',
};

// Catálogo de las 7 fases, fijo y conocido de antemano (coincide con
// ORTESIS_FASES en backend/config/constants.php). Se usa como valor por
// defecto para que el mapa siempre se vea completo desde el primer
// render, sin esperar a la respuesta del servidor: el layout del mapa no
// depende de que la API/BD ya estén listas, solo el detalle de en qué
// fase está cada paciente y el historial de cambios sí dependen de eso.
const CATALOGO_FALLBACK = {
  1: 'Valoración',
  2: 'Cotización',
  3: 'Espera de componentes',
  4: 'Toma de medidas / Molde',
  5: 'Prueba y ajustes de órtesis',
  6: 'Entrega de órtesis',
  7: 'Seguimiento',
};

const FASE_FALLBACK = {
  id: null,
  paciente_id: null,
  fase_numero: 1,
  especialista_id: null,
  especialista_nombre: null,
  notas: null,
  created_at: null,
};

const MapaFasesOrtesis = ({ pacienteId, esEspecialista = false, onBack }) => {
  const [fase, setFase] = useState(FASE_FALLBACK);
  const [catalogo, setCatalogo] = useState(CATALOGO_FALLBACK);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevaFase, setNuevaFase] = useState('');
  const [notas, setNotas] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const [faseRes, historialRes] = await Promise.all([
        api.get(`/ortesis/fases/${pacienteId}`),
        api.get(`/ortesis/fases/${pacienteId}/historial`)
      ]);
      const faseData = faseRes?.data || faseRes;
      const historialData = historialRes?.data || historialRes;
      setFase(faseData?.fase || FASE_FALLBACK);
      setCatalogo(faseData?.catalogo || CATALOGO_FALLBACK);
      setHistorial(historialData?.historial || []);
      setSyncError('');
    } catch (err) {
      console.error('Error al cargar fases de órtesis:', err);
      // El mapa se queda visible con el catálogo/estado por defecto (fase 1);
      // solo se avisa que no se pudo sincronizar con el servidor, sin tapar
      // el mapa con una pantalla de error.
      setSyncError(err?.message || 'No se pudo sincronizar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleCambiarFase = async () => {
    if (!nuevaFase || saving) return;
    setSaving(true);
    try {
      await api.put(`/ortesis/fases/${pacienteId}`, {
        fase_numero: parseInt(nuevaFase, 10),
        notas: notas.trim() || null
      });
      setShowModal(false);
      setNuevaFase('');
      setNotas('');
      await cargarDatos();
    } catch (error) {
      console.error('Error al cambiar fase:', error);
      alert(error?.message || 'No se pudo cambiar la fase. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  const faseActualNum = fase?.fase_numero || 1;
  const numerosFase = Object.keys(catalogo).map(Number).sort((a, b) => a - b);

  const getEstado = (numero) => {
    if (numero < faseActualNum) return 'completed';
    if (numero === faseActualNum) return 'current';
    return 'future';
  };

  if (loading) {
    return (
      <div className="ortesis-fases-loading" role="status" aria-live="polite">
        <div className="ortesis-fases-spinner" aria-hidden="true"></div>
        <p>Cargando fases...</p>
      </div>
    );
  }

  return (
    <section className={onBack ? 'module-view ortesis-fases-container' : 'ortesis-fases-container'}>
      {onBack && (
        <div className="module-header">
          <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2 className="module-title"><LucideIcon name="map-pin" size={22} /> Fases del Tratamiento</h2>
        </div>
      )}

      {syncError && (
        <div className="ortesis-fases-warning" role="alert">
          <LucideIcon name="alert-triangle" size={16} />
          <span>{syncError} Mostrando la fase por defecto mientras se resuelve.</span>
          <button className="ortesis-fases-retry-link" onClick={cargarDatos}>Reintentar</button>
        </div>
      )}

      {esEspecialista && pacienteId && (
        <button className="ortesis-fases-btn-cambiar" onClick={() => setShowModal(true)}>
          <LucideIcon name="zap" size={18} /> Cambiar fase del usuario
        </button>
      )}

      <div className="ortesis-fases-timeline" role="list" aria-label="Fases del tratamiento de órtesis y prótesis">
        {numerosFase.map((numero) => {
          const estado = getEstado(numero);
          return (
            <div key={numero} className={`ortesis-fases-item ${estado}`} role="listitem">
              <div className="ortesis-fases-dot" aria-hidden="true">
                {estado === 'completed' ? '✓' : numero}
              </div>
              <div className="ortesis-fases-card">
                <div className="ortesis-fases-card-header">
                  <h3><LucideIcon name={ICONOS_FASE[numero] || 'circle'} size={18} /> {catalogo[numero]}</h3>
                  <span className={`ortesis-fases-badge ${estado}`}>
                    {estado === 'completed' ? 'Completada' : estado === 'current' ? 'En curso' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="ortesis-fases-historial-section">
        <h3 className="ortesis-fases-section-title">Historial de cambios</h3>
        {historial.length > 0 ? (
          <div className="ortesis-fases-historial-list">
            {historial.map((item) => (
              <div key={item.id} className="ortesis-fases-historial-item">
                <div className="ortesis-fases-historial-fase">
                  <LucideIcon name={ICONOS_FASE[item.fase_numero] || 'circle'} size={16} />
                  {catalogo[item.fase_numero] || `Fase ${item.fase_numero}`}
                </div>
                <div className="ortesis-fases-historial-meta">
                  <span><LucideIcon name="calendar" size={14} /> {formatFecha(item.created_at)}</span>
                  {item.especialista_nombre && (
                    <span><LucideIcon name="stethoscope" size={14} /> {item.especialista_nombre}</span>
                  )}
                </div>
                {item.notas && <p className="ortesis-fases-historial-notas">"{item.notas}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="ortesis-fases-empty">Aún no hay cambios de fase registrados.</p>
        )}
      </section>

      {showModal && (
        <div className="ortesis-fases-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ortesis-fases-modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="ortesis-fase-modal-title">
            <div className="ortesis-fases-modal-header">
              <h2 id="ortesis-fase-modal-title">Cambiar fase</h2>
              <button className="ortesis-fases-modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="ortesis-fases-modal-form">
              <div className="ortesis-fases-form-group">
                <label htmlFor="ortesis-nueva-fase">Nueva fase</label>
                <select
                  id="ortesis-nueva-fase"
                  value={nuevaFase}
                  onChange={e => setNuevaFase(e.target.value)}
                >
                  <option value="">Seleccionar fase...</option>
                  {numerosFase.filter(n => n !== faseActualNum).map(n => (
                    <option key={n} value={n}>Fase {n}: {catalogo[n]}</option>
                  ))}
                </select>
              </div>
              <div className="ortesis-fases-form-group">
                <label htmlFor="ortesis-notas">Notas (opcional)</label>
                <textarea
                  id="ortesis-notas"
                  placeholder="Motivo u observaciones del cambio..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="ortesis-fases-modal-actions">
                <button className="ortesis-fases-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  className="ortesis-fases-btn-confirm"
                  onClick={handleCambiarFase}
                  disabled={!nuevaFase || saving}
                >
                  {saving ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MapaFasesOrtesis;
