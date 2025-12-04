import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { queries } from "@/zero/queries";
import { PRELOAD_TTL } from "@/zero-preload";
import { Input } from "@/components/ui/input";
import { Schema } from "@/schema";

export function GlobalSearch() {
  const z = useZero<Schema>();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { q?: string };
  const queryParam = searchParams.q ?? "";
  const [query, setQuery] = useState(queryParam);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const isTypingRef = useRef(false);
  const resultSelectedRef = useRef(false);

  const trimmed = query.trim();
  const shouldSearch = trimmed.length >= 2;

  // Two parallel queries: one for code matches (high priority), one for name matches
  const [codeResults] = useQuery(
    shouldSearch
      ? queries.searchesByCode(trimmed, 20)
      : queries.searchesByCode("", 0),
    { ttl: PRELOAD_TTL }
  );

  const [nameResults] = useQuery(
    shouldSearch
      ? queries.searchesByName(trimmed, 30)
      : queries.searchesByName("", 0),
    { ttl: PRELOAD_TTL }
  );

  // Merge and rank results: code matches first, then name matches, deduplicated
  // Memoize to prevent unnecessary recalculations and effect re-triggers
  const results = useMemo(() => {
    if (!shouldSearch) return [];
    
    const searchLower = trimmed.toLowerCase();
    const seen = new Set<number>();
    const merged: typeof codeResults = [];

    // Helper to calculate score for sorting
    const getScore = (item: { code?: string; name?: string }) => {
      const codeLower = (item.code || "").toLowerCase();
      const nameLower = (item.name || "").toLowerCase();
      
      // Highest priority: exact code match
      if (codeLower === searchLower) return 100;
      // Code starts with search term
      if (codeLower.startsWith(searchLower)) return 80;
      // Code contains search term
      if (codeLower.includes(searchLower)) return 60;
      // Name starts with search term
      if (nameLower.startsWith(searchLower)) return 40;
      // Name contains search term
      if (nameLower.includes(searchLower)) return 20;
      return 0;
    };

    // Add code results first (they matched on code)
    for (const item of codeResults || []) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }

    // Add name results (deduplicated)
    for (const item of nameResults || []) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }

    // Sort by score descending, then alphabetically by name
    return merged
      .sort((a, b) => {
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (a.name || "").localeCompare(b.name || "");
      })
      .slice(0, 10);
  }, [shouldSearch, trimmed, codeResults, nameResults]);

  // Clear search term on mount if no result was selected (page refresh scenario)
  useEffect(() => {
    if (queryParam && !resultSelectedRef.current) {
      navigate({ search: {}, replace: true });
      setQuery("");
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
    if (!isTypingRef.current) return;
    if (query.trim()) {
      navigate({ search: { q: query } });
    } else {
      navigate({ search: {} });
    }
    isTypingRef.current = false;
  }, [query, navigate]);

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

  const preloadResult = (result: any) => {
    if (result.category === "superinvestors") {
      z.preload(queries.superinvestorByCik(result.code), { ttl: PRELOAD_TTL });
    } else if (result.category === "assets") {
      if (result.cusip) {
        z.preload(queries.assetBySymbolAndCusip(result.code, result.cusip), { ttl: PRELOAD_TTL });
        z.preload(queries.investorActivityByCusip(result.cusip), { ttl: PRELOAD_TTL });
      } else {
        z.preload(queries.assetBySymbol(result.code), { ttl: PRELOAD_TTL });
        z.preload(queries.investorActivityByTicker(result.code), { ttl: PRELOAD_TTL });
      }
    }
  };

  const handleNavigate = (result: any) => {
    resultSelectedRef.current = true;
    setIsOpen(false);
    setQuery("");

    // Preload before navigation
    preloadResult(result);

    if (result.category === "superinvestors") {
      navigate({ to: `/superinvestors/${encodeURIComponent(result.code)}` });
    } else if (result.category === "assets") {
      const cusip = result.cusip || "_";
      navigate({ to: `/assets/${encodeURIComponent(result.code)}/${encodeURIComponent(cusip)}` });
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
        const next = prev < results.length - 1 ? prev + 1 : prev;
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : prev;
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
        className="w-full sm:w-[30rem]"
      />
      {isOpen && results && (
        <div className="absolute z-50 mt-1 w-full sm:w-[30rem] rounded-md border border-border bg-popover shadow-lg">
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
              onMouseEnter={() => {
                setHighlightedIndex(index);
                // Preload on hover for instant navigation
                preloadResult(result);
              }}
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
