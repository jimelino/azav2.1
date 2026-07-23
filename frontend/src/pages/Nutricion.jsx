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
    calorias: { consumidas: 0, objetivo: 1800 },
    carbohidratos: { consumidas: 0, objetivo: 167 },
    proteinas: { consumidas: 0, objetivo: 93 },
    grasas: { consumidas: 0, objetivo: 49 }
  });

  // Agua
  const [agua, setAgua] = useState({
    consumida: 0,
    objetivo: 2.0,
    vasos: Array(8).fill(false)
  });

  // Comidas del día
  const [comidas, setComidas] = useState({
    desayuno: { items: [], calorias: 0, objetivo: 450 },
    almuerzo: { items: [], calorias: 0, objetivo: 550 },
    cena: { items: [], calorias: 0, objetivo: 450 },
    snacks: { items: [], calorias: 0, objetivo: 200 }
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
    { id: 10, nombre: 'Pescado al horno', calorias: 200, carbohidratos: 0, proteinas: 25, grasas: 10 },
    { id: 11, nombre: 'Lentejas guisadas', calorias: 180, carbohidratos: 30, proteinas: 12, grasas: 1 },
    { id: 12, nombre: 'Verduras al vapor', calorias: 60, carbohidratos: 12, proteinas: 3, grasas: 0 },
    { id: 13, nombre: 'Tortilla de maíz (2 pzas)', calorias: 100, carbohidratos: 20, proteinas: 3, grasas: 1 },
    { id: 14, nombre: 'Frijoles de olla', calorias: 140, carbohidratos: 25, proteinas: 9, grasas: 1 },
    { id: 15, nombre: 'Manzana', calorias: 58, carbohidratos: 14, proteinas: 0, grasas: 0 },
    { id: 16, nombre: 'Plátano', calorias: 89, carbohidratos: 23, proteinas: 1, grasas: 0 },
    { id: 17, nombre: 'Almendras (puño)', calorias: 160, carbohidratos: 6, proteinas: 6, grasas: 14 },
    { id: 18, nombre: 'Leche descremada', calorias: 90, carbohidratos: 12, proteinas: 8, grasas: 0 },
    { id: 19, nombre: 'Queso panela', calorias: 80, carbohidratos: 1, proteinas: 10, grasas: 4 },
    { id: 20, nombre: 'Atún en agua', calorias: 100, carbohidratos: 0, proteinas: 22, grasas: 1 }
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

  useEffect(() => {
    const tieneCaloriasPlan = planAsignado?.tiene_plan && (
      planAsignado.calorias_diarias > 0 ||
      planAsignado.contenido?.totales?.calorias > 0
    );

    if (tieneCaloriasPlan) {
      sincronizarObjetivosConPlan();
    }
  }, [planAsignado]);

  const cargarDatosDia = async () => {
    setLoading(true);
    const fechaStr = selectedDate.toISOString().split('T')[0];

    try {
      const response = await api.get(`/nutricion/resumen/${pacienteId}/${fechaStr}`);
      if (response.data) {
        const objetivoActual = resumenDia.calorias.objetivo;
        const nuevosMacros = response.data.macros || resumenDia;

        if (planAsignado?.tiene_plan && objetivoActual !== 1800) {
          nuevosMacros.calorias.objetivo = objetivoActual;
          nuevosMacros.proteinas.objetivo = resumenDia.proteinas.objetivo;
          nuevosMacros.carbohidratos.objetivo = resumenDia.carbohidratos.objetivo;
          nuevosMacros.grasas.objetivo = resumenDia.grasas.objetivo;
        }

        setResumenDia(nuevosMacros);
        setComidas(response.data.comidas || comidas);
        setAgua(response.data.agua || agua);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      const ejemplos = getDatosEjemplo();
      if (planAsignado?.tiene_plan) {
        ejemplos.macros.calorias.objetivo = resumenDia.calorias.objetivo;
        ejemplos.macros.proteinas.objetivo = resumenDia.proteinas.objetivo;
        ejemplos.macros.carbohidratos.objetivo = resumenDia.carbohidratos.objetivo;
        ejemplos.macros.grasas.objetivo = resumenDia.grasas.objetivo;
      }
      setResumenDia(ejemplos.macros);
      setComidas(ejemplos.comidas);
    } finally {
      setLoading(false);
    }
  };

  const getDatosEjemplo = () => ({
    macros: {
      calorias: { consumidas: 308, objetivo: 1518 },
      carbohidratos: { consumidas: 28, objetivo: 167 },
      proteinas: { consumidas: 20, objetivo: 93 },
      grasas: { consumidas: 12, objetivo: 49 }
    },
    comidas: {
      desayuno: {
        items: [{ id: 1, nombre: 'Avena con frutas', calorias: 250, carbohidratos: 45, proteinas: 8, grasas: 5 }],
        calorias: 250,
        objetivo: 450
      },
      almuerzo: { items: [], calorias: 0, objetivo: 550 },
      cena: { items: [], calorias: 0, objetivo: 450 },
      snacks: {
        items: [{ id: 2, nombre: 'Manzana', calorias: 58, carbohidratos: 14, proteinas: 0, grasas: 0 }],
        calorias: 58,
        objetivo: 200
      }
    }
  });

  const sincronizarObjetivosConPlan = (plan = planAsignado) => {
    if (!plan?.tiene_plan) return;

    const caloriasDirectas = Number(plan.calorias_diarias) || 0;
    const caloriasContenido = Number(plan.contenido?.totales?.calorias) || 0;

    const caloriasTotales = caloriasDirectas > 0 ? caloriasDirectas : (caloriasContenido > 0 ? caloriasContenido : 1800);
    const proteinasTotales = Number(plan.proteinas_g) || Number(plan.contenido?.totales?.proteinas) || 93;
    const carbosTotales = Number(plan.carbohidratos_g) || Number(plan.contenido?.totales?.carbohidratos) || 167;
    const grasasTotales = Number(plan.grasas_g) || Number(plan.contenido?.totales?.grasas) || 49;

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
        if (!data.calorias_diarias && data.contenido?.totales?.calorias) {
          data.calorias_diarias = data.contenido.totales.calorias;
        }
        if (!data.proteinas_g && data.contenido?.totales?.proteinas) {
          data.proteinas_g = data.contenido.totales.proteinas;
        }
        if (!data.carbohidratos_g && data.contenido?.totales?.carbohidratos) {
          data.carbohidratos_g = data.contenido.totales.carbohidratos;
        }
        if (!data.grasas_g && data.contenido?.totales?.grasas) {
          data.grasas_g = data.contenido.totales.grasas;
        }

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
      setRecetas([]);
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

  const getAlimentosDelPlan = () => {
    if (!planAsignado?.contenido?.comidas) return [];
    let alimentosPlan = [];
    let idCounter = 1000;
    planAsignado.contenido.comidas.forEach(comida => {
      if (comida.opciones && comida.opciones.length > 0) {
        comida.opciones.forEach(opcion => {
          alimentosPlan.push({
            id: idCounter++,
            nombre: opcion.nombre,
            calorias: opcion.calorias_estimadas || 0,
            carbohidratos: opcion.carbohidratos_estimados || 0,
            proteinas: opcion.proteinas_estimadas || 0,
            grasas: opcion.grasas_estimadas || 0,
            esDelPlan: true,
            esRelevante: true
          });
        });
      }
    });
    return alimentosPlan;
  };

  const getAlimentosFiltrados = () => {
    const alimentosPlan = getAlimentosDelPlan();
    if (!alimentosBusqueda.trim()) {
      return [...alimentosPlan, ...alimentosPredefinidos];
    }
    const busqueda = alimentosBusqueda.toLowerCase();
    return [...alimentosPlan, ...alimentosPredefinidos].filter(a => a.nombre.toLowerCase().includes(busqueda));
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

  const getSemanaDelMes = () => {
    const primerDiaMes = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const diasTranscurridos = Math.ceil((selectedDate - primerDiaMes) / (1000 * 60 * 60 * 24));
    return Math.ceil((diasTranscurridos + primerDiaMes.getDay()) / 7);
  };

  const renderCalendario = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(year, month, dia);
      const esHoy = fecha.toDateString() === new Date().toDateString();
      const esSeleccionado = fecha.toDateString() === selectedDate.toDateString();
      const esFuturo = fecha > new Date();

      dias.push(
        <div
          key={dia}
          className={`calendar-day ${esHoy ? 'today' : ''} ${esSeleccionado ? 'selected' : ''} ${esFuturo ? 'future' : ''}`}
          onClick={() => !esFuturo && setSelectedDate(fecha)}
        >
          <span className="day-number">{dia}</span>
        </div>
      );
    }

    return dias;
  };

  return (
    <div className="nutricion-page" style={{ backgroundColor: '#ffffff' }}>
      <VoiceHelper currentModule="nutricion" />

      {/* Header */}
      <header className="nutricion-header-new">
        <div className="nutricion-header-top">
          <div className="nutricion-header-left">
            <div className="nutricion-header-icon"><LucideIcon name="apple" size={24} /></div>
            <div className="nutricion-header-text">
              <h1>Nutrición</h1>
              <p className="nutricion-subtitle">Plan diario de alimentación</p>
            </div>
          </div>
          <button className="nutricion-calendar-btn" onClick={() => setShowCalendar(true)}>
            <LucideIcon name="calendar" size={20} />
          </button>
        </div>
        <div className="nutricion-date-nav">
          <button className="nutricion-date-arrow" onClick={() => cambiarDia(-1)}>‹</button>
          <div className="nutricion-date-display" onClick={() => setShowCalendar(true)}>
            <span className="nutricion-date-text">{formatearFecha(selectedDate)}</span>
          </div>
          <button
            className="nutricion-date-arrow"
            onClick={() => cambiarDia(1)}
            disabled={selectedDate.toDateString() === new Date().toDateString()}
          >
            ›
          </button>
        </div>
      </header>

      <div className="week-indicator">Semana {getSemanaDelMes()}</div>

      {/* Tabs */}
      <div className="nutricion-tabs">
        <button className={`nutricion-tab ${activeTab === 'diario' ? 'active' : ''}`} onClick={() => setActiveTab('diario')}>
          Diario
        </button>
        <button className={`nutricion-tab ${activeTab === 'plan_porciones' ? 'active' : ''}`} onClick={() => setActiveTab('plan_porciones')}>
          Plan de Porciones
        </button>
        <button className={`nutricion-tab ${activeTab === 'recetas' ? 'active' : ''}`} onClick={() => setActiveTab('recetas')}>
          Mi Plan
        </button>
        <button className={`nutricion-tab ${activeTab === 'peso' ? 'active' : ''}`} onClick={() => setActiveTab('peso')}>
          Mi Peso
        </button>
      </div>

      <div className="nutricion-content">
        {activeTab === 'diario' && (
          <>
            {planAsignado?.tiene_plan ? (
              <section className="plan-resumen-section">
                <div className="plan-resumen-header">
                  <h2><LucideIcon name="clipboard-list" size={20} /> {planAsignado.nombre || 'Mi Plan Nutricional'}</h2>
                  {planAsignado.especialista_nombre && (
                    <span className="plan-especialista">
                      <LucideIcon name="stethoscope" size={14} /> {planAsignado.especialista_nombre}
                    </span>
                  )}
                </div>
              </section>
            ) : (
              <section className="plan-empty-section">
                <div className="plan-empty-icon"><LucideIcon name="salad" size={40} /></div>
                <h3>Sin plan nutricional asignado</h3>
                <p>Tu nutriólogo te asignará un plan personalizado para apoyar tu recuperación.</p>
              </section>
            )}

            <section className="section-card agua-section">
              <h2>Registro de agua</h2>
              <div className="agua-display">
                <h3>Agua</h3>
                <p className="agua-objetivo">Objetivo: {agua.objetivo.toFixed(2)} litros</p>
                <p className="agua-consumida">{agua.consumida.toFixed(2)} L</p>
                <div className="agua-vasos">
                  <button className="vaso-btn add" onClick={agregarVasoAgua}>
                    <span className="vaso-icon empty"><LucideIcon name="glass-water" size={20} /></span>
                    <span className="plus">+</span>
                  </button>
                  {agua.vasos.map((lleno, i) => (
                    <button key={i} className={`vaso-btn ${lleno ? 'filled' : ''}`} onClick={lleno ? quitarVasoAgua : agregarVasoAgua}>
                      <span className="vaso-icon"><LucideIcon name={lleno ? 'droplet' : 'glass-water'} size={20} /></span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* APARTADO PLAN DE PORCIONES (Actualizado dinámicamente o con ceros) */}
        {activeTab === 'plan_porciones' && (
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px' }}>
            {loadingPlan ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando plan de porciones...</p>
              </div>
            ) : planAsignado?.tiene_plan ? (
              <>
                {/* Metas Diarias */}
                <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Metas Diarias</h4>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {planAsignado.especialista_nombre ? `Nutriólogo asignado: ${planAsignado.especialista_nombre}` : 'Nutriólogo asignado'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d9534f' }}>
                        {planAsignado.calorias_diarias || planAsignado.contenido?.totales?.calorias || 0} kcal
                      </span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Calorías</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f0ad4e' }}>
                        {Number(planAsignado.proteinas_g || planAsignado.contenido?.totales?.proteinas || 0).toFixed(0)}g
                      </span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Proteínas</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#5bc0de' }}>
                        {Number(planAsignado.carbohidratos_g || planAsignado.contenido?.totales?.carbohidratos || 0).toFixed(0)}g
                      </span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Carbohidratos</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#5cb85c' }}>
                        {Number(planAsignado.grasas_g || planAsignado.contenido?.totales?.grasas || 0).toFixed(0)}g
                      </span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Grasas</p>
                    </div>
                  </div>
                </div>

                {/* Alimentos Equivalentes */}
                <div style={{ marginBottom: '20px' }}>
                  <VistaEquivalentes
                    plan={planAsignado}
                    contenido={planAsignado.contenido}
                    pacienteView
                    checkData={equivalentesCheck}
                    onCheckToggle={handleCheckToggle}
                  />
                </div>

                {/* Recomendaciones */}
                <div style={{ backgroundColor: '#f4fbf7', borderLeft: '4px solid #1b6b39', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1b6b39', fontSize: '16px' }}>Recomendaciones</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#333' }}>
                    {(planAsignado.contenido?.recomendaciones || planAsignado.contenido?.indicaciones_generales || [
                      "Consumir agua constantemente durante el día.",
                      "Evitar alimentos ultra procesados.",
                      "Mantener horarios de comida estables.",
                      "Priorizar verduras y frutas frescas."
                    ]).map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Recetas Sugeridas */}
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>Recetas sugeridas</h4>
                  <div style={{ background: '#f9f9f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eee' }}>
                    <div style={{ padding: '15px' }}>
                      <span style={{ background: '#1b6b39', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Almuerzo</span>
                      <h5 style={{ margin: '8px 0 4px 0', fontSize: '15px', color: '#222' }}>Ensalada Balanceada</h5>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>🔥 320 kcal · 🥩 25g proteína</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Estado por defecto a 0 / sin plan */
              <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed #e0e0e0', borderRadius: '10px' }}>
                <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #eee' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>Metas Diarias</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d9534f' }}>0 kcal</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Calorías</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f0ad4e' }}>0g</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Proteínas</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#5bc0de' }}>0g</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Carbohidratos</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#5cb85c' }}>0g</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>Grasas</p>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '500', color: '#444', marginBottom: '5px' }}>Sin plan nutricional asignado</p>
                <p style={{ fontSize: '14px', color: '#777', margin: 0 }}>Tu nutriólogo te asignará un plan de porciones próximamente.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recetas' && (
          <>
            {loadingPlan ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando tu plan nutricional...</p>
              </div>
            ) : planAsignado?.tiene_plan ? (
              <VistaEquivalentes plan={planAsignado} contenido={planAsignado.contenido} pacienteView />
            ) : (
              <section className="plan-empty-section">
                <div className="plan-empty-icon"><LucideIcon name="clipboard-list" size={40} /></div>
                <h3>Sin plan nutricional asignado</h3>
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
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="calendar-days">{renderCalendario()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Comida */}
      {showAddFood && (
        <div className="modal-overlay" onClick={() => setShowAddFood(false)}>
          <div className="modal-content add-food-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddFood(false)}>×</button>
            <h2>Agregar a {tipoComidaActual.charAt(0).toUpperCase() + tipoComidaActual.slice(1)}</h2>
            <div className="search-food">
              <input
                type="text"
                placeholder="Buscar alimento..."
                className="search-input"
                value={alimentosBusqueda}
                onChange={(e) => setAlimentosBusqueda(e.target.value)}
              />
            </div>
            <div className="food-suggestions">
              <div className="food-list">
                {getAlimentosFiltrados().map((alimento) => (
                  <div key={alimento.id} className="food-suggestion-item">
                    <div className="food-info">
                      <span className="food-name">{alimento.nombre}</span>
                      <span className="food-macros">
                        {alimento.calorias} kcal · C:{alimento.carbohidratos}g · P:{alimento.proteinas}g · G:{alimento.grasas}g
                      </span>
                    </div>
                    <button className="add-food-btn" onClick={() => registrarAlimento(alimento)} disabled={registrando}>
                      {registrando ? '...' : '+'}
                    </button>
                  </div>
                ))}
              </div>
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