import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useVoice } from '../VoiceHelper';
import AccessibilityPanel, { AccessibilityFAB } from '../accessibility/AccessibilityPanel';
import PINKeyboard from './PINKeyboard';
import LucideIcon from '../LucideIcon';
import './LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [credential, setCredential] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPINKeyboard, setShowPINKeyboard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { settings, togglePanel } = useAccessibility();
  const { speak, isSpeaking, stop } = useVoice();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  // Bienvenida por voz al cargar
  useEffect(() => {
    if (settings.voiceNavigation) {
      speak('Bienvenido a Azaria. Ingresa tu correo electrónico y contraseña para iniciar sesión. Presiona Alt más A para opciones de accesibilidad.');
    }

    // Focus inicial en el campo de email
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  // Anunciar errores por voz
  useEffect(() => {
    if (error && settings.voiceNavigation) {
      speak(`Error: ${error}`);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (settings.voiceNavigation) {
      speak('Iniciando sesión, por favor espera.');
    }

    try {
      const result = await login(email, credential, remember);

      if (result.success) {
        if (settings.voiceNavigation) {
          speak('Sesión iniciada correctamente. Redirigiendo al panel principal.');
        }
        navigate('/');
      } else {
        setError(result.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePINInput = (value) => {
    setCredential(value);
  };

  const handleFieldFocus = (fieldName, description) => {
    if (settings.autoSpeak || settings.voiceNavigation) {
      speak(description);
    }
  };

  return (
    <div className="login-container" data-theme={settings.theme}>
      {/* Skip Link */}
      <a href="#login-form" className="skip-link">
        Saltar al formulario de inicio de sesión
      </a>

      <div className="login-card" role="main">
        {/* Header */}
        <header className="login-header">
          <div className="login-brand">
            <span className="brand-icon" aria-hidden="true"><LucideIcon name="heart" size={24} color="#00589c" /></span>
            <h1 id="login-title">Bienvenido a Azaria</h1>
          </div>
          <p className="login-subtitle" id="login-description">
            Ingresa tu correo y contraseña o PIN
          </p>

          {/* Botones de accesibilidad en header */}
          <div className="login-accessibility-controls">
            <button
              type="button"
              className={`control-btn voice-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => isSpeaking ? stop() : speak('Bienvenido a Azaria. Ingresa tu correo y contraseña para iniciar sesión.')}
              aria-label={isSpeaking ? 'Detener audio' : 'Escuchar instrucciones'}
              title="Escuchar instrucciones"
            >
              <LucideIcon name={isSpeaking ? 'stop' : 'volume'} size={20} />
            </button>

            <button
              type="button"
              className="control-btn accessibility-btn"
              onClick={togglePanel}
              aria-label="Abrir configuración de accesibilidad"
              title="Accesibilidad (Alt+A)"
            >
              ♿
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-error"
            role="alert"
            aria-live="assertive"
          >
            <span className="alert-icon" aria-hidden="true"><LucideIcon name="alert-triangle" size={18} /></span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form
          id="login-form"
          onSubmit={handleSubmit}
          aria-labelledby="login-title"
          aria-describedby="login-description"
        >
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
              <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              id="email"
              className="form-control input-accessible"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => handleFieldFocus('email', 'Campo de correo electrónico. Escribe tu correo.')}
              required
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
            />
          </div>

          {/* Contraseña/PIN */}
          <div className="form-group">
            <label className="form-label" htmlFor="credential">
              Contraseña o PIN
              <span className="required" aria-hidden="true">*</span>
            </label>
            <div className="input-with-button">
              <input
                type={showPassword ? 'text' : 'password'}
                id="credential"
                className="form-control input-accessible"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                onFocus={() => handleFieldFocus('credential', 'Campo de contraseña o PIN. Escribe tu contraseña o tu PIN de 6 dígitos.')}
                required
                placeholder="Ingresa tu contraseña o PIN"
                maxLength={showPINKeyboard ? 6 : undefined}
                aria-required="true"
                aria-describedby="credential-help"
              />
              <button
                type="button"
                className="btn-icon btn-toggle-visibility"
                onClick={() => {
                  setShowPassword(!showPassword);
                  if (settings.voiceNavigation) {
                    speak(showPassword ? 'Contraseña oculta' : 'Contraseña visible');
                  }
                }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                <LucideIcon name={showPassword ? 'eye-off' : 'eye'} size={20} />
              </button>
            </div>
            <p id="credential-help" className="sr-only">
              Puedes usar tu contraseña o tu PIN de 6 dígitos
            </p>

            <button
              type="button"
              className="btn-link btn-keyboard-toggle"
              onClick={() => {
                setShowPINKeyboard(!showPINKeyboard);
                if (settings.voiceNavigation) {
                  speak(showPINKeyboard ? 'Teclado virtual cerrado' : 'Teclado virtual abierto. Usa los botones para ingresar tu PIN.');
                }
              }}
              aria-expanded={showPINKeyboard}
              aria-controls="pin-keyboard"
            >
              <LucideIcon name="keyboard" size={18} /> {showPINKeyboard ? 'Ocultar teclado virtual' : 'Mostrar teclado virtual'}
            </button>
          </div>

          {/* Teclado PIN */}
          {showPINKeyboard && (
            <div id="pin-keyboard" role="group" aria-label="Teclado numérico para PIN">
              <PINKeyboard
                value={credential}
                onChange={handlePINInput}
                maxLength={6}
                speakOnPress={settings.voiceNavigation}
              />
            </div>
          )}

          {/* Remember me */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => {
                  setRemember(e.target.checked);
                  if (settings.voiceNavigation) {
                    speak(e.target.checked ? 'Sesión se mantendrá activa' : 'Sesión no se mantendrá activa');
                  }
                }}
                onFocus={() => handleFieldFocus('remember', 'Casilla para mantener sesión activa por 30 días')}
              />
              <span className="checkbox-custom" aria-hidden="true">
                {remember ? '✓' : ''}
              </span>
              <span className="checkbox-text">
                Mantenerme conectado en este dispositivo
                <small className="help-text" id="remember-help">
                  Tu sesión permanecerá activa por 30 días
                </small>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block btn-accessible"
            disabled={loading}
            aria-busy={loading}
            onFocus={() => handleFieldFocus('submit', 'Botón para iniciar sesión')}
          >
            {loading ? (
              <>
                <span className="spinner-small" aria-hidden="true"></span>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {/* Forgot Password */}
          <div className="text-center mt-4">
            <Link
              to="/recuperar-password"
              className="link-secondary link-accessible"
              onFocus={() => handleFieldFocus('forgot', 'Enlace para recuperar contraseña o PIN')}
            >
              ¿Olvidaste tu contraseña o PIN?
            </Link>
          </div>

          {/* Solicitud de Admisión */}
          <div className="login-solicitud-cta">
            <p className="solicitud-cta-text">¿Eres nuevo y necesitas atención?</p>
            <div className="solicitud-cta-buttons">
              <Link
                to="/solicitud"
                className="btn-solicitud-admision"
                onFocus={() => handleFieldFocus('solicitud', 'Enlace para solicitar admisión como usuario nuevo')}
              >
                <LucideIcon name="clipboard-list" size={20} />
                Solicitar Admisión
              </Link>
              <Link
                to="/admisiones/estatus"
                className="btn-consultar-estatus"
                onFocus={() => handleFieldFocus('estatus', 'Enlace para consultar el estatus de tu solicitud')}
              >
                <LucideIcon name="search" size={20} />
                Consultar Estatus
              </Link>
            </div>
          </div>
        </form>

        {/* Footer */}
        <footer className="login-footer">
          <div className="help-info" role="contentinfo">
            <p className="help-title">
              <strong>¿Necesitas ayuda?</strong>
            </p>
            <p className="help-item">
              <span aria-hidden="true"><LucideIcon name="phone" size={16} /></span>
              <a href="tel:+5214424369592" className="link-accessible">+52 1 442 436 9592</a>
            </p>
            <p className="help-item">
              <span aria-hidden="true"><LucideIcon name="mail" size={18} /></span>
              <a href="mailto:unidadinvestigacionoyp_enesj@unam.mx" className="link-accessible">unidadinvestigacionoyp_enesj@unam.mx</a>
            </p>
            <p className="help-hours">Lunes a Viernes, 9:00 - 18:00</p>
          </div>
        </footer>
      </div>

      {/* Panel de Accesibilidad */}
      <AccessibilityPanel />

      {/* FAB de Accesibilidad */}
      <AccessibilityFAB />
    </div>
  );
};

export default LoginForm;
