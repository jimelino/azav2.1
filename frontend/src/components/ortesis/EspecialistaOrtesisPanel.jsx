import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './EspecialistaOrtesisPanel.css';

const emptyManual = { categoria: 'protesis', titulo: '', subtitulo: '', contenido: '', objetivos: [], tipos_comunes: [], orden: 0 };
const emptyVideo = { categoria: 'protesis', titulo: '', descripcion: '', url_video: '', subcategoria: '', orden: 0 };

const unwrap = (response, fallback) => response?.data ?? response ?? fallback;

const EspecialistaOrtesisPanel = () => {
  const [tab, setTab] = useState('alertas');
  const [grupos, setGrupos] = useState([]);
  const [contenido, setContenido] = useState({ manuales: [], videos: [] });
  const [manual, setManual] = useState(emptyManual);
  const [video, setVideo] = useState(emptyVideo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingManualId, setEditingManualId] = useState(null);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportes, educativo] = await Promise.all([
        api.get('/ortesis/especialista/reportes-molestias'),
        api.get('/ortesis/especialista/contenido')
      ]);
      setGrupos(unwrap(reportes, []));
      setContenido(unwrap(educativo, { manuales: [], videos: [] }));
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el panel de Ortesis y Protesis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const actualizarReporte = async (id, estado) => {
    await api.put(`/ortesis/especialista/reportes-molestias/${id}`, { estado });
    cargar();
  };

  const crearManual = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingManualId) await api.put(`/ortesis/especialista/manuales/${editingManualId}`, manual);
      else await api.post('/ortesis/especialista/manuales', manual);
      setManual(emptyManual);
      setEditingManualId(null);
      cargar();
    } finally { setSaving(false); }
  };

  const crearVideo = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingVideoId) await api.put(`/ortesis/especialista/videos/${editingVideoId}`, video);
      else await api.post('/ortesis/especialista/videos', video);
      setVideo(emptyVideo);
      setEditingVideoId(null);
      cargar();
    } finally { setSaving(false); }
  };

  const desactivar = async (type, id) => {
    if (!window.confirm('¿Quieres ocultar este contenido para los pacientes?')) return;
    await api.delete(`/ortesis/especialista/${type}/${id}`);
    cargar();
  };

  return (
    <section className="specialist-ortesis-panel">
      <div className="specialist-panel-heading">
        <div><span className="eyebrow">Ortesis y Protesis</span><h1>Gestion clinica</h1></div>
        <button type="button" className="panel-refresh-btn" onClick={cargar} aria-label="Actualizar panel"><LucideIcon name="refresh-cw" size={18} /></button>
      </div>
      <div className="specialist-panel-tabs" role="tablist">
        <button className={tab === 'alertas' ? 'active' : ''} onClick={() => setTab('alertas')} role="tab">Alertas y reportes</button>
        <button className={tab === 'contenido' ? 'active' : ''} onClick={() => setTab('contenido')} role="tab">Contenido educativo</button>
      </div>
      {error && <p className="panel-error" role="alert">{error}</p>}
      {loading ? <p className="panel-empty">Cargando panel...</p> : tab === 'alertas' ? (
        <div className="report-groups">
          {grupos.length === 0 && <p className="panel-empty">No hay reportes pendientes de atención.</p>}
          {grupos.map((grupo) => (
            <article className="report-group" key={grupo.paciente_id}>
              <div className="report-group-heading"><div><h2>{grupo.paciente_nombre}</h2><span>{grupo.reportes.length} reporte(s)</span></div><LucideIcon name="user" size={22} /></div>
              {grupo.reportes.map((reporte) => (
                <div className="report-item" key={reporte.id}>
                  <div><strong>{reporte.prioridad === 'urgente' ? 'Reporte urgente' : 'Reporte de molestia'}</strong><p>{reporte.descripcion}</p><small>{new Date(reporte.fecha_reporte).toLocaleString('es-MX')}</small></div>
                  <div className="report-item-actions">
                    <span className={`report-status status-${reporte.estado}`}>{reporte.estado.replace('_', ' ')}</span>
                    {reporte.evidencia_foto_url && <a href={reporte.evidencia_foto_url} target="_blank" rel="noreferrer">Evidencia</a>}
                    <Link to={`/especialista/chat?paciente_id=${reporte.paciente_id}`}>Responder en chat</Link>
                    {reporte.estado !== 'resuelto' && <button onClick={() => actualizarReporte(reporte.id, 'en_revision')}>Tomar reporte</button>}
                    {reporte.estado !== 'resuelto' && <button onClick={() => actualizarReporte(reporte.id, 'resuelto')}>Resolver</button>}
                  </div>
                </div>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <div className="content-management-grid">
          <div className="content-list"><h2>Manuales</h2>{contenido.manuales.map((item) => <div className="content-list-item" key={item.id}><div><strong>{item.titulo}</strong><span>{item.categoria} · {item.activo ? 'Visible' : 'Oculto'}</span></div>{item.activo ? <div className="content-item-actions"><button onClick={() => { setManual({ ...item, objetivos: item.objetivos || [], tipos_comunes: item.tipos_comunes || [] }); setEditingManualId(item.id); }} aria-label={`Editar ${item.titulo}`}><LucideIcon name="edit-3" size={16} /></button><button onClick={() => desactivar('manuales', item.id)} aria-label={`Ocultar ${item.titulo}`}><LucideIcon name="trash-2" size={16} /></button></div> : null}</div>)}</div>
          <form className="content-form" onSubmit={crearManual}><h2>{editingManualId ? 'Editar manual' : 'Nuevo manual'}</h2><select value={manual.categoria} onChange={e => setManual({ ...manual, categoria: e.target.value })}><option value="protesis">Protesis</option><option value="ortesis">Ortesis</option><option value="general">General</option></select><input required placeholder="Titulo" value={manual.titulo} onChange={e => setManual({ ...manual, titulo: e.target.value })} /><input placeholder="Subtitulo" value={manual.subtitulo || ''} onChange={e => setManual({ ...manual, subtitulo: e.target.value })} /><textarea required placeholder="Contenido" value={manual.contenido} onChange={e => setManual({ ...manual, contenido: e.target.value })} /><button disabled={saving}>{editingManualId ? 'Actualizar manual' : 'Guardar manual'}</button></form>
          <div className="content-list"><h2>Videotutoriales</h2>{contenido.videos.map((item) => <div className="content-list-item" key={item.id}><div><strong>{item.titulo}</strong><span>{item.categoria} · {item.activo ? 'Visible' : 'Oculto'}</span></div>{item.activo ? <div className="content-item-actions"><button onClick={() => { setVideo(item); setEditingVideoId(item.id); }} aria-label={`Editar ${item.titulo}`}><LucideIcon name="edit-3" size={16} /></button><button onClick={() => desactivar('videos', item.id)} aria-label={`Ocultar ${item.titulo}`}><LucideIcon name="trash-2" size={16} /></button></div> : null}</div>)}</div>
          <form className="content-form" onSubmit={crearVideo}><h2>{editingVideoId ? 'Editar videotutorial' : 'Nuevo videotutorial'}</h2><select value={video.categoria} onChange={e => setVideo({ ...video, categoria: e.target.value })}><option value="protesis">Protesis</option><option value="ortesis">Ortesis</option></select><input required placeholder="Titulo" value={video.titulo} onChange={e => setVideo({ ...video, titulo: e.target.value })} /><input required type="url" placeholder="URL del video" value={video.url_video} onChange={e => setVideo({ ...video, url_video: e.target.value })} /><textarea required placeholder="Descripcion" value={video.descripcion} onChange={e => setVideo({ ...video, descripcion: e.target.value })} /><button disabled={saving}>{editingVideoId ? 'Actualizar video' : 'Guardar video'}</button></form>
        </div>
      )}
    </section>
  );
};

export default EspecialistaOrtesisPanel;
