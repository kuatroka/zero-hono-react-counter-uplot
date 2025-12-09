import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';

import { InvestorActivityUplotChart } from '@/components/charts/InvestorActivityUplotChart';
import { InvestorActivityEchartsChart } from '@/components/charts/InvestorActivityEchartsChart';
import { InvestorFlowChart } from '@/components/charts/InvestorFlowChart';
import { InvestorActivityDrilldownTable } from '@/components/InvestorActivityDrilldownTable';
import { useContentReady } from '@/hooks/useContentReady';
import { useCallback, useEffect, useRef, useState } from 'react';
import { assetsCollection, queryClient } from '@/collections';
import { backgroundLoadAllDrilldownData, fetchDrilldownData } from '@/collections/investor-details';

import { type CusipQuarterInvestorActivity, type InvestorFlow } from '@/schema';

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

  // Query assets from TanStack DB local collection (instant)
  // Data is preloaded on app init
  const { data: assetsData, isLoading: isAssetsLoading } = useLiveQuery(
    (q) => q.from({ assets: assetsCollection }),
  );

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

  // Query investor flow from DuckDB
  const { data: flowData, isLoading: isFlowLoading } = useQuery({
    queryKey: ['investor-flow', hasCusip ? cusip : code],
    queryFn: async () => {
      const res = await fetch(`/api/investor-flow?ticker=${hasCusip && cusip ? cusip : code}`);
      if (!res.ok) throw new Error('Failed to fetch investor flow');
      const data = await res.json();
      return (data.rows || []) as InvestorFlow[];
    },
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
  });

  const activityRows = activityData ?? [];
  const flowRows = flowData ?? [];

  const [selection, setSelection] = useState<InvestorActivitySelection | null>(null);
  const scrollYRef = useRef<number | null>(null);
  const [backgroundLoadProgress, setBackgroundLoadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const backgroundLoadStartedRef = useRef(false);

  const handleSelectionChange = useCallback((next: InvestorActivitySelection) => {
    console.log(`[Bar Click] Changing selection to ${next.quarter} ${next.action}`);
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

  // Reset selection and background load flag when ticker changes
  useEffect(() => {
    setSelection(null);
    backgroundLoadStartedRef.current = false;
  }, [code]);

  // Set initial selection to latest quarter immediately when activity data loads.
  // Try 'open' first, fall back to 'close' if no open data exists.
  useEffect(() => {
    if (selection || activityRows.length === 0 || !code) return;
    
    const latestQuarter = activityRows[activityRows.length - 1]?.quarter;
    if (!latestQuarter) return;
    
    // Check if latest quarter has open data
    const latestQuarterData = activityRows[activityRows.length - 1];
    const hasOpenData = latestQuarterData?.numOpen && latestQuarterData.numOpen > 0;
    const hasCloseData = latestQuarterData?.numClose && latestQuarterData.numClose > 0;
    
    if (hasOpenData) {
      console.log(`[Initial Selection] Setting to ${latestQuarter} open`);
      setSelection({ quarter: latestQuarter, action: 'open' });
    } else if (hasCloseData) {
      console.log(`[Initial Selection] No open data for ${latestQuarter}, falling back to close`);
      setSelection({ quarter: latestQuarter, action: 'close' });
    } else {
      // No data in latest quarter, try previous quarters
      for (let i = activityRows.length - 2; i >= 0; i--) {
        const row = activityRows[i];
        if (!row) continue;
        
        const quarter = row.quarter;
        if (!quarter) continue;
        
        const hasOpen = row.numOpen && row.numOpen > 0;
        const hasClose = row.numClose && row.numClose > 0;
        
        if (hasOpen) {
          console.log(`[Initial Selection] No data in latest quarter, setting to ${quarter} open`);
          setSelection({ quarter, action: 'open' });
          return;
        } else if (hasClose) {
          console.log(`[Initial Selection] No open data found, setting to ${quarter} close`);
          setSelection({ quarter, action: 'close' });
          return;
        }
      }
      
      // Fallback: just use latest quarter with open (table will show no data)
      console.log(`[Initial Selection] No data found in any quarter, defaulting to ${latestQuarter} open`);
      setSelection({ quarter: latestQuarter, action: 'open' });
    }
    
    // Eagerly load BOTH actions for the latest quarter to make clicks instant
    if (latestQuarter && code) {
      console.log(`[Eager Load] Fetching both open and close for ${latestQuarter}`);
      Promise.all([
        fetchDrilldownData(queryClient, code, latestQuarter, 'open'),
        fetchDrilldownData(queryClient, code, latestQuarter, 'close'),
      ]).then(() => {
        console.log(`[Eager Load] Both actions loaded for ${latestQuarter}`);
      }).catch(err => {
        console.error('[Eager Load] Failed:', err);
      });
    }
  }, [selection, activityRows, code]);

  // Start background loading AFTER initial selection is set
  // Wait a bit to let the table fetch its data first, then load remaining quarters
  useEffect(() => {
    if (!selection || !code || backgroundLoadStartedRef.current || activityRows.length === 0) return;
    
    backgroundLoadStartedRef.current = true;
    
    const allQuarters = activityRows.map(row => row.quarter).filter((q): q is string => q != null);
    
    if (allQuarters.length === 0) {
      console.log(`[Background Load] No quarters to load`);
      setBackgroundLoadProgress({ loaded: 0, total: 0 });
      return;
    }
    
    // Get the latest quarter (most likely to be clicked)
    const latestQuarter = allQuarters[0]; // Assuming quarters are sorted descending
    const remainingQuarters = allQuarters.filter(q => q !== latestQuarter);
    
    // Delay background loading to let the table fetch its data first
    const timeoutId = setTimeout(() => {
      console.log(`[Background Load] Starting for ${code} - loading both actions for ${latestQuarter}, then ${remainingQuarters.length} remaining quarters`);
      
      backgroundLoadAllDrilldownData(
        queryClient,
        code,
        remainingQuarters, // Load remaining quarters (latest is already fully loaded)
        (loaded, total) => {
          setBackgroundLoadProgress({ loaded, total });
          if (loaded === total) {
            console.log(`[Background Load] Complete for ${code}: ${total} combinations loaded`);
          }
        }
      ).catch(err => {
        console.error('[Background Load] Failed:', err);
      });
    }, 500); // 500ms delay to let table fetch first
    
    return () => clearTimeout(timeoutId);
  }, [selection, code, activityRows]);

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

            {/* Investor Flow Chart */}
            <div className="mt-6">
              {isFlowLoading ? (
                <div className="h-[400px] flex items-center justify-center border rounded-lg bg-card text-muted-foreground">
                  Loading flow chart...
                </div>
              ) : (
                <InvestorFlowChart data={flowRows} ticker={record.asset} />
              )}
            </div>

            <div className="mt-8 min-h-[200px]">
              {/* Background loading progress indicator */}
              {backgroundLoadProgress && backgroundLoadProgress.loaded < backgroundLoadProgress.total && (
                <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>
                    Pre-loading drill-down data: {backgroundLoadProgress.loaded}/{backgroundLoadProgress.total} 
                    ({Math.round((backgroundLoadProgress.loaded / backgroundLoadProgress.total) * 100)}%)
                  </span>
                </div>
              )}
              {backgroundLoadProgress && backgroundLoadProgress.loaded === backgroundLoadProgress.total && (
                <div className="mb-4 text-sm text-green-600 flex items-center gap-2">
                  <span>✓ All drill-down data loaded - clicks are now instant!</span>
                </div>
              )}
              
              {selection ? (
                <InvestorActivityDrilldownTable
                  key={`${record.asset}-${selection.quarter}-${selection.action}`}
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
