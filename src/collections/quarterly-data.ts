import { QueryClient } from '@tanstack/query-core'
import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export interface QuarterlyData {
    quarter: string
    value: number
}

// Factory function that accepts queryClient
export function createQuarterlyDataCollection(queryClient: QueryClient) {
    return createCollection(
        queryCollectionOptions({
            queryKey: ['quarterly-data'],
            queryFn: async () => {
                const res = await fetch('/api/quarterly-data')
                if (!res.ok) throw new Error('Failed to fetch quarterly data')
                return res.json() as Promise<QuarterlyData[]>
            },
            queryClient,
            getKey: (item) => item.quarter,
            // Default is eager mode, suitable for ~500 rows
        })
    )
}
