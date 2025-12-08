## ADDED Requirements

### Requirement: Investor Activity Drilldown Table on Asset Detail

The asset detail page SHALL provide a tabular drilldown of superinvestors who opened or closed positions for the current asset, driven by interactions with the investor-activity charts.

#### Scenario: Default latest-quarter opened positions

- **WHEN** a user opens an asset detail page for ticker `T`
- **AND** investor activity data exists for multiple quarters
- **THEN** the page SHALL determine the latest available quarter `Q_latest` for `T`
- **AND** the drilldown table below the charts SHALL show superinvestors that **opened** positions in `T` during `Q_latest`.

#### Scenario: Click on opened bar filters table

- **WHEN** a user clicks the **upper (opened)** bar for quarter `Q` in the investor-activity chart for ticker `T`
- **THEN** the selection state SHALL update to `{ ticker: T, quarter: Q, action: "open" }`
- **AND** the drilldown table SHALL refresh to show only superinvestors that **opened** positions in `T` during `Q`.

#### Scenario: Click on closed bar filters table

- **WHEN** a user clicks the **lower (closed)** bar for quarter `Q` in the investor-activity chart for ticker `T`
- **THEN** the selection state SHALL update to `{ ticker: T, quarter: Q, action: "close" }`
- **AND** the drilldown table SHALL refresh to show only superinvestors that **closed** positions in `T` during `Q`.

#### Scenario: Table design reuse

- **WHEN** the drilldown table is rendered
- **THEN** it SHALL reuse the same general table design as the `/assets` and `/superinvestors` pages (row density, typography, header styling)
- **AND** it SHOULD support basic sorting by superinvestor name and/or CIK where technically feasible.

## MODIFIED Requirements

### Requirement: Asset Detail Investor Activity Visualization

The asset detail page SHALL present investor activity for the current asset using chart visualizations and, in addition, a drilldown table that surfaces underlying superinvestor-level records for the currently selected quarter and action.

#### Scenario: Charts and table remain in sync

- **WHEN** the user changes the selected quarter or action via chart interactions
- **THEN** the charts and the drilldown table SHALL reflect the same underlying data (same ticker, same quarter, same action filter).
