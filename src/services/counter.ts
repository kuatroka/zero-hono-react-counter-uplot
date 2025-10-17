export async function getValue(): Promise<number> {
  const res = await fetch("/api/counter");
  if (!res.ok) throw new Error(`Failed to fetch counter: ${res.status}`);
  const data = (await res.json()) as { value: number };
  return data.value;
}

export async function increment(): Promise<number> {
  return mutate("inc");
}

export async function decrement(): Promise<number> {
  return mutate("dec");
}

async function mutate(op: "inc" | "dec"): Promise<number> {
  const res = await fetch("/api/counter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op }),
  });
  if (!res.ok) throw new Error(`Failed to mutate counter: ${res.status}`);
  const data = (await res.json()) as { value: number };
  return data.value;
}
