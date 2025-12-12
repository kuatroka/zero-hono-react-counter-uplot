// TanStack DB Collections - Export all collection instances and types

// Singleton instances (for use with useLiveQuery in components)
export {
    queryClient,
    assetsCollection,
    superinvestorsCollection,
    searchesCollection,
    preloadCollections,
} from './instances'

// Types
export type { Asset, Superinvestor, SearchResult } from './instances'
export { type InvestorDetail, investorDrilldownCollection } from './investor-details'
