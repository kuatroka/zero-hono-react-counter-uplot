# URL Search Persistence Implementation

## Overview

This document describes the URL parameter persistence implementation for both table-level search and global search functionality.

## Implementation Details

### Table Search Persistence (AssetsTable & SuperinvestorsTable)

**URL Parameters:**
- `page`: Current page number (e.g., `?page=2`)
- `search`: Search term (e.g., `?search=apple`)

**Behavior:**
1. On component mount, reads `search` parameter from URL and initializes search input
2. When user types in search box, updates URL with `?search=term&page=1`
3. When user clears search, removes `search` parameter from URL
4. When user changes pages, preserves both `page` and `search` parameters
5. Search always resets to page 1

**Example URLs:**
- `/assets?page=1` - First page, no search
- `/assets?page=2&search=apple` - Second page with search term "apple"
- `/superinvestors?search=berkshire` - First page with search term "berkshire"

### Global Search Persistence (CikSearch)

**URL Parameters:**
- `q`: Global search query (e.g., `?q=tesla`)

**Behavior:**
1. On component mount, reads `q` parameter from URL and initializes search input
2. When user types in global search, updates URL with `?q=term`
3. When user clears search, removes `q` parameter from URL
4. When user selects a result and navigates, clears `q` parameter

**Example URLs:**
- `/?q=tesla` - Home page with global search "tesla"
- `/assets?q=apple` - Assets page with global search "apple"

## Technical Implementation

### DataTable Component

Added `searchValue` prop to make search input controlled:

```tsx
interface DataTableProps<T> {
  // ... other props
  searchValue?: string;
}

// Sync external searchValue with internal state
useEffect(() => {
  if (searchValue !== undefined) {
    setSearchQuery(searchValue);
  }
}, [searchValue]);
```

### Table Pages (AssetsTable/SuperinvestorsTable)

```tsx
// Read from URL
const searchParam = searchParams.get('search') ?? '';
const [searchTerm, setSearchTerm] = useState(searchParam);

// Update URL when search changes
const handleSearchChange = (value: string) => {
  setSearchTerm(value);
  const params = new URLSearchParams();
  params.set('page', '1');
  if (value.trim()) {
    params.set('search', value.trim());
  }
  setSearchParams(params);
};

// Pass to DataTable
<DataTable
  searchValue={searchTerm}
  onSearchChange={handleSearchChange}
  // ... other props
/>
```

### Global Search (CikSearch)

```tsx
// Read from URL
const [searchParams, setSearchParams] = useSearchParams();
const queryParam = searchParams.get('q') ?? '';
const [query, setQuery] = useState(queryParam);

// Update URL when query changes
const handleQueryChange = (value: string) => {
  setQuery(value);
  const params = new URLSearchParams(searchParams);
  if (value.trim()) {
    params.set('q', value.trim());
  } else {
    params.delete('q');
  }
  setSearchParams(params);
};

// Clear URL when navigating to result
const handleNavigate = (result: any) => {
  setIsOpen(false);
  setQuery("");
  const params = new URLSearchParams(searchParams);
  params.delete('q');
  setSearchParams(params);
  // ... navigate
};
```

## Benefits

1. **Shareable URLs**: Users can share URLs with search terms and pagination
2. **Browser Navigation**: Back/forward buttons work correctly with search state
3. **Bookmarkable**: Users can bookmark specific search results
4. **Refresh Persistence**: Search state survives page refreshes
5. **Deep Linking**: Can link directly to specific search results

## Testing

To test URL persistence:

1. **Table Search:**
   - Go to `/assets` or `/superinvestors`
   - Type a search term
   - Verify URL updates with `?search=term&page=1`
   - Change pages and verify both parameters persist
   - Clear search and verify `search` parameter is removed
   - Refresh page and verify search state is restored

2. **Global Search:**
   - Type in the global search box
   - Verify URL updates with `?q=term`
   - Clear search and verify `q` parameter is removed
   - Refresh page and verify search state is restored
   - Select a result and verify `q` parameter is cleared

## Related Files

- `src/components/DataTable.tsx` - Table component with controlled search
- `src/pages/AssetsTable.tsx` - Assets table with URL persistence
- `src/pages/SuperinvestorsTable.tsx` - Superinvestors table with URL persistence
- `src/components/CikSearch.tsx` - Global search with URL persistence
