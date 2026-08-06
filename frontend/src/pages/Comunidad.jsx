import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import '../styles/Comunidad.css';

const REACCIONES = [
  { tipo: 'me_gusta', emoji: '❤️', label: 'Me gusta' },
  { tipo: 'me_inspira', emoji: '💪', label: 'Me inspira' },
  { tipo: 'me_identifico', emoji: '🤝', label: 'Me identifico' },
  { tipo: 'me_motiva', emoji: '🎉', label: 'Me motiva' },
  { tipo: 'apoyo', emoji: '🙏', label: 'Te apoyo' },
];

const Comunidad = () => {
  const { user } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Temas
  const [temas, setTemas] = useState([]);
  const [temaSeleccionado, setTemaSeleccionado] = useState('');

  // Form nueva publicacion
  const [contenido, setContenido] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  // Form comentario
  const [textoComentario, setTextoComentario] = useState('');

  // Reacciones del usuario actual
  const [misReacciones, setMisReacciones] = useState({});

  // Editar publicacion
  const [editandoPost, setEditandoPost] = useState(null);
  const [editContenido, setEditContenido] = useState('');
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const pestanaVisibleRef = useRef(true);

  // Cargar publicaciones. En modo silencioso (polling de fondo) no toca el
  // spinner ni el estado de error, para no interrumpir al usuario mientras
  // lee o escribe.
  const cargarPublicaciones = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await api.get('/comunidad/feed');
      const posts = response?.data || response || [];
      const lista = Array.isArray(posts) ? posts : [];
      setPublicaciones(lista);

      // Refleja si el usuario ya reaccionó a cada publicación (el feed lo
      // trae ahora); sin esto, el "me gusta" se veía "apagado" tras recargar
      // aunque el contador sí fuera correcto.
      setMisReacciones(prev => {
        const next = { ...prev };
        lista.forEach(p => { next[p.id] = p.mi_reaccion || null; });
        return next;
      });
    } catch (err) {
      if (!silencioso) {
        console.error('Error al cargar publicaciones:', err);
        setError('No se pudieron cargar las publicaciones');
        setPublicaciones([]);
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, []);

  // Cargar temas
  const cargarTemas = useCallback(async () => {
    try {
      const response = await api.get('/comunidad/temas');
      const data = response?.data || response || [];
      setTemas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar temas:', err);
    }
  }, []);

  useEffect(() => {
    cargarPublicaciones();
    cargarTemas();
  }, [cargarPublicaciones, cargarTemas]);

  // Pausa el polling cuando la pestaña no está visible
  useEffect(() => {
    const alCambiarVisibilidad = () => {
      pestanaVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad);
  }, []);

  // Refresco silencioso del feed: para ver publicaciones nuevas de otros
  // usuarios sin recargar la página.
  useEffect(() => {
    const interval = setInterval(() => {
      if (pestanaVisibleRef.current) {
        cargarPublicaciones(true);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [cargarPublicaciones]);

  // Cerrar menu al hacer clic fuera
  useEffect(() => {
    if (!menuAbiertoId) return;
    const cerrar = () => setMenuAbiertoId(null);
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, [menuAbiertoId]);

  // Crear publicacion
  const handlePublicar = async (e) => {
    e.preventDefault();
    if (!contenido.trim() || enviando) return;

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('usuario_id', user.id);
      formData.append('contenido', contenido);
      if (temaSeleccionado) {
        formData.append('tema_id', temaSeleccionado);
      }
      if (imagen) {
        formData.append('imagen', imagen);
      }

      await api.post('/comunidad/publicaciones', formData, {
        headers: { 'Content-Type': undefined }
      });

      await cargarPublicaciones();
      setShowCrear(false);
      setContenido('');
      setTemaSeleccionado('');
      setImagen(null);
      setImagenPreview(null);
    } catch (err) {
      console.error('Error al publicar:', err);
      setError('Error al crear la publicacion. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  // Like / reaccion
  const handleReaccion = async (publicacionId, tipo = 'me_gusta') => {
    try {
      const response = await api.post(`/comunidad/publicaciones/${publicacionId}/reaccion`, {
        tipo_reaccion: tipo
      });

      const reacted = response?.data?.reacted ?? response?.reacted;

      setPublicaciones(prev => prev.map(p => {
        if (p.id === publicacionId) {
          return {
            ...p,
            total_reacciones: reacted
              ? (p.total_reacciones || 0) + 1
              : Math.max(0, (p.total_reacciones || 0) - 1)
          };
        }
        return p;
      }));

      setMisReacciones(prev => ({
        ...prev,
        [publicacionId]: reacted ? tipo : null
      }));

      if (selectedPost?.id === publicacionId) {
        setSelectedPost(prev => ({
          ...prev,
          total_reacciones: reacted
            ? (prev.total_reacciones || 0) + 1
            : Math.max(0, (prev.total_reacciones || 0) - 1)
        }));
      }
    } catch (err) {
      console.error('Error al reaccionar:', err);
    }
  };

  // Abrir publicacion con comentarios
  const abrirPublicacion = async (post) => {
    setSelectedPost(post);
    setLoadingComentarios(true);
    try {
      const response = await api.get(`/comunidad/publicaciones/${post.id}/comentarios`);
      const data = response?.data || response || [];
      setComentarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar comentarios:', err);
      setComentarios([]);
    } finally {
      setLoadingComentarios(false);
    }
  };

  // Comentar
  const handleComentar = async (e) => {
    e.preventDefault();
    if (!textoComentario.trim() || !selectedPost || enviando) return;

    setEnviando(true);
    try {
      await api.post(`/comunidad/publicaciones/${selectedPost.id}/comentarios`, {
        contenido: textoComentario
      });

      const response = await api.get(`/comunidad/publicaciones/${selectedPost.id}/comentarios`);
      const data = response?.data || response || [];
      setComentarios(Array.isArray(data) ? data : []);

      setPublicaciones(prev => prev.map(p => {
        if (p.id === selectedPost.id) {
          return { ...p, total_comentarios: (p.total_comentarios || 0) + 1 };
        }
        return p;
      }));

      setSelectedPost(prev => ({
        ...prev,
        total_comentarios: (prev.total_comentarios || 0) + 1
      }));

      setTextoComentario('');
    } catch (err) {
      console.error('Error al comentar:', err);
    } finally {
      setEnviando(false);
    }
  };

  // Abrir edicion
  const abrirEdicion = (post) => {
    setEditandoPost(post);
    setEditContenido(post.contenido);
    setMenuAbiertoId(null);
  };

  // Guardar edicion
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editContenido.trim() || !editandoPost || enviando) return;

    setEnviando(true);
    try {
      const res = await api.put(`/comunidad/publicaciones/${editandoPost.id}`, {
        contenido: editContenido
      });

      const updated = res?.data || res;

      setPublicaciones(prev => prev.map(p => {
        if (p.id === editandoPost.id) {
          return { ...p, contenido: editContenido, ...(updated?.id ? updated : {}) };
        }
        return p;
      }));

      if (selectedPost?.id === editandoPost.id) {
        setSelectedPost(prev => ({ ...prev, contenido: editContenido }));
      }

      setEditandoPost(null);
      setEditContenido('');
    } catch (err) {
      console.error('Error al editar:', err);
      setError('Error al editar la publicacion.');
    } finally {
      setEnviando(false);
    }
  };

  // Eliminar publicacion propia
  const handleEliminar = async (postId) => {
    setMenuAbiertoId(null);
    if (!window.confirm('¿Seguro que quieres eliminar esta publicacion?')) return;
    try {
      await api.delete(`/comunidad/publicaciones/${postId}`);
      setPublicaciones(prev => prev.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // Imagen preview
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  const quitarImagen = () => {
    setImagen(null);
    if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    setImagenPreview(null);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const ahora = new Date();
    const fechaPost = new Date(fecha);
    const diferencia = ahora - fechaPost;

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias} dias`;

    return fechaPost.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const getInicial = (nombre) => {
    if (!nombre) return 'U';
    return nombre.charAt(0).toUpperCase();
  };

  const getNombre = (post) => {
    if (post.es_anonimo) return 'Anonimo';
    return post.autor_nombre || post.nombre_completo || 'Usuario';
  };

  return (
    <div className="comunidad-page">
      <header className="comunidad-header">
        <h1>Comunidad</h1>
        <p className="comunidad-subtitle">Comparte tu experiencia y conecta con otros</p>
      </header>

      {/* Crear publicacion */}
      <div className="crear-post-card" onClick={() => setShowCrear(true)}>
        <div className="crear-post-avatar">
          <span>{getInicial(user?.nombre_completo)}</span>
        </div>
        <div className="crear-post-input">
          <span>¿Que quieres compartir hoy?</span>
        </div>
        <button className="btn-crear-foto" aria-label="Agregar foto">
          <LucideIcon name="camera" size={20} />
        </button>
      </div>

      {/* Banner normas */}
      <div className="normas-banner">
        <LucideIcon name="shield-check" size={18} />
        <span>Recuerda mantener un ambiente respetuoso y de apoyo mutuo</span>
      </div>

      {/* Error */}
      {error && (
        <div className="comunidad-error">
          <p>{error}</p>
          <button onClick={() => { setError(null); cargarPublicaciones(); }} className="btn-reintentar">Reintentar</button>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando publicaciones...</p>
        </div>
      ) : (
        <div className="feed">
          {publicaciones.length > 0 ? publicaciones.map(post => (
            <article key={post.id} className="publicacion-card">
              <div className="publicacion-header">
                <div className="publicacion-avatar">
                  <span>{getInicial(getNombre(post))}</span>
                </div>
                <div className="publicacion-info">
                  <span className="publicacion-nombre">{getNombre(post)}</span>
                  <span className="publicacion-fecha">
                    {formatearFecha(post.created_at)}
                    {post.tema_nombre && (
                      <span className="publicacion-tema"> {post.tema_icono} {post.tema_nombre}</span>
                    )}
                  </span>
                </div>
                {post.usuario_id === user?.id && (
                  <div className="post-menu-wrapper">
                    <button
                      className="btn-opciones"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbiertoId(menuAbiertoId === post.id ? null : post.id);
                      }}
                      aria-label="Opciones"
                    >
                      <LucideIcon name="more-vertical" size={18} />
                    </button>
                    {menuAbiertoId === post.id && (
                      <div className="post-menu-dropdown" onClick={e => e.stopPropagation()}>
                        <button className="post-menu-item" onClick={() => abrirEdicion(post)}>
                          <LucideIcon name="pencil" size={16} />
                          <span>Editar</span>
                        </button>
                        <button className="post-menu-item post-menu-eliminar" onClick={() => handleEliminar(post.id)}>
                          <LucideIcon name="trash-2" size={16} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="publicacion-contenido">
                <p>{post.contenido}</p>
                {post.imagen_url && (
                  <img src={post.imagen_url} alt="" className="publicacion-imagen" loading="lazy" />
                )}
              </div>

              <div className="publicacion-stats">
                <span>{post.total_reacciones || 0} reacciones</span>
                <span className="stats-comentarios" onClick={() => abrirPublicacion(post)}>
                  {post.total_comentarios || 0} comentarios
                </span>
              </div>

              <div className="publicacion-acciones">
                <button
                  className={`btn-accion ${misReacciones[post.id] === 'me_gusta' ? 'reacted' : ''}`}
                  onClick={() => handleReaccion(post.id, 'me_gusta')}
                >
                  <span className="btn-accion-emoji">❤️</span> Me gusta
                </button>
                <button
                  className={`btn-accion ${misReacciones[post.id] === 'apoyo' ? 'reacted' : ''}`}
                  onClick={() => handleReaccion(post.id, 'apoyo')}
                >
                  <span className="btn-accion-emoji">🙏</span> Apoyo
                </button>
                <button
                  className="btn-accion"
                  onClick={() => abrirPublicacion(post)}
                >
                  <LucideIcon name="message-circle" size={16} /> Comentar
                </button>
              </div>
            </article>
          )) : !error && (
            <div className="empty-state">
              <LucideIcon name="users" size={48} />
              <h3>No hay publicaciones aun</h3>
              <p>Se el primero en compartir tu experiencia</p>
              <button className="btn btn-primary" onClick={() => setShowCrear(true)}>
                Crear publicacion
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal crear publicacion */}
      {showCrear && (
        <div className="modal-overlay" onClick={() => setShowCrear(false)}>
          <div className="modal-content modal-crear" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Crear publicacion</h2>
              <button className="modal-close" onClick={() => setShowCrear(false)} aria-label="Cerrar">
                <LucideIcon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handlePublicar}>
              {/* Selector de tema */}
              {temas.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Seccion</label>
                  <div className="temas-selector">
                    {temas.map(tema => (
                      <button
                        key={tema.id}
                        type="button"
                        className={`tema-chip ${temaSeleccionado === String(tema.id) ? 'active' : ''}`}
                        onClick={() => setTemaSeleccionado(
                          temaSeleccionado === String(tema.id) ? '' : String(tema.id)
                        )}
                      >
                        <span className="tema-icono">{tema.icono}</span>
                        <span>{tema.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <textarea
                  value={contenido}
                  onChange={e => setContenido(e.target.value)}
                  placeholder="¿Que quieres compartir con la comunidad?"
                  rows="5"
                  className="form-control comunidad-textarea"
                  maxLength={1000}
                  required
                  autoFocus
                />
                <div className="textarea-footer">
                  <span className="char-count">{contenido.length}/1000</span>
                </div>
              </div>

              {imagenPreview && (
                <div className="imagen-preview">
                  <img src={imagenPreview} alt="Preview" />
                  <button type="button" className="btn-remove-img" onClick={quitarImagen} aria-label="Quitar imagen">
                    <LucideIcon name="x" size={16} />
                  </button>
                </div>
              )}

              <div className="modal-footer">
                <label className="btn-adjuntar" title="Agregar foto">
                  <input type="file" accept="image/*" onChange={handleImagenChange} hidden />
                  <LucideIcon name="image" size={20} />
                  <span>Foto</span>
                </label>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCrear(false)}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-comunidad"
                    disabled={!contenido.trim() || enviando}
                  >
                    {enviando ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ver publicacion + comentarios */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => { setSelectedPost(null); setComentarios([]); }}>
          <div className="modal-content modal-publicacion" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setSelectedPost(null); setComentarios([]); }} aria-label="Cerrar">
              <LucideIcon name="x" size={20} />
            </button>

            <article className="publicacion-completa">
              <div className="publicacion-header">
                <div className="publicacion-avatar">
                  <span>{getInicial(getNombre(selectedPost))}</span>
                </div>
                <div className="publicacion-info">
                  <span className="publicacion-nombre">{getNombre(selectedPost)}</span>
                  <span className="publicacion-fecha">{formatearFecha(selectedPost.created_at)}</span>
                </div>
                {selectedPost.usuario_id === user?.id && (
                  <div className="post-detail-actions">
                    <button
                      className="btn-icon-sm"
                      onClick={() => { abrirEdicion(selectedPost); setSelectedPost(null); }}
                      title="Editar"
                    >
                      <LucideIcon name="pencil" size={16} />
                    </button>
                    <button
                      className="btn-icon-sm btn-icon-danger"
                      onClick={() => handleEliminar(selectedPost.id)}
                      title="Eliminar"
                    >
                      <LucideIcon name="trash-2" size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="publicacion-contenido">
                <p>{selectedPost.contenido}</p>
                {selectedPost.imagen_url && (
                  <img src={selectedPost.imagen_url} alt="" className="publicacion-imagen" />
                )}
              </div>

              <div className="reacciones-bar">
                {REACCIONES.map(r => (
                  <button
                    key={r.tipo}
                    className={`btn-reaccion ${misReacciones[selectedPost.id] === r.tipo ? 'active' : ''}`}
                    onClick={() => handleReaccion(selectedPost.id, r.tipo)}
                    title={r.label}
                  >
                    <span>{r.emoji}</span>
                    <span className="reaccion-label">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="publicacion-stats">
                <span>{selectedPost.total_reacciones || 0} reacciones</span>
                <span>{selectedPost.total_comentarios || 0} comentarios</span>
              </div>

              <div className="comentarios-section">
                <h3>Comentarios</h3>

                <form className="comentario-form" onSubmit={handleComentar}>
                  <input
                    type="text"
                    value={textoComentario}
                    onChange={e => setTextoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="form-control"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="btn btn-comunidad btn-comentar"
                    disabled={!textoComentario.trim() || enviando}
                  >
                    <LucideIcon name="send" size={16} />
                  </button>
                </form>

                {loadingComentarios ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="comentarios-list">
                    {comentarios.length > 0 ? comentarios.map(c => (
                      <div key={c.id} className="comentario">
                        <div className="comentario-avatar">
                          <span>{getInicial(c.es_anonimo ? 'A' : c.autor_nombre)}</span>
                        </div>
                        <div className="comentario-body">
                          <div className="comentario-header">
                            <span className="comentario-usuario">
                              {c.es_anonimo ? 'Anonimo' : (c.autor_nombre || 'Usuario')}
                            </span>
                            <span className="comentario-fecha">{formatearFecha(c.created_at)}</span>
                          </div>
                          <p className="comentario-texto">{c.contenido}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="no-comentarios">No hay comentarios aun. ¡Se el primero!</p>
                    )}
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      )}
      {/* Modal editar publicacion */}
      {editandoPost && (
        <div className="modal-overlay" onClick={() => setEditandoPost(null)}>
          <div className="modal-content modal-crear" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Editar publicacion</h2>
              <button className="modal-close" onClick={() => setEditandoPost(null)} aria-label="Cerrar">
                <LucideIcon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion}>
              <div className="form-group">
                <textarea
                  value={editContenido}
                  onChange={e => setEditContenido(e.target.value)}
                  rows="5"
                  className="form-control comunidad-textarea"
                  maxLength={1000}
                  required
                  autoFocus
                />
                <div className="textarea-footer">
                  <span className="char-count">{editContenido.length}/1000</span>
                </div>
              </div>

              <div className="modal-footer">
                <div></div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditandoPost(null)}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-comunidad"
                    disabled={!editContenido.trim() || enviando}
                  >
                    {enviando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comunidad;
