import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { getZero } from '../zero-client';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const z = getZero();
  const searchQuery = debouncedQuery.length >= 2
    ? z.query.entities
        .where('name', 'ILIKE', `%${debouncedQuery}%`)
        .limit(5)
    : z.query.entities.limit(0);
  
  const [results] = useQuery(searchQuery);

  const handleSelect = (entityId: string) => {
    navigate(`/entities/${entityId}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search investors or assets..."
        className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
      />
      
      {isOpen && debouncedQuery.length >= 2 && results && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((entity) => (
            <button
              key={entity.id}
              onClick={() => handleSelect(entity.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center justify-between border-b border-gray-100 last:border-b-0"
            >
              <span className="text-gray-900 font-medium">{entity.name}</span>
              <span className={`px-2 py-1 text-xs rounded font-medium ${
                entity.category === 'investor' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {entity.category}
              </span>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && debouncedQuery.length >= 2 && results && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-3 text-gray-500 text-sm">
          No results found
        </div>
      )}
    </div>
  );
}
