import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './OrtesisEsp.css';

const ProtocoloUso = ({ pacienteId, onBack }) => {
  const [registros, setRegistros] = useState([]);
  const [protocolo, setProtocolo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProtocoloModal, setShowProtocoloModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    horas_uso: '',
    dolor_nivel: 0,
    molestias: '',
    actividades_realizadas: '',
    tolerancia: 'buena'
  });

  const [protocoloForm, setProtocoloForm] = useState({
    semana_actual: 1,
    horas_objetivo: 2,
    incremento_semanal: 1,
    horas_maximo: 12,
    notas: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [regRes, protRes] = await Promise.all([
        api.get(`/ortesis/protocolo-uso/${pacienteId}`),
        api.get(`/ortesis/protocolo-uso/${pacienteId}/config`)
      ]);
      setRegistros(regRes?.data || []);
      setProtocolo(protRes?.data || null);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.horas_uso) return;
    setGuardando(true);
    try {
      await api.post(`/ortesis/protocolo-uso/${pacienteId}`, form);
      setShowModal(false);
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        horas_uso: '', dolor_nivel: 0, molestias: '', actividades_realizadas: '', tolerancia: 'buena'
      });
      cargarDatos();
    } catch (err) {
      console.error('Error guardando registro:', err);
    } finally {
      setGuardando(false);
    }
  };

  const handleProtocoloSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post(`/ortesis/protocolo-uso/${pacienteId}/config`, protocoloForm);
      setShowProtocoloModal(false);
      cargarDatos();
    } catch (err) {
      console.error('Error guardando protocolo:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Calcular métricas
  const calcularMetricas = () => {
    if (registros.length === 0) return { promedioHoras: 0, diasRegistrados: 0, cumplimiento: 0 };

    const totalHoras = registros.reduce((sum, r) => sum + parseFloat(r.horas_uso || 0), 0);
    const promedio = totalHoras / registros.length;
    const objetivo = protocolo?.horas_objetivo || 0;
    const cumplimiento = objetivo > 0
      ? Math.round((registros.filter(r => parseFloat(r.horas_uso) >= objetivo).length / registros.length) * 100)
      : 0;

    return { promedioHoras: promedio.toFixed(1), diasRegistrados: registros.length, cumplimiento };
  };

  const metricas = calcularMetricas();

  const getDolorColor = (nivel) => {
    if (nivel <= 2) return '#4CAF50';
    if (nivel <= 5) return '#FF9800';
    if (nivel <= 7) return '#f44336';
    return '#d32f2f';
  };

  const getToleranciaStyle = (tol) => {
    switch (tol) {
      case 'excelente': return { bg: '#4CAF5022', color: '#4CAF50' };
      case 'buena': return { bg: '#2196F322', color: '#2196F3' };
      case 'regular': return { bg: '#FF980022', color: '#FF9800' };
      case 'mala': return { bg: '#f4433622', color: '#f44336' };
      default: return { bg: 'var(--surface-secondary)', color: 'var(--text-secondary)' };
    }
  };

  if (loading) {
    return (
      <section className="ortesis-module">
        <div className="ortesis-loading">
          <div className="ortesis-spinner"></div>
          <p>Cargando protocolo...</p>
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
          <LucideIcon name="timer" size={22} /> Protocolo de Uso Progresivo
        </h2>
      </div>

      {/* Protocolo actual */}
      {protocolo ? (
        <div className="ortesis-info-card" style={{ borderLeft: '4px solid #1565C0' }}>
          <div className="card-title" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LucideIcon name="target" size={18} /> Protocolo Activo
            </span>
            <button className="ortesis-btn ortesis-btn-secondary ortesis-btn-sm" onClick={() => {
              setProtocoloForm({
                semana_actual: protocolo.semana_actual || 1,
                horas_objetivo: protocolo.horas_objetivo || 2,
                incremento_semanal: protocolo.incremento_semanal || 1,
                horas_maximo: protocolo.horas_maximo || 12,
                notas: protocolo.notas || ''
              });
              setShowProtocoloModal(true);
            }}>
              <LucideIcon name="edit" size={14} /> Editar
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1565C0' }}>
                Semana {protocolo.semana_actual}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Actual</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {protocolo.horas_objetivo}h
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Objetivo diario</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                +{protocolo.incremento_semanal}h
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Incremento/semana</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {protocolo.horas_maximo}h
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Máximo</div>
            </div>
          </div>
          {protocolo.notas && (
            <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {protocolo.notas}
            </p>
          )}
        </div>
      ) : (
        <div className="ortesis-info-card" style={{ textAlign: 'center', padding: '24px' }}>
          <LucideIcon name="target" size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Sin protocolo configurado</h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Configura el protocolo de uso progresivo para este paciente
          </p>
          <button className="ortesis-btn ortesis-btn-primary" onClick={() => setShowProtocoloModal(true)}>
            <LucideIcon name="plus" size={18} /> Crear Protocolo
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="ortesis-stats-row">
        <div className="ortesis-stat-card">
          <div className="stat-value">{metricas.diasRegistrados}</div>
          <div className="stat-label">Días registrados</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value">{metricas.promedioHoras}h</div>
          <div className="stat-label">Promedio diario</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value" style={{
            color: metricas.cumplimiento >= 80 ? '#4CAF50' : metricas.cumplimiento >= 50 ? '#FF9800' : '#f44336'
          }}>
            {metricas.cumplimiento}%
          </div>
          <div className="stat-label">Cumplimiento</div>
        </div>
      </div>

      {/* Botón nuevo registro */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <button className="ortesis-btn ortesis-btn-primary" onClick={() => setShowModal(true)}>
          <LucideIcon name="plus" size={18} /> Registrar Uso del Día
        </button>
      </div>

      {/* Historial */}
      {registros.length > 0 ? (
        <div className="ortesis-info-card">
          <div className="card-title">
            <LucideIcon name="calendar" size={18} /> Historial de Uso
          </div>
          <div className="ortesis-list">
            {registros.map(reg => {
              const tolStyle = getToleranciaStyle(reg.tolerancia);
              return (
                <div key={reg.id} className="ortesis-list-item">
                  <div className="item-header">
                    <span className="item-title">
                      {new Date(reg.fecha).toLocaleDateString('es-MX', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '16px', fontWeight: 700,
                        color: protocolo && parseFloat(reg.horas_uso) >= protocolo.horas_objetivo
                          ? '#4CAF50' : '#FF9800'
                      }}>
                        {reg.horas_uso}h
                      </span>
                      {protocolo && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          / {protocolo.horas_objetivo}h
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '8px 0' }}>
                    {/* Dolor */}
                    <span style={{
                      padding: '2px 10px', borderRadius: '12px', fontSize: '13px',
                      background: `${getDolorColor(reg.dolor_nivel)}22`,
                      color: getDolorColor(reg.dolor_nivel)
                    }}>
                      Dolor: {reg.dolor_nivel}/10
                    </span>
                    {/* Tolerancia */}
                    <span style={{
                      padding: '2px 10px', borderRadius: '12px', fontSize: '13px',
                      background: tolStyle.bg, color: tolStyle.color
                    }}>
                      {reg.tolerancia}
                    </span>
                  </div>

                  {reg.actividades_realizadas && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Actividades: {reg.actividades_realizadas}
                    </p>
                  )}
                  {reg.molestias && (
                    <p style={{ fontSize: '14px', color: '#FF9800', marginTop: '4px' }}>
                      Molestias: {reg.molestias}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="ortesis-empty">
          <LucideIcon name="timer" size={32} />
          <h4>Sin registros de uso</h4>
          <p>Registra el uso diario de la prótesis del paciente</p>
        </div>
      )}

      {/* Modal registro diario */}
      {showModal && (
        <div className="ortesis-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ortesis-modal" onClick={e => e.stopPropagation()}>
            <h3><LucideIcon name="timer" size={20} /> Registro de Uso Diario</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ortesis-form-group">
                  <label>Fecha</label>
                  <input type="date" value={form.fecha}
                    onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>
                <div className="ortesis-form-group">
                  <label>Horas de uso *</label>
                  <input type="number" step="0.5" min="0" max="24"
                    value={form.horas_uso}
                    onChange={e => setForm({ ...form, horas_uso: e.target.value })}
                    placeholder="Horas" required />
                </div>
              </div>

              <div className="ortesis-form-group">
                <label>Nivel de dolor (0 = sin dolor, 10 = máximo)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="range" min="0" max="10" value={form.dolor_nivel}
                    onChange={e => setForm({ ...form, dolor_nivel: parseInt(e.target.value) })}
                    style={{ flex: 1 }} />
                  <span style={{
                    fontWeight: 700, fontSize: '18px', minWidth: '36px', textAlign: 'center',
                    color: getDolorColor(form.dolor_nivel)
                  }}>
                    {form.dolor_nivel}
                  </span>
                </div>
              </div>

              <div className="ortesis-form-group">
                <label>Tolerancia general</label>
                <select value={form.tolerancia}
                  onChange={e => setForm({ ...form, tolerancia: e.target.value })}>
                  <option value="excelente">Excelente</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                </select>
              </div>

              <div className="ortesis-form-group">
                <label>Actividades realizadas</label>
                <textarea value={form.actividades_realizadas}
                  onChange={e => setForm({ ...form, actividades_realizadas: e.target.value })}
                  placeholder="Caminar, sentarse, subir escaleras..." style={{ minHeight: '50px' }} />
              </div>

              <div className="ortesis-form-group">
                <label>Molestias reportadas</label>
                <textarea value={form.molestias}
                  onChange={e => setForm({ ...form, molestias: e.target.value })}
                  placeholder="Descripción de molestias (si hubo)..." style={{ minHeight: '50px' }} />
              </div>

              <div className="ortesis-modal-actions">
                <button type="button" className="ortesis-btn ortesis-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ortesis-btn ortesis-btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal configurar protocolo */}
      {showProtocoloModal && (
        <div className="ortesis-modal-overlay" onClick={() => setShowProtocoloModal(false)}>
          <div className="ortesis-modal" onClick={e => e.stopPropagation()}>
            <h3><LucideIcon name="target" size={20} /> Configurar Protocolo</h3>
            <form onSubmit={handleProtocoloSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ortesis-form-group">
                  <label>Semana actual</label>
                  <input type="number" min="1" max="52"
                    value={protocoloForm.semana_actual}
                    onChange={e => setProtocoloForm({ ...protocoloForm, semana_actual: parseInt(e.target.value) })} />
                </div>
                <div className="ortesis-form-group">
                  <label>Horas objetivo/día</label>
                  <input type="number" step="0.5" min="0.5" max="24"
                    value={protocoloForm.horas_objetivo}
                    onChange={e => setProtocoloForm({ ...protocoloForm, horas_objetivo: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ortesis-form-group">
                  <label>Incremento semanal (h)</label>
                  <input type="number" step="0.5" min="0" max="8"
                    value={protocoloForm.incremento_semanal}
                    onChange={e => setProtocoloForm({ ...protocoloForm, incremento_semanal: parseFloat(e.target.value) })} />
                </div>
                <div className="ortesis-form-group">
                  <label>Máximo horas/día</label>
                  <input type="number" step="0.5" min="1" max="24"
                    value={protocoloForm.horas_maximo}
                    onChange={e => setProtocoloForm({ ...protocoloForm, horas_maximo: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div className="ortesis-form-group">
                <label>Notas del protocolo</label>
                <textarea value={protocoloForm.notas}
                  onChange={e => setProtocoloForm({ ...protocoloForm, notas: e.target.value })}
                  placeholder="Indicaciones especiales..." style={{ minHeight: '60px' }} />
              </div>

              <div className="ortesis-modal-actions">
                <button type="button" className="ortesis-btn ortesis-btn-secondary" onClick={() => setShowProtocoloModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ortesis-btn ortesis-btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Protocolo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProtocoloUso;
