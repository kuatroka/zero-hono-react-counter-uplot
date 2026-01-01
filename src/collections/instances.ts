/**
 * TanStack DB Collection Instances
 * 
 * This file creates singleton collection instances that can be imported
 * by components for use with useLiveQuery.
 * 
 * Collections use queryCollectionOptions with syncMode for smart loading
 * and experimental_createQueryPersister for IndexedDB persistence.
 */

import { queryClient } from './query-client';
import { createAssetsCollection, type Asset } from './assets';
import { createSuperinvestorsCollection, type Superinvestor } from './superinvestors';
import { createAllAssetsActivityCollection } from './all-assets-activity';
import { searchesCollection, preloadSearches, type SearchResult } from './searches';
import { type InvestorDetail } from './investor-details';

// Re-export queryClient for external use
export { queryClient };

// Create collection instances with the shared queryClient
export const assetsCollection = createAssetsCollection(queryClient);
export const superinvestorsCollection = createSuperinvestorsCollection(queryClient);
export const allAssetsActivityCollection = createAllAssetsActivityCollection(queryClient);

// Re-export searches collection (now uses shared queryClient with IndexedDB persistence)
export { searchesCollection, preloadSearches };

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
        allAssetsActivityCollection.preload(),
    ]);
    
    console.log(`[Collections] Preloaded in ${Math.round(performance.now() - startTime)}ms`);
}
