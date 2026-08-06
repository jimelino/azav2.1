export const ROLES = {
  ADMIN: 'administrador',
  ESPECIALISTA: 'especialista',
  PACIENTE: 'paciente'
};

export const FASES = {
  PRECONSULTA: 1,
  ADAPTACION_EJERCICIO: 2,
  PREPROTESICA: 3,
  PROTESICA: 4,
  POSPROTESICA: 5,
  ALTA_GRADUACION: 6,
  SEGUIMIENTO_6_MESES: 7,
  SEGUIMIENTO_12_MESES: 8
};

export const ESPECIALIDADES = {
  NUTRICION: 'nutricion',
  MEDICINA: 'medicina',
  FISIOTERAPIA: 'fisioterapia',
  NEUROPSICOLOGIA: 'neuropsicologia',
  ORTESIS: 'ortesis'
};

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
