"use client";

import * as React from "react";

export function ChartSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex h-full w-full flex-col justify-between gap-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-8 w-full animate-pulse rounded-md"
          style={{ background: "var(--mapache-glass-bg, rgba(255,255,255,0.1))" }}
        />
      ))}
    </div>
  );
}

export default ChartSkeleton;
