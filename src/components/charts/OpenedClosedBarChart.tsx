"use client";

import { useMemo, useRef, useEffect } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuarterlyActivityPoint } from "@/types/duckdb";

// Register only the components we need for tree shaking
echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

interface OpenedClosedBarChartProps {
  /** Array of quarterly data points with opened/closed counts */
  data: readonly QuarterlyActivityPoint[];
  /** Chart title */
  title: string;
  /** Optional description shown below title */
  description?: string;
  /** Callback when a bar is clicked */
  onBarClick?: (selection: { quarter: string; action: "open" | "close" }) => void;
  /** Unit label for tooltip (default: "positions") */
  unitLabel?: string;
}

/**
 * Reusable ECharts bar chart for opened/closed positions by quarter.
 * - Opened positions shown as green bars above zero
 * - Closed positions shown as red bars below zero
 * 
 * Used for both:
 * - Per-asset investor activity (AssetDetail page)
 * - All-assets aggregated activity (Dashboard/Overview)
 */
export function OpenedClosedBarChart({ 
  data, 
  title,
  description,
  onBarClick,
  unitLabel = "positions",
}: OpenedClosedBarChartProps) {
  const chartRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      quarter: item.quarter ?? "Unknown",
      opened: item.opened ?? 0,
      closed: -(item.closed ?? 0), // Negative for below-zero display
    }));
  }, [data]);

  const option = useMemo(() => {
    if (chartData.length === 0) return null;

    const quarters = chartData.map((item) => item.quarter);
    const openedValues = chartData.map((item) => item.opened);
    const closedValues = chartData.map((item) => item.closed);

    const maxValue = Math.max(
      1, // Prevent division by zero
      ...chartData.map((item) => Math.max(Math.abs(item.opened), Math.abs(item.closed)))
    );
    const maxDomain = maxValue * 1.1;

    return {
      animation: false,
      grid: { 
        top: 48, 
        right: 48,
        bottom: 80, 
        left: 48, 
        containLabel: true 
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any[]) => {
          const lines = params.map((p) => {
            const label = p.seriesName;
            const value = Math.abs(Number(p.value));
            return `${label}: ${value.toLocaleString()} ${unitLabel}`;
          });
          return [`<strong>${params[0]?.axisValueLabel ?? ""}</strong>`, ...lines].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: quarters,
        boundaryGap: true,
        axisLabel: {
          rotate: 0,
          hideOverlap: true,
          interval: 'auto',
          formatter: (value: string) => {
            if (!quarters.includes(value)) return '';
            // Format as "Q1 '24" for compact display
            const match = value.match(/^(\d{4})-Q(\d)$/);
            if (match) {
              const [, year, quarter] = match;
              return `Q${quarter} '${year.slice(-2)}`;
            }
            return value;
          },
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        min: -maxDomain,
        max: maxDomain,
        splitNumber: 6,
        axisLabel: {
          formatter: (value: number) => {
            const absValue = Math.abs(value);
            if (Math.abs(absValue - maxDomain) < maxDomain * 0.05) return '';
            return absValue.toString();
          },
          margin: 8,
        },
        splitLine: {
          lineStyle: {
            type: "dashed",
            color: "rgba(148,163,184,0.3)",
          },
        },
        position: 'left',
      },
      series: [
        {
          name: "Opened",
          type: "bar",
          stack: "activity",
          emphasis: { focus: "series" },
          itemStyle: { 
            color: "hsl(142, 76%, 36%)", 
            borderRadius: [4, 4, 0, 0] 
          },
          data: openedValues,
          markLine: {
            silent: true,
            symbol: "none",
            label: { show: false },
            lineStyle: {
              color: "hsl(var(--foreground))",
              width: 1,
              opacity: 0.4,
            },
            data: [{ yAxis: 0 }],
          },
        },
        {
          name: "Closed",
          type: "bar",
          stack: "activity",
          emphasis: { focus: "series" },
          itemStyle: { 
            color: "hsl(0, 84%, 60%)", 
            borderRadius: [0, 0, 4, 4] 
          },
          data: closedValues,
        },
      ],
    };
  }, [chartData, unitLabel]);

  // Smooth resize handling with ResizeObserver
  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    const container = chartRef.current?.ele;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        chartInstance.resize({ animation: { duration: 0 } });
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [option]);

  // Window resize handler
  useEffect(() => {
    const handleWindowResize = () => {
      const chartInstance = chartRef.current?.getEchartsInstance();
      if (chartInstance) {
        chartInstance.resize({ animation: { duration: 0 } });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    const clickHandler = (params: any) => {
      console.log(`[ECharts Click] params=`, params);
      if (!onBarClick || !params.name || !params.seriesName) {
        console.log(`[ECharts Click] Skipped - onBarClick=${!!onBarClick}, name=${params.name}, seriesName=${params.seriesName}`);
        return;
      }

      const quarter = params.name as string;
      const action = params.seriesName === "Opened" ? "open" : "close";

      console.log(`[ECharts Click] Calling onBarClick with quarter=${quarter}, action=${action}`);
      onBarClick({ quarter, action });
    };

    chartInstance.on('click', clickHandler);

    return () => {
      chartInstance.off('click', clickHandler);
    };
  }, [onBarClick, option]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No activity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!option) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-[450px] w-full">
        <ReactEChartsCore
          ref={chartRef}
          echarts={echarts}
          option={option}
          notMerge={false}
          lazyUpdate={false}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </CardContent>
    </Card>
  );
}
