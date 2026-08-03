import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoice, Speakable } from '../components/VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Medicina.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

/**
 * Medicina - Módulo de control de salud
 * Diseño accesible para usuarios de 10 a 80 años
 */
const Medicina = () => {
  const { user } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, isSpeaking, stop, speakModule } = useVoice();
  const mainContentRef = useRef(null);

  const [activeTab, setActiveTab] = useState('glucosa');
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [saving, setSaving] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [showInactivos, setShowInactivos] = useState(false);
  const [indicaciones, setIndicaciones] = useState([]);
  // Obtener paciente_id con fallback al user.id
  const pacienteId = user?.paciente_id || user?.id;

  const VIAS_MAP = {
    oral: 'Oral', inyectable: 'Inyectable', topica: 'Tópica',
    inhalada: 'Inhalada', sublingual: 'Sublingual', otra: 'Otra'
  };

  // Estados para los formularios
  const [glucosaForm, setGlucosaForm] = useState({
    nivel_glucosa: '',
    momento: 'ayunas',
    notas: ''
  });

  const [presionForm, setPresionForm] = useState({
    sistolica: '',
    diastolica: '',
    pulso: '',
    notas: ''
  });

  const [dolorForm, setDolorForm] = useState({
    nivel_dolor: 5,
    ubicacion: '',
    tipo_dolor: 'agudo',
    notas: ''
  });

  const [hba1cForm, setHba1cForm] = useState({
    valor: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  });


  
  // Bienvenida por voz al entrar al módulo
  useEffect(() => {
    if (settings.voiceNavigation) {
      speak('Bienvenido al módulo de Control de Salud. Aquí puedes registrar tus niveles de glucosa, presión arterial, dolor, y ver tus medicamentos.');
    }
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'medicamentos') {
        const medResponse = await api.get(`/medicina/medicamentos/${pacienteId}`);
        setMedicamentos(medResponse?.data || medResponse || []);
        setRegistros([]);
      } else {
        const endpoint = `/medicina/${activeTab}/${pacienteId}`;
        const response = await api.get(endpoint);
        setRegistros(response.data || []);
      }

      // Cargar estadísticas
      const statsResponse = await api.get(`/medicina/resumen/${pacienteId}`);
      setEstadisticas(statsResponse.data);
    } catch (err) {
      console.error('Error al cargar datos médicos:', err);
      setEstadisticas({
        glucosa: { ultimo: 105, promedio: 110 },
        presion: { ultima_sistolica: 120, ultima_diastolica: 80 },
        dolor: { promedio: 3.5, total_registros: 5 }
      });
    } finally {
      setLoading(false);
    }
  };
  const cargarIndicaciones = async () => {
  try {
    const res = await api.get(`/indicaciones/paciente/${pacienteId}`);
    console.log("RES COMPLETO:", res);
    console.log("res.data:", res.data);
    console.log("res.data.data:", res.data?.data);

    if (res.data.success) {
      setIndicaciones(res.data.data);
    }
  } catch (err) {
    console.error("Error cargando indicaciones:", err);
  }
};
useEffect(() => {
  cargarDatos();
  cargarIndicaciones();
}, [activeTab, pacienteId]);


  const abrirModal = (tipo) => {
    setModalType(tipo);
    setShowModal(true);

    // Anunciar por voz
    if (settings.voiceNavigation) {
      const nombres = {
        glucosa: 'glucosa',
        presion: 'presión arterial',
        dolor: 'dolor',
        hba1c: 'hemoglobina glicosilada'
      };
      speak(`Formulario para registrar ${nombres[tipo]}`);
    }
  };

  const handleSubmitGlucosa = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/medicina/glucosa', {
        paciente_id: pacienteId,
        nivel_glucosa: glucosaForm.nivel_glucosa,
        momento: glucosaForm.momento,
        notas: glucosaForm.notas,
        fecha_hora: new Date().toISOString()
      });
      setShowModal(false);
      setGlucosaForm({ nivel_glucosa: '', momento: 'ayunas', notas: '' });

      if (settings.voiceNavigation) {
        speak('Registro de glucosa guardado correctamente.');
      }
      cargarDatos();
    } catch (err) {
      console.error('Error al registrar glucosa:', err);
      if (settings.voiceNavigation) {
        speak('Error al guardar el registro. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPresion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/medicina/presion', {
        paciente_id: pacienteId,
        sistolica: presionForm.sistolica,
        diastolica: presionForm.diastolica,
        pulso: presionForm.pulso,
        notas: presionForm.notas,
        fecha_hora: new Date().toISOString()
      });
      setShowModal(false);
      setPresionForm({ sistolica: '', diastolica: '', pulso: '', notas: '' });

      if (settings.voiceNavigation) {
        speak('Registro de presión arterial guardado correctamente.');
      }
      cargarDatos();
    } catch (err) {
      console.error('Error al registrar presión:', err);
      if (settings.voiceNavigation) {
        speak('Error al guardar el registro. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDolor = async (e) => {
    e.preventDefault();
    if (!dolorForm.ubicacion.trim()) {
      if (settings.voiceNavigation) {
        speak('Por favor indica dónde te duele.');
      }
      return;
    }
    setSaving(true);
    try {
      await api.post('/medicina/dolor', {
        paciente_id: pacienteId,
        nivel_dolor: dolorForm.nivel_dolor,
        ubicacion: dolorForm.ubicacion.trim(),
        tipo_dolor: dolorForm.tipo_dolor,
        notas: dolorForm.notas,
        fecha_hora: new Date().toISOString()
      });
      setShowModal(false);
      setDolorForm({ nivel_dolor: 5, ubicacion: '', tipo_dolor: 'agudo', notas: '' });

      if (settings.voiceNavigation) {
        speak('Registro de dolor guardado correctamente.');
      }
      cargarDatos();
    } catch (err) {
      console.error('Error al registrar dolor:', err);
      if (settings.voiceNavigation) {
        speak('Error al guardar el registro. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitHba1c = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/medicina/hba1c', {
        paciente_id: pacienteId,
        valor: hba1cForm.valor,
        fecha: hba1cForm.fecha,
        notas: hba1cForm.notas
      });
      setShowModal(false);
      setHba1cForm({ valor: '', fecha: new Date().toISOString().split('T')[0], notas: '' });
      if (settings.voiceNavigation) {
        speak('Registro de hemoglobina glicosilada guardado correctamente.');
      }
      cargarDatos();
    } catch (err) {
      console.error('Error al registrar HbA1c:', err);
      if (settings.voiceNavigation) {
        speak('Error al guardar el registro. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getHba1cColor = (valor) => {
    if (valor < 5.7) return '#4CAF50';
    if (valor < 6.5) return '#FF9800';
    return '#EF5350';
  };

  const getHba1cTexto = (valor) => {
    if (valor < 5.7) return 'Normal';
    if (valor < 6.5) return 'Prediabético';
    return 'Diabético';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    if (settings.voiceNavigation) {
      const nombres = {
        glucosa: 'Glucosa',
        presion: 'Presión arterial',
        dolor: 'Dolor',
        hba1c: 'Hemoglobina Glicosilada',
        medicamentos: 'Mis Medicamentos'
      };
      speak(`Mostrando ${nombres[tab]}`);
    }
  };

  const getNivelGlucosaColor = (nivel) => {
    if (nivel < 70) return 'bajo';
    if (nivel > 140) return 'alto';
    return 'normal';
  };

  const getNivelGlucosaTexto = (nivel) => {
    if (nivel < 70) return 'Bajo';
    if (nivel > 140) return 'Alto';
    return 'Normal';
  };

  const getPresionColor = (sistolica, diastolica) => {
    if (sistolica >= 140 || diastolica >= 90) return 'alto';
    if (sistolica < 90 || diastolica < 60) return 'bajo';
    return 'normal';
  };

  const getPresionTexto = (sistolica, diastolica) => {
    if (sistolica >= 140 || diastolica >= 90) return 'Elevada';
    if (sistolica < 90 || diastolica < 60) return 'Baja';
    return 'Normal';
  };

  const getDolorEmoji = (nivel) => {
    if (nivel <= 2) return <LucideIcon name="smile" size={20} />;
    if (nivel <= 4) return <LucideIcon name="meh" size={20} />;
    if (nivel <= 6) return <LucideIcon name="frown" size={20} />;
    if (nivel <= 8) return <LucideIcon name="frown" size={20} />;
    return <LucideIcon name="angry" size={20} />;
  };

  const getDolorColor = (nivel) => {
    if (nivel <= 3) return '#2E7D32';
    if (nivel <= 6) return '#E65100';
    return '#C62828';
  };

  const formatFechaRelativa = (fecha) => {
    const ahora = new Date();
    const fechaRegistro = new Date(fecha);
    const diffMs = ahora - fechaRegistro;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return fechaRegistro.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const formatFechaMedicamento = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return fecha; }
  };

  const speakMedicamento = (med) => {
    const estado = (med.activo == 1) ? 'activo' : 'finalizado';
    const via = VIAS_MAP[med.via_administracion] || med.via_administracion;
    let texto = `Medicamento ${estado}: ${med.nombre_comercial}`;
    if (med.nombre_generico) texto += `, nombre genérico ${med.nombre_generico}`;
    texto += `. Dosis: ${med.dosis}. Frecuencia: ${med.frecuencia}. Vía: ${via}.`;
    if (med.instrucciones_especiales) texto += ` Instrucciones: ${med.instrucciones_especiales}.`;
    speak(texto);
  };

  const speakRegistro = (registro, tipo) => {
    let texto = '';
    if (tipo === 'glucosa') {
      texto = `Glucosa ${registro.nivel_glucosa} miligramos por decilitro, nivel ${getNivelGlucosaTexto(registro.nivel_glucosa)}, momento ${registro.momento?.replace('_', ' ')}. ${registro.notas || ''}`;
    } else if (tipo === 'presion') {
      texto = `Presión ${registro.sistolica} sobre ${registro.diastolica} milímetros de mercurio, pulso ${registro.pulso} latidos por minuto, nivel ${getPresionTexto(registro.sistolica, registro.diastolica)}. ${registro.notas || ''}`;
    } else if (tipo === 'dolor') {
      texto = `Dolor nivel ${registro.nivel_dolor} de 10, ubicación ${registro.ubicacion}, tipo ${registro.tipo_dolor}. ${registro.notas || ''}`;
    }
    speak(texto);
  };

  const tabInfo = {
    glucosa: { icon: 'heart-pulse', label: 'Glucosa', color: '#1976D2' },
    presion: { icon: 'heart', label: 'Presión', color: '#AD1457' },
    dolor: { icon: 'heart-pulse', label: 'Dolor', color: '#E65100' },
    hba1c: { icon: 'droplet', label: 'HbA1c', color: '#FF6F00' },
    medicamentos: { icon: 'pill', label: 'Medicamentos', color: '#7B1FA2' }
  };
  console.log("pacienteId:", pacienteId);
console.log("indicaciones state:", indicaciones);
console.log("cantidad:", indicaciones.length);
  return (
    <div
      className="medicina-page"
      data-theme={settings.theme}
      data-font-scale={settings.fontScale}
      data-contrast={settings.contrast}
      data-age-mode={settings.ageMode}
      data-reduced-motion={settings.reducedMotion}
    >
      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <a href="#registros-list" className="skip-link">
        Saltar a los registros
      </a>

      {/* Header mejorado */}
      <header className="medicina-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon" aria-hidden="true"><LucideIcon name="pill" size={24} /></div>
            <div className="header-text">
              <h1 id="page-title">Control de Salud</h1>
              <p className="subtitle">Monitorea tus signos vitales</p>
            </div>
          </div>

          <div className="header-controls">
            {/* Botón de voz */}
            <button
              className={`control-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => isSpeaking ? stop() : speakModule('medicina')}
              aria-label={isSpeaking ? 'Detener audio' : 'Escuchar ayuda del módulo'}
              aria-pressed={isSpeaking}
            >
              <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
            </button>

            {/* Botón de accesibilidad */}
            <button
              className="control-btn accessibility-btn"
              onClick={togglePanel}
              aria-label="Abrir configuración de accesibilidad"
            >
              <LucideIcon name="accessibility" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Tarjetas de resumen mejoradas */}
      <section className="stats-section" aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">Resumen de signos vitales</h2>
        <div className="stats-grid">
          <Speakable text={`Glucosa: ${estadisticas?.glucosa?.ultimo || 'sin datos'} miligramos por decilitro. ${estadisticas?.glucosa?.ultimo ? getNivelGlucosaTexto(estadisticas.glucosa.ultimo) : ''}`}>
            <button
              className={`stat-card-new glucosa ${estadisticas?.glucosa?.ultimo ? getNivelGlucosaColor(estadisticas.glucosa.ultimo) : ''}`}
              onClick={() => handleTabChange('glucosa')}
              aria-label={`Ver registros de glucosa. Último valor: ${estadisticas?.glucosa?.ultimo || 'sin datos'} mg/dL`}
            >
              <div className="stat-icon" aria-hidden="true"><LucideIcon name="heart-pulse" size={22} /></div>
              <div className="stat-content">
                <span className="stat-label">Glucosa</span>
                <span className="stat-value-big">
                  {estadisticas?.glucosa?.ultimo || '--'}
                  <small>mg/dL</small>
                </span>
                {estadisticas?.glucosa?.ultimo && (
                  <span className={`stat-status ${getNivelGlucosaColor(estadisticas.glucosa.ultimo)}`}>
                    {getNivelGlucosaTexto(estadisticas.glucosa.ultimo)}
                  </span>
                )}
              </div>
            </button>
          </Speakable>

          <Speakable text={`Presión arterial: ${estadisticas?.presion?.ultima_sistolica || 'sin datos'} sobre ${estadisticas?.presion?.ultima_diastolica || 'sin datos'} milímetros de mercurio. ${estadisticas?.presion?.ultima_sistolica ? getPresionTexto(estadisticas.presion.ultima_sistolica, estadisticas.presion.ultima_diastolica) : ''}`}>
            <button
              className={`stat-card-new presion ${estadisticas?.presion?.ultima_sistolica ? getPresionColor(estadisticas.presion.ultima_sistolica, estadisticas.presion.ultima_diastolica) : ''}`}
              onClick={() => handleTabChange('presion')}
              aria-label={`Ver registros de presión. Último valor: ${estadisticas?.presion?.ultima_sistolica || 'sin datos'}/${estadisticas?.presion?.ultima_diastolica || 'sin datos'} mmHg`}
            >
              <div className="stat-icon" aria-hidden="true"><LucideIcon name="heart" size={22} /></div>
              <div className="stat-content">
                <span className="stat-label">Presión Arterial</span>
                <span className="stat-value-big">
                  {estadisticas?.presion?.ultima_sistolica || '--'}/{estadisticas?.presion?.ultima_diastolica || '--'}
                  <small>mmHg</small>
                </span>
                {estadisticas?.presion?.ultima_sistolica && (
                  <span className={`stat-status ${getPresionColor(estadisticas.presion.ultima_sistolica, estadisticas.presion.ultima_diastolica)}`}>
                    {getPresionTexto(estadisticas.presion.ultima_sistolica, estadisticas.presion.ultima_diastolica)}
                  </span>
                )}
              </div>
            </button>
          </Speakable>

          <Speakable text={`Dolor promedio: ${estadisticas?.dolor?.promedio ? Number(estadisticas.dolor.promedio).toFixed(1) : 'sin datos'} de 10. ${estadisticas?.dolor?.total_registros || 0} registros.`}>
            <button
              className="stat-card-new dolor"
              onClick={() => handleTabChange('dolor')}
              aria-label={`Ver registros de dolor. Promedio: ${estadisticas?.dolor?.promedio ? Number(estadisticas.dolor.promedio).toFixed(1) : 'sin datos'} de 10`}
            >
              <div className="stat-icon" aria-hidden="true">
                {estadisticas?.dolor?.promedio ? getDolorEmoji(estadisticas.dolor.promedio) : <LucideIcon name="heart-pulse" size={22} />}
              </div>
              <div className="stat-content">
                <span className="stat-label">Dolor Promedio</span>
                <span className="stat-value-big">
                  {estadisticas?.dolor?.promedio ? Number(estadisticas.dolor.promedio).toFixed(1) : '--'}
                  <small>/10</small>
                </span>
                {estadisticas?.dolor?.total_registros > 0 && (
                  <span className="stat-status neutral">
                    {estadisticas.dolor.total_registros} registros
                  </span>
                )}
              </div>
            </button>
          </Speakable>
        </div>
      </section>
      {/* Indicaciones del especialista */}
<section className="stats-section">
  <div className="stat-card-new">
    <div className="stat-content">

      <h3 style={{ color: "red", fontSize: "30px" }}>
  HOLA SOY MEDICINA.JSX
</h3>

      {indicaciones.length === 0 ? (
        <p>No tienes indicaciones registradas.</p>
      ) : (
        indicaciones.map((item) => (
          <div
            key={item.id}
            style={{
              marginBottom: "12px",
              paddingBottom: "10px",
              borderBottom: "1px solid #ddd"
            }}
          >
            <strong>{item.titulo}</strong>

            <p>{item.descripcion}</p>

            <small>
              Especialista: {item.especialista}
            </small>
          </div>
        ))
      )}

    </div>
  </div>
</section>

      {/* Tabs mejorados */}
      <nav className="tabs-container" role="tablist" aria-label="Tipos de registro médico">
        <div className="tabs-new">
          {Object.entries(tabInfo).map(([key, info]) => (
            <button
              key={key}
              role="tab"
              id={`tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`panel-${key}`}
              className={`tab-new ${activeTab === key ? 'active' : ''}`}
              onClick={() => handleTabChange(key)}
              onFocus={() => settings.autoSpeak && speak(info.label)}
              style={activeTab === key ? { '--tab-color': info.color } : {}}
            >
              <span className="tab-icon" aria-hidden="true"><LucideIcon name={info.icon} size={18} /></span>
              <span className="tab-label">{info.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Gráfica de tendencia */}
      {!loading && registros.length >= 3 && activeTab !== 'medicamentos' && (
        <section className="medicina-chart-section">
          <div className="medicina-chart-card">
            <h3 className="medicina-chart-title">
              {activeTab === 'glucosa' && 'Tendencia de Glucosa'}
              {activeTab === 'presion' && 'Tendencia de Presión Arterial'}
              {activeTab === 'dolor' && 'Tendencia de Dolor'}
              {activeTab === 'hba1c' && 'Tendencia de HbA1c'}
            </h3>
            <div className="medicina-chart-wrapper">
              {activeTab === 'glucosa' && (
                <Line
                  data={{
                    labels: [...registros].reverse().slice(-20).map(r => {
                      const f = new Date(r.fecha_hora);
                      return `${f.getDate()}/${f.getMonth() + 1}`;
                    }),
                    datasets: [{
                      label: 'Glucosa (mg/dL)',
                      data: [...registros].reverse().slice(-20).map(r => r.nivel_glucosa),
                      borderColor: '#1976D2',
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      pointBackgroundColor: [...registros].reverse().slice(-20).map(r => {
                        if (r.nivel_glucosa < 70) return '#E65100';
                        if (r.nivel_glucosa > 140) return '#C62828';
                        return '#2E7D32';
                      }),
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      tension: 0.3,
                      fill: true,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        ticks: { color: 'var(--text-secondary, #6B6B6B)', font: { size: 11 } },
                        grid: { color: 'rgba(0,0,0,0.06)' }
                      },
                      x: {
                        ticks: { color: 'var(--text-secondary, #6B6B6B)', font: { size: 10 }, maxRotation: 45 },
                        grid: { display: false }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 },
                      annotation: undefined
                    }
                  }}
                />
              )}

              {activeTab === 'presion' && (
                <Line
                  data={{
                    labels: [...registros].reverse().slice(-20).map(r => {
                      const f = new Date(r.fecha_hora);
                      return `${f.getDate()}/${f.getMonth() + 1}`;
                    }),
                    datasets: [
                      {
                        label: 'Sistólica',
                        data: [...registros].reverse().slice(-20).map(r => r.sistolica),
                        borderColor: '#AD1457',
                        backgroundColor: 'rgba(173, 20, 87, 0.08)',
                        pointBackgroundColor: '#AD1457',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        fill: true,
                      },
                      {
                        label: 'Diastólica',
                        data: [...registros].reverse().slice(-20).map(r => r.diastolica),
                        borderColor: '#F48FB1',
                        backgroundColor: 'rgba(244, 143, 177, 0.08)',
                        pointBackgroundColor: '#F48FB1',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        fill: true,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        ticks: { color: 'var(--text-secondary, #6B6B6B)', font: { size: 11 } },
                        grid: { color: 'rgba(0,0,0,0.06)' }
                      },
                      x: {
                        ticks: { color: 'var(--text-secondary, #6B6B6B)', font: { size: 10 }, maxRotation: 45 },
                        grid: { display: false }
                      }
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 12, padding: 16, font: { size: 12 }, color: 'var(--text-primary, #1A1A1A)' }
                      },
                      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 }
                    }
                  }}
                />
              )}

              {activeTab === 'dolor' && (
                <Line
                  data={{
                    labels: [...registros].reverse().slice(-20).map(r => {
                      const f = new Date(r.fecha_hora);
                      return `${f.getDate()}/${f.getMonth() + 1}`;
                    }),
                    datasets: [{
                      label: 'Intensidad del dolor',
                      data: [...registros].reverse().slice(-20).map(r => r.nivel_dolor),
                      borderColor: '#E65100',
                      backgroundColor: 'rgba(230, 81, 0, 0.1)',
                      pointBackgroundColor: [...registros].reverse().slice(-20).map(r => {
                        if (r.nivel_dolor <= 3) return '#2E7D32';
                        if (r.nivel_dolor <= 6) return '#E65100';
                        return '#C62828';
                      }),
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      tension: 0.3,
                      fill: true,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 10,
                        ticks: {
                          stepSize: 2,
                          color: 'var(--text-secondary, #6B6B6B)',
                          font: { size: 11 }
                        },
                        grid: { color: 'rgba(0,0,0,0.06)' }
                      },
                      x: {
                        ticks: { color: 'var(--text-secondary, #6B6B6B)', font: { size: 10 }, maxRotation: 45 },
                        grid: { display: false }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 10,
                        callbacks: {
                          label: (ctx) => `Dolor: ${ctx.raw}/10`
                        }
                      }
                    }
                  }}
                />
              )}

              {activeTab === 'hba1c' && (
                <Line
                  data={{
                    labels: [...registros].reverse().slice(-20).map(r => {
                      const f = new Date(r.fecha);
                      return `${f.getDate()}/${f.getMonth() + 1}`;
                    }),
                    datasets: [{
                      label: 'HbA1c (%)',
                      data: [...registros].reverse().slice(-20).map(r => r.valor),
                      borderColor: '#FF6F00',
                      backgroundColor: 'rgba(255, 111, 0, 0.1)',
                      pointBackgroundColor: [...registros].reverse().slice(-20).map(r => getHba1cColor(r.valor)),
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      tension: 0.3,
                      fill: true,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 3,
                        max: 14,
                        ticks: {
                          stepSize: 1,
                          color: 'var(--text-secondary, #6B6B6B)',
                          font: { size: 11 },
                          callback: (v) => v + '%'
                        },
                        grid: { color: 'rgba(0,0,0,0.06)' }
                      },
                      x: {
                        ticks: { color: 'var(--text-secondary, #6B6B6B)', font: { size: 10 }, maxRotation: 45 },
                        grid: { display: false }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 10,
                        callbacks: {
                          label: (ctx) => `HbA1c: ${ctx.raw}%`
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Botón de nuevo registro flotante - solo para tabs de registro */}
      {activeTab !== 'medicamentos' && (
        <button
          className="fab-button"
          onClick={() => abrirModal(activeTab)}
          style={{ '--fab-color': tabInfo[activeTab]?.color }}
          aria-label={`Agregar nuevo registro de ${tabInfo[activeTab]?.label}`}
        >
          <span className="fab-icon" aria-hidden="true">+</span>
          <span className="fab-text">Nuevo registro</span>
        </button>
      )}

      {/* Contenido principal */}
      <main id="main-content" ref={mainContentRef} tabIndex="-1">
        {loading ? (
          <div className="loading-container" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>Cargando registros...</p>
          </div>
        ) : (
          <div className="registros-container">
            {activeTab === 'glucosa' && (
              <div
                role="tabpanel"
                id="panel-glucosa"
                aria-labelledby="tab-glucosa"
                className="registros-list"
              >
                {registros.length > 0 ? registros.map(registro => (
                  <article
                    key={registro.id}
                    className={`registro-card-new ${getNivelGlucosaColor(registro.nivel_glucosa)}`}
                    aria-label={`Glucosa ${registro.nivel_glucosa} mg/dL, nivel ${getNivelGlucosaTexto(registro.nivel_glucosa)}`}
                  >
                    <div className="registro-left">
                      <div className="registro-icon-circle glucosa" aria-hidden="true">
                        <LucideIcon name="heart-pulse" size={20} />
                      </div>
                    </div>
                    <div className="registro-center">
                      <div className="registro-main-value">
                        <span className="big-number">{registro.nivel_glucosa}</span>
                        <span className="unit">mg/dL</span>
                      </div>
                      <div className="registro-meta">
                        <span className={`status-badge ${getNivelGlucosaColor(registro.nivel_glucosa)}`}>
                          {getNivelGlucosaTexto(registro.nivel_glucosa)}
                        </span>
                        <span className="momento-badge">{registro.momento?.replace('_', ' ')}</span>
                      </div>
                      {registro.notas && <p className="registro-notas">{registro.notas}</p>}
                    </div>
                    <div className="registro-right">
                      <span className="tiempo-relativo">{formatFechaRelativa(registro.fecha_hora)}</span>
                      <button
                        className="btn-voice-small"
                        onClick={() => speakRegistro(registro, 'glucosa')}
                        aria-label="Escuchar registro"
                      >
                        <LucideIcon name="volume" size={16} />
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="empty-state-new" role="status">
                    <div className="empty-icon" aria-hidden="true"><LucideIcon name="heart-pulse" size={32} /></div>
                    <h3>Sin registros de glucosa</h3>
                    <p>Registra tu nivel de glucosa para llevar un control de tu salud</p>
                    <button
                      className="btn-empty"
                      onClick={() => abrirModal('glucosa')}
                      aria-label="Registrar glucosa ahora"
                    >
                      Registrar ahora
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'presion' && (
              <div
                role="tabpanel"
                id="panel-presion"
                aria-labelledby="tab-presion"
                className="registros-list"
              >
                {registros.length > 0 ? registros.map(registro => (
                  <article
                    key={registro.id}
                    className={`registro-card-new ${getPresionColor(registro.sistolica, registro.diastolica)}`}
                    aria-label={`Presión ${registro.sistolica}/${registro.diastolica} mmHg, ${getPresionTexto(registro.sistolica, registro.diastolica)}`}
                  >
                    <div className="registro-left">
                      <div className="registro-icon-circle presion" aria-hidden="true">
                        <LucideIcon name="heart" size={20} />
                      </div>
                    </div>
                    <div className="registro-center">
                      <div className="registro-main-value presion-display">
                        <div className="presion-numbers">
                          <span className="big-number">{registro.sistolica}</span>
                          <span className="presion-separator" aria-hidden="true">/</span>
                          <span className="big-number">{registro.diastolica}</span>
                          <span className="unit">mmHg</span>
                        </div>
                        <div className="pulso-badge">
                          <span className="pulso-heart" aria-hidden="true"><LucideIcon name="heart" size={16} /></span>
                          <span>{registro.pulso} bpm</span>
                        </div>
                      </div>
                      <div className="registro-meta">
                        <span className={`status-badge ${getPresionColor(registro.sistolica, registro.diastolica)}`}>
                          {getPresionTexto(registro.sistolica, registro.diastolica)}
                        </span>
                      </div>
                      {registro.notas && <p className="registro-notas">{registro.notas}</p>}
                    </div>
                    <div className="registro-right">
                      <span className="tiempo-relativo">{formatFechaRelativa(registro.fecha_hora)}</span>
                      <button
                        className="btn-voice-small"
                        onClick={() => speakRegistro(registro, 'presion')}
                        aria-label="Escuchar registro"
                      >
                        <LucideIcon name="volume" size={16} />
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="empty-state-new" role="status">
                    <div className="empty-icon" aria-hidden="true"><LucideIcon name="heart" size={32} /></div>
                    <h3>Sin registros de presión</h3>
                    <p>Monitorea tu presión arterial regularmente</p>
                    <button
                      className="btn-empty"
                      onClick={() => abrirModal('presion')}
                      aria-label="Registrar presión ahora"
                    >
                      Registrar ahora
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dolor' && (
              <div
                role="tabpanel"
                id="panel-dolor"
                aria-labelledby="tab-dolor"
                className="registros-list"
              >
                {registros.length > 0 ? registros.map(registro => (
                  <article
                    key={registro.id}
                    className="registro-card-new dolor"
                    aria-label={`Dolor nivel ${registro.nivel_dolor} de 10, ubicación ${registro.ubicacion}`}
                  >
                    <div className="registro-left">
                      <div className="registro-icon-circle dolor" style={{ fontSize: '1.5rem' }} aria-hidden="true">
                        {getDolorEmoji(registro.nivel_dolor)}
                      </div>
                    </div>
                    <div className="registro-center">
                      <div className="dolor-visual-new">
                        <div
                          className="dolor-bar-container"
                          role="progressbar"
                          aria-valuenow={registro.nivel_dolor}
                          aria-valuemin="0"
                          aria-valuemax="10"
                          aria-label={`Nivel de dolor: ${registro.nivel_dolor} de 10`}
                        >
                          <div
                            className="dolor-bar-fill"
                            style={{
                              width: `${registro.nivel_dolor * 10}%`,
                              background: getDolorColor(registro.nivel_dolor)
                            }}
                          ></div>
                        </div>
                        <span className="dolor-value" style={{ color: getDolorColor(registro.nivel_dolor) }}>
                          {registro.nivel_dolor}/10
                        </span>
                      </div>
                      <div className="registro-meta">
                        <span className="ubicacion-badge">
                          <LucideIcon name="map-pin" size={14} /> {registro.ubicacion}
                        </span>
                        <span className="tipo-badge">{registro.tipo_dolor}</span>
                      </div>
                      {registro.notas && <p className="registro-notas">{registro.notas}</p>}
                    </div>
                    <div className="registro-right">
                      <span className="tiempo-relativo">{formatFechaRelativa(registro.fecha_hora)}</span>
                      <button
                        className="btn-voice-small"
                        onClick={() => speakRegistro(registro, 'dolor')}
                        aria-label="Escuchar registro"
                      >
                        <LucideIcon name="volume" size={16} />
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="empty-state-new" role="status">
                    <div className="empty-icon" aria-hidden="true"><LucideIcon name="heart-pulse" size={32} /></div>
                    <h3>Sin registros de dolor</h3>
                    <p>Lleva un diario de dolor para ayudar a tu médico</p>
                    <button
                      className="btn-empty"
                      onClick={() => abrirModal('dolor')}
                      aria-label="Registrar dolor ahora"
                    >
                      Registrar ahora
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Panel de HbA1c */}
            {activeTab === 'hba1c' && (
              <div
                role="tabpanel"
                id="panel-hba1c"
                aria-labelledby="tab-hba1c"
                className="registros-list"
              >
                {/* Referencia de rangos */}
                <div className="hba1c-ranges-info">
                  <span className="hba1c-range normal"><LucideIcon name="circle-check" size={14} /> Normal: 4.0 - 5.6%</span>
                  <span className="hba1c-range warning"><LucideIcon name="alert-triangle" size={14} /> Prediabético: 5.7 - 6.4%</span>
                  <span className="hba1c-range danger"><LucideIcon name="circle-x" size={14} /> Diabético: ≥ 6.5%</span>
                </div>

                {registros.length > 0 ? registros.map(registro => (
                  <article
                    key={registro.id}
                    className="registro-card-new hba1c"
                    aria-label={`HbA1c ${registro.valor}%, ${getHba1cTexto(registro.valor)}`}
                  >
                    <div className="registro-left">
                      <div className="registro-icon-circle hba1c" style={{ background: `${getHba1cColor(registro.valor)}20`, color: getHba1cColor(registro.valor) }}>
                        <LucideIcon name="droplet" size={22} />
                      </div>
                    </div>
                    <div className="registro-center">
                      <div className="hba1c-value-display">
                        <span className="hba1c-valor" style={{ color: getHba1cColor(registro.valor) }}>
                          {registro.valor}%
                        </span>
                        <span className="hba1c-estado" style={{ color: getHba1cColor(registro.valor) }}>
                          {getHba1cTexto(registro.valor)}
                        </span>
                      </div>
                      <div className="registro-meta">
                        <span className="fecha-estudio">
                          <LucideIcon name="calendar" size={14} /> {new Date(registro.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      {registro.notas && <p className="registro-notas">{registro.notas}</p>}
                    </div>
                    <div className="registro-right">
                      <span className="tiempo-relativo">{formatFechaRelativa(registro.fecha)}</span>
                      <button
                        className="btn-voice-small"
                        onClick={() => speak(`Hemoglobina glicosilada ${registro.valor} por ciento, nivel ${getHba1cTexto(registro.valor)}, fecha ${new Date(registro.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`)}
                        aria-label="Escuchar registro"
                      >
                        <LucideIcon name="volume" size={16} />
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="empty-state-new" role="status">
                    <div className="empty-icon" aria-hidden="true"><LucideIcon name="droplet" size={32} /></div>
                    <h3>Sin registros de HbA1c</h3>
                    <p>Registra tus resultados de hemoglobina glicosilada cada 3 meses</p>
                    <button
                      className="btn-empty"
                      onClick={() => abrirModal('hba1c')}
                      aria-label="Registrar HbA1c ahora"
                    >
                      Registrar ahora
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Panel de Medicamentos */}
            {activeTab === 'medicamentos' && (
              <div
                role="tabpanel"
                id="panel-medicamentos"
                aria-labelledby="tab-medicamentos"
                className="medicamentos-panel"
              >
                {(() => {
                  const activos = (Array.isArray(medicamentos) ? medicamentos : []).filter(m => m.activo == 1);
                  const inactivos = (Array.isArray(medicamentos) ? medicamentos : []).filter(m => m.activo == 0);

                  return (
                    <>
                      {/* Medicamentos activos */}
                      {activos.length > 0 && (
                        <div className="medicamentos-seccion">
                          <h3 className="medicamentos-seccion-titulo">
                            <LucideIcon name="circle-check" size={18} />
                            <span>Medicamentos Activos ({activos.length})</span>
                          </h3>
                          <div className="medicamentos-list">
                            {activos.map(med => (
                              <article key={med.id} className="medicamento-card activo">
                                <div className="medicamento-header">
                                  <div className="medicamento-icon-circle" aria-hidden="true">
                                    <LucideIcon name="pill" size={20} />
                                  </div>
                                  <div className="medicamento-titulo">
                                    <span className="medicamento-nombre">{med.nombre_comercial}</span>
                                    {med.nombre_generico && (
                                      <span className="medicamento-generico">({med.nombre_generico})</span>
                                    )}
                                  </div>
                                  <span className="medicamento-estado-badge activo">Activo</span>
                                </div>

                                <div className="medicamento-detalles">
                                  <div className="medicamento-detalle-item">
                                    <LucideIcon name="target" size={14} />
                                    <span className="detalle-label">Dosis:</span>
                                    <span className="detalle-valor">{med.dosis}</span>
                                  </div>
                                  <div className="medicamento-detalle-item">
                                    <LucideIcon name="clock" size={14} />
                                    <span className="detalle-label">Frecuencia:</span>
                                    <span className="detalle-valor">{med.frecuencia}</span>
                                  </div>
                                  <div className="medicamento-detalle-item">
                                    <LucideIcon name="syringe" size={14} />
                                    <span className="detalle-label">Vía:</span>
                                    <span className="detalle-valor">{VIAS_MAP[med.via_administracion] || med.via_administracion}</span>
                                  </div>
                                  <div className="medicamento-detalle-item">
                                    <LucideIcon name="calendar" size={14} />
                                    <span className="detalle-label">Desde:</span>
                                    <span className="detalle-valor">{formatFechaMedicamento(med.fecha_inicio)}</span>
                                  </div>
                                  {med.fecha_fin && (
                                    <div className="medicamento-detalle-item">
                                      <LucideIcon name="calendar" size={14} />
                                      <span className="detalle-label">Hasta:</span>
                                      <span className="detalle-valor">{formatFechaMedicamento(med.fecha_fin)}</span>
                                    </div>
                                  )}
                                </div>

                                {med.instrucciones_especiales && (
                                  <div className="medicamento-instrucciones">
                                    <LucideIcon name="info" size={14} />
                                    <span>{med.instrucciones_especiales}</span>
                                  </div>
                                )}

                                {med.notas_medico && (
                                  <div className="medicamento-notas">
                                    <LucideIcon name="stethoscope" size={14} />
                                    <span>{med.notas_medico}</span>
                                  </div>
                                )}

                                <div className="medicamento-footer">
                                  {med.prescrito_por_nombre && (
                                    <span className="medicamento-prescriptor">
                                      <LucideIcon name="user" size={12} /> Dr(a). {med.prescrito_por_nombre}
                                    </span>
                                  )}
                                  <button
                                    className="btn-voice-small"
                                    onClick={() => speakMedicamento(med)}
                                    aria-label={`Escuchar información de ${med.nombre_comercial}`}
                                  >
                                    <LucideIcon name="volume" size={16} />
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medicamentos finalizados */}
                      {inactivos.length > 0 && (
                        <div className="medicamentos-seccion inactivos">
                          <button
                            className="medicamentos-seccion-toggle"
                            onClick={() => setShowInactivos(!showInactivos)}
                            aria-expanded={showInactivos}
                          >
                            <LucideIcon name="clock" size={18} />
                            <span>Medicamentos Finalizados ({inactivos.length})</span>
                            <LucideIcon
                              name={showInactivos ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              className="toggle-chevron"
                            />
                          </button>

                          {showInactivos && (
                            <div className="medicamentos-list">
                              {inactivos.map(med => (
                                <article key={med.id} className="medicamento-card inactivo">
                                  <div className="medicamento-header">
                                    <div className="medicamento-icon-circle inactivo" aria-hidden="true">
                                      <LucideIcon name="pill" size={20} />
                                    </div>
                                    <div className="medicamento-titulo">
                                      <span className="medicamento-nombre">{med.nombre_comercial}</span>
                                      {med.nombre_generico && (
                                        <span className="medicamento-generico">({med.nombre_generico})</span>
                                      )}
                                    </div>
                                    <span className="medicamento-estado-badge inactivo">Finalizado</span>
                                  </div>
                                  <div className="medicamento-detalles">
                                    <div className="medicamento-detalle-item">
                                      <LucideIcon name="target" size={14} />
                                      <span className="detalle-label">Dosis:</span>
                                      <span className="detalle-valor">{med.dosis}</span>
                                    </div>
                                    <div className="medicamento-detalle-item">
                                      <LucideIcon name="clock" size={14} />
                                      <span className="detalle-label">Frecuencia:</span>
                                      <span className="detalle-valor">{med.frecuencia}</span>
                                    </div>
                                    <div className="medicamento-detalle-item">
                                      <LucideIcon name="calendar" size={14} />
                                      <span className="detalle-label">Periodo:</span>
                                      <span className="detalle-valor">
                                        {formatFechaMedicamento(med.fecha_inicio)}
                                        {med.fecha_fin ? ` — ${formatFechaMedicamento(med.fecha_fin)}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="medicamento-footer">
                                    {med.prescrito_por_nombre && (
                                      <span className="medicamento-prescriptor">
                                        <LucideIcon name="user" size={12} /> Dr(a). {med.prescrito_por_nombre}
                                      </span>
                                    )}
                                    <button
                                      className="btn-voice-small"
                                      onClick={() => speakMedicamento(med)}
                                      aria-label={`Escuchar información de ${med.nombre_comercial}`}
                                    >
                                      <LucideIcon name="volume" size={16} />
                                    </button>
                                  </div>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Estado vacío */}
                      {activos.length === 0 && inactivos.length === 0 && (
                        <div className="empty-state-new" role="status">
                          <div className="empty-icon" aria-hidden="true"><LucideIcon name="pill" size={32} /></div>
                          <h3>Sin medicamentos asignados</h3>
                          <p>Tu médico aún no te ha asignado medicamentos. Cuando lo haga, aparecerán aquí.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal mejorado */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content-new" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Cerrar formulario"
            >
              ×
            </button>

            {modalType === 'glucosa' && (
              <>
                <div className="modal-header">
                  <div className="modal-icon glucosa" aria-hidden="true"><LucideIcon name="heart-pulse" size={24} /></div>
                  <h2 id="modal-title">Registrar Glucosa</h2>
                </div>
                <form onSubmit={handleSubmitGlucosa}>
                  <div className="form-group-new">
                    <label htmlFor="nivel-glucosa">Nivel de Glucosa</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        id="nivel-glucosa"
                        value={glucosaForm.nivel_glucosa}
                        onChange={e => setGlucosaForm({...glucosaForm, nivel_glucosa: e.target.value})}
                        className="input-large"
                        placeholder="100"
                        min="20"
                        max="600"
                        required
                        aria-describedby="glucosa-helper"
                      />
                      <span className="input-unit" aria-hidden="true">mg/dL</span>
                    </div>
                    <div id="glucosa-helper" className="input-helper">
                      <span className="helper-item normal">70-100: Normal en ayunas</span>
                    </div>
                  </div>
                  <div className="form-group-new">
                    <label id="momento-label">Momento de la medición</label>
                    <div className="pill-selector" role="radiogroup" aria-labelledby="momento-label">
                      {[
                        { value: 'ayunas', label: 'En ayunas', icon: 'sunrise' },
                        { value: 'antes_comida', label: 'Antes de comer', icon: 'utensils' },
                        { value: 'despues_comida', label: 'Después de comer', icon: 'alarm-clock' },
                        { value: 'antes_dormir', label: 'Antes de dormir', icon: 'moon' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={glucosaForm.momento === opt.value}
                          className={`pill ${glucosaForm.momento === opt.value ? 'active' : ''}`}
                          onClick={() => setGlucosaForm({...glucosaForm, momento: opt.value})}
                        >
                          <LucideIcon name={opt.icon} size={16} /> {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="glucosa-notas">Notas (opcional)</label>
                    <textarea
                      id="glucosa-notas"
                      value={glucosaForm.notas}
                      onChange={e => setGlucosaForm({...glucosaForm, notas: e.target.value})}
                      className="textarea-new"
                      rows="2"
                      placeholder="¿Algo que quieras anotar?"
                    />
                  </div>
                  <div className="modal-actions-new">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit glucosa" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar registro'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'presion' && (
              <>
                <div className="modal-header">
                  <div className="modal-icon presion" aria-hidden="true"><LucideIcon name="heart" size={24} /></div>
                  <h2 id="modal-title">Registrar Presión Arterial</h2>
                </div>
                <form onSubmit={handleSubmitPresion}>
                  <div className="form-row-new">
                    <div className="form-group-new">
                      <label htmlFor="sistolica">Sistólica (alta)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          id="sistolica"
                          value={presionForm.sistolica}
                          onChange={e => setPresionForm({...presionForm, sistolica: e.target.value})}
                          className="input-medium"
                          placeholder="120"
                          min="60"
                          max="250"
                          required
                        />
                        <span className="input-unit" aria-hidden="true">mmHg</span>
                      </div>
                    </div>
                    <div className="form-group-new">
                      <label htmlFor="diastolica">Diastólica (baja)</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          id="diastolica"
                          value={presionForm.diastolica}
                          onChange={e => setPresionForm({...presionForm, diastolica: e.target.value})}
                          className="input-medium"
                          placeholder="80"
                          min="40"
                          max="150"
                          required
                        />
                        <span className="input-unit" aria-hidden="true">mmHg</span>
                      </div>
                    </div>
                  </div>
                  <div className="input-helper centered">
                    <span className="helper-item normal">Normal: 120/80 mmHg</span>
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="pulso">Pulso cardíaco</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        id="pulso"
                        value={presionForm.pulso}
                        onChange={e => setPresionForm({...presionForm, pulso: e.target.value})}
                        className="input-medium"
                        placeholder="70"
                        min="30"
                        max="200"
                        required
                      />
                      <span className="input-unit"><LucideIcon name="heart" size={14} /> bpm</span>
                    </div>
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="presion-notas">Notas (opcional)</label>
                    <textarea
                      id="presion-notas"
                      value={presionForm.notas}
                      onChange={e => setPresionForm({...presionForm, notas: e.target.value})}
                      className="textarea-new"
                      rows="2"
                      placeholder="¿Cómo te sentías?"
                    />
                  </div>
                  <div className="modal-actions-new">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit presion" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar registro'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'dolor' && (
              <>
                <div className="modal-header">
                  <div className="modal-icon dolor" aria-hidden="true">{getDolorEmoji(dolorForm.nivel_dolor || 5)}</div>
                  <h2 id="modal-title">Registrar Dolor</h2>
                </div>
                <form onSubmit={handleSubmitDolor}>
                  <div className="form-group-new">
                    <label htmlFor="dolor-slider">¿Cuánto dolor sientes?</label>
                    <div className="dolor-slider-container">
                      <input
                        type="range"
                        id="dolor-slider"
                        min="0"
                        max="10"
                        value={dolorForm.nivel_dolor}
                        onChange={e => setDolorForm({...dolorForm, nivel_dolor: parseInt(e.target.value)})}
                        className="dolor-slider-new"
                        aria-valuetext={`${dolorForm.nivel_dolor} de 10`}
                        style={{
                          background: `linear-gradient(90deg, #2E7D32 0%, #F57F17 50%, #C62828 100%)`
                        }}
                      />
                      <div className="dolor-value-display" style={{ color: getDolorColor(dolorForm.nivel_dolor) }}>
                        <span className="dolor-emoji" aria-hidden="true">{getDolorEmoji(dolorForm.nivel_dolor || 5)}</span>
                        <span className="dolor-number">{dolorForm.nivel_dolor}</span>
                      </div>
                    </div>
                    <div className="dolor-scale-labels" aria-hidden="true">
                      <span>Sin dolor</span>
                      <span>Dolor extremo</span>
                    </div>
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="ubicacion">¿Dónde te duele?</label>
                    <input
                      type="text"
                      id="ubicacion"
                      value={dolorForm.ubicacion}
                      onChange={e => setDolorForm({...dolorForm, ubicacion: e.target.value})}
                      className="input-full"
                      placeholder="Ej: Rodilla derecha, muñón, espalda..."
                      required
                    />
                  </div>
                  <div className="form-group-new">
                    <label id="tipo-dolor-label">Tipo de dolor</label>
                    <div className="pill-selector wrap" role="radiogroup" aria-labelledby="tipo-dolor-label">
                      {[
                        { value: 'agudo', label: 'Punzante', icon: 'zap' },
                        { value: 'sordo', label: 'Constante', icon: 'activity' },
                        { value: 'pulsante', label: 'Pulsante', icon: 'heart-pulse' },
                        { value: 'quemante', label: 'Quemante', icon: 'thermometer' },
                        { value: 'hormigueo', label: 'Hormigueo', icon: 'sparkles' },
                        { value: 'fantasma', label: 'Fantasma', icon: 'circle-help' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={dolorForm.tipo_dolor === opt.value}
                          className={`pill small ${dolorForm.tipo_dolor === opt.value ? 'active' : ''}`}
                          onClick={() => setDolorForm({...dolorForm, tipo_dolor: opt.value})}
                        >
                          <LucideIcon name={opt.icon} size={16} /> {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="dolor-notas">Notas (opcional)</label>
                    <textarea
                      id="dolor-notas"
                      value={dolorForm.notas}
                      onChange={e => setDolorForm({...dolorForm, notas: e.target.value})}
                      className="textarea-new"
                      rows="2"
                      placeholder="¿Qué lo desencadenó? ¿Qué lo alivia?"
                    />
                  </div>
                  <div className="modal-actions-new">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit dolor" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar registro'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'hba1c' && (
              <>
                <div className="modal-header">
                  <div className="modal-icon hba1c" aria-hidden="true"><LucideIcon name="droplet" size={24} /></div>
                  <h2 id="modal-title">Registrar HbA1c</h2>
                </div>
                <form onSubmit={handleSubmitHba1c}>
                  <div className="form-group-new">
                    <label htmlFor="hba1c-valor">Hemoglobina Glicosilada (HbA1c)</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        id="hba1c-valor"
                        value={hba1cForm.valor}
                        onChange={e => setHba1cForm({...hba1cForm, valor: e.target.value})}
                        className="input-large"
                        placeholder="6.5"
                        min="3"
                        max="20"
                        step="0.1"
                        required
                        aria-describedby="hba1c-helper"
                      />
                      <span className="input-unit" aria-hidden="true">%</span>
                    </div>
                    <div id="hba1c-helper" className="input-helper">
                      <span className="helper-item normal"><LucideIcon name="circle-check" size={12} /> 4.0-5.6%: Normal</span>
                      <span className="helper-item warning"><LucideIcon name="alert-triangle" size={12} /> 5.7-6.4%: Prediabético</span>
                      <span className="helper-item danger"><LucideIcon name="circle-x" size={12} /> ≥6.5%: Diabético</span>
                    </div>
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="hba1c-fecha">Fecha del estudio</label>
                    <input
                      type="date"
                      id="hba1c-fecha"
                      value={hba1cForm.fecha}
                      onChange={e => setHba1cForm({...hba1cForm, fecha: e.target.value})}
                      className="input-full"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group-new">
                    <label htmlFor="hba1c-notas">Notas (opcional)</label>
                    <textarea
                      id="hba1c-notas"
                      value={hba1cForm.notas}
                      onChange={e => setHba1cForm({...hba1cForm, notas: e.target.value})}
                      className="textarea-new"
                      rows="2"
                      placeholder="Laboratorio, condiciones del estudio..."
                    />
                  </div>
                  <div className="modal-actions-new">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit hba1c" disabled={saving} style={{ background: '#FF6F00' }}>
                      {saving ? 'Guardando...' : 'Guardar registro'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default Medicina;
