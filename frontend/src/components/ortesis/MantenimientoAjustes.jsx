import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './OrtesisEsp.css';

const TIPOS_AJUSTE = [
  'Alineación',
  'Encaje',
  'Pie protésico',
  'Rodilla',
  'Socket',
  'Componentes',
  'Mantenimiento general',
  'Otro'
];

const MantenimientoAjustes = ({ pacienteId, onBack }) => {
  const [ajustes, setAjustes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('resumen');
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    tipo_ajuste: '',
    descripcion: '',
    fecha_ajuste: new Date().toISOString().split('T')[0],
    notas: ''
  });

  useEffect(() => {
    cargarAjustes();
  }, [pacienteId]);

  const cargarAjustes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ortesis/ajustes/${pacienteId}`);
      setAjustes(res?.data || []);
    } catch (err) {
      console.error('Error cargando ajustes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo_ajuste || !form.descripcion) return;

    setGuardando(true);
    try {
      await api.post(`/ortesis/ajustes/${pacienteId}`, form);
      setShowModal(false);
      setForm({ tipo_ajuste: '', descripcion: '', fecha_ajuste: new Date().toISOString().split('T')[0], notas: '' });
      cargarAjustes();
    } catch (err) {
      console.error('Error guardando ajuste:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Agrupar ajustes por tipo
  const ajustesPorTipo = ajustes.reduce((acc, ajuste) => {
    const tipo = ajuste.tipo_ajuste || 'Otro';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(ajuste);
    return acc;
  }, {});

  if (loading) {
    return (
      <section className="ortesis-module">
        <div className="ortesis-loading">
          <div className="ortesis-spinner"></div>
          <p>Cargando mantenimiento...</p>
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
          <LucideIcon name="hammer" size={22} /> Mantenimiento y Ajustes
        </h2>
      </div>

      {/* Stats */}
      <div className="ortesis-stats-row">
        <div className="ortesis-stat-card">
          <div className="stat-value">{ajustes.length}</div>
          <div className="stat-label">Total registros</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value">
            {ajustes.length > 0
              ? new Date(ajustes[0].fecha_ajuste).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
              : '—'}
          </div>
          <div className="stat-label">Último ajuste</div>
        </div>
        <div className="ortesis-stat-card">
          <div className="stat-value">
            {Object.keys(ajustesPorTipo).length}
          </div>
          <div className="stat-label">Tipos distintos</div>
        </div>
      </div>

      {/* Tabs + botón nuevo */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="ortesis-tabs" style={{ flex: 1, marginBottom: 0 }}>
          <button className={`ortesis-tab ${vista === 'resumen' ? 'active' : ''}`} onClick={() => setVista('resumen')}>
            <LucideIcon name="layout-grid" size={14} /> Resumen
          </button>
          <button className={`ortesis-tab ${vista === 'timeline' ? 'active' : ''}`} onClick={() => setVista('timeline')}>
            <LucideIcon name="clock" size={14} /> Cronología
          </button>
        </div>
        <button className="ortesis-btn ortesis-btn-primary" onClick={() => setShowModal(true)}>
          <LucideIcon name="plus" size={18} /> Registrar Ajuste
        </button>
      </div>

      {vista === 'resumen' ? (
        /* Vista Resumen por Tipo */
        Object.keys(ajustesPorTipo).length > 0 ? (
          <div className="ortesis-list">
            {Object.entries(ajustesPorTipo)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([tipo, items]) => (
                <div key={tipo} className="ortesis-info-card" style={{ marginBottom: '12px' }}>
                  <div className="card-title" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LucideIcon name="wrench" size={16} /> {tipo}
                    </span>
                    <span className="ortesis-nivel-k" style={{ fontSize: '14px', padding: '4px 10px' }}>
                      {items.length} {items.length === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>

                  {/* Último ajuste de este tipo */}
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Último: {new Date(items[0].fecha_ajuste).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                      {items[0].descripcion}
                    </p>
                    {items[0].especialista_nombre && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Por: {items[0].especialista_nombre}
                      </p>
                    )}
                  </div>

                  {/* Historial reducido */}
                  {items.length > 1 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Anteriores:
                      </p>
                      {items.slice(1, 4).map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.descripcion.length > 50 ? item.descripcion.substring(0, 50) + '...' : item.descripcion}
                          </span>
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                            {new Date(item.fecha_ajuste).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                      {items.length > 4 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          +{items.length - 4} más...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="ortesis-empty">
            <LucideIcon name="wrench" size={32} />
            <h4>Sin registros de mantenimiento</h4>
            <p>No se han registrado ajustes para este usuario</p>
          </div>
        )
      ) : (
        /* Vista Timeline Cronológica */
        ajustes.length > 0 ? (
          <div className="ortesis-info-card">
            <div className="card-title">
              <LucideIcon name="clock" size={18} /> Historial Completo ({ajustes.length})
            </div>
            <div className="ortesis-timeline">
              {ajustes.map(ajuste => (
                <div key={ajuste.id} className="ortesis-timeline-item">
                  <div className="timeline-date">
                    {new Date(ajuste.fecha_ajuste).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-type">{ajuste.tipo_ajuste}</div>
                    <div className="timeline-desc">{ajuste.descripcion}</div>
                    {ajuste.notas && (
                      <div className="timeline-desc" style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        Notas: {ajuste.notas}
                      </div>
                    )}
                    {ajuste.especialista_nombre && (
                      <div className="timeline-by">
                        Realizado por: {ajuste.especialista_nombre}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ortesis-empty">
            <LucideIcon name="wrench" size={32} />
            <h4>Sin registros</h4>
            <p>No se han registrado ajustes para este usuario</p>
          </div>
        )
      )}

      {/* Modal nuevo ajuste */}
      {showModal && (
        <div className="ortesis-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ortesis-modal" onClick={e => e.stopPropagation()}>
            <h3><LucideIcon name="plus-circle" size={20} /> Nuevo Ajuste</h3>
            <form onSubmit={handleSubmit}>
              <div className="ortesis-form-group">
                <label>Tipo de ajuste *</label>
                <select
                  value={form.tipo_ajuste}
                  onChange={e => setForm({ ...form, tipo_ajuste: e.target.value })}
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {TIPOS_AJUSTE.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="ortesis-form-group">
                <label>Descripción *</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalle del ajuste realizado..."
                  required
                />
              </div>

              <div className="ortesis-form-group">
                <label>Fecha del ajuste</label>
                <input
                  type="date"
                  value={form.fecha_ajuste}
                  onChange={e => setForm({ ...form, fecha_ajuste: e.target.value })}
                />
              </div>

              <div className="ortesis-form-group">
                <label>Notas adicionales</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones opcionales..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="ortesis-modal-actions">
                <button type="button" className="ortesis-btn ortesis-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ortesis-btn ortesis-btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Registrar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default MantenimientoAjustes;
