import React, { useState } from 'react';
import LucideIcon from '../LucideIcon';
import './CalculadoraCalorica.css';

const CalculadoraCalorica = ({ pacienteId, onBack }) => {
  const [formData, setFormData] = useState({
    sexo: 'masculino',
    edad: '',
    peso: '',
    talla: '',
    actividad: '1.2'
  });
  const [resultados, setResultados] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calcular = () => {
    const { sexo, edad, peso, talla, actividad } = formData;
    const e = parseFloat(edad);
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    const fa = parseFloat(actividad);

    if (!e || !p || !t) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // Mifflin-St Jeor
    let mifflinTMB;
    if (sexo === 'masculino') {
      mifflinTMB = 10 * p + 6.25 * t - 5 * e + 5;
    } else {
      mifflinTMB = 10 * p + 6.25 * t - 5 * e - 161;
    }

    // Harris-Benedict
    let harrisTMB;
    if (sexo === 'masculino') {
      harrisTMB = 88.362 + 13.397 * p + 4.799 * t - 5.677 * e;
    } else {
      harrisTMB = 447.593 + 9.247 * p + 3.098 * t - 4.330 * e;
    }

    // FAO/OMS
    let faoTMB;
    if (sexo === 'masculino') {
      if (e < 30) faoTMB = 15.3 * p + 679;
      else if (e < 60) faoTMB = 11.6 * p + 879;
      else faoTMB = 13.5 * p + 487;
    } else {
      if (e < 30) faoTMB = 14.7 * p + 496;
      else if (e < 60) faoTMB = 8.7 * p + 829;
      else faoTMB = 10.5 * p + 596;
    }

    setResultados({
      mifflin: { tmb: Math.round(mifflinTMB), get: Math.round(mifflinTMB * fa) },
      harris: { tmb: Math.round(harrisTMB), get: Math.round(harrisTMB * fa) },
      fao: { tmb: Math.round(faoTMB), get: Math.round(faoTMB * fa) },
      promedio: Math.round(((mifflinTMB + harrisTMB + faoTMB) / 3) * fa),
      factorActividad: fa
    });
  };

  const actividadLabels = {
    '1.2': 'Sedentario',
    '1.375': 'Actividad ligera',
    '1.55': 'Actividad moderada',
    '1.725': 'Actividad intensa',
    '1.9': 'Actividad muy intensa'
  };

  return (
    <div className="calc-calorica-container">
      <div className="calc-calorica-header">
        <div className="calc-calorica-header-top">
          <button className="calc-calorica-back-btn" onClick={onBack}>
            <LucideIcon name="arrow-left" size={22} />
          </button>
          <div className="calc-calorica-header-title">
            <LucideIcon name="target" size={24} />
            <h2>Calculadora Calorica</h2>
          </div>
        </div>
      </div>

      <div className="calc-calorica-form-card">
        <h3 className="calc-calorica-section-title">
          <LucideIcon name="user" size={20} /> Datos del Usuario
        </h3>

        <div className="calc-calorica-sexo-group">
          <label className="calc-calorica-radio-label">
            <input type="radio" name="sexo" value="masculino" checked={formData.sexo === 'masculino'} onChange={handleChange} />
            <span className="calc-calorica-radio-custom">Masculino</span>
          </label>
          <label className="calc-calorica-radio-label">
            <input type="radio" name="sexo" value="femenino" checked={formData.sexo === 'femenino'} onChange={handleChange} />
            <span className="calc-calorica-radio-custom">Femenino</span>
          </label>
        </div>

        <div className="calc-calorica-form-grid">
          <div className="calc-calorica-form-group">
            <label>Edad (anos)</label>
            <input type="number" name="edad" value={formData.edad} onChange={handleChange} placeholder="Ej: 55" min="1" max="120" />
          </div>
          <div className="calc-calorica-form-group">
            <label>Peso (kg)</label>
            <input type="number" name="peso" value={formData.peso} onChange={handleChange} placeholder="Ej: 72" step="0.1" min="20" max="300" />
          </div>
          <div className="calc-calorica-form-group">
            <label>Talla (cm)</label>
            <input type="number" name="talla" value={formData.talla} onChange={handleChange} placeholder="Ej: 165" step="0.1" min="50" max="250" />
          </div>
        </div>

        <div className="calc-calorica-form-group full-width">
          <label>Nivel de Actividad</label>
          <select name="actividad" value={formData.actividad} onChange={handleChange}>
            <option value="1.2">Sedentario (x1.2)</option>
            <option value="1.375">Actividad ligera (x1.375)</option>
            <option value="1.55">Actividad moderada (x1.55)</option>
            <option value="1.725">Actividad intensa (x1.725)</option>
            <option value="1.9">Actividad muy intensa (x1.9)</option>
          </select>
        </div>

        <button className="calc-calorica-btn-calcular" onClick={calcular}>
          <LucideIcon name="calculator" size={20} /> Calcular
        </button>
      </div>

      {resultados && (
        <div className="calc-calorica-resultados">
          <h3 className="calc-calorica-section-title">
            <LucideIcon name="bar-chart" size={20} /> Resultados
          </h3>

          <div className="calc-calorica-cards-grid">
            {/* Mifflin-St Jeor */}
            <div className="calc-calorica-result-card recomendado">
              <div className="calc-calorica-card-badge">Recomendado</div>
              <h4 className="calc-calorica-card-title">Mifflin-St Jeor</h4>
              <div className="calc-calorica-card-values">
                <div className="calc-calorica-value-row">
                  <span className="calc-calorica-value-label">TMB</span>
                  <span className="calc-calorica-value-num">{resultados.mifflin.tmb}</span>
                  <span className="calc-calorica-value-unit">kcal/dia</span>
                </div>
                <div className="calc-calorica-value-row highlight">
                  <span className="calc-calorica-value-label">GET</span>
                  <span className="calc-calorica-value-num">{resultados.mifflin.get}</span>
                  <span className="calc-calorica-value-unit">kcal/dia</span>
                </div>
              </div>
            </div>

            {/* Harris-Benedict */}
            <div className="calc-calorica-result-card">
              <h4 className="calc-calorica-card-title">Harris-Benedict</h4>
              <div className="calc-calorica-card-values">
                <div className="calc-calorica-value-row">
                  <span className="calc-calorica-value-label">TMB</span>
                  <span className="calc-calorica-value-num">{resultados.harris.tmb}</span>
                  <span className="calc-calorica-value-unit">kcal/dia</span>
                </div>
                <div className="calc-calorica-value-row highlight">
                  <span className="calc-calorica-value-label">GET</span>
                  <span className="calc-calorica-value-num">{resultados.harris.get}</span>
                  <span className="calc-calorica-value-unit">kcal/dia</span>
                </div>
              </div>
            </div>

            {/* FAO/OMS */}
            <div className="calc-calorica-result-card">
              <h4 className="calc-calorica-card-title">FAO/OMS</h4>
              <div className="calc-calorica-card-values">
                <div className="calc-calorica-value-row">
                  <span className="calc-calorica-value-label">TMB</span>
                  <span className="calc-calorica-value-num">{resultados.fao.tmb}</span>
                  <span className="calc-calorica-value-unit">kcal/dia</span>
                </div>
                <div className="calc-calorica-value-row highlight">
                  <span className="calc-calorica-value-label">GET</span>
                  <span className="calc-calorica-value-num">{resultados.fao.get}</span>
                  <span className="calc-calorica-value-unit">kcal/dia</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="calc-calorica-summary">
            <div className="calc-calorica-summary-icon">
              <LucideIcon name="flame" size={28} />
            </div>
            <div className="calc-calorica-summary-info">
              <span className="calc-calorica-summary-label">Requerimiento Calorico Promedio</span>
              <span className="calc-calorica-summary-value">{resultados.promedio} kcal/dia</span>
              <span className="calc-calorica-summary-note">
                Factor de actividad: {actividadLabels[formData.actividad]} (x{formData.actividad})
              </span>
            </div>
          </div>

          <div className="calc-calorica-info-box">
            <LucideIcon name="info" size={18} />
            <div>
              <strong>TMB</strong> = Tasa Metabolica Basal (calorias en reposo absoluto).
              <strong> GET</strong> = Gasto Energetico Total (TMB x factor de actividad).
              La formula de Mifflin-St Jeor es la mas precisa para la mayoria de usuarios.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculadoraCalorica;
