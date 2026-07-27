import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import CuestionarioActivo from '../components/neuropsicologia/CuestionarioActivo';
import CuestionarioResultado from '../components/neuropsicologia/CuestionarioResultado';
import ACTEjercicioActivo from '../components/neuropsicologia/ACTEjercicioActivo';
import { CUESTIONARIOS, ACT_CATEGORIAS, ACT_HERRAMIENTAS, getHerramientasByCategoria, getCuestionarioById, calcularPuntuacion } from '../data/neuropsicologiaData';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import externalHealthService from '../services/externalHealthService';
import LucideIcon from '../components/LucideIcon';
import '../styles/Neuropsicologia.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Title, Tooltip, Legend);

const Neuropsicologia = () => {
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('animo');
  const [estadosAnimo, setEstadosAnimo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(true);
  const [externalError, setExternalError] = useState('');
  const [externalContext, setExternalContext] = useState({ appointments: [], documents: [], specialist: null });
  const [showModal, setShowModal] = useState(false);

  // Estado de ánimo
  const [emocionSeleccionada, setEmocionSeleccionada] = useState(null);
  const [notasAnimo, setNotasAnimo] = useState('');

  // ACT Ejercicios
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [herramientaActiva, setHerramientaActiva] = useState(null);
  const [historialACT, setHistorialACT] = useState([]);
  const [asignacionesACT, setAsignacionesACT] = useState([]);

  // Cuestionarios
  const [cuestionarioActivo, setCuestionarioActivo] = useState(null);
  const [resultadoActivo, setResultadoActivo] = useState(null);
  const [cuestionarioResultado, setCuestionarioResultado] = useState(null);
  const [historialCuestionarios, setHistorialCuestionarios] = useState([]);

  // Cuestionarios personalizados del especialista
  const [misCuestionarios, setMisCuestionarios] = useState([]);
  const [cuestActivo, setCuestActivo] = useState(null);
  const [cuestRespuestas, setCuestRespuestas] = useState([]);
  const [enviandoResp, setEnviandoResp] = useState(false);

  // Perfil neuropsicológico
  const [evaluacion, setEvaluacion] = useState(null);
  const [historialEval, setHistorialEval] = useState([]);
  const [showModalEval, setShowModalEval] = useState(false);
  const [evalCampos, setEvalCampos] = useState([{ nombre: '', valor: '' }]);
  const [evalNotas, setEvalNotas] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  const emociones = [
    { id: 'enojo', nombre: 'Enojo', icon: 'flame', color: '#C62828' },
    { id: 'desprecio', nombre: 'Desprecio', icon: 'eye-off', color: '#880E4F' },
    { id: 'asco', nombre: 'Asco', icon: 'ban', color: '#558B2F' },
    { id: 'disfrute', nombre: 'Disfrute', icon: 'smile', color: '#F9A825' },
    { id: 'miedo', nombre: 'Miedo', icon: 'shield-alert', color: '#6A1B9A' },
    { id: 'tristeza', nombre: 'Tristeza', icon: 'cloud-rain', color: '#283593' },
    { id: 'sorpresa', nombre: 'Sorpresa', icon: 'zap', color: '#00897B' }
  ];

  const FUNCIONES_COGNITIVAS = [
    { key: 'atencion_visual', label: 'Atención Visual' },
    { key: 'atencion_auditiva', label: 'Atención Auditiva' },
    { key: 'memoria_visual', label: 'Memoria Visual' },
    { key: 'memoria_auditiva', label: 'Memoria Auditiva' },
    { key: 'memoria_trabajo', label: 'Mem. Trabajo' },
    { key: 'funciones_ejecutivas', label: 'F. Ejecutivas' },
    { key: 'velocidad_procesamiento', label: 'Vel. Proceso' },
    { key: 'orientacion', label: 'Orientación' },
    { key: 'lenguaje', label: 'Lenguaje' },
    { key: 'razonamiento', label: 'Razonamiento' },
    { key: 'flexibilidad_cognitiva', label: 'Flex. Cognitiva' },
    { key: 'planificacion', label: 'Planificación' },
    { key: 'control_inhibitorio', label: 'Ctrl. Inhibitorio' },
    { key: 'praxias', label: 'Praxias' },
    { key: 'gnosias', label: 'Gnosias' },
    { key: 'calculo', label: 'Cálculo' },
    { key: 'comprension_verbal', label: 'Comp. Verbal' },
    { key: 'habilidades_visuoespaciales', label: 'Visuoespacial' },
  ];

  const getColorSemaforo = (valor) => {
    if (valor === null || valor === undefined) return '#6E7681';
    if (valor <= 3) return '#C62828';
    if (valor <= 6) return '#F9A825';
    return '#2E7D32';
  };

  const getNivelSemaforo = (valor) => {
    if (valor === null || valor === undefined) return 'Sin evaluar';
    if (valor <= 3) return 'Oportunidad';
    if (valor <= 6) return 'Promedio';
    return 'Fortaleza';
  };

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;

    const cargarContextoExterno = async () => {
      setExternalLoading(true);
      setExternalError('');
      const results = await Promise.allSettled([
        externalHealthService.fetchNeuroAppointments(),
        externalHealthService.fetchNeuroDocuments(),
        externalHealthService.fetchAssignedSpecialist()
      ]);

      if (!mounted) return;

      const [appointments, documents, specialist] = results;
      const rejected = results.some(result => result.status === 'rejected');
      setExternalContext({
        appointments: appointments.status === 'fulfilled'
          ? (Array.isArray(appointments.value) ? appointments.value : appointments.value?.items || [])
          : [],
        documents: documents.status === 'fulfilled'
          ? (Array.isArray(documents.value) ? documents.value : documents.value?.items || [])
          : [],
        specialist: specialist.status === 'fulfilled'
          ? (specialist.value?.specialist || specialist.value || null)
          : null
      });
      if (rejected) {
        setExternalError('No se pudo consultar toda la información del sistema clínico externo.');
      }
      setExternalLoading(false);
    };

    if (user?.id) cargarContextoExterno();
    return () => { mounted = false; };
  }, [user?.id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'animo') {
        const response = await api.get(`/neuropsicologia/estados-animo/${user.paciente_id}`);
        setEstadosAnimo(response.data || []);
      } else if (activeTab === 'ejercicios') {
        try {
          const [histRes, asigRes] = await Promise.all([
            api.get(`/neuropsicologia/act/historial/${user.paciente_id}`).catch(() => ({ data: [] })),
            api.get(`/neuropsicologia/act/asignaciones/${user.paciente_id}`).catch(() => ({ data: [] }))
          ]);
          setHistorialACT(histRes.data || []);
          const rawAsig = asigRes?.data ?? asigRes;
          setAsignacionesACT(Array.isArray(rawAsig) ? rawAsig.filter(a => a.estado === 'pendiente') : []);
        } catch (e) { /* historial no disponible aún */ }
      } else if (activeTab === 'evaluaciones') {
        const pacId = user.paciente_id || user.id;
        try {
          const [cuestionariosRes, evalRes, histRes, misC] = await Promise.all([
            api.get(`/neuropsicologia/cuestionarios/historial/${pacId}`).catch(() => ({ data: [] })),
            api.get(`/neuropsicologia/evaluacion/${pacId}`).catch(() => ({ data: null })),
            api.get(`/neuropsicologia/evaluacion/historial/${pacId}`).catch(() => ({ data: [] })),
            api.get(`/neuropsicologia/mis-cuestionarios/${pacId}`).catch(() => ({ data: [] }))
          ]);
          setHistorialCuestionarios(cuestionariosRes.data || []);
          setEvaluacion(evalRes.data || evalRes?.data);
          setHistorialEval(histRes.data || []);
          const rawMis = misC?.data ?? misC;
          setMisCuestionarios(Array.isArray(rawMis) ? rawMis : []);
        } catch (e) { /* no hay datos aún */ }
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const registrarEstadoAnimo = async () => {
    if (!emocionSeleccionada) return;
    try {
      await api.post('/neuropsicologia/estados-animo', {
        paciente_id: user.paciente_id,
        emocion: emocionSeleccionada,
        notas: notasAnimo,
        fecha_hora: new Date().toISOString()
      });
      setShowModal(false);
      setEmocionSeleccionada(null);
      setNotasAnimo('');
      cargarDatos();
    } catch (err) {
      console.error('Error al registrar estado de ánimo:', err);
    }
  };

  const getEmocionInfo = (emocionId) => {
    return emociones.find(e => e.id === emocionId) || { icon: 'circle-help', nombre: emocionId, color: '#9E9E9E' };
  };

  const mapNivelToEmocion = (nivel) => {
    const map = { 1: 'enojo', 2: 'tristeza', 3: 'sorpresa', 4: 'disfrute', 5: 'disfrute' };
    return map[nivel] || 'sorpresa';
  };

  const mapBackendEmocion = (emocionBackend) => {
    if (!emocionBackend) return null;
    const map = {
      'alegria': 'disfrute', 'calma': 'disfrute', 'gratitud': 'disfrute',
      'confusion': 'sorpresa', 'ansiedad': 'miedo', 'tristeza': 'tristeza',
      'frustracion': 'enojo', 'enojo': 'enojo', 'esperanza': 'disfrute',
      'miedo': 'miedo', 'motivacion': 'disfrute', 'soledad': 'tristeza',
      'asco': 'asco', 'desprecio': 'desprecio', 'sorpresa': 'sorpresa',
      'feliz': 'disfrute', 'tranquilo': 'disfrute', 'neutral': 'sorpresa',
      'ansioso': 'miedo', 'enojado': 'enojo', 'frustrado': 'enojo',
      'agradecido': 'disfrute', 'triste': 'tristeza'
    };
    return map[emocionBackend.toLowerCase()] || emocionBackend;
  };

  const calcularEstadisticas = () => {
    if (estadosAnimo.length === 0) return null;
    const conteo = {};
    estadosAnimo.forEach(estado => {
      const emocion = estado.emocion || mapBackendEmocion(estado.emociones_nombres) || mapNivelToEmocion(estado.nivel_animo);
      if (emocion) conteo[emocion] = (conteo[emocion] || 0) + 1;
    });
    const emocionMasComun = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
    return { total: estadosAnimo.length, emocionMasComun: emocionMasComun ? emocionMasComun[0] : null, conteo };
  };

  // --- ACT handlers ---
  const handleIniciarHerramienta = (herramienta) => {
    setHerramientaActiva(herramienta);
  };

  const handleIniciarAsignada = (asignacion) => {
    // Buscar si es una herramienta existente del catálogo
    const herramientaExistente = ACT_HERRAMIENTAS.find(h => h.id === asignacion.herramienta_id);
    if (herramientaExistente) {
      // Marcar que viene de una asignación para poder completarla después
      setHerramientaActiva({ ...herramientaExistente, _asignacionId: asignacion.id });
    } else if (asignacion.contenido) {
      // Herramienta personalizada - construir una herramienta a partir del contenido
      let contenido = asignacion.contenido;
      if (typeof contenido === 'string') {
        try { contenido = JSON.parse(contenido); } catch (e) { contenido = {}; }
      }
      const herramientaCustom = {
        id: asignacion.herramienta_id,
        categoriaId: asignacion.categoria || 'personalizada',
        nombre: asignacion.herramienta_nombre,
        descripcion: contenido.descripcion || '',
        duracion: contenido.duracion || 10,
        tieneEscritura: contenido.tipo_actividad === 'escritura' || contenido.tipo_actividad === 'formato',
        pasos: (contenido.pasos || []).map(p => ({
          texto: p.texto,
          duracion: 60,
          ...(contenido.tipo_actividad === 'escritura' || contenido.tipo_actividad === 'formato'
            ? { tipoInput: 'textarea', placeholder: 'Escribe tu respuesta...' }
            : {})
        })),
        _asignacionId: asignacion.id
      };
      // Si no tiene pasos, crear uno con las instrucciones
      if (herramientaCustom.pasos.length === 0) {
        herramientaCustom.pasos = [{ texto: contenido.instrucciones || contenido.descripcion || 'Realiza la actividad indicada por tu especialista.', duracion: 60 }];
      }
      setHerramientaActiva(herramientaCustom);
    }
  };

  const handleCompletarHerramienta = async (notasTexto) => {
    try {
      await api.post('/neuropsicologia/act/sesion', {
        paciente_id: user.paciente_id,
        categoria: herramientaActiva.categoriaId,
        herramienta: herramientaActiva.nombre,
        notas_usuario: notasTexto || null
      });
      // Si viene de una asignación, marcarla como completada
      if (herramientaActiva._asignacionId) {
        await api.put(`/neuropsicologia/act/asignaciones/${herramientaActiva._asignacionId}/completar`).catch(() => {});
      }
    } catch (e) {
      console.error('Error guardando sesión ACT:', e);
    }
    setHerramientaActiva(null);
    cargarDatos();
  };

  // --- Cuestionario handlers ---
  const handleIniciarCuestionario = (cuestionarioId) => {
    const c = getCuestionarioById(cuestionarioId);
    if (c) setCuestionarioActivo(c);
  };

  const handleCompletarCuestionario = async (respuestas) => {
    const resultado = calcularPuntuacion(cuestionarioActivo, respuestas);
    try {
      await api.post('/neuropsicologia/cuestionarios/resultado', {
        paciente_id: user.paciente_id,
        tipo_cuestionario: cuestionarioActivo.id,
        puntuacion_total: resultado.total,
        puntuacion_detalle: { respuestas, ...resultado },
        interpretacion: resultado.nivel
      });
    } catch (e) {
      console.error('Error guardando resultado:', e);
    }
    setCuestionarioResultado(cuestionarioActivo);
    setResultadoActivo(resultado);
    setCuestionarioActivo(null);
  };

  // --- Cuestionarios personalizados handlers ---
  const handleIniciarCuestPersonalizado = (cuest) => {
    setCuestActivo(cuest);
    setCuestRespuestas(cuest.preguntas.map(() => null));
  };

  const handleRespuestaChange = (idx, valor) => {
    setCuestRespuestas(prev => { const u = [...prev]; u[idx] = valor; return u; });
  };

  const handleEnviarRespuesta = async () => {
    if (!cuestActivo) return;
    setEnviandoResp(true);
    try {
      // Calcular puntaje para preguntas de escala
      let puntaje = null;
      const escalas = cuestActivo.preguntas.filter(p => p.tipo === 'escala');
      if (escalas.length > 0) {
        const sum = cuestRespuestas.reduce((acc, r, i) => {
          if (cuestActivo.preguntas[i]?.tipo === 'escala' && r !== null) return acc + parseFloat(r);
          return acc;
        }, 0);
        puntaje = sum;
      }
      await api.post('/neuropsicologia/mis-cuestionarios/responder', {
        cuestionario_id: cuestActivo.id,
        paciente_id: user.paciente_id || user.id,
        respuestas: cuestRespuestas,
        puntaje_total: puntaje
      });
      setCuestActivo(null);
      setCuestRespuestas([]);
      cargarDatos();
    } catch (e) {
      console.error('Error enviando respuesta:', e);
      alert('Error al enviar respuesta');
    } finally { setEnviandoResp(false); }
  };

  // --- Evaluación neuropsicológica handlers ---
  const handleAgregarCampo = () => {
    setEvalCampos(prev => [...prev, { nombre: '', valor: '' }]);
  };

  const handleEliminarCampo = (index) => {
    setEvalCampos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCampoChange = (index, field, value) => {
    setEvalCampos(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleGuardarEvaluacion = async () => {
    const camposValidos = evalCampos.filter(c => c.nombre.trim() && c.valor !== '');
    if (camposValidos.length === 0) return;

    setSavingEval(true);
    try {
      const formData = {
        paciente_id: user.paciente_id || user.id,
        especialista_id: user.especialista_id || user.id,
        fecha: new Date().toISOString().split('T')[0],
        notas: evalNotas,
        campos_personalizados: JSON.stringify(camposValidos)
      };
      // Mapear campos a columnas conocidas si coinciden
      camposValidos.forEach(c => {
        const key = c.nombre.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const matchedFC = FUNCIONES_COGNITIVAS.find(fc => fc.key === key);
        if (matchedFC) {
          formData[matchedFC.key] = c.valor;
        }
      });
      await api.post('/neuropsicologia/evaluacion', formData);
      setShowModalEval(false);
      setEvalCampos([{ nombre: '', valor: '' }]);
      setEvalNotas('');
      cargarDatos();
    } catch (e) {
      console.error('Error guardando evaluacion:', e);
    } finally {
      setSavingEval(false);
    }
  };

  const getCamposEvaluacion = (evalData) => {
    if (!evalData) return [];
    const campos = [];
    // Campos conocidos de la tabla
    FUNCIONES_COGNITIVAS.forEach(fc => {
      const val = evalData[fc.key];
      if (val !== null && val !== undefined) {
        campos.push({ nombre: fc.label, valor: parseFloat(val) });
      }
    });
    // Campos personalizados
    if (evalData.campos_personalizados) {
      try {
        const custom = typeof evalData.campos_personalizados === 'string'
          ? JSON.parse(evalData.campos_personalizados)
          : evalData.campos_personalizados;
        if (Array.isArray(custom)) {
          custom.forEach(c => {
            if (!campos.find(existing => existing.nombre.toLowerCase() === c.nombre.toLowerCase())) {
              campos.push({ nombre: c.nombre, valor: parseFloat(c.valor) });
            }
          });
        }
      } catch (e) { /* ignore parse errors */ }
    }
    return campos;
  };

  const buildChartData = (evalData) => {
    const campos = getCamposEvaluacion(evalData);
    if (campos.length === 0) return null;

    const labels = campos.map(c => c.nombre);
    const values = campos.map(c => c.valor);
    const colors = campos.map(c => getColorSemaforo(c.valor));

    return {
      labels,
      datasets: [{
        label: 'Puntaje',
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 28,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 1,
          color: '#6B6B6B',
          font: { size: 13 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        }
      },
      y: {
        ticks: {
          color: '#1A1A1A',
          font: { size: 14, weight: '500' }
        },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#1A1A1A',
        bodyColor: '#1A1A1A',
        borderColor: '#E0E0E0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.x;
            return `${val}/10 - ${getNivelSemaforo(val)}`;
          }
        }
      }
    }
  };

  const stats = calcularEstadisticas();

  return (
    <div className="neuropsicologia-page">
      <header className="page-header">
        <h1>Neuropsicología</h1>
        <p className="subtitle">Cuida tu bienestar emocional y mental</p>
      </header>

      <section className="neuro-external-context" aria-label="Información clínica externa">
        <div className="neuro-external-heading">
          <div>
            <h2>Información clínica</h2>
            <p>Datos sincronizados con tu sistema clínico externo.</p>
          </div>
          <LucideIcon name="cloud" size={22} />
        </div>
        {externalLoading ? (
          <p className="neuro-external-status">Cargando información clínica...</p>
        ) : (
          <div className="neuro-external-grid">
            <div className="neuro-external-item">
              <LucideIcon name="calendar" size={20} />
              <span><strong>Citas</strong>{externalContext.appointments.length} registradas</span>
            </div>
            <div className="neuro-external-item">
              <LucideIcon name="file-text" size={20} />
              <span><strong>Documentos</strong>{externalContext.documents.length} disponibles</span>
            </div>
            <div className="neuro-external-item">
              <LucideIcon name="user" size={20} />
              <span><strong>Especialista asignado</strong>{externalContext.specialist?.nombre_completo || externalContext.specialist?.name || 'Pendiente de asignación'}</span>
            </div>
          </div>
        )}
        {externalError && <p className="neuro-external-error" role="alert">{externalError}</p>}
      </section>

      <div className="tabs">
        <button className={`tab ${activeTab === 'animo' ? 'active' : ''}`} onClick={() => setActiveTab('animo')}>
          Estado de Animo
        </button>
        <button className={`tab ${activeTab === 'ejercicios' ? 'active' : ''}`} onClick={() => setActiveTab('ejercicios')}>
          Intervención
        </button>
        <button className={`tab ${activeTab === 'evaluaciones' ? 'active' : ''}`} onClick={() => setActiveTab('evaluaciones')}>
          Evaluaciones Neuropsicologicas
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : (
        <div className="tab-content">
          {/* ===== TAB: ESTADO DE ÁNIMO ===== */}
          {activeTab === 'animo' && (
            <div className="animo-section">
              <button className="btn btn-primary btn-lg btn-block" onClick={() => setShowModal(true)}>
                ¿Cómo te sientes ahora?
              </button>

              {stats && (
                <div className="stats-animo">
                  <h3>Resumen de esta semana</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-value">{stats.total}</span>
                      <span className="stat-label">Registros</span>
                    </div>
                    {stats.emocionMasComun && (
                      <div className="stat-card">
                        <span className="stat-emoji"><LucideIcon name={getEmocionInfo(stats.emocionMasComun).icon} size={24} /></span>
                        <span className="stat-label">Más frecuente</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gráficas de Estado de Ánimo */}
              {estadosAnimo.length >= 3 && (
                <div className="animo-charts">
                  {/* Gráfica de tendencia de ánimo */}
                  <div className="animo-chart-card">
                    <h3>Tendencia de ánimo</h3>
                    <div className="animo-chart-wrapper">
                      <Line
                        data={{
                          labels: [...estadosAnimo].reverse().slice(-14).map(e => {
                            const f = new Date(e.fecha_hora || e.fecha);
                            return `${f.getDate()}/${f.getMonth() + 1}`;
                          }),
                          datasets: [{
                            label: 'Nivel de ánimo',
                            data: [...estadosAnimo].reverse().slice(-14).map(e => e.nivel_animo || 3),
                            borderColor: '#9C27B0',
                            backgroundColor: 'rgba(156, 39, 176, 0.1)',
                            pointBackgroundColor: [...estadosAnimo].reverse().slice(-14).map(e => {
                              const emocionId = e.emocion || mapBackendEmocion(e.emociones_nombres) || mapNivelToEmocion(e.nivel_animo);
                              return getEmocionInfo(emocionId).color;
                            }),
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            tension: 0.3,
                            fill: true,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              min: 0.5,
                              max: 5.5,
                              ticks: {
                                stepSize: 1,
                                callback: (val) => {
                                  const labels = { 1: 'Muy Mal', 2: 'Mal', 3: 'Neutral', 4: 'Bien', 5: 'Muy Bien' };
                                  return labels[val] || '';
                                },
                                color: 'var(--text-secondary, #6B6B6B)',
                                font: { size: 11 }
                              },
                              grid: { color: 'rgba(0,0,0,0.06)' }
                            },
                            x: {
                              ticks: {
                                color: 'var(--text-secondary, #6B6B6B)',
                                font: { size: 11 }
                              },
                              grid: { display: false }
                            }
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              padding: 10,
                              callbacks: {
                                label: (ctx) => {
                                  const labels = { 1: 'Muy Mal', 2: 'Mal', 3: 'Neutral', 4: 'Bien', 5: 'Muy Bien' };
                                  return labels[ctx.raw] || `Nivel ${ctx.raw}`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Gráfica de frecuencia de emociones */}
                  {stats?.conteo && Object.keys(stats.conteo).length > 0 && (
                    <div className="animo-chart-card">
                      <h3>Frecuencia de emociones</h3>
                      <div className="animo-chart-wrapper">
                        <Bar
                          data={{
                            labels: Object.keys(stats.conteo).map(e => {
                              const info = getEmocionInfo(e);
                              return info.nombre;
                            }),
                            datasets: [{
                              label: 'Veces registrado',
                              data: Object.values(stats.conteo),
                              backgroundColor: Object.keys(stats.conteo).map(e => getEmocionInfo(e).color + 'CC'),
                              borderColor: Object.keys(stats.conteo).map(e => getEmocionInfo(e).color),
                              borderWidth: 1,
                              borderRadius: 6,
                              barThickness: 28,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            scales: {
                              x: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                  color: 'var(--text-secondary, #6B6B6B)',
                                  font: { size: 11 }
                                },
                                grid: { color: 'rgba(0,0,0,0.06)' }
                              },
                              y: {
                                ticks: {
                                  color: 'var(--text-primary, #1A1A1A)',
                                  font: { size: 13, weight: '500' }
                                },
                                grid: { display: false }
                              }
                            },
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                padding: 10,
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h3>Historial reciente</h3>
              <div className="historial-animo">
                {estadosAnimo.length > 0 ? estadosAnimo.slice(0, 10).map(estado => {
                  const emocionId = estado.emocion || mapBackendEmocion(estado.emociones_nombres) || mapNivelToEmocion(estado.nivel_animo);
                  const emocion = getEmocionInfo(emocionId);
                  const fechaStr = estado.fecha_hora || `${estado.fecha} ${estado.created_at?.split(' ')[1] || '00:00:00'}`;
                  return (
                    <div key={estado.id} className="estado-card" style={{ borderLeftColor: emocion.color }}>
                      <div className="estado-header">
                        <span className="estado-emoji"><LucideIcon name={emocion.icon} size={20} /></span>
                        <span className="estado-nombre">{emocion.nombre}</span>
                        <span className="estado-fecha">
                          {new Date(fechaStr).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {estado.notas && <p className="estado-notas">{estado.notas}</p>}
                    </div>
                  );
                }) : (
                  <div className="empty-state">
                    <p>No hay registros de estado de ánimo</p>
                    <p className="help-text">Registra cómo te sientes para entender mejor tu proceso</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TAB: HERRAMIENTAS ACT ===== */}
          {activeTab === 'ejercicios' && (
            <div className="ejercicios-section">
              {/* Asignaciones pendientes del especialista */}
              {!categoriaSeleccionada && asignacionesACT.length > 0 && (
                <div className="asignaciones-pendientes" style={{ marginBottom: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    <LucideIcon name="clipboard-list" size={20} />
                    Actividades asignadas por tu especialista
                    <span style={{
                      background: '#9C27B0', color: '#fff', borderRadius: '12px',
                      padding: '2px 10px', fontSize: '13px', fontWeight: 700
                    }}>
                      {asignacionesACT.length}
                    </span>
                  </h3>
                  {asignacionesACT.map(asig => {
                    const catInfo = ACT_CATEGORIAS.find(c => c.id === asig.categoria);
                    let contenido = null;
                    if (asig.contenido) {
                      try { contenido = typeof asig.contenido === 'string' ? JSON.parse(asig.contenido) : asig.contenido; } catch (e) { /* ignore */ }
                    }
                    return (
                      <div key={asig.id} className="act-herramienta-card" style={{
                        '--cat-color': catInfo?.color || '#9C27B0',
                        borderLeft: `4px solid ${catInfo?.color || '#9C27B0'}`,
                        marginBottom: '10px'
                      }}>
                        <div className="act-h-info" style={{ flex: 1 }}>
                          <h3>{asig.herramienta_nombre}</h3>
                          {contenido?.descripcion && <p>{contenido.descripcion}</p>}
                          {asig.notas_especialista && !contenido && <p style={{ fontStyle: 'italic' }}>{asig.notas_especialista}</p>}
                          <div className="act-h-meta">
                            <span className="act-h-tag" style={{ background: (catInfo?.color || '#9C27B0') + '22', color: catInfo?.color || '#9C27B0' }}>
                              {catInfo?.nombre || 'Personalizada'}
                            </span>
                            {asig.prioridad === 'alta' && (
                              <span className="act-h-tag" style={{ background: '#f4433622', color: '#f44336' }}>
                                Prioridad alta
                              </span>
                            )}
                            {contenido?.duracion && (
                              <span className="act-h-duracion"><LucideIcon name="alarm-clock" size={14} /> {contenido.duracion} min</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ background: catInfo?.color || '#9C27B0' }}
                          onClick={() => handleIniciarAsignada(asig)}
                        >
                          Comenzar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!categoriaSeleccionada ? (
                <>
                  <p className="intro-text">
                    Herramientas de Terapia de Aceptación y Compromiso (ACT) basadas en Steven C. Hayes.
                    Elige una categoría para explorar.
                  </p>
                  <div className="act-categorias-grid">
                    {ACT_CATEGORIAS.map(cat => (
                      <div
                        key={cat.id}
                        className="act-categoria-card"
                        style={{ '--cat-color': cat.color }}
                        onClick={() => setCategoriaSeleccionada(cat)}
                      >
                        <span className="act-cat-emoji"><LucideIcon name={cat.icon} size={24} /></span>
                        <h3>{cat.nombre}</h3>
                        <p>{cat.descripcion}</p>
                        <span className="act-cat-count">3 herramientas</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button className="btn-back" onClick={() => setCategoriaSeleccionada(null)}>
                    ← Volver a categorías
                  </button>
                  <div className="act-categoria-header" style={{ '--cat-color': categoriaSeleccionada.color }}>
                    <span className="act-cat-emoji-lg"><LucideIcon name={categoriaSeleccionada.icon} size={32} /></span>
                    <h2>{categoriaSeleccionada.nombre}</h2>
                    <p>{categoriaSeleccionada.descripcion}</p>
                  </div>
                  <div className="act-herramientas-list">
                    {getHerramientasByCategoria(categoriaSeleccionada.id).map(h => (
                      <div key={h.id} className="act-herramienta-card" style={{ '--cat-color': categoriaSeleccionada.color }}>
                        <div className="act-h-info">
                          <h3>{h.nombre}</h3>
                          <p>{h.descripcion}</p>
                          <div className="act-h-meta">
                            <span className="act-h-duracion"><LucideIcon name="alarm-clock" size={14} /> {h.duracion} min</span>
                            {h.tieneEscritura && <span className="act-h-tag"><LucideIcon name="pencil" size={14} /> Escritura</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ background: categoriaSeleccionada.color }}
                          onClick={() => handleIniciarHerramienta(h)}
                        >
                          Comenzar
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {historialACT.length > 0 && !categoriaSeleccionada && (
                <div className="historial-act">
                  <h3>Sesiones recientes</h3>
                  {historialACT.slice(0, 5).map(s => {
                    const cat = ACT_CATEGORIAS.find(c => c.id === s.categoria);
                    return (
                      <div key={s.id} className="act-sesion-item">
                        <span className="act-sesion-emoji"><LucideIcon name={cat?.icon || 'brain'} size={20} /></span>
                        <div className="act-sesion-info">
                          <span className="act-sesion-nombre">{s.herramienta}</span>
                          <span className="act-sesion-fecha">{new Date(s.fecha).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="recursos-adicionales">
                <h3>Recursos adicionales</h3>
                <ul>
                  <li>
                    <a href="tel:8009112000" className="recurso-link">
                      <LucideIcon name="phone" size={16} /> Línea de la Vida: 800 911 2000
                    </a>
                  </li>
                  <li>
                    <span className="recurso-text">
                      Si sientes que necesitas apoyo profesional, no dudes en contactar a tu especialista
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ===== TAB: EVALUACIONES NEUROPSICOLÓGICAS ===== */}
          {activeTab === 'evaluaciones' && (
            <div className="evaluaciones-section">


              {/* --- Sección: Cuestionarios del Especialista (interactivos) --- */}
              {misCuestionarios.length > 0 && (
                <div className="eval-subsection">
                  <div className="eval-subsection-header">
                    <LucideIcon name="list-checks" size={22} />
                    <h2>Cuestionarios de tu Especialista</h2>
                  </div>

                  {cuestActivo ? (
                    /* Formulario interactivo de cuestionario */
                    <div className="cuestionario-interactivo">
                      <h3>{cuestActivo.titulo}</h3>
                      {cuestActivo.descripcion && <p className="cuestionario-desc">{cuestActivo.descripcion}</p>}

                      <div className="cuestionario-preguntas">
                        {cuestActivo.preguntas.map((preg, idx) => (
                          <div key={idx} className="cuestionario-pregunta">
                            <label className="pregunta-texto">{idx + 1}. {preg.texto}</label>

                            {preg.tipo === 'escala' && (
                              <div className="pregunta-escala">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={cuestRespuestas[idx] ?? 5}
                                  onChange={e => handleRespuestaChange(idx, parseInt(e.target.value))}
                                  className="escala-slider"
                                />
                                <div className="escala-labels">
                                  <span>0</span>
                                  <span className="escala-valor-actual">{cuestRespuestas[idx] ?? 5}</span>
                                  <span>10</span>
                                </div>
                              </div>
                            )}

                            {preg.tipo === 'opcion_multiple' && (
                              <div className="pregunta-opciones">
                                {(preg.opciones || []).map((op, oIdx) => (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    className={`opcion-btn ${cuestRespuestas[idx] === op ? 'selected' : ''}`}
                                    onClick={() => handleRespuestaChange(idx, op)}
                                  >
                                    {op}
                                  </button>
                                ))}
                              </div>
                            )}

                            {preg.tipo === 'si_no' && (
                              <div className="pregunta-sino">
                                <button
                                  type="button"
                                  className={`sino-btn ${cuestRespuestas[idx] === 'Sí' ? 'selected si' : ''}`}
                                  onClick={() => handleRespuestaChange(idx, 'Sí')}
                                >Sí</button>
                                <button
                                  type="button"
                                  className={`sino-btn ${cuestRespuestas[idx] === 'No' ? 'selected no' : ''}`}
                                  onClick={() => handleRespuestaChange(idx, 'No')}
                                >No</button>
                              </div>
                            )}

                            {preg.tipo === 'texto' && (
                              <textarea
                                className="pregunta-texto-input"
                                value={cuestRespuestas[idx] || ''}
                                onChange={e => handleRespuestaChange(idx, e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                rows={3}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="cuestionario-actions">
                        <button className="btn btn-secondary" onClick={() => setCuestActivo(null)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleEnviarRespuesta} disabled={enviandoResp}>
                          {enviandoResp ? 'Enviando...' : 'Enviar Respuestas'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cuestionarios-list">
                      {misCuestionarios.map(c => (
                        <div key={c.id} className={`cuestionario-card ${c.respondido ? 'respondido' : ''}`}>
                          <div className="cuestionario-card-header">
                            <h3>{c.titulo}</h3>
                            <span className="cuestionario-tiempo">
                              <LucideIcon name="list" size={14} /> {c.preguntas?.length || 0} preguntas
                            </span>
                          </div>
                          {c.descripcion && <p className="cuestionario-nombre-completo">{c.descripcion}</p>}
                          {c.especialista_nombre && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Por: {c.especialista_nombre}</p>}
                          {c.respondido ? (
                            <div className="cuestionario-respondido-info">
                              <span className="badge-respondido"><LucideIcon name="check-circle" size={14} /> Completado</span>
                              {c.ultima_respuesta?.puntaje_total !== null && (
                                <span className="badge-puntaje">{c.ultima_respuesta.puntaje_total} pts</span>
                              )}
                              <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => handleIniciarCuestPersonalizado(c)}>
                                Responder de nuevo
                              </button>
                            </div>
                          ) : (
                            <button className="btn btn-primary" onClick={() => handleIniciarCuestPersonalizado(c)}>
                              Comenzar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- Sección: Perfil Neuropsicológico --- */}
              <div className="eval-subsection">
                <div className="eval-subsection-header">
                  <LucideIcon name="brain" size={22} />
                  <h2>Perfil Neuropsicologico</h2>
                </div>
                <p className="intro-text">
                  Evaluacion de funciones cognitivas. Los colores indican el nivel de desempeno en cada area.
                </p>

                {/* Leyenda del semáforo */}
                <div className="semaforo-leyenda">
                  <div className="leyenda-item">
                    <span className="leyenda-color" style={{ background: '#C62828' }}></span>
                    <span className="leyenda-texto">Oportunidad</span>
                  </div>
                  <div className="leyenda-item">
                    <span className="leyenda-color" style={{ background: '#F9A825' }}></span>
                    <span className="leyenda-texto">Promedio</span>
                  </div>
                  <div className="leyenda-item">
                    <span className="leyenda-color" style={{ background: '#2E7D32' }}></span>
                    <span className="leyenda-texto">Fortaleza</span>
                  </div>
                </div>

                {evaluacion ? (
                  <>
                    <div className="eval-info-card">
                      <div className="eval-info-row">
                        <span className="eval-info-label">Evaluado por:</span>
                        <span className="eval-info-value">{evaluacion.especialista_nombre || 'Especialista'}</span>
                      </div>
                      <div className="eval-info-row">
                        <span className="eval-info-label">Fecha:</span>
                        <span className="eval-info-value">
                          {new Date(evaluacion.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      {evaluacion.notas && (
                        <div className="eval-info-row">
                          <span className="eval-info-label">Notas:</span>
                          <span className="eval-info-value">{evaluacion.notas}</span>
                        </div>
                      )}
                    </div>

                    {buildChartData(evaluacion) && (
                      <div className="perfil-chart-container">
                        <h3>Perfil Neuropsicologico</h3>
                        <div className="perfil-chart-wrapper">
                          <Bar data={buildChartData(evaluacion)} options={chartOptions} />
                        </div>
                      </div>
                    )}

                    <div className="perfil-tabla-container">
                      <h3>Detalle por funcion</h3>
                      <div className="perfil-tabla">
                        <div className="perfil-tabla-header">
                          <span>Funcion</span>
                          <span>Puntaje</span>
                          <span>Nivel</span>
                        </div>
                        {getCamposEvaluacion(evaluacion).map((campo, idx) => (
                          <div key={idx} className="perfil-tabla-row">
                            <span className="perfil-func-nombre">{campo.nombre}</span>
                            <span className="perfil-func-puntaje" style={{ color: getColorSemaforo(campo.valor) }}>
                              {campo.valor.toFixed(1)}
                            </span>
                            <span className="perfil-func-nivel" style={{ color: getColorSemaforo(campo.valor) }}>
                              {getNivelSemaforo(campo.valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="perfil-resumen">
                      <h3>Resumen</h3>
                      <div className="perfil-resumen-grid">
                        {['Fortaleza', 'Promedio', 'Oportunidad'].map(nivel => {
                          const funciones = getCamposEvaluacion(evaluacion).filter(c => getNivelSemaforo(c.valor) === nivel);
                          const color = nivel === 'Fortaleza' ? '#2E7D32' : nivel === 'Promedio' ? '#F9A825' : '#C62828';
                          return (
                            <div key={nivel} className="perfil-resumen-card" style={{ '--nivel-color': color }}>
                              <span className="resumen-count">{funciones.length}</span>
                              <span className="resumen-nivel" style={{ color }}>{nivel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {historialEval.length > 1 && (
                      <div className="historial-evaluaciones">
                        <h3>Evaluaciones anteriores</h3>
                        {historialEval.slice(1).map(ev => (
                          <div key={ev.id} className="eval-historial-item">
                            <span className="eval-hist-fecha">
                              {new Date(ev.fecha).toLocaleDateString('es-MX')}
                            </span>
                            <span className="eval-hist-especialista">
                              {ev.especialista_nombre || 'Especialista'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon"><LucideIcon name="brain" size={32} /></div>
                    <p>Aun no tienes una evaluacion neuropsicologica</p>
                    <p className="help-text">Tu especialista realizara tu evaluacion durante tu consulta</p>
                  </div>
                )}

                {(user?.rol === 'especialista' || user?.role === 'especialista') && (
                  <button
                    className="btn btn-primary btn-lg btn-block eval-nueva-btn"
                    onClick={() => setShowModalEval(true)}
                  >
                    Nueva Evaluacion
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de estado de ánimo */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>¿Cómo te sientes?</h2>
            <p className="modal-subtitle">Selecciona la emoción que mejor describe cómo te sientes ahora</p>

            <div className="emociones-grid">
              {emociones.map(emocion => (
                <button
                  key={emocion.id}
                  className={`emocion-btn ${emocionSeleccionada === emocion.id ? 'selected' : ''}`}
                  onClick={() => setEmocionSeleccionada(emocion.id)}
                  style={{
                    '--emocion-color': emocion.color,
                    borderColor: emocionSeleccionada === emocion.id ? emocion.color : 'transparent'
                  }}
                >
                  <span className="emocion-emoji"><LucideIcon name={emocion.icon} size={24} /></span>
                  <span className="emocion-nombre">{emocion.nombre}</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <label>¿Quieres agregar una nota? (opcional)</label>
              <textarea
                value={notasAnimo}
                onChange={e => setNotasAnimo(e.target.value)}
                className="form-control"
                rows="3"
                placeholder="¿Qué está pasando? ¿Qué lo provocó?"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={registrarEstadoAnimo} disabled={!emocionSeleccionada}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cuestionario activo */}
      {cuestionarioActivo && (
        <CuestionarioActivo
          cuestionario={cuestionarioActivo}
          onComplete={handleCompletarCuestionario}
          onCancel={() => setCuestionarioActivo(null)}
        />
      )}

      {/* Modal: Resultado de cuestionario */}
      {resultadoActivo && cuestionarioResultado && (
        <CuestionarioResultado
          cuestionario={cuestionarioResultado}
          resultado={resultadoActivo}
          onClose={() => {
            setResultadoActivo(null);
            setCuestionarioResultado(null);
            cargarDatos();
          }}
        />
      )}

      {/* Modal: Ejercicio ACT activo */}
      {herramientaActiva && (
        <ACTEjercicioActivo
          herramienta={herramientaActiva}
          categoria={ACT_CATEGORIAS.find(c => c.id === herramientaActiva.categoriaId)}
          onComplete={handleCompletarHerramienta}
          onCancel={() => setHerramientaActiva(null)}
        />
      )}

      {/* Modal: Evaluación neuropsicológica (especialista) */}
      {showModalEval && (
        <div className="modal-overlay" onClick={() => setShowModalEval(false)}>
          <div className="modal-content eval-modal" onClick={e => e.stopPropagation()}>
            <h2>Nueva Evaluacion Neuropsicologica</h2>
            <p className="modal-subtitle">Agrega los campos que desees evaluar con su puntaje (0-10)</p>

            <div className="eval-campos-dinamicos">
              {evalCampos.map((campo, index) => (
                <div key={index} className="eval-campo-row">
                  <input
                    type="text"
                    value={campo.nombre}
                    onChange={e => handleCampoChange(index, 'nombre', e.target.value)}
                    className="form-control eval-campo-nombre"
                    placeholder="Nombre del campo (ej: Atencion Visual)"
                  />
                  <div className="eval-campo-valor-wrapper">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={campo.valor}
                      onChange={e => handleCampoChange(index, 'valor', e.target.value)}
                      className="form-control eval-campo-valor"
                      placeholder="0-10"
                    />
                    {campo.valor !== '' && (
                      <span
                        className="eval-input-indicator"
                        style={{ background: getColorSemaforo(parseFloat(campo.valor)) }}
                      ></span>
                    )}
                  </div>
                  {evalCampos.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-campo"
                      onClick={() => handleEliminarCampo(index)}
                      aria-label="Eliminar campo"
                    >
                      <LucideIcon name="trash-2" size={18} />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="btn-agregar-campo" onClick={handleAgregarCampo}>
                <LucideIcon name="plus" size={18} />
                Agregar campo
              </button>
            </div>

            <div className="form-group">
              <label>Notas de la evaluacion (opcional)</label>
              <textarea
                value={evalNotas}
                onChange={e => setEvalNotas(e.target.value)}
                className="form-control"
                rows="3"
                placeholder="Observaciones generales de la evaluacion..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModalEval(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGuardarEvaluacion}
                disabled={savingEval || evalCampos.filter(c => c.nombre.trim() && c.valor !== '').length === 0}
              >
                {savingEval ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default Neuropsicologia;
