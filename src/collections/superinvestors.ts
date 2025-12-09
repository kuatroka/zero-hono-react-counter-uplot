import { QueryClient } from '@tanstack/query-core'
import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export interface Superinvestor {
    id: string
    cik: string
    cikName: string
}

// Factory function that accepts queryClient
export function createSuperinvestorsCollection(queryClient: QueryClient) {
    return createCollection(
        queryCollectionOptions({
            queryKey: ['superinvestors'],
            queryFn: async () => {
                const res = await fetch('/api/superinvestors')
                if (!res.ok) throw new Error('Failed to fetch superinvestors')
                return res.json() as Promise<Superinvestor[]>
            },
            queryClient,
            getKey: (item) => item.cik,
            // Default is eager mode, suitable for ~1K rows
        })
    )
}
