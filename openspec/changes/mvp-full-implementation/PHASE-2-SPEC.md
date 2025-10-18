# Phase 2: Investors, Assets & Global Search - Implementation Specification

**Status:** Ready for Implementation  
**Duration:** 16-24 hours  
**Risk:** Medium  
**Prerequisites:** Phase 1 Complete (React Router migration verified)

---

## Overview & Goals

### Objectives
- Add unified entities system (investors + assets)
- Implement global search using Zero-sync
- Create list pages with pagination (10 rows/page)
- Create detail pages for individual entities
- Seed database with 1000 records (500 investors, 500 assets)

### Success Metrics
- 1000 entities in database
- Search returns results in under 100ms
- Pagination works smoothly
- Zero-sync keeps data in sync
- All navigation works without page reloads

---

## Data Model

### Entities Table Schema

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('investor', 'asset')),
  description TEXT,
  value DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entities_category ON entities(category);
CREATE INDEX idx_entities_name ON entities(name);
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | VARCHAR(255) | Yes | Entity name (searchable) |
| category | VARCHAR(50) | Yes | 'investor' or 'asset' |
| description | TEXT | No | Longer description |
| value | DECIMAL(15,2) | No | Monetary value |
| created_at | TIMESTAMP | Yes | Creation timestamp |

---

## Implementation Timeline

### Phase 2.1: Database (2-3 hours)
- Create migration file
- Add entities table with indexes
- Create seed script
- Generate 1000 records (500 investors + 500 assets)
- Verify data in database

### Phase 2.2: Zero-Sync Integration (1-2 hours)
- Update zero-schema.ts with entities table
- Restart Zero cache
- Verify data syncing to client

### Phase 2.3: Global Search Component (3-4 hours)
- Create GlobalSearch component with debouncing
- Implement Zero-sync search query (max 5 results)
- Style dropdown with category badges
- Add navigation on click
- Test search functionality

### Phase 2.4: List Pages (4-5 hours)
- Create EntitiesList component
- Implement pagination (10 rows per page)
- Add category filtering (All/Investors/Assets)
- Style table with proper columns
- Add links to detail pages
- Test pagination and filtering

### Phase 2.5: Detail Pages (2-3 hours)
- Create EntityDetail component
- Implement Zero-sync query for single entity
- Style detail layout with stats
- Add back navigation
- Test detail view

### Phase 2.6: Navigation (2 hours)
- Create GlobalNav component
- Add navigation links
- Integrate GlobalSearch
- Update routing in main.tsx
- Test all navigation

### Phase 2.7: Testing & Polish (2-3 hours)
- Test all features end-to-end
- Fix bugs
- Polish UI
- Update documentation

**Total: 16-24 hours**

---

## Success Criteria

- **Database:** 1000 entities with proper indexes  
- **Search:** Global search with max 5 results, category badges  
- **Lists:** Paginated tables (10 rows), category filtering  
- **Details:** Full entity information, back navigation  
- **Performance:** No page reloads, instant search (under 100ms)

---

## Testing Checklist

### Database
- [ ] Entities table created
- [ ] Indexes added
- [ ] 500 investors seeded
- [ ] 500 assets seeded
- [ ] Data queryable

### Zero-Sync
- [ ] Schema updated
- [ ] Cache restarted
- [ ] Data syncing
- [ ] Queries working

### Search
- [ ] Input renders
- [ ] Debouncing works
- [ ] Results show (max 5)
- [ ] Badges display
- [ ] Navigation works

### Lists
- [ ] Table renders
- [ ] Pagination works
- [ ] Filtering works
- [ ] Links work

### Details
- [ ] Page loads
- [ ] Data displays
- [ ] Back link works

---

## Rollback Plan

**Database:** DROP TABLE IF EXISTS entities CASCADE

**Code:** git reset --hard HEAD~1

**Zero-sync:** Revert schema, restart cache
