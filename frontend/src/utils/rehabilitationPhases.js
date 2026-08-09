import { FASES } from './constants';

export const REHABILITATION_PHASES = [
  {
    numero: FASES.PRECONSULTA,
    nombre: 'Preconsulta',
    icono: 'search',
    descripcion: 'Primera aproximación al dispositivo, evaluaciones médicas y plan de tratamiento.'
  },
  {
    numero: FASES.ADAPTACION_EJERCICIO,
    nombre: 'Adaptación al ejercicio',
    icono: 'book-open',
    descripcion: 'Aprendizaje de uso del dispositivo, ejercicios básicos y ajustes iniciales.'
  },
  {
    numero: FASES.PREPROTESICA,
    nombre: 'Preprotésico',
    icono: 'bar-chart',
    descripcion: 'Uso regular del dispositivo, monitoreo constante y correcciones necesarias.'
  },
  {
    numero: FASES.PROTESICA,
    nombre: 'Protésico',
    icono: 'user-check',
    descripcion: 'Uso independiente del dispositivo con seguimiento periódico.'
  },
  {
    numero: FASES.POSPROTESICA,
    nombre: 'Posprotésico',
    icono: 'award',
    descripcion: 'Consolidación de la autonomía y adaptación funcional avanzada a la vida diaria.'
  },
  {
    numero: FASES.ALTA_GRADUACION,
    nombre: 'Alta/Graduación',
    icono: 'graduation-cap',
    descripcion: 'Finalización formal del proceso de rehabilitación y alta clínica.'
  },
  {
    numero: FASES.SEGUIMIENTO_6_MESES,
    nombre: 'Seguimiento a 6 meses',
    icono: 'clock',
    descripcion: 'Evaluación de control semestral para asegurar el buen estado del dispositivo y confort.'
  },
  {
    numero: FASES.SEGUIMIENTO_12_MESES,
    nombre: 'Seguimiento a 12 meses',
    icono: 'calendar-days',
    descripcion: 'Evaluación de control anual y cierre de ciclo de seguimiento prolongado.'
  }
];

export const getRehabilitationPhase = (numero) => (
  REHABILITATION_PHASES.find((fase) => fase.numero === Number(numero))
);
