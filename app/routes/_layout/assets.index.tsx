import { createFileRoute } from "@tanstack/react-router";
import { AssetsTablePage } from "@/pages/AssetsTable";
import { queries } from "@/zero/queries";

export const Route = createFileRoute("/_layout/assets/")({
  component: AssetsTablePage,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    page: typeof search.page === "string" ? search.page : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
  }),
  loaderDeps: ({ search }) => ({ page: search.page, searchTerm: search.search }),
  loader: async ({ context, deps: { page, searchTerm } }) => {
    const { zero } = context;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limit = 500;
    const offset = 0;
    
    // Preload assets data
    zero.run(queries.assetsPage(limit, offset));
    
    // If there's a search term, preload search results
    if (searchTerm) {
      zero.run(queries.searchesByCategory("assets", searchTerm, 200));
    }
  },
});
