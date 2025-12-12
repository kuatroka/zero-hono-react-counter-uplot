import { useParams, Link } from '@tanstack/react-router';
import { useLiveQuery } from '@tanstack/react-db';
import { useContentReady } from '@/hooks/useContentReady';
import { useEffect, useRef } from 'react';
import { superinvestorsCollection } from '@/collections';

export function SuperinvestorDetailPage() {
  const { cik } = useParams({ strict: false }) as { cik?: string };
  const { onReady } = useContentReady();

  // Query superinvestors from TanStack DB local collection (instant from IndexedDB cache)
  // Data is preloaded on app init and persisted to IndexedDB
  const { data: superinvestorsData, isLoading } = useLiveQuery(
    (q) => q.from({ superinvestors: superinvestorsCollection }),
  );

  // Find the specific superinvestor record
  const record = superinvestorsData?.find(s => s.cik === cik);

  // Signal ready when data is available (from cache or server)
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    if (record || (!isLoading && superinvestorsData !== undefined)) {
      readyCalledRef.current = true;
      onReady();
    }
  }, [record, isLoading, superinvestorsData, onReady]);

  if (!cik) return <div className="p-6">Missing CIK.</div>;

  // Show loading while data is loading OR while we have no data yet
  // (Dexie collections may return empty array initially before IndexedDB loads)
  if (isLoading || (superinvestorsData?.length === 0)) {
    return <div className="p-6">Loading…</div>;
  }

  if (!record) {
    return <div className="p-6">Superinvestor not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{record.cikName}</h1>
      </div>
      <div className="space-y-3 text-lg">
        <div><span className="font-semibold">CIK:</span> {record.cik}</div>
      </div>
      <div className="mt-6">
        <Link to="/superinvestors" search={{ page: undefined, search: undefined }} className="link link-primary">Back to superinvestors</Link>
      </div>
    </div>
  );
}
