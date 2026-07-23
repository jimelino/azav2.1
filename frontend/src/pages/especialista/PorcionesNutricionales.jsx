import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Scale, CheckCircle, Flame, FileText } from 'lucide-react';
import './EspecialistaDashboard.css';

export default function PorcionesNutricionales({ especialistaId = 1, pacientes = [], onBack }) {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  
  // Nuevos estados para Metas y Recomendaciones
  const [calorias, setCalorias] = useState('');
  const [proteinas, setProteinas] = useState('');
  const [carbohidratos, setCarbohidratos] = useState('');
  const [grasas, setGrasas] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');

  const [observaciones, setObservaciones] = useState('');
  const [porciones, setPorciones] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const gruposAlimentos = [
    "Verduras", "Frutas", "Cereales sin grasa", "Cereales con grasa",
    "Leguminosas", "AOA Muy Bajo en Grasa", "AOA Bajo en Grasa",
    "AOA Moderado en Grasa", "Leche Descremada", "Aceites sin Proteina"
  ];

  const obtenerGrupoId = (nombre) => {
    const idx = gruposAlimentos.indexOf(nombre);
    return idx !== -1 ? idx + 1 : 1;
  };

  const listaPacientes = [...pacientes];
  if (!listaPacientes.some(p => p.email === 'paciente1@test.com')) {
    listaPacientes.unshift({ id: 999, nombre: 'Paciente de Prueba', email: 'paciente1@test.com' });
  }

  const agregarFila = () => {
    setPorciones([...porciones, { grupo: gruposAlimentos[0], cantidad: 1, opciones: '' }]);
  };

  const eliminarFila = (index) => {
    setPorciones(porciones.filter((_, i) => i !== index));
  };

  const manejarCambio = (index, campo, valor) => {
    const nuevasPorciones = [...porciones];
    nuevasPorciones[index][campo] = valor;
    setPorciones(nuevasPorciones);
  };

  const guardarPlan = async (e) => {
    e.preventDefault();
    setMensajeExito('');

    if (!pacienteSeleccionado) {
      alert("Por favor selecciona un paciente.");
      return;
    }
    if (porciones.length === 0) {
      alert("Agrega al menos un grupo de alimento.");
      return;
    }

    setGuardando(true);

    const payload = {
      paciente_id: pacienteSeleccionado,
      especialista_id: especialistaId,
      calorias: calorias ? parseFloat(calorias) : 0,
      proteinas: proteinas ? parseFloat(proteinas) : 0,
      carbohidratos: carbohidratos ? parseFloat(carbohidratos) : 0,
      grasas: grasas ? parseFloat(grasas) : 0,
      recomendaciones,
      observaciones,
      grupos: porciones.map(p => ({
        grupo_id: obtenerGrupoId(p.grupo),
        numero_porciones: p.cantidad,
        opciones_sugeridas: p.opciones
      }))
    };

    try {
      const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost/azav2.1/backend/src/Controllers/guardar_porciones.php'
        : '/api/guardar_porciones';

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success') {
        setMensajeExito('¡Plan de porciones guardado con éxito!');
        setPorciones([]);
        setObservaciones('');
        setCalorias('');
        setProteinas('');
        setCarbohidratos('');
        setGrasas('');
        setRecomendaciones('');
        setPacienteSeleccionado('');

        setTimeout(() => {
          setMensajeExito('');
        }, 4000);
      } else {
        alert("Error al guardar: " + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error("Error al conectar con el backend PHP:", error);
      alert("Error de conexión con el servidor PHP.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={onBack} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
      >
        <ArrowLeft size={20} /> Volver
      </button>

      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#005691', marginTop: 0 }}>
          <Scale size={28} /> Cálculo de Porciones y Equivalentes
        </h2>
        <p style={{ color: '#666' }}>Asigna metas nutricionales, porciones de alimentos y recomendaciones para el paciente.</p>

        <form onSubmit={guardarPlan}>
          {/* Selector de Paciente */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Seleccionar Paciente:</label>
            <select
              value={pacienteSeleccionado}
              onChange={(e) => setPacienteSeleccionado(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">-- Selecciona un paciente --</option>
              {listaPacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.email})
                </option>
              ))}
            </select>
          </div>

          {/* METAS DIARIAS (CALORÍAS Y MACROS) */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <Flame size={20} color="#f97316" /> Metas Diarias (Calorías y Macronutrientes)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Calorías (kcal):</label>
                <input
                  type="number"
                  placeholder="Ej: 2000"
                  value={calorias}
                  onChange={(e) => setCalorias(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Proteínas (g):</label>
                <input
                  type="number"
                  placeholder="Ej: 120"
                  value={proteinas}
                  onChange={(e) => setProteinas(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Carbohidratos (g):</label>
                <input
                  type="number"
                  placeholder="Ej: 220"
                  value={carbohidratos}
                  onChange={(e) => setCarbohidratos(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Grasas (g):</label>
                <input
                  type="number"
                  placeholder="Ej: 60"
                  value={grasas}
                  onChange={(e) => setGrasas(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
          </div>

          {/* Distribución Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px 0' }}>
            <h3 style={{ margin: 0 }}>Distribución de Equivalentes</h3>
            <button
              type="button"
              onClick={agregarFila}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e6f0fa', color: '#0066cc', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Plus size={18} /> Agregar Grupo
            </button>
          </div>

          {porciones.length === 0 ? (
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#666', border: '1px dashed #ccc' }}>
              No has agregado grupos todavía. Haz clic en <strong>"+ Agregar Grupo"</strong>.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Grupo de Alimento</th>
                    <th style={{ padding: '10px', width: '100px' }}>Porciones</th>
                    <th style={{ padding: '10px' }}>Opciones / Ejemplos Sugeridos (Escribir)</th>
                    <th style={{ padding: '10px', width: '60px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {porciones.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={item.grupo}
                          onChange={(e) => manejarCambio(index, 'grupo', e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        >
                          {gruposAlimentos.map((g, i) => (
                            <option key={i} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={item.cantidad}
                          onChange={(e) => manejarCambio(index, 'cantidad', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <textarea
                          rows="2"
                          placeholder="Ej: 1 manzana, 1/2 taza de fresas o espinacas..."
                          value={item.opciones}
                          onChange={(e) => manejarCambio(index, 'opciones', e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => eliminarFila(index)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* RECOMENDACIONES */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '8px' }}>
              <FileText size={18} color="#2e6930" /> Recomendaciones Específicas:
            </label>
            <textarea
              rows="3"
              placeholder="Ej: Consumir suficiente agua durante el día. Evitar ultraprocesados."
              value={recomendaciones}
              onChange={(e) => setRecomendaciones(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>

          {/* Observaciones Generales */}
          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Observaciones Generales:</label>
            <textarea
              rows="2"
              placeholder="Ej: Consumir las porciones de fruta antes de las 6:00 PM."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>

          {/* Botones de acción y Aviso de éxito */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
            {mensajeExito && (
              <span style={{ 
                color: '#166534', 
                backgroundColor: '#dcfce7', 
                padding: '10px 16px', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle size={18} /> {mensajeExito}
              </span>
            )}

            <button
              type="button"
              onClick={onBack}
              style={{ background: '#e2e8f0', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {guardando ? 'Guardando...' : 'Guardar Porciones y Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}