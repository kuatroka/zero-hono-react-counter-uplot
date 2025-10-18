import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { zero } from '../zero-client';

type CategoryFilter = 'all' | 'investor' | 'asset';

interface EntitiesListProps {
  initialCategory?: CategoryFilter;
}

export function EntitiesList({ initialCategory = 'all' }: EntitiesListProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(initialCategory);

  const [allEntities] = useQuery(
    categoryFilter === 'all'
      ? zero.query.entities.orderBy('name', 'asc')
      : zero.query.entities.where('category', categoryFilter).orderBy('name', 'asc')
  );

  const totalCount = allEntities?.length || 0;

  const handleFilterChange = (filter: CategoryFilter) => {
    setCategoryFilter(filter);
  };

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        {categoryFilter === 'all' ? 'All Entities' : 
         categoryFilter === 'investor' ? 'Investors' : 'Assets'}
      </h1>
      
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({allEntities?.length || 0})
        </button>
        <button
          onClick={() => handleFilterChange('investor')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'investor' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Investors
        </button>
        <button
          onClick={() => handleFilterChange('asset')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            categoryFilter === 'asset' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Assets
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allEntities && allEntities.length > 0 ? (
              allEntities.slice(0, 50).map((entity) => (
                <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/entities/${entity.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {entity.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      entity.category === 'investor' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {entity.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {entity.description?.substring(0, 100)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                    {formatValue(entity.value)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No entities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing {Math.min(50, totalCount)} of {totalCount} entities
        </div>
      </div>
    </div>
  );
}
