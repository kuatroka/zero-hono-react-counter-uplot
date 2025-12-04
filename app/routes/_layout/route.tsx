import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { ZeroInit } from "../../components/zero-init";
import { SiteLayout } from "../../components/site-layout";
import { ContentReadyContext } from "@/hooks/useContentReady";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  staleTime: Infinity,
});

function RouteComponent() {
  const [contentReady, setContentReady] = useState(false);
  
  const onReady = useCallback(() => {
    setContentReady(true);
  }, []);

  return (
    <ZeroInit>
      <ContentReadyContext.Provider value={{ onReady, isReady: contentReady }}>
        <div style={{ visibility: contentReady ? "visible" : "hidden" }}>
          <SiteLayout>
            <Outlet />
          </SiteLayout>
        </div>
      </ContentReadyContext.Provider>
    </ZeroInit>
  );
}
