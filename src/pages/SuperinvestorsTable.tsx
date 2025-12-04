import { useEffect, useRef, useState } from 'react';
import { useQuery, useZero } from '@rocicorp/zero/react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Superinvestor, Schema, Search } from '@/schema';
import { queries } from '@/zero/queries';
import { preload, PRELOAD_TTL, PRELOAD_LIMITS } from '@/zero-preload';
import { useContentReady } from '@/hooks/useContentReady';

const SUPERINVESTORS_TOTAL_ROWS = 14908; // See REFRESH-PERSISTENCE-TEST.md / ZERO-PERSISTENCE-FIX-FINAL.md

export function SuperinvestorsTablePage() {
  const z = useZero<Schema>();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { page?: string; search?: string };
  const { onReady } = useContentReady();

  const tablePageSize = 10;
  const DEFAULT_WINDOW_LIMIT = PRELOAD_LIMITS.superinvestorsTable;
  const MAX_WINDOW_LIMIT = 50000; // Allow syncing up to 50k rows as user pages
  const MARGIN_PAGES = 5; // Preload 5 pages ahead

  const rawPage = searchParams.page;
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const searchParam = searchParams.search ?? '';
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const isTypingRef = useRef(false);
  const rowSelectedRef = useRef(false);

  // Sync searchTerm with URL only on external navigation (not while typing)
  useEffect(() => {
    if (!isTypingRef.current) {
      setSearchTerm(searchParam);
    }
    isTypingRef.current = false;
  }, [searchParam]);

  // Clear search term on mount if no row was selected (page refresh scenario)
  useEffect(() => {
    if (searchParam && !rowSelectedRef.current) {
      navigate({ search: { page: '1' }, replace: true });
      setSearchTerm('');
    }
  }, []); // Run only on mount

  const trimmedSearch = searchTerm.trim();

  // Sync URL with searchTerm state changes
  useEffect(() => {
    if (!isTypingRef.current) return;
    const newSearch: { page: string; search?: string } = { page: '1' };
    if (searchTerm.trim()) {
      newSearch.search = searchTerm;
    }
    navigate({ search: newSearch });
    isTypingRef.current = false;
  }, [searchTerm, navigate]);

  const [windowLimit, setWindowLimit] = useState(() => {
    const required = currentPage * tablePageSize;
    const base = Math.max(DEFAULT_WINDOW_LIMIT, required + tablePageSize * MARGIN_PAGES);
    return Math.min(base, MAX_WINDOW_LIMIT);
  });

  const [superinvestorsPageRows, superinvestorsResult] = useQuery(
    queries.superinvestorsPage(windowLimit, 0),
    { ttl: PRELOAD_TTL, enabled: !trimmedSearch }
  );

  const SEARCH_LIMIT = 200;

  const [superinvestorSearchRows, searchResult] = useQuery(
    trimmedSearch
      ? queries.searchesByCategory('superinvestors', trimmedSearch, SEARCH_LIMIT)
      : queries.searchesByCategory('superinvestors', '', 0),
    { ttl: PRELOAD_TTL }
  );

  
  const searchSuperinvestors: Superinvestor[] | undefined = trimmedSearch
    ? superinvestorSearchRows?.map((row: Search) => ({
      id: row.id,
      cik: row.code,
      cikName: row.name,
      cikTicker: '',
      activePeriods: '',
    }))
    : undefined;

  const superinvestors = trimmedSearch ? searchSuperinvestors || [] : superinvestorsPageRows || [];

  // Signal ready when data is available (from cache or server)
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    if (trimmedSearch) {
      if ((superinvestorSearchRows && superinvestorSearchRows.length > 0) || searchResult.type === 'complete') {
        readyCalledRef.current = true;
        onReady();
      }
    } else {
      if ((superinvestorsPageRows && superinvestorsPageRows.length > 0) || superinvestorsResult.type === 'complete') {
        readyCalledRef.current = true;
        onReady();
      }
    }
  }, [trimmedSearch, superinvestorsPageRows, superinvestorsResult.type, superinvestorSearchRows, searchResult.type, onReady]);

  useEffect(() => {
    if (trimmedSearch) return; // search mode ignores windowLimit
    const required = currentPage * tablePageSize;
    if (required > windowLimit) {
      setWindowLimit(prev => {
        const base = Math.max(prev, required + tablePageSize * MARGIN_PAGES);
        return Math.min(base, MAX_WINDOW_LIMIT);
      });
    }
  }, [currentPage, windowLimit, trimmedSearch]);

  useEffect(() => {
    preload(z);
  }, [z]);

  const handlePageChange = (newPage: number) => {
    const newSearch: { page: string; search?: string } = { page: String(newPage) };
    if (trimmedSearch) {
      newSearch.search = trimmedSearch;
    }
    navigate({ search: newSearch });

    if (trimmedSearch) {
      return; // pagination over search results is handled client-side only
    }

    const required = newPage * tablePageSize;
    if (required > windowLimit) {
      setWindowLimit(prev => {
        const base = Math.max(prev, required + tablePageSize * MARGIN_PAGES);
        return Math.min(base, MAX_WINDOW_LIMIT);
      });
    }
  };

  const handleSearchChange = (value: string) => {
    isTypingRef.current = true;
    setSearchTerm(value);
  };

  const columns: ColumnDef<Superinvestor>[] = [
    {
      key: 'cik',
      header: 'CIK',
      sortable: true,
      searchable: true,
      clickable: true,
      render: (value, row, isFocused) => (
        <a
          href={`/superinvestors/${row.cik}`}
          onMouseEnter={() => {
            z.preload(queries.superinvestorByCik(row.cik), { ttl: PRELOAD_TTL });
          }}
          onClick={(e) => {
            e.preventDefault();
            rowSelectedRef.current = true;
            z.preload(queries.superinvestorByCik(row.cik), { ttl: PRELOAD_TTL });
            navigate({ to: `/superinvestors/${encodeURIComponent(row.cik)}` });
          }}
          className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${isFocused ? 'underline' : ''}`}
        >
          {String(value)}
        </a>
      ),
    },
    {
      key: 'cikName',
      header: 'Name',
      sortable: true,
      searchable: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Superinvestors</CardTitle>
          <CardDescription>Browse and search institutional investors (13F filers)</CardDescription>
        </CardHeader>
        <CardContent>
          {(
            (!trimmedSearch && !superinvestorsPageRows) ||
            (trimmedSearch && !superinvestorSearchRows)
          ) ? (
            <div className="py-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <DataTable
              data={superinvestors || []}
              columns={columns}
              searchPlaceholder="Search superinvestors..."
              defaultPageSize={tablePageSize}
              defaultSortColumn="cikName"
              defaultSortDirection="asc"
              initialPage={currentPage}
              onPageChange={handlePageChange}
              onSearchChange={handleSearchChange}
              searchValue={searchTerm}
              searchDisabled={!!trimmedSearch}
              totalCount={trimmedSearch ? superinvestors?.length ?? 0 : SUPERINVESTORS_TOTAL_ROWS}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
