import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import ContratoTerapeutico from './ContratoTerapeutico';
import './MapaFasesNeuropsicologia.css';

const ICONOS_FASE = {
  1: 'search',
  2: 'target',
  3: 'sparkles',
  4: 'circle-check',
};

const MapaFasesNeuropsicologia = ({ pacienteId, esEspecialista = false, onBack }) => {
  const [fase, setFase] = useState(null);
  const [catalogo, setCatalogo] = useState({});
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevaFase, setNuevaFase] = useState('');
  const [notas, setNotas] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const [faseRes, historialRes] = await Promise.all([
        api.get(`/neuropsicologia/fases/${pacienteId}`),
        api.get(`/neuropsicologia/fases/${pacienteId}/historial`)
      ]);
      const faseData = faseRes?.data || faseRes;
      const historialData = historialRes?.data || historialRes;
      setFase(faseData?.fase || null);
      setCatalogo(faseData?.catalogo || {});
      setHistorial(historialData?.historial || []);
    } catch (error) {
      console.error('Error al cargar fases de neuropsicología:', error);
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
      await api.put(`/neuropsicologia/fases/${pacienteId}`, {
        fase_numero: parseInt(nuevaFase, 10),
        notas: notas.trim() || null
      });
      setShowModal(false);
      setNuevaFase('');
      setNotas('');
      await cargarDatos();
    } catch (error) {
      console.error('Error al cambiar fase:', error);
      alert('No se pudo cambiar la fase. Intenta de nuevo.');
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
      <div className="neuro-fases-loading" role="status" aria-live="polite">
        <div className="neuro-fases-spinner" aria-hidden="true"></div>
        <p>Cargando fases...</p>
      </div>
    );
  }

  return (
    <section className={onBack ? 'module-view neuro-fases-container' : 'neuro-fases-container'}>
      {onBack && (
        <div className="module-header">
          <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2 className="module-title"><LucideIcon name="map-pin" size={22} /> Fases del Tratamiento</h2>
        </div>
      )}

      {esEspecialista && pacienteId && (
        <button className="neuro-fases-btn-cambiar" onClick={() => setShowModal(true)}>
          <LucideIcon name="zap" size={18} /> Cambiar fase del usuario
        </button>
      )}

      <div className="neuro-fases-timeline" role="list" aria-label="Fases del tratamiento de neuropsicología">
        {numerosFase.map((numero) => {
          const estado = getEstado(numero);
          return (
            <div key={numero} className={`neuro-fases-item ${estado}`} role="listitem">
              <div className="neuro-fases-dot" aria-hidden="true">
                {estado === 'completed' ? '✓' : numero}
              </div>
              <div className="neuro-fases-card">
                <div className="neuro-fases-card-header">
                  <h3><LucideIcon name={ICONOS_FASE[numero] || 'circle'} size={18} /> {catalogo[numero]}</h3>
                  <span className={`neuro-fases-badge ${estado}`}>
                    {estado === 'completed' ? 'Completada' : estado === 'current' ? 'En curso' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="neuro-fases-historial-section">
        <h3 className="neuro-fases-section-title">Historial de cambios</h3>
        {historial.length > 0 ? (
          <div className="neuro-fases-historial-list">
            {historial.map((item) => (
              <div key={item.id} className="neuro-fases-historial-item">
                <div className="neuro-fases-historial-fase">
                  <LucideIcon name={ICONOS_FASE[item.fase_numero] || 'circle'} size={16} />
                  {catalogo[item.fase_numero] || `Fase ${item.fase_numero}`}
                </div>
                <div className="neuro-fases-historial-meta">
                  <span><LucideIcon name="calendar" size={14} /> {formatFecha(item.created_at)}</span>
                  {item.especialista_nombre && (
                    <span><LucideIcon name="stethoscope" size={14} /> {item.especialista_nombre}</span>
                  )}
                </div>
                {item.notas && <p className="neuro-fases-historial-notas">"{item.notas}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="neuro-fases-empty">Aún no hay cambios de fase registrados.</p>
        )}
      </section>

      <ContratoTerapeutico pacienteId={pacienteId} esEspecialista={esEspecialista} />

      {showModal && (
        <div className="neuro-fases-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="neuro-fases-modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="neuro-fase-modal-title">
            <div className="neuro-fases-modal-header">
              <h2 id="neuro-fase-modal-title">Cambiar fase</h2>
              <button className="neuro-fases-modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="neuro-fases-modal-form">
              <div className="neuro-fases-form-group">
                <label htmlFor="neuro-nueva-fase">Nueva fase</label>
                <select
                  id="neuro-nueva-fase"
                  value={nuevaFase}
                  onChange={e => setNuevaFase(e.target.value)}
                >
                  <option value="">Seleccionar fase...</option>
                  {numerosFase.filter(n => n !== faseActualNum).map(n => (
                    <option key={n} value={n}>Fase {n}: {catalogo[n]}</option>
                  ))}
                </select>
              </div>
              <div className="neuro-fases-form-group">
                <label htmlFor="neuro-notas">Notas (opcional)</label>
                <textarea
                  id="neuro-notas"
                  placeholder="Motivo u observaciones del cambio..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="neuro-fases-modal-actions">
                <button className="neuro-fases-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  className="neuro-fases-btn-confirm"
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

export default MapaFasesNeuropsicologia;
