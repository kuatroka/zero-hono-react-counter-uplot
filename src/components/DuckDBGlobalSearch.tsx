import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

// 50ms debounce for near-instant feel while reducing request volume
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface SearchResult {
  id: number;
  cusip: string | null;
  code: string;
  name: string | null;
  category: string;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  count: number;
  queryTimeMs: number;
}

async function fetchDuckDBSearch(query: string): Promise<SearchResponse> {
  const res = await fetch(`/api/duckdb-search?q=${encodeURIComponent(query)}&limit=20`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function DuckDBGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // 50ms debounce
  const debouncedQuery = useDebounce(query.trim(), 50);
  const shouldSearch = debouncedQuery.length >= 2;

  // TanStack Query for DuckDB search
  const { data, isFetching } = useQuery({
    queryKey: ["duckdb-search", debouncedQuery],
    queryFn: () => fetchDuckDBSearch(debouncedQuery),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: shouldSearch,
    // Keep previous results visible while the next keystroke is loading to avoid dropdown flash
    placeholderData: (prev) => prev,
  });

  const results = data?.results ?? [];

  // Close dropdown on outside click
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

  // Open dropdown when results arrive or while fetching; avoid closing during fetch to prevent flash
  useEffect(() => {
    const hasResults = results.length > 0;
    setIsOpen(shouldSearch && (hasResults || isFetching));
    if (shouldSearch && hasResults) {
      setHighlightedIndex(0);
    } else if (!isFetching) {
      setHighlightedIndex(-1);
    }
  }, [shouldSearch, results, isFetching]);

  const handleNavigate = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");

    if (result.category === "superinvestors") {
      navigate({ to: `/superinvestors/${encodeURIComponent(result.code)}` });
    } else if (result.category === "assets") {
      const cusip = result.cusip || "_";
      navigate({ to: `/assets/${encodeURIComponent(result.code)}/${encodeURIComponent(cusip)}` });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
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
      <div className="relative">
        <Input
          type="search"
          placeholder="DuckDB Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full sm:w-[20rem] pr-16"
        />
        {/* Query time badge */}
        {data?.queryTimeMs !== undefined && shouldSearch && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {data.queryTimeMs.toFixed(1)}ms
          </span>
        )}
        {isFetching && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            ...
          </span>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full sm:w-[20rem] rounded-md border border-border bg-popover shadow-lg">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                index === highlightedIndex ? "bg-muted" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleNavigate(result);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex flex-col truncate mr-2">
                {result.category === "assets" ? (
                  <>
                    <span className="truncate">
                      <span className="font-bold">{result.code}</span>
                      {result.name && <span> - {result.name}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {result.cusip || ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{result.name || result.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {result.code}
                    </span>
                  </>
                )}
              </div>
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
