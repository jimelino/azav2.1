# API de integración — Sistema clínico externo → Azaria

Esta API permite que el sistema clínico externo del área de Neuropsicología
envíe información a Azaria: pacientes, especialistas, asignaciones, citas y
resultados de evaluación en PDF. Azaria expone los endpoints; el sistema
externo los llama cuando tenga información nueva o actualizada.

## URL base

```
https://azav21-production.up.railway.app/api/integracion/neuro
```

## Autenticación

Todas las peticiones deben incluir el header:

```
Authorization: Bearer <token>
```

El token se les entrega por separado (variable de entorno `EXTERNAL_NEURO_INGEST_TOKEN`
en el servidor de Azaria) y no debe compartirse fuera del equipo. Sin este
header, o con un token incorrecto, todas las rutas responden `401`.

## Formato general de respuesta

```json
{ "success": true, "message": "...", "data": { ... } }
```
En caso de error: `{ "success": false, "message": "..." }` con el código HTTP correspondiente (`401`, `404`, `422`, `500`).

---

## 1. Crear/actualizar paciente

`POST /pacientes`

Si el correo no existe en Azaria, crea la cuenta automáticamente (con
contraseña temporal) para que el paciente pueda entrar. Si ya existe, solo
actualiza nombre y foto.

**Body (JSON):**
```json
{
  "email": "paciente@ejemplo.com",
  "nombre_completo": "Juan Pérez González",
  "fecha_nacimiento": "1990-05-10",
  "foto_perfil_url": "https://.../foto.jpg"
}
```
`email` y `nombre_completo` son obligatorios; `fecha_nacimiento` y `foto_perfil_url` son opcionales.

**Respuesta (cuenta nueva):**
```json
{
  "success": true,
  "message": "Paciente creado",
  "data": {
    "paciente_id": 4,
    "usuario_id": 10,
    "email": "paciente@ejemplo.com",
    "password_temporal": "Azaria9027"
  }
}
```
`password_temporal` solo viene en el primer registro; en llamadas posteriores para el mismo correo viene `null` (la cuenta ya existe, no se toca la contraseña).

---

## 2. Crear/actualizar especialista de neuro

`POST /especialistas`

Mismo comportamiento que pacientes, pero da de alta al usuario con rol de
especialista, en el área de Neuropsicología.

**Body (JSON):**
```json
{
  "email": "especialista@ejemplo.com",
  "nombre_completo": "Dra. Alina Jiménez Solórzano",
  "foto_perfil_url": "https://.../foto.jpg"
}
```

**Respuesta:** igual estructura que pacientes, con `especialista_id` en vez de `paciente_id`.

---

## 3. Asignar especialista a paciente

`POST /asignaciones`

Ambos correos deben haberse registrado antes con los endpoints 1 y 2. Si el
paciente ya tenía otro especialista de neuro asignado, se transfiere
automáticamente (se desactiva la asignación anterior).

**Body (JSON):**
```json
{
  "paciente_email": "paciente@ejemplo.com",
  "especialista_email": "especialista@ejemplo.com"
}
```

**Respuesta:**
```json
{ "success": true, "message": "Asignación creada", "data": { "asignacion_id": 12, "transferido_de": null } }
```

---

## 4. Crear/actualizar cita

`POST /citas`

Usa `id_externo` (el identificador que la cita tiene en su sistema) para que
si la reenvían (por ejemplo, tras reagendarla), Azaria actualice la misma
cita en vez de duplicarla.

**Body (JSON):**
```json
{
  "id_externo": "CITA-00123",
  "paciente_email": "paciente@ejemplo.com",
  "especialista_email": "especialista@ejemplo.com",
  "fecha": "2026-08-20",
  "hora_inicio": "10:00:00",
  "hora_fin": "10:30:00",
  "tipo": "seguimiento",
  "motivo": "Sesión de seguimiento"
}
```
`tipo` es opcional (`primera_vez`, `seguimiento` o `urgencia`; si no se manda o no coincide, se usa `seguimiento`). `id_externo` es opcional, pero se recomienda mandarlo siempre para evitar duplicados.

---

## 5. Subir resultado de evaluación (PDF)

`POST /resultados`

Este endpoint recibe `multipart/form-data`, no JSON.

**Campos del formulario:**
- `paciente_email` (obligatorio)
- `archivo` (obligatorio, PDF)
- `titulo` (opcional)
- `id_externo` (opcional)

**Respuesta:**
```json
{ "success": true, "message": "Resultado guardado", "data": { "resultado_id": 1, "archivo_url": "neuro-resultados/....pdf" } }
```

---

## Notas para el otro equipo

- Todos los endpoints son idempotentes cuando se manda el identificador correspondiente (correo para pacientes/especialistas, `id_externo` para citas): pueden reintentar sin miedo a duplicar información.
- El orden recomendado para dar de alta un paciente nuevo es: `pacientes` → `especialistas` (si no existe ya) → `asignaciones` → `citas` / `resultados`.
- Si tienen dudas sobre algún campo o necesitan uno adicional, esto se puede ajustar — este documento es la propuesta inicial, no un contrato cerrado.
