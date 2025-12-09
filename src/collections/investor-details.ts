import { QueryClient } from '@tanstack/query-core'
import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export interface InvestorDetail {
    id: number
    cik: string | null
    cikName: string | null
    cikTicker: string | null
    quarter: string | null
    cusip: string | null
    didOpen: boolean | null
    didAdd: boolean | null
    didReduce: boolean | null
    didClose: boolean | null
    didHold: boolean | null
}

/**
 * Factory to create an investor details collection.
 * Used for drill-down data from the investor activity chart.
 */
export function createInvestorDetailsCollection(
    queryClient: QueryClient,
    ticker: string,
    quarter: string,
    action: 'open' | 'close'
) {
    return createCollection(
        queryCollectionOptions({
            queryKey: ['investor-details', ticker, quarter, action],
            queryFn: async () => {
                const searchParams = new URLSearchParams()
                searchParams.set('ticker', ticker)
                searchParams.set('quarter', quarter)
                searchParams.set('action', action)

                const res = await fetch(`/api/duckdb-investor-drilldown?${searchParams.toString()}`)
                if (!res.ok) throw new Error('Failed to fetch investor details')
                const data = await res.json()
                return data.rows as InvestorDetail[]
            },
            queryClient,
            getKey: (item) => `${item.cik}-${item.quarter}-${item.id}`,
        })
    )
}
