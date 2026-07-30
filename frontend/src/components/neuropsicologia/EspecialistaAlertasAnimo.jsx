import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './NeuropsicologiaEsp.css';

const EspecialistaAlertasAnimo = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const response = await api.get('/neuropsicologia/alertas');
      setAlertas(response?.data ?? response ?? []);
    } catch (err) { setError(err?.message || 'No se pudieron cargar las alertas.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const atender = async (id) => {
    await api.put(`/neuropsicologia/alertas/${id}/atendida`);
    cargar();
  };

  return <section className="neuro-esp-module">
    <div className="neuro-esp-header"><h2><LucideIcon name="bell-ring" size={22} /> Alertas de estado de animo</h2><button className="neuro-back-btn" onClick={cargar}><LucideIcon name="refresh-cw" size={16} /> Actualizar</button></div>
    {error && <p className="neuro-empty">{error}</p>}
    {loading ? <div className="neuro-loading"><p>Cargando alertas...</p></div> : alertas.length === 0 ? <div className="neuro-empty"><LucideIcon name="circle-check" size={36} /><p>No hay alertas pendientes.</p></div> : <div className="neuro-alert-list">{alertas.map(alerta => <article className={`neuro-alert-item severity-${alerta.severidad}`} key={alerta.id}><div><strong>{alerta.severidad === 'alta' ? 'Atencion urgente' : 'Seguimiento emocional'}</strong><p>{alerta.paciente_nombre}</p><span>{alerta.mensaje}</span></div><button className="btn btn-primary" onClick={() => atender(alerta.id)}>Marcar atendida</button></article>)}</div>}
  </section>;
};

export default EspecialistaAlertasAnimo;
