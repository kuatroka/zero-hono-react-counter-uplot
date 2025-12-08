"use client";

import { useEffect, useRef } from "react";
import uPlot from "uplot";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CusipQuarterInvestorActivity } from "@/schema";

interface InvestorActivityUplotChartProps {
  data: readonly CusipQuarterInvestorActivity[];
  ticker: string;
  onBarClick?: (payload: { quarter: string; action: "open" | "close" }) => void;
}

export function InvestorActivityUplotChart({
  data,
  ticker,
  onBarClick,
}: InvestorActivityUplotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const labels = data.map((item) => item.quarter ?? "Unknown");
    const opened = data.map((item) => item.numOpen ?? 0);
    const closed = data.map((item) => -(item.numClose ?? 0));
    const indices = labels.map((_, idx) => idx);

    const width = containerRef.current.clientWidth;

    const chart = new uPlot(
      {
        title: `Investor Activity (uPlot)` ,
        width,
        height: 400,
        padding: [16, 40, 48, 16],
        legend: { show: true },
        scales: {
          x: { time: false, range: [-0.5, labels.length - 0.5] },
          y: { auto: true },
        },
        axes: [
          {
            stroke: "#6b7280",
            grid: { stroke: "rgba(148,163,184,0.25)" },
            values: (_chart, ticks) => ticks.map((t) => labels[Math.round(t)] ?? ""),
            gap: 10,
          },
          {
            stroke: "#6b7280",
            grid: { stroke: "rgba(148,163,184,0.25)" },
            values: (_chart, ticks) => ticks.map((t) => Math.abs(t).toString()),
          },
        ],
        series: [
          {},
          {
            label: "Opened",
            stroke: "#15803d",
            fill: "rgba(22,163,74,0.35)",
            width: 1,
            points: { show: false },
            paths: uPlot.paths.bars!({ size: [0.5, 100], align: 0 }),
          },
          {
            label: "Closed",
            stroke: "#dc2626",
            fill: "rgba(220,38,38,0.3)",
            width: 1,
            points: { show: false },
            paths: uPlot.paths.bars!({ size: [0.5, 100], align: 0 }),
          },
        ],
        cursor: {
          drag: { x: false, y: false },
          focus: { prox: 32 },
        },
      },
      [indices, opened, closed],
      containerRef.current
    );

    chartRef.current = chart;

    const anyChart = chart as any;
    const zeroY = anyChart.valToPos(0, "y", true) as number;

    const handleClick = (event: MouseEvent) => {
      if (!onBarClick || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Ignore clicks outside the plot area to reduce visual "flash"
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
      const idx = anyChart.posToIdx(x) as number;
      if (idx == null || idx < 0 || idx >= labels.length) return;
      const quarter = labels[idx];
      const action: "open" | "close" = y < zeroY ? "open" : "close";
      onBarClick({ quarter, action });
    };

    chart.root.addEventListener("click", handleClick);

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current && containerRef.current) {
        const nextWidth = containerRef.current.clientWidth;
        chartRef.current.setSize({ width: nextWidth, height: 400 });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.root.removeEventListener("click", handleClick);
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, ticker, onBarClick]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investor Activity for {ticker} (uPlot)</CardTitle>
          <CardDescription>No activity data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investor Activity for {ticker} (uPlot)</CardTitle>
        <CardDescription>
          Alternative rendering using uPlot with opened (green) vs closed (red) positions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}
