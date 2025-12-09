import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAssetsCollection, createSuperinvestorsCollection } from "@/collections";

// Single QueryClient instance for TanStack Query and TanStack DB collections
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000,   // 10 minutes
        },
    },
});

// Initialize collections with the shared queryClient
export const assetsCollection = createAssetsCollection(queryClient);
export const superinvestorsCollection = createSuperinvestorsCollection(queryClient);

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
