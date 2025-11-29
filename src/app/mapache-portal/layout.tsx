import type { ReactNode } from "react";

import PortalThemeProvider from "@/app/components/theme/PortalThemeProvider";

export default function MapachePortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PortalThemeProvider portal="mapache">
      {children}
    </PortalThemeProvider>
  );
}
