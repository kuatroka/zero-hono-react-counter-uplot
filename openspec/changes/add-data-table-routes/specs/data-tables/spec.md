# data-tables Specification

## Purpose

Defines the requirements for data table UI components that display tabular data with search, sorting, and pagination capabilities. This specification ensures consistent table implementations across the application using shadcn/ui patterns and Zero-sync queries.

## ADDED Requirements

### Requirement: Generic DataTable Component

The system SHALL provide a reusable generic DataTable component that accepts typed column definitions and data arrays.

#### Scenario: Define table columns

- **WHEN** a developer creates a data table page
- **THEN** they SHALL define column configurations with type-safe column definitions
- **AND** each column SHALL specify a key, header label, and optional render function
- **AND** columns MAY be marked as sortable or searchable
- **AND** TypeScript SHALL enforce type safety between data and column definitions

#### Scenario: Render table with data

- **WHEN** the DataTable component receives data and column definitions
- **THEN** it SHALL render a shadcn/ui Table component
- **AND** SHALL render table headers from column definitions
- **AND** SHALL render table rows from data array
- **AND** SHALL apply theme-aware styling using CSS variables

#### Scenario: Handle empty data

- **WHEN** the DataTable component receives an empty data array
- **THEN** it SHALL display an empty state message
- **AND** SHALL not render pagination controls
- **AND** SHALL not render the table body

### Requirement: Column Sorting

The system SHALL support sorting table data by clicking column headers.

#### Scenario: Sort by column ascending

- **WHEN** a user clicks a sortable column header
- **THEN** the table SHALL sort data by that column in ascending order
- **AND** SHALL display an ascending sort indicator (↑)
- **AND** SHALL re-render the table with sorted data
- **AND** sorting SHALL complete in < 100ms

#### Scenario: Sort by column descending

- **WHEN** a user clicks a column header that is already sorted ascending
- **THEN** the table SHALL sort data by that column in descending order
- **AND** SHALL display a descending sort indicator (↓)
- **AND** SHALL re-render the table with sorted data

#### Scenario: Remove sort

- **WHEN** a user clicks a column header that is already sorted descending
- **THEN** the table SHALL return to default sort order
- **AND** SHALL remove the sort indicator
- **AND** SHALL re-render the table with default data order

#### Scenario: Sort text columns

- **WHEN** sorting a text column
- **THEN** the sort SHALL use locale-aware string comparison
- **AND** SHALL handle null/undefined values consistently
- **AND** SHALL be case-insensitive

#### Scenario: Sort numeric columns

- **WHEN** sorting a numeric column
- **THEN** the sort SHALL use numeric comparison
- **AND** SHALL handle null/undefined values consistently
- **AND** SHALL sort numbers correctly (not as strings)

### Requirement: Search Filtering

The system SHALL provide a search input that filters table data by matching search query against searchable columns.

#### Scenario: Filter by search query

- **WHEN** a user types in the search input
- **THEN** the table SHALL filter data to rows matching the search query
- **AND** SHALL search across all columns marked as searchable
- **AND** SHALL use case-insensitive substring matching
- **AND** SHALL reset pagination to page 1
- **AND** filtering SHALL complete in < 100ms

#### Scenario: Debounce search input

- **WHEN** a user types rapidly in the search input
- **THEN** the search SHALL be debounced with 300ms delay
- **AND** SHALL not trigger filtering on every keystroke
- **AND** SHALL show loading indicator during debounce period (optional)

#### Scenario: Clear search

- **WHEN** a user clears the search input
- **THEN** the table SHALL display all data (unfiltered)
- **AND** SHALL maintain current sort order
- **AND** SHALL reset pagination to page 1

#### Scenario: No search results

- **WHEN** a search query matches no rows
- **THEN** the table SHALL display a "no results" message
- **AND** SHALL not render the table body
- **AND** SHALL not render pagination controls

### Requirement: Pagination Controls

The system SHALL provide pagination controls for navigating through large datasets.

#### Scenario: Display pagination info

- **WHEN** the table has data
- **THEN** it SHALL display "Showing X-Y of Z rows" text
- **AND** X SHALL be the first row index on current page
- **AND** Y SHALL be the last row index on current page
- **AND** Z SHALL be the total number of filtered rows

#### Scenario: Navigate to next page

- **WHEN** a user clicks the "Next" button
- **THEN** the table SHALL advance to the next page
- **AND** SHALL update the displayed rows
- **AND** SHALL update the pagination info
- **AND** SHALL disable "Next" button if on last page
- **AND** page change SHALL complete in < 50ms

#### Scenario: Navigate to previous page

- **WHEN** a user clicks the "Previous" button
- **THEN** the table SHALL go back to the previous page
- **AND** SHALL update the displayed rows
- **AND** SHALL update the pagination info
- **AND** SHALL disable "Previous" button if on first page

#### Scenario: Navigate to first page

- **WHEN** a user clicks the "First" button
- **THEN** the table SHALL jump to page 1
- **AND** SHALL update the displayed rows
- **AND** SHALL update the pagination info

#### Scenario: Navigate to last page

- **WHEN** a user clicks the "Last" button
- **THEN** the table SHALL jump to the last page
- **AND** SHALL update the displayed rows
- **AND** SHALL update the pagination info

#### Scenario: Change rows per page

- **WHEN** a user selects a different rows per page value
- **THEN** the table SHALL update the page size
- **AND** SHALL reset to page 1
- **AND** SHALL update the displayed rows
- **AND** SHALL recalculate total pages
- **AND** SHALL support values: 10, 20, 50, 100

### Requirement: Responsive Layout

The system SHALL adapt table layout for different screen sizes.

#### Scenario: Mobile layout (< 640px)

- **WHEN** the viewport width is less than 640px
- **THEN** the search input SHALL be full width
- **AND** the table SHALL scroll horizontally if columns don't fit
- **AND** pagination controls SHALL stack vertically
- **AND** rows per page selector SHALL be full width
- **AND** all interactive elements SHALL be at least 44px tall (touch-friendly)

#### Scenario: Tablet layout (640px - 1024px)

- **WHEN** the viewport width is between 640px and 1024px
- **THEN** the search input SHALL have constrained width (max 384px)
- **AND** the table SHALL display all columns
- **AND** pagination controls SHALL be inline

#### Scenario: Desktop layout (> 1024px)

- **WHEN** the viewport width is greater than 1024px
- **THEN** the table SHALL display full layout
- **AND** all controls SHALL be inline
- **AND** the table SHALL not scroll horizontally

### Requirement: Assets Table Page

The system SHALL provide a page at `/assets` route that displays all assets in a data table.

#### Scenario: Display assets table

- **WHEN** a user navigates to `/assets`
- **THEN** the page SHALL render the AssetsTable component
- **AND** SHALL display page title "Assets"
- **AND** SHALL display page description "Browse and search all assets"
- **AND** SHALL query assets using Zero: `z.query.assets.orderBy('asset', 'asc')`
- **AND** SHALL pass assets data to DataTable component

#### Scenario: Define assets columns

- **WHEN** the AssetsTable component renders
- **THEN** it SHALL define columns: ID, Asset, Asset Name
- **AND** all columns SHALL be sortable
- **AND** Asset and Asset Name columns SHALL be searchable
- **AND** ID column SHALL display numeric ID
- **AND** Asset column SHALL display asset identifier
- **AND** Asset Name column SHALL display full asset name

#### Scenario: Search assets

- **WHEN** a user searches in the assets table
- **THEN** the search SHALL filter by asset OR asset_name
- **AND** SHALL use case-insensitive substring matching
- **AND** SHALL display matching results instantly

### Requirement: Superinvestors Table Page

The system SHALL provide a page at `/superinvestors` route that displays all superinvestors in a data table.

#### Scenario: Display superinvestors table

- **WHEN** a user navigates to `/superinvestors`
- **THEN** the page SHALL render the SuperinvestorsTable component
- **AND** SHALL display page title "Superinvestors"
- **AND** SHALL display page description "Browse and search institutional investors (13F filers)"
- **AND** SHALL query superinvestors using Zero: `z.query.superinvestors.orderBy('cik_name', 'asc')`
- **AND** SHALL pass superinvestors data to DataTable component

#### Scenario: Define superinvestors columns

- **WHEN** the SuperinvestorsTable component renders
- **THEN** it SHALL define columns: ID, CIK, Name, Ticker, Active Periods
- **AND** all columns SHALL be sortable
- **AND** CIK, Name, and Ticker columns SHALL be searchable
- **AND** ID column SHALL display numeric ID
- **AND** CIK column SHALL display CIK number
- **AND** Name column SHALL display investor name
- **AND** Ticker column SHALL display ticker symbol (if available)
- **AND** Active Periods column SHALL display period range

#### Scenario: Search superinvestors

- **WHEN** a user searches in the superinvestors table
- **THEN** the search SHALL filter by cik OR cik_name OR cik_ticker
- **AND** SHALL use case-insensitive substring matching
- **AND** SHALL display matching results instantly

### Requirement: Navigation Integration

The system SHALL integrate data table routes into the application navigation.

#### Scenario: Add Assets navigation link

- **WHEN** the GlobalNav component renders
- **THEN** it SHALL display an "Assets" link
- **AND** the link SHALL navigate to `/assets`
- **AND** SHALL highlight when the current route is `/assets`
- **AND** SHALL use consistent styling with other nav links

#### Scenario: Add Superinvestors navigation link

- **WHEN** the GlobalNav component renders
- **THEN** it SHALL display a "Superinvestors" link
- **AND** the link SHALL navigate to `/superinvestors`
- **AND** SHALL highlight when the current route is `/superinvestors`
- **AND** SHALL use consistent styling with other nav links

#### Scenario: Responsive navigation

- **WHEN** the viewport is mobile size
- **THEN** navigation links SHALL not overflow
- **AND** SHALL wrap or collapse as needed
- **AND** SHALL remain accessible and clickable

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
