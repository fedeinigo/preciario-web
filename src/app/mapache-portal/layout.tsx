import type { ReactNode } from "react";

import MapacheThemeToggle from "./MapacheThemeToggle";

export default function MapachePortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <MapacheThemeToggle />
      {children}
    </>
  );
}
