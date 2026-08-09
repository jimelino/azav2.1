import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import ContratoTerapeutico from './ContratoTerapeutico';
import './MapaCaminoFases.css';

const DESCRIPCIONES_FASE = {
  1: 'Entrevista inicial con el paciente y familiares para conocer su historial y definir objetivos.',
  2: 'Aplicación de pruebas cognitivas y diagnóstico neuropsicológico completo.',
  3: 'Sesiones periódicas de rehabilitación cognitiva y ejercicios de estimulación adaptados.',
  4: 'Conclusión exitosa del proceso, con recomendaciones para continuar en casa.',
};

const MENSAJES_MOTIVACIONALES = {
  1: 'Tu camino comienza aquí. Cada paso cuenta.',
  2: 'Vas avanzando bien, sigue así.',
  3: 'Estás en la etapa de entrenamiento mental. ¡Buen trabajo!',
  4: '¡Felicidades! Completaste tu camino en Neuropsicología.',
};

const MapaCaminoFases = ({ pacienteId, documentos = [] }) => {
  const [fase, setFase] = useState(null);
  const [catalogo, setCatalogo] = useState({});
  const [evaluacionRealizada, setEvaluacionRealizada] = useState(false);
  const [sesionesRegistradas, setSesionesRegistradas] = useState(0);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const res = await api.get(`/neuropsicologia/fases/${pacienteId}`);
      const data = res?.data || res;
      setFase(data?.fase || null);
      setCatalogo(data?.catalogo || {});
      setEvaluacionRealizada(Boolean(data?.evaluacion_realizada));
      setSesionesRegistradas(Number(data?.sesiones_registradas) || 0);
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
  const numerosFase = Object.keys(catalogo).length
    ? Object.keys(catalogo).map(Number).sort((a, b) => a - b)
    : [1, 2, 3, 4];
  const totalFases = numerosFase.length;

  const getEstado = (numero) => {
    if (numero < faseActualNum) return 'completada';
    if (numero === faseActualNum) return 'activa';
    return 'bloqueada';
  };

  const progresoPct = totalFases > 1 ? ((faseActualNum - 1) / (totalFases - 1)) * 100 : 0;

  if (loading) {
    return (
      <div className="camino-fases-loading" role="status" aria-live="polite">
        <div className="camino-fases-spinner" aria-hidden="true"></div>
        <p>Cargando tu progreso...</p>
      </div>
    );
  }

  return (
    <div className="camino-fases-container">
      <header className="camino-fases-header">
        <div className="camino-fases-eyebrow">
          <span className="camino-fases-eyebrow-dot" aria-hidden="true"></span>
          Roadmap de Neuropsicología
        </div>
        <h2 className="camino-fases-titulo">Tu Progreso</h2>
        <div className="camino-fases-estado-actual">
          <span className="camino-fases-estado-dot" aria-hidden="true"></span>
          <span className="camino-fases-estado-label">Estado actual:</span>
          <span className="camino-fases-estado-valor">
            {faseActualNum >= totalFases
              ? `Fase ${faseActualNum} de ${totalFases} — Completado`
              : `Fase ${faseActualNum} de ${totalFases} en progreso`}
          </span>
        </div>
      </header>

      <div className="camino-fases-track" role="list" aria-label="Etapas del roadmap de neuropsicología">
        <div className="camino-fases-linea" aria-hidden="true">
          <div className="camino-fases-linea-progreso" style={{ width: `${progresoPct}%` }}></div>
        </div>

        {numerosFase.map((numero) => {
          const estado = getEstado(numero);
          return (
            <div
              key={numero}
              role="listitem"
              className={`camino-fase-card estado-${estado}`}
              aria-current={estado === 'activa' ? 'step' : undefined}
              aria-label={`Fase ${numero}: ${catalogo[numero] || ''} — ${estado}`}
            >
              {estado === 'activa' && (
                <span className="camino-fase-flotante">
                  <LucideIcon name="map-pin" size={12} /> Estás en esta etapa
                </span>
              )}

              <div className="camino-fase-card-header">
                <span className="camino-fase-numero">Fase {numero}</span>
                {estado === 'completada' && (
                  <span className="camino-fase-icono-estado completada" aria-label="Fase completada">
                    <LucideIcon name="check" size={14} />
                  </span>
                )}
                {estado === 'activa' && <span className="camino-fase-chip">En proceso</span>}
                {estado === 'bloqueada' && (
                  <span className="camino-fase-icono-estado bloqueada" aria-label="Fase bloqueada">
                    <LucideIcon name="lock" size={14} />
                  </span>
                )}
              </div>

              <h3 className="camino-fase-titulo-etapa">{catalogo[numero] || `Fase ${numero}`}</h3>
              <p className="camino-fase-desc">{DESCRIPCIONES_FASE[numero]}</p>

              {numero === 2 && (
                <div className="camino-fase-dato">
                  <span className="camino-fase-dato-label">
                    <LucideIcon name="brain" size={14} /> Diagnóstico
                  </span>
                  <span className={`camino-fase-pill ${evaluacionRealizada ? 'lista' : 'pendiente'}`}>
                    {evaluacionRealizada ? 'Listo' : 'Pendiente'}
                  </span>
                </div>
              )}

              {numero === 3 && (
                <div className="camino-fase-dato">
                  <span className="camino-fase-dato-label">
                    <LucideIcon name="sparkles" size={14} /> Sesiones registradas
                  </span>
                  <span className={`camino-fase-pill ${sesionesRegistradas > 0 ? 'lista' : 'pendiente'}`}>
                    {sesionesRegistradas}
                  </span>
                </div>
              )}

              {numero === totalFases && estado === 'bloqueada' && (
                <div className="camino-fase-proxima">
                  <LucideIcon name="target" size={14} /> Próxima etapa
                </div>
              )}
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
