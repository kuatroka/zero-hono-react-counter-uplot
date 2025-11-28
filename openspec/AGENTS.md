# OpenSpec Instructions

Instructions for AI coding assistants using OpenSpec for spec-driven development.

## TL;DR Quick Checklist

- Search existing work: `openspec spec list --long`, `openspec list` (use `rg` only for full-text search)
- Decide scope: new capability vs modify existing capability
- Pick a unique `change-id`: kebab-case, verb-led (`add-`, `update-`, `remove-`, `refactor-`)
- Scaffold: `proposal.md`, `tasks.md`, `design.md` (only if needed), and delta specs per affected capability
- Write deltas: use `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`; include at least one `#### Scenario:` per requirement
- Validate: `openspec validate [change-id] --strict` and fix issues
- Request approval: Do not start implementation until proposal is approved

## Three-Stage Workflow

### Stage 1: Creating Changes
Create proposal when you need to:
- Add features or functionality
- Make breaking changes (API, schema)
- Change architecture or patterns  
- Optimize performance (changes behavior)
- Update security patterns

Triggers (examples):
- "Help me create a change proposal"
- "Help me plan a change"
- "Help me create a proposal"
- "I want to create a spec proposal"
- "I want to create a spec"

Loose matching guidance:
- Contains one of: `proposal`, `change`, `spec`
- With one of: `create`, `plan`, `make`, `start`, `help`

Skip proposal for:
- Bug fixes (restore intended behavior)
- Typos, formatting, comments
- Dependency updates (non-breaking)
- Configuration changes
- Tests for existing behavior

**Workflow**
1. Review `openspec/project.md`, `openspec list`, and `openspec list --specs` to understand current context.
2. Choose a unique verb-led `change-id` and scaffold `proposal.md`, `tasks.md`, optional `design.md`, and spec deltas under `openspec/changes/<id>/`.
3. Draft spec deltas using `## ADDED|MODIFIED|REMOVED Requirements` with at least one `#### Scenario:` per requirement.
4. Run `openspec validate <id> --strict` and resolve any issues before sharing the proposal.

### Stage 2: Implementing Changes
Track these steps as TODOs and complete them one by one.
1. **Read proposal.md** - Understand what's being built
2. **Read design.md** (if exists) - Review technical decisions
3. **Read tasks.md** - Get implementation checklist
4. **Implement tasks sequentially** - Complete in order
5. **Confirm completion** - Ensure every item in `tasks.md` is finished before updating statuses
6. **Update checklist** - After all work is done, set every task to `- [x]` so the list reflects reality
7. **Approval gate** - Do not start implementation until the proposal is reviewed and approved

### Stage 3: Archiving Changes
After deployment, create separate PR to:
- Move `changes/[name]/` → `changes/archive/YYYY-MM-DD-[name]/`
- Update `specs/` if capabilities changed
- Use `openspec archive [change] --skip-specs --yes` for tooling-only changes
- Run `openspec validate --strict` to confirm the archived change passes checks

## Before Any Task

**Context Checklist:**
- [ ] Read relevant specs in `specs/[capability]/spec.md`
- [ ] Check pending changes in `changes/` for conflicts
- [ ] Read `openspec/project.md` for conventions
- [ ] Run `openspec list` to see active changes
- [ ] Run `openspec list --specs` to see existing capabilities

**Before Creating Specs:**
- Always check if capability already exists
- Prefer modifying existing specs over creating duplicates
- Use `openspec show [spec]` to review current state
- If request is ambiguous, ask 1–2 clarifying questions before scaffolding

### Search Guidance
- Enumerate specs: `openspec spec list --long` (or `--json` for scripts)
- Enumerate changes: `openspec list` (or `openspec change list --json` - deprecated but available)
- Show details:
  - Spec: `openspec show <spec-id> --type spec` (use `--json` for filters)
  - Change: `openspec show <change-id> --json --deltas-only`
- Full-text search (use ripgrep): `rg -n "Requirement:|Scenario:" openspec/specs`

## Quick Start

### CLI Commands

```bash
# Essential commands
openspec list                  # List active changes
openspec list --specs          # List specifications
openspec show [item]           # Display change or spec
openspec diff [change]         # Show spec differences
openspec validate [item]       # Validate changes or specs
openspec archive [change] [--yes|-y]      # Archive after deployment (add --yes for non-interactive runs)

# Project management
openspec init [path]           # Initialize OpenSpec
openspec update [path]         # Update instruction files

# Interactive mode
openspec show                  # Prompts for selection
openspec validate              # Bulk validation mode

# Debugging
openspec show [change] --json --deltas-only
openspec validate [change] --strict
```

### Command Flags

- `--json` - Machine-readable output
- `--type change|spec` - Disambiguate items
- `--strict` - Comprehensive validation
- `--no-interactive` - Disable prompts
- `--skip-specs` - Archive without spec updates
- `--yes`/`-y` - Skip confirmation prompts (non-interactive archive)

## Directory Structure

```
openspec/
├── project.md              # Project conventions
├── specs/                  # Current truth - what IS built
│   └── [capability]/       # Single focused capability
│       ├── spec.md         # Requirements and scenarios
│       └── design.md       # Technical patterns
├── changes/                # Proposals - what SHOULD change
│   ├── [change-name]/
│   │   ├── proposal.md     # Why, what, impact
│   │   ├── tasks.md        # Implementation checklist
│   │   ├── design.md       # Technical decisions (optional; see criteria)
│   │   └── specs/          # Delta changes
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # Completed changes
```

## Creating Change Proposals

### Decision Tree

```
New request?
├─ Bug fix restoring spec behavior? → Fix directly
├─ Typo/format/comment? → Fix directly  
├─ New feature/capability? → Create proposal
├─ Breaking change? → Create proposal
├─ Architecture change? → Create proposal
└─ Unclear? → Create proposal (safer)
```

### Proposal Structure

1. **Create directory:** `changes/[change-id]/` (kebab-case, verb-led, unique)

2. **Write proposal.md:**
```markdown
## Why
[1-2 sentences on problem/opportunity]

## What Changes
- [Bullet list of changes]
- [Mark breaking changes with **BREAKING**]

## Impact
- Affected specs: [list capabilities]
- Affected code: [key files/systems]
```

3. **Create spec deltas:** `specs/[capability]/spec.md`
```markdown
## ADDED Requirements
### Requirement: New Feature
The system SHALL provide...

#### Scenario: Success case
- **WHEN** user performs action
- **THEN** expected result

## MODIFIED Requirements
### Requirement: Existing Feature
[Complete modified requirement]

## REMOVED Requirements
### Requirement: Old Feature
**Reason**: [Why removing]
**Migration**: [How to handle]
```
If multiple capabilities are affected, create multiple delta files under `changes/[change-id]/specs/<capability>/spec.md`—one per capability.

4. **Create tasks.md:**
```markdown
## 1. Implementation
- [ ] 1.1 Create database schema
- [ ] 1.2 Implement API endpoint
- [ ] 1.3 Add frontend component
- [ ] 1.4 Write tests
```

5. **Create design.md when needed:**
Create `design.md` if any of the following apply; otherwise omit it:
- Cross-cutting change (multiple services/modules) or a new architectural pattern
- New external dependency or significant data model changes
- Security, performance, or migration complexity
- Ambiguity that benefits from technical decisions before coding

Minimal `design.md` skeleton:
```markdown
## Context
[Background, constraints, stakeholders]

## Goals / Non-Goals
- Goals: [...]
- Non-Goals: [...]

## Decisions
- Decision: [What and why]
- Alternatives considered: [Options + rationale]

## Risks / Trade-offs
- [Risk] → Mitigation

## Migration Plan
[Steps, rollback]

## Open Questions
- [...]
```

## Spec File Format

### Critical: Scenario Formatting

**CORRECT** (use #### headers):
```markdown
#### Scenario: User login success
- **WHEN** valid credentials provided
- **THEN** return JWT token
```

**WRONG** (don't use bullets or bold):
```markdown
- **Scenario: User login**  ❌
**Scenario**: User login     ❌
### Scenario: User login      ❌
```

Every requirement MUST have at least one scenario.

### Requirement Wording
- Use SHALL/MUST for normative requirements (avoid should/may unless intentionally non-normative)

### Delta Operations

- `## ADDED Requirements` - New capabilities
- `## MODIFIED Requirements` - Changed behavior
- `## REMOVED Requirements` - Deprecated features
- `## RENAMED Requirements` - Name changes

Headers matched with `trim(header)` - whitespace ignored.

#### When to use ADDED vs MODIFIED
- ADDED: Introduces a new capability or sub-capability that can stand alone as a requirement. Prefer ADDED when the change is orthogonal (e.g., adding "Slash Command Configuration") rather than altering the semantics of an existing requirement.
- MODIFIED: Changes the behavior, scope, or acceptance criteria of an existing requirement. Always paste the full, updated requirement content (header + all scenarios). The archiver will replace the entire requirement with what you provide here; partial deltas will drop previous details.
- RENAMED: Use when only the name changes. If you also change behavior, use RENAMED (name) plus MODIFIED (content) referencing the new name.

Common pitfall: Using MODIFIED to add a new concern without including the previous text. This causes loss of detail at archive time. If you aren’t explicitly changing the existing requirement, add a new requirement under ADDED instead.

Authoring a MODIFIED requirement correctly:
1) Locate the existing requirement in `openspec/specs/<capability>/spec.md`.
2) Copy the entire requirement block (from `### Requirement: ...` through its scenarios).
3) Paste it under `## MODIFIED Requirements` and edit to reflect the new behavior.
4) Ensure the header text matches exactly (whitespace-insensitive) and keep at least one `#### Scenario:`.

Example for RENAMED:
```markdown
## RENAMED Requirements
- FROM: `### Requirement: Login`
- TO: `### Requirement: User Authentication`
```

## Troubleshooting

### Common Errors

**"Change must have at least one delta"**
- Check `changes/[name]/specs/` exists with .md files
- Verify files have operation prefixes (## ADDED Requirements)

**"Requirement must have at least one scenario"**
- Check scenarios use `#### Scenario:` format (4 hashtags)
- Don't use bullet points or bold for scenario headers

**Silent scenario parsing failures**
- Exact format required: `#### Scenario: Name`
- Debug with: `openspec show [change] --json --deltas-only`

### Validation Tips

```bash
# Always use strict mode for comprehensive checks
openspec validate [change] --strict

# Debug delta parsing
openspec show [change] --json | jq '.deltas'

# Check specific requirement
openspec show [spec] --json -r 1
```

## Happy Path Script

```bash
# 1) Explore current state
openspec spec list --long
openspec list
# Optional full-text search:
# rg -n "Requirement:|Scenario:" openspec/specs
# rg -n "^#|Requirement:" openspec/changes

# 2) Choose change id and scaffold
CHANGE=add-two-factor-auth
mkdir -p openspec/changes/$CHANGE/{specs/auth}
printf "## Why\n...\n\n## What Changes\n- ...\n\n## Impact\n- ...\n" > openspec/changes/$CHANGE/proposal.md
printf "## 1. Implementation\n- [ ] 1.1 ...\n" > openspec/changes/$CHANGE/tasks.md

# 3) Add deltas (example)
cat > openspec/changes/$CHANGE/specs/auth/spec.md << 'EOF'
## ADDED Requirements
### Requirement: Two-Factor Authentication
Users MUST provide a second factor during login.

#### Scenario: OTP required
- **WHEN** valid credentials are provided
- **THEN** an OTP challenge is required
EOF

# 4) Validate
openspec validate $CHANGE --strict
```

## Multi-Capability Example

```
openspec/changes/add-2fa-notify/
├── proposal.md
├── tasks.md
└── specs/
    ├── auth/
    │   └── spec.md   # ADDED: Two-Factor Authentication
    └── notifications/
        └── spec.md   # ADDED: OTP email notification
```

auth/spec.md
```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
...
```

notifications/spec.md
```markdown
## ADDED Requirements
### Requirement: OTP Email Notification
...
```

## Best Practices

### Simplicity First
- Default to <100 lines of new code
- Single-file implementations until proven insufficient
- Avoid frameworks without clear justification
- Choose boring, proven patterns

### Complexity Triggers
Only add complexity with:
- Performance data showing current solution too slow
- Concrete scale requirements (>1000 users, >100MB data)
- Multiple proven use cases requiring abstraction

### Clear References
- Use `file.ts:42` format for code locations
- Reference specs as `specs/auth/spec.md`
- Link related changes and PRs

### Capability Naming
- Use verb-noun: `user-auth`, `payment-capture`
- Single purpose per capability
- 10-minute understandability rule
- Split if description needs "AND"

### Change ID Naming
- Use kebab-case, short and descriptive: `add-two-factor-auth`
- Prefer verb-led prefixes: `add-`, `update-`, `remove-`, `refactor-`
- Ensure uniqueness; if taken, append `-2`, `-3`, etc.

## Zero-Sync Architecture Patterns (CRITICAL)

**This is a local-first application using Zero-sync.** Data queries MUST use Zero's **Synced Queries API**, NOT custom REST API endpoints or direct ZQL queries.

**📚 Reference:** https://zero.rocicorp.dev/docs/synced-queries

### ✅ CORRECT: Use Synced Queries for Data Access

**Step 1: Define synced queries in `src/zero/queries.ts`:**
```typescript
import { escapeLike, syncedQuery } from "@rocicorp/zero";
import { z } from "zod";
import { builder } from "../schema";

export const queries = {
  // Simple query with no parameters
  listUsers: syncedQuery("users.list", z.tuple([]), () =>
    builder.user.orderBy("name", "asc")
  ),
  
  // Query with parameters and validation
  searchEntities: syncedQuery(
    "entities.search",
    z.tuple([z.string(), z.number().int().min(0).max(50)]),
    (rawSearch, limit) => {
      const search = rawSearch.trim();
      if (!search) {
        return builder.entities.limit(limit);
      }
      return builder.entities
        .where("name", "ILIKE", `%${escapeLike(search)}%`)
        .limit(limit);
    }
  ),
  
  // Query with single parameter
  entityById: syncedQuery(
    "entities.byId",
    z.tuple([z.string().min(1)]),
    (entityId) => builder.entities.where("id", "=", entityId).limit(1)
  ),
} as const;
```

**Step 2: Implement server endpoint in `api/routes/zero/get-queries.ts`:**
```typescript
import { Hono } from "hono";
import { withValidation } from "@rocicorp/zero";
import { handleGetQueriesRequest } from "@rocicorp/zero/server";
import { queries } from "../../../src/zero/queries";
import { schema } from "../../../src/schema";

const validatedQueries = new Map(
  Object.values(queries).map((query) => [query.queryName, withValidation(query)])
);

const zeroRoutes = new Hono();

zeroRoutes.post("/get-queries", async (c) => {
  const response = await handleGetQueriesRequest(
    (name, args) => {
      const query = validatedQueries.get(name);
      if (!query) {
        throw new Error(`Query not found: ${name}`);
      }
      return { query: query(undefined, ...args) };
    },
    schema,
    c.req.raw
  );
  return c.json(response);
});

export default zeroRoutes;
```

**Step 3: Use in React components:**
```typescript
// ✅ CORRECT - Use synced queries
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '../zero/queries';

function MyComponent() {
  const [entities] = useQuery(queries.searchEntities(search, 10));
  const [user] = useQuery(queries.entityById(userId));
  
  // ...
}
```

**Why this is correct:**
- Server controls query implementation (security & permissions)
- Data synced to local IndexedDB automatically
- Queries execute instantly against local cache
- Zero handles server sync in background
- No network latency for cached data
- Reactive updates when data changes
- Parameter validation with Zod schemas

**Preloading for instant search:**
```typescript
// ✅ CORRECT - Preload using synced queries
import { getZero } from '../zero-client';
import { queries } from '../zero/queries';

const z = getZero();
z.preload(queries.recentEntities(500));
```

### ❌ WRONG: Direct ZQL Queries (Deprecated)

**DO NOT use direct ZQL queries (legacy pattern):**
```typescript
// ❌ WRONG - Direct ZQL query (deprecated)
const z = useZero<Schema>();
const [entities] = useQuery(
  z.query.entities
    .where('name', 'ILIKE', `%${search}%`)
    .limit(10)
);
```

**Why this is wrong:**
- No server-side permission enforcement
- No parameter validation
- Can't control query implementation from server
- Deprecated in favor of synced queries
- Security risk: clients can query any data

**✅ Solution:** Define a synced query in `src/zero/queries.ts` and use it instead.

### ❌ WRONG: Custom REST API Endpoints

**DO NOT create custom API endpoints for data queries:**
```typescript
// ❌ WRONG - Custom search API endpoint
app.get("/api/search", async (c) => {
  const results = await db.query("SELECT * FROM entities WHERE name ILIKE $1", [query]);
  return c.json(results);
});

// ❌ WRONG - Fetching from custom API
const results = await fetch(`/api/search?q=${query}`).then(r => r.json());
```

**Why this is wrong:**
- Bypasses Zero-sync entirely
- Requires network round-trip every time
- No local caching
- No reactive updates
- Defeats the purpose of local-first architecture
- Data won't sync to other clients properly

**✅ Solution:** Use synced queries instead.

### When to Use Hono API Endpoints

**✅ Use Hono API endpoints ONLY for:**

1. **Authentication/Authorization:**
```typescript
// ✅ CORRECT - Auth is server-side concern
app.post("/api/auth/login", async (c) => {
  const token = await generateJWT(user);
  return c.json({ token });
});
```

2. **External integrations:**
```typescript
// ✅ CORRECT - Third-party API calls
app.post("/api/stripe/webhook", async (c) => {
  await handleStripeWebhook(c.req);
  return c.json({ received: true });
});
```

3. **File uploads/downloads:**
```typescript
// ✅ CORRECT - Binary data handling
app.post("/api/upload", async (c) => {
  const file = await c.req.formData();
  const url = await uploadToS3(file);
  return c.json({ url });
});
```

4. **Server-side computations:**
```typescript
// ✅ CORRECT - Heavy processing that can't run client-side
app.post("/api/reports/generate", async (c) => {
  const pdf = await generateLargeReport();
  return c.body(pdf, 200, { 'Content-Type': 'application/pdf' });
});
```

### Common Mistakes to Avoid

**❌ Mistake 1: Using direct ZQL queries**
```typescript
// ❌ WRONG - Direct ZQL (deprecated)
const [data] = useQuery(z.query.entities.where('name', 'ILIKE', `%${search}%`));
```
**✅ Solution:** Define and use synced queries from `src/zero/queries.ts`

**❌ Mistake 2: Creating /api/search endpoint**
```typescript
// ❌ WRONG
app.get("/api/search", async (c) => { /* ... */ });
```
**✅ Solution:** Use synced queries with ILIKE

**❌ Mistake 3: Creating /api/entities endpoint**
```typescript
// ❌ WRONG
app.get("/api/entities", async (c) => { /* ... */ });
```
**✅ Solution:** Use synced queries with .where() and .limit()

**❌ Mistake 4: Adding PostgreSQL full-text search**
```sql
-- ❌ WRONG - Zero doesn't use these
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_entities_search_trgm ON entities USING GIN (...);
```
**✅ Solution:** Use simple B-tree indexes, Zero handles queries

**❌ Mistake 5: Using fetch() for data queries**
```typescript
// ❌ WRONG
const data = await fetch('/api/entities').then(r => r.json());
```
**✅ Solution:** Use synced queries with useQuery(queries.listEntities())

### Synced Query Patterns

**Define queries in `src/zero/queries.ts` using these patterns:**

**Simple filtering:**
```typescript
// Case-insensitive search
searchEntities: syncedQuery(
  "entities.search",
  z.tuple([z.string(), z.number().int().max(50)]),
  (search, limit) => 
    builder.entities
      .where('name', 'ILIKE', `%${escapeLike(search)}%`)
      .limit(limit)
),

// Exact match
entityByCategory: syncedQuery(
  "entities.byCategory",
  z.tuple([z.enum(["investor", "asset"])]),
  (category) => builder.entities.where('category', '=', category)
),

// Multiple conditions
highValueInvestors: syncedQuery(
  "entities.highValueInvestors",
  z.tuple([z.number().int()]),
  (minValue) =>
    builder.entities
      .where('category', '=', 'investor')
      .where('value', '>', minValue)
),
```

**Sorting and pagination:**
```typescript
entitiesPaginated: syncedQuery(
  "entities.paginated",
  z.tuple([z.number().int().min(0), z.number().int().max(100)]),
  (page, pageSize) =>
    builder.entities
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(page * pageSize)
),
```

**Relationships:**
```typescript
messagesWithSender: syncedQuery(
  "messages.withSender",
  z.tuple([z.boolean()]),
  (partnersOnly) => {
    let query = builder.messages.related('sender');
    if (partnersOnly) {
      query = query.where('sender.isPartner', '=', true);
    }
    return query;
  }
),
```

**Preloading:**
```typescript
// Preload on app startup for instant queries
import { getZero } from '../zero-client';
import { queries } from '../zero/queries';

const z = getZero();
z.preload(queries.recentEntities(500));
```

### Decision Tree: Synced Query vs API Endpoint

```
Need to access data?
├─ Is it database data that syncs? → Use synced query
├─ Is it search/filter/sort? → Use synced query
├─ Is it authentication? → Use API endpoint
├─ Is it external service? → Use API endpoint
├─ Is it file upload/download? → Use API endpoint
└─ Is it heavy server computation? → Use API endpoint
```

### Reference Implementation

See `src/zero/queries.ts` for correct synced query implementations:
- All queries defined with `syncedQuery()`
- Parameter validation with Zod schemas
- Server-side query control via `/api/zero/get-queries`
- Instant client-side queries with local cache
- Preloaded data for best performance

## React Performance Guidelines (CRITICAL)

**This project uses React 19.2 with Zero-sync local-first architecture, TanStack Table, and uPlot charts.** Follow these guidelines for optimal performance.

### Tier 1: Highest Impact (Implement First)

#### 1. Prevent UI Flash on Page Refresh (CRITICAL)
**Impact:** Eliminates visible UI flash/flicker on page refresh

**Problem:** When users refresh the page, the UI would flash empty state before data loaded from cache, even though Zero cached data in IndexedDB and data loaded quickly.

**Solution: `visibility: hidden` Pattern from zbugs**

Inspired by the official Zero reference app `zbugs`, hide the entire app until content is ready:

**Step 1: App Root Level (`main.tsx`):**
```typescript
function AppContent() {
  const z = useZero<Schema>();
  initZero(z);

  // Prevent UI flash on refresh: hide until content is ready
  const [contentReady, setContentReady] = useState(false);
  const onReady = () => setContentReady(true);

  return (
    <BrowserRouter>
      <div style={{ visibility: contentReady ? 'visible' : 'hidden' }}>
        <GlobalNav />
        <Routes>
          <Route path="/" element={<HomePage onReady={onReady} />} />
          <Route path="/assets" element={<AssetsTablePage onReady={onReady} />} />
          {/* ... other routes */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

**Key points:**
- Use `visibility: hidden` (NOT `display: none`) to maintain layout
- Container is hidden until `contentReady` is true
- Each page receives `onReady` callback

**Step 2: Page Components Signal When Ready:**

**Data-driven pages** (AssetsTable, SuperinvestorsTable):
```typescript
export function AssetsTablePage({ onReady }: { onReady: () => void }) {
  const [assetsPageRows, assetsResult] = useQuery(
    queries.assetsPage(windowLimit, 0),
    { ttl: '5m', enabled: !trimmedSearch }
  );

  // Signal ready when data is available (from cache or server)
  useEffect(() => {
    if (assetsPageRows && assetsPageRows.length > 0 || assetsResult.type === 'complete') {
      onReady();
    }
  }, [assetsPageRows, assetsResult.type, onReady]);
  
  // ... rest of component
}
```

**Detail pages** (AssetDetail, SuperinvestorDetail):
```typescript
export function AssetDetailPage({ onReady }: { onReady: () => void }) {
  const [rows, result] = useQuery(
    queries.assetBySymbol(asset || ''),
    { enabled: Boolean(asset) }
  );

  const record = rows?.[0];

  // Signal ready when data is available (from cache or server)
  useEffect(() => {
    if (record || result.type === 'complete') {
      onReady();
    }
  }, [record, result.type, onReady]);
  
  // ... rest of component
}
```

**Static pages** (UserProfile):
```typescript
export function UserProfile({ onReady }: { onReady: () => void }) {
  // Signal ready immediately for static page
  useEffect(() => {
    onReady();
  }, [onReady]);
  
  // ... rest of component
}
```

**How It Works:**

*On Initial Load:*
1. App renders with `visibility: hidden`
2. Zero loads data from IndexedDB cache
3. Page component receives cached data
4. Page calls `onReady()`
5. App becomes visible with data already rendered

*On Refresh:*
1. App renders with `visibility: hidden` (user sees blank page briefly)
2. Zero immediately loads from IndexedDB cache (<50ms)
3. Page component receives cached data
4. Page calls `onReady()`
5. App becomes visible with data (no flash!)

**Why `visibility: hidden` vs `display: none`?**
- `visibility: hidden`: Element takes up space, layout is calculated
- `display: none`: Element removed from layout

Using `visibility` ensures:
- Layout is ready when content becomes visible
- No layout shift when transitioning
- Smoother visual experience

**Reference:** This pattern is used in the official Zero reference app `zbugs` (`apps/zbugs/src/root.tsx` and `apps/zbugs/src/pages/list/list-page.tsx`)

**Result:**
✅ No UI flash on page refresh
✅ Search terms preserved in URL
✅ Data loads instantly from cache
✅ Smooth user experience

#### 2. Enable React Compiler (Forget)
**Impact:** 10-15% faster initial loads, 2.5× faster interactions

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]]
      }
    })
  ]
});
```

**Install:**
```bash
bun add -D babel-plugin-react-compiler
```

**What it does:**
- Automatically inserts memoization where beneficial
- Reduces need for manual `React.memo`, `useMemo`, `useCallback`
- Based on static analysis of component dependencies

#### 3. Zero Snapshots for Fast Cold Starts
**Impact:** 10-50× faster cold start times

```typescript
// src/zero-client.ts
async function initZero() {
  const snapshot = await snapshotStore.getLatest();
  if (snapshot) {
    await z.loadSnapshot(snapshot);
  }
  
  // Create snapshots periodically (every 200-1000 changes)
  setInterval(async () => {
    const snapshot = await z.createSnapshot();
    await snapshotStore.save(snapshot);
  }, SNAPSHOT_INTERVAL_MS);
}
```

**Why this matters:**
- Loading full CRDT history replays thousands of operations
- Snapshots + incremental deltas are dramatically faster
- Critical for apps with 500+ preloaded entities

#### 4. Zero Query Optimization with TTL Strategy
**Impact:** Reduces subscription churn, memory usage, server load

**Use 5-minute TTL for main queries** (based on ztunes analysis with 88k artists, 200k albums):

```typescript
// ✅ CORRECT - Main data views use 5-minute TTL
const [assets] = useQuery(
  queries.assetsPage(limit, 0),
  { ttl: '5m' } // ⭐ Allows instant re-navigation within 5 minutes
);

const [superinvestors] = useQuery(
  queries.superinvestorsPage(limit, 0),
  { ttl: '5m' }
);

// ❌ AVOID - Short TTLs force server round-trips too often
const [assets] = useQuery(
  queries.assetsPage(limit, 0),
  { ttl: '10s' } // Too short!
);
```

**Why 5-minute TTL?**
- Instant re-navigation when returning to a page within 5 minutes
- Automatic real-time updates while cached
- Reduced server load
- Better user experience

**Ephemeral queries use `ttl: 'none'`:**
```typescript
// ✅ CORRECT - Ephemeral queries (search, typeahead)
const [results] = useQuery(
  query.length >= 2
    ? z.query.entities.where('name', 'ILIKE', `%${query}%`).limit(5)
    : z.query.entities.limit(0),
  { ttl: 'none' } // ⭐ Unregister immediately when query changes
);
```

**Why `ttl:'none'` matters:**
- Each `useQuery` creates a live subscription with server-side work
- Without TTL control, subscriptions linger in background
- Search creates new subscription per keystroke = subscription churn
- `ttl:'none'` destroys subscription immediately on unmount

**When to use:**
- ✅ Search/typeahead inputs (use `ttl: 'none'`)
- ✅ Temporary modal/dialog queries (use `ttl: 'none'`)
- ✅ Per-keystroke filtered views (use `ttl: 'none'`)
- ✅ Main list views (use `ttl: '5m'`)
- ✅ Detail pages (use `ttl: '5m'`)
- ✅ Browsing data (use `ttl: '5m'`)

#### 5. Preload Strategy for Instant Search and Browsing
**Impact:** Instant local search, instant page navigation

**Preload data at app startup** for instant local search and browsing:

```typescript
// src/zero-preload.ts
export function preload(z: Zero<Schema>, { limit = 200 } = {}) {
  const TTL = "5m";

  // Browsing data (windowed pagination)
  z.preload(queries.assetsPage(limit, 0), { ttl: TTL });
  z.preload(queries.superinvestorsPage(limit, 0), { ttl: TTL });

  // Search index for instant local search (1000 rows per category)
  z.preload(queries.searchesByCategory("assets", "", 1000), { ttl: TTL });
  z.preload(queries.searchesByCategory("superinvestors", "", 1000), { ttl: TTL });

  // Global search index
  z.preload(queries.searchesByName("", 100), { ttl: TTL });
  
  // Reference data
  z.preload(queries.listUsers(), { ttl: TTL });
  z.preload(queries.listMediums(), { ttl: TTL });
}

// Call in main.tsx or app initialization
function AppContent() {
  const z = useZero<Schema>();
  
  useEffect(() => {
    preload(z);
  }, [z]);
  
  // ...
}
```

**Why preload the search index?**
- Users get instant results from preloaded local data
- Server results arrive async but don't "jostle" the UI
- Both local and server results are sorted alphabetically
- Local results are a valid prefix of full results

**Jostle-Free Search UX:**
From ztunes: *"We want to provide instant results over local data, but we don't want to 'jostle' (reorder) those results when server results come in."*

**Solution:** Sort all query results consistently (alphabetically by name). This ensures:
- Local results are always a valid prefix of server results
- New results appear below existing results, not reordering them
- Smooth user experience without UI jumping

**Windowed Pagination:**
Don't sync the entire table—use windowed pagination with a max limit:

```typescript
const DEFAULT_WINDOW_LIMIT = 1000;
const MAX_WINDOW_LIMIT = 1000;

// Only sync what's needed for current view + some margin
const [assetsPageRows] = useQuery(
  queries.assetsPage(windowLimit, 0),
  { ttl: '5m', enabled: !trimmedSearch }
);
```

**Performance Note:**
Zero currently lacks first-class text indexing. Searches can be O(n) when there are fewer matching records than the limit or sort order doesn't match an index. For ~32k assets and ~15k superinvestors, this is acceptable. For larger datasets, consider server-side search or wait for Zero's upcoming text indexing feature.

#### 6. Route-Based Code Splitting
**Impact:** 30-40% smaller initial bundle

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// ✅ CORRECT - Lazy load route components
const EntitiesList = lazy(() => import('./pages/EntitiesList'));
const EntityDetail = lazy(() => import('./pages/EntityDetail'));
const CikDetail = lazy(() => import('./pages/CikDetail'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

const router = createBrowserRouter([
  {
    path: '/entities',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <EntitiesList />
      </Suspense>
    )
  },
  // ... other routes
]);
```

**What to split:**
- ✅ Each page/route
- ✅ Heavy chart components (uPlot)
- ✅ Large tables (TanStack Table)
- ❌ Small shared components
- ❌ Layout components

#### 7. Batch Zero Operations
**Impact:** 50-70% fewer CRDT operations, reduced metadata growth

```typescript
// ❌ WRONG - Creates separate operation per change
entities.forEach(entity => {
  z.mutate.entities.update({ id: entity.id, status: 'processed' });
});

// ✅ CORRECT - Batch in single transaction
z.transact(() => {
  entities.forEach(entity => {
    z.mutate.entities.update({ id: entity.id, status: 'processed' });
  });
});
```

**Why this matters:**
- Each operation creates CRDT metadata (vector clocks, timestamps)
- Batching reduces IndexedDB writes
- Reduces sync messages to server
- Prevents metadata bloat

### Tier 2: High Impact (Implement Soon)

#### 8. Use React Scan to Find Wasted Renders
**Impact:** Identifies actual performance bottlenecks

```bash
# Install as dev dependency
bun add -D react-scan

# Or use browser extension
# https://react-scan.com
```

```typescript
// src/main.tsx (development only)
if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: true,
      log: true
    });
  });
}
```

**What it shows:**
- Visual overlays on components that re-render
- Render counts and timing
- "Why did this render?" analysis
- Perfect for identifying wasted renders in tables/charts

#### 9. Virtualize Large Lists
**Impact:** Handle 10,000+ rows smoothly

```typescript
// src/pages/EntitiesList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function EntitiesList() {
  const [entities] = useQuery(z.query.entities.limit(10000));
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: entities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height in pixels
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={entities[virtualRow.index].id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <EntityRow entity={entities[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Install:**
```bash
bun add @tanstack/react-virtual
```

**When to virtualize:**
- ✅ Lists with 100+ items
- ✅ Tables with many rows
- ✅ Infinite scroll views
- ❌ Small lists (<50 items)
- ❌ Grids with few columns

#### 10. Selective Preloading by Route
**Impact:** Reduces initial memory footprint, faster app start

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useRoutePreload() {
  const location = useLocation();
  const z = useZero<Schema>();
  
  useEffect(() => {
    switch (location.pathname) {
      case '/entities':
        // Only preload what this route needs
        z.preload(z.query.entities.limit(100));
        break;
      case '/entity/:id':
        // Preload single entity + related data
        const id = location.pathname.split('/')[2];
        z.preload(z.query.entities.where('id', '=', id));
        break;
      default:
        // Minimal preload for other routes
        z.preload(z.query.entities.limit(10));
    }
  }, [location.pathname, z]);
}
```

**Current issue:**
```typescript
// ❌ WRONG - Preloads 500 entities globally
z.preload(z.query.entities.limit(500));
```

**Better approach:**
- Preload only what each route needs
- Use smaller limits for initial load
- Lazy-load additional data on demand

#### 11. Move Heavy Work to Web Workers
**Impact:** Keeps UI responsive during heavy operations

```typescript
// src/workers/reconcile.worker.ts
self.onmessage = async ({ data }) => {
  const merged = await reconcileCRDT(data.local, data.remote);
  postMessage(merged);
};

// src/hooks/useWorkerReconcile.ts
import ReconcileWorker from './workers/reconcile.worker?worker';

export function useWorkerReconcile() {
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    workerRef.current = new ReconcileWorker();
    return () => workerRef.current?.terminate();
  }, []);
  
  const reconcile = useCallback((local, remote) => {
    return new Promise((resolve) => {
      workerRef.current!.onmessage = ({ data }) => resolve(data);
      workerRef.current!.postMessage({ local, remote });
    });
  }, []);
  
  return reconcile;
}
```

**What to move to workers:**
- ✅ CRDT reconciliation
- ✅ Heavy data transformations
- ✅ Chart data preprocessing
- ✅ Large JSON parsing
- ❌ DOM manipulation
- ❌ React state updates

### Tier 3: Medium Impact (Nice to Have)

#### 12. Strategic Memoization
**Impact:** Prevents expensive recomputations

**When to use manual memoization (even with React Compiler):**

```typescript
// ✅ CORRECT - Expensive computations
const sortedEntities = useMemo(() => {
  return entities
    .filter(e => e.name.includes(searchTerm))
    .sort((a, b) => a.name.localeCompare(b.name));
}, [entities, searchTerm]);

// ✅ CORRECT - Reference stability for chart options
const chartOptions = useMemo(() => ({
  scales: { x: { type: 'time' } },
  plugins: { legend: { display: true } }
}), []);

// ✅ CORRECT - Heavy components with stable props
const MemoizedQuarterChart = React.memo(QuarterChart, (prev, next) => {
  return prev.data === next.data && prev.theme === next.theme;
});

// ❌ WRONG - Premature optimization
const simpleValue = useMemo(() => count * 2, [count]); // Too simple!
```

**Rule of thumb:**
1. Enable React Compiler first (handles 80% of cases)
2. Use React Scan to identify actual problems
3. Add manual memoization only where React Scan shows issues
4. Profile before/after to verify improvement

**Don't memoize:**
- Simple calculations (arithmetic, string concat)
- JSX with no expensive children
- Props that change frequently anyway

#### 13. Partial Hydration for Offscreen Content
**Impact:** Faster Time to Interactive

```typescript
// src/pages/EntityDetail.tsx
import { Suspense } from 'react';

function EntityDetail() {
  return (
    <div>
      <EntityHeader /> {/* Hydrate immediately */}
      
      <Suspense fallback={<ChartSkeleton />}>
        <LazyChart /> {/* Hydrate when visible */}
      </Suspense>
    </div>
  );
}

// Use IntersectionObserver for below-fold content
function LazyChart() {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldRender(true);
        observer.disconnect();
      }
    });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {shouldRender ? <QuarterChart /> : <ChartSkeleton />}
    </div>
  );
}
```

**When to defer hydration:**
- ✅ Charts below the fold
- ✅ Tabs/accordions (hidden content)
- ✅ Modals/dialogs (not initially visible)
- ❌ Above-the-fold content
- ❌ Critical user interactions

#### 14. React 19 Activity API for Hidden Content
**Impact:** Deprioritizes hidden subtrees

```typescript
// src/components/TabPanel.tsx
import { Activity } from 'react';

function TabPanel({ isActive, children }) {
  return (
    <Activity mode={isActive ? 'visible' : 'hidden'}>
      <Suspense fallback={<Skeleton />}>
        {children}
      </Suspense>
    </Activity>
  );
}
```

**Use cases:**
- Tab panels (preserve state but lower priority)
- Sidebar content
- Collapsed sections
- Background panels

#### 15. Optimize Chart Rendering
**Impact:** Smooth real-time updates

```typescript
// src/components/QuarterChart.tsx
import { useMemo, useRef, useEffect } from 'react';

function QuarterChart({ data }) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // ✅ Precompute expensive transforms
  const chartData = useMemo(() => {
    return data.map(d => ({
      x: new Date(d.date).getTime(),
      y: parseFloat(d.value)
    }));
  }, [data]);
  
  // ✅ Batch updates with requestAnimationFrame
  useEffect(() => {
    let rafId: number;
    
    const updateChart = () => {
      if (chartRef.current) {
        // Update chart with new data
        chart.setData(chartData);
      }
    };
    
    rafId = requestAnimationFrame(updateChart);
    return () => cancelAnimationFrame(rafId);
  }, [chartData]);
  
  return <div ref={chartRef} />;
}

// ✅ Lazy-load chart library
const QuarterChart = lazy(() => import('./QuarterChart'));
```

**Chart optimization checklist:**
- ✅ Lazy-load chart library (uPlot is 40KB+)
- ✅ Precompute data transformations
- ✅ Use `requestAnimationFrame` for updates
- ✅ Debounce real-time data with `useDeferredValue`
- ✅ Memoize chart options object

#### 16. Metadata Garbage Collection
**Impact:** Prevents long-term memory bloat

```typescript
// src/zero-client.ts
async function setupMetadataGC() {
  // Run garbage collection periodically
  setInterval(async () => {
    await z.compactMetadata({
      pruneOlderThan: 30 * 24 * 60 * 60 * 1000, // 30 days
      keepTombstones: 1000 // Keep recent deletes
    });
  }, 24 * 60 * 60 * 1000); // Daily
}
```

**Why this matters:**
- CRDT metadata grows unbounded without GC
- Tombstones (deleted items) accumulate
- Affects memory usage and sync performance
- Critical for long-lived sessions

### Performance Measurement

#### Before Optimizing
```bash
# Install tools
bun add -D rollup-plugin-visualizer

# Analyze bundle
bun run build
# Check dist/stats.html for bundle composition
```

#### Metrics to Track
- **Initial bundle size** (target: <200KB gzipped)
- **Time to Interactive** (target: <3s on 3G)
- **First Contentful Paint** (target: <1.5s)
- **Active Zero subscriptions** (target: <50 concurrent)
- **Memory usage** (target: <100MB for typical session)

#### React DevTools Profiler
```typescript
// Wrap expensive components
<Profiler id="EntitiesList" onRender={onRenderCallback}>
  <EntitiesList />
</Profiler>

function onRenderCallback(
  id, phase, actualDuration, baseDuration, startTime, commitTime
) {
  console.log(`${id} took ${actualDuration}ms to render`);
}
```

### Common Anti-Patterns to Avoid

#### ❌ Creating New Objects in Render
```typescript
// ❌ WRONG - New object every render
<Chart options={{ scales: { x: { type: 'time' } } }} />

// ✅ CORRECT - Stable reference
const options = useMemo(() => ({ scales: { x: { type: 'time' } } }), []);
<Chart options={options} />
```

#### ❌ Inline Function Props
```typescript
// ❌ WRONG - New function every render
<Button onClick={() => handleClick(id)} />

// ✅ CORRECT - Stable callback
const onClick = useCallback(() => handleClick(id), [id]);
<Button onClick={onClick} />
```

#### ❌ Debouncing Zero Reads (Usually Unnecessary)
```typescript
// ⚠️ USUALLY UNNECESSARY - IndexedDB is fast
const debouncedSearch = debounce(setSearchQuery, 300);

// ✅ BETTER - Use ttl:'none' instead
const [results] = useQuery(
  z.query.entities.where('name', 'ILIKE', `%${query}%`),
  { ttl: 'none' }
);
```

**Exception:** Debounce if you have expensive transformations on results:
```typescript
// ✅ CORRECT - Debounce expensive computation
const debouncedQuery = useDeferredValue(query);
const processedResults = useMemo(() => {
  return results.map(r => expensiveTransform(r));
}, [results]);
```

#### ❌ Too Many Fine-Grained Queries
```typescript
// ❌ WRONG - Creates many subscriptions
entities.map(e => {
  const [details] = useQuery(z.query.entities.where('id', '=', e.id));
  return <EntityRow details={details} />;
});

// ✅ CORRECT - Single query, derive in React
const [allEntities] = useQuery(z.query.entities.limit(100));
return allEntities.map(e => <EntityRow entity={e} />);
```

### Decision Matrix

| Optimization | When to Use | When to Skip |
|--------------|-------------|--------------|
| React Compiler | Always | Never (no downside) |
| Zero Snapshots | >100 entities preloaded | <50 entities |
| `ttl:'none'` | Search, typeahead, modals | Main views, detail pages |
| Code Splitting | Routes, heavy components | Small shared components |
| Virtualization | Lists >100 items | Lists <50 items |
| Manual Memoization | After React Scan shows issue | Before measuring |
| Web Workers | Heavy computations (>50ms) | Simple operations |
| Partial Hydration | Below-fold charts | Above-fold content |

### Quick Wins Checklist

Start here for immediate impact:

- [ ] Enable React Compiler in `vite.config.ts`
- [ ] Add `ttl:'none'` to search queries
- [ ] Implement Zero snapshots
- [ ] Add route-based code splitting
- [ ] Install React Scan for profiling
- [ ] Batch Zero mutations in transactions
- [ ] Virtualize EntitiesList if >100 rows
- [ ] Lazy-load chart components
- [ ] Memoize chart options objects
- [ ] Set up bundle size monitoring

### Resources

- React Compiler: https://react.dev/blog/2025/04/21/react-compiler-rc
- React Scan: https://react-scan.com
- Zero Docs: https://zero.rocicorp.dev/docs
- TanStack Virtual: https://tanstack.com/virtual/latest
- React 19 Activity API: https://react.dev/reference/react/Activity

## Tool Selection Guide

| Task | Tool | Why |
|------|------|-----|
| Find files by pattern | Glob | Fast pattern matching |
| Search code content | Grep | Optimized regex search |
| Read specific files | Read | Direct file access |
| Explore unknown scope | Task | Multi-step investigation |

## Error Recovery

### Change Conflicts
1. Run `openspec list` to see active changes
2. Check for overlapping specs
3. Coordinate with change owners
4. Consider combining proposals

### Validation Failures
1. Run with `--strict` flag
2. Check JSON output for details
3. Verify spec file format
4. Ensure scenarios properly formatted

### Missing Context
1. Read project.md first
2. Check related specs
3. Review recent archives
4. Ask for clarification

## Quick Reference

### Stage Indicators
- `changes/` - Proposed, not yet built
- `specs/` - Built and deployed
- `archive/` - Completed changes

### File Purposes
- `proposal.md` - Why and what
- `tasks.md` - Implementation steps
- `design.md` - Technical decisions
- `spec.md` - Requirements and behavior

### CLI Essentials
```bash
openspec list              # What's in progress?
openspec show [item]       # View details
openspec diff [change]     # What's changing?
openspec validate --strict # Is it correct?
openspec archive [change] [--yes|-y]  # Mark complete (add --yes for automation)
```

Remember: Specs are truth. Changes are proposals. Keep them in sync.
