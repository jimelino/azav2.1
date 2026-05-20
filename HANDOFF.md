# HANDOFF — Azaria

> Documento de traspaso del proyecto Azaria. Resume el contexto, dónde se quedó el trabajo, y cómo subir cambios al servidor de producción.
>
> **Última actualización:** 2026-05-20
> **Repo:** https://github.com/marianahernandez1510202/Azaria
> **Commit actual en `main`:** `fbfd3e2` — *feat: Mejoras integrales en módulos, manuales, migraciones y nuevos componentes*

---

## 1. Resumen del proyecto

**Azaria** es una PWA de adherencia terapéutica para pacientes en rehabilitación protésica (50-80 años con amputación de miembros inferiores). Incluye módulos de nutrición, medicina, fisioterapia, neuropsicología, órtesis, citas, chat, blog, comunidad, expediente clínico, admisiones, etc.

### Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18.2 (CRA 5.0.1), react-router-dom 6.20, axios 1.6, chart.js 4.4, react-icons, CSS puro, PWA con service worker custom |
| Backend | PHP 8+ MVC manual (sin framework), MySQL 8 vía PDO, auth con tokens HMAC-SHA256 |
| Base de datos | MySQL 8 InnoDB utf8mb4 — local: `vitalia_db` (XAMPP puerto 3307) — prod: `bd_azaria` |
| Hosting | `dtai.uteq.edu.mx` (UTEQ), Ubuntu 20.04, Apache 2.4 + `mod_userdir`, sin HTTPS aún |

### Estructura (alto nivel)

```
Azaria/
├── backend/                # PHP MVC (Controllers, Models, Services, Routes)
│   ├── config/             # constants.php, database.php
│   ├── public/index.php    # Entry point + CORS + autoloader
│   ├── src/                # Controllers (22), Models (29), Services (14), Middleware, Routes/api.php
│   └── uploads/            # Datos de usuarios — NO se sube a git
├── database/
│   ├── azaria_db.sql       # Schema base
│   ├── azaria_dbml.dbml    # Diagrama DBML
│   └── migrations/         # ~24 migraciones incrementales con prefijo de fecha YYYYMMDD_NNNNNN
├── frontend/
│   ├── public/             # manifest.json, service-worker.js, iconos PWA
│   └── src/                # components/, pages/, context/, services/, styles/, utils/
├── deploy/                 # apache-azaria.conf, HTTPS_SETUP_INSTRUCCIONES.md
├── .claude/                # Config Claude Code + helpers SSH (no se suben los tmp_*.py)
├── HANDOFF.md              # este archivo
├── Manual_Tecnico_Azaria.md/.pdf
├── Manual_Usuario_Azaria.md
├── Memoria_Tecnica_Mariana.md
└── Requerimientos_Azaria.md
```

### Roles y rutas
- **paciente** — módulos de salud, citas, chat, expediente personal.
- **especialista** — dashboard, gestión de pacientes asignados, expedientes.
- **administrador** — CRUD usuarios, métricas, admisiones, FAQs, blog.

Rutas públicas: `/login`, `/expediente/compartido/:token`. El resto requiere `ProtectedRoute` + `ModuleLayout`.

---

## 2. Dónde se quedó (estado al 2026-05-20)

### Último push (commit `fbfd3e2`, 86 archivos, +13,905 / -1,470 líneas)

**Cambios incluidos:**
- **Neuropsicología:** cuestionarios personalizados e interactivos, asignaciones ACT con contenido, screening clínico, mejoras en `EvaluacionesCognitivas.jsx` y `ActividadACTPaciente.jsx`.
- **Órtesis:** 3 componentes nuevos — [MedicionesMunon.jsx](frontend/src/components/ortesis/MedicionesMunon.jsx), [ProtocoloUso.jsx](frontend/src/components/ortesis/ProtocoloUso.jsx), [MantenimientoAjustes.jsx](frontend/src/components/ortesis/MantenimientoAjustes.jsx).
- **Comunidad:** soporte de imágenes en publicaciones, mejoras en comentarios y reacciones.
- **Admin:** mejoras en [AdmisionesTab.jsx](frontend/src/components/admin/AdmisionesTab.jsx) y [AdminDashboard.jsx](frontend/src/pages/admin/AdminDashboard.jsx).
- **EmailService** ahora está implementado (antes todos los métodos eran TODO).
- **PWA:** se agregaron iconos `icon-192.png` y `icon-512.png`.
- **Documentación:** manuales técnico/usuario, memoria técnica, requerimientos, guía de memoria de estadía, instrucciones HTTPS, archivo DBML.
- **9 migraciones nuevas** (ver sección 3).
- **`.gitignore` reforzado** — excluye `backend/uploads/*`, `deploy_temp.py` y `.claude/tmp_*.py`.

**Lo que NO se subió al repo (a propósito):**
- `deploy_temp.py` — contenía el password SSH **hardcodeado**. Pendiente: borrarlo localmente, usar siempre `.claude/tmp_ssh.py` (lee de env var).
- `backend/uploads/admisiones/63|65|68/` y `backend/uploads/planes_nutricionales/*.pdf` — datos clínicos reales.
- `.claude/tmp_*.py` — helpers personales de deploy.

### Pendientes / deuda técnica

**Pendientes operativos (de la auditoría 2026-04-15):**
- ⚠️ **HTTPS no configurado** en prod. Requiere intervención de sysadmin UTEQ. Ver [deploy/HTTPS_SETUP_INSTRUCCIONES.md](deploy/HTTPS_SETUP_INSTRUCCIONES.md). Sin HTTPS, la PWA offline + OAuth Microsoft no funcionan bien.
- 🧪 **Validación E2E con login real pendiente** — los fixes de abril se validaron vía SQL directa y curl, falta probar con sesión de admin/especialista real.
- 🗑️ Borrar backup en server `~/backups_auditoria_20260415_234251/public_html_pre_deploy.tar.gz` (77 MB) cuando confirmes que el deploy estable lleva varias semanas.

**Bugs/deuda técnica conocida en el código:**

| # | Tipo | Descripción |
|---|---|---|
| 1 | Crítico | `/api/ortesis/checklist/{id}/{fecha}` usa `FisioterapiaController` (debe ser `OrtesisController`) |
| 2 | Crítico | Algunas referencias internas siguen apuntando a tablas mal nombradas (`users` vs `usuarios`, `articulo_likes` vs `likes_articulo`). |
| 3 | Crítico | Rutas de test en producción (`/api/test/db`, `/api/test/tipos-protesis`). |
| 4 | Seguridad | Sin CSRF en POST/PUT/DELETE. |
| 5 | Seguridad | 4 middlewares no usados: `RateLimitMiddleware`, `CorsMiddleware`, `RoleMiddleware`, `ModerationMiddleware`. |
| 6 | Seguridad | ~100 `error_log()` con datos sensibles en controllers. |
| 7 | Func. | 13 métodos de controllers sin ruta registrada (ver CLAUDE.md). |
| 8 | Func. | 2 rutas con SQL inline en `api.php` sin controller. |
| 9 | Func. | Módulo de **Fases** incompleto (backend parcial, frontend ausente). |
| 10 | Calidad | Sin tests, sin TypeScript, nomenclatura mezclada es/en. |

---

## 3. Servidor de producción — datos reales

> ⚠️ El `CLAUDE.md` tiene info desactualizada. **Esto es lo correcto verificado en server:**

| Dato | Valor |
|---|---|
| Host SSH | `dtai.uteq.edu.mx` |
| Usuario SSH | `azaria` |
| Password SSH | `Azhar1aa_2026*` *(usar via env var, no hardcoded)* |
| Home remoto | `/home/aazaria/` |
| Frontend deployado | `~/public_html/` (servido por `mod_userdir`) |
| Backend API | `~/public_html/api/` |
| URL pública front | `http://dtai.uteq.edu.mx/~azaria/` |
| URL pública API | `http://dtai.uteq.edu.mx/~azaria/api/` |
| DB en prod | `bd_azaria` (usuario `azaria` / pass `12345` en localhost:3306) |
| Stack server | Ubuntu 20.04 LTS · Apache 2.4.56 · PHP 8.3.9 · MySQL 8.0.42 |
| Logs PHP | `~/public_html/api/storage/logs/error.log` |
| Staging git clone | `~/Azaria/` |

### Diferencias clave vs. dev local
- Local DB se llama `vitalia_db`, prod se llama `bd_azaria`.
- Local corre en `localhost:3307` (XAMPP), prod en `localhost:3306`.
- Local tiene 70+ tablas; prod tiene 101 (incluye `alimentos`, `asignaciones_especialista`, etc. que el CLAUDE.md dice que faltan — en prod ya existen).

---

## 4. Tutorial — Subir cambios al servidor

### Setup inicial (una sola vez por máquina)

1. **Instalar paramiko** (Python 3.13+ con pip):
   ```powershell
   pip install paramiko
   ```

2. **Exportar el password SSH como variable de entorno** (PowerShell):
   ```powershell
   $env:AZARIA_SSH_PASS = 'Azhar1aa_2026*'
   ```
   Persistente para toda la sesión de PowerShell. Para que sobreviva entre sesiones, agrégalo en `$PROFILE` o en Variables de Entorno del usuario Windows.

3. **Verificar conexión SSH:**
   ```powershell
   python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" 'whoami && pwd && hostname'
   ```
   Debe responder:
   ```
   azaria
   /home/aazaria
   dtai
   ```

### Archivos de ayuda en `.claude/`

| Script | Para qué sirve |
|---|---|
| [.claude/tmp_ssh.py](.claude/tmp_ssh.py) | Ejecutar un comando arbitrario en el server (lectura/escritura/SQL). Devuelve stdout, stderr, exit code. |
| [.claude/tmp_upload_single.py](.claude/tmp_upload_single.py) | Sube **un archivo** por SFTP haciendo backup del remoto previo + `php -l` para validar sintaxis. |
| [.claude/tmp_deploy.py](.claude/tmp_deploy.py) | Deploy completo del build de frontend (tar + upload + backup + extract). |

Estos scripts **no están en git** (ignorados). Si formateas la máquina, recréalos copiándolos de tu backup o cópialos del histórico previo (commit `fbfd3e2` excluye los nuevos pero los anteriores siguen en tu disco).

---

### A. Deploy del FRONTEND (build completo)

Usa esto cuando hay cambios en React/CSS/imágenes/manifest:

```powershell
# 1. Genera el build de producción
cd C:\Users\maria\Escritorio\Azaria\frontend
npm run build

# 2. Asegúrate de que el env var esté seteado
$env:AZARIA_SSH_PASS = 'Azhar1aa_2026*'

# 3. Ejecuta el deploy automatizado
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_deploy.py"
```

**Qué hace `tmp_deploy.py`:**
1. Empaca `frontend/build/` en un `.tar.gz` (excluye `.map` y `.LICENSE.txt`).
2. Sube el tar a `~/aazaria/_deploy_stage/build_<timestamp>.tar.gz`.
3. Hace backup del `~/public_html/` actual en `~/backups_auditoria_<timestamp>/public_html_pre_deploy.tar.gz` (excluye `api/` porque es backend).
4. Extrae el tar encima de `~/public_html/` (sobrescribe HTML, JS, CSS, assets).
5. Verifica que `index.html` y `static/js/main*.js` existan.
6. Borra el tar de staging.

**Verifica después:**
```powershell
# Abre el navegador
start http://dtai.uteq.edu.mx/~azaria/

# O verifica vía SSH que el JS principal sea reciente
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" 'ls -la /home/aazaria/public_html/static/js/main*.js'
```

> ⚠️ El service worker cachea agresivamente. Si los cambios no se ven, abre DevTools → Application → Service Workers → Unregister, y refresca con Ctrl+Shift+R.

---

### B. Deploy del BACKEND (archivos PHP)

Para cambios pequeños en uno o pocos archivos del backend, sube archivo por archivo:

```powershell
$env:AZARIA_SSH_PASS = 'Azhar1aa_2026*'

# Sintaxis: python tmp_upload_single.py <local> <remoto>
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_upload_single.py" `
  "C:/Users/maria/Escritorio/Azaria/backend/src/Controllers/OrtesisController.php" `
  "/home/aazaria/public_html/api/src/Controllers/OrtesisController.php"
```

**Qué hace `tmp_upload_single.py`:**
1. Hace `cp` del archivo remoto a `~/backups_auditoria_20260415_234251/<nombre>.<timestamp>.bak`.
2. Sube el archivo local por SFTP, sobrescribiendo el remoto.
3. Lista el archivo para confirmar tamaño/fecha.
4. Corre `php -l` (lint) sobre el archivo remoto — si el syntax check falla, hay que rollback.

**Para varios archivos backend (loop manual):**
```powershell
$archivos = @(
  "src/Controllers/AdminController.php",
  "src/Controllers/AdmisionesController.php",
  "src/Models/Publicacion.php"
)
foreach ($f in $archivos) {
  python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_upload_single.py" `
    "C:/Users/maria/Escritorio/Azaria/backend/$f" `
    "/home/aazaria/public_html/api/$f"
}
```

**Si subes muchos archivos backend a la vez**, mejor empacar y subir tar:
```powershell
# Empacar solo src/ del backend
cd C:\Users\maria\Escritorio\Azaria\backend
tar -czf backend_src.tar.gz src/

# Subir y extraer
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" 'mkdir -p ~/_deploy_stage'
# (subes con sftp manual o adaptar tmp_deploy.py)
```

> Recomendación: no automatices el deploy total del backend salvo que sepas que no rompes `.env` ni `storage/logs/`. Usa `tmp_upload_single.py` para archivo por archivo.

---

### C. Aplicar MIGRACIONES de base de datos

Las migraciones viven en [database/migrations/](database/migrations/) con prefijo `YYYYMMDD_NNNNNN_<nombre>.sql`.

**Subir el archivo SQL al server y aplicarlo:**

```powershell
$env:AZARIA_SSH_PASS = 'Azhar1aa_2026*'
$mig = "20260416_000001_fix_unique_asignaciones.sql"

# 1. Subir el SQL al server
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_upload_single.py" `
  "C:/Users/maria/Escritorio/Azaria/database/migrations/$mig" `
  "/home/aazaria/_deploy_stage/$mig"

# 2. (Opcional) Backup de la DB antes de aplicar
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" `
  "mysqldump -u azaria -p12345 bd_azaria > ~/backups_db_$(date +%Y%m%d_%H%M%S).sql"

# 3. Ejecutar la migración
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" `
  "mysql -u azaria -p12345 bd_azaria < /home/aazaria/_deploy_stage/$mig"

# 4. Verificar
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" `
  "mysql -u azaria -p12345 bd_azaria -e 'SHOW TABLES;' | head -30"
```

**Migraciones nuevas del último push** (ya aplicadas en prod las marcadas con ✅, según auditoría de abril):

| Migración | Estado prod |
|---|---|
| `20260309_000001_comunidad_imagen.sql` | ⚠️ verificar |
| `20260309_000002_cuestionarios_personalizados.sql` | ⚠️ verificar |
| `20260309_000003_cuestionarios_interactivos.sql` | ⚠️ verificar |
| `20260310_000001_ortesis_mediciones_protocolo.sql` | ⚠️ verificar |
| `20260310_000002_act_asignaciones.sql` | ⚠️ verificar |
| `20260310_000003_act_asignaciones_contenido.sql` | ⚠️ verificar |
| `20260313_000001_screening_clinico.sql` | ⚠️ verificar |
| `20260415_000001_integraciones_usuario.sql` | ✅ aplicada 2026-04-15 |
| `20260416_000001_fix_unique_asignaciones.sql` | ⚠️ verificar |

Comando de verificación rápida:
```powershell
python "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py" `
  "mysql -u azaria -p12345 bd_azaria -e 'DESCRIBE integraciones_usuario;'"
```

---

### D. Workflow completo recomendado

```text
┌─ 1. Desarrollo local
│   - cd frontend && npm start
│   - cd backend && php -S localhost:8000 -t public
│   - Probar localmente con XAMPP MySQL (vitalia_db en :3307)
│
├─ 2. Commit + push a GitHub
│   git add <archivos-específicos>     # nunca "git add ." sin revisar
│   git commit -m "feat/fix: descripción clara"
│   git push origin main
│
├─ 3. Aplicar migraciones SQL (si hay)
│   Ver sección C
│
├─ 4. Deploy backend (si hay cambios en PHP)
│   Por archivo: tmp_upload_single.py
│   Ver sección B
│
├─ 5. Deploy frontend (si hay cambios JSX/CSS/assets)
│   npm run build
│   tmp_deploy.py
│   Ver sección A
│
└─ 6. Verificar en prod
    - http://dtai.uteq.edu.mx/~azaria/
    - Probar flujos críticos (login, dashboard, módulo cambiado)
    - Revisar logs: ssh → cat ~/public_html/api/storage/logs/error.log | tail -50
```

---

## 5. Comandos útiles

### Local (Windows PowerShell)

```powershell
# Frontend
cd C:\Users\maria\Escritorio\Azaria\frontend
npm start                              # Dev server (http://localhost:3000)
npm run build                          # Build de producción → frontend/build/

# Backend
cd C:\Users\maria\Escritorio\Azaria\backend
php -S localhost:8000 -t public        # Dev API (http://localhost:8000)

# MySQL local (XAMPP)
& "C:/xampp/mysql/bin/mysql.exe" -u root -p12345 -P 3307 vitalia_db

# Aplicar migración local
& "C:/xampp/mysql/bin/mysql.exe" -u root -p12345 -P 3307 vitalia_db < database/migrations/20260416_000001_fix_unique_asignaciones.sql
```

### Server (vía tmp_ssh.py)

```powershell
$env:AZARIA_SSH_PASS = 'Azhar1aa_2026*'
$ssh = "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py"

# Ver últimas líneas del error log
python $ssh 'tail -80 ~/public_html/api/storage/logs/error.log'

# Listar tablas en prod
python $ssh 'mysql -u azaria -p12345 bd_azaria -e "SHOW TABLES;"'

# Ver estructura de una tabla
python $ssh 'mysql -u azaria -p12345 bd_azaria -e "DESCRIBE integraciones_usuario;"'

# Backup completo de la DB
python $ssh 'mysqldump -u azaria -p12345 bd_azaria | gzip > ~/backup_$(date +%Y%m%d_%H%M%S).sql.gz'

# Espacio en disco
python $ssh 'df -h ~/public_html'

# Recargar Apache (probablemente no tengas sudo)
python $ssh 'sudo systemctl reload apache2'   # fallará sin sudo

# Versión PHP en server
python $ssh 'php -v'
```

---

## 6. Variables de entorno y credenciales

| Variable | Valor | Dónde se usa |
|---|---|---|
| `AZARIA_SSH_PASS` | `Azhar1aa_2026*` | Scripts `.claude/tmp_*.py` para conectar al server |
| DB local user | `root` / `12345` | XAMPP MySQL puerto 3307 → `vitalia_db` |
| DB prod user | `azaria` / `12345` | Server MySQL puerto 3306 → `bd_azaria` |
| Microsoft OAuth | en `backend/.env.production` (no en git) | OutlookCalendarController |

⚠️ **Nunca commitear nada de esto al repo.** El `.gitignore` ya excluye `.env*` y `backend/.env.production`.

---

## 7. Si algo se rompe — rollback

### Frontend rollback
```powershell
$env:AZARIA_SSH_PASS = 'Azhar1aa_2026*'
$ssh = "C:/Users/maria/Escritorio/Azaria/.claude/tmp_ssh.py"

# Listar backups disponibles
python $ssh 'ls -la ~/backups_auditoria_*/public_html_pre_deploy.tar.gz'

# Restaurar (reemplaza la fecha por el backup que quieras)
python $ssh 'cd ~/public_html && tar -xzf ~/backups_auditoria_20260520_HHMMSS/public_html_pre_deploy.tar.gz'
```

### Backend rollback de un archivo
```powershell
# tmp_upload_single.py crea un .bak con timestamp en ~/backups_auditoria_20260415_234251/
python $ssh 'ls -la ~/backups_auditoria_20260415_234251/ | grep <nombre-archivo>'
python $ssh 'cp ~/backups_auditoria_20260415_234251/<archivo>.<ts>.bak /home/aazaria/public_html/api/src/Controllers/<archivo>'
```

### DB rollback
```powershell
# Si hiciste mysqldump antes de la migración:
python $ssh 'gunzip -c ~/backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u azaria -p12345 bd_azaria'
```

---

## 8. Próximos pasos sugeridos

1. **Borrar `deploy_temp.py` local** (la versión con password hardcodeado). Usar siempre `.claude/tmp_ssh.py`.
2. **HTTPS en prod** — entregar [deploy/HTTPS_SETUP_INSTRUCCIONES.md](deploy/HTTPS_SETUP_INSTRUCCIONES.md) al sysadmin UTEQ.
3. **Validación E2E** con login real de admin/especialista/paciente en prod después del push de hoy.
4. **Limpiar deuda técnica crítica** (sección 2):
   - Fix ruta `/api/ortesis/checklist/...` (controller equivocado).
   - Eliminar rutas `/api/test/*` de producción.
   - Implementar módulo de Fases (único módulo incompleto).
5. **Aplicar migraciones nuevas** del push de hoy en prod (sección C, tabla de estado).
6. **Borrar `~/backups_auditoria_20260415_234251/public_html_pre_deploy.tar.gz`** del server (77 MB) si todo lleva semanas estable.

---

## 9. Contacto y referencias

- **Email contacto:** innovacion@nrsoftware.com.mx
- **Repo:** https://github.com/marianahernandez1510202/Azaria
- **Documentación interna:**
  - [Manual_Tecnico_Azaria.md](Manual_Tecnico_Azaria.md) / [.pdf](Manual_Tecnico_Azaria.pdf)
  - [Manual_Usuario_Azaria.md](Manual_Usuario_Azaria.md)
  - [Memoria_Tecnica_Mariana.md](Memoria_Tecnica_Mariana.md)
  - [Requerimientos_Azaria.md](Requerimientos_Azaria.md)
  - [deploy/HTTPS_SETUP_INSTRUCCIONES.md](deploy/HTTPS_SETUP_INSTRUCCIONES.md)
  - [.claude/CLAUDE.md](.claude/CLAUDE.md) (contexto para el agente de IA — *algo desactualizado en sección de prod*)
