# Phase 2 - Critical Fix #2: Schema Type Mismatch

## 🐛 Issue Found via Playwright Testing

**Error:**
```
SchemaVersionNotSupported: The "entities"."created_at" column's upstream type "number" does not match the client type "string"
```

**Symptoms:**
- Pages load but show no data (0 entities)
- Zero-sync fails to sync entities table
- No visible console errors in browser (error only in zero-cache logs)

## 🔍 Root Cause

**Database Schema (PostgreSQL):**
```sql
created_at TIMESTAMP DEFAULT NOW()
```
- PostgreSQL TIMESTAMP is represented as a number (Unix timestamp) in Zero's internal format

**Client Schema (schema.ts):**
```typescript
created_at: string().from("created_at")  // ❌ WRONG!
```
- Was expecting a string, but Zero receives a number from PostgreSQL

## ✅ Fix Applied

### 1. Updated `src/schema.ts`
```typescript
const entity = table("entities")
  .columns({
    id: string(),
    name: string(),
    category: string(),
    description: string(),
    value: number(),
    created_at: number().from("created_at"),  // ✅ Changed to number()
  })
  .primaryKey("id");
```

### 2. Updated `src/pages/EntityDetail.tsx`
```typescript
const formatDate = (timestamp: number) => {  // ✅ Changed parameter type
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
```

## 🧪 Testing Results

### Before Fix:
- ❌ Zero-sync error: `SchemaVersionNotSupported`
- ❌ Entities page shows "0 entities"
- ❌ Search returns no results
- ❌ Detail pages don't load

### After Fix:
- ✅ No schema errors in zero-cache logs
- ✅ Build successful
- ⚠️ **Requires cache clear to see data**

## 🚀 Required Actions

**To complete the fix, you must:**

### 1. Restart All Services
```bash
# Stop all services (Ctrl+C in each terminal)
# Then restart:

# Terminal 1
bun run dev:db-up

# Terminal 2
bun run dev:zero-cache

# Terminal 3
bun run dev:api

# Terminal 4
bun run dev:ui
```

### 2. Clear Browser Cache
**Option A: Hard Refresh (Recommended)**
- Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Firefox: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
- Safari: `Cmd+Option+R`

**Option B: Clear IndexedDB Manually**
1. Open DevTools (F12)
2. Go to Application tab
3. Find IndexedDB in left sidebar
4. Delete all Zero-related databases
5. Refresh page

### 3. Verify Fix
Navigate to: `http://localhost:3003/entities`

**Expected Results:**
- ✅ Table shows 50 entities (first page)
- ✅ Filter buttons show counts: "All (1000)", "Investors (500)", "Assets (500)"
- ✅ Search box returns results
- ✅ Clicking entity name navigates to detail page
- ✅ Detail page shows formatted date

## 📦 Commit

```
5444657 fix: correct schema type for entities.created_at (number not string)
```

## 📚 Files Changed

1. `src/schema.ts` - Changed `created_at` from `string()` to `number()`
2. `src/pages/EntityDetail.tsx` - Updated `formatDate` parameter type

## 🎓 Lesson Learned

**PostgreSQL Type Mappings in Zero:**
- `TIMESTAMP` → `number()` (Unix timestamp in milliseconds)
- `VARCHAR/TEXT` → `string()`
- `INTEGER/BIGINT` → `number()`
- `BOOLEAN` → `boolean()`
- `JSONB` → `json<T>()`

**Always match Zero schema types to PostgreSQL's internal representation, not the SQL type name!**

## ⚠️ Important Note

The fix is committed and the code is correct. However, **you must restart services and clear browser cache** for the changes to take effect. Zero-sync caches schema information both server-side and client-side.

---

**Status:** ✅ Code Fixed | ⏳ Awaiting Service Restart & Cache Clear
