import { Zero } from "@rocicorp/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema, Schema } from "@/zero/schema";
import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { queries } from "@/zero/queries";

const serverURL = import.meta.env.VITE_PUBLIC_SERVER ?? "http://localhost:4848";

export function ZeroInit({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Get user ID from JWT cookie or use anonymous
  const encodedJWT = Cookies.get("jwt");
  const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
  const userID = (decodedJWT?.sub as string) ?? "anon";

  const opts = useMemo(() => {
    return {
      schema,
      userID,
      server: serverURL,
      init: (zero: Zero<Schema>) => {
        router.update({
          context: {
            ...router.options.context,
            zero,
          },
        });

        router.invalidate();

        preload(zero);
      },
    };
  }, [userID, router]);

  return <ZeroProvider {...opts}>{children}</ZeroProvider>;
}

function preload(z: Zero<Schema>) {
  // Delay preload() slightly to avoid blocking UI on first run.
  // We don't need this data to display the UI, it's used by search.
  setTimeout(() => {
    // Preload browsing data (windowed pagination)
    z.preload(queries.assetsPage(500, 0), { ttl: "5m" });
    z.preload(queries.superinvestorsPage(500, 0), { ttl: "5m" });

    // Preload search index for instant local search
    z.preload(queries.searchesByCategory("assets", "", 500), { ttl: "5m" });
    z.preload(queries.searchesByCategory("superinvestors", "", 100), { ttl: "5m" });
  }, 1_000);
}
