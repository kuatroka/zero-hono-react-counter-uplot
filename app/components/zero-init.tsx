import { Zero } from "@rocicorp/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema, Schema } from "@/zero/schema";
import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { queries } from "@/zero/queries";

const serverURL = import.meta.env.VITE_PUBLIC_SERVER ?? "http://localhost:4848";

// Stable IDs so Zero reuses the same IndexedDB database
function getStableUserID(): string {
  const encodedJWT = Cookies.get("jwt");
  const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
  if (decodedJWT?.sub) return decodedJWT.sub as string;

  const ANON_USER_KEY = "zero_anon_user_id";
  let anonID = localStorage.getItem(ANON_USER_KEY);
  if (!anonID) {
    anonID = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(ANON_USER_KEY, anonID);
  }
  return anonID;
}

export function ZeroInit({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userID = getStableUserID();

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

        // Preload immediately for instant cache hits
        preload(zero);
      },
    };
  }, [userID, router]);

  return <ZeroProvider {...opts}>{children}</ZeroProvider>;
}

function preload(z: Zero<Schema>) {
  // Preload browsing data immediately (windowed pagination)
  z.preload(queries.assetsPage(500, 0), { ttl: "5m" });
  z.preload(queries.superinvestorsPage(500, 0), { ttl: "5m" });

  // Preload search index for instant local search
  z.preload(queries.searchesByCategory("assets", "", 500), { ttl: "5m" });
  z.preload(queries.searchesByCategory("superinvestors", "", 100), { ttl: "5m" });
}
