import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '../zero/queries';

export function CikSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
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

  const trimmedQuery = query.trim();
  const effectiveQuery = debouncedQuery;

  const [results] = useQuery(queries.cikSearch(effectiveQuery, 5));
  const visibleResults = results ?? [];

  useEffect(() => {
    setSelectedIndex(-1);
  }, [trimmedQuery, visibleResults.length]);

  const handleSelect = (cik: string) => {
    navigate(`/cik/${encodeURIComponent(cik)}`);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const moveSelection = (delta: number) => {
    if (!visibleResults.length) return;
    setIsOpen(true);
    setSelectedIndex((prev) => {
      const next = (prev + delta + visibleResults.length) % visibleResults.length;
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(-1);
      return;
    }

    const hasOptions = isOpen && visibleResults.length > 0;
    if (!hasOptions) {
      return;
    }

    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      moveSelection(1);
      return;
    }
    if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      moveSelection(-1);
      return;
    }
    if (e.key === 'Enter' && selectedIndex >= 0 && visibleResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(visibleResults[selectedIndex].cik as string);
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
        placeholder="Search CIK names..."
        className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
      />

      {isOpen && trimmedQuery && visibleResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {visibleResults.map((row: any, index: number) => (
            <button
              key={row.cik}
              onClick={() => handleSelect(row.cik as string)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-gray-900 font-medium">{row.cik_name}</span>
              <span className="ml-2 text-xs text-gray-500">CIK: {row.cik}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && trimmedQuery && results && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-3 text-gray-500 text-sm">
          No results found
        </div>
      )}
    </div>
  );
}
