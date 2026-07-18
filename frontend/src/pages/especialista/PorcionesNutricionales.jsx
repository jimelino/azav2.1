import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Scale } from 'lucide-react'; // Ajusta los iconos según uses en tu app

export default function PorcionesNutricionales({ especialistaId, pacientes, onBack }) {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [porciones, setPorciones] = useState([]);

  // Lista base de grupos de alimentos (Sistema de Equivalentes)
  const gruposAlimentos = [
    "Verduras", "Frutas", "Cereales sin grasa", "Cereales con grasa",
    "Leguminosas", "AOA Muy Bajo en Grasa", "AOA Bajo en Grasa", 
    "AOA Moderado en Grasa", "Leche Descremada", "Aceites sin Proteína"
  ];

  const agregarFila = () => {
    setPorciones([...porciones, { grupo: gruposAlimentos[0], cantidad: 1 }]);
  };

  const eliminarFila = (index) => {
    setPorciones(porciones.filter((_, i) => i !== index));
  };

  const manejarCambio = (index, campo, valor) => {
    const nuevasPorciones = [...porciones];
    nuevasPorciones[index][campo] = valor;
    setPorciones(nuevasPorciones);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Encabezado */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-green-600" />
            Cálculo de Porciones y Equivalentes
          </h1>
          <p className="text-sm text-gray-500">Asigna los grupos de alimentos correspondientes para el día</p>
        </div>
      </div>

      {/* Selector de Paciente */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm max-w-md">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Seleccionar Paciente</label>
        <select 
          value={pacienteSeleccionado}
          onChange={(e) => setPacienteSeleccionado(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
        >
          <option value="">-- Selecciona un paciente --</option>
          {pacientes?.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre || p.nombre_completo}</option>
          ))}
        </select>
      </div>

      {/* Tabla de Porciones */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <span className="font-semibold text-gray-700 text-sm">Distribución de Equivalentes</span>
          <button
            onClick={agregarFila}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar Grupo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
                <th className="p-4">Grupo de Alimento</th>
                <th className="p-4 w-40">Número de Porciones</th>
                <th className="p-4 w-20 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {porciones.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-sm text-gray-400">
                    No has agregado grupos de alimentos todavía. Haz clic en "Agregar Grupo".
                  </td>
                </tr>
              ) : (
                porciones.map((fila, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <select
                        value={fila.grupo}
                        onChange={(e) => manejarCambio(index, 'grupo', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        {gruposAlimentos.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={fila.cantidad}
                        onChange={(e) => manejarCambio(index, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => eliminarFila(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Botones de acción inferiores */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={!pacienteSeleccionado || porciones.length === 0}
            onClick={() => alert('¡Porciones guardadas correctamente!')}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            Guardar Porciones
          </button>
        </div>
      </div>
    </div>
  );
}
