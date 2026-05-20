import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './IMCPacientes.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const RANGOS_IMC = [
  { min: 0, max: 18.5, label: 'Bajo peso', color: '#2196F3', bgColor: 'rgba(33,150,243,0.15)' },
  { min: 18.5, max: 25, label: 'Normal', color: '#4CAF50', bgColor: 'rgba(76,175,80,0.15)' },
  { min: 25, max: 30, label: 'Sobrepeso', color: '#FFC107', bgColor: 'rgba(255,193,7,0.15)' },
  { min: 30, max: 35, label: 'Obesidad I', color: '#FF9800', bgColor: 'rgba(255,152,0,0.15)' },
  { min: 35, max: 40, label: 'Obesidad II', color: '#F44336', bgColor: 'rgba(244,67,54,0.15)' },
  { min: 40, max: 100, label: 'Obesidad III', color: '#B71C1C', bgColor: 'rgba(183,28,28,0.15)' }
];

const getIMCRango = (imc) => {
  if (!imc || isNaN(imc)) return null;
  return RANGOS_IMC.find(r => imc >= r.min && imc < r.max) || RANGOS_IMC[RANGOS_IMC.length - 1];
};

const IMCPacientes = ({ pacienteId, onBack }) => {
  const [mediciones, setMediciones] = useState([]);
  const [evolucion, setEvolucion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcPeso, setCalcPeso] = useState('');
  const [calcTalla, setCalcTalla] = useState('');
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => { cargarDatos(); }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [medRes, pesoRes] = await Promise.all([
        api.get(`/nutricion/antropometria/${pacienteId}`),
        api.get(`/nutricion/antropometria/${pacienteId}/peso`)
      ]);
      setMediciones(medRes.data?.mediciones || []);
      setEvolucion(pesoRes.data?.evolucion || []);
    } catch (error) {
      console.error('Error cargando datos IMC:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularIMC = () => {
    const p = parseFloat(calcPeso);
    const t = parseFloat(calcTalla);
    if (!p || !t || t <= 0) {
      alert('Ingresa peso y talla validos.');
      return;
    }
    const imc = p / Math.pow(t / 100, 2);
    setCalcResult(imc);
  };

  const imcActual = mediciones.length > 0 && mediciones[0].imc ? parseFloat(mediciones[0].imc) : null;
  const rangoActual = getIMCRango(imcActual);

  // Posición del marcador en la barra visual (rango 10-50 IMC mapeado a 0-100%)
  const getBarPosition = (imc) => {
    if (!imc) return 0;
    const minIMC = 10;
    const maxIMC = 50;
    const clamped = Math.max(minIMC, Math.min(maxIMC, imc));
    return ((clamped - minIMC) / (maxIMC - minIMC)) * 100;
  };

  const chartData = {
    labels: evolucion.map(e => new Date(e.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: 'IMC',
      data: evolucion.map(e => e.imc ? parseFloat(e.imc).toFixed(1) : null),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#4CAF50',
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = parseFloat(ctx.raw);
            const rango = getIMCRango(val);
            return `IMC: ${val} (${rango ? rango.label : ''})`;
          }
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8B949E' } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8B949E' },
        suggestedMin: 15, suggestedMax: 40
      }
    }
  };

  if (loading) {
    return (
      <div className="imc-pac-loading">
        <div className="imc-pac-spinner"></div>
        <p>Cargando datos de IMC...</p>
      </div>
    );
  }

  return (
    <div className="imc-pac-container">
      {/* Header */}
      <div className="imc-pac-header">
        <div className="imc-pac-header-top">
          <button className="imc-pac-back-btn" onClick={onBack}>
            <LucideIcon name="arrow-left" size={22} />
          </button>
          <div className="imc-pac-header-title">
            <LucideIcon name="activity" size={24} />
            <h2>IMC de Usuario</h2>
          </div>
        </div>
      </div>

      {/* IMC Actual Card */}
      <div className="imc-pac-current-card">
        <h3 className="imc-pac-section-title">
          <LucideIcon name="target" size={20} /> IMC Actual
        </h3>
        {imcActual ? (
          <>
            <div className="imc-pac-current-display">
              <div className="imc-pac-current-value" style={{ color: rangoActual?.color }}>
                {imcActual.toFixed(1)}
              </div>
              <div className="imc-pac-current-label" style={{ background: rangoActual?.bgColor, color: rangoActual?.color }}>
                {rangoActual?.label}
              </div>
            </div>

            {/* Barra visual de IMC */}
            <div className="imc-pac-bar-container">
              <div className="imc-pac-bar">
                {RANGOS_IMC.map((rango, idx) => {
                  const widths = [18.5, 16.25, 12.5, 12.5, 12.5, 27.75]; // porcentajes aproximados
                  return (
                    <div
                      key={idx}
                      className="imc-pac-bar-segment"
                      style={{ background: rango.color, width: `${widths[idx]}%` }}
                      title={`${rango.label}: ${rango.min} - ${rango.max}`}
                    />
                  );
                })}
                <div
                  className="imc-pac-bar-marker"
                  style={{ left: `${getBarPosition(imcActual)}%` }}
                >
                  <div className="imc-pac-bar-marker-dot"></div>
                  <div className="imc-pac-bar-marker-label">{imcActual.toFixed(1)}</div>
                </div>
              </div>
              <div className="imc-pac-bar-labels">
                <span>Bajo peso</span>
                <span>Normal</span>
                <span>Sobrepeso</span>
                <span>Obesidad</span>
              </div>
            </div>

            <div className="imc-pac-current-meta">
              <span>Peso: {mediciones[0].peso} kg</span>
              <span>Talla: {mediciones[0].talla} cm</span>
              <span>Fecha: {new Date(mediciones[0].fecha_medicion).toLocaleDateString('es-MX')}</span>
            </div>
          </>
        ) : (
          <div className="imc-pac-no-data">
            <LucideIcon name="activity" size={36} />
            <p>No hay mediciones registradas. Registra una medicion en Seguimiento de Peso.</p>
          </div>
        )}
      </div>

      {/* Calculadora rapida */}
      <div className="imc-pac-calculator">
        <h3 className="imc-pac-section-title">
          <LucideIcon name="calculator" size={20} /> Calculadora Rapida de IMC
        </h3>
        <div className="imc-pac-calc-form">
          <div className="imc-pac-calc-input">
            <label>Peso (kg)</label>
            <input
              type="number"
              value={calcPeso}
              onChange={(e) => setCalcPeso(e.target.value)}
              placeholder="72.5"
              step="0.1"
              min="20"
              max="300"
            />
          </div>
          <div className="imc-pac-calc-input">
            <label>Talla (cm)</label>
            <input
              type="number"
              value={calcTalla}
              onChange={(e) => setCalcTalla(e.target.value)}
              placeholder="165"
              step="0.1"
              min="50"
              max="250"
            />
          </div>
          <button className="imc-pac-calc-btn" onClick={calcularIMC}>
            <LucideIcon name="calculator" size={18} /> Calcular
          </button>
        </div>
        {calcResult && (
          <div className="imc-pac-calc-result">
            <div className="imc-pac-calc-result-value" style={{ color: getIMCRango(calcResult)?.color }}>
              {calcResult.toFixed(1)}
            </div>
            <div className="imc-pac-calc-result-label" style={{ background: getIMCRango(calcResult)?.bgColor, color: getIMCRango(calcResult)?.color }}>
              {getIMCRango(calcResult)?.label}
            </div>
          </div>
        )}
      </div>

      {/* Grafica de evolucion */}
      {evolucion.length > 1 ? (
        <div className="imc-pac-chart-container">
          <h3 className="imc-pac-section-title">
            <LucideIcon name="trending-up" size={20} /> Evolucion del IMC
          </h3>
          <div className="imc-pac-chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="imc-pac-chart-empty">
          <LucideIcon name="chart-line" size={40} />
          <p>Se necesitan al menos 2 mediciones para mostrar la grafica de IMC.</p>
        </div>
      )}

      {/* Tabla de rangos */}
      <div className="imc-pac-rangos">
        <h3 className="imc-pac-section-title">
          <LucideIcon name="info" size={20} /> Clasificacion de IMC (OMS)
        </h3>
        <div className="imc-pac-rangos-grid">
          {RANGOS_IMC.map((rango, idx) => (
            <div
              key={idx}
              className={`imc-pac-rango-card ${rangoActual?.label === rango.label ? 'activo' : ''}`}
              style={{ borderLeftColor: rango.color }}
            >
              <div className="imc-pac-rango-color" style={{ background: rango.color }}></div>
              <div className="imc-pac-rango-info">
                <span className="imc-pac-rango-label">{rango.label}</span>
                <span className="imc-pac-rango-range">
                  {rango.max < 100 ? `${rango.min} - ${rango.max}` : `≥ ${rango.min}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de mediciones */}
      <div className="imc-pac-historial">
        <h3 className="imc-pac-section-title">
          <LucideIcon name="clipboard" size={20} /> Historial de Mediciones
        </h3>
        {mediciones.length === 0 ? (
          <div className="imc-pac-empty-table">
            <LucideIcon name="scale" size={36} />
            <p>No hay mediciones registradas aun.</p>
          </div>
        ) : (
          <div className="imc-pac-table-wrapper">
            <table className="imc-pac-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso</th>
                  <th>Talla</th>
                  <th>IMC</th>
                  <th>Clasificacion</th>
                </tr>
              </thead>
              <tbody>
                {mediciones.map(m => {
                  const imc = m.imc ? parseFloat(m.imc) : null;
                  const rango = getIMCRango(imc);
                  return (
                    <tr key={m.id}>
                      <td data-label="Fecha">
                        {new Date(m.fecha_medicion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td data-label="Peso">{m.peso} kg</td>
                      <td data-label="Talla">{m.talla} cm</td>
                      <td data-label="IMC" style={{ color: rango?.color, fontWeight: 700 }}>
                        {imc ? imc.toFixed(1) : '--'}
                      </td>
                      <td data-label="Clasificacion">
                        {rango ? (
                          <span className="imc-pac-badge" style={{ background: rango.bgColor, color: rango.color }}>
                            {rango.label}
                          </span>
                        ) : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IMCPacientes;
