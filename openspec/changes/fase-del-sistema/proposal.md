# Proposal

## Why

The system has undergone a comprehensive refactoring and feature expansion to establish a modular monolithic architecture (Backend: Laravel with Modules, Frontend: React + TypeScript + Vite with feature-based organization). This change documents the evolution from the initial codebase to the current modular structure with student management, academic modules, psychopedagogic functionality, and system administration features including navigation/menu system.

## What Changes

### Architecture & Structure
- Backend restructuring: Migrated from a flat structure to modular architecture under app/Modules/ (Academic with Students submodule, Administration, Psychopedagogic, System)
- Frontend restructuring: Reorganized from component-based to feature-based architecture under src/features/ with dedicated pages, components, hooks, and services (students as a sub-feature of academic)
- Shared UI components: Established reusable UI component library under src/shared/components/ui/
- Layout & routing: Implemented collapsible sidebar navigation with role-based access

### Student Module
- Student management: Full CRUD API and UI for student records with profile fields
- Student forms: Enhanced form with document types, validation, and modal-based editing
- Student detail panel: Detail drawer for quick student inspection
- Import functionality: Student import modal for bulk operations
- Enhanced filtering: Multi-select filters and active filters UI
- i18n support: Internationalization for student module (en/es)

### Academic Module
- Academic terms: Management of academic periods/terms
- Enrollment: Student enrollment tracking with parallel field
- Courses, Subjects, Grades, Attendance: Core academic entities with API endpoints

### Psychopedagogic Module
- Diagnostics, observations, surveys: Support for psychopedagogic processes
- Schedules, activities, curricular adaptations: Specialized tracking
- Dashboard & KPIs: Analytics for psychopedagogic data
- NEE categories: Support for special educational needs categorization

### System Administration
- Roles & Permissions: RBAC implementation with Role and Permission controllers
- Users: User management system
- Menu system: Dynamic collapsible sidebar with menu items stored in database
- Audit logs: System audit trail
- Settings & Profile: User preferences and system configuration

### Infrastructure & Quality
- API structure: Standardized API controllers with proper request validation
- Database migrations: Schema evolution with new fields and tables
- Testing: Feature tests for modules (Student, AcademicTerm, Pagination, Menu)
- Pagination: Reusable pagination components and hooks
- HTTP services: Centralized HTTP client with authentication
- Realtime support: WebSocket/realtime service infrastructure

## Capabilities

### New Capabilities
- student-management: Manages student lifecycle (create, read, update, delete, import) with profile data, document validation, and filtering
- menu-navigation: Provides dynamic collapsible sidebar navigation with hierarchical menu items, icons, tooltips, and role-based visibility
- academic-term-management: Handles academic periods and terms with enrollment tracking
- psychopedagogic-tracking: Supports diagnostics, observations, surveys, and specialized educational tracking

### Modified Capabilities
- system-auth: Enhanced authentication context and role-based access control integrated with menu system
- user-management: Extended user administration with profile and settings

## Impact

### Backend
- Laravel app restructured into domain modules under app/Modules/
- New migrations: sys_menu_items, student profile fields, enrollment parallel field
- New API routes for menu management
- Feature tests added for key functionality

### Frontend
- Complete feature-based architecture migration
- New UI components (Button, Card, Field, Input, Modal, MultiSelect, PaginatedTable, Tooltip, Alert, StatusBadge, ActiveFilters)
- Collapsible Sidebar with tooltips in collapsed state
- i18n support (English/Spanish)
- Enhanced styling with CSS modules for students
- Type system extensions

### Database
- sys_menu_items table for dynamic navigation
- Extended students table with profile fields
- Extended enrollments table with parallel field

### DevOps
- Docker compose configuration
- Updated build configurations (Vite, PostCSS, TypeScript)
