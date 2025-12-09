import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { InvestorActivityUplotChart } from '@/components/charts/InvestorActivityUplotChart';
import { InvestorActivityEchartsChart } from '@/components/charts/InvestorActivityEchartsChart';
import { InvestorActivityDrilldownTable } from '@/components/InvestorActivityDrilldownTable';
import { useContentReady } from '@/hooks/useContentReady';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type CusipQuarterInvestorActivity } from '@/schema';

type InvestorActivityAction = 'open' | 'close';

interface InvestorActivitySelection {
  quarter: string;
  action: InvestorActivityAction;
}

interface Asset {
  id: string;
  asset: string;
  assetName: string;
  cusip: string | null;
}

export function AssetDetailPage() {
  const { code, cusip } = useParams({ strict: false }) as { code?: string; cusip?: string };
  const { onReady } = useContentReady();

  // Determine if we have a valid cusip (not "_" placeholder)
  const hasCusip = cusip && cusip !== "_";

  // Query asset from TanStack Query directly
  const { data: assetsData, isLoading: isAssetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json() as Promise<Asset[]>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Find the specific asset record
  const record = assetsData?.find(a =>
    hasCusip
      ? a.asset === code && a.cusip === cusip
      : a.asset === code
  );

  // Signal ready immediately when asset record is available
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    if (record || (!isAssetsLoading && assetsData !== undefined)) {
      readyCalledRef.current = true;
      onReady();
    }
  }, [record, isAssetsLoading, assetsData, onReady]);

  // Query investor activity from DuckDB
  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['investor-activity', hasCusip ? cusip : code],
    queryFn: async () => {
      const res = await fetch(`/api/all-assets-activity?${hasCusip ? `cusip=${cusip}` : `ticker=${code}`}`);
      if (!res.ok) throw new Error('Failed to fetch investor activity');
      const data = await res.json();
      return (data.rows || []) as CusipQuarterInvestorActivity[];
    },
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
  });

  const activityRows = activityData ?? [];

  const [selection, setSelection] = useState<InvestorActivitySelection | null>(null);
  const scrollYRef = useRef<number | null>(null);

  const handleSelectionChange = useCallback((next: InvestorActivitySelection) => {
    if (typeof window !== 'undefined') {
      scrollYRef.current = window.scrollY;
    }
    setSelection(next);
  }, []);

  useEffect(() => {
    if (scrollYRef.current == null) return;
    const y = scrollYRef.current;
    scrollYRef.current = null;
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, left: 0, behavior: 'auto' });
        });
      });
    }
  }, [selection]);

  // Reset selection when ticker changes
  useEffect(() => {
    setSelection(null);
  }, [code]);

  // Set initial selection using the latest aggregate quarter.
  useEffect(() => {
    if (selection || activityRows.length === 0 || !code) return;

    const findQuarterWithData = async () => {
      const fetchCount = async (
        quarter: string,
        action: InvestorActivityAction,
      ): Promise<number> => {
        try {
          const params = new URLSearchParams({ ticker: code, quarter, action });
          const res = await fetch(`/api/duckdb-investor-drilldown?${params.toString()}`);
          if (!res.ok) return 0;
          const data = await res.json();
          return typeof data.count === 'number' ? data.count : 0;
        } catch {
          return 0;
        }
      };

      const latestQuarter = activityRows[activityRows.length - 1]?.quarter;

      if (latestQuarter) {
        const latestOpenCount = await fetchCount(latestQuarter, 'open');
        if (latestOpenCount > 0) {
          setSelection({ quarter: latestQuarter, action: 'open' });
          return;
        }

        const latestCloseCount = await fetchCount(latestQuarter, 'close');
        if (latestCloseCount > 0) {
          setSelection({ quarter: latestQuarter, action: 'close' });
          return;
        }
      }

      const findForAction = async (action: InvestorActivityAction): Promise<string | null> => {
        for (let i = activityRows.length - 1; i >= 0; i--) {
          const quarter = activityRows[i]?.quarter;
          if (!quarter) continue;
          const count = await fetchCount(quarter, action);
          if (count > 0) return quarter;
        }
        return null;
      };

      const openQuarter = await findForAction('open');
      if (openQuarter) {
        setSelection({ quarter: openQuarter, action: 'open' });
        return;
      }

      const closeQuarter = await findForAction('close');
      if (closeQuarter) {
        setSelection({ quarter: closeQuarter, action: 'close' });
        return;
      }

      if (latestQuarter) {
        setSelection({ quarter: latestQuarter, action: 'open' });
      }
    };

    void findQuarterWithData();
  }, [selection, activityRows, code]);

  if (!code) return <div className="p-6">Missing asset code.</div>;

  if (isAssetsLoading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!record) {
    return <div className="p-6">Asset not found.</div>;
  }

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-3 items-center">
        <div className="text-left">
          <Link
            to="/assets"
            search={{ page: undefined, search: undefined }}
            className="text-primary hover:underline whitespace-nowrap"
          >
            &larr; Back to assets
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">({record.asset}) {record.assetName}</h1>
        </div>
        <div className="text-right"></div>
      </div>

      {/* Chart + drilldown section */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        {isActivityLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading investor activity charts...
          </div>
        ) : activityRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No investor activity data available for this asset.
          </div>
        ) : (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InvestorActivityUplotChart
                data={activityRows}
                ticker={record.asset}
                onBarClick={({ quarter, action }) => handleSelectionChange({ quarter, action })}
              />
              <InvestorActivityEchartsChart
                data={activityRows}
                ticker={record.asset}
                onBarClick={({ quarter, action }) => handleSelectionChange({ quarter, action })}
              />
            </div>
            <div className="mt-8 min-h-[200px]">
              {selection ? (
                <InvestorActivityDrilldownTable
                  ticker={record.asset}
                  quarter={selection.quarter}
                  action={selection.action}
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Select a bar in the chart to see which superinvestors opened or closed positions.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
