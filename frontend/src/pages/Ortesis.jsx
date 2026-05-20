import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Ortesis.css';

const Ortesis = () => {
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('inicio');
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para datos
  const [contenidoEducativo, setContenidoEducativo] = useState(null);
  const [dispositivo, setDispositivo] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [problemas, setProblemas] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Formulario de problema. `severidad` mapea a la columna ENUM('leve','moderado','severo')
  // de la tabla reportes_problemas. `tipo` es solo para UI y se prefija a la descripción.
  const [problemaForm, setProblemaForm] = useState({
    tipo: '',
    descripcion: '',
    severidad: 'moderado'
  });

  const tiposProblema = [
    { id: 'dolor', nombre: 'Dolor o molestia', icon: 'heart-pulse' },
    { id: 'ajuste', nombre: 'Problema de ajuste', icon: 'wrench' },
    { id: 'piel', nombre: 'Irritación en la piel', icon: 'heart-pulse' },
    { id: 'mecanico', nombre: 'Falla mecánica', icon: 'settings' },
    { id: 'limpieza', nombre: 'Necesita limpieza', icon: 'droplet' },
    { id: 'otro', nombre: 'Otro problema', icon: 'circle-help' }
  ];

  const categoriasGuias = {
    'cuidado_munon': { nombre: 'Cuidado del Muñón', icon: 'footprints', color: '#10b981' },
    'limpieza_protesis': { nombre: 'Limpieza', icon: 'droplet', color: '#3b82f6' },
    'colocacion': { nombre: 'Colocación', icon: 'wrench', color: '#8b5cf6' },
    'mantenimiento': { nombre: 'Mantenimiento', icon: 'wrench', color: '#f59e0b' },
    'emergencias': { nombre: 'Alertas', icon: 'alert-triangle', color: '#ef4444' },
    'ejercicios': { nombre: 'Ejercicios', icon: 'zap', color: '#06b6d4' }
  };

  const categoriasProtesis = {
    'transtibial': { nombre: 'Transtibial', desc: 'Debajo de rodilla', icon: 'accessibility' },
    'transfemoral': { nombre: 'Transfemoral', desc: 'Arriba de rodilla', icon: 'footprints' },
    'desarticulacion_rodilla': { nombre: 'Desart. Rodilla', desc: 'A nivel de rodilla', icon: 'footprints' },
    'parcial_pie': { nombre: 'Pie Parcial', desc: 'Amputación parcial', icon: 'footprints' }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar contenido educativo
      const response = await api.get('/protesis/educativo');
      if (response.success) {
        setContenidoEducativo(response.data);
      }

      // Cargar dispositivo del paciente
      if (user?.paciente_id) {
        const dispResponse = await api.get(`/ortesis/dispositivo/${user.paciente_id}`);
        if (dispResponse.success) {
          setDispositivo(dispResponse.data);
        }

        // Cargar problemas
        const probResponse = await api.get(`/ortesis/problemas/${user.paciente_id}`);
        if (probResponse.success) {
          setProblemas(probResponse.data || []);
        }
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar la información. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportarProblema = async (e) => {
    e.preventDefault();
    try {
      // Prefijamos el tipo a la descripción porque la tabla no tiene columna `tipo`.
      const tipoLabel = tiposProblema.find(t => t.id === problemaForm.tipo)?.nombre || problemaForm.tipo;
      const descFull = tipoLabel
        ? `[${tipoLabel}] ${problemaForm.descripcion}`
        : problemaForm.descripcion;

      await api.post('/ortesis/problemas', {
        paciente_id: user.paciente_id,
        descripcion: descFull,
        severidad: problemaForm.severidad,
      });

      setShowModal(false);
      setProblemaForm({ tipo: '', descripcion: '', severidad: 'moderado' });
      cargarDatos();
    } catch (err) {
      console.error('Error al reportar problema:', err);
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : 'Error desconocido');
      alert('No se pudo enviar el reporte: ' + msg);
    }
  };

  const getBackRoute = () => {
    const rol = user?.rol || user?.role;
    switch (rol) {
      case 'especialista': return '/especialista';
      case 'administrador': return '/admin';
      default: return '/paciente';
    }
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={cargarDatos} className="btn btn-primary">Reintentar</button>
        </div>
      );
    }

    switch (activeTab) {
      case 'inicio':
        return renderInicio();
      case 'niveles-k':
        return renderNivelesK();
      case 'tipos':
        return renderTiposProtesis();
      case 'cuidados':
        return renderGuiasCuidado();
      case 'mi-protesis':
        return renderMiProtesis();
      case 'problemas':
        return renderProblemas();
      case 'faqs':
        return renderFAQs();
      default:
        return renderInicio();
    }
  };

  // =====================================================
  // RENDERIZAR INICIO
  // =====================================================
  const renderInicio = () => (
    <div className="inicio-section">
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Centro de Información de Prótesis</h2>
          <p>Todo lo que necesitas saber sobre tu prótesis, cuidados y rehabilitación</p>
        </div>
      </div>

      <div className="quick-actions">
        <div className="action-card" onClick={() => setActiveTab('niveles-k')}>
          <span className="action-icon"><LucideIcon name="bar-chart" size={24} /></span>
          <h3>Niveles K</h3>
          <p>Conoce tu clasificación funcional</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('tipos')}>
          <span className="action-icon"><LucideIcon name="accessibility" size={24} /></span>
          <h3>Tipos de Prótesis</h3>
          <p>Explora las opciones disponibles</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('cuidados')}>
          <span className="action-icon"><LucideIcon name="book-open" size={24} /></span>
          <h3>Guías de Cuidado</h3>
          <p>Aprende a cuidar tu prótesis</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('mi-protesis')}>
          <span className="action-icon"><LucideIcon name="settings" size={24} /></span>
          <h3>Mi Prótesis</h3>
          <p>Información de tu dispositivo</p>
        </div>
      </div>

      {/* Nivel K del usuario si existe */}
      {dispositivo?.nivel_k && (
        <div className="user-nivel-k-card">
          <div className="nivel-badge">
            <span className="nivel-letra">{dispositivo.nivel_k}</span>
          </div>
          <div className="nivel-info">
            <h3>Tu Nivel Funcional</h3>
            <p className="nivel-nombre">{dispositivo.nivel_k_nombre}</p>
            <p className="nivel-desc">{dispositivo.nivel_k_descripcion}</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('niveles-k')}
          >
            Más información
          </button>
        </div>
      )}

      {/* Resumen de contenido */}
      <div className="content-summary">
        <h3>Contenido Disponible</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-number">{contenidoEducativo?.niveles_k?.length || 5}</span>
            <span className="summary-label">Niveles K</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">
              {Object.values(contenidoEducativo?.tipos_protesis || {}).flat().length || 0}
            </span>
            <span className="summary-label">Tipos de Prótesis</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">
              {Object.values(contenidoEducativo?.guias_cuidado || {}).flat().length || 0}
            </span>
            <span className="summary-label">Guías de Cuidado</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{contenidoEducativo?.faqs?.length || 0}</span>
            <span className="summary-label">Preguntas Frecuentes</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =====================================================
  // RENDERIZAR NIVELES K
  // =====================================================
  const renderNivelesK = () => (
    <div className="niveles-k-section">
      <div className="section-header">
        <h2>Niveles K de Movilidad</h2>
        <p>La clasificación K determina tu potencial funcional y el tipo de prótesis recomendada</p>
      </div>

      {selectedItem ? (
        <div className="nivel-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a todos los niveles
          </button>

          <div className="nivel-detail-card">
            <div className="nivel-header">
              <div className="nivel-badge large">
                <span>{selectedItem.nivel}</span>
              </div>
              <div>
                <h2>{selectedItem.nombre}</h2>
                <p className="nivel-desc">{selectedItem.descripcion}</p>
              </div>
            </div>

            <div className="nivel-sections">
              <div className="nivel-section">
                <h3>Características</h3>
                <ul>
                  {selectedItem.caracteristicas?.map((car, idx) => (
                    <li key={idx}>{car}</li>
                  ))}
                </ul>
              </div>

              <div className="nivel-section">
                <h3>Actividades Permitidas</h3>
                <ul className="actividades-list">
                  {selectedItem.actividades_permitidas?.map((act, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      {act}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="nivel-section">
                <h3>Prótesis Recomendadas</h3>
                <ul className="protesis-recomendadas">
                  {selectedItem.tipo_protesis_recomendada?.map((tipo, idx) => (
                    <li key={idx}>{tipo}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="niveles-grid">
          {contenidoEducativo?.niveles_k?.map((nivel) => (
            <div
              key={nivel.nivel}
              className={`nivel-card ${dispositivo?.nivel_k === nivel.nivel ? 'current' : ''}`}
              onClick={() => setSelectedItem(nivel)}
            >
              {dispositivo?.nivel_k === nivel.nivel && (
                <span className="current-badge">Tu nivel</span>
              )}
              <div className="nivel-badge">
                <span>{nivel.nivel}</span>
              </div>
              <h3>{nivel.nombre}</h3>
              <p>{nivel.descripcion.substring(0, 120)}...</p>
              <div className="nivel-preview">
                <span>{nivel.caracteristicas?.length || 0} características</span>
                <span>{nivel.actividades_permitidas?.length || 0} actividades</span>
              </div>
              <button className="btn btn-outline btn-sm">Ver más</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR TIPOS DE PRÓTESIS
  // =====================================================
  const renderTiposProtesis = () => (
    <div className="tipos-section">
      <div className="section-header">
        <h2>Tipos de Prótesis</h2>
        <p>Conoce las diferentes opciones según el nivel de amputación</p>
      </div>

      {!activeSubTab ? (
        <div className="categorias-grid">
          {Object.entries(categoriasProtesis).map(([key, cat]) => (
            <div
              key={key}
              className="categoria-card"
              onClick={() => setActiveSubTab(key)}
            >
              <span className="categoria-icon"><LucideIcon name={cat.icon} size={24} /></span>
              <h3>{cat.nombre}</h3>
              <p>{cat.desc}</p>
              <span className="tipos-count">
                {contenidoEducativo?.tipos_protesis?.[key]?.length || 0} tipos
              </span>
            </div>
          ))}
        </div>
      ) : selectedItem ? (
        <div className="tipo-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a {categoriasProtesis[activeSubTab]?.nombre}
          </button>

          <div className="tipo-detail-card">
            <h2>{selectedItem.nombre}</h2>
            <span className="tipo-categoria">
              {categoriasProtesis[selectedItem.categoria]?.nombre}
            </span>

            <p className="tipo-descripcion">{selectedItem.descripcion}</p>

            {selectedItem.nivel_k_minimo && (
              <div className="nivel-minimo">
                <span>Nivel K mínimo requerido:</span>
                <span className="nivel-badge small">{selectedItem.nivel_k_minimo}</span>
              </div>
            )}

            <div className="tipo-sections">
              {selectedItem.componentes && (
                <div className="tipo-section">
                  <h3>Componentes</h3>
                  <ul>
                    {selectedItem.componentes.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.ventajas && (
                <div className="tipo-section ventajas">
                  <h3>✓ Ventajas</h3>
                  <ul>
                    {selectedItem.ventajas.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.desventajas && (
                <div className="tipo-section desventajas">
                  <h3>✗ Consideraciones</h3>
                  <ul>
                    {selectedItem.desventajas.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.cuidados_especificos && (
                <div className="tipo-section cuidados">
                  <h3>Cuidados Específicos</h3>
                  <ul>
                    {selectedItem.cuidados_especificos.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="tipos-list">
          <button className="btn-back" onClick={() => setActiveSubTab(null)}>
            ← Volver a categorías
          </button>

          <h3><LucideIcon name={categoriasProtesis[activeSubTab]?.icon} size={20} /> {categoriasProtesis[activeSubTab]?.nombre}</h3>

          <div className="tipos-grid">
            {contenidoEducativo?.tipos_protesis?.[activeSubTab]?.map((tipo) => (
              <div
                key={tipo.id}
                className="tipo-card"
                onClick={() => setSelectedItem(tipo)}
              >
                <h4>{tipo.nombre}</h4>
                <p>{tipo.descripcion.substring(0, 100)}...</p>
                {tipo.nivel_k_minimo && (
                  <span className="nivel-badge mini">{tipo.nivel_k_minimo}+</span>
                )}
                <button className="btn btn-outline btn-sm">Ver detalles</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR GUÍAS DE CUIDADO
  // =====================================================
  const renderGuiasCuidado = () => (
    <div className="guias-section">
      <div className="section-header">
        <h2>Guías de Cuidado</h2>
        <p>Instrucciones detalladas para el cuidado de tu prótesis y muñón</p>
      </div>

      {!activeSubTab ? (
        <div className="categorias-guias-grid">
          {Object.entries(categoriasGuias).map(([key, cat]) => (
            <div
              key={key}
              className="categoria-guia-card"
              style={{ '--cat-color': cat.color }}
              onClick={() => setActiveSubTab(key)}
            >
              <span className="categoria-icon"><LucideIcon name={cat.icon} size={24} /></span>
              <h3>{cat.nombre}</h3>
              <span className="guias-count">
                {contenidoEducativo?.guias_cuidado?.[key]?.length || 0} guías
              </span>
            </div>
          ))}
        </div>
      ) : selectedItem ? (
        <div className="guia-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a {categoriasGuias[activeSubTab]?.nombre}
          </button>

          <div className="guia-detail-card">
            <div className="guia-header" style={{ '--cat-color': categoriasGuias[activeSubTab]?.color }}>
              <span className="guia-icon"><LucideIcon name={categoriasGuias[activeSubTab]?.icon} size={24} /></span>
              <h2>{selectedItem.titulo}</h2>
            </div>

            <p className="guia-intro">{selectedItem.contenido}</p>

            {selectedItem.pasos && (
              <div className="guia-section">
                <h3>Pasos a seguir</h3>
                <ol className="pasos-list">
                  {selectedItem.pasos.map((paso, idx) => (
                    <li key={idx}>{paso}</li>
                  ))}
                </ol>
              </div>
            )}

            {selectedItem.tips && (
              <div className="guia-section tips">
                <h3><LucideIcon name="lightbulb" size={20} /> Consejos</h3>
                <ul>
                  {selectedItem.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.advertencias && (
              <div className="guia-section advertencias">
                <h3><LucideIcon name="alert-triangle" size={20} /> Advertencias</h3>
                <ul>
                  {selectedItem.advertencias.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="guias-list">
          <button className="btn-back" onClick={() => setActiveSubTab(null)}>
            ← Volver a categorías
          </button>

          <h3><LucideIcon name={categoriasGuias[activeSubTab]?.icon} size={20} /> {categoriasGuias[activeSubTab]?.nombre}</h3>

          <div className="guias-grid">
            {contenidoEducativo?.guias_cuidado?.[activeSubTab]?.map((guia) => (
              <div
                key={guia.id}
                className="guia-card"
                onClick={() => setSelectedItem(guia)}
              >
                <h4>{guia.titulo}</h4>
                <p>{guia.contenido.substring(0, 80)}...</p>
                <div className="guia-meta">
                  <span>{guia.pasos?.length || 0} pasos</span>
                </div>
                <button className="btn btn-outline btn-sm">Leer guía</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR MI PRÓTESIS
  // =====================================================
  const renderMiProtesis = () => (
    <div className="mi-protesis-section">
      <div className="section-header">
        <h2>Mi Prótesis</h2>
        <p>Información sobre tu dispositivo actual</p>
      </div>

      {dispositivo?.tiene_dispositivo ? (
        <div className="dispositivo-info">
          <div className="dispositivo-card main">
            <div className="dispositivo-header">
              <h3>{dispositivo.tipo || 'Prótesis'}</h3>
              {dispositivo.nivel_k && (
                <span className="nivel-badge">{dispositivo.nivel_k}</span>
              )}
            </div>

            <div className="info-grid">
              {dispositivo.modelo && (
                <div className="info-item">
                  <span className="info-label">Modelo</span>
                  <span className="info-value">{dispositivo.modelo}</span>
                </div>
              )}
              {dispositivo.fecha_entrega && (
                <div className="info-item">
                  <span className="info-label">Fecha de entrega</span>
                  <span className="info-value">
                    {new Date(dispositivo.fecha_entrega).toLocaleDateString()}
                  </span>
                </div>
              )}
              {dispositivo.ultimo_mantenimiento && (
                <div className="info-item">
                  <span className="info-label">Último mantenimiento</span>
                  <span className="info-value">
                    {new Date(dispositivo.ultimo_mantenimiento).toLocaleDateString()}
                  </span>
                </div>
              )}
              {dispositivo.proximo_mantenimiento && (
                <div className="info-item destacado">
                  <span className="info-label">Próximo mantenimiento</span>
                  <span className="info-value">
                    {new Date(dispositivo.proximo_mantenimiento).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {dispositivo.notas && (
              <div className="notas-especialista">
                <h4>Notas del especialista</h4>
                <p>{dispositivo.notas}</p>
              </div>
            )}
          </div>

          <div className="acciones-dispositivo">
            <button
              className="btn btn-primary"
              onClick={() => {
                setModalType('problema');
                setShowModal(true);
              }}
            >
              Reportar Problema
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('cuidados')}>
              Ver Guías de Cuidado
            </button>
          </div>
        </div>
      ) : (
        <div className="no-dispositivo">
          <div className="empty-icon"><LucideIcon name="accessibility" size={32} /></div>
          <h3>Sin dispositivo registrado</h3>
          <p>Tu especialista registrará la información de tu prótesis cuando sea asignada.</p>
          <button className="btn btn-outline" onClick={() => setActiveTab('tipos')}>
            Explorar tipos de prótesis
          </button>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR PROBLEMAS
  // =====================================================
  const renderProblemas = () => (
    <div className="problemas-section">
      <div className="section-header">
        <h2>Problemas Reportados</h2>
        <p>Historial de problemas y su estado</p>
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={() => {
          setModalType('problema');
          setShowModal(true);
        }}
      >
        + Reportar Nuevo Problema
      </button>

      {problemas.length > 0 ? (
        <div className="problemas-list">
          {problemas.map(problema => (
            <div key={problema.id} className={`problema-card urgencia-${problema.urgencia}`}>
              <div className="problema-header">
                <span className="problema-tipo">
                  <LucideIcon name={tiposProblema.find(t => t.id === problema.tipo)?.icon || 'circle-help'} size={16} />{' '}
                  {tiposProblema.find(t => t.id === problema.tipo)?.nombre || problema.tipo}
                </span>
                <span className={`urgencia-badge ${problema.urgencia}`}>
                  {problema.urgencia}
                </span>
              </div>
              <p className="problema-descripcion">{problema.descripcion}</p>
              <div className="problema-footer">
                <span className="problema-fecha">
                  {new Date(problema.created_at).toLocaleDateString()}
                </span>
                <span className={`problema-estado ${problema.estado || 'pendiente'}`}>
                  {problema.estado || 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-problemas">
          <p>No hay problemas reportados</p>
          <p className="text-muted">¡Excelente! Tu prótesis está funcionando bien.</p>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR FAQs
  // =====================================================
  const renderFAQs = () => (
    <div className="faqs-section">
      <div className="section-header">
        <h2>Preguntas Frecuentes</h2>
        <p>Respuestas a las dudas más comunes sobre prótesis</p>
      </div>

      <div className="faqs-list">
        {contenidoEducativo?.faqs?.map((faq, idx) => (
          <details key={faq.id || idx} className="faq-item">
            <summary>
              <span className="faq-icon"><LucideIcon name="circle-help" size={18} /></span>
              {faq.pregunta}
            </summary>
            <div className="faq-answer">
              <p>{faq.respuesta}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ortesis-page">
      <header className="page-header">
        <button className="btn-back-header" onClick={() => navigate(getBackRoute())}>
          ← Regresar
        </button>
        <div className="header-content">
          <h1><LucideIcon name="accessibility" size={24} /> Prótesis</h1>
          <p className="subtitle">Centro de información y cuidados</p>
        </div>
      </header>

      <nav className="tabs-nav">
        <button
          className={`tab ${activeTab === 'inicio' ? 'active' : ''}`}
          onClick={() => { setActiveTab('inicio'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Inicio
        </button>
        <button
          className={`tab ${activeTab === 'niveles-k' ? 'active' : ''}`}
          onClick={() => { setActiveTab('niveles-k'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Niveles K
        </button>
        <button
          className={`tab ${activeTab === 'tipos' ? 'active' : ''}`}
          onClick={() => { setActiveTab('tipos'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Tipos
        </button>
        <button
          className={`tab ${activeTab === 'cuidados' ? 'active' : ''}`}
          onClick={() => { setActiveTab('cuidados'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Cuidados
        </button>
        <button
          className={`tab ${activeTab === 'mi-protesis' ? 'active' : ''}`}
          onClick={() => { setActiveTab('mi-protesis'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Mi Prótesis
        </button>
        <button
          className={`tab ${activeTab === 'problemas' ? 'active' : ''}`}
          onClick={() => { setActiveTab('problemas'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Problemas
        </button>
        <button
          className={`tab ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('faqs'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          FAQs
        </button>
      </nav>

      <main className="tab-content">
        {renderContent()}
      </main>

      {/* Modal para reportar problema */}
      {showModal && modalType === 'problema' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Reportar Problema</h2>
            <form onSubmit={handleReportarProblema}>
              <div className="form-group">
                <label>Tipo de problema</label>
                <div className="tipo-problema-grid">
                  {tiposProblema.map(tipo => (
                    <button
                      key={tipo.id}
                      type="button"
                      className={`tipo-btn ${problemaForm.tipo === tipo.id ? 'selected' : ''}`}
                      onClick={() => setProblemaForm({...problemaForm, tipo: tipo.id})}
                    >
                      <span className="tipo-icon"><LucideIcon name={tipo.icon} size={20} /></span>
                      <span className="tipo-nombre">{tipo.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Describe el problema</label>
                <textarea
                  value={problemaForm.descripcion}
                  onChange={e => setProblemaForm({...problemaForm, descripcion: e.target.value})}
                  className="form-control"
                  rows="4"
                  placeholder="Describe con detalle qué está pasando..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Severidad</label>
                <select
                  value={problemaForm.severidad}
                  onChange={e => setProblemaForm({...problemaForm, severidad: e.target.value})}
                  className="form-control"
                >
                  <option value="leve">Leve - Puede esperar</option>
                  <option value="moderado">Moderado - Necesito atención pronto</option>
                  <option value="severo">Severo - Necesito atención urgente</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!problemaForm.tipo || !problemaForm.descripcion}
                >
                  Enviar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default Ortesis;
