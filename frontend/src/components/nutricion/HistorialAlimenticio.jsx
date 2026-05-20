import React, { useState, useEffect } from 'react';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './HistorialAlimenticio.css';

const HistorialAlimenticio = ({ pacienteId, onBack }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, [pacienteId, fecha]);

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/nutricion/resumen/${pacienteId}/${fecha}`);
      setResumen(res.data || null);
    } catch (error) {
      console.error('Error cargando resumen:', error);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  const cambiarDia = (delta) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + delta);
    setFecha(d.toISOString().split('T')[0]);
  };

  const formatFecha = (f) => {
    const d = new Date(f + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const tiposComida = [
    { key: 'desayuno', label: 'Desayuno', icon: 'sunrise', color: '#FF9800' },
    { key: 'almuerzo', label: 'Almuerzo', icon: 'utensils', color: '#4CAF50' },
    { key: 'comida', label: 'Comida', icon: 'utensils', color: '#2196F3' },
    { key: 'cena', label: 'Cena', icon: 'moon', color: '#9C27B0' },
    { key: 'snack', label: 'Snacks', icon: 'cookie', color: '#FF5722' },
    { key: 'colacion', label: 'Colacion', icon: 'apple', color: '#E91E63' },
  ];

  const agruparPorTipo = (comidas) => {
    if (!comidas || !Array.isArray(comidas)) return {};
    const grupos = {};
    comidas.forEach(c => {
      const tipo = c.tipo_comida || 'otro';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(c);
    });
    return grupos;
  };

  const comidas = resumen?.comidas || [];
  const grupos = agruparPorTipo(comidas);

  return (
    <div className="hist-alim-container">
      <div className="hist-alim-header">
        <div className="hist-alim-header-top">
          <button className="hist-alim-back-btn" onClick={onBack}>
            <LucideIcon name="arrow-left" size={22} />
          </button>
          <div className="hist-alim-header-title">
            <LucideIcon name="salad" size={24} />
            <h2>Historial Alimenticio</h2>
          </div>
        </div>
      </div>

      {/* Navegador de fecha */}
      <div className="hist-alim-date-nav">
        <button className="hist-alim-date-btn" onClick={() => cambiarDia(-1)}>
          <LucideIcon name="chevron-left" size={24} />
        </button>
        <div className="hist-alim-date-display">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="hist-alim-date-input" />
          <span className="hist-alim-date-text">{formatFecha(fecha)}</span>
        </div>
        <button className="hist-alim-date-btn" onClick={() => cambiarDia(1)} disabled={fecha >= new Date().toISOString().split('T')[0]}>
          <LucideIcon name="chevron-right" size={24} />
        </button>
      </div>

      {loading ? (
        <div className="hist-alim-loading">
          <div className="hist-alim-spinner"></div>
          <p>Cargando registros...</p>
        </div>
      ) : (
        <>
          {/* Resumen del dia */}
          <div className="hist-alim-summary-grid">
            <div className="hist-alim-summary-card">
              <div className="hist-alim-summary-icon cal"><LucideIcon name="flame" size={22} /></div>
              <div className="hist-alim-summary-value">{Math.round(resumen?.calorias_totales || 0)}</div>
              <div className="hist-alim-summary-label">Calorias</div>
            </div>
            <div className="hist-alim-summary-card">
              <div className="hist-alim-summary-icon prot"><LucideIcon name="beef" size={22} /></div>
              <div className="hist-alim-summary-value">{Math.round(resumen?.proteinas_totales || 0)}g</div>
              <div className="hist-alim-summary-label">Proteinas</div>
            </div>
            <div className="hist-alim-summary-card">
              <div className="hist-alim-summary-icon carb"><LucideIcon name="wheat" size={22} /></div>
              <div className="hist-alim-summary-value">{Math.round(resumen?.carbohidratos_totales || 0)}g</div>
              <div className="hist-alim-summary-label">Carbohidratos</div>
            </div>
            <div className="hist-alim-summary-card">
              <div className="hist-alim-summary-icon fat"><LucideIcon name="droplet" size={22} /></div>
              <div className="hist-alim-summary-value">{Math.round(resumen?.grasas_totales || 0)}g</div>
              <div className="hist-alim-summary-label">Grasas</div>
            </div>
          </div>

          {/* Comidas agrupadas */}
          {comidas.length === 0 ? (
            <div className="hist-alim-empty">
              <LucideIcon name="utensils" size={40} />
              <h3>No hay registros para este dia</h3>
              <p>El usuario no ha registrado comidas en esta fecha.</p>
            </div>
          ) : (
            <div className="hist-alim-meals">
              {tiposComida.map(tipo => {
                const items = grupos[tipo.key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={tipo.key} className="hist-alim-meal-section">
                    <div className="hist-alim-meal-header" style={{ '--meal-color': tipo.color }}>
                      <LucideIcon name={tipo.icon} size={20} />
                      <span>{tipo.label}</span>
                      <span className="hist-alim-meal-count">{items.length}</span>
                    </div>
                    <div className="hist-alim-meal-cards">
                      {items.map((comida, idx) => (
                        <div key={idx} className="hist-alim-meal-card" style={{ '--meal-color': tipo.color }}>
                          <div className="hist-alim-meal-info">
                            <h4>{comida.nombre_plato || 'Sin nombre'}</h4>
                            {comida.descripcion && (
                              <p className="hist-alim-meal-desc">
                                {comida.descripcion.length > 120 ? comida.descripcion.substring(0, 120) + '...' : comida.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="hist-alim-meal-macros">
                            {comida.calorias > 0 && <span className="hist-alim-macro cal">{comida.calorias} kcal</span>}
                            {comida.proteinas_g > 0 && <span className="hist-alim-macro prot">P: {comida.proteinas_g}g</span>}
                            {comida.carbohidratos_g > 0 && <span className="hist-alim-macro carb">C: {comida.carbohidratos_g}g</span>}
                            {comida.grasas_g > 0 && <span className="hist-alim-macro fat">G: {comida.grasas_g}g</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Agua */}
          {resumen?.agua_vasos > 0 && (
            <div className="hist-alim-agua">
              <LucideIcon name="droplets" size={20} />
              <span>Agua: <strong>{resumen.agua_vasos} vasos</strong></span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistorialAlimenticio;
