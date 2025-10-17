# Project Context

## Purpose
A real-time messaging application demonstrating Zero (Rocicorp's sync framework) capabilities. The app showcases real-time data synchronization between multiple clients using PostgreSQL and Zero Cache, with features including message CRUD operations, filtering, relationships, and JWT-based authentication with row-level permissions.

## Tech Stack

### Frontend
- React 19.2.0
- TypeScript 5.5.3
- Vite 5.4.1 (dev server on port 3003)
- @rocicorp/zero 0.24 (real-time sync)
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

### Application Domain
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
