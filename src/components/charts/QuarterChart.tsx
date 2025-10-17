import { useEffect, useRef } from "react";
import uPlot from "uplot";
import { ChartKind, createQuarterChart } from "./factory";

interface QuarterChartProps {
  kind: ChartKind;
  title: string;
  labels: string[];
  values: number[];
}

export function QuarterChart({ kind, title, labels, values }: QuarterChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createQuarterChart(
      kind,
      containerRef.current,
      labels,
      values,
      title
    );

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = chartRef.current.height;
        chartRef.current.setSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [kind, labels, values, title]);

  return <div ref={containerRef} className="chart-container" />;
}
