import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import VoiceHelper from '../components/VoiceHelper';
import LucideIcon from '../components/LucideIcon';
import '../styles/Nutricion.css';

const Nutricion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ID del paciente en sesión
  const pacienteId = user?.paciente_id || user?.id;

  // Estado del plan cargado
  const [planPaciente, setPlanPaciente] = useState(null);
  
  // Control de grupos desplegados (acordión)
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    cargarPlanNutricional();
  }, [pacienteId, selectedDate]);

  const cargarPlanNutricional = async () => {
    if (!pacienteId) return;
    setLoading(true);

    try {
      // Petición al backend
      const response = await api.get(`/nutricion/plan-paciente/${pacienteId}`);
      let data = response?.data?.data || response?.data || response;

      if (data && (data.tiene_plan || data.id || data.calorias_diarias || data.grupos)) {
        setPlanPaciente(data);
        
        // Abrir por defecto el primer grupo disponible
        const gruposData = data.grupos || data.contenido?.cuadro_equivalentes?.grupos || [];
        if (gruposData.length > 0) {
          setOpenGroups({ [gruposData[0].nombre]: true });
        }
      } else {
        setPlanPaciente(null);
      }
    } catch (err) {
      console.error('Error al cargar plan:', err);
      setPlanPaciente(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (grupoNombre) => {
    setOpenGroups(prev => ({
      ...prev,
      [grupoNombre]: !prev[grupoNombre]
    }));
  };

  const formatearFecha = (fecha) => {
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = fecha.toLocaleDateString('es-MX', opciones);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(selectedDate);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setSelectedDate(nuevaFecha);
  };

  // Mapeo dinámico de datos recibidos del backend
  const tienePlan = Boolean(planPaciente && (planPaciente.tiene_plan || planPaciente.id || planPaciente.grupos));

  // 1. Calorías y Macros
  const calorias = planPaciente?.calorias_diarias || planPaciente?.contenido?.totales?.calorias || planPaciente?.metas?.calorias || 0;
  const proteinas = planPaciente?.proteinas_g || planPaciente?.contenido?.totales?.proteinas || planPaciente?.metas?.proteinas || 0;
  const carbohidratos = planPaciente?.carbohidratos_g || planPaciente?.contenido?.totales?.carbohidratos || planPaciente?.metas?.carbohidratos || 0;
  const grasas = planPaciente?.grasas_g || planPaciente?.contenido?.totales?.grasas || planPaciente?.metas?.grasas || 0;

  // 2. Grupos de alimentos / Equivalentes
  const grupos = planPaciente?.grupos || planPaciente?.contenido?.grupos_alimentos || [];

  // 3. Recomendaciones del Nutriólogo
  const recomendaciones = planPaciente?.recomendaciones || planPaciente?.contenido?.recomendaciones || [];

  // 4. Recetas
  const recetaSugerida = planPaciente?.receta_sugerida || (planPaciente?.comidas && planPaciente.comidas[0]) || null;

  return (
    <div className="azaria-nutricion-wrapper">
      <VoiceHelper currentModule="nutricion" />

      {/* Header Verde Azaria */}
      <header className="azaria-header-card">
        <div className="azaria-header-top">
          <div className="azaria-header-title">
            <span className="azaria-header-icon">🥗</span>
            <div>
              <h1 className="azaria-title-white">Nutrición</h1>
              <p className="azaria-subtitle-white">Plan diario de alimentación</p>
            </div>
          </div>
          <button className="azaria-icon-btn">
            <LucideIcon name="calendar" size={18} />
          </button>
        </div>

        {/* Date Selector */}
        <div className="azaria-date-bar">
          <button onClick={() => cambiarDia(-1)}>‹</button>
          <div className="azaria-date-text">
            <strong>Hoy</strong>
            <span>{formatearFecha(selectedDate)}</span>
          </div>
          <button onClick={() => cambiarDia(1)}>›</button>
        </div>
      </header>

      {loading ? (
        <div className="azaria-loading-box">
          <p>Cargando plan de nutrición...</p>
        </div>
      ) : !tienePlan ? (
        /* Vista cuando el especialista AÚN NO asigna un plan */
        <section className="azaria-empty-card">
          <div className="azaria-empty-icon">🥗</div>
          <h3>Sin plan asignado aún</h3>
          <p>Tu nutriólogo/especialista registrará tus porciones, calorías y recomendaciones personalizadas.</p>
        </section>
      ) : (
        /* Vista cuando SÍ HAY PLAN ASIGNADO */
        <>
          {/* Metas Diarias (Se muestran si hay al menos calorías o macros guardados) */}
          {(calorias > 0 || proteinas > 0 || carbohidratos > 0 || grasas > 0) && (
            <section className="azaria-card-white">
              <div className="azaria-section-header">
                <h3 className="azaria-text-dark">🎯 Metas Diarias</h3>
                <span className="azaria-nutriologo-tag">
                  {planPaciente?.especialista_nombre || 'Nutriólogo asignado'}
                </span>
              </div>

              <div className="azaria-metas-grid">
                <div className="azaria-meta-card border-red">
                  <span className="meta-emoji">🔥</span>
                  <div>
                    <h4 className="azaria-text-dark">{calorias}</h4>
                    <p>Calorías</p>
                  </div>
                </div>
                <div className="azaria-meta-card border-blue">
                  <span className="meta-emoji">🍗</span>
                  <div>
                    <h4 className="azaria-text-dark">{proteinas}g</h4>
                    <p>Proteínas</p>
                  </div>
                </div>
                <div className="azaria-meta-card border-orange">
                  <span className="meta-emoji">🍞</span>
                  <div>
                    <h4 className="azaria-text-dark">{carbohidratos}g</h4>
                    <p>Carbohidratos</p>
                  </div>
                </div>
                <div className="azaria-meta-card border-purple">
                  <span className="meta-emoji">🥑</span>
                  <div>
                    <h4 className="azaria-text-dark">{grasas}g</h4>
                    <p>Grasas</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Alimentos Equivalentes - Desplegables según lo guardado */}
          {grupos.length > 0 && (
            <section className="azaria-equivalentes-container">
              <div className="azaria-eq-title">
                <span className="icon-bowl">🍲</span>
                <h3 className="azaria-text-white">Alimentos Equivalentes</h3>
              </div>

              <div className="azaria-groups-list">
                {grupos.map((grupo, idx) => {
                  const nombreGrupo = grupo.nombre || grupo.grupo;
                  const equivs = grupo.equivalentes || grupo.cantidad || 0;
                  const alimentos = grupo.alimentos || [];
                  const isOpen = openGroups[nombreGrupo];

                  return (
                    <div key={idx} className="azaria-group-accordion">
                      <button 
                        className="azaria-group-header" 
                        onClick={() => toggleGroup(nombreGrupo)}
                      >
                        <div className="azaria-group-info">
                          <span className="group-badge-icon">🥗</span>
                          <div>
                            <strong className="azaria-text-white">{nombreGrupo}</strong>
                            <p>{equivs} {equivs === 1 ? 'equivalente' : 'equivalentes'}</p>
                          </div>
                        </div>
                        <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>
                          ▲
                        </span>
                      </button>

                      {isOpen && (
                        <div className="azaria-group-body">
                          {alimentos.length > 0 ? (
                            alimentos.map((alimento, aIdx) => (
                              <div key={aIdx} className="azaria-alimento-row">
                                <div className="alimento-name">
                                  <span className="dot-green"></span>
                                  <span className="azaria-text-white">{typeof alimento === 'string' ? alimento : alimento.nombre}</span>
                                </div>
                                <span className="alimento-porcion">
                                  {alimento.porcion || alimento.equivalente || '1 porción'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="no-alimentos-text">Consultar porciones con especialista</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recomendaciones Asignadas */}
          {recomendaciones.length > 0 && (
            <section className="azaria-recomendaciones-card">
              <div className="azaria-rec-header">
                <span className="check-box">✓</span>
                <h3 className="azaria-text-green">Recomendaciones</h3>
              </div>
              <ul className="azaria-rec-list">
                {recomendaciones.map((item, i) => (
                  <li key={i}>
                    <span className="check-icon">✓</span>
                    <span className="azaria-text-dark">{typeof item === 'string' ? item : item.texto || item.descripcion}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Receta Sugerida */}
          {recetaSugerida && (
            <section className="azaria-recetas-section">
              <div className="azaria-receta-title">
                <LucideIcon name="search" size={18} />
                <h3 className="azaria-text-subtle">Recetas sugeridas</h3>
              </div>

              <div className="azaria-receta-card">
                {recetaSugerida.imagen && (
                  <div className="receta-img-wrapper">
                    <img src={recetaSugerida.imagen} alt={recetaSugerida.titulo || 'Receta'} />
                  </div>
                )}
                <div className="receta-content">
                  <h4 className="azaria-text-white">{recetaSugerida.titulo || recetaSugerida.nombre_plato || 'Receta del Plan'}</h4>
                  {recetaSugerida.tipo && <span className="receta-tag">{recetaSugerida.tipo}</span>}
                  <div className="receta-macros">
                    {recetaSugerida.calorias && <span>🔥 {recetaSugerida.calorias} kcal</span>}
                    {recetaSugerida.proteinas && <span>🍗 {recetaSugerida.proteinas}g proteína</span>}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default Nutricion;