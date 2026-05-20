import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Expediente.css';

const Expediente = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Si es especialista, toma pacienteId de URL; si es paciente, usa su propio ID
  const rol = user?.rol || user?.role;
  const pacienteId = rol === 'especialista'
    ? searchParams.get('pacienteId')
    : (user?.paciente_id || user?.id);

  const [resumen, setResumen] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [sharing, setSharing] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategoria, setUploadCategoria] = useState('analisis');
  const [uploadFecha, setUploadFecha] = useState(new Date().toISOString().split('T')[0]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (pacienteId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resumenRes, archivosRes] = await Promise.all([
        api.get(`/expediente/resumen/${pacienteId}`).catch(() => ({ data: null })),
        api.get(`/expediente/archivos/${pacienteId}`).catch(() => ({ data: [] }))
      ]);
      setResumen(resumenRes?.data || null);
      setArchivos(archivosRes?.data || []);
    } catch (error) {
      console.error('Error cargando expediente:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['pdf', 'docx', 'doc'];
    if (!allowed.includes(ext)) {
      showAlert('error', 'Solo se permiten archivos PDF, DOCX o DOC');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('error', 'El archivo no debe superar los 10MB');
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
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

      showAlert('success', 'Archivo subido correctamente');
      setShowUpload(false);
      resetUploadForm();
      // Reload archivos
      const archivosRes = await api.get(`/expediente/archivos/${pacienteId}`).catch(() => ({ data: [] }));
      setArchivos(archivosRes?.data || []);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      showAlert('error', 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadDesc('');
    setUploadCategoria('analisis');
    setUploadFecha(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (archivoId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      await api.delete(`/expediente/archivos/${archivoId}`);
      setArchivos(prev => prev.filter(a => a.id !== archivoId));
      showAlert('success', 'Archivo eliminado');
    } catch (error) {
      showAlert('error', 'Error al eliminar');
    }
  };

  const handleDownload = (archivoId) => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/expediente/archivos/${archivoId}/descargar?token=${token}`, '_blank');
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await api.post(`/expediente/compartir/${pacienteId}`);
      if (res?.data?.token) {
        const baseUrl = window.location.origin;
        const basename = process.env.REACT_APP_BASENAME || '';
        const link = `${baseUrl}${basename}/expediente/compartido/${res.data.token}`;
        setShareLink({ url: link, expira: res.data.expira_en });
      }
    } catch (error) {
      showAlert('error', 'Error generando enlace');
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink?.url) {
      navigator.clipboard.writeText(shareLink.url).then(() => {
        showAlert('success', 'Enlace copiado al portapapeles');
      });
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'pdf': return { icon: 'PDF', class: 'pdf' };
      case 'docx': return { icon: 'DOC', class: 'docx' };
      case 'doc': return { icon: 'DOC', class: 'doc' };
      default: return { icon: '?', class: '' };
    }
  };

  const getGlucosaColor = (valor) => {
    if (!valor) return '';
    const v = parseFloat(valor);
    if (v < 70) return '#E65100';
    if (v <= 130) return '#2E7D32';
    return '#C62828';
  };

  const getPresionLabel = (sistolica, diastolica) => {
    if (!sistolica) return '';
    return `${sistolica}/${diastolica}`;
  };

  if (loading) {
    return (
      <div className="expediente-loading">
        <div className="loading-spinner"></div>
        <p>Cargando expediente...</p>
      </div>
    );
  }

  const esPaciente = rol === 'paciente';
  const titulo = esPaciente ? 'Mi Expediente' : `Expediente de ${resumen?.paciente?.nombre_completo || 'Usuario'}`;
  const subtitulo = esPaciente
    ? 'Tu resumen de salud y documentos'
    : resumen?.paciente?.fase_nombre || 'Resumen completo';

  return (
    <div className="expediente-page">
      {/* Hero Header */}
      <div className="expediente-hero">
        <h1>{titulo}</h1>
        <p className="hero-subtitle">{subtitulo}</p>
      </div>

      <div className="expediente-content">
        {/* Alert */}
        {alert && (
          <div className={`expediente-alert ${alert.type}`}>
            {alert.type === 'success' ? '✓' : '!'} {alert.message}
          </div>
        )}

        {/* Health Summary Cards */}
        <section className="health-summary">
          <h2>Resumen de Salud</h2>
          <div className="health-cards-scroll">
            {/* Glucosa */}
            <div className="health-card glucosa">
              <div className="health-card-icon">🩸</div>
              <span className="health-card-label">Glucosa</span>
              {resumen?.glucosa ? (
                <>
                  <span className="health-card-value" style={{ color: getGlucosaColor(resumen.glucosa.valor) }}>
                    {resumen.glucosa.valor} mg/dL
                  </span>
                  <span className="health-card-date">{formatDate(resumen.glucosa.fecha)}</span>
                </>
              ) : (
                <span className="health-card-empty">Sin registro</span>
              )}
            </div>

            {/* Presion */}
            <div className="health-card presion">
              <div className="health-card-icon"><LucideIcon name="heart" size={24} /></div>
              <span className="health-card-label">Presion</span>
              {resumen?.presion ? (
                <>
                  <span className="health-card-value">
                    {getPresionLabel(resumen.presion.sistolica, resumen.presion.diastolica)}
                  </span>
                  <span className="health-card-date">
                    Pulso: {resumen.presion.pulso || '-'} | {formatDate(resumen.presion.fecha)}
                  </span>
                </>
              ) : (
                <span className="health-card-empty">Sin registro</span>
              )}
            </div>

            {/* Estado de Animo */}
            <div className="health-card animo">
              <div className="health-card-icon"><LucideIcon name="brain" size={24} /></div>
              <span className="health-card-label">Estado de Animo</span>
              {resumen?.animo ? (
                <>
                  <span className="health-card-value">{resumen.animo.emocion}</span>
                  <span className="health-card-date">
                    Nivel: {resumen.animo.nivel}/10 | {formatDate(resumen.animo.created_at)}
                  </span>
                </>
              ) : (
                <span className="health-card-empty">Sin registro</span>
              )}
            </div>

            {/* Ultima Comida */}
            <div className="health-card comida">
              <div className="health-card-icon"><LucideIcon name="utensils" size={24} /></div>
              <span className="health-card-label">Ultima Comida</span>
              {resumen?.comida ? (
                <>
                  <span className="health-card-value">{resumen.comida.tipo_comida || 'Comida'}</span>
                  <span className="health-card-date">
                    {resumen.comida.descripcion?.substring(0, 30) || ''} | {formatDate(resumen.comida.fecha)}
                  </span>
                </>
              ) : (
                <span className="health-card-empty">Sin registro</span>
              )}
            </div>

            {/* Peso / IMC */}
            <div className="health-card peso">
              <div className="health-card-icon"><LucideIcon name="scale" size={24} /></div>
              <span className="health-card-label">Peso / IMC</span>
              {resumen?.peso ? (
                <>
                  <span className="health-card-value">{resumen.peso.peso} kg</span>
                  <span className="health-card-date">
                    IMC: {parseFloat(resumen.peso.imc).toFixed(1)} | Talla: {resumen.peso.talla} cm | {formatDate(resumen.peso.fecha_medicion)}
                  </span>
                </>
              ) : (
                <span className="health-card-empty">Sin registro</span>
              )}
            </div>
          </div>
        </section>

        {/* Citas del Dia */}
        <section className="citas-hoy-section">
          <h2>Citas de Hoy</h2>
          {resumen?.citas_hoy && resumen.citas_hoy.length > 0 ? (
            resumen.citas_hoy.map((cita) => (
              <div key={cita.id} className="cita-hoy-card">
                <div className="cita-hoy-hora">
                  {cita.hora?.substring(0, 5) || '--:--'}
                </div>
                <div className="cita-hoy-info">
                  <span className="cita-hoy-tipo">{cita.tipo_cita || 'Cita'}</span>
                  <span className="cita-hoy-especialista">{cita.especialista_nombre || ''}</span>
                </div>
                <span className={`cita-hoy-estado ${cita.estado}`}>
                  {cita.estado}
                </span>
              </div>
            ))
          ) : (
            <div className="no-citas-hoy">
              <span><LucideIcon name="calendar" size={20} /></span>
              No tienes citas programadas para hoy
            </div>
          )}
        </section>

        {/* Documentos */}
        <section className="documentos-section">
          <div className="documentos-header">
            <h2>Documentos ({archivos.length})</h2>
            <button className="btn-subir" onClick={() => setShowUpload(true)}>
              + Subir
            </button>
          </div>

          {archivos.length > 0 ? (
            <div className="archivos-list">
              {archivos.map((archivo) => {
                const fileType = getFileIcon(archivo.tipo_archivo);
                return (
                  <div key={archivo.id} className="archivo-card">
                    <div className={`archivo-icon ${fileType.class}`}>
                      {fileType.icon}
                    </div>
                    <div className="archivo-info">
                      <span className="archivo-nombre">{archivo.nombre_original}</span>
                      <div className="archivo-meta">
                        <span>{archivo.categoria}</span>
                        <span>{formatFileSize(archivo.tamano)}</span>
                        <span>{formatDate(archivo.fecha_estudio || archivo.created_at)}</span>
                      </div>
                    </div>
                    <div className="archivo-acciones">
                      <button
                        className="btn-archivo"
                        onClick={() => handleDownload(archivo.id)}
                        aria-label="Descargar"
                        title="Descargar"
                      >
                        ⬇
                      </button>
                      <button
                        className="btn-archivo delete"
                        onClick={() => handleDelete(archivo.id)}
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-archivos">
              <span><LucideIcon name="file-text" size={24} /></span>
              <p>No hay documentos en el expediente.<br />Sube tus analisis y estudios.</p>
            </div>
          )}
        </section>

        {/* Compartir */}
        <section className="compartir-section">
          <h2>Compartir Expediente</h2>
          <div className="compartir-card">
            <p>Genera un enlace seguro para compartir tu expediente con otro especialista. El enlace expira en 72 horas.</p>
            <button className="btn-compartir" onClick={handleShare} disabled={sharing}>
              {sharing ? 'Generando...' : <><LucideIcon name="link" size={16} /> Generar Enlace</>}
            </button>

            {shareLink && (
              <div className="share-link-result">
                <label>Enlace para compartir:</label>
                <div className="share-link-input">
                  <input type="text" value={shareLink.url} readOnly />
                  <button className="btn-copiar" onClick={copyToClipboard}>Copiar</button>
                </div>
                <span className="share-expiry">Expira: {formatDate(shareLink.expira)}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="upload-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}>
          <div className="upload-modal">
            <div className="upload-modal-header">
              <h3>Subir Documento</h3>
              <button className="btn-close-modal" onClick={() => { setShowUpload(false); resetUploadForm(); }}>✕</button>
            </div>

            <div className="upload-modal-body">
              {/* File Drop Zone */}
              <div
                className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${uploadFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileSelect}
                  hidden
                />
                {uploadFile ? (
                  <>
                    <span className="upload-dropzone-icon">✓</span>
                    <p className="file-name">{uploadFile.name}</p>
                    <p className="file-types">{formatFileSize(uploadFile.size)}</p>
                  </>
                ) : (
                  <>
                    <span className="upload-dropzone-icon"><LucideIcon name="paperclip" size={32} /></span>
                    <p>Toca para seleccionar archivo</p>
                    <p className="file-types">PDF, DOCX, DOC (max 10MB)</p>
                  </>
                )}
              </div>

              {/* Categoria */}
              <div className="upload-form-group">
                <label>Categoria</label>
                <select value={uploadCategoria} onChange={(e) => setUploadCategoria(e.target.value)}>
                  <option value="analisis">Analisis clinico</option>
                  <option value="laboratorio">Laboratorio</option>
                  <option value="imagen">Imagen medica</option>
                  <option value="receta">Receta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Fecha */}
              <div className="upload-form-group">
                <label>Fecha del estudio</label>
                <input
                  type="date"
                  value={uploadFecha}
                  onChange={(e) => setUploadFecha(e.target.value)}
                />
              </div>

              {/* Descripcion */}
              <div className="upload-form-group">
                <label>Descripcion (opcional)</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Ej: Hemoglobina glucosilada, Rayos X tobillo..."
                  rows={3}
                />
              </div>
            </div>

            <div className="upload-modal-footer">
              <button className="btn-cancel" onClick={() => { setShowUpload(false); resetUploadForm(); }}>
                Cancelar
              </button>
              <button
                className="btn-upload"
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expediente;
