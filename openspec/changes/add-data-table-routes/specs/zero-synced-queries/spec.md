# zero-synced-queries Specification Delta

## Purpose

This delta adds Zero schema definitions and query patterns for the `assets` and `superinvestors` tables to support data table views.

## ADDED Requirements

### Requirement: Assets Schema Definition

The system SHALL define a Zero schema for the assets table.

#### Scenario: Define assets table schema

- **WHEN** the Zero schema is initialized
- **THEN** it SHALL include an `assets` table definition
- **AND** SHALL define columns: id (number), asset (string), assetName (string from asset_name)
- **AND** SHALL set id as the primary key
- **AND** SHALL map snake_case database columns to camelCase TypeScript properties

#### Scenario: Export Assets type

- **WHEN** TypeScript code imports from schema.ts
- **THEN** it SHALL export an `Asset` type
- **AND** the type SHALL be inferred from the assets table definition
- **AND** SHALL provide type safety for asset data

#### Scenario: Configure assets permissions

- **WHEN** permissions are defined for the assets table
- **THEN** it SHALL allow ANYONE_CAN select
- **AND** SHALL not allow insert, update, or delete (read-only)

### Requirement: Superinvestors Schema Definition

The system SHALL define a Zero schema for the superinvestors table.

#### Scenario: Define superinvestors table schema

- **WHEN** the Zero schema is initialized
- **THEN** it SHALL include a `superinvestors` table definition
- **AND** SHALL define columns: id (number), cik (string), cikName (string from cik_name), cikTicker (string from cik_ticker), activePeriods (string from active_periods)
- **AND** SHALL set id as the primary key
- **AND** SHALL map snake_case database columns to camelCase TypeScript properties

#### Scenario: Export Superinvestor type

- **WHEN** TypeScript code imports from schema.ts
- **THEN** it SHALL export a `Superinvestor` type
- **AND** the type SHALL be inferred from the superinvestors table definition
- **AND** SHALL provide type safety for superinvestor data

#### Scenario: Configure superinvestors permissions

- **WHEN** permissions are defined for the superinvestors table
- **THEN** it SHALL allow ANYONE_CAN select
- **AND** SHALL not allow insert, update, or delete (read-only)

### Requirement: Query Assets

The system SHALL support querying assets using Zero's query builder.

#### Scenario: Query all assets

- **WHEN** a component queries assets using `z.query.assets`
- **THEN** Zero SHALL return all assets from the local cache
- **AND** SHALL sync with PostgreSQL in the background
- **AND** SHALL provide reactive updates when data changes

#### Scenario: Sort assets

- **WHEN** a component queries assets with `.orderBy('asset', 'asc')`
- **THEN** Zero SHALL return assets sorted by asset identifier ascending
- **AND** SHALL support sorting by any column
- **AND** SHALL support 'asc' and 'desc' directions

#### Scenario: Search assets

- **WHEN** a component queries assets with `.where('asset', 'ILIKE', '%query%')`
- **THEN** Zero SHALL return assets matching the search query
- **AND** SHALL perform case-insensitive substring matching
- **AND** SHALL support searching by asset or asset_name

### Requirement: Query Superinvestors

The system SHALL support querying superinvestors using Zero's query builder.

#### Scenario: Query all superinvestors

- **WHEN** a component queries superinvestors using `z.query.superinvestors`
- **THEN** Zero SHALL return all superinvestors from the local cache
- **AND** SHALL sync with PostgreSQL in the background
- **AND** SHALL provide reactive updates when data changes

#### Scenario: Sort superinvestors

- **WHEN** a component queries superinvestors with `.orderBy('cik_name', 'asc')`
- **THEN** Zero SHALL return superinvestors sorted by name ascending
- **AND** SHALL support sorting by any column
- **AND** SHALL support 'asc' and 'desc' directions

#### Scenario: Search superinvestors

- **WHEN** a component queries superinvestors with `.where('cik_name', 'ILIKE', '%query%')`
- **THEN** Zero SHALL return superinvestors matching the search query
- **AND** SHALL perform case-insensitive substring matching
- **AND** SHALL support searching by cik, cik_name, or cik_ticker

## MODIFIED Requirements

None. All requirements are additions to the existing zero-synced-queries capability.

## REMOVED Requirements

None.
