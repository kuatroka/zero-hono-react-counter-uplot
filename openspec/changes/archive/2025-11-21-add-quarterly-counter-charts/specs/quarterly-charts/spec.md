# Quarterly Charts Specification

## Overview
Visualization system for displaying quarterly data using uPlot charting library. Provides 10 different chart types to visualize the same quarterly dataset, demonstrating various data presentation techniques.

## Database Schema

### Table: `value_quarters`
```sql
CREATE TABLE IF NOT EXISTS value_quarters (
  quarter TEXT PRIMARY KEY,
  value DOUBLE PRECISION NOT NULL
);

-- Seed deterministic random values for quarters 1999Q1..2025Q4
SELECT setseed(0.42);
WITH years AS (
  SELECT generate_series(1999, 2025) AS y
), quarters AS (
  VALUES (1),(2),(3),(4)
), ranges AS (
  SELECT y, q
  FROM years CROSS JOIN quarters
  WHERE (y > 1999 OR q >= 1)
    AND (y < 2025 OR q <= 4)
), to_insert AS (
  SELECT
    (y::text || 'Q' || q::text) AS quarter,
    (random() * (500000000000.0 - 1.0) + 1.0) AS value
  FROM ranges
)
INSERT INTO value_quarters (quarter, value)
SELECT quarter, value FROM to_insert
ON CONFLICT (quarter) DO NOTHING;
```

**Columns:**
- `quarter` (TEXT, PRIMARY KEY) - Quarter identifier in format "YYYYQN" (e.g., "2024Q3")
- `value` (DOUBLE PRECISION) - Metric value for the quarter

**Seed Data:**
- 107 quarters from 1999Q1 to 2025Q4
- Values range from 1 to 500 billion (deterministic random with seed 0.42)

## API Endpoint

### GET /api/quarters
Retrieve quarterly data formatted for charting.

**Request:**
- Method: `GET`
- Path: `/api/quarters`
- Headers: None required
- Body: None

**Response:**
- Status: `200 OK`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "labels": ["1999Q1", "1999Q2", "1999Q3", "...", "2025Q4"],
    "values": [123456789.12, 234567890.23, 345678901.34, "...", 456789012.45]
  }
  ```

**Response Schema:**
- `labels` (string[]) - Array of quarter labels in chronological order
- `values` (number[]) - Array of corresponding values in same order

**Error Responses:**
- `500 Internal Server Error` - Database query failed
  ```json
  {
    "error": "Failed to fetch quarterly data"
  }
  ```

## Chart Types

### 1. Bars (Column Chart)
**Purpose:** Baseline columnar view of raw quarterly values  
**Visual:** Vertical bars with fill and stroke  
**Configuration:**
- Bar width: 60% of available space
- Fill: `rgba(37,99,235,0.35)` (blue with transparency)
- Stroke: `#2563eb` (solid blue)
- No points shown

### 2. Line Chart
**Purpose:** Line emphasizing momentum quarter-to-quarter  
**Visual:** Connected line with visible points  
**Configuration:**
- Stroke: `#2563eb` (blue)
- Width: 2px
- Points: Visible, size 6px

### 3. Area Chart
**Purpose:** Line with soft fill for magnitude emphasis  
**Visual:** Line with filled area below  
**Configuration:**
- Stroke: `#7c3aed` (purple)
- Width: 2px
- Fill: `rgba(124,58,237,0.25)` (purple with transparency)
- Points: Visible, size 5px

### 4. Scatter Plot
**Purpose:** Points-only distribution across quarters  
**Visual:** Individual points without connecting lines  
**Configuration:**
- Stroke: `#16a34a` (green)
- Width: 0 (no line)
- Points: Visible, size 7px
- Path: Points-only mode

### 5. Step Chart
**Purpose:** Discrete shifts per quarter  
**Visual:** Stepped line showing discrete changes  
**Configuration:**
- Stroke: `#dc2626` (red)
- Width: 2px
- Path: Stepped with align=1
- Points: Visible, size 4px

### 6. Spline Chart
**Purpose:** Smoothed interpolation  
**Visual:** Smooth curved line through data points  
**Configuration:**
- Stroke: `#ea580c` (orange)
- Width: 2px
- Path: Spline interpolation
- Points: Hidden

### 7. Cumulative Chart
**Purpose:** Running total alongside raw values  
**Visual:** Two series - quarterly and cumulative  
**Configuration:**
- Series 1 (Quarterly): Stroke `#2563eb`, width 1px
- Series 2 (Cumulative): Stroke `#111827`, width 2px
- Data: Original values + running sum

### 8. Moving Average Chart
**Purpose:** Smoother trend indicator  
**Visual:** Raw values with 4-quarter moving average overlay  
**Configuration:**
- Series 1 (Value): Stroke `#7c3aed`, width 1px
- Series 2 (MA(4)): Stroke `#111827`, width 2px
- Data: Original values + 4-quarter moving average

### 9. Band Chart
**Purpose:** ±10% confidence band around MA(4)  
**Visual:** Two lines with shaded area between  
**Configuration:**
- Series 1 (MA Lo): Stroke `#a5b4fc`, width 1px
- Series 2 (MA Hi): Stroke `#6366f1`, width 1px
- Band: Fill `rgba(99,102,241,0.12)` between series
- Data: MA(4) * 0.9 and MA(4) * 1.1

### 10. Dual Axis Chart
**Purpose:** Raw vs MA(8) with separate Y-axes  
**Visual:** Two series with independent scales  
**Configuration:**
- Series 1 (Value): Stroke `#22c55e`, width 1px, left axis
- Series 2 (MA(8)): Stroke `#1f2937`, width 2px, right axis
- Scales: Independent Y-axes for each series

## Chart Metadata

```typescript
export interface ChartMeta {
  key: string;
  title: string;
  description: string;
  height?: number;
}

export const chartMetaList: ChartMeta[] = [
  { 
    key: "bars", 
    title: "Quarterly Values · Column", 
    description: "Baseline columnar view of raw quarterly values." 
  },
  { 
    key: "line", 
    title: "Quarterly Trend · Line", 
    description: "Line emphasizing momentum quarter-to-quarter." 
  },
  { 
    key: "area", 
    title: "Quarterly Total · Area", 
    description: "Line with soft fill for magnitude emphasis." 
  },
  { 
    key: "scatter", 
    title: "Quarterly Distribution · Scatter", 
    description: "Points-only distribution across quarters." 
  },
  { 
    key: "step", 
    title: "Quarterly Changes · Step", 
    description: "Discrete shifts per quarter." 
  },
  { 
    key: "spline", 
    title: "Quarterly Trend · Spline", 
    description: "Smoothed interpolation." 
  },
  { 
    key: "cumulative", 
    title: "Cumulative Performance", 
    description: "Running total alongside raw values." 
  },
  { 
    key: "movingavg", 
    title: "Moving Average (4)", 
    description: "Smoother trend indicator." 
  },
  { 
    key: "band", 
    title: "MA Confidence Band", 
    description: "±10% band around MA(4)." 
  },
  { 
    key: "dual", 
    title: "Dual Axis", 
    description: "Raw vs MA(8) with separate axis." 
  },
];
```

## Component Architecture

### QuarterChart Component
Location: `src/components/charts/QuarterChart.tsx`

**Props:**
```typescript
interface QuarterChartProps {
  kind: ChartKind;
  title: string;
  labels: string[];
  values: number[];
}
```

**Responsibilities:**
- Create uPlot instance on mount
- Update chart data when props change
- Destroy chart instance on unmount
- Handle responsive sizing
- Manage canvas element lifecycle

**Lifecycle:**
```typescript
useEffect(() => {
  if (!containerRef.current) return;
  
  const chart = createQuarterChart(
    kind,
    containerRef.current,
    labels,
    values,
    title
  );
  
  return () => chart.destroy();
}, [kind, labels, values, title]);
```

### Chart Factory
Location: `src/components/charts/factory.ts`

**Exports:**
- `ChartKind` - Union type of all chart types
- `ChartMeta` - Metadata interface for chart configuration
- `chartMetaList` - Array of all chart configurations
- `createQuarterChart()` - Factory function to create uPlot instance
- `updateQuarterChart()` - Update existing chart with new data

**Factory Pattern:**
```typescript
export function createQuarterChart(
  kind: ChartKind,
  el: HTMLElement,
  labels: string[],
  values: number[],
  title?: string
): uPlot {
  const factory = factories[kind];
  const width = el.clientWidth;
  const base = makeBaseOptions({ title: title ?? "Quarterly", labels, width });
  const built = factory(labels, values);
  
  // Merge base options with chart-specific configuration
  if (built.extra?.bands) base.bands = built.extra.bands;
  if (built.extra?.scales) base.scales = { ...base.scales, ...built.extra.scales };
  if (built.extra?.axes) base.axes = built.extra.axes;
  
  base.series = [{}, ...built.series];
  const data: uPlot.AlignedData = [labelsToIndices(labels), ...built.data];
  
  return new uPlot(base, data, el);
}
```

## Data Transformations

### Moving Average (MA)
```typescript
function movingAverage(values: number[], window = 4): number[] {
  return values.map((_, idx) => {
    const start = Math.max(0, idx - window + 1);
    const slice = values.slice(start, idx + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
```

### Cumulative Sum
```typescript
function cumulative(values: number[]): number[] {
  let total = 0;
  return values.map((v) => (total += v));
}
```

### Label to Index Mapping
```typescript
function labelsToIndices(labels: string[]): number[] {
  return labels.map((_, i) => i);
}
```

## uPlot Configuration

### Base Options
```typescript
{
  title: "Chart Title",
  width: 600,
  height: 320,
  padding: [12, 28, 40, 10],
  legend: { show: true },
  scales: { 
    x: { time: false }, 
    y: {} 
  },
  axes: [
    {
      stroke: "#9ca3af",
      grid: { stroke: "rgba(148,163,184,0.2)" },
      ticks: { stroke: "#d1d5db" },
      values: (_, ticks) => ticks.map(t => labels[Math.round(t)] ?? "")
    },
    { 
      stroke: "#9ca3af", 
      grid: { stroke: "rgba(148,163,184,0.2)" } 
    }
  ]
}
```

### Data Format
uPlot expects column-oriented data:
```typescript
const data: uPlot.AlignedData = [
  [0, 1, 2, 3, ...],           // X-axis indices
  [val1, val2, val3, ...],     // Series 1 values
  [val1, val2, val3, ...]      // Series 2 values (if multi-series)
];
```

## Layout & Styling

### Counter Page Layout
```css
.counter-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.counter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0;
}

.counter-button {
  width: 48px;
  height: 48px;
  font-size: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #1f2937;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.counter-value {
  font-size: 24px;
  width: 80px;
  text-align: center;
}

.charts-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
}

.chart-card {
  border: 1px solid #e5e7eb;
  padding: 8px;
  border-radius: 6px;
}

.chart-card h3 {
  margin: 4px 0;
}

.chart-card p {
  margin: 4px 0;
  color: #6b7280;
}
```

### Primary Chart (Full Width)
The first chart (bars) displays full-width above the grid of remaining 9 charts.

## Performance Considerations

### uPlot Optimization
- Canvas-based rendering (not SVG) for high performance
- Efficient data updates via `setData()` method
- Minimal re-renders with React memoization
- Responsive sizing without excessive recalculations

### Data Loading
- Single API call fetches all quarterly data
- Data cached in component state
- No polling or real-time updates (static quarterly data)

### Chart Lifecycle
- Charts created once on mount
- Updated in-place when data changes
- Properly destroyed on unmount to prevent memory leaks

## Testing

### Visual Testing
1. Verify all 10 chart types render correctly
2. Check responsive behavior on different screen sizes
3. Confirm colors and styling match specification
4. Validate axis labels and legends

### Data Testing
1. Verify 107 quarters displayed (1999Q1 to 2025Q4)
2. Check moving average calculations
3. Validate cumulative sum accuracy
4. Confirm band calculations (±10% of MA)

### Integration Testing
1. Test data fetching from API
2. Verify error handling for failed requests
3. Check loading states
4. Validate chart updates when data changes

## Dependencies

### npm Packages
- `uplot` (^1.6.32) - Charting library
- `@types/uplot` (optional) - TypeScript definitions

### CSS Import
```typescript
import "uplot/dist/uPlot.min.css";
```

## Browser Compatibility
- Modern browsers with Canvas support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility Considerations
- Add ARIA labels to charts
- Provide text alternatives for visual data
- Ensure keyboard navigation for controls
- Consider adding data table view option

## Future Enhancements
- Interactive tooltips on hover
- Zoom and pan capabilities
- Export chart as PNG/SVG
- Date range filtering
- Custom color themes
- Chart comparison mode
- Real-time data updates via WebSocket
- Responsive chart height based on viewport
