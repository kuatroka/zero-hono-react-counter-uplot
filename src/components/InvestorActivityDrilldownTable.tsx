import { useMemo, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/DataTable";
import {
  fetchDrilldownBothActions,
  getDrilldownDataFromCollection,
  investorDrilldownCollection,
  type InvestorDetail
} from "@/collections/investor-details";

type InvestorActivityAction = "open" | "close";

interface InvestorActivityDrilldownRow {
  id: number;
  cik: string;
  cikName: string;
  cikTicker: string;
  cusip: string | null;
  quarter: string;
  action: InvestorActivityAction;
}

interface InvestorActivityDrilldownTableProps {
  ticker: string;
  cusip: string;
  quarter: string;
  action: InvestorActivityAction;
}

export function InvestorActivityDrilldownTable({
  ticker,
  cusip,
  quarter,
  action,
}: InvestorActivityDrilldownTableProps) {
  const enabled = Boolean(ticker && cusip && quarter);

  // State for data, loading, and timing
  const [data, setData] = useState<InvestorDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [queryTimeMs, setQueryTimeMs] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Subscribe to the collection for this slice
  const slice = useLiveQuery((q) =>
    q
      .from({ rows: investorDrilldownCollection })
      .select(({ rows }) => rows)
  );

  // Fetch if missing; otherwise use local slice instantly
  useEffect(() => {
    if (!enabled) return;

    const localRows = getDrilldownDataFromCollection(ticker, cusip, quarter, action);
    if (localRows) {
      setData(localRows);
      setQueryTimeMs(0);
      setFromCache(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsError(false);

    fetchDrilldownBothActions(ticker, cusip, quarter)
      .then((result) => {
        if (cancelled) return;
        const filtered = result.rows.filter((r) => r.action === action);
        setData(filtered);
        setQueryTimeMs(result.queryTimeMs);
        setFromCache(result.queryTimeMs === 0);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch drilldown data:", err);
        setIsError(true);
        setData([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, ticker, cusip, quarter, action]);

  // Keep data in sync with live query (instant updates once present)
  useEffect(() => {
    if (slice?.data && slice.data.length > 0) {
      const filtered = slice.data.filter(
        (r) => r.ticker === ticker && r.cusip === cusip && r.quarter === quarter && r.action === action
      );
      if (filtered.length > 0) {
        setData(filtered);
        setFromCache(true);
        if (queryTimeMs === null) setQueryTimeMs(0);
      }
    }
  }, [slice, queryTimeMs, ticker, cusip, quarter, action]);

  // Transform data to display format
  const rows = useMemo(() => {
    console.debug(
      `[DrilldownTable] rendering ${data.length} rows for ${ticker} ${quarter} ${action}`
    );
    return data.map((item: InvestorDetail, index: number) => ({
      id: index,
      cik: item.cik,
      cikName: item.cikName,
      cikTicker: item.cikTicker,
      cusip: item.cusip,
      quarter: item.quarter,
      action: item.action,
    }));
  }, [data]);

  const columns: ColumnDef<InvestorActivityDrilldownRow>[] = useMemo(
    () => [
      {
        key: "cikName",
        header: "Superinvestor",
        sortable: true,
        searchable: true,
        clickable: true,
        render: (value, row, isFocused) => (
          <Link
            to="/superinvestors/$cik"
            params={{ cik: row.cik }}
            className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${
              isFocused ? "underline" : ""
            }`}
          >
            {value || "(Unknown)"}
          </Link>
        ),
      },
      {
        key: "cik",
        header: "CIK",
        sortable: true,
        searchable: true,
      },
      {
        key: "cusip",
        header: "CUSIP",
        sortable: true,
        searchable: true,
      },
      {
        key: "quarter",
        header: "Quarter",
        sortable: true,
      },
    ],
    []
  );

  if (!enabled) {
    return null;
  }

  const totalCount = rows.length;
  const titleAction = action === "open" ? "opened" : "closed";
  const hasRows = rows.length > 0;
  const isInitialLoading = isLoading && !hasRows;
  const hasData = data.length > 0 || !isLoading;

  // Format latency display
  const latencyDisplay = (() => {
    if (queryTimeMs === null) return null;
    if (fromCache) {
      return <span className="text-green-600 font-medium">⚡ {queryTimeMs.toFixed(1)}ms (local cache)</span>;
    }
    return <span className="text-amber-600 font-medium">🌐 {queryTimeMs.toFixed(1)}ms (API fetch)</span>;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Superinvestors who {titleAction} positions in {ticker} ({quarter})</span>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Backed by TanStack DB local collection</span>
          {latencyDisplay}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[360px]" aria-busy={isInitialLoading}>
          {isInitialLoading ? (
            <div className="flex h-full items-center justify-center py-8 text-muted-foreground">
              Loading drilldown…
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center py-8 text-center text-destructive text-sm">
              Failed to load drilldown data
            </div>
          ) : hasRows ? (
            <DataTable
              data={rows}
              columns={columns}
              searchPlaceholder="Filter superinvestors..."
              defaultPageSize={10}
              defaultSortColumn="cikName"
              defaultSortDirection="asc"
              totalCount={totalCount}
            />
          ) : hasData ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2">
              <p className="font-medium">No detailed data available for this selection.</p>
              <p className="text-sm">
                The aggregate chart shows activity, but individual investor details are not available for {ticker} in {quarter}.
              </p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-8 text-muted-foreground">
              No superinvestors found for this selection.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
