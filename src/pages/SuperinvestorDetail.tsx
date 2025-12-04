import { useEffect, useRef } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';
import { useContentReady } from '@/hooks/useContentReady';

export function SuperinvestorDetailPage() {
  const { cik } = useParams({ strict: false }) as { cik?: string };
  const { onReady } = useContentReady();

  const [rows, result] = useQuery(
    queries.superinvestorByCik(cik || ''),
    { enabled: Boolean(cik) }
  );

  const record = rows?.[0];

  // Signal ready when data is available (from cache or server)
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    if (record || result.type === 'complete') {
      readyCalledRef.current = true;
      onReady();
    }
  }, [record, result.type, onReady]);

  if (!cik) return <div className="p-6">Missing CIK.</div>;

  if (record) {
    // We have data, render it immediately (even if still syncing)
  } else if (result.type === 'unknown') {
    // Still loading and no cached data yet
    return <div className="p-6">Loading…</div>;
  } else {
    // Query completed but no record found
    return <div className="p-6">Superinvestor not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{record.cikName}</h1>
      </div>
      <div className="space-y-3 text-lg">
        <div><span className="font-semibold">CIK:</span> {record.cik}</div>
        <div><span className="font-semibold">Ticker:</span> {record.cikTicker ?? '—'}</div>
        <div><span className="font-semibold">Active Periods:</span> {record.activePeriods ?? '—'}</div>
        <div><span className="font-semibold">ID:</span> {record.id}</div>
      </div>
      <div className="mt-6">
        <Link to="/superinvestors" search={{}} className="link link-primary">Back to superinvestors</Link>
      </div>
    </div>
  );
}
