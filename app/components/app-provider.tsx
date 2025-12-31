import { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, preloadCollections, initializeWithFreshnessCheck, checkFreshnessOnFocus } from "@/collections";

// Re-export for backward compatibility
export { queryClient };

// Preload collections on app init for instant queries
// First checks data freshness and invalidates stale caches
function CollectionPreloader() {
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Guard against React StrictMode double-execution
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        async function init() {
            // Check if backend data is fresher than cache, invalidate if stale
            await initializeWithFreshnessCheck();
            // Then preload all eager collections
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
