import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useVoice, Speakable } from '../../components/VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../../components/accessibility/AccessibilityPanel';
import InstitutionalHeader from '../../components/layouts/InstitutionalHeader';
import InstitutionalFooter from '../../components/layouts/InstitutionalFooter';
import LucideIcon from '../../components/LucideIcon';
import AdmisionesTab from '../../components/admin/AdmisionesTab';
import api from '../../services/api';
import '../../components/layouts/institutional.css';
import './AdminDashboard.css';

/**
 * AdminDashboard - Panel de control para administradores
 * Gestión de usuarios, métricas, especialistas y FAQs
 * Diseño accesible para usuarios de 10 a 80 años
 */

// Áreas médicas según la base de datos.
// `id` es el slug (coincide con `areas_medicas.nombre`, que es lo que el backend
// devuelve en `especialistas.area_medica`); `db_id` es el PK numérico usado
// por el backend al crear/actualizar un usuario (columna `usuarios.area_medica_id`).
const AREAS_MEDICAS = [
  { id: 'fisioterapia',    db_id: 1, nombre: 'Fisioterapia',        icon: 'dumbbell',      color: '#E65100' },
  { id: 'nutricion',       db_id: 2, nombre: 'Nutrición',           icon: 'salad',         color: '#2E7D32' },
  { id: 'medicina',        db_id: 3, nombre: 'Medicina',            icon: 'heart',         color: '#C62828' },
  { id: 'neuropsicologia', db_id: 4, nombre: 'Neuropsicología',     icon: 'brain',         color: '#6A1B9A' },
  { id: 'ortesis',         db_id: 5, nombre: 'Ortesis y Prótesis',  icon: 'accessibility', color: '#1565C0' },
];

// Tabs del dashboard
const TABS = [
  { id: 'resumen', label: 'Resumen', icon: 'bar-chart' },
  { id: 'admisiones', label: 'Admisiones', icon: 'clipboard-list' },
  { id: 'usuarios', label: 'Usuarios', icon: 'users' },
  { id: 'especialistas', label: 'Especialistas', icon: 'stethoscope' },
  { id: 'comunidad', label: 'Comunidad', icon: 'pen-line' },
  { id: 'faqs', label: 'FAQs', icon: 'circle-help' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, speakModule, isSpeaking, stop } = useVoice();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('resumen');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(null); // 'user', 'especialista', 'faq'
  const [editingItem, setEditingItem] = useState(null);

  // Estados de datos
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activePatients: 0,
    specialists: 0,
    todayCitas: 0,
    newUsersThisMonth: 0,
    blogViews: 0,
    blogPosts: 0,
    communityEngagement: 0,
  });

  const [users, setUsers] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [especialistasPorArea, setEspecialistasPorArea] = useState({});
  const [blogs, setBlogs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  // Estado del modal de asignación de pacientes
  const [asignModal, setAsignModal] = useState(null); // especialista seleccionado o null
  const [asignacionesEsp, setAsignacionesEsp] = useState([]); // asignaciones actuales del especialista
  const [asignSeleccionados, setAsignSeleccionados] = useState(new Set()); // paciente_ids marcados
  const [asignGuardando, setAsignGuardando] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol_id: 3, // paciente por defecto
    area_medica_id: '',
    cedula_profesional: '',
    especialidad: '',
    pregunta: '',
    respuesta: '',
    categoria: '',
    activo: true,
  });

  useEffect(() => {
    loadDashboardData();

    if (settings.voiceNavigation) {
      const nombre = user?.nombre?.split(' ')[0] || 'Administrador';
      speak(`Bienvenido ${nombre}. Panel de administración de Azaria.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, especialistasRes, blogsRes, faqsRes, metricsRes, pacientesRes] = await Promise.all([
        api.get('/admin/usuarios').catch(() => ({ data: null })),
        api.get('/admin/especialistas').catch(() => ({ data: null })),
        api.get('/admin/blogs/metricas').catch(() => ({ data: null })),
        api.get('/admin/faqs').catch(() => ({ data: null })),
        api.get('/admin/metricas').catch(() => ({ data: null })),
        api.get('/admin/pacientes').catch(() => ({ data: null })),
      ]);

      // Pacientes (para asignación a especialistas)
      setPacientes(pacientesRes.data?.pacientes || []);

      // Usuarios
      setUsers(usersRes.data?.usuarios || generateMockUsers());

      // Especialistas
      const especialistasData = especialistasRes.data?.especialistas || generateMockEspecialistas();
      setEspecialistas(especialistasData);

      // Agrupar especialistas por área
      const porArea = {};
      AREAS_MEDICAS.forEach(area => {
        porArea[area.id] = especialistasData.filter(e => e.area_medica === area.id).length;
      });
      setEspecialistasPorArea(porArea);

      // Blogs
      setBlogs(blogsRes.data?.blogs || generateMockBlogs());

      // FAQs
      setFaqs(faqsRes.data?.faqs || generateMockFaqs());

      // Métricas
      setMetrics({
        totalUsers: metricsRes.data?.total_usuarios || 1250,
        activePatients: metricsRes.data?.pacientes_activos || 890,
        specialists: especialistasData.length || 45,
        todayCitas: metricsRes.data?.citas_hoy || 78,
        newUsersThisMonth: metricsRes.data?.nuevos_mes || 156,
        blogViews: metricsRes.data?.visitas_blog || 12500,
        blogPosts: metricsRes.data?.total_posts || 48,
        communityEngagement: metricsRes.data?.engagement || 85,
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones de datos mock
  const generateMockUsers = () => [
    { id: 1, nombre: 'María García', email: 'maria@azaria.app', rol: 'paciente', activo: true, fecha_registro: '2024-01-15' },
    { id: 2, nombre: 'Juan Pérez', email: 'juan@azaria.app', rol: 'paciente', activo: true, fecha_registro: '2024-01-20' },
    { id: 3, nombre: 'Ana López', email: 'ana@azaria.app', rol: 'paciente', activo: false, fecha_registro: '2024-02-01' },
    { id: 4, nombre: 'Carlos Ruiz', email: 'carlos@azaria.app', rol: 'paciente', activo: true, fecha_registro: '2024-02-10' },
    { id: 5, nombre: 'Laura Martínez', email: 'laura@azaria.app', rol: 'paciente', activo: true, fecha_registro: '2024-02-15' },
  ];

  const generateMockEspecialistas = () => [
    { id: 1, nombre: 'Dr. Roberto González', email: 'roberto@azaria.app', area_medica: 'fisioterapia', cedula: 'FIS-12345', pacientes: 28, activo: true },
    { id: 2, nombre: 'Dra. Carmen Silva', email: 'carmen@azaria.app', area_medica: 'nutricion', cedula: 'NUT-54321', pacientes: 35, activo: true },
    { id: 3, nombre: 'Dr. Miguel Ángel Torres', email: 'miguel@azaria.app', area_medica: 'medicina', cedula: 'MED-98765', pacientes: 42, activo: true },
    { id: 4, nombre: 'Dra. Patricia Vega', email: 'patricia@azaria.app', area_medica: 'neuropsicologia', cedula: 'NEU-11111', pacientes: 20, activo: true },
    { id: 5, nombre: 'Dr. Fernando Díaz', email: 'fernando@azaria.app', area_medica: 'ortesis', cedula: 'ORT-22222', pacientes: 15, activo: true },
  ];

  const generateMockBlogs = () => [
    { id: 1, titulo: 'Guía de ejercicios post-operatorios', autor: 'Dr. González', vistas: 3500, likes: 245, fecha: '2024-01-10' },
    { id: 2, titulo: 'Nutrición para recuperación', autor: 'Dra. Silva', vistas: 2800, likes: 189, fecha: '2024-01-15' },
    { id: 3, titulo: 'Manejo del dolor crónico', autor: 'Dr. Torres', vistas: 4200, likes: 312, fecha: '2024-01-20' },
    { id: 4, titulo: 'Ejercicios de memoria', autor: 'Dra. Vega', vistas: 1900, likes: 156, fecha: '2024-02-01' },
  ];

  const generateMockFaqs = () => [
    { id: 1, pregunta: '¿Cómo agendo una cita?', respuesta: 'Ve a la sección de Citas y selecciona el especialista...', categoria: 'Citas', activo: true },
    { id: 2, pregunta: '¿Cómo registro mis medicamentos?', respuesta: 'En la sección de Medicina puedes agregar...', categoria: 'Medicina', activo: true },
    { id: 3, pregunta: '¿Puedo cambiar mi especialista?', respuesta: 'Sí, contacta al administrador o...', categoria: 'General', activo: true },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Mapeo de roles
  const ROLES = {
    administrador: 1,
    especialista: 2,
    paciente: 3
  };

  const getRolIdFromName = (rolName) => {
    return ROLES[rolName] || 3;
  };

  const getRolNameFromId = (rolId) => {
    const id = parseInt(rolId);
    return Object.keys(ROLES).find(key => ROLES[key] === id) || 'paciente';
  };

  // Handlers CRUD
  const handleOpenModal = (type, item = null) => {
    setShowModal(type);
    setEditingItem(item);
    if (item) {
      // Convertir rol string a rol_id si es necesario
      const rol_id = item.rol_id || getRolIdFromName(item.rol);
      setFormData({
        ...formData,
        ...item,
        nombre_completo: item.nombre_completo || item.nombre || '',
        rol_id: rol_id,
        area_medica_id: item.area_medica_id || item.area_medica || '',
        cedula_profesional: item.cedula_profesional || item.cedula || '',
      });
    } else {
      setFormData({
        nombre_completo: '',
        email: '',
        password: '',
        rol_id: type === 'especialista' ? 2 : 3,
        area_medica_id: '',
        cedula_profesional: '',
        especialidad: '',
        pregunta: '',
        respuesta: '',
        categoria: '',
        activo: true,
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setEditingItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // === Asignación de pacientes a especialista ===
  const handleOpenAsignaciones = async (esp) => {
    setAsignModal(esp);
    setAsignGuardando(false);
    try {
      const res = await api.get(`/admin/especialistas/${esp.id}/asignaciones`);
      const actuales = res?.data?.asignaciones || [];
      setAsignacionesEsp(actuales);
      setAsignSeleccionados(new Set(actuales.map(a => a.paciente_id)));
    } catch (err) {
      console.error('Error cargando asignaciones:', err);
      setAsignacionesEsp([]);
      setAsignSeleccionados(new Set());
    }
  };

  const handleCloseAsignaciones = () => {
    setAsignModal(null);
    setAsignacionesEsp([]);
    setAsignSeleccionados(new Set());
  };

  const togglePacienteAsignado = (pacienteId) => {
    setAsignSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(pacienteId)) next.delete(pacienteId); else next.add(pacienteId);
      return next;
    });
  };

  const handleGuardarAsignaciones = async () => {
    if (!asignModal) return;
    setAsignGuardando(true);

    const original = new Set(asignacionesEsp.map(a => a.paciente_id));
    const final = asignSeleccionados;

    // Pacientes a AGREGAR: están en final pero no en original
    const aAgregar = [...final].filter(id => !original.has(id));
    // Pacientes a QUITAR: están en original pero no en final
    const aQuitar = asignacionesEsp.filter(a => !final.has(a.paciente_id));

    try {
      // Ejecutar secuencial para orden de errores legible
      for (const pacienteId of aAgregar) {
        await api.post('/admin/asignaciones', {
          paciente_id: pacienteId,
          especialista_id: asignModal.id,
        });
      }
      for (const asig of aQuitar) {
        await api.delete(`/admin/asignaciones/${asig.id}`);
      }

      // Actualizar contador del especialista en la UI
      setEspecialistas(prev => prev.map(e =>
        e.id === asignModal.id ? { ...e, pacientes: final.size } : e
      ));

      handleCloseAsignaciones();
    } catch (err) {
      console.error('Error guardando asignaciones:', err);
      alert(err?.message || 'Error al guardar las asignaciones. Verifica la consola.');
      setAsignGuardando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const rol_id = parseInt(formData.rol_id);
      const rolName = getRolNameFromId(rol_id);

      if (showModal === 'user' || showModal === 'especialista') {
        // El backend espera `area_medica_id` como INT (FK a areas_medicas.id),
        // pero el select del formulario guarda el slug ('fisioterapia', etc).
        // Convertimos slug → db_id (numérico) antes de enviar, o null si está vacío.
        const areaSlug = formData.area_medica_id;
        const areaDbId = areaSlug
          ? (AREAS_MEDICAS.find(a => a.id === areaSlug)?.db_id ?? null)
          : null;

        const userData = {
          ...formData,
          rol_id: rol_id,
          rol: rolName,
          nombre: formData.nombre_completo, // Para compatibilidad con la tabla
          area_medica_id: areaDbId,
        };

        if (editingItem) {
          await api.put(`/admin/usuarios/${editingItem.id}`, userData).catch(() => {});
          setUsers(prev => prev.map(u => u.id === editingItem.id ? { ...u, ...userData } : u));

          // Si es especialista, actualizar también en la lista de especialistas
          if (rol_id === 2) {
            const espData = {
              ...userData,
              area_medica: formData.area_medica_id,
              cedula: formData.cedula_profesional,
            };
            const existingEsp = especialistas.find(e => e.id === editingItem.id);
            if (existingEsp) {
              setEspecialistas(prev => prev.map(e => e.id === editingItem.id ? { ...e, ...espData } : e));
            } else {
              setEspecialistas(prev => [...prev, { ...espData, id: editingItem.id, pacientes: 0 }]);
            }
          }
        } else {
          const newUser = {
            id: Date.now(),
            ...userData,
            fecha_registro: new Date().toISOString().split('T')[0]
          };
          const response = await api.post('/admin/usuarios', userData).catch((err) => {
            console.error('Error creando usuario:', err);
            return null;
          });

          if (response) {
            setUsers(prev => [...prev, newUser]);

            // Si es especialista, agregar también a la lista de especialistas
            if (rol_id === 2) {
              const newEsp = {
                ...newUser,
                area_medica: formData.area_medica_id,
                cedula: formData.cedula_profesional,
                pacientes: 0
              };
              setEspecialistas(prev => [...prev, newEsp]);
            }
          }
        }
      } else if (showModal === 'faq') {
        if (editingItem) {
          await api.put(`/admin/faqs/${editingItem.id}`, formData).catch(() => {});
          setFaqs(prev => prev.map(f => f.id === editingItem.id ? { ...f, ...formData } : f));
        } else {
          const newFaq = { id: Date.now(), ...formData };
          await api.post('/admin/faqs', formData).catch(() => {});
          setFaqs(prev => [...prev, newFaq]);
        }
      }
      handleCloseModal();
      speak(editingItem ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
    } catch (error) {
      console.error('Error guardando:', error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      if (type === 'user') {
        await api.delete(`/admin/usuarios/${id}`).catch(() => {});
        setUsers(prev => prev.filter(u => u.id !== id));
      } else if (type === 'especialista') {
        await api.delete(`/admin/especialistas/${id}`).catch(() => {});
        setEspecialistas(prev => prev.filter(e => e.id !== id));
      } else if (type === 'faq') {
        await api.delete(`/admin/faqs/${id}`).catch(() => {});
        setFaqs(prev => prev.filter(f => f.id !== id));
      }
      speak('Registro eliminado');
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const handleToggleActive = async (type, id) => {
    // Optimistic UI: actualiza local y si falla el API, revierte.
    const flip = (coll) => coll.map(x => x.id === id ? { ...x, activo: !x.activo } : x);
    const revert = (setter, originalLookup) => setter(prev => prev.map(x =>
      x.id === id ? { ...x, activo: originalLookup(x.id) } : x
    ));

    try {
      if (type === 'user' || type === 'especialista') {
        const setter = type === 'user' ? setUsers : setEspecialistas;
        const source = type === 'user' ? users : especialistas;
        const originalValue = source.find(x => x.id === id)?.activo;
        setter(prev => flip(prev));

        try {
          await api.put(`/admin/usuarios/${id}/toggle`);
        } catch (err) {
          // Rollback
          setter(prev => prev.map(x => x.id === id ? { ...x, activo: originalValue } : x));
          throw err;
        }
      } else if (type === 'faq') {
        const originalValue = faqs.find(f => f.id === id)?.activo;
        const newValue = !originalValue;
        setFaqs(prev => flip(prev));

        try {
          await api.put(`/admin/faqs/${id}`, { activo: newValue ? 1 : 0 });
        } catch (err) {
          setFaqs(prev => prev.map(f => f.id === id ? { ...f, activo: originalValue } : f));
          throw err;
        }
      }
    } catch (err) {
      console.error('Error cambiando estado activo:', err);
      alert(err?.message || 'No se pudo cambiar el estado. Revisa la consola.');
    }
  };

  // Renderizar contenido según tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return renderResumen();
      case 'admisiones':
        return <AdmisionesTab />;
      case 'usuarios':
        return renderUsuarios();
      case 'especialistas':
        return renderEspecialistas();
      case 'comunidad':
        return renderComunidad();
      case 'faqs':
        return renderFaqs();
      default:
        return renderResumen();
    }
  };

  // Tab: Resumen
  const renderResumen = () => (
    <div className="tab-content resumen-content">
      {/* Métricas principales */}
      <section className="metrics-section" aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="section-title">Métricas del Sistema</h2>
        <div className="metrics-grid">
          <div className="metric-card users" role="article">
            <div className="metric-icon" aria-hidden="true"><LucideIcon name="users" size={24} /></div>
            <div className="metric-content">
              <span className="metric-value">{metrics.totalUsers.toLocaleString()}</span>
              <span className="metric-label">Usuarios totales</span>
            </div>
            <div className="metric-trend positive">+{metrics.newUsersThisMonth} este mes</div>
          </div>

          <div className="metric-card patients" role="article">
            <div className="metric-icon" aria-hidden="true"><LucideIcon name="hospital" size={24} /></div>
            <div className="metric-content">
              <span className="metric-value">{metrics.activePatients.toLocaleString()}</span>
              <span className="metric-label">Usuarios activos</span>
            </div>
          </div>

          <div className="metric-card specialists" role="article">
            <div className="metric-icon" aria-hidden="true"><LucideIcon name="stethoscope" size={24} /></div>
            <div className="metric-content">
              <span className="metric-value">{metrics.specialists}</span>
              <span className="metric-label">Especialistas</span>
            </div>
          </div>

          <div className="metric-card appointments" role="article">
            <div className="metric-icon" aria-hidden="true"><LucideIcon name="calendar" size={24} /></div>
            <div className="metric-content">
              <span className="metric-value">{metrics.todayCitas}</span>
              <span className="metric-label">Citas hoy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Especialistas por área */}
      <section className="areas-section" aria-labelledby="areas-heading">
        <h2 id="areas-heading" className="section-title">Especialistas por Área</h2>
        <div className="areas-grid">
          {AREAS_MEDICAS.map(area => (
            <div key={area.id} className="area-card" style={{ '--area-color': area.color }}>
              <span className="area-icon" aria-hidden="true"><LucideIcon name={area.icon} size={20} /></span>
              <div className="area-info">
                <span className="area-name">{area.nombre}</span>
                <span className="area-count">{especialistasPorArea[area.id] || 0} especialistas</span>
              </div>
              <div className="area-bar">
                <div
                  className="area-bar-fill"
                  style={{ width: `${((especialistasPorArea[area.id] || 0) / Math.max(...Object.values(especialistasPorArea), 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Métricas de comunidad */}
      <section className="community-metrics" aria-labelledby="community-heading">
        <h2 id="community-heading" className="section-title">Métricas de Comunidad</h2>
        <div className="community-grid">
          <div className="community-card">
            <span className="community-icon" aria-hidden="true"><LucideIcon name="pen-line" size={20} /></span>
            <span className="community-value">{metrics.blogPosts}</span>
            <span className="community-label">Posts publicados</span>
          </div>
          <div className="community-card">
            <span className="community-icon" aria-hidden="true"><LucideIcon name="eye" size={20} /></span>
            <span className="community-value">{metrics.blogViews.toLocaleString()}</span>
            <span className="community-label">Visitas totales</span>
          </div>
          <div className="community-card">
            <span className="community-icon" aria-hidden="true"><LucideIcon name="message" size={20} /></span>
            <span className="community-value">{metrics.communityEngagement}%</span>
            <span className="community-label">Engagement</span>
          </div>
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="quick-actions-section" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="section-title">Acciones Rápidas</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => handleOpenModal('user')}>
            <span className="action-icon" aria-hidden="true"><LucideIcon name="plus" size={20} /></span>
            <span className="action-label">Nuevo Usuario</span>
          </button>
          <button className="quick-action-card" onClick={() => handleOpenModal('especialista')}>
            <span className="action-icon" aria-hidden="true"><LucideIcon name="stethoscope" size={20} /></span>
            <span className="action-label">Nuevo Especialista</span>
          </button>
          <button className="quick-action-card" onClick={() => handleOpenModal('faq')}>
            <span className="action-icon" aria-hidden="true"><LucideIcon name="circle-help" size={20} /></span>
            <span className="action-label">Nueva FAQ</span>
          </button>
          <button className="quick-action-card" onClick={() => setActiveTab('usuarios')}>
            <span className="action-icon" aria-hidden="true"><LucideIcon name="clipboard" size={20} /></span>
            <span className="action-label">Gestionar Usuarios</span>
          </button>
        </div>
      </section>
    </div>
  );

  // Tab: Usuarios
  const renderUsuarios = () => (
    <div className="tab-content usuarios-content">
      <div className="section-header">
        <h2 className="section-title">Gestión de Usuarios</h2>
        <button className="btn-primary" onClick={() => handleOpenModal('user')}>
          <span aria-hidden="true"><LucideIcon name="plus" size={16} /></span> Nuevo Usuario
        </button>
      </div>

      <div className="table-container">
        <table className="data-table" aria-label="Lista de usuarios">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Email</th>
              <th scope="col">Rol</th>
              <th scope="col">Estado</th>
              <th scope="col">Registro</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(usuario => {
              const rolDisplay = usuario.rol || getRolNameFromId(usuario.rol_id);
              return (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`badge badge-${rolDisplay}`}>
                    {rolDisplay === 'administrador' && <><LucideIcon name="settings" size={14} />{' '}</>}
                    {rolDisplay === 'especialista' && <><LucideIcon name="stethoscope" size={14} />{' '}</>}
                    {rolDisplay === 'paciente' && <><LucideIcon name="user" size={14} />{' '}</>}
                    {rolDisplay.charAt(0).toUpperCase() + rolDisplay.slice(1)}
                  </span>
                </td>
                <td>
                  <button
                    className={`status-toggle ${usuario.activo ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActive('user', usuario.id)}
                    aria-label={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {usuario.activo ? <><LucideIcon name="circle-check" size={16} /> Activo</> : <><LucideIcon name="circle-x" size={16} /> Inactivo</>}
                  </button>
                </td>
                <td>{usuario.fecha_registro}</td>
                <td className="actions-cell">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleOpenModal('user', usuario)}
                    aria-label={`Editar ${usuario.nombre}`}
                  >
                    <LucideIcon name="pencil" size={16} />
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete('user', usuario.id)}
                    aria-label={`Eliminar ${usuario.nombre}`}
                  >
                    <LucideIcon name="trash" size={16} />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab: Especialistas
  const renderEspecialistas = () => (
    <div className="tab-content especialistas-content">
      <div className="section-header">
        <h2 className="section-title">Gestión de Especialistas</h2>
        <button className="btn-primary" onClick={() => handleOpenModal('especialista')}>
          <span aria-hidden="true"><LucideIcon name="plus" size={16} /></span> Nuevo Especialista
        </button>
      </div>

      {/* Filtro por área */}
      <div className="filter-bar">
        <span className="filter-label">Filtrar por área:</span>
        <div className="filter-chips">
          <button className="filter-chip active">Todos</button>
          {AREAS_MEDICAS.map(area => (
            <button key={area.id} className="filter-chip" style={{ '--chip-color': area.color }}>
              <LucideIcon name={area.icon} size={16} /> {area.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="specialists-grid">
        {especialistas.map(esp => {
          const area = AREAS_MEDICAS.find(a => a.id === esp.area_medica);
          return (
            <div key={esp.id} className="specialist-card" style={{ '--area-color': area?.color }}>
              <div className="specialist-avatar">
                <span>{esp.nombre.charAt(0)}</span>
              </div>
              <div className="specialist-info">
                <h3 className="specialist-name">{esp.nombre}</h3>
                <p className="specialist-area"><LucideIcon name={area?.icon} size={16} /> {area?.nombre}</p>
                <p className="specialist-cedula">Cédula: {esp.cedula}</p>
                <p className="specialist-patients"><LucideIcon name="users" size={16} /> {esp.pacientes} usuarios</p>
              </div>
              <div className="specialist-status">
                <span className={`status-badge ${esp.activo ? 'active' : 'inactive'}`}>
                  {esp.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="specialist-actions">
                <button
                  className="btn-icon btn-assign"
                  onClick={() => handleOpenAsignaciones(esp)}
                  aria-label={`Asignar pacientes a ${esp.nombre}`}
                  title="Asignar pacientes"
                >
                  <LucideIcon name="user-plus" size={16} />
                </button>
                <button
                  className="btn-icon btn-edit"
                  onClick={() => handleOpenModal('especialista', esp)}
                  aria-label={`Editar ${esp.nombre}`}
                >
                  <LucideIcon name="pencil" size={16} />
                </button>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => handleDelete('especialista', esp.id)}
                  aria-label={`Eliminar ${esp.nombre}`}
                >
                  <LucideIcon name="trash" size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Tab: Comunidad (Blogs)
  const renderComunidad = () => (
    <div className="tab-content comunidad-content">
      <div className="section-header">
        <h2 className="section-title">Métricas de Comunidad y Blogs</h2>
      </div>

      {/* Métricas de engagement */}
      <div className="blog-metrics">
        <div className="blog-metric-card">
          <div className="blog-metric-icon" aria-hidden="true"><LucideIcon name="trending-up" size={20} /></div>
          <div className="blog-metric-info">
            <span className="blog-metric-value">{metrics.blogViews.toLocaleString()}</span>
            <span className="blog-metric-label">Visitas totales</span>
          </div>
        </div>
        <div className="blog-metric-card">
          <div className="blog-metric-icon" aria-hidden="true"><LucideIcon name="pen-line" size={20} /></div>
          <div className="blog-metric-info">
            <span className="blog-metric-value">{metrics.blogPosts}</span>
            <span className="blog-metric-label">Posts publicados</span>
          </div>
        </div>
        <div className="blog-metric-card">
          <div className="blog-metric-icon" aria-hidden="true"><LucideIcon name="message" size={20} /></div>
          <div className="blog-metric-info">
            <span className="blog-metric-value">{metrics.communityEngagement}%</span>
            <span className="blog-metric-label">Tasa de engagement</span>
          </div>
        </div>
      </div>

      {/* Lista de blogs populares */}
      <section className="popular-blogs">
        <h3 className="subsection-title">Posts Más Populares</h3>
        <div className="blogs-list">
          {blogs.map(blog => (
            <div key={blog.id} className="blog-card">
              <div className="blog-info">
                <h4 className="blog-title">{blog.titulo}</h4>
                <p className="blog-author">Por: {blog.autor}</p>
                <p className="blog-date">{blog.fecha}</p>
              </div>
              <div className="blog-stats">
                <span className="blog-stat"><LucideIcon name="eye" size={16} /> {blog.vistas.toLocaleString()}</span>
                <span className="blog-stat"><LucideIcon name="heart" size={16} /> {blog.likes}</span>
              </div>
              <div className="blog-actions">
                <button className="btn-small">Ver</button>
                <button className="btn-small btn-secondary">Editar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // Tab: FAQs
  const renderFaqs = () => (
    <div className="tab-content faqs-content">
      <div className="section-header">
        <h2 className="section-title">Gestión de Preguntas Frecuentes</h2>
        <button className="btn-primary" onClick={() => handleOpenModal('faq')}>
          <span aria-hidden="true"><LucideIcon name="plus" size={16} /></span> Nueva FAQ
        </button>
      </div>

      <div className="faqs-list">
        {faqs.map(faq => (
          <div key={faq.id} className="faq-card">
            <div className="faq-header">
              <span className={`faq-category badge-${faq.categoria?.toLowerCase()}`}>
                {faq.categoria}
              </span>
              <div className="faq-actions">
                <button
                  className={`status-toggle ${faq.activo ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleActive('faq', faq.id)}
                >
                  {faq.activo ? <LucideIcon name="circle-check" size={16} /> : <LucideIcon name="circle-x" size={16} />}
                </button>
                <button
                  className="btn-icon btn-edit"
                  onClick={() => handleOpenModal('faq', faq)}
                >
                  <LucideIcon name="pencil" size={16} />
                </button>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => handleDelete('faq', faq.id)}
                >
                  <LucideIcon name="trash" size={16} />
                </button>
              </div>
            </div>
            <h3 className="faq-question">{faq.pregunta}</h3>
            <p className="faq-answer">{faq.respuesta}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Modal de formulario
  const renderModal = () => {
    if (!showModal) return null;

    const titles = {
      user: editingItem ? 'Editar Usuario' : 'Nuevo Usuario',
      especialista: editingItem ? 'Editar Especialista' : 'Nuevo Especialista',
      faq: editingItem ? 'Editar FAQ' : 'Nueva FAQ',
    };

    return (
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>{titles[showModal]}</h2>
            <button className="modal-close" onClick={handleCloseModal} aria-label="Cerrar">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {(showModal === 'user' || showModal === 'especialista') && (
              <>
                <div className="form-group">
                  <label htmlFor="nombre_completo">Nombre completo</label>
                  <input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Correo electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                {!editingItem && (
                  <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                )}

                {/* Selector de rol */}
                <div className="form-group">
                  <label htmlFor="rol_id">Rol del usuario</label>
                  <select
                    id="rol_id"
                    name="rol_id"
                    value={formData.rol_id}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value={3}>Usuario</option>
                    <option value={2}>Especialista</option>
                    <option value={1}>Administrador</option>
                  </select>
                </div>

                {/* Campos adicionales para especialista */}
                {(formData.rol_id === 2 || formData.rol_id === '2' || showModal === 'especialista') && (
                  <>
                    <div className="form-group">
                      <label htmlFor="area_medica_id">Área médica</label>
                      <select
                        id="area_medica_id"
                        name="area_medica_id"
                        value={formData.area_medica_id}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      >
                        <option value="">Seleccionar área</option>
                        {AREAS_MEDICAS.map(area => (
                          <option key={area.id} value={area.id}>{area.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cedula_profesional">Cédula profesional</label>
                      <input
                        type="text"
                        id="cedula_profesional"
                        name="cedula_profesional"
                        value={formData.cedula_profesional}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                        placeholder="Ej: FIS-12345"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="especialidad">Especialidad</label>
                      <input
                        type="text"
                        id="especialidad"
                        name="especialidad"
                        value={formData.especialidad}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Ej: Rehabilitación física"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {showModal === 'faq' && (
              <>
                <div className="form-group">
                  <label htmlFor="categoria">Categoría</label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="General">General</option>
                    <option value="Citas">Citas</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Nutrición">Nutrición</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Técnico">Técnico</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pregunta">Pregunta</label>
                  <input
                    type="text"
                    id="pregunta"
                    name="pregunta"
                    value={formData.pregunta}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="respuesta">Respuesta</label>
                  <textarea
                    id="respuesta"
                    name="respuesta"
                    value={formData.respuesta}
                    onChange={handleInputChange}
                    required
                    className="form-textarea"
                    rows="4"
                  />
                </div>
              </>
            )}

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                />
                <span>Activo</span>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editingItem ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal de asignación de pacientes a un especialista
  const renderAsignacionesModal = () => {
    if (!asignModal) return null;
    const espArea = AREAS_MEDICAS.find(a => a.id === asignModal.area_medica);
    const areaDbId = espArea?.db_id;

    // Para cada paciente, saber si tiene otro especialista asignado en esta misma área
    const idsAsignadosAqui = new Set(asignacionesEsp.map(a => a.paciente_id));

    return (
      <div className="modal-overlay" onClick={handleCloseAsignaciones}>
        <div className="modal-content modal-wide" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>Asignar pacientes a {asignModal.nombre}</h2>
            <button className="modal-close" onClick={handleCloseAsignaciones} aria-label="Cerrar">✕</button>
          </div>

          <div className="modal-body">
            <p className="asign-subtitle">
              Área: <strong style={{ color: espArea?.color }}>
                <LucideIcon name={espArea?.icon} size={16} /> {espArea?.nombre}
              </strong>
              {'  '}— Marca los pacientes que quieres asignar.
            </p>
            <p className="asign-help">
              Si un paciente ya tiene otro especialista en esta área, al marcarlo se <strong>transferirá</strong> al paciente a {asignModal.nombre}.
            </p>

            {pacientes.length === 0 ? (
              <p className="asign-empty">No hay pacientes registrados todavía.</p>
            ) : (
              <ul className="asign-pacientes-list">
                {pacientes.map(p => {
                  const marcado = asignSeleccionados.has(p.paciente_id);
                  const yaAsignado = idsAsignadosAqui.has(p.paciente_id);
                  return (
                    <li key={p.paciente_id} className={`asign-paciente-row ${marcado ? 'selected' : ''}`}>
                      <label className="asign-paciente-label">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => togglePacienteAsignado(p.paciente_id)}
                          disabled={asignGuardando}
                        />
                        <div className="asign-paciente-info">
                          <span className="asign-paciente-nombre">{p.nombre}</span>
                          <span className="asign-paciente-email">{p.email}</span>
                          <span className="asign-paciente-meta">
                            {p.fase_actual ? `Fase: ${p.fase_actual}` : 'Sin fase'}
                            {' · '}
                            {p.especialistas_asignados} especialista(s) en total
                          </span>
                        </div>
                        {yaAsignado && (
                          <span className="asign-badge current">Asignado</span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCloseAsignaciones} disabled={asignGuardando}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={handleGuardarAsignaciones} disabled={asignGuardando || !areaDbId}>
              {asignGuardando ? 'Guardando...' : `Guardar (${asignSeleccionados.size})`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard loading" role="status" aria-live="polite" data-age-mode={settings.ageMode}>
        <div className="loading-content">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" data-age-mode={settings.ageMode}>
      {/* Header institucional DGTIC */}
      <InstitutionalHeader />

      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Barra de acciones */}
      <div className="dashboard-actions-bar">
        <div className="header-right">
          <button
            className={`header-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => isSpeaking ? stop() : speakModule('admin-dashboard')}
            aria-label={isSpeaking ? 'Detener audio' : 'Escuchar ayuda'}
          >
            <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
          </button>

          <button
            className="header-btn accessibility-btn"
            onClick={togglePanel}
            aria-label="Configuración de accesibilidad"
          >
            ♿
          </button>

          <div className="user-menu">
            <div className="user-avatar admin-avatar">
              {user?.nombre?.charAt(0) || 'A'}
            </div>
            <button
              className="header-btn logout-btn"
              onClick={async () => {
                if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                  await logout();
                  navigate('/login');
                }
              }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <span className="logout-icon" aria-hidden="true"><LucideIcon name="logout" size={18} /></span>
              <span className="logout-text">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <Speakable text={`${getGreeting()}, ${user?.nombre || 'Administrador'}. Panel de administración de Azaria.`}>
        <section className="welcome-section">
          <div className="welcome-text">
            <h1>{getGreeting()},</h1>
            <p className="user-name">{user?.nombre || 'Administrador'}</p>
            <p className="welcome-subtitle">Panel de Administración</p>
          </div>
          <div className="welcome-illustration" aria-hidden="true"><LucideIcon name="user-round" size={48} /></div>
        </section>
      </Speakable>

      {/* Tabs Navigation */}
      <nav className="tabs-nav" aria-label="Secciones del panel">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              if (settings.autoSpeak) speak(tab.label);
            }}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <span className="tab-icon" aria-hidden="true"><LucideIcon name={tab.icon} size={18} /></span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main id="main-content" className="dashboard-content" tabIndex="-1">
        {renderTabContent()}
      </main>

      {/* Modal */}
      {renderModal()}

      {/* Modal de asignación de pacientes */}
      {renderAsignacionesModal()}

      {/* Footer institucional DGTIC */}
      <InstitutionalFooter />

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default AdminDashboard;
