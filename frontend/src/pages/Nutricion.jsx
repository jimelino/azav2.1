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

  const pacienteId = user?.paciente_id || user?.id;

  const [resumenDia, setResumenDia] = useState({
    calorias: { consumidas: 0, objetivo: 2200 },
    carbohidratos: { consumidas: 0, objetivo: 250 },
    proteinas: { consumidas: 0, objetivo: 120 },
    grasas: { consumidas: 0, objetivo: 70 }
  });

  const [agua, setAgua] = useState({
    consumida: 0,
    objetivo: 2.0,
    vasos: Array(8).fill(false)
  });

  const [comidas, setComidas] = useState({
    desayuno: { items: [], calorias: 0, objetivo: 550 },
    almuerzo: { items: [], calorias: 0, objetivo: 750 },
    cena: { items: [], calorias: 0, objetivo: 600 },
    snacks: { items: [], calorias: 0, objetivo: 300 }
  });

  const [planAsignado, setPlanAsignado] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [equivalentesCheck, setEquivalentesCheck] = useState({});
  const [recetas, setRecetas] = useState([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [tipoComidaActual, setTipoComidaActual] = useState('desayuno');

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

  const formatearFecha = (fecha) => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fecha.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fecha.toDateString() === ayer.toDateString()) return 'Ayer';
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(selectedDate);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    if (nuevaFecha <= new Date()) setSelectedDate(nuevaFecha);
  };

  return (
    <div className="nutricion-page-original">
      <VoiceHelper currentModule="nutricion" />

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

      <div className="nutricion-date-bar">
        <button className="date-nav-arrow" onClick={() => cambiarDia(-1)}>‹</button>
        <div className="date-center-display" onClick={() => setShowCalendar(true)}>
          <span className="date-main-label">{formatearFecha(selectedDate)}</span>
          <span className="date-sub-label">{selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <button className="date-nav-arrow" onClick={() => cambiarDia(1)} disabled={selectedDate.toDateString() === new Date().toDateString()}>›</button>
      </div>

      <div className="nutricion-tabs-original">
        <button className={`tab-btn-orig ${activeTab === 'diario' ? 'active' : ''}`} onClick={() => setActiveTab('diario')}>Diario</button>
        <button className={`tab-btn-orig ${activeTab === 'plan_porciones' ? 'active' : ''}`} onClick={() => setActiveTab('plan_porciones')}>Plan de Porciones Nutricionales</button>
        <button className={`tab-btn-orig ${activeTab === 'recetas' ? 'active' : ''}`} onClick={() => setActiveTab('recetas')}>Mi Plan / Recetas</button>
        <button className={`tab-btn-orig ${activeTab === 'peso' ? 'active' : ''}`} onClick={() => setActiveTab('peso')}>Mi Peso</button>
      </div>

      <div className="nutricion-main-content">
        {activeTab === 'diario' && (
          <>
            <section className="metas-diarias-section">
              <div className="metas-header-row">
                <h3><LucideIcon name="target" size={16} /> Metas Diarias</h3>
                <span className="nutriologo-badge-tag">{planAsignado?.especialista_nombre ? planAsignado.especialista_nombre : 'Nutriólogo asignado'}</span>
              </div>
              <div className="metas-grid-cards">
                <div className="meta-card-item">
                  <div className="meta-card-icon"><LucideIcon name="flame" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.calorias.objetivo}</span>
                    <span className="meta-lbl">Calorías</span>
                  </div>
                </div>
                <div className="meta-card-item">
                  <div className="meta-card-icon"><LucideIcon name="beef" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.proteinas.objetivo}g</span>
                    <span className="meta-lbl">Proteínas</span>
                  </div>
                </div>
                <div className="meta-card-item">
                  <div className="meta-card-icon"><LucideIcon name="wheat" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.carbohidratos.objetivo}g</span>
                    <span className="meta-lbl">Carbohidratos</span>
                  </div>
                </div>
                <div className="meta-card-item">
                  <div className="meta-card-icon"><LucideIcon name="droplet" size={18} /></div>
                  <div className="meta-card-data">
                    <span className="meta-num">{resumenDia.grasas.objetivo}g</span>
                    <span className="meta-lbl">Grasas</span>
                  </div>
                </div>
              </div>
            </section>

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
                              <span className="equiv-food-name-dot">· Sin alimentos registrados</span>
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              ) : (
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
                      <div className="equiv-food-row-item"><span className="equiv-food-name-dot">· Manzana</span><span className="equiv-food-porcion-badge">1 porción</span></div>
                      <div className="equiv-food-row-item"><span className="equiv-food-name-dot">· Plátano</span><span className="equiv-food-porcion-badge">1 porción</span></div>
                      <div className="equiv-food-row-item"><span className="equiv-food-name-dot">· Papaya</span><span className="equiv-food-porcion-badge">1 porción</span></div>
                    </div>
                  </details>
                </div>
              )}
            </section>

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

        {/* Apartado Dinámico: Plan de Porciones Nutricionales sincronizado */}
        {activeTab === 'plan_porciones' && (
          <div className="plan-porciones-tab-container">
            {planAsignado?.tiene_plan ? (
              <>
                <section className="metas-diarias-section">
                  <div className="metas-header-row">
                    <h3><LucideIcon name="clipboard-list" size={16} /> {planAsignado.nombre || 'Plan Nutricional Asignado'}</h3>
                    <span className="nutriologo-badge-tag">{planAsignado.especialista_nombre || 'Especialista'}</span>
                  </div>
                  <div className="metas-grid-cards">
                    <div className="meta-card-item">
                      <div className="meta-card-icon"><LucideIcon name="flame" size={18} /></div>
                      <div className="meta-card-data">
                        <span className="meta-num">{resumenDia.calorias.objetivo}</span>
                        <span className="meta-lbl">Calorías</span>
                      </div>
                    </div>
                    <div className="meta-card-item">
                      <div className="meta-card-icon"><LucideIcon name="beef" size={18} /></div>
                      <div className="meta-card-data">
                        <span className="meta-num">{resumenDia.proteinas.objetivo}g</span>
                        <span className="meta-lbl">Proteínas</span>
                      </div>
                    </div>
                    <div className="meta-card-item">
                      <div className="meta-card-icon"><LucideIcon name="wheat" size={18} /></div>
                      <div className="meta-card-data">
                        <span className="meta-num">{resumenDia.carbohidratos.objetivo}g</span>
                        <span className="meta-lbl">Carbohidratos</span>
                      </div>
                    </div>
                    <div className="meta-card-item">
                      <div className="meta-card-icon"><LucideIcon name="droplet" size={18} /></div>
                      <div className="meta-card-data">
                        <span className="meta-num">{resumenDia.grasas.objetivo}g</span>
                        <span className="meta-lbl">Grasas</span>
                      </div>
                    </div>
                  </div>
                </section>

                {planAsignado.contenido?.cuadro_equivalentes?.grupos?.length > 0 && (() => {
                  const cuadro = planAsignado.contenido.cuadro_equivalentes;
                  const tiempos = cuadro.tiempos || [];
                  const grupos = cuadro.grupos || [];
                  const gruposAlimentos = planAsignado.contenido?.grupos_alimentos || [];

                  return (
                    <section className="alimentos-equivalentes-container">
                      <div className="equivalentes-title-bar">
                        <LucideIcon name="apple" size={18} />
                        <h2>Distribución de Porciones por Comida</h2>
                      </div>
                      <div className="equivalentes-accordion-list">
                        {tiempos.map((tiempo, tIdx) => {
                          const gruposActivos = grupos
                            .map((g) => ({ nombre: g.nombre, cantidad: g.equivalentes?.[tIdx] || 0 }))
                            .filter(g => g.cantidad > 0);

                          if (gruposActivos.length === 0) return null;

                          return (
                            <details key={tIdx} className="equiv-group-accordion" open={tIdx === 0}>
                              <summary className="equiv-group-header">
                                <div className="equiv-group-left">
                                  <span className="equiv-group-dot-icon"><LucideIcon name="circle" size={10} /></span>
                                  <span className="equiv-group-title-text">{tiempo}</span>
                                </div>
                                <div className="equiv-group-right">
                                  <span className="equiv-group-count-sub">{gruposActivos.length} grupos</span>
                                  <LucideIcon name="chevron-down" size={16} className="equiv-chevron-icon" />
                                </div>
                              </summary>
                              <div className="equiv-group-content-list">
                                {gruposActivos.map((g, i) => {
                                  const grupoData = gruposAlimentos.find(ga => ga.nombre === g.nombre);
                                  const alimentos = limpiarAlimentos(grupoData?.alimentos || []);
                                  return (
                                    <div key={i} className="equiv-food-row-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '8px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <span className="equiv-food-name-dot"><strong>{g.nombre}</strong></span>
                                        <span className="equiv-food-porcion-badge">{g.cantidad} porciones</span>
                                      </div>
                                      {alimentos.length > 0 && (
                                        <div style={{ paddingLeft: '8px', fontSize: '11px', color: '#8B949E', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          {alimentos.slice(0, 3).map((a, aIdx) => (
                                            <span key={aIdx}>· {a.nombre} ({a.equivalente || '1 porción'})</span>
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

                <section className="recomendaciones-box-card">
                  <div className="recomendaciones-title-row">
                    <LucideIcon name="check-square" size={16} />
                    <h2>Recomendaciones del Especialista</h2>
                  </div>
                  <ul className="recomendaciones-check-list">
                    {planAsignado.contenido?.recomendaciones?.length > 0 ? (
                      planAsignado.contenido.recomendaciones.map((rec, idx) => (
                        <li key={idx}><span className="check-mark-icon">✓</span> {rec}</li>
                      ))
                    ) : (
                      <li><span className="check-mark-icon">✓</span> Sigue las porciones indicadas por tu especialista.</li>
                    )}
                  </ul>
                </section>
              </>
            ) : (
              <section className="alimentos-equivalentes-container" style={{ textAlign: 'center', padding: '30px' }}>
                <LucideIcon name="salad" size={36} style={{ color: '#8B949E', marginBottom: '10px' }} />
                <h3 style={{ color: '#E6EDF3', fontSize: '15px', margin: '0 0 6px 0' }}>Sin plan de porciones asignado</h3>
                <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>Tu nutriólogo asignará las porciones y calorías desde su panel para reflejarse aquí automáticamente.</p>
              </section>
            )}
          </div>
        )}

        {activeTab === 'recetas' && (
          <>
            {loadingPlan ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#8B949E' }}>Cargando plan nutricional...</div>
            ) : planAsignado?.tiene_plan ? (
              <VistaEquivalentes plan={planAsignado} contenido={planAsignado.contenido} pacienteView />
            ) : (
              <section className="alimentos-equivalentes-container" style={{ textAlign: 'center', padding: '30px' }}>
                <h3 style={{ color: '#E6EDF3', fontSize: '15px' }}>Sin plan nutricional asignado</h3>
                <p style={{ color: '#8B949E', fontSize: '12px' }}>Tu nutriólogo te asignará recetas y equivalentes personalizados.</p>
              </section>
            )}
          </>
        )}

        {activeTab === 'peso' && (
          <SeguimientoPeso pacienteId={pacienteId} onBack={() => setActiveTab('diario')} />
        )}
      </div>
    </div>
  );
};

export default Nutricion;