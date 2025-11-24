import { useEffect, useState } from 'react';
import { useQuery, useZero } from '@rocicorp/zero/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset, Schema, Search } from '@/schema';
import { queries } from '@/zero/queries';
import { preload } from '@/zero-preload';

const ASSETS_TOTAL_ROWS = 32000;

export function AssetsTablePage() {
  const z = useZero<Schema>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tablePageSize = 10;
  const DEFAULT_WINDOW_LIMIT = 1000;
  const MAX_WINDOW_LIMIT = 1000;
  const MARGIN_PAGES = 0;

  const rawPage = searchParams.get('page');
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const [searchTerm, setSearchTerm] = useState('');
  const trimmedSearch = searchTerm.trim();

  const [windowLimit, setWindowLimit] = useState(() => {
    const required = currentPage * tablePageSize;
    const base = Math.max(DEFAULT_WINDOW_LIMIT, required + tablePageSize * MARGIN_PAGES);
    return Math.min(base, MAX_WINDOW_LIMIT);
  });

  const [assetsPageRows] = useQuery(
    queries.assetsPage(windowLimit, 0),
    { ttl: '5m', enabled: !trimmedSearch }
  );

  const SEARCH_LIMIT = 200;

  const [assetSearchRows] = useQuery(
    trimmedSearch
      ? queries.searchesByCategory('assets', trimmedSearch, SEARCH_LIMIT)
      : queries.searchesByCategory('assets', '', 0),
    { ttl: '5m' }
  );

  const searchAssets: Asset[] | undefined = trimmedSearch
    ? assetSearchRows?.map((row: Search) => ({
        id: row.id,
        asset: row.code,
        assetName: row.name,
      }))
    : undefined;

  const assets = trimmedSearch ? searchAssets || [] : assetsPageRows || [];

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
    preload(z, { limit: DEFAULT_WINDOW_LIMIT });
  }, [z]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });

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

  const columns: ColumnDef<Asset>[] = [
    {
      key: 'asset',
      header: 'Asset',
      sortable: true,
      searchable: true,
      clickable: true,
      render: (value, row, isFocused) => (
        <a
          href={`/assets/${row.asset}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/assets/${encodeURIComponent(row.asset)}`);
          }}
          className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${isFocused ? 'underline' : ''}`}
        >
          {String(value)}
        </a>
      ),
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
              onSearchChange={setSearchTerm}
              searchDisabled={!!trimmedSearch}
              totalCount={trimmedSearch ? assets.length : ASSETS_TOTAL_ROWS}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
