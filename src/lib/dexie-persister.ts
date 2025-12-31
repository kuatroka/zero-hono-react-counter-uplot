/**
 * Dexie-based AsyncStorage for TanStack Query Persister
 *
 * Implements the AsyncStorage interface required by experimental_createQueryPersister
 * using Dexie for proper IndexedDB connection lifecycle management.
 */

import type { AsyncStorage } from '@tanstack/query-persist-client-core'
import { getDb, type QueryCacheEntry } from './dexie-db'

/**
 * Create an AsyncStorage adapter backed by Dexie
 * Used with experimental_createQueryPersister for TanStack Query persistence
 */
export function createDexieStorage(): AsyncStorage {
    return {
        getItem: async (key: string): Promise<string | null> => {
            try {
                const db = getDb()
                const entry = await db.queryCache.get(key)
                if (!entry) return null
                // TanStack Query persister expects string data
                return typeof entry.data === 'string'
                    ? entry.data
                    : JSON.stringify(entry.data)
            } catch (error) {
                console.error('[DexiePersister] Failed to get item:', error)
                return null
            }
        },

        setItem: async (key: string, value: string): Promise<void> => {
            try {
                const db = getDb()
                const entry: QueryCacheEntry = {
                    key,
                    data: value,
                    timestamp: Date.now()
                }
                await db.queryCache.put(entry)
            } catch (error) {
                console.error('[DexiePersister] Failed to set item:', error)
            }
        },

        removeItem: async (key: string): Promise<void> => {
            try {
                const db = getDb()
                await db.queryCache.delete(key)
            } catch (error) {
                console.error('[DexiePersister] Failed to remove item:', error)
            }
        }
    }
}
