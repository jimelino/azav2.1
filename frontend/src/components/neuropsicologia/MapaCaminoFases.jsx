import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import ContratoTerapeutico from './ContratoTerapeutico';
import './MapaCaminoFases.css';

const ICONOS_FASE = {
  1: 'search',
  2: 'target',
  3: 'sparkles',
  4: 'circle-check',
};

// Posiciones de los 4 nodos a lo largo del camino, en porcentaje del
// contenedor (x desde la izquierda, y desde arriba). El zigzag imita el
// mapa de referencia (nodos alternando arriba/abajo a lo largo de una curva).
const POSICIONES = [
  { x: 10, y: 70 },
  { x: 37, y: 25 },
  { x: 63, y: 70 },
  { x: 90, y: 25 },
];

const MENSAJES_MOTIVACIONALES = {
  1: 'Tu camino comienza aquí. Cada paso cuenta.',
  2: 'Vas avanzando bien, sigue así.',
  3: 'Estás en la etapa de entrenamiento mental. ¡Buen trabajo!',
  4: '¡Felicidades! Completaste tu camino en Neuropsicología.',
};

const MapaCaminoFases = ({ pacienteId, documentos = [] }) => {
  const [fase, setFase] = useState(null);
  const [catalogo, setCatalogo] = useState({});
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const res = await api.get(`/neuropsicologia/fases/${pacienteId}`);
      const data = res?.data || res;
      setFase(data?.fase || null);
      setCatalogo(data?.catalogo || {});
    } catch (error) {
      console.error('Error al cargar el mapa de fases:', error);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const faseActualNum = fase?.fase_numero || 1;
  const numerosFase = [1, 2, 3, 4];

  const getEstado = (numero) => {
    if (numero < faseActualNum) return 'completed';
    if (numero === faseActualNum) return 'current';
    return 'future';
  };

  // Un segmento de curva por cada par de nodos consecutivos, para poder
  // colorear por separado lo ya recorrido (morado) de lo pendiente (gris).
  const segmentos = POSICIONES.slice(0, -1).map((pos, i) => {
    const siguiente = POSICIONES[i + 1];
    const medioX = (pos.x + siguiente.x) / 2;
    return {
      d: `M${pos.x},${pos.y} C${medioX},${pos.y} ${medioX},${siguiente.y} ${siguiente.x},${siguiente.y}`,
      recorrido: (i + 2) <= faseActualNum
    };
  });

  if (loading) {
    return (
      <div className="camino-fases-loading" role="status" aria-live="polite">
        <div className="camino-fases-spinner" aria-hidden="true"></div>
        <p>Cargando tu camino...</p>
      </div>
    );
  }

  return (
    <div className="camino-fases-container">
      <div className="camino-fases-actual">
        <LucideIcon name={ICONOS_FASE[faseActualNum] || 'circle'} size={22} />
        <span>{catalogo[faseActualNum] || 'Consulta inicial'}</span>
      </div>

      <div className="camino-fases-mapa" role="list" aria-label="Fases del tratamiento de neuropsicología">
        <svg
          className="camino-fases-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {segmentos.map((seg, i) => (
            <path
              key={i}
              d={seg.d}
              className={`camino-fases-path ${seg.recorrido ? 'recorrido' : ''}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {numerosFase.map((numero, i) => {
          const estado = getEstado(numero);
          const pos = POSICIONES[i];
          const labelArriba = pos.y > 50; // si el nodo está abajo, la etiqueta va arriba y viceversa
          return (
            <div
              key={numero}
              className={`camino-fases-nodo ${estado} ${labelArriba ? 'label-arriba' : 'label-abajo'}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              role="listitem"
            >
              {labelArriba && <span className="camino-fases-label">{catalogo[numero] || `Fase ${numero}`}</span>}
              <span className="camino-fases-punto" aria-hidden="true">
                {estado === 'completed' ? <LucideIcon name="check" size={16} /> : numero}
              </span>
              {!labelArriba && <span className="camino-fases-label">{catalogo[numero] || `Fase ${numero}`}</span>}
            </div>
          );
        })}
      </div>

      <p className="camino-fases-mensaje">{MENSAJES_MOTIVACIONALES[faseActualNum]}</p>

      {faseActualNum >= 2 && (
        <section className="camino-fases-resultados" aria-labelledby="camino-resultados-heading">
          <h3 id="camino-resultados-heading" className="camino-fases-section-title">
            <LucideIcon name="file-text" size={18} /> Resultados de tu evaluación
          </h3>
          {documentos.length === 0 ? (
            <p className="camino-fases-resultados-empty">Aún no hay resultados disponibles.</p>
          ) : (
            <div className="camino-fases-resultados-list">
              {documentos.map((documento, index) => (
                <a
                  key={documento.id || index}
                  href={documento.url || documento.enlace || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="camino-fases-resultado-link"
                >
                  <LucideIcon name="file-text" size={18} />
                  <span>{documento.titulo || documento.nombre || `Documento ${index + 1}`}</span>
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      <ContratoTerapeutico pacienteId={pacienteId} />
    </div>
  );
};

export default MapaCaminoFases;
