/**
 * TanStack DB Collection Instances
 * 
 * This file creates singleton collection instances that can be imported
 * by components for use with useLiveQuery.
 * 
 * Collections are instantiated with a shared QueryClient and preloaded
 * on app initialization via AppProvider.
 */

import { QueryClient } from '@tanstack/query-core';
import { createAssetsCollection, type Asset } from './assets';
import { createSuperinvestorsCollection, type Superinvestor } from './superinvestors';
import { type InvestorDetail } from './investor-details';

// Shared QueryClient instance for all collections
// This is the same instance used by QueryClientProvider in AppProvider
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000,   // 10 minutes
        },
    },
});

// Singleton collection instances for eager-synced data
export const assetsCollection = createAssetsCollection(queryClient);
export const superinvestorsCollection = createSuperinvestorsCollection(queryClient);

// Re-export types for convenience
export type { Asset, Superinvestor, InvestorDetail };

// Preload all eager collections
// Call this on app init to ensure data is ready for instant queries
export async function preloadCollections(): Promise<void> {
    await Promise.all([
        assetsCollection.preload(),
        superinvestorsCollection.preload(),
    ]);
}
