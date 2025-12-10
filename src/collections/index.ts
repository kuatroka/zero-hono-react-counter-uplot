// TanStack DB Collections - Export all collection factories and instances

// Factory functions (for creating new collection instances)
export { createAssetsCollection, type Asset } from './assets'
export { createSuperinvestorsCollection, type Superinvestor } from './superinvestors'
export { type InvestorDetail, investorDrilldownCollection } from './investor-details'

// Singleton instances (for use with useLiveQuery in components)
export {
    queryClient,
    assetsCollection,
    superinvestorsCollection,
    preloadCollections,
} from './instances'
