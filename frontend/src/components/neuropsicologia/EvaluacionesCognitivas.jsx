import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import LucideIcon from '../LucideIcon';
import api from '../../services/api';
import './NeuropsicologiaEsp.css';

// Campos base predefinidos (columnas en la tabla)
const FUNCIONES_COGNITIVAS = [
  { key: 'atencion_visual', label: 'Atención Visual', grupo: 'Atención' },
  { key: 'atencion_auditiva', label: 'Atención Auditiva', grupo: 'Atención' },
  { key: 'memoria_visual', label: 'Memoria Visual', grupo: 'Memoria' },
  { key: 'memoria_auditiva', label: 'Memoria Auditiva', grupo: 'Memoria' },
  { key: 'memoria_trabajo', label: 'Memoria de Trabajo', grupo: 'Memoria' },
  { key: 'funciones_ejecutivas', label: 'Funciones Ejecutivas', grupo: 'Ejecutivas' },
  { key: 'velocidad_procesamiento', label: 'Velocidad de Procesamiento', grupo: 'Ejecutivas' },
  { key: 'orientacion', label: 'Orientación', grupo: 'General' },
  { key: 'lenguaje', label: 'Lenguaje', grupo: 'Comunicación' },
  { key: 'razonamiento', label: 'Razonamiento', grupo: 'Ejecutivas' },
  { key: 'flexibilidad_cognitiva', label: 'Flexibilidad Cognitiva', grupo: 'Ejecutivas' },
  { key: 'planificacion', label: 'Planificación', grupo: 'Ejecutivas' },
  { key: 'control_inhibitorio', label: 'Control Inhibitorio', grupo: 'Ejecutivas' },
  { key: 'praxias', label: 'Praxias', grupo: 'Motor' },
  { key: 'gnosias', label: 'Gnosias', grupo: 'Percepción' },
  { key: 'calculo', label: 'Cálculo', grupo: 'Comunicación' },
  { key: 'comprension_verbal', label: 'Comprensión Verbal', grupo: 'Comunicación' },
  { key: 'habilidades_visuoespaciales', label: 'Habilidades Visuoespaciales', grupo: 'Percepción' },
];

const CUESTIONARIOS_INFO = {
  'AAQ2': { nombre: 'AAQ-II', completo: 'Cuestionario de Aceptación y Acción', icon: 'clipboard', color: '#5C6BC0' },
  'AAQ-2': { nombre: 'AAQ-II', completo: 'Cuestionario de Aceptación y Acción', icon: 'clipboard', color: '#5C6BC0' },
  'AADQ': { nombre: 'AADQ', completo: 'Aceptación y Acción en Diabetes', icon: 'activity', color: '#26A69A' },
  'CANCER_AAQ': { nombre: 'Cancer AAQ', completo: 'AAQ para Usuarios Oncológicos', icon: 'heart-pulse', color: '#EF5350' },
  'VLQ': { nombre: 'VLQ', completo: 'Cuestionario de Valores en la Vida', icon: 'compass', color: '#AB47BC' },
};

const TIPOS_PREGUNTA = [
  { value: 'escala', label: 'Escala (0-10)' },
  { value: 'opcion_multiple', label: 'Opción Múltiple' },
  { value: 'si_no', label: 'Sí / No' },
  { value: 'texto', label: 'Texto Libre' },
];

const getNivel = (val) => {
  if (val === null || val === undefined || val === '') return { label: '-', color: '#6E7681', clase: '' };
  const n = parseFloat(val);
  if (n <= 3) return { label: 'Oportunidad', color: '#F44336', clase: 'nivel-bajo' };
  if (n <= 6) return { label: 'Promedio', color: '#F9A825', clase: 'nivel-medio' };
  return { label: 'Fortaleza', color: '#4CAF50', clase: 'nivel-alto' };
};

const getNivelConfig = (nivel) => {
  if (!nivel) return { color: '#6E7681', bg: '#6E768122' };
  const l = nivel.toLowerCase();
  if (l.includes('normal') || l.includes('bajo') || l.includes('alta') || l.includes('mínima')) return { color: '#4CAF50', bg: '#4CAF5022' };
  if (l.includes('elevad') || l.includes('moderad')) return { color: '#F9A825', bg: '#F9A82522' };
  if (l.includes('clínic') || l.includes('sever') || l.includes('baja')) return { color: '#F44336', bg: '#F4433622' };
  return { color: '#9C27B0', bg: '#9C27B022' };
};

const getCamposEvaluacion = (evalData) => {
  const campos = [];
  FUNCIONES_COGNITIVAS.forEach(f => {
    if (evalData[f.key] !== null && evalData[f.key] !== undefined) {
      campos.push({ nombre: f.label, valor: parseFloat(evalData[f.key]) });
    }
  });
  if (evalData.campos_personalizados) {
    try {
      const custom = typeof evalData.campos_personalizados === 'string'
        ? JSON.parse(evalData.campos_personalizados) : evalData.campos_personalizados;
      if (Array.isArray(custom)) {
        custom.forEach(c => {
          if (c.nombre && c.valor !== null && c.valor !== undefined) {
            campos.push({ nombre: c.nombre, valor: parseFloat(c.valor) });
          }
        });
      }
    } catch (e) { /* ignore */ }
  }
  return campos;
};

const EvaluacionesCognitivas = ({ pacienteId, onBack }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cuestionariosACT, setCuestionariosACT] = useState([]);
  const [cuestionariosPersonalizados, setCuestionariosPersonalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('lista');
  const [submitting, setSubmitting] = useState(false);
  const [detalleEval, setDetalleEval] = useState(null);
  const [seccion, setSeccion] = useState('evaluaciones');

  // Evaluación dinámica
  const [evalCampos, setEvalCampos] = useState([]);
  const [evalFecha, setEvalFecha] = useState(new Date().toISOString().split('T')[0]);
  const [evalNotas, setEvalNotas] = useState('');

  // Crear cuestionario
  const [showCrear, setShowCrear] = useState(false);
  const [cuestForm, setCuestForm] = useState({ titulo: '', descripcion: '', tipo: 'personalizado' });
  const [cuestPreguntas, setCuestPreguntas] = useState([]);
  const [cuestArchivo, setCuestArchivo] = useState(null);
  const [cuestSubmitting, setCuestSubmitting] = useState(false);

  // Ver respuestas
  const [verRespuestas, setVerRespuestas] = useState(null);
  const [respuestas, setRespuestas] = useState([]);

  // PDF extraction
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // === EXTRACCIÓN DE TEXTO DE PDF ===
  const extraerTextoPDF = async (file) => {
    // Carga dinámica de pdf.js para no inflar el bundle principal
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Unir items considerando posición espacial para evitar "T r i s t e z a"
      let pageText = '';
      let lastX = -1;
      let lastWidth = 0;
      let lastY = -1;
      for (const item of content.items) {
        if (!item.str) continue;
        const x = item.transform[4];
        const y = item.transform[5];
        const fontSize = item.transform[0] || 12;
        if (lastY !== -1 && Math.abs(y - lastY) > fontSize * 0.5) {
          // Cambio de línea
          pageText += '\n';
        } else if (lastX !== -1) {
          const gap = x - (lastX + lastWidth);
          // Solo agregar espacio si hay un gap significativo entre items
          if (gap > fontSize * 0.3) {
            pageText += ' ';
          }
        }
        pageText += item.str;
        lastX = x;
        lastWidth = item.width || (item.str.length * fontSize * 0.5);
        lastY = y;
      }
      fullText += pageText + '\n';
    }

    // Detectar y corregir texto con caracteres espaciados ("T r i s t e z a" → "Tristeza")
    // Heurística: si muchas palabras de 1 carácter separadas por espacios
    const lines = fullText.split('\n');
    const spacedCharPattern = /(?:^|\s)(\S\s){3,}/; // 3+ chars individuales seguidos
    let spacedLineCount = 0;
    for (const line of lines.slice(0, 20)) {
      if (spacedCharPattern.test(line)) spacedLineCount++;
    }
    // Si >30% de las líneas tienen texto espaciado, corregir todo el documento
    if (spacedLineCount > lines.filter(l => l.trim()).length * 0.3) {
      fullText = fullText.replace(/(\S)\s(?=\S(?:\s\S)*(?:\s{2,}|$|\n))/g, '$1');
      // Limpiar espacios múltiples residuales
      fullText = fullText.replace(/  +/g, ' ');
    }

    return fullText;
  };

  const parsearPreguntasPDF = (texto) => {
    const preguntas = [];

    // Estrategia 1: Parsear por líneas (formato donde cada opción está en su propia línea)
    const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let preguntaActual = null;
    let opcionesActuales = [];

    const guardarPregunta = () => {
      if (preguntaActual && opcionesActuales.length >= 2) {
        preguntas.push({
          texto: preguntaActual,
          tipo: 'opcion_multiple',
          opciones: opcionesActuales.map(o => o.texto)
        });
      }
      opcionesActuales = [];
    };

    // Regex para título de pregunta: "N." o "N " seguido de texto (ej: "1. Tristeza", "20. Cansancio o Fatiga")
    const tituloRegex = /^(\d{1,2})\s*[.)\-]\s*(.+)/;
    // Regex para opción: empieza con 0-3 seguido de espacio/)/. y texto
    const opcionRegex = /^([0-3])\s*[.):]?\s*(.+)/;

    for (const linea of lineas) {
      const tituloMatch = linea.match(tituloRegex);
      const opcionMatch = linea.match(opcionRegex);

      // Verificar si es título de pregunta (número >= 1 y texto no parece opción)
      if (tituloMatch) {
        const num = parseInt(tituloMatch[1]);
        const textoTitulo = tituloMatch[2].trim();
        // Es título si: número > 3, o si el texto es corto (nombre de categoría como "Tristeza")
        // y no empieza como una oración larga típica de opción
        const esCorto = textoTitulo.split(' ').length <= 8;
        const esTitulo = num > 3 || (num >= 1 && esCorto && !/^(No |Me |He |Estoy |Soy |Tengo |Puedo |Siento |Duermo |Como )/i.test(textoTitulo));

        if (esTitulo) {
          guardarPregunta();
          preguntaActual = `${num}. ${textoTitulo}`;
          continue;
        }
      }

      // Verificar si es una opción (0-3 + texto)
      if (opcionMatch && preguntaActual) {
        const valor = parseInt(opcionMatch[1]);
        const textoOp = opcionMatch[2].trim().replace(/\.\s*$/, '');
        if (textoOp.length > 2) {
          opcionesActuales.push({
            valor,
            texto: `${valor}) ${textoOp}`
          });
        }
        continue;
      }

      // Si la línea no matchea nada y hay una opción previa, puede ser continuación
      if (opcionesActuales.length > 0 && linea.length > 3 && !/^\d/.test(linea)) {
        const ultima = opcionesActuales[opcionesActuales.length - 1];
        ultima.texto = ultima.texto + ' ' + linea.replace(/\.\s*$/, '');
      }
    }
    guardarPregunta(); // Guardar la última pregunta

    // Si encontramos preguntas con el parser por líneas, retornar
    if (preguntas.length >= 3) return preguntas;

    // Estrategia 2: Texto corrido (todo en una línea) - fallback
    preguntas.length = 0;
    let t = texto.replace(/\s+/g, ' ').trim();

    // Buscar bloques: "N. Título 0 opción 1 opción 2 opción 3 opción"
    // Patrón flexible que busca número + título antes de "0 "
    const bloqueRegex = /(?:^|\s)(\d{1,2})\s*[.)\-]\s*([A-ZÁÉÍÓÚÑÜ][^0-9]{2,60}?)(?=\s*0\s)/g;
    const bloques = [];
    let match;
    while ((match = bloqueRegex.exec(t)) !== null) {
      bloques.push({
        num: parseInt(match[1]),
        titulo: match[2].trim().replace(/\s+/g, ' '),
        startIndex: match.index,
        titleEnd: match.index + match[0].length
      });
    }

    for (let i = 0; i < bloques.length; i++) {
      const bloque = bloques[i];
      const nextStart = i + 1 < bloques.length ? bloques[i + 1].startIndex : t.length;
      const contenido = t.substring(bloque.titleEnd, nextStart).trim();

      // Extraer opciones 0-3 del contenido
      const opciones = [];
      const opRegex = /([0-3])\s*[.):]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ][\s\S]*?)(?=(?:\s[0-3]\s*[.):]?\s*[A-ZÁÉÍÓÚÑa-záéíóúñ])|$)/g;
      let opMatch;
      while ((opMatch = opRegex.exec(contenido)) !== null) {
        const textoOp = opMatch[2].trim().replace(/\.\s*$/, '');
        if (textoOp.length > 2) {
          opciones.push(`${opMatch[1]}) ${textoOp}`);
        }
      }

      if (opciones.length >= 2) {
        preguntas.push({
          texto: `${bloque.num}. ${bloque.titulo}`,
          tipo: 'opcion_multiple',
          opciones
        });
      }
    }

    return preguntas;
  };

  const handleExtraerPDF = async () => {
    if (!cuestArchivo) return;

    const ext = cuestArchivo.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      setPdfError('Solo se pueden extraer preguntas de archivos PDF');
      return;
    }

    setPdfExtracting(true);
    setPdfError('');

    try {
      const texto = await extraerTextoPDF(cuestArchivo);
      if (!texto || texto.trim().length < 20) {
        setPdfError('No se pudo extraer texto del PDF. Puede ser un PDF escaneado (imagen).');
        return;
      }

      const preguntasExtraidas = parsearPreguntasPDF(texto);

      if (preguntasExtraidas.length === 0) {
        setPdfError('No se detectaron preguntas con formato reconocible. Puedes agregarlas manualmente.');
        return;
      }

      setCuestPreguntas(preguntasExtraidas);

      // Intentar extraer título del PDF si no hay uno
      if (!cuestForm.titulo.trim()) {
        // Buscar título en las primeras líneas
        const lineas = texto.split(/\n/).filter(l => l.trim().length > 5);
        for (const linea of lineas.slice(0, 5)) {
          const clean = linea.trim();
          if (clean.length > 10 && clean.length < 100 && /inventario|cuestionario|escala|test|evaluaci/i.test(clean)) {
            // Limpiar el título
            const titulo = clean.replace(/\s+/g, ' ').trim();
            setCuestForm(p => ({ ...p, titulo: titulo }));
            break;
          }
        }
      }

      // Detectar tipo basado en contenido
      const textoLower = texto.toLowerCase();
      if (/depresi[oó]n|beck|bdi/i.test(textoLower)) {
        setCuestForm(p => ({ ...p, tipo: 'depresion' }));
      } else if (/ansiedad|anxiety|bai|stai/i.test(textoLower)) {
        setCuestForm(p => ({ ...p, tipo: 'ansiedad' }));
      } else if (/cognitiv|moca|mmse|minimental/i.test(textoLower)) {
        setCuestForm(p => ({ ...p, tipo: 'cognitivo' }));
      }

    } catch (err) {
      console.error('Error extrayendo PDF:', err);
      setPdfError('Error al procesar el PDF. Verifica que no esté protegido o dañado.');
    } finally {
      setPdfExtracting(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [evalRes, cuestRes, persRes] = await Promise.all([
        api.get(`/neuropsicologia/evaluacion/historial/${pacienteId}`).catch(() => null),
        api.get(`/neuropsicologia/cuestionarios/historial/${pacienteId}`).catch(() => null),
        api.get('/neuropsicologia/cuestionarios-personalizados').catch(() => null),
      ]);
      setEvaluaciones(Array.isArray(evalRes?.data ?? evalRes) ? (evalRes?.data ?? evalRes) : []);
      setCuestionariosACT(Array.isArray(cuestRes?.data ?? cuestRes) ? (cuestRes?.data ?? cuestRes) : []);
      setCuestionariosPersonalizados(Array.isArray(persRes?.data ?? persRes) ? (persRes?.data ?? persRes) : []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // === EVALUACIONES ===
  const nuevaEvaluacion = () => {
    setEvalCampos(FUNCIONES_COGNITIVAS.map(f => ({ nombre: f.label, key: f.key, valor: '' })));
    setEvalFecha(new Date().toISOString().split('T')[0]);
    setEvalNotas('');
    setVista('form-eval');
  };

  const handleCampoChange = (index, field, value) => {
    setEvalCampos(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };

  const handleSubmitEval = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { paciente_id: pacienteId, especialista_id: user?.especialista_id || user?.id, fecha: evalFecha, notas: evalNotas || null };
      const camposP = [];
      evalCampos.forEach(campo => {
        if (campo.valor === '' || campo.valor === null) return;
        const val = parseFloat(campo.valor);
        if (isNaN(val)) return;
        const dbField = FUNCIONES_COGNITIVAS.find(f => f.key === campo.key || f.label === campo.nombre);
        if (dbField) payload[dbField.key] = val;
        else camposP.push({ nombre: campo.nombre, valor: val });
      });
      if (camposP.length > 0) payload.campos_personalizados = JSON.stringify(camposP);
      await api.post('/neuropsicologia/evaluacion', payload);
      await cargarDatos();
      setVista('lista');
    } catch (error) {
      alert('Error al guardar la evaluación');
    } finally { setSubmitting(false); }
  };

  const getResumen = (eval_) => {
    const campos = getCamposEvaluacion(eval_);
    let f = 0, p = 0, o = 0;
    campos.forEach(c => { if (c.valor <= 3) o++; else if (c.valor <= 6) p++; else f++; });
    return { fortalezas: f, promedio: p, oportunidades: o };
  };

  // === CUESTIONARIOS PERSONALIZADOS ===
  const handleAgregarPregunta = () => {
    setCuestPreguntas(prev => [...prev, { texto: '', tipo: 'escala', opciones: ['', ''] }]);
  };

  const handlePreguntaChange = (idx, field, value) => {
    setCuestPreguntas(prev => { const u = [...prev]; u[idx] = { ...u[idx], [field]: value }; return u; });
  };

  const handleOpcionChange = (pIdx, oIdx, value) => {
    setCuestPreguntas(prev => {
      const u = [...prev];
      const opts = [...(u[pIdx].opciones || [])];
      opts[oIdx] = value;
      u[pIdx] = { ...u[pIdx], opciones: opts };
      return u;
    });
  };

  const handleAgregarOpcion = (pIdx) => {
    setCuestPreguntas(prev => {
      const u = [...prev];
      u[pIdx] = { ...u[pIdx], opciones: [...(u[pIdx].opciones || []), ''] };
      return u;
    });
  };

  const handleEliminarPregunta = (idx) => {
    setCuestPreguntas(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCrearCuestionario = async (e) => {
    e.preventDefault();
    if (!cuestForm.titulo.trim()) { alert('El título es obligatorio'); return; }
    if (cuestPreguntas.length === 0) { alert('Agrega al menos una pregunta'); return; }

    const preguntasValidas = cuestPreguntas.filter(p => p.texto.trim());
    if (preguntasValidas.length === 0) { alert('Las preguntas deben tener texto'); return; }

    setCuestSubmitting(true);
    try {
      if (cuestArchivo) {
        const formData = new FormData();
        formData.append('titulo', cuestForm.titulo);
        formData.append('descripcion', cuestForm.descripcion);
        formData.append('tipo', cuestForm.tipo);
        formData.append('preguntas', JSON.stringify(preguntasValidas));
        formData.append('archivo', cuestArchivo);
        await api.post('/neuropsicologia/cuestionarios-personalizados', formData, { headers: { 'Content-Type': undefined } });
      } else {
        await api.post('/neuropsicologia/cuestionarios-personalizados', {
          titulo: cuestForm.titulo, descripcion: cuestForm.descripcion,
          tipo: cuestForm.tipo, preguntas: preguntasValidas
        });
      }
      setCuestForm({ titulo: '', descripcion: '', tipo: 'personalizado' });
      setCuestPreguntas([]);
      setCuestArchivo(null);
      setShowCrear(false);
      await cargarDatos();
    } catch (error) {
      alert('Error al crear el cuestionario');
    } finally { setCuestSubmitting(false); }
  };

  const handleEliminarCuestionario = async (id) => {
    if (!window.confirm('¿Eliminar este cuestionario y todas sus respuestas?')) return;
    try { await api.delete(`/neuropsicologia/cuestionarios-personalizados/${id}`); await cargarDatos(); } catch (e) {}
  };

  const handleVerRespuestas = async (cuest) => {
    try {
      const res = await api.get(`/neuropsicologia/cuestionarios-personalizados/${cuest.id}/respuestas`);
      const raw = res?.data ?? res;
      setRespuestas(Array.isArray(raw) ? raw : []);
      setVerRespuestas(cuest);
      setVista('ver-respuestas');
    } catch (e) { console.error(e); }
  };

  // Agrupar cuestionarios ACT
  const agruparCuestionariosACT = () => {
    const g = {};
    cuestionariosACT.forEach(c => { const t = c.tipo_cuestionario || 'Otro'; if (!g[t]) g[t] = []; g[t].push(c); });
    return g;
  };

  const getFileIcon = (n) => {
    if (!n) return 'file';
    const ext = n.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'file-text';
    if (['doc', 'docx'].includes(ext)) return 'file-type';
    return 'file';
  };

  // === VISTA: VER RESPUESTAS DE UN CUESTIONARIO ===
  if (vista === 'ver-respuestas' && verRespuestas) {
    const preguntas = verRespuestas.preguntas || [];
    return (
      <div className="neuro-esp-module">
        <div className="neuro-esp-header">
          <button className="neuro-back-btn" onClick={() => { setVista('lista'); setVerRespuestas(null); }}>
            <LucideIcon name="arrow-left" size={18} /> Volver
          </button>
          <h2><LucideIcon name="bar-chart-2" size={22} /> Respuestas: {verRespuestas.titulo}</h2>
        </div>

        {respuestas.length === 0 ? (
          <div className="neuro-empty">
            <LucideIcon name="inbox" size={40} />
            <p>Nadie ha respondido este cuestionario aún</p>
          </div>
        ) : (
          <div className="neuro-respuestas-lista">
            {respuestas.map((resp, idx) => (
              <div key={resp.id || idx} className="neuro-respuesta-card">
                <div className="neuro-respuesta-header">
                  <span className="neuro-respuesta-nombre">
                    <LucideIcon name="user" size={16} /> {resp.paciente_nombre || 'Usuario'}
                  </span>
                  <span className="neuro-respuesta-fecha">
                    {new Date(resp.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {resp.puntaje_total !== null && (
                    <span className="neuro-badge morado">{resp.puntaje_total} pts</span>
                  )}
                </div>
                <div className="neuro-respuesta-detalle">
                  {preguntas.map((preg, pIdx) => {
                    const respVal = resp.respuestas?.[pIdx];
                    return (
                      <div key={pIdx} className="neuro-respuesta-item">
                        <span className="neuro-respuesta-pregunta">{pIdx + 1}. {preg.texto}</span>
                        <span className="neuro-respuesta-valor">
                          {respVal !== undefined && respVal !== null ? String(respVal) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === VISTA: CREAR CUESTIONARIO ===
  if (vista === 'crear-cuestionario') {
    return (
      <div className="neuro-esp-module">
        <div className="neuro-esp-header">
          <button className="neuro-back-btn" onClick={() => setVista('lista')}>
            <LucideIcon name="arrow-left" size={18} /> Volver
          </button>
          <h2><LucideIcon name="plus-circle" size={22} /> Nuevo Cuestionario</h2>
        </div>

        <form onSubmit={handleCrearCuestionario} className="neuro-eval-form">
          <div className="neuro-form-field">
            <label>Título *</label>
            <input type="text" value={cuestForm.titulo} onChange={e => setCuestForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: Inventario de Depresión de Beck" required />
          </div>
          <div className="neuro-form-field">
            <label>Descripción</label>
            <textarea value={cuestForm.descripcion} onChange={e => setCuestForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Instrucciones para el usuario..." rows={3} />
          </div>
          <div className="neuro-form-field">
            <label>Tipo</label>
            <select value={cuestForm.tipo} onChange={e => setCuestForm(p => ({ ...p, tipo: e.target.value }))} className="neuro-select">
              <option value="personalizado">Personalizado</option>
              <option value="cognitivo">Cognitivo</option>
              <option value="emocional">Emocional</option>
              <option value="conductual">Conductual</option>
              <option value="ansiedad">Ansiedad</option>
              <option value="depresion">Depresión</option>
            </select>
          </div>

          <div className="neuro-form-field">
            <label>Archivo de referencia (opcional)</label>
            <div className="neuro-file-upload">
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => { setCuestArchivo(e.target.files[0] || null); setPdfError(''); }} id="cuest-file" />
              <label htmlFor="cuest-file" className="neuro-file-label">
                <LucideIcon name="upload" size={18} />
                {cuestArchivo ? cuestArchivo.name : 'Adjuntar PDF o documento...'}
              </label>
            </div>
            {cuestArchivo && cuestArchivo.name.toLowerCase().endsWith('.pdf') && (
              <button
                type="button"
                className="neuro-btn-extract-pdf"
                onClick={handleExtraerPDF}
                disabled={pdfExtracting}
              >
                <LucideIcon name={pdfExtracting ? 'loader' : 'file-search'} size={16} />
                {pdfExtracting ? 'Extrayendo preguntas...' : 'Extraer preguntas del PDF'}
              </button>
            )}
            {pdfError && <span className="neuro-pdf-error"><LucideIcon name="alert-circle" size={14} /> {pdfError}</span>}
          </div>

          {/* Constructor de preguntas */}
          <div className="neuro-preguntas-builder">
            <h3 className="neuro-cuest-titulo"><LucideIcon name="list" size={18} /> Preguntas</h3>
            {cuestPreguntas.length > 0 && cuestArchivo && (
              <div className="neuro-pdf-success-banner">
                <LucideIcon name="check-circle" size={16} />
                {cuestPreguntas.length} preguntas extraídas del PDF. Puedes editarlas antes de crear el cuestionario.
              </div>
            )}

            {cuestPreguntas.map((preg, idx) => (
              <div key={idx} className="neuro-pregunta-card">
                <div className="neuro-pregunta-header">
                  <span className="neuro-pregunta-num">{idx + 1}</span>
                  <select value={preg.tipo} onChange={e => handlePreguntaChange(idx, 'tipo', e.target.value)} className="neuro-pregunta-tipo-select">
                    {TIPOS_PREGUNTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button type="button" className="neuro-btn-remove-campo" onClick={() => handleEliminarPregunta(idx)}>
                    <LucideIcon name="trash-2" size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  className="neuro-pregunta-texto"
                  value={preg.texto}
                  onChange={e => handlePreguntaChange(idx, 'texto', e.target.value)}
                  placeholder="Escribe la pregunta..."
                />

                {preg.tipo === 'opcion_multiple' && (
                  <div className="neuro-pregunta-opciones">
                    {(preg.opciones || []).map((op, oIdx) => (
                      <div key={oIdx} className="neuro-opcion-row">
                        <span className="neuro-opcion-letter">{String.fromCharCode(65 + oIdx)}</span>
                        <input
                          type="text"
                          value={op}
                          onChange={e => handleOpcionChange(idx, oIdx, e.target.value)}
                          placeholder={`Opción ${oIdx + 1}`}
                          className="neuro-opcion-input"
                        />
                        {(preg.opciones || []).length > 2 && (
                          <button type="button" className="neuro-opcion-remove" onClick={() => {
                            setCuestPreguntas(prev => {
                              const u = [...prev];
                              u[idx] = { ...u[idx], opciones: u[idx].opciones.filter((_, i) => i !== oIdx) };
                              return u;
                            });
                          }}>×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="neuro-btn-add-opcion" onClick={() => handleAgregarOpcion(idx)}>
                      <LucideIcon name="plus" size={14} /> Agregar opción
                    </button>
                  </div>
                )}

                {preg.tipo === 'escala' && (
                  <div className="neuro-pregunta-preview-escala">
                    <span>0</span>
                    <div className="neuro-escala-track"></div>
                    <span>10</span>
                  </div>
                )}

                {preg.tipo === 'si_no' && (
                  <div className="neuro-pregunta-preview-sino">
                    <span className="neuro-sino-option">Sí</span>
                    <span className="neuro-sino-option">No</span>
                  </div>
                )}
              </div>
            ))}

            <button type="button" className="neuro-btn-agregar-campo" onClick={handleAgregarPregunta}>
              <LucideIcon name="plus" size={16} /> Agregar pregunta
            </button>
          </div>

          <div className="neuro-form-actions">
            <button type="button" className="neuro-btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
            <button type="submit" className="neuro-btn-primary" disabled={cuestSubmitting}>
              {cuestSubmitting ? 'Guardando...' : 'Crear Cuestionario'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // === VISTA: FORM EVALUACIÓN ===
  if (vista === 'form-eval') {
    return (
      <div className="neuro-esp-module">
        <div className="neuro-esp-header">
          <button className="neuro-back-btn" onClick={() => setVista('lista')}>
            <LucideIcon name="arrow-left" size={18} /> Volver
          </button>
          <h2><LucideIcon name="plus-circle" size={22} /> Nueva Evaluación</h2>
        </div>
        <form onSubmit={handleSubmitEval} className="neuro-eval-form">
          <div className="neuro-form-field">
            <label>Fecha de evaluación</label>
            <input type="date" value={evalFecha} onChange={e => setEvalFecha(e.target.value)} required />
          </div>
          <div className="neuro-semaforo-legend">
            <span className="legend-item"><span className="dot rojo"></span> Oportunidad</span>
            <span className="legend-item"><span className="dot amarillo"></span> Promedio</span>
            <span className="legend-item"><span className="dot verde"></span> Fortaleza</span>
          </div>
          <div className="neuro-campos-dinamicos">
            {evalCampos.map((campo, index) => {
              const nivel = getNivel(campo.valor);
              return (
                <div key={index} className={`neuro-campo-row ${nivel.clase}`}>
                  <input type="text" className="neuro-campo-nombre" value={campo.nombre} onChange={e => handleCampoChange(index, 'nombre', e.target.value)} placeholder="Nombre del campo" />
                  <div className="neuro-campo-valor-wrapper">
                    <input type="number" className="neuro-campo-valor" min="0" max="10" step="0.5" value={campo.valor} onChange={e => handleCampoChange(index, 'valor', e.target.value)} placeholder="0-10" />
                    {campo.valor !== '' && <span className="neuro-nivel-dot" style={{ background: nivel.color }}></span>}
                  </div>
                  <button type="button" className="neuro-btn-remove-campo" onClick={() => setEvalCampos(prev => prev.filter((_, i) => i !== index))}>
                    <LucideIcon name="trash-2" size={16} />
                  </button>
                </div>
              );
            })}
            <button type="button" className="neuro-btn-agregar-campo" onClick={() => setEvalCampos(prev => [...prev, { nombre: '', key: null, valor: '' }])}>
              <LucideIcon name="plus" size={16} /> Agregar campo
            </button>
          </div>
          <div className="neuro-form-field">
            <label>Notas / Observaciones</label>
            <textarea value={evalNotas} onChange={e => setEvalNotas(e.target.value)} placeholder="Observaciones de la evaluación..." rows={4} />
          </div>
          <div className="neuro-form-actions">
            <button type="button" className="neuro-btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
            <button type="submit" className="neuro-btn-primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar Evaluación'}</button>
          </div>
        </form>
      </div>
    );
  }

  // === VISTA: DETALLE EVALUACIÓN ===
  if (vista === 'detalle' && detalleEval) {
    const resumen = getResumen(detalleEval);
    const campos = getCamposEvaluacion(detalleEval);
    return (
      <div className="neuro-esp-module">
        <div className="neuro-esp-header">
          <button className="neuro-back-btn" onClick={() => setVista('lista')}><LucideIcon name="arrow-left" size={18} /> Volver</button>
          <h2><LucideIcon name="bar-chart" size={22} /> Detalle de Evaluación</h2>
        </div>
        <div className="neuro-detalle-info">
          <span><LucideIcon name="calendar" size={16} /> {new Date(detalleEval.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {detalleEval.especialista_nombre && <span><LucideIcon name="user" size={16} /> {detalleEval.especialista_nombre}</span>}
        </div>
        {detalleEval.notas && <div className="neuro-detalle-notas"><LucideIcon name="file-text" size={16} /> {detalleEval.notas}</div>}
        <div className="neuro-resumen-cards">
          <div className="neuro-resumen-card verde"><span className="resumen-num">{resumen.fortalezas}</span><span className="resumen-label">Fortalezas</span></div>
          <div className="neuro-resumen-card amarillo"><span className="resumen-num">{resumen.promedio}</span><span className="resumen-label">Promedio</span></div>
          <div className="neuro-resumen-card rojo"><span className="resumen-num">{resumen.oportunidades}</span><span className="resumen-label">Oportunidades</span></div>
        </div>
        <div className="neuro-barras-container">
          {campos.map((campo, idx) => {
            const nivel = getNivel(campo.valor);
            return (
              <div key={idx} className="neuro-barra-item">
                <span className="neuro-barra-label">{campo.nombre}</span>
                <div className="neuro-barra-track"><div className="neuro-barra-fill" style={{ width: `${(campo.valor / 10) * 100}%`, background: nivel.color }}></div></div>
                <span className="neuro-barra-valor" style={{ color: nivel.color }}>{campo.valor}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === VISTA LISTA PRINCIPAL ===
  const gruposACT = agruparCuestionariosACT();

  return (
    <div className="neuro-esp-module">
      <div className="neuro-esp-header">
        <button className="neuro-back-btn" onClick={onBack}><LucideIcon name="arrow-left" size={18} /> Cambiar usuario</button>
        <h2><LucideIcon name="brain" size={22} /> Evaluaciones Neuropsicológicas</h2>
      </div>

      <div className="neuro-seccion-tabs">
        <button className={`neuro-seccion-tab ${seccion === 'evaluaciones' ? 'active' : ''}`} onClick={() => setSeccion('evaluaciones')}>
          <LucideIcon name="target" size={16} /> Evaluaciones
        </button>
        <button className={`neuro-seccion-tab ${seccion === 'cuestionarios' ? 'active' : ''}`} onClick={() => setSeccion('cuestionarios')}>
          <LucideIcon name="clipboard-list" size={16} /> Cuestionarios
        </button>
      </div>

      {loading ? (
        <div className="neuro-loading"><div className="loading-spinner"></div><p>Cargando...</p></div>
      ) : seccion === 'evaluaciones' ? (
        <>
          <div className="neuro-esp-actions">
            <button className="neuro-btn-primary" onClick={nuevaEvaluacion}><LucideIcon name="plus" size={18} /> Nueva Evaluación</button>
          </div>
          {evaluaciones.length === 0 ? (
            <div className="neuro-empty"><LucideIcon name="clipboard" size={40} /><p>No hay evaluaciones registradas</p></div>
          ) : (
            <div className="neuro-eval-list">
              {evaluaciones.map((ev, idx) => {
                const res = getResumen(ev);
                return (
                  <button key={ev.id || idx} className="neuro-eval-card" onClick={() => { setDetalleEval(ev); setVista('detalle'); }}>
                    <div className="neuro-eval-card-top">
                      <span className="neuro-eval-fecha"><LucideIcon name="calendar" size={14} /> {new Date(ev.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {ev.especialista_nombre && <span className="neuro-eval-evaluador"><LucideIcon name="user" size={14} /> {ev.especialista_nombre}</span>}
                    </div>
                    <div className="neuro-eval-badges">
                      {res.fortalezas > 0 && <span className="neuro-badge verde">{res.fortalezas} Fortalezas</span>}
                      {res.promedio > 0 && <span className="neuro-badge amarillo">{res.promedio} Promedio</span>}
                      {res.oportunidades > 0 && <span className="neuro-badge rojo">{res.oportunidades} Oportunidades</span>}
                    </div>
                    <span className="neuro-eval-arrow"><LucideIcon name="chevron-right" size={18} /></span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Cuestionarios ACT realizados */}
          <div className="neuro-cuest-seccion">
            <h3 className="neuro-cuest-titulo"><LucideIcon name="check-circle" size={18} /> Cuestionarios Realizados</h3>
            {cuestionariosACT.length === 0 ? (
              <div className="neuro-empty" style={{ padding: '24px 16px' }}><LucideIcon name="clipboard-list" size={32} /><p>El usuario no ha completado cuestionarios</p></div>
            ) : (
              <>
                <div className="neuro-resumen-cards" style={{ marginBottom: 16 }}>
                  <div className="neuro-resumen-card morado"><span className="resumen-num">{cuestionariosACT.length}</span><span className="resumen-label">Completados</span></div>
                  <div className="neuro-resumen-card azul"><span className="resumen-num">{Object.keys(gruposACT).length}</span><span className="resumen-label">Tipos</span></div>
                </div>
                {Object.entries(gruposACT).map(([tipo, items]) => {
                  const info = CUESTIONARIOS_INFO[tipo] || { nombre: tipo, completo: tipo, icon: 'clipboard', color: '#9C27B0' };
                  return (
                    <div key={tipo} className="neuro-cuestionario-grupo">
                      <div className="neuro-cuestionario-grupo-header" style={{ borderLeftColor: info.color }}>
                        <LucideIcon name={info.icon} size={20} />
                        <div><h3>{info.nombre}</h3><span className="neuro-cuestionario-completo">{info.completo}</span></div>
                        <span className="neuro-cuestionario-count">{items.length}</span>
                      </div>
                      <div className="neuro-cuestionario-items">
                        {items.map((item, i) => {
                          const nc = getNivelConfig(item.interpretacion);
                          return (
                            <div key={item.id || i} className="neuro-cuestionario-item">
                              <div className="neuro-cuestionario-score"><span className="score-num" style={{ color: nc.color }}>{item.puntuacion_total ?? '-'}</span><span className="score-label">pts</span></div>
                              <div className="neuro-cuestionario-info">
                                {item.interpretacion && <span className="neuro-nivel-badge" style={{ background: nc.bg, color: nc.color }}>{item.interpretacion}</span>}
                                <span className="neuro-cuestionario-fecha">{item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Mis cuestionarios personalizados */}
          <div className="neuro-cuest-seccion" style={{ marginTop: 24 }}>
            <div className="neuro-cuest-header-row">
              <h3 className="neuro-cuest-titulo"><LucideIcon name="folder-open" size={18} /> Mis Cuestionarios</h3>
              <button className="neuro-btn-primary" style={{ fontSize: '0.88rem', padding: '8px 16px' }} onClick={() => { setCuestPreguntas([]); setCuestForm({ titulo: '', descripcion: '', tipo: 'personalizado' }); setCuestArchivo(null); setVista('crear-cuestionario'); }}>
                <LucideIcon name="plus" size={16} /> Crear Nuevo
              </button>
            </div>

            {cuestionariosPersonalizados.length === 0 ? (
              <div className="neuro-empty" style={{ padding: '24px 16px' }}><LucideIcon name="folder-open" size={32} /><p>No tienes cuestionarios creados</p><p className="neuro-empty-sub">Crea cuestionarios interactivos que los usuarios podrán contestar.</p></div>
            ) : (
              <div className="neuro-cuest-lista">
                {cuestionariosPersonalizados.map(cuest => (
                  <div key={cuest.id} className="neuro-cuest-card">
                    <div className="neuro-cuest-card-icon"><LucideIcon name={cuest.preguntas?.length ? 'list-checks' : getFileIcon(cuest.archivo_nombre)} size={24} /></div>
                    <div className="neuro-cuest-card-info">
                      <span className="neuro-cuest-card-titulo">{cuest.titulo}</span>
                      {cuest.descripcion && <span className="neuro-cuest-card-desc">{cuest.descripcion}</span>}
                      <div className="neuro-cuest-card-meta">
                        <span className="neuro-cuest-tipo-badge">{cuest.tipo}</span>
                        <span className="neuro-cuest-archivo-name"><LucideIcon name="help-circle" size={12} /> {cuest.preguntas?.length || 0} preguntas</span>
                        <span className="neuro-cuest-archivo-name"><LucideIcon name="users" size={12} /> {cuest.total_respuestas || 0} respuestas</span>
                      </div>
                    </div>
                    <div className="neuro-cuest-card-actions">
                      {cuest.total_respuestas > 0 && (
                        <button className="neuro-cuest-action-btn ver" onClick={() => handleVerRespuestas(cuest)} title="Ver respuestas">
                          <LucideIcon name="bar-chart-2" size={16} />
                        </button>
                      )}
                      {cuest.archivo_url && (
                        <a href={cuest.archivo_url} target="_blank" rel="noopener noreferrer" className="neuro-cuest-action-btn ver" title="Ver archivo">
                          <LucideIcon name="eye" size={16} />
                        </a>
                      )}
                      <button className="neuro-cuest-action-btn eliminar" onClick={() => handleEliminarCuestionario(cuest.id)} title="Eliminar">
                        <LucideIcon name="trash-2" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EvaluacionesCognitivas;
