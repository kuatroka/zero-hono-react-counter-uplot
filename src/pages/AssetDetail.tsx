import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';
import { InvestorActivityChart } from '@/components/charts/InvestorActivityChart';
import { InvestorActivityUplotChart } from '@/components/charts/InvestorActivityUplotChart';
import { useContentReady } from '@/hooks/useContentReady';
import { useEffect, useRef } from 'react';

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

      {/* Full-width chart section */}
      <div className="mt-8 space-y-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 sm:px-6 lg:px-8">
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
            <InvestorActivityChart data={activityRows} ticker={record.asset} />
            <InvestorActivityUplotChart data={activityRows} ticker={record.asset} />
            {/* Nivo chart temporarily disabled */}
            {/* <InvestorActivityNivoChart data={activityRows} ticker={record.asset} /> */}
            {/* ECharts chart temporarily disabled */}
            {/* <InvestorActivityEchartsChart data={activityRows} ticker={record.asset} /> */}
          </>
        )}
      </div>
    </>
  );
}
