import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AccessibilityContext = createContext();

// Constantes de configuración
const STORAGE_KEY = 'vitalia-accessibility';

const DEFAULT_SETTINGS = {
  // Tamaño de fuente: xs, sm, md, lg, xl, xxl
  fontScale: 'md',

  // Tema: light, dark
  theme: 'light',

  // Contraste: normal, high-dark, high-light
  contrast: 'normal',

  // Reducción de movimiento
  reducedMotion: false,

  // Modo lector de pantalla
  screenReader: false,

  // Navegación por voz
  voiceNavigation: false,

  // Velocidad de voz (0.5 a 2)
  voiceSpeed: 0.85,

  // Modo dislexia
  dyslexiaMode: false,

  // Modo por edad: child, young-adult, adult, senior
  ageMode: 'young-adult',

  // Voz automática (leer elementos al hacer focus)
  autoSpeak: false,

  // Tamaño del cursor
  largeCursor: false,

  // Subrayar links
  underlineLinks: true,

  // Espaciado de texto aumentado
  increasedSpacing: false,
};

// Hook para detectar preferencias del sistema
const useSystemPreferences = () => {
  const [preferences, setPreferences] = useState({
    prefersReducedMotion: false,
    prefersDarkMode: true,
    prefersHighContrast: false,
  });

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: motionQuery.matches,
        prefersDarkMode: darkQuery.matches,
        prefersHighContrast: contrastQuery.matches,
      });
    };

    updatePreferences();

    motionQuery.addEventListener('change', updatePreferences);
    darkQuery.addEventListener('change', updatePreferences);
    contrastQuery.addEventListener('change', updatePreferences);

    return () => {
      motionQuery.removeEventListener('change', updatePreferences);
      darkQuery.removeEventListener('change', updatePreferences);
      contrastQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe ser usado dentro de un AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const systemPreferences = useSystemPreferences();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error al cargar configuración de accesibilidad:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Aplicar configuraciones al DOM
  useEffect(() => {
    const root = document.documentElement;

    // Tamaño de fuente
    root.setAttribute('data-font-scale', settings.fontScale);

    // Tema
    root.setAttribute('data-theme', settings.theme);

    // Contraste
    root.setAttribute('data-contrast', settings.contrast);

    // Reducción de movimiento
    root.setAttribute('data-reduced-motion', settings.reducedMotion.toString());

    // Lector de pantalla
    root.setAttribute('data-screen-reader', settings.screenReader.toString());

    // Navegación por voz
    root.setAttribute('data-voice-navigation', settings.voiceNavigation.toString());

    // Modo dislexia
    root.setAttribute('data-dyslexia', settings.dyslexiaMode.toString());

    // Modo por edad
    root.setAttribute('data-age-mode', settings.ageMode);

    // Guardar en localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error al guardar configuración:', e);
    }
  }, [settings]);

  // Aplicar preferencias del sistema si no hay configuración guardada
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: systemPreferences.prefersReducedMotion,
        theme: systemPreferences.prefersDarkMode ? 'dark' : 'light',
        contrast: systemPreferences.prefersHighContrast ? 'high-dark' : 'normal',
      }));
    }
  }, [systemPreferences]);

  // Actualizar una configuración específica
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Actualizar múltiples configuraciones
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Restablecer configuración por defecto
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Aplicar perfil predefinido por edad
  const applyAgeProfile = useCallback((age) => {
    let profile = {};

    if (age >= 10 && age <= 15) {
      profile = {
        ageMode: 'child',
        fontScale: 'sm',
        voiceSpeed: 1,
      };
    } else if (age >= 16 && age <= 40) {
      profile = {
        ageMode: 'young-adult',
        fontScale: 'md',
        voiceSpeed: 1,
      };
    } else if (age >= 41 && age <= 55) {
      profile = {
        ageMode: 'adult',
        fontScale: 'md',
        voiceSpeed: 0.9,
      };
    } else if (age >= 56) {
      profile = {
        ageMode: 'senior',
        fontScale: 'lg',
        voiceSpeed: 0.75,
        increasedSpacing: true,
      };
    }

    updateSettings(profile);
  }, [updateSettings]);

  // Aplicar perfil de accesibilidad visual
  const applyVisualProfile = useCallback((level) => {
    // level: normal, low-vision, blind
    switch (level) {
      case 'low-vision':
        updateSettings({
          fontScale: 'xl',
          contrast: 'high-dark',
          largeCursor: true,
          underlineLinks: true,
          increasedSpacing: true,
        });
        break;
      case 'blind':
        updateSettings({
          screenReader: true,
          voiceNavigation: true,
          autoSpeak: true,
          voiceSpeed: 0.8,
        });
        break;
      default:
        updateSettings({
          fontScale: 'md',
          contrast: 'normal',
          largeCursor: false,
          screenReader: false,
          voiceNavigation: false,
          autoSpeak: false,
        });
    }
  }, [updateSettings]);

  // Toggle panel de accesibilidad
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  // Función para aumentar tamaño de fuente
  const increaseFontSize = useCallback(() => {
    const scales = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = scales.indexOf(settings.fontScale);
    if (currentIndex < scales.length - 1) {
      updateSetting('fontScale', scales[currentIndex + 1]);
    }
  }, [settings.fontScale, updateSetting]);

  // Función para disminuir tamaño de fuente
  const decreaseFontSize = useCallback(() => {
    const scales = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = scales.indexOf(settings.fontScale);
    if (currentIndex > 0) {
      updateSetting('fontScale', scales[currentIndex - 1]);
    }
  }, [settings.fontScale, updateSetting]);

  // Toggle alto contraste
  const toggleHighContrast = useCallback(() => {
    const newContrast = settings.contrast === 'normal'
      ? (settings.theme === 'dark' ? 'high-dark' : 'high-light')
      : 'normal';
    updateSetting('contrast', newContrast);
  }, [settings.contrast, settings.theme, updateSetting]);

  // Toggle tema oscuro/claro
  const toggleTheme = useCallback(() => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', newTheme);

    // Actualizar contraste si está en alto contraste
    if (settings.contrast !== 'normal') {
      updateSetting('contrast', newTheme === 'dark' ? 'high-dark' : 'high-light');
    }
  }, [settings.theme, settings.contrast, updateSetting]);

  // Atajos de teclado globales
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Alt + A: Abrir panel de accesibilidad
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        togglePanel();
      }
      // Alt + +: Aumentar fuente
      if (e.altKey && e.key === '+') {
        e.preventDefault();
        increaseFontSize();
      }
      // Alt + -: Disminuir fuente
      if (e.altKey && e.key === '-') {
        e.preventDefault();
        decreaseFontSize();
      }
      // Alt + C: Toggle alto contraste
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        toggleHighContrast();
      }
      // Alt + T: Toggle tema
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [togglePanel, increaseFontSize, decreaseFontSize, toggleHighContrast, toggleTheme]);

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    applyAgeProfile,
    applyVisualProfile,
    isPanelOpen,
    togglePanel,
    openPanel,
    closePanel,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    toggleTheme,
    systemPreferences,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext;
