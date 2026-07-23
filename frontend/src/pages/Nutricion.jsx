import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import VoiceHelper from '../components/VoiceHelper';
import LucideIcon from '../components/LucideIcon';
import VistaEquivalentes, { limpiarAlimentos } from '../components/nutricion/VistaEquivalentes';
import VistaPlan from '../components/nutricion/VistaPlan';
import SeguimientoPeso from '../components/nutricion/SeguimientoPeso';
import '../styles/Nutricion.css';

const Nutricion = () => {
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('diario');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener paciente_id con fallback al user.id
  const pacienteId = user?.paciente_id || user?.id;

  // Datos del día
  const [resumenDia, setResumenDia] = useState({
    calorias: { consumidas: 0, objetivo: 2200 },
    carbohidratos: { consumidas: 0, objetivo: 250 },
    proteinas: { consumidas: 0, objetivo: 120 },
    grasas: { consumidas: 0, objetivo: 70 }
  });

  // Agua
  const [agua, setAgua] = useState({
    consumida: 0,
    objetivo: 2.0,
    vasos: Array(8).fill(false)
  });

  // Comidas del día
  const [comidas, setComidas] = useState({
    desayuno: { items: [], calorias: 0, objetivo: 550 },
    almuerzo: { items: [], calorias: 0, objetivo: 750 },
    cena: { items: [], calorias: 0, objetivo: 600 },
    snacks: { items: [], calorias: 0, objetivo: 300 }
  });

  // Historial
  const [historialDias, setHistorialDias] = useState({});

  // Plan nutricional asignado
  const [planAsignado, setPlanAsignado] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Checklist de equivalentes
  const [equivalentesCheck, setEquivalentesCheck] = useState({});

  // Recetas
  const [recetas, setRecetas] = useState([]);

  // Modales
  const [showAddFood, setShowAddFood] = useState(false);
  const [tipoComidaActual, setTipoComidaActual] = useState('desayuno');
  const [alimentosBusqueda, setAlimentosBusqueda] = useState('');
  const [registrando, setRegistrando] = useState(false);

  // Alimentos predefinidos
  const alimentosPredefinidos = [
    { id: 1, nombre: 'Avena con frutas', calorias: 250, carbohidratos: 45, proteinas: 8, grasas: 5 },
    { id: 2, nombre: 'Huevos revueltos', calorias: 180, carbohidratos: 2, proteinas: 14, grasas: 12 },
    { id: 3, nombre: 'Pan integral con aguacate', calorias: 220, carbohidratos: 25, proteinas: 5, grasas: 12 },
    { id: 4, nombre: 'Yogurt natural con granola', calorias: 200, carbohidratos: 30, proteinas: 10, grasas: 5 },
    { id: 5, nombre: 'Fruta picada (manzana, plátano)', calorias: 120, carbohidratos: 30, proteinas: 1, grasas: 0 },
    { id: 6, nombre: 'Pollo a la plancha', calorias: 165, carbohidratos: 0, proteinas: 31, grasas: 4 },
    { id: 7, nombre: 'Arroz integral', calorias: 130, carbohidratos: 28, proteinas: 3, grasas: 1 },
    { id: 8, nombre: 'Ensalada verde', calorias: 50, carbohidratos: 10, proteinas: 2, grasas: 0 },
    { id: 9, nombre: 'Sopa de verduras', calorias: 80, carbohidratos: 15, proteinas: 3, grasas: 1 },
    { id: 10, nombre: 'Pescado al horno', calorias: 200, carbohidratos: 0, proteinas: 25, grasas: 10 }
  ];

  useEffect(() => {
    cargarPlanNutricional();
  }, [pacienteId]);

  useEffect(() => {
    cargarDatosDia();
    cargarChecklist();
  }, [selectedDate]);

  const getChecklistKey = () => {
    const fechaStr = selectedDate.toISOString().split('T')[0];
    return `nutricion-checklist-${pacienteId}-${fechaStr}`;
  };

  const cargarChecklist = () => {
    try {
      const saved = localStorage.getItem(getChecklistKey());
      setEquivalentesCheck(saved ? JSON.parse(saved) : {});
    } catch {
      setEquivalentesCheck({});
    }
  };

  const handleCheckToggle = (key, value) => {
    setEquivalentesCheck(prev => {
      const updated = { ...prev, [key]: value };
      if (value === 0) delete updated[key];
      localStorage.setItem(getChecklistKey(), JSON.stringify(updated));
      return updated;
    });
  };

  // Sincronización automática de metas con el especialista
  useEffect(() => {
    if (planAsignado?.tiene_plan) {
      sincronizarObjetivosConPlan(planAsignado);
    }
  }, [planAsignado]);

  const cargarDatosDia = async () => {
    setLoading(true);
    const fechaStr = selectedDate.toISOString().split('T')[0];

    try {
      const response = await api.get(`/nutricion/resumen/${pacienteId}/${fechaStr}`);
      if (response.data) {
        setResumenDia(response.data.macros || resumenDia);
        setComidas(response.data.comidas || comidas);
        setAgua(response.data.agua || agua);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarObjetivosConPlan = (plan = planAsignado) => {
    if (!plan?.tiene_plan) return;

    const caloriasTotales = Number(plan.calorias_diarias) || Number(plan.contenido?.totales?.calorias) || 2200;
    const proteinasTotales = Number(plan.proteinas_g) || Number(plan.contenido?.totales?.proteinas) || 120;
    const carbosTotales = Number(plan.carbohidratos_g) || Number(plan.contenido?.totales?.carbohidratos) || 250;
    const grasasTotales = Number(plan.grasas_g) || Number(plan.contenido?.totales?.grasas) || 70;

    setResumenDia(prev => ({
      ...prev,
      calorias: { ...prev.calorias, objetivo: caloriasTotales },
      proteinas: { ...prev.proteinas, objetivo: Math.round(proteinasTotales) },
      carbohidratos: { ...prev.carbohidratos, objetivo: Math.round(carbosTotales) },
      grasas: { ...prev.grasas, objetivo: Math.round(grasasTotales) }
    }));
  };

  const cargarPlanNutricional = async () => {
    if (!pacienteId) return;

    setLoadingPlan(true);
    try {
      const response = await api.get(`/nutricion/plan-paciente/${pacienteId}`);
      let data = response?.data?.data || response?.data || response;

      if (data && data.tiene_plan) {
        setPlanAsignado(data);
        if (data.contenido?.comidas) {
          setRecetas(data.contenido.comidas);
        }
        sincronizarObjetivosConPlan(data);
      } else {
        setPlanAsignado(data);
      }
    } catch (err) {
      console.error('Error al cargar plan:', err);
      setPlanAsignado(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const agregarVasoAgua = () => {
    const nuevosVasos = [...agua.vasos];
    const indexVacio = nuevosVasos.findIndex(v => !v);
    if (indexVacio !== -1) {
      nuevosVasos[indexVacio] = true;
      const nuevaConsumida = nuevosVasos.filter(v => v).length * 0.25;
      setAgua({ ...agua, vasos: nuevosVasos, consumida: nuevaConsumida });
    }
  };

  const quitarVasoAgua = () => {
    const nuevosVasos = [...agua.vasos];
    const indexLleno = nuevosVasos.map((v, i) => v ? i : -1).filter(i => i !== -1).pop();
    if (indexLleno !== undefined) {
      nuevosVasos[indexLleno] = false;
      const nuevaConsumida = nuevosVasos.filter(v => v).length * 0.25;
      setAgua({ ...agua, vasos: nuevosVasos, consumida: nuevaConsumida });
    }
  };

  const abrirAgregarComida = (tipo) => {
    setTipoComidaActual(tipo);
    setAlimentosBusqueda('');
    setShowAddFood(true);
  };

  const registrarAlimento = async (alimento) => {
    setRegistrando(true);
    try {
      const nuevasComidas = { ...comidas };
      nuevasComidas[tipoComidaActual].items.push(alimento);
      nuevasComidas[tipoComidaActual].calorias += alimento.calorias;
      setComidas(nuevasComidas);

      setResumenDia(prev => ({
        ...prev,
        calorias: { ...prev.calorias, consumidas: prev.calorias.consumidas + alimento.calorias },
        carbohidratos: { ...prev.carbohidratos, consumidas: prev.carbohidratos.consumidas + alimento.carbohidratos },
        proteinas: { ...prev.proteinas, consumidas: prev.proteinas.consumidas + alimento.proteinas },
        grasas: { ...prev.grasas, consumidas: prev.grasas.consumidas + alimento.grasas }
      }));

      setShowAddFood(false);
    } catch (err) {
      console.error('Error al registrar alimento:', err);
    } finally {
      setRegistrando(false);
    }
  };

  const formatearFecha = (fecha) => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(selectedDate);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    if (nuevaFecha <= new Date()) {
      setSelectedDate(nuevaFecha);
    }
  };

  return (
    <div className="nutricion-page-original">
      <VoiceHelper currentModule="nutricion" />

      {/* Header Estilo Imagen Original */}
      <header className="nutricion-top-header">
        <div className="header-title-row">
          <div className="header-icon-box"><LucideIcon name="apple" size={20} /></div>
          <div className="header-text-box">
            <h1>Nutrición</h1>
            <p>Plan diario de alimentación</p>
          </div>
        </div>
        <button className="header-settings-btn" onClick={() => setShowCalendar(true)}>
          <LucideIcon name="calendar" size={18} />
        </button>
      </header>

      {/* Barra de Navegación de Fecha Estilo Imagen */}
      <div className="nutricion-date-bar">
        <button className="date-nav-arrow" onClick={() => cambiarDia(-1)}>‹</button>
        <div className="date-center-display" onClick={() => setShowCalendar(true)}>
          <span className="date-main-label">{formatearFecha(selectedDate)}</span>
          <span className="date-sub-label">{selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <button 
          className="date-nav-arrow" 
          onClick={() => cambiarDia(1)}
          disabled={selectedDate.toDateString() === new Date().toDateString()}
        >
          ›
        </button>
      </div>

      {/* Pestañas de Navegación Originales con el Apartado de Plan de Porciones Nutricionales al lado */}
      <div className="nutricion-tabs-original">
        <button 
          className={`tab-btn-orig ${activeTab === 'diario' ? 'active' : ''}`}
          onClick={() => setActiveTab('diario')}
        >
          Diario
        </button>
        <button 
          className={`tab-btn-orig ${activeTab === 'plan_porciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan_porciones')}
        >
          Plan de Porciones Nutricionales
        </button>
        <button 
          className={`tab-btn-orig ${activeTab === 'recetas' ? 'active' : ''}`}
          onClick={() => setActiveTab('recetas')}
        >
          Mi Plan / Recetas
        </button>
        <button 
          className={`tab-btn-orig ${activeTab === 'peso' ? 'active' : ''}`}
          onClick={() => setActiveTab('peso')}
        >
          Mi Peso
        </button>
      </div>

      <div className="nutricion-main-content">
        {activeTab === 'diario' && (
          <>
            {/* Metas Diarias idénticas a la imagen de referencia */}
            <section className="metas-diarias-section">
              <div className="metas-header-row">
                <h3><LucideIcon name="target" size={16} /> Metas Diarias</h3>
                <span className="nutriologo-badge-tag">Nutriólogo asignado</span>
              </div>
              <div className="metas-grid-cards">
                <div className="meta-card-item calorias">
                  <div className="meta-card-icon"><LucideIcon name="flame" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.calorias.objetivo}</span>
                    <span className="meta-lbl">Calorías</span>
                  </div>
                </div>
                <div className="meta-card-item proteinas">
                  <div className="meta-card-icon"><LucideIcon name="beef" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.proteinas.objetivo}g</span>
                    <span className="meta-lbl">Proteínas</span>
                  </div>
                </div>
                <div className="meta-card-item carbos">
                  <div className="meta-card-icon"><LucideIcon name="wheat" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.carbohidratos.objetivo}g</span>
                    <span className="meta-lbl">Carbohidratos</span>
                  </div>
                </div>
                <div className="meta-card-item grasas">
                  <div className="meta-card-icon"><LucideIcon name="droplet" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.grasas.objetivo}g</span>
                    <span className="meta-lbl">Grasas</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Apartado Alimentos Equivalentes idéntico en diseño y estructura */}
            <section className="alimentos-equivalentes-container">
              <div className="equivalentes-title-bar">
                <LucideIcon name="apple" size={18} />
                <h2>Alimentos Equivalentes</h2>
              </div>

              {planAsignado?.tiene_plan && planAsignado.contenido?.cuadro_equivalentes?.grupos?.length > 0 ? (
                <div className="equivalentes-accordion-list">
                  {planAsignado.contenido.cuadro_equivalentes.grupos.map((grupo, gIdx) => {
                    const alimentosGrupo = planAsignado.contenido?.grupos_alimentos?.find(g => g.nombre === grupo.nombre)?.alimentos || [];
                    const limpioAlimentos = limpiarAlimentos(alimentosGrupo);
                    const totalEquivs = grupo.equivalentes?.reduce((a, b) => a + b, 0) || 0;

                    return (
                      <details key={gIdx} className="equiv-group-accordion" open={gIdx === 0}>
                        <summary className="equiv-group-header">
                          <div className="equiv-group-left">
                            <span className="equiv-group-dot-icon"><LucideIcon name="circle" size={10} /></span>
                            <span className="equiv-group-title-text">{grupo.nombre}</span>
                          </div>
                          <div className="equiv-group-right">
                            <span className="equiv-group-count-sub">{totalEquivs > 0 ? `${totalEquivs} equivalentes` : 'Ver opciones'}</span>
                            <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                          </div>
                        </summary>
                        <div className="equiv-group-content-list">
                          {limpioAlimentos.length > 0 ? (
                            limpioAlimentos.map((alimento, aIdx) => (
                              <div key={aIdx} className="equiv-food-row-item">
                                <span className="equiv-food-name-dot">· {alimento.nombre}</span>
                                <span className="equiv-food-porcion-badge">{alimento.equivalente || '1 porción'}</span>
                              </div>
                            ))
                          ) : (
                            <div className="equiv-food-row-item">
                              <span className="equiv-food-name-dot">· Sin alimentos registrados en este grupo</span>
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              ) : (
                /* Diseño estático por defecto idéntico a la captura si no hay plan personalizado */
                <div className="equivalentes-accordion-list">
                  <details className="equiv-group-accordion" open>
                    <summary className="equiv-group-header">
                      <div className="equiv-group-left">
                        <span className="equiv-group-dot-icon"><LucideIcon name="circle" size={10} /></span>
                        <span className="equiv-group-title-text">Frutas</span>
                      </div>
                      <div className="equiv-group-right">
                        <span className="equiv-group-count-sub">3 equivalentes</span>
                        <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                      </div>
                    </summary>
                    <div className="equiv-group-content-list">
                      <div className="equiv-food-row-item">
                        <span className="equiv-food-name-dot">· Manzana</span>
                        <span className="equiv-food-porcion-badge">1 porción</span>
                      </div>
                      <div className="equiv-food-row-item">
                        <span className="equiv-food-name-dot">· Plátano</span>
                        <span className="equiv-food-porcion-badge">1 porción</span>
                      </div>
                      <div className="equiv-food-row-item">
                        <span className="equiv-food-name-dot">· Papaya</span>
                        <span className="equiv-food-porcion-badge">1 porción</span>
                      </div>
                    </div>
                  </details>

                  <details className="equiv-group-accordion">
                    <summary className="equiv-group-header">
                      <div className="equiv-group-left">
                        <span className="equiv-group-dot-icon"><LucideIcon name="circle" size={10} /></span>
                        <span className="equiv-group-title-text">Cereales</span>
                      </div>
                      <div className="equiv-group-right">
                        <span className="equiv-group-count-sub">5 equivalentes</span>
                        <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                      </div>
                    </summary>
                  </details>

                  <details className="equiv-group-accordion">
                    <summary className="equiv-group-header">
                      <div className="equiv-group-left">
                        <span className="equiv-group-dot-icon"><LucideIcon name="circle" size={10} /></span>
                        <span className="equiv-group-title-text">Proteínas</span>
                      </div>
                      <div className="equiv-group-right">
                        <span className="equiv-group-count-sub">4 equivalentes</span>
                        <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                      </div>
                    </summary>
                  </details>

                  <details className="equiv-group-accordion" open>
                    <summary className="equiv-group-header">
                      <div className="equiv-group-left">
                        <span className="equiv-group-dot-icon"><LucideIcon name="circle" size={10} /></span>
                        <span className="equiv-group-title-text">Grasas</span>
                      </div>
                      <div className="equiv-group-right">
                        <span className="equiv-group-count-sub">2 equivalentes</span>
                        <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                      </div>
                    </summary>
                    <div className="equiv-group-content-list">
                      <div className="equiv-food-row-item">
                        <span className="equiv-food-name-dot">· Aguacate</span>
                        <span className="equiv-food-porcion-badge">1 porción</span>
                      </div>
                      <div className="equiv-food-row-item">
                        <span className="equiv-food-name-dot">· Nueces</span>
                        <span className="equiv-food-porcion-badge">1 porción</span>
                      </div>
                      <div className="equiv-food-row-item">
                        <span className="equiv-food-name-dot">· Aceite de oliva</span>
                        <span className="equiv-food-porcion-badge">1 porción</span>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </section>

            {/* Sección Recomendaciones idéntica a la imagen */}
            <section className="recomendaciones-box-card">
              <div className="recomendaciones-title-row">
                <LucideIcon name="check-square" size={16} />
                <h2>Recomendaciones</h2>
              </div>
              <ul className="recomendaciones-check-list">
                {planAsignado?.contenido?.recomendaciones?.length > 0 ? (
                  planAsignado.contenido.recomendaciones.map((rec, idx) => (
                    <li key={idx}><span className="check-mark-icon">✓</span> {rec}</li>
                  ))
                ) : (
                  <>
                    <li><span className="check-mark-icon">✓</span> Consumir agua constantemente durante el día.</li>
                    <li><span className="check-mark-icon">✓</span> Evitar alimentos ultra procesados.</li>
                    <li><span className="check-mark-icon">✓</span> Mantener horarios de comida estables.</li>
                    <li><span className="check-mark-icon">✓</span> Priorizar verduras y frutas frescas.</li>
                  </>
                )}
              </ul>
            </section>

            {/* Recetas sugeridas idénticas a la imagen de referencia */}
            <section className="recetas-sugeridas-section">
              <div className="recetas-sug-title-row">
                <LucideIcon name="search" size={16} />
                <h2>Recetas sugeridas</h2>
              </div>
              <div className="receta-banner-card">
                <div className="receta-banner-img-wrap">
                  <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80" alt="Ensalada Balanceada" />
                </div>
                <div className="receta-banner-details">
                  <h3>Ensalada Balanceada</h3>
                  <div className="receta-tags-row">
                    <span className="tag-tipo-comida">Almuerzo</span>
                    <span className="tag-kcal-info"><LucideIcon name="flame" size={12} /> 320 kcal</span>
                    <span className="tag-prot-info"><LucideIcon name="beef" size={12} /> 25g proteina</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Apartado Plan de Porciones Nutricionales (funcional con menú desplegable sincronizado con el especialista) */}
        {activeTab === 'plan_porciones' && (
          <div className="plan-porciones-tab-container">
            {planAsignado?.tiene_plan ? (
              <>
                <section className="plan-resumen-section">
                  <div className="plan-resumen-header">
                    <h2><LucideIcon name="clipboard-list" size={18} /> {planAsignado.nombre || 'Plan de Porciones Nutricionales'}</h2>
                    {planAsignado.especialista_nombre && (
                      <span className="plan-especialista">
                        <LucideIcon name="stethoscope" size={14} /> {planAsignado.especialista_nombre}
                      </span>
                    )}
                  </div>

                  <div className="plan-macros-grid">
                    <div className="plan-macro-card calorias">
                      <div className="plan-macro-icon"><LucideIcon name="flame" size={18} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">{resumenDia.calorias.objetivo}</span>
                        <span className="plan-macro-label">kcal/día</span>
                      </div>
                    </div>
                    <div className="plan-macro-card proteinas">
                      <div className="plan-macro-icon"><LucideIcon name="beef" size={18} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">{resumenDia.proteinas.objetivo}</span>
                        <span className="plan-macro-label">g proteínas</span>
                      </div>
                    </div>
                    <div className="plan-macro-card carbos">
                      <div className="plan-macro-icon"><LucideIcon name="wheat" size={18} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">{resumenDia.carbohidratos.objetivo}</span>
                        <span className="plan-macro-label">g carbohidratos</span>
                      </div>
                    </div>
                    <div className="plan-macro-card grasas">
                      <div className="plan-macro-icon"><LucideIcon name="droplet" size={18} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">{resumenDia.grasas.objetivo}</span>
                        <span className="plan-macro-label">g grasas</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Menú desplegable detallado por tiempo de comida e indicador de porciones */}
                {planAsignado.contenido?.cuadro_equivalentes?.grupos?.length > 0 && (() => {
                  const cuadro = planAsignado.contenido.cuadro_equivalentes;
                  const tiempos = cuadro.tiempos || [];
                  const grupos = cuadro.grupos || [];
                  const gruposAlimentos = planAsignado.contenido?.grupos_alimentos || [];
                  const ICONOS_TIEMPO = {
                    'Desayuno': 'sunrise', 'Colación 1': 'apple', 'Comida': 'utensils',
                    'Colación 2': 'cookie', 'Cena': 'moon'
                  };

                  const getAlimentosForGrupo = (nombreGrupo) => {
                    const grupoData = gruposAlimentos.find(g => g.nombre === nombreGrupo);
                    if (!grupoData?.alimentos?.length) return [];
                    return limpiarAlimentos(grupoData.alimentos);
                  };

                  return (
                    <section className="alimentos-equivalentes-container">
                      <div className="equivalentes-title-bar">
                        <LucideIcon name="clipboard-list" size={18} />
                        <h2>Desglose de Porciones por Comida</h2>
                      </div>
                      <div className="equivalentes-accordion-list">
                        {tiempos.map((tiempo, tIdx) => {
                          const gruposActivos = grupos
                            .map((g, gIdx) => ({ nombre: g.nombre, cantidad: g.equivalentes?.[tIdx] || 0 }))
                            .filter(g => g.cantidad > 0);

                          if (gruposActivos.length === 0) return null;

                          return (
                            <details key={tIdx} className="equiv-group-accordion" open={tIdx === 0}>
                              <summary className="equiv-group-header">
                                <div className="equiv-group-left">
                                  <span className="equiv-group-dot-icon"><LucideIcon name={ICONOS_TIEMPO[tiempo] || 'utensils'} size={14} /></span>
                                  <span className="equiv-group-title-text">{tiempo}</span>
                                </div>
                                <div className="equiv-group-right">
                                  <span className="equiv-group-count-sub">{gruposActivos.length} grupos</span>
                                  <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                                </div>
                              </summary>
                              <div className="equiv-group-content-list">
                                {gruposActivos.map((g, i) => {
                                  const alimentos = getAlimentosForGrupo(g.nombre);
                                  return (
                                    <div key={i} className="equiv-food-row-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-width', width: '100%', justifyContent: 'space-between' }}>
                                        <span className="equiv-food-name-dot"><strong>{g.nombre}</strong></span>
                                        <span className="equiv-food-porcion-badge">{g.cantidad} porciones</span>
                                      </div>
                                      {alimentos.length > 0 && (
                                        <div style={{ paddingLeft: '12px', fontSize: '12px', color: '#8B949E' }}>
                                          {alimentos.slice(0, 3).map((a, aIdx) => (
                                            <div key={aIdx}>· {a.nombre} ({a.equivalente || '1 porción'})</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </section>
                  );
                })()}
              </>
            ) : (
              <section className="plan-empty-section" style={{ textAlign: 'center', padding: '40px', background: '#161B22', borderRadius: '12px', color: '#8B949E' }}>
                <LucideIcon name="salad" size={40} />
                <h3 style={{ color: '#E6EDF3', marginTop: '12px' }}>Sin plan de porciones asignado</h3>
                <p>Tu especialista asignará las calorías, grasas, porciones y recomendaciones desde su panel para reflejarse aquí automáticamente.</p>
              </section>
            )}
          </div>
        )}

        {activeTab === 'recetas' && (
          <>
            {loadingPlan ? (
              <div className="loading-state"><div className="loading-spinner"></div><p>Cargando tu plan nutricional...</p></div>
            ) : planAsignado?.tiene_plan ? (
              <VistaEquivalentes plan={planAsignado} contenido={planAsignado.contenido} pacienteView />
            ) : (
              <section className="plan-empty-section" style={{ textAlign: 'center', padding: '40px', background: '#161B22', borderRadius: '12px', color: '#8B949E' }}>
                <LucideIcon name="clipboard-list" size={40} />
                <h3 style={{ color: '#E6EDF3', marginTop: '12px' }}>Sin plan nutricional asignado</h3>
                <p>Tu nutriólogo te asignará un plan personalizado para apoyar tu recuperación.</p>
              </section>
            )}
          </>
        )}

        {activeTab === 'peso' && (
          <SeguimientoPeso pacienteId={pacienteId} onBack={() => setActiveTab('diario')} />
        )}
      </div>

      {/* Modal Calendario */}
      {showCalendar && (
        <div className="modal-overlay" onClick={() => setShowCalendar(false)}>
          <div className="modal-content calendar-modal" onClick={e => e.stopPropagation()}>
            <div className="calendar-header">
              <button className="modal-close" onClick={() => setShowCalendar(false)}>×</button>
              <h2>{selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="calendar-nav">
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>‹</button>
              <span>{selectedDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>›</button>
            </div>
          </div>
        </div>
      )}

      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default Nutricion;