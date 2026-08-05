import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Chat.css';

const Chat = () => {
  const { conversacionId } = useParams();
  const { user } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [otroUsuario, setOtroUsuario] = useState(null);
  const [especialistas, setEspecialistas] = useState([]);
  const [showNuevaConversacion, setShowNuevaConversacion] = useState(false);
  const [contactosSearchEmail, setContactosSearchEmail] = useState('');
  const [loadingContactos, setLoadingContactos] = useState(false);
  const mensajesRef = useRef(null);
  const ultimoMensajeIdRef = useRef(0); // id del mensaje más reciente ya cargado (para el polling incremental)
  const pestanaVisibleRef = useRef(true); // pausa el polling cuando el usuario cambia de pestaña
  const puedeIniciarConversacion = user?.rol_id === 3 || user?.rol === 'paciente' || user?.rol_id === 2 || user?.rol === 'especialista';

  useEffect(() => {
    if (!user?.id) return;
    cargarConversaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!showNuevaConversacion || !puedeIniciarConversacion) return;

    const timeoutId = setTimeout(() => {
      cargarContactos(contactosSearchEmail);
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNuevaConversacion, contactosSearchEmail, puedeIniciarConversacion]);

  useEffect(() => {
    const conversacionActivaId = conversacionActiva?.id;
    const alCambiarVisibilidad = () => {
      pestanaVisibleRef.current = document.visibilityState === 'visible';
      // Al volver a la pestaña, trae de inmediato lo que se haya perdido
      if (pestanaVisibleRef.current && conversacionActivaId) {
        pollMensajesNuevos(conversacionActivaId);
      }
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionActiva?.id]);

  useEffect(() => {
    // OJO: depende solo del id, no del objeto conversacionActiva completo.
    // El refresco silencioso de la lista de conversaciones (cada 8s) crea un
    // objeto conversacionActiva nuevo (misma conversación, otra referencia);
    // si este efecto dependiera del objeto, reiniciaría el intervalo y
    // recargaría TODOS los mensajes cada 8s, causando parpadeo.
    const conversacionActivaId = conversacionActiva?.id;
    if (!conversacionActivaId) return;

    cargarMensajes(conversacionActivaId);
    // Polling corto: cada 3s pide solo los mensajes nuevos (no toda la
    // conversación), y se pausa si la pestaña no está visible.
    const interval = setInterval(() => {
      if (pestanaVisibleRef.current) {
        pollMensajesNuevos(conversacionActivaId);
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionActiva?.id]);

  useEffect(() => {
    if (!user?.id) return;
    // Refresca la lista de conversaciones (últimos mensajes, no leídos,
    // conversaciones nuevas) sin necesidad de recargar la página.
    const interval = setInterval(() => {
      if (pestanaVisibleRef.current) {
        cargarConversaciones(true);
      }
    }, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    // Scroll al último mensaje
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cargarConversaciones = async (silencioso = false) => {
    try {
      const userId = user?.id;
      const response = await api.get(`/mensajes/conversaciones/${userId}`);
      // response ya es response.data por el interceptor
      // Backend retorna: { success, data: { conversaciones: [...] } }
      const convs = response?.data?.conversaciones || response?.conversaciones || [];
      setConversaciones(convs);

      if (conversacionActiva) {
        const convActualizada = convs.find(c => c.id === conversacionActiva.id);
        if (convActualizada) {
          setConversacionActiva(prev => prev ? { ...prev, ...convActualizada } : convActualizada);
        }
      }

      if (silencioso) {
        // Refresco de fondo: solo actualiza la lista (últimos mensajes,
        // badges de no leídos). No toca cuál conversación está activa.
        return;
      }

      // Si hay un ID de conversación en la URL, seleccionar esa
      if (conversacionId && convs.length > 0) {
        const convFromUrl = convs.find(c => c.id === parseInt(conversacionId));
        if (convFromUrl) {
          setConversacionActiva(convFromUrl);
          return;
        }
      }

      // Si hay conversaciones, seleccionar la primera
      if (convs.length > 0 && !conversacionActiva) {
        setConversacionActiva(convs[0]);
      }
    } catch (err) {
      if (!silencioso) {
        console.error('Error al cargar conversaciones:', err);
        setConversaciones([]);
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const cargarContactos = async (email = '') => {
    setLoadingContactos(true);
    try {
      const query = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : '';
      const response = await api.get(`/mensajes/contactos/${user?.id}${query}`);
      const especialistasData = response?.data?.contactos || response?.contactos || [];
      setEspecialistas(Array.isArray(especialistasData) ? especialistasData : []);
    } catch (err) {
      try {
        const esPaciente = user?.rol_id === 3 || user?.rol === 'paciente';
        if (esPaciente && !user?.paciente_id) {
          setEspecialistas([]);
          return;
        }
        const fallback = esPaciente
          ? await api.get(`/pacientes/${user.paciente_id}/especialistas`)
          : await api.get('/especialistas');
        const fallbackData = fallback?.data || fallback || [];
        const contactos = Array.isArray(fallbackData) ? fallbackData : [];
        const emailNormalizado = email.trim().toLowerCase();
        setEspecialistas(emailNormalizado
          ? contactos.filter(contacto => (contacto.email || '').toLowerCase().includes(emailNormalizado))
          : contactos);
      } catch (fallbackErr) {
        console.error('Error al cargar contactos:', fallbackErr);
        setEspecialistas([]);
      }
    } finally {
      setLoadingContactos(false);
    }
  };

  const cargarMensajes = async (conversacionId, silencioso = false) => {
    try {
      const userId = user?.id;
      const response = await api.get(`/mensajes/conversacion/${conversacionId}/${userId}`);
      // response ya es response.data por el interceptor
      const data = response?.data || response;
      const mensajesCargados = data?.mensajes || [];
      setMensajes(mensajesCargados);
      setOtroUsuario(data?.otro_usuario || null);

      // Recuerda el id más alto para que el polling solo pida "lo nuevo"
      const maxId = mensajesCargados.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
      ultimoMensajeIdRef.current = maxId;
    } catch (err) {
      if (!silencioso) {
        console.error('Error al cargar mensajes:', err);
      }
    }
  };

  // Polling corto: solo trae mensajes con id mayor al último ya visto y
  // los agrega al final, sin re-renderizar/reemplazar toda la conversación.
  const pollMensajesNuevos = async (conversacionIdActivo) => {
    try {
      const userId = user?.id;
      const response = await api.get(
        `/mensajes/conversacion/${conversacionIdActivo}/${userId}/nuevos/${ultimoMensajeIdRef.current}`
      );
      const data = response?.data || response;
      const nuevos = data?.mensajes || [];
      if (nuevos.length === 0) return;

      setMensajes(prev => {
        const idsExistentes = new Set(prev.map(m => m.id));
        const soloNuevos = nuevos.filter(m => !idsExistentes.has(m.id));
        return soloNuevos.length > 0 ? [...prev, ...soloNuevos] : prev;
      });

      const maxId = nuevos.reduce((max, m) => Math.max(max, Number(m.id) || 0), ultimoMensajeIdRef.current);
      ultimoMensajeIdRef.current = maxId;
    } catch (err) {
      // Silencioso a propósito: es polling de fondo, no debe interrumpir al usuario.
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !conversacionActiva) return;

    setEnviando(true);
    try {
      const response = await api.post('/mensajes/enviar', {
        emisor_id: user.id,
        receptor_id: conversacionActiva.otro_usuario_id,
        mensaje: nuevoMensaje.trim()
      });

      const data = response?.data || response;
      const mensajeId = data?.id || Date.now();

      // Agregar mensaje localmente para respuesta inmediata
      setMensajes(prev => [...prev, {
        id: mensajeId,
        emisor_id: user.id,
        mensaje: nuevoMensaje.trim(),
        created_at: new Date().toISOString(),
        emisor_nombre: user?.nombre_completo || user?.nombre || 'Yo'
      }]);

      // Evita que el próximo poll vuelva a traer este mismo mensaje y lo duplique
      if (data?.id) {
        ultimoMensajeIdRef.current = Math.max(ultimoMensajeIdRef.current, Number(data.id));
      }

      setNuevoMensaje('');
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      // Agregar localmente de todas formas
      setMensajes(prev => [...prev, {
        id: Date.now(),
        emisor_id: user.id,
        mensaje: nuevoMensaje.trim(),
        created_at: new Date().toISOString(),
        emisor_nombre: user?.nombre_completo || user?.nombre || 'Yo'
      }]);
      setNuevoMensaje('');
    } finally {
      setEnviando(false);
    }
  };

  const iniciarConversacion = async (contactoId) => {
    try {
      const response = await api.post(`/mensajes/iniciar/${user.id}/${contactoId}`);
      const respData = response?.data || response;
      const { conversacion_id, otro_usuario } = respData;

      // Crear objeto de conversación
      const nuevaConv = {
        id: conversacion_id,
        tipo: respData.tipo,
        otro_usuario_id: contactoId,
        otro_usuario_nombre: otro_usuario?.nombre_completo,
        otro_usuario_rol: otro_usuario?.rol_id
      };

      // Agregar a la lista si no existe
      setConversaciones(prev => {
        const existe = prev.find(c => c.id === conversacion_id);
        if (!existe) {
          return [nuevaConv, ...prev];
        }
        return prev;
      });

      setConversacionActiva(nuevaConv);
      setShowNuevaConversacion(false);
      cargarMensajes(conversacion_id);
    } catch (err) {
      console.error('Error al iniciar conversación:', err);
    }
  };

  const calcularTiempoRestante = (fechaCreacion) => {
    const creacion = new Date(fechaCreacion);
    const expiracion = new Date(creacion.getTime() + 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const diferencia = expiracion - ahora;

    if (diferencia <= 0) return 'Expirado';

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas}h ${minutos}m restantes`;
    }
    return `${minutos} minutos restantes`;
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFecha = (fecha) => {
    const hoy = new Date();
    const fechaMensaje = new Date(fecha);

    if (fechaMensaje.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    }

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fechaMensaje.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }

    return fechaMensaje.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    });
  };

  const agruparMensajesPorFecha = (mensajes) => {
    const grupos = {};
    mensajes.forEach(mensaje => {
      const fecha = formatearFecha(mensaje.created_at);
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(mensaje);
    });
    return grupos;
  };

  const getRolNombre = (rolId) => {
    const roles = {
      1: 'Administrador',
      2: 'Especialista',
      3: 'Paciente'
    };
    return roles[rolId] || 'Usuario';
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Lista de conversaciones */}
        <div className={`conversaciones-sidebar ${!conversacionActiva ? 'active' : ''}`}>
          <div className="sidebar-header">
            <h2>Mensajes</h2>
            {puedeIniciarConversacion && (
              <button
                className="btn-nueva-conv"
                onClick={() => setShowNuevaConversacion(!showNuevaConversacion)}
                aria-label="Nueva conversacion"
              >
                +
              </button>
            )}
          </div>

          <div className="aviso-expiracion">
            <span className="aviso-icon"><LucideIcon name="alarm-clock" size={18} /></span>
            <span>Los mensajes expiran en 24 horas</span>
          </div>

          {showNuevaConversacion && (
            <div className="nueva-conversacion-panel">
              <h4>{user?.rol_id === 2 || user?.rol === 'especialista' ? 'Nueva conversación' : 'Contactar a mi equipo'}</h4>
              <div className="contact-search-group chat-contact-search">
                <label htmlFor="chat-contact-email-search">Buscar por correo electrónico</label>
                <input
                  id="chat-contact-email-search"
                  type="email"
                  value={contactosSearchEmail}
                  onChange={(e) => setContactosSearchEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="off"
                />
              </div>
              {loadingContactos ? (
                <div className="loading-small">
                  <div className="spinner-small"></div>
                </div>
              ) : especialistas.length > 0 ? (
                <div className="especialistas-lista">
                  {especialistas.map(esp => (
                    <button
                      key={esp.id}
                      className="especialista-item"
                      onClick={() => iniciarConversacion(esp.id)}
                    >
                      <span className="esp-avatar">{(esp.nombre_completo || esp.nombre)?.charAt(0) || '?'}</span>
                      <span className="esp-info">
                        <span className="esp-nombre">{esp.nombre_completo || esp.nombre || 'Usuario'}</span>
                        <span className="esp-area">{esp.email || ''}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="no-especialistas">No se encontraron contactos con ese correo</p>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading-small">
              <div className="spinner-small"></div>
            </div>
          ) : conversaciones.length > 0 ? (
            <div className="conversaciones-list">
              {conversaciones.map(conv => (
                <div
                  key={conv.id}
                  className={`conversacion-item ${conversacionActiva?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setConversacionActiva(conv)}
                >
                  <div className="conv-avatar">
                    <span>{conv.otro_usuario_nombre?.charAt(0) || '?'}</span>
                    {conv.no_leidos > 0 && (
                      <span className="badge-no-leidos">{conv.no_leidos}</span>
                    )}
                  </div>
                  <div className="conv-info">
                    <h4>{conv.otro_usuario_nombre || 'Usuario'}</h4>
                    <p className="conv-area">{getRolNombre(conv.otro_usuario_rol)}</p>
                    {conv.ultimo_mensaje && (
                      <p className="conv-ultimo">
                        {conv.ultimo_mensaje.length > 30
                          ? conv.ultimo_mensaje.substring(0, 30) + '...'
                          : conv.ultimo_mensaje}
                      </p>
                    )}
                  </div>
                  {conv.ultimo_mensaje_fecha && (
                    <span className="conv-tiempo">
                      {formatearHora(conv.ultimo_mensaje_fecha)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-conversaciones">
              <p>No tienes conversaciones activas</p>
              <p className="help-text">
                {(user?.rol_id === 3 || user?.rol === 'paciente')
                  ? 'Usa el botón + para contactar a tu especialista'
                  : 'Usa el botón + para contactar a otro especialista'}
              </p>
            </div>
          )}
        </div>

        {/* Área de chat */}
        <div className={`chat-area ${conversacionActiva ? 'active' : ''}`}>
          {conversacionActiva ? (
            <>
              <div className="chat-header">
                <button
                  className="btn-back-mobile"
                  onClick={() => setConversacionActiva(null)}
                  aria-label="Volver a conversaciones"
                >
                  &#8592;
                </button>
                <div className="chat-header-info">
                  <div className="header-avatar">
                    <span>
                      {(otroUsuario?.nombre_completo || conversacionActiva.otro_usuario_nombre)?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h3>{otroUsuario?.nombre_completo || conversacionActiva.otro_usuario_nombre}</h3>
                    <p className="header-area">
                      {getRolNombre(otroUsuario?.rol_id || conversacionActiva.otro_usuario_rol)}
                    </p>
                  </div>
                </div>
                <div className="header-actions">
                  {/* Acciones adicionales si se necesitan */}
                </div>
              </div>

              <div className="mensajes-container" ref={mensajesRef}>
                {Object.entries(agruparMensajesPorFecha(mensajes)).map(([fecha, msgs]) => (
                  <div key={fecha} className="mensajes-grupo">
                    <div className="fecha-separator">
                      <span>{fecha}</span>
                    </div>
                    {msgs.map(mensaje => (
                      <div
                        key={mensaje.id}
                        className={`mensaje ${mensaje.emisor_id === user.id ? 'enviado' : 'recibido'}`}
                      >
                        <div className="mensaje-contenido">
                          <p>{mensaje.mensaje || mensaje.contenido}</p>
                          <div className="mensaje-meta">
                            <span className="mensaje-hora">{formatearHora(mensaje.created_at)}</span>
                            {mensaje.emisor_id === user.id && (
                              <span className={`mensaje-status ${mensaje.leido ? 'leido' : ''}`}>
                                {mensaje.leido ? '\u2713\u2713' : '\u2713'}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="mensaje-expiracion">
                          {calcularTiempoRestante(mensaje.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {mensajes.length === 0 && (
                  <div className="empty-mensajes">
                    <p>No hay mensajes en esta conversación</p>
                    <p className="help-text">Envía el primer mensaje</p>
                  </div>
                )}
              </div>

              <form className="mensaje-form" onSubmit={enviarMensaje}>
                <div className="input-container">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={e => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={enviando}
                    maxLength={500}
                  />
                  <span className="char-count">{nuevoMensaje.length}/500</span>
                </div>
                <button
                  type="submit"
                  className="btn-enviar"
                  disabled={!nuevoMensaje.trim() || enviando}
                >
                  {enviando ? '...' : '\u27A4'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon"><LucideIcon name="message" size={32} /></div>
              <h3>Selecciona una conversación</h3>
              <p>Elige una conversación de la lista para ver los mensajes</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default Chat;
