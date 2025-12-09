"use client";

import { useQuery } from "@tanstack/react-query";
import { OpenedClosedBarChart } from "./OpenedClosedBarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["all-assets-activity"],
    queryFn: fetchAllAssetsActivity,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

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
      unitLabel="positions"
    />
  );
}
