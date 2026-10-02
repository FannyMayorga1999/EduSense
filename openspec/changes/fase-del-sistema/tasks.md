# Tasks

## 1. Backend Architecture Documentation & Validation

- [ ] 1.1 Verify backend module structure exists under app/Modules/ (Academic, Administration, Psychopedagogic, Students, System) and confirm all controllers/models follow module conventions; verify with ind backend/app/Modules -name "*.php" | head -20
- [ ] 1.2 Review and document backend API controllers, requests, and models structure; verify all module API routes are properly namespaced and testable
- [ ] 1.3 Validate database migrations for menu items, student profile fields, and enrollment parallel field exist; verify schema matches intended structure
- [ ] 1.4 Run backend feature tests for Student, AcademicTerm, Pagination, and Menu modules to confirm they pass; verify test suite health

## 2. Frontend Architecture Documentation & Validation

- [ ] 2.1 Verify frontend feature-based structure under src/features/ exists for academic, psychopedagogic, students, system modules; verify with directory listing
- [ ] 2.2 Verify shared UI components exist under src/components/ui/ (Modal, Input, Field, Tooltip, MultiSelect, SidePanel, ActiveFilters, PaginatedTable, Pagination); verify each component is importable
- [ ] 2.3 Verify layout components (Sidebar, Home, UserMenu) exist and implement collapsible behavior; verify Sidebar state management for isCollapsed
- [ ] 2.4 Verify i18n files exist for en/es locales with translations for student module and navigation; verify locale files load correctly
- [ ] 2.5 Verify pages exist under src/pages/ for key routes (DashboardPage, StudentsPage, TermsPage, LoginPage, etc.); confirm routing configuration

## 3. Menu Navigation System

- [ ] 3.1 Verify Menu model, controller, factory, seeder, and migration exist in backend; verify API endpoint for menu index is functional
- [ ] 3.2 Verify MenuIndexTest passes confirming menu API behavior; run the specific menu test
- [ ] 3.3 Verify frontend menu service and hooks exist under src/features/system/menus/; verify menu data fetching works
- [ ] 3.4 Verify Sidebar implements collapsible toggle with tooltip display in collapsed state; test hover behavior shows tooltips
- [ ] 3.5 Verify menu grouping and active state highlighting work correctly in both expanded and collapsed modes

## 4. Student Management System

- [ ] 4.1 Verify Student model, controller, requests, and migration for profile fields exist; validate API endpoints for CRUD operations
- [ ] 4.2 Verify StudentModuleTest passes; run student feature tests to confirm full functionality
- [ ] 4.3 Verify Student UI components (StudentsListView, StudentForm, StudentFormModal, StudentDetailPanel, StudentImportModal) exist and render correctly
- [ ] 4.4 Verify student hooks (useStudents) and services work correctly; test filtering, pagination, and CRUD operations
- [ ] 4.5 Verify student styles and document type utilities exist

## 5. Academic Module Validation

- [ ] 5.1 Verify Academic module controllers and models (AcademicTerm, Enrollment, Course, Subject, Grade, Attendance) exist with proper structure
- [ ] 5.2 Verify AcademicTerm API endpoints and AcademicTermModuleTest pass
- [ ] 5.3 Verify frontend academic feature (TermsTable, useTerms, academic service) exists and functions correctly
- [ ] 5.4 Verify TermsPage renders correctly

## 6. Psychopedagogic Module Validation

- [ ] 6.1 Verify Psychopedagogic module controllers, models (ObservationLog, etc.) and API endpoints exist
- [ ] 6.2 Verify frontend psychopedagogic feature components (Dashboard, KpiCard), hooks, and services exist
- [ ] 6.3 Verify dashboard functionality works as expected

## 7. System & Auth Validation

- [ ] 7.1 Verify Auth context, hooks (useAuth, useLogin), services, and components (LoginForm, RequireAuth) exist and work correctly
- [ ] 7.2 Verify Role and Permission controllers exist with proper API structure
- [ ] 7.3 Verify User management components and routes exist
- [ ] 7.4 Verify Settings, Profile, Roles, Ajustes pages exist and are accessible

## 8. Shared Infrastructure Validation

- [ ] 8.1 Verify HTTP service, realtime service, pagination hooks, and utility functions exist and are properly configured
- [ ] 8.2 Verify TypeScript types in types.ts are comprehensive
- [ ] 8.3 Verify global styles and CSS modules load correctly
- [ ] 8.4 Verify build configurations (vite.config.ts, tsconfig.app.json, postcss.config.js) are correct
- [ ] 8.5 Run any available linting and typechecking commands if present in project; document results

## 9. Integration & Documentation Review

- [ ] 9.1 Review all created OpenSpec artifacts (proposal, specs, design, tasks) for completeness and accuracy
- [ ] 9.2 Verify the change captures all major refactoring work documented in git history (commits 80b40f5 through 77c1a60)
- [ ] 9.3 Confirm the modular architecture is consistently applied across backend and frontend
- [ ] 9.4 Validate that all new capabilities (student-management, menu-navigation, academic-term-management, psychopedagogic-tracking) and modified capabilities (system-auth, user-management) are properly specified
