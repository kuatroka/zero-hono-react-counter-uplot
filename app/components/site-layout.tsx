import { GlobalNav } from "./global-nav";
import { useContentReady } from "@/hooks/useContentReady";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useContentReady();

  return (
    <>
      <GlobalNav />
      <div style={{ visibility: isReady ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </>
  );
}
