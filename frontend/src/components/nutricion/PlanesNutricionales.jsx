import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import VistaPlan from './VistaPlan';
import VistaEquivalentes from './VistaEquivalentes';
import CatalogoRecetas from './CatalogoRecetas';
import { EditorGrupoAlimentos } from './EditorGrupoAlimentos';
import { extractTextFromPDF } from '../../utils/pdfExtractor';
import './PlanesNutricionales.css';

const PlanesNutricionales = ({ especialistaId, pacientes, onBack, onOpenGenerator }) => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState(null);
  const [showAsignarModal, setShowAsignarModal] = useState(null);
  const [showEditorPorciones, setShowEditorPorciones] = useState(false); // 👈 Estado para controlar tu modal
  const [uploadProgress, setUploadProgress] = useState(0);

  // Formulario de upload
  const [uploadForm, setUploadForm] = useState({
    nombre: '',
    descripcion: '',
    file: null
  });

  // Recetas e imágenes del plan
  const [showRecetaSelector, setShowRecetaSelector] = useState(false);
  const [uploadingImagen, setUploadingImagen] = useState(false);
  const imagenInputRef = useRef(null);

  // Formulario de asignación
  const [asignarForm, setAsignarForm] = useState({
    paciente_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    notas: ''
  });

  useEffect(() => {
    loadPlanes();
  }, [especialistaId]);

  const loadPlanes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/nutricion/planes/especialista/${especialistaId}`);
      setPlanes(response.data?.planes || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const fileExtension = file?.name?.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (file && (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension))) {
      setUploadForm({ ...uploadForm, file });
    } else {
      alert('Solo se permiten archivos PDF o Word (.docx, .doc)');
    }
  };

  const [extractionStatus, setExtractionStatus] = useState('');

  const handleUpload = async () => {
    if (!uploadForm.file) {
      alert('Selecciona un archivo PDF');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdf', uploadForm.file);
      formData.append('nombre', uploadForm.nombre || `Plan Nutricional ${new Date().toLocaleDateString()}`);
      formData.append('descripcion', uploadForm.descripcion);

      const isPDF = uploadForm.file.name.toLowerCase().endsWith('.pdf');
      if (isPDF) {
        try {
          setExtractionStatus('Extrayendo texto del PDF...');
          const textoExtraido = await extractTextFromPDF(uploadForm.file, (progress) => {
            setUploadProgress(Math.round(progress * 0.5));
          });
          if (textoExtraido && textoExtraido.length > 50) {
            formData.append('texto_extraido', textoExtraido);
          }
          setExtractionStatus('');
        } catch (pdfError) {
          console.warn('Error extrayendo texto del PDF en cliente, se usará extracción del servidor:', pdfError);
          setExtractionStatus('');
        }
      }

      const response = await api.post(`/nutricion/planes/upload/${especialistaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(isPDF ? 50 + Math.round(progress * 0.5) : progress);
        }
      });

      if (response.data) {
        alert('Plan creado exitosamente');
        setShowUploadModal(false);
        setUploadForm({ nombre: '', descripcion: '', file: null });
        loadPlanes();

        if (response.data.plan_id) {
          loadPlanDetail(response.data.plan_id);
        }
      }
    } catch (error) {
      console.error('Error subiendo plan:', error);
      alert('Error al subir el plan: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setExtractionStatus('');
    }
  };

  const loadPlanDetail = async (planId) => {
    try {
      const response = await api.get(`/nutricion/planes/${planId}`);
      setShowPlanDetail(response.data);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };

  const handleAddRecetaToPlan = async (receta) => {
    if (!showPlanDetail) return;
    try {
      await api.post(`/nutricion/planes/${showPlanDetail.id}/recetas`, {
        recetas: [{ receta_id: receta.id, tipo_comida: receta.tipo_comida_nombre || 'almuerzo' }]
      });
      setShowRecetaSelector(false);
      loadPlanDetail(showPlanDetail.id);
    } catch (error) {
      console.error('Error agregando receta:', error);
      alert('Error al agregar la receta');
    }
  };

  const handleRemoveReceta = async (comidaId) => {
    if (!showPlanDetail || !window.confirm('¿Eliminar esta receta del plan?')) return;
    try {
      await api.delete(`/nutricion/planes/${showPlanDetail.id}/recetas/${comidaId}`);
      loadPlanDetail(showPlanDetail.id);
    } catch (error) {
      console.error('Error eliminando receta:', error);
    }
  };

  const handleUploadImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !showPlanDetail) return;
    setUploadingImagen(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      formData.append('titulo', file.name.replace(/\.[^.]+$/, ''));
      await api.post(`/nutricion/planes/${showPlanDetail.id}/imagenes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadPlanDetail(showPlanDetail.id);
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImagen(false);
      if (imagenInputRef.current) imagenInputRef.current.value = '';
    }
  };

  const handleRemoveImagen = async (path) => {
    if (!showPlanDetail || !window.confirm('¿Eliminar esta imagen del plan?')) return;
    try {
      await api.delete(`/nutricion/planes/${showPlanDetail.id}/imagenes`, { data: { path } });
      loadPlanDetail(showPlanDetail.id);
    } catch (error) {
      console.error('Error eliminando imagen:', error);
    }
  };

  const handleAsignar = async () => {
    if (!asignarForm.paciente_id) {
      alert('Selecciona un usuario');
      return;
    }

    try {
      await api.post(`/nutricion/planes/${showAsignarModal.id}/asignar`, {
        paciente_id: asignarForm.paciente_id,
        especialista_id: especialistaId,
        fecha_inicio: asignarForm.fecha_inicio,
        notas: asignarForm.notas
      });

      alert('Plan asignado exitosamente');
      setShowAsignarModal(null);
      setAsignarForm({ paciente_id: '', fecha_inicio: new Date().toISOString().split('T')[0], notas: '' });
      loadPlanes();
    } catch (error) {
      console.error('Error asignando plan:', error);
      alert('Error al asignar el plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('¿Estás seguro de eliminar este plan?')) return;

    try {
      await api.delete(`/nutricion/planes/${planId}`);
      alert('Plan eliminado');
      loadPlanes();
    } catch (error) {
      console.error('Error eliminando plan:', error);
      alert(error.response?.data?.message || 'Error al eliminar el plan');
    }
  };

  const getDiaSemanaActual = () => {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[new Date().getDay()];
  };

  const renderUploadModal = () => (
    <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
      <div className="modal-content plan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><LucideIcon name="file-text" size={22} /> Subir Plan Nutricional (PDF)</h2>
          {!uploading && (
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
          )}
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Nombre del plan</label>
            <input
              type="text"
              value={uploadForm.nombre}
              onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })}
              placeholder="Ej: Plan de pérdida de peso"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={uploadForm.descripcion}
              onChange={(e) => setUploadForm({ ...uploadForm, descripcion: e.target.value })}
              placeholder="Descripción del plan..."
              className="form-input form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Archivo del Plan (PDF o Word) *</label>
            <div className="file-upload-area">
              <input
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                id="pdf-upload"
                className="file-input"
              />
              <label htmlFor="pdf-upload" className="file-label">
                {uploadForm.file ? (
                  <>
                    <span className="file-icon"><LucideIcon name={uploadForm.file.name.endsWith('.docx') || uploadForm.file.name.endsWith('.doc') ? 'pen-line' : 'file-text'} size={20} /></span>
                    <span className="file-name">{uploadForm.file.name}</span>
                    <span className="file-size">({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon"><LucideIcon name="upload" size={24} /></span>
                    <span>Haz clic o arrastra un archivo PDF o Word (.docx)</span>
                    <span className="file-hint">Máximo 10MB - Se recomienda DOCX para mejor extracción</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-text">
                {extractionStatus || (uploadProgress < 100 ? `Subiendo... ${uploadProgress}%` : 'Procesando plan...')}
              </span>
            </div>
          )}

          <div className="upload-info">
            <h4><LucideIcon name="info" size={18} /> Informacion</h4>
            <p>El sistema procesará automáticamente el PDF para extraer:</p>
            <ul>
              <li>Comidas y horarios</li>
              <li>Información nutricional (calorías, proteínas, etc.)</li>
              <li>Recomendaciones y restricciones</li>
            </ul>
            <p>Podrás editar y ajustar el contenido después de la carga.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!uploadForm.file || uploading}
          >
            {uploading ? 'Procesando...' : 'Subir y Procesar'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlanDetailModal = () => {
    if (!showPlanDetail) return null;

    const plan = showPlanDetail;
    const contenido = plan.contenido || {};

    const esGenerado = contenido.generado_con_catalogo === true;
    const esEquivalentes = contenido.tipo === 'equivalentes';

    return (
      <div className="modal-overlay" onClick={() => setShowPlanDetail(null)}>
        <div className="modal-content plan-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2><LucideIcon name="clipboard" size={22} /> {plan.nombre}</h2>
            <button className="modal-close" onClick={() => setShowPlanDetail(null)}>✕</button>
          </div>
          <div className="modal-body">
            {esEquivalentes ? (
              <>
                <VistaEquivalentes plan={plan} contenido={contenido} />

                {(() => {
                  const recetasAdjuntas = (plan.comidas || []).filter(c => c.receta_id);
                  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                  return (
                    <div className="plan-recetas-section">
                      <div className="plan-section-header">
                        <h3><LucideIcon name="book-open" size={20} /> Recetas del Plan ({recetasAdjuntas.length})</h3>
                        <button className="btn-add-small" onClick={() => setShowRecetaSelector(true)}>
                          <LucideIcon name="plus" size={16} /> Agregar
                        </button>
                      </div>
                      {recetasAdjuntas.length > 0 ? (
                        <div className="recetas-adjuntas-list">
                          {recetasAdjuntas.map((c) => (
                            <div key={c.id} className="receta-adjunta-card">
                              {(c.imagen_url || c.receta_imagen) && (
                                <img
                                  src={`${apiUrl}${c.receta_imagen || c.imagen_url}`}
                                  alt={c.receta_titulo || c.nombre_plato}
                                  className="receta-adjunta-img"
                                />
                              )}
                              <div className="receta-adjunta-info">
                                <span className="receta-adjunta-nombre">{c.receta_titulo || c.nombre_plato}</span>
                                <span className="receta-adjunta-tipo">{c.tipo_comida}</span>
                                {c.calorias > 0 && <span className="receta-adjunta-kcal">{c.calorias} kcal</span>}
                              </div>
                              <button className="btn-remove-small" onClick={() => handleRemoveReceta(c.id)} title="Eliminar receta">
                                <LucideIcon name="trash-2" size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-hint">Sin recetas adjuntas. Agrega recetas del catálogo para el usuario.</p>
                      )}
                    </div>
                  );
                })()}

                {(() => {
                  const imagenes = contenido.imagenes || [];
                  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                  return (
                    <div className="plan-imagenes-section">
                      <div className="plan-section-header">
                        <h3><LucideIcon name="image" size={20} /> Material Visual ({imagenes.length})</h3>
                        <button className="btn-add-small" onClick={() => imagenInputRef.current?.click()} disabled={uploadingImagen}>
                          <LucideIcon name={uploadingImagen ? 'loader' : 'upload'} size={16} />
                          {uploadingImagen ? 'Subiendo...' : 'Subir Imagen'}
                        </button>
                        <input
                          ref={imagenInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          style={{ display: 'none' }}
                          onChange={handleUploadImagen}
                        />
                      </div>
                      {imagenes.length > 0 ? (
                        <div className="plan-imagenes-grid">
                          {imagenes.map((item, idx) => {
                            const imgPath = item.path || item;
                            return (
                              <div key={idx} className="plan-imagen-card">
                                <img
                                  src={`${apiUrl}${imgPath}`}
                                  alt={item.titulo || `Imagen ${idx + 1}`}
                                  className="plan-imagen-img"
                                  onClick={() => window.open(`${apiUrl}${imgPath}`, '_blank')}
                                />
                                <div className="plan-imagen-overlay">
                                  <span>{item.titulo || `Imagen ${idx + 1}`}</span>
                                  <button className="btn-remove-img" onClick={() => handleRemoveImagen(imgPath)} title="Eliminar">
                                    <LucideIcon name="trash-2" size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="empty-hint">Sin imágenes. Sube fotos de platillos, porciones o material de apoyo.</p>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : esGenerado ? (
              <VistaPlan plan={plan} contenido={contenido} compact />
            ) : (
              <>
                {contenido.paciente && (
                  <div className="plan-paciente-info">
                    <span className="paciente-badge"><LucideIcon name="user" size={16} /> {contenido.paciente}</span>
                    {contenido.fecha && <span className="fecha-badge"><LucideIcon name="calendar" size={16} /> {contenido.fecha}</span>}
                  </div>
                )}

                {plan.descripcion && (
                  <p className="plan-descripcion">{plan.descripcion}</p>
                )}

                {contenido.objetivo && (
                  <div className="plan-objetivo">
                    <strong><LucideIcon name="target" size={16} /> Objetivo:</strong> {contenido.objetivo}
                  </div>
                )}

                <div className="plan-totales">
                  {contenido.totales?.estimado && (
                    <div className="estimado-badge">
                      <span><LucideIcon name="bar-chart" size={16} /> Valores estimados</span>
                    </div>
                  )}
                  <div className="totales-grid">
                    <div className="total-item calorias">
                      <span className="total-icon"><LucideIcon name="flame" size={18} /></span>
                      <span className="total-value">{Math.round(Number(plan.calorias_diarias || contenido.totales?.calorias || 0))}</span>
                      <span className="total-label">kcal/día</span>
                    </div>
                    <div className="total-item proteinas">
                      <span className="total-icon"><LucideIcon name="beef" size={18} /></span>
                      <span className="total-value">{Number(plan.proteinas_g || contenido.totales?.proteinas || 0).toFixed(0)}g</span>
                      <span className="total-label">Proteínas</span>
                    </div>
                    <div className="total-item carbos">
                      <span className="total-icon"><LucideIcon name="wheat" size={18} /></span>
                      <span className="total-value">{Number(plan.carbohidratos_g || contenido.totales?.carbohidratos || 0).toFixed(0)}g</span>
                      <span className="total-label">Carbohidratos</span>
                    </div>
                    <div className="total-item grasas">
                      <span className="total-icon"><LucideIcon name="droplet" size={18} /></span>
                      <span className="total-value">{Number(plan.grasas_g || contenido.totales?.grasas || 0).toFixed(0)}g</span>
                      <span className="total-label">Grasas</span>
                    </div>
                  </div>
                </div>

                {contenido.indicaciones_generales?.length > 0 && (
                  <div className="plan-indicaciones">
                    <h3><LucideIcon name="pen-line" size={20} /> Indicaciones Generales</h3>
                    <ul className="indicaciones-list">
                      {contenido.indicaciones_generales.map((ind, idx) => (
                        <li key={idx}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="plan-comidas-section">
                  <h3><LucideIcon name="utensils" size={20} /> Menu del Dia</h3>
                  {(contenido.comidas || []).length > 0 ? (
                    <div className="comidas-timeline">
                      {(contenido.comidas || []).map((comida, idx) => {
                        const tiposComidaLabels = {
                          desayuno: { icon: 'sunrise', label: 'Desayuno' },
                          almuerzo: { icon: 'utensils', label: 'Almuerzo' },
                          cena: { icon: 'moon', label: 'Cena' },
                          snack: { icon: 'cookie', label: 'Snack' },
                          merienda: { icon: 'cookie', label: 'Merienda' },
                          media_manana: { icon: 'apple', label: 'Media Mañana' }
                        };
                        const tipoInfo = tiposComidaLabels[comida.tipo_comida] || { icon: 'utensils', label: comida.nombre_original || comida.tipo_comida };

                        return (
                          <div key={idx} className="comida-timeline-item">
                            <div className="comida-timeline-header">
                              <div className="comida-time-badge">
                                <span className="comida-icon"><LucideIcon name={tipoInfo.icon} size={20} /></span>
                                <div className="comida-time-info">
                                  <span className="comida-tipo-label">{tipoInfo.label}</span>
                                  {comida.horario && <span className="comida-horario"><LucideIcon name="alarm-clock" size={14} /> {comida.horario}</span>}
                                </div>
                              </div>
                              {comida.calorias > 0 && (
                                <span className="comida-kcal-badge">~{comida.calorias} kcal</span>
                              )}
                            </div>

                            {comida.opciones && comida.opciones.length > 0 ? (
                              <div className="opciones-container">
                                <div className="opciones-header">
                                  <span className="opciones-count">{comida.opciones.length} {comida.opciones.length === 1 ? 'opción' : 'opciones'}</span>
                                </div>
                                <div className="opciones-grid">
                                  {comida.opciones.map((opcion, opIdx) => (
                                    <div key={opIdx} className="opcion-card-new">
                                      <div className="opcion-card-header">
                                        <span className="opcion-numero">Opción {opcion.numero || opIdx + 1}</span>
                                        {opcion.calorias_estimadas > 0 && (
                                          <span className="opcion-kcal-badge">~{opcion.calorias_estimadas} kcal</span>
                                        )}
                                      </div>
                                      <h4 className="opcion-nombre-new">{opcion.nombre}</h4>
                                      <p className="opcion-descripcion-new">
                                        {opcion.descripcion?.length > 200 ? opcion.descripcion.substring(0, 200) + '...' : opcion.descripcion || 'Ver receta'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="comida-sin-opciones">
                                <p>{comida.nombre_plato || 'Sin opciones detalladas'}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-comidas">
                      <span className="empty-icon"><LucideIcon name="clipboard" size={32} /></span>
                      <p>No se detectaron comidas estructuradas.</p>
                    </div>
                  )}
                </div>

                {contenido.recomendaciones?.length > 0 && (
                  <div className="plan-section">
                    <h3><LucideIcon name="lightbulb" size={20} /> Recomendaciones</h3>
                    <ul>{contenido.recomendaciones.map((rec, idx) => <li key={idx}>{rec}</li>)}</ul>
                  </div>
                )}

                {contenido.restricciones?.length > 0 && (
                  <div className="plan-section">
                    <h3><LucideIcon name="alert-triangle" size={20} /> Restricciones</h3>
                    <ul>{contenido.restricciones.map((res, idx) => <li key={idx}>{res}</li>)}</ul>
                  </div>
                )}

                {(contenido.graficas?.length > 0 || contenido.imagenes?.length > 0) && (
                  <div className="plan-graficas-section">
                    <h3><LucideIcon name="bar-chart" size={20} /> Material Visual</h3>
                    <div className="graficas-grid">
                      {(contenido.graficas || contenido.imagenes || []).map((item, idx) => {
                        const imagen = item.imagen || item;
                        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                        const imagePath = imagen.path || imagen;
                        return (
                          <div key={idx} className="grafica-card">
                            <div className="grafica-image-container">
                              <img src={`${apiUrl}${imagePath}`} alt={item.titulo || `Gráfica ${idx + 1}`} className="grafica-image"
                                onClick={() => window.open(`${apiUrl}${imagePath}`, '_blank')} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {contenido.texto_original && (
                  <details className="texto-original-section">
                    <summary><LucideIcon name="pen-line" size={16} /> Ver texto extraido del PDF</summary>
                    <pre className="texto-original">{contenido.texto_original}</pre>
                  </details>
                )}
              </>
            )}

            {plan.pacientes_asignados?.length > 0 && (
              <div className="plan-section">
                <h3><LucideIcon name="users" size={20} /> Usuarios Asignados ({plan.pacientes_asignados.length})</h3>
                <div className="pacientes-asignados-list">
                  {plan.pacientes_asignados.map((p) => (
                    <div key={p.id} className="paciente-asignado">
                      <span className="paciente-nombre">{p.nombre_completo}</span>
                      <span className="paciente-fecha">Desde: {new Date(p.fecha_inicio).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowPlanDetail(null)}>Cerrar</button>
            <button className="btn-primary" onClick={() => { setShowAsignarModal(plan); setShowPlanDetail(null); }}>
              Asignar a Usuario
            </button>
          </div>
        </div>

        {showRecetaSelector && (
          <div className="modal-overlay receta-selector-overlay" onClick={() => setShowRecetaSelector(false)}>
            <div className="modal-content receta-selector-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2><LucideIcon name="book-open" size={22} /> Seleccionar Receta</h2>
                <button className="modal-close" onClick={() => setShowRecetaSelector(false)}>✕</button>
              </div>
              <div className="modal-body receta-selector-body">
                <CatalogoRecetas
                  selectionMode
                  onSelectReceta={handleAddRecetaToPlan}
                  onBack={() => setShowRecetaSelector(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAsignarModal = () => {
    if (!showAsignarModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowAsignarModal(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2><LucideIcon name="user" size={22} /> Asignar Plan a Usuario</h2>
            <button className="modal-close" onClick={() => setShowAsignarModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <p className="modal-subtitle">
              Plan: <strong>{showAsignarModal.nombre}</strong>
            </p>

            <div className="form-group">
              <label>Seleccionar Usuario *</label>
              <select
                value={asignarForm.paciente_id}
                onChange={(e) => setAsignarForm({ ...asignarForm, paciente_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- Seleccionar --</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input
                type="date"
                value={asignarForm.fecha_inicio}
                onChange={(e) => setAsignarForm({ ...asignarForm, fecha_inicio: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Notas personalizadas (opcional)</label>
              <textarea
                value={asignarForm.notas}
                onChange={(e) => setAsignarForm({ ...asignarForm, notas: e.target.value })}
                placeholder="Ajustes específicos para este usuario..."
                className="form-input form-textarea"
                rows="3"
              />
            </div>

            <div className="asignar-warning">
              <p><LucideIcon name="alert-triangle" size={16} /> Si el usuario ya tiene un plan activo, sera reemplazado por este nuevo plan.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn-secondary"
              onClick={() => setShowAsignarModal(null)}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleAsignar}
              disabled={!asignarForm.paciente_id}
            >
              Asignar Plan
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="planes-loading">
        <div className="loading-spinner"></div>
        <p>Cargando planes nutricionales...</p>
      </div>
    );
  }

  return (
    <div className="planes-nutricionales-container">
      <div className="planes-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver
        </button>
        <h2><LucideIcon name="utensils" size={22} /> Planes Nutricionales</h2>
        <div className="planes-header-actions">
          {/* 👇 Botón del Editor de Porciones integrado con el estilo gris de la interfaz */}
          <button className="btn-generar-plan" style={{ backgroundColor: '#4a5568' }} onClick={() => setShowEditorPorciones(true)}>
            <LucideIcon name="settings" size={16} /> Configurar Porciones
          </button>

          {onOpenGenerator && (
            <button className="btn-generar-plan" onClick={onOpenGenerator}>
              <LucideIcon name="cooking-pot" size={16} /> Generar Plan
            </button>
          )}
          <button className="btn-nuevo-plan" onClick={() => setShowUploadModal(true)}>
            <LucideIcon name="upload" size={16} /> Subir PDF
          </button>
        </div>
      </div>

      {planes.length === 0 ? (
        <div className="empty-planes">
          <span className="empty-icon"><LucideIcon name="clipboard" size={40} /></span>
          <h3>No tienes planes nutricionales</h3>
          <p>Sube un PDF con un plan nutricional para comenzar</p>
          <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
            <LucideIcon name="upload" size={16} /> Subir Primer Plan
          </button>
        </div>
      ) : (
        <div className="planes-grid">
          {planes.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.estado}`}>
              <div className="plan-card-header">
                <h3>{plan.nombre}</h3>
                <span className={`plan-estado ${plan.estado}`}>{plan.estado}</span>
              </div>

              {plan.descripcion && (
                <p className="plan-card-desc">{plan.descripcion}</p>
              )}

              <div className="plan-card-stats">
                {plan.calorias_diarias && (
                  <span className="stat"><LucideIcon name="flame" size={14} /> {plan.calorias_diarias} kcal</span>
                )}
                <span className="stat"><LucideIcon name="users" size={14} /> {plan.pacientes_asignados || 0} usuarios</span>
              </div>

              <div className="plan-card-date">
                Creado: {new Date(plan.created_at).toLocaleDateString()}
              </div>

              <div className="plan-card-actions">
                <button
                  className="btn-ver"
                  onClick={() => loadPlanDetail(plan.id)}
                >
                  Ver Detalle
                </button>
                <button
                  className="btn-asignar"
                  onClick={() => setShowAsignarModal(plan)}
                >
                  Asignar
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => handleDeletePlan(plan.id)}
                  title="Eliminar plan"
                >
                  <LucideIcon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 👇 Renderizado de tu nuevo Modal para configurar los grupos de alimentos */}
      {showEditorPorciones && (
        <div className="modal-overlay" onClick={() => setShowEditorPorciones(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%' }}>
            <div className="modal-header">
              <h2><LucideIcon name="settings" size={22} /> Editor de Grupos de Alimentos y Porciones</h2>
              <button className="modal-close" onClick={() => setShowEditorPorciones(false)}>✕</button>
            </div>
            <div className="modal-body">
              <EditorGrupoAlimentos especialistaId={especialistaId} onSave={() => setShowEditorPorciones(false)} />
            </div>
          </div>
        </div>
      )}

      {showUploadModal && renderUploadModal()}
      {showPlanDetail && renderPlanDetailModal()}
      {showAsignarModal && renderAsignarModal()}
    </div>
  );
};

export default PlanesNutricionales;