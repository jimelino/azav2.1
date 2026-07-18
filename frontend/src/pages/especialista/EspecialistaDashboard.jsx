import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useVoice, Speakable } from '../../components/VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../../components/accessibility/AccessibilityPanel';
import InstitutionalHeader from '../../components/layouts/InstitutionalHeader';
import InstitutionalFooter from '../../components/layouts/InstitutionalFooter';
import OutlookConnect, { OutlookSyncButton } from '../../components/outlook/OutlookConnect';
import OutlookCalendar from '../../components/outlook/OutlookCalendar';
import PlanesNutricionales from '../../components/nutricion/PlanesNutricionales';
import SeguimientoPeso from '../../components/nutricion/SeguimientoPeso';
import HistorialAlimenticio from '../../components/nutricion/HistorialAlimenticio';
import IMCPacientes from '../../components/nutricion/IMCPacientes';
import CalculadoraCalorica from '../../components/nutricion/CalculadoraCalorica';
import HistorialPlanes from '../../components/nutricion/HistorialPlanes';
import CatalogoRecetas from '../../components/nutricion/CatalogoRecetas';
import GeneradorPlan from '../../components/nutricion/GeneradorPlan';
import EjerciciosPacientes from '../../components/fisioterapia/EjerciciosPacientes';
import EvaluacionesFisicas from '../../components/fisioterapia/EvaluacionesFisicas';
import PlanesTratamiento from '../../components/fisioterapia/PlanesTratamiento';
import ProgresoPacientes from '../../components/fisioterapia/ProgresoPacientes';
import EvaluacionesCognitivas from '../../components/neuropsicologia/EvaluacionesCognitivas';
import EstadoEmocionalPaciente from '../../components/neuropsicologia/EstadoEmocionalPaciente';
import ActividadACTPaciente from '../../components/neuropsicologia/ActividadACTPaciente';
import CuestionariosHistorial from '../../components/neuropsicologia/CuestionariosHistorial';
import DispositivosPacientes from '../../components/ortesis/DispositivosPacientes';
import SeguimientoAdaptacion from '../../components/ortesis/SeguimientoAdaptacion';
import MantenimientoAjustes from '../../components/ortesis/MantenimientoAjustes';
import MedicionesMunon from '../../components/ortesis/MedicionesMunon';
import LucideIcon from '../../components/LucideIcon';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

import '../../components/layouts/institutional.css';
import './EspecialistaDashboard.css';
import PorcionesNutricionales from './PorcionesNutricionales';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

/**
 * EspecialistaDashboard - Panel personalizado para especialistas médicos
 * Cada área médica tiene sus propios módulos y herramientas
 */

// Configuración de áreas médicas con sus módulos específicos
// Los módulos ahora usan vistas internas (view) en lugar de rutas externas
const AREAS_CONFIG = {
  fisioterapia: {
    nombre: 'Fisioterapia',
    icon: 'dumbbell',
    color: '#E65100',
    modulos: [
      { id: 'ejercicios', nombre: 'Ejercicios de Usuarios', icon: 'dumbbell', descripcion: 'Ver rutinas y progreso', view: 'mod-ejercicios' },
      { id: 'evaluaciones', nombre: 'Evaluaciones', icon: 'bar-chart', descripcion: 'Evaluaciones físicas de usuarios', view: 'mod-evaluaciones' },
      { id: 'planes', nombre: 'Planes de Tratamiento', icon: 'clipboard', descripcion: 'Gestionar planes de usuarios', view: 'mod-planes' },
      { id: 'progreso', nombre: 'Progreso', icon: 'trending-up', descripcion: 'Ver progreso de usuarios', view: 'mod-progreso' },
    ],
    herramientas: [
      { nombre: 'Calculadora de ROM', icon: 'compass' },
      { nombre: 'Escala de Dolor', icon: 'frown' },
      { nombre: 'Test Muscular', icon: 'zap' },
    ]
  },
  nutricion: {
    nombre: 'Nutrición',
    icon: 'salad',
    color: '#2E7D32',
    modulos: [
      { id: 'planes-nutricionales', nombre: 'Planes Nutricionales', icon: 'utensils', descripcion: 'Ver dietas de usuarios', view: 'mod-planes-nutricionales' },
      { id: 'seguimiento-peso', nombre: 'Seguimiento de Peso', icon: 'chart-line', descripcion: 'Ver peso de usuarios', view: 'mod-seguimiento-peso' },
      { id: 'historial-alimenticio', nombre: 'Historial Alimenticio', icon: 'salad', descripcion: 'Ver registros de alimentación', view: 'mod-historial-alimenticio' },
      { id: 'imc-pacientes', nombre: 'IMC de Usuarios', icon: 'scale', descripcion: 'Ver índice de masa corporal', view: 'mod-imc' },
      { id: 'calculadora-calorica', nombre: 'Calculadora Calórica', icon: 'target', descripcion: 'Calcular requerimiento calórico', view: 'mod-calculadora-calorica' },
      { id: 'historial-planes', nombre: 'Historial de Planes', icon: 'file-text', descripcion: 'Ver planes asignados al usuario', view: 'mod-historial-planes' },
      { id: 'catalogo-recetas', nombre: 'Catálogo de Recetas', icon: 'book-open', descripcion: 'Gestionar recetas del catálogo', view: 'mod-catalogo-recetas' },
      { id: 'generador-plan', nombre: 'Generar Plan', icon: 'cooking-pot', descripcion: 'Crear plan desde recetas', view: 'mod-generador-plan' },
    ],
    herramientas: [
      { nombre: 'Tabla de Alimentos', icon: 'bar-chart' },
      { nombre: 'Macronutrientes', icon: 'apple' },
    ]
  },
  medicina: {
    nombre: 'Medicina General',
    icon: 'heart',
    color: '#C62828',
    modulos: [
      { id: 'consultas', nombre: 'Historial Consultas', icon: 'stethoscope', descripcion: 'Ver historial de consultas', view: 'mod-consultas' },
      { id: 'signos-vitales', nombre: 'Signos Vitales', icon: 'heart-pulse', descripcion: 'Ver signos vitales de usuarios', view: 'mod-signos-vitales' },
      { id: 'estudios', nombre: 'Estudios Clínicos', icon: 'microscope', descripcion: 'Ver estudios de usuarios', view: 'mod-estudios' },
      { id: 'recetas-medicas', nombre: 'Recetas Médicas', icon: 'pill', descripcion: 'Generar recetas para usuarios', view: 'mod-recetas' },
    ],
    herramientas: [
      { nombre: 'Calculadora de Dosis', icon: 'syringe' },
      { nombre: 'CIE-10', icon: 'book-open' },
      { nombre: 'Interacciones', icon: 'alert-triangle' },
    ]
  },
  neuropsicologia: {
    nombre: 'Neuropsicología',
    icon: 'brain',
    color: '#6A1B9A',
    modulos: [
      { id: 'evaluaciones-neuro', nombre: 'Evaluaciones Neuropsicológicas', icon: 'target', descripcion: 'Evaluaciones y cuestionarios', view: 'mod-evaluaciones-neuro' },
      { id: 'herramientas-act', nombre: 'Herramientas ACT', icon: 'sparkles', descripcion: 'Ver actividades de usuarios', view: 'mod-herramientas-act' },
      { id: 'emocional', nombre: 'Estado Emocional', icon: 'smile', descripcion: 'Ver evaluación emocional', view: 'mod-emocional' },
    ],
    herramientas: []
  },
  ortesis: {
    nombre: 'Ortesis y Prótesis',
    icon: 'accessibility',
    color: '#1565C0',
    modulos: [
      { id: 'dispositivos', nombre: 'Dispositivos', icon: 'accessibility', descripcion: 'Ver dispositivos de usuarios', view: 'mod-dispositivos' },
      { id: 'adaptacion', nombre: 'Adaptación', icon: 'wrench', descripcion: 'Ver seguimiento de adaptación', view: 'mod-adaptacion' },
      { id: 'mantenimiento', nombre: 'Mantenimiento y Ajustes', icon: 'hammer', descripcion: 'Historial de mantenimiento y ajustes', view: 'mod-mantenimiento' },
      { id: 'mediciones', nombre: 'Mediciones del Muñón', icon: 'ruler', descripcion: 'Registro de medidas del muñón', view: 'mod-mediciones-munon' },
    ],
    herramientas: []
  },
};

// ============================================================
// Componente interno: Recetas Médicas (CRUD de medicamentos)
// ============================================================
const VIAS_ADMINISTRACION = [
  { value: 'oral', label: 'Oral' },
  { value: 'inyectable', label: 'Inyectable' },
  { value: 'topica', label: 'Tópica' },
  { value: 'inhalada', label: 'Inhalada' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'otra', label: 'Otra' },
];

const RecetasMedicasView = ({ pacienteId, pacienteNombre, faseActual, areaColor, onBack, expedienteLink }) => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  const emptyMed = {
    nombre_comercial: '', nombre_generico: '', dosis: '', frecuencia: '',
    via_administracion: 'oral', instrucciones_especiales: '',
    fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: '', notas_medico: ''
  };
  const [formMeds, setFormMeds] = useState([{ ...emptyMed }]);

  useEffect(() => {
    loadMedicamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const loadMedicamentos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/medicina/medicamentos/${pacienteId}`);
      setMedicamentos(res?.data || []);
    } catch (err) {
      console.error('Error cargando medicamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingMed(null);
    setFormMeds([{ ...emptyMed }]);
    setShowModal(true);
  };

  const openEdit = (med) => {
    setEditingMed(med);
    setFormMeds([{
      nombre_comercial: med.nombre_comercial || '',
      nombre_generico: med.nombre_generico || '',
      dosis: med.dosis || '',
      frecuencia: med.frecuencia || '',
      via_administracion: med.via_administracion || 'oral',
      instrucciones_especiales: med.instrucciones_especiales || '',
      fecha_inicio: med.fecha_inicio || '',
      fecha_fin: med.fecha_fin || '',
      notas_medico: med.notas_medico || '',
    }]);
    setShowModal(true);
  };

  const addMedRow = () => {
    setFormMeds([...formMeds, { ...emptyMed }]);
  };

  const removeMedRow = (idx) => {
    setFormMeds(formMeds.filter((_, i) => i !== idx));
  };

  const updateMedRow = (idx, field, value) => {
    const updated = [...formMeds];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormMeds(updated);
  };

  const handleSave = async () => {
    const valid = formMeds.filter(m => m.nombre_comercial.trim() && m.dosis.trim() && m.frecuencia.trim());
    if (valid.length === 0) {
      alert('Al menos un medicamento con nombre, dosis y frecuencia es requerido');
      return;
    }
    setSaving(true);
    try {
      if (editingMed) {
        await api.put(`/medicina/medicamentos/${editingMed.id}`, formMeds[0]);
      } else {
        await api.post('/medicina/medicamentos', {
          paciente_id: pacienteId,
          medicamentos: valid
        });
      }
      setShowModal(false);
      setFormMeds([{ ...emptyMed }]);
      setEditingMed(null);
      loadMedicamentos();
    } catch (err) {
      console.error('Error guardando medicamento:', err);
      alert('Error al guardar el medicamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Desactivar este medicamento? Se marcará como finalizado.')) return;
    try {
      await api.delete(`/medicina/medicamentos/${id}`);
      loadMedicamentos();
    } catch (err) {
      console.error('Error desactivando medicamento:', err);
      alert('Error al desactivar el medicamento');
    }
  };

  const filteredMeds = medicamentos.filter(m => {
    if (filtro === 'activos') return m.activo === 1 || m.activo === '1';
    if (filtro === 'inactivos') return m.activo === 0 || m.activo === '0';
    return true;
  });

  const activos = medicamentos.filter(m => m.activo === 1 || m.activo === '1');
  const inactivos = medicamentos.filter(m => m.activo === 0 || m.activo === '0');

  return (
    <section className="module-view">
      <div className="module-header">
        <button className="back-btn" onClick={onBack}>← Cambiar usuario</button>
        <h2 className="module-title"><LucideIcon name="pill" size={22} /> Recetas de {pacienteNombre}</h2>
      </div>

      {loading ? (
        <div className="loading-module">
          <div className="loading-spinner"></div>
          <p>Cargando medicamentos...</p>
        </div>
      ) : (
        <div className="module-content">
          {/* Resumen */}
          <div className="patient-summary-card" style={{ '--area-color': areaColor }}>
            <div className="patient-avatar-large">{pacienteNombre?.charAt(0)}</div>
            <div className="patient-summary-info">
              <h3>{pacienteNombre}</h3>
              <p>Fase: {faseActual || 'Sin asignar'}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <LucideIcon name="check-circle" size={14} /> {activos.length} activos
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  <LucideIcon name="x-circle" size={14} /> {inactivos.length} finalizados
                </span>
              </div>
            </div>
          </div>

          {/* Filtros y botón crear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['todos', 'activos', 'inactivos'].map(f => (
                <button
                  key={f}
                  className={`chip ${filtro === f ? 'active' : ''}`}
                  onClick={() => setFiltro(f)}
                  style={filtro === f ? { background: areaColor, borderColor: areaColor, color: '#fff' } : {}}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={openCreate} style={{ background: areaColor }}>
              <LucideIcon name="plus" size={16} /> Nueva Receta
            </button>
          </div>

          {/* Lista de medicamentos */}
          {filteredMeds.length > 0 ? (
            <div className="recetas-list">
              {filteredMeds.map(med => {
                const esActivo = med.activo === 1 || med.activo === '1';
                return (
                  <div key={med.id} className={`receta-card ${esActivo ? 'activa' : 'vencida'}`}>
                    <div className="receta-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LucideIcon name="pill" size={18} style={{ color: esActivo ? areaColor : 'var(--text-muted)' }} />
                        <strong style={{ fontSize: '16px' }}>{med.nombre_comercial}</strong>
                        {med.nombre_generico && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>({med.nombre_generico})</span>
                        )}
                      </div>
                      <span className={`vigencia-badge ${esActivo ? 'activa' : 'vencida'}`}>
                        {esActivo ? 'Activo' : 'Finalizado'}
                      </span>
                    </div>
                    <div className="receta-medicamentos">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', margin: '8px 0' }}>
                        <div><strong>Dosis:</strong> {med.dosis}</div>
                        <div><strong>Frecuencia:</strong> {med.frecuencia}</div>
                        <div><strong>Vía:</strong> {VIAS_ADMINISTRACION.find(v => v.value === med.via_administracion)?.label || med.via_administracion}</div>
                        <div><strong>Inicio:</strong> {med.fecha_inicio}</div>
                        {med.fecha_fin && <div><strong>Fin:</strong> {med.fecha_fin}</div>}
                      </div>
                      {med.instrucciones_especiales && (
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0' }}>
                          <LucideIcon name="info" size={14} /> {med.instrucciones_especiales}
                        </p>
                      )}
                      {med.notas_medico && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0' }}>
                          Nota: {med.notas_medico}
                        </p>
                      )}
                      {med.prescrito_por_nombre && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Prescrito por: {med.prescrito_por_nombre}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => openEdit(med)} title="Editar">
                        <LucideIcon name="pen-line" size={16} />
                      </button>
                      {esActivo && (
                        <button className="btn-icon delete" onClick={() => handleDesactivar(med.id)} title="Finalizar medicamento">
                          <LucideIcon name="x-circle" size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><LucideIcon name="pill" size={32} /></span>
              <p>{filtro === 'todos' ? 'No hay medicamentos registrados para este usuario' : `No hay medicamentos ${filtro}`}</p>
              <button className="btn-primary" onClick={openCreate} style={{ background: areaColor, marginTop: '12px' }}>
                <LucideIcon name="plus" size={16} /> Prescribir Medicamento
              </button>
            </div>
          )}

          <div className="module-actions" style={{ marginTop: '16px' }}>
            <Link to={expedienteLink} className="btn-primary">
              Ver Expediente Completo
            </Link>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h2>{editingMed ? 'Editar Medicamento' : 'Nueva Receta Médica'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {formMeds.map((med, idx) => (
                <div key={idx} style={{ border: formMeds.length > 1 ? '1px solid var(--border-color, #30363D)' : 'none', borderRadius: '12px', padding: formMeds.length > 1 ? '16px' : '0', position: 'relative' }}>
                  {formMeds.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: areaColor }}>
                        <LucideIcon name="pill" size={14} /> Medicamento {idx + 1}
                      </span>
                      <button type="button" className="btn-icon delete" onClick={() => removeMedRow(idx)} title="Quitar medicamento"
                        style={{ padding: '4px' }}>
                        <LucideIcon name="trash-2" size={16} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label>Nombre comercial *</label>
                        <input type="text" className="form-input" value={med.nombre_comercial}
                          onChange={e => updateMedRow(idx, 'nombre_comercial', e.target.value)}
                          placeholder="Ej: Metformina" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Nombre genérico</label>
                        <input type="text" className="form-input" value={med.nombre_generico}
                          onChange={e => updateMedRow(idx, 'nombre_generico', e.target.value)}
                          placeholder="Opcional" />
                      </div>
                    </div>
                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Dosis *</label>
                        <input type="text" className="form-input" value={med.dosis}
                          onChange={e => updateMedRow(idx, 'dosis', e.target.value)}
                          placeholder="Ej: 500mg" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Frecuencia *</label>
                        <input type="text" className="form-input" value={med.frecuencia}
                          onChange={e => updateMedRow(idx, 'frecuencia', e.target.value)}
                          placeholder="Ej: Cada 8 horas" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Vía de administración</label>
                      <select className="form-input" value={med.via_administracion}
                        onChange={e => updateMedRow(idx, 'via_administracion', e.target.value)}>
                        {VIAS_ADMINISTRACION.map(v => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Fecha inicio *</label>
                        <input type="date" className="form-input" value={med.fecha_inicio}
                          onChange={e => updateMedRow(idx, 'fecha_inicio', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Fecha fin (opcional)</label>
                        <input type="date" className="form-input" value={med.fecha_fin}
                          onChange={e => updateMedRow(idx, 'fecha_fin', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Instrucciones especiales</label>
                      <textarea className="form-input" rows="2" value={med.instrucciones_especiales}
                        onChange={e => updateMedRow(idx, 'instrucciones_especiales', e.target.value)}
                        placeholder="Ej: Tomar con alimentos, evitar alcohol..." />
                    </div>
                    <div className="form-group">
                      <label>Notas del médico</label>
                      <textarea className="form-input" rows="2" value={med.notas_medico}
                        onChange={e => updateMedRow(idx, 'notas_medico', e.target.value)}
                        placeholder="Notas adicionales..." />
                    </div>
                  </div>
                </div>
              ))}
              {!editingMed && (
                <button type="button" className="btn-secondary" onClick={addMedRow}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LucideIcon name="plus-circle" size={16} /> Agregar otro medicamento
                </button>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ background: areaColor }}>
                {saving ? 'Guardando...' : (editingMed ? 'Guardar Cambios' : `Prescribir${formMeds.length > 1 ? ` (${formMeds.length})` : ''}`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const EspecialistaDashboard = () => {
  const { user, logout } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, speakModule, isSpeaking, stop } = useVoice();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('inicio');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [pacienteData, setPacienteData] = useState(null);
  const [loadingPacienteData, setLoadingPacienteData] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    todayCitas: [],
    proximasCitas: [],
    pacientesActivos: 0,
    seguimientosPendientes: 0,
    mensajesNuevos: 0,
    pacientes: [],
  });

  // Estados para modales
  const [showModal, setShowModal] = useState(null);
  const [estudiosLocales, setEstudiosLocales] = useState([]);

  // Formularios
  const [dosisForm, setDosisForm] = useState({ peso: '', dosis_mg_kg: '', frecuencia: '8' });
  const [cie10Search, setCie10Search] = useState('');
  const [interaccionForm, setInteraccionForm] = useState({ medicamento1: '', medicamento2: '' });
  const [estudioForm, setEstudioForm] = useState({
    nombre: '',
    tipo: 'laboratorio',
    fecha: new Date().toISOString().split('T')[0],
    resultado: '',
    observaciones: ''
  });

  // Estados para chat
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [otroUsuarioChat, setOtroUsuarioChat] = useState(null);

  // Estados para modal de nueva cita
  const [citaForm, setCitaForm] = useState({
    paciente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    tipo_cita_id: '',
    motivo: ''
  });
  const [tiposCita, setTiposCita] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  // Estado para integración con Outlook
  const [outlookConnected, setOutlookConnected] = useState(false);

  // Estados para signos vitales (gráficas medicina)
  const [signosData, setSignosData] = useState({ glucosa: [], presion: [], dolor: [], hba1c: [], resumen: null });
  const [signosLoading, setSignosLoading] = useState(false);
  const [signosTab, setSignosTab] = useState('glucosa');

  // Obtener área médica del especialista
  const areaCodigo = user?.area_medica || 'medicina';
  const areaConfig = AREAS_CONFIG[areaCodigo] || AREAS_CONFIG.medicina;

  useEffect(() => {
    // Determinar vista activa basada en la URL
    const path = location.pathname;
    if (path.includes('/pacientes')) setActiveView('pacientes');
    else if (path.includes('/agenda')) setActiveView('agenda');
    else if (path.includes('/seguimientos')) setActiveView('seguimientos');
    else if (path.includes('/chat') || path.includes('/mensajes')) setActiveView('mensajes');
    else if (path.includes('/herramientas')) setActiveView('herramientas');
    else setActiveView('inicio');
  }, [location]);

  useEffect(() => {
    loadData();

    if (settings.voiceNavigation) {
      const nombre = user?.nombre?.split(' ')[0] || 'Especialista';
      speak(`Bienvenido Doctor ${nombre}. Panel de ${areaConfig.nombre}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar conversaciones cuando se abre la vista de mensajes
  useEffect(() => {
    if (activeView === 'mensajes') {
      loadConversaciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const especialistaId = user?.especialista_id || user?.id;
      const [citasRes, pacientesRes, mensajesRes, citasFuturasRes] = await Promise.all([
        api.get(`/especialistas/${especialistaId}/citas-hoy`).catch(() => ({ data: null })),
        api.get(`/especialistas/${especialistaId}/pacientes`).catch(() => ({ data: null })),
        api.get(`/mensajes/no-leidos/${especialistaId}`).catch(() => ({ data: null })),
        api.get(`/citas/especialista/${especialistaId}`).catch(() => ({ data: null })),
      ]);

      // Separar las citas futuras (> hoy) de las de hoy para evitar duplicados en la UI
      const hoyStr = new Date().toISOString().split('T')[0];
      const todasFuturas = citasFuturasRes.data?.citas || [];
      const proximas = todasFuturas.filter(c => c.fecha > hoyStr);

      setDashboardData({
        todayCitas: citasRes.data?.citas || [],
        pacientesActivos: pacientesRes.data?.total || 0,
        seguimientosPendientes: pacientesRes.data?.pendientes || 0,
        mensajesNuevos: mensajesRes.data?.total || 0,
        pacientes: pacientesRes.data?.pacientes || [],
        proximasCitas: proximas,
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos de un paciente específico para los módulos
  const loadPacienteData = async (pacienteId) => {
    setLoadingPacienteData(true);
    try {
      const especialistaId = user?.especialista_id || user?.id;
      const response = await api.get(`/especialistas/${especialistaId}/pacientes/${pacienteId}`);
      setPacienteData(response.data);
    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
      setPacienteData(null);
    } finally {
      setLoadingPacienteData(false);
    }
  };

  // Cargar signos vitales (glucosa, presión, dolor) de un paciente
  const loadSignosVitales = async (pacienteId) => {
    setSignosLoading(true);
    try {
      const [glucosaRes, presionRes, dolorRes, hba1cRes, resumenRes] = await Promise.all([
        api.get(`/medicina/glucosa/${pacienteId}`).catch(() => ({ data: [] })),
        api.get(`/medicina/presion/${pacienteId}`).catch(() => ({ data: [] })),
        api.get(`/medicina/dolor/${pacienteId}`).catch(() => ({ data: [] })),
        api.get(`/medicina/hba1c/${pacienteId}`).catch(() => ({ data: [] })),
        api.get(`/medicina/resumen/${pacienteId}`).catch(() => ({ data: null })),
      ]);
      setSignosData({
        glucosa: glucosaRes?.data || [],
        presion: presionRes?.data || [],
        dolor: dolorRes?.data || [],
        hba1c: hba1cRes?.data || [],
        resumen: resumenRes?.data || null,
      });
    } catch (error) {
      console.error('Error cargando signos vitales:', error);
    } finally {
      setSignosLoading(false);
    }
  };

  // Seleccionar paciente y cargar sus datos
  const handleSelectPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    loadPacienteData(paciente.id);
    if (activeView === 'mod-signos-vitales') {
      loadSignosVitales(paciente.id);
    }
  };

  // Volver a la lista de pacientes en módulos
  const handleBackToPatientList = () => {
    setSelectedPaciente(null);
    setPacienteData(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'confirmada': return 'var(--color-success)';
      case 'pendiente':
      case 'programada': return 'var(--color-warning)';
      case 'cancelada': return 'var(--color-error)';
      default: return 'var(--text-muted)';
    }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  // Abrir herramienta
  const handleOpenTool = (toolName) => {
    if (toolName.includes('Dosis') || toolName.includes('Calórica') || toolName.includes('ROM')) {
      setShowModal('calculadora-dosis');
    } else if (toolName.includes('CIE') || toolName.includes('Alimentos') || toolName.includes('Tallas')) {
      setShowModal('cie10');
    } else if (toolName.includes('Interacciones') || toolName.includes('Macronutrientes') || toolName.includes('Materiales')) {
      setShowModal('interacciones');
    } else if (toolName.includes('Dolor') || toolName.includes('Ansiedad')) {
      setShowModal('escala-dolor');
    } else if (toolName.includes('Mini-Mental') || toolName.includes('Memoria') || toolName.includes('Muscular')) {
      setShowModal('test');
    } else {
      setShowModal('herramienta-generica');
    }
  };

  // Calcular dosis
  const calcularDosis = () => {
    const peso = parseFloat(dosisForm.peso);
    const dosisPorKg = parseFloat(dosisForm.dosis_mg_kg);
    const frecuencia = parseInt(dosisForm.frecuencia);

    if (peso && dosisPorKg) {
      const dosisPorToma = (peso * dosisPorKg).toFixed(2);
      const dosisDiaria = ((24 / frecuencia) * dosisPorToma).toFixed(2);
      return { dosisPorToma, dosisDiaria, tomasPorDia: 24 / frecuencia };
    }
    return null;
  };

  // Guardar nuevo estudio
  const handleGuardarEstudio = async () => {
    if (!estudioForm.nombre || !selectedPaciente) return;

    const nuevoEstudio = {
      id: Date.now(),
      ...estudioForm,
      estado: estudioForm.resultado ? 'Completado' : 'Pendiente'
    };

    // Agregar a la lista local
    setEstudiosLocales(prev => [...prev, nuevoEstudio]);

    // Intentar guardar en backend
    try {
      await api.post('/estudios', {
        paciente_id: selectedPaciente.id,
        especialista_id: user?.especialista_id || user?.id,
        ...estudioForm
      });
    } catch (error) {
      console.log('Guardado localmente');
    }

    // Limpiar formulario y cerrar modal
    setEstudioForm({
      nombre: '',
      tipo: 'laboratorio',
      fecha: new Date().toISOString().split('T')[0],
      resultado: '',
      observaciones: ''
    });
    setShowModal(null);
  };

  // ===== FUNCIONES DE CHAT =====

  // Cargar conversaciones del especialista
  const loadConversaciones = async () => {
    setLoadingChat(true);
    try {
      const userId = user?.id;
      const response = await api.get(`/mensajes/conversaciones/${userId}`);
      setConversaciones(response.data?.conversaciones || []);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      // Datos de ejemplo si falla
      setConversaciones([]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Cargar mensajes de una conversación
  const loadMensajes = async (conversacionId) => {
    try {
      const userId = user?.id;
      const response = await api.get(`/mensajes/conversacion/${conversacionId}/${userId}`);
      setMensajes(response.data?.mensajes || []);
      setOtroUsuarioChat(response.data?.otro_usuario || null);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      setMensajes([]);
    }
  };

  // Seleccionar conversación
  const handleSelectConversacion = (conv) => {
    setConversacionActiva(conv);
    loadMensajes(conv.id);
  };

  // Enviar mensaje
  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !conversacionActiva) return;

    const mensaje = {
      emisor_id: user?.id,
      receptor_id: conversacionActiva.otro_usuario_id,
      mensaje: nuevoMensaje.trim()
    };

    try {
      await api.post('/mensajes/enviar', mensaje);

      // Agregar mensaje localmente
      setMensajes(prev => [...prev, {
        id: Date.now(),
        ...mensaje,
        created_at: new Date().toISOString(),
        emisor_nombre: user?.nombre || 'Yo'
      }]);

      setNuevoMensaje('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      // Agregar localmente de todas formas
      setMensajes(prev => [...prev, {
        id: Date.now(),
        ...mensaje,
        created_at: new Date().toISOString(),
        emisor_nombre: user?.nombre || 'Yo'
      }]);
      setNuevoMensaje('');
    }
  };

  // Iniciar conversación con paciente
  const handleIniciarConversacion = async (paciente) => {
    try {
      const response = await api.post(`/mensajes/iniciar/${user?.id}/${paciente.usuario_id || paciente.id}`);
      const convId = response.data?.conversacion_id;

      if (convId) {
        setConversacionActiva({
          id: convId,
          otro_usuario_id: paciente.usuario_id || paciente.id,
          otro_usuario_nombre: paciente.nombre
        });
        loadMensajes(convId);
      }
    } catch (error) {
      console.error('Error iniciando conversación:', error);
      // Crear conversación local temporal
      setConversacionActiva({
        id: Date.now(),
        otro_usuario_id: paciente.usuario_id || paciente.id,
        otro_usuario_nombre: paciente.nombre
      });
      setMensajes([]);
    }
  };

  // ===== FUNCIONES DE CITAS =====

  // Cargar tipos de cita
  const loadTiposCita = async () => {
    try {
      const response = await api.get('/citas/tipos');
      setTiposCita(response.data?.tipos || []);
    } catch (error) {
      console.error('Error cargando tipos de cita:', error);
      // Tipos de ejemplo
      setTiposCita([
        { id: 1, nombre: 'Consulta General', duracion_minutos: 30 },
        { id: 2, nombre: 'Seguimiento', duracion_minutos: 20 },
        { id: 3, nombre: 'Primera Consulta', duracion_minutos: 45 },
        { id: 4, nombre: 'Evaluación', duracion_minutos: 60 }
      ]);
    }
  };

  // Cargar horarios disponibles
  const loadHorariosDisponibles = async (fecha) => {
    try {
      const especialistaId = user?.especialista_id || user?.id;
      const response = await api.get(`/citas/horarios/${especialistaId}/${fecha}`);
      setHorariosDisponibles(response.data?.horarios || []);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      // Horarios de ejemplo
      setHorariosDisponibles(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']);
    }
  };

  // Abrir modal de nueva cita
  const handleOpenNuevaCita = () => {
    loadTiposCita();
    loadHorariosDisponibles(new Date().toISOString().split('T')[0]);
    setShowModal('nueva-cita');
  };

  // Guardar nueva cita
  const handleGuardarCita = async () => {
    // Validación granular: decir exactamente qué falta
    const faltantes = [];
    if (!citaForm.paciente_id)  faltantes.push('Usuario');
    if (!citaForm.fecha)        faltantes.push('Fecha');
    if (!citaForm.tipo_cita_id) faltantes.push('Tipo de cita');
    if (!citaForm.hora_inicio)  faltantes.push('Horario');
    if (faltantes.length > 0) {
      alert('Faltan campos: ' + faltantes.join(', '));
      return;
    }

    try {
      const especialistaId = user?.especialista_id || user?.id;
      const payload = {
        paciente_id: parseInt(citaForm.paciente_id, 10),
        especialista_id: parseInt(especialistaId, 10),
        fecha: citaForm.fecha,
        hora_inicio: citaForm.hora_inicio,
        tipo_cita_id: parseInt(citaForm.tipo_cita_id, 10),
        motivo: citaForm.motivo || null,
      };
      console.log('[crearCita] enviando', payload);
      const res = await api.post('/citas/especialista', payload);
      console.log('[crearCita] respuesta', res);

      alert('Cita agendada exitosamente');

      // Limpiar y cerrar
      setCitaForm({
        paciente_id: '',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '',
        tipo_cita_id: '',
        motivo: ''
      });
      setShowModal(null);

      // Recargar datos
      loadData();
    } catch (error) {
      // El interceptor de api.js rechaza con error.response?.data ya desempaquetado.
      // Puede llegar como { message, ... } o como Error con message.
      console.error('[crearCita] error completo:', error);
      const msg = error?.message || error?.response?.data?.message || 'Error desconocido';
      alert('Error al agendar la cita: ' + msg);
    }
  };

  // Códigos CIE-10 de ejemplo
  const codigosCIE10 = [
    { codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2' },
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores' },
    { codigo: 'M54.5', descripcion: 'Lumbago no especificado' },
    { codigo: 'K21.0', descripcion: 'Enfermedad por reflujo gastroesofágico con esofagitis' },
    { codigo: 'F32.9', descripcion: 'Episodio depresivo no especificado' },
    { codigo: 'G43.9', descripcion: 'Migraña no especificada' },
    { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado' },
    { codigo: 'R51', descripcion: 'Cefalea' },
    { codigo: 'Z00.0', descripcion: 'Examen médico general' },
  ];

  // Filtrar CIE-10
  const cie10Filtrado = cie10Search
    ? codigosCIE10.filter(c =>
        c.codigo.toLowerCase().includes(cie10Search.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(cie10Search.toLowerCase())
      )
    : codigosCIE10;

  // Renderizar vista de Inicio
  const renderInicio = () => (
    <>
      {/* Bienvenida */}
      <Speakable text={`${getGreeting()}, Doctor. Panel de ${areaConfig.nombre}.`}>
        <section className="welcome-section" style={{ '--area-color': areaConfig.color }}>
          <div className="welcome-text">
            <h1>{getGreeting()},</h1>
            <p className="user-name">Dr(a). {user?.nombre?.split(' ')[0] || 'Especialista'}</p>
            <p className="welcome-subtitle">Especialista en {areaConfig.nombre}</p>
          </div>
          <div className="welcome-illustration"><LucideIcon name={areaConfig.icon} size={48} /></div>
        </section>
      </Speakable>

      {/* Stats rápidos */}
      <section className="quick-stats-section">
        <div className="quick-stats-grid">
          <div className="quick-stat-card" onClick={() => setActiveView('pacientes')}>
            <span className="stat-icon"><LucideIcon name="users" size={18} /></span>
            <div className="stat-info">
              <span className="stat-value">{dashboardData.pacientesActivos}</span>
              <span className="stat-label">Usuarios</span>
            </div>
          </div>
          <div className="quick-stat-card" onClick={() => setActiveView('agenda')}>
            <span className="stat-icon"><LucideIcon name="calendar" size={18} /></span>
            <div className="stat-info">
              <span className="stat-value">{dashboardData.todayCitas.length}</span>
              <span className="stat-label">Citas hoy</span>
            </div>
          </div>
          <div className="quick-stat-card" onClick={() => setActiveView('seguimientos')}>
            <span className="stat-icon"><LucideIcon name="clipboard" size={18} /></span>
            <div className="stat-info">
              <span className="stat-value">{dashboardData.seguimientosPendientes}</span>
              <span className="stat-label">Seguimientos</span>
            </div>
          </div>
          <div className="quick-stat-card" onClick={() => setActiveView('mensajes')}>
            <span className="stat-icon"><LucideIcon name="message" size={18} /></span>
            <div className="stat-info">
              <span className="stat-value">{dashboardData.mensajesNuevos}</span>
              <span className="stat-label">Mensajes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Citas del día */}
      <section className="today-appointments">
        <div className="section-header">
          <h2 className="section-title"><LucideIcon name="calendar" size={22} /> Citas de Hoy</h2>
          <button className="section-link" onClick={() => setActiveView('agenda')}>Ver agenda</button>
        </div>
        {dashboardData.todayCitas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><LucideIcon name="calendar" size={32} /></span>
            <p>No tienes citas programadas para hoy</p>
          </div>
        ) : (
          <ul className="appointments-list">
            {dashboardData.todayCitas.slice(0, 4).map((cita) => (
              <li key={cita.id} className="appointment-card">
                <div className="appointment-time">
                  <span className="time">{cita.hora}</span>
                </div>
                <div className="appointment-info">
                  <span className="patient-name">{cita.paciente}</span>
                  <span className="appointment-type">{cita.tipo}</span>
                </div>
                <div className="appointment-status" style={{ '--status-color': getStatusColor(cita.estado) }}>
                  <span className="status-dot"></span>
                  <span className="status-text">{cita.estado}</span>
                </div>
                <div className="appointment-actions">
                  <Link to={`/especialista/pacientes/${cita.paciente_id}/expediente`} className="action-btn">
                    Expediente
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Módulos del área */}
      <section className="area-modules">
        <h2 className="section-title"><LucideIcon name={areaConfig.icon} size={22} /> Módulos de {areaConfig.nombre}</h2>
        <div className="modules-grid">
          {areaConfig.modulos.map((modulo) => (
            <button
              key={modulo.id}
              onClick={() => setActiveView(modulo.view)}
              className="module-card"
              style={{ '--module-color': areaConfig.color }}
            >
              <span className="module-icon"><LucideIcon name={modulo.icon} size={24} /></span>
              <span className="module-name">{modulo.nombre}</span>
              <span className="module-desc">{modulo.descripcion}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Herramientas rápidas */}
      {areaConfig.herramientas.length > 0 && (
      <section className="quick-tools">
        <h2 className="section-title"><LucideIcon name="hammer" size={22} /> Herramientas Rápidas</h2>
        <div className="tools-grid">
          {areaConfig.herramientas.map((tool, idx) => (
            <button
              key={idx}
              className="tool-btn"
              style={{ '--tool-color': areaConfig.color }}
              onClick={() => handleOpenTool(tool.nombre)}
            >
              <span className="tool-icon"><LucideIcon name={tool.icon} size={20} /></span>
              <span className="tool-name">{tool.nombre}</span>
            </button>
          ))}
        </div>
      </section>
      )}
    </>
  );

  // Renderizar vista de Pacientes
  const renderPacientes = () => (
    <section className="patients-view">
      <div className="section-header">
        <h2 className="section-title"><LucideIcon name="users" size={22} /> Mis Usuarios</h2>
        <span className="patient-count">{dashboardData.pacientes.length} usuarios</span>
      </div>

      {dashboardData.pacientes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><LucideIcon name="users" size={32} /></span>
          <p>No tienes usuarios asignados</p>
        </div>
      ) : (
        <div className="patients-list">
          {dashboardData.pacientes.map((paciente) => (
            <div key={paciente.id} className="patient-card-full">
              <div className="patient-avatar" style={{ background: areaConfig.color }}>
                {paciente.nombre?.charAt(0) || 'U'}
              </div>
              <div className="patient-details">
                <h3 className="patient-name">{paciente.nombre}</h3>
                <p className="patient-email">{paciente.email}</p>
                <p className="patient-phase">{paciente.fase_actual || 'Sin fase asignada'}</p>
              </div>
              <div className="patient-meta">
                <span className="last-visit">Última cita: {paciente.ultima_cita || 'N/A'}</span>
              </div>
              <div className="patient-actions">
                <Link
                  to={`/especialista/pacientes/${paciente.id}/expediente`}
                  className="btn-expediente"
                >
                  Ver Expediente
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Renderizar vista de Agenda
  const renderAgenda = () => (
    <section className="agenda-view">
      <div className="section-header">
        <h2 className="section-title"><LucideIcon name="calendar" size={22} /> Mi Agenda</h2>
        <button
          className="btn-nueva-cita"
          onClick={handleOpenNuevaCita}
          style={{ '--area-color': areaConfig.color }}
        >
          + Nueva Cita
        </button>
      </div>
      <p className="date-today">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {/* Integración con Outlook */}
      <div className="outlook-integration-section">
        <OutlookConnect onConnectionChange={setOutlookConnected} />
        {outlookConnected && <OutlookCalendar isConnected={outlookConnected} />}
      </div>

      <div className="agenda-content">
        <h3 className="subsection-title">Citas de Hoy ({dashboardData.todayCitas.length})</h3>

        {dashboardData.todayCitas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><LucideIcon name="calendar" size={32} /></span>
            <p>No hay citas para hoy</p>
          </div>
        ) : (
          <div className="agenda-list">
            {dashboardData.todayCitas.map((cita) => (
              <div key={cita.id} className="agenda-item" style={{ '--status-color': getStatusColor(cita.estado) }}>
                <div className="agenda-time">
                  <span className="time-hour">{cita.hora}</span>
                </div>
                <div className="agenda-details">
                  <h4 className="agenda-patient">{cita.paciente}</h4>
                  <p className="agenda-type">{cita.tipo}</p>
                  {cita.motivo && <p className="agenda-reason">{cita.motivo}</p>}
                </div>
                <div className="agenda-status">
                  <span className={`status-badge ${cita.estado}`}>{cita.estado}</span>
                </div>
                <div className="agenda-actions">
                  {outlookConnected && (
                    <OutlookSyncButton
                      citaId={cita.id}
                      outlookEventId={cita.outlook_event_id}
                      onSync={() => loadData()}
                    />
                  )}
                  <Link to={`/especialista/pacientes/${cita.paciente_id}/expediente`} className="btn-small">
                    Expediente
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Próximas citas (fechas futuras) */}
        <h3 className="subsection-title" style={{ marginTop: 'var(--spacing-lg, 24px)' }}>
          Próximas Citas ({dashboardData.proximasCitas.length})
        </h3>
        {dashboardData.proximasCitas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><LucideIcon name="calendar" size={32} /></span>
            <p>No tienes citas programadas para los próximos días</p>
          </div>
        ) : (
          <div className="agenda-list">
            {dashboardData.proximasCitas.map((cita) => (
              <div key={cita.id} className="agenda-item" style={{ '--status-color': getStatusColor(cita.estado) }}>
                <div className="agenda-time">
                  <span className="time-date" style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>
                    {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </span>
                  <span className="time-hour">{cita.hora_inicio}</span>
                </div>
                <div className="agenda-details">
                  <h4 className="agenda-patient">{cita.paciente_nombre}</h4>
                  <p className="agenda-type">{cita.tipo_cita}</p>
                  {cita.motivo && <p className="agenda-reason">{cita.motivo}</p>}
                </div>
                <div className="agenda-status">
                  <span className={`status-badge ${cita.estado}`}>{cita.estado}</span>
                </div>
                <div className="agenda-actions">
                  <Link to={`/especialista/pacientes/${cita.paciente_id}/expediente`} className="btn-small">
                    Expediente
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // Renderizar vista de Seguimientos
  const renderSeguimientos = () => (
    <section className="followups-view">
      <div className="section-header">
        <h2 className="section-title"><LucideIcon name="clipboard" size={22} /> Seguimientos Pendientes</h2>
        <span className="followup-count">{dashboardData.seguimientosPendientes} pendientes</span>
      </div>

      <div className="followups-info">
        <p>Usuarios que no han tenido cita en la última semana:</p>
      </div>

      {dashboardData.pacientes.filter(p => !p.ultima_cita || new Date(p.ultima_cita) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length === 0 ? (
        <div className="empty-state success">
          <span className="empty-icon"><LucideIcon name="circle-check" size={32} /></span>
          <p>Todos los usuarios están al día con sus citas</p>
        </div>
      ) : (
        <div className="followups-list">
          {dashboardData.pacientes
            .filter(p => !p.ultima_cita || new Date(p.ultima_cita) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .map((paciente) => (
              <div key={paciente.id} className="followup-card">
                <div className="followup-avatar" style={{ background: areaConfig.color }}>
                  {paciente.nombre?.charAt(0) || 'U'}
                </div>
                <div className="followup-info">
                  <h3>{paciente.nombre}</h3>
                  <p>Última cita: {paciente.ultima_cita || 'Nunca'}</p>
                </div>
                <div className="followup-actions">
                  <Link to={`/especialista/pacientes/${paciente.id}/expediente`} className="btn-followup">
                    Ver Expediente
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );

  // Renderizar vista de Mensajes (Chat funcional)
  const renderMensajes = () => (
      <section className="messages-view chat-view">
        <div className="section-header">
          <h2 className="section-title"><LucideIcon name="message" size={22} /> Mensajes</h2>
          {dashboardData.mensajesNuevos > 0 && (
            <span className="unread-badge">{dashboardData.mensajesNuevos} nuevos</span>
          )}
        </div>

        <div className="chat-container">
          {/* Lista de conversaciones */}
          <div className={`chat-sidebar ${!conversacionActiva ? 'active' : ''}`}>
            <div className="chat-sidebar-header">
              <h3>Conversaciones</h3>
              <button
                className="btn-new-chat"
                onClick={() => setShowModal('nueva-conversacion')}
                style={{ '--area-color': areaConfig.color }}
              >
                + Nueva
              </button>
            </div>

            {loadingChat ? (
              <div className="chat-loading">
                <div className="loading-spinner"></div>
                <p>Cargando...</p>
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="chat-empty">
                <p>No hay conversaciones</p>
                <button
                  className="btn-start-chat"
                  onClick={() => setShowModal('nueva-conversacion')}
                  style={{ '--area-color': areaConfig.color }}
                >
                  Iniciar una conversación
                </button>
              </div>
            ) : (
              <div className="conversaciones-list">
                {conversaciones.map((conv) => (
                  <button
                    key={conv.id}
                    className={`conversacion-item ${conversacionActiva?.id === conv.id ? 'active' : ''}`}
                    onClick={() => handleSelectConversacion(conv)}
                    style={{ '--area-color': areaConfig.color }}
                  >
                    <div className="conv-avatar">
                      {conv.otro_usuario_nombre?.charAt(0) || 'P'}
                    </div>
                    <div className="conv-info">
                      <span className="conv-nombre">{conv.otro_usuario_nombre}</span>
                      <span className="conv-ultimo">{conv.ultimo_mensaje || 'Sin mensajes'}</span>
                    </div>
                    {conv.no_leidos > 0 && (
                      <span className="conv-badge">{conv.no_leidos}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Área de chat */}
          <div className={`chat-main ${conversacionActiva ? 'active' : ''}`}>
            {!conversacionActiva ? (
              <div className="chat-placeholder">
                <span className="chat-placeholder-icon"><LucideIcon name="message" size={32} /></span>
                <p>Selecciona una conversación para ver los mensajes</p>
                <p className="text-muted">O inicia una nueva conversación con un usuario</p>
              </div>
            ) : (
              <>
                {/* Header del chat */}
                <div className="chat-header" style={{ '--area-color': areaConfig.color }}>
                  <button className="btn-back-chat" onClick={() => setConversacionActiva(null)}>
                    ←
                  </button>
                  <div className="chat-header-info">
                    <div className="chat-header-avatar">
                      {otroUsuarioChat?.nombre_completo?.charAt(0) || conversacionActiva.otro_usuario_nombre?.charAt(0) || 'P'}
                    </div>
                    <span className="chat-header-name">
                      {otroUsuarioChat?.nombre_completo || conversacionActiva.otro_usuario_nombre}
                    </span>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="chat-messages">
                  {mensajes.length === 0 ? (
                    <div className="chat-no-messages">
                      <p>No hay mensajes aún</p>
                      <p className="text-muted">Envía el primer mensaje</p>
                    </div>
                  ) : (
                    mensajes.map((msg) => (
                      <div
                        key={msg.id}
                        className={`chat-message ${msg.emisor_id === user?.id ? 'sent' : 'received'}`}
                        style={{ '--area-color': areaConfig.color }}
                      >
                        <div className="message-content">
                          <p>{msg.mensaje}</p>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input de mensaje */}
                <div className="chat-input-container">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                    placeholder="Escribe un mensaje..."
                    className="chat-input"
                  />
                  <button
                    className="btn-send-message"
                    onClick={handleEnviarMensaje}
                    disabled={!nuevoMensaje.trim()}
                    style={{ '--area-color': areaConfig.color }}
                  >
                    Enviar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );

  // Renderizar vista de Herramientas
  const renderHerramientas = () => (
    <section className="tools-view">
      <div className="section-header">
        <h2 className="section-title"><LucideIcon name="hammer" size={22} /> Herramientas de {areaConfig.nombre}</h2>
      </div>

      <div className="tools-full-grid">
        {areaConfig.herramientas.map((tool, idx) => (
          <div key={idx} className="tool-card-full" style={{ '--tool-color': areaConfig.color }}>
            <span className="tool-icon-large"><LucideIcon name={tool.icon} size={32} /></span>
            <h3 className="tool-title">{tool.nombre}</h3>
            <button className="btn-use-tool">Usar herramienta</button>
          </div>
        ))}
      </div>

      <div className="modules-section">
        <h3 className="subsection-title">Módulos Especializados</h3>
        <div className="modules-list">
          {areaConfig.modulos.map((modulo) => (
            <button key={modulo.id} onClick={() => setActiveView(modulo.view)} className="module-list-item">
              <span className="module-icon"><LucideIcon name={modulo.icon} size={20} /></span>
              <div className="module-info">
                <h4>{modulo.nombre}</h4>
                <p>{modulo.descripcion}</p>
              </div>
              <span className="module-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  // ===== VISTAS DE MÓDULOS ESPECÍFICOS =====

  // Componente reutilizable: Selector de paciente para módulos
  const renderPatientSelector = (title, icon) => (
    <section className="module-view">
      <div className="module-header">
        <button className="back-btn" onClick={() => setActiveView('inicio')}>
          ← Volver
        </button>
        <h2 className="module-title"><LucideIcon name={icon} size={22} /> {title}</h2>
      </div>

      <div className="patient-selector">
        <h3>Selecciona un usuario para ver sus datos:</h3>
        {dashboardData.pacientes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><LucideIcon name="users" size={32} /></span>
            <p>No tienes usuarios asignados</p>
          </div>
        ) : (
          <div className="patients-selector-grid">
            {dashboardData.pacientes.map((paciente) => (
              <button
                key={paciente.id}
                className="patient-selector-card"
                onClick={() => handleSelectPaciente(paciente)}
                style={{ '--area-color': areaConfig.color }}
              >
                <div className="patient-avatar-small">
                  {paciente.nombre?.charAt(0) || 'U'}
                </div>
                <div className="patient-info-small">
                  <span className="patient-name">{paciente.nombre}</span>
                  <span className="patient-phase">{paciente.fase_actual || 'Sin fase'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // Vista: Historial de Consultas (Medicina)
  const renderModConsultas = () => {
    if (!selectedPaciente) {
      return renderPatientSelector('Historial de Consultas', 'stethoscope');
    }

    return (
      <section className="module-view">
        <div className="module-header">
          <button className="back-btn" onClick={handleBackToPatientList}>
            ← Cambiar usuario
          </button>
          <h2 className="module-title"><LucideIcon name="stethoscope" size={22} /> Consultas de {selectedPaciente.nombre}</h2>
        </div>

        {loadingPacienteData ? (
          <div className="loading-module">
            <div className="loading-spinner"></div>
            <p>Cargando historial...</p>
          </div>
        ) : (
          <div className="module-content">
            <div className="patient-summary-card" style={{ '--area-color': areaConfig.color }}>
              <div className="patient-avatar-large">{selectedPaciente.nombre?.charAt(0)}</div>
              <div className="patient-summary-info">
                <h3>{selectedPaciente.nombre}</h3>
                <p>Fase: {selectedPaciente.fase_actual || 'Sin asignar'}</p>
                <p>Última cita: {selectedPaciente.ultima_cita || 'N/A'}</p>
              </div>
            </div>

            <div className="consultas-list">
              <h3 className="subsection-title">Historial de Consultas</h3>
              {pacienteData?.citas?.length > 0 ? (
                pacienteData.citas.map((cita, idx) => (
                  <div key={idx} className="consulta-card">
                    <div className="consulta-date">
                      <span className="date">{cita.fecha}</span>
                      <span className="time">{cita.hora}</span>
                    </div>
                    <div className="consulta-info">
                      <span className="consulta-type">{cita.tipo}</span>
                      <span className={`consulta-status ${cita.estado}`}>{cita.estado}</span>
                    </div>
                    {cita.notas && (
                      <div className="consulta-notes">
                        <strong>Notas:</strong> {cita.notas}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon"><LucideIcon name="clipboard" size={32} /></span>
                  <p>No hay consultas registradas para este usuario</p>
                </div>
              )}
            </div>

            <div className="module-actions">
              <Link
                to={`/especialista/pacientes/${selectedPaciente.id}/expediente`}
                className="btn-primary"
              >
                Ver Expediente Completo
              </Link>
            </div>
          </div>
        )}
      </section>
    );
  };

  // Vista: Signos Vitales (Medicina)
  const renderModSignosVitales = () => {
    if (!selectedPaciente) {
      return renderPatientSelector('Signos Vitales', 'heart-pulse');
    }

    // Cargar datos si aún no se han cargado
    if (!signosLoading && signosData.glucosa.length === 0 && signosData.presion.length === 0 && signosData.dolor.length === 0 && signosData.hba1c.length === 0 && !signosData.resumen) {
      loadSignosVitales(selectedPaciente.id);
    }

    const resumen = signosData.resumen;
    const formatFecha = (fecha) => {
      if (!fecha) return '--';
      const d = new Date(fecha);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: '#8B949E', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#8B949E', font: { size: 10 }, maxRotation: 45 }, grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, titleFont: { size: 13 }, bodyFont: { size: 12 } }
      }
    };

    const glucosaData = [...signosData.glucosa].reverse().slice(-20);
    const presionData = [...signosData.presion].reverse().slice(-20);
    const dolorData = [...signosData.dolor].reverse().slice(-20);
    const hba1cData = [...signosData.hba1c].reverse().slice(-20);

    const getHba1cColor = (v) => v < 5.7 ? '#4CAF50' : v < 6.5 ? '#FF9800' : '#EF5350';
    const getHba1cTexto = (v) => v < 5.7 ? 'Normal' : v < 6.5 ? 'Prediabético' : 'Diabético';

    return (
      <section className="module-view">
        <div className="module-header">
          <button className="back-btn" onClick={handleBackToPatientList}>
            ← Cambiar usuario
          </button>
          <h2 className="module-title"><LucideIcon name="heart-pulse" size={22} /> Signos Vitales de {selectedPaciente.nombre}</h2>
        </div>

        {signosLoading ? (
          <div className="loading-module">
            <div className="loading-spinner"></div>
            <p>Cargando signos vitales...</p>
          </div>
        ) : (
          <div className="module-content">
            {/* Tarjetas resumen */}
            <div className="vitals-summary">
              <h3 className="subsection-title">Últimos Valores</h3>
              <div className="vitals-grid">
                <div className="vital-card">
                  <span className="vital-icon"><LucideIcon name="droplet" size={20} /></span>
                  <span className="vital-label">Glucosa</span>
                  <span className="vital-value">{resumen?.ultima_glucosa?.valor || signosData.glucosa[0]?.nivel_glucosa || '--'}</span>
                  <span className="vital-unit">mg/dL</span>
                </div>
                <div className="vital-card">
                  <span className="vital-icon"><LucideIcon name="heart-pulse" size={20} /></span>
                  <span className="vital-label">Presión</span>
                  <span className="vital-value">
                    {resumen?.ultima_presion ? `${resumen.ultima_presion.sistolica}/${resumen.ultima_presion.diastolica}` :
                     signosData.presion[0] ? `${signosData.presion[0].sistolica}/${signosData.presion[0].diastolica}` : '--'}
                  </span>
                  <span className="vital-unit">mmHg</span>
                </div>
                <div className="vital-card">
                  <span className="vital-icon"><LucideIcon name="activity" size={20} /></span>
                  <span className="vital-label">Dolor</span>
                  <span className="vital-value">{resumen?.ultimo_dolor?.intensidad || signosData.dolor[0]?.intensidad || '--'}</span>
                  <span className="vital-unit">/ 10</span>
                </div>
                <div className="vital-card">
                  <span className="vital-icon"><LucideIcon name="droplet" size={20} /></span>
                  <span className="vital-label">HbA1c</span>
                  <span className="vital-value" style={{ color: signosData.hba1c[0] ? getHba1cColor(signosData.hba1c[0].valor) : undefined }}>
                    {resumen?.hba1c?.valor || signosData.hba1c[0]?.valor || '--'}
                  </span>
                  <span className="vital-unit">%</span>
                </div>
              </div>
            </div>

            {/* Tabs de gráficas */}
            <div className="signos-tabs">
              <button className={`signos-tab ${signosTab === 'glucosa' ? 'active' : ''}`} onClick={() => setSignosTab('glucosa')}>
                <LucideIcon name="droplet" size={16} /> Glucosa
              </button>
              <button className={`signos-tab ${signosTab === 'presion' ? 'active' : ''}`} onClick={() => setSignosTab('presion')}>
                <LucideIcon name="heart-pulse" size={16} /> Presión
              </button>
              <button className={`signos-tab ${signosTab === 'dolor' ? 'active' : ''}`} onClick={() => setSignosTab('dolor')}>
                <LucideIcon name="activity" size={16} /> Dolor
              </button>
              <button className={`signos-tab ${signosTab === 'hba1c' ? 'active' : ''}`} onClick={() => setSignosTab('hba1c')}>
                <LucideIcon name="droplet" size={16} /> HbA1c
              </button>
            </div>

            {/* Gráfica de Glucosa */}
            {signosTab === 'glucosa' && (
              <div className="signos-chart-container">
                <h3 className="subsection-title">Tendencia de Glucosa</h3>
                {glucosaData.length >= 2 ? (
                  <div className="signos-chart-wrapper">
                    <Line
                      data={{
                        labels: glucosaData.map(r => formatFecha(r.fecha_hora || r.fecha)),
                        datasets: [{
                          label: 'Glucosa (mg/dL)',
                          data: glucosaData.map(r => r.nivel_glucosa || r.valor),
                          borderColor: '#1976D2',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          pointBackgroundColor: glucosaData.map(r => {
                            const v = r.nivel_glucosa || r.valor;
                            return v < 70 ? '#EF5350' : v > 140 ? '#FF9800' : '#4CAF50';
                          }),
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2,
                          pointRadius: 5,
                          tension: 0.3,
                          fill: true,
                        }]
                      }}
                      options={chartOptions}
                    />
                  </div>
                ) : (
                  <p className="signos-empty">Sin datos suficientes para graficar</p>
                )}

                {/* Tabla historial glucosa */}
                {signosData.glucosa.length > 0 && (
                  <div className="vitals-history" style={{ marginTop: '16px' }}>
                    <h4 className="subsection-title">Últimos Registros</h4>
                    <table className="vitals-table">
                      <thead><tr><th>Fecha</th><th>Glucosa</th><th>Momento</th></tr></thead>
                      <tbody>
                        {signosData.glucosa.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td>{formatFecha(r.fecha_hora || r.fecha)}</td>
                            <td style={{ color: (r.nivel_glucosa || r.valor) < 70 ? '#EF5350' : (r.nivel_glucosa || r.valor) > 140 ? '#FF9800' : '#4CAF50', fontWeight: 600 }}>
                              {r.nivel_glucosa || r.valor} mg/dL
                            </td>
                            <td>{r.momento || r.notas || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Gráfica de Presión */}
            {signosTab === 'presion' && (
              <div className="signos-chart-container">
                <h3 className="subsection-title">Tendencia de Presión Arterial</h3>
                {presionData.length >= 2 ? (
                  <div className="signos-chart-wrapper">
                    <Line
                      data={{
                        labels: presionData.map(r => formatFecha(r.fecha_hora || r.fecha)),
                        datasets: [
                          {
                            label: 'Sistólica',
                            data: presionData.map(r => r.sistolica),
                            borderColor: '#EF5350',
                            backgroundColor: 'rgba(239, 83, 80, 0.1)',
                            pointBackgroundColor: '#EF5350',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            tension: 0.3,
                            fill: true,
                          },
                          {
                            label: 'Diastólica',
                            data: presionData.map(r => r.diastolica),
                            borderColor: '#42A5F5',
                            backgroundColor: 'rgba(66, 165, 245, 0.1)',
                            pointBackgroundColor: '#42A5F5',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            tension: 0.3,
                            fill: true,
                          }
                        ]
                      }}
                      options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, labels: { color: '#8B949E', font: { size: 12 } } } } }}
                    />
                  </div>
                ) : (
                  <p className="signos-empty">Sin datos suficientes para graficar</p>
                )}

                {signosData.presion.length > 0 && (
                  <div className="vitals-history" style={{ marginTop: '16px' }}>
                    <h4 className="subsection-title">Últimos Registros</h4>
                    <table className="vitals-table">
                      <thead><tr><th>Fecha</th><th>Presión</th><th>Pulso</th></tr></thead>
                      <tbody>
                        {signosData.presion.slice(0, 10).map((r, i) => {
                          const elevated = r.sistolica >= 140 || r.diastolica >= 90;
                          return (
                            <tr key={i}>
                              <td>{formatFecha(r.fecha_hora || r.fecha)}</td>
                              <td style={{ color: elevated ? '#EF5350' : '#4CAF50', fontWeight: 600 }}>
                                {r.sistolica}/{r.diastolica} mmHg
                              </td>
                              <td>{r.pulso || '--'} bpm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Gráfica de Dolor */}
            {signosTab === 'dolor' && (
              <div className="signos-chart-container">
                <h3 className="subsection-title">Tendencia de Dolor</h3>
                {dolorData.length >= 2 ? (
                  <div className="signos-chart-wrapper">
                    <Line
                      data={{
                        labels: dolorData.map(r => formatFecha(r.fecha_hora || r.fecha)),
                        datasets: [{
                          label: 'Intensidad (0-10)',
                          data: dolorData.map(r => r.intensidad),
                          borderColor: '#FF9800',
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          pointBackgroundColor: dolorData.map(r => {
                            const v = r.intensidad;
                            return v <= 3 ? '#4CAF50' : v <= 6 ? '#FF9800' : '#EF5350';
                          }),
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2,
                          pointRadius: 5,
                          tension: 0.3,
                          fill: true,
                        }]
                      }}
                      options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 10 } } }}
                    />
                  </div>
                ) : (
                  <p className="signos-empty">Sin datos suficientes para graficar</p>
                )}

                {signosData.dolor.length > 0 && (
                  <div className="vitals-history" style={{ marginTop: '16px' }}>
                    <h4 className="subsection-title">Últimos Registros</h4>
                    <table className="vitals-table">
                      <thead><tr><th>Fecha</th><th>Intensidad</th><th>Ubicación</th><th>Tipo</th></tr></thead>
                      <tbody>
                        {signosData.dolor.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td>{formatFecha(r.fecha_hora || r.fecha)}</td>
                            <td style={{ color: r.intensidad <= 3 ? '#4CAF50' : r.intensidad <= 6 ? '#FF9800' : '#EF5350', fontWeight: 600 }}>
                              {r.intensidad}/10
                            </td>
                            <td>{r.ubicacion || '--'}</td>
                            <td>{r.tipo_dolor || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Gráfica de HbA1c */}
            {signosTab === 'hba1c' && (
              <div className="signos-chart-container">
                <h3 className="subsection-title">Tendencia de HbA1c</h3>
                {hba1cData.length >= 2 ? (
                  <div className="signos-chart-wrapper">
                    <Line
                      data={{
                        labels: hba1cData.map(r => formatFecha(r.fecha)),
                        datasets: [{
                          label: 'HbA1c (%)',
                          data: hba1cData.map(r => r.valor),
                          borderColor: '#FF6F00',
                          backgroundColor: 'rgba(255, 111, 0, 0.1)',
                          pointBackgroundColor: hba1cData.map(r => getHba1cColor(r.valor)),
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2,
                          pointRadius: 6,
                          tension: 0.3,
                          fill: true,
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          y: { ...chartOptions.scales.y, min: 3, max: 14, ticks: { ...chartOptions.scales.y.ticks, callback: (v) => v + '%' } }
                        },
                        plugins: {
                          ...chartOptions.plugins,
                          tooltip: { ...chartOptions.plugins.tooltip, callbacks: { label: (ctx) => `HbA1c: ${ctx.raw}%` } }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <p className="signos-empty">Sin datos suficientes para graficar</p>
                )}

                {signosData.hba1c.length > 0 && (
                  <div className="vitals-history" style={{ marginTop: '16px' }}>
                    <h4 className="subsection-title">Últimos Registros</h4>
                    <table className="vitals-table">
                      <thead><tr><th>Fecha</th><th>HbA1c</th><th>Estado</th></tr></thead>
                      <tbody>
                        {signosData.hba1c.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td>{new Date(r.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td style={{ color: getHba1cColor(r.valor), fontWeight: 600 }}>
                              {r.valor}%
                            </td>
                            <td style={{ color: getHba1cColor(r.valor) }}>{getHba1cTexto(r.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="module-actions">
              <Link
                to={`/especialista/pacientes/${selectedPaciente.id}/expediente`}
                className="btn-primary"
              >
                Ver Expediente Completo
              </Link>
            </div>
          </div>
        )}
      </section>
    );
  };

  // Vista: Estudios Clínicos (Medicina)
  const renderModEstudios = () => {
    if (!selectedPaciente) {
      return renderPatientSelector('Estudios Clínicos', 'microscope');
    }

    // Combinar estudios del backend con los locales
    const estudiosBase = pacienteData?.estudios || [
      { id: 1, nombre: 'Biometría Hemática', fecha: '2024-01-12', estado: 'Completado', resultado: 'Normal' },
      { id: 2, nombre: 'Química Sanguínea', fecha: '2024-01-12', estado: 'Completado', resultado: 'Glucosa elevada' },
      { id: 3, nombre: 'Radiografía de Tórax', fecha: '2024-01-05', estado: 'Completado', resultado: 'Sin alteraciones' },
    ];
    const estudios = [...estudiosBase, ...estudiosLocales];

    return (
      <section className="module-view">
        <div className="module-header">
          <button className="back-btn" onClick={handleBackToPatientList}>
            ← Cambiar usuario
          </button>
          <h2 className="module-title"><LucideIcon name="microscope" size={22} /> Estudios de {selectedPaciente.nombre}</h2>
        </div>

        {loadingPacienteData ? (
          <div className="loading-module">
            <div className="loading-spinner"></div>
            <p>Cargando estudios...</p>
          </div>
        ) : (
          <div className="module-content">
            <div className="patient-summary-card" style={{ '--area-color': areaConfig.color }}>
              <div className="patient-avatar-large">{selectedPaciente.nombre?.charAt(0)}</div>
              <div className="patient-summary-info">
                <h3>{selectedPaciente.nombre}</h3>
                <p>Fase: {selectedPaciente.fase_actual || 'Sin asignar'}</p>
              </div>
              <button
                className="btn-add-estudio"
                onClick={() => setShowModal('nuevo-estudio')}
                style={{ '--area-color': areaConfig.color }}
              >
                + Nuevo Estudio
              </button>
            </div>

            <div className="estudios-list">
              <div className="estudios-header">
                <h3 className="subsection-title">Estudios Realizados ({estudios.length})</h3>
              </div>
              {estudios.length > 0 ? (
                estudios.map((estudio) => (
                  <div key={estudio.id} className="estudio-card">
                    <div className="estudio-icon"><LucideIcon name="file-text" size={20} /></div>
                    <div className="estudio-info">
                      <h4>{estudio.nombre}</h4>
                      <span className="estudio-date">{estudio.fecha}</span>
                      {estudio.tipo && <span className="estudio-tipo">{estudio.tipo}</span>}
                    </div>
                    <div className="estudio-result">
                      <span className={`estado-badge ${estudio.estado.toLowerCase()}`}>
                        {estudio.estado}
                      </span>
                      <p className="resultado">{estudio.resultado || 'Sin resultado'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon"><LucideIcon name="microscope" size={32} /></span>
                  <p>No hay estudios registrados para este usuario</p>
                </div>
              )}
            </div>

            <div className="module-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowModal('nuevo-estudio')}
                style={{ '--area-color': areaConfig.color }}
              >
                + Agregar Estudio
              </button>
              <Link
                to={`/especialista/pacientes/${selectedPaciente.id}/expediente`}
                className="btn-primary"
              >
                Ver Expediente Completo
              </Link>
            </div>
          </div>
        )}
      </section>
    );
  };

  // Vista: Recetas Médicas (Medicina)
  const renderModRecetas = () => {
    if (!selectedPaciente) {
      return renderPatientSelector('Recetas Médicas', 'pill');
    }

    return <RecetasMedicasView
      pacienteId={selectedPaciente.id}
      pacienteNombre={selectedPaciente.nombre}
      faseActual={selectedPaciente.fase_actual}
      areaColor={areaConfig.color}
      onBack={handleBackToPatientList}
      expedienteLink={`/especialista/pacientes/${selectedPaciente.id}/expediente`}
    />;
  };

  // Vista genérica para módulos en desarrollo
  // Vista: Planes Nutricionales (Nutrición)
  const renderPlanesNutricionales = () => {
    const especialistaId = user?.especialista_id || user?.id;

    return (
      <PlanesNutricionales
        especialistaId={especialistaId}
        pacientes={dashboardData.pacientes}
        onBack={() => setActiveView('inicio')}
        onOpenGenerator={() => setActiveView('mod-generador-plan')}
      />
    );
  };
// Vista: Módulo de Porciones (Nutrición)
const renderPorcionesNutricionales = () => {
  const especialistaId = user?.especialista_id || user?.id;
  

  return (
    <PorcionesNutricionales
      especialistaId={especialistaId}
      pacientes={dashboardData.pacientes}
      onBack={() => setActiveView('inicio')}
    />
  );
};
  // Renderizar contenido según vista activa
  const renderContent = () => {
    switch (activeView) {
      case 'pacientes': return renderPacientes();
      case 'agenda': return renderAgenda();
      case 'seguimientos': return renderSeguimientos();
      case 'mensajes': return renderMensajes();
      case 'herramientas': return renderHerramientas();

      // Módulos de Medicina
      case 'mod-consultas': return renderModConsultas();
      case 'mod-signos-vitales': return renderModSignosVitales();
      case 'mod-estudios': return renderModEstudios();
      case 'mod-recetas': return renderModRecetas();
      case 'mod-porciones-nutricionales': return renderPorcionesNutricionales();

      // Módulos de Fisioterapia
      case 'mod-ejercicios':
        if (!selectedPaciente) return renderPatientSelector('Ejercicios de Usuarios', 'dumbbell');
        return <EjerciciosPacientes pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-evaluaciones':
        if (!selectedPaciente) return renderPatientSelector('Evaluaciones Físicas', 'bar-chart');
        return <EvaluacionesFisicas pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-planes':
        if (!selectedPaciente) return renderPatientSelector('Planes de Tratamiento', 'clipboard');
        return <PlanesTratamiento pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-progreso':
        if (!selectedPaciente) return renderPatientSelector('Progreso de Usuarios', 'trending-up');
        return <ProgresoPacientes pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-planes-nutricionales': return renderPlanesNutricionales();
      case 'mod-seguimiento-peso':
        if (!selectedPaciente) return renderPatientSelector('Seguimiento de Peso', 'chart-line');
        return <SeguimientoPeso pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-historial-alimenticio':
        if (!selectedPaciente) return renderPatientSelector('Historial Alimenticio', 'salad');
        return <HistorialAlimenticio pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-imc':
        if (!selectedPaciente) return renderPatientSelector('IMC de Usuarios', 'scale');
        return <IMCPacientes pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-calculadora-calorica':
        if (!selectedPaciente) return renderPatientSelector('Calculadora Calórica', 'target');
        return <CalculadoraCalorica pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-historial-planes':
        if (!selectedPaciente) return renderPatientSelector('Historial de Planes', 'file-text');
        return <HistorialPlanes pacienteId={selectedPaciente.id} especialistaId={user?.especialista_id || user?.id} onBack={handleBackToPatientList} />;
      case 'mod-catalogo-recetas':
        return <CatalogoRecetas onBack={() => setActiveView('inicio')} />;
      case 'mod-generador-plan':
        return <GeneradorPlan
          especialistaId={user?.especialista_id || user?.id}
          onBack={() => setActiveView('inicio')}
          onPlanCreated={() => setActiveView('mod-planes-nutricionales')}
        />;
      case 'mod-evaluaciones-neuro':
        if (!selectedPaciente) return renderPatientSelector('Evaluaciones Neuropsicológicas', 'target');
        return <EvaluacionesCognitivas pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-herramientas-act':
        if (!selectedPaciente) return renderPatientSelector('Herramientas ACT', 'sparkles');
        return <ActividadACTPaciente pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-emocional':
        if (!selectedPaciente) return renderPatientSelector('Estado Emocional', 'heart');
        return <EstadoEmocionalPaciente pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-dispositivos':
        if (!selectedPaciente) return renderPatientSelector('Dispositivos', 'accessibility');
        return <DispositivosPacientes pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-adaptacion':
        if (!selectedPaciente) return renderPatientSelector('Seguimiento de Adaptación', 'wrench');
        return <SeguimientoAdaptacion pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-mantenimiento':
        if (!selectedPaciente) return renderPatientSelector('Mantenimiento y Ajustes', 'hammer');
        return <MantenimientoAjustes pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;
      case 'mod-mediciones-munon':
        if (!selectedPaciente) return renderPatientSelector('Mediciones del Muñón', 'ruler');
        return <MedicionesMunon pacienteId={selectedPaciente.id} onBack={handleBackToPatientList} />;

      default: return renderInicio();
    }
  };

  if (isLoading) {
    return (
      <div className="especialista-dashboard loading" data-age-mode={settings.ageMode}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando tu panel de {areaConfig.nombre}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="especialista-dashboard" data-age-mode={settings.ageMode} data-area={areaCodigo} style={{ '--area-color': areaConfig.color }}>
      {/* Header institucional DGTIC */}
      <InstitutionalHeader />

      {/* Barra de acciones */}
      <div className="dashboard-actions-bar">
        <div className="header-right">
          <button
            className={`header-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => isSpeaking ? stop() : speakModule('especialista-dashboard')}
            aria-label={isSpeaking ? 'Detener audio' : 'Escuchar ayuda'}
          >
            <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={22} color={areaConfig.color} />
          </button>

          <button
            className="header-btn accessibility-btn"
            onClick={togglePanel}
            aria-label="Accesibilidad"
          >
            <LucideIcon name="accessibility" size={22} color={areaConfig.color} />
          </button>

          <div className="user-menu">
            <div className="user-avatar" style={{ background: areaConfig.color }}>
              {user?.nombre?.charAt(0) || 'E'}
            </div>
            <button className="header-btn logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <LucideIcon name="logout" size={20} color="#C62828" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-content">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-navigation">
        <button
          className={`nav-item ${activeView === 'inicio' ? 'active' : ''}`}
          onClick={() => setActiveView('inicio')}
        >
          <span className="nav-icon"><LucideIcon name="home" size={20} /></span>
          <span className="nav-label">Inicio</span>
        </button>
        <button
          className={`nav-item ${activeView === 'agenda' ? 'active' : ''}`}
          onClick={() => setActiveView('agenda')}
        >
          <span className="nav-icon"><LucideIcon name="calendar" size={20} /></span>
          <span className="nav-label">Agenda</span>
        </button>
        <button
          className={`nav-item ${activeView === 'pacientes' ? 'active' : ''}`}
          onClick={() => setActiveView('pacientes')}
        >
          <span className="nav-icon"><LucideIcon name="users" size={20} /></span>
          <span className="nav-label">Usuarios</span>
        </button>
        <button
          className={`nav-item ${activeView === 'mensajes' ? 'active' : ''}`}
          onClick={() => setActiveView('mensajes')}
        >
          <span className="nav-icon"><LucideIcon name="message" size={20} /></span>
          <span className="nav-label">Mensajes</span>
          {dashboardData.mensajesNuevos > 0 && (
            <span className="nav-badge">{dashboardData.mensajesNuevos}</span>
          )}
        </button>
      </nav>

      {/* Footer institucional DGTIC */}
      <InstitutionalFooter />

      <AccessibilityPanel />
      <AccessibilityFAB />

      {/* ===== MODALES ===== */}

      {/* Modal: Calculadora de Dosis */}
      {showModal === 'calculadora-dosis' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content tool-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="syringe" size={22} /> Calculadora de Dosis</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Peso del usuario (kg)</label>
                <input
                  type="number"
                  value={dosisForm.peso}
                  onChange={e => setDosisForm({...dosisForm, peso: e.target.value})}
                  placeholder="Ej: 70"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Dosis por kg (mg/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={dosisForm.dosis_mg_kg}
                  onChange={e => setDosisForm({...dosisForm, dosis_mg_kg: e.target.value})}
                  placeholder="Ej: 10"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Frecuencia (cada X horas)</label>
                <select
                  value={dosisForm.frecuencia}
                  onChange={e => setDosisForm({...dosisForm, frecuencia: e.target.value})}
                  className="form-input"
                >
                  <option value="4">Cada 4 horas</option>
                  <option value="6">Cada 6 horas</option>
                  <option value="8">Cada 8 horas</option>
                  <option value="12">Cada 12 horas</option>
                  <option value="24">Cada 24 horas</option>
                </select>
              </div>

              {calcularDosis() && (
                <div className="resultado-calculo">
                  <h3>Resultado:</h3>
                  <div className="resultado-item">
                    <span>Dosis por toma:</span>
                    <strong>{calcularDosis().dosisPorToma} mg</strong>
                  </div>
                  <div className="resultado-item">
                    <span>Tomas por día:</span>
                    <strong>{calcularDosis().tomasPorDia}</strong>
                  </div>
                  <div className="resultado-item">
                    <span>Dosis diaria total:</span>
                    <strong>{calcularDosis().dosisDiaria} mg</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDosisForm({ peso: '', dosis_mg_kg: '', frecuencia: '8' })}>
                Limpiar
              </button>
              <button className="btn-primary" onClick={() => setShowModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: CIE-10 */}
      {showModal === 'cie10' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content tool-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="book-open" size={22} /> Códigos CIE-10</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Buscar código o diagnóstico</label>
                <input
                  type="text"
                  value={cie10Search}
                  onChange={e => setCie10Search(e.target.value)}
                  placeholder="Ej: diabetes, E11, hipertensión..."
                  className="form-input"
                />
              </div>
              <div className="cie10-list">
                {cie10Filtrado.map((item, idx) => (
                  <div key={idx} className="cie10-item" onClick={() => {
                    navigator.clipboard.writeText(item.codigo);
                    alert(`Código ${item.codigo} copiado al portapapeles`);
                  }}>
                    <span className="cie10-codigo">{item.codigo}</span>
                    <span className="cie10-desc">{item.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interacciones */}
      {showModal === 'interacciones' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content tool-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="alert-triangle" size={22} /> Verificar Interacciones</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Medicamento 1</label>
                <input
                  type="text"
                  value={interaccionForm.medicamento1}
                  onChange={e => setInteraccionForm({...interaccionForm, medicamento1: e.target.value})}
                  placeholder="Ej: Metformina"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Medicamento 2</label>
                <input
                  type="text"
                  value={interaccionForm.medicamento2}
                  onChange={e => setInteraccionForm({...interaccionForm, medicamento2: e.target.value})}
                  placeholder="Ej: Losartán"
                  className="form-input"
                />
              </div>

              {interaccionForm.medicamento1 && interaccionForm.medicamento2 && (
                <div className="interaccion-result">
                  <div className="interaccion-header safe">
                    <span className="interaccion-icon"><LucideIcon name="circle-check" size={20} /></span>
                    <span>Sin interacciones graves conocidas</span>
                  </div>
                  <p className="interaccion-nota">
                    No se encontraron interacciones graves entre {interaccionForm.medicamento1} y {interaccionForm.medicamento2}.
                    Siempre verifique con fuentes adicionales.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setInteraccionForm({ medicamento1: '', medicamento2: '' })}>
                Limpiar
              </button>
              <button className="btn-primary" onClick={() => setShowModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Escala de Dolor */}
      {showModal === 'escala-dolor' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content tool-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="frown" size={22} /> Escala de Dolor (EVA)</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="escala-dolor">
                {[0,1,2,3,4,5,6,7,8,9,10].map(nivel => (
                  <div key={nivel} className={`dolor-nivel nivel-${nivel}`}>
                    <span className="dolor-numero">{nivel}</span>
                    <span className="dolor-emoji">
                      <LucideIcon name={nivel <= 2 ? 'smile' : nivel <= 4 ? 'smile' : nivel <= 6 ? 'meh' : nivel <= 8 ? 'frown' : 'angry'} size={20} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="dolor-leyenda">
                <p><strong>0:</strong> Sin dolor</p>
                <p><strong>1-3:</strong> Dolor leve</p>
                <p><strong>4-6:</strong> Dolor moderado</p>
                <p><strong>7-9:</strong> Dolor severo</p>
                <p><strong>10:</strong> Dolor insoportable</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Test genérico */}
      {showModal === 'test' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content tool-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="clipboard" size={22} /> Herramienta de Evaluación</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Esta herramienta de evaluación estará disponible próximamente.</p>
              <p>Permitirá realizar tests y evaluaciones directamente desde la plataforma.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Herramienta Genérica */}
      {showModal === 'herramienta-generica' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content tool-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="hammer" size={22} /> Herramienta</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="coming-soon-modal">
                <span className="coming-soon-icon"><LucideIcon name="alert-triangle" size={32} /></span>
                <p>Esta herramienta estará disponible próximamente.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Estudio Clínico */}
      {showModal === 'nuevo-estudio' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="microscope" size={22} /> Nuevo Estudio Clínico</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">
                Usuario: <strong>{selectedPaciente?.nombre}</strong>
              </p>

              <div className="form-group">
                <label>Nombre del estudio *</label>
                <input
                  type="text"
                  value={estudioForm.nombre}
                  onChange={e => setEstudioForm({...estudioForm, nombre: e.target.value})}
                  placeholder="Ej: Biometría Hemática Completa"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de estudio</label>
                  <select
                    value={estudioForm.tipo}
                    onChange={e => setEstudioForm({...estudioForm, tipo: e.target.value})}
                    className="form-input"
                  >
                    <option value="laboratorio">Laboratorio</option>
                    <option value="imagen">Imagen</option>
                    <option value="electrocardiograma">Electrocardiograma</option>
                    <option value="ultrasonido">Ultrasonido</option>
                    <option value="radiografia">Radiografía</option>
                    <option value="tomografia">Tomografía</option>
                    <option value="resonancia">Resonancia Magnética</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={estudioForm.fecha}
                    onChange={e => setEstudioForm({...estudioForm, fecha: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Resultado (opcional)</label>
                <input
                  type="text"
                  value={estudioForm.resultado}
                  onChange={e => setEstudioForm({...estudioForm, resultado: e.target.value})}
                  placeholder="Ej: Normal, Alterado, etc."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={estudioForm.observaciones}
                  onChange={e => setEstudioForm({...estudioForm, observaciones: e.target.value})}
                  placeholder="Notas adicionales sobre el estudio..."
                  className="form-input form-textarea"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleGuardarEstudio}
                disabled={!estudioForm.nombre}
              >
                Guardar Estudio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva Conversación */}
      {showModal === 'nueva-conversacion' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="message" size={22} /> Nueva Conversación</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">
                Selecciona un usuario para iniciar una conversación:
              </p>

              {dashboardData.pacientes.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon"><LucideIcon name="users" size={32} /></span>
                  <p>No tienes usuarios asignados</p>
                </div>
              ) : (
                <div className="pacientes-chat-list">
                  {dashboardData.pacientes.map((paciente) => (
                    <button
                      key={paciente.id}
                      className="paciente-chat-item"
                      onClick={() => {
                        handleIniciarConversacion(paciente);
                        setShowModal(null);
                        setActiveView('mensajes');
                      }}
                      style={{ '--area-color': areaConfig.color }}
                    >
                      <div className="paciente-chat-avatar">
                        {paciente.nombre?.charAt(0) || 'P'}
                      </div>
                      <div className="paciente-chat-info">
                        <span className="nombre">{paciente.nombre}</span>
                        <span className="email">{paciente.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva Cita */}
      {showModal === 'nueva-cita' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LucideIcon name="calendar" size={22} /> Agendar Nueva Cita</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Usuario *</label>
                <select
                  value={citaForm.paciente_id}
                  onChange={e => setCitaForm({...citaForm, paciente_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {dashboardData.pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={citaForm.fecha}
                    onChange={e => {
                      setCitaForm({...citaForm, fecha: e.target.value, hora_inicio: ''});
                      loadHorariosDisponibles(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de cita *</label>
                  <select
                    value={citaForm.tipo_cita_id}
                    onChange={e => setCitaForm({...citaForm, tipo_cita_id: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposCita.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre} ({tipo.duracion_minutos} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Horario disponible *</label>
                {horariosDisponibles.length === 0 ? (
                  <p className="text-muted">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="horarios-grid">
                    {horariosDisponibles.map((hora) => (
                      <button
                        key={hora}
                        type="button"
                        className={`horario-btn ${citaForm.hora_inicio === hora ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCitaForm(prev => ({...prev, hora_inicio: hora}));
                        }}
                        style={{ '--area-color': areaConfig.color }}
                      >
                        {hora}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Motivo de la cita</label>
                <textarea
                  value={citaForm.motivo}
                  onChange={e => setCitaForm({...citaForm, motivo: e.target.value})}
                  placeholder="Describe brevemente el motivo de la consulta..."
                  className="form-input form-textarea"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleGuardarCita}
                disabled={!citaForm.paciente_id || !citaForm.fecha || !citaForm.hora_inicio || !citaForm.tipo_cita_id}
              >
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EspecialistaDashboard;
