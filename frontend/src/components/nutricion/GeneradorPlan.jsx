import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import VistaPlan from './VistaPlan';
import './GeneradorPlan.css';

// Tipos de comida con colores del especialista nutrición
const TIPOS_COMIDA = [
  { key: 'desayuno', label: 'Desayuno', icon: 'sunrise', color: '#E91E63', hora: '08:00' },
  { key: 'media_manana', label: 'Colación Matutina', icon: 'apple', color: '#9C27B0', hora: '11:00' },
  { key: 'almuerzo', label: 'Comida', icon: 'utensils', color: '#5C6BC0', hora: '14:00' },
  { key: 'merienda', label: 'Colación Vespertina', icon: 'cookie', color: '#FF7043', hora: '17:00' },
  { key: 'cena', label: 'Cena', icon: 'moon', color: '#FF9800', hora: '20:00' },
];

const EMPTY_OPCION = {
  nombre: '',
  descripcion: '',
  calorias: '',
  proteinas: '',
  carbohidratos: '',
  grasas: '',
  ingredientes: [],
  instrucciones: [],
  imagen_url: null,
  receta_id: null,
};

const GeneradorPlan = ({ especialistaId, onBack, onPlanCreated }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Comidas, 3: Preview
  const [recetasCatalogo, setRecetasCatalogo] = useState([]);
  const [showRecetaPicker, setShowRecetaPicker] = useState(null); // { comidaKey, opcionIdx }
  const [searchReceta, setSearchReceta] = useState('');
  const [saving, setSaving] = useState(false);

  // Step 1: Info básica
  const [planInfo, setPlanInfo] = useState({
    nombre: '',
    descripcion: '',
    calorias_diarias: '',
    proteinas_g: '',
    carbohidratos_g: '',
    grasas_g: '',
    indicaciones_generales: [''],
  });

  // Step 2: Comidas (cada tipo tiene un array de opciones)
  const [comidas, setComidas] = useState(
    TIPOS_COMIDA.reduce((acc, tipo) => {
      acc[tipo.key] = { activo: tipo.key === 'desayuno' || tipo.key === 'almuerzo' || tipo.key === 'cena', opciones: [] };
      return acc;
    }, {})
  );

  // Inline recipe form
  const [showInlineForm, setShowInlineForm] = useState(null); // { comidaKey, opcionIdx }
  const [inlineForm, setInlineForm] = useState({
    nombre: '', descripcion: '', calorias: '', proteinas: '', carbohidratos: '', grasas: '',
    ingredientes: [{ nombre: '', cantidad: '', unidad: '' }],
    instrucciones: [''],
  });

  useEffect(() => {
    loadRecetasCatalogo();
  }, []);

  const loadRecetasCatalogo = async () => {
    try {
      const res = await api.get('/nutricion/recetas/catalogo');
      setRecetasCatalogo(res.data?.recetas || []);
    } catch (err) {
      console.error('Error cargando recetas:', err);
    }
  };

  // ====== INDICACIONES ======
  const addIndicacion = () => {
    setPlanInfo({ ...planInfo, indicaciones_generales: [...planInfo.indicaciones_generales, ''] });
  };

  const removeIndicacion = (idx) => {
    setPlanInfo({
      ...planInfo,
      indicaciones_generales: planInfo.indicaciones_generales.filter((_, i) => i !== idx)
    });
  };

  const updateIndicacion = (idx, value) => {
    const updated = [...planInfo.indicaciones_generales];
    updated[idx] = value;
    setPlanInfo({ ...planInfo, indicaciones_generales: updated });
  };

  // ====== COMIDAS ======
  const toggleComida = (key) => {
    setComidas(prev => ({
      ...prev,
      [key]: { ...prev[key], activo: !prev[key].activo }
    }));
  };

  const addOpcion = (comidaKey) => {
    setComidas(prev => ({
      ...prev,
      [comidaKey]: {
        ...prev[comidaKey],
        opciones: [...prev[comidaKey].opciones, { ...EMPTY_OPCION }]
      }
    }));
  };

  const removeOpcion = (comidaKey, opcionIdx) => {
    setComidas(prev => ({
      ...prev,
      [comidaKey]: {
        ...prev[comidaKey],
        opciones: prev[comidaKey].opciones.filter((_, i) => i !== opcionIdx)
      }
    }));
  };

  const updateOpcion = (comidaKey, opcionIdx, field, value) => {
    setComidas(prev => {
      const updated = { ...prev };
      const opciones = [...updated[comidaKey].opciones];
      opciones[opcionIdx] = { ...opciones[opcionIdx], [field]: value };
      updated[comidaKey] = { ...updated[comidaKey], opciones };
      return updated;
    });
  };

  // ====== SELECCIÓN RECETA DEL CATÁLOGO ======
  const openRecetaPicker = (comidaKey, opcionIdx) => {
    setShowRecetaPicker({ comidaKey, opcionIdx });
    setSearchReceta('');
  };

  const selectReceta = (receta) => {
    if (!showRecetaPicker) return;
    const { comidaKey, opcionIdx } = showRecetaPicker;
    setComidas(prev => {
      const updated = { ...prev };
      const opciones = [...updated[comidaKey].opciones];
      opciones[opcionIdx] = {
        nombre: receta.titulo,
        descripcion: receta.descripcion || '',
        calorias: receta.calorias || '',
        proteinas: receta.proteinas || '',
        carbohidratos: receta.carbohidratos || '',
        grasas: receta.grasas || '',
        ingredientes: receta.ingredientes || [],
        instrucciones: receta.instrucciones || [],
        imagen_url: receta.imagen_url || null,
        receta_id: receta.id,
      };
      updated[comidaKey] = { ...updated[comidaKey], opciones };
      return updated;
    });
    setShowRecetaPicker(null);
  };

  // ====== INLINE FORM ======
  const openInlineForm = (comidaKey, opcionIdx) => {
    const opcion = comidas[comidaKey].opciones[opcionIdx];
    setInlineForm({
      nombre: opcion.nombre || '',
      descripcion: opcion.descripcion || '',
      calorias: opcion.calorias || '',
      proteinas: opcion.proteinas || '',
      carbohidratos: opcion.carbohidratos || '',
      grasas: opcion.grasas || '',
      ingredientes: opcion.ingredientes?.length > 0 ? opcion.ingredientes : [{ nombre: '', cantidad: '', unidad: '' }],
      instrucciones: opcion.instrucciones?.length > 0
        ? opcion.instrucciones.map(i => typeof i === 'string' ? i : (i.paso || i.descripcion || ''))
        : [''],
    });
    setShowInlineForm({ comidaKey, opcionIdx });
  };

  const saveInlineForm = () => {
    if (!showInlineForm) return;
    const { comidaKey, opcionIdx } = showInlineForm;
    setComidas(prev => {
      const updated = { ...prev };
      const opciones = [...updated[comidaKey].opciones];
      opciones[opcionIdx] = {
        ...opciones[opcionIdx],
        nombre: inlineForm.nombre,
        descripcion: inlineForm.descripcion,
        calorias: inlineForm.calorias,
        proteinas: inlineForm.proteinas,
        carbohidratos: inlineForm.carbohidratos,
        grasas: inlineForm.grasas,
        ingredientes: inlineForm.ingredientes.filter(i => i.nombre.trim()),
        instrucciones: inlineForm.instrucciones.filter(i => i.trim()),
        receta_id: null,
      };
      updated[comidaKey] = { ...updated[comidaKey], opciones };
      return updated;
    });
    setShowInlineForm(null);
  };

  // ====== AUTO-CALC TOTALS ======
  const calcularTotales = useCallback(() => {
    let totalCal = 0, totalProt = 0, totalCarb = 0, totalGras = 0;
    Object.values(comidas).forEach(comida => {
      if (!comida.activo) return;
      comida.opciones.forEach(op => {
        // Use first option's macros for total estimate
        totalCal += Number(op.calorias) || 0;
        totalProt += Number(op.proteinas) || 0;
        totalCarb += Number(op.carbohidratos) || 0;
        totalGras += Number(op.grasas) || 0;
      });
    });
    // Average per option if multiple per type
    return { calorias: totalCal, proteinas: totalProt, carbohidratos: totalCarb, grasas: totalGras };
  }, [comidas]);

  // ====== BUILD PREVIEW DATA ======
  const buildPreviewData = useCallback(() => {
    const totales = calcularTotales();
    const comidasArray = [];

    TIPOS_COMIDA.forEach(tipo => {
      const comida = comidas[tipo.key];
      if (!comida.activo || comida.opciones.length === 0) return;

      comidasArray.push({
        tipo_comida: tipo.key,
        opciones: comida.opciones.map((op, idx) => ({
          numero: idx + 1,
          nombre: op.nombre || 'Sin nombre',
          descripcion: op.descripcion,
          ingredientes: op.ingredientes,
          instrucciones: op.instrucciones,
          imagen_url: op.imagen_url,
          receta_id: op.receta_id,
          calorias: Number(op.calorias) || 0,
          proteinas: Number(op.proteinas) || 0,
          carbohidratos: Number(op.carbohidratos) || 0,
          grasas: Number(op.grasas) || 0,
        }))
      });
    });

    return {
      plan: {
        nombre: planInfo.nombre || 'Plan Nutricional',
        descripcion: planInfo.descripcion,
        calorias_diarias: planInfo.calorias_diarias || totales.calorias,
        proteinas_g: planInfo.proteinas_g || totales.proteinas,
        carbohidratos_g: planInfo.carbohidratos_g || totales.carbohidratos,
        grasas_g: planInfo.grasas_g || totales.grasas,
      },
      contenido: {
        indicaciones_generales: planInfo.indicaciones_generales.filter(i => i.trim()),
        comidas: comidasArray,
        totales: {
          calorias: planInfo.calorias_diarias || totales.calorias,
          proteinas: planInfo.proteinas_g || totales.proteinas,
          carbohidratos: planInfo.carbohidratos_g || totales.carbohidratos,
          grasas: planInfo.grasas_g || totales.grasas,
        }
      }
    };
  }, [planInfo, comidas, calcularTotales]);

  // ====== SAVE ======
  const handleSave = async () => {
    if (!planInfo.nombre.trim()) {
      alert('El nombre del plan es requerido');
      setStep(1);
      return;
    }

    const preview = buildPreviewData();
    const payload = {
      nombre: planInfo.nombre,
      descripcion: planInfo.descripcion,
      especialista_id: especialistaId,
      calorias_diarias: planInfo.calorias_diarias || null,
      proteinas_g: planInfo.proteinas_g || null,
      carbohidratos_g: planInfo.carbohidratos_g || null,
      grasas_g: planInfo.grasas_g || null,
      indicaciones_generales: planInfo.indicaciones_generales.filter(i => i.trim()),
      comidas: preview.contenido.comidas,
    };

    setSaving(true);
    try {
      const res = await api.post('/nutricion/planes/generar', payload);
      if (res.data?.plan_id) {
        alert('Plan generado exitosamente');
        if (onPlanCreated) onPlanCreated(res.data.plan_id);
      }
    } catch (err) {
      console.error('Error generando plan:', err);
      alert('Error al generar el plan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // ====== VALIDATION ======
  const canGoToStep2 = planInfo.nombre.trim().length > 0;
  const comidasActivas = Object.entries(comidas).filter(([, v]) => v.activo && v.opciones.length > 0);
  const canGoToStep3 = comidasActivas.length > 0 && comidasActivas.every(([, v]) => v.opciones.every(op => op.nombre.trim()));

  const filteredRecetas = recetasCatalogo.filter(r =>
    !searchReceta || r.titulo.toLowerCase().includes(searchReceta.toLowerCase())
  );

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // ====== RENDER STEP 1: Info básica ======
  const renderStep1 = () => (
    <div className="gen-step gen-step-1">
      <div className="gen-step-header">
        <div className="gen-step-icon" style={{ background: '#4CAF50' }}>
          <LucideIcon name="clipboard" size={24} />
        </div>
        <div>
          <h3>Información del Plan</h3>
          <p>Datos generales del plan nutricional</p>
        </div>
      </div>

      <div className="gen-form-group">
        <label>Nombre del plan *</label>
        <input
          type="text" className="form-input"
          value={planInfo.nombre}
          onChange={e => setPlanInfo({ ...planInfo, nombre: e.target.value })}
          placeholder="Ej: Plan de Alimentación - Pérdida de Peso"
        />
      </div>

      <div className="gen-form-group">
        <label>Descripción</label>
        <textarea
          className="form-input form-textarea" rows="2"
          value={planInfo.descripcion}
          onChange={e => setPlanInfo({ ...planInfo, descripcion: e.target.value })}
          placeholder="Descripción breve del plan..."
        />
      </div>

      {/* Macros objetivo */}
      <div className="gen-section-title">
        <LucideIcon name="target" size={18} /> Macronutrientes Objetivo (opcional)
      </div>
      <div className="gen-macros-grid">
        <div className="gen-macro-input">
          <label><LucideIcon name="flame" size={14} /> kcal/día</label>
          <input type="number" className="form-input" value={planInfo.calorias_diarias}
            onChange={e => setPlanInfo({ ...planInfo, calorias_diarias: e.target.value })} placeholder="2000" />
        </div>
        <div className="gen-macro-input">
          <label><LucideIcon name="beef" size={14} /> Proteínas (g)</label>
          <input type="number" className="form-input" value={planInfo.proteinas_g}
            onChange={e => setPlanInfo({ ...planInfo, proteinas_g: e.target.value })} placeholder="80" />
        </div>
        <div className="gen-macro-input">
          <label><LucideIcon name="wheat" size={14} /> Carbos (g)</label>
          <input type="number" className="form-input" value={planInfo.carbohidratos_g}
            onChange={e => setPlanInfo({ ...planInfo, carbohidratos_g: e.target.value })} placeholder="250" />
        </div>
        <div className="gen-macro-input">
          <label><LucideIcon name="droplet" size={14} /> Grasas (g)</label>
          <input type="number" className="form-input" value={planInfo.grasas_g}
            onChange={e => setPlanInfo({ ...planInfo, grasas_g: e.target.value })} placeholder="65" />
        </div>
      </div>

      {/* Indicaciones generales */}
      <div className="gen-section-title">
        <LucideIcon name="info" size={18} /> Indicaciones Generales
        <button className="gen-btn-add" onClick={addIndicacion}>
          <LucideIcon name="plus" size={14} /> Agregar
        </button>
      </div>
      <div className="gen-indicaciones-list">
        {planInfo.indicaciones_generales.map((ind, idx) => (
          <div key={idx} className="gen-indicacion-row">
            <span className="gen-bullet">•</span>
            <input
              type="text" className="form-input"
              value={ind}
              onChange={e => updateIndicacion(idx, e.target.value)}
              placeholder="Ej: Tomar mínimo 2 litros de agua al día"
            />
            {planInfo.indicaciones_generales.length > 1 && (
              <button className="gen-btn-remove" onClick={() => removeIndicacion(idx)}>✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ====== RENDER STEP 2: Selección de comidas ======
  const renderStep2 = () => (
    <div className="gen-step gen-step-2">
      <div className="gen-step-header">
        <div className="gen-step-icon" style={{ background: '#5C6BC0' }}>
          <LucideIcon name="utensils" size={24} />
        </div>
        <div>
          <h3>Seleccionar Comidas</h3>
          <p>Activa los tipos de comida y agrega opciones (del catálogo o personalizadas)</p>
        </div>
      </div>

      {TIPOS_COMIDA.map(tipo => {
        const comida = comidas[tipo.key];
        return (
          <div key={tipo.key} className={`gen-comida-block ${comida.activo ? 'active' : ''}`}>
            {/* Header del tipo de comida */}
            <div
              className="gen-comida-header"
              style={comida.activo ? { borderColor: tipo.color, background: tipo.color + '10' } : {}}
              onClick={() => toggleComida(tipo.key)}
            >
              <div className="gen-comida-toggle">
                <div className={`gen-toggle-check ${comida.activo ? 'checked' : ''}`} style={comida.activo ? { background: tipo.color } : {}}>
                  {comida.activo && <LucideIcon name="check" size={14} />}
                </div>
                <span className="gen-comida-icon" style={{ color: tipo.color }}>
                  <LucideIcon name={tipo.icon} size={22} />
                </span>
                <div>
                  <span className="gen-comida-label">{tipo.label}</span>
                  <span className="gen-comida-hora">{tipo.hora} hrs</span>
                </div>
              </div>
              {comida.activo && comida.opciones.length > 0 && (
                <span className="gen-opciones-badge" style={{ background: tipo.color }}>
                  {comida.opciones.length} {comida.opciones.length === 1 ? 'opción' : 'opciones'}
                </span>
              )}
            </div>

            {/* Opciones de la comida */}
            {comida.activo && (
              <div className="gen-comida-body">
                {comida.opciones.map((opcion, opIdx) => (
                  <div key={opIdx} className="gen-opcion-card" style={{ borderLeftColor: tipo.color }}>
                    <div className="gen-opcion-header">
                      <span className="gen-opcion-num" style={{ background: tipo.color }}>
                        {opIdx + 1}
                      </span>
                      <span className="gen-opcion-nombre">
                        {opcion.nombre || 'Sin asignar'}
                        {opcion.receta_id && <span className="gen-from-catalog"> (catálogo)</span>}
                      </span>
                      <div className="gen-opcion-actions">
                        <button className="gen-btn-sm" onClick={() => openRecetaPicker(tipo.key, opIdx)} title="Buscar del catálogo">
                          <LucideIcon name="search" size={14} /> Catálogo
                        </button>
                        <button className="gen-btn-sm" onClick={() => openInlineForm(tipo.key, opIdx)} title="Crear manualmente">
                          <LucideIcon name="pen-line" size={14} /> Manual
                        </button>
                        <button className="gen-btn-sm delete" onClick={() => removeOpcion(tipo.key, opIdx)}>
                          <LucideIcon name="trash" size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Mini preview de la opción */}
                    {opcion.nombre && (
                      <div className="gen-opcion-preview">
                        {opcion.imagen_url && (
                          <img src={`${apiUrl}${opcion.imagen_url}`} alt="" className="gen-opcion-thumb" />
                        )}
                        <div className="gen-opcion-details">
                          {opcion.descripcion && <p className="gen-opcion-desc">{opcion.descripcion.length > 100 ? opcion.descripcion.substring(0, 100) + '...' : opcion.descripcion}</p>}
                          <div className="gen-opcion-macros">
                            {opcion.calorias > 0 && <span><LucideIcon name="flame" size={12} /> {Math.round(Number(opcion.calorias))} kcal</span>}
                            {opcion.proteinas > 0 && <span><LucideIcon name="beef" size={12} /> {opcion.proteinas}g P</span>}
                            {opcion.carbohidratos > 0 && <span><LucideIcon name="wheat" size={12} /> {opcion.carbohidratos}g C</span>}
                            {opcion.grasas > 0 && <span><LucideIcon name="droplet" size={12} /> {opcion.grasas}g G</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button className="gen-btn-add-opcion" style={{ color: tipo.color, borderColor: tipo.color }}
                  onClick={() => addOpcion(tipo.key)}>
                  <LucideIcon name="plus" size={16} /> Agregar opción
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ====== RENDER STEP 3: Preview ======
  const renderStep3 = () => {
    const preview = buildPreviewData();
    return (
      <div className="gen-step gen-step-3">
        <div className="gen-step-header">
          <div className="gen-step-icon" style={{ background: '#FF9800' }}>
            <LucideIcon name="eye" size={24} />
          </div>
          <div>
            <h3>Vista Previa</h3>
            <p>Así se verá el plan para tus usuarios</p>
          </div>
        </div>

        <VistaPlan plan={preview.plan} contenido={preview.contenido} />
      </div>
    );
  };

  return (
    <div className="gen-plan">
      {/* Header */}
      <div className="gen-plan-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <h2><LucideIcon name="clipboard" size={22} /> Generador de Plan Nutricional</h2>
      </div>

      {/* Stepper */}
      <div className="gen-stepper">
        {[
          { num: 1, label: 'Información', icon: 'clipboard', color: '#4CAF50' },
          { num: 2, label: 'Comidas', icon: 'utensils', color: '#5C6BC0' },
          { num: 3, label: 'Vista Previa', icon: 'eye', color: '#FF9800' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            {idx > 0 && <div className={`gen-stepper-line ${step > s.num - 1 ? 'active' : ''}`} />}
            <button
              className={`gen-stepper-step ${step === s.num ? 'current' : ''} ${step > s.num ? 'completed' : ''}`}
              style={step >= s.num ? { '--step-color': s.color } : {}}
              onClick={() => {
                if (s.num === 1) setStep(1);
                if (s.num === 2 && canGoToStep2) setStep(2);
                if (s.num === 3 && canGoToStep3) setStep(3);
              }}
            >
              <span className="gen-stepper-num" style={step >= s.num ? { background: s.color } : {}}>
                {step > s.num ? <LucideIcon name="check" size={16} /> : s.num}
              </span>
              <span className="gen-stepper-label">{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="gen-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Footer */}
      <div className="gen-footer">
        {step > 1 && (
          <button className="btn-secondary" onClick={() => setStep(step - 1)}>
            <LucideIcon name="arrow-left" size={16} /> Anterior
          </button>
        )}
        <div className="gen-footer-spacer" />
        {step < 3 && (
          <button
            className="btn-primary"
            disabled={step === 1 ? !canGoToStep2 : !canGoToStep3}
            onClick={() => setStep(step + 1)}
          >
            Siguiente <LucideIcon name="arrow-right" size={16} />
          </button>
        )}
        {step === 3 && (
          <button className="btn-primary gen-btn-save" onClick={handleSave} disabled={saving}>
            <LucideIcon name="save" size={16} /> {saving ? 'Guardando...' : 'Guardar Plan'}
          </button>
        )}
      </div>

      {/* ====== Modal: Receta Picker ====== */}
      {showRecetaPicker && (
        <div className="modal-overlay" onClick={() => setShowRecetaPicker(null)}>
          <div className="modal-content gen-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="search" size={20} /> Seleccionar del Catálogo</h2>
              <button className="modal-close" onClick={() => setShowRecetaPicker(null)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                type="text" className="form-input gen-picker-search"
                placeholder="Buscar receta..."
                value={searchReceta}
                onChange={e => setSearchReceta(e.target.value)}
                autoFocus
              />
              {filteredRecetas.length === 0 ? (
                <div className="gen-picker-empty">
                  <p>No hay recetas en el catálogo.</p>
                  <p>Puedes crear recetas desde el Catálogo de Recetas.</p>
                </div>
              ) : (
                <div className="gen-picker-list">
                  {filteredRecetas.map(receta => (
                    <div key={receta.id} className="gen-picker-item" onClick={() => selectReceta(receta)}>
                      {receta.imagen_url ? (
                        <img src={`${apiUrl}${receta.imagen_url}`} alt="" className="gen-picker-thumb" />
                      ) : (
                        <div className="gen-picker-placeholder">
                          <LucideIcon name="utensils" size={20} />
                        </div>
                      )}
                      <div className="gen-picker-info">
                        <h4>{receta.titulo}</h4>
                        {receta.descripcion && <p>{receta.descripcion.substring(0, 60)}...</p>}
                        <div className="gen-picker-macros">
                          {receta.calorias > 0 && <span><LucideIcon name="flame" size={11} /> {Math.round(receta.calorias)} kcal</span>}
                          {receta.proteinas > 0 && <span>{receta.proteinas}g P</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== Modal: Inline Recipe Form ====== */}
      {showInlineForm && (
        <div className="modal-overlay" onClick={() => setShowInlineForm(null)}>
          <div className="modal-content gen-inline-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="pen-line" size={20} /> Crear Receta Manual</h2>
              <button className="modal-close" onClick={() => setShowInlineForm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="gen-form-group">
                <label>Nombre *</label>
                <input type="text" className="form-input" value={inlineForm.nombre}
                  onChange={e => setInlineForm({ ...inlineForm, nombre: e.target.value })}
                  placeholder="Ej: Avena con frutos rojos" />
              </div>
              <div className="gen-form-group">
                <label>Descripción</label>
                <textarea className="form-input form-textarea" rows="2" value={inlineForm.descripcion}
                  onChange={e => setInlineForm({ ...inlineForm, descripcion: e.target.value })}
                  placeholder="Descripción breve..." />
              </div>

              <div className="gen-macros-grid">
                <div className="gen-macro-input">
                  <label>Calorías</label>
                  <input type="number" className="form-input" value={inlineForm.calorias}
                    onChange={e => setInlineForm({ ...inlineForm, calorias: e.target.value })} />
                </div>
                <div className="gen-macro-input">
                  <label>Proteínas (g)</label>
                  <input type="number" className="form-input" value={inlineForm.proteinas}
                    onChange={e => setInlineForm({ ...inlineForm, proteinas: e.target.value })} />
                </div>
                <div className="gen-macro-input">
                  <label>Carbos (g)</label>
                  <input type="number" className="form-input" value={inlineForm.carbohidratos}
                    onChange={e => setInlineForm({ ...inlineForm, carbohidratos: e.target.value })} />
                </div>
                <div className="gen-macro-input">
                  <label>Grasas (g)</label>
                  <input type="number" className="form-input" value={inlineForm.grasas}
                    onChange={e => setInlineForm({ ...inlineForm, grasas: e.target.value })} />
                </div>
              </div>

              {/* Ingredientes */}
              <div className="gen-section-title">
                Ingredientes
                <button className="gen-btn-add" onClick={() =>
                  setInlineForm({ ...inlineForm, ingredientes: [...inlineForm.ingredientes, { nombre: '', cantidad: '', unidad: '' }] })
                }>
                  <LucideIcon name="plus" size={14} /> Agregar
                </button>
              </div>
              {inlineForm.ingredientes.map((ing, idx) => (
                <div key={idx} className="gen-ing-row">
                  <input type="text" className="form-input" placeholder="Ingrediente"
                    value={ing.nombre} onChange={e => {
                      const u = [...inlineForm.ingredientes]; u[idx] = { ...u[idx], nombre: e.target.value };
                      setInlineForm({ ...inlineForm, ingredientes: u });
                    }} />
                  <input type="text" className="form-input small" placeholder="Cant"
                    value={ing.cantidad} onChange={e => {
                      const u = [...inlineForm.ingredientes]; u[idx] = { ...u[idx], cantidad: e.target.value };
                      setInlineForm({ ...inlineForm, ingredientes: u });
                    }} />
                  <input type="text" className="form-input small" placeholder="Unidad"
                    value={ing.unidad} onChange={e => {
                      const u = [...inlineForm.ingredientes]; u[idx] = { ...u[idx], unidad: e.target.value };
                      setInlineForm({ ...inlineForm, ingredientes: u });
                    }} />
                  {inlineForm.ingredientes.length > 1 && (
                    <button className="gen-btn-remove" onClick={() =>
                      setInlineForm({ ...inlineForm, ingredientes: inlineForm.ingredientes.filter((_, i) => i !== idx) })
                    }>✕</button>
                  )}
                </div>
              ))}

              {/* Instrucciones */}
              <div className="gen-section-title">
                Preparación
                <button className="gen-btn-add" onClick={() =>
                  setInlineForm({ ...inlineForm, instrucciones: [...inlineForm.instrucciones, ''] })
                }>
                  <LucideIcon name="plus" size={14} /> Agregar paso
                </button>
              </div>
              {inlineForm.instrucciones.map((paso, idx) => (
                <div key={idx} className="gen-instruc-row">
                  <span className="gen-paso-num">{idx + 1}.</span>
                  <textarea className="form-input form-textarea" rows="2"
                    placeholder={`Paso ${idx + 1}...`}
                    value={paso}
                    onChange={e => {
                      const u = [...inlineForm.instrucciones]; u[idx] = e.target.value;
                      setInlineForm({ ...inlineForm, instrucciones: u });
                    }} />
                  {inlineForm.instrucciones.length > 1 && (
                    <button className="gen-btn-remove" onClick={() =>
                      setInlineForm({ ...inlineForm, instrucciones: inlineForm.instrucciones.filter((_, i) => i !== idx) })
                    }>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowInlineForm(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveInlineForm} disabled={!inlineForm.nombre.trim()}>
                <LucideIcon name="check" size={16} /> Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneradorPlan;
