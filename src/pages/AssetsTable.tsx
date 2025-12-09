import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { AllAssetsActivityChart } from '@/components/charts/AllAssetsActivityChart';
import { useContentReady } from '@/hooks/useContentReady';

interface Asset {
  id: string;
  asset: string;
  assetName: string;
  cusip: string | null;
}

const ASSETS_TOTAL_ROWS = 32000;

export function AssetsTablePage() {
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

  // Use TanStack Query to fetch assets data directly from API
  // This is a transitional approach while TanStack DB collections are being set up
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json() as Promise<Asset[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter assets client-side based on search term
  const filteredAssets = useMemo(() => {
    if (!assetsData) return [];
    if (!trimmedSearch) return assetsData;

    const lowerSearch = trimmedSearch.toLowerCase();
    return assetsData.filter(asset =>
      asset.asset.toLowerCase().includes(lowerSearch) ||
      asset.assetName.toLowerCase().includes(lowerSearch)
    );
  }, [assetsData, trimmedSearch]);

  // Signal ready when data is available
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    if (assetsData !== undefined) {
      readyCalledRef.current = true;
      onReady();
    }
  }, [assetsData, onReady]);

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/assets',
      search: { page: String(newPage), search: trimmedSearch || undefined },
    });
  };

  const handleSearchChange = (value: string) => {
    isTypingRef.current = true;
    setSearchTerm(value);
  };

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
            onMouseDown={() => {
              rowSelectedRef.current = true;
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
    <div className="w-full px-4 py-8 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        <p className="text-muted-foreground">Browse and search all assets</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading…</div>
            ) : (
              <DataTable
                data={filteredAssets || []}
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
                totalCount={trimmedSearch ? filteredAssets.length : ASSETS_TOTAL_ROWS}
              />
            )}
          </CardContent>
        </Card>

        <AllAssetsActivityChart />
      </div>
    </div>
  );
}
