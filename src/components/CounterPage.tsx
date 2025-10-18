import { useEffect, useState } from "react";
import * as counterService from "../services/counter";
import * as quartersService from "../services/quarters";
import { QuarterChart } from "./charts/QuarterChart";
import { chartMetaList } from "./charts/factory";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function CounterPage() {
  const [counterValue, setCounterValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSeries, setChartSeries] = useState<{
    labels: string[];
    values: number[];
  }>({ labels: [], values: [] });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [value, series] = await Promise.all([
          counterService.getValue(),
          quartersService.getChartSeries(),
        ]);
        setCounterValue(value);
        setChartSeries(series);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleIncrement = async () => {
    try {
      const newValue = await counterService.increment();
      setCounterValue(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to increment");
    }
  };

  const handleDecrement = async () => {
    try {
      const newValue = await counterService.decrement();
      setCounterValue(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decrement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error: {error}</span>
        </div>
        <a href="/" className="btn btn-primary">Back to Home</a>
      </div>
    );
  }

  const [primaryChart, ...remainingCharts] = chartMetaList;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <header className="flex justify-between items-start">
            <div className="space-y-3">
              <a href="/" className="link link-primary flex items-center gap-2 w-max">
                <span className="text-xl">←</span> Back to Home
              </a>
              <h1 className="text-3xl font-bold">Counter & Quarterly Charts</h1>
            </div>
            <ThemeSwitcher />
          </header>

          <section className="flex justify-center">
            <div className="join">
              <button onClick={handleDecrement} className="btn btn-square join-item btn-primary text-2xl">
                −
              </button>
              <div className="join-item w-32 text-center text-3xl font-semibold bg-base-300 flex items-center justify-center">
                {counterValue}
              </div>
              <button onClick={handleIncrement} className="btn btn-square join-item btn-primary text-2xl">
                +
              </button>
            </div>
          </section>

          <section>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{primaryChart.title}</h2>
                <p className="text-sm opacity-70">{primaryChart.description}</p>
                <div className="overflow-hidden">
                  <QuarterChart
                    kind={primaryChart.key}
                    title={primaryChart.title}
                    labels={chartSeries.labels}
                    values={chartSeries.values}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {remainingCharts.map((meta) => (
              <div key={meta.key} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-base">{meta.title}</h3>
                  <p className="text-sm opacity-70">{meta.description}</p>
                  <div className="overflow-hidden">
                    <QuarterChart
                      kind={meta.key}
                      title={meta.title}
                      labels={chartSeries.labels}
                      values={chartSeries.values}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
