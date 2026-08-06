import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Recordatorios.css';

const Recordatorios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const [recordatorios, setRecordatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [notificacionesPermitidas, setNotificacionesPermitidas] = useState(false);
  const [notificacionesMostradas, setNotificacionesMostradas] = useState(new Set());
  const checkIntervalRef = useRef(null);

  const [nuevoRecordatorio, setNuevoRecordatorio] = useState({
    tipo: 'medicamento',
    titulo: '',
    descripcion: '',
    hora: '',
    dias_semana: [],
    activo: true
  });

  const tiposRecordatorio = [
    { id: 'medicamento', nombre: 'Medicamento', icon: 'pill', color: '#2E7D32' },
    { id: 'ejercicio', nombre: 'Ejercicio', icon: 'dumbbell', color: '#1976D2' },
    { id: 'cita', nombre: 'Cita médica', icon: 'calendar', color: '#6A1B9A' },
    { id: 'medicion', nombre: 'Medición', icon: 'bar-chart', color: '#E65100' },
    { id: 'hidratacion', nombre: 'Hidratación', icon: 'droplet', color: '#1565C0' },
    { id: 'protesis', nombre: 'Cuidado prótesis', icon: 'accessibility', color: '#795548' },
    { id: 'otro', nombre: 'Otro', icon: 'bell', color: '#455A64' }
  ];

  const diasSemana = [
    { id: 0, nombre: 'Dom', nombreCorto: 'D' },
    { id: 1, nombre: 'Lun', nombreCorto: 'L' },
    { id: 2, nombre: 'Mar', nombreCorto: 'M' },
    { id: 3, nombre: 'Mié', nombreCorto: 'X' },
    { id: 4, nombre: 'Jue', nombreCorto: 'J' },
    { id: 5, nombre: 'Vie', nombreCorto: 'V' },
    { id: 6, nombre: 'Sáb', nombreCorto: 'S' }
  ];

  // Solicitar permiso de notificaciones
  const solicitarPermisoNotificaciones = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificacionesPermitidas(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setNotificacionesPermitidas(permission === 'granted');
      return permission === 'granted';
    }

    return false;
  }, []);

  // Mostrar notificación
  const mostrarNotificacion = useCallback((recordatorio, tipo) => {
    if (!notificacionesPermitidas) return;

    const notificationKey = `${recordatorio.id}-${new Date().toDateString()}-${recordatorio.hora}`;

    if (notificacionesMostradas.has(notificationKey)) return;

    const notification = new Notification(`${recordatorio.titulo}`, {
      body: recordatorio.descripcion || `Es hora de: ${recordatorio.titulo}`,
      icon: tipo.icon === 'pill' ? '/pill-icon.png' : '/notification-icon.png',
      tag: notificationKey,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });

    // Reproducir sonido de alerta
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.log('No se pudo reproducir sonido');
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setNotificacionesMostradas(prev => new Set([...prev, notificationKey]));
  }, [notificacionesPermitidas, notificacionesMostradas]);

  // Verificar recordatorios activos
  const verificarRecordatorios = useCallback(() => {
    const ahora = new Date();
    const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM
    const diaActual = ahora.getDay();

    recordatorios.forEach(recordatorio => {
      if (!recordatorio.activo) return;

      const diasRecordatorio = recordatorio.dias_semana?.split(',').map(Number) || [];
      if (!diasRecordatorio.includes(diaActual)) return;

      // Comparar hora (con tolerancia de 1 minuto)
      const [horaRec, minRec] = recordatorio.hora.split(':').map(Number);
      const [horaAct, minAct] = horaActual.split(':').map(Number);

      if (horaRec === horaAct && Math.abs(minRec - minAct) <= 1) {
        const tipo = tiposRecordatorio.find(t => t.id === recordatorio.tipo) || tiposRecordatorio[6];
        mostrarNotificacion(recordatorio, tipo);
      }
    });
  }, [recordatorios, mostrarNotificacion]);

  // Solicitar permiso al cargar
  useEffect(() => {
    solicitarPermisoNotificaciones();
  }, [solicitarPermisoNotificaciones]);

  // Configurar verificación periódica de recordatorios
  useEffect(() => {
    if (recordatorios.length > 0) {
      // Verificar cada 30 segundos
      checkIntervalRef.current = setInterval(verificarRecordatorios, 30000);
      // Verificar inmediatamente
      verificarRecordatorios();
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [recordatorios, verificarRecordatorios]);

  // Limpiar notificaciones mostradas a medianoche
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setNotificacionesMostradas(new Set());
      }
    }, 60000);

    return () => clearInterval(checkMidnight);
  }, []);

  useEffect(() => {
    cargarRecordatorios();
  }, [filtroTipo]);

  const cargarRecordatorios = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/recordatorios/${user.paciente_id || user.id}`);
      let data = response.data || [];

      if (filtroTipo !== 'todos') {
        data = data.filter(r => r.tipo === filtroTipo);
      }

      setRecordatorios(data);
    } catch (err) {
      console.error('Error al cargar recordatorios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearRecordatorio = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recordatorios', {
        paciente_id: user.paciente_id || user.id,
        ...nuevoRecordatorio,
        dias_semana: nuevoRecordatorio.dias_semana.join(',')
      });

      setShowModal(false);
      setNuevoRecordatorio({
        tipo: 'medicamento',
        titulo: '',
        descripcion: '',
        hora: '',
        dias_semana: [],
        activo: true
      });
      cargarRecordatorios();
    } catch (err) {
      console.error('Error al crear recordatorio:', err);
    }
  };

  const toggleRecordatorioActivo = async (recordatorioId, activo) => {
    // Actualización optimista con rollback: si el PUT falla, revierte el
    // switch a su estado anterior en vez de quedar desincronizado en silencio.
    setRecordatorios(prev =>
      prev.map(r => r.id === recordatorioId ? { ...r, activo: !activo } : r)
    );
    try {
      await api.put(`/recordatorios/${recordatorioId}`, { activo: !activo });
    } catch (err) {
      console.error('Error al actualizar recordatorio:', err);
      setRecordatorios(prev =>
        prev.map(r => r.id === recordatorioId ? { ...r, activo } : r)
      );
    }
  };

  const eliminarRecordatorio = async (recordatorioId) => {
    if (!window.confirm('¿Eliminar este recordatorio?')) return;

    const anterior = recordatorios;
    setRecordatorios(prev => prev.filter(r => r.id !== recordatorioId));
    try {
      await api.delete(`/recordatorios/${recordatorioId}`);
    } catch (err) {
      console.error('Error al eliminar recordatorio:', err);
      setRecordatorios(anterior);
    }
  };

  const toggleDiaSemana = (diaId) => {
    setNuevoRecordatorio(prev => {
      const dias = [...prev.dias_semana];
      const index = dias.indexOf(diaId);
      if (index > -1) {
        dias.splice(index, 1);
      } else {
        dias.push(diaId);
      }
      return { ...prev, dias_semana: dias };
    });
  };

  const seleccionarTodosDias = () => {
    setNuevoRecordatorio(prev => ({
      ...prev,
      dias_semana: [0, 1, 2, 3, 4, 5, 6]
    }));
  };

  const getTipoInfo = (tipoId) => {
    return tiposRecordatorio.find(t => t.id === tipoId) || tiposRecordatorio[6];
  };

  const formatearDias = (diasStr) => {
    if (!diasStr) return 'Sin días';
    const dias = diasStr.split(',').map(Number);
    if (dias.length === 7) return 'Todos los días';
    if (dias.length === 5 && !dias.includes(0) && !dias.includes(6)) return 'Lunes a Viernes';
    return dias.map(d => diasSemana.find(ds => ds.id === d)?.nombreCorto).join(', ');
  };

  // Probar notificación
  const probarNotificacion = () => {
    if (!notificacionesPermitidas) {
      alert('Primero debes activar las notificaciones');
      return;
    }

    new Notification('Prueba de notificacion', {
      body: 'Las notificaciones están funcionando correctamente',
      icon: '/notification-icon.png',
      tag: 'test-notification'
    });
  };

  // Obtener la ruta de retorno según el rol
  const getBackRoute = () => {
    const rol = user?.rol || user?.role;
    switch (rol) {
      case 'especialista': return '/especialista';
      case 'administrador': return '/admin';
      default: return '/paciente';
    }
  };

  return (
    <div className="recordatorios-page" data-age-mode={settings.ageMode}>
      <header className="recordatorios-header">
        <button
          className="btn-back"
          onClick={() => navigate(getBackRoute())}
          aria-label="Volver al inicio"
        >
          <span aria-hidden="true">←</span> Volver
        </button>
        <div className="header-content">
          <h1>Recordatorios</h1>
          <p className="subtitle">Mantén tu rutina de tratamiento</p>
        </div>
      </header>

      {/* Estado de notificaciones */}
      <div className={`notificacion-status ${notificacionesPermitidas ? 'activas' : 'inactivas'}`}>
        {notificacionesPermitidas ? (
          <>
            <span className="status-icon"><LucideIcon name="bell" size={18} /></span>
            <span>Notificaciones activas - Recibirás alertas a la hora programada</span>
            <button
              className="btn btn-sm btn-probar"
              onClick={probarNotificacion}
            >
              Probar
            </button>
          </>
        ) : (
          <>
            <span className="status-icon"><LucideIcon name="bell-off" size={18} /></span>
            <span>Notificaciones desactivadas</span>
            <button
              className="btn btn-sm btn-activar"
              onClick={solicitarPermisoNotificaciones}
            >
              Activar notificaciones
            </button>
          </>
        )}
      </div>

      <button
        className="btn btn-primary btn-float"
        onClick={() => setShowModal(true)}
      >
        + Nuevo Recordatorio
      </button>

      {/* Filtros */}
      <div className="filtros-container">
        <button
          className={`filtro-btn ${filtroTipo === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('todos')}
        >
          Todos
        </button>
        {tiposRecordatorio.slice(0, 5).map(tipo => (
          <button
            key={tipo.id}
            className={`filtro-btn ${filtroTipo === tipo.id ? 'active' : ''}`}
            onClick={() => setFiltroTipo(tipo.id)}
            style={{ '--filtro-color': tipo.color }}
          >
            <LucideIcon name={tipo.icon} size={16} /> {tipo.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando recordatorios...</p>
        </div>
      ) : (
        <div className="recordatorios-list">
          {recordatorios.length > 0 ? recordatorios.map(recordatorio => {
            const tipo = getTipoInfo(recordatorio.tipo);
            return (
              <div
                key={recordatorio.id}
                className={`recordatorio-card ${!recordatorio.activo ? 'inactivo' : ''}`}
                style={{ '--tipo-color': tipo.color }}
              >
                <div className="recordatorio-icon"><LucideIcon name={tipo.icon} size={20} /></div>

                <div className="recordatorio-info">
                  <h3>{recordatorio.titulo}</h3>
                  <p className="recordatorio-desc">{recordatorio.descripcion}</p>
                  <div className="recordatorio-meta">
                    <span className="recordatorio-hora"><LucideIcon name="alarm-clock" size={14} /> {recordatorio.hora}</span>
                    <span className="recordatorio-dias">{formatearDias(recordatorio.dias_semana)}</span>
                  </div>
                </div>

                <div className="recordatorio-acciones">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={recordatorio.activo}
                      onChange={() => toggleRecordatorioActivo(recordatorio.id, recordatorio.activo)}
                    />
                    <span className="slider"></span>
                  </label>
                  <button
                    className="btn-delete"
                    onClick={() => eliminarRecordatorio(recordatorio.id)}
                    title="Eliminar"
                  >
                    <LucideIcon name="trash" size={16} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="empty-state">
              <div className="empty-icon"><LucideIcon name="bell" size={32} /></div>
              <p>No tienes recordatorios configurados</p>
              <p className="help-text">Crea recordatorios para no olvidar tu tratamiento</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                Crear primer recordatorio
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h2>Nuevo Recordatorio</h2>
            <form onSubmit={handleCrearRecordatorio}>
              <div className="form-group">
                <label>Tipo de recordatorio</label>
                <div className="tipos-grid">
                  {tiposRecordatorio.map(tipo => (
                    <button
                      key={tipo.id}
                      type="button"
                      className={`tipo-btn ${nuevoRecordatorio.tipo === tipo.id ? 'selected' : ''}`}
                      onClick={() => setNuevoRecordatorio({...nuevoRecordatorio, tipo: tipo.id})}
                      style={{ '--tipo-color': tipo.color }}
                    >
                      <span className="tipo-icon"><LucideIcon name={tipo.icon} size={20} /></span>
                      <span className="tipo-nombre">{tipo.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={nuevoRecordatorio.titulo}
                  onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, titulo: e.target.value})}
                  className="form-control"
                  placeholder="Ej: Tomar metformina"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <input
                  type="text"
                  value={nuevoRecordatorio.descripcion}
                  onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, descripcion: e.target.value})}
                  className="form-control"
                  placeholder="Ej: 500mg con el desayuno"
                />
              </div>

              <div className="form-group">
                <label>Hora</label>
                <input
                  type="time"
                  value={nuevoRecordatorio.hora}
                  onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, hora: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Días de la semana
                  <button type="button" className="btn-link" onClick={seleccionarTodosDias}>
                    Seleccionar todos
                  </button>
                </label>
                <div className="dias-selector">
                  {diasSemana.map(dia => (
                    <button
                      key={dia.id}
                      type="button"
                      className={`dia-btn ${nuevoRecordatorio.dias_semana.includes(dia.id) ? 'selected' : ''}`}
                      onClick={() => toggleDiaSemana(dia.id)}
                    >
                      {dia.nombreCorto}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!nuevoRecordatorio.titulo || !nuevoRecordatorio.hora || nuevoRecordatorio.dias_semana.length === 0}
                >
                  Crear Recordatorio
                </button>
              </div>
            </form>
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

export default Recordatorios;
