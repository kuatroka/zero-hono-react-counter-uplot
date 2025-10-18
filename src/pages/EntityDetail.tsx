import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { zero } from '../zero-client';

export function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  
  const [entities] = useQuery(
    zero.query.entities.where('id', id || '')
  );
  
  const entity = entities?.[0];

  if (!entity) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-8">
      <Link 
        to="/entities" 
        className="text-blue-600 hover:text-blue-800 hover:underline mb-6 inline-block font-medium"
      >
        ← Back to Entities
      </Link>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900">{entity.name}</h1>
          <span className={`px-4 py-2 rounded-lg font-medium text-sm ${
            entity.category === 'investor' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {entity.category.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Value</label>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {formatValue(entity.value)}
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Created</label>
            <div className="text-xl font-semibold text-gray-900 mt-2">
              {formatDate(entity.created_at)}
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600 uppercase tracking-wide block mb-3">Description</label>
          <p className="text-lg text-gray-800 leading-relaxed">{entity.description}</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Entity ID:</span> {entity.id}
          </div>
        </div>
      </div>
    </div>
  );
}
