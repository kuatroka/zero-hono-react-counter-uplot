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

// Track which [ticker, quarter, action] combinations have been fetched
const fetchedCombinations = new Set<string>()

/**
 * Get the query key for all drilldown data for a ticker (for use with useQuery).
 * This allows components to subscribe to the accumulated drilldown cache.
 */
export function getTickerDrilldownQueryKey(ticker: string): string[] {
    return ['investor-details-all', ticker]
}

/**
 * Get all drilldown rows for a ticker from React Query cache.
 */
function getAllDrilldownRows(queryClient: QueryClient, ticker: string): InvestorDetail[] {
    const key = getTickerDrilldownQueryKey(ticker)
    return queryClient.getQueryData<InvestorDetail[]>(key) ?? []
}

/**
 * Set all drilldown rows for a ticker in React Query cache.
 */
function setAllDrilldownRows(queryClient: QueryClient, ticker: string, rows: InvestorDetail[]): void {
    const key = getTickerDrilldownQueryKey(ticker)
    queryClient.setQueryData(key, rows)
}

/**
 * Check if data for a specific [ticker, quarter, action] has been fetched
 */
export function hasFetchedDrilldownData(ticker: string, quarter: string, action: 'open' | 'close'): boolean {
    return fetchedCombinations.has(`${ticker}-${quarter}-${action}`)
}

/**
 * Fetch drill-down data for a specific [ticker, quarter, action] and add to the ticker's collection.
 * Returns the fetched rows and query time.
 */
export async function fetchDrilldownData(
    queryClient: QueryClient,
    ticker: string,
    quarter: string,
    action: 'open' | 'close'
): Promise<{ rows: InvestorDetail[], queryTimeMs: number, fromCache: boolean }> {
    const cacheKey = `${ticker}-${quarter}-${action}`
    
    // Check if data is already in cache (either marked as fetched or actually present)
    const allData = getAllDrilldownRows(queryClient, ticker)
    const cachedRows = allData.filter((item: InvestorDetail) => item.quarter === quarter && item.action === action)
    
    if (cachedRows.length > 0) {
        // Data exists in cache, mark as fetched and return it
        fetchedCombinations.add(cacheKey)
        return { rows: cachedRows, queryTimeMs: 0, fromCache: true }
    }
    
    // Also check the Set for cases where we know it was fetched but returned 0 rows
    if (fetchedCombinations.has(cacheKey)) {
        return { rows: [], queryTimeMs: 0, fromCache: true }
    }
    
    const startTime = performance.now()
    
    const searchParams = new URLSearchParams()
    searchParams.set('ticker', ticker)
    searchParams.set('quarter', quarter)
    searchParams.set('action', action)

    const res = await fetch(`/api/duckdb-investor-drilldown?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch investor details')
    const data = await res.json()
    
    const queryTimeMs = performance.now() - startTime
    
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
    
    // Add to React Query cache (accumulate all rows for this ticker)
    // Deduplicate by ID to prevent duplicates on re-fetch
    const existingRows = getAllDrilldownRows(queryClient, ticker)
    const existingIds = new Set(existingRows.map(r => r.id))
    const newRows = rows.filter(r => !existingIds.has(r.id))
    const updatedRows = [...existingRows, ...newRows]
    setAllDrilldownRows(queryClient, ticker, updatedRows)
    
    // Mark as fetched
    fetchedCombinations.add(cacheKey)
    
    return { rows, queryTimeMs, fromCache: false }
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
    // Initialize fetchedCombinations from existing cache to avoid re-fetching on page refresh
    const existingRows = getAllDrilldownRows(queryClient, ticker)
    for (const row of existingRows) {
        const cacheKey = `${row.ticker}-${row.quarter}-${row.action}`
        fetchedCombinations.add(cacheKey)
    }
    
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

/**
 * Get drill-down data from React Query cache (instant query).
 * Returns null if data hasn't been fetched yet.
 */
export function getDrilldownDataFromCollection(
    queryClient: QueryClient,
    ticker: string,
    quarter: string,
    action: 'open' | 'close'
): InvestorDetail[] | null {
    if (!hasFetchedDrilldownData(ticker, quarter, action)) {
        return null
    }
    
    const allData = getAllDrilldownRows(queryClient, ticker)
    return allData.filter((item: InvestorDetail) => item.quarter === quarter && item.action === action)
}
