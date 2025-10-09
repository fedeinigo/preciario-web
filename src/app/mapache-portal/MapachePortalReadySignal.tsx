"use client";

import * as React from "react";

import { MAPACHE_PORTAL_READY_EVENT } from "./section-events";

export default function MapachePortalReadySignal() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(MAPACHE_PORTAL_READY_EVENT));
  }, []);

  return null;
}
