# Search Fix - Case-Insensitive Substring Matching

## Problem
The global search was case-sensitive and only worked when typing exact case matches. For example:
- Typing "I" or "V" (uppercase) didn't find "investor" (lowercase)
- Typing "TOR" found "investor" because it matched the end of the word

## Root Cause
Zero's LIKE operator in client-side queries doesn't support case-insensitive matching (ILIKE).

## Solution
Changed from database-level LIKE query to client-side filtering:

### Before:
```typescript
const [results] = useQuery(
  zero.query.entities
    .where('name', 'LIKE', `%${debouncedQuery}%`)
    .limit(5)
);
```

### After:
```typescript
const [allResults] = useQuery(
  debouncedQuery.length >= 2
    ? zero.query.entities.limit(100)
    : zero.query.entities.limit(0)
);

const results = allResults
  ? allResults
      .filter((entity) =>
        entity.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      .slice(0, 5)
  : [];
```

## Changes Made

1. **Fetch 100 entities** when query length >= 2
2. **Client-side filtering** with case-insensitive matching
3. **Minimum 2 characters** before searching
4. **Limit to 5 results** for display

## Benefits

✅ **Case-insensitive**: "in", "IN", "In" all find "Investor 1"
✅ **Substring matching**: Finds text at beginning, middle, or end
✅ **Performance**: Only fetches when needed (2+ chars)
✅ **User-friendly**: Works as expected for any letter combination

## Testing

Test these scenarios:
1. Type "in" → Should find "Investor 1", "Investor 2", etc.
2. Type "IV" → Should find "Investor" entries (case-insensitive)
3. Type "tor" → Should find "Investor" entries (end of word)
4. Type "asset 5" → Should find "Asset 50", "Asset 51", etc.
5. Type "a" → Should NOT search (< 2 chars)

## Performance Considerations

- Fetches 100 entities max (small dataset)
- Filtering happens in-memory (fast)
- Debounced by 300ms (reduces queries)
- Zero-sync keeps data cached in IndexedDB

For larger datasets (10k+ entities), consider:
- Server-side search with Postgres ILIKE
- Full-text search with pg_trgm indexes
- Synced queries with custom search logic

## Files Changed

- `src/components/GlobalSearch.tsx`

## Commit

```
f4b34f3 fix: improve search to be case-insensitive and work from any position (min 2 chars)
```
