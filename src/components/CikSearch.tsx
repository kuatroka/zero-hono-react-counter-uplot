import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@rocicorp/zero/react";
import { queries } from "@/zero/queries";
import { Input } from "@/components/ui/input";

export function CikSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(queryParam);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const isTypingRef = useRef(false);
  const resultSelectedRef = useRef(false);

  const trimmed = query.trim();
  const shouldSearch = trimmed.length >= 2;

  const [results] = useQuery(
    shouldSearch ? queries.searchesByName(trimmed, 10) : queries.searchesByName("", 0),
    { ttl: "5m" }
  );

  // Clear search term on mount if no result was selected (page refresh scenario)
  useEffect(() => {
    if (queryParam && !resultSelectedRef.current) {
      // Clear the query param on refresh if no result was selected
      const params = new URLSearchParams(searchParams);
      params.delete('q');
      setSearchParams(params, { replace: true });
      setQuery('');
    }
  }, []); // Run only on mount

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync URL with query state changes
  useEffect(() => {
    if (!isTypingRef.current) return; // Only update URL when user is typing

    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
    isTypingRef.current = false;
  }, [query, searchParams, setSearchParams]);

  useEffect(() => {
    setIsOpen(shouldSearch && !!results && results.length > 0);
    if (shouldSearch && results && results.length > 0) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [shouldSearch, results]);

  const handleQueryChange = (value: string) => {
    isTypingRef.current = true;
    setQuery(value);
  };

  const handleNavigate = (result: any) => {
    resultSelectedRef.current = true;
    setIsOpen(false);
    setQuery("");
    // Clear the query parameter when navigating
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);

    if (result.category === "superinvestors") {
      navigate(`/superinvestors/${encodeURIComponent(result.code)}`);
    } else if (result.category === "assets") {
      navigate(`/assets/${encodeURIComponent(result.code)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        return next;
      });
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        handleNavigate(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <Input
        type="search"
        placeholder="Search superinvestors, tickers..."
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full sm:w-96"
      />
      {isOpen && results && (
        <div className="absolute z-50 mt-1 w-full sm:w-96 rounded-md border border-border bg-popover shadow-lg">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${index === highlightedIndex ? "bg-muted" : ""
                }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleNavigate(result);
              }}
              onMouseEnter={() => {
                setHighlightedIndex(index);
              }}
            >
              <span className="truncate mr-2">{result.name || result.code}</span>
              <span className="ml-auto text-xs uppercase text-muted-foreground">
                {result.category}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
