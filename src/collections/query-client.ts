/**
 * Shared QueryClient with IndexedDB Persistence
 * 
 * This file creates the shared QueryClient instance with IndexedDB persistence
 * that can be imported by all collection files without circular dependencies.
 */

import { QueryClient } from '@tanstack/query-core';
import { experimental_createQueryPersister, type AsyncStorage } from '@tanstack/query-persist-client-core';
import { get, set, del, createStore } from 'idb-keyval';

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
export const persister = typeof window !== 'undefined'
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

// ============================================================
// SEARCH INDEX PERSISTENCE (separate from query cache)
// ============================================================

// Create a separate IndexedDB store for the search index
// This is stored separately because it's a large pre-computed structure
const searchIndexStore = typeof window !== 'undefined'
    ? createStore('search-index-cache', 'index')
    : null;

const SEARCH_INDEX_KEY = 'search-index-v1';

export interface PersistedSearchIndex {
    codeExact: Record<string, number[]>;
    codePrefixes: Record<string, number[]>;
    namePrefixes: Record<string, number[]>;
    items: Record<string, { id: number; cusip: string | null; code: string; name: string | null; category: string }>;
    metadata?: {
        totalItems: number;
        generatedAt?: string;
        persistedAt?: number;
    };
}

/**
 * Save search index to IndexedDB
 */
export async function persistSearchIndex(index: PersistedSearchIndex): Promise<void> {
    if (!searchIndexStore) return;
    
    try {
        const startTime = performance.now();
        // Add persistence timestamp
        const indexWithTimestamp = {
            ...index,
            metadata: {
                ...index.metadata,
                persistedAt: Date.now(),
            },
        };
        await set(SEARCH_INDEX_KEY, indexWithTimestamp, searchIndexStore);
        console.log(`[SearchIndex] Persisted to IndexedDB in ${(performance.now() - startTime).toFixed(1)}ms`);
    } catch (error) {
        console.error('[SearchIndex] Failed to persist:', error);
    }
}

/**
 * Load search index from IndexedDB
 * Returns null if not found or expired (older than 7 days)
 */
export async function loadPersistedSearchIndex(): Promise<PersistedSearchIndex | null> {
    if (!searchIndexStore) return null;
    
    try {
        const startTime = performance.now();
        const index = await get<PersistedSearchIndex>(SEARCH_INDEX_KEY, searchIndexStore);
        
        if (!index) {
            console.log('[SearchIndex] No persisted index found');
            return null;
        }
        
        // Check if expired (7 days)
        const persistedAt = index.metadata?.persistedAt;
        if (persistedAt) {
            const age = Date.now() - persistedAt;
            const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
            if (age > maxAge) {
                console.log('[SearchIndex] Persisted index expired, will refetch');
                await del(SEARCH_INDEX_KEY, searchIndexStore);
                return null;
            }
        }
        
        console.log(`[SearchIndex] Loaded from IndexedDB in ${(performance.now() - startTime).toFixed(1)}ms (${index.metadata?.totalItems || 0} items)`);
        return index;
    } catch (error) {
        console.error('[SearchIndex] Failed to load from IndexedDB:', error);
        return null;
    }
}

/**
 * Clear persisted search index
 */
export async function clearPersistedSearchIndex(): Promise<void> {
    if (!searchIndexStore) return;
    
    try {
        await del(SEARCH_INDEX_KEY, searchIndexStore);
        console.log('[SearchIndex] Cleared from IndexedDB');
    } catch (error) {
        console.error('[SearchIndex] Failed to clear:', error);
    }
}

// ============================================================
// DRILLDOWN DATA PERSISTENCE (separate from query cache)
// ============================================================

// Create a separate IndexedDB store for drilldown data
// This stores the investor drilldown collection data for persistence across page refreshes
const drilldownStore = typeof window !== 'undefined'
    ? createStore('drilldown-cache', 'data')
    : null;

const DRILLDOWN_KEY = 'investor-drilldown-v1';

export interface PersistedDrilldownData {
    rows: Array<{
        id: string;
        ticker: string;
        cik: string;
        cikName: string;
        cikTicker: string;
        quarter: string;
        cusip: string | null;
        action: 'open' | 'close';
        didOpen: boolean | null;
        didAdd: boolean | null;
        didReduce: boolean | null;
        didClose: boolean | null;
        didHold: boolean | null;
    }>;
    fetchedCombinations: string[];
    bulkFetchedPairs: string[];
    metadata?: {
        totalRows: number;
        persistedAt?: number;
    };
}

/**
 * Save drilldown data to IndexedDB
 */
export async function persistDrilldownData(data: PersistedDrilldownData): Promise<void> {
    if (!drilldownStore) return;
    
    try {
        const startTime = performance.now();
        const dataWithTimestamp = {
            ...data,
            metadata: {
                totalRows: data.rows.length,
                persistedAt: Date.now(),
            },
        };
        await set(DRILLDOWN_KEY, dataWithTimestamp, drilldownStore);
        console.log(`[Drilldown] Persisted ${data.rows.length} rows to IndexedDB in ${(performance.now() - startTime).toFixed(1)}ms`);
    } catch (error) {
        console.error('[Drilldown] Failed to persist:', error);
    }
}

/**
 * Load drilldown data from IndexedDB
 * Returns null if not found or expired (older than 1 day)
 */
export async function loadPersistedDrilldownData(): Promise<PersistedDrilldownData | null> {
    if (!drilldownStore) return null;
    
    try {
        const startTime = performance.now();
        const data = await get<PersistedDrilldownData>(DRILLDOWN_KEY, drilldownStore);
        
        if (!data) {
            console.log('[Drilldown] No persisted data found');
            return null;
        }
        
        // Check if expired (1 day for drilldown data - it changes more frequently)
        const persistedAt = data.metadata?.persistedAt;
        if (persistedAt) {
            const age = Date.now() - persistedAt;
            const maxAge = 1000 * 60 * 60 * 24; // 1 day
            if (age > maxAge) {
                console.log('[Drilldown] Persisted data expired, will refetch');
                await del(DRILLDOWN_KEY, drilldownStore);
                return null;
            }
        }
        
        console.log(`[Drilldown] Loaded ${data.rows.length} rows from IndexedDB in ${(performance.now() - startTime).toFixed(1)}ms`);
        return data;
    } catch (error) {
        console.error('[Drilldown] Failed to load from IndexedDB:', error);
        return null;
    }
}

/**
 * Clear persisted drilldown data
 */
export async function clearPersistedDrilldownData(): Promise<void> {
    if (!drilldownStore) return;
    
    try {
        await del(DRILLDOWN_KEY, drilldownStore);
        console.log('[Drilldown] Cleared from IndexedDB');
    } catch (error) {
        console.error('[Drilldown] Failed to clear:', error);
    }
}
