import React, { useState } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './NeupsiproSyncTab.css';

/**
 * Panel de administración para la integración con neupsipro.
 * Dispara la sincronización de la tabla puente (neupsipro_vinculos)
 * que usa ExternalPatientController para resolver correo -> id_user.
 */
const NeupsiproSyncTab = () => {
  const [idUser, setIdUser] = useState('');
  const [loadingOne, setLoadingOne] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const sincronizarUno = async () => {
    if (!idUser.trim()) return;
    setError('');
    setResultado(null);
    setLoadingOne(true);
    try {
      const response = await api.post(`/admin/neupsipro/sync/${encodeURIComponent(idUser.trim())}`);
      setResultado({ tipo: 'uno', data: response.data });
    } catch (err) {
      setError(err?.message || 'No se pudo sincronizar el paciente.');
    } finally {
      setLoadingOne(false);
    }
  };

  const sincronizarTodos = async () => {
    setError('');
    setResultado(null);
    setLoadingAll(true);
    try {
      const response = await api.post('/admin/neupsipro/sync');
      setResultado({ tipo: 'todos', data: response.data });
    } catch (err) {
      setError(err?.message || 'No se pudo completar la sincronización.');
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <div className="neupsipro-sync-tab">
      <section className="neupsipro-sync-card">
        <div className="neupsipro-sync-heading">
          <LucideIcon name="refresh-cw" size={20} />
          <h3>Sincronización con neupsipro</h3>
        </div>
        <p className="help-text">
          Actualiza la tabla puente que vincula a cada usuario de Azaria (por correo) con su
          paciente en neupsipro (folio, colaborador asignado, protocolo y estado). Corre esto
          después de dar de alta pacientes nuevos en neupsipro, o si un paciente ve su expediente
          de neuropsicología como "no vinculado".
        </p>

        <div className="neupsipro-sync-actions">
          <button className="btn btn-primary" onClick={sincronizarTodos} disabled={loadingAll || loadingOne}>
            {loadingAll ? 'Sincronizando todos...' : 'Sincronizar todos los pacientes'}
          </button>
        </div>

        <div className="neupsipro-sync-divider">o sincroniza uno solo por su id_user de neupsipro</div>

        <div className="neupsipro-sync-one">
          <input
            type="text"
            className="form-control"
            placeholder="id_user en neupsipro"
            value={idUser}
            onChange={(e) => setIdUser(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={sincronizarUno} disabled={loadingOne || loadingAll || !idUser.trim()}>
            {loadingOne ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>

        {error && <p className="neuro-external-error" role="alert">{error}</p>}

        {resultado?.tipo === 'todos' && (
          <div className="neupsipro-sync-resultado">
            <p><strong>Sincronizados:</strong> {resultado.data?.sincronizados ?? 0}</p>
            {Array.isArray(resultado.data?.errores) && resultado.data.errores.length > 0 && (
              <>
                <p><strong>Errores:</strong> {resultado.data.errores.length}</p>
                <ul>
                  {resultado.data.errores.slice(0, 10).map((e, i) => (
                    <li key={i}>id_user {e.id_user}: {e.error}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {resultado?.tipo === 'uno' && (
          <div className="neupsipro-sync-resultado">
            <p><strong>Nombre:</strong> {resultado.data?.nombreCompleto || 'N/D'}</p>
            <p><strong>Correo:</strong> {resultado.data?.correo || 'N/D'}</p>
            <p><strong>Folio:</strong> {resultado.data?.folio || 'N/D'}</p>
            <p><strong>Colaborador asignado:</strong> {resultado.data?.colaboradorAsignado || 'N/D'}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NeupsiproSyncTab;
