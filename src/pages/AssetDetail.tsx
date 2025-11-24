import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';
import { Schema } from '@/schema';

export function AssetDetailPage() {
  const { asset } = useParams();
  const navigate = useNavigate();

  if (!asset) return <div className="p-6">Missing asset id.</div>;

  const [rows] = useQuery(
    queries.assetBySymbol(asset || ''),
    { enabled: Boolean(asset) }
  );

  if (!rows) {
    return <div className="p-6">Loading…</div>;
  }

  const record = rows[0];

  if (!record) return <div className="p-6">Asset not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
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
  );
}
