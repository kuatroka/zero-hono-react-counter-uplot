import { createFileRoute } from "@tanstack/react-router";
import { SuperinvestorDetailPage } from "@/pages/SuperinvestorDetail";

export const Route = createFileRoute("/_layout/superinvestors/$cik")({
  component: SuperinvestorDetailPage,
  ssr: false,
  // Removed Zero preloading - TanStack Query handles data fetching now
});
