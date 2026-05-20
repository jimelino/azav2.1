import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './NeuropsicologiaEsp.css';

const CUESTIONARIOS_INFO = {
  'AAQ-2': { nombre: 'AAQ-2', completo: 'Cuestionario de Aceptación y Acción', icon: 'clipboard', color: '#5C6BC0' },
  'AADQ': { nombre: 'AADQ', completo: 'Aceptación y Acción en Diabetes', icon: 'activity', color: '#26A69A' },
  'CANCER_AAQ': { nombre: 'Cancer AAQ', completo: 'AAQ para Usuarios Oncológicos', icon: 'heart-pulse', color: '#EF5350' },
  'VLQ': { nombre: 'VLQ', completo: 'Cuestionario de Valores en la Vida', icon: 'compass', color: '#AB47BC' },
};

const getNivelConfig = (nivel) => {
  if (!nivel) return { color: '#6E7681', bg: '#6E768122' };
  const l = nivel.toLowerCase();
  if (l.includes('normal') || l.includes('bajo') || l.includes('alta')) return { color: '#4CAF50', bg: '#4CAF5022' };
  if (l.includes('elevad') || l.includes('moderad')) return { color: '#FF9800', bg: '#FF980022' };
  if (l.includes('clínic') || l.includes('clinic') || l.includes('baja')) return { color: '#F44336', bg: '#F4433622' };
  return { color: '#9C27B0', bg: '#9C27B022' };
};

const CuestionariosHistorial = ({ pacienteId, onBack }) => {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarResultados(); }, [pacienteId]);

  const cargarResultados = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/neuropsicologia/cuestionarios/historial/${pacienteId}`);
      const raw = res?.data ?? res;
      setResultados(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Error cargando historial de cuestionarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by type
  const porTipo = {};
  resultados.forEach(r => {
    const tipo = r.tipo_cuestionario || 'Otro';
    if (!porTipo[tipo]) porTipo[tipo] = [];
    porTipo[tipo].push(r);
  });

  return (
    <div className="neuro-esp-module">
      <div className="neuro-esp-header">
        <button className="neuro-back-btn" onClick={onBack}>
          <LucideIcon name="arrow-left" size={18} /> Cambiar usuario
        </button>
        <h2><LucideIcon name="clipboard-list" size={22} /> Cuestionarios Psicológicos</h2>
      </div>

      {loading ? (
        <div className="neuro-loading">
          <div className="loading-spinner"></div>
          <p>Cargando cuestionarios...</p>
        </div>
      ) : resultados.length === 0 ? (
        <div className="neuro-empty">
          <LucideIcon name="clipboard-list" size={40} />
          <p>No hay cuestionarios completados</p>
          <p className="neuro-empty-sub">El usuario aún no ha completado cuestionarios psicológicos.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="neuro-resumen-cards">
            <div className="neuro-resumen-card morado">
              <span className="resumen-num">{resultados.length}</span>
              <span className="resumen-label">Completados</span>
            </div>
            <div className="neuro-resumen-card azul">
              <span className="resumen-num">{Object.keys(porTipo).length}</span>
              <span className="resumen-label">Tipos</span>
            </div>
          </div>

          {/* Grouped results */}
          {Object.entries(porTipo).map(([tipo, items]) => {
            const info = CUESTIONARIOS_INFO[tipo] || { nombre: tipo, completo: tipo, icon: 'clipboard', color: '#9C27B0' };
            return (
              <div key={tipo} className="neuro-cuestionario-grupo">
                <div className="neuro-cuestionario-grupo-header" style={{ borderLeftColor: info.color }}>
                  <LucideIcon name={info.icon} size={20} />
                  <div>
                    <h3>{info.nombre}</h3>
                    <span className="neuro-cuestionario-completo">{info.completo}</span>
                  </div>
                  <span className="neuro-cuestionario-count">{items.length}</span>
                </div>

                <div className="neuro-cuestionario-items">
                  {items.map((item, idx) => {
                    const nivelConfig = getNivelConfig(item.interpretacion);
                    let detalle = null;
                    if (item.puntuacion_detalle) {
                      try {
                        detalle = typeof item.puntuacion_detalle === 'string'
                          ? JSON.parse(item.puntuacion_detalle)
                          : item.puntuacion_detalle;
                      } catch (e) { /* ignore */ }
                    }

                    return (
                      <div key={item.id || idx} className="neuro-cuestionario-item">
                        <div className="neuro-cuestionario-score">
                          <span className="score-num" style={{ color: nivelConfig.color }}>
                            {item.puntuacion_total || '-'}
                          </span>
                          <span className="score-label">pts</span>
                        </div>
                        <div className="neuro-cuestionario-info">
                          {item.interpretacion && (
                            <span className="neuro-nivel-badge" style={{ background: nivelConfig.bg, color: nivelConfig.color }}>
                              {item.interpretacion}
                            </span>
                          )}
                          <span className="neuro-cuestionario-fecha">
                            {item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default CuestionariosHistorial;
