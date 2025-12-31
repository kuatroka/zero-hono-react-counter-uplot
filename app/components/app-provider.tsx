import { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, preloadCollections, initializeWithFreshnessCheck, checkFreshnessOnFocus } from "@/collections";
import { openDatabase } from "@/lib/dexie-db";

// Re-export for backward compatibility
export { queryClient };

// Preload collections on app init for instant queries
// First opens Dexie database, checks data freshness, then preloads
function CollectionPreloader() {
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Guard against React StrictMode double-execution
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        async function init() {
            // 1. Open Dexie database
            await openDatabase();

            // 2. Check if backend data is fresher than cache, invalidate if stale
            await initializeWithFreshnessCheck();

            // 3. Then preload all eager collections
            await preloadCollections();
        }
        void init();
    }, []);

    return null;
}

// Re-check freshness when tab regains focus (for long-running sessions)
function DataFreshnessOnFocus() {
    useEffect(() => {
        const handleFocus = () => {
            checkFreshnessOnFocus().then(invalidated => {
                if (invalidated) {
                    // Refetch collections after invalidation
                    void preloadCollections();
                }
            });
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <CollectionPreloader />
            <DataFreshnessOnFocus />
            {children}
        </QueryClientProvider>
    );
}
