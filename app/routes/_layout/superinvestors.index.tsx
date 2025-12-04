import { createFileRoute } from "@tanstack/react-router";
import { SuperinvestorsTablePage } from "@/pages/SuperinvestorsTable";
import { queries } from "@/zero/queries";

export const Route = createFileRoute("/_layout/superinvestors/")({
  component: SuperinvestorsTablePage,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    page: typeof search.page === "string" ? search.page : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
  }),
  loaderDeps: ({ search }) => ({ page: search.page, searchTerm: search.search }),
  loader: async ({ context, deps: { searchTerm } }) => {
    const { zero } = context;
    
    // Preload superinvestors data
    zero.run(queries.superinvestorsPage(500, 0));
    
    // If there's a search term, preload search results
    if (searchTerm) {
      zero.run(queries.searchesByCategory("superinvestors", searchTerm, 100));
    }
  },
});
