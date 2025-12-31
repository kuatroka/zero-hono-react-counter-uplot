/**
 * Data Freshness - Cache Invalidation System
 *
 * Detects when backend DuckDB data is fresher than frontend caches
 * and invalidates all IndexedDB databases when stale.
 *
 * Uses localStorage for version tracking (survives IndexedDB nuke).
 */

import { clearAllCikQuarterlyData } from './cik-quarterly'

const STORAGE_KEY = 'app-data-version'

export interface FreshnessState {
    lastDataLoadDate: string | null
    checkedAt: number
}

export interface FreshnessCheckResult {
    isStale: boolean
    serverVersion: string | null
    localVersion: string | null
}

/**
 * Get stored data version from localStorage (sync access)
 */
export function getStoredDataVersion(): string | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return null
        const state: FreshnessState = JSON.parse(stored)
        return state.lastDataLoadDate
    } catch {
        return null
    }
}

/**
 * Save data version to localStorage
 */
export function setStoredDataVersion(lastDataLoadDate: string): void {
    const state: FreshnessState = {
        lastDataLoadDate,
        checkedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * Clear all IndexedDB databases (global nuke)
 * Uses indexedDB.databases() API to enumerate and delete all databases
 */
export async function clearAllIndexedDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') return

    try {
        const databases = await indexedDB.databases()
        await Promise.all(
            databases.map(db => new Promise<void>((resolve, reject) => {
                if (!db.name) {
                    resolve()
                    return
                }
                const req = indexedDB.deleteDatabase(db.name)
                req.onsuccess = () => {
                    console.log(`[DataFreshness] Deleted IndexedDB: ${db.name}`)
                    resolve()
                }
                req.onerror = () => reject(req.error)
                req.onblocked = () => {
                    console.warn(`[DataFreshness] IndexedDB delete blocked: ${db.name}`)
                    resolve()
                }
            }))
        )
    } catch (error) {
        console.error('[DataFreshness] Failed to clear IndexedDB:', error)
    }
}

/**
 * Invalidate all caches - both IndexedDB and memory
 */
export async function invalidateAllCaches(): Promise<void> {
    console.log('[DataFreshness] Invalidating all caches...')

    // Clear all IndexedDB databases
    await clearAllIndexedDB()

    // Clear in-memory caches
    clearAllCikQuarterlyData()

    console.log('[DataFreshness] All caches invalidated')
}

/**
 * Check if backend data is fresher than our cache
 * Returns whether cache is stale and version info
 */
export async function checkDataFreshness(): Promise<FreshnessCheckResult> {
    try {
        const res = await fetch('/api/data-freshness')
        if (!res.ok) {
            console.warn('[DataFreshness] API request failed, continuing with cache')
            return { isStale: false, serverVersion: null, localVersion: getStoredDataVersion() }
        }

        const { lastDataLoadDate } = await res.json()
        const localVersion = getStoredDataVersion()

        // First load - no local version stored
        if (localVersion === null) {
            return { isStale: false, serverVersion: lastDataLoadDate, localVersion: null }
        }

        // Compare versions
        const isStale = localVersion !== lastDataLoadDate

        return { isStale, serverVersion: lastDataLoadDate, localVersion }
    } catch (error) {
        console.warn('[DataFreshness] Check failed, continuing with cache:', error)
        return { isStale: false, serverVersion: null, localVersion: getStoredDataVersion() }
    }
}

// Guard to prevent double initialization (React StrictMode runs effects twice)
let initializationPromise: Promise<void> | null = null
let isInitialized = false

/**
 * Initialize app with freshness check
 * Call this before preloading collections
 * Guarded against double execution from React StrictMode
 */
export async function initializeWithFreshnessCheck(): Promise<void> {
    // If already initialized, skip
    if (isInitialized) {
        console.log('[DataFreshness] Already initialized, skipping')
        return
    }

    // If initialization is in progress, wait for it
    if (initializationPromise) {
        console.log('[DataFreshness] Initialization in progress, waiting...')
        return initializationPromise
    }

    initializationPromise = (async () => {
        const { isStale, serverVersion, localVersion } = await checkDataFreshness()

        if (isStale && serverVersion) {
            console.log(`[DataFreshness] Data updated: ${localVersion} → ${serverVersion}, invalidating caches...`)
            await invalidateAllCaches()
            // Update version BEFORE reload so we don't loop
            setStoredDataVersion(serverVersion)
            // Reload to get fresh module-level store references
            // idb-keyval stores are created at module init and become stale after IndexedDB nuke
            console.log('[DataFreshness] Reloading page for fresh store connections...')
            window.location.reload()
            // Never reaches here due to reload
            return
        } else if (serverVersion && localVersion === null) {
            // First load - just store the version
            console.log(`[DataFreshness] First load, storing version: ${serverVersion}`)
            setStoredDataVersion(serverVersion)
        } else {
            console.log('[DataFreshness] Cache is fresh')
        }

        isInitialized = true
    })()

    return initializationPromise
}

// Debounce state for tab focus checks
let lastFocusCheckTime = 0
const FOCUS_CHECK_DEBOUNCE_MS = 5000

/**
 * Check freshness on tab focus (debounced)
 * Returns true if caches were invalidated
 */
export async function checkFreshnessOnFocus(): Promise<boolean> {
    const now = Date.now()
    if (now - lastFocusCheckTime < FOCUS_CHECK_DEBOUNCE_MS) {
        return false
    }
    lastFocusCheckTime = now

    const { isStale, serverVersion } = await checkDataFreshness()

    if (isStale && serverVersion) {
        console.log(`[DataFreshness] Tab focus: data updated, invalidating caches...`)
        await invalidateAllCaches()
        // Update version BEFORE reload so we don't loop
        setStoredDataVersion(serverVersion)
        // Reload to get fresh module-level store references
        console.log('[DataFreshness] Reloading page for fresh store connections...')
        window.location.reload()
        // Never reaches here due to reload
        return true
    }

    return false
}
