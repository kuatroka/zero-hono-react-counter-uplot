import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '../zero/queries';

export function CikDetail() {
  const { category, code } = useParams<{ category: string; code: string }>();

  const effectiveCode = code || '';
  const [rows] = useQuery(queries.searchByCode(effectiveCode || '')); 

  const entry = rows?.[0] as { id: number; code: string; name: string | null; category: string } | undefined;

  if (!effectiveCode) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Invalid detail URL</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No matching entry found</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{entry.name ?? entry.code}</h1>
        <div className="text-lg text-gray-800 mb-2">
          <span className="font-semibold">Category:</span> {entry.category}
        </div>
        <div className="text-lg text-gray-800 mb-2">
          <span className="font-semibold">Code:</span> {entry.code}
        </div>
        {category && category !== entry.category && (
          <div className="mt-4 text-sm text-orange-600">
            Note: URL category "{category}" does not match stored category "{entry.category}".
          </div>
        )}
      </div>
    </div>
  );
}
