// src/app/components/features/goals/components/ProgressBar.tsx
"use client";

import React from "react";

/**
 * Barra estilo Wise:
 * - marca 100%
 * - % real ilimitado (overfill con rayado)
 * - etiqueta flotante
 * - altura configurable
 */
export default function ProgressBar({
  pct,
  title,
  height = 12, // px
}: {
  pct: number;
  title?: string;
  height?: number;
}) {
  const pctSafe = Number.isFinite(pct) ? pct : 0;
  const baseWidth = Math.min(100, Math.max(0, pctSafe));
  const overflow = Math.max(0, pctSafe - 100);

  return (
    <div
      className="relative w-full rounded-full bg-[#ede9fe] overflow-visible"
      style={{ height }}
    >
      {/* 0..100 con violeta pleno */}
      <div
        className="h-full rounded-l-full bg-[#4c1d95]"
        style={{ width: `${baseWidth}%` }}
        title={title ?? `${pctSafe.toFixed(1)}%`}
      />
      {/* marca del 100 */}
      <div className="absolute top-0 left-[100%] -translate-x-1/2 h-full w-[2px] bg-[#4c1d95]/30" />
      {/* overfill rayado */}
      {overflow > 0 && (
        <div
          className="absolute top-0 left-[100%] h-full rounded-r-full"
          style={{
            width: `${overflow}%`,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(76,29,149,0.55) 0, rgba(76,29,149,0.55) 6px, rgba(76,29,149,0.25) 6px, rgba(76,29,149,0.25) 12px)",
          }}
          title={title ?? `${pctSafe.toFixed(1)}%`}
        />
      )}
      {/* etiqueta % real */}
      <div
        className="absolute -top-6 text-[11px] font-semibold text-[#4c1d95]"
        style={{ left: `calc(${Math.max(0, pctSafe)}% - 24px)` }}
      >
        {pctSafe.toFixed(1)}%
      </div>
    </div>
  );
}
