import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './OrtesisEsp.css';

const NIVELES_K = ['K0', 'K1', 'K2', 'K3', 'K4'];

const DispositivosPacientes = ({ pacienteId, onBack }) => {
  const [dispositivo, setDispositivo] = useState(null);
  const [problemas, setProblemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editNivelK, setEditNivelK] = useState(false);
  const [nuevoNivelK, setNuevoNivelK] = useState('');
  const [resolviendoId, setResolviendoId] = useState(null);
  const [notasResolucion, setNotasResolucion] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dispRes, probRes] = await Promise.all([
        api.get(`/ortesis/dispositivo/${pacienteId}`),
        api.get(`/ortesis/problemas/${pacienteId}`)
      ]);
      setDispositivo(dispRes?.data || null);
      setProblemas(probRes?.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarNivelK = async () => {
    if (!nuevoNivelK) return;
    try {
      await api.put(`/ortesis/dispositivo/${pacienteId}/nivel-k`, { nivel_k: nuevoNivelK });
      setEditNivelK(false);
      cargarDatos();
    } catch (err) {
      console.error('Error actualizando nivel K:', err);
    }
  };

  const resolverProblema = async (problemaId) => {
    try {
      await api.put(`/ortesis/problemas/${problemaId}/resolver`, {
        notas_resolucion: notasResolucion
      });
      setResolviendoId(null);
      setNotasResolucion('');
      cargarDatos();
    } catch (err) {
      console.error('Error resolviendo problema:', err);
    }
  };

  if (loading) {
    return (
      <section className="ortesis-module">
        <div className="ortesis-loading">
          <div className="ortesis-spinner"></div>
          <p>Cargando dispositivo...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ortesis-module">
      <div className="module-header">
        <button className="back-btn" onClick={onBack}>
          <LucideIcon name="arrow-left" size={18} /> Volver
        </button>
        <h2 className="module-title">
          <LucideIcon name="accessibility" size={22} /> Dispositivo del Usuario
        </h2>
      </div>

      {/* Info del dispositivo */}
      {dispositivo?.tiene_dispositivo ? (
        <>
          <div className="ortesis-info-card">
            <div className="card-title">
              <LucideIcon name="info" size={18} /> Información del Dispositivo
            </div>
            <div className="ortesis-info-grid">
              <div className="ortesis-info-item">
                <span className="label">Tipo</span>
                <span className="value">{dispositivo.tipo_protesis_nombre || 'No especificado'}</span>
              </div>
              <div className="ortesis-info-item">
                <span className="label">Marca</span>
                <span className="value">{dispositivo.marca || '—'}</span>
              </div>
              <div className="ortesis-info-item">
                <span className="label">Modelo</span>
                <span className="value">{dispositivo.modelo || '—'}</span>
              </div>
              <div className="ortesis-info-item">
                <span className="label">No. Serie</span>
                <span className="value">{dispositivo.numero_serie || '—'}</span>
              </div>
              <div className="ortesis-info-item">
                <span className="label">Fecha Entrega</span>
                <span className="value">
                  {dispositivo.fecha_entrega
                    ? new Date(dispositivo.fecha_entrega).toLocaleDateString('es-MX')
                    : '—'}
                </span>
              </div>
              <div className="ortesis-info-item">
                <span className="label">Categoría</span>
                <span className="value">{dispositivo.categoria || '—'}</span>
              </div>
            </div>
          </div>

          {/* Nivel K */}
          <div className="ortesis-info-card">
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LucideIcon name="gauge" size={18} /> Nivel Funcional (K)
              </span>
              {!editNivelK && (
                <button className="ortesis-btn ortesis-btn-secondary ortesis-btn-sm" onClick={() => {
                  setNuevoNivelK(dispositivo.nivel_k || 'K0');
                  setEditNivelK(true);
                }}>
                  <LucideIcon name="edit" size={14} /> Cambiar
                </button>
              )}
            </div>
            {editNivelK ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {NIVELES_K.map(nk => (
                  <button
                    key={nk}
                    className={`ortesis-tab ${nuevoNivelK === nk ? 'active' : ''}`}
                    onClick={() => setNuevoNivelK(nk)}
                    style={{ minWidth: '60px' }}
                  >
                    {nk}
                  </button>
                ))}
                <button className="ortesis-btn ortesis-btn-primary ortesis-btn-sm" onClick={actualizarNivelK}>
                  Guardar
                </button>
                <button className="ortesis-btn ortesis-btn-secondary ortesis-btn-sm" onClick={() => setEditNivelK(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="ortesis-nivel-k">{dispositivo.nivel_k || 'Sin evaluar'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                  {dispositivo.nivel_k_descripcion || ''}
                </span>
              </div>
            )}
            {dispositivo.fecha_evaluacion_k && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Última evaluación: {new Date(dispositivo.fecha_evaluacion_k).toLocaleDateString('es-MX')}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="ortesis-no-device">
          <LucideIcon name="alert-circle" size={40} />
          <h4>Sin dispositivo registrado</h4>
          <p>Este usuario aún no tiene un dispositivo protésico asignado en el sistema.</p>
        </div>
      )}

      {/* Problemas reportados */}
      <div className="ortesis-info-card">
        <div className="card-title">
          <LucideIcon name="alert-triangle" size={18} /> Problemas Reportados ({problemas.length})
        </div>

        {problemas.length > 0 ? (
          <div className="ortesis-list">
            {problemas.map(prob => (
              <div key={prob.id} className="ortesis-list-item">
                <div className="item-header">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`ortesis-status ${prob.severidad}`}>{prob.severidad}</span>
                    <span className={`ortesis-status ${prob.estado}`}>{prob.estado?.replace('_', ' ')}</span>
                  </div>
                  <span className="item-date">
                    {prob.fecha_reporte ? new Date(prob.fecha_reporte).toLocaleDateString('es-MX') : ''}
                  </span>
                </div>
                <p className="item-desc">{prob.descripcion}</p>

                {prob.estado === 'resuelto' && prob.notas_resolucion && (
                  <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(76,175,80,0.08)', borderRadius: '6px' }}>
                    <p style={{ fontSize: '13px', color: '#66BB6A' }}>
                      Resolución: {prob.notas_resolucion}
                    </p>
                    {prob.atendido_por_nombre && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Atendido por: {prob.atendido_por_nombre}
                      </p>
                    )}
                  </div>
                )}

                {prob.estado !== 'resuelto' && (
                  <div className="item-footer">
                    {resolviendoId === prob.id ? (
                      <div style={{ width: '100%' }}>
                        <div className="ortesis-form-group" style={{ marginBottom: '8px' }}>
                          <textarea
                            placeholder="Notas de resolución..."
                            value={notasResolucion}
                            onChange={e => setNotasResolucion(e.target.value)}
                            style={{ minHeight: '60px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="ortesis-btn ortesis-btn-success ortesis-btn-sm" onClick={() => resolverProblema(prob.id)}>
                            <LucideIcon name="check" size={14} /> Marcar Resuelto
                          </button>
                          <button className="ortesis-btn ortesis-btn-secondary ortesis-btn-sm" onClick={() => setResolviendoId(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="ortesis-btn ortesis-btn-success ortesis-btn-sm" onClick={() => setResolviendoId(prob.id)}>
                        <LucideIcon name="check-circle" size={14} /> Resolver
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="ortesis-empty">
            <LucideIcon name="check-circle" size={32} />
            <h4>Sin problemas reportados</h4>
            <p>El usuario no ha reportado ningún problema con su dispositivo</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DispositivosPacientes;
