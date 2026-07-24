import React, { useState, useMemo } from 'react';
import LucideIcon from '../LucideIcon';
import './VistaEquivalentes.css';

const GRUPO_CONFIG = {
  'Verduras': { icon: 'salad', color: '#4CAF50' },
  'Frutas': { icon: 'apple', color: '#FF9800' },
  'Cereales': { icon: 'wheat', color: '#FFC107' },
  'Leguminosas': { icon: 'bean', color: '#795548' },
  'Proteínas 1': { icon: 'fish', color: '#F44336' },
  'Proteínas 2': { icon: 'beef', color: '#E91E63' },
  'Proteínas 3': { icon: 'egg', color: '#C62828' },
  'Lácteos': { icon: 'milk', color: '#42A5F5' },
  'Grasas': { icon: 'droplet', color: '#FF7043' },
  'Grasas con proteína': { icon: 'nut', color: '#8D6E63' },
};

const MEAL_COLORS = {
  'Desayuno': '#4CAF50',
  'Colación 1': '#26A69A',
  'Comida': '#FF9800',
  'Colación 2': '#EC407A',
  'Cena': '#7E57C2',
};

/**
 * Fallback: parse texto_original when cuadro_equivalentes is missing/empty.
 * The texto_original may contain rows like:
 *   Verduras ||| 2 ||| - ||| 2 ||| - ||| 1
 */
function parsearTextoOriginal(texto) {
  if (!texto) return null;

  const TIEMPOS_DEFAULT = ['Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena'];
  const GRUPO_NAMES = [
    'Verduras', 'Frutas', 'Cereales', 'Leguminosas',
    'Proteínas 1', 'Proteínas 2', 'Proteínas 3',
    'Lácteos', 'Grasas con proteína', 'Grasas'
  ];

  // Handle both real newlines and escaped literal \r\n sequences
  const textoNorm = texto.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  const lineas = textoNorm.split(/\r?\n/);
  const grupos = [];
  let pendingGrasasCon = false;

  for (let i = 0; i < lineas.length; i++) {
    let linea = lineas[i].trim();
    if (!linea) continue;

    // Handle "Grasas con" split across two lines
    if (pendingGrasasCon) {
      pendingGrasasCon = false;
      if (/prote[ií]na/i.test(linea)) continue;
    }

    // Check if this line starts with "Grasas con" without "proteína" and has |||
    const firstPart = linea.split('|||')[0]?.trim() || '';
    if (/^Grasas\s+con\s*$/i.test(firstPart)) {
      const nextLinea = (lineas[i + 1] || '').trim();
      if (/^prote[ií]na/i.test(nextLinea)) {
        pendingGrasasCon = true;
      }
    }

    // Check if line has ||| separators
    if (!linea.includes('|||')) continue;

    const parts = linea.split('|||').map(p => p.trim());
    if (parts.length < 2) continue;

    const nombreRaw = parts[0];
    // Match against known group names (check longer names first)
    let nombreMatch = null;
    for (const gn of GRUPO_NAMES) {
      const gnLower = gn.toLowerCase();
      const rawLower = nombreRaw.toLowerCase().trim();

      if (gn === 'Grasas con proteína') {
        if (/grasas\s+con/i.test(rawLower)) { nombreMatch = gn; break; }
      } else if (gn === 'Grasas') {
        // Only match "Grasas" alone, not "Grasas con"
        if (/^grasas$/i.test(rawLower) || (rawLower.includes('grasas') && !rawLower.includes('con'))) {
          nombreMatch = gn; break;
        }
      } else if (rawLower.includes(gnLower) || rawLower.replace(/[ií]/g, 'i').includes(gnLower.replace(/[ií]/g, 'i'))) {
        nombreMatch = gn;
        break;
      }
    }
    if (!nombreMatch) continue;

    const equivalentes = [];
    for (let j = 1; j < parts.length && equivalentes.length < 5; j++) {
      const val = parts[j].trim();
      if (val === '-' || val === '') {
        equivalentes.push(0);
      } else {
        equivalentes.push(parseFloat(val.replace(',', '.')) || 0);
      }
    }
    // Pad to 5 columns if fewer
    while (equivalentes.length < 5) equivalentes.push(0);

    // Avoid duplicates
    if (!grupos.find(g => g.nombre === nombreMatch)) {
      grupos.push({ nombre: nombreMatch, equivalentes });
    }
  }

  if (grupos.length === 0) return null;

  return { tiempos: TIEMPOS_DEFAULT, grupos };
}

/**
 * Limpia un array de alimentos con datos corruptos del parsing de PDF.
 * Maneja: nombres pegados, separadores |||, tablas de dos columnas,
 * headers mezclados, entradas vacías, porciones con formato roto.
 */
function limpiarAlimentos(alimentos) {
  if (!alimentos?.length) return [];

  // Correcciones conocidas de nombres corruptos
  const CORRECCIONES = {
    'quackerinstant0%azúcar': 'Quaker instant 0% azúcar',
    'quackerinstant0%azucar': 'Quaker instant 0% azúcar',
    'barrastilaquaker': 'Barra Stila Quaker',
    'arrozblancococido': 'Arroz blanco cocido',
    'harinaparahotcakes': 'Harina para hotcakes',
    'jitomate guaje osaladet': 'Jitomate guaje o saladet',
    'arándanoseco conazúcar': 'Arándano seco con azúcar',
    'arandanoseco conazucar': 'Arándano seco con azúcar',
    'ciruelapasadeshuesada': 'Ciruela pasa deshuesada',
    'cocktailde frutas en agua': 'Cocktail de frutas en agua',
    'quesomozarellalight': 'Queso Mozarella light',
    'queso mozarella light': 'Queso Mozarella light',
    'yogurvitalíneabebible': 'Yogur Vitalínea bebible',
    'yogurvitalíneagriego': 'Yogur Vitalínea griego',
    'frijoles refritosenlatados': 'Frijoles refritos enlatados',
    'colesitade bruselas cocida': 'Colecita de Bruselas cocida',
    'colecita de bruselas cocida': 'Colecita de Bruselas cocida',
    'aguayónde rescrudo': 'Aguayón de res crudo',
    'chamberetede res crudo': 'Chamberete de res crudo',
    'almejafresca sin concha': 'Almeja fresca sin concha',
    'anillosde calamarcrudos': 'Anillos de calamar crudos',
    'anchoafresca': 'Anchoa fresca',
    'atúnenaguadrenado': 'Atún en agua drenado',
    'bagrefileteado': 'Bagre fileteado',
    'bistecde rescrudo': 'Bistec de res crudo',
    'queso cottagelalalight': 'Queso cottage Lala light',
    'queso oaxacalalalight': 'Queso Oaxaca Lala light',
    'molida desirloincruda': 'Molida de sirloin cruda',
  };

  // Detecta si un string parece porción (empieza con número/fracción + unidad)
  const esPorcion = (str) => {
    if (!str) return false;
    return /^[\d½¼¾⅓⅔⅛.,/\s]*(taza|pieza|piezas|gramos?|g\b|cucharadas?|cucharaditas?|sobre|rebanada|rebanadas|ml|litro|porci[oó]n|ración|onza|oz|lata|paquete|barra|vaso|bolsa|segundos)/i.test(str)
      || /^[\d½¼¾⅓⅔⅛]/.test(str);
  };

  // Headers/basura que deben filtrarse
  const esHeader = (str) => {
    const lower = str.toLowerCase().trim();
    return lower === 'equivalente' || lower === 'alimento' || lower === 'equivalente alimento'
      || /^equivalente\s+(alimento|[a-záéíóúñ])/i.test(str);
  };

  // Limpia un nombre de alimento
  const fixNombre = (str) => {
    if (!str) return '';
    const s = str.trim();
    if (!s) return '';

    // Correcciones directas
    const key = s.toLowerCase().replace(/\s+/g, ' ');
    if (CORRECCIONES[key]) return CORRECCIONES[key];

    let fixed = s
      // camelCase: minúscula seguida de mayúscula
      .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
      // % seguido de letra
      .replace(/%([a-zA-ZáéíóúñÁÉÍÓÚÑ])/g, '% $1')
      // preposiciones pegadas a palabras
      .replace(/([a-záéíóúñ])(de|para|con|sin|en)([A-ZÁÉÍÓÚÑ])/g, '$1 $2 $3')
      .replace(/([a-záéíóúñ])(de|para|con|sin|en)([a-záéíóúñ]{3,})/g, (m, pre, prep, post) => {
        // Solo separar si la parte después de la preposición es una palabra real
        if (post.length >= 3) return `${pre} ${prep} ${post}`;
        return m;
      })
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Verificar después de transformaciones
    const keyFixed = fixed.toLowerCase().replace(/\s+/g, ' ');
    if (CORRECCIONES[keyFixed]) return CORRECCIONES[keyFixed];

    return fixed;
  };

  // Limpia una porción
  const fixPorcion = (str) => {
    if (!str) return '-';
    return str
      .replace(/([½¼¾⅓⅔])([a-zA-ZáéíóúñÁÉÍÓÚÑ])/g, '$1 $2')
      .replace(/(\d)([a-zA-ZáéíóúñÁÉÍÓÚÑ])/g, '$1 $2')
      .replace(/%([a-zA-Z])/g, '% $1')
      .replace(/\b(de|para)(pieza|piezas|taza|sobre|barra|rebanada)/gi, '$1 $2')
      .replace(/\s{2,}/g, ' ')
      .trim() || '-';
  };

  const resultado = [];

  for (const alimento of alimentos) {
    let { nombre, equivalente } = alimento;
    nombre = (nombre || '').trim();
    equivalente = (equivalente || '').trim();

    // Filtrar entradas vacías y headers
    if (!nombre && !equivalente) continue;
    if (esHeader(nombre)) continue;
    if (!nombre && equivalente) {
      // Entrada sin nombre pero con porción → es la columna derecha de tabla PDF
      // Intentar asignar como alimento separado si parece nombre, no porción
      if (!esPorcion(equivalente)) {
        resultado.push({ nombre: fixNombre(equivalente), equivalente: '-' });
      }
      // Si es porción pura y hay entrada previa, ignorar (ya se asignó)
      continue;
    }

    // Nombre contiene ||| → tabla de dos columnas: name1 ||| portion1 ||| name2
    if (nombre.includes('|||')) {
      const partsN = nombre.split('|||').map(p => p.trim()).filter(Boolean);
      // Pattern: [nombre1, porcion1, nombre2, porcion2, ...]
      // El último nombre sin porción usa el campo equivalente
      let i = 0;
      while (i < partsN.length) {
        const n = partsN[i];
        if (esPorcion(n)) { i++; continue; } // Porción suelta, skip
        const foodName = fixNombre(n);
        if (!foodName || esHeader(foodName)) { i++; continue; }
        let portion;
        if (i + 1 < partsN.length && esPorcion(partsN[i + 1])) {
          portion = fixPorcion(partsN[i + 1]);
          i += 2;
        } else {
          // Último nombre → usa el campo equivalente original
          portion = fixPorcion(equivalente);
          i++;
        }
        resultado.push({ nombre: foodName, equivalente: portion });
      }
      continue;
    }

    nombre = fixNombre(nombre);
    if (!nombre || esHeader(nombre)) continue;

    // Equivalente contiene ||| → porción + otros alimentos
    if (equivalente.includes('|||')) {
      const parts = equivalente.split('|||').map(p => p.trim()).filter(Boolean);
      // Pattern: porción1, nombre2, porción2, nombre3, porción3...
      const firstPortion = fixPorcion(parts[0]);
      resultado.push({ nombre, equivalente: firstPortion });

      let i = 1;
      while (i < parts.length) {
        const part = parts[i].trim();
        if (!part) { i++; continue; }
        if (esPorcion(part)) {
          // Porción extra → agregar a la entrada anterior
          if (resultado.length > 0) {
            resultado[resultado.length - 1].equivalente += ` / ${fixPorcion(part)}`;
          }
          i++;
        } else {
          const foodName = fixNombre(part);
          if (esHeader(foodName)) { i++; continue; }
          const portion = (i + 1 < parts.length) ? fixPorcion(parts[i + 1].trim()) : '-';
          resultado.push({ nombre: foodName, equivalente: portion });
          i += 2;
        }
      }
    } else if (equivalente.includes('    ')) {
      // Multi-space separator
      const parts = equivalente.split(/\s{3,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        resultado.push({ nombre, equivalente: fixPorcion(parts[0]) });
        let i = 1;
        while (i < parts.length) {
          const part = parts[i];
          if (esPorcion(part)) {
            resultado[resultado.length - 1].equivalente += ` / ${fixPorcion(part)}`;
            i++;
          } else {
            const foodName = fixNombre(part);
            const portion = (i + 1 < parts.length) ? fixPorcion(parts[i + 1]) : '-';
            resultado.push({ nombre: foodName, equivalente: portion });
            i += 2;
          }
        }
      } else {
        resultado.push({ nombre, equivalente: fixPorcion(equivalente) });
      }
    } else {
      resultado.push({ nombre, equivalente: fixPorcion(equivalente) });
    }
  }

  return resultado;
}

const VistaEquivalentes = ({ plan, contenido, compact = false, pacienteView = false, checklist = false, checkData = {}, onCheckToggle }) => {
  const [busqueda, setBusqueda] = useState('');
  const [expandedMeals, setExpandedMeals] = useState({ 0: true });

  // Fallback: parse texto_original if cuadro_equivalentes is missing
  const cuadroParsed = useMemo(() => {
    const existing = contenido?.cuadro_equivalentes;
    if (existing?.grupos?.length > 0) return existing;
    // Try parsing from texto_original
    return parsearTextoOriginal(contenido?.texto_original) || { tiempos: [], grupos: [] };
  }, [contenido]);
  // ---> PEGA EL CONSOLE.LOG AQUÍ <---
  console.log("CONTENIDO RECIBIDO EN REACT:", contenido);
  console.log("CUADRO PARSED:", cuadroParsed);

  if (!contenido || (contenido.tipo !== 'equivalentes' && !cuadroParsed.grupos?.length)) return null;

  const datos = contenido.datos_paciente || {};
  const especialista = contenido.especialista || {};
  const cuadro = cuadroParsed;
  const grupos = contenido.grupos_alimentos || [];
  const libres = contenido.alimentos_libres || { moderados: [], libres: [] };
  const recomendaciones = contenido.recomendaciones || [];

  // Calcular totales por tiempo de comida
  const totalesPorTiempo = (cuadro.tiempos || []).map((_, colIdx) => {
    return (cuadro.grupos || []).reduce((sum, g) => {
      return sum + (g.equivalentes?.[colIdx] || 0);
    }, 0);
  });

  // Checklist helpers
  const getCheckKey = (grupoNombre, colIdx) => `${grupoNombre}-${colIdx}`;
  const getConsumed = (grupoNombre, colIdx) => checkData[getCheckKey(grupoNombre, colIdx)] || 0;

  const generateCircles = (target) => {
    const circles = [];
    const full = Math.floor(target);
    for (let i = 1; i <= full; i++) circles.push(i);
    if (target % 1 > 0) circles.push(target);
    return circles;
  };

  const handleCircleTap = (grupoNombre, colIdx, circleThreshold) => {
    if (!checklist || !onCheckToggle) return;
    const key = getCheckKey(grupoNombre, colIdx);
    const current = checkData[key] || 0;
    if (current >= circleThreshold) {
      const prevThreshold = circleThreshold % 1 > 0 ? Math.floor(circleThreshold) : circleThreshold - 1;
      onCheckToggle(key, Math.max(0, prevThreshold));
    } else {
      onCheckToggle(key, circleThreshold);
    }
  };

  const toggleMeal = (colIdx) => {
    setExpandedMeals(prev => ({ ...prev, [colIdx]: !prev[colIdx] }));
  };

  // Calcular progreso diario basado en equivalentes consumidos
  const calcularProgresoDiario = () => {
    let totalEquiv = 0;
    let completedEquiv = 0;
    (cuadro.grupos || []).forEach(grupo => {
      (grupo.equivalentes || []).forEach((val, colIdx) => {
        if (val > 0) {
          totalEquiv += val;
          completedEquiv += Math.min(getConsumed(grupo.nombre, colIdx), val);
        }
      });
    });
    return totalEquiv > 0 ? Math.round((completedEquiv / totalEquiv) * 100) : 0;
  };

  // Filtrar alimentos por busqueda
  const filtrarAlimentos = (alimentos) => {
    if (!busqueda.trim()) return alimentos;
    const q = busqueda.toLowerCase();
    return alimentos.filter(a => a.nombre.toLowerCase().includes(q));
  };

  const getGrupoConfig = (nombre) => {
    return GRUPO_CONFIG[nombre] || { icon: 'circle', color: '#78909C' };
  };

  const getMealColor = (tiempo) => {
    return MEAL_COLORS[tiempo] || '#4CAF50';
  };

  return (
    <div className={`vista-equiv ${compact ? 'vista-equiv--compact' : ''} ${pacienteView ? 'vista-equiv--paciente' : ''}`}>

      {/* Header - Datos del paciente (solo en modo completo) */}
      {!compact && datos.nombre && (
        <div className="ve-paciente-header">
          <div className="ve-paciente-info">
            <h2 className="ve-paciente-nombre">
              <LucideIcon name="user" size={22} />
              {plan?.nombre || 'Plan de Alimentación'}
            </h2>
            {datos.objetivo && (
              <p className="ve-objetivo">
                <LucideIcon name="target" size={16} />
                <span>{datos.objetivo}</span>
              </p>
            )}
          </div>

          <div className="ve-medidas">
            {datos.peso && (
              <div className="ve-medida-item">
                <LucideIcon name="scale" size={18} />
                <span className="ve-medida-valor">{datos.peso}</span>
                <span className="ve-medida-label">Peso</span>
              </div>
            )}
            {datos.grasa_corporal && (
              <div className="ve-medida-item">
                <LucideIcon name="percent" size={18} />
                <span className="ve-medida-valor">{datos.grasa_corporal}</span>
                <span className="ve-medida-label">Grasa</span>
              </div>
            )}
            {datos.masa_muscular && (
              <div className="ve-medida-item">
                <LucideIcon name="dumbbell" size={18} />
                <span className="ve-medida-valor">{datos.masa_muscular}</span>
                <span className="ve-medida-label">Músculo</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info del especialista (solo en modo completo, vista especialista) */}
      {!compact && especialista.nombre && !pacienteView && (
        <div className="ve-especialista">
          <LucideIcon name="stethoscope" size={16} />
          <span>{especialista.nombre}</span>
          {especialista.email && <span className="ve-esp-email">{especialista.email}</span>}
        </div>
      )}

      {/* Cuadro de Equivalentes - Vista tabla (sin checklist) */}
      {!checklist && cuadro.grupos?.length > 0 && (
        <div className="ve-cuadro-section">
          <div className="ve-cuadro-header">
            <h3 className="ve-section-title">
              <LucideIcon name="table" size={20} />
              Cuadro de Equivalentes
            </h3>
          </div>
          <div className="ve-table-wrapper">
            <table className="ve-cuadro-table">
              <thead>
                <tr>
                  <th className="ve-th-grupo">Grupo de Alimentos</th>
                  {(cuadro.tiempos || []).map((tiempo, idx) => (
                    <th key={idx} className="ve-th-tiempo">{tiempo}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(cuadro.grupos || []).map((grupo, idx) => {
                  const config = getGrupoConfig(grupo.nombre);
                  return (
                    <tr key={idx}>
                      <td className="ve-td-grupo">
                        <span className="ve-grupo-dot" style={{ background: config.color }}></span>
                        {grupo.nombre}
                      </td>
                      {(grupo.equivalentes || []).map((val, colIdx) => (
                        <td key={colIdx} className={`ve-td-valor ${val > 0 ? 've-td-activo' : ''}`}>
                          {val > 0 ? val : '-'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="ve-tr-totales">
                  <td className="ve-td-grupo"><strong>Total equiv.</strong></td>
                  {totalesPorTiempo.map((total, idx) => (
                    <td key={idx} className="ve-td-valor ve-td-total">
                      {total > 0 ? total.toFixed(1).replace(/\.0$/, '') : '-'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ===== CHECKLIST ACORDEÓN ===== */}
      {checklist && cuadro.grupos?.length > 0 && (() => {
        const progresoPct = calcularProgresoDiario();

        return (
          <div className="ve-checklist-container">

            {/* Secciones acordeón por tiempo de comida */}
            {(cuadro.tiempos || []).map((tiempo, colIdx) => {
              const gruposActivos = (cuadro.grupos || []).filter(g => (g.equivalentes?.[colIdx] || 0) > 0);
              if (gruposActivos.length === 0) return null;

              const isExpanded = expandedMeals[colIdx] || false;
              const mealColor = getMealColor(tiempo);
              const completados = gruposActivos.filter(g => getConsumed(g.nombre, colIdx) >= g.equivalentes[colIdx]).length;
              const allDone = completados === gruposActivos.length;

              return (
                <div key={colIdx} className={`ve-accordion ${allDone ? 've-accordion-done' : ''}`}>
                  {/* Header del acordeón */}
                  <button
                    className="ve-accordion-header"
                    style={{ borderLeftColor: mealColor }}
                    onClick={() => toggleMeal(colIdx)}
                  >
                    <span className="ve-accordion-title" style={{ color: mealColor }}>
                      {tiempo}
                    </span>

                    {/* Resumen colapsado: dots de colores */}
                    {!isExpanded && (
                      <div className="ve-accordion-summary">
                        {gruposActivos.map((g, i) => {
                          const cfg = getGrupoConfig(g.nombre);
                          const done = getConsumed(g.nombre, colIdx) >= g.equivalentes[colIdx];
                          return (
                            <span
                              key={i}
                              className={`ve-summary-dot ${done ? 've-summary-dot-done' : ''}`}
                              style={{ background: cfg.color }}
                            >
                              {done && <LucideIcon name="check" size={10} />}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {allDone && (
                      <span className="ve-accordion-check" style={{ color: mealColor }}>
                        <LucideIcon name="check-circle" size={20} />
                      </span>
                    )}

                    <LucideIcon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      className="ve-accordion-chevron"
                    />
                  </button>

                  {/* Cuerpo del acordeón */}
                  {isExpanded && (
                    <div className="ve-accordion-body">
                      {gruposActivos.map((grupo, gIdx) => {
                        const config = getGrupoConfig(grupo.nombre);
                        const target = grupo.equivalentes[colIdx];
                        const consumed = getConsumed(grupo.nombre, colIdx);
                        const circles = generateCircles(target);
                        const isDone = consumed >= target;
                        const progressPct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;

                        return (
                          <div key={gIdx} className={`ve-food-row ${isDone ? 've-food-row-done' : ''}`}>
                            {/* Nombre del grupo */}
                            <div className="ve-food-row-header">
                              <span className="ve-food-row-name" style={{ color: config.color }}>
                                {grupo.nombre}: {target} {target === 1 ? 'Equivalente' : 'Equivalentes'}
                              </span>
                            </div>

                            {/* Círculos + ícono */}
                            <div className="ve-food-row-content">
                              <div className="ve-food-row-circles">
                                {circles.map((threshold, cIdx) => {
                                  const isChecked = consumed >= threshold;
                                  const isHalf = threshold % 1 > 0;
                                  return (
                                    <button
                                      key={cIdx}
                                      className={`ve-equiv-circle ${isChecked ? 've-equiv-circle-done' : ''}`}
                                      style={{
                                        borderColor: config.color,
                                        ...(isChecked ? { background: config.color, color: '#fff' } : {})
                                      }}
                                      onClick={() => handleCircleTap(grupo.nombre, colIdx, threshold)}
                                      aria-label={`${grupo.nombre} equivalente ${threshold}: ${isChecked ? 'completado' : 'pendiente'}`}
                                    >
                                      {isChecked ? (
                                        <LucideIcon name="check" size={16} />
                                      ) : isHalf ? (
                                        <span className="ve-equiv-half">½</span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Ícono grande del grupo */}
                              <div className="ve-food-row-icon" style={{ background: config.color + '1A' }}>
                                <LucideIcon name={config.icon} size={26} style={{ color: config.color }} />
                              </div>
                            </div>

                            {/* Barra de progreso */}
                            <div className="ve-food-progress">
                              <div className="ve-food-progress-track">
                                <div
                                  className="ve-food-progress-fill"
                                  style={{ width: `${progressPct}%`, background: config.color }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Progreso Diario */}
            <div className="ve-daily-progress">
              <span className="ve-daily-label">Progreso Diario:</span>
              <div className="ve-daily-gauge">
                <div className="ve-gauge-ring">
                  <svg viewBox="0 0 36 36" className="ve-gauge-svg">
                    <path
                      className="ve-gauge-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="ve-gauge-fill"
                      strokeDasharray={`${progresoPct}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{
                        stroke: progresoPct >= 100 ? '#4CAF50' : progresoPct >= 50 ? '#FF9800' : '#F44336'
                      }}
                    />
                  </svg>
                  <span className="ve-gauge-text">{progresoPct}%</span>
                </div>
                <span className="ve-gauge-sublabel">Completado</span>
              </div>
            </div>

          </div>
        );
      })()}

      {/* En modo compact, solo se muestra el cuadro/checklist */}
      {!compact && <>

      {/* Buscador de alimentos */}
      {grupos.length > 0 && (
        <div className="ve-busqueda">
          <LucideIcon name="search" size={18} />
          <input
            type="text"
            placeholder="Buscar alimento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="ve-busqueda-input"
          />
          {busqueda && (
            <button className="ve-busqueda-clear" onClick={() => setBusqueda('')}>
              <LucideIcon name="x" size={16} />
            </button>
          )}
        </div>
      )}

      {/* Grupos de Alimentos */}
      {grupos.length > 0 && (
        <div className="ve-grupos-section">
          <h3 className="ve-section-title">
            <LucideIcon name="list" size={20} />
            Tablas de Equivalentes por Grupo
          </h3>

          <div className="ve-grupos-grid">
            {grupos.map((grupo, idx) => {
              const config = getGrupoConfig(grupo.nombre);
              const alimentosLimpios = limpiarAlimentos(grupo.alimentos || []);
              const alimentosFiltrados = filtrarAlimentos(alimentosLimpios);

              if (busqueda && alimentosFiltrados.length === 0) return null;

              const cuadroGrupo = (cuadro.grupos || []).find(g => g.nombre === grupo.nombre);
              const totalEquiv = cuadroGrupo
                ? cuadroGrupo.equivalentes.reduce((a, b) => a + b, 0)
                : 0;

              return (
                <details
                  key={idx}
                  className="ve-grupo-card"
                  open={!!busqueda}
                >
                  <summary className="ve-grupo-header" style={{ borderLeftColor: config.color }}>
                    <div className="ve-grupo-title">
                      <span className="ve-grupo-icon" style={{ background: config.color }}>
                        <LucideIcon name={config.icon} size={18} />
                      </span>
                      <span className="ve-grupo-nombre">{grupo.nombre}</span>
                    </div>
                    <div className="ve-grupo-meta">
                      {totalEquiv > 0 && (
                        <span className="ve-grupo-equiv-badge" style={{ background: config.color + '22', color: config.color }}>
                          {totalEquiv} equiv/día
                        </span>
                      )}
                      <span className="ve-grupo-count">
                        {alimentosFiltrados.length} alimentos
                      </span>
                      <LucideIcon name="chevron-down" size={18} className="ve-grupo-chevron" />
                    </div>
                  </summary>

                  <div className="ve-grupo-body">
                    <div className="ve-alimentos-table-wrapper">
                      <table className="ve-alimentos-table">
                        <thead>
                          <tr>
                            <th>Alimento</th>
                            <th>1 Equivalente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alimentosFiltrados.map((alimento, aIdx) => (
                            <tr key={aIdx}>
                              <td className="ve-alimento-nombre">{alimento.nombre}</td>
                              <td className="ve-alimento-porcion">{alimento.equivalente}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {/* Alimentos Libres */}
      {(libres.moderados?.length > 0 || libres.libres?.length > 0) && (
        <div className="ve-libres-section">
          <h3 className="ve-section-title">
            <LucideIcon name="check-circle" size={20} />
            Alimentos Libres
          </h3>
          <div className="ve-libres-grid">
            {libres.moderados?.length > 0 && (
              <div className="ve-libres-col">
                <h4 className="ve-libres-subtitle">
                  <LucideIcon name="alert-circle" size={16} />
                  Moderados
                </h4>
                <p className="ve-libres-hint">Alimentos con menos de 10 kcal</p>
                <div className="ve-libres-tags">
                  {libres.moderados.flatMap((item, idx) =>
                    item.includes('|||')
                      ? item.split('|||').map(s => s.trim()).filter(Boolean).map((s, j) => (
                          <span key={`${idx}-${j}`} className="ve-libre-tag moderado">{s}</span>
                        ))
                      : [<span key={idx} className="ve-libre-tag moderado">{item}</span>]
                  )}
                </div>
              </div>
            )}
            {libres.libres?.length > 0 && (
              <div className="ve-libres-col">
                <h4 className="ve-libres-subtitle">
                  <LucideIcon name="infinity" size={16} />
                  Libres
                </h4>
                <p className="ve-libres-hint">Alimentos sin calorías</p>
                <div className="ve-libres-tags">
                  {libres.libres.flatMap((item, idx) =>
                    item.includes('|||')
                      ? item.split('|||').map(s => s.trim()).filter(Boolean).map((s, j) => (
                          <span key={`${idx}-${j}`} className="ve-libre-tag libre">{s}</span>
                        ))
                      : [<span key={idx} className="ve-libre-tag libre">{item}</span>]
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {recomendaciones.length > 0 && (
        <div className="ve-recomendaciones-section">
          <h3 className="ve-section-title">
            <LucideIcon name="lightbulb" size={20} />
            Recomendaciones
          </h3>
          <ul className="ve-recomendaciones-list">
            {recomendaciones.map((rec, idx) => (
              <li key={idx}>
                <span className="ve-rec-bullet">
                  <LucideIcon name="check" size={14} />
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      </>}

      {/* Texto original (solo para especialista) */}
      {!compact && !pacienteView && contenido.texto_original && (
        <details className="ve-texto-original">
          <summary>
            <LucideIcon name="file-text" size={16} /> Ver texto extraído del PDF
          </summary>
          <pre className="ve-texto-pre">{contenido.texto_original}</pre>
        </details>
      )}
    </div>
  );
};

export { limpiarAlimentos };
export default VistaEquivalentes;
