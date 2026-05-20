import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InstitutionalHeader from '../components/layouts/InstitutionalHeader';
import InstitutionalFooter from '../components/layouts/InstitutionalFooter';
import '../components/layouts/institutional.css';
import '../styles/Solicitud.css';

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas'
];

const TIPOS_AMPUTACION = [
  'Transtibial (debajo de rodilla)',
  'Transfemoral (arriba de rodilla)',
  'Bilateral',
  'Parcial de pie',
  'Desarticulación de rodilla',
  'Desarticulación de cadera',
  'Otro'
];

const CAUSAS_AMPUTACION = [
  'Diabetes',
  'Vascular',
  'Traumática',
  'Congénita',
  'Oncológica',
  'Otra'
];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const Solicitud = () => {
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState(null);

  const [form, setForm] = useState({
    nombre_completo: '',
    telefono: '',
    email: '',
    edad: '',
    sexo: '',
    ciudad: '',
    estado_procedencia: '',
    tipo_servicio: '',
    tipo_amputacion: '',
    causa_amputacion: '',
    tiene_protesis_previa: false,
    tiempo_desde_amputacion: '',
    herida_consolidada: '',
    herida_infeccion: '',
    padece_cronico: '',
    notas_clinicas: ''
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validarPaso1 = () => {
    if (!form.nombre_completo.trim()) return 'El nombre completo es requerido';
    if (!form.telefono.trim()) return 'El teléfono es requerido';
    if (!form.edad || form.edad < 1 || form.edad > 120) return 'Ingresa una edad válida';
    if (!form.sexo) return 'Selecciona el sexo';
    if (!form.ciudad.trim()) return 'La ciudad es requerida';
    if (!form.estado_procedencia) return 'Selecciona el estado de procedencia';
    return null;
  };

  const validarPaso2 = () => {
    if (!form.tipo_servicio) return 'Selecciona el tipo de servicio';
    if (!form.tipo_amputacion) return 'Selecciona el tipo de amputación';
    if (!form.causa_amputacion) return 'Selecciona la causa de amputación';
    if (!form.herida_consolidada) return 'Indica si tienes herida o cicatriz consolidada';
    if (!form.herida_infeccion) return 'Indica si tienes herida o infección en la extremidad no amputada';
    if (!form.padece_cronico) return 'Indica si padeces diabetes, hipertensión o recibes atención médica';
    return null;
  };

  const siguientePaso = () => {
    const err = validarPaso1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setPaso(2);
    window.scrollTo(0, 0);
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    const err = validarPaso2();
    if (err) {
      setError(err);
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const body = {
        ...form,
        edad: parseInt(form.edad),
        tiene_protesis_previa: form.tiene_protesis_previa ? 1 : 0
      };

      const response = await fetch(`${API_URL}/admisiones/solicitud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        setConfirmacion(result.data);
      } else {
        setError(result.message || 'Error al enviar la solicitud');
      }
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (confirmacion) {
    return (
      <div className="solicitud-page">
        <InstitutionalHeader />
        <main className="solicitud-content">
          <div className="solicitud-form-card">
            <div className="solicitud-confirmacion">
              <div className="confirmacion-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Solicitud Enviada</h2>
              <p>Tu solicitud ha sido recibida correctamente.</p>
              <div className="folio">{confirmacion.folio}</div>
              <p>Guarda tu número de folio. Nos pondremos en contacto contigo por teléfono para continuar con el proceso.</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Puedes consultar el avance de tu solicitud en cualquier momento.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '20px' }}>
                <Link to="/admisiones/estatus" className="btn-volver">
                  Consultar Estatus
                </Link>
                <Link to="/login" className="btn-volver" style={{ background: 'var(--surface-tertiary, #30363D)' }}>
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </main>
        <InstitutionalFooter />
      </div>
    );
  }

  return (
    <div className="solicitud-page">
      <InstitutionalHeader />
      <main className="solicitud-content">
        <div className="solicitud-intro">
          <h1>Solicitud de Admisión</h1>
          <p>Completa el formulario para iniciar tu proceso de admisión al programa de rehabilitación protésica.</p>
        </div>

        {/* Stepper */}
        <div className="solicitud-stepper">
          <div className="stepper-step">
            <div className={`stepper-circle ${paso >= 1 ? (paso > 1 ? 'completed' : 'active') : ''}`}>
              {paso > 1 ? '✓' : '1'}
            </div>
            <span className={`stepper-label ${paso >= 1 ? 'active' : ''}`}>Datos Personales</span>
          </div>
          <div className={`stepper-line ${paso > 1 ? 'completed' : ''}`} />
          <div className="stepper-step">
            <div className={`stepper-circle ${paso === 2 ? 'active' : ''}`}>2</div>
            <span className={`stepper-label ${paso === 2 ? 'active' : ''}`}>Datos Clínicos</span>
          </div>
        </div>

        {error && <div className="solicitud-error">{error}</div>}

        <form onSubmit={enviarSolicitud}>
          {paso === 1 && (
            <div className="solicitud-form-card">
              <h2>Datos Personales</h2>

              <div className="solicitud-form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={form.nombre_completo}
                  onChange={e => handleChange('nombre_completo', e.target.value)}
                  placeholder="Nombre(s) y Apellidos"
                />
              </div>

              <div className="solicitud-form-row">
                <div className="solicitud-form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={e => handleChange('telefono', e.target.value)}
                    placeholder="10 dígitos"
                  />
                </div>
                <div className="solicitud-form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div className="solicitud-form-row">
                <div className="solicitud-form-group">
                  <label>Edad *</label>
                  <input
                    type="number"
                    value={form.edad}
                    onChange={e => handleChange('edad', e.target.value)}
                    placeholder="Años"
                    min="1"
                    max="120"
                  />
                </div>
                <div className="solicitud-form-group">
                  <label>Sexo *</label>
                  <select value={form.sexo} onChange={e => handleChange('sexo', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="solicitud-form-row">
                <div className="solicitud-form-group">
                  <label>Ciudad *</label>
                  <input
                    type="text"
                    value={form.ciudad}
                    onChange={e => handleChange('ciudad', e.target.value)}
                    placeholder="Tu ciudad"
                  />
                </div>
                <div className="solicitud-form-group">
                  <label>Estado *</label>
                  <select value={form.estado_procedencia} onChange={e => handleChange('estado_procedencia', e.target.value)}>
                    <option value="">Seleccionar estado...</option>
                    {ESTADOS_MEXICO.map(est => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="solicitud-actions">
                <div />
                <button type="button" className="solicitud-btn solicitud-btn-primary" onClick={siguientePaso}>
                  Siguiente
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="solicitud-form-card">
              <h2>Datos Clínicos</h2>

              <div className="solicitud-form-group">
                <label>Tipo de Servicio *</label>
                <div className="solicitud-tipo-servicio">
                  <div
                    className={`tipo-servicio-card ${form.tipo_servicio === 'ortesis' ? 'selected' : ''}`}
                    onClick={() => handleChange('tipo_servicio', 'ortesis')}
                  >
                    <span className="card-icon">🦶</span>
                    <div className="card-title">Órtesis</div>
                    <div className="card-desc">Órtesis a público general</div>
                  </div>
                  <div
                    className={`tipo-servicio-card ${form.tipo_servicio === 'protesis_publico' ? 'selected' : ''}`}
                    onClick={() => handleChange('tipo_servicio', 'protesis_publico')}
                  >
                    <span className="card-icon">🦿</span>
                    <div className="card-title">Prótesis</div>
                    <div className="card-desc">Prótesis a público general</div>
                  </div>
                  <div
                    className={`tipo-servicio-card ${form.tipo_servicio === 'protocolo_protesis' ? 'selected' : ''}`}
                    onClick={() => handleChange('tipo_servicio', 'protocolo_protesis')}
                  >
                    <span className="card-icon">📋</span>
                    <div className="card-title">Protocolo</div>
                    <div className="card-desc">Protocolo de prótesis</div>
                  </div>
                </div>
              </div>

              <div className="solicitud-form-row">
                <div className="solicitud-form-group">
                  <label>Tipo de Amputación *</label>
                  <select value={form.tipo_amputacion} onChange={e => handleChange('tipo_amputacion', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_AMPUTACION.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="solicitud-form-group">
                  <label>Causa de Amputación *</label>
                  <select value={form.causa_amputacion} onChange={e => handleChange('causa_amputacion', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {CAUSAS_AMPUTACION.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="solicitud-form-group">
                <label className="solicitud-checkbox">
                  <input
                    type="checkbox"
                    checked={form.tiene_protesis_previa}
                    onChange={e => handleChange('tiene_protesis_previa', e.target.checked)}
                  />
                  <span>Tengo prótesis previa</span>
                </label>
              </div>

              <div className="solicitud-form-group">
                <label>Tiempo desde la amputación</label>
                <input
                  type="text"
                  value={form.tiempo_desde_amputacion}
                  onChange={e => handleChange('tiempo_desde_amputacion', e.target.value)}
                  placeholder="Ej: 2 años, 6 meses"
                />
              </div>

              <h3 style={{ margin: '24px 0 12px', color: 'var(--text-primary)', fontSize: '17px' }}>Preguntas Clínicas</h3>

              <div className="solicitud-form-group">
                <label>¿Tienes herida o cicatriz consolidada? *</label>
                <select value={form.herida_consolidada} onChange={e => handleChange('herida_consolidada', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="solicitud-form-group">
                <label>¿Tienes alguna herida o infección en la extremidad no amputada? *</label>
                <select value={form.herida_infeccion} onChange={e => handleChange('herida_infeccion', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="solicitud-form-group">
                <label>¿Padeces diabetes, hipertensión o recibes atención médica? *</label>
                <select value={form.padece_cronico} onChange={e => handleChange('padece_cronico', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="solicitud-form-group">
                <label>Notas adicionales</label>
                <textarea
                  value={form.notas_clinicas}
                  onChange={e => handleChange('notas_clinicas', e.target.value)}
                  placeholder="Información adicional que desees compartir (opcional)"
                />
              </div>

              <div className="solicitud-actions">
                <button type="button" className="solicitud-btn solicitud-btn-secondary" onClick={() => { setPaso(1); window.scrollTo(0, 0); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Anterior
                </button>
                <button type="submit" className="solicitud-btn solicitud-btn-primary" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
      <InstitutionalFooter />
    </div>
  );
};

export default Solicitud;
