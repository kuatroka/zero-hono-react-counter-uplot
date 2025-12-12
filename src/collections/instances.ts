/**
 * TanStack DB Collection Instances
 * 
 * This file creates singleton collection instances that can be imported
 * by components for use with useLiveQuery.
 * 
 * Collections use queryCollectionOptions with syncMode for smart loading
 * and experimental_createQueryPersister for IndexedDB persistence.
 */

import { QueryClient } from '@tanstack/query-core';
import { experimental_createQueryPersister, type AsyncStorage } from '@tanstack/query-persist-client-core';
import { get, set, del, createStore } from 'idb-keyval';
import { createAssetsCollection, type Asset } from './assets';
import { createSuperinvestorsCollection, type Superinvestor } from './superinvestors';
import { searchesCollection, type SearchResult } from './searches';
import { type InvestorDetail } from './investor-details';

// Create IndexedDB store for query persistence
const idbStore = typeof window !== 'undefined' 
    ? createStore('tanstack-query-cache', 'queries')
    : null;

// Create AsyncStorage adapter for idb-keyval
function createIdbStorage(): AsyncStorage {
    return {
        getItem: async (key) => {
            if (!idbStore) return null;
            return await get(key, idbStore) ?? null;
        },
        setItem: async (key, value) => {
            if (!idbStore) return;
            await set(key, value, idbStore);
        },
        removeItem: async (key) => {
            if (!idbStore) return;
            await del(key, idbStore);
        },
    };
}

// Create the persister for IndexedDB
// Each query is persisted separately (not the whole client)
// Queries are lazily restored when first used
const persister = typeof window !== 'undefined'
    ? experimental_createQueryPersister({
        storage: createIdbStorage(),
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })
    : null;

// Shared QueryClient instance with IndexedDB persistence
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes - refetch after this
            gcTime: 1000 * 60 * 30,        // 30 minutes in memory (persister handles long-term)
            persister: persister?.persisterFn,
        },
    },
});

// Create collection instances with the shared queryClient
export const assetsCollection = createAssetsCollection(queryClient);
export const superinvestorsCollection = createSuperinvestorsCollection(queryClient);

// Re-export searches collection (uses its own queryClient)
export { searchesCollection };

// Re-export types for convenience
export type { Asset, Superinvestor, SearchResult, InvestorDetail };

// Preload collections - triggers initial fetch
// With persister, subsequent loads will restore from IndexedDB first
export async function preloadCollections(): Promise<void> {
    const startTime = performance.now();
    console.log('[Collections] Preloading...');
    
    await Promise.all([
        assetsCollection.preload(),
        superinvestorsCollection.preload(),
    ]);
    
    console.log(`[Collections] Preloaded in ${Math.round(performance.now() - startTime)}ms`);
}
