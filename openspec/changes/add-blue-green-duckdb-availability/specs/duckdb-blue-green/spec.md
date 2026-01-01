## ADDED Requirements

### Requirement: DuckDB Blue-Green Database Pattern

The system SHALL support a blue-green deployment pattern for DuckDB databases to ensure 100% availability during ETL operations.

#### Scenario: Two database files maintained
- **WHEN** the blue-green pattern is enabled
- **THEN** the system SHALL maintain two DuckDB files: `{basename}_a.duckdb` and `{basename}_b.duckdb`
- **AND** only one file SHALL be active at any time

#### Scenario: Manifest tracks active database
- **WHEN** the blue-green pattern is enabled
- **THEN** a JSON manifest file `db_manifest.json` SHALL exist in the DuckDB directory
- **AND** the manifest SHALL contain `active` ("a" or "b"), `version` (integer), and `lastUpdated` (ISO timestamp)

### Requirement: Manifest-Based Connection Resolution

The system SHALL read the manifest file to determine which DuckDB database file to connect to.

#### Scenario: Read manifest on connection
- **WHEN** the app requests a DuckDB connection
- **THEN** the system SHALL read `db_manifest.json` from the DuckDB directory
- **AND** the system SHALL connect to the database file indicated by the `active` field

#### Scenario: Fallback when manifest missing
- **WHEN** the app requests a DuckDB connection
- **AND** `db_manifest.json` does not exist or cannot be read
- **THEN** the system SHALL fall back to the `DUCKDB_PATH` environment variable
- **AND** the system SHALL log a warning about missing manifest

#### Scenario: Detect version change
- **WHEN** the app has an active DuckDB connection
- **AND** the manifest `version` changes
- **THEN** the system SHALL close the current connection
- **AND** the system SHALL open a new connection to the new active database

### Requirement: ETL Writes to Inactive Database

The ETL pipeline SHALL write to the inactive database to avoid locking the active database.

#### Scenario: Determine inactive database
- **WHEN** the ETL pipeline starts a build
- **THEN** it SHALL read the manifest to determine the currently active database
- **AND** it SHALL write to the OTHER database (inactive)

#### Scenario: Atomic manifest switch
- **WHEN** the ETL pipeline completes a successful build
- **THEN** it SHALL atomically update the manifest to switch the `active` field
- **AND** it SHALL increment the `version` field
- **AND** it SHALL update the `lastUpdated` timestamp

#### Scenario: Failed build does not switch
- **WHEN** the ETL pipeline fails during build
- **THEN** it SHALL NOT update the manifest
- **AND** the active database SHALL remain unchanged
- **AND** users SHALL continue seeing the previous data

### Requirement: Zero-Downtime Availability

The web app SHALL remain fully available during ETL operations.

#### Scenario: App accessible during ETL
- **WHEN** the ETL pipeline is actively writing to the inactive database
- **THEN** the web app SHALL continue serving requests from the active database
- **AND** no "Could not set lock" errors SHALL occur
- **AND** all API endpoints SHALL remain responsive

#### Scenario: Seamless switchover
- **WHEN** the ETL pipeline completes and switches the manifest
- **AND** the web app detects the version change
- **THEN** the web app SHALL close the old connection
- **AND** the web app SHALL open a new connection to the newly active database
- **AND** subsequent requests SHALL return the new data
