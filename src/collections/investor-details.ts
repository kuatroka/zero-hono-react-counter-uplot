import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'

export interface InvestorDetail {
    id: string  // Unique key: ticker-quarter-action-cik
    ticker: string
    cik: string
    cikName: string
    cikTicker: string
    quarter: string
    cusip: string | null
    action: 'open' | 'close'
    didOpen: boolean | null
    didAdd: boolean | null
    didReduce: boolean | null
    didClose: boolean | null
    didHold: boolean | null
}

// Map of ticker -> collection for on-demand drilldown data loading
const drilldownCollections = new Map<string, any>()

/**
 * Get or create a TanStack DB collection for a ticker's drilldown data.
 * Uses on-demand syncMode to load data incrementally as queries request it.
 */
export function getDrilldownCollection(queryClient: QueryClient, ticker: string) {
    if (drilldownCollections.has(ticker)) {
        return drilldownCollections.get(ticker)!
    }

    const collection = createCollection(
        queryCollectionOptions({
            queryKey: ['investor-details', ticker],
            queryFn: async () => {
                // Return empty array initially - data will be added via collection.insert()
                return []
            },
            syncMode: 'on-demand' as const,
            queryClient,
            getKey: (item: InvestorDetail) => item.id,
        })
    )

    drilldownCollections.set(ticker, collection)
    return collection
}

/**
 * Fetch drill-down data from API for a specific [ticker, quarter, action].
 * Adds rows to the TanStack DB collection.
 */
export async function fetchDrilldownData(
    queryClient: QueryClient,
    ticker: string,
    quarter: string,
    action: 'open' | 'close'
): Promise<{ rows: InvestorDetail[], queryTimeMs: number }> {
    const cacheKey = `${ticker}-${quarter}-${action}`
    const startTime = performance.now()
    
    const searchParams = new URLSearchParams()
    searchParams.set('ticker', ticker)
    searchParams.set('quarter', quarter)
    searchParams.set('action', action)

    const res = await fetch(`/api/duckdb-investor-drilldown?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch investor details')
    const data = await res.json()
    
    const queryTimeMs = performance.now() - startTime
    
    // Log API response for debugging
    console.log(`[fetchDrilldownData] ${cacheKey}: API returned ${data.rows?.length ?? 0} rows in ${queryTimeMs.toFixed(1)}ms`)
    
    // Transform API response to InvestorDetail format
    const rows: InvestorDetail[] = (data.rows || []).map((row: any, index: number) => ({
        id: `${ticker}-${quarter}-${action}-${row.cik ?? index}`,
        ticker,
        cik: row.cik != null ? String(row.cik) : '',
        cikName: row.cikName ?? '',
        cikTicker: row.cikTicker ?? '',
        quarter: row.quarter ?? quarter,
        cusip: row.cusip ?? null,
        action,
        didOpen: row.didOpen ?? null,
        didAdd: row.didAdd ?? null,
        didReduce: row.didReduce ?? null,
        didClose: row.didClose ?? null,
        didHold: row.didHold ?? null,
    }))
    
    // Add rows to the TanStack DB collection
    const collection = getDrilldownCollection(queryClient, ticker)
    for (const row of rows) {
        collection.insert(row)
    }
    
    return { rows, queryTimeMs }
}

/**
 * Background load all drill-down data for a ticker.
 * Fetches both 'open' and 'close' actions for all provided quarters.
 */
export async function backgroundLoadAllDrilldownData(
    queryClient: QueryClient,
    ticker: string,
    quarters: string[],
    onProgress?: (loaded: number, total: number) => void
): Promise<void> {
    const actions: Array<'open' | 'close'> = ['open', 'close']
    const total = quarters.length * actions.length
    let loaded = 0
    
    // Fetch with concurrency limit to avoid overwhelming the server
    const CONCURRENCY_LIMIT = 6 // Max 6 parallel requests
    const tasks: Array<{ quarter: string; action: 'open' | 'close' }> = []
    
    for (const quarter of quarters) {
        for (const action of actions) {
            tasks.push({ quarter, action })
        }
    }
    
    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const batch = tasks.slice(i, i + CONCURRENCY_LIMIT)
        await Promise.all(
            batch.map(({ quarter, action }) =>
                fetchDrilldownData(queryClient, ticker, quarter, action)
                    .then(() => {
                        loaded++
                        onProgress?.(loaded, total)
                    })
                    .catch((err) => {
                        console.warn(`Failed to fetch ${ticker} ${quarter} ${action}:`, err)
                        loaded++
                        onProgress?.(loaded, total)
                    })
            )
        )
    }
}
