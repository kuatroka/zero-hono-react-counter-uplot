"use client";

import { useQuery } from "@tanstack/react-query";
import { OpenedClosedBarChart } from "./OpenedClosedBarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LatencyBadge } from "@/components/LatencyBadge";
import { useState, useEffect, useRef } from "react";
import type { AllAssetsActivityResponse } from "@/types/duckdb";

async function fetchAllAssetsActivity(): Promise<AllAssetsActivityResponse> {
  const res = await fetch("/api/all-assets-activity");
  if (!res.ok) {
    throw new Error(`Failed to fetch all assets activity: ${res.status}`);
  }
  return res.json();
}

interface AllAssetsActivityChartProps {
  /** Callback when a bar is clicked (optional - for drilldown) */
  onBarClick?: (selection: { quarter: string; action: "open" | "close" }) => void;
}

/**
 * ECharts chart showing aggregated opened/closed positions across ALL assets by quarter.
 * Data is fetched from DuckDB via /api/all-assets-activity endpoint.
 */
export function AllAssetsActivityChart({ onBarClick }: AllAssetsActivityChartProps) {
  const fetchStartRef = useRef<number | null>(null);
  const [queryTimeMs, setQueryTimeMs] = useState<number | null>(null);
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["all-assets-activity"],
    queryFn: async () => {
      fetchStartRef.current = performance.now();
      return fetchAllAssetsActivity();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  // Track latency: if we started a fetch, measure it; otherwise it's cached (0ms)
  useEffect(() => {
    if (data && !isFetching) {
      if (fetchStartRef.current !== null) {
        setQueryTimeMs(Math.round(performance.now() - fetchStartRef.current));
        fetchStartRef.current = null;
      } else {
        setQueryTimeMs(0); // Data from cache, no network call
      }
    }
  }, [data, isFetching]);

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

  if (isError) {
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
      data={data?.rows ?? []}
      title="All Assets Activity (ECharts)"
      description="Total opened (green) and closed (red) positions across all assets by quarter"
      onBarClick={onBarClick}
      latencyBadge={<LatencyBadge latencyMs={queryTimeMs ?? undefined} source={queryTimeMs === 0 ? "rq-memory" : "rq-api"} />}
      unitLabel="positions"
    />
  );
}
