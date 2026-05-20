import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useVoice } from '../VoiceHelper';
import LucideIcon from '../LucideIcon';
import './AccessibilityPanel.css';

const FONT_SCALES = [
  { value: 'xs', label: 'Muy pequeño', icon: 'A', size: '14px' },
  { value: 'sm', label: 'Pequeño', icon: 'A', size: '16px' },
  { value: 'md', label: 'Normal', icon: 'A', size: '18px' },
  { value: 'lg', label: 'Grande', icon: 'A', size: '22px' },
  { value: 'xl', label: 'Muy grande', icon: 'A', size: '26px' },
  { value: 'xxl', label: 'Máximo', icon: 'A', size: '30px' },
];

const AGE_PROFILES = [
  { value: 'child', label: 'Niño/a (10-15)', icon: 'user', description: 'Colores vibrantes, interfaz amigable' },
  { value: 'young-adult', label: 'Joven (16-40)', icon: 'user', description: 'Diseño moderno estándar' },
  { value: 'adult', label: 'Adulto (41-55)', icon: 'user-round', description: 'Texto y botones más grandes' },
  { value: 'senior', label: 'Adulto mayor (56+)', icon: 'user-round', description: 'Máxima legibilidad, botones grandes, responsivo' },
];

const AccessibilityPanel = () => {
  const {
    settings,
    updateSetting,
    resetSettings,
    isPanelOpen,
    closePanel,
    toggleHighContrast,
    toggleTheme,
  } = useAccessibility();

  const { speak, stop, isSpeaking } = useVoice();

  const handleSpeak = (text) => {
    if (settings.voiceNavigation || settings.autoSpeak) {
      speak(text);
    }
  };

  if (!isPanelOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="accessibility-panel-overlay open"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="accessibility-panel open"
        role="dialog"
        aria-label="Panel de Accesibilidad"
        aria-modal="true"
      >
        {/* Header */}
        <div className="panel-header">
          <h2>
            <span className="panel-icon" aria-hidden="true">♿</span>
            Accesibilidad
          </h2>
          <button
            className="panel-close-btn"
            onClick={closePanel}
            aria-label="Cerrar panel de accesibilidad"
            onFocus={() => handleSpeak('Cerrar panel')}
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="panel-content">
          {/* Tamaño de Texto */}
          <section className="accessibility-section" aria-labelledby="font-size-heading">
            <h3 id="font-size-heading">
              <span aria-hidden="true"><LucideIcon name="type" size={18} /></span>
              Tamaño de texto
            </h3>
            <div className="font-size-options">
              {FONT_SCALES.map((scale) => (
                <button
                  key={scale.value}
                  className={`font-size-btn ${settings.fontScale === scale.value ? 'active' : ''}`}
                  onClick={() => {
                    updateSetting('fontScale', scale.value);
                    handleSpeak(`Tamaño de texto: ${scale.label}`);
                  }}
                  onFocus={() => handleSpeak(scale.label)}
                  aria-pressed={settings.fontScale === scale.value}
                  style={{ '--preview-size': scale.size }}
                >
                  <span className="font-preview" style={{ fontSize: scale.size }}>{scale.icon}</span>
                  <span className="font-label">{scale.label}</span>
                </button>
              ))}
            </div>
            <div className="preview-text" aria-live="polite">
              <p>Vista previa del texto con el tamaño seleccionado.</p>
            </div>
          </section>

          {/* Tema y Contraste */}
          <section className="accessibility-section" aria-labelledby="theme-heading">
            <h3 id="theme-heading">
              <span aria-hidden="true"><LucideIcon name="palette" size={18} /></span>
              Tema y contraste
            </h3>

            <div className="acc-theme-options">
              <button
                className={`acc-theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  updateSetting('theme', 'dark');
                  handleSpeak('Tema oscuro activado');
                }}
                aria-pressed={settings.theme === 'dark'}
              >
                <span className="acc-theme-icon"><LucideIcon name="moon" size={18} /></span>
                <span>Oscuro</span>
              </button>

              <button
                className={`acc-theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  updateSetting('theme', 'light');
                  handleSpeak('Tema claro activado');
                }}
                aria-pressed={settings.theme === 'light'}
              >
                <span className="acc-theme-icon"><LucideIcon name="sunrise" size={18} /></span>
                <span>Claro</span>
              </button>
            </div>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.contrast !== 'normal'}
                onChange={toggleHighContrast}
                aria-describedby="high-contrast-desc"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Alto contraste</span>
            </label>
            <p id="high-contrast-desc" className="setting-description">
              Aumenta el contraste para mejor visibilidad
            </p>
          </section>

          {/* Asistencia Visual */}
          <section className="accessibility-section" aria-labelledby="visual-heading">
            <h3 id="visual-heading">
              <span aria-hidden="true"><LucideIcon name="eye" size={18} /></span>
              Asistencia visual
            </h3>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.largeCursor}
                onChange={(e) => updateSetting('largeCursor', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Cursor grande</span>
            </label>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.underlineLinks}
                onChange={(e) => updateSetting('underlineLinks', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Subrayar enlaces</span>
            </label>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.increasedSpacing}
                onChange={(e) => updateSetting('increasedSpacing', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Espaciado aumentado</span>
            </label>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.dyslexiaMode}
                onChange={(e) => updateSetting('dyslexiaMode', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Modo dislexia</span>
            </label>
          </section>

          {/* Asistencia de Voz */}
          <section className="accessibility-section" aria-labelledby="voice-heading">
            <h3 id="voice-heading">
              <span aria-hidden="true"><LucideIcon name="volume" size={18} /></span>
              Asistencia de voz
            </h3>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.voiceNavigation}
                onChange={(e) => {
                  updateSetting('voiceNavigation', e.target.checked);
                  if (e.target.checked) {
                    speak('Navegación por voz activada. Usaré la voz para guiarte.');
                  }
                }}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Navegación por voz</span>
            </label>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => {
                  updateSetting('autoSpeak', e.target.checked);
                  if (e.target.checked) {
                    speak('Lectura automática activada');
                  }
                }}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Leer al hacer foco</span>
            </label>

            <div className="voice-speed-control">
              <label htmlFor="voice-speed">
                Velocidad de voz: {settings.voiceSpeed.toFixed(2)}x
              </label>
              <input
                id="voice-speed"
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.voiceSpeed}
                onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
                className="voice-slider"
              />
              <div className="speed-labels">
                <span>Lento</span>
                <span>Normal</span>
                <span>Rápido</span>
              </div>
            </div>

            <button
              className="test-voice-btn"
              onClick={() => speak('Esta es una prueba de voz. Así es como se escuchará la asistencia de voz en la aplicación.')}
              disabled={isSpeaking}
            >
              {isSpeaking ? <><LucideIcon name="volume" size={16} /> Reproduciendo...</> : <><LucideIcon name="volume" size={16} /> Probar voz</>}
            </button>

            {isSpeaking && (
              <button className="stop-voice-btn" onClick={stop}>
                <LucideIcon name="stop" size={16} /> Detener
              </button>
            )}
          </section>

          {/* Movimiento */}
          <section className="accessibility-section" aria-labelledby="motion-heading">
            <h3 id="motion-heading">
              <span aria-hidden="true"><LucideIcon name="clapperboard" size={18} /></span>
              Movimiento
            </h3>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Reducir animaciones</span>
            </label>
            <p className="setting-description">
              Desactiva animaciones y transiciones
            </p>
          </section>

          {/* Perfil por Edad */}
          <section className="accessibility-section" aria-labelledby="age-heading">
            <h3 id="age-heading">
              <span aria-hidden="true"><LucideIcon name="users" size={18} /></span>
              Perfil por edad
            </h3>
            <div className="age-profiles">
              {AGE_PROFILES.map((profile) => (
                <button
                  key={profile.value}
                  className={`age-profile-btn ${settings.ageMode === profile.value ? 'active' : ''}`}
                  onClick={() => {
                    updateSetting('ageMode', profile.value);
                    handleSpeak(`Perfil ${profile.label} seleccionado. ${profile.description}`);
                  }}
                  aria-pressed={settings.ageMode === profile.value}
                >
                  <span className="age-icon" aria-hidden="true"><LucideIcon name={profile.icon} size={20} /></span>
                  <span className="age-label">{profile.label}</span>
                  <span className="age-description">{profile.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Lector de Pantalla */}
          <section className="accessibility-section" aria-labelledby="screen-reader-heading">
            <h3 id="screen-reader-heading">
              <span aria-hidden="true"><LucideIcon name="book-open" size={18} /></span>
              Lector de pantalla
            </h3>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.screenReader}
                onChange={(e) => {
                  updateSetting('screenReader', e.target.checked);
                  if (e.target.checked) {
                    speak('Modo lector de pantalla activado. La interfaz se optimizará para lectores de pantalla.');
                  }
                }}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Optimizar para lector de pantalla</span>
            </label>
            <p className="setting-description">
              Mejora la compatibilidad con NVDA, JAWS y VoiceOver
            </p>
          </section>

          {/* Atajos de Teclado */}
          <section className="accessibility-section" aria-labelledby="shortcuts-heading">
            <h3 id="shortcuts-heading">
              <span aria-hidden="true"><LucideIcon name="keyboard" size={18} /></span>
              Atajos de teclado
            </h3>
            <div className="shortcuts-list">
              <div className="shortcut">
                <kbd>Alt</kbd> + <kbd>A</kbd>
                <span>Abrir/cerrar este panel</span>
              </div>
              <div className="shortcut">
                <kbd>Alt</kbd> + <kbd>+</kbd>
                <span>Aumentar tamaño de texto</span>
              </div>
              <div className="shortcut">
                <kbd>Alt</kbd> + <kbd>-</kbd>
                <span>Disminuir tamaño de texto</span>
              </div>
              <div className="shortcut">
                <kbd>Alt</kbd> + <kbd>C</kbd>
                <span>Alternar alto contraste</span>
              </div>
              <div className="shortcut">
                <kbd>Alt</kbd> + <kbd>T</kbd>
                <span>Cambiar tema claro/oscuro</span>
              </div>
            </div>
          </section>

          {/* Restablecer */}
          <section className="accessibility-section reset-section">
            <button
              className="reset-btn"
              onClick={() => {
                resetSettings();
                handleSpeak('Configuración restablecida a valores por defecto');
              }}
            >
              <LucideIcon name="refresh-cw" size={16} /> Restablecer configuración
            </button>
          </section>
        </div>
      </div>
    </>
  );
};

// Botón flotante de accesibilidad
export const AccessibilityFAB = () => {
  const { togglePanel, settings } = useAccessibility();
  const { speak } = useVoice();

  const handleClick = () => {
    togglePanel();
    if (settings.voiceNavigation) {
      speak('Abriendo panel de accesibilidad');
    }
  };

  return (
    <button
      className="accessibility-fab"
      onClick={handleClick}
      aria-label="Abrir configuración de accesibilidad (Alt + A)"
      title="Accesibilidad (Alt + A)"
    >
      <span aria-hidden="true">♿</span>
    </button>
  );
};

export default AccessibilityPanel;
