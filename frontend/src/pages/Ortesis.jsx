import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Ortesis.css';

const MODULO_NOMBRE = 'Órtesis y prótesis';

const TIPOS_ORTESIS_SIMULADOS = {
  soportes_plantillas: [
    {
      id: 'ortesis-plantillas',
      categoria: 'soportes_plantillas',
      grupo_dispositivo: 'ortesis',
      nombre: 'Plantillas ortopédicas',
      descripcion: 'Dispositivos personalizados o prefabricados que se colocan dentro del calzado para mejorar apoyo, alineación y distribución de carga.',
      componentes: ['Base termoformada o modular', 'Apoyos de arco', 'Descargas por presión', 'Forro de contacto'],
      ventajas: ['Ayudan a mejorar la postura del pie', 'Reducen puntos de presión', 'Pueden usarse con calzado cotidiano'],
      cuidados_especificos: ['Ventila las plantillas cada día', 'Limpia con paño húmedo y jabón neutro', 'Revisa desgaste o deformación']
    }
  ],
  soporte_tronco: [
    {
      id: 'ortesis-faja-lumbar',
      categoria: 'soporte_tronco',
      grupo_dispositivo: 'ortesis',
      nombre: 'Fajas lumbares',
      descripcion: 'Órtesis de soporte para la zona lumbar que ayudan a limitar movimientos dolorosos y dar estabilidad durante actividades indicadas.',
      componentes: ['Banda elástica o semirrígida', 'Varillas posteriores', 'Sistema de ajuste con velcro', 'Panel abdominal'],
      ventajas: ['Aporta soporte durante la recuperación', 'Facilita control postural', 'Permite ajuste gradual de compresión'],
      cuidados_especificos: ['No la uses más tiempo del indicado', 'Lava según indicación del fabricante', 'Evita doblar las varillas']
    }
  ]
};

const TIPOS_PROTESIS_SIMULADOS = {
  transtibial: [
    {
      id: 'protesis-transtibial',
      categoria: 'transtibial',
      grupo_dispositivo: 'protesis',
      nombre: 'Prótesis transtibiales',
      descripcion: 'Prótesis para amputación por debajo de la rodilla. Conservan la articulación de rodilla y suelen permitir una marcha eficiente con entrenamiento.',
      componentes: ['Socket de contacto', 'Liner o interfaz', 'Sistema de suspensión', 'Tubo adaptador', 'Pie protésico'],
      nivel_k_minimo: 'K1',
      ventajas: ['Conserva la rodilla natural', 'Facilita una marcha más estable', 'Tiene múltiples opciones de pie protésico'],
      desventajas: ['Requiere ajuste preciso del socket', 'El volumen del muñón puede cambiar durante el día'],
      cuidados_especificos: ['Limpia socket y liner diariamente', 'Revisa piel y puntos de presión', 'Reporta cambios de ajuste']
    }
  ],
  transfemoral: [
    {
      id: 'protesis-transfemoral',
      categoria: 'transfemoral',
      grupo_dispositivo: 'protesis',
      nombre: 'Prótesis transfemorales',
      descripcion: 'Prótesis para amputación por encima de la rodilla. Integran una rodilla protésica y requieren entrenamiento específico para control y seguridad.',
      componentes: ['Socket transfemoral', 'Rodilla protésica', 'Adaptadores', 'Pie protésico', 'Sistema de suspensión'],
      nivel_k_minimo: 'K2',
      ventajas: ['Permite movilidad independiente', 'Puede adaptarse a distintos niveles funcionales', 'Hay opciones mecánicas y electrónicas'],
      desventajas: ['Mayor demanda energética', 'Curva de aprendizaje más amplia'],
      cuidados_especificos: ['Revisa alineación y estabilidad', 'Da mantenimiento a la rodilla según fabricante', 'Consulta ante ruidos o bloqueos']
    }
  ]
};

const CONTENIDO_EDUCATIVO_FALLBACK = {
  niveles_k: [
    {
      nivel: 'K0',
      nombre: 'No ambulatorio',
      descripcion: 'Sin capacidad o potencial actual para caminar de forma segura con una prótesis funcional.',
      caracteristicas: ['Uso principal de silla de ruedas', 'Enfoque en transferencias seguras'],
      actividades_permitidas: ['Transferencias asistidas', 'Terapia ocupacional adaptada'],
      tipo_protesis_recomendada: ['Prótesis cosmética opcional', 'Evaluación funcional periódica']
    },
    {
      nivel: 'K1',
      nombre: 'Ambulador de interiores',
      descripcion: 'Capacidad para caminar en superficies planas a ritmo fijo, principalmente en interiores.',
      caracteristicas: ['Marcha lenta y controlada', 'Uso posible de bastón o andadera'],
      actividades_permitidas: ['Caminar en casa', 'Actividades básicas de la vida diaria'],
      tipo_protesis_recomendada: ['Pie SACH', 'Socket de contacto total']
    },
    {
      nivel: 'K2',
      nombre: 'Ambulador comunitario limitado',
      descripcion: 'Puede superar barreras ambientales bajas como escalones, rampas o superficies irregulares simples.',
      caracteristicas: ['Caminatas cortas en comunidad', 'Velocidad variable limitada'],
      actividades_permitidas: ['Compras breves', 'Subir y bajar escaleras con apoyo'],
      tipo_protesis_recomendada: ['Pie multiaxial', 'Suspensión con pin o vacío']
    },
    {
      nivel: 'K3',
      nombre: 'Ambulador comunitario ilimitado',
      descripcion: 'Camina con cadencia variable y participa en actividades comunitarias, laborales o recreativas.',
      caracteristicas: ['Mayor tolerancia a distancias', 'Buena adaptación a terrenos variados'],
      actividades_permitidas: ['Caminatas largas', 'Ejercicio recreativo', 'Trabajo activo'],
      tipo_protesis_recomendada: ['Pie de respuesta dinámica', 'Componentes de mayor desempeño']
    },
    {
      nivel: 'K4',
      nombre: 'Alta actividad',
      descripcion: 'Demanda funcional superior a la marcha básica, como deporte, impacto o actividad física intensa.',
      caracteristicas: ['Alta energía', 'Actividades de impacto o velocidad'],
      actividades_permitidas: ['Correr', 'Deportes', 'Trabajo físicamente demandante'],
      tipo_protesis_recomendada: ['Pie deportivo', 'Componentes de alto rendimiento']
    }
  ],
  tipos_ortesis: TIPOS_ORTESIS_SIMULADOS,
  tipos_protesis: TIPOS_PROTESIS_SIMULADOS,
  guias_cuidado: {
    limpieza_protesis: [
      {
        id: 'guia-limpieza-dispositivo',
        titulo: 'Limpieza del dispositivo',
        contenido: 'La limpieza diaria ayuda a prevenir irritaciones y conserva el funcionamiento de órtesis y prótesis.',
        pasos: ['Retira el dispositivo si aplica', 'Limpia con paño húmedo y jabón neutro', 'Seca completamente antes de guardar o usar'],
        tips: ['Evita productos perfumados', 'Revisa desgaste mientras limpias'],
        advertencias: ['No uses calor directo', 'No sumerjas componentes no lavables']
      }
    ],
    mantenimiento: [
      {
        id: 'guia-revision',
        titulo: 'Revisión periódica',
        contenido: 'Una revisión breve permite detectar desgaste, cambios de ajuste o piezas flojas.',
        pasos: ['Observa correas, velcros y uniones', 'Verifica comodidad y estabilidad', 'Reporta cambios a tu especialista'],
        tips: ['Toma fotos si notas cambios', 'Lleva registro de molestias'],
        advertencias: ['No ajustes piezas técnicas sin indicación']
      }
    ]
  },
  faqs: [
    {
      id: 'faq-diferencia',
      pregunta: '¿Cuál es la diferencia entre órtesis y prótesis?',
      respuesta: 'Una órtesis apoya, corrige o protege una parte del cuerpo. Una prótesis reemplaza parcial o totalmente una parte ausente.'
    },
    {
      id: 'faq-ajuste',
      pregunta: '¿Qué hago si mi dispositivo molesta?',
      respuesta: 'Suspende el uso si hay dolor importante, revisa la piel y contacta a tu especialista para valorar ajustes.'
    }
  ]
};

const Ortesis = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('tipos');
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para datos
  const [contenidoEducativo, setContenidoEducativo] = useState(CONTENIDO_EDUCATIVO_FALLBACK);
  const [dispositivo, setDispositivo] = useState(null);
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

  const categoriasOrtesis = {
    'soportes_plantillas': { nombre: 'Soportes y plantillas', desc: 'Apoyo del pie y descarga', icon: 'footprints' },
    'soporte_tronco': { nombre: 'Soporte de tronco', desc: 'Estabilidad lumbar y postural', icon: 'accessibility' }
  };

  const categoriasDispositivos = {
    ...categoriasOrtesis,
    ...categoriasProtesis
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar contenido educativo
      const response = await api.get('/protesis/educativo');
      const data = response?.data || response;
      setContenidoEducativo({
        ...CONTENIDO_EDUCATIVO_FALLBACK,
        ...data,
        tipos_ortesis: data?.tipos_ortesis || CONTENIDO_EDUCATIVO_FALLBACK.tipos_ortesis,
        tipos_protesis: data?.tipos_protesis || CONTENIDO_EDUCATIVO_FALLBACK.tipos_protesis,
        guias_cuidado: data?.guias_cuidado || CONTENIDO_EDUCATIVO_FALLBACK.guias_cuidado,
        faqs: data?.faqs || CONTENIDO_EDUCATIVO_FALLBACK.faqs,
        niveles_k: data?.niveles_k || CONTENIDO_EDUCATIVO_FALLBACK.niveles_k
      });

      // Cargar dispositivo del paciente
      if (user?.paciente_id) {
        const dispResponse = await api.get(`/ortesis/dispositivo/${user.paciente_id}`);
        const dispData = dispResponse?.data || dispResponse;
        if (dispData) {
          setDispositivo(dispData);
        }

        // Cargar problemas
        const probResponse = await api.get(`/ortesis/problemas/${user.paciente_id}`);
        const probData = probResponse?.data || probResponse;
        setProblemas(Array.isArray(probData) ? probData : []);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setContenidoEducativo(CONTENIDO_EDUCATIVO_FALLBACK);
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
          <h2>Centro de Información de Órtesis y prótesis</h2>
          <p>Todo lo que necesitas saber sobre dispositivos ortopédicos, cuidados y rehabilitación</p>
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
          <h3>Tipos de órtesis y prótesis</h3>
          <p>Explora las opciones disponibles</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('cuidados')}>
          <span className="action-icon"><LucideIcon name="book-open" size={24} /></span>
          <h3>Guías de Cuidado</h3>
          <p>Aprende a cuidar tu dispositivo</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('mi-protesis')}>
          <span className="action-icon"><LucideIcon name="settings" size={24} /></span>
          <h3>Mi dispositivo</h3>
          <p>Información de tu órtesis o prótesis</p>
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
              {(
                Object.values(contenidoEducativo?.tipos_ortesis || {}).flat().length +
                Object.values(contenidoEducativo?.tipos_protesis || {}).flat().length
              ) || 0}
            </span>
            <span className="summary-label">Tipos de dispositivos</span>
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
        <p>La clasificación K determina tu potencial funcional y el tipo de dispositivo recomendado</p>
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
                <h3>Dispositivos recomendados</h3>
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
  // RENDERIZAR TIPOS DE ÓRTESIS Y PRÓTESIS
  // =====================================================
  const renderTiposProtesis = () => (
    <div className="tipos-section">
      <div className="section-header">
        <h2>Tipos de órtesis y prótesis</h2>
        <p>Conoce los dispositivos que apoyan, corrigen o reemplazan funciones corporales.</p>
      </div>

      {!activeSubTab ? (
        <div className="dispositivos-info-sections">
          <section className="dispositivo-info-section ortesis-info-section">
            <div className="device-section-heading">
              <span className="device-section-icon"><LucideIcon name="accessibility" size={22} /></span>
              <div>
                <h3>Información sobre Órtesis</h3>
                <p>Dispositivos que apoyan, corrigen, protegen o estabilizan una parte del cuerpo.</p>
              </div>
            </div>
            <h4>Tipos de Órtesis</h4>
            <div className="categorias-grid">
              {Object.entries(categoriasOrtesis).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  className="categoria-card"
                  onClick={() => setActiveSubTab(key)}
                >
                  <span className="categoria-icon"><LucideIcon name={cat.icon} size={24} /></span>
                  <h3>{cat.nombre}</h3>
                  <p>{cat.desc}</p>
                  <span className="tipos-count">
                    {contenidoEducativo?.tipos_ortesis?.[key]?.length || 0} tipos
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="dispositivo-info-section protesis-info-section">
            <div className="device-section-heading">
              <span className="device-section-icon"><LucideIcon name="accessibility" size={22} /></span>
              <div>
                <h3>Información sobre Prótesis</h3>
                <p>Dispositivos que reemplazan parcial o totalmente una extremidad o segmento corporal.</p>
              </div>
            </div>
            <h4>Tipos de Prótesis</h4>
            <div className="categorias-grid">
              {Object.entries(categoriasProtesis).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  className="categoria-card"
                  onClick={() => setActiveSubTab(key)}
                >
                  <span className="categoria-icon"><LucideIcon name={cat.icon} size={24} /></span>
                  <h3>{cat.nombre}</h3>
                  <p>{cat.desc}</p>
                  <span className="tipos-count">
                    {contenidoEducativo?.tipos_protesis?.[key]?.length || 0} tipos
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : selectedItem ? (
        <div className="tipo-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a {categoriasDispositivos[activeSubTab]?.nombre}
          </button>

          <div className="tipo-detail-card">
            <h2>{selectedItem.nombre}</h2>
            <span className="tipo-categoria">
              {selectedItem.grupo_dispositivo === 'ortesis' ? 'Órtesis' : 'Prótesis'} · {categoriasDispositivos[selectedItem.categoria]?.nombre}
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

          <h3><LucideIcon name={categoriasDispositivos[activeSubTab]?.icon} size={20} /> {categoriasDispositivos[activeSubTab]?.nombre}</h3>

          <div className="tipos-grid">
            {(contenidoEducativo?.tipos_ortesis?.[activeSubTab] || contenidoEducativo?.tipos_protesis?.[activeSubTab] || []).map((tipo) => (
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
        <p>Instrucciones detalladas para el cuidado de tu órtesis, prótesis o muñón</p>
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
  // RENDERIZAR MI DISPOSITIVO
  // =====================================================
  const renderMiProtesis = () => (
    <div className="mi-protesis-section">
      <div className="section-header">
        <h2>Mi dispositivo</h2>
        <p>Información sobre tu órtesis o prótesis actual</p>
      </div>

      {dispositivo?.tiene_dispositivo ? (
        <div className="dispositivo-info">
          <div className="dispositivo-card main">
            <div className="dispositivo-header">
              <h3>{dispositivo.tipo || 'Dispositivo'}</h3>
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
          <p>Tu especialista registrará la información de tu órtesis o prótesis cuando sea asignada.</p>
          <button className="btn btn-outline" onClick={() => setActiveTab('tipos')}>
            Explorar tipos de dispositivos
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
          <p className="text-muted">¡Excelente! Tu dispositivo está funcionando bien.</p>
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
        <p>Respuestas a las dudas más comunes sobre órtesis y prótesis</p>
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
        <div className="header-content">
          <h1><LucideIcon name="accessibility" size={24} /> {MODULO_NOMBRE}</h1>
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
          Mi dispositivo
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
