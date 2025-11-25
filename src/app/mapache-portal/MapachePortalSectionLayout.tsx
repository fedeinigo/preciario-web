"use client";

import * as React from "react";

import MapachePortalClient from "./MapachePortalClient";
import MapachePortalReadySignal from "./MapachePortalReadySignal";
import type { MapachePortalBootstrap } from "./bootstrap-types";
import { MapachePortalQueryProvider } from "./context/query-client";

type MapachePortalSectionLayoutProps = {
  initialBootstrap: MapachePortalBootstrap;
  children: React.ReactNode;
};

export default function MapachePortalSectionLayout({
  initialBootstrap,
  children,
}: MapachePortalSectionLayoutProps) {
  return (
    <MapachePortalQueryProvider>
      <MapachePortalReadySignal />
      <div className="space-y-6 px-4 pb-10 -mt-[var(--nav-h)] pt-[var(--nav-h)]">
        <MapachePortalClient initialBootstrap={initialBootstrap} />
      </div>
      {children}
    </MapachePortalQueryProvider>
  );
}
