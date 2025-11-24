import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useZero } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';
import { Schema } from '@/schema';

export function SuperinvestorDetailPage() {
  const { cik } = useParams();
  const z = useZero<Schema>();
  const navigate = useNavigate();

  const [rows, result] = useQuery(
    cik ? queries.superinvestorByCik(cik) : undefined,
    { enabled: Boolean(cik) }
  );

  const record = rows?.[0];

  if (!cik) return <div className="p-6">Missing CIK.</div>;
  if (result.type === 'loading') return <div className="p-6">Loading…</div>;
  if (!record) return <div className="p-6">Superinvestor not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="text-3xl font-bold">{record.cikName}</h1>
      </div>
      <div className="space-y-3 text-lg">
        <div><span className="font-semibold">CIK:</span> {record.cik}</div>
        <div><span className="font-semibold">Ticker:</span> {record.cikTicker ?? '—'}</div>
        <div><span className="font-semibold">Active Periods:</span> {record.activePeriods ?? '—'}</div>
        <div><span className="font-semibold">ID:</span> {record.id}</div>
      </div>
      <div className="mt-6">
        <Link to="/superinvestors" className="link link-primary">Back to superinvestors</Link>
      </div>
    </div>
  );
}
