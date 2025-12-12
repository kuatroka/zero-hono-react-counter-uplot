import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("🏁 Running Chart Rendering Benchmark\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const htmlPath = join(__dirname, "benchmark-chart-rendering.html");
  const fileUrl = `file://${htmlPath}`;

  console.log(`Opening: ${fileUrl}\n`);
  await page.goto(fileUrl);

  console.log("Running benchmarks with different data sizes...\n");

  const dataSizes = [100, 500, 1000, 2000, 5000];
  const iterations = 10;

  for (const size of dataSizes) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing with ${size.toLocaleString()} data points`);
    console.log("=".repeat(60));

    // Select data size
    await page.selectOption("#dataPoints", size.toString());
    await page.selectOption("#iterations", iterations.toString());

    // Click run benchmark
    await page.click("#runBenchmark");

    // Wait for benchmark to complete
    await page.waitForSelector(".status.complete", { timeout: 120000 });

    // Wait a bit for results to render
    await page.waitForTimeout(1000);

    // Extract results
    const results = await page.evaluate(() => {
      const resultsEl = document.querySelector("#results pre");
      return resultsEl ? resultsEl.textContent : "No results";
    });

    console.log(results);

    // Wait before next test
    await page.waitForTimeout(2000);
  }

  console.log("\n\n✅ All benchmarks complete!");
  console.log("\nPress Ctrl+C to close the browser...");

  // Keep browser open to view results
  await page.waitForTimeout(60000);

  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
