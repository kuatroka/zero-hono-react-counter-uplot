import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';
import { InvestorActivityChart } from '@/components/charts/InvestorActivityChart';
import { InvestorActivityUplotChart } from '@/components/charts/InvestorActivityUplotChart';
import { InvestorActivityNivoChart } from '@/components/charts/InvestorActivityNivoChart';
import { InvestorActivityEchartsChart } from '@/components/charts/InvestorActivityEchartsChart';

export function AssetDetailPage({ onReady }: { onReady: () => void }) {
  const { asset } = useParams();

  const [rows, result] = useQuery(
    queries.assetBySymbol(asset || ''),
    { enabled: Boolean(asset) }
  );

  const [activityData] = useQuery(
    queries.investorActivityByTicker(asset || ''),
    { enabled: Boolean(asset) }
  );

  const record = rows?.[0];
  const activityRows = activityData ?? [];

  // Signal ready when data is available (from cache or server)
  useEffect(() => {
    if (record || result.type === 'complete') {
      onReady();
    }
  }, [record, result.type, onReady]);

  if (!asset) return <div className="p-6">Missing asset id.</div>;

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
          <div><span className="font-semibold">ID:</span> {record.id}</div>
        </div>

        <div className="mt-6">
          <Link to="/assets" className="link link-primary">Back to assets</Link>
        </div>
      </div>

      {/* Full-width chart section */}
      <div className="mt-8 space-y-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 sm:px-6 lg:px-8">
        <InvestorActivityChart data={activityRows} ticker={record.asset} />
        <InvestorActivityUplotChart data={activityRows} ticker={record.asset} />
        <InvestorActivityNivoChart data={activityRows} ticker={record.asset} />
        <InvestorActivityEchartsChart data={activityRows} ticker={record.asset} />
      </div>
    </>
  );
}
