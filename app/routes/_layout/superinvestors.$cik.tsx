import { createFileRoute } from "@tanstack/react-router";
import { SuperinvestorDetailPage } from "@/pages/SuperinvestorDetail";
import { queries } from "@/zero/queries";

export const Route = createFileRoute("/_layout/superinvestors/$cik")({
  component: SuperinvestorDetailPage,
  ssr: false,
  loader: async ({ context, params }) => {
    const { zero } = context;
    const { cik } = params;
    
    // Preload superinvestor detail data
    zero.run(queries.superinvestorByCik(cik));
  },
});
