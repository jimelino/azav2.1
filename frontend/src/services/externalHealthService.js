import api from './api';

const payload = (response) => response?.data ?? response;

// Misma lógica que api.js para construir la base URL (usada solo para
// armar el link de descarga del PDF, que no puede ir por axios porque
// se abre directo en el navegador).
const defaultUrl = 'https://azav2-1-back.onrender.com';
const rawApiUrl = process.env.REACT_APP_API_URL || defaultUrl;
const API_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : rawApiUrl.replace(/\/+$|$/, '') + '/api';

export const externalHealthService = {
  // Perfil clínico (folio, nombre, correo, colaborador asignado, protocolo,
  // estado, próxima cita) vinculado desde neupsipro.
  fetchPatientProfile: async () => payload(await api.get('/integracion/paciente/perfil')),

  // neupsipro no expone auto-edición de perfil por el paciente; el backend
  // responde 501 a propósito. Se deja el método por compatibilidad.
  updatePatientProfile: async (data) => payload(await api.put('/integracion/paciente/perfil', data)),

  // { folio, colaboradorAsignado, evaluaciones: [{ idAplicacion, nombre, estatus, fechaCreacion }] }
  fetchNeuroDocuments: async () => payload(await api.get('/integracion/neuro/documentos')),

  // Detalle (tests) de una evaluación puntual:
  // { estatusAplicacion, tests: [{ idTest, nombre, idResultados, estatus, fechaAplicacion }] }
  fetchNeuroDocumentDetail: async (idAplicacion) =>
    payload(await api.get(`/integracion/neuro/documentos/${encodeURIComponent(idAplicacion)}`)),

  // URL directa (con token en query) para abrir/descargar el PDF de
  // resultados en una pestaña nueva.
  getNeuroDocumentDownloadUrl: (idAplicacion) => {
    const token = localStorage.getItem('token') || '';
    return `${API_URL}/integracion/neuro/documentos/${encodeURIComponent(idAplicacion)}/descargar?token=${encodeURIComponent(token)}`;
  },

  fetchAssignedSpecialist: async () => payload(await api.get('/integracion/neuro/especialista')),

  // ---- Uso administrativo (rol administrador) ----------------------------
  syncNeupsiproPatient: async (neupsiproIdUser) =>
    payload(await api.post(`/admin/neupsipro/sync/${encodeURIComponent(neupsiproIdUser)}`)),

  syncNeupsiproAll: async () => payload(await api.post('/admin/neupsipro/sync'))
};

export default externalHealthService;
