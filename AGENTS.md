# AZARIA - Plataforma de Rehabilitacion Medica
# Agente de Contexto del Proyecto

## DESCRIPCION GENERAL
Azaria es una plataforma PWA de adherencia terapeutica para pacientes en rehabilitacion protesica.
Dirigida a pacientes de 50-80 anos con amputacion de miembros inferiores.
Incluye modulos de nutricion, medicina, fisioterapia, neuropsicologia, ortesis, citas, chat, blog, comunidad, expediente clinico, y mas.

## STACK TECNOLOGICO

### Frontend
- **Framework:** React 18.2 con CRA 5.0.1 (react-scripts)
- **Router:** react-router-dom 6.20
- **HTTP:** axios 1.6.2
- **Graficas:** chart.js 4.4 + react-chartjs-2 5.2
- **Fechas:** date-fns 3.0
- **Iconos:** react-icons 4.12
- **CSS:** Custom CSS puro (no frameworks UI)
- **PWA:** Service Worker custom con cache strategies
- **Build output:** ~160 kB JS / ~53 kB CSS (gzipped)

### Backend
- **Lenguaje:** PHP 8+ (sin framework, arquitectura MVC manual)
- **Base de datos:** MySQL 8+ via PDO con prepared statements
- **Auth:** Session-based con tokens HMAC-SHA256 custom
- **Patron:** Controllers + Models + Services + Middleware + Routes

### Base de Datos
- **Motor:** MySQL 8 (InnoDB, utf8mb4_unicode_ci)
- **Nombre:** vitalia_db
- **Tablas:** 70+ tablas
- **Puerto local:** 3307 (XAMPP)
- **Credenciales dev:** root / 12345

## ESTRUCTURA DE ARCHIVOS

```
Azaria/
├── .Codex/                    # Config de agente
├── backend/
│   ├── config/
│   │   ├── constants.php       # ROLE_PACIENTE, ROLE_ESPECIALISTA, fases, etc.
│   │   └── database.php        # PDO config (localhost:3307, vitalia_db)
│   ├── public/
│   │   └── index.php           # Entry point, autoloader, CORS
│   ├── src/
│   │   ├── Controllers/        # 22 controllers
│   │   ├── Middleware/          # AuthMiddleware (activo), Role/RateLimit/CORS/Moderation (sin usar)
│   │   ├── Models/             # 29 models
│   │   ├── Routes/
│   │   │   └── api.php         # 80+ rutas (archivo principal)
│   │   ├── Services/           # 14 services
│   │   └── Utils/
│   │       └── Response.php    # Response::success(), Response::error()
│   └── uploads/                # Archivos subidos (fotos, documentos, planes)
├── database/
│   ├── azaria_db.sql           # Schema principal (70+ tablas, vistas, eventos, procedures)
│   └── migrations/             # Migraciones incrementales
│       ├── add_macros_to_registro_comidas.sql
│       ├── configuracion_usuario.sql
│       ├── expediente_archivos.sql
│       ├── neuropsicologia_act.sql
│       └── planes_nutricionales.sql
├── frontend/
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── service-worker.js   # Cache strategies
│   ├── src/
│   │   ├── components/
│   │   │   ├── accessibility/  # AccessibilityPanel
│   │   │   ├── auth/           # LoginForm, PINKeyboard
│   │   │   ├── layouts/        # ModuleLayout, BaseLayout, AdminLayout, etc.
│   │   │   ├── neuropsicologia/# CuestionarioActivo, ACTEjercicioActivo
│   │   │   ├── nutricion/      # MiPlanNutricional, PlanesNutricionales
│   │   │   ├── outlook/        # OutlookConnect, OutlookCalendar
│   │   │   ├── shared/         # ProtectedRoute, RoleBasedRoute
│   │   │   ├── VoiceHelper.jsx # Narrador de voz
│   │   │   └── ModuleIcon.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # user, login(), logout(), setupPIN()
│   │   │   ├── AccessibilityContext.jsx  # 13+ settings de accesibilidad
│   │   │   └── NotificationContext.jsx   # Toast notifications
│   │   ├── data/
│   │   │   └── neuropsicologiaData.js    # Cuestionarios ACT, AAQ-2, etc.
│   │   ├── pages/
│   │   │   ├── admin/          # AdminDashboard
│   │   │   ├── especialista/   # EspecialistaDashboard, ExpedientePaciente
│   │   │   ├── paciente/       # PacienteDashboard
│   │   │   ├── Login.jsx
│   │   │   ├── Nutricion.jsx, Medicina.jsx, Fisioterapia.jsx, etc.
│   │   │   ├── Configuracion.jsx
│   │   │   ├── Expediente.jsx, ExpedienteCompartido.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   ├── api.js          # Axios instance, interceptors, 401 redirect
│   │   │   ├── authService.js
│   │   │   └── perfilService.js
│   │   ├── styles/             # 1 CSS por pagina + design-system.css + accessibility.css
│   │   ├── utils/
│   │   │   └── constants.js    # ROLES, FASES, ESPECIALIDADES
│   │   ├── App.jsx             # Router principal
│   │   ├── App.css
│   │   ├── index.js            # Entry point + SW registration
│   │   └── index.css           # Reset + global styles
│   └── package.json            # homepage: "/~azaria/"
└── Lineamientos/               # Documentos de diseno
```

## PATRONES Y CONVENCIONES

### Backend - Controllers
```php
// Patron: metodo estatico o instancia, recibe datos, usa DatabaseService, retorna Response
public function getResumen($pacienteId) {
    $user = AuthMiddleware::getCurrentUser(); // Siempre via $GLOBALS['current_user']
    $db = DatabaseService::getInstance();     // Singleton PDO
    $result = $db->query("SELECT ... WHERE id = ?", [$pacienteId])->fetch();
    return Response::success($result);        // Siempre Response::success() o Response::error()
}
```

### Backend - Rutas (api.php)
```php
route('GET', '/api/endpoint/(\d+)', function($id) {
    $controller = new MiController();
    $controller->miMetodo($id);
}, ['auth']);  // ['auth'] = requiere token, [] = publico
```

### Backend - Auth Flow
1. Login: POST /api/auth/login → AuthService valida → SessionService crea token HMAC-SHA256
2. Token se guarda como hash en tabla `sesiones_activas`
3. Frontend guarda token en localStorage, lo envia como Bearer header
4. AuthMiddleware valida token via SessionService::validateToken()
5. Usuario actual: `$GLOBALS['current_user']` o `AuthMiddleware::getCurrentUser()`
6. Expiracion: 24h normal, 30d con "remember me"

### Frontend - API Calls
```javascript
// api.js interceptor auto-unwraps response.data
// 401 → limpia token → redirect a /login
const res = await api.get('/endpoint');    // res ya es response.data (sin .data extra)
const res = await api.post('/endpoint', body);
```

### Frontend - Paginas con ModuleLayout
```jsx
// App.jsx: Todas las paginas de modulo van envueltas en ModuleLayout
<Route path="/modulo" element={
  <ProtectedRoute><ModuleLayout><MiModulo /></ModuleLayout></ProtectedRoute>
} />
// ModuleLayout agrega: bottom nav + boton flotante de volver (top-left)
// Las paginas deben tener padding-top suficiente para el boton flotante (~56px)
```

### Frontend - CSS Design System
```css
/* Colores de modulo (design-system.css) */
--color-primary: #0097A7;        /* Teal azulado - color principal */
--color-nutricion: #4CAF50;      /* Verde */
--color-fisioterapia: #FF9800;   /* Naranja */
--color-medicina: #F44336;       /* Rojo */
--color-neuropsicologia: #9C27B0;/* Morado */
--color-ortesis: #00BCD4;        /* Cyan */
--color-citas: #009688;          /* Teal oscuro */
--color-config: #607D8B;         /* Gris azulado */
--color-blog: #3F51B5;           /* Indigo */
--color-comunidad: #E91E63;      /* Rosa */
--color-recordatorios: #FFC107;  /* Amarillo */
--color-dashboard: #2196F3;      /* Azul */

/* Superficies dark theme */
--background-primary: #0D1117;
--surface-primary: #161B22;
--surface-secondary: #21262D;
--surface-tertiary: #30363D;
--border-color: #30363D;
--text-primary: #E6EDF3;
--text-secondary: #8B949E;
--text-muted: #6E7681;

/* Spacing & radius */
--spacing-xs: 4px;  --spacing-sm: 8px;  --spacing-md: 16px;
--spacing-lg: 24px; --spacing-xl: 32px;
--radius-sm: 8px;   --radius-md: 12px;  --radius-lg: 16px;  --radius-xl: 24px;

/* Touch targets (accesibilidad adultos mayores) */
--touch-target-min: 48px;
--touch-target-comfortable: 56px;
--font-size-base: 18px;  /* Grande por defecto para adultos mayores */
```

### Frontend - Patron de Pagina Tipica
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/MiModulo.css';

const MiModulo = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const res = await api.get(`/mi-modulo/${user.id}`);
      setData(res?.data || null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... render
};
```

## ROLES Y RUTAS

### Roles
- `paciente` - Acceso a modulos de salud, citas, chat, expediente
- `especialista` - Dashboard especialista, gestion de pacientes, expedientes
- `administrador` - Panel admin, CRUD usuarios, metricas, FAQs, blog

### Rutas Publicas
- `/login`
- `/expediente/compartido/:token` (vista compartida temporal, 72h)

### Rutas Protegidas (todas requieren auth + ModuleLayout)
- `/paciente` - Dashboard paciente
- `/nutricion`, `/medicina`, `/fisioterapia`, `/neuropsicologia`, `/ortesis`
- `/citas`, `/chat`, `/recordatorios`, `/blog`, `/comunidad`, `/faqs`
- `/perfil`, `/configuracion`, `/expediente`
- `/especialista` - Dashboard especialista
- `/especialista/pacientes/:id/expediente` - Expediente de paciente
- `/admin` - Dashboard admin

## MODULOS - ESTADO ACTUAL

### Completos (19/20)
Auth, Dashboard (3 roles), Nutricion, Medicina, Fisioterapia, Neuropsicologia,
Ortesis, Citas, Chat/Mensajes, Recordatorios, Blog, Comunidad, FAQs,
Perfil, Configuracion, Expediente, Outlook Sync, Planes Nutricionales

### Incompleto (1/20)
- **Fases:** Backend parcial (FaseController existe con metodos sin rutas). Frontend no existe.

## PROBLEMAS CONOCIDOS Y DEUDA TECNICA

### Criticos (Deben corregirse)
1. **Ruta con controller equivocado:** `/api/ortesis/checklist/{id}/{fecha}` usa FisioterapiaController
2. **Tablas referenciadas que no existen:** `users` (debe ser `usuarios`), `alimentos`, `articulo_likes` (debe ser `likes_articulo`), `paciente_especialista` (debe ser `asignaciones_especialista`)
3. **EmailService vacio:** Todos los metodos son TODO (no se envian emails)
4. **Rutas de test en produccion:** `/api/test/db`, `/api/test/tipos-protesis`, etc.

### Seguridad
5. **Sin CSRF protection** en rutas POST/PUT/DELETE
6. **4 Middleware sin usar:** RateLimitMiddleware, CorsMiddleware, RoleMiddleware, ModerationMiddleware
7. **102 error_log()** con datos sensibles en controllers
8. **DatabaseService** expone errores detallados en modo debug
9. **Validacion de archivos** solo por extension, no por contenido

### Funcionalidad
10. **13 metodos de controllers sin ruta** (AuthController: register, logoutDevice, logoutAllDevices, completeOnboarding; FaseController: cambiarFase, getHistorialFases, getDashboard; FisioterapiaController: crearVideo, asignarVideo; BlogController: CRUD articulos; ComunidadController: update/delete publicaciones)
11. **2 rutas con SQL inline** en api.php sin controller (GET /api/especialistas, POST /api/estudios)

### Deuda Tecnica
12. **Solo 5 archivos de migracion** para 70+ tablas - sin sistema de versionado
13. **Sin tests** - ni backend ni frontend
14. **Sin TypeScript** - todo JavaScript puro
15. **Nomenclatura inconsistente** - mezcla espanol/ingles en metodos

## SERVIDOR DE PRODUCCION

- **Host:** dtai.uteq.edu.mx
- **SSH:** usuario `azaria`, password `Azhar1aa_2026*`
- **Base path:** `/~azaria/`
- **Homepage en package.json:** `/~azaria/`

## COMANDOS DE DESARROLLO

```bash
# Frontend
cd frontend && npm start          # Dev server
cd frontend && npm run build      # Build produccion

# Backend
cd backend && php -S localhost:8000 -t public  # Dev server

# MySQL (XAMPP)
C:/xampp/mysql/bin/mysql.exe -u root -p12345 -P 3307 vitalia_db

# Ejecutar migracion
C:/xampp/mysql/bin/mysql.exe -u root -p12345 -P 3307 vitalia_db < database/migrations/archivo.sql
```

## REGLAS PARA EL AGENTE

1. **Siempre leer antes de editar** - No modificar archivos sin leerlos primero
2. **Seguir patrones existentes** - Usar Response::success/error, DatabaseService singleton, AuthMiddleware::getCurrentUser()
3. **CSS dark theme por defecto** - Usar variables CSS del design system, no colores hardcodeados
4. **Touch targets grandes** - Minimo 48px para botones (usuarios adultos mayores)
5. **Font-size base 18px** - La app esta disenada para adultos mayores
6. **Cada pagina tiene su propio CSS** - No mezclar estilos entre modulos
7. **ModuleLayout wrapping** - Todas las paginas de modulo deben tener padding-top ~56px para el boton flotante de volver
8. **API interceptor** - api.js ya hace unwrap de response.data, no hacer .data.data
9. **Build siempre** - Despues de cambios frontend, correr `npm run build` para verificar
10. **Sin frameworks CSS** - Todo es CSS custom, no agregar Bootstrap/Tailwind/MUI
11. **Idioma de UI:** Espanol (es-MX)
12. **No crear archivos innecesarios** - Preferir editar existentes
