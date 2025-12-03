## ADDED Requirements

### Requirement: File-Based Routing

The system SHALL use TanStack Router with file-based routing for all application pages, replacing react-router-dom.

#### Scenario: Create route from file

- **WHEN** a developer creates a file in `app/routes/`
- **THEN** it SHALL automatically become a route
- **AND** the file path SHALL determine the URL path
- **AND** `_layout.tsx` SHALL define shared layout
- **AND** `$param.tsx` SHALL define dynamic route segments

#### Scenario: Type-safe route parameters

- **WHEN** a route has dynamic segments like `$code.$cusip`
- **THEN** TypeScript SHALL infer parameter types
- **AND** `Route.useParams()` SHALL return typed parameters
- **AND** invalid parameter access SHALL produce compile-time errors

#### Scenario: Route generation

- **WHEN** the application builds
- **THEN** TanStack Router plugin SHALL generate `routeTree.gen.ts`
- **AND** all routes SHALL be type-safe
- **AND** route changes SHALL trigger regeneration in dev mode

### Requirement: Viewport-Based Link Preloading

The system SHALL preload route data when links enter the viewport, enabling instant navigation.

#### Scenario: Configure viewport preloading

- **WHEN** the router is configured
- **THEN** `defaultPreload` SHALL be set to `'viewport'`
- **AND** `defaultPreloadStaleTime` SHALL be set to `0`
- **AND** `defaultPreloadGcTime` SHALL be set to `0`

#### Scenario: Preload on link visibility

- **WHEN** a Link component enters the viewport
- **THEN** TanStack Router SHALL call the route's loader
- **AND** the loader SHALL call `zero.run(query)` to sync data
- **AND** data SHALL be available before user clicks

#### Scenario: Instant navigation

- **WHEN** user clicks a preloaded link
- **THEN** navigation SHALL be instant (next-frame)
- **AND** data SHALL already be in Zero's local cache
- **AND** no loading spinner SHALL be shown

### Requirement: Route Loaders with Zero Integration

The system SHALL use route loaders to preload Zero queries before navigation.

#### Scenario: Define route loader

- **WHEN** a route needs data
- **THEN** it SHALL define a `loader` function
- **AND** the loader SHALL receive `context.zero` from router context
- **AND** the loader SHALL call `context.zero.run(query)`

#### Scenario: Loader with route parameters

- **WHEN** a route loader needs route parameters
- **THEN** it SHALL use `loaderDeps` to declare dependencies
- **AND** `deps` SHALL be passed to the loader function
- **AND** the loader SHALL use deps to construct the query

#### Scenario: Loader error handling

- **WHEN** a loader fails
- **THEN** the error SHALL be caught by error boundary
- **AND** an error UI SHALL be displayed
- **AND** the application SHALL NOT crash

### Requirement: Zero Router Context

The system SHALL provide Zero instance to all routes via TanStack Router context.

#### Scenario: Define router context type

- **WHEN** the router is created
- **THEN** `RouterContext` interface SHALL include `zero: Zero<Schema, Mutators>`
- **AND** context SHALL be typed with `createRootRouteWithContext<RouterContext>()`

#### Scenario: Initialize Zero in context

- **WHEN** `ZeroInit` component mounts
- **THEN** it SHALL create Zero instance with schema, userID, and mutators
- **AND** SHALL call `router.update({ context: { zero } })`
- **AND** SHALL call `router.invalidate()` to trigger loaders

#### Scenario: Access Zero in routes

- **WHEN** a route component needs Zero
- **THEN** it SHALL call `useRouter().options.context.zero`
- **AND** SHALL have full type safety for queries and mutations

### Requirement: SPA Mode Configuration

The system SHALL use TanStack Start in SPA mode without server-side rendering.

#### Scenario: Configure SPA mode in Vite

- **WHEN** vite.config.ts is configured
- **THEN** `tanstackStart({ spa: { enabled: true } })` SHALL be used
- **AND** `target` SHALL be set to `'vercel'` for deployment
- **AND** `tsr.srcDirectory` SHALL be set to `'app'`

#### Scenario: No SSR rendering

- **WHEN** the application loads
- **THEN** all rendering SHALL happen client-side
- **AND** routes SHALL have `ssr: false`
- **AND** Zero queries SHALL execute on client only

### Requirement: Search Parameter Validation

The system SHALL validate and type search parameters using TanStack Router's validateSearch.

#### Scenario: Define search schema

- **WHEN** a route accepts search parameters
- **THEN** it SHALL define `validateSearch` function
- **AND** SHALL validate and transform search params
- **AND** SHALL return typed search object

#### Scenario: Access validated search params

- **WHEN** a component needs search parameters
- **THEN** it SHALL call `Route.useSearch()`
- **AND** SHALL receive typed, validated parameters
- **AND** invalid params SHALL be handled gracefully

### Requirement: Navigation Components

The system SHALL use TanStack Router's Link component for all internal navigation.

#### Scenario: Replace react-router Link

- **WHEN** internal navigation is needed
- **THEN** `<Link>` from `@tanstack/react-router` SHALL be used
- **AND** SHALL support `to`, `params`, and `search` props
- **AND** SHALL trigger viewport preloading

#### Scenario: Active link styling

- **WHEN** a Link matches the current route
- **THEN** it SHALL receive active state
- **AND** SHALL support `activeProps` for styling
- **AND** SHALL support `inactiveProps` for non-active state
