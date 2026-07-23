import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import VoiceHelper from '../components/VoiceHelper';
import LucideIcon from '../components/LucideIcon';
import '../styles/Nutricion.css';

const Nutricion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Obtener ID del paciente
  const pacienteId = user?.paciente_id || user?.id;

  // Estado del Plan
  const [planPaciente, setPlanPaciente] = useState(null);
  
  // Control de grupos desplegados (Acordiones)
  const [openGroups, setOpenGroups] = useState({
    Frutas: true,
    Grasas: true
  });

  useEffect(() => {
    cargarPlanNutricional();
  }, [pacienteId, selectedDate]);

  const cargarPlanNutricional = async () => {
    if (!pacienteId) return;
    setLoading(true);

    try {
      // Petición al backend para obtener el plan asignado/porciones guardadas
      const response = await api.get(`/nutricion/plan-paciente/${pacienteId}`);
      let data = response?.data?.data || response?.data || response;

      if (data && (data.tiene_plan || data.grupos)) {
        setPlanPaciente(data);
      } else {
        // Fallback datos por defecto basados en tu diseño si aún no se han asignado
        setPlanPaciente(getDatosEstructuraEjemplo());
      }
    } catch (err) {
      console.error('Error al cargar plan de nutrición:', err);
      setPlanPaciente(getDatosEstructuraEjemplo());
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

  // Estructura fallback visual si la BD aún no retorna nada para el usuario
  const getDatosEstructuraEjemplo = () => ({
    nutriologo: "Nutriólogo asignado",
    metas: {
      calorias: 2200,
      proteinas: 120,
      carbohidratos: 250,
      grasas: 70
    },
    grupos: [
      {
        nombre: "Frutas",
        equivalentes: 3,
        alimentos: [
          { nombre: "Manzana", porcion: "1 porción" },
          { nombre: "Plátano", porcion: "1 porción" },
          { nombre: "Papaya", porcion: "1 porción" }
        ]
      },
      {
        nombre: "Cereales",
        equivalentes: 3,
        alimentos: [
          { nombre: "Avena cocida", porcion: "1/2 taza" },
          { nombre: "Pan integral", porcion: "1 rebanada" }
        ]
      },
      {
        nombre: "Proteínas",
        equivalentes: 4,
        alimentos: [
          { nombre: "Pechuga de pollo", porcion: "90g" },
          { nombre: "Claras de huevo", porcion: "3 pzas" }
        ]
      },
      {
        nombre: "Grasas",
        equivalentes: 2,
        alimentos: [
          { nombre: "Aguacate", porcion: "1 porción" },
          { nombre: "Nueces", porcion: "1 porción" },
          { nombre: "Aceite de oliva", porcion: "1 porción" }
        ]
      }
    ],
    recomendaciones: [
      "Consumir agua constantemente durante el día.",
      "Evitar alimentos ultra procesados.",
      "Mantener horarios de comida estables.",
      "Priorizar verduras y frutas frescas."
    ],
    receta_sugerida: {
      titulo: "Ensalada Balanceada",
      tipo: "Almuerzo",
      calorias: 320,
      proteinas: 25,
      imagen: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop"
    }
  });

  const metas = planPaciente?.metas || { calorias: 2200, proteinas: 120, carbohidratos: 250, grasas: 70 };
  const grupos = planPaciente?.grupos || [];
  const recomendaciones = planPaciente?.recomendaciones || [];

  return (
    <div className="azaria-nutricion-container">
      <VoiceHelper currentModule="nutricion" />

      {/* Header Estilo Azaria Verde */}
      <header className="azaria-header-card">
        <div className="azaria-header-top">
          <div className="azaria-header-title">
            <span className="azaria-header-icon">🥗</span>
            <div>
              <h1>Nutrición</h1>
              <p>Plan diario de alimentación</p>
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

      {/* Metas Diarias */}
      <section className="azaria-metas-section">
        <div className="azaria-metas-header">
          <h3><span className="icon-target">🎯</span> Metas Diarias</h3>
          <span className="azaria-nutriologo-tag">
            {planPaciente?.nutriologo || 'Nutriólogo asignado'}
          </span>
        </div>

        <div className="azaria-metas-grid">
          <div className="azaria-meta-card border-red">
            <span className="meta-emoji">🔥</span>
            <div>
              <h4>{metas.calorias}</h4>
              <p>Calorías</p>
            </div>
          </div>
          <div className="azaria-meta-card border-blue">
            <span className="meta-emoji">🍗</span>
            <div>
              <h4>{metas.proteinas}g</h4>
              <p>Proteínas</p>
            </div>
          </div>
          <div className="azaria-meta-card border-orange">
            <span className="meta-emoji">🍞</span>
            <div>
              <h4>{metas.carbohidratos}g</h4>
              <p>Carbohidratos</p>
            </div>
          </div>
          <div className="azaria-meta-card border-purple">
            <span className="meta-emoji">🥑</span>
            <div>
              <h4>{metas.grasas}g</h4>
              <p>Grasas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Alimentos Equivalentes - Acordión Oscuro */}
      <section className="azaria-equivalentes-container">
        <div className="azaria-eq-title">
          <span className="icon-bowl">🍲</span>
          <h3>Alimentos Equivalentes</h3>
        </div>

        <div className="azaria-groups-list">
          {grupos.map((grupo, idx) => {
            const isOpen = openGroups[grupo.nombre];
            return (
              <div key={idx} className="azaria-group-accordion">
                <button 
                  className="azaria-group-header" 
                  onClick={() => toggleGroup(grupo.nombre)}
                >
                  <div className="azaria-group-info">
                    <span className="group-badge-icon">🥗</span>
                    <div>
                      <strong>{grupo.nombre}</strong>
                      <p>{grupo.equivalentes} equivalentes</p>
                    </div>
                  </div>
                  <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>
                    ▲
                  </span>
                </button>

                {isOpen && (
                  <div className="azaria-group-body">
                    {grupo.alimentos && grupo.alimentos.map((alimento, aIdx) => (
                      <div key={aIdx} className="azaria-alimento-row">
                        <div className="alimento-name">
                          <span className="dot-green"></span>
                          <span>{alimento.nombre}</span>
                        </div>
                        <span className="alimento-porcion">
                          {alimento.porcion || '1 porción'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recomendaciones */}
      <section className="azaria-recomendaciones-card">
        <div className="azaria-rec-header">
          <span className="check-box">✓</span>
          <h3>Recomendaciones</h3>
        </div>
        <ul className="azaria-rec-list">
          {recomendaciones.map((item, i) => (
            <li key={i}>
              <span className="check-icon">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Recetas Sugeridas */}
      <section className="azaria-recetas-section">
        <div className="azaria-receta-title">
          <LucideIcon name="search" size={18} />
          <h3>Recetas sugeridas</h3>
        </div>

        <div className="azaria-receta-card">
          <div className="receta-img-wrapper">
            <img 
              src={planPaciente?.receta_sugerida?.imagen || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop"} 
              alt="Ensalada Balanceada" 
            />
          </div>
          <div className="receta-content">
            <h4>{planPaciente?.receta_sugerida?.titulo || "Ensalada Balanceada"}</h4>
            <span className="receta-tag">{planPaciente?.receta_sugerida?.tipo || "Almuerzo"}</span>
            <div className="receta-macros">
              <span>🔥 {planPaciente?.receta_sugerida?.calorias || 320} kcal</span>
              <span>🍗 {planPaciente?.receta_sugerida?.proteinas || 25}g proteína</span>
            </div>
          </div>
        </div>
      </section>

      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default Nutricion;
