import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './HistorialPlanes.css';

const HistorialPlanes = ({ pacienteId, especialistaId, onBack }) => {
  const [planes, setPlanes] = useState([]);
  const [planActivo, setPlanActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detallePlan, setDetallePlan] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [pacienteId, especialistaId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [planesRes, activoRes] = await Promise.all([
        api.get(`/nutricion/planes/especialista/${especialistaId}`),
        api.get(`/nutricion/plan-paciente/${pacienteId}`)
      ]);

      const todosPlanes = planesRes.data?.planes || [];
      const activo = activoRes.data;

      // Filtrar planes que han sido asignados a este paciente
      const planesDelPaciente = todosPlanes.filter(p =>
        p.contenido?.paciente || (p.pacientes_asignados && p.pacientes_asignados > 0)
      );

      setPlanes(planesDelPaciente.length > 0 ? planesDelPaciente : todosPlanes);
      setPlanActivo(activo?.tiene_plan ? activo : null);
    } catch (error) {
      console.error('Error cargando planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (planId) => {
    try {
      const res = await api.get(`/nutricion/planes/${planId}`);
      setDetallePlan(res.data || res);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };

  if (loading) {
    return (
      <div className="hist-planes-loading">
        <div className="hist-planes-spinner"></div>
        <p>Cargando historial de planes...</p>
      </div>
    );
  }

  return (
    <div className="hist-planes-container">
      <div className="hist-planes-header">
        <div className="hist-planes-header-top">
          <button className="hist-planes-back-btn" onClick={onBack}>
            <LucideIcon name="arrow-left" size={22} />
          </button>
          <div className="hist-planes-header-title">
            <LucideIcon name="file-text" size={24} />
            <h2>Historial de Planes</h2>
          </div>
        </div>
      </div>

      {/* Plan activo */}
      {planActivo && (
        <div className="hist-planes-activo">
          <div className="hist-planes-activo-badge">
            <LucideIcon name="check-circle" size={16} /> Plan Activo
          </div>
          <h3>{planActivo.nombre}</h3>
          {planActivo.descripcion && <p>{planActivo.descripcion}</p>}
          <div className="hist-planes-activo-meta">
            <span><LucideIcon name="flame" size={14} /> {Math.round(planActivo.calorias_diarias || 0)} kcal/dia</span>
            <span><LucideIcon name="calendar" size={14} /> Desde: {planActivo.fecha_inicio ? new Date(planActivo.fecha_inicio).toLocaleDateString('es-MX') : 'N/A'}</span>
            <span><LucideIcon name="user" size={14} /> {planActivo.especialista_nombre || 'Especialista'}</span>
          </div>
          {planActivo.notas_personalizadas && (
            <div className="hist-planes-activo-notas">
              <strong>Notas:</strong> {planActivo.notas_personalizadas}
            </div>
          )}
          {planActivo.plan_id && (
            <button className="hist-planes-btn-ver" onClick={() => verDetalle(planActivo.plan_id)}>
              Ver Detalle Completo
            </button>
          )}
        </div>
      )}

      {/* Lista de planes */}
      <div className="hist-planes-section">
        <h3 className="hist-planes-section-title">
          <LucideIcon name="clipboard" size={20} /> Todos los Planes ({planes.length})
        </h3>

        {planes.length === 0 ? (
          <div className="hist-planes-empty">
            <LucideIcon name="file-text" size={40} />
            <h3>No hay planes disponibles</h3>
            <p>No se han creado planes nutricionales aun.</p>
          </div>
        ) : (
          <div className="hist-planes-list">
            {planes.map(plan => (
              <div key={plan.id} className={`hist-planes-card ${plan.estado}`}>
                <div className="hist-planes-card-header">
                  <h4>{plan.nombre}</h4>
                  <span className={`hist-planes-estado ${plan.estado}`}>
                    {plan.estado === 'activo' ? 'Activo' : plan.estado === 'borrador' ? 'Borrador' : plan.estado}
                  </span>
                </div>
                {plan.descripcion && <p className="hist-planes-card-desc">{plan.descripcion}</p>}
                <div className="hist-planes-card-stats">
                  {plan.calorias_diarias > 0 && (
                    <span><LucideIcon name="flame" size={14} /> {Math.round(plan.calorias_diarias)} kcal</span>
                  )}
                  <span><LucideIcon name="users" size={14} /> {plan.pacientes_asignados || 0} usuarios</span>
                  <span><LucideIcon name="calendar" size={14} /> {new Date(plan.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                <button className="hist-planes-btn-detalle" onClick={() => verDetalle(plan.id)}>
                  Ver Detalle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {detallePlan && (
        <div className="hist-planes-modal-overlay" onClick={() => setDetallePlan(null)}>
          <div className="hist-planes-modal" onClick={e => e.stopPropagation()}>
            <div className="hist-planes-modal-header">
              <h2><LucideIcon name="clipboard" size={22} /> {detallePlan.nombre}</h2>
              <button className="hist-planes-modal-close" onClick={() => setDetallePlan(null)}>✕</button>
            </div>
            <div className="hist-planes-modal-body">
              {detallePlan.descripcion && <p className="hist-planes-modal-desc">{detallePlan.descripcion}</p>}

              <div className="hist-planes-modal-macros">
                <div className="hist-planes-macro-item">
                  <LucideIcon name="flame" size={18} />
                  <span className="macro-value">{Math.round(detallePlan.calorias_diarias || 0)}</span>
                  <span className="macro-label">kcal/dia</span>
                </div>
                <div className="hist-planes-macro-item">
                  <LucideIcon name="beef" size={18} />
                  <span className="macro-value">{Math.round(detallePlan.proteinas_g || 0)}g</span>
                  <span className="macro-label">Proteinas</span>
                </div>
                <div className="hist-planes-macro-item">
                  <LucideIcon name="wheat" size={18} />
                  <span className="macro-value">{Math.round(detallePlan.carbohidratos_g || 0)}g</span>
                  <span className="macro-label">Carbohidratos</span>
                </div>
                <div className="hist-planes-macro-item">
                  <LucideIcon name="droplet" size={18} />
                  <span className="macro-value">{Math.round(detallePlan.grasas_g || 0)}g</span>
                  <span className="macro-label">Grasas</span>
                </div>
              </div>

              {detallePlan.pacientes_asignados?.length > 0 && (
                <div className="hist-planes-modal-section">
                  <h4>Usuarios Asignados</h4>
                  <div className="hist-planes-pacientes-list">
                    {detallePlan.pacientes_asignados.map(p => (
                      <div key={p.id} className="hist-planes-paciente-item">
                        <span>{p.nombre_completo || p.nombre}</span>
                        <span className="hist-planes-paciente-fecha">
                          Desde: {new Date(p.fecha_inicio).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="hist-planes-modal-meta">
                <span>Estado: <strong>{detallePlan.estado}</strong></span>
                <span>Creado: {new Date(detallePlan.created_at).toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            <div className="hist-planes-modal-footer">
              <button className="hist-planes-btn-cerrar" onClick={() => setDetallePlan(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPlanes;
