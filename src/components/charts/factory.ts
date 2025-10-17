import uPlot from "uplot";

export type ChartKind =
  | "bars"
  | "line"
  | "area"
  | "scatter"
  | "step"
  | "spline"
  | "cumulative"
  | "movingavg"
  | "band"
  | "dual";

export interface ChartMeta {
  key: ChartKind;
  title: string;
  description: string;
  height?: number;
}

export const chartMetaList: ChartMeta[] = [
  {
    key: "bars",
    title: "Quarterly Values · Column",
    description: "Baseline columnar view of raw quarterly values.",
  },
  {
    key: "line",
    title: "Quarterly Trend · Line",
    description: "Line emphasizing momentum quarter-to-quarter.",
  },
  {
    key: "area",
    title: "Quarterly Total · Area",
    description: "Line with soft fill for magnitude emphasis.",
  },
  {
    key: "scatter",
    title: "Quarterly Distribution · Scatter",
    description: "Points-only distribution across quarters.",
  },
  {
    key: "step",
    title: "Quarterly Changes · Step",
    description: "Discrete shifts per quarter.",
  },
  {
    key: "spline",
    title: "Quarterly Trend · Spline",
    description: "Smoothed interpolation.",
  },
  {
    key: "cumulative",
    title: "Cumulative Performance",
    description: "Running total alongside raw values.",
  },
  {
    key: "movingavg",
    title: "Moving Average (4)",
    description: "Smoother trend indicator.",
  },
  {
    key: "band",
    title: "MA Confidence Band",
    description: "±10% band around MA(4).",
  },
  {
    key: "dual",
    title: "Dual Axis",
    description: "Raw vs MA(8) with separate axis.",
  },
];

function labelsToIndices(labels: string[]): number[] {
  return labels.map((_, i) => i);
}

function movingAverage(values: number[], window = 4): number[] {
  return values.map((_, idx) => {
    const start = Math.max(0, idx - window + 1);
    const slice = values.slice(start, idx + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function cumulative(values: number[]): number[] {
  let total = 0;
  return values.map((v) => (total += v));
}

function baseAxes(labels: string[]): uPlot.Axis[] {
  return [
    {
      stroke: "#9ca3af",
      grid: { stroke: "rgba(148,163,184,0.2)" },
      ticks: { stroke: "#d1d5db" },
      values: (_: uPlot, ticks: number[]) =>
        ticks.map((t) => labels[Math.round(t)] ?? ""),
    },
    {
      stroke: "#9ca3af",
      grid: { stroke: "rgba(148,163,184,0.2)" },
    },
  ];
}

interface BaseOptions {
  title?: string;
  labels: string[];
  width: number;
}

function makeBaseOptions(opts: BaseOptions): uPlot.Options {
  return {
    title: opts.title ?? "Quarterly",
    width: opts.width,
    height: 320,
    padding: [12, 28, 40, 10],
    legend: { show: true },
    scales: {
      x: { time: false },
      y: {},
    },
    axes: baseAxes(opts.labels),
    series: [],
  };
}

interface FactoryResult {
  series: uPlot.Series[];
  data: uPlot.AlignedData[number][];
  extra?: {
    bands?: uPlot.Band[];
    scales?: Record<string, uPlot.Scale>;
    axes?: uPlot.Axis[];
  };
}

type ChartFactory = (labels: string[], values: number[]) => FactoryResult;

const bars: ChartFactory = (_, values) => ({
  series: [
    {
      label: "Value",
      stroke: "#2563eb",
      fill: "rgba(37,99,235,0.35)",
      width: 2,
      paths: uPlot.paths.bars!({ size: [0.6, 100] }),
    },
  ],
  data: [values],
});

const line: ChartFactory = (_, values) => ({
  series: [
    {
      label: "Value",
      stroke: "#2563eb",
      width: 2,
      points: { show: true, size: 6 },
    },
  ],
  data: [values],
});

const area: ChartFactory = (_, values) => ({
  series: [
    {
      label: "Value",
      stroke: "#7c3aed",
      width: 2,
      fill: "rgba(124,58,237,0.25)",
      points: { show: true, size: 5 },
    },
  ],
  data: [values],
});

const scatter: ChartFactory = (_, values) => ({
  series: [
    {
      label: "Value",
      stroke: "#16a34a",
      width: 0,
      points: { show: true, size: 7 },
      paths: () => null,
    },
  ],
  data: [values],
});

const step: ChartFactory = (_, values) => ({
  series: [
    {
      label: "Value",
      stroke: "#dc2626",
      width: 2,
      points: { show: true, size: 4 },
      paths: uPlot.paths.stepped!({ align: 1 }),
    },
  ],
  data: [values],
});

const spline: ChartFactory = (_, values) => ({
  series: [
    {
      label: "Value",
      stroke: "#ea580c",
      width: 2,
      points: { show: false },
      paths: uPlot.paths.spline!(),
    },
  ],
  data: [values],
});

const cumulativeChart: ChartFactory = (_, values) => {
  const cum = cumulative(values);
  return {
    series: [
      {
        label: "Quarterly",
        stroke: "#2563eb",
        width: 1,
      },
      {
        label: "Cumulative",
        stroke: "#111827",
        width: 2,
      },
    ],
    data: [values, cum],
  };
};

const movingavg: ChartFactory = (_, values) => {
  const ma = movingAverage(values, 4);
  return {
    series: [
      {
        label: "Value",
        stroke: "#7c3aed",
        width: 1,
      },
      {
        label: "MA(4)",
        stroke: "#111827",
        width: 2,
      },
    ],
    data: [values, ma],
  };
};

const band: ChartFactory = (_, values) => {
  const ma = movingAverage(values, 4);
  const maLo = ma.map((v) => v * 0.9);
  const maHi = ma.map((v) => v * 1.1);
  return {
    series: [
      {
        label: "MA Lo",
        stroke: "#a5b4fc",
        width: 1,
      },
      {
        label: "MA Hi",
        stroke: "#6366f1",
        width: 1,
      },
    ],
    data: [maLo, maHi],
    extra: {
      bands: [
        {
          series: [1, 2],
          fill: "rgba(99,102,241,0.12)",
        },
      ],
    },
  };
};

const dual: ChartFactory = (labels, values) => {
  const ma = movingAverage(values, 8);
  return {
    series: [
      {
        label: "Value",
        stroke: "#22c55e",
        width: 1,
        scale: "y",
      },
      {
        label: "MA(8)",
        stroke: "#1f2937",
        width: 2,
        scale: "y2",
      },
    ],
    data: [values, ma],
    extra: {
      scales: {
        y2: {},
      },
      axes: [
        ...baseAxes(labels),
        {
          scale: "y2",
          side: 1,
          stroke: "#9ca3af",
          grid: { show: false },
        },
      ],
    },
  };
};

const factories: Record<ChartKind, ChartFactory> = {
  bars,
  line,
  area,
  scatter,
  step,
  spline,
  cumulative: cumulativeChart,
  movingavg,
  band,
  dual,
};

export function createQuarterChart(
  kind: ChartKind,
  el: HTMLElement,
  labels: string[],
  values: number[],
  title?: string
): uPlot {
  const factory = factories[kind];
  const width = el.clientWidth;
  const base = makeBaseOptions({ title: title ?? "Quarterly", labels, width });
  const built = factory(labels, values);

  if (built.extra?.bands) base.bands = built.extra.bands;
  if (built.extra?.scales) base.scales = { ...base.scales, ...built.extra.scales };
  if (built.extra?.axes) base.axes = built.extra.axes;

  base.series = [{}, ...built.series];
  const data: uPlot.AlignedData = [labelsToIndices(labels), ...built.data];

  return new uPlot(base, data, el);
}

export function updateQuarterChart(
  chart: uPlot,
  labels: string[],
  values: number[]
): void {
  const data: uPlot.AlignedData = [labelsToIndices(labels), values];
  chart.setData(data);
}
