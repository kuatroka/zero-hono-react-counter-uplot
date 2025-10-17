# Implementation Tasks: Quarterly Counter Charts

## Phase 1: Database & Schema Setup

### Task 1.1: Create Database Migration
- [ ] Create `docker/migrations/02_add_counter_quarters.sql`
- [ ] Add `value_quarters` table definition
- [ ] Add `counters` table definition
- [ ] Add seed data for quarters (1999Q1-2025Q4)
- [ ] Add seed data for main counter (initial value 0)
- [ ] Test migration runs successfully

### Task 1.2: Update Zero Schema
- [ ] Add `valueQuarter` table to `src/schema.ts`
- [ ] Add `counter` table to `src/schema.ts`
- [ ] Update `createSchema()` to include new tables
- [ ] Export TypeScript types for new entities
- [ ] Update permissions if needed (likely ANYONE_CAN for read-only quarters)
- [ ] Test schema compiles without errors

## Phase 2: API Implementation

### Task 2.1: Counter API Endpoints
- [ ] Create `api/routes/counter.ts`
- [ ] Implement `GET /api/counter` handler
- [ ] Implement `POST /api/counter` handler (inc/dec)
- [ ] Add input validation for operation type
- [ ] Add error handling and appropriate status codes
- [ ] Test endpoints with curl/Postman

### Task 2.2: Quarters API Endpoint
- [ ] Create `api/routes/quarters.ts`
- [ ] Implement `GET /api/quarters` handler
- [ ] Query database and format as `{ labels: [], values: [] }`
- [ ] Add error handling
- [ ] Test endpoint returns correct data format

### Task 2.3: Register API Routes
- [ ] Update `api/index.ts` to import new routes
- [ ] Mount counter routes at `/api/counter`
- [ ] Mount quarters routes at `/api/quarters`
- [ ] Test routes are accessible

## Phase 3: Client Services

### Task 3.1: Counter Service
- [ ] Create `src/services/counter.ts`
- [ ] Implement `getValue()` function
- [ ] Implement `increment()` function
- [ ] Implement `decrement()` function
- [ ] Add TypeScript types for responses
- [ ] Add error handling

### Task 3.2: Quarters Service
- [ ] Create `src/services/quarters.ts`
- [ ] Implement `getChartSeries()` function
- [ ] Define `ChartSeries` interface
- [ ] Add error handling

## Phase 4: Routing Setup

### Task 4.1: Install TanStack Router
- [ ] Add `@tanstack/react-router` to package.json
- [ ] Add `@tanstack/router-devtools` to package.json
- [ ] Run `bun install`

### Task 4.2: Configure Router
- [ ] Create `src/routes/__root.tsx` (root layout)
- [ ] Create `src/routes/index.tsx` (home route - move App.tsx content)
- [ ] Create `src/routes/counter.tsx` (counter route)
- [ ] Update `src/main.tsx` to use TanStack Router
- [ ] Add router provider and route tree
- [ ] Test navigation between routes

### Task 4.3: Add Navigation Links
- [ ] Add link to `/counter` in home page
- [ ] Add back link in counter page
- [ ] Style navigation links

## Phase 5: Chart Components

### Task 5.1: Install uPlot
- [ ] Add `uplot` to package.json
- [ ] Run `bun install`
- [ ] Import uPlot CSS in `src/main.tsx` or `src/index.css`

### Task 5.2: Chart Factory
- [ ] Create `src/components/charts/factory.ts`
- [ ] Define `ChartKind` type
- [ ] Define `ChartMeta` interface
- [ ] Create `chartMetaList` array with 10 chart configs
- [ ] Implement `makeBaseOptions()` helper
- [ ] Implement `labelsToIndices()` helper
- [ ] Implement `movingAverage()` helper
- [ ] Implement `cumulative()` helper
- [ ] Implement `baseAxes()` helper
- [ ] Create factory functions for each chart type:
  - [ ] `bars` factory
  - [ ] `line` factory
  - [ ] `area` factory
  - [ ] `scatter` factory
  - [ ] `step` factory
  - [ ] `spline` factory
  - [ ] `cumulative` factory
  - [ ] `movingavg` factory
  - [ ] `band` factory
  - [ ] `dual` factory
- [ ] Implement `createQuarterChart()` main factory
- [ ] Implement `updateQuarterChart()` update function
- [ ] Test each chart type renders correctly

### Task 5.3: QuarterChart Component
- [ ] Create `src/components/charts/QuarterChart.tsx`
- [ ] Define component props interface
- [ ] Create container ref for uPlot
- [ ] Implement useEffect for chart lifecycle
- [ ] Create chart on mount
- [ ] Update chart when props change
- [ ] Destroy chart on unmount
- [ ] Handle responsive sizing
- [ ] Test component renders and updates correctly

## Phase 6: Counter Page

### Task 6.1: CounterPage Component
- [ ] Create `src/components/CounterPage.tsx`
- [ ] Add state for counter value
- [ ] Add state for loading
- [ ] Add state for error
- [ ] Add state for chart series data
- [ ] Implement data fetching on mount
- [ ] Implement increment handler
- [ ] Implement decrement handler
- [ ] Add optimistic updates
- [ ] Add error handling and rollback
- [ ] Render counter controls (buttons and value display)
- [ ] Render primary chart (full width)
- [ ] Render grid of 9 remaining charts
- [ ] Add loading state UI
- [ ] Add error state UI
- [ ] Test all interactions work correctly

### Task 6.2: Styling
- [ ] Add counter page styles to `src/index.css`
- [ ] Style counter controls (buttons, value display)
- [ ] Style charts grid layout
- [ ] Style chart cards
- [ ] Add responsive breakpoints
- [ ] Test on different screen sizes

## Phase 7: Integration & Testing

### Task 7.1: Database Setup
- [ ] Run database migration
- [ ] Verify tables created
- [ ] Verify seed data inserted
- [ ] Check quarterly data (107 records)
- [ ] Check counter initialized to 0

### Task 7.2: API Testing
- [ ] Test GET /api/counter returns initial value
- [ ] Test POST /api/counter with "inc" operation
- [ ] Test POST /api/counter with "dec" operation
- [ ] Test invalid operation returns 400
- [ ] Test GET /api/quarters returns correct format
- [ ] Verify 107 quarters in response

### Task 7.3: UI Testing
- [ ] Test navigation from home to counter page
- [ ] Test navigation from counter back to home
- [ ] Test counter increment button
- [ ] Test counter decrement button
- [ ] Test loading states display correctly
- [ ] Test error states display correctly
- [ ] Verify all 10 charts render
- [ ] Test responsive layout on mobile
- [ ] Test responsive layout on tablet
- [ ] Test responsive layout on desktop

### Task 7.4: Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

## Phase 8: Documentation

### Task 8.1: Update Project Documentation
- [ ] Update `openspec/project.md` with new features
- [ ] Add uPlot to tech stack
- [ ] Add TanStack Router to tech stack
- [ ] Document counter and quarters tables
- [ ] Document new API endpoints
- [ ] Update domain context

### Task 8.2: Update README
- [ ] Add counter feature to README
- [ ] Document how to access counter page
- [ ] Add screenshots of charts (optional)
- [ ] Document new dependencies

### Task 8.3: Code Comments
- [ ] Add JSDoc comments to public APIs (if needed)
- [ ] Document complex chart calculations
- [ ] Add inline comments for non-obvious logic

## Phase 9: Polish & Optimization

### Task 9.1: Performance Optimization
- [ ] Memoize chart components where appropriate
- [ ] Optimize chart re-renders
- [ ] Test with React DevTools Profiler
- [ ] Ensure no memory leaks from uPlot instances

### Task 9.2: Accessibility
- [ ] Add ARIA labels to buttons
- [ ] Add ARIA labels to charts
- [ ] Test keyboard navigation
- [ ] Test with screen reader (optional)

### Task 9.3: Error Handling
- [ ] Add user-friendly error messages
- [ ] Add retry logic for failed API calls (optional)
- [ ] Add fallback UI for chart rendering errors

## Phase 10: Deployment Preparation

### Task 10.1: Environment Variables
- [ ] Verify no new environment variables needed
- [ ] Update .env.example if needed

### Task 10.2: Build Testing
- [ ] Run production build
- [ ] Test built application
- [ ] Verify all routes work in production build
- [ ] Verify charts render in production build

### Task 10.3: Git & PR
- [ ] Stage all changes
- [ ] Commit with descriptive message
- [ ] Push to feature branch
- [ ] Create pull request
- [ ] Add PR description with screenshots
- [ ] Request code review

## Estimated Timeline

- **Phase 1**: 2-3 hours (Database & Schema)
- **Phase 2**: 2-3 hours (API Implementation)
- **Phase 3**: 1 hour (Client Services)
- **Phase 4**: 2-3 hours (Routing Setup)
- **Phase 5**: 4-6 hours (Chart Components)
- **Phase 6**: 3-4 hours (Counter Page)
- **Phase 7**: 2-3 hours (Integration & Testing)
- **Phase 8**: 1-2 hours (Documentation)
- **Phase 9**: 1-2 hours (Polish & Optimization)
- **Phase 10**: 1 hour (Deployment Preparation)

**Total Estimated Time**: 19-29 hours

## Dependencies Between Phases

- Phase 2 depends on Phase 1 (database must exist)
- Phase 3 depends on Phase 2 (API must exist)
- Phase 5 depends on Phase 4 (routing must be set up)
- Phase 6 depends on Phases 3 and 5 (services and charts must exist)
- Phase 7 depends on all previous phases
- Phases 8-10 can be done in parallel after Phase 7

## Success Criteria

- [ ] All 10 chart types render correctly with quarterly data
- [ ] Counter increment/decrement works reliably
- [ ] Navigation between routes is smooth
- [ ] No console errors or warnings
- [ ] Responsive layout works on all screen sizes
- [ ] Code follows project conventions (no comments, TypeScript strict)
- [ ] All tests pass
- [ ] Documentation is complete and accurate
