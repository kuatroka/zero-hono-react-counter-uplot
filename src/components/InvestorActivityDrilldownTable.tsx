import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/DataTable";
import { 
  getDrilldownCollection,
  type InvestorDetail 
} from "@/collections/investor-details";
import { queryClient } from "@/collections/instances";

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
  quarter: string;
  action: InvestorActivityAction;
}

export function InvestorActivityDrilldownTable({
  ticker,
  quarter,
  action,
}: InvestorActivityDrilldownTableProps) {
  const enabled = Boolean(ticker && quarter);
  
  // Get the TanStack DB collection for this ticker
  const collection = enabled ? getDrilldownCollection(queryClient, ticker) : null;
  
  // Use live query to filter data by quarter and action
  let data: InvestorDetail[] = [];
  
  if (collection) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const liveQueryResult = useLiveQuery((q: any) =>
      q
        .from({ drilldown: collection })
        .where('quarter', '=', quarter)
        .where('action', '=', action)
    );
    data = (liveQueryResult?.data as InvestorDetail[]) ?? [];
  }

  // Transform data to display format
  const rows = useMemo(() => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Superinvestors who {titleAction} positions in {ticker} ({quarter})</span>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Backed by TanStack DB live queries</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[360px]">
          {hasRows ? (
            <DataTable
              data={rows}
              columns={columns}
              searchPlaceholder="Filter superinvestors..."
              defaultPageSize={10}
              defaultSortColumn="cikName"
              defaultSortDirection="asc"
              totalCount={totalCount}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2">
              <p className="font-medium">No detailed data available for this selection.</p>
              <p className="text-sm">
                The aggregate chart shows activity, but individual investor details are not available for {ticker} in {quarter}.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
