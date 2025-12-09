import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppProvider } from "../../components/app-provider";
import { SiteLayout } from "../../components/site-layout";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  ssr: false,
  staleTime: Infinity,
});

function RouteComponent() {
  return (
    <AppProvider>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </AppProvider>
  );
}
