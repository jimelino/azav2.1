import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './NotificationBell.css';

// Adónde navegar según el tipo de referencia de la notificación.
const RUTAS_POR_REFERENCIA = {
  neuro_fase: () => '/neuropsicologia',
  mensaje: (id) => `/chat/${id}`,
};

const NOTIFICACIONES_REFRESH_EVENT = 'azaria:notificaciones-actualizadas';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const pestanaVisibleRef = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/notificaciones');
      const data = res?.data || res;
      setNotificaciones(Array.isArray(data?.notificaciones) ? data.notificaciones : []);
      setNoLeidas(data?.no_leidas || 0);
    } catch (err) {
      // silencioso: es polling de fondo
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    cargar();

    const alCambiarVisibilidad = () => {
      pestanaVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    const interval = setInterval(() => {
      if (pestanaVisibleRef.current) cargar();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      clearInterval(interval);
    };
  }, [user, cargar]);

  useEffect(() => {
    if (!user) return undefined;
    window.addEventListener(NOTIFICACIONES_REFRESH_EVENT, cargar);
    return () => window.removeEventListener(NOTIFICACIONES_REFRESH_EVENT, cargar);
  }, [user, cargar]);

  useEffect(() => {
    if (!showPanel) return;
    const cerrarSiFuera = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', cerrarSiFuera);
    return () => document.removeEventListener('mousedown', cerrarSiFuera);
  }, [showPanel]);

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const diferencia = new Date() - new Date(fecha);
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const handleClickNotificacion = async (notif) => {
    if (!notif.leida) {
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
      try {
        await api.put(`/notificaciones/${notif.id}/leida`);
      } catch (err) {
        // no revertimos: no es crítico si falla marcar como leída
      }
    }

    setShowPanel(false);
    const irA = RUTAS_POR_REFERENCIA[notif.referencia_tipo];
    if (irA) navigate(irA(notif.referencia_id));
  };

  const handleMarcarTodas = async () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
    try {
      await api.put('/notificaciones/leer-todas');
    } catch (err) {
      // silencioso
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setShowPanel(prev => !prev)}
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
        aria-expanded={showPanel}
      >
        <LucideIcon name="bell" size={20} />
        {noLeidas > 0 && <span className="notification-bell-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>

      {showPanel && (
        <div className="notification-bell-panel" role="dialog" aria-label="Notificaciones">
          <div className="notification-bell-panel-header">
            <h3>Notificaciones</h3>
            {noLeidas > 0 && (
              <button className="notification-bell-marcar-todas" onClick={handleMarcarTodas}>
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="notification-bell-list">
            {notificaciones.length > 0 ? notificaciones.map(notif => (
              <button
                key={notif.id}
                className={`notification-bell-item ${notif.leida ? '' : 'no-leida'}`}
                onClick={() => handleClickNotificacion(notif)}
              >
                <span className="notification-bell-item-titulo">{notif.titulo}</span>
                <span className="notification-bell-item-mensaje">{notif.mensaje}</span>
                <span className="notification-bell-item-fecha">{formatFecha(notif.created_at)}</span>
              </button>
            )) : (
              <p className="notification-bell-empty">No tienes notificaciones</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
