# EduSense — Documentación de la API y Tiempo Real

> **Autor:** Fanny Mayorga
>
> **Fecha:** 16-09-2026

Base URL: `http://localhost:8000/api/v1` (proxy del frontend: `/api/v1`). Con el stack de
contenedores (`podman compose up -d`) la API queda publicada en el puerto 8000 del host.

Todas las respuestas usan la envoltura estándar:

```json
{
  "success": true,
  "message": "Mensaje descriptivo.",
  "data": { }
}
```

## Índice

1. [GET /dashboard/summary](#1-get-dashboardsummary)
2. [POST /encuestas/evaluar](#2-post-encuestasevaluar)
3. [Tiempo real (Reverb / Echo)](#3-tiempo-real-reverb--echo)
4. [Enumeraciones](#4-enumeraciones)
5. [Datos de demostración](#5-datos-de-demostracion)

---

## 1. GET /dashboard/summary

Devuelve los KPIs y el listado de estudiantes evaluados para poblar el dashboard.

### Ejemplo de respuesta

```json
{
  "success": true,
  "message": "Resumen del dashboard obtenido correctamente.",
  "data": {
    "kpis": {
      "total_estudiantes_evaluados": 6,
      "alertas_detectadas": 4,
      "sesiones_programadas_hoy": 4
    },
    "estudiantes": [
      {
        "id": 1,
        "nombres": "María José",
        "apellidos": "Álvarez",
        "nombre_completo": "María José Álvarez",
        "grado": "3° Básica",
        "areas": [
          {
            "area": "atencion",
            "label": "Atención",
            "puntaje": 24,
            "umbral_alerta": 15,
            "alerta": true
          }
        ],
        "alerta": true,
        "area_alerta": "atencion",
        "label_alerta": "Atención",
        "progreso": 33,
        "total_sesiones": 3
      }
    ]
  }
}
```

### Campos del estudiante

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | int | Identificador del estudiante |
| `nombre_completo` | string | Nombre y apellidos |
| `grado` | string | Curso del estudiante |
| `areas[]` | array | Detalle de cada área evaluada con su `puntaje`, `umbral_alerta` y `alerta` |
| `alerta` | bool | `true` si al menos un área supera el umbral |
| `area_alerta` | string\|null | Área de mayor riesgo (`atencion`, `lectoescritura`, `calculo`, `motor`) |
| `label_alerta` | string\|null | Etiqueta legible del área en alerta |
| `progreso` | int | Porcentaje de sesiones del plan completadas (0–100) |
| `total_sesiones` | int | Número de sesiones activas del cronograma |

### Campos de KPI

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `total_estudiantes_evaluados` | int | Estudiantes con al menos una evaluación |
| `alertas_detectadas` | int | Estudiantes con al menos un área en alerta |
| `sesiones_programadas_hoy` | int | Sesiones del cronograma con fecha de hoy |

---

## 2. POST /encuestas/evaluar

Procesa las respuestas de una encuesta, persiste las respuestas, detecta áreas en alerta,
genera el plan de intervención (si corresponde) y transmite el evento WebSocket.

### Cuerpo de la petición

```json
{
  "estudiante_id": 1,
  "evaluador_id": null,
  "fecha_aplicacion": "2026-09-16",
  "respuestas": [
    { "pregunta_id": 11, "valor": 5, "observacion": "Dificultad para mantener foco." },
    { "pregunta_id": 12, "valor": 5 },
    { "pregunta_id": 13, "valor": 5 },
    { "pregunta_id": 14, "valor": 5 },
    { "pregunta_id": 15, "valor": 5 }
  ]
}
```

### Validación

| Campo | Reglas |
| --- | --- |
| `estudiante_id` | requerido, entero, debe existir en `estudiantes` |
| `evaluador_id` | opcional, entero, debe existir en `users` |
| `fecha_aplicacion` | opcional, fecha `YYYY-MM-DD` |
| `respuestas` | requerido, arreglo con al menos 1 elemento |
| `respuestas.*.pregunta_id` | requerido, entero, debe existir en `preguntas` |
| `respuestas.*.valor` | requerido, entero 1–5 |
| `respuestas.*.observacion` | opcional, texto máximo 1000 |

### Ejemplo de respuesta

```json
{
  "success": true,
  "message": "Evaluación procesada y cronograma de intervenciones asignado.",
  "data": {
    "estudiante": {
      "id": 1,
      "nombre_completo": "María José Álvarez",
      "grado": "3° Básica",
      "alerta": true,
      "area_alerta": "atencion",
      "label_alerta": "Atención",
      "progreso": 17,
      "total_sesiones": 6
    },
    "diagnostico": {
      "areas": [
        {
          "area": "atencion",
          "label": "Atención",
          "puntaje": 25,
          "umbral_alerta": 15,
          "alerta": true
        }
      ],
      "alerta_detectada": true,
      "areas_en_alerta": ["atencion"]
    },
    "plan": [
      {
        "actividad_id": 8,
        "titulo": "Seguimiento de instrucciones",
        "descripcion": "Ejercicios de ejecución de comandos en secuencia.",
        "categoria": "atencion",
        "nivel_dificultad": "medio",
        "duracion_minutos": 25,
        "fecha_programada": "2026-09-24",
        "estado": "pendiente"
      },
      {
        "actividad_id": 9,
        "titulo": "Pausas activas de autorregulación",
        "descripcion": "Técnicas de atención plena y respiración guiada.",
        "categoria": "atencion",
        "nivel_dificultad": "alto",
        "duracion_minutos": 15,
        "fecha_programada": "2026-10-01",
        "estado": "pendiente"
      },
      {
        "actividad_id": 7,
        "titulo": "Memoria visual de parejas",
        "descripcion": "Juego de memoria visual para promover la concentración sostenida.",
        "categoria": "atencion",
        "nivel_dificultad": "bajo",
        "duracion_minutos": 20,
        "fecha_programada": "2026-10-08",
        "estado": "pendiente"
      }
    ],
    "kpis": {
      "total_estudiantes_evaluados": 6,
      "alertas_detectadas": 4,
      "sesiones_programadas_hoy": 4
    }
  }
}
```

### Errores

- `422` con `success: false` y el arreglo `errors` si falla la validación.
- `404` si el `estudiante_id` o algún `pregunta_id` no existe.

---

## 3. Tiempo real (Reverb / Echo)

### Canal

- **Nombre:** `evaluaciones`
- **Tipo:** público (`Channel`)

### Evento

- **Nombre público:** `evaluacion.procesada`
- **Clase:** `App\Events\EvaluacionProcesada`
- **Payload:** idéntico al bloque `data` de la respuesta del POST `/encuestas/evaluar`
  (`estudiante`, `diagnostico`, `plan`, `kpis`).

### Suscripción en el frontend (`src/echo.ts`)

```ts
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: false,
})

echo.channel('evaluaciones').listen('.evaluacion.procesada', (evento) => {
  // evento: EventoEvaluacionProcesada
})
```

> Nota: al usarse `broadcastAs()`, el nombre del evento incluye punto y debe escucharse
> con `.evaluacion.procesada` (prefijo `.`).

### Inicio del servidor Reverb

Con el stack de contenedores, Reverb arranca automáticamente como servicio `reverb`
(`compose.yaml`); de forma nativa:

```bash
php artisan reverb:start
# INFO  Starting server on 0.0.0.0:8080 (localhost).
```

---

## 4. Enumeraciones

### AreaEvaluacion (`app/Enums/AreaEvaluacion.php`)

| Clave | Etiqueta | Umbral de alerta (`umbralAlerta()`) |
| --- | --- | --- |
| `atencion` | Atención | 15 |
| `lectoescritura` | Lectoescritura | 15 |
| `calculo` | Cálculo | 12 |
| `motor` | Habilidades motrices | 12 |

El diagnóstico marca el área en alerta cuando `puntaje > umbral_alerta`.

### NivelDificultad (`app/Enums/NivelDificultad.php`)

`bajo`, `medio`, `alto`.

### EstadoCronograma (`app/Enums/EstadoCronograma.php`)

`pendiente`, `completada`, `cancelada`.

---

## 5. Datos de demostración

El `DatabaseSeeder` crea datos estables que permiten probar la demo sin estados
aleatorios:

| Recurso | Cantidad | Observaciones |
| --- | --- | --- |
| `estudiantes` | 6 | ids reproducibles del 1 al 6 |
| `encuestas` | 4 | una por área |
| `preguntas` | 20 | 5 por área: lectoescritura 1–5, cálculo 6–10, atención 11–15, motor 16–20 |
| `actividades_psicopedagogicas` | 12 | 3 por área |
| `cronograma_intervenciones` | — | generado por el seeder y por cada evaluación |

El **botón de demostración** del dashboard envía una evaluación del estudiante `1` con
las preguntas `11–15` (área de atención) valoradas en `5`, disparando una alerta y una
notificación en tiempo real.