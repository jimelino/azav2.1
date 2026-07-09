import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import VistaPlan from './VistaPlan';
import './MiPlanNutricional.css';

// Mantenemos tus configuraciones visuales exactas
const GRUPO_CONFIG = {
  'Verduras': { icon: 'salad', color: '#4CAF50' },
  'Frutas': { icon: 'apple', color: '#FF9800' },
  'Cereales': { icon: 'wheat', color: '#FFC107' },
  'Leguminosas': { icon: 'bean', color: '#795548' },
  'Proteínas 1': { icon: 'fish', color: '#F44336' },
  'Proteínas 2': { icon: 'beef', color: '#E91E63' },
  'Proteínas 3': { icon: 'egg', color: '#C62828' },
  'Lácteos': { icon: 'milk', color: '#42A5F5' },
  'Grasas': { icon: 'droplet', color: '#FF7043' },
  'Grasas con proteína': { icon: 'nut', color: '#8D6E63' },
};

const MiPlanNutricional = ({ pacienteId }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diaActual, setDiaActual] = useState('');
  const [seguimientoHoy, setSeguimientoHoy] = useState({});
  
  // NUEVO: Estados para el catálogo de equivalentes sin romper lo anterior
  const [catalogoAlimentos, setCatalogoAlimentos] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    // Obtener día actual en español
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    setDiaActual(dias[new Date().getDay()]);

    loadPlan();
    loadCatalogoEquivalentes(); // Cargamos el catálogo en segundo plano
  }, [pacienteId]);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/nutricion/plan-paciente/${pacienteId}`);
      setPlan(response.data);

      // Cargar seguimiento de hoy
      if (response.data?.seguimiento_hoy) {
        const seguimiento = {};
        response.data.seguimiento_hoy.forEach(s => {
          seguimiento[s.tipo_comida] = s.cumplido;
        });
        setSeguimientoHoy(seguimiento);
      }
    } catch (error) {
      console.error('Error cargando plan:', error);
    } finally {
      setLoading(false);
    }
  };

  // NUEVO: Cargar catálogo de alimentos para los desgloses
  const loadCatalogoEquivalentes = async () => {
    try {
      const response = await api.get('/nutricion/equivalentes/catalogo');
      if (response.data) setCatalogoAlimentos(response.data);
    } catch (error) {
      console.error('Error cargando catálogo de equivalentes:', error);
    }
  };

  const handleMarcarComida = async (tipoComida, cumplido) => {
    try {
      await api.post(`/nutricion/plan-paciente/${pacienteId}/seguimiento`, {
        asignacion_id: plan.id,
        tipo_comida: tipoComida,
        cumplido: cumplido,
        fecha: new Date().toISOString().split('T')[0]
      });

      setSeguimientoHoy(prev => ({
        ...prev,
        [tipoComida]: cumplido
      }));
    } catch (error) {
      console.error('Error registrando seguimiento:', error);
    }
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const tiposComidaConfig = {
    desayuno: { label: 'Desayuno', icon: 'sunrise', hora: '7:00 - 9:00', dbField: 'desayuno' },
    media_manana: { label: 'Media Mañana', icon: 'apple', hora: '10:00 - 11:00', dbField: 'colacion_matutina' },
    almuerzo: { label: 'Almuerzo', icon: 'utensils', hora: '13:00 - 14:00', dbField: 'comida' },
    merienda: { label: 'Merienda', icon: 'cookie', hora: '16:00 - 17:00', dbField: 'colacion_vespertina' },
    cena: { label: 'Cena', icon: 'moon', hora: '19:00 - 21:00', dbField: 'cena' },
    snack: { label: 'Snack', icon: 'cookie', hora: 'Cualquier hora', dbField: 'snack' }
  };

  const tiposOrden = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena', 'snack'];

  if (loading) {
    return (
      <div className="mi-plan-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tu plan nutricional...</p>
      </div>
    );
  }

  if (!plan || !plan.tiene_plan) {
    return (
      <div className="mi-plan-empty">
        <span className="empty-icon"><LucideIcon name="salad" size={40} /></span>
        <h3>Sin Plan Asignado</h3>
        <p>Aún no tienes un plan nutricional asignado.</p>
        <p>Tu especialista en nutrición te asignará uno pronto.</p>
      </div>
    );
  }

  // Obtener comidas del día actual
  const comidasHoy = (plan.comidas || []).filter(c => c.dia_semana === diaActual);

  // Calcular progreso del día
  const comidasCompletadas = Object.values(seguimientoHoy).filter(v => v).length;
  const totalComidas = comidasHoy.length || 1;
  const progresoPorcentaje = Math.round((comidasCompletadas / totalComidas) * 100);

  return (
    <div className="mi-plan-nutricional">
      {/* Header del plan (Tu diseño original intacto) */}
      <div className="plan-header-card">
        <div className="plan-info">
          <h2>{plan.nombre}</h2>
          {plan.descripcion && <p className="plan-desc">{plan.descripcion}</p>}
          <p className="plan-especialista">
            Asignado por: <strong>{plan.especialista_nombre}</strong>
          </p>
        </div>

        <div className="plan-macros">
          <div className="macro-item">
            <span className="macro-icon"><LucideIcon name="flame" size={18} /></span>
            <span className="macro-value">{plan.calorias_diarias || 0}</span>
            <span className="macro-label">kcal/día</span>
          </div>
          <div className="macro-item">
            <span className="macro-icon"><LucideIcon name="beef" size={18} /></span>
            <span className="macro-value">{plan.proteinas_g || 0}g</span>
            <span className="macro-label">Proteínas</span>
          </div>
          <div className="macro-item">
            <span className="macro-icon"><LucideIcon name="wheat" size={18} /></span>
            <span className="macro-value">{plan.carbohidratos_g || 0}g</span>
            <span className="macro-label">Carbos</span>
          </div>
          <div className="macro-item">
            <span className="macro-icon"><LucideIcon name="droplet" size={18} /></span>
            <span className="macro-value">{plan.grasas_g || 0}g</span>
            <span className="macro-label">Grasas</span>
          </div>
        </div>
      </div>

      {/* Progreso del día (Tu diseño original intacto) */}
      <div className="progreso-dia">
        <div className="progreso-header">
          <h3><LucideIcon name="calendar" size={20} /> Progreso de Hoy - {diaActual.charAt(0).toUpperCase() + diaActual.slice(1)}</h3>
          <span className="progreso-porcentaje">{progresoPorcentaje}%</span>
        </div>
        <div className="progreso-bar">
          <div
            className="progreso-fill"
            style={{ width: `${progresoPorcentaje}%` }}
          ></div>
        </div>
        <p className="progreso-texto">
          {comidasCompletadas} de {totalComidas} comidas completadas
        </p>
      </div>

      {/* Comidas del día (Tu estructura original) */}
      <div className="comidas-hoy">
        <h3><LucideIcon name="utensils" size={20} /> Tu Menu de Hoy</h3>

        {comidasHoy.length === 0 ? (
          <div className="no-comidas-hoy">
            <p>No hay comidas específicas para hoy en tu plan.</p>
            <p>Consulta con tu nutricionista.</p>
          </div>
        ) : (
          <div className="comidas-lista">
            {tiposOrden.map(tipo => {
              const comida = comidasHoy.find(c => c.tipo_comida === tipo);
              if (!comida) return null;

              const config = tiposComidaConfig[tipo];
              const completada = seguimientoHoy[tipo];

              return (
                <div
                  key={tipo}
                  className={`comida-card ${completada ? 'completada' : ''}`}
                >
                  {/* Botón de Check original */}
                  <div className="comida-check">
                    <button
                      className={`check-btn ${completada ? 'checked' : ''}`}
                      onClick={() => handleMarcarComida(tipo, !completada)}
                      aria-label={completada ? 'Marcar como no completada' : 'Marcar como completada'}
                    >
                      {completada ? '✓' : ''}
                    </button>
                  </div>

                  <div className="comida-main">
                    <div className="comida-tipo-header">
                      <span className="comida-icon"><LucideIcon name={config.icon} size={20} /></span>
                      <span className="comida-tipo-label">{config.label}</span>
                      <span className="comida-hora">{config.hora}</span>
                    </div>

                    <h4 className="comida-nombre">{comida.nombre_plato}</h4>

                    {comida.descripcion && (
                      <p className="comida-descripcion">{comida.descripcion}</p>
                    )}

                    {/* NUEVA IMPLEMENTACIÓN INTEGRADA: Si el plan incluye porciones de equivalentes para esta comida, las renderizamos aquí de forma limpia */}
                    {plan.porciones?.length > 0 && (
                      <div className="equivalentes-comida-desglosados" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #333' }}>
                        {plan.porciones.map((porcion) => {
                          const dbFieldName = config.dbField;
                          const cantidadPorcion = parseFloat(porcion[dbFieldName] || 0);
                          
                          if (cantidadPorcion <= 0) return null;

                          const cfgGrupo = GRUPO_CONFIG[porcion.nombre_grupo] || { icon: 'circle', color: '#78909C' };
                          const groupKey = `${tipo}-${porcion.nombre_grupo}`;
                          const isGroupExpanded = expandedGroups[groupKey];

                          // Buscar las opciones del catálogo para este grupo específico
                          const datosCatalogo = catalogoAlimentos.find(c => c.nombre.toLowerCase().trim() === porcion.nombre_grupo.toLowerCase().trim());
                          const alimentosOpciones = datosCatalogo ? datosCatalogo.alimentos : [];

                          return (
                            <div key={porcion.id} className="mini-grupo-equivalente-box" style={{ marginBottom: '8px' }}>
                              <div 
                                className="grupo-trigger-mini" 
                                style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', cursor: 'pointer', padding: '6px', borderRadius: '4px', background: '#1e1e1e' }}
                                onClick={() => toggleGroup(groupKey)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: cfgGrupo.color }}><LucideIcon name={cfgGrupo.icon} size={16} /></span>
                                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{porcion.nombre_grupo}</span>
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="badge-porciones" style={{ backgroundColor: cfgGrupo.color, padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#fff' }}>
                                    {cantidadPorcion} {cantidadPorcion === 1 ? 'pza' : 'pzas'}
                                  </span>
                                  <LucideIcon name={isGroupExpanded ? 'chevron-up' : 'chevron-down'} size={14} />
                                </div>
                              </div>

                              {/* Opciones del catálogo desplegables */}
                              {isGroupExpanded && (
                                <div className="alimentos-sub-grid" style={{ background: '#121212', padding: '8px', borderRadius: '0 0 4px 4px', fontSize: '13px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {alimentosOpciones.map((alimento, aIdx) => (
                                      <span key={aIdx} style={{ background: '#2a2a2a', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                        {alimento.nombre} <small style={{ color: '#aaa' }}>({alimento.equivalente || '1 pza'})</small>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {comida.calorias > 0 && (
                      <div className="comida-macros-mini">
                        <span><LucideIcon name="flame" size={14} /> {comida.calorias} kcal</span>
                        {comida.proteinas_g > 0 && <span><LucideIcon name="beef" size={14} /> {comida.proteinas_g}g</span>}
                        {comida.carbohidratos_g > 0 && <span><LucideIcon name="wheat" size={14} /> {comida.carbohidratos_g}g</span>}
                        {comida.grasas_g > 0 && <span><LucideIcon name="droplet" size={14} /> {comida.grasas_g}g</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recomendaciones originales (Tu diseño original intacto) */}
      {plan.contenido?.recomendaciones?.length > 0 && (
        <div className="plan-section recomendaciones">
          <h3><LucideIcon name="lightbulb" size={20} /> Recomendaciones</h3>
          <ul>
            {plan.contenido.recomendaciones.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Restricciones originales (Tu diseño original intacto) */}
      {plan.contenido?.restricciones?.length > 0 && (
        <div className="plan-section restricciones">
          <h3><LucideIcon name="alert-triangle" size={20} /> Alimentos a Evitar</h3>
          <ul>
            {plan.contenido.restricciones.map((res, idx) => (
              <li key={idx}>{res}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notas originales (Tu diseño original intacto) */}
      {plan.notas_personalizadas && (
        <div className="plan-section notas">
          <h3><LucideIcon name="pen-line" size={20} /> Notas de tu Nutricionista</h3>
          <p>{plan.notas_personalizadas}</p>
        </div>
      )}

      {/* Vistas colapsables de abajo (Tu diseño original intacto) */}
      {plan.contenido?.generado_con_catalogo && (
        <details className="plan-semana-completo">
          <summary><LucideIcon name="eye" size={18} /> Ver plan completo (vista detallada)</summary>
          <div className="semana-content" style={{ padding: 0 }}>
            <VistaPlan plan={plan} contenido={plan.contenido} compact />
          </div>
        </details>
      )}

      <details className="plan-semana-completo">
        <summary><LucideIcon name="calendar" size={18} /> Ver plan completo de la semana</summary>
        <div className="semana-content">
          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(dia => {
            const comidasDia = (plan.comidas || []).filter(c => c.dia_semana === dia);
            if (comidasDia.length === 0) return null;

            return (
              <div key={dia} className={`dia-resumen ${dia === diaActual ? 'dia-actual' : ''}`}>
                <h4>
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                  {dia === diaActual && <span className="badge-hoy">Hoy</span>}
                </h4>
                <div className="dia-comidas">
                  {comidasDia.map((comida, idx) => (
                    <div key={idx} className="comida-mini">
                      <span className="comida-mini-tipo">
                        <LucideIcon name={tiposComidaConfig[comida.tipo_comida]?.icon} size={16} /> {tiposComidaConfig[comida.tipo_comida]?.label}
                      </span>
                      <span className="comida-mini-nombre">{comida.nombre_plato}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
};

export default MiPlanNutricional;