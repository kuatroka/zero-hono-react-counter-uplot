## MODIFIED Requirements

### Requirement: Data Freshness API Endpoint

The system SHALL expose a `/api/data-freshness` endpoint that returns the last data load date from DuckDB's `high_level_totals` table and the current database manifest version.

#### Scenario: Successful freshness check
- **WHEN** a GET request is made to `/api/data-freshness`
- **THEN** the response SHALL be JSON with `lastDataLoadDate` (ISO date string or null), `timestamp` (Unix ms), and `dbVersion` (integer or null)

#### Scenario: Include dbVersion from manifest
- **WHEN** a GET request is made to `/api/data-freshness`
- **AND** the `db_manifest.json` file exists and is readable
- **THEN** the response SHALL include `dbVersion` from the manifest's `version` field

#### Scenario: Missing manifest returns null dbVersion
- **WHEN** a GET request is made to `/api/data-freshness`
- **AND** the `db_manifest.json` file does not exist or cannot be read
- **THEN** the response SHALL have `dbVersion: null`

#### Scenario: Empty high_level_totals table
- **WHEN** a GET request is made to `/api/data-freshness`
- **AND** the `high_level_totals` table is empty
- **THEN** the response SHALL have `lastDataLoadDate: null`

#### Scenario: DuckDB query error
- **WHEN** a GET request is made to `/api/data-freshness`
- **AND** the DuckDB query fails
- **THEN** the response SHALL be HTTP 500 with error details
