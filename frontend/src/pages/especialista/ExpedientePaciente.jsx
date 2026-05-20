import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import AccessibilityPanel, { AccessibilityFAB } from '../../components/accessibility/AccessibilityPanel';
import api from '../../services/api';
import LucideIcon from '../../components/LucideIcon';
import './ExpedientePaciente.css';

const ExpedientePaciente = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAccessibility();

  const [isLoading, setIsLoading] = useState(true);
  const [paciente, setPaciente] = useState(null);
  const [citas, setCitas] = useState([]);
  const [notas, setNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('salud');

  // Health summary
  const [resumen, setResumen] = useState(null);

  // Archivos
  const [archivos, setArchivos] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategoria, setUploadCategoria] = useState('analisis');
  const [uploadFecha, setUploadFecha] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadPacienteData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const loadPacienteData = async () => {
    setIsLoading(true);
    try {
      const especialistaId = user?.id;
      const [pacienteRes, resumenRes, archivosRes] = await Promise.all([
        api.get(`/especialistas/${especialistaId}/pacientes/${pacienteId}`),
        api.get(`/expediente/resumen/${pacienteId}`).catch(() => ({ data: null })),
        api.get(`/expediente/archivos/${pacienteId}`).catch(() => ({ data: [] }))
      ]);

      if (pacienteRes.success && pacienteRes.data) {
        setPaciente(pacienteRes.data.paciente);
        setCitas(pacienteRes.data.citas || []);
        setNotas(pacienteRes.data.asignacion?.notas || '');
      }
      setResumen(resumenRes?.data || null);
      setArchivos(archivosRes?.data || []);
    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showAlertMsg = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSaveNotas = async () => {
    setIsSaving(true);
    try {
      const especialistaId = user?.id;
      await api.put(`/especialistas/${especialistaId}/pacientes/${pacienteId}/seguimiento`, {
        notas
      });
      showAlertMsg('success', 'Notas guardadas correctamente');
    } catch (error) {
      console.error('Error guardando notas:', error);
      showAlertMsg('error', 'Error al guardar las notas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'doc'].includes(ext)) {
        showAlertMsg('error', 'Solo PDF, DOCX o DOC');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showAlertMsg('error', 'Max 10MB');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', uploadFile);
      formData.append('paciente_id', pacienteId);
      formData.append('descripcion', uploadDesc);
      formData.append('categoria', uploadCategoria);
      formData.append('fecha_estudio', uploadFecha);

      await api.post('/expediente/archivos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showAlertMsg('success', 'Archivo subido');
      setShowUpload(false);
      setUploadFile(null);
      setUploadDesc('');
      setUploadCategoria('analisis');

      const archivosRes = await api.get(`/expediente/archivos/${pacienteId}`).catch(() => ({ data: [] }));
      setArchivos(archivosRes?.data || []);
    } catch (error) {
      showAlertMsg('error', 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArchivo = async (archivoId) => {
    if (!window.confirm('¿Eliminar archivo?')) return;
    try {
      await api.delete(`/expediente/archivos/${archivoId}`);
      setArchivos(prev => prev.filter(a => a.id !== archivoId));
      showAlertMsg('success', 'Eliminado');
    } catch {
      showAlertMsg('error', 'Error al eliminar');
    }
  };

  const handleDownload = (archivoId) => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/expediente/archivos/${archivoId}/descargar?token=${token}`, '_blank');
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="expediente-loading" data-age-mode={settings.ageMode}>
        <div className="loading-spinner"></div>
        <p>Cargando expediente...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="expediente-error" data-age-mode={settings.ageMode}>
        <h2>Usuario no encontrado</h2>
        <p>No tienes acceso a este usuario o no existe.</p>
        <button onClick={() => navigate('/especialista')} className="btn-primary">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="expediente-paciente" data-age-mode={settings.ageMode}>
      {/* Header */}
      <header className="expediente-header">
        <button
          className="btn-back"
          onClick={() => navigate('/especialista')}
          aria-label="Volver al dashboard"
        >
          <span aria-hidden="true">←</span> Volver
        </button>
        <h1>Expediente del Usuario</h1>
      </header>

      {/* Información del paciente */}
      <section className="paciente-info-card">
        <div className="paciente-avatar">
          {paciente.nombre_completo?.charAt(0) || 'P'}
        </div>
        <div className="paciente-datos">
          <h2>{paciente.nombre_completo}</h2>
          <div className="paciente-meta">
            <span className="meta-item">
              <strong>Edad:</strong> {calcularEdad(paciente.fecha_nacimiento)} años
            </span>
            <span className="meta-item">
              <strong>Email:</strong> {paciente.email}
            </span>
            <span className="meta-item">
              <strong>Fase:</strong>
              <span className="fase-badge">{paciente.fase_actual || 'Sin asignar'}</span>
            </span>
            <span className="meta-item">
              <strong>Registro:</strong> {formatFecha(paciente.fecha_registro)}
            </span>
          </div>
        </div>
      </section>

      {/* Alert */}
      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '12px',
          background: alert.type === 'success' ? 'rgba(46,125,50,0.15)' : 'rgba(198,40,40,0.15)',
          color: alert.type === 'success' ? '#2E7D32' : '#C62828',
          fontSize: '14px'
        }}>
          {alert.message}
        </div>
      )}

      {/* Tabs */}
      <nav className="expediente-tabs">
        <button
          className={`tab-btn ${activeTab === 'salud' ? 'active' : ''}`}
          onClick={() => setActiveTab('salud')}
        >
          Resumen Salud
        </button>
        <button
          className={`tab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          Documentos
        </button>
        <button
          className={`tab-btn ${activeTab === 'citas' ? 'active' : ''}`}
          onClick={() => setActiveTab('citas')}
        >
          Citas
        </button>
        <button
          className={`tab-btn ${activeTab === 'notas' ? 'active' : ''}`}
          onClick={() => setActiveTab('notas')}
        >
          Notas
        </button>
      </nav>

      {/* Contenido según tab */}
      <main className="expediente-content">
        {/* SALUD TAB */}
        {activeTab === 'salud' && (
          <div className="tab-content general-content">
            <h3>Resumen de Salud</h3>
            <div className="info-grid">
              {/* Glucosa */}
              <div className="info-card">
                <h3><LucideIcon name="droplet" size={20} /> Glucosa</h3>
                {resumen?.glucosa ? (
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Valor:</span>
                      <span className="info-value">{resumen.glucosa.valor} mg/dL</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">{formatFecha(resumen.glucosa.fecha)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary, #6B6B6B)' }}>Sin registros</p>
                )}
              </div>

              {/* Presion */}
              <div className="info-card">
                <h3><LucideIcon name="heart" size={20} /> Presion Arterial</h3>
                {resumen?.presion ? (
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Valor:</span>
                      <span className="info-value">{resumen.presion.sistolica}/{resumen.presion.diastolica}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Pulso:</span>
                      <span className="info-value">{resumen.presion.pulso || '-'} bpm</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">{formatFecha(resumen.presion.fecha)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary, #6B6B6B)' }}>Sin registros</p>
                )}
              </div>

              {/* Estado de Animo */}
              <div className="info-card">
                <h3><LucideIcon name="brain" size={20} /> Estado de Animo</h3>
                {resumen?.animo ? (
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Emocion:</span>
                      <span className="info-value">{resumen.animo.emocion}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Nivel:</span>
                      <span className="info-value">{resumen.animo.nivel}/10</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary, #6B6B6B)' }}>Sin registros</p>
                )}
              </div>

              {/* Ultima Comida */}
              <div className="info-card">
                <h3><LucideIcon name="utensils" size={20} /> Ultima Comida</h3>
                {resumen?.comida ? (
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Tipo:</span>
                      <span className="info-value">{resumen.comida.tipo_comida || 'Comida'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">{formatFecha(resumen.comida.fecha)}</span>
                    </div>
                    {resumen.comida.descripcion && (
                      <div className="info-item">
                        <span className="info-label">Desc:</span>
                        <span className="info-value">{resumen.comida.descripcion.substring(0, 50)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary, #6B6B6B)' }}>Sin registros</p>
                )}
              </div>

              {/* Peso / IMC */}
              <div className="info-card">
                <h3><LucideIcon name="scale" size={20} /> Peso / IMC</h3>
                {resumen?.peso ? (
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Peso:</span>
                      <span className="info-value">{resumen.peso.peso} kg</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Talla:</span>
                      <span className="info-value">{resumen.peso.talla} cm</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">IMC:</span>
                      <span className="info-value">{resumen.peso.imc ? parseFloat(resumen.peso.imc).toFixed(1) : '--'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">{formatFecha(resumen.peso.fecha_medicion)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary, #6B6B6B)' }}>Sin registros</p>
                )}
              </div>

              {/* Citas Hoy */}
              <div className="info-card full-width">
                <h3><LucideIcon name="calendar" size={20} /> Citas de Hoy</h3>
                {resumen?.citas_hoy && resumen.citas_hoy.length > 0 ? (
                  <div className="info-list">
                    {resumen.citas_hoy.map((cita) => (
                      <div key={cita.id} className="info-item">
                        <span className="info-label">{cita.hora?.substring(0, 5)} - {cita.tipo_cita || 'Cita'}</span>
                        <span className={`status-badge ${cita.estado === 'confirmada' ? 'active' : ''}`}>
                          {cita.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary, #6B6B6B)' }}>No hay citas programadas para hoy</p>
                )}
              </div>

              {/* Acciones */}
              <div className="info-card full-width">
                <h3>Acciones Rapidas</h3>
                <div className="quick-actions">
                  <Link to={`/chat/${pacienteId}`} className="action-btn">
                    <span className="action-icon"><LucideIcon name="message" size={20} /></span>
                    Enviar Mensaje
                  </Link>
                  <button className="action-btn" onClick={() => setActiveTab('notas')}>
                    <span className="action-icon"><LucideIcon name="pen-line" size={20} /></span>
                    Agregar Nota
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('documentos')}>
                    <span className="action-icon"><LucideIcon name="file-text" size={20} /></span>
                    Ver Documentos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTOS TAB */}
        {activeTab === 'documentos' && (
          <div className="tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Documentos ({archivos.length})</h3>
              <button
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '14px' }}
                onClick={() => setShowUpload(!showUpload)}
              >
                + Subir
              </button>
            </div>

            {/* Upload Form Inline */}
            {showUpload && (
              <div style={{
                background: '#F5F7F2',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                border: '2px dashed #E0E0E0'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileSelect}
                    style={{ marginBottom: '8px' }}
                  />
                  {uploadFile && (
                    <p style={{ margin: '4px 0', color: '#2E7D32', fontWeight: 600 }}>
                      {uploadFile.name} ({formatFileSize(uploadFile.size)})
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <select
                    value={uploadCategoria}
                    onChange={(e) => setUploadCategoria(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E0E0E0' }}
                  >
                    <option value="analisis">Analisis</option>
                    <option value="laboratorio">Laboratorio</option>
                    <option value="imagen">Imagen</option>
                    <option value="receta">Receta</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    type="date"
                    value={uploadFecha}
                    onChange={(e) => setUploadFecha(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E0E0E0' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Descripcion (opcional)"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', marginBottom: '12px' }}
                />
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  style={{ padding: '10px 24px' }}
                >
                  {uploading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            )}

            {archivos.length > 0 ? (
              <div className="citas-list">
                {archivos.map((archivo) => (
                  <div key={archivo.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    background: '#F5F7F2',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${archivo.tipo_archivo === 'pdf' ? '#C62828' : '#1976D2'}`
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                      background: archivo.tipo_archivo === 'pdf' ? 'rgba(198,40,40,0.1)' : 'rgba(25,118,210,0.1)',
                      color: archivo.tipo_archivo === 'pdf' ? '#C62828' : '#1976D2',
                      flexShrink: 0
                    }}>
                      {archivo.tipo_archivo === 'pdf' ? 'PDF' : 'DOC'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #1A1A1A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {archivo.nombre_original}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #6B6B6B)', display: 'flex', gap: '8px' }}>
                        <span>{archivo.categoria}</span>
                        <span>{formatFileSize(archivo.tamano)}</span>
                        <span>{formatFecha(archivo.fecha_estudio || archivo.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleDownload(archivo.id)}
                        style={{
                          width: '34px', height: '34px', borderRadius: '8px',
                          border: '1px solid #E0E0E0', background: 'white', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Descargar"
                      >⬇</button>
                      <button
                        onClick={() => handleDeleteArchivo(archivo.id)}
                        style={{
                          width: '34px', height: '34px', borderRadius: '8px',
                          border: '1px solid #FFCDD2', background: 'white', cursor: 'pointer',
                          color: '#C62828', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Eliminar"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No hay documentos en el expediente.</p>
              </div>
            )}
          </div>
        )}

        {/* CITAS TAB */}
        {activeTab === 'citas' && (
          <div className="tab-content citas-content">
            <h3>Historial de Citas</h3>
            {citas.length === 0 ? (
              <div className="empty-state">
                <p>No hay citas registradas con este usuario.</p>
              </div>
            ) : (
              <div className="citas-list">
                {citas.map((cita) => (
                  <div key={cita.id} className={`cita-card ${cita.estado}`}>
                    <div className="cita-fecha">
                      <span className="cita-dia">{formatFecha(cita.fecha)}</span>
                      <span className="cita-hora">{cita.hora}</span>
                    </div>
                    <div className="cita-info">
                      <span className="cita-tipo">{cita.tipo}</span>
                      <span className={`cita-estado estado-${cita.estado}`}>
                        {cita.estado}
                      </span>
                    </div>
                    {cita.notas && (
                      <div className="cita-notas">
                        <strong>Notas:</strong> {cita.notas}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTAS TAB */}
        {activeTab === 'notas' && (
          <div className="tab-content notas-content">
            <h3>Notas de Seguimiento</h3>
            <p className="notas-description">
              Registra observaciones importantes sobre el progreso del usuario.
            </p>
            <textarea
              className="notas-textarea"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe tus notas sobre el usuario..."
              rows={10}
            />
            <div className="notas-actions">
              <button
                className="btn-primary"
                onClick={handleSaveNotas}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Notas'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default ExpedientePaciente;
