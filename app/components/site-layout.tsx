import { GlobalNav } from "./global-nav";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalNav />
      {children}
    </>
  );
}
