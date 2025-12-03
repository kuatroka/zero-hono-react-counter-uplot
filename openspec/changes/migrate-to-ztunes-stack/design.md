## Context

This migration aligns the application with the ztunes reference architecture from Rocicorp (Zero's creators). The current app uses react-router-dom for routing, manually maintained dual schemas (Drizzle + Zero), and lacks user-scoped features. The target architecture provides instant navigation via viewport preloading, automated schema generation, and subscription-based user features.

**Stakeholders**: Developers, end users (subscribers)

**Constraints**:
- Must maintain Bun runtime compatibility
- Must preserve existing data in PostgreSQL
- Must support subscription-based access model
- Zero does not currently support SSR (use SPA mode)

## Goals / Non-Goals

**Goals**:
- Eliminate manual Zero schema maintenance via drizzle-zero
- Enable instant navigation with TanStack Router viewport preloading
- Scaffold custom mutators infrastructure for future user features
- Implement Better Auth for subscription-based access
- Align with ztunes patterns for future Zero updates

**Non-Goals**:
- SSR (Zero doesn't support it yet; use SPA mode)
- Migrate away from Hono for non-Zero API endpoints (keep for external integrations)
- Full OAuth provider support (email/password first, OAuth later)
- Mobile app support

## Decisions

### Decision 1: TanStack Start in SPA Mode
**What**: Use TanStack Start with `spa: { enabled: true }` in vite.config.ts
**Why**: Zero doesn't support SSR. SPA mode provides file-based routing and viewport preloading without SSR complexity.
**Alternatives**: 
- Plain TanStack Router (no Start) — loses API routes integration
- Keep react-router-dom — loses viewport preloading, type-safe params

### Decision 2: drizzle-zero for Schema Generation
**What**: Use drizzle-zero to auto-generate Zero schema from Drizzle schema
**Why**: Eliminates manual schema synchronization, reduces drift risk
**Alternatives**:
- Manual dual schemas — error-prone, maintenance burden
- Zero-first schema — loses Drizzle migration tooling

### Decision 3: Custom Mutators for User-Scoped Data
**What**: Use Zero custom mutators for favorites, not built-in table mutators
**Why**: userId must come from server session, not client request (security)
**Alternatives**:
- Built-in mutators with permissions — client can spoof userId
- REST API for favorites — bypasses Zero sync

### Decision 4: Better Auth over JWT
**What**: Replace JWT cookies with Better Auth session-based auth
**Why**: More secure (HTTP-only cookies), built-in session management, OAuth-ready
**Alternatives**:
- Keep JWT — less secure, manual session management
- Auth.js — more complex, less Zero-friendly

### Decision 5: Keep Hono for Non-Zero Endpoints
**What**: Keep Hono API server for external integrations, file uploads, webhooks
**Why**: TanStack Start API routes are for Zero endpoints; Hono is proven for edge runtime
**Alternatives**:
- Migrate everything to TanStack Start — unnecessary complexity
- Remove Hono entirely — loses external integration capability

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking change for routing | Phased migration, test each route |
| drizzle-zero version compatibility | Pin versions, test schema generation |
| Better Auth learning curve | Follow ztunes patterns exactly |
| Increased bundle size | TanStack tree-shakes well, monitor |
| Migration downtime | Feature flag new routes, gradual rollout |

## Migration Plan

### Phase 1: Schema Automation (Low Risk)
1. Install drizzle-zero
2. Add generate-zero-schema script
3. Generate schema.gen.ts
4. Update src/schema.ts to import from generated
5. Verify Zero queries still work
6. Remove manual schema definitions

### Phase 2: TanStack Router (Medium Risk)
1. Install @tanstack/react-router, @tanstack/react-start
2. Configure vite.config.ts with TanStack Start plugin (SPA mode)
3. Create app/routes/__root.tsx
4. Create ZeroInit wrapper component
5. Migrate routes one by one:
   - `/` → `app/routes/_layout/index.tsx`
   - `/assets` → `app/routes/_layout/assets.tsx`
   - `/assets/:code/:cusip` → `app/routes/_layout/assets.$code.$cusip.tsx`
   - `/superinvestors` → `app/routes/_layout/superinvestors.tsx`
   - `/superinvestors/:cik` → `app/routes/_layout/superinvestors.$cik.tsx`
6. Add route loaders with zero.run() for preloading
7. Configure defaultPreload: 'viewport'
8. Remove react-router-dom

### Phase 3: Better Auth (Higher Risk)
1. Install better-auth
2. Create auth/schema.ts with Better Auth tables
3. Create auth/auth.ts configuration
4. Add auth API routes in app/routes/api/auth/
5. Update ZeroInit to use Better Auth session
6. Update mutators to use session userId
7. Add login/logout UI
8. Remove JWT code and jose dependency

### Rollback Plan
- Each phase is independent; can rollback to previous phase
- Keep react-router-dom until TanStack Router is fully tested
- Keep JWT auth until Better Auth is fully tested
- Database migrations are additive (no destructive changes)

## Open Questions

1. **OAuth providers**: Which providers to support initially? (GitHub, Google?)
2. **Subscription tiers**: Different feature access per tier?
3. **Migration timeline**: All phases in one release or staged?
