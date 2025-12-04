import { useEffect, useRef, useState } from 'react';
import { useQuery, useZero } from '@rocicorp/zero/react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset, Schema, Search } from '@/schema';
import { queries } from '@/zero/queries';
import { preload, PRELOAD_TTL, PRELOAD_LIMITS } from '@/zero-preload';
import { useContentReady } from '@/hooks/useContentReady';

const ASSETS_TOTAL_ROWS = 32000;

export function AssetsTablePage() {
  const z = useZero<Schema>();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { page?: string; search?: string };
  const { onReady } = useContentReady();
  const tablePageSize = 10;
  const DEFAULT_WINDOW_LIMIT = PRELOAD_LIMITS.assetsTable;
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
      navigate({ to: '/assets', search: { page: '1', search: undefined }, replace: true });
      setSearchTerm('');
    }
  }, []); // Run only on mount

  const trimmedSearch = searchTerm.trim();

  // Sync URL with searchTerm state changes
  useEffect(() => {
    if (!isTypingRef.current) return;
    navigate({
      to: '/assets',
      search: { page: '1', search: searchTerm.trim() || undefined },
    });
    isTypingRef.current = false;
  }, [searchTerm, navigate]);

  const [windowLimit, setWindowLimit] = useState(() => {
    const required = currentPage * tablePageSize;
    const base = Math.max(DEFAULT_WINDOW_LIMIT, required + tablePageSize * MARGIN_PAGES);
    return Math.min(base, MAX_WINDOW_LIMIT);
  });

  const [assetsPageRows] = useQuery(
    queries.assetsPage(windowLimit, 0),
    { ttl: PRELOAD_TTL, enabled: !trimmedSearch }
  );

  const SEARCH_LIMIT = 200;

  const [assetSearchRows] = useQuery(
    trimmedSearch
      ? queries.searchesByCategory('assets', trimmedSearch, SEARCH_LIMIT)
      : queries.searchesByCategory('assets', '', 0),
    { ttl: PRELOAD_TTL }
  );

  
  // Map search results to Asset-like objects, preserving cusip
  const searchAssets: Asset[] | undefined = trimmedSearch
    ? assetSearchRows?.map((row: Search) => ({
      id: row.id,
      asset: row.code,
      assetName: row.name,
      cusip: row.cusip ?? null,
    }))
    : undefined;

  const assets = trimmedSearch ? searchAssets || [] : assetsPageRows || [];

  // Signal ready when data is available (from cache or server)
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return; // Only call onReady once

    if (trimmedSearch) {
      // In search mode: ready when search results arrive
      if ((assetSearchRows && assetSearchRows.length > 0) || assetSearchRows !== undefined) {
        readyCalledRef.current = true;
        onReady();
      }
    } else {
      // In browse mode: ready when page results arrive
      if ((assetsPageRows && assetsPageRows.length > 0) || assetsPageRows !== undefined) {
        readyCalledRef.current = true;
        onReady();
      }
    }
  }, [trimmedSearch, assetsPageRows, assetSearchRows, onReady]);

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
    navigate({
      to: '/assets',
      search: { page: String(newPage), search: trimmedSearch || undefined },
    });

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

  // Helper removed: using route params API on Link

  const columns: ColumnDef<Asset>[] = [
    {
      key: 'asset',
      header: 'Asset',
      sortable: true,
      searchable: true,
      clickable: true,
      render: (value, row, isFocused) => {
        return (
          <Link
            to="/assets/$code/$cusip"
            params={{ code: row.asset, cusip: row.cusip ?? '_' }}
            onMouseEnter={() => {
              // Preload asset record
              if (row.cusip) {
                z.preload(queries.assetBySymbolAndCusip(row.asset, row.cusip), { ttl: PRELOAD_TTL });
                // Preload investor activity for charts
                z.preload(queries.investorActivityByCusip(row.cusip), { ttl: PRELOAD_TTL });
              } else {
                z.preload(queries.assetBySymbol(row.asset), { ttl: PRELOAD_TTL });
                // Preload investor activity for charts
                z.preload(queries.investorActivityByTicker(row.asset), { ttl: PRELOAD_TTL });
              }
            }}
            onMouseDown={() => {
              rowSelectedRef.current = true;
              // Preload asset record
              if (row.cusip) {
                z.preload(queries.assetBySymbolAndCusip(row.asset, row.cusip), { ttl: PRELOAD_TTL });
                // Preload investor activity for charts
                z.preload(queries.investorActivityByCusip(row.cusip), { ttl: PRELOAD_TTL });
              } else {
                z.preload(queries.assetBySymbol(row.asset), { ttl: PRELOAD_TTL });
                // Preload investor activity for charts
                z.preload(queries.investorActivityByTicker(row.asset), { ttl: PRELOAD_TTL });
              }
            }}
            className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${isFocused ? 'underline' : ''}`}
          >
            {String(value)}
          </Link>
        );
      },
    },
    {
      key: 'assetName',
      header: 'Asset Name',
      sortable: true,
      searchable: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Assets</CardTitle>
          <CardDescription>Browse and search all assets</CardDescription>
        </CardHeader>
        <CardContent>
          {(
            (!trimmedSearch && !assetsPageRows) ||
            (trimmedSearch && !assetSearchRows)
          ) ? (
            <div className="py-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <DataTable
              data={assets || []}
              columns={columns}
              searchPlaceholder="Search assets..."
              defaultPageSize={tablePageSize}
              defaultSortColumn="assetName"
              defaultSortDirection="asc"
              initialPage={currentPage}
              onPageChange={handlePageChange}
              onSearchChange={handleSearchChange}
              searchValue={searchTerm}
              searchDisabled={!!trimmedSearch}
              totalCount={trimmedSearch ? assets.length : ASSETS_TOTAL_ROWS}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
