import type { ReactNode } from "react";

import PortalThemeProvider from "@/app/components/theme/PortalThemeProvider";

export default function MarketingPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PortalThemeProvider portal="marketing">
      {children}
    </PortalThemeProvider>
  );
}
