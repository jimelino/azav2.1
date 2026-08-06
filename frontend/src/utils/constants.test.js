/**
 * Tests para constantes de la aplicacion
 */
import { ROLES, FASES, ESPECIALIDADES, API_URL } from './constants';
import { REHABILITATION_PHASES } from './rehabilitationPhases';

describe('Constantes - ROLES', () => {
  test('debe definir rol ADMIN', () => {
    expect(ROLES.ADMIN).toBe('administrador');
  });

  test('debe definir rol ESPECIALISTA', () => {
    expect(ROLES.ESPECIALISTA).toBe('especialista');
  });

  test('debe definir rol PACIENTE', () => {
    expect(ROLES.PACIENTE).toBe('paciente');
  });

  test('debe tener exactamente 3 roles', () => {
    expect(Object.keys(ROLES)).toHaveLength(3);
  });
});

describe('Constantes - FASES', () => {
  test('debe definir 8 fases de rehabilitacion', () => {
    expect(Object.keys(FASES)).toHaveLength(8);
  });

  test('PRECONSULTA debe ser 1', () => {
    expect(FASES.PRECONSULTA).toBe(1);
  });

  test('ADAPTACION_EJERCICIO debe ser 2', () => {
    expect(FASES.ADAPTACION_EJERCICIO).toBe(2);
  });

  test('PREPROTESICA debe ser 3', () => {
    expect(FASES.PREPROTESICA).toBe(3);
  });

  test('PROTESICA debe ser 4', () => {
    expect(FASES.PROTESICA).toBe(4);
  });

  test('las fases deben ser consecutivas del 1 al 8', () => {
    const valores = Object.values(FASES).sort();
    expect(valores).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('el catalogo compartido debe contener las ocho fases en orden', () => {
    expect(REHABILITATION_PHASES.map(({ numero, nombre }) => ({ numero, nombre }))).toEqual([
      { numero: 1, nombre: 'Preconsulta' },
      { numero: 2, nombre: 'Adaptación al ejercicio' },
      { numero: 3, nombre: 'Preprotésico' },
      { numero: 4, nombre: 'Protésico' },
      { numero: 5, nombre: 'Posprotésico' },
      { numero: 6, nombre: 'Alta/Graduación' },
      { numero: 7, nombre: 'Seguimiento a 6 meses' },
      { numero: 8, nombre: 'Seguimiento a 12 meses' }
    ]);
  });
});

describe('Constantes - ESPECIALIDADES', () => {
  test('debe definir 5 especialidades', () => {
    expect(Object.keys(ESPECIALIDADES)).toHaveLength(5);
  });

  test('debe incluir nutricion', () => {
    expect(ESPECIALIDADES.NUTRICION).toBe('nutricion');
  });

  test('debe incluir medicina', () => {
    expect(ESPECIALIDADES.MEDICINA).toBe('medicina');
  });

  test('debe incluir fisioterapia', () => {
    expect(ESPECIALIDADES.FISIOTERAPIA).toBe('fisioterapia');
  });

  test('debe incluir neuropsicologia', () => {
    expect(ESPECIALIDADES.NEUROPSICOLOGIA).toBe('neuropsicologia');
  });

  test('debe incluir ortesis', () => {
    expect(ESPECIALIDADES.ORTESIS).toBe('ortesis');
  });
});

describe('Constantes - API_URL', () => {
  test('debe tener un valor por defecto', () => {
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  test('debe terminar en /api', () => {
    expect(API_URL).toMatch(/\/api$/);
  });
});
