import api from './api';

const payload = (response) => response?.data ?? response;

export const externalHealthService = {
  fetchPatientProfile: async () => payload(await api.get('/integracion/paciente/perfil')),
  updatePatientProfile: async (data) => payload(await api.put('/integracion/paciente/perfil', data)),
  fetchNeuroAppointments: async () => payload(await api.get('/integracion/neuro/citas')),
  fetchNeuroDocuments: async () => payload(await api.get('/integracion/neuro/documentos')),
  fetchAssignedSpecialist: async () => payload(await api.get('/integracion/neuro/especialista'))
};

export default externalHealthService;
