import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './ContratoTerapeutico.css';

const ContratoTerapeutico = ({ pacienteId, esEspecialista = false }) => {
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const res = await api.get(`/neuropsicologia/contrato/${pacienteId}`);
      const data = res?.data || res;
      setContrato(data?.contrato || null);
    } catch (error) {
      console.error('Error al cargar el contrato terapéutico:', error);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      alert('El contrato debe ser un archivo PDF.');
      e.target.value = '';
      return;
    }
    setArchivo(file || null);
  };

  const handleSubir = async () => {
    if (!archivo || subiendo) return;
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      await api.post(`/neuropsicologia/contrato/${pacienteId}`, formData, {
        headers: { 'Content-Type': undefined }
      });
      setArchivo(null);
      await cargar();
    } catch (error) {
      console.error('Error al subir el contrato terapéutico:', error);
      alert('No se pudo subir el contrato. Verifica que sea un PDF válido.');
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) return null;

  return (
    <section className="contrato-terapeutico">
      <h3 className="contrato-terapeutico-title">
        <LucideIcon name="file-text" size={18} /> Contrato terapéutico
      </h3>

      {contrato ? (
        <a
          href={contrato.archivo_url}
          target="_blank"
          rel="noreferrer"
          className="contrato-terapeutico-link"
        >
          <LucideIcon name="file-text" size={18} />
          <span>Descargar contrato terapéutico</span>
        </a>
      ) : (
        <p className="contrato-terapeutico-empty">
          {esEspecialista ? 'Aún no has subido el contrato terapéutico de este paciente.' : 'Tu especialista aún no ha subido tu contrato terapéutico.'}
        </p>
      )}

      {esEspecialista && (
        <div className="contrato-terapeutico-upload">
          <label className="contrato-terapeutico-file-label">
            <input type="file" accept="application/pdf" onChange={handleArchivoChange} hidden />
            <LucideIcon name="upload" size={16} />
            <span>{archivo ? archivo.name : 'Elegir PDF'}</span>
          </label>
          <button
            className="contrato-terapeutico-btn-subir"
            onClick={handleSubir}
            disabled={!archivo || subiendo}
          >
            {subiendo ? 'Subiendo...' : (contrato ? 'Reemplazar contrato' : 'Subir contrato')}
          </button>
        </div>
      )}
    </section>
  );
};

export default ContratoTerapeutico;
