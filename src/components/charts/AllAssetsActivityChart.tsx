"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { OpenedClosedBarChart } from "./OpenedClosedBarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LatencyBadge } from "@/components/LatencyBadge";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DataFlow } from "@/components/LatencyBadge";
import { allAssetsActivityCollection, queryClient } from "@/collections";
import { allAssetsActivityTiming } from "@/collections/all-assets-activity";

interface AllAssetsActivityChartProps {
  /** Callback when a bar is clicked (optional - for drilldown) */
  onBarClick?: (selection: { quarter: string; action: "open" | "close" }) => void;
}

/**
 * ECharts chart showing aggregated opened/closed positions across ALL assets by quarter.
 * Data is fetched from DuckDB via /api/all-assets-activity endpoint.
 */
export function AllAssetsActivityChart({ onBarClick }: AllAssetsActivityChartProps) {
  const mountTimeRef = useRef(performance.now());
  const initialHadQueryDataRef = useRef(
    queryClient.getQueryData(["all-assets-activity"]) != null
  );

  const { data: rows, isLoading } = useLiveQuery((q) =>
    q.from({ rows: allAssetsActivityCollection })
  );

  const queryState = queryClient.getQueryState(["all-assets-activity"]);
  const error = queryState?.status === "error" ? queryState.error : null;

  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [dataFlow, setDataFlow] = useState<DataFlow>("unknown");

  useEffect(() => {
    if (!rows) return;

    if (initialHadQueryDataRef.current) {
      setLatencyMs(0);
      setDataFlow("tsdb-memory");
      return;
    }

    const started = allAssetsActivityTiming.lastFetchStartedAt;
    const ended = allAssetsActivityTiming.lastFetchEndedAt;

    if (
      started != null &&
      ended != null &&
      started >= mountTimeRef.current
    ) {
      setLatencyMs(Math.round(ended - started));
      setDataFlow("tsdb-api");
      return;
    }

    setLatencyMs(Math.round(performance.now() - mountTimeRef.current));
    setDataFlow("tsdb-indexeddb");
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => a.quarter.localeCompare(b.quarter));
  }, [rows]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Assets Activity (ECharts)</CardTitle>
          <CardDescription>Loading activity data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Assets Activity (ECharts)</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] flex items-center justify-center">
          <div className="text-destructive">
            {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <OpenedClosedBarChart
      data={sortedRows}
      title="All Assets Activity (ECharts)"
      description="Total opened (green) and closed (red) positions across all assets by quarter"
      onBarClick={onBarClick}
      latencyBadge={<LatencyBadge latencyMs={latencyMs ?? undefined} source={dataFlow} />}
      unitLabel="positions"
    />
  );
}
