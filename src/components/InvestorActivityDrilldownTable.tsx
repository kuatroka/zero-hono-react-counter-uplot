import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/DataTable";

type InvestorActivityAction = "open" | "close";

interface DuckDBDrilldownRow {
  cusip: string | null;
  quarter: string | null;
  cik: number | null;
  didOpen: boolean | null;
  didAdd: boolean | null;
  didReduce: boolean | null;
  didClose: boolean | null;
  didHold: boolean | null;
  cikName: string | null;
  cikTicker: string | null;
}

interface DuckDBDrilldownResponse {
  ticker: string;
  quarter: string;
  action: InvestorActivityAction;
  count: number;
  queryTimeMs: number;
  rows: DuckDBDrilldownRow[];
}

interface InvestorActivityDrilldownRow {
  id: number;
  cik: string;
  cikName: string;
  cikTicker: string;
  cusip: string | null;
  quarter: string | null;
  action: InvestorActivityAction;
}

interface InvestorActivityDrilldownTableProps {
  ticker: string;
  quarter: string;
  action: InvestorActivityAction;
}

async function fetchDrilldown(
  ticker: string,
  quarter: string,
  action: InvestorActivityAction
): Promise<DuckDBDrilldownResponse> {
  const params = new URLSearchParams({ ticker, quarter, action });
  const res = await fetch(`/api/duckdb-investor-drilldown?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Drilldown request failed with status ${res.status}`);
  }
  return res.json();
}

export function InvestorActivityDrilldownTable({
  ticker,
  quarter,
  action,
}: InvestorActivityDrilldownTableProps) {
  const enabled = Boolean(ticker && quarter);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["duckdb-investor-drilldown", ticker, quarter, action],
    queryFn: () => fetchDrilldown(ticker, quarter, action),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const rows: InvestorActivityDrilldownRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map((row, index) => ({
      id: index,
      cik: row.cik != null ? String(row.cik) : "",
      cikName: row.cikName ?? "",
      cikTicker: row.cikTicker ?? "",
      cusip: row.cusip ?? null,
      quarter: row.quarter ?? null,
      action: data.action,
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

  const totalCount = data?.count ?? rows.length;

  const titleAction = action === "open" ? "opened" : "closed";
  const hasRows = rows.length > 0;
  const isInitialLoading = isLoading && !hasRows;
  const hasPreviousData = data !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Superinvestors who {titleAction} positions in {ticker} ({quarter})
        </CardTitle>
        <CardDescription>
          Backed by DuckDB native drilldown. {typeof data?.queryTimeMs === "number" &&
            `Query time: ${data.queryTimeMs.toFixed(1)}ms`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[360px]" aria-busy={isInitialLoading || isFetching}>
          {isInitialLoading ? (
            <div className="flex h-full items-center justify-center py-8 text-muted-foreground">
              Loading drilldown…
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center py-8 text-center text-destructive text-sm">
              Failed to load drilldown: {(error as Error)?.message ?? "Unknown error"}
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
          ) : hasPreviousData ? (
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

          {isFetching && hasRows && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm text-sm text-muted-foreground">
              Refreshing drilldown…
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
