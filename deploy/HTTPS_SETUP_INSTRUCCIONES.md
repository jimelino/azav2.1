# Configuración HTTPS para Azaria — Instrucciones para el administrador

**Destinatario:** Sysadmin de `dtai.uteq.edu.mx` (Profe Gabriel / infraestructura UTEQ)
**Solicitante:** Equipo Azaria
**Fecha:** 2026-04-15
**Motivo:** La aplicación Azaria procesa datos médicos y credenciales de usuarios (login con password, tokens Bearer, OAuth de Microsoft). Actualmente todo el tráfico viaja en HTTP claro.

---

## Estado actual del servidor (verificado 2026-04-15)

- OS: Ubuntu 20.04 LTS (kernel 5.4)
- Apache 2.4.56 corriendo, **solo puerto 80** escuchando (`ss -tlnp` no muestra 443)
- **`ssl_module` NO está cargado** (`apache2ctl -M` no lo lista)
- **Certbot NO está instalado** (`which certbot` → no existe)
- Mods activos: `alias`, `headers`, `rewrite`, `userdir`
- Sitio activo: `/etc/apache2/sites-enabled/sedeq.conf` (único)
- Deploy vive en `/home/aazaria/public_html/` vía `mod_userdir`, URL `http://dtai.uteq.edu.mx/~azaria/`

## Acciones requeridas (requieren root / sudo)

### 1. Habilitar SSL en Apache

```bash
sudo a2enmod ssl
sudo a2enmod socache_shmcb
sudo systemctl reload apache2
```

### 2. Obtener certificado SSL

**Opción A — Certbot (recomendado si hay acceso público 80→443):**

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d dtai.uteq.edu.mx
```

Certbot detectará automáticamente el VirtualHost y creará/modificará el de HTTPS.

**Opción B — Certificado institucional UTEQ:**
Si la universidad ya tiene un certificado wildcard `*.uteq.edu.mx`, solicitar los archivos `.crt`, `.key` y `.ca-bundle` a la dirección de TI y colocarlos en `/etc/ssl/azaria/` con permisos `640 root:root` para `.key`.

### 3. Habilitar redirect HTTP→HTTPS

Editar `/etc/apache2/sites-enabled/sedeq.conf` (o el archivo que sirva el vhost del puerto 80) y agregar dentro del `<VirtualHost *:80>`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

### 4. Verificar

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
curl -sI https://dtai.uteq.edu.mx/~azaria/ | head -3
# Debe responder HTTP/1.1 200 OK con Server: Apache
```

Luego probar el API:
```bash
curl -s https://dtai.uteq.edu.mx/~azaria/api/admisiones/documentos-oficiales
# Debe responder {"success":true,...}
```

---

## Cambios del lado de la aplicación una vez HTTPS esté activo

**Equipo Azaria hará** (no requiere intervención del sysadmin):

1. Actualizar `REACT_APP_API_URL` del build del frontend de `http://...` a `https://...` y redesplegar.
2. Actualizar el callback OAuth de Microsoft en `.env`:
   `MICROSOFT_REDIRECT_URI=https://dtai.uteq.edu.mx/~azaria/api/auth/microsoft/callback`
3. Registrar también el nuevo redirect URI en el panel de Azure Portal (App Registration).
4. Verificar que los headers `Access-Control-Allow-Origin` del CorsMiddleware contemplen el origin HTTPS.

---

## Impacto si NO se hace

- Todas las contraseñas, PINes y tokens viajan en texto plano por la red de UTEQ — interceptables por cualquier host en la misma red.
- Los service workers PWA modernos rechazan instalarse en orígenes no seguros (excepto `localhost`), bloqueando la experiencia offline para la que está diseñada la app.
- Microsoft/Azure rechaza los redirect URIs HTTP excepto `localhost`, por lo que la sincronización con Outlook Calendar **no funciona en producción** sin HTTPS.
- La aplicación no puede presentarse a certificaciones o despliegue clínico real sin TLS.

---

Contacto equipo Azaria: innovacion@nrsoftware.com.mx
