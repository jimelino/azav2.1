import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './OrtesisEsp.css';

const SeguimientoAdaptacion = ({ pacienteId, onBack }) => {
  const [dispositivo, setDispositivo] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dispRes, checkRes] = await Promise.all([
        api.get(`/ortesis/dispositivo/${pacienteId}`),
        api.get(`/ortesis/checklist/historial/${pacienteId}`)
      ]);
      setDispositivo(dispRes?.data || null);
      setChecklist(checkRes?.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricas = () => {
    if (checklist.length === 0) return { completado: 0, comodidad: 0, dias: 0 };

    let totalChecks = 0;
    let totalPosible = 0;
    let comodidadCount = 0;

    checklist.forEach(item => {
      const checks = [
        item.limpieza_realizada,
        item.inspeccion_visual,
        item.ajuste_correcto,
        item.comodidad_uso
      ];
      totalChecks += checks.filter(c => c == 1).length;
      totalPosible += 4;
      if (item.comodidad_uso == 1) comodidadCount++;
    });

    return {
      completado: totalPosible > 0 ? Math.round((totalChecks / totalPosible) * 100) : 0,
      comodidad: checklist.length > 0 ? Math.round((comodidadCount / checklist.length) * 100) : 0,
      dias: checklist.length
    };
  };

  const metricas = calcularMetricas();

  if (loading) {
    return (
      <section className="ortesis-module">
        <div className="ortesis-loading">
          <div className="ortesis-spinner"></div>
          <p>Cargando seguimiento...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ortesis-module">
      <div className="module-header">
        <button className="back-btn" onClick={onBack}>
          <LucideIcon name="arrow-left" size={18} /> Volver
        </button>
        <h2 className="module-title">
          <LucideIcon name="wrench" size={22} /> Seguimiento de Adaptación
        </h2>
      </div>

      {/* Nivel K actual */}
      {dispositivo?.tiene_dispositivo && (
        <div className="ortesis-info-card">
          <div className="card-title">
            <LucideIcon name="gauge" size={18} /> Nivel Funcional Actual
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span className="ortesis-nivel-k">{dispositivo.nivel_k || 'Sin evaluar'}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              {dispositivo.nivel_k_descripcion || ''}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              — {dispositivo.tipo_protesis_nombre || 'Dispositivo'}
            </span>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="ortesis-stats-row">
        <div className="ortesis-stat-card">
          <div className="stat-value">{metricas.dias}</div>
          <div className="stat-label">Días registrados</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value">{metricas.completado}%</div>
          <div className="stat-label">Checklist completado</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value">{metricas.comodidad}%</div>
          <div className="stat-label">Comodidad reportada</div>
        </div>
      </div>

      {/* Historial de Checklist */}
      <div className="ortesis-info-card">
        <div className="card-title">
          <LucideIcon name="list-checks" size={18} /> Historial de Checklist Diario
        </div>

        {checklist.length > 0 ? (
          <div className="ortesis-checklist-grid">
            {checklist.map(item => (
              <div key={item.id} className="ortesis-checklist-item">
                <span className="check-date">
                  {new Date(item.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
                <div className="check-icons" title="Limpieza | Inspección | Ajuste | Comodidad">
                  <span className={`ortesis-check-icon ${item.limpieza_realizada == 1 ? 'done' : 'missed'}`}
                    title="Limpieza">
                    {item.limpieza_realizada == 1 ? '✓' : '✗'}
                  </span>
                  <span className={`ortesis-check-icon ${item.inspeccion_visual == 1 ? 'done' : 'missed'}`}
                    title="Inspección">
                    {item.inspeccion_visual == 1 ? '✓' : '✗'}
                  </span>
                  <span className={`ortesis-check-icon ${item.ajuste_correcto == 1 ? 'done' : 'missed'}`}
                    title="Ajuste">
                    {item.ajuste_correcto == 1 ? '✓' : '✗'}
                  </span>
                  <span className={`ortesis-check-icon ${item.comodidad_uso == 1 ? 'done' : 'missed'}`}
                    title="Comodidad">
                    {item.comodidad_uso == 1 ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ortesis-empty">
            <LucideIcon name="clipboard" size={32} />
            <h4>Sin registros de checklist</h4>
            <p>El usuario aún no ha completado su checklist diario de prótesis</p>
          </div>
        )}

        {checklist.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>✓ = Completado</span>
            <span>✗ = No realizado</span>
            <span>Orden: Limpieza | Inspección | Ajuste | Comodidad</span>
          </div>
        )}
      </div>

      {/* Problemas detectados en checklist */}
      {checklist.some(c => c.problemas_detectados) && (
        <div className="ortesis-info-card">
          <div className="card-title">
            <LucideIcon name="alert-circle" size={18} /> Problemas Detectados en Checklist
          </div>
          <div className="ortesis-list">
            {checklist.filter(c => c.problemas_detectados).map(item => (
              <div key={item.id} className="ortesis-list-item">
                <div className="item-header">
                  <span className="item-title">
                    {new Date(item.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <p className="item-desc">{item.problemas_detectados}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SeguimientoAdaptacion;
