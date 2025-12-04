import { Zero } from "@rocicorp/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema, Schema } from "@/zero/schema";
import { useEffect, useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { preload } from "@/zero-preload";

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

function getStableStorageKey(): string {
  const STORAGE_KEY = "zero_storage_key_v2";
  let storageKey = localStorage.getItem(STORAGE_KEY);
  if (!storageKey) {
    storageKey = "main-v2";
    localStorage.setItem(STORAGE_KEY, storageKey);
  }
  return storageKey;
}

export function ZeroInit({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userID = getStableUserID();

  const opts = useMemo(() => {
    const auth = Cookies.get("jwt");
    const storageKey = getStableStorageKey();
    const getQueriesURL = "http://localhost:4000/api/zero/get-queries";

    return {
      schema,
      userID,
      auth,
      server: serverURL,
      storageKey,
      getQueriesURL,
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

  useEffect(() => {
    (async () => {
      try {
        if (navigator.storage?.persist) {
          const persisted = await navigator.storage.persisted();
          if (!persisted) await navigator.storage.persist();
        }
      } catch {}
    })();
  }, []);

  return <ZeroProvider {...opts}>{children}</ZeroProvider>;
}
