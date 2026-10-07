# Spec Delta

## Purpose

Support psychopedagogic processes including diagnostics, observations, surveys, schedules, and specialized educational tracking.

## ADDED Requirements

### Requirement: System manages psychopedagogic records
The system SHALL store and manage psychopedagogic records for students.

#### Scenario: Create psychopedagogic record
- **WHEN** authorized personnel create a psychopedagogic record
- **THEN** the system SHALL persist the record with appropriate metadata

### Requirement: System tracks observations and diagnostics
The system SHALL allow recording observations, diagnostics, and related assessments.

#### Scenario: Record observation
- **WHEN** personnel record an observation for a student
- **THEN** the system SHALL store it with timestamp and context

### Requirement: System manages surveys
The system SHALL support creation and management of surveys for psychopedagogic assessment.

#### Scenario: Create survey
- **WHEN** authorized user creates a survey
- **THEN** the system SHALL store survey configuration and be available for use

### Requirement: System manages NEE categories
The system SHALL support special educational needs (NEE) categorization for students.

#### Scenario: Assign NEE category
- **WHEN** personnel assign a special educational needs category to a student
- **THEN** the system SHALL categorize and persist the assignment

#### Scenario: List NEE categories
- **WHEN** an authorized user requests NEE categories
- **THEN** the system SHALL return the available special educational needs categories
