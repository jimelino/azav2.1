import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Configuracion.css';

const Configuracion = () => {
  const { logout } = useAuth();
  const { settings: accSettings, updateSetting: updateAccSetting } = useAccessibility();
  const [activeSection, setActiveSection] = useState('notificaciones');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Tema sincronizado con AccessibilityContext
  const tema = accSettings.theme;
  const setTema = (value) => updateAccSetting('theme', value);
  const [tamanoTexto, setTamanoTexto] = useState(() => localStorage.getItem('vitalia-font-size') || 'normal');
  const [vozActiva, setVozActiva] = useState(() => localStorage.getItem('vitalia-voice') !== 'false');

  // Configuración de notificaciones (BD)
  const [notificaciones, setNotificaciones] = useState({
    recordatorios_medicamentos: true,
    recordatorios_ejercicios: true,
    recordatorios_citas: true,
    mensajes_chat: true,
    actualizaciones_blog: false,
    comunidad: false,
    sonido: true,
    vibracion: true
  });

  // Configuración de privacidad (BD)
  const [privacidad, setPrivacidad] = useState({
    perfil_visible_comunidad: true,
    mostrar_nombre_real: true,
    permitir_mensajes_pacientes: false
  });

  // Dispositivos de confianza
  const [dispositivos, setDispositivos] = useState([]);

  // Seguridad - cambiar password
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmar: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Seguridad - cambiar PIN
  const [pinForm, setPinForm] = useState({ pin_nuevo: '', pin_confirmar: '' });
  const [savingPin, setSavingPin] = useState(false);

  // Cargar configuracion al montar
  useEffect(() => {
    cargarConfigDesdeDB();
  }, []);

  // Cargar dispositivos cuando se selecciona esa seccion
  useEffect(() => {
    if (activeSection === 'dispositivos') {
      cargarDispositivos();
    }
  }, [activeSection]);

  const cargarConfigDesdeDB = async () => {
    try {
      const response = await api.get('/configuracion');
      if (response?.data) {
        if (response.data.notificaciones) {
          setNotificaciones(response.data.notificaciones);
        }
        if (response.data.privacidad) {
          setPrivacidad(response.data.privacidad);
        }
      }
    } catch (err) {
      console.error('Error cargando configuracion:', err);
    }
  };

  const cargarDispositivos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/devices');
      setDispositivos(response.data || []);
    } catch (err) {
      console.error('Error al cargar dispositivos:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const guardarNotificaciones = async () => {
    try {
      await api.put('/configuracion/notificaciones', notificaciones);
      showMsg('success', 'Preferencias de notificaciones guardadas');
    } catch (err) {
      showMsg('error', 'Error al guardar preferencias');
    }
  };

  const guardarPrivacidad = async () => {
    try {
      await api.put('/configuracion/privacidad', privacidad);
      showMsg('success', 'Preferencias de privacidad guardadas');
    } catch (err) {
      showMsg('error', 'Error al guardar preferencias');
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.password_nueva !== passwordForm.password_confirmar) {
      showMsg('error', 'Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.password_nueva.length < 6) {
      showMsg('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/cambiar-password', {
        password_actual: passwordForm.password_actual,
        password_nueva: passwordForm.password_nueva
      });
      showMsg('success', 'Contraseña actualizada correctamente');
      setPasswordForm({ password_actual: '', password_nueva: '', password_confirmar: '' });
    } catch (err) {
      showMsg('error', err?.message || 'Error al cambiar contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCambiarPIN = async (e) => {
    e.preventDefault();
    if (pinForm.pin_nuevo !== pinForm.pin_confirmar) {
      showMsg('error', 'Los PIN no coinciden');
      return;
    }
    if (!/^\d{4,6}$/.test(pinForm.pin_nuevo)) {
      showMsg('error', 'El PIN debe ser de 4 a 6 digitos');
      return;
    }
    setSavingPin(true);
    try {
      await api.put('/auth/cambiar-pin', { pin_nuevo: pinForm.pin_nuevo });
      showMsg('success', 'PIN actualizado correctamente');
      setPinForm({ pin_nuevo: '', pin_confirmar: '' });
    } catch (err) {
      showMsg('error', err?.message || 'Error al cambiar PIN');
    } finally {
      setSavingPin(false);
    }
  };

  const cerrarSesionDispositivo = async (dispositivoId) => {
    if (!window.confirm('¿Cerrar sesion en este dispositivo?')) return;
    try {
      await api.delete(`/auth/devices/${dispositivoId}`);
      setDispositivos(prev => prev.filter(d => d.id !== dispositivoId));
      showMsg('success', 'Sesion cerrada en el dispositivo');
    } catch (err) {
      showMsg('error', 'Error al cerrar sesion');
    }
  };

  const cerrarTodasLasSesiones = async () => {
    if (!window.confirm('¿Cerrar sesion en todos los dispositivos excepto este?')) return;
    try {
      await api.post('/auth/logout-all');
      await cargarDispositivos();
      showMsg('success', 'Sesiones cerradas en todos los dispositivos');
    } catch (err) {
      showMsg('error', 'Error al cerrar sesiones');
    }
  };

  const formatearFechaDispositivo = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getIconoDispositivo = (nombre) => {
    const lower = (nombre || '').toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return 'smartphone';
    if (lower.includes('tablet') || lower.includes('ipad')) return 'smartphone';
    return 'laptop';
  };

  return (
    <div className="configuracion-page">
      <header className="page-header">
        <h1>Configuracion</h1>
        <p>Personaliza tu experiencia en Azaria</p>
      </header>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="config-container">
        {/* Menu lateral */}
        <nav className="config-nav">
          <button
            className={`nav-item ${activeSection === 'notificaciones' ? 'active' : ''}`}
            onClick={() => setActiveSection('notificaciones')}
          >
            <LucideIcon name="bell" size={18} /> Notificaciones
          </button>
          <button
            className={`nav-item ${activeSection === 'privacidad' ? 'active' : ''}`}
            onClick={() => setActiveSection('privacidad')}
          >
            <LucideIcon name="lock" size={18} /> Privacidad
          </button>
          <button
            className={`nav-item ${activeSection === 'dispositivos' ? 'active' : ''}`}
            onClick={() => setActiveSection('dispositivos')}
          >
            <LucideIcon name="smartphone" size={18} /> Dispositivos
          </button>
          <button
            className={`nav-item ${activeSection === 'seguridad' ? 'active' : ''}`}
            onClick={() => setActiveSection('seguridad')}
          >
            <LucideIcon name="shield" size={18} /> Seguridad
          </button>
          <button
            className={`nav-item ${activeSection === 'accesibilidad' ? 'active' : ''}`}
            onClick={() => setActiveSection('accesibilidad')}
          >
            ♿ Accesibilidad
          </button>
          <button
            className={`nav-item ${activeSection === 'acerca' ? 'active' : ''}`}
            onClick={() => setActiveSection('acerca')}
          >
            <LucideIcon name="info" size={18} /> Acerca de
          </button>
        </nav>

        {/* Contenido */}
        <div className="config-content">

          {/* NOTIFICACIONES */}
          {activeSection === 'notificaciones' && (
            <div className="config-section">
              <h2>Notificaciones</h2>
              <p className="section-desc">Controla que notificaciones deseas recibir</p>

              <div className="config-group">
                <h3>Recordatorios</h3>
                <label className="config-toggle">
                  <span>Medicamentos</span>
                  <input type="checkbox" checked={notificaciones.recordatorios_medicamentos}
                    onChange={e => setNotificaciones({...notificaciones, recordatorios_medicamentos: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Ejercicios</span>
                  <input type="checkbox" checked={notificaciones.recordatorios_ejercicios}
                    onChange={e => setNotificaciones({...notificaciones, recordatorios_ejercicios: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Citas medicas</span>
                  <input type="checkbox" checked={notificaciones.recordatorios_citas}
                    onChange={e => setNotificaciones({...notificaciones, recordatorios_citas: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="config-group">
                <h3>Comunicacion</h3>
                <label className="config-toggle">
                  <span>Mensajes del chat</span>
                  <input type="checkbox" checked={notificaciones.mensajes_chat}
                    onChange={e => setNotificaciones({...notificaciones, mensajes_chat: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Actualizaciones del blog</span>
                  <input type="checkbox" checked={notificaciones.actualizaciones_blog}
                    onChange={e => setNotificaciones({...notificaciones, actualizaciones_blog: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Actividad en comunidad</span>
                  <input type="checkbox" checked={notificaciones.comunidad}
                    onChange={e => setNotificaciones({...notificaciones, comunidad: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="config-group">
                <h3>Preferencias</h3>
                <label className="config-toggle">
                  <span>Sonido</span>
                  <input type="checkbox" checked={notificaciones.sonido}
                    onChange={e => setNotificaciones({...notificaciones, sonido: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Vibracion</span>
                  <input type="checkbox" checked={notificaciones.vibracion}
                    onChange={e => setNotificaciones({...notificaciones, vibracion: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <button className="btn btn-primary" onClick={guardarNotificaciones}>
                Guardar cambios
              </button>
            </div>
          )}

          {/* PRIVACIDAD */}
          {activeSection === 'privacidad' && (
            <div className="config-section">
              <h2>Privacidad</h2>
              <p className="section-desc">Controla quien puede ver tu informacion</p>

              <div className="config-group">
                <h3>Comunidad</h3>
                <label className="config-toggle">
                  <span>Perfil visible en comunidad</span>
                  <input type="checkbox" checked={privacidad.perfil_visible_comunidad}
                    onChange={e => setPrivacidad({...privacidad, perfil_visible_comunidad: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Mostrar nombre real</span>
                  <input type="checkbox" checked={privacidad.mostrar_nombre_real}
                    onChange={e => setPrivacidad({...privacidad, mostrar_nombre_real: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
                <label className="config-toggle">
                  <span>Permitir mensajes de otros usuarios</span>
                  <input type="checkbox" checked={privacidad.permitir_mensajes_pacientes}
                    onChange={e => setPrivacidad({...privacidad, permitir_mensajes_pacientes: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <button className="btn btn-primary" onClick={guardarPrivacidad}>
                Guardar cambios
              </button>
            </div>
          )}

          {/* DISPOSITIVOS */}
          {activeSection === 'dispositivos' && (
            <div className="config-section">
              <h2>Dispositivos de Confianza</h2>
              <p className="section-desc">Administra los dispositivos donde has iniciado sesion</p>

              {loading ? (
                <div className="loading-small"><div className="spinner-small"></div></div>
              ) : (
                <>
                  <div className="dispositivos-list">
                    {dispositivos.length > 0 ? dispositivos.map(dispositivo => (
                      <div key={dispositivo.id} className="dispositivo-item">
                        <span className="dispositivo-icon"><LucideIcon name={getIconoDispositivo(dispositivo.dispositivo)} size={20} /></span>
                        <div className="dispositivo-info">
                          <span className="dispositivo-nombre">
                            {dispositivo.dispositivo || 'Navegador Web'}
                          </span>
                          <span className="dispositivo-detalles">
                            IP: {dispositivo.ip_address}
                          </span>
                          <span className="dispositivo-fecha">
                            Ultimo acceso: {formatearFechaDispositivo(dispositivo.ultimo_acceso)}
                          </span>
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => cerrarSesionDispositivo(dispositivo.id)}
                        >
                          Cerrar
                        </button>
                      </div>
                    )) : (
                      <p className="no-dispositivos">No hay dispositivos conectados</p>
                    )}
                  </div>

                  {dispositivos.length > 1 && (
                    <button className="btn btn-danger" onClick={cerrarTodasLasSesiones}>
                      Cerrar sesion en todos los dispositivos
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* SEGURIDAD */}
          {activeSection === 'seguridad' && (
            <div className="config-section">
              <h2>Seguridad</h2>
              <p className="section-desc">Administra la seguridad de tu cuenta</p>

              {/* Cambiar Contraseña */}
              <div className="config-group">
                <h3><LucideIcon name="key" size={18} /> Cambiar Contrasena</h3>
                <form onSubmit={handleCambiarPassword} className="security-form">
                  <div className="form-group">
                    <label>Contraseña actual</label>
                    <input
                      type="password"
                      value={passwordForm.password_actual}
                      onChange={e => setPasswordForm({...passwordForm, password_actual: e.target.value})}
                      placeholder="Tu contraseña actual"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordForm.password_nueva}
                      onChange={e => setPasswordForm({...passwordForm, password_nueva: e.target.value})}
                      placeholder="Minimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordForm.password_confirmar}
                      onChange={e => setPasswordForm({...passwordForm, password_confirmar: e.target.value})}
                      placeholder="Repite la nueva contraseña"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                    {savingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                  </button>
                </form>
              </div>

              {/* Cambiar PIN */}
              <div className="config-group">
                <h3><LucideIcon name="hash" size={20} /> Cambiar PIN</h3>
                <form onSubmit={handleCambiarPIN} className="security-form">
                  <div className="form-group">
                    <label>Nuevo PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinForm.pin_nuevo}
                      onChange={e => setPinForm({...pinForm, pin_nuevo: e.target.value.replace(/\D/g, '')})}
                      placeholder="4 a 6 digitos"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinForm.pin_confirmar}
                      onChange={e => setPinForm({...pinForm, pin_confirmar: e.target.value.replace(/\D/g, '')})}
                      placeholder="Repite el PIN"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={savingPin}>
                    {savingPin ? 'Guardando...' : 'Cambiar PIN'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ACCESIBILIDAD */}
          {activeSection === 'accesibilidad' && (
            <div className="config-section">
              <h2>Accesibilidad</h2>
              <p className="section-desc">Opciones para mejorar tu experiencia visual y auditiva</p>

              <div className="config-group">
                <h3><LucideIcon name="palette" size={18} /> Tema de Colores</h3>
                <p className="group-desc">Elige el modo que prefieras para ver la aplicacion</p>
                <div className="theme-options">
                  <button
                    className={`theme-btn ${tema === 'dark' ? 'active' : ''}`}
                    onClick={() => setTema('dark')}
                  >
                    <span className="theme-icon"><LucideIcon name="moon" size={20} /></span>
                    <span className="theme-name">Oscuro</span>
                    <span className="theme-desc">Ideal para la noche</span>
                  </button>
                  <button
                    className={`theme-btn ${tema === 'light' ? 'active' : ''}`}
                    onClick={() => setTema('light')}
                  >
                    <span className="theme-icon"><LucideIcon name="sunrise" size={20} /></span>
                    <span className="theme-name">Claro</span>
                    <span className="theme-desc">Ideal para el dia</span>
                  </button>
                  <button
                    className={`theme-btn ${tema === 'high-contrast' ? 'active' : ''}`}
                    onClick={() => setTema('high-contrast')}
                  >
                    <span className="theme-icon"><LucideIcon name="eye" size={20} /></span>
                    <span className="theme-name">Alto Contraste</span>
                    <span className="theme-desc">Maxima visibilidad</span>
                  </button>
                </div>
              </div>

              <div className="config-group">
                <h3><LucideIcon name="type" size={20} /> Tamaño de Texto</h3>
                <p className="group-desc">Ajusta el tamaño de las letras</p>
                <div className="font-size-options">
                  <button
                    className={`font-btn ${tamanoTexto === 'small' ? 'active' : ''}`}
                    onClick={() => {
                      setTamanoTexto('small');
                      document.documentElement.removeAttribute('data-font-size');
                      localStorage.setItem('vitalia-font-size', 'small');
                    }}
                  >
                    <span className="font-preview small">A</span>
                    <span>Normal</span>
                  </button>
                  <button
                    className={`font-btn ${tamanoTexto === 'normal' ? 'active' : ''}`}
                    onClick={() => {
                      setTamanoTexto('normal');
                      document.documentElement.removeAttribute('data-font-size');
                      localStorage.setItem('vitalia-font-size', 'normal');
                    }}
                  >
                    <span className="font-preview medium">A</span>
                    <span>Grande</span>
                  </button>
                  <button
                    className={`font-btn ${tamanoTexto === 'large' ? 'active' : ''}`}
                    onClick={() => {
                      setTamanoTexto('large');
                      document.documentElement.setAttribute('data-font-size', 'large');
                      localStorage.setItem('vitalia-font-size', 'large');
                    }}
                  >
                    <span className="font-preview large">A</span>
                    <span>Muy Grande</span>
                  </button>
                </div>
              </div>

              <div className="config-group">
                <h3><LucideIcon name="volume" size={18} /> Ayuda por Voz</h3>
                <p className="group-desc">Activa o desactiva las explicaciones de audio</p>
                <label className="config-toggle">
                  <span>Mostrar boton de voz</span>
                  <input
                    type="checkbox"
                    checked={vozActiva}
                    onChange={(e) => {
                      setVozActiva(e.target.checked);
                      localStorage.setItem('vitalia-voice', e.target.checked);
                    }}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <p className="toggle-help">
                  Cuando esta activo, veras un boton de voz en cada pantalla para escuchar explicaciones
                </p>
              </div>

              <div className="accessibility-preview">
                <h4>Vista previa</h4>
                <div className="preview-card">
                  <p>Este es un ejemplo de como se ve el texto con tus configuraciones actuales.</p>
                  <button className="btn btn-primary">Boton de Ejemplo</button>
                </div>
              </div>
            </div>
          )}

          {/* ACERCA DE */}
          {activeSection === 'acerca' && (
            <div className="config-section">
              <h2>Acerca de Azaria</h2>

              <div className="acerca-info">
                <div className="app-version">
                  <h3>Azaria 2.0</h3>
                  <p>Sistema de Adherencia Terapeutica</p>
                  <p className="version">Version 2.0.0</p>
                </div>

                <div className="contacto-info">
                  <h4>Contacto</h4>
                  <p><LucideIcon name="hospital" size={16} /> UTEQ - Universidad Tecnologica de Queretaro</p>
                </div>

                <p className="copyright">
                  © 2026 Azaria. Todos los derechos reservados.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="logout-section">
        <button className="btn btn-danger btn-lg" onClick={logout}>
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
};

export default Configuracion;
