import { createFileRoute } from "@tanstack/react-router";
import { AssetDetailPage } from "@/pages/AssetDetail";
import { queries } from "@/zero/queries";

export const Route = createFileRoute("/_layout/assets/$code/$cusip")({
  component: AssetDetailPage,
  ssr: false,
  loader: async ({ context, params }) => {
    const { zero } = context;
    const { code, cusip } = params;
    
    // Preload asset detail data
    if (cusip && cusip !== "_") {
      zero.run(queries.assetBySymbolAndCusip(code, cusip));
    } else {
      zero.run(queries.assetBySymbol(code));
    }
  },
});
