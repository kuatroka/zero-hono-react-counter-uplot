# Project Context

## Purpose
A real-time analytics application demonstrating Zero (Rocicorp's sync framework) capabilities. The app showcases:
- **Entities Management:** Global search across 1000 investors and assets with instant Zero-sync queries
- **Counter & Charts:** Interactive counter with 10 different uPlot chart visualizations
- **Real-time Sync:** Data synchronization between multiple clients using PostgreSQL and Zero Cache
- **Messages Demo:** Original Zero example with CRUD operations, filtering, relationships, and JWT-based authentication

## Tech Stack

### Frontend
- React 19.2.0
- TypeScript 5.5.3
- Vite 5.4.1 (dev server on port 3003)
- React Router 7.9.4 (client-side routing)
- @rocicorp/zero 0.24 (real-time sync)
- uPlot 1.6.32 (charting library)
- shadcn/ui + Tailwind 4.1.14 (styling)
- Radix UI (headless component primitives)
- Lucide React (icon library)
- js-cookie (client-side cookie management)

### Backend
- Hono 4.6.6 (edge runtime framework)
- Bun (JavaScript runtime, replaces Node.js)
- API server on port 4000
- jose (JWT signing and verification)

### Database & Sync
- PostgreSQL with Write-Ahead Logging (WAL)
- Zero Cache server (port 4848)
- Litestream for backup/replication

### Deployment & Infrastructure
- SST 3.9.33 (Serverless Stack for AWS)
- Vercel (alternative deployment target)
- AWS ECS with Fargate
- S3 for replication backups
- Podman/Docker for local development

### Development Tools
- ESLint 9.9.0 with flat config
- TypeScript ESLint
- React Hooks ESLint plugin
- Concurrently (parallel dev processes)
- Autocannon (load testing)

## Project Conventions

### Code Style
- TypeScript with strict typing throughout
- ES2022 target for build and optimization
- No explanatory comments or docstrings in code
- Flat ESLint configuration (eslint.config.js)
- React hooks rules enforced
- camelCase for variables and functions
- PascalCase for React components and types
- snake_case for database column names (mapped via Zero schema)

### Architecture Patterns
- **Client-side**: React with Zero provider for real-time sync, custom hooks pattern (useZero<Schema>)
- **API**: Hono edge runtime handlers with minimal middleware
- **Data Layer**: Zero schema definitions with relationships and permissions
- **Authentication**: JWT-based with row-level permissions defined in schema
- **State Management**: Zero handles all data state, React hooks for UI state
- **Database Schema**: Defined client-side with Zero schema builder, synced to PostgreSQL
- **Relationships**: First-class relationships defined in Zero schema (one-to-many, many-to-many)
- **Permissions**: Declarative row-level permissions using Zero's permission system

### Zero-Sync Data Access Patterns (CRITICAL)

**This is a local-first application.** All data queries MUST use Zero's query builder, NOT custom REST API endpoints.

#### ✅ CORRECT: Use Zero Queries
```typescript
// Reading data
const [entities] = useQuery(z.query.entities.where('name', 'ILIKE', `%${search}%`).limit(10));

// Search functionality
const [results] = useQuery(z.query.entities.where('name', 'ILIKE', `%${query}%`).limit(5));

// Preloading for instant queries
z.preload(z.query.entities.orderBy('created_at', 'desc').limit(500));
```

**Benefits:**
- Data synced to local IndexedDB automatically
- Queries execute instantly against local cache
- Zero handles server sync in background
- No network latency for cached data
- Reactive updates when data changes

#### ❌ WRONG: Custom REST API Endpoints
```typescript
// ❌ DO NOT create custom data query endpoints
app.get("/api/search", async (c) => { /* ... */ });
app.get("/api/entities", async (c) => { /* ... */ });

// ❌ DO NOT fetch data via REST
const data = await fetch('/api/entities').then(r => r.json());
```

**Why this is wrong:**
- Bypasses Zero-sync entirely
- Requires network round-trip every time
- No local caching or reactive updates
- Defeats local-first architecture

#### When to Use Hono API Endpoints
Use Hono API endpoints ONLY for:
- **Authentication/Authorization** (JWT generation, login/logout)
- **External integrations** (third-party API calls, webhooks)
- **File uploads/downloads** (binary data handling)
- **Server-side computations** (heavy processing, report generation)

#### Decision Rule
```
Need to access data?
├─ Database data that syncs? → Use Zero query
├─ Search/filter/sort? → Use Zero query
├─ Authentication? → Use API endpoint
├─ External service? → Use API endpoint
├─ File upload/download? → Use API endpoint
└─ Heavy server computation? → Use API endpoint
```

**Reference:** See `src/components/GlobalSearch.tsx` for correct Zero-based search implementation.

### Testing Strategy
- Autocannon available for load testing
- Manual testing via UI interactions
- Multi-tab testing for real-time sync verification

### Git Workflow
- Feature branch workflow (e.g., feature/migrate-to-bun-support-in-hono-based-app-20251017-225722)
- Descriptive branch names with dates
- Commit messages describe the change (e.g., "initial commit - all work with postgres and node.js")
- Stage files selectively with git add
- Always use explicit branch names in push commands

## Domain Context

### Zero Sync Framework
Zero is a real-time sync framework that maintains a local SQLite replica on the client and syncs changes bidirectionally with PostgreSQL. Key concepts:
- **Schema**: Client-side schema definition that must be equal to or subset of server schema
- **Relationships**: First-class relationships between tables (one, many)
- **Permissions**: Row-level security defined declaratively with expressions
- **Queries**: Reactive queries with .where(), .orderBy(), .related() methods
- **Mutations**: z.mutate.table.insert/update/delete operations
- **Zero Cache**: Server component that manages sync between clients and PostgreSQL
- **Preloading**: z.preload() to cache frequently accessed data for instant queries

### Application Domain

#### Entities System (Primary Feature)
- **Entities**: Unified table for investors and assets (1000 records total)
  - Fields: id, name, category ('investor' | 'asset'), description, value, created_at
  - Indexed on category and name for performance
  - Preloaded: 500 most recent entities for instant search
- **Global Search**: Zero-sync ILIKE queries for case-insensitive substring matching
- **List Pages**: Paginated views with category filtering
- **Detail Pages**: Individual entity information pages

#### Counter & Charts (Demo Feature)
- **Counter**: Simple increment/decrement with PostgreSQL persistence
- **Quarterly Data**: 107 quarters (1999Q1-2025Q4) for chart visualizations
- **10 Chart Types**: Bars, line, area, scatter, step, spline, cumulative, moving average, band, dual-axis

#### Messages System (Original Zero Demo)
- **Messages**: Core entity with body, labels (JSON array), timestamp, sender, and medium
- **Users**: Can be partners or regular users, authenticated via JWT
- **Mediums**: Communication channels for messages
- **Permissions**: Users can insert any message, update only their own, delete only when logged in

## Important Constraints

### Technical Constraints
- PostgreSQL must have WAL (Write-Ahead Logging) enabled for Zero replication
- Zero schema client-side must be equal to or subset of server schema
- JWT auth token required for authenticated operations
- Bun runtime required (migrated from Node.js)
- ES2022 minimum target for compatibility
- esbuild 0.25.0 pinned due to SST requirement

### Development Constraints
- Three concurrent processes required for development: API, UI, Zero Cache
- PostgreSQL must be running before starting dev servers
- Environment variables required: ZERO_UPSTREAM_DB, ZERO_AUTH_SECRET, ZERO_REPLICA_FILE, VITE_PUBLIC_SERVER
- Podman/Docker required for local PostgreSQL

### Deployment Constraints
- AWS region configurable via AWS_REGION env var
- Replication manager must start before view syncer
- Permissions must be deployed after view syncer
- S3 bucket required for replication backups

## External Dependencies

### Services
- PostgreSQL database (local via Podman or remote)
- AWS services (ECS, S3, VPC) for production deployment
- Vercel for alternative deployment

### Key APIs
- Zero Cache server (http://localhost:4848 in dev)
- API server (http://localhost:4000 in dev)
- PostgreSQL connection via ZERO_UPSTREAM_DB

### Development Dependencies
- Podman/Docker for containerized PostgreSQL
- Bun runtime for API server
- bun for tooling
