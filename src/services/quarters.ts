export interface ChartSeries {
  labels: string[];
  values: number[];
}

export async function getChartSeries(): Promise<ChartSeries> {
  const res = await fetch("/api/quarters");
  if (!res.ok) throw new Error(`Failed to fetch quarters: ${res.status}`);
  const data = (await res.json()) as ChartSeries;
  return data;
}
