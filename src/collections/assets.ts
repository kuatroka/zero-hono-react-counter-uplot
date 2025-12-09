import { QueryClient } from '@tanstack/query-core'
import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export interface Asset {
    id: string
    asset: string
    assetName: string
    cusip: string | null
}

// Factory function that accepts queryClient
export function createAssetsCollection(queryClient: QueryClient) {
    return createCollection(
        queryCollectionOptions({
            queryKey: ['assets'],
            queryFn: async () => {
                const res = await fetch('/api/assets')
                if (!res.ok) throw new Error('Failed to fetch assets')
                return res.json() as Promise<Asset[]>
            },
            queryClient,
            getKey: (item) => item.asset + (item.cusip || ''),
            // Default is eager mode, suitable for ~50K rows
        })
    )
}
