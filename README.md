# EduSense — Sistema de Evaluación Psicopedagógica

EduSense es un sistema web modular que registra evaluaciones psicopedagógicas de
estudiantes, detecta áreas académicas en riesgo (atención, lectoescritura, cálculo y
habilidades motrices), genera automáticamente cronogramas de intervención y gestiona el
**registro maestro de estudiantes** con carga masiva y descarga por filtros. El dashboard
se actualiza en **tiempo real** mediante WebSockets, mostrando KPIs y **alertas
notificables** cuando un estudiante supera el umbral de riesgo.

> **Autor:** Fanny Mayorga
>
> **Fecha:** 23-09-2026

## Arquitectura

| Capa | Tecnología | Ruta |
| --- | --- | --- |
| Contenedores | Podman (máquina WSL2) + Docker Compose | `compose.yaml` |
| Backend | Laravel 13 + PHP 8.4 (modular, Eloquent ORM) | `backend/` |
| Autenticación | Laravel Sanctum (cookies de sesión) + RBAC | `backend/` |
| Tiempo real | Laravel Reverb (WebSockets) | `backend/` (puerto 8080) |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS | `frontend/` (puerto 5173) |
| Realtime cliente | Laravel Echo + pusher-js | `frontend/` |
| Base de datos | PostgreSQL 17 (volumen persistente) | servicio `db` (puerto 5432) |
| Hojas de cálculo | PhpSpreadsheet (exportación XLSX) | `backend/` |

### Arquitectura de software

EduSense se organiza en **módulos** bajo `backend/app/Modules`, cada uno con sus modelos
Eloquent, controladores de API, FormRequests, servicios y rutas:

| Módulo | Responsabilidad |
| --- | --- |
| `System` | Autenticación (login/logout/me), usuarios, roles y permisos |
| `Students` | Registro maestro de estudiantes: CRUD, importación CSV y exportación CSV/XLSX |
| `Academic` | Cursos, períodos, materias, matrículas, asistencia y notas (con importación) |
| `Psychopedagogic` | Encuestas, evaluaciones, fichas, diagnósticos, PACs y cronograma |
| `Administration` | Módulos, configuración global y auditoría |

Las rutas viven en `app/Modules/<Modulo>/Routes/api.php` y respetan el prefijo `api/v1`.
Toda la API protegida exige sesión de Sanctum (`auth:sanctum`) y **permisos** por endpoint
(`permission:<slug>`). El `RolePermissionSeeder` define 4 grupos de permisos y los roles
iniciales.

Flujo principal:

```mermaid
flowchart LR
    A[Vite / frontend] -- POST /api/v1/psychopedagogic/evaluations --> B[Laravel API :8000]
    B --> C[(PostgreSQL 17)]
    B -- Evento EvaluacionProcesada --> D[Reverb :8080]
    D -- WebSocket canal "evaluaciones" --> A
```

El frontend usa un proxy de desarrollo que reenvía `/api` a `http://backend:8000`
(env `VITE_API_PROXY_TARGET`) y el navegador se conecta a Reverb por `localhost:8080`.

## Requisitos del sistema

- Podman ≥ 5 (con la máquina iniciada) o Docker con Compose v2
- (Alternativa nativa) PHP ≥ 8.4, Composer ≥ 2, Node.js ≥ 20 y npm

## Puesta en marcha (todo en contenedores)

El proyecto se orquesta por completo con **Compose**: base de datos, API, Reverb y el
frontend se levantan juntos.

```bash
podman compose up -d --build   # o: docker compose up -d --build
podman compose ps              # 4 contenedores en estado healthy/up
```

El entrypoint del backend (`backend/docker/entrypoint.sh`) aplica automáticamente el
entorno de contenedor (`.env.docker`), espera a PostgreSQL, ejecuta
`php artisan migrate --force` y, si `SEED_DATA=true`, carga los datos de demostración.

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/v1 |
| WebSocket Reverb | ws://localhost:8080 |
| PostgreSQL | localhost:5432 (edusense/edusense/edusense_secret) |

Los datos persisten en el volumen `edusense_pgdata`.

Para **reiniciar la base desde cero**:

```bash
podman exec edusense-backend php artisan migrate:fresh --seed --force
```

### Cuentas de demostración

El seeder crea usuarios deterministas (contraseña `edusense-2026` para todas):

| Correo | Rol | Acceso principal |
| --- | --- | --- |
| `admin@edusense.local` | Administrador | Todos los módulos, usuarios, roles y permisos |
| `profesor@edusense.local` | Docente | Cursos, matrículas, asistencia, notas y reportes |
| `psicopedagogo@edusense.local` | Psicopedagoga | Evaluaciones, fichas, diagnósticos + CRUD e importación/exportación de estudiantes |
| `evaluador@edusense.local` | Docente evaluador | Encuestas y evaluación de estudiantes |

### Alternativa nativa (sin contenedores)

```bash
cd backend && composer install && php artisan serve --port=8000
# terminal 2: php artisan reverb:start
cd ../frontend && npm install && npm run dev
```

### Probar la demo

1. Abra `http://localhost:5173` e inicie sesión con una cuenta de demostración.
2. Añada o edite estudiantes en el módulo **Estudiantes** (o suba un CSV).
3. En el dashboard pulse **"Procesar evaluación de ejemplo"**.
4. La evaluación dispara una alerta (área de atención) y una **notificación sonora y
   visual**; el dashboard se actualiza en tiempo real tanto por la respuesta de la API
   como por el evento WebSocket `evaluacion.procesada`.

## Estructura del proyecto

```
EduSense/
├── README.md
├── .gitignore               # Ignorados globales (IDE, SO, logs, entornos)
├── compose.yaml             # Orquestación Podman/Compose: db, backend, reverb, frontend
├── docs/
│   └── API.md               # Documentación detallada de la API y WebSockets
├── promps.txt               # Especificación original del proyecto
├── backend/                 # API Laravel 13 + Reverb + Sanctum
│   ├── Dockerfile           # Imagen PHP 8.4 (pdo_pgsql, gd, zip, pcntl, etc.)
│   ├── .env.docker          # Entorno de contenedor aplicado por el entrypoint
│   ├── docker/entrypoint.sh  # Espera BD, migra, siembra y arranca
│   ├── app/Modules/
│   │   ├── System/          # Auth (login/logout/me), usuarios, roles, permisos
│   │   ├── Students/        # CRUD, importación y exportación de estudiantes
│   │   │   ├── Models/Student.php
│   │   │   ├── Services/StudentImportService.php
│   │   │   └── Routes/api.php
│   │   ├── Academic/        # Cursos, términos, materias, matrículas, asistencia, notas
│   │   ├── Psychopedagogic/ # Encuestas, evaluaciones, fichas, diagnósticos, PACs
│   │   │   └── Services/PsychopedagogicEvaluationService.php
│   │   └── Administration/  # Módulos, settings y auditoría (AuditService)
│   └── tests/Feature/       # 7 archivos, 33 pruebas (RBAC, auth, evaluaciones, estudiantes)
└── frontend/               # SPA React + TypeScript + Vite
    ├── Dockerfile          # Imagen Node (dev server con HMR)
    ├── src/
    │   ├── api.ts          # Cliente HTTP (axios) + funciones por recurso
    │   ├── echo.ts         # Cliente Laravel Echo / Reverb
    │   ├── i18n.ts         # Soporte es/en
    │   ├── locales/        # es.json y en.json
    │   ├── types.ts        # Tipos compartidos
    │   ├── auth/           # AuthContext (sesión) y RequireAuth (rutas protegidas)
    │   ├── pages/Login.tsx
    │   └── components/
    │       ├── Dashboard.tsx, Sidebar.tsx, Home.tsx, KpiCard.tsx, Placeholder.tsx
    │       ├── Students/   # StudentsPage + modales (form, importación, confirmación)
    │       └── ui/         # Kit UI: Button, Input, Select, Field, Modal, Pagination, Badge...
    └── vite.config.ts      # Proxy /api → http://backend:8000
```

## Reglas de negocio

- La evaluación agrupa respuestas (valor 1–5) por área según el `AreaEvaluacion` de la
  pregunta.
- Se considera **área en alerta** cuando el puntaje supera el umbral:
  - Atención y lectoescritura: **> 15**
  - Cálculo y habilidades motrices: **> 12**
- Si hay alertas, se genera el plan de intervención con **3 actividades** del área de
  mayor riesgo, programadas a **+7, +14 y +21 días**.
- Cada ejecución persiste las respuestas y agrega las nuevas sesiones al cronograma del
  estudiante.

### Módulo de estudiantes

- **Importación CSV**: columnas `document_number, first_name, last_name, birth_date`
  (separador `;` o `,`, con BOM UTF-8). Los registros existentes se **actualizan** por
  número de documento; las filas inválidas se reportan sin abortar la carga.
- El documento debe tener **7 a 10 dígitos**; opcionalmente la importación matricula a los
  estudiantes en un curso y período.
- **Exportación**: descarga CSV o XLSX respetando los filtros activos
  (búsqueda, estado y grado).
- La desactivación es **baja lógica** (`is_active = false`); el estudiante puede reactivarse.

## API y WebSocket

Todos los endpoints viven bajo `/api/v1`, exigen sesión de Sanctum y validan permisos.
(resumen — documentación completa en `docs/API.md`)

| Grupo | Rutas principales |
| --- | --- |
| System | `POST /login`, `POST /logout`, `GET /me`, CRUD de `users`, `roles`, `permissions` |
| Students | `GET/POST /students`, `GET/PUT/DELETE /students/{student}`, `GET /students/export`, `POST /students/import` |
| Academic | `GET/POST/PUT/DELETE /academic/{courses|terms|subjects|enrollments|attendance|grades}`, `POST /academic/grades/import` |
| Psychopedagogic | `GET /dashboard/summary`, `POST /psychopedagogic/evaluations`, CRUD de `surveys`, `activities`, `schedules`, `records`, `nee-categories`, `diagnostics`, `plans`, `observation-logs` |
| Administration | `GET /modules`, `GET /audit-logs`, `GET/PUT /settings` |

- Canal público: `evaluaciones`
- Evento: `evaluacion.procesada` (payload = resultado estructurado de la evaluación)

## Pruebas y calidad

Las pruebas automáticas usan **SQLite en memoria** (`backend/phpunit.xml`), por lo que no
requieren PostgreSQL y corren igual en el host y dentro del contenedor.

```bash
cd backend
php artisan test --compact      # Suite de pruebas (33 pruebas / 82 aserciones)

# Dentro del contenedor:
podman exec edusense-backend php artisan test --compact

cd ../frontend
npm run build                   # tsc + build de producción
npm run lint                    # oxlint
```

---

<p align="center">EduSense · Fanny Mayorga · 23-09-2026</p>