# Design

## Context

See proposal.md - Why. This documents a comprehensive architectural evolution of the EduSense system from a flat structure to a modular architecture across both backend (Laravel) and frontend (React/TypeScript), establishing feature-based organization, reusable UI components, and dynamic navigation.

## Goals / Non-Goals

**Goals:**
- Document the modular monolithic architecture (backend modules, frontend feature modules)
- Establish clear separation of concerns between domains
- Provide reusable UI component patterns
- Enable dynamic navigation with collapsible sidebar
- Support internationalization
- Maintain testability with feature tests

**Non-Goals:**
- Microservices migration (staying with modular monolith)
- Complete UI redesign beyond structural organization
- Performance optimization beyond established patterns

## Decisions

### Decision 1: Modular Backend Architecture
- **Choice**: Organize backend code under pp/Modules/<Domain> with Http/Controllers, Models, Requests, Routes as needed
- **Rationale**: Domain-driven organization improves maintainability and scalability for educational domain
- **Alternatives Considered**: Flat structure (rejected - poor for growing domain complexity), full DDD layers (rejected - overkill for current scope)

### Decision 2: Feature-Based Frontend Architecture
- **Choice**: Organize frontend under src/features/<Domain> with components, hooks, services, index exports
- **Rationale**: Co-locates domain logic, improves code splitting potential, aligns with backend modules
- **Alternatives Considered**: Page-based only (rejected - mixes concerns), atomic design only (rejected - less domain-centric)

### Decision 3: Shared UI Component Library
- **Choice**: Centralize reusable components in src/shared/components/ui/ (Button, Card, Field, Input, Modal, MultiSelect, PaginatedTable, Tooltip, Alert, StatusBadge, etc.)
- **Rationale**: Promotes consistency, reusability, and maintainable styling
- **Alternatives Considered**: Component-per-feature (rejected - duplication), external UI library (rejected - custom design needs)

### Decision 4: Dynamic Menu System
- **Choice**: Store menu items in database (sys_menu_items table) with hierarchical structure and icons
- **Rationale**: Enables flexible navigation, role-based visibility, easier administration
- **Alternatives Considered**: Hardcoded routes (rejected - inflexible), config file (rejected - requires redeploy)

### Decision 5: Collapsible Sidebar with Tooltips
- **Choice**: Implement stateful sidebar with conditional rendering and tooltip display on hover when collapsed
- **Rationale**: Maximizes screen real estate while maintaining discoverability via tooltips
- **Alternatives Considered**: Always expanded (rejected - space constraints), always collapsed (rejected - poor UX)

## Risks / Trade-offs

- [Risk: Module coupling] Mitigation: Use well-defined interfaces, services per feature, avoid cross-module tight coupling
- [Risk: Migration complexity] Mitigation: Maintain backward compatibility where possible, comprehensive feature tests
- [Risk: Database-driven menus add query overhead] Mitigation: Cache menu structure if needed, keep hierarchy shallow
- [Risk: Feature-based structure may scatter shared utilities] Mitigation: Keep shared utilities in src/shared/ (components, hooks, utils)
