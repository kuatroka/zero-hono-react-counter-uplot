
import { getDuckDBConnection } from './api/duckdb';

async function main() {
    try {
        const conn = await getDuckDBConnection();
        console.log("Connected to DuckDB");

        // Check if table exists
        const tables = await conn.runAndReadAll(`SHOW TABLES`);
        console.log("Tables found:", tables.getRows().map(r => r[0]));

        console.log("\nDescribing cusip_quarter_investor_flow:");
        const reader = await conn.runAndReadAll(`DESCRIBE cusip_quarter_investor_flow`);
        console.table(reader.getRows());

        console.log("\nSample data from cusip_quarter_investor_flow:");
        const reader2 = await conn.runAndReadAll(`SELECT * FROM cusip_quarter_investor_flow LIMIT 5`);
        console.table(reader2.getRows());
        const rows2 = reader2.getRows();
        console.table(rows2);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

main();
