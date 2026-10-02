# Spec Delta

## Purpose

Handle academic periods and terms with enrollment tracking capabilities for the academic lifecycle.

## ADDED Requirements

### Requirement: System manages academic terms
The system SHALL maintain academic terms/periods with defined timeframes and metadata.

#### Scenario: Create academic term
- **WHEN** authorized user creates a new academic term
- **THEN** the system SHALL persist the term with the specified details

#### Scenario: List academic terms
- **WHEN** user requests academic terms
- **THEN** the system SHALL return a list of available academic terms

### Requirement: System tracks enrollments
The system SHALL track student enrollments associated with academic terms including parallel/section information.

#### Scenario: Enroll student in term
- **WHEN** a student is enrolled in an academic term
- **THEN** the system SHALL record the enrollment with associated metadata
