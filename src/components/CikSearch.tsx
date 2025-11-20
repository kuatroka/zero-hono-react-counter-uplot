import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@rocicorp/zero/react';
import { getZero } from '../zero-client';

export function CikSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
  const trimmedQuery = query.trim();

  // Search both name and code columns
  const nameQuery = trimmedQuery
    ? z.query.searches
      .where('name', 'ILIKE', `%${trimmedQuery}%`)
      .limit(10)
    : z.query.searches.limit(0);

  const codeQuery = trimmedQuery
    ? z.query.searches
      .where('code', 'ILIKE', `%${trimmedQuery}%`)
      .limit(10)
    : z.query.searches.limit(0);

  const queryOpts = query !== debouncedQuery ? undefined : ({ ttl: 'none' } as const);

  const [nameResults] = useQuery(nameQuery, queryOpts);
  const [codeResults] = useQuery(codeQuery, queryOpts);

  // Merge results and deduplicate by id
  const allResults = [...(nameResults ?? []), ...(codeResults ?? [])];
  const uniqueResultsMap = new Map();
  allResults.forEach(row => {
    if (!uniqueResultsMap.has(row.id)) {
      uniqueResultsMap.set(row.id, row);
    }
  });
  const visibleResults = Array.from(uniqueResultsMap.values()).slice(0, 10);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [trimmedQuery, visibleResults.length]);

  const handleSelect = (row: any) => {
    if (!row) return;
    const category = row.category;
    const code = row.code;
    if (!category || !code) {
      return;
    }
    navigate(`/${encodeURIComponent(category)}/${encodeURIComponent(code)}`);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const moveSelection = (delta: number) => {
    if (!visibleResults.length) return;
    setIsOpen(true);
    setSelectedIndex((prev) => {
      // Clamp the selection within bounds instead of wrapping
      const next = Math.max(0, Math.min(visibleResults.length - 1, prev + delta));

      // Only scroll if the selection actually changed
      if (next !== prev) {
        setTimeout(() => {
          itemRefs.current[next]?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          });
        }, 0);
      }
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
      handleSelect(visibleResults[selectedIndex]);
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
        placeholder="Search names or codes..."
        className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
      />

      {isOpen && trimmedQuery && visibleResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-scroll scrollbar-visible">
          {visibleResults.map((row: any, index: number) => (
            <button
              key={row.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() => handleSelect(row)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between border-b border-gray-100 last:border-b-0 ${selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
            >
              <span className="text-gray-900 font-medium">{row.name ?? row.code}</span>
              <span className="ml-2 text-xs text-gray-500">{row.category} · {row.code}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && trimmedQuery && nameResults && codeResults && nameResults.length === 0 && codeResults.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-3 text-gray-500 text-sm">
          No results found
        </div>
      )}
    </div>
  );
}
