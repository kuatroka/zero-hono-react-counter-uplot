import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ZeroInit } from "../../components/zero-init";
import { SiteLayout } from "../../components/site-layout";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  staleTime: Infinity,
});

function RouteComponent() {
  return (
    <ZeroInit>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </ZeroInit>
  );
}
