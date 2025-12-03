## Why

The application currently uses react-router-dom, manual Zero schema definitions, and lacks user-scoped features (favorites/bookmarks). Aligning with the ztunes reference architecture provides: (1) viewport-based link preloading for instant navigation, (2) automated Zero schema generation from Drizzle, (3) type-safe file-based routing, and (4) custom mutators for subscription-based user features.

## What Changes

### Phase 1: Schema Automation (High Priority)
- Install `drizzle-zero` for automated Zero schema generation
- Add `generate-zero-schema` script to package.json
- Generate `src/zero/schema.gen.ts` from `src/db/schema.ts`
- Refactor `src/schema.ts` to import from generated file
- Remove manual Zero schema definitions

### Phase 2: TanStack Router Migration
- **BREAKING**: Replace `react-router-dom` with `@tanstack/react-router`
- Install `@tanstack/react-start` (SPA mode)
- Convert routes to file-based structure under `app/routes/`
- Create `ZeroInit` wrapper component with router context
- Add route loaders that call `zero.run()` for viewport preloading
- Configure `defaultPreload: 'viewport'` for automatic link preloading

### Phase 3: Better Auth Integration
- Install `better-auth` package
- Create auth configuration in `auth/auth.ts`
- Add auth API routes via TanStack Start
- Replace JWT cookie auth with Better Auth sessions
- Configure cookie forwarding to Zero endpoints

## Impact

- **Affected specs**: 
  - `drizzle-schema-management` (MODIFIED: add drizzle-zero generation)
  - `tanstack-start-api-routes` (existing spec, will implement)
  - `better-auth-integration` (existing spec, will implement)
  - `zero-custom-mutators` (existing spec, scaffold only)
  - NEW: `tanstack-router` (file-based routing with preloading)
  - NEW: `drizzle-zero-schema` (automated schema generation)

- **Affected code**:
  - `src/main.tsx` → `app/routes/__root.tsx` (routing migration)
  - `src/schema.ts` → `src/zero/schema.gen.ts` (auto-generated)
  - `api/` → `app/routes/api/` (API route migration)
  - NEW: `zero/mutators.ts` (scaffold for future features)
  - NEW: `auth/` (Better Auth configuration)
  - `vite.config.ts` (TanStack Start plugin)
  - `package.json` (new dependencies)
