import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';
import { InvestorActivityChart } from '@/components/charts/InvestorActivityChart';
import { InvestorActivityUplotChart } from '@/components/charts/InvestorActivityUplotChart';
import { InvestorActivityEchartsChart } from '@/components/charts/InvestorActivityEchartsChart';
import { InvestorActivityDrilldownTable } from '@/components/InvestorActivityDrilldownTable';
import { useContentReady } from '@/hooks/useContentReady';
import { useCallback, useEffect, useRef, useState } from 'react';

type InvestorActivityAction = 'open' | 'close';

interface InvestorActivitySelection {
  quarter: string;
  action: InvestorActivityAction;
}

export function AssetDetailPage() {
  const { code, cusip } = useParams({ strict: false }) as { code?: string; cusip?: string };
  const { onReady } = useContentReady();
  
  // Determine if we have a valid cusip (not "_" placeholder)
  const hasCusip = cusip && cusip !== "_";

  // Query asset: prefer by symbol+cusip if cusip is available, otherwise by symbol only
  const [rowsBySymbolAndCusip, resultBySymbolAndCusip] = useQuery(
    queries.assetBySymbolAndCusip(code || '', cusip || ''),
    { enabled: Boolean(code) && Boolean(hasCusip), ttl: '5m' }
  );

  const [rowsBySymbol, resultBySymbol] = useQuery(
    queries.assetBySymbol(code || ''),
    { enabled: Boolean(code) && !hasCusip, ttl: '5m' }
  );

  // Use the appropriate result based on whether we have a cusip
  const rows = hasCusip ? rowsBySymbolAndCusip : rowsBySymbol;
  const result = hasCusip ? resultBySymbolAndCusip : resultBySymbol;
  const record = rows?.[0];

  // Signal ready immediately when asset record is available (don't wait for charts)
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return; // Only call onReady once
    
    if (record || result.type === 'complete') {
      readyCalledRef.current = true;
      onReady();
    }
  }, [record, result.type, onReady]);

  // Query investor activity: prefer by cusip if available, otherwise by ticker
  const [activityByCusip, activityByCusipResult] = useQuery(
    queries.investorActivityByCusip(cusip || ''),
    { enabled: Boolean(hasCusip), ttl: '5m' }
  );

  const [activityByTicker, activityByTickerResult] = useQuery(
    queries.investorActivityByTicker(code || ''),
    { enabled: Boolean(code) && !hasCusip, ttl: '5m' }
  );

  const activityRows = hasCusip ? (activityByCusip ?? []) : (activityByTicker ?? []);
  const activityResult = hasCusip ? activityByCusipResult : activityByTickerResult;
  const isActivityLoading = activityResult?.type === 'unknown';

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
      // Use double rAF to restore scroll after browser paint and any router scroll restoration
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
  // Preference order:
  // 1) For the LATEST quarter: OPEN positions
  // 2) For the LATEST quarter: if no opens, CLOSE positions
  // 3) If latest quarter has no detail data at all: scan backwards for
  //    any OPEN quarter, then any CLOSE quarter
  // 4) If still nothing: select latest quarter (open) to show "no data" message
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

      // 1) Prefer OPEN positions in the latest quarter, if any
      if (latestQuarter) {
        const latestOpenCount = await fetchCount(latestQuarter, 'open');
        if (latestOpenCount > 0) {
          setSelection({ quarter: latestQuarter, action: 'open' });
          return;
        }

        // 2) Otherwise prefer CLOSE positions in that same latest quarter, if any
        const latestCloseCount = await fetchCount(latestQuarter, 'close');
        if (latestCloseCount > 0) {
          setSelection({ quarter: latestQuarter, action: 'close' });
          return;
        }
      }

      // 3) Latest quarter has no detail data: scan backwards for any
      //    quarter with OPEN positions, then any with CLOSE positions
      const findForAction = async (action: InvestorActivityAction): Promise<string | null> => {
        for (let i = activityRows.length - 1; i >= 0; i--) {
          const quarter = activityRows[i]?.quarter;
          if (!quarter) continue;

          const count = await fetchCount(quarter, action);
          if (count > 0) {
            return quarter;
          }
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

      // 4) Nothing has detail data: still select latest quarter to
      //    show the "no data" message
      if (latestQuarter) {
        setSelection({ quarter: latestQuarter, action: 'open' });
      }
    };

    void findQuarterWithData();
  }, [selection, activityRows, code]);

  if (!code) return <div className="p-6">Missing asset code.</div>;

  if (record) {
    // We have data, render it immediately (even if still syncing)
  } else if (result.type === 'unknown') {
    // Still loading and no cached data yet
    return <div className="p-6">Loading…</div>;
  } else {
    // Query completed but no record found
    return <div className="p-6">Asset not found.</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{record.assetName}</h1>
        </div>
        <div className="space-y-3 text-lg">
          <div><span className="font-semibold">Symbol:</span> {record.asset}</div>
          {record.cusip && <div><span className="font-semibold">CUSIP:</span> {record.cusip}</div>}
          <div><span className="font-semibold">ID:</span> {record.id}</div>
        </div>

        <div className="mt-6">
          <Link to="/assets" search={{ page: undefined, search: undefined }} className="link link-primary">Back to assets</Link>
        </div>
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
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <InvestorActivityChart
                data={activityRows}
                ticker={record.asset}
                onBarClick={({ quarter, action }) => handleSelectionChange({ quarter, action })}
              />
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
