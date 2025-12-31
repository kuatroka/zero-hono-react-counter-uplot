// TanStack DB Collections - Export all collection instances and types

// Singleton instances (for use with useLiveQuery in components)
export {
    queryClient,
    assetsCollection,
    superinvestorsCollection,
    allAssetsActivityCollection,
    searchesCollection,
    preloadCollections,
    preloadSearches,
} from './instances'

// Types
export type { Asset, Superinvestor, SearchResult } from './instances'
export { type InvestorDetail, investorDrilldownCollection } from './investor-details'
export {
    type CikQuarterlyData,
    fetchCikQuarterlyData,
    getCikQuarterlyDataFromCache,
    hasFetchedCikData,
    cikQuarterlyTiming,
    prefetchCikQuarterlyData,
    invalidateCikQuarterlyData,
} from './cik-quarterly'

// Search index functions
export { loadPrecomputedIndex, searchWithIndex, isSearchIndexReady } from './searches'

// Data freshness / cache invalidation
export {
    initializeWithFreshnessCheck,
    checkDataFreshness,
    checkFreshnessOnFocus,
    invalidateAllCaches,
    clearAllIndexedDB,
    getStoredDataVersion,
    setStoredDataVersion,
} from './data-freshness'
