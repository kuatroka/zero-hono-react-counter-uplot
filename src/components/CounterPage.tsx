import { Link } from "react-router-dom";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";
import { queries } from "../zero/queries";
import { QuarterChart } from "./charts/QuarterChart";
import { chartMetaList } from "./charts/factory";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Schema } from "../schema";

export function CounterPage() {
  const z = useZero<Schema>();
  const isLoggedIn = z.userID !== "anon";
  const userCounterKey = isLoggedIn ? z.userID : "__guest__";
  const [guestCounter, setGuestCounter] = useState(0);
  
  useEffect(() => {
    if (isLoggedIn) {
      setGuestCounter(0);
    }
  }, [isLoggedIn]);
  
  const handleLogin = async () => {
    try {
      await fetch("/api/login");
      location.reload();
    } catch (error) {
      alert(`Failed to login: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const [counterRows] = useQuery(queries.counterCurrent("main"));
  const [userCounterRows] = useQuery(queries.userCounter(userCounterKey));
  const [quarters] = useQuery(queries.quartersSeries());

  const counter = counterRows[0];
  const userCounter = isLoggedIn ? userCounterRows[0] : undefined;
  const privateCounterValue = isLoggedIn ? userCounter?.value ?? 0 : guestCounter;

  const handleIncrement = async () => {
    if (!counter) return;
    await z.mutate.counters.update({
      id: counter.id,
      value: counter.value + 1,
    });
  };

  const handleDecrement = async () => {
    if (!counter) return;
    await z.mutate.counters.update({
      id: counter.id,
      value: counter.value - 1,
    });
  };

  const handleUserIncrement = async () => {
    if (!isLoggedIn) {
      setGuestCounter((value) => value + 1);
      return;
    }
    const currentValue = userCounter?.value ?? 0;
    if (userCounter) {
      await z.mutate.user_counters.update({
        userId: z.userID,
        value: currentValue + 1,
      });
    } else {
      await z.mutate.user_counters.insert({
        userId: z.userID,
        value: 1,
      });
    }
  };

  const handleUserDecrement = async () => {
    if (!isLoggedIn) {
      setGuestCounter((value) => value - 1);
      return;
    }
    const currentValue = userCounter?.value ?? 0;
    if (userCounter) {
      await z.mutate.user_counters.update({
        userId: z.userID,
        value: currentValue - 1,
      });
    } else {
      await z.mutate.user_counters.insert({
        userId: z.userID,
        value: -1,
      });
    }
  };

  if (!counter || quarters.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const chartSeries = {
    labels: quarters.map((q) => q.quarter),
    values: quarters.map((q) => q.value),
  };

  const [primaryChart, ...remainingCharts] = chartMetaList;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <header className="flex justify-between items-start">
            <div className="space-y-3">
              <Link to="/" className="link link-primary flex items-center gap-2 w-max">
                <span className="text-xl">←</span> Back to Home
              </Link>
              <h1 className="text-3xl font-bold">Counter & Quarterly Charts</h1>
            </div>
            <ThemeSwitcher />
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center">
                <h2 className="card-title">Global Counter</h2>
                <p className="text-sm opacity-70 mb-4">Synced across all users</p>
                <div className="join">
                  <button onClick={handleDecrement} className="btn btn-square join-item btn-primary text-2xl">
                    −
                  </button>
                  <div className="join-item w-32 text-center text-3xl font-semibold bg-base-300 flex items-center justify-center">
                    {counter.value}
                  </div>
                  <button onClick={handleIncrement} className="btn btn-square join-item btn-primary text-2xl">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center">
                <h2 className="card-title">Your Counter</h2>
                <p className="text-sm opacity-70 mb-4">Private to you only</p>
                <div className="join">
                  <button
                    onClick={handleUserDecrement}
                    className="btn btn-square join-item btn-secondary text-2xl"
                  >
                    −
                  </button>
                  <div className="join-item w-32 text-center text-3xl font-semibold bg-base-300 flex items-center justify-center">
                    {privateCounterValue}
                  </div>
                  <button
                    onClick={handleUserIncrement}
                    className="btn btn-square join-item btn-secondary text-2xl"
                  >
                    +
                  </button>
                </div>
                {!isLoggedIn ? (
                  <div className="mt-4 text-center text-sm">
                    <p className="mb-2">
                      This value stays local and resets when you leave. Sign in to sync it.
                    </p>
                    <button className="btn btn-sm" onClick={handleLogin}>
                      Login
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-center text-sm opacity-70">
                    This value is stored privately for {z.userID}.
                  </p>
                )}
              </div>
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
