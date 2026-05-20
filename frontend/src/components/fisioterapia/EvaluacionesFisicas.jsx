import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './EvaluacionesFisicas.css';

const CAMPOS_ROM = [
  { key: 'rom_rodilla_flexion', label: 'Rodilla - Flexión', max: 150 },
  { key: 'rom_rodilla_extension', label: 'Rodilla - Extensión', max: 10 },
  { key: 'rom_cadera_flexion', label: 'Cadera - Flexión', max: 125 },
  { key: 'rom_cadera_extension', label: 'Cadera - Extensión', max: 30 },
  { key: 'rom_tobillo_dorsiflexion', label: 'Tobillo - Dorsiflexión', max: 20 },
  { key: 'rom_tobillo_plantiflexion', label: 'Tobillo - Plantiflexión', max: 50 },
];

const CAMPOS_FUERZA = [
  { key: 'fuerza_cuadriceps', label: 'Cuádriceps' },
  { key: 'fuerza_isquiotibiales', label: 'Isquiotibiales' },
  { key: 'fuerza_gluteos', label: 'Glúteos' },
  { key: 'fuerza_pantorrilla', label: 'Pantorrilla' },
];

const CAMPOS_DOLOR = [
  { key: 'dolor_reposo', label: 'En reposo' },
  { key: 'dolor_movimiento', label: 'En movimiento' },
  { key: 'dolor_carga', label: 'Con carga' },
];

const CAMPOS_TESTS = [
  { key: 'test_equilibrio_unipodal', label: 'Equilibrio Unipodal', unit: 'seg', type: 'number' },
  { key: 'test_timed_up_go', label: 'Timed Up & Go', unit: 'seg', type: 'number', step: '0.1' },
  { key: 'test_marcha_6min', label: 'Marcha 6 min', unit: 'm', type: 'number', step: '0.1' },
  { key: 'test_berg_balance', label: 'Berg Balance', unit: '/56', type: 'number', max: 56 },
];

const EMPTY_FORM = {
  fecha: new Date().toISOString().split('T')[0],
  rom_rodilla_flexion: '', rom_rodilla_extension: '',
  rom_cadera_flexion: '', rom_cadera_extension: '',
  rom_tobillo_dorsiflexion: '', rom_tobillo_plantiflexion: '',
  fuerza_cuadriceps: '', fuerza_isquiotibiales: '',
  fuerza_gluteos: '', fuerza_pantorrilla: '',
  dolor_reposo: '', dolor_movimiento: '', dolor_carga: '',
  test_equilibrio_unipodal: '', test_timed_up_go: '',
  test_marcha_6min: '', test_berg_balance: '',
  observaciones: '', notas_plan: ''
};

const EvaluacionesFisicas = ({ pacienteId, onBack }) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('lista'); // lista | form | detalle
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editandoId, setEditandoId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detalleEval, setDetalleEval] = useState(null);

  useEffect(() => { cargarEvaluaciones(); }, [pacienteId]);

  const cargarEvaluaciones = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fisioterapia/evaluaciones/${pacienteId}`);
      const raw = res?.data ?? res;
      setEvaluaciones(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const nuevaEvaluacion = () => {
    setFormData({ ...EMPTY_FORM });
    setEditandoId(null);
    setVista('form');
  };

  const editarEvaluacion = (ev) => {
    const data = {};
    Object.keys(EMPTY_FORM).forEach(k => {
      data[k] = ev[k] !== null && ev[k] !== undefined ? String(ev[k]) : '';
    });
    if (ev.fecha) data.fecha = ev.fecha.split('T')[0];
    setFormData(data);
    setEditandoId(ev.id);
    setVista('form');
  };

  const verDetalle = (ev) => {
    setDetalleEval(ev);
    setVista('detalle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fecha) {
      alert('La fecha es obligatoria.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { paciente_id: pacienteId, fecha: formData.fecha };
      // Convert numeric fields
      [...CAMPOS_ROM, ...CAMPOS_TESTS].forEach(c => {
        if (formData[c.key] !== '') payload[c.key] = parseFloat(formData[c.key]);
      });
      [...CAMPOS_FUERZA, ...CAMPOS_DOLOR].forEach(c => {
        if (formData[c.key] !== '') payload[c.key] = parseInt(formData[c.key], 10);
      });
      if (formData.observaciones) payload.observaciones = formData.observaciones;
      if (formData.notas_plan) payload.notas_plan = formData.notas_plan;

      if (editandoId) {
        await api.put(`/fisioterapia/evaluaciones/${editandoId}`, payload);
      } else {
        await api.post('/fisioterapia/evaluaciones', payload);
      }
      await cargarEvaluaciones();
      setVista('lista');
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      alert('Error al guardar la evaluación.');
    } finally {
      setSubmitting(false);
    }
  };

  const eliminarEvaluacion = async (id) => {
    if (!window.confirm('¿Eliminar esta evaluación?')) return;
    try {
      await api.delete(`/fisioterapia/evaluaciones/${id}`);
      await cargarEvaluaciones();
      if (vista === 'detalle') setVista('lista');
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const getDolorColor = (val) => {
    if (val === null || val === undefined || val === '') return 'var(--text-muted)';
    const v = parseInt(val, 10);
    if (v <= 3) return '#4CAF50';
    if (v <= 6) return '#FF9800';
    return '#F44336';
  };

  const getFuerzaLabel = (val) => {
    const labels = ['Nula', 'Vestigio', 'Pobre', 'Regular', 'Buena', 'Normal'];
    return labels[parseInt(val, 10)] || '-';
  };

  const getResumenEval = (ev) => {
    const romVals = CAMPOS_ROM.map(c => ev[c.key]).filter(v => v !== null && v !== undefined);
    const dolorVals = CAMPOS_DOLOR.map(c => ev[c.key]).filter(v => v !== null && v !== undefined);
    return {
      romPromedio: romVals.length > 0 ? (romVals.reduce((a, b) => a + parseFloat(b), 0) / romVals.length).toFixed(0) : null,
      dolorMax: dolorVals.length > 0 ? Math.max(...dolorVals.map(Number)) : null,
    };
  };

  if (loading) {
    return (
      <section className="module-view evaluaciones-fisicas">
        <div className="module-header">
          <button className="back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2 className="module-title"><LucideIcon name="bar-chart" size={22} /> Evaluaciones Físicas</h2>
        </div>
        <div className="loading-state"><div className="loading-spinner"></div><p>Cargando evaluaciones...</p></div>
      </section>
    );
  }

  return (
    <section className="module-view evaluaciones-fisicas">
      <div className="module-header">
        <button className="back-btn" onClick={vista === 'lista' ? onBack : () => setVista('lista')}>
          <LucideIcon name="arrow-left" size={18} /> {vista === 'lista' ? 'Volver' : 'Lista'}
        </button>
        <h2 className="module-title"><LucideIcon name="bar-chart" size={22} /> Evaluaciones Físicas</h2>
        {vista === 'lista' && (
          <button className="btn-primary" onClick={nuevaEvaluacion}>
            <LucideIcon name="plus" size={16} /> Nueva Evaluación
          </button>
        )}
      </div>

      {/* VISTA LISTA */}
      {vista === 'lista' && (
        <div className="eval-lista">
          {evaluaciones.length === 0 ? (
            <div className="empty-state">
              <LucideIcon name="bar-chart" size={48} />
              <h3>Sin evaluaciones</h3>
              <p>Registra la primera evaluación física de este usuario.</p>
              <button className="btn-primary" onClick={nuevaEvaluacion}>
                <LucideIcon name="plus" size={16} /> Nueva Evaluación
              </button>
            </div>
          ) : (
            <div className="eval-cards">
              {evaluaciones.map(ev => {
                const resumen = getResumenEval(ev);
                return (
                  <div key={ev.id} className="eval-card" onClick={() => verDetalle(ev)}>
                    <div className="eval-card-header">
                      <span className="eval-fecha">
                        <LucideIcon name="calendar" size={14} />
                        {new Date(ev.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <div className="eval-card-actions">
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); editarEvaluacion(ev); }} title="Editar">
                          <LucideIcon name="pencil" size={16} />
                        </button>
                        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); eliminarEvaluacion(ev.id); }} title="Eliminar">
                          <LucideIcon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="eval-card-body">
                      <div className="eval-stat">
                        <span className="eval-stat-label">ROM Promedio</span>
                        <span className="eval-stat-value">{resumen.romPromedio !== null ? `${resumen.romPromedio}°` : '-'}</span>
                      </div>
                      <div className="eval-stat">
                        <span className="eval-stat-label">Dolor Máx.</span>
                        <span className="eval-stat-value" style={{ color: getDolorColor(resumen.dolorMax) }}>
                          {resumen.dolorMax !== null ? `${resumen.dolorMax}/10` : '-'}
                        </span>
                      </div>
                      {ev.test_berg_balance !== null && (
                        <div className="eval-stat">
                          <span className="eval-stat-label">Berg</span>
                          <span className="eval-stat-value">{ev.test_berg_balance}/56</span>
                        </div>
                      )}
                    </div>
                    {ev.observaciones && <p className="eval-obs">{ev.observaciones.substring(0, 80)}...</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA FORMULARIO */}
      {vista === 'form' && (
        <form className="eval-form" onSubmit={handleSubmit}>
          <h3 className="form-section-title">
            {editandoId ? 'Editar Evaluación' : 'Nueva Evaluación'}
          </h3>

          <div className="form-group">
            <label>Fecha de evaluación</label>
            <input type="date" value={formData.fecha} onChange={e => handleChange('fecha', e.target.value)} required />
          </div>

          {/* ROM */}
          <div className="form-section">
            <h4 className="section-label"><LucideIcon name="compass" size={18} /> Rango de Movimiento (ROM)</h4>
            <div className="form-grid">
              {CAMPOS_ROM.map(c => (
                <div key={c.key} className="form-group">
                  <label>{c.label} <span className="unit">(0-{c.max}°)</span></label>
                  <input
                    type="number"
                    min="0"
                    max={c.max}
                    step="0.5"
                    value={formData[c.key]}
                    onChange={e => handleChange(c.key, e.target.value)}
                    placeholder="°"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fuerza Muscular */}
          <div className="form-section">
            <h4 className="section-label"><LucideIcon name="zap" size={18} /> Fuerza Muscular (0-5)</h4>
            <div className="form-grid">
              {CAMPOS_FUERZA.map(c => (
                <div key={c.key} className="form-group">
                  <label>{c.label}</label>
                  <div className="fuerza-selector">
                    {[0, 1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        className={`fuerza-btn ${formData[c.key] === String(val) ? 'active' : ''}`}
                        onClick={() => handleChange(c.key, String(val))}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  {formData[c.key] !== '' && (
                    <span className="fuerza-label">{getFuerzaLabel(formData[c.key])}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dolor */}
          <div className="form-section">
            <h4 className="section-label"><LucideIcon name="frown" size={18} /> Dolor (EVA 0-10)</h4>
            <div className="form-grid">
              {CAMPOS_DOLOR.map(c => (
                <div key={c.key} className="form-group">
                  <label>{c.label}</label>
                  <div className="dolor-slider-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData[c.key] || 0}
                      onChange={e => handleChange(c.key, e.target.value)}
                      className="dolor-slider"
                      style={{
                        '--dolor-pct': `${(parseInt(formData[c.key] || 0, 10) / 10) * 100}%`
                      }}
                    />
                    <span className="dolor-value" style={{ color: getDolorColor(formData[c.key]) }}>
                      {formData[c.key] || 0}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tests Funcionales */}
          <div className="form-section">
            <h4 className="section-label"><LucideIcon name="activity" size={18} /> Tests Funcionales</h4>
            <div className="form-grid">
              {CAMPOS_TESTS.map(c => (
                <div key={c.key} className="form-group">
                  <label>{c.label} <span className="unit">({c.unit})</span></label>
                  <input
                    type={c.type || 'number'}
                    min="0"
                    max={c.max}
                    step={c.step || '1'}
                    value={formData[c.key]}
                    onChange={e => handleChange(c.key, e.target.value)}
                    placeholder={c.unit}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-section">
            <h4 className="section-label"><LucideIcon name="pen-line" size={18} /> Observaciones</h4>
            <div className="form-group">
              <label>Observaciones generales</label>
              <textarea
                rows="3"
                value={formData.observaciones}
                onChange={e => handleChange('observaciones', e.target.value)}
                placeholder="Notas sobre la evaluación..."
              />
            </div>
            <div className="form-group">
              <label>Notas para el plan</label>
              <textarea
                rows="3"
                value={formData.notas_plan}
                onChange={e => handleChange('notas_plan', e.target.value)}
                placeholder="Recomendaciones para el plan de tratamiento..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <LucideIcon name="save" size={16} /> {submitting ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
          </div>
        </form>
      )}

      {/* VISTA DETALLE */}
      {vista === 'detalle' && detalleEval && (
        <div className="eval-detalle">
          <div className="detalle-header">
            <h3>
              <LucideIcon name="calendar" size={18} />
              {new Date(detalleEval.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <div className="detalle-actions">
              <button className="btn-secondary" onClick={() => editarEvaluacion(detalleEval)}>
                <LucideIcon name="pencil" size={14} /> Editar
              </button>
              <button className="btn-danger" onClick={() => eliminarEvaluacion(detalleEval.id)}>
                <LucideIcon name="trash" size={14} /> Eliminar
              </button>
            </div>
          </div>

          {/* ROM Section */}
          <div className="detalle-section">
            <h4><LucideIcon name="compass" size={16} /> Rango de Movimiento</h4>
            <div className="detalle-grid">
              {CAMPOS_ROM.map(c => (
                <div key={c.key} className="detalle-item">
                  <span className="detalle-label">{c.label}</span>
                  <span className="detalle-value">
                    {detalleEval[c.key] !== null && detalleEval[c.key] !== undefined ? `${detalleEval[c.key]}°` : '-'}
                  </span>
                  {detalleEval[c.key] !== null && (
                    <div className="rom-bar">
                      <div className="rom-fill" style={{ width: `${Math.min((parseFloat(detalleEval[c.key]) / c.max) * 100, 100)}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fuerza Section */}
          <div className="detalle-section">
            <h4><LucideIcon name="zap" size={16} /> Fuerza Muscular</h4>
            <div className="detalle-grid">
              {CAMPOS_FUERZA.map(c => (
                <div key={c.key} className="detalle-item">
                  <span className="detalle-label">{c.label}</span>
                  <span className="detalle-value">
                    {detalleEval[c.key] !== null && detalleEval[c.key] !== undefined
                      ? `${detalleEval[c.key]}/5 (${getFuerzaLabel(detalleEval[c.key])})`
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dolor Section */}
          <div className="detalle-section">
            <h4><LucideIcon name="frown" size={16} /> Dolor (EVA)</h4>
            <div className="detalle-grid">
              {CAMPOS_DOLOR.map(c => (
                <div key={c.key} className="detalle-item">
                  <span className="detalle-label">{c.label}</span>
                  <span className="detalle-value" style={{ color: getDolorColor(detalleEval[c.key]) }}>
                    {detalleEval[c.key] !== null && detalleEval[c.key] !== undefined ? `${detalleEval[c.key]}/10` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tests Section */}
          <div className="detalle-section">
            <h4><LucideIcon name="activity" size={16} /> Tests Funcionales</h4>
            <div className="detalle-grid">
              {CAMPOS_TESTS.map(c => (
                <div key={c.key} className="detalle-item">
                  <span className="detalle-label">{c.label}</span>
                  <span className="detalle-value">
                    {detalleEval[c.key] !== null && detalleEval[c.key] !== undefined
                      ? `${detalleEval[c.key]} ${c.unit}`
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          {(detalleEval.observaciones || detalleEval.notas_plan) && (
            <div className="detalle-section">
              <h4><LucideIcon name="pen-line" size={16} /> Notas</h4>
              {detalleEval.observaciones && (
                <div className="detalle-nota">
                  <strong>Observaciones:</strong>
                  <p>{detalleEval.observaciones}</p>
                </div>
              )}
              {detalleEval.notas_plan && (
                <div className="detalle-nota">
                  <strong>Notas para el plan:</strong>
                  <p>{detalleEval.notas_plan}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default EvaluacionesFisicas;
