import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';
import './AdmisionesTab.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ESTADO_LABELS = {
  solicitud_recibida: 'Recibida',
  screening_aprobado: 'Screening Aprobado',
  screening_rechazado: 'Screening Rechazado',
  documentos_pendientes: 'Docs Pendientes',
  documentos_recibidos: 'Docs Recibidos',
  pago_pendiente: 'Pago Pendiente',
  pago_confirmado: 'Pago Confirmado',
  preconsulta_programada: 'Preconsulta Programada',
  preconsulta_completada: 'Preconsulta Completada',
  admitido: 'Admitido',
  rechazado: 'Rechazado'
};

const PIPELINE_STEPS = [
  { key: 'solicitud_recibida', label: 'Recibida' },
  { key: 'screening_aprobado', label: 'Screening' },
  { key: 'pago_confirmado', label: 'Pago' },
  { key: 'documentos_recibidos', label: 'Documentos' },
  { key: 'preconsulta_completada', label: 'Preconsulta' },
  { key: 'admitido', label: 'Admitido' }
];

const TIPO_SERVICIO_LABELS = {
  ortesis: 'Órtesis a Público General',
  protesis_publico: 'Prótesis a Público General',
  protocolo_protesis: 'Protocolo de Prótesis'
};

const AdmisionesTab = () => {
  const [subVista, setSubVista] = useState('pipeline');
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroSemestre, setFiltroSemestre] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Detalle
  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Reportes
  const [reporte, setReporte] = useState(null);
  const [reporteSemestre, setReporteSemestre] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const reporteRef = useRef(null);

  // Docs oficiales
  const [docsOficiales, setDocsOficiales] = useState([]);
  const fileInputRef = useRef({});

  // Modal
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [procesando, setProcesando] = useState(false);

  // Resultado de admisión
  const [resultadoAdmision, setResultadoAdmision] = useState(null);
  // Link generado
  const [linkGenerado, setLinkGenerado] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, [filtroEstado, filtroSemestre]);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
      if (filtroSemestre) params.append('semestre', filtroSemestre);
      if (busqueda) params.append('busqueda', busqueda);
      const res = await api.get(`/admin/admisiones?${params.toString()}`);
      setSolicitudes(res?.data || []);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (id) => {
    setDetalleLoading(true);
    try {
      const res = await api.get(`/admin/admisiones/${id}`);
      setDetalle(res?.data || null);
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setDetalleLoading(false);
    }
  };

  const cargarReporte = async (sem) => {
    try {
      const params = sem ? `?semestre=${sem}` : '';
      const res = await api.get(`/admin/admisiones/reportes/semestre${params}`);
      setReporte(res?.data || null);
    } catch (err) {
      console.error('Error cargando reporte:', err);
    }
  };

  const descargarPDF = async () => {
    if (!reporte) return;
    setGenerandoPDF(true);
    try {
      // Cargar TODAS las solicitudes del semestre (sin filtro de estado)
      const params = new URLSearchParams();
      if (reporteSemestre) params.append('semestre', reporteSemestre);
      const res = await api.get(`/admin/admisiones?${params.toString()}`);
      const todasSolicitudes = res?.data || [];

      // Clasificar por estado
      const admitidos = todasSolicitudes.filter(s => s.estado === 'admitido');
      const rechazados = todasSolicitudes.filter(s => s.estado === 'rechazado' || s.estado === 'screening_rechazado');
      const enEspera = todasSolicitudes.filter(s => ['solicitud_recibida', 'screening_aprobado', 'documentos_pendientes', 'documentos_recibidos', 'pago_pendiente', 'pago_confirmado', 'preconsulta_programada', 'preconsulta_completada'].includes(s.estado));

      // Conteos por estado
      const conteos = {};
      todasSolicitudes.forEach(s => { conteos[s.estado] = (conteos[s.estado] || 0) + 1; });

      const fechaReporte = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

      // Generar filas de tabla
      const filasTabla = (lista) => lista.map(s =>
        `<tr>
          <td>SOL-${String(s.id).padStart(5, '0')}</td>
          <td>${s.nombre_completo}</td>
          <td>${s.edad}</td>
          <td>${s.sexo === 'masculino' ? 'M' : s.sexo === 'femenino' ? 'F' : 'O'}</td>
          <td>${s.ciudad}, ${s.estado_procedencia}</td>
          <td>${TIPO_SERVICIO_LABELS[s.tipo_servicio] || s.tipo_servicio}</td>
          <td>${ESTADO_LABELS[s.estado] || s.estado}</td>
        </tr>`
      ).join('');

      // Crear div temporal para renderizar el reporte
      const reportDiv = document.createElement('div');
      reportDiv.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;background:#fff;color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;padding:40px;';
      reportDiv.innerHTML = `
        <div style="border-bottom:3px solid #0097A7;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="margin:0 0 4px 0;font-size:22px;color:#0097A7;">Reporte de Admisiones</h1>
          <p style="margin:0;font-size:13px;color:#555;">Semestre ${reporteSemestre} &middot; Generado el ${fechaReporte}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:#777;">Unidad de Investigaci\u00f3n en \u00d3rtesis y Pr\u00f3tesis - ENES Juriquilla, UNAM</p>
        </div>

        <h2 style="font-size:16px;color:#1a1a1a;margin:0 0 12px 0;">Resumen General</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#0097A7;color:#fff;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Concepto</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;width:100px;">Cantidad</th>
          </tr></thead>
          <tbody>
            <tr style="border-bottom:1px solid #e0e0e0;">
              <td style="padding:8px 12px;font-size:13px;">Total de Solicitudes</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:14px;">${todasSolicitudes.length}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;background:#f9f9f9;">
              <td style="padding:8px 12px;font-size:13px;">Admitidos</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;color:#2ea043;font-size:14px;">${admitidos.length}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;">
              <td style="padding:8px 12px;font-size:13px;">Rechazados / No Admitidos</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;color:#f85149;font-size:14px;">${rechazados.length}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;background:#f9f9f9;">
              <td style="padding:8px 12px;font-size:13px;">En Espera / En Proceso</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;color:#d29922;font-size:14px;">${enEspera.length}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;">
              <td style="padding:8px 12px;font-size:13px;">Tasa de Admisi\u00f3n</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:14px;">${reporte.tasa_admision || 0}%</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;background:#f9f9f9;">
              <td style="padding:8px 12px;font-size:13px;">Total Preconsultas Programadas</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:14px;">${reporte.total_preconsultas || 0}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;">
              <td style="padding:8px 12px;font-size:13px;">Preconsultas Asistidas (pagadas)</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:14px;">${reporte.preconsultas_asistidas || 0}</td>
            </tr>
            <tr style="border-bottom:2px solid #4CAF50;background:#f0fff0;">
              <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#2e7d32;">Ingresos por Preconsultas ($${reporte.costo_preconsulta || 500} c/u)</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:15px;color:#2e7d32;">$${((reporte.ingresos_preconsultas || 0)).toLocaleString('es-MX')} MXN</td>
            </tr>
          </tbody>
        </table>

        <h2 style="font-size:16px;color:#1a1a1a;margin:0 0 12px 0;">Desglose por Estado</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#30363D;color:#fff;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Estado</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;width:100px;">Cantidad</th>
          </tr></thead>
          <tbody>
            ${Object.entries(conteos).sort((a, b) => b[1] - a[1]).map(([estado, total], i) =>
              `<tr style="border-bottom:1px solid #e0e0e0;${i % 2 ? 'background:#f9f9f9;' : ''}">
                <td style="padding:8px 12px;font-size:13px;">${ESTADO_LABELS[estado] || estado}</td>
                <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:13px;">${total}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>

        ${reporte.por_sexo?.length > 0 ? `
        <h2 style="font-size:16px;color:#1a1a1a;margin:0 0 12px 0;">Distribuci\u00f3n por Sexo</h2>
        <table style="width:50%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#30363D;color:#fff;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Sexo</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;width:100px;">Total</th>
          </tr></thead>
          <tbody>
            ${reporte.por_sexo.map((s, i) =>
              `<tr style="border-bottom:1px solid #e0e0e0;${i % 2 ? 'background:#f9f9f9;' : ''}">
                <td style="padding:8px 12px;font-size:13px;">${s.sexo === 'masculino' ? 'Masculino' : s.sexo === 'femenino' ? 'Femenino' : 'Otro'}</td>
                <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:13px;">${s.total}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>` : ''}

        ${reporte.por_procedencia?.length > 0 ? `
        <h2 style="font-size:16px;color:#1a1a1a;margin:0 0 12px 0;">Procedencia</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr style="background:#30363D;color:#fff;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Estado</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Ciudad</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;width:80px;">Total</th>
          </tr></thead>
          <tbody>
            ${reporte.por_procedencia.map((p, i) =>
              `<tr style="border-bottom:1px solid #e0e0e0;${i % 2 ? 'background:#f9f9f9;' : ''}">
                <td style="padding:8px 12px;font-size:13px;">${p.estado_procedencia}</td>
                <td style="padding:8px 12px;font-size:13px;">${p.ciudad}</td>
                <td style="padding:8px 12px;text-align:center;font-weight:600;font-size:13px;">${p.total}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>` : ''}

        ${admitidos.length > 0 ? `
        <h2 style="font-size:16px;color:#2ea043;margin:24px 0 12px 0;border-top:2px solid #e0e0e0;padding-top:16px;">Solicitantes Admitidos (${admitidos.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px;">
          <thead><tr style="background:#2ea043;color:#fff;">
            <th style="padding:6px 8px;text-align:left;">Folio</th>
            <th style="padding:6px 8px;text-align:left;">Nombre</th>
            <th style="padding:6px 8px;text-align:center;">Edad</th>
            <th style="padding:6px 8px;text-align:center;">Sexo</th>
            <th style="padding:6px 8px;text-align:left;">Procedencia</th>
            <th style="padding:6px 8px;text-align:left;">Tipo Servicio</th>
            <th style="padding:6px 8px;text-align:left;">Estado</th>
          </tr></thead>
          <tbody>${filasTabla(admitidos)}</tbody>
        </table>` : ''}

        ${rechazados.length > 0 ? `
        <h2 style="font-size:16px;color:#f85149;margin:24px 0 12px 0;border-top:2px solid #e0e0e0;padding-top:16px;">Solicitantes Rechazados (${rechazados.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px;">
          <thead><tr style="background:#f85149;color:#fff;">
            <th style="padding:6px 8px;text-align:left;">Folio</th>
            <th style="padding:6px 8px;text-align:left;">Nombre</th>
            <th style="padding:6px 8px;text-align:center;">Edad</th>
            <th style="padding:6px 8px;text-align:center;">Sexo</th>
            <th style="padding:6px 8px;text-align:left;">Procedencia</th>
            <th style="padding:6px 8px;text-align:left;">Tipo Servicio</th>
            <th style="padding:6px 8px;text-align:left;">Estado</th>
          </tr></thead>
          <tbody>${filasTabla(rechazados)}</tbody>
        </table>` : ''}

        ${enEspera.length > 0 ? `
        <h2 style="font-size:16px;color:#d29922;margin:24px 0 12px 0;border-top:2px solid #e0e0e0;padding-top:16px;">Solicitantes en Espera / En Proceso (${enEspera.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px;">
          <thead><tr style="background:#d29922;color:#fff;">
            <th style="padding:6px 8px;text-align:left;">Folio</th>
            <th style="padding:6px 8px;text-align:left;">Nombre</th>
            <th style="padding:6px 8px;text-align:center;">Edad</th>
            <th style="padding:6px 8px;text-align:center;">Sexo</th>
            <th style="padding:6px 8px;text-align:left;">Procedencia</th>
            <th style="padding:6px 8px;text-align:left;">Tipo Servicio</th>
            <th style="padding:6px 8px;text-align:left;">Estado</th>
          </tr></thead>
          <tbody>${filasTabla(enEspera)}</tbody>
        </table>` : ''}

        <div style="margin-top:32px;padding-top:12px;border-top:1px solid #ccc;font-size:11px;color:#999;text-align:center;">
          Azaria - Unidad de Investigaci\u00f3n en \u00d3rtesis y Pr\u00f3tesis - ENES Juriquilla, UNAM &middot; ${fechaReporte}
        </div>
      `;

      document.body.appendChild(reportDiv);

      // Capturar como imagen
      const canvas = await html2canvas(reportDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });

      document.body.removeChild(reportDiv);

      // Generar PDF multipágina
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;

      // Paginar si es necesario
      let yOffset = 0;
      let page = 0;
      const totalImgHeight = imgHeight;

      while (yOffset < canvas.height) {
        if (page > 0) pdf.addPage();
        const slicePixels = Math.min(canvas.height - yOffset, Math.floor(canvas.height * (usableHeight / totalImgHeight)));
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = slicePixels;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, yOffset, canvas.width, slicePixels, 0, 0, canvas.width, slicePixels);
        const sliceHeight = (slicePixels * imgWidth) / canvas.width;
        pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, sliceHeight);
        yOffset += slicePixels;
        page++;
      }

      pdf.save(`Reporte_Admisiones_${reporteSemestre}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const cargarDocsOficiales = async () => {
    try {
      const res = await api.get('/admisiones/documentos-oficiales');
      setDocsOficiales(res?.data || []);
    } catch (err) {
      console.error('Error cargando docs oficiales:', err);
    }
  };

  const handleVerDetalle = (sol) => {
    cargarDetalle(sol.id);
    setSubVista('detalle');
  };

  const handleVolverPipeline = () => {
    setDetalle(null);
    setSubVista('pipeline');
    cargarSolicitudes();
  };

  // Acciones del pipeline
  const handleScreening = async (aprobado) => {
    setProcesando(true);
    try {
      await api.put(`/admin/admisiones/${detalle.solicitud.id}/estado`, {
        estado: aprobado ? 'screening_aprobado' : 'screening_rechazado',
        notas: modalData.notas || ''
      });
      setModal(null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleGenerarLink = async () => {
    setProcesando(true);
    try {
      const res = await api.post(`/admin/admisiones/${detalle.solicitud.id}/token-documentos`);
      setLinkGenerado(res?.data || null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleMarcarPagado = async () => {
    setProcesando(true);
    try {
      const res = await api.post(`/admin/admisiones/${detalle.solicitud.id}/pagado`);
      setLinkGenerado(res?.data || null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleProgramarPreconsulta = async () => {
    setProcesando(true);
    try {
      await api.put(`/admin/admisiones/${detalle.solicitud.id}/preconsulta`, {
        fecha: modalData.fecha,
        hora: modalData.hora
      });
      setModal(null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleCompletarPreconsulta = async () => {
    setProcesando(true);
    try {
      await api.put(`/admin/admisiones/${detalle.solicitud.id}/estado`, {
        estado: 'preconsulta_completada',
        notas: modalData.notas || ''
      });
      setModal(null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleAdmitir = async () => {
    setProcesando(true);
    try {
      const res = await api.post(`/admin/admisiones/${detalle.solicitud.id}/admitir`, {
        notas: modalData.notas || '',
        fecha_nacimiento: modalData.fecha_nacimiento || null
      });
      setResultadoAdmision(res?.data || null);
      setModal(null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    setProcesando(true);
    try {
      await api.put(`/admin/admisiones/${detalle.solicitud.id}/rechazar`, {
        notas: modalData.notas || ''
      });
      setModal(null);
      cargarDetalle(detalle.solicitud.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcesando(false);
    }
  };

  // Docs oficiales
  const handleUploadDocOficial = async (tipo, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    try {
      await api.post('/admin/documentos-oficiales', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      cargarDocsOficiales();
    } catch (err) {
      console.error('Error subiendo doc oficial:', err);
    }
  };

  const handleDeleteDocOficial = async (id) => {
    if (!window.confirm('¿Eliminar este documento oficial?')) return;
    try {
      await api.delete(`/admin/documentos-oficiales/${id}`);
      cargarDocsOficiales();
    } catch (err) {
      console.error('Error eliminando doc:', err);
    }
  };

  const copiarAlPortapapeles = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const getSemestreActual = () => {
    const m = new Date().getMonth() + 1;
    const a = new Date().getFullYear();
    return `${a}-${m <= 6 ? '1' : '2'}`;
  };

  const generarOpcionesSemestre = () => {
    const opciones = [];
    const anioActual = new Date().getFullYear();
    for (let a = anioActual; a >= anioActual - 2; a--) {
      opciones.push(`${a}-2`);
      opciones.push(`${a}-1`);
    }
    return opciones;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPipelineIndex = (estado) => {
    // Flujo: Recibida(0) → Screening(1) → Pago(2) → Documentos(3) → Preconsulta(4) → Admitido(5)
    const map = {
      solicitud_recibida: 0,
      screening_aprobado: 1, screening_rechazado: -1,
      pago_pendiente: 1, pago_confirmado: 2,
      documentos_pendientes: 2, documentos_recibidos: 3,
      preconsulta_programada: 3, preconsulta_completada: 4,
      admitido: 5, rechazado: -1
    };
    return map[estado] ?? 0;
  };

  // =====================================================
  // RENDER SUB-VISTAS
  // =====================================================

  const renderPipeline = () => (
    <div>
      {/* Filtros de estado */}
      <div className="admisiones-estado-chips">
        {[
          { key: 'todos', label: 'Todos', cls: 'todos' },
          { key: 'solicitud_recibida', label: 'Recibidas', cls: 'recibida' },
          { key: 'screening_aprobado', label: 'Aprobadas', cls: 'aprobado' },
          { key: 'pago_confirmado', label: 'Pagados', cls: 'pago' },
          { key: 'documentos_pendientes', label: 'Docs Pend.', cls: 'docs' },
          { key: 'documentos_recibidos', label: 'Docs Recibidos', cls: 'docs' },
          { key: 'preconsulta_programada', label: 'Preconsulta', cls: 'preconsulta' },
          { key: 'admitido', label: 'Admitidos', cls: 'admitido' },
          { key: 'rechazado', label: 'Rechazados', cls: 'rechazado' }
        ].map(chip => (
          <span
            key={chip.key}
            className={`estado-chip estado-chip-${chip.cls} ${filtroEstado === chip.key ? 'active' : ''}`}
            onClick={() => setFiltroEstado(chip.key)}
          >
            {chip.label}
          </span>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="admisiones-filtros">
        <select value={filtroSemestre} onChange={e => setFiltroSemestre(e.target.value)}>
          <option value="">Todos los semestres</option>
          {generarOpcionesSemestre().map(s => (
            <option key={s} value={s}>Semestre {s}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cargarSolicitudes()}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="admisiones-loading">
          <div className="admisiones-spinner" />
          <p>Cargando solicitudes...</p>
        </div>
      ) : solicitudes.length > 0 ? (
        <div className="admisiones-lista">
          {solicitudes.map(sol => (
            <div key={sol.id} className="admisiones-card" onClick={() => handleVerDetalle(sol)}>
              <div className="admisiones-card-header">
                <div>
                  <div className="admisiones-card-nombre">{sol.nombre_completo}</div>
                  <div className="admisiones-card-folio">SOL-{String(sol.id).padStart(5, '0')}</div>
                </div>
                <span className={`estado-badge estado-${sol.estado}`}>
                  {ESTADO_LABELS[sol.estado] || sol.estado}
                </span>
              </div>
              <div className="admisiones-card-body">
                <span><LucideIcon name="phone" size={14} /> {sol.telefono}</span>
                <span><LucideIcon name="map-pin" size={14} /> {sol.ciudad}, {sol.estado_procedencia}</span>
                <span>{TIPO_SERVICIO_LABELS[sol.tipo_servicio] || sol.tipo_servicio}</span>
                {sol.total_documentos > 0 && <span><LucideIcon name="paperclip" size={14} /> {sol.total_documentos} docs</span>}
              </div>
              <div className="admisiones-card-footer">
                <span className="admisiones-card-fecha">{formatFecha(sol.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admisiones-empty">
          <LucideIcon name="inbox" size={36} />
          <h4>Sin solicitudes</h4>
          <p>No hay solicitudes que coincidan con los filtros seleccionados.</p>
        </div>
      )}
    </div>
  );

  const renderDetalle = () => {
    if (detalleLoading || !detalle) {
      return (
        <div className="admisiones-loading">
          <div className="admisiones-spinner" />
          <p>Cargando detalle...</p>
        </div>
      );
    }

    const sol = detalle.solicitud;
    const docs = detalle.documentos || [];
    const pagos = detalle.pagos || [];
    const pipeIdx = getPipelineIndex(sol.estado);
    const isRechazado = sol.estado === 'screening_rechazado' || sol.estado === 'rechazado';

    return (
      <div className="admisiones-detalle">
        <div className="admisiones-detalle-header">
          <button className="admisiones-back-btn" onClick={handleVolverPipeline}>
            <LucideIcon name="arrow-left" size={16} /> Volver
          </button>
          <span className="admisiones-detalle-title">
            {sol.nombre_completo}
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              SOL-{String(sol.id).padStart(5, '0')}
            </span>
          </span>
          <span className={`estado-badge estado-${sol.estado}`}>
            {ESTADO_LABELS[sol.estado]}
          </span>
        </div>

        {/* Pipeline visual */}
        <div className="admisiones-info-card">
          <h3><LucideIcon name="git-branch" size={18} /> Progreso del Pipeline</h3>
          <div className="pipeline-stepper">
            {PIPELINE_STEPS.map((step, idx) => (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <div className={`pipeline-step-line ${idx <= pipeIdx && !isRechazado ? 'completed' : ''}`} />
                )}
                <div className="pipeline-step">
                  <div className={`pipeline-step-dot ${
                    isRechazado && idx === 0 ? 'rejected' :
                    idx < pipeIdx && !isRechazado ? 'completed' :
                    idx === pipeIdx && !isRechazado ? 'current' : ''
                  }`}>
                    {idx < pipeIdx && !isRechazado ? '✓' :
                     isRechazado && idx === pipeIdx ? '✕' : ''}
                  </div>
                  <span className={`pipeline-step-label ${idx === pipeIdx ? 'current' : ''}`}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Datos del solicitante */}
        <div className="admisiones-info-card">
          <h3><LucideIcon name="user" size={18} /> Datos del Solicitante</h3>
          <div className="admisiones-info-grid">
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Teléfono</span>
              <span className="admisiones-info-value">{sol.telefono}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Email</span>
              <span className="admisiones-info-value">{sol.email || '-'}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Edad</span>
              <span className="admisiones-info-value">{sol.edad} años</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Sexo</span>
              <span className="admisiones-info-value" style={{ textTransform: 'capitalize' }}>{sol.sexo}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Ciudad</span>
              <span className="admisiones-info-value">{sol.ciudad}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Estado</span>
              <span className="admisiones-info-value">{sol.estado_procedencia}</span>
            </div>
          </div>
        </div>

        {/* Datos clínicos */}
        <div className="admisiones-info-card">
          <h3><LucideIcon name="stethoscope" size={18} /> Datos Clínicos</h3>
          <div className="admisiones-info-grid">
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Tipo de Servicio</span>
              <span className="admisiones-info-value">{TIPO_SERVICIO_LABELS[sol.tipo_servicio]}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Tipo de Amputación</span>
              <span className="admisiones-info-value">{sol.tipo_amputacion}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Causa</span>
              <span className="admisiones-info-value">{sol.causa_amputacion}</span>
            </div>
            <div className="admisiones-info-item">
              <span className="admisiones-info-label">Prótesis Previa</span>
              <span className="admisiones-info-value">{sol.tiene_protesis_previa ? 'Sí' : 'No'}</span>
            </div>
            {sol.tiempo_desde_amputacion && (
              <div className="admisiones-info-item">
                <span className="admisiones-info-label">Tiempo desde amputación</span>
                <span className="admisiones-info-value">{sol.tiempo_desde_amputacion}</span>
              </div>
            )}
          </div>
          {sol.notas_clinicas && (
            <div style={{ marginTop: '12px' }}>
              <span className="admisiones-info-label">Notas clínicas</span>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '4px' }}>{sol.notas_clinicas}</p>
            </div>
          )}
        </div>

        {/* Documentos */}
        {docs.length > 0 && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="paperclip" size={18} /> Documentos ({docs.length})</h3>
            <div className="admisiones-docs-list">
              {docs.map(doc => {
                const ext = doc.nombre_original?.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                const previewUrl = `${api.defaults.baseURL}/admin/admisiones/documentos/${doc.id}/ver?token=${localStorage.getItem('token')}`;
                return (
                  <div key={doc.id} className="admisiones-doc-item admisiones-doc-clickable">
                    <div className="admisiones-doc-info" onClick={() => window.open(previewUrl, '_blank')}>
                      <LucideIcon name={isImage ? 'image' : 'file-text'} size={18} />
                      <span className="admisiones-doc-categoria">{doc.categoria}</span>
                      <span className="admisiones-doc-nombre">{doc.nombre_original}</span>
                    </div>
                    <div className="admisiones-doc-actions">
                      <span className="admisiones-doc-fecha">{formatFecha(doc.created_at)}</span>
                      <button
                        className="admisiones-doc-btn"
                        onClick={() => window.open(previewUrl, '_blank')}
                        title="Ver / Descargar"
                      >
                        <LucideIcon name="eye" size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagos */}
        {pagos.length > 0 && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="credit-card" size={18} /> Pagos</h3>
            {pagos.map(pago => (
              <div key={pago.id} style={{ padding: '10px', background: 'var(--surface-secondary)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Ref: {pago.referencia_pago}</strong>
                  <span className={`estado-badge estado-${pago.estado === 'confirmado' ? 'admitido' : pago.estado === 'rechazado' ? 'rechazado' : 'pago_pendiente'}`}>
                    {pago.estado}
                  </span>
                </div>
                {pago.monto && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '2px 0' }}>Monto: ${pago.monto}</p>}
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0' }}>
                  Enviado: {formatFecha(pago.fecha_envio)} {pago.enviado_por_nombre && `por ${pago.enviado_por_nombre}`}
                </p>
                {pago.fecha_confirmacion && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0' }}>
                    Confirmado: {formatFecha(pago.fecha_confirmacion)} {pago.confirmado_por_nombre && `por ${pago.confirmado_por_nombre}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Screening info */}
        {sol.screening_notas && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="clipboard-check" size={18} /> Notas de Screening</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>{sol.screening_notas}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {sol.screening_por_nombre && `Por: ${sol.screening_por_nombre}`} | {formatFecha(sol.screening_fecha)}
            </p>
          </div>
        )}

        {/* Preconsulta info */}
        {sol.fecha_preconsulta && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="calendar" size={18} /> Preconsulta</h3>
            <div className="admisiones-info-grid">
              <div className="admisiones-info-item">
                <span className="admisiones-info-label">Fecha</span>
                <span className="admisiones-info-value">{formatFecha(sol.fecha_preconsulta)}</span>
              </div>
              <div className="admisiones-info-item">
                <span className="admisiones-info-label">Hora</span>
                <span className="admisiones-info-value">{sol.hora_preconsulta || '-'}</span>
              </div>
            </div>
            {sol.preconsulta_notas && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>{sol.preconsulta_notas}</p>
            )}
          </div>
        )}

        {/* Decisión final */}
        {sol.decision_notas && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="gavel" size={18} /> Decisión Final</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>{sol.decision_notas}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {sol.decision_por_nombre && `Por: ${sol.decision_por_nombre}`} | {formatFecha(sol.decision_fecha)}
            </p>
          </div>
        )}

        {/* Link generado */}
        {linkGenerado && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="link" size={18} /> Enlace Generado</h3>
            <div className="link-generado">{linkGenerado.link}</div>
            <button className="link-copiar-btn" onClick={() => copiarAlPortapapeles(linkGenerado.link)}>
              Copiar Enlace
            </button>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Válido hasta: {formatFecha(linkGenerado.expira_en)}
            </p>
          </div>
        )}

        {/* Resultado admisión */}
        {resultadoAdmision && (
          <div className="admisiones-info-card">
            <h3><LucideIcon name="check-circle" size={18} /> Usuario Admitido</h3>
            <div className="temp-password-display">
              <span className="label">Contraseña temporal:</span>
              <span className="password">{resultadoAdmision.password_temporal}</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Email: {resultadoAdmision.email}
            </p>
          </div>
        )}

        {/* Acciones contextuales */}
        {renderAccionesDetalle(sol)}
      </div>
    );
  };

  const renderAccionesDetalle = (sol) => {
    const estado = sol.estado;
    return (
      <div className="admisiones-acciones">
        {estado === 'solicitud_recibida' && (
          <>
            <button className="admisiones-accion-btn btn-aprobar" onClick={() => { setModal('screening'); setModalData({ aprobado: true, notas: '' }); }}>
              <LucideIcon name="check" size={16} /> Aprobar Screening
            </button>
            <button className="admisiones-accion-btn btn-rechazar" onClick={() => { setModal('screening'); setModalData({ aprobado: false, notas: '' }); }}>
              <LucideIcon name="x" size={16} /> Rechazar Screening
            </button>
          </>
        )}

        {estado === 'screening_aprobado' && (
          <button className="admisiones-accion-btn btn-confirmar-pago" onClick={handleMarcarPagado} disabled={procesando}>
            <LucideIcon name="check-circle" size={16} /> {procesando ? 'Procesando...' : 'Marcar como Pagado'}
          </button>
        )}

        {(estado === 'pago_confirmado' || estado === 'documentos_pendientes') && (
          <>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Esperando documentos del solicitante. Se envió email con enlace de subida.
            </p>
            <button className="admisiones-accion-btn btn-generar-link" onClick={handleGenerarLink} disabled={procesando}>
              <LucideIcon name="link" size={16} /> Regenerar Link de Documentos
            </button>
          </>
        )}

        {estado === 'documentos_recibidos' && (
          <button className="admisiones-accion-btn btn-preconsulta" onClick={() => { setModal('preconsulta'); setModalData({ fecha: '', hora: '' }); }}>
            <LucideIcon name="calendar" size={16} /> Programar Preconsulta
          </button>
        )}

        {estado === 'preconsulta_programada' && (
          <button className="admisiones-accion-btn btn-completar" onClick={() => { setModal('completar_preconsulta'); setModalData({ notas: '' }); }}>
            <LucideIcon name="clipboard-check" size={16} /> Completar Preconsulta
          </button>
        )}

        {estado === 'preconsulta_completada' && (
          <>
            <button className="admisiones-accion-btn btn-admitir" onClick={() => { setModal('admitir'); setModalData({ notas: '', fecha_nacimiento: '' }); }}>
              <LucideIcon name="user-plus" size={16} /> Admitir Usuario
            </button>
            <button className="admisiones-accion-btn btn-rechazar" onClick={() => { setModal('rechazar'); setModalData({ notas: '' }); }}>
              <LucideIcon name="x" size={16} /> Rechazar
            </button>
          </>
        )}
      </div>
    );
  };

  const renderReportes = () => {
    if (!reporte) {
      const sem = reporteSemestre || getSemestreActual();
      cargarReporte(sem);
      if (!reporteSemestre) setReporteSemestre(sem);
    }

    return (
      <div className="admisiones-reportes">
        <div className="reportes-actions">
          <div className="reportes-selector">
            <label>Semestre:</label>
            <select
              value={reporteSemestre}
              onChange={e => { setReporteSemestre(e.target.value); setReporte(null); cargarReporte(e.target.value); }}
            >
              {generarOpcionesSemestre().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {reporte && (
            <button className="btn-descargar-pdf" onClick={descargarPDF} disabled={generandoPDF}>
              {generandoPDF ? (
                <><div className="admisiones-spinner-sm" /> Generando...</>
              ) : (
                <><LucideIcon name="download" size={18} /> Descargar PDF</>
              )}
            </button>
          )}
        </div>

        {!reporte ? (
          <div className="admisiones-loading"><div className="admisiones-spinner" /><p>Cargando reporte...</p></div>
        ) : (
          <div ref={reporteRef}>
            {/* Métricas principales */}
            <div className="reportes-metricas">
              <div className="reporte-metrica-card">
                <span className="valor">{reporte.total_solicitudes}</span>
                <span className="label">Total Solicitudes</span>
              </div>
              <div className="reporte-metrica-card">
                <span className="valor">{reporte.total_preconsultas}</span>
                <span className="label">Preconsultas Programadas</span>
              </div>
              <div className="reporte-metrica-card">
                <span className="valor">{reporte.preconsultas_asistidas || 0}</span>
                <span className="label">Preconsultas Asistidas</span>
              </div>
              <div className="reporte-metrica-card" style={{ borderColor: '#4CAF50' }}>
                <span className="valor" style={{ color: '#4CAF50' }}>${(reporte.ingresos_preconsultas || 0).toLocaleString('es-MX')}</span>
                <span className="label">Ingresos Preconsultas</span>
                <span className="sublabel" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>${reporte.costo_preconsulta || 500} x preconsulta asistida</span>
              </div>
              <div className="reporte-metrica-card">
                <span className="valor">{reporte.total_admitidos}</span>
                <span className="label">Admitidos</span>
              </div>
              <div className="reporte-metrica-card">
                <span className="valor">{reporte.tasa_admision}%</span>
                <span className="label">Tasa de Admisión</span>
              </div>
            </div>

            {/* Gráficas */}
            <div className="reportes-charts">
              <div className="reporte-chart-card">
                <h3>Por Sexo</h3>
                {reporte.por_sexo?.length > 0 ? (
                  <Doughnut
                    data={{
                      labels: reporte.por_sexo.map(s => s.sexo === 'masculino' ? 'Masculino' : s.sexo === 'femenino' ? 'Femenino' : 'Otro'),
                      datasets: [{
                        data: reporte.por_sexo.map(s => s.total),
                        backgroundColor: ['#58a6ff', '#f778ba', '#8b949e'],
                        borderWidth: 0
                      }]
                    }}
                    options={{ plugins: { legend: { position: 'bottom', labels: { color: '#8B949E' } } } }}
                  />
                ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin datos</p>}
              </div>

              <div className="reporte-chart-card">
                <h3>Por Grupo de Edad</h3>
                {reporte.por_edad?.length > 0 ? (
                  <Bar
                    data={{
                      labels: reporte.por_edad.map(e => e.grupo_edad),
                      datasets: [{
                        label: 'Solicitudes',
                        data: reporte.por_edad.map(e => e.total),
                        backgroundColor: '#0097A7',
                        borderRadius: 4
                      }]
                    }}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: '#8B949E' }, grid: { display: false } },
                        y: { ticks: { color: '#8B949E', stepSize: 1 }, grid: { color: 'rgba(48,54,61,0.5)' } }
                      }
                    }}
                  />
                ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin datos</p>}
              </div>
            </div>

            {/* Tabla de procedencia */}
            {reporte.por_procedencia?.length > 0 && (
              <div className="admisiones-info-card">
                <h3><LucideIcon name="map-pin" size={18} /> Procedencia</h3>
                <table className="procedencia-tabla">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Ciudad</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.por_procedencia.map((p, i) => (
                      <tr key={i}>
                        <td>{p.estado_procedencia}</td>
                        <td>{p.ciudad}</td>
                        <td className="procedencia-count">{p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDocsOficiales = () => {
    if (docsOficiales.length === 0 && subVista === 'docs_oficiales') {
      cargarDocsOficiales();
    }

    const TIPOS_DOC = [
      { tipo: 'reglamento', label: 'Reglamento' },
      { tipo: 'aviso_privacidad', label: 'Aviso de Privacidad' },
      { tipo: 'consentimiento', label: 'Consentimiento Informado' }
    ];

    return (
      <div>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Gestiona los documentos oficiales que se muestran a los solicitantes durante el proceso de admisión.
        </p>
        <div className="docs-oficiales-grid">
          {TIPOS_DOC.map(td => {
            const doc = docsOficiales.find(d => d.tipo === td.tipo);
            return (
              <div key={td.tipo} className="doc-oficial-card">
                <div className="doc-oficial-left">
                  <div className="doc-oficial-icon">
                    <LucideIcon name="file-text" size={22} />
                  </div>
                  <div className="doc-oficial-meta">
                    <h4>{td.label}</h4>
                    {doc ? (
                      <p>{doc.nombre_original} (v{doc.version})</p>
                    ) : (
                      <p>Sin documento cargado</p>
                    )}
                  </div>
                </div>
                <div className="doc-oficial-actions">
                  <button
                    className="doc-oficial-upload-btn"
                    onClick={() => fileInputRef.current[td.tipo]?.click()}
                  >
                    {doc ? 'Actualizar' : 'Subir PDF'}
                  </button>
                  {doc && (
                    <button
                      className="doc-oficial-delete-btn"
                      onClick={() => handleDeleteDocOficial(doc.id)}
                    >
                      <LucideIcon name="trash-2" size={16} />
                    </button>
                  )}
                  <input
                    ref={el => fileInputRef.current[td.tipo] = el}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => {
                      handleUploadDocOficial(td.tipo, e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =====================================================
  // MODALES
  // =====================================================

  const renderModal = () => {
    if (!modal) return null;

    return (
      <div className="admisiones-modal-overlay" onClick={() => setModal(null)}>
        <div className="admisiones-modal" onClick={e => e.stopPropagation()}>
          {modal === 'screening' && (
            <>
              <h3>{modalData.aprobado ? 'Aprobar Screening' : 'Rechazar Screening'}</h3>
              <div className="admisiones-modal-group">
                <label>Notas</label>
                <textarea
                  value={modalData.notas}
                  onChange={e => setModalData({ ...modalData, notas: e.target.value })}
                  placeholder="Observaciones del screening..."
                />
              </div>
              <div className="admisiones-modal-actions">
                <button className="admisiones-modal-btn modal-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button
                  className={`admisiones-modal-btn ${modalData.aprobado ? 'modal-btn-success' : 'modal-btn-danger'}`}
                  onClick={() => handleScreening(modalData.aprobado)}
                  disabled={procesando}
                >
                  {procesando ? 'Procesando...' : modalData.aprobado ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </>
          )}

          {modal === 'preconsulta' && (
            <>
              <h3>Programar Preconsulta</h3>
              <div className="admisiones-modal-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={modalData.fecha}
                  onChange={e => setModalData({ ...modalData, fecha: e.target.value })}
                />
              </div>
              <div className="admisiones-modal-group">
                <label>Hora *</label>
                <input
                  type="time"
                  value={modalData.hora}
                  onChange={e => setModalData({ ...modalData, hora: e.target.value })}
                />
              </div>
              <div className="admisiones-modal-actions">
                <button className="admisiones-modal-btn modal-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button
                  className="admisiones-modal-btn modal-btn-confirm"
                  onClick={handleProgramarPreconsulta}
                  disabled={procesando || !modalData.fecha || !modalData.hora}
                >
                  {procesando ? 'Programando...' : 'Programar'}
                </button>
              </div>
            </>
          )}

          {modal === 'completar_preconsulta' && (
            <>
              <h3>Completar Preconsulta</h3>
              <div className="admisiones-modal-group">
                <label>Notas de la preconsulta</label>
                <textarea
                  value={modalData.notas}
                  onChange={e => setModalData({ ...modalData, notas: e.target.value })}
                  placeholder="Observaciones de la preconsulta..."
                />
              </div>
              <div className="admisiones-modal-actions">
                <button className="admisiones-modal-btn modal-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button
                  className="admisiones-modal-btn modal-btn-success"
                  onClick={handleCompletarPreconsulta}
                  disabled={procesando}
                >
                  {procesando ? 'Procesando...' : 'Marcar como Completada'}
                </button>
              </div>
            </>
          )}

          {modal === 'admitir' && (
            <>
              <h3>Admitir Usuario</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Se creará un usuario en el sistema con una contraseña temporal.
              </p>
              <div className="admisiones-modal-group">
                <label>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={modalData.fecha_nacimiento}
                  onChange={e => setModalData({ ...modalData, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="admisiones-modal-group">
                <label>Notas</label>
                <textarea
                  value={modalData.notas}
                  onChange={e => setModalData({ ...modalData, notas: e.target.value })}
                  placeholder="Observaciones de la admisión..."
                />
              </div>
              <div className="admisiones-modal-actions">
                <button className="admisiones-modal-btn modal-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button
                  className="admisiones-modal-btn modal-btn-success"
                  onClick={handleAdmitir}
                  disabled={procesando}
                >
                  {procesando ? 'Procesando...' : 'Confirmar Admisión'}
                </button>
              </div>
            </>
          )}

          {modal === 'rechazar' && (
            <>
              <h3>Rechazar Solicitud</h3>
              <div className="admisiones-modal-group">
                <label>Motivo del rechazo</label>
                <textarea
                  value={modalData.notas}
                  onChange={e => setModalData({ ...modalData, notas: e.target.value })}
                  placeholder="Razón del rechazo..."
                />
              </div>
              <div className="admisiones-modal-actions">
                <button className="admisiones-modal-btn modal-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button
                  className="admisiones-modal-btn modal-btn-danger"
                  onClick={handleRechazar}
                  disabled={procesando}
                >
                  {procesando ? 'Procesando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="admisiones-tab">
      {/* Sub-navegación */}
      <div className="admisiones-subnav">
        {[
          { id: 'pipeline', label: 'Pipeline', icon: 'git-branch' },
          { id: 'reportes', label: 'Reportes', icon: 'bar-chart-2' },
          { id: 'docs_oficiales', label: 'Docs. Oficiales', icon: 'file-text' }
        ].map(item => (
          <button
            key={item.id}
            className={`admisiones-subnav-btn ${subVista === item.id || (subVista === 'detalle' && item.id === 'pipeline') ? 'active' : ''}`}
            onClick={() => {
              setSubVista(item.id);
              setDetalle(null);
              setLinkGenerado(null);
              setResultadoAdmision(null);
              if (item.id === 'reportes' && !reporte) {
                const sem = reporteSemestre || getSemestreActual();
                setReporteSemestre(sem);
                cargarReporte(sem);
              }
              if (item.id === 'docs_oficiales') cargarDocsOficiales();
            }}
          >
            <LucideIcon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {subVista === 'pipeline' && renderPipeline()}
      {subVista === 'detalle' && renderDetalle()}
      {subVista === 'reportes' && renderReportes()}
      {subVista === 'docs_oficiales' && renderDocsOficiales()}

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default AdmisionesTab;
