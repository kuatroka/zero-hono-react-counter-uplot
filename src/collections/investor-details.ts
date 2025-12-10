import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { queryClient } from './instances'

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

// TanStack DB collection that holds all drill-down rows (all quarters/actions per ticker)
// The queryFn returns an empty array; we populate the collection via writeUpsert
// from fetchDrilldownData/backgroundLoadAllDrilldownData to keep reactive reads.
export const investorDrilldownCollection = createCollection(
    queryCollectionOptions<InvestorDetail>({
        queryKey: ['investor-drilldown'],
        queryFn: async () => [],
        queryClient,
        getKey: (item) => item.id,
        enabled: false, // manual writes only; avoid auto-refetch wiping data
        staleTime: Infinity,
    })
)

function getAllDrilldownRows(): InvestorDetail[] {
    return Array.from(investorDrilldownCollection.entries()).map(([, value]) => value)
}

// Track which [ticker, quarter, action] combinations have been fetched
const fetchedCombinations = new Set<string>()

/**
 * Check if data for a specific [ticker, quarter, action] has been fetched
 */
export function hasFetchedDrilldownData(ticker: string, quarter: string, action: 'open' | 'close'): boolean {
    return fetchedCombinations.has(`${ticker}-${quarter}-${action}`)
}

/**
 * Fetch drill-down data for a specific [ticker, quarter, action] and add it to the TanStack DB collection.
 * Returns the fetched rows and query time.
 */
export async function fetchDrilldownData(
    ticker: string,
    quarter: string,
    action: 'open' | 'close'
): Promise<{ rows: InvestorDetail[], queryTimeMs: number, fromCache: boolean }> {
    const cacheKey = `${ticker}-${quarter}-${action}`

    // Check if we already have the data in the collection
    const cachedRows = getAllDrilldownRows().filter((item) => item.ticker === ticker && item.quarter === quarter && item.action === action)
    if (cachedRows.length > 0) {
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
    console.debug(
        `[Drilldown] fetched ${rows.length} rows for ${ticker} ${quarter} ${action}, fromCache? ${false}`
    )

    // Deduplicate by ID before writing
    const existingIds = new Set(getAllDrilldownRows().map(r => r.id))
    const dedupedRows = rows.filter(r => !existingIds.has(r.id))
    console.debug(
        `[Drilldown] inserting ${dedupedRows.length} new rows (existing ${existingIds.size}) for ${ticker} ${quarter} ${action}`
    )

    if (dedupedRows.length > 0) {
        if (typeof investorDrilldownCollection.utils.writeUpsert !== 'function') {
            console.error('[Drilldown] writeUpsert missing on collection utils');
        } else {
            investorDrilldownCollection.utils.writeUpsert(dedupedRows)
            console.debug(
                `[Drilldown] collection size after upsert: ${investorDrilldownCollection.size}`
            )
        }
    }

    fetchedCombinations.add(cacheKey)

    const finalRows = getAllDrilldownRows().filter((item) => item.ticker === ticker && item.quarter === quarter && item.action === action)
    return { rows: finalRows, queryTimeMs, fromCache: false }
}

/**
 * Fetch BOTH actions for a specific quarter in one round trip and upsert.
 * Returns combined rows and timing; marks both action combinations as fetched.
 */
export async function fetchDrilldownBothActions(
    ticker: string,
    quarter: string,
): Promise<{ rows: InvestorDetail[], queryTimeMs: number }> {
    const startTime = performance.now()

    const searchParams = new URLSearchParams()
    searchParams.set('ticker', ticker)
    searchParams.set('quarter', quarter)
    searchParams.set('action', 'both')
    searchParams.set('limit', '2000')

    const res = await fetch(`/api/duckdb-investor-drilldown?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch investor details (both actions)')
    const data = await res.json()

    const rows: InvestorDetail[] = (data.rows || []).map((row: any, index: number) => {
        const action: 'open' | 'close' = row.action === 'close' ? 'close' : 'open'
        return {
            id: `${ticker}-${row.quarter ?? quarter}-${action}-${row.cik ?? index}`,
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
        }
    })

    const existingIds = new Set(getAllDrilldownRows().map(r => r.id))
    const dedupedRows = rows.filter(r => !existingIds.has(r.id))
    if (dedupedRows.length > 0) {
        investorDrilldownCollection.utils.writeUpsert(dedupedRows)
    }

    // Mark both combinations as fetched
    fetchedCombinations.add(`${ticker}-${quarter}-open`)
    fetchedCombinations.add(`${ticker}-${quarter}-close`)

    const elapsedMs = Math.round(performance.now() - startTime)
    return { rows, queryTimeMs: elapsedMs }
}

/**
 * Background load all drill-down data for a ticker.
 * Bulk fetches ALL quarters/actions in a single request for speed.
 */
export async function backgroundLoadAllDrilldownData(
    ticker: string,
    quarters: string[],
    onProgress?: (loaded: number, total: number) => void
): Promise<void> {
    // Seed fetched set with existing collection rows to avoid refetching on refresh
    for (const row of getAllDrilldownRows()) {
        fetchedCombinations.add(`${row.ticker}-${row.quarter}-${row.action}`)
    }

    // Bulk load everything in one call (fastest overall; route caps rows to keep payload reasonable)
    const startMs = performance.now()
    const searchParams = new URLSearchParams()
    searchParams.set('ticker', ticker)
    searchParams.set('quarter', 'all')
    searchParams.set('action', 'both')
    searchParams.set('limit', '5000') // route caps at 5000 rows

    const res = await fetch(`/api/duckdb-investor-drilldown?${searchParams.toString()}`)
    if (!res.ok) {
        console.warn(`[Background Load] ${ticker}: bulk fetch failed`, await res.text())
        onProgress?.(1, 1)
        return
    }
    const data = await res.json()

    const rows: InvestorDetail[] = (data.rows || []).map((row: any, index: number) => ({
        id: `${ticker}-${row.quarter ?? 'unknown'}-${row.action ?? 'open'}-${row.cik ?? index}`,
        ticker,
        cik: row.cik != null ? String(row.cik) : '',
        cikName: row.cikName ?? '',
        cikTicker: row.cikTicker ?? '',
        quarter: row.quarter ?? 'unknown',
        cusip: row.cusip ?? null,
        action: (row.action === 'close' ? 'close' : 'open'),
        didOpen: row.didOpen ?? null,
        didAdd: row.didAdd ?? null,
        didReduce: row.didReduce ?? null,
        didClose: row.didClose ?? null,
        didHold: row.didHold ?? null,
    }))

    const existingIds = new Set(getAllDrilldownRows().map(r => r.id))
    const dedupedRows = rows.filter(r => !existingIds.has(r.id))
    if (dedupedRows.length > 0) {
        investorDrilldownCollection.utils.writeUpsert(dedupedRows)
    }

    // Mark fetched combinations so table reads are instant
    for (const r of rows) {
        fetchedCombinations.add(`${r.ticker}-${r.quarter}-${r.action}`)
    }

    onProgress?.(1, 1)
    const elapsedMs = Math.round(performance.now() - startMs)
    console.log(`[Background Load] ${ticker}: fetched ${rows.length} rows in one bulk call (wall=${elapsedMs}ms)`)
}

/**
 * Get drill-down data from the TanStack DB collection (instant query).
 * Returns null if data hasn't been fetched yet.
 */
export function getDrilldownDataFromCollection(
    ticker: string,
    quarter: string,
    action: 'open' | 'close'
): InvestorDetail[] | null {
    if (!hasFetchedDrilldownData(ticker, quarter, action)) {
        return null
    }

    return getAllDrilldownRows().filter((item) => item.ticker === ticker && item.quarter === quarter && item.action === action)
}
