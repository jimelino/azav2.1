import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './OrtesisEsp.css';

const CONDICIONES_PIEL = [
  { valor: 'sana', label: 'Sana', color: '#4CAF50' },
  { valor: 'enrojecida', label: 'Enrojecida', color: '#FF9800' },
  { valor: 'irritada', label: 'Irritada', color: '#f44336' },
  { valor: 'con_herida', label: 'Con herida', color: '#d32f2f' },
  { valor: 'cicatrizando', label: 'Cicatrizando', color: '#2196F3' },
  { valor: 'edema', label: 'Con edema', color: '#9C27B0' }
];

const MedicionesMunon = ({ pacienteId, onBack }) => {
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    circunferencia_proximal: '',
    circunferencia_media: '',
    circunferencia_distal: '',
    longitud: '',
    condicion_piel: 'sana',
    temperatura_local: '',
    sensibilidad: 'normal',
    notas: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    cargarMediciones();
  }, [pacienteId]);

  const cargarMediciones = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ortesis/mediciones-munon/${pacienteId}`);
      setMediciones(res?.data || []);
    } catch (err) {
      console.error('Error cargando mediciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post(`/ortesis/mediciones-munon/${pacienteId}`, form);
      setShowModal(false);
      setForm({
        circunferencia_proximal: '', circunferencia_media: '', circunferencia_distal: '',
        longitud: '', condicion_piel: 'sana', temperatura_local: '', sensibilidad: 'normal',
        notas: '', fecha: new Date().toISOString().split('T')[0]
      });
      cargarMediciones();
    } catch (err) {
      console.error('Error guardando medición:', err);
    } finally {
      setGuardando(false);
    }
  };

  const getCondicionColor = (condicion) => {
    return CONDICIONES_PIEL.find(c => c.valor === condicion)?.color || 'var(--text-secondary)';
  };

  const getCondicionLabel = (condicion) => {
    return CONDICIONES_PIEL.find(c => c.valor === condicion)?.label || condicion;
  };

  // Calcular tendencia de circunferencia
  const calcularTendencia = () => {
    if (mediciones.length < 2) return null;
    const ultima = parseFloat(mediciones[0].circunferencia_media);
    const anterior = parseFloat(mediciones[1].circunferencia_media);
    if (!ultima || !anterior) return null;
    const diff = ultima - anterior;
    if (Math.abs(diff) < 0.2) return { texto: 'Estable', icon: 'minus', color: '#4CAF50' };
    if (diff > 0) return { texto: `+${diff.toFixed(1)} cm`, icon: 'trending-up', color: '#FF9800' };
    return { texto: `${diff.toFixed(1)} cm`, icon: 'trending-down', color: '#2196F3' };
  };

  const tendencia = calcularTendencia();

  if (loading) {
    return (
      <section className="ortesis-module">
        <div className="ortesis-loading">
          <div className="ortesis-spinner"></div>
          <p>Cargando mediciones...</p>
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
          <LucideIcon name="ruler" size={22} /> Mediciones del Muñón
        </h2>
      </div>

      {/* Stats */}
      <div className="ortesis-stats-row">
        <div className="ortesis-stat-card">
          <div className="stat-value">{mediciones.length}</div>
          <div className="stat-label">Total mediciones</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value">
            {mediciones.length > 0 && mediciones[0].circunferencia_media
              ? `${mediciones[0].circunferencia_media} cm`
              : '—'}
          </div>
          <div className="stat-label">Circ. media actual</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value" style={tendencia ? { color: tendencia.color } : {}}>
            {tendencia ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                <LucideIcon name={tendencia.icon} size={16} /> {tendencia.texto}
              </span>
            ) : '—'}
          </div>
          <div className="stat-label">Tendencia</div>
        </div>
      </div>

      {/* Botón nueva medición */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <button className="ortesis-btn ortesis-btn-primary" onClick={() => setShowModal(true)}>
          <LucideIcon name="plus" size={18} /> Nueva Medición
        </button>
      </div>

      {/* Historial */}
      {mediciones.length > 0 ? (
        <div className="ortesis-info-card">
          <div className="card-title">
            <LucideIcon name="history" size={18} /> Historial de Mediciones
          </div>
          <div className="ortesis-timeline">
            {mediciones.map(med => (
              <div key={med.id} className="ortesis-timeline-item">
                <div className="timeline-date">
                  {new Date(med.fecha).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
                <div className="timeline-content">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                    {med.circunferencia_proximal && (
                      <div className="ortesis-medicion-chip">
                        <span className="medicion-label">Proximal</span>
                        <span className="medicion-valor">{med.circunferencia_proximal} cm</span>
                      </div>
                    )}
                    {med.circunferencia_media && (
                      <div className="ortesis-medicion-chip">
                        <span className="medicion-label">Media</span>
                        <span className="medicion-valor">{med.circunferencia_media} cm</span>
                      </div>
                    )}
                    {med.circunferencia_distal && (
                      <div className="ortesis-medicion-chip">
                        <span className="medicion-label">Distal</span>
                        <span className="medicion-valor">{med.circunferencia_distal} cm</span>
                      </div>
                    )}
                    {med.longitud && (
                      <div className="ortesis-medicion-chip">
                        <span className="medicion-label">Longitud</span>
                        <span className="medicion-valor">{med.longitud} cm</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: `${getCondicionColor(med.condicion_piel)}22`,
                      color: getCondicionColor(med.condicion_piel),
                      border: `1px solid ${getCondicionColor(med.condicion_piel)}44`
                    }}>
                      Piel: {getCondicionLabel(med.condicion_piel)}
                    </span>
                    {med.sensibilidad && med.sensibilidad !== 'normal' && (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Sensibilidad: {med.sensibilidad}
                      </span>
                    )}
                    {med.temperatura_local && (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Temp: {med.temperatura_local}°C
                      </span>
                    )}
                  </div>
                  {med.notas && (
                    <p style={{ marginTop: '8px', fontSize: '14px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      {med.notas}
                    </p>
                  )}
                  {med.especialista_nombre && (
                    <div className="timeline-by">
                      Registrado por: {med.especialista_nombre}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ortesis-empty">
          <LucideIcon name="ruler" size={32} />
          <h4>Sin mediciones registradas</h4>
          <p>Registra la primera medición del muñón del paciente</p>
        </div>
      )}

      {/* Modal nueva medición */}
      {showModal && (
        <div className="ortesis-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ortesis-modal" onClick={e => e.stopPropagation()}>
            <h3><LucideIcon name="ruler" size={20} /> Nueva Medición del Muñón</h3>
            <form onSubmit={handleSubmit}>
              <div className="ortesis-form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                />
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                Circunferencias (cm)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div className="ortesis-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px' }}>Proximal</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={form.circunferencia_proximal}
                    onChange={e => setForm({ ...form, circunferencia_proximal: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div className="ortesis-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px' }}>Media</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={form.circunferencia_media}
                    onChange={e => setForm({ ...form, circunferencia_media: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div className="ortesis-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px' }}>Distal</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={form.circunferencia_distal}
                    onChange={e => setForm({ ...form, circunferencia_distal: e.target.value })}
                    placeholder="cm"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ortesis-form-group">
                  <label>Longitud del muñón (cm)</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={form.longitud}
                    onChange={e => setForm({ ...form, longitud: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div className="ortesis-form-group">
                  <label>Temperatura local (°C)</label>
                  <input
                    type="number" step="0.1" min="30" max="45"
                    value={form.temperatura_local}
                    onChange={e => setForm({ ...form, temperatura_local: e.target.value })}
                    placeholder="°C"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ortesis-form-group">
                  <label>Condición de la piel</label>
                  <select
                    value={form.condicion_piel}
                    onChange={e => setForm({ ...form, condicion_piel: e.target.value })}
                  >
                    {CONDICIONES_PIEL.map(c => (
                      <option key={c.valor} value={c.valor}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ortesis-form-group">
                  <label>Sensibilidad</label>
                  <select
                    value={form.sensibilidad}
                    onChange={e => setForm({ ...form, sensibilidad: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="hipersensible">Hipersensible</option>
                    <option value="hiposensible">Hiposensible</option>
                    <option value="dolor_fantasma">Dolor fantasma</option>
                    <option value="hormigueo">Hormigueo</option>
                  </select>
                </div>
              </div>

              <div className="ortesis-form-group">
                <label>Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="ortesis-modal-actions">
                <button type="button" className="ortesis-btn ortesis-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ortesis-btn ortesis-btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Medición'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default MedicionesMunon;
