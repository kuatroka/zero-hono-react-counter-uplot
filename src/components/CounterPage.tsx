import { useEffect, useState } from "react";
import * as counterService from "../services/counter";
import * as quartersService from "../services/quarters";
import { QuarterChart } from "./charts/QuarterChart";
import { chartMetaList } from "./charts/factory";

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
      <div className="counter-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="counter-page">
        <div className="error">Error: {error}</div>
        <a href="/">Back to Home</a>
      </div>
    );
  }

  const [primaryChart, ...remainingCharts] = chartMetaList;

  return (
    <div className="counter-page">
      <div className="counter-header">
        <a href="/" className="back-link">
          ← Back to Home
        </a>
        <h1>Counter & Quarterly Charts</h1>
      </div>

      <div className="counter-controls">
        <button onClick={handleDecrement} className="counter-button">
          −
        </button>
        <div className="counter-value">{counterValue}</div>
        <button onClick={handleIncrement} className="counter-button">
          +
        </button>
      </div>

      <div className="primary-chart">
        <div className="chart-card">
          <h3>{primaryChart.title}</h3>
          <p>{primaryChart.description}</p>
          <QuarterChart
            kind={primaryChart.key}
            title={primaryChart.title}
            labels={chartSeries.labels}
            values={chartSeries.values}
          />
        </div>
      </div>

      <div className="charts-grid">
        {remainingCharts.map((meta) => (
          <div key={meta.key} className="chart-card">
            <h3>{meta.title}</h3>
            <p>{meta.description}</p>
            <QuarterChart
              kind={meta.key}
              title={meta.title}
              labels={chartSeries.labels}
              values={chartSeries.values}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
