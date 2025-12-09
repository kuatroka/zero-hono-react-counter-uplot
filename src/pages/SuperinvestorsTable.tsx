import { useEffect, useRef, useState, useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContentReady } from '@/hooks/useContentReady';
import { superinvestorsCollection, type Superinvestor } from '@/collections';

const SUPERINVESTORS_TOTAL_ROWS = 14908;

export function SuperinvestorsTablePage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { page?: string; search?: string };
  const { onReady } = useContentReady();
  const tablePageSize = 10;

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
      navigate({ to: '/superinvestors', search: { page: '1', search: undefined }, replace: true });
      setSearchTerm('');
    }
  }, []); // Run only on mount

  const trimmedSearch = searchTerm.trim();

  // Sync URL with searchTerm state changes
  useEffect(() => {
    if (!isTypingRef.current) return;
    navigate({
      to: '/superinvestors',
      search: { page: '1', search: searchTerm.trim() || undefined },
    });
    isTypingRef.current = false;
  }, [searchTerm, navigate]);

  // Use TanStack DB useLiveQuery for instant local queries
  // Data is preloaded on app init, so queries execute against local collection
  const { data: superinvestorsData, isLoading } = useLiveQuery(
    (q) => q.from({ superinvestors: superinvestorsCollection }),
  );

  // Filter superinvestors client-side based on search term
  // This filtering happens instantly against local data
  const filteredSuperinvestors = useMemo(() => {
    if (!superinvestorsData) return [];
    if (!trimmedSearch) return superinvestorsData;

    const lowerSearch = trimmedSearch.toLowerCase();
    return superinvestorsData.filter((investor: Superinvestor) =>
      investor.cik.toLowerCase().includes(lowerSearch) ||
      investor.cikName.toLowerCase().includes(lowerSearch)
    );
  }, [superinvestorsData, trimmedSearch]);

  // Signal ready when data is available
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    if (superinvestorsData !== undefined) {
      readyCalledRef.current = true;
      onReady();
    }
  }, [superinvestorsData, onReady]);

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/superinvestors',
      search: { page: String(newPage), search: trimmedSearch || undefined },
    });
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
        <Link
          to="/superinvestors/$cik"
          params={{ cik: row.cik }}
          onMouseDown={() => {
            rowSelectedRef.current = true;
          }}
          className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${isFocused ? 'underline' : ''}`}
        >
          {String(value)}
        </Link>
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
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <DataTable
              data={filteredSuperinvestors || []}
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
              totalCount={trimmedSearch ? filteredSuperinvestors?.length ?? 0 : SUPERINVESTORS_TOTAL_ROWS}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
