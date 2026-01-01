import { createFileRoute } from "@tanstack/react-router";
import { SuperinvestorDetailPage } from "@/pages/SuperinvestorDetail";
import { fetchCikQuarterlyData } from "@/collections";

export const Route = createFileRoute("/_layout/superinvestors/$cik")({
  component: SuperinvestorDetailPage,
  ssr: false,
  // Preload CIK quarterly data before component renders
  // This starts the IndexedDB read early so data is ready when component mounts
  beforeLoad: async ({ params }) => {
    // Fire and forget - don't await, just start the fetch early
    fetchCikQuarterlyData(params.cik).catch(() => {
      // Silently ignore errors - component will handle retry
    });
  },
});
