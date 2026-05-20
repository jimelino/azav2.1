import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Citas.css';

const Citas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('proximas');
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);

  // Formulario nueva cita (solo especialistas)
  const [nuevaCita, setNuevaCita] = useState({
    paciente_id: '',
    fecha: '',
    hora: '',
    motivo: '',
    tipo: 'presencial'
  });

  const tiposCita = [
    { id: 'presencial', nombre: 'Presencial', icon: 'hospital' },
    { id: 'videollamada', nombre: 'Videollamada', icon: 'monitor' },
    { id: 'telefonica', nombre: 'Telefonica', icon: 'smartphone' }
  ];

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/citas');
      const todasLasCitas = response.data || [];

      if (activeTab === 'proximas') {
        setCitas(todasLasCitas.filter(c =>
          new Date(c.fecha_hora) >= new Date() && c.estado !== 'cancelada'
        ));
      } else {
        setCitas(todasLasCitas.filter(c =>
          new Date(c.fecha_hora) < new Date() || c.estado === 'completada'
        ));
      }

      // Cargar pacientes para especialistas (solo ellos pueden agendar citas)
      if (user.rol === 'especialista' || user.rol_id === 2) {
        try {
          const especialistaId = user.especialista_id || user.id;
          const pacResponse = await api.get(`/especialistas/${especialistaId}/pacientes`);
          setPacientes(pacResponse.data?.pacientes || pacResponse.data || []);
        } catch (err) {
          console.error('Error al cargar pacientes:', err);
        }
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgendarCita = async (e) => {
    e.preventDefault();
    try {
      const fechaHora = `${nuevaCita.fecha}T${nuevaCita.hora}:00`;

      const datosEnviar = {
        paciente_id: nuevaCita.paciente_id,
        especialista_id: user.especialista_id || user.id,
        fecha_hora: fechaHora,
        motivo: nuevaCita.motivo,
        tipo: nuevaCita.tipo
      };

      console.log('=== ENVIANDO CITA ===');
      console.log('Datos a enviar:', datosEnviar);
      console.log('Usuario actual:', user);

      const response = await api.post('/citas', datosEnviar);
      console.log('Respuesta del servidor:', response.data);

      setShowModal(false);
      setNuevaCita({ paciente_id: '', fecha: '', hora: '', motivo: '', tipo: 'presencial' });
      cargarDatos();
    } catch (err) {
      console.error('=== ERROR AL AGENDAR CITA ===');
      console.error('Error:', err);
      console.error('Respuesta del servidor:', err.response?.data);
      alert('Error al agendar cita: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelarCita = async (citaId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;

    try {
      await api.put(`/citas/${citaId}/cancelar`);
      cargarDatos();
    } catch (err) {
      console.error('Error al cancelar cita:', err);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'programada': 'azul',
      'confirmada': 'verde',
      'cancelada': 'rojo',
      'completada': 'gris',
      'reprogramada': 'naranja'
    };
    return colores[estado] || 'gris';
  };

  const formatearFecha = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return {
      dia: fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      hora: fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getHorariosDisponibles = () => {
    // Horarios típicos de consulta médica
    const horarios = [];
    for (let h = 8; h <= 18; h++) {
      horarios.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 18) horarios.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return horarios;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
    <div className="citas-page" data-age-mode={settings.ageMode}>
      <header className="citas-header">
        <button
          className="btn-back"
          onClick={() => navigate(getBackRoute())}
          aria-label="Volver al inicio"
        >
          <span aria-hidden="true">←</span> Volver
        </button>
        <div className="header-content">
          <h1>Mis Citas</h1>
          <p className="subtitle">Administra tus citas médicas</p>
        </div>
      </header>

      {(user.rol === 'especialista' || user.rol_id === 2) && (
        <button
          className="fab-agendar"
          onClick={() => setShowModal(true)}
          aria-label="Agendar cita"
        >
          +
        </button>
      )}

      <div className="citas-tabs">
        <button
          className={`citas-tab ${activeTab === 'proximas' ? 'active' : ''}`}
          onClick={() => setActiveTab('proximas')}
        >
          Próximas
        </button>
        <button
          className={`citas-tab ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando citas...</p>
        </div>
      ) : (
        <div className="citas-content">
          <div className="citas-list">
            {citas.length > 0 ? citas.map(cita => {
              const { dia, hora } = formatearFecha(cita.fecha_hora);
              return (
                <div
                  key={cita.id}
                  className={`cita-card estado-${getEstadoColor(cita.estado)}`}
                  onClick={() => setSelectedCita(cita)}
                >
                  <div className="cita-fecha">
                    <span className="cita-dia">{dia}</span>
                    <span className="cita-hora">{hora}</span>
                  </div>

                  <div className="cita-info">
                    <h3>
                      {user.rol === 'paciente'
                        ? `Dr(a). ${cita.especialista_nombre}`
                        : cita.paciente_nombre
                      }
                    </h3>
                    <p className="cita-area">{cita.area_medica}</p>
                    <p className="cita-motivo">{cita.motivo}</p>

                    <div className="cita-meta">
                      <span className="cita-tipo">
                        <LucideIcon name={tiposCita.find(t => t.id === cita.tipo)?.icon} size={16} /> {tiposCita.find(t => t.id === cita.tipo)?.nombre}
                      </span>
                      <span className={`cita-estado ${cita.estado}`}>
                        {cita.estado}
                      </span>
                    </div>
                  </div>

                  {activeTab === 'proximas' && cita.estado !== 'cancelada' && (
                    <div className="cita-acciones">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelarCita(cita.id);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="empty-state">
                <p>{activeTab === 'proximas' ? 'No tienes citas programadas' : 'No hay historial de citas'}</p>
                {activeTab === 'proximas' && (user.rol === 'especialista' || user.rol_id === 2) && (
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    Agendar una cita
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para agendar cita (solo especialistas) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h2>Agendar Nueva Cita</h2>
            <form onSubmit={handleAgendarCita}>
              <div className="form-group">
                <label>Usuario</label>
                <select
                  value={nuevaCita.paciente_id}
                  onChange={e => setNuevaCita({...nuevaCita, paciente_id: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Selecciona un usuario</option>
                  {pacientes.map(pac => (
                    <option key={pac.id} value={pac.id}>
                      {pac.nombre_completo || pac.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={nuevaCita.fecha}
                    onChange={e => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                    min={getMinDate()}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <select
                    value={nuevaCita.hora}
                    onChange={e => setNuevaCita({...nuevaCita, hora: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="">Selecciona</option>
                    {getHorariosDisponibles().map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de cita</label>
                <div className="tipo-cita-options">
                  {tiposCita.map(tipo => (
                    <label key={tipo.id} className={`tipo-option ${nuevaCita.tipo === tipo.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="tipo"
                        value={tipo.id}
                        checked={nuevaCita.tipo === tipo.id}
                        onChange={e => setNuevaCita({...nuevaCita, tipo: e.target.value})}
                      />
                      <span className="tipo-icon"><LucideIcon name={tipo.icon} size={20} /></span>
                      <span className="tipo-nombre">{tipo.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Motivo de la consulta</label>
                <textarea
                  value={nuevaCita.motivo}
                  onChange={e => setNuevaCita({...nuevaCita, motivo: e.target.value})}
                  className="form-control"
                  rows="3"
                  placeholder="Describe brevemente el motivo de tu consulta..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle de cita */}
      {selectedCita && (
        <div className="modal-overlay" onClick={() => setSelectedCita(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCita(null)}>×</button>
            <h2>Detalle de Cita</h2>

            <div className="cita-detalle">
              <div className="detalle-row">
                <span className="detalle-label">Fecha:</span>
                <span className="detalle-value">{formatearFecha(selectedCita.fecha_hora).dia}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Hora:</span>
                <span className="detalle-value">{formatearFecha(selectedCita.fecha_hora).hora}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Especialista:</span>
                <span className="detalle-value">Dr(a). {selectedCita.especialista_nombre}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Área:</span>
                <span className="detalle-value">{selectedCita.area_medica}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Tipo:</span>
                <span className="detalle-value">
                  <LucideIcon name={tiposCita.find(t => t.id === selectedCita.tipo)?.icon} size={16} /> {tiposCita.find(t => t.id === selectedCita.tipo)?.nombre}
                </span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Estado:</span>
                <span className={`detalle-value estado-badge ${selectedCita.estado}`}>
                  {selectedCita.estado}
                </span>
              </div>
              <div className="detalle-row full-width">
                <span className="detalle-label">Motivo:</span>
                <p className="detalle-value">{selectedCita.motivo}</p>
              </div>

              {selectedCita.notas && (
                <div className="detalle-row full-width">
                  <span className="detalle-label">Notas del especialista:</span>
                  <p className="detalle-value">{selectedCita.notas}</p>
                </div>
              )}
            </div>

            {selectedCita.tipo === 'videollamada' && selectedCita.enlace_videollamada && (
              <div className="videollamada-section">
                <a
                  href={selectedCita.enlace_videollamada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg btn-block"
                >
                  Unirse a Videollamada
                </a>
              </div>
            )}
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

export default Citas;
