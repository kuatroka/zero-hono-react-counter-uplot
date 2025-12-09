import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, preloadCollections } from "@/collections";

// Re-export for backward compatibility
export { queryClient };

// Preload collections on app init for instant queries
function CollectionPreloader() {
    useEffect(() => {
        // Preload all eager collections on mount
        // This triggers the initial fetch so data is ready for useLiveQuery
        void preloadCollections();
    }, []);
    
    return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <CollectionPreloader />
            {children}
        </QueryClientProvider>
    );
}
