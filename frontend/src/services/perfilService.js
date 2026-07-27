import api from './api';

export const perfilService = {
  // Perfil y datos personales vienen del sistema clínico externo a través del proxy seguro.
  getPerfil: async () => await api.get('/integracion/paciente/perfil'),
  updatePerfil: async (data) => await api.put('/integracion/paciente/perfil', data),
  getEspecialistasAsignados: async (pacienteId) => await api.get(`/pacientes/${pacienteId}/especialistas`)
};
