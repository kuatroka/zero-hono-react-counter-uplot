# Phase 2.1 Critical Issues Found

## ❌ Issues Discovered During Playwright Testing

### 1. **Migration Not Applied** ✅ FIXED
**Problem:** The `04_add_full_text_search.sql` migration was never applied to the database.
**Symptom:** `search_entities()` function didn't exist, causing API search to fail.
**Fix:** Manually applied migration:
```bash
podman exec -i docker-zstart_postgres-1 psql -U user -d postgres < docker/migrations/04_add_full_text_search.sql
```
**Result:** Search API now works correctly with fuzzy matching.

### 2. **Zero-Sync Not Syncing Entities** ❌ STILL BROKEN
**Problem:** Entities page shows "0 entities" even though 1000 exist in database.
**Symptom:** 
- Database has 1000 entities (verified)
- Schema includes entities table (verified)
- Permissions set to ANYONE_CAN (verified)
- But Zero-sync is not syncing the data to the client

**Evidence:**
```
Database: SELECT COUNT(*) FROM entities; → 1000 rows
Frontend: "All (0)" and "No entities found"
```

**Possible causes:**
- Zero-cache not aware of entities table
- Schema mismatch between client and server
- Zero-cache needs restart after schema change
- Migration applied after zero-cache started

### 3. **Search API Works, But Frontend Doesn't Use It** ✅ VERIFIED
**Status:** Search API endpoint works correctly:
```bash
curl "http://localhost:4000/api/search?q=inv"
# Returns 5 investor results with similarity scores

curl "http://localhost:4000/api/search?q=investr"  # Typo!
# Returns investor results (fuzzy matching works!)
```

**Frontend Issue:** GlobalSearch component can't be tested via Playwright because:
- Input field exists but can't be interacted with
- Need manual browser testing

## ✅ What Works

1. ✅ **Home page loads** - No console errors
2. ✅ **Navigation works** - All links present
3. ✅ **Counter page loads** - No errors (but counter not visible in snapshot)
4. ✅ **Search API works** - Fuzzy matching functional
5. ✅ **Database has data** - 1000 entities (500 investors + 500 assets)
6. ✅ **Migration applied** - Full-text search function exists

## ❌ What's Broken

1. ❌ **Zero-sync not syncing entities** - Critical blocker
2. ❌ **Entities page shows 0 rows** - Because of #1
3. ❌ **Search dropdown not testable** - Need manual testing
4. ❌ **Counter page content not visible** - Might be rendering issue

## 🔧 Next Steps

### Immediate Actions Required:

1. **Restart Zero-cache** to pick up entities table:
   ```bash
   pkill -9 -f zero-cache
   # Then restart dev services
   ```

2. **Verify Zero-cache logs** for entities table:
   ```bash
   tail -f /tmp/dev-clean.log | grep entities
   ```

3. **Manual browser testing** required for:
   - Search functionality (type "inv" and verify dropdown)
   - Counter increment/decrement
   - Entity detail pages
   - Navigation between pages

4. **Check Zero-cache schema** to ensure entities table is registered

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| **Page loads** | ✅ | No errors |
| **Navigation** | ✅ | All links work |
| **Console errors** | ✅ | None found |
| **Search API** | ✅ | Works with fuzzy matching |
| **Database data** | ✅ | 1000 entities exist |
| **Zero-sync entities** | ❌ | Not syncing |
| **Entities page** | ❌ | Shows 0 rows |
| **Search dropdown** | ⏳ | Can't test via Playwright |
| **Counter page** | ⏳ | Loads but content not visible |

## 🎓 Lessons Learned

1. ✅ **Always use Playwright** before declaring success
2. ✅ **Check database directly** to verify data exists
3. ✅ **Test API endpoints** separately from frontend
4. ✅ **Verify migrations applied** before testing
5. ⚠️ **Zero-cache needs restart** after schema changes
6. ⚠️ **Some UI elements** can't be tested via Playwright (need manual testing)

## 📝 Documentation

This issue was discovered during comprehensive Playwright testing as requested by the user.

**Created:** 2025-10-18 19:45 PST
**Status:** In Progress
**Blocker:** Zero-sync not syncing entities table
