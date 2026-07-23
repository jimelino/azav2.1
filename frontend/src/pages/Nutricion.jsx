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

  // Recetas (legacy)
  const [recetas, setRecetas] = useState([]);

  // Modales
  const [showAddFood, setShowAddFood] = useState(false);
  const [tipoComidaActual, setTipoComidaActual] = useState('desayuno');
  const [showRecetaDetail, setShowRecetaDetail] = useState(null);
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

  // Sincronización automática de planes al montar o cambiar de paciente
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

  // Sincronizador dinámico conectado con el panel del especialista (calorías, grasas, proteínas, carbohidratos)
  useEffect(() => {
    const tieneCaloriasPlan = planAsignado?.tiene_plan && (
      Number(planAsignado.calorias_diarias) > 0 ||
      Number(planAsignado.contenido?.totales?.calorias) > 0
    );

    if (tieneCaloriasPlan) {
      sincronizarObjetivosConPlan(planAsignado);
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

    let objetivosPorComida = {
      desayuno: Math.round(caloriasTotales * 0.30),
      almuerzo: Math.round(caloriasTotales * 0.35),
      cena: Math.round(caloriasTotales * 0.25),
      snacks: Math.round(caloriasTotales * 0.10)
    };

    if (plan.contenido?.comidas?.length > 0) {
      const comidasPlan = plan.contenido.comidas;
      const distribucion = { desayuno: 0, almuerzo: 0, cena: 0, snacks: 0 };

      comidasPlan.forEach(comida => {
        const tipo = comida.tipo_comida?.toLowerCase();
        if (tipo === 'desayuno') {
          distribucion.desayuno += comida.calorias || 0;
        } else if (tipo === 'almuerzo' || tipo === 'comida') {
          distribucion.almuerzo += comida.calorias || 0;
        } else if (tipo === 'cena') {
          distribucion.cena += comida.calorias || 0;
        } else if (tipo === 'snack' || tipo === 'merienda' || tipo === 'colacion') {
          distribucion.snacks += comida.calorias || 0;
        }
      });

      if (distribucion.desayuno > 0 || distribucion.almuerzo > 0 || distribucion.cena > 0) {
        objetivosPorComida = {
          desayuno: distribucion.desayuno || objetivosPorComida.desayuno,
          almuerzo: distribucion.almuerzo || objetivosPorComida.almuerzo,
          cena: distribucion.cena || objetivosPorComida.cena,
          snacks: distribucion.snacks || objetivosPorComida.snacks
        };
      }
    }

    setResumenDia(prev => ({
      ...prev,
      calorias: { ...prev.calorias, objetivo: caloriasTotales },
      proteinas: { ...prev.proteinas, objetivo: Math.round(proteinasTotales) },
      carbohidratos: { ...prev.carbohidratos, objetivo: Math.round(carbosTotales) },
      grasas: { ...prev.grasas, objetivo: Math.round(grasasTotales) }
    }));

    setComidas(prev => ({
      ...prev,
      desayuno: { ...prev.desayuno, objetivo: objetivosPorComida.desayuno },
      almuerzo: { ...prev.almuerzo, objetivo: objetivosPorComida.almuerzo },
      cena: { ...prev.cena, objetivo: objetivosPorComida.cena },
      snacks: { ...prev.snacks, objetivo: objetivosPorComida.snacks }
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

      api.post('/nutricion/agua', {
        paciente_id: pacienteId,
        fecha: selectedDate.toISOString().split('T')[0],
        cantidad: nuevaConsumida
      }).catch(console.error);
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

      await api.post('/nutricion/alimento', {
        paciente_id: pacienteId,
        fecha: selectedDate.toISOString().split('T')[0],
        tipo_comida: tipoComidaActual,
        alimento_nombre: alimento.nombre,
        calorias: alimento.calorias,
        carbohidratos: alimento.carbohidratos,
        proteinas: alimento.proteinas,
        grasas: alimento.grasas
      });

      setShowAddFood(false);
    } catch (err) {
      console.error('Error al registrar alimento:', err);
    } finally {
      setRegistrando(false);
    }
  };

  const getAlimentosDelPlan = () => {
    if (!planAsignado?.contenido?.comidas) return [];

    const alimentosPlan = [];
    let idCounter = 1000;

    planAsignado.contenido.comidas.forEach(comida => {
      if (comida.opciones && comida.opciones.length > 0) {
        comida.opciones.forEach(opcion => {
          const tipoComidaOpcion = comida.tipo_comida?.toLowerCase();
          const esRelevante =
            (tipoComidaActual === 'desayuno' && tipoComidaOpcion === 'desayuno') ||
            (tipoComidaActual === 'almuerzo' && (tipoComidaOpcion === 'almuerzo' || tipoComidaOpcion === 'comida')) ||
            (tipoComidaActual === 'cena' && tipoComidaOpcion === 'cena') ||
            (tipoComidaActual === 'snacks' && (tipoComidaOpcion === 'snack' || tipoComidaOpcion === 'merienda' || tipoComidaOpcion === 'colacion'));

          alimentosPlan.push({
            id: idCounter++,
            nombre: opcion.nombre,
            descripcion: opcion.descripcion,
            calorias: opcion.calorias_estimadas || 0,
            carbohidratos: opcion.carbohidratos_estimados || 0,
            proteinas: opcion.proteinas_estimados || 0,
            grasas: opcion.grasas_estimados || 0,
            esDelPlan: true,
            esRelevante: esRelevante,
            tipoComida: comida.tipo_comida
          });
        });
      }
    });

    return alimentosPlan;
  };

  const getAlimentosFiltrados = () => {
    const alimentosPlan = getAlimentosDelPlan();
    if (!alimentosBusqueda.trim()) {
      const relevantes = alimentosPlan.filter(a => a.esRelevante);
      const otrosDelPlan = alimentosPlan.filter(a => !a.esRelevante);
      return [...relevantes, ...otrosDelPlan, ...alimentosPredefinidos];
    }

    const busqueda = alimentosBusqueda.toLowerCase();
    const planFiltrados = alimentosPlan.filter(a =>
      a.nombre.toLowerCase().includes(busqueda) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(busqueda))
    );
    const predefinidosFiltrados = alimentosPredefinidos.filter(a =>
      a.nombre.toLowerCase().includes(busqueda)
    );

    return [...planFiltrados, ...predefinidosFiltrados];
  };

  const formatearFecha = (fecha) => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return fecha.toLocaleDateString('es-MX', { weekday: 'short' });
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    return fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'numeric' });
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
      const tieneDatos = historialDias[fecha.toISOString().split('T')[0]];
      const esFuturo = fecha > new Date();

      dias.push(
        <div
          key={dia}
          className={`calendar-day ${esHoy ? 'today' : ''} ${esSeleccionado ? 'selected' : ''} ${tieneDatos ? 'has-data' : ''} ${esFuturo ? 'future' : ''}`}
          onClick={() => !esFuturo && setSelectedDate(fecha)}
        >
          <span className="day-number">{dia}</span>
          {tieneDatos && <span className="day-indicator"></span>}
        </div>
      );
    }

    return dias;
  };

  return (
    <div className="nutricion-page">
      <VoiceHelper currentModule="nutricion" />

      {/* Header original */}
      <header className="nutricion-header-new">
        <div className="nutricion-header-top">
          <div className="nutricion-header-left">
            <div className="nutricion-header-icon"><LucideIcon name="apple" size={24} /></div>
            <div className="nutricion-header-text">
              <h1>Nutrición</h1>
              <p className="nutricion-subtitle">Tu plan de alimentación</p>
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
            {selectedDate.toDateString() !== new Date().toDateString() && (
              <span className="nutricion-date-full">, {selectedDate.getDate()}/{selectedDate.getMonth() + 1}</span>
            )}
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

      {/* Tabs originales con el nuevo apartado "Plan de Porciones" integrado de forma fluida */}
      <div className="nutricion-tabs">
        <button
          className={`nutricion-tab ${activeTab === 'diario' ? 'active' : ''}`}
          onClick={() => setActiveTab('diario')}
        >
          Diario
        </button>
        <button
          className={`nutricion-tab ${activeTab === 'plan_porciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan_porciones')}
        >
          Plan de Porciones
        </button>
        <button
          className={`nutricion-tab ${activeTab === 'recetas' ? 'active' : ''}`}
          onClick={() => setActiveTab('recetas')}
        >
          Mi Plan / Recetas
        </button>
        <button
          className={`nutricion-tab ${activeTab === 'peso' ? 'active' : ''}`}
          onClick={() => setActiveTab('peso')}
        >
          Mi Peso
        </button>
      </div>

      <div className="nutricion-content">
        {activeTab === 'diario' && (
          <>
            {/* Resumen de Macros sincronizado con el especialista */}
            <section className="resumen-macros-section">
              <div className="macro-card-resumen calorias">
                <div className="macro-icon-wrapper"><LucideIcon name="flame" size={20} /></div>
                <div className="macro-data">
                  <span className="macro-val-num">{resumenDia.calorias.consumidas} / <strong>{resumenDia.calorias.objetivo}</strong></span>
                  <span className="macro-lbl">Calorías (kcal)</span>
                </div>
              </div>
              <div className="macro-card-resumen carbos">
                <div className="macro-icon-wrapper"><LucideIcon name="wheat" size={20} /></div>
                <div className="macro-data">
                  <span className="macro-val-num">{resumenDia.carbohidratos.consumidas}g / <strong>{resumenDia.carbohidratos.objetivo}g</strong></span>
                  <span className="macro-lbl">Carbohidratos</span>
                </div>
              </div>
              <div className="macro-card-resumen proteinas">
                <div className="macro-icon-wrapper"><LucideIcon name="beef" size={20} /></div>
                <div className="macro-data">
                  <span className="macro-val-num">{resumenDia.proteinas.consumidas}g / <strong>{resumenDia.proteinas.objetivo}g</strong></span>
                  <span className="macro-lbl">Proteínas</span>
                </div>
              </div>
              <div className="macro-card-resumen grasas">
                <div className="macro-icon-wrapper"><LucideIcon name="droplet" size={20} /></div>
                <div className="macro-data">
                  <span className="macro-val-num">{resumenDia.grasas.consumidas}g / <strong>{resumenDia.grasas.objetivo}g</strong></span>
                  <span className="macro-lbl">Grasas</span>
                </div>
              </div>
            </section>

            {/* Listado de comidas del día */}
            {Object.entries(comidas).map(([tipo, data]) => {
              const titulosComida = { desayuno: 'Desayuno', almuerzo: 'Almuerzo / Comida', cena: 'Cena', snacks: 'Snacks / Colaciones' };
              const iconosComida = { desayuno: 'sunrise', almuerzo: 'utensils', cena: 'moon', snacks: 'cookie' };

              return (
                <section key={tipo} className="section-card comida-diaria-card">
                  <div className="comida-card-header-diario" onClick={() => abrirAgregarComida(tipo)}>
                    <div className="comida-titulo-left">
                      <LucideIcon name={iconosComida[tipo] || 'utensils'} size={20} />
                      <h3>{titulosComida[tipo]}</h3>
                    </div>
                    <div className="comida-titulo-right">
                      <span className="comida-calorias-badge">{data.calorias} / {data.objetivo} kcal</span>
                      <button className="btn-add-item-diario"><LucideIcon name="plus" size={16} /></button>
                    </div>
                  </div>

                  <div className="comida-items-list">
                    {data.items.length > 0 ? (
                      data.items.map((item, idx) => (
                        <div key={idx} className="comida-item-row">
                          <span className="item-nombre">{item.nombre}</span>
                          <span className="item-kcal">{item.calorias} kcal</span>
                        </div>
                      ))
                    ) : (
                      <p className="empty-comida-text" onClick={() => abrirAgregarComida(tipo)}>
                        Toca aquí para registrar alimentos en {titulosComida[tipo].toLowerCase()}...
                      </p>
                    )}
                  </div>
                </section>
              );
            })}

            {/* Registro de agua */}
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
                    <button
                      key={i}
                      className={`vaso-btn ${lleno ? 'filled' : ''}`}
                      onClick={lleno ? quitarVasoAgua : agregarVasoAgua}
                    >
                      <span className="vaso-icon"><LucideIcon name={lleno ? 'droplet' : 'glass-water'} size={20} /></span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Nuevo Apartado: Plan de Porciones Nutricionales con menú desplegable e interfaz mejorada */}
        {activeTab === 'plan_porciones' && (
          <div className="plan-porciones-tab-container">
            {planAsignado?.tiene_plan ? (
              <>
                <section className="plan-resumen-section">
                  <div className="plan-resumen-header">
                    <h2><LucideIcon name="clipboard-list" size={20} /> {planAsignado.nombre || 'Plan de Porciones Nutricionales'}</h2>
                    {planAsignado.especialista_nombre && (
                      <span className="plan-especialista">
                        <LucideIcon name="stethoscope" size={14} /> {planAsignado.especialista_nombre}
                      </span>
                    )}
                  </div>

                  <div className="plan-macros-grid">
                    <div className="plan-macro-card calorias">
                      <div className="plan-macro-icon"><LucideIcon name="flame" size={20} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">
                          {planAsignado.calorias_diarias || planAsignado.contenido?.totales?.calorias || resumenDia.calorias.objetivo}
                        </span>
                        <span className="plan-macro-label">kcal/día</span>
                      </div>
                    </div>
                    <div className="plan-macro-card proteinas">
                      <div className="plan-macro-icon"><LucideIcon name="beef" size={20} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">
                          {planAsignado.proteinas_g || planAsignado.contenido?.totales?.proteinas || resumenDia.proteinas.objetivo}
                        </span>
                        <span className="plan-macro-label">g proteínas</span>
                      </div>
                    </div>
                    <div className="plan-macro-card carbos">
                      <div className="plan-macro-icon"><LucideIcon name="wheat" size={20} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">
                          {planAsignado.carbohidratos_g || planAsignado.contenido?.totales?.carbohidratos || resumenDia.carbohidratos.objetivo}
                        </span>
                        <span className="plan-macro-label">g carbohidratos</span>
                      </div>
                    </div>
                    <div className="plan-macro-card grasas">
                      <div className="plan-macro-icon"><LucideIcon name="droplet" size={20} /></div>
                      <div className="plan-macro-info">
                        <span className="plan-macro-value">
                          {planAsignado.grasas_g || planAsignado.contenido?.totales?.grasas || resumenDia.grasas.objetivo}
                        </span>
                        <span className="plan-macro-label">g grasas</span>
                      </div>
                    </div>
                  </div>

                  {/* Cuadro de equivalentes integrado */}
                  {(planAsignado.contenido?.tipo === 'equivalentes' || planAsignado.contenido?.cuadro_equivalentes?.grupos?.length > 0 || planAsignado.contenido?.texto_original?.includes('|||')) && (
                    <div className="plan-equiv-wrapper">
                      <VistaEquivalentes
                        plan={planAsignado}
                        contenido={planAsignado.contenido}
                        compact={true}
                        pacienteView={true}
                        checklist={true}
                        checkData={equivalentesCheck}
                        onCheckToggle={handleCheckToggle}
                      />
                    </div>
                  )}
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
                  const COLORES_GRUPO = {
                    'Verduras': '#4CAF50', 'Frutas': '#FF9800', 'Cereales': '#FFC107',
                    'Leguminosas': '#795548', 'Proteínas 1': '#F44336', 'Proteínas 2': '#E91E63',
                    'Proteínas 3': '#9C27B0', 'Lácteos': '#2196F3', 'Grasas': '#FF5722',
                    'Grasas con proteína': '#607D8B'
                  };

                  const getAlimentosForGrupo = (nombreGrupo) => {
                    const grupoData = gruposAlimentos.find(g => g.nombre === nombreGrupo);
                    if (!grupoData?.alimentos?.length) return [];
                    return limpiarAlimentos(grupoData.alimentos);
                  };

                  return (
                    <section className="section-card plan-comidas-section">
                      <div className="section-header">
                        <h2><LucideIcon name="clipboard-list" size={20} /> Desglose de Porciones por Comida</h2>
                      </div>
                      <div className="plan-comidas-list">
                        {tiempos.map((tiempo, tIdx) => {
                          const gruposActivos = grupos
                            .map((g, gIdx) => ({ nombre: g.nombre, cantidad: g.equivalentes?.[tIdx] || 0 }))
                            .filter(g => g.cantidad > 0);

                          if (gruposActivos.length === 0) return null;

                          return (
                            <details key={tIdx} className="plan-comida-item" open={tIdx === 0}>
                              <summary className="plan-comida-header">
                                <div className="plan-comida-icon">
                                  <LucideIcon name={ICONOS_TIEMPO[tiempo] || 'utensils'} size={20} />
                                </div>
                                <div className="plan-comida-title">
                                  <span className="plan-comida-nombre">{tiempo}</span>
                                  <span className="plan-comida-count">{gruposActivos.length} grupos</span>
                                </div>
                                <LucideIcon name="chevron-down" size={18} className="plan-comida-chevron" />
                              </summary>
                              <div className="plan-comida-body">
                                {gruposActivos.map((g, i) => {
                                  const alimentos = getAlimentosForGrupo(g.nombre);
                                  return (
                                    <details key={i} className="plan-comida-grupo-detail">
                                      <summary className="plan-comida-grupo">
                                        <span
                                          className="plan-comida-grupo-dot"
                                          style={{ background: COLORES_GRUPO[g.nombre] || '#8B949E' }}
                                        />
                                        <span className="plan-comida-grupo-nombre">{g.nombre}</span>
                                        <span className="plan-comida-grupo-cant">
                                          {g.cantidad % 1 === 0 ? g.cantidad : g.cantidad.toFixed(1)} {g.cantidad === 1 ? 'porción' : 'porciones'}
                                        </span>
                                        {alimentos.length > 0 && (
                                          <LucideIcon name="chevron-down" size={14} className="plan-grupo-chevron" />
                                        )}
                                      </summary>
                                      {alimentos.length > 0 && (
                                        <div className="plan-comida-alimentos">
                                          {alimentos.map((a, aIdx) => (
                                            <div key={aIdx} className="plan-comida-alimento">
                                              <span className="plan-alimento-nombre">{a.nombre}</span>
                                              {a.equivalente && (
                                                <span className="plan-alimento-porcion">{a.equivalente}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </details>
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

                {/* Recomendaciones e indicaciones del especialista actualizadas dinámicamente */}
                {planAsignado.contenido?.recomendaciones?.length > 0 && (
                  <section className="section-card recomendaciones-section">
                    <h2><LucideIcon name="lightbulb" size={20} /> Recomendaciones del Especialista</h2>
                    <ul className="recomendaciones-list">
                      {planAsignado.contenido.recomendaciones.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            ) : (
              <section className="plan-empty-section">
                <div className="plan-empty-icon"><LucideIcon name="salad" size={40} /></div>
                <h3>Sin plan de porciones asignado</h3>
                <p>Tu especialista asignará las calorías, grasas, porciones y recomendaciones desde su panel para reflejarse aquí automáticamente.</p>
              </section>
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
              <button className="calendar-icon-btn"><LucideIcon name="calendar" size={18} /></button>
            </div>
            <div className="calendar-nav">
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>‹</button>
              <span>{selectedDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
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
              {planAsignado?.tiene_plan && getAlimentosDelPlan().filter(a => a.esRelevante).length > 0 && (
                <div className="plan-foods-section">
                  <h4><LucideIcon name="clipboard" size={18} /> De tu plan nutricional</h4>
                  <div className="food-list plan-foods">
                    {getAlimentosDelPlan().filter(a => a.esRelevante).slice(0, alimentosBusqueda ? undefined : 5).map((alimento) => (
                      <div key={alimento.id} className="food-suggestion-item plan-food">
                        <div className="food-info">
                          <span className="food-name">
                            {alimento.nombre}
                            <span className="plan-badge">Del plan</span>
                          </span>
                          <span className="food-macros">
                            {alimento.calorias} kcal · C:{alimento.carbohidratos}g · P:{alimento.proteinas}g · G:{alimento.grasas}g
                          </span>
                        </div>
                        <button
                          className="add-food-btn plan-add-btn"
                          onClick={() => registrarAlimento(alimento)}
                          disabled={registrando}
                        >
                          {registrando ? '...' : '+'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4><LucideIcon name="utensils" size={18} /> Otros alimentos</h4>
              <div className="food-list">
                {getAlimentosFiltrados().filter(a => !a.esDelPlan || !a.esRelevante).map((alimento) => (
                  <div key={alimento.id} className={`food-suggestion-item ${alimento.esDelPlan ? 'from-plan' : ''}`}>
                    <div className="food-info">
                      <span className="food-name">
                        {alimento.nombre}
                        {alimento.esDelPlan && <span className="plan-badge small">Plan</span>}
                      </span>
                      <span className="food-macros">
                        {alimento.calorias} kcal · C:{alimento.carbohidratos}g · P:{alimento.proteinas}g · G:{alimento.grasas}g
                      </span>
                    </div>
                    <button
                      className="add-food-btn"
                      onClick={() => registrarAlimento(alimento)}
                      disabled={registrando}
                    >
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