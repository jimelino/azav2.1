import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import LucideIcon from './LucideIcon';
import '../styles/VoiceHelper.css';

/**
 * VoiceHelper - Sistema de asistencia por voz mejorado
 * Para usuarios con discapacidad visual y adultos mayores
 * Compatible con lectores de pantalla (NVDA, JAWS, VoiceOver)
 */

// Contexto de voz global
const VoiceContext = createContext(null);

// Descripciones de módulos para voz
const MODULE_DESCRIPTIONS = {
  dashboard: {
    title: 'Panel Principal',
    description: 'Aquí puede ver un resumen de su salud. Encontrará sus próximas citas, recordatorios pendientes y su progreso general.',
    icon: 'home',
    shortcuts: 'Use las flechas para navegar entre las tarjetas. Presione Enter para seleccionar.'
  },
  nutricion: {
    title: 'Nutrición',
    description: 'En esta sección puede registrar lo que come cada día, llevar control del agua que toma, y ver recetas saludables recomendadas para usted.',
    icon: 'salad',
    shortcuts: 'Use Tab para moverse entre opciones. Presione Enter para registrar alimentos.'
  },
  fisioterapia: {
    title: 'Fisioterapia',
    description: 'Aquí encontrará sus ejercicios de rehabilitación. Puede ver videos que le muestran cómo hacer cada ejercicio y marcar los que ya completó.',
    icon: 'dumbbell',
    shortcuts: 'Use las flechas para navegar entre ejercicios. Presione Espacio para marcar como completado.'
  },
  medicina: {
    title: 'Medicina',
    description: 'En esta sección puede registrar sus signos vitales como presión arterial, glucosa y peso. También puede ver su historial de medicamentos.',
    icon: 'pill',
    shortcuts: 'Use Tab para moverse entre campos. Los campos numéricos aceptan valores con las flechas.'
  },
  neuropsicologia: {
    title: 'Neuropsicología',
    description: 'Aquí encontrará ejercicios para mantener su mente activa, cuestionarios de bienestar emocional y recursos de apoyo psicológico.',
    icon: 'brain',
    shortcuts: 'Use las flechas para seleccionar respuestas. Presione Enter para confirmar.'
  },
  ortesis: {
    title: 'Órtesis y prótesis',
    description: 'En esta sección puede llevar el control de su dispositivo ortopédico. Registre su uso diario, reporte problemas y vea guías de cuidado.',
    icon: 'accessibility',
    shortcuts: 'Use Tab para navegar entre secciones. Presione Enter para registrar uso.'
  },
  comunidad: {
    title: 'Comunidad',
    description: 'Aquí puede conectar con otras personas que tienen experiencias similares. Comparta sus logros, haga preguntas y apoye a otros.',
    icon: 'users',
    shortcuts: 'Use las flechas para navegar publicaciones. Presione Enter para interactuar.'
  },
  citas: {
    title: 'Citas Médicas',
    description: 'En esta sección puede ver sus próximas citas con doctores, agendar nuevas citas y ver el historial de consultas anteriores.',
    icon: 'calendar',
    shortcuts: 'Use las flechas en el calendario. Presione Enter para seleccionar fecha.'
  },
  recordatorios: {
    title: 'Recordatorios',
    description: 'Aquí puede configurar alarmas para sus medicamentos, ejercicios, citas y otras actividades importantes de su tratamiento.',
    icon: 'alarm-clock',
    shortcuts: 'Use Tab para moverse entre campos de hora. Las flechas ajustan valores.'
  },
  blog: {
    title: 'Artículos de Salud',
    description: 'En esta sección encontrará artículos educativos sobre su salud, consejos de especialistas y noticias relevantes para su bienestar.',
    icon: 'book-open',
    shortcuts: 'Use las flechas para navegar artículos. Presione Enter para leer completo.'
  },
  chat: {
    title: 'Mensajes',
    description: 'Aquí puede comunicarse con su equipo médico. Envíe preguntas y reciba respuestas de sus especialistas.',
    icon: 'message',
    shortcuts: 'Tab para moverse al campo de mensaje. Enter para enviar.'
  },
  configuracion: {
    title: 'Configuración',
    description: 'Aquí puede personalizar la aplicación según sus necesidades. Ajuste el tamaño del texto, colores y opciones de accesibilidad.',
    icon: 'settings',
    shortcuts: 'Use Tab para navegar opciones. Espacio para activar/desactivar.'
  },
  perfil: {
    title: 'Mi Perfil',
    description: 'Aquí puede ver y editar su información personal, foto de perfil y preferencias de cuenta.',
    icon: 'user',
    shortcuts: 'Tab para moverse entre campos. Enter para editar.'
  }
};

// Frases de bienvenida variadas
const WELCOME_PHRASES = [
  'Bienvenido a Azaria. Estoy aquí para ayudarle.',
  'Hola, bienvenido. ¿En qué puedo asistirle hoy?',
  'Bienvenido de nuevo. Use Alt más A para opciones de accesibilidad.',
];

// Proveedor del contexto de voz
export const VoiceProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.85,
    pitch: 1,
    volume: 1,
    lang: 'es-MX'
  });
  const [currentVoice, setCurrentVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const utteranceRef = useRef(null);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  // Cargar voces disponibles
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.includes('es'));
      setAvailableVoices(spanishVoices.length > 0 ? spanishVoices : voices);

      // Seleccionar voz por defecto (preferir español mexicano o español)
      const defaultVoice = voices.find(v => v.lang === 'es-MX') ||
                          voices.find(v => v.lang.startsWith('es')) ||
                          voices[0];
      if (defaultVoice) setCurrentVoice(defaultVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Función principal para hablar
  const speak = useCallback((text, options = {}) => {
    if (!isSupported || !text) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Cancelar si hay algo reproduciéndose y no estamos en cola
      if (!options.queue) {
        window.speechSynthesis.cancel();
        queueRef.current = [];
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Configuración
      utterance.lang = options.lang || voiceSettings.lang;
      utterance.rate = options.rate || voiceSettings.rate;
      utterance.pitch = options.pitch || voiceSettings.pitch;
      utterance.volume = options.volume || voiceSettings.volume;

      if (currentVoice) {
        utterance.voice = currentVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        utteranceRef.current = utterance;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
        // Procesar siguiente en cola
        processQueue();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (event.error !== 'interrupted') {
          reject(event);
        } else {
          resolve();
        }
        processQueue();
      };

      if (options.queue && isProcessingRef.current) {
        queueRef.current.push(utterance);
      } else {
        isProcessingRef.current = true;
        window.speechSynthesis.speak(utterance);
      }
    });
  }, [isSupported, voiceSettings, currentVoice]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length > 0) {
      const nextUtterance = queueRef.current.shift();
      window.speechSynthesis.speak(nextUtterance);
    } else {
      isProcessingRef.current = false;
    }
  }, []);

  // Detener voz
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    queueRef.current = [];
    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Pausar voz
  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  // Reanudar voz
  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  // Leer módulo actual
  const speakModule = useCallback((moduleName, includeShortcuts = false) => {
    const moduleInfo = MODULE_DESCRIPTIONS[moduleName];
    if (moduleInfo) {
      let text = `${moduleInfo.title}. ${moduleInfo.description}`;
      if (includeShortcuts && moduleInfo.shortcuts) {
        text += ` ${moduleInfo.shortcuts}`;
      }
      speak(text);
    }
  }, [speak]);

  // Anunciar para lectores de pantalla (ARIA live region)
  const announce = useCallback((text, priority = 'polite') => {
    const announcer = document.getElementById('voice-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = text;
      }, 100);
    }
  }, []);

  // Bienvenida
  const speakWelcome = useCallback(() => {
    const phrase = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
    speak(phrase);
  }, [speak]);

  const value = {
    isSpeaking,
    isSupported,
    speak,
    stop,
    pause,
    resume,
    speakModule,
    announce,
    speakWelcome,
    voiceSettings,
    setVoiceSettings,
    availableVoices,
    currentVoice,
    setCurrentVoice,
    MODULE_DESCRIPTIONS
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
      {/* Región ARIA para anuncios */}
      <div
        id="voice-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </VoiceContext.Provider>
  );
};

const VoiceHelper = ({ currentModule = 'dashboard', customText = null, showShortcuts = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { isSpeaking, isSupported, speak, stop, speakModule } = useVoice();

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else if (customText) {
      speak(customText);
    } else {
      speakModule(currentModule, showShortcuts);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="voice-helper-container">
      <button
        className={`voice-help-btn ${isSpeaking ? 'speaking' : ''}`}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={isSpeaking ? 'Detener audio' : 'Escuchar ayuda de voz'}
        aria-pressed={isSpeaking}
        title={isSpeaking ? 'Toque para detener' : 'Toque para escuchar ayuda'}
      >
        <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
      </button>

      {showTooltip && !isSpeaking && (
        <div className="voice-tooltip" role="tooltip">
          <span className="tooltip-icon" aria-hidden="true"><LucideIcon name="lightbulb" size={16} /></span>
          <span>Toque para escuchar<br/>una explicación</span>
        </div>
      )}
    </div>
  );
};

// Implementación standalone para cuando no hay VoiceProvider
const speakStandalone = (text) => {
  if (!('speechSynthesis' in window) || !text) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';
  utterance.rate = 0.85;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(voice => voice.lang.includes('es'));
  if (spanishVoice) utterance.voice = spanishVoice;

  window.speechSynthesis.speak(utterance);
};

const stopStandalone = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Objeto de respaldo para cuando no hay VoiceProvider
const standaloneVoice = {
  speak: speakStandalone,
  stop: stopStandalone,
  isSpeaking: false,
  isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  speakModule: () => {},
  announce: () => {},
  pause: () => {},
  resume: () => {},
  speakWelcome: () => {},
  voiceSettings: { rate: 0.85, pitch: 1, volume: 1, lang: 'es-MX' },
  setVoiceSettings: () => {},
  availableVoices: [],
  currentVoice: null,
  setCurrentVoice: () => {},
  MODULE_DESCRIPTIONS
};

// Hook para usar la voz en cualquier componente
export const useVoice = () => {
  const context = useContext(VoiceContext);

  // Si no hay proveedor, usar implementación standalone
  if (!context) {
    return standaloneVoice;
  }

  return context;
};

// Componente para hacer cualquier elemento "explicable"
export const Speakable = ({
  children,
  text,
  className = '',
  speakOnFocus = false,
  speakOnHover = false
}) => {
  const { speak, isSpeaking, stop } = useVoice();
  const [showHint, setShowHint] = useState(false);
  const elementRef = useRef(null);

  const handleSpeak = useCallback((e) => {
    e?.stopPropagation();
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  }, [text, speak, stop, isSpeaking]);

  const handleFocus = useCallback(() => {
    setShowHint(true);
    if (speakOnFocus) {
      speak(text);
    }
  }, [speakOnFocus, speak, text]);

  const handleHover = useCallback(() => {
    setShowHint(true);
    if (speakOnHover) {
      speak(text);
    }
  }, [speakOnHover, speak, text]);

  return (
    <div
      ref={elementRef}
      className={`speakable ${className}`}
      onMouseEnter={handleHover}
      onMouseLeave={() => setShowHint(false)}
      onFocus={handleFocus}
      onBlur={() => setShowHint(false)}
    >
      {children}
      {showHint && (
        <button
          className={`speak-hint-btn ${isSpeaking ? 'speaking' : ''}`}
          onClick={handleSpeak}
          aria-pressed={isSpeaking}
          title={isSpeaking ? 'Detener audio' : 'Escuchar descripcion'}
          aria-label={isSpeaking ? 'Detener lectura' : 'Escuchar descripción'}
          type="button"
        >
          <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
        </button>
      )}
    </div>
  );
};

// Componente para navegación por voz (usuarios ciegos)
export const VoiceNavigation = ({ children }) => {
  const { speak, announce } = useVoice();
  const [isActive, setIsActive] = useState(false);
  const focusableElements = useRef([]);
  const currentIndex = useRef(0);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      // Alt + V: Activar/desactivar navegación por voz
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        setIsActive(prev => !prev);
        speak(isActive ? 'Navegación por voz desactivada' : 'Navegación por voz activada');
        return;
      }

      if (!isActive) return;

      // Flechas para navegar
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Activar elemento actual
        const current = focusableElements.current[currentIndex.current];
        if (current) {
          current.click();
        }
      }
    };

    const updateFocusableElements = () => {
      const elements = document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusableElements.current = Array.from(elements);
    };

    const navigateNext = () => {
      updateFocusableElements();
      currentIndex.current = Math.min(currentIndex.current + 1, focusableElements.current.length - 1);
      focusAndAnnounce();
    };

    const navigatePrev = () => {
      updateFocusableElements();
      currentIndex.current = Math.max(currentIndex.current - 1, 0);
      focusAndAnnounce();
    };

    const focusAndAnnounce = () => {
      const element = focusableElements.current[currentIndex.current];
      if (element) {
        element.focus();
        const label = element.getAttribute('aria-label') ||
                     element.textContent ||
                     element.getAttribute('title') ||
                     element.tagName;
        announce(label, 'assertive');
        speak(label);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    updateFocusableElements();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, speak, announce]);

  return (
    <div data-voice-navigation={isActive}>
      {children}
    </div>
  );
};

// Componente para anunciar cambios de ruta
export const RouteAnnouncer = ({ location, pageName }) => {
  const { speak, announce } = useVoice();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current !== location) {
      const message = `Navegando a ${pageName || 'nueva página'}`;
      announce(message, 'assertive');
      speak(message);
      prevLocation.current = location;
    }
  }, [location, pageName, speak, announce]);

  return null;
};

export default VoiceHelper;
