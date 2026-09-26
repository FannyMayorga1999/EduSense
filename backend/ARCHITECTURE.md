# Arquitectura del Backend — EduSense

> **Autor:** Fanny Mayorga
> **Fecha:** 26-09-2026
> **Ámbito:** Laravel 13.17 · PHP 8.4.8 · Sanctum 4.3.3 · Reverb

Este documento describe la arquitectura modular del backend, las convenciones
que deben respetarse al añadir o modificar código, y el criterio canónico de
mapeo de dominios entre el backend (`app/Modules`) y el frontend (`src/features`).

---

## 1. Organización por módulos

Todo el código de aplicación vive bajo `backend/app/Modules/<Modulo>`. Cada
módulo es autocontenido: controladores de API, FormRequests, modelos Eloquent,
rutas, servicios y (si aplica) enums, eventos y middleware.

```
app/Modules/
├── Academic/            # Cursos, términos, materias, matrículas, asistencia, notas
│   ├── Enums/           # Status de dominio (EnrollmentStatus, AttendanceStatus)
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   └── Requests/
│   ├── Models/
│   ├── Routes/api.php
│   └── Services/        # Lógica de negocio (GradeImportService)
├── Administration/      # Módulos, settings y auditoría
│   ├── Http/Controllers/Api/
│   ├── Models/
│   ├── Routes/api.php
│   └── Services/        # AuditService
├── Psychopedagogic/     # Encuestas, evaluaciones, fichas, diagnósticos, PACs, cronograma
│   ├── Enums/           # DiagnosticSeverity, DifficultyLevel, EvaluationArea, PlanStatus, ScheduleStatus
│   ├── Events/          # EvaluationProcessed (dispara el evento de Reverb)
│   ├── Http/Controllers/Api/
│   ├── Http/Requests/
│   ├── Models/
│   ├── Routes/api.php
│   └── Services/        # PsychopedagogicEvaluationService
├── Students/            # Registro maestro de estudiantes
│   ├── Http/Controllers/Api/
│   ├── Http/Requests/
│   ├── Models/
│   ├── Routes/api.php
│   └── Services/        # StudentImportService
└── System/              # Auth, usuarios, roles, permisos y middleware transversal
    ├── Enums/           # UserRole, PermissionModule
    ├── Http/
    │   ├── Controllers/Api/
    │   ├── Middleware/  # EnsureUserHasPermission, EnsureUserIsActive
    │   └── Requests/
    ├── Models/          # User, Role, Permission
    └── Routes/api.php
```

### Convenciones de carpeta

| Carpeta | Rol |
| --- | --- |
| `Http/Controllers/Api/<Recurso>Controller.php` | Solo orquestan: validan, llaman servicios, devuelven el envelope del `Controller` base |
| `Http/Requests/<Verbo><Recurso>Request.php` | Validación + autorización (`authorize()` con permisos) por request |
| `Http/Middleware/` | Middleware transversal (solo existe en `System`) |
| `Models/` | Modelos Eloquent con `$table` con prefijo de módulo y atributos (`#[Fillable]`, `#[Hidden]`, `#[Appends]`) |
| `Services/` | Lógica de negocio reutilizable/importante; dependencias vía constructor |
| `Routes/api.php` | Rutas del módulo (requisito: el autodescubrimiento depende del `glob`) |
| `Enums/` | Enums de dominio (`TitleCase`, methods descriptivos) |
| `Events/` | Eventos de dominio (p. ej. `EvaluationProcessed`) |

### Namespaces

PSR-4 (`composer.json` autoload `"App\\": "app/"`):

```
App\Modules\<Modulo>\Http\Controllers\Api\<Recurso>Controller
App\Modules\<Modulo>\Http\Requests\<Verbo><Recurso>Request
App\Modules\<Modulo>\Models\<Modelo>
App\Modules\<Modulo>\Services\<Servicio>
Database\Factories\Modules\<Modulo>\Models\<Modelo>Factory     (factories)
Tests\Feature\<Modulo><Caso>Test                                  (tests)
```

### Tablas y factorías

- Cada tabla lleva el prefijo del módulo: `sys_*` (System), `std_*` (Students),
  `aca_*` (Academic), `psy_*` (Psychopedagogic), `adm_*` (Administration).
- Las migraciones usan ese prefijo en el nombre: `2026_09_20_030001_aca_create_courses_table.php`.
- Las factories se guardan reflejando la ruta del modelo:
  `database/factories/Modules/<Modulo>/Models/<Modelo>Factory.php`.

---

## 2. Rutas y APIs

### Autodescubrimiento

`routes/api.php` monta automáticamente cada `app/Modules/*/Routes/api.php` bajo
el prefijo `api/v1`:

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    foreach (glob(app_path('Modules/*/Routes/api.php')) ?: [] as $moduleRoutes) {
        require $moduleRoutes;
    }
});
```

Nuevo módulo ⇒ basta crear `app/Modules/<Modulo>/Routes/api.php`. Sin tocar
`routes/api.php`.

### Seguridad (todas las rutas de negocio)

- `auth:sanctum` (cookies de sesión) + `active` (`EnsureUserIsActive`) por defecto.
- RBAC por endpoint: middleware `permission:<slug>` (`EnsureUserHasPermission`).
- `Gate::before` en `AppServiceProvider` concede todo al rol `administrator`.
- Públicas: `POST /api/v1/login` (con `throttle:5,1`), `GET /sanctum/csrf-cookie`
  (ruta vendor de Sanctum usada por el frontend).

Aliases registrados en `bootstrap/app.php`: `permission`, `active`.

### Envelope HTTP

Todos los controladores extienden `App\Http\Controllers\Controller`, que expone:

| Método | Respuesta |
| --- | --- |
| `success($data, $message, $status)` | `{ success: true, message, data }` |
| `error($message, $status, $errors)` | `{ success: false, message, errors? }` |
| `paginateQuery($request, $query, $default, $max)` | Paginador respetando `page`/`per_page` (≤0 ⇒ todos, mantiene forma de `LengthAwarePaginator`) |

### Convenciones de nombre de ruta

| Módulo | Prefijo de nombre | Ejemplo |
| --- | --- | --- |
| `System` | `system.` | `system.users.index`, `system.roles.store` |
| `Administration` | `admin.` | `admin.settings.index`, `admin.audit-logs.index` |
| `Students` | `students.` | `students.index`, `students.import` |
| `Academic` | `academic.` | `academic.terms.update`, `academic.courses.index` |
| `Psychopedagogic` | `psychopedagogic.` | `psychopedagogic.evaluations.evaluate` |

Regla de estilo: `sustantivo.<recurso>.<acción(traducción opcional)>`.

---

## 3. Criterio canónico de dominios (frontend ↔ backend)

EduSense usa los mismos nombres de dominio en ambos lados. La correspondencia de
referencia es:

| Frontend (`src/features`) | Backend (`app/Modules`) | Responsabilidad |
| --- | --- | --- |
| `features/academic` | `Modules/Academic` | Cursos, términos, materias, matrículas, asistencia, notas |
| `features/students` | `Modules/Students` | Registro maestro: CRUD, importación y exportación |
| `features/psychopedagogic` | `Modules/Psychopedagogic` | Encuestas, evaluaciones, fichas, diagnósticos, PACs, cronograma |
| `features/system/auth` | `Modules/System` (`AuthController`) | login/logout/me/CSRF |
| `features/system/users` | `Modules/System` (`UserController`, `PermissionController`) | Usuarios y permisos |
| `features/system/roles` | `Modules/System` (`RoleController`) | Roles |
| `features/system/settings` | `Modules/Administration` (`SettingController`) | Configuración global |
| — (pendiente en frontend) | `Modules/Administration` (`ModuleController`, `AuditLogController`) | Módulos y auditoría |

**Nota de agrupación:** el frontend agrupa bajo `features/system` los cuatro
submódulos `auth`, `users`, `roles` y `settings`, mientras que el backend separa
`System` (auth/usuarios/roles/permisos) de `Administration` (settings/módulos/
auditoría). Esta división es **intencional y se mantiene**: `Administration`
agrupa la operación interna de la plataforma, no el acceso de usuarios. La
correspondencia `system/settings ↔ Administration` es el puente entre ambos.

### Alineación de endpoints (auditoría 26-09-2026)

Los `services` del frontend consumen las rutas y las respuestas correctas:

| Frontend (`src/features/*/services`) | Backend (ruta real) |
| --- | --- |
| `auth.service` → `/v1/login`, `/v1/logout`, `/v1/me` | `system.login`, `system.logout`, `system.me` |
| `students.service` → `/v1/students`, `/v1/students/{id}`, `/import`, `/export` | `students.*` |
| `academic.service` → `/v1/academic/courses`, `/v1/academic/terms` | `academic.*` |
| `dashboard.service` → `/v1/dashboard/summary` | `dashboard.summary` |
| `dashboard.service` → `/v1/psychopedagogic/evaluations`, `/v1/psychopedagogic/surveys` | `psychopedagogic.evaluations.*`, `psychopedagogic.surveys.*` |
| `http` → `GET /sanctum/csrf-cookie` | ruta vendor de Sanctum |

---

## 4. Capas de datos y pruebas

- **Migraciones:** prefijo `<modulo>_` en nombre y tabla. Seeders: `DatabaseSeeder`
  (datos demo) y `RolePermissionSeeder` (permisos/roles).
- **Factories:** obligatorias para cada modelo con `HasFactory`
  (`database/factories/Modules/...`).
- **Tests:** feature tests por módulo en `tests/Feature/<Modulo><Caso>Test.php`
  (PHPUnit, SQLite en memoria vía `phpunit.xml`). Estado: **50 pruebas / 151
  aserciones** (26-09-2026).

Verificación local:

```bash
cd backend
php artisan test          # suite completa
vendor/bin/pint --test    # estilo (Pint)
php artisan route:list --path=api
```

---

## 5. Hallazgos de la auditoría y recomendaciones

Estado general: **verde** (50/50 tests, Pint limpio, 105 rutas API, endpoints
del frontend alineados). Puntos menores a considerar:

1. **Ruta CSRF redundante.** `GET /api/v1/csrf-cookie` (`system.csrf`, System
   module) no la usa el frontend, que llama a `/sanctum/csrf-cookie` (Sanctum).
   Opción: eliminar la ruta propia o documentarla como respaldo.
2. **Prefijos de nombre de ruta inconsistentes.** `System` usa `system.*` y
   `Administration` `admin.*`; los demás módulos derivan del nombre del módulo.
   Recomendación (bajo riesgo): unificar `Administration` a `administration.*`.
3. **Endpoint de dashboard duplicado.** `dashboard.summary`
   (`GET /v1/dashboard/summary`) y `psychopedagogic.dashboard`
   (`GET /v1/psychopedagogic/dashboard`) ejecutan el **mismo** método
   `DashboardController@summary`. Mantener uno solo (el primero es el que usa
   el frontend).
4. **Fronteras de UI pendientes.** Los endpoints de Academic restantes
   (enrollments, grades, attendance, subjects) y de Psychopedagogic
   (surveys/schedule CRUD) aún no tienen feature en el frontend
   (`pages/SurveysPage` y `pages/SchedulePage` son placeholders).