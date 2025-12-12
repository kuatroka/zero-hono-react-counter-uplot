"use client";

import { useMemo } from "react";
import { OpenedClosedBarChart } from "./OpenedClosedBarChart";
import type { CusipQuarterInvestorActivity } from "@/schema";

interface InvestorActivityEchartsChartProps {
  data: readonly CusipQuarterInvestorActivity[];
  ticker: string;
  onBarClick?: (selection: { quarter: string; action: "open" | "close" }) => void;
  latencyBadge?: React.ReactNode;
}

/**
 * ECharts chart for per-asset investor activity.
 * Wraps the generic OpenedClosedBarChart with asset-specific data mapping.
 */
export function InvestorActivityEchartsChart({ 
  data, 
  ticker, 
  onBarClick,
  latencyBadge,
}: InvestorActivityEchartsChartProps) {
  // Transform CusipQuarterInvestorActivity to QuarterlyActivityPoint
  const chartData = useMemo(() => {
    return data.map((item) => ({
      quarter: item.quarter ?? "Unknown",
      opened: item.numOpen ?? 0,
      closed: item.numClose ?? 0, // Keep positive, chart handles negation
    }));
  }, [data]);

  return (
    <OpenedClosedBarChart
      data={chartData}
      title={`Investor Activity for ${ticker} (ECharts)`}
      description="Click bars to see which superinvestors opened (green) or closed (red) positions"
      onBarClick={onBarClick}
      latencyBadge={latencyBadge}
      unitLabel="investors"
    />
  );
}
