import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccessibilityPanel, { AccessibilityFAB } from '../components/accessibility/AccessibilityPanel';
import api from '../services/api';
import LucideIcon from '../components/LucideIcon';
import MapaFasesOrtesis from '../components/ortesis/MapaFasesOrtesis';
import '../styles/Ortesis.css';

const MODULO_NOMBRE = 'Órtesis y prótesis';

const TIPOS_ORTESIS_SIMULADOS = {
  soportes_plantillas: [
    {
      id: 'ortesis-plantillas',
      categoria: 'soportes_plantillas',
      grupo_dispositivo: 'ortesis',
      nombre: 'Plantillas ortopédicas',
      descripcion: 'Dispositivos personalizados o prefabricados que se colocan dentro del calzado para mejorar apoyo, alineación y distribución de carga.',
      componentes: ['Base termoformada o modular', 'Apoyos de arco', 'Descargas por presión', 'Forro de contacto'],
      ventajas: ['Ayudan a mejorar la postura del pie', 'Reducen puntos de presión', 'Pueden usarse con calzado cotidiano'],
      cuidados_especificos: ['Ventila las plantillas cada día', 'Limpia con paño húmedo y jabón neutro', 'Revisa desgaste o deformación']
    }
  ],
  soporte_tronco: [
    {
      id: 'ortesis-faja-lumbar',
      categoria: 'soporte_tronco',
      grupo_dispositivo: 'ortesis',
      nombre: 'Fajas lumbares',
      descripcion: 'Órtesis de soporte para la zona lumbar que ayudan a limitar movimientos dolorosos y dar estabilidad durante actividades indicadas.',
      componentes: ['Banda elástica o semirrígida', 'Varillas posteriores', 'Sistema de ajuste con velcro', 'Panel abdominal'],
      ventajas: ['Aporta soporte durante la recuperación', 'Facilita control postural', 'Permite ajuste gradual de compresión'],
      cuidados_especificos: ['No la uses más tiempo del indicado', 'Lava según indicación del fabricante', 'Evita doblar las varillas']
    }
  ]
};

const TIPOS_PROTESIS_SIMULADOS = {
  transtibial: [
    {
      id: 'protesis-transtibial',
      categoria: 'transtibial',
      grupo_dispositivo: 'protesis',
      nombre: 'Prótesis transtibiales',
      descripcion: 'Prótesis para amputación por debajo de la rodilla. Conservan la articulación de rodilla y suelen permitir una marcha eficiente con entrenamiento.',
      componentes: ['Socket de contacto', 'Liner o interfaz', 'Sistema de suspensión', 'Tubo adaptador', 'Pie protésico'],
      nivel_k_minimo: 'K1',
      ventajas: ['Conserva la rodilla natural', 'Facilita una marcha más estable', 'Tiene múltiples opciones de pie protésico'],
      desventajas: ['Requiere ajuste preciso del socket', 'El volumen del muñón puede cambiar durante el día'],
      cuidados_especificos: ['Limpia socket y liner diariamente', 'Revisa piel y puntos de presión', 'Reporta cambios de ajuste']
    }
  ],
  transfemoral: [
    {
      id: 'protesis-transfemoral',
      categoria: 'transfemoral',
      grupo_dispositivo: 'protesis',
      nombre: 'Prótesis transfemorales',
      descripcion: 'Prótesis para amputación por encima de la rodilla. Integran una rodilla protésica y requieren entrenamiento específico para control y seguridad.',
      componentes: ['Socket transfemoral', 'Rodilla protésica', 'Adaptadores', 'Pie protésico', 'Sistema de suspensión'],
      nivel_k_minimo: 'K2',
      ventajas: ['Permite movilidad independiente', 'Puede adaptarse a distintos niveles funcionales', 'Hay opciones mecánicas y electrónicas'],
      desventajas: ['Mayor demanda energética', 'Curva de aprendizaje más amplia'],
      cuidados_especificos: ['Revisa alineación y estabilidad', 'Da mantenimiento a la rodilla según fabricante', 'Consulta ante ruidos o bloqueos']
    }
  ]
};

const CONTENIDO_EDUCATIVO_FALLBACK = {
  niveles_k: [
    {
      nivel: 'K0',
      nombre: 'No ambulatorio',
      descripcion: 'Sin capacidad o potencial actual para caminar de forma segura con una prótesis funcional.',
      caracteristicas: ['Uso principal de silla de ruedas', 'Enfoque en transferencias seguras'],
      actividades_permitidas: ['Transferencias asistidas', 'Terapia ocupacional adaptada'],
      tipo_protesis_recomendada: ['Prótesis cosmética opcional', 'Evaluación funcional periódica']
    },
    {
      nivel: 'K1',
      nombre: 'Ambulador de interiores',
      descripcion: 'Capacidad para caminar en superficies planas a ritmo fijo, principalmente en interiores.',
      caracteristicas: ['Marcha lenta y controlada', 'Uso posible de bastón o andadera'],
      actividades_permitidas: ['Caminar en casa', 'Actividades básicas de la vida diaria'],
      tipo_protesis_recomendada: ['Pie SACH', 'Socket de contacto total']
    },
    {
      nivel: 'K2',
      nombre: 'Ambulador comunitario limitado',
      descripcion: 'Puede superar barreras ambientales bajas como escalones, rampas o superficies irregulares simples.',
      caracteristicas: ['Caminatas cortas en comunidad', 'Velocidad variable limitada'],
      actividades_permitidas: ['Compras breves', 'Subir y bajar escaleras con apoyo'],
      tipo_protesis_recomendada: ['Pie multiaxial', 'Suspensión con pin o vacío']
    },
    {
      nivel: 'K3',
      nombre: 'Ambulador comunitario ilimitado',
      descripcion: 'Camina con cadencia variable y participa en actividades comunitarias, laborales o recreativas.',
      caracteristicas: ['Mayor tolerancia a distancias', 'Buena adaptación a terrenos variados'],
      actividades_permitidas: ['Caminatas largas', 'Ejercicio recreativo', 'Trabajo activo'],
      tipo_protesis_recomendada: ['Pie de respuesta dinámica', 'Componentes de mayor desempeño']
    },
    {
      nivel: 'K4',
      nombre: 'Alta actividad',
      descripcion: 'Demanda funcional superior a la marcha básica, como deporte, impacto o actividad física intensa.',
      caracteristicas: ['Alta energía', 'Actividades de impacto o velocidad'],
      actividades_permitidas: ['Correr', 'Deportes', 'Trabajo físicamente demandante'],
      tipo_protesis_recomendada: ['Pie deportivo', 'Componentes de alto rendimiento']
    }
  ],
  tipos_ortesis: TIPOS_ORTESIS_SIMULADOS,
  tipos_protesis: TIPOS_PROTESIS_SIMULADOS,
  guias_cuidado: {
    cuidado_munon: [
      {
        id: 'guia-cuidado-munon',
        grupo_dispositivo: 'protesis',
        titulo: 'Cuidado del muñón',
        contenido: 'El cuidado diario del muñón ayuda a prevenir irritaciones y mantiene una buena tolerancia al socket.',
        pasos: ['Lava la piel con jabón neutro', 'Seca completamente antes de colocar el liner', 'Revisa enrojecimiento o heridas cada día'],
        tips: ['Usa un espejo para revisar zonas difíciles', 'Reporta dolor persistente'],
        advertencias: ['No uses la prótesis si hay heridas abiertas']
      }
    ],
    limpieza_protesis: [
      {
        id: 'guia-limpieza-dispositivo',
        grupo_dispositivo: 'protesis',
        titulo: 'Limpieza de la prótesis',
        contenido: 'La limpieza diaria ayuda a prevenir irritaciones y conserva el funcionamiento de la prótesis.',
        pasos: ['Retira el dispositivo si aplica', 'Limpia con paño húmedo y jabón neutro', 'Seca completamente antes de guardar o usar'],
        tips: ['Evita productos perfumados', 'Revisa desgaste mientras limpias'],
        advertencias: ['No uses calor directo', 'No sumerjas componentes no lavables']
      }
    ],
    colocacion: [
      {
        id: 'guia-colocacion-protesis',
        grupo_dispositivo: 'protesis',
        titulo: 'Colocación segura de la prótesis',
        contenido: 'Una colocación correcta mejora la estabilidad y reduce puntos de presión durante la marcha.',
        pasos: ['Verifica que el liner esté limpio y seco', 'Alinea el socket sin pliegues', 'Comprueba suspensión y apoyo antes de caminar'],
        tips: ['Haz la primera caminata del día con apoyo cercano'],
        advertencias: ['Detente si sientes presión intensa o inestabilidad']
      }
    ],
    mantenimiento: [
      {
        id: 'guia-revision',
        grupo_dispositivo: 'protesis',
        titulo: 'Revisión periódica',
        contenido: 'Una revisión breve permite detectar desgaste, cambios de ajuste o piezas flojas en la prótesis.',
        pasos: ['Observa correas, velcros y uniones', 'Verifica comodidad y estabilidad', 'Reporta cambios a tu especialista'],
        tips: ['Toma fotos si notas cambios', 'Lleva registro de molestias'],
        advertencias: ['No ajustes piezas técnicas sin indicación']
      }
    ],
    limpieza_ortesis: [
      {
        id: 'guia-limpieza-ortesis',
        grupo_dispositivo: 'ortesis',
        titulo: 'Limpieza de la órtesis',
        contenido: 'La órtesis debe mantenerse limpia y seca para evitar irritación y conservar su soporte.',
        pasos: ['Retírala según la indicación del especialista', 'Limpia superficies con paño húmedo y jabón neutro', 'Deja secar completamente antes de usarla'],
        tips: ['Revisa correas y velcros al limpiarla'],
        advertencias: ['No uses calor directo para secarla']
      }
    ],
    uso_ortesis: [
      {
        id: 'guia-uso-ortesis',
        grupo_dispositivo: 'ortesis',
        titulo: 'Uso gradual de la órtesis',
        contenido: 'El tiempo de uso debe aumentar de forma progresiva para que la piel y la postura se adapten.',
        pasos: ['Sigue el horario indicado', 'Revisa la piel después de cada uso', 'Ajusta correas sin bloquear la circulación'],
        tips: ['Marca molestias por zona para explicarlas en consulta'],
        advertencias: ['Suspende el uso si aparece dolor fuerte o adormecimiento']
      }
    ],
    mantenimiento_ortesis: [
      {
        id: 'guia-mantenimiento-ortesis',
        grupo_dispositivo: 'ortesis',
        titulo: 'Revisión de soporte y ajuste',
        contenido: 'Las órtesis requieren revisión de puntos de apoyo, correas y piezas de soporte.',
        pasos: ['Observa deformaciones', 'Verifica que no haya bordes filosos', 'Consulta si cambia el ajuste'],
        tips: ['Guarda la órtesis en posición estable'],
        advertencias: ['No modifiques piezas rígidas sin indicación']
      }
    ]
  },
  faqs: [
    {
      id: 'faq-diferencia',
      grupo_dispositivo: 'ortesis',
      pregunta: '¿Cuál es la diferencia entre órtesis y prótesis?',
      respuesta: 'Una órtesis apoya, corrige o protege una parte del cuerpo. Una prótesis reemplaza parcial o totalmente una parte ausente.'
    },
    {
      id: 'faq-ajuste',
      grupo_dispositivo: 'protesis',
      pregunta: '¿Qué hago si mi dispositivo molesta?',
      respuesta: 'Suspende el uso si hay dolor importante, revisa la piel y contacta a tu especialista para valorar ajustes.'
    },
    {
      id: 'faq-nivel-k',
      grupo_dispositivo: 'protesis',
      pregunta: '¿Cómo se relaciona el Nivel K con mi prótesis?',
      respuesta: 'El Nivel K orienta la selección de componentes protésicos según tu movilidad, seguridad y objetivos funcionales.'
    },
    {
      id: 'faq-tiempo-ortesis',
      grupo_dispositivo: 'ortesis',
      pregunta: '¿Cuánto tiempo debo usar mi órtesis?',
      respuesta: 'El tiempo de uso depende del objetivo clínico y debe seguir la indicación de tu especialista.'
    }
  ]
};

const MANUAL_INFORMATIVO_FALLBACK = [
  {
    id: 'manual-ortesis',
    categoria: 'ortesis',
    titulo: '¿Qué es una órtesis y cuáles son sus objetivos?',
    subtitulo: 'Manual Informativo de Órtesis',
    contenido: 'Una órtesis es un dispositivo externo diseñado para apoyar, corregir, proteger o estabilizar una parte del cuerpo.',
    objetivos: ['Estabilizar articulaciones y reducir dolor', 'Corregir deformidades y facilitar movilidad', 'Proteger tejidos durante la recuperación'],
    tipos_comunes: ['Miembro superior', 'Miembro inferior', 'Espinales', 'Dinámicas y estáticas']
  },
  {
    id: 'manual-protesis',
    categoria: 'protesis',
    titulo: '¿Qué es una prótesis y cuáles son sus objetivos?',
    subtitulo: 'Manual Informativo de Prótesis',
    contenido: 'Una prótesis reemplaza parcial o totalmente una parte ausente del cuerpo y busca recuperar función, apoyo y autonomía.',
    objetivos: ['Restituir apoyo o función perdida', 'Mejorar movilidad segura', 'Favorecer independencia diaria'],
    tipos_comunes: ['Transtibiales', 'Transfemorales', 'Parciales de pie', 'Miembro superior']
  }
];

const CALZADO_AUTORIZADO_FALLBACK = [
  {
    id: 'calzado-tenis-ortopedicos',
    tipo_calzado: 'Tenis Ortopédicos',
    descripcion: 'Espacio de adaptación amplio y suela corrida de goma blanda.',
    recomendaciones: 'Usar con calcetín suave y revisar puntos de presión.'
  },
  {
    id: 'calzado-deportivo-ancho',
    tipo_calzado: 'Zapato Deportivo Ancho',
    descripcion: 'Estabiliza la marcha y absorbe impacto en el talón.',
    recomendaciones: 'Evitar calzado estrecho o con costuras internas rígidas.'
  }
];

const VIDEOTUTORIALES_FALLBACK = [
  {
    id: 'video-liner-socket',
    categoria: 'protesis',
    titulo: 'Limpieza del Liner y Socket',
    descripcion: 'Lavar el liner diariamente con agua limpia y jabón neutro. Enjuagar y dejar secar a la sombra.',
    url_video: 'https://www.youtube.com/results?search_query=limpieza+liner+socket+protesis'
  },
  {
    id: 'video-cuidado-munon',
    categoria: 'protesis',
    titulo: '¿Qué hacer ante bultos de presión?',
    descripcion: 'Retira la prótesis por 15 minutos, revisa zonas rojas y reporta si la molestia persiste.',
    url_video: 'https://www.youtube.com/results?search_query=cuidado+munon+protesis'
  },
  {
    id: 'video-uso-ortesis',
    categoria: 'ortesis',
    titulo: 'Colocación segura de la órtesis',
    descripcion: 'Ajuste progresivo, revisión de correas y señales de presión al retirar la órtesis.',
    url_video: 'https://www.youtube.com/results?search_query=colocacion+segura+ortesis'
  }
];

const Ortesis = () => {
  const { user } = useAuth();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [activeTab, setActiveTab] = useState('tipos');
  const [seccionActiva, setSeccionActiva] = useState('protesis');
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para datos
  const [contenidoEducativo, setContenidoEducativo] = useState(CONTENIDO_EDUCATIVO_FALLBACK);
  const [dispositivo, setDispositivo] = useState(null);
  const [problemas, setProblemas] = useState([]);
  const [manualInformativo, setManualInformativo] = useState(MANUAL_INFORMATIVO_FALLBACK);
  const [calzadoAutorizado, setCalzadoAutorizado] = useState(CALZADO_AUTORIZADO_FALLBACK);
  const [videotutoriales, setVideotutoriales] = useState(VIDEOTUTORIALES_FALLBACK);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [enviandoMolestia, setEnviandoMolestia] = useState(false);
  const [grabandoNotaVoz, setGrabandoNotaVoz] = useState(false);

  // Formulario de problema. `severidad` mapea a la columna ENUM('leve','moderado','severo')
  // de la tabla reportes_problemas. `tipo` es solo para UI y se prefija a la descripción.
  const [problemaForm, setProblemaForm] = useState({
    tipo: '',
    descripcion: '',
    severidad: 'moderado'
  });

  const [reporteMolestiasForm, setReporteMolestiasForm] = useState({
    descripcion: '',
    evidencia: null,
    notaVoz: null
  });

  const tiposProblema = [
    { id: 'dolor', nombre: 'Dolor o molestia', icon: 'heart-pulse' },
    { id: 'ajuste', nombre: 'Problema de ajuste', icon: 'wrench' },
    { id: 'piel', nombre: 'Irritación en la piel', icon: 'heart-pulse' },
    { id: 'mecanico', nombre: 'Falla mecánica', icon: 'settings' },
    { id: 'limpieza', nombre: 'Necesita limpieza', icon: 'droplet' },
    { id: 'otro', nombre: 'Otro problema', icon: 'circle-help' }
  ];

  const seccionesDispositivo = {
    protesis: {
      titulo: 'Prótesis',
      bannerTitulo: 'Centro de Información de Prótesis',
      descripcion: 'Contenido exclusivo sobre niveles funcionales, tipos de prótesis, cuidados y problemas frecuentes.'
    },
    ortesis: {
      titulo: 'Órtesis',
      bannerTitulo: 'Centro de Información de Órtesis',
      descripcion: 'Contenido exclusivo sobre tipos de órtesis, uso seguro, cuidado y seguimiento del ajuste.'
    }
  };

  const categoriasGuiasProtesis = {
    'cuidado_munon': { nombre: 'Cuidado del Muñón', icon: 'footprints', color: '#10b981' },
    'limpieza_protesis': { nombre: 'Limpieza', icon: 'droplet', color: '#3b82f6' },
    'colocacion': { nombre: 'Colocación', icon: 'wrench', color: '#8b5cf6' },
    'mantenimiento': { nombre: 'Mantenimiento', icon: 'wrench', color: '#f59e0b' },
    'emergencias': { nombre: 'Alertas', icon: 'alert-triangle', color: '#ef4444' },
    'ejercicios': { nombre: 'Ejercicios', icon: 'zap', color: '#06b6d4' }
  };

  const categoriasGuiasOrtesis = {
    'limpieza_ortesis': { nombre: 'Limpieza de órtesis', icon: 'droplet', color: '#3b82f6' },
    'uso_ortesis': { nombre: 'Uso y ajuste', icon: 'settings', color: '#8b5cf6' },
    'mantenimiento_ortesis': { nombre: 'Mantenimiento', icon: 'wrench', color: '#f59e0b' }
  };

  const categoriasProtesis = {
    'transtibial': { nombre: 'Transtibial', desc: 'Debajo de rodilla', icon: 'accessibility' },
    'transfemoral': { nombre: 'Transfemoral', desc: 'Arriba de rodilla', icon: 'footprints' },
    'desarticulacion_rodilla': { nombre: 'Desart. Rodilla', desc: 'A nivel de rodilla', icon: 'footprints' },
    'parcial_pie': { nombre: 'Pie Parcial', desc: 'Amputación parcial', icon: 'footprints' }
  };

  const categoriasOrtesis = {
    'soportes_plantillas': { nombre: 'Soportes y plantillas', desc: 'Apoyo del pie y descarga', icon: 'footprints' },
    'soporte_tronco': { nombre: 'Soporte de tronco', desc: 'Estabilidad lumbar y postural', icon: 'accessibility' }
  };

  const categoriasDispositivos = {
    ...categoriasOrtesis,
    ...categoriasProtesis
  };

  const seccionActual = seccionesDispositivo[seccionActiva];
  const categoriasGuias = seccionActiva === 'protesis' ? categoriasGuiasProtesis : categoriasGuiasOrtesis;
  const categoriasDispositivosActivas = seccionActiva === 'protesis' ? categoriasProtesis : categoriasOrtesis;
  const tiposDispositivosActivos = seccionActiva === 'protesis'
    ? contenidoEducativo?.tipos_protesis || {}
    : contenidoEducativo?.tipos_ortesis || {};
  const faqsActivas = (contenidoEducativo?.faqs || []).filter((faq) => {
    if (faq.grupo_dispositivo) {
      return faq.grupo_dispositivo === seccionActiva;
    }

    const texto = `${faq.pregunta || ''} ${faq.respuesta || ''}`.toLowerCase();
    const mencionaOrtesis = texto.includes('órtesis') || texto.includes('ortesis');
    const mencionaProtesis = texto.includes('prótesis') || texto.includes('protesis');

    if (seccionActiva === 'ortesis') {
      return mencionaOrtesis && !mencionaProtesis;
    }

    return mencionaProtesis || !mencionaOrtesis;
  });

  const contarGuiasActivas = () => (
    Object.keys(categoriasGuias).reduce((total, key) => (
      total + (contenidoEducativo?.guias_cuidado?.[key]?.length || 0)
    ), 0)
  );

  const manualActivo = manualInformativo.filter((item) => (
    item.categoria === seccionActiva || item.categoria === 'general'
  ));

  const videotutorialesActivos = videotutoriales.filter((video) => video.categoria === seccionActiva);

  const cambiarSeccion = (seccion) => {
    setSeccionActiva(seccion);
    setActiveSubTab(null);
    setSelectedItem(null);
    if (seccion === 'ortesis' && activeTab === 'niveles-k') {
      setActiveTab('inicio');
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar contenido educativo
      const response = await api.get('/protesis/educativo');
      const data = response?.data || response;
      setContenidoEducativo({
        ...CONTENIDO_EDUCATIVO_FALLBACK,
        ...data,
        tipos_ortesis: data?.tipos_ortesis || CONTENIDO_EDUCATIVO_FALLBACK.tipos_ortesis,
        tipos_protesis: data?.tipos_protesis || CONTENIDO_EDUCATIVO_FALLBACK.tipos_protesis,
        guias_cuidado: data?.guias_cuidado || CONTENIDO_EDUCATIVO_FALLBACK.guias_cuidado,
        faqs: data?.faqs || CONTENIDO_EDUCATIVO_FALLBACK.faqs,
        niveles_k: data?.niveles_k || CONTENIDO_EDUCATIVO_FALLBACK.niveles_k
      });

      const [manualRes, videosRes] = await Promise.all([
        api.get('/ortesis/manual-informativo').catch(() => ({ data: MANUAL_INFORMATIVO_FALLBACK })),
        api.get('/ortesis/videotutoriales-cuidados').catch(() => ({ data: VIDEOTUTORIALES_FALLBACK }))
      ]);
      const manualData = manualRes?.data || manualRes || [];
      const videosData = videosRes?.data || videosRes || [];
      setManualInformativo(Array.isArray(manualData) && manualData.length ? manualData : MANUAL_INFORMATIVO_FALLBACK);
      setVideotutoriales(Array.isArray(videosData) && videosData.length ? videosData : VIDEOTUTORIALES_FALLBACK);

      // Cargar dispositivo del paciente
      if (user?.paciente_id) {
        const dispResponse = await api.get(`/ortesis/dispositivo/${user.paciente_id}`);
        const dispData = dispResponse?.data || dispResponse;
        if (dispData) {
          setDispositivo(dispData);
        }

        // Cargar problemas
        const probResponse = await api.get(`/ortesis/problemas/${user.paciente_id}`);
        const probData = probResponse?.data || probResponse;
        setProblemas(Array.isArray(probData) ? probData : []);

        const calzadoResponse = await api.get(`/ortesis/calzado-autorizado/${user.paciente_id}`).catch(() => ({ data: CALZADO_AUTORIZADO_FALLBACK }));
        const calzadoData = calzadoResponse?.data || calzadoResponse || [];
        setCalzadoAutorizado(Array.isArray(calzadoData) && calzadoData.length ? calzadoData : CALZADO_AUTORIZADO_FALLBACK);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setContenidoEducativo(CONTENIDO_EDUCATIVO_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  const handleReportarProblema = async (e) => {
    e.preventDefault();
    try {
      // Prefijamos el tipo a la descripción porque la tabla no tiene columna `tipo`.
      const tipoLabel = tiposProblema.find(t => t.id === problemaForm.tipo)?.nombre || problemaForm.tipo;
      const descFull = tipoLabel
        ? `[${tipoLabel}] ${problemaForm.descripcion}`
        : problemaForm.descripcion;

      await api.post('/ortesis/problemas', {
        paciente_id: user.paciente_id,
        descripcion: descFull,
        severidad: problemaForm.severidad,
      });

      setShowModal(false);
      setProblemaForm({ tipo: '', descripcion: '', severidad: 'moderado' });
      cargarDatos();
    } catch (err) {
      console.error('Error al reportar problema:', err);
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : 'Error desconocido');
      alert('No se pudo enviar el reporte: ' + msg);
    }
  };

  const toggleGrabacionNotaVoz = async () => {
    if (grabandoNotaVoz && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setGrabandoNotaVoz(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert('Tu navegador no permite grabar audio desde esta pantalla.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `nota-voz-${Date.now()}.webm`, { type: 'audio/webm' });
        setReporteMolestiasForm(prev => ({ ...prev, notaVoz: file }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setGrabandoNotaVoz(true);
    } catch (error) {
      console.error('Error grabando nota de voz:', error);
      alert('No se pudo iniciar la grabación de audio.');
    }
  };

  const handleEnviarMolestiaDirecta = async (e) => {
    e.preventDefault();

    if (!user?.paciente_id || !reporteMolestiasForm.descripcion.trim()) {
      alert('Describe la molestia antes de enviar el reporte.');
      return;
    }

    setEnviandoMolestia(true);
    try {
      const formData = new FormData();
      formData.append('paciente_id', user.paciente_id);
      formData.append('descripcion', reporteMolestiasForm.descripcion.trim());
      if (reporteMolestiasForm.evidencia) {
        formData.append('evidencia_foto', reporteMolestiasForm.evidencia);
      }
      if (reporteMolestiasForm.notaVoz) {
        formData.append('nota_voz', reporteMolestiasForm.notaVoz);
      }

      await api.post('/ortesis/reportes-molestias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setReporteMolestiasForm({ descripcion: '', evidencia: null, notaVoz: null });
      alert('Reporte médico urgente enviado a tu especialista.');
    } catch (error) {
      console.error('Error enviando reporte de molestias:', error);
      alert(error?.message || 'No se pudo enviar el reporte médico urgente.');
    } finally {
      setEnviandoMolestia(false);
    }
  };

  const renderManualInformativo = () => (
    <section className="manual-info-card">
      <div className="manual-info-heading">
        <LucideIcon name="book-open" size={22} />
        <h3>Manual Informativo de {seccionActual.titulo}</h3>
      </div>
      <div className="manual-accordion-list">
        {manualActivo.map((item, index) => (
          <details key={item.id || `${item.categoria}-${index}`} className="manual-accordion-item" open={index === 0}>
            <summary>
              <span>{item.titulo}</span>
              <LucideIcon name="chevron-down" size={18} />
            </summary>
            <div className="manual-accordion-content">
              {item.subtitulo && <h4>{item.subtitulo}</h4>}
              <p>{item.contenido}</p>
              {item.objetivos?.length > 0 && (
                <>
                  <strong>Objetivos principales</strong>
                  <ul>
                    {item.objetivos.map((objetivo, idx) => <li key={idx}>{objetivo}</li>)}
                  </ul>
                </>
              )}
              {item.tipos_comunes?.length > 0 && (
                <>
                  <strong>Tipos comunes</strong>
                  <ul>
                    {item.tipos_comunes.map((tipo, idx) => <li key={idx}>{tipo}</li>)}
                  </ul>
                </>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );

  const renderCalzadoAutorizado = () => (
    <section className="calzado-autorizado-card">
      <div className="manual-info-heading">
        <LucideIcon name="footprints" size={22} />
        <h3>Modelos de Calzado Autorizados para tu Plan</h3>
      </div>
      <div className="calzado-grid">
        {calzadoAutorizado.map((item) => (
          <article key={item.id} className="calzado-item">
            <h4>{item.tipo_calzado}</h4>
            {item.descripcion && <p>{item.descripcion}</p>}
            {item.recomendaciones && <span>{item.recomendaciones}</span>}
          </article>
        ))}
      </div>
    </section>
  );

  const renderVideotutorialesCuidados = () => (
    <section className="videotutoriales-card">
      <div className="manual-info-heading">
        <LucideIcon name="clapperboard" size={22} />
        <h3>Manual de Cuidados y Videotutoriales</h3>
      </div>
      <div className="manual-accordion-list">
        {videotutorialesActivos.map((video, index) => (
          <details key={video.id || `${video.titulo}-${index}`} className="manual-accordion-item" open={index === 0}>
            <summary>
              <span>{video.titulo}</span>
              <LucideIcon name="chevron-down" size={18} />
            </summary>
            <div className="manual-accordion-content">
              <p>{video.descripcion}</p>
              <a className="video-link-btn" href={video.url_video} target="_blank" rel="noreferrer">
                <LucideIcon name="play" size={18} /> Ver Video Tutorial
              </a>
            </div>
          </details>
        ))}
      </div>
    </section>
  );

  const renderReporteMolestiasDirectas = () => (
    <form className="molestias-directas-card" onSubmit={handleEnviarMolestiaDirecta}>
      <div className="manual-info-heading">
        <LucideIcon name="alert-triangle" size={22} />
        <h3>Reporte de Molestias Directas</h3>
      </div>
      <p className="molestias-intro">
        Usa este canal prioritario si tienes dolor, inflamación, enrojecimiento, fatiga o si tu dispositivo se dañó.
      </p>
      <textarea
        value={reporteMolestiasForm.descripcion}
        onChange={(e) => setReporteMolestiasForm(prev => ({ ...prev, descripcion: e.target.value }))}
        className="form-control molestias-textarea"
        rows="5"
        placeholder="Describe detalladamente qué molestia sientes, en qué zona te lastima o qué falla presenta el dispositivo..."
        required
      />
      <div className="molestias-actions-grid">
        <div className="molestias-upload-box">
          <strong><LucideIcon name="volume" size={18} /> Nota de voz</strong>
          <button type="button" className="btn btn-outline" onClick={toggleGrabacionNotaVoz}>
            {grabandoNotaVoz ? 'Detener grabación' : 'Grabar audio'}
          </button>
          {reporteMolestiasForm.notaVoz && <span>{reporteMolestiasForm.notaVoz.name}</span>}
        </div>
        <label className="molestias-upload-box">
          <strong><LucideIcon name="camera" size={18} /> Adjuntar evidencia fotográfica</strong>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReporteMolestiasForm(prev => ({ ...prev, evidencia: e.target.files?.[0] || null }))}
          />
          {reporteMolestiasForm.evidencia && <span>{reporteMolestiasForm.evidencia.name}</span>}
        </label>
      </div>
      <button
        type="submit"
        className="btn btn-danger btn-lg molestias-submit"
        disabled={enviandoMolestia || !reporteMolestiasForm.descripcion.trim()}
      >
        {enviandoMolestia ? 'Enviando...' : 'Enviar Reporte Médico Urgente'}
      </button>
    </form>
  );

  // Renderizar contenido según tab activo
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'inicio':
        return renderInicio();
      case 'niveles-k':
        return seccionActiva === 'protesis' ? renderNivelesK() : renderInicio();
      case 'tipos':
        return renderTiposProtesis();
      case 'cuidados':
        return renderGuiasCuidado();
      case 'mi-protesis':
        return renderMiProtesis();
      case 'problemas':
        return renderProblemas();
      case 'faqs':
        return renderFAQs();
      default:
        return renderInicio();
    }
  };

  // =====================================================
  // RENDERIZAR INICIO
  // =====================================================
  const renderInicio = () => (
    <div className="inicio-section">
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>{seccionActual.bannerTitulo}</h2>
          <p>{seccionActual.descripcion}</p>
        </div>
      </div>

      {renderManualInformativo()}

      <div className="quick-actions">
        {seccionActiva === 'protesis' && (
          <div className="action-card" onClick={() => setActiveTab('niveles-k')}>
            <span className="action-icon"><LucideIcon name="bar-chart" size={24} /></span>
            <h3>Niveles K</h3>
            <p>Conoce tu clasificación funcional</p>
          </div>
        )}
        <div className="action-card" onClick={() => setActiveTab('tipos')}>
          <span className="action-icon"><LucideIcon name="accessibility" size={24} /></span>
          <h3>Tipos de {seccionActual.titulo}</h3>
          <p>Explora opciones de {seccionActual.titulo.toLowerCase()}</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('cuidados')}>
          <span className="action-icon"><LucideIcon name="book-open" size={24} /></span>
          <h3>Guías de Cuidado</h3>
          <p>Aprende a cuidar tu {seccionActual.titulo.toLowerCase()}</p>
        </div>
        <div className="action-card" onClick={() => setActiveTab('mi-protesis')}>
          <span className="action-icon"><LucideIcon name="settings" size={24} /></span>
          <h3>Mi dispositivo</h3>
          <p>Información de tu dispositivo activo</p>
        </div>
      </div>

      {/* Nivel K del usuario si existe */}
      {seccionActiva === 'protesis' && dispositivo?.nivel_k && (
        <div className="user-nivel-k-card">
          <div className="nivel-badge">
            <span className="nivel-letra">{dispositivo.nivel_k}</span>
          </div>
          <div className="nivel-info">
            <h3>Tu Nivel Funcional</h3>
            <p className="nivel-nombre">{dispositivo.nivel_k_nombre}</p>
            <p className="nivel-desc">{dispositivo.nivel_k_descripcion}</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('niveles-k')}
          >
            Más información
          </button>
        </div>
      )}

      {/* Resumen de contenido */}
      <div className="content-summary">
        <h3>Contenido Disponible</h3>
        <div className="summary-grid">
          {seccionActiva === 'protesis' && (
            <div className="summary-item">
              <span className="summary-number">{contenidoEducativo?.niveles_k?.length || 5}</span>
              <span className="summary-label">Niveles K</span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-number">
              {Object.values(tiposDispositivosActivos).flat().length || 0}
            </span>
            <span className="summary-label">Tipos de {seccionActual.titulo}</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">
              {contarGuiasActivas()}
            </span>
            <span className="summary-label">Guías de Cuidado</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{faqsActivas.length}</span>
            <span className="summary-label">Preguntas Frecuentes</span>
          </div>
        </div>
      </div>

      {seccionActiva === 'protesis' && renderCalzadoAutorizado()}
    </div>
  );

  // =====================================================
  // RENDERIZAR NIVELES K
  // =====================================================
  const renderNivelesK = () => (
    <div className="niveles-k-section">
      <div className="section-header">
        <h2>Niveles K de Movilidad</h2>
        <p>La clasificación K determina tu potencial funcional y el tipo de dispositivo recomendado</p>
      </div>

      {selectedItem ? (
        <div className="nivel-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a todos los niveles
          </button>

          <div className="nivel-detail-card">
            <div className="nivel-header">
              <div className="nivel-badge large">
                <span>{selectedItem.nivel}</span>
              </div>
              <div>
                <h2>{selectedItem.nombre}</h2>
                <p className="nivel-desc">{selectedItem.descripcion}</p>
              </div>
            </div>

            <div className="nivel-sections">
              <div className="nivel-section">
                <h3>Características</h3>
                <ul>
                  {selectedItem.caracteristicas?.map((car, idx) => (
                    <li key={idx}>{car}</li>
                  ))}
                </ul>
              </div>

              <div className="nivel-section">
                <h3>Actividades Permitidas</h3>
                <ul className="actividades-list">
                  {selectedItem.actividades_permitidas?.map((act, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      {act}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="nivel-section">
                <h3>Dispositivos recomendados</h3>
                <ul className="protesis-recomendadas">
                  {selectedItem.tipo_protesis_recomendada?.map((tipo, idx) => (
                    <li key={idx}>{tipo}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="niveles-grid">
          {contenidoEducativo?.niveles_k?.map((nivel) => (
            <div
              key={nivel.nivel}
              className={`nivel-card ${dispositivo?.nivel_k === nivel.nivel ? 'current' : ''}`}
              onClick={() => setSelectedItem(nivel)}
            >
              {dispositivo?.nivel_k === nivel.nivel && (
                <span className="current-badge">Tu nivel</span>
              )}
              <div className="nivel-badge">
                <span>{nivel.nivel}</span>
              </div>
              <h3>{nivel.nombre}</h3>
              <p>{nivel.descripcion.substring(0, 120)}...</p>
              <div className="nivel-preview">
                <span>{nivel.caracteristicas?.length || 0} características</span>
                <span>{nivel.actividades_permitidas?.length || 0} actividades</span>
              </div>
              <button className="btn btn-outline btn-sm">Ver más</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR TIPOS DE ÓRTESIS Y PRÓTESIS
  // =====================================================
  const renderTiposProtesis = () => (
    <div className="tipos-section">
      <div className="section-header">
        <h2>Tipos de {seccionActual.titulo}</h2>
        <p>
          {seccionActiva === 'protesis'
            ? 'Dispositivos que reemplazan parcial o totalmente una extremidad o segmento corporal.'
            : 'Dispositivos que apoyan, corrigen, protegen o estabilizan una parte del cuerpo.'}
        </p>
      </div>

      {!activeSubTab ? (
        <div className="dispositivos-info-sections">
          <section className={`dispositivo-info-section ${seccionActiva}-info-section`}>
            <div className="device-section-heading">
              <span className="device-section-icon"><LucideIcon name="accessibility" size={22} /></span>
              <div>
                <h3>Información sobre {seccionActual.titulo}</h3>
                <p>{seccionActual.descripcion}</p>
              </div>
            </div>
            <h4>Tipos de {seccionActual.titulo}</h4>
            <div className="categorias-grid">
              {Object.entries(categoriasDispositivosActivas).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  className="categoria-card"
                  onClick={() => setActiveSubTab(key)}
                >
                  <span className="categoria-icon"><LucideIcon name={cat.icon} size={24} /></span>
                  <h3>{cat.nombre}</h3>
                  <p>{cat.desc}</p>
                  <span className="tipos-count">
                    {tiposDispositivosActivos?.[key]?.length || 0} tipos
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : selectedItem ? (
        <div className="tipo-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a {categoriasDispositivos[activeSubTab]?.nombre}
          </button>

          <div className="tipo-detail-card">
            <h2>{selectedItem.nombre}</h2>
            <span className="tipo-categoria">
              {selectedItem.grupo_dispositivo === 'ortesis' ? 'Órtesis' : 'Prótesis'} · {categoriasDispositivos[selectedItem.categoria]?.nombre}
            </span>

            <p className="tipo-descripcion">{selectedItem.descripcion}</p>

            {selectedItem.nivel_k_minimo && (
              <div className="nivel-minimo">
                <span>Nivel K mínimo requerido:</span>
                <span className="nivel-badge small">{selectedItem.nivel_k_minimo}</span>
              </div>
            )}

            <div className="tipo-sections">
              {selectedItem.componentes && (
                <div className="tipo-section">
                  <h3>Componentes</h3>
                  <ul>
                    {selectedItem.componentes.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.ventajas && (
                <div className="tipo-section ventajas">
                  <h3>✓ Ventajas</h3>
                  <ul>
                    {selectedItem.ventajas.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.desventajas && (
                <div className="tipo-section desventajas">
                  <h3>✗ Consideraciones</h3>
                  <ul>
                    {selectedItem.desventajas.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.cuidados_especificos && (
                <div className="tipo-section cuidados">
                  <h3>Cuidados Específicos</h3>
                  <ul>
                    {selectedItem.cuidados_especificos.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="tipos-list">
          <button className="btn-back" onClick={() => setActiveSubTab(null)}>
            ← Volver a categorías
          </button>

          <h3><LucideIcon name={categoriasDispositivos[activeSubTab]?.icon} size={20} /> {categoriasDispositivos[activeSubTab]?.nombre}</h3>

          <div className="tipos-grid">
            {(tiposDispositivosActivos?.[activeSubTab] || []).map((tipo) => (
              <div
                key={tipo.id}
                className="tipo-card"
                onClick={() => setSelectedItem(tipo)}
              >
                <h4>{tipo.nombre}</h4>
                <p>{tipo.descripcion.substring(0, 100)}...</p>
                {tipo.nivel_k_minimo && (
                  <span className="nivel-badge mini">{tipo.nivel_k_minimo}+</span>
                )}
                <button className="btn btn-outline btn-sm">Ver detalles</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR GUÍAS DE CUIDADO
  // =====================================================
  const renderGuiasCuidado = () => (
    <div className="guias-section">
      <div className="section-header">
        <h2>Guías de Cuidado de {seccionActual.titulo}</h2>
        <p>Instrucciones detalladas para el cuidado de tu {seccionActual.titulo.toLowerCase()}</p>
      </div>

      {!activeSubTab ? (
        <>
          <div className="categorias-guias-grid">
            {Object.entries(categoriasGuias).map(([key, cat]) => (
              <div
                key={key}
                className="categoria-guia-card"
                style={{ '--cat-color': cat.color }}
                onClick={() => setActiveSubTab(key)}
              >
                <span className="categoria-icon"><LucideIcon name={cat.icon} size={24} /></span>
                <h3>{cat.nombre}</h3>
                <span className="guias-count">
                  {contenidoEducativo?.guias_cuidado?.[key]?.length || 0} guías
                </span>
              </div>
            ))}
          </div>
          {renderVideotutorialesCuidados()}
        </>
      ) : selectedItem ? (
        <div className="guia-detail">
          <button className="btn-back" onClick={() => setSelectedItem(null)}>
            ← Volver a {categoriasGuias[activeSubTab]?.nombre}
          </button>

          <div className="guia-detail-card">
            <div className="guia-header" style={{ '--cat-color': categoriasGuias[activeSubTab]?.color }}>
              <span className="guia-icon"><LucideIcon name={categoriasGuias[activeSubTab]?.icon} size={24} /></span>
              <h2>{selectedItem.titulo}</h2>
            </div>

            <p className="guia-intro">{selectedItem.contenido}</p>

            {selectedItem.pasos && (
              <div className="guia-section">
                <h3>Pasos a seguir</h3>
                <ol className="pasos-list">
                  {selectedItem.pasos.map((paso, idx) => (
                    <li key={idx}>{paso}</li>
                  ))}
                </ol>
              </div>
            )}

            {selectedItem.tips && (
              <div className="guia-section tips">
                <h3><LucideIcon name="lightbulb" size={20} /> Consejos</h3>
                <ul>
                  {selectedItem.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.advertencias && (
              <div className="guia-section advertencias">
                <h3><LucideIcon name="alert-triangle" size={20} /> Advertencias</h3>
                <ul>
                  {selectedItem.advertencias.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="guias-list">
          <button className="btn-back" onClick={() => setActiveSubTab(null)}>
            ← Volver a categorías
          </button>

          <h3><LucideIcon name={categoriasGuias[activeSubTab]?.icon} size={20} /> {categoriasGuias[activeSubTab]?.nombre}</h3>

          <div className="guias-grid">
            {contenidoEducativo?.guias_cuidado?.[activeSubTab]?.map((guia) => (
              <div
                key={guia.id}
                className="guia-card"
                onClick={() => setSelectedItem(guia)}
              >
                <h4>{guia.titulo}</h4>
                <p>{guia.contenido.substring(0, 80)}...</p>
                <div className="guia-meta">
                  <span>{guia.pasos?.length || 0} pasos</span>
                </div>
                <button className="btn btn-outline btn-sm">Leer guía</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR MI DISPOSITIVO
  // =====================================================
  const renderMiProtesis = () => (
    <div className="mi-protesis-section">
      <div className="section-header">
        <h2>Mi dispositivo</h2>
        <p>Información sobre tu {seccionActual.titulo.toLowerCase()} actual</p>
      </div>

      {dispositivo?.tiene_dispositivo ? (
        <div className="dispositivo-info">
          <div className="dispositivo-card main">
            <div className="dispositivo-header">
              <h3>{dispositivo.tipo || 'Dispositivo'}</h3>
              {dispositivo.nivel_k && (
                <span className="nivel-badge">{dispositivo.nivel_k}</span>
              )}
            </div>

            <div className="info-grid">
              {dispositivo.modelo && (
                <div className="info-item">
                  <span className="info-label">Modelo</span>
                  <span className="info-value">{dispositivo.modelo}</span>
                </div>
              )}
              {dispositivo.fecha_entrega && (
                <div className="info-item">
                  <span className="info-label">Fecha de entrega</span>
                  <span className="info-value">
                    {new Date(dispositivo.fecha_entrega).toLocaleDateString()}
                  </span>
                </div>
              )}
              {dispositivo.ultimo_mantenimiento && (
                <div className="info-item">
                  <span className="info-label">Último mantenimiento</span>
                  <span className="info-value">
                    {new Date(dispositivo.ultimo_mantenimiento).toLocaleDateString()}
                  </span>
                </div>
              )}
              {dispositivo.proximo_mantenimiento && (
                <div className="info-item destacado">
                  <span className="info-label">Próximo mantenimiento</span>
                  <span className="info-value">
                    {new Date(dispositivo.proximo_mantenimiento).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {dispositivo.notas && (
              <div className="notas-especialista">
                <h4>Notas del especialista</h4>
                <p>{dispositivo.notas}</p>
              </div>
            )}
          </div>

          <div className="acciones-dispositivo">
            <button
              className="btn btn-primary"
              onClick={() => {
                setModalType('problema');
                setShowModal(true);
              }}
            >
              Reportar Problema
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('cuidados')}>
              Ver Guías de Cuidado
            </button>
          </div>
        </div>
      ) : (
        <div className="no-dispositivo">
          <div className="empty-icon"><LucideIcon name="accessibility" size={32} /></div>
          <h3>Sin dispositivo registrado</h3>
          <p>Tu especialista registrará la información de tu {seccionActual.titulo.toLowerCase()} cuando sea asignada.</p>
          <button className="btn btn-outline" onClick={() => setActiveTab('tipos')}>
            Explorar tipos de {seccionActual.titulo.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR PROBLEMAS
  // =====================================================
  const renderProblemas = () => (
    <div className="problemas-section">
      <div className="section-header">
        <h2>Problemas Reportados</h2>
        <p>Historial de problemas de {seccionActual.titulo.toLowerCase()} y su estado</p>
      </div>

      {renderReporteMolestiasDirectas()}

      <button
        className="btn btn-primary btn-lg"
        onClick={() => {
          setModalType('problema');
          setShowModal(true);
        }}
      >
        + Reportar Nuevo Problema
      </button>

      {problemas.length > 0 ? (
        <div className="problemas-list">
          {problemas.map(problema => (
            <div key={problema.id} className={`problema-card urgencia-${problema.urgencia}`}>
              <div className="problema-header">
                <span className="problema-tipo">
                  <LucideIcon name={tiposProblema.find(t => t.id === problema.tipo)?.icon || 'circle-help'} size={16} />{' '}
                  {tiposProblema.find(t => t.id === problema.tipo)?.nombre || problema.tipo}
                </span>
                <span className={`urgencia-badge ${problema.urgencia}`}>
                  {problema.urgencia}
                </span>
              </div>
              <p className="problema-descripcion">{problema.descripcion}</p>
              <div className="problema-footer">
                <span className="problema-fecha">
                  {new Date(problema.created_at).toLocaleDateString()}
                </span>
                <span className={`problema-estado ${problema.estado || 'pendiente'}`}>
                  {problema.estado || 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-problemas">
          <p>No hay problemas reportados</p>
          <p className="text-muted">¡Excelente! Tu dispositivo está funcionando bien.</p>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAR FAQs
  // =====================================================
  const renderFAQs = () => (
    <div className="faqs-section">
      <div className="section-header">
        <h2>Preguntas Frecuentes</h2>
        <p>Respuestas a las dudas más comunes sobre {seccionActual.titulo.toLowerCase()}</p>
      </div>

      <div className="faqs-list">
        {faqsActivas.map((faq, idx) => (
          <details key={faq.id || idx} className="faq-item">
            <summary>
              <span className="faq-icon"><LucideIcon name="circle-help" size={18} /></span>
              {faq.pregunta}
            </summary>
            <div className="faq-answer">
              <p>{faq.respuesta}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ortesis-page">
      <header className="page-header">
        <div className="header-content">
          <h1><LucideIcon name="accessibility" size={24} /> {MODULO_NOMBRE}</h1>
          <p className="subtitle">Centro de información y cuidados</p>
        </div>
      </header>

      {/* Mapa de fases: siempre visible al entrar al módulo, no es una pestaña más */}
      <MapaFasesOrtesis pacienteId={user?.paciente_id} />

      <section className="device-switch-shell" aria-label="Selector de sección">
        <div className="device-switch" role="tablist" aria-label="Tipo de dispositivo">
          <button
            type="button"
            role="tab"
            aria-selected={seccionActiva === 'protesis'}
            className={`device-switch-btn ${seccionActiva === 'protesis' ? 'active' : ''}`}
            onClick={() => cambiarSeccion('protesis')}
          >
            Prótesis
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={seccionActiva === 'ortesis'}
            className={`device-switch-btn ${seccionActiva === 'ortesis' ? 'active' : ''}`}
            onClick={() => cambiarSeccion('ortesis')}
          >
            Órtesis
          </button>
        </div>
      </section>

      <nav className="tabs-nav">
        <button
          className={`tab ${activeTab === 'inicio' ? 'active' : ''}`}
          onClick={() => { setActiveTab('inicio'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Inicio
        </button>
        {seccionActiva === 'protesis' && (
          <button
            className={`tab ${activeTab === 'niveles-k' ? 'active' : ''}`}
            onClick={() => { setActiveTab('niveles-k'); setActiveSubTab(null); setSelectedItem(null); }}
          >
            Niveles K
          </button>
        )}
        <button
          className={`tab ${activeTab === 'tipos' ? 'active' : ''}`}
          onClick={() => { setActiveTab('tipos'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Tipos
        </button>
        <button
          className={`tab ${activeTab === 'cuidados' ? 'active' : ''}`}
          onClick={() => { setActiveTab('cuidados'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Cuidados
        </button>
        <button
          className={`tab ${activeTab === 'mi-protesis' ? 'active' : ''}`}
          onClick={() => { setActiveTab('mi-protesis'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Mi dispositivo
        </button>
        <button
          className={`tab ${activeTab === 'problemas' ? 'active' : ''}`}
          onClick={() => { setActiveTab('problemas'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          Problemas
        </button>
        <button
          className={`tab ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('faqs'); setActiveSubTab(null); setSelectedItem(null); }}
        >
          FAQs
        </button>
      </nav>

      <main className="tab-content">
        {renderContent()}
      </main>

      {/* Modal para reportar problema */}
      {showModal && modalType === 'problema' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Reportar Problema</h2>
            <form onSubmit={handleReportarProblema}>
              <div className="form-group">
                <label>Tipo de problema</label>
                <div className="tipo-problema-grid">
                  {tiposProblema.map(tipo => (
                    <button
                      key={tipo.id}
                      type="button"
                      className={`tipo-btn ${problemaForm.tipo === tipo.id ? 'selected' : ''}`}
                      onClick={() => setProblemaForm({...problemaForm, tipo: tipo.id})}
                    >
                      <span className="tipo-icon"><LucideIcon name={tipo.icon} size={20} /></span>
                      <span className="tipo-nombre">{tipo.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Describe el problema</label>
                <textarea
                  value={problemaForm.descripcion}
                  onChange={e => setProblemaForm({...problemaForm, descripcion: e.target.value})}
                  className="form-control"
                  rows="4"
                  placeholder="Describe con detalle qué está pasando..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Severidad</label>
                <select
                  value={problemaForm.severidad}
                  onChange={e => setProblemaForm({...problemaForm, severidad: e.target.value})}
                  className="form-control"
                >
                  <option value="leve">Leve - Puede esperar</option>
                  <option value="moderado">Moderado - Necesito atención pronto</option>
                  <option value="severo">Severo - Necesito atención urgente</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!problemaForm.tipo || !problemaForm.descripcion}
                >
                  Enviar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AccessibilityPanel />
      <AccessibilityFAB />
    </div>
  );
};

export default Ortesis;
