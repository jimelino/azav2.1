import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './ProgresoPacientes.css';

const ProgresoPacientes = ({ pacienteId, onBack }) => {
  const [stats, setStats] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarDatos(); }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [statsRes, evalRes] = await Promise.all([
        api.get(`/fisioterapia/stats/paciente/${pacienteId}`),
        api.get(`/fisioterapia/evaluaciones/${pacienteId}`)
      ]);
      const rawStats = statsRes?.data ?? statsRes;
      setStats(rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats) ? rawStats : {});
      const rawEval = evalRes?.data ?? evalRes;
      setEvaluaciones(Array.isArray(rawEval) ? rawEval : []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const getAdherencia = () => {
    if (!stats || !stats.videos_asignados || stats.videos_asignados === 0) return 0;
    return Math.min(Math.round((stats.videos_completados_30d / (stats.videos_asignados * 4)) * 100), 100);
  };

  const getDolorTrend = () => {
    if (evaluaciones.length < 2) return null;
    const reciente = evaluaciones[0];
    const anterior = evaluaciones[1];
    const dolorFields = ['dolor_reposo', 'dolor_movimiento', 'dolor_carga'];
    const avgReciente = dolorFields.reduce((sum, f) => sum + (parseFloat(reciente[f]) || 0), 0) / 3;
    const avgAnterior = dolorFields.reduce((sum, f) => sum + (parseFloat(anterior[f]) || 0), 0) / 3;
    if (avgReciente < avgAnterior) return { direction: 'down', label: 'Mejorando', color: '#4CAF50' };
    if (avgReciente > avgAnterior) return { direction: 'up', label: 'Aumentando', color: '#F44336' };
    return { direction: 'stable', label: 'Estable', color: '#FF9800' };
  };

  const getRomTrend = () => {
    if (evaluaciones.length < 2) return null;
    const reciente = evaluaciones[0];
    const anterior = evaluaciones[1];
    const romFields = ['rom_rodilla_flexion', 'rom_cadera_flexion', 'rom_tobillo_dorsiflexion'];
    const avgReciente = romFields.reduce((sum, f) => sum + (parseFloat(reciente[f]) || 0), 0) / 3;
    const avgAnterior = romFields.reduce((sum, f) => sum + (parseFloat(anterior[f]) || 0), 0) / 3;
    if (avgReciente > avgAnterior) return { direction: 'up', label: 'Mejorando', color: '#4CAF50' };
    if (avgReciente < avgAnterior) return { direction: 'down', label: 'Disminuyendo', color: '#F44336' };
    return { direction: 'stable', label: 'Estable', color: '#FF9800' };
  };

  if (loading) {
    return (
      <section className="module-view progreso-pacientes">
        <div className="module-header">
          <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2 className="module-title"><LucideIcon name="trending-up" size={22} /> Progreso del Usuario</h2>
        </div>
        <div className="loading-state"><div className="loading-spinner"></div><p>Cargando progreso...</p></div>
      </section>
    );
  }

  const adherencia = getAdherencia();
  const dolorTrend = getDolorTrend();
  const romTrend = getRomTrend();

  return (
    <section className="module-view progreso-pacientes">
      <div className="module-header">
        <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
        <h2 className="module-title"><LucideIcon name="trending-up" size={22} /> Progreso del Usuario</h2>
      </div>

      <div className="progreso-content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
              <LucideIcon name="dumbbell" size={24} color="#4CAF50" />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{stats?.videos_completados_30d || 0}</span>
              <span className="kpi-label">Ejercicios (30 días)</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(33, 150, 243, 0.1)' }}>
              <LucideIcon name="target" size={24} color="#2196F3" />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{stats?.videos_asignados || 0}</span>
              <span className="kpi-label">Videos Asignados</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(255, 152, 0, 0.1)' }}>
              <LucideIcon name="flame" size={24} color="#FF9800" />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{stats?.racha_actual || 0}</span>
              <span className="kpi-label">Racha Actual (días)</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(156, 39, 176, 0.1)' }}>
              <LucideIcon name="chart-line" size={24} color="#9C27B0" />
            </div>
            <div className="kpi-data">
              <span className="kpi-value">{adherencia}%</span>
              <span className="kpi-label">Adherencia</span>
            </div>
            <div className="adherencia-bar">
              <div className="adherencia-fill" style={{ width: `${adherencia}%`, background: adherencia >= 70 ? '#4CAF50' : adherencia >= 40 ? '#FF9800' : '#F44336' }}></div>
            </div>
          </div>
        </div>

        {/* Actividad Diaria */}
        {stats?.actividad_diaria && stats.actividad_diaria.length > 0 && (
          <div className="section-card">
            <h3><LucideIcon name="calendar" size={18} /> Actividad Reciente</h3>
            <div className="actividad-chart">
              {stats.actividad_diaria.map((dia, i) => {
                const maxVal = Math.max(...stats.actividad_diaria.map(d => d.videos_vistos || 1));
                const height = Math.max(((dia.videos_vistos || 0) / maxVal) * 100, 8);
                const fecha = new Date(dia.fecha);
                return (
                  <div key={i} className="actividad-bar-wrapper">
                    <div className="actividad-bar" style={{ height: `${height}%` }}>
                      <span className="bar-value">{dia.videos_vistos}</span>
                    </div>
                    <span className="bar-label">
                      {fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plan Activo */}
        {stats?.plan_activo && (
          <div className="section-card plan-activo-card">
            <h3><LucideIcon name="clipboard" size={18} /> Plan Activo</h3>
            <div className="plan-activo-info">
              <strong>{stats.plan_activo.nombre}</strong>
              <div className="plan-activo-meta">
                <span><LucideIcon name="calendar" size={14} /> Inicio: {new Date(stats.plan_activo.fecha_inicio).toLocaleDateString('es-MX')}</span>
                <span><LucideIcon name="clock" size={14} /> {stats.plan_activo.duracion_semanas} semanas</span>
              </div>
            </div>
          </div>
        )}

        {/* Tendencias de Evaluaciones */}
        {evaluaciones.length > 0 && (
          <div className="section-card">
            <h3><LucideIcon name="bar-chart" size={18} /> Tendencias de Evaluaciones</h3>

            <div className="tendencias-grid">
              {/* Dolor trend */}
              {dolorTrend && (
                <div className="tendencia-item">
                  <div className="tendencia-header">
                    <LucideIcon name="frown" size={16} />
                    <span>Dolor</span>
                  </div>
                  <div className="tendencia-value" style={{ color: dolorTrend.color }}>
                    <LucideIcon name={dolorTrend.direction === 'down' ? 'trending-up' : dolorTrend.direction === 'up' ? 'trending-up' : 'minus'} size={16} style={dolorTrend.direction === 'down' ? { transform: 'scaleY(-1)' } : {}} />
                    {dolorTrend.label}
                  </div>
                </div>
              )}

              {/* ROM trend */}
              {romTrend && (
                <div className="tendencia-item">
                  <div className="tendencia-header">
                    <LucideIcon name="compass" size={16} />
                    <span>Movilidad (ROM)</span>
                  </div>
                  <div className="tendencia-value" style={{ color: romTrend.color }}>
                    <LucideIcon name="trending-up" size={16} style={romTrend.direction === 'down' ? { transform: 'scaleY(-1)' } : {}} />
                    {romTrend.label}
                  </div>
                </div>
              )}
            </div>

            {/* Evaluaciones timeline */}
            <div className="eval-timeline">
              {evaluaciones.slice(0, 5).map((ev, i) => {
                const dolorVals = [ev.dolor_reposo, ev.dolor_movimiento, ev.dolor_carga].filter(v => v != null);
                const avgDolor = dolorVals.length ? (dolorVals.reduce((a, b) => a + Number(b), 0) / dolorVals.length).toFixed(1) : null;
                return (
                  <div key={ev.id} className="eval-timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-fecha">
                        {new Date(ev.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="timeline-stats">
                        {avgDolor !== null && (
                          <span className="timeline-stat" style={{ color: Number(avgDolor) <= 3 ? '#4CAF50' : Number(avgDolor) <= 6 ? '#FF9800' : '#F44336' }}>
                            Dolor: {avgDolor}/10
                          </span>
                        )}
                        {ev.test_berg_balance != null && (
                          <span className="timeline-stat">Berg: {ev.test_berg_balance}/56</span>
                        )}
                        {ev.test_timed_up_go != null && (
                          <span className="timeline-stat">TUG: {ev.test_timed_up_go}s</span>
                        )}
                      </div>
                      {ev.observaciones && <p className="timeline-obs">{ev.observaciones.substring(0, 60)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Última evaluación */}
        {stats?.ultima_evaluacion && (
          <div className="section-card">
            <h3><LucideIcon name="activity" size={18} /> Última Evaluación</h3>
            <p className="ultima-eval-fecha">
              <LucideIcon name="calendar" size={14} />
              {new Date(stats.ultima_evaluacion.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="ultima-eval-grid">
              {stats.ultima_evaluacion.dolor_reposo != null && (
                <div className="ue-item">
                  <span className="ue-label">Dolor en reposo</span>
                  <span className="ue-value">{stats.ultima_evaluacion.dolor_reposo}/10</span>
                </div>
              )}
              {stats.ultima_evaluacion.dolor_movimiento != null && (
                <div className="ue-item">
                  <span className="ue-label">Dolor en movimiento</span>
                  <span className="ue-value">{stats.ultima_evaluacion.dolor_movimiento}/10</span>
                </div>
              )}
              {stats.ultima_evaluacion.test_berg_balance != null && (
                <div className="ue-item">
                  <span className="ue-label">Berg Balance</span>
                  <span className="ue-value">{stats.ultima_evaluacion.test_berg_balance}/56</span>
                </div>
              )}
              {stats.ultima_evaluacion.test_timed_up_go != null && (
                <div className="ue-item">
                  <span className="ue-label">Timed Up & Go</span>
                  <span className="ue-value">{stats.ultima_evaluacion.test_timed_up_go}s</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state if no data at all */}
        {!stats?.actividad_diaria?.length && !stats?.plan_activo && evaluaciones.length === 0 && (
          <div className="empty-state">
            <LucideIcon name="trending-up" size={48} />
            <h3>Sin datos de progreso</h3>
            <p>Asigna ejercicios y registra evaluaciones para ver el progreso del usuario.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProgresoPacientes;
