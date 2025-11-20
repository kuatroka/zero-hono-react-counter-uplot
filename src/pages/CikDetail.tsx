import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '../zero/queries';

export function CikDetail() {
  const { cik } = useParams<{ cik: string }>();

  const [rows] = useQuery(queries.cikById(cik || ''));

  const entry = rows?.[0] as { cik: string; cik_name: string } | undefined;

  if (!entry) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Link
        to="/"
        className="text-blue-600 hover:text-blue-800 hover:underline mb-6 inline-block font-medium"
      >
        Back to Home
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{entry.cik_name}</h1>
        <div className="text-lg text-gray-800 mb-2">
          <span className="font-semibold">CIK:</span> {entry.cik}
        </div>
      </div>
    </div>
  );
}
