"use client";

import * as React from "react";

import ChartSkeleton from "./ChartSkeleton";

type ChartCardProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function ChartCard({
  title,
  description,
  actions,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Sin datos disponibles.",
  children,
}: ChartCardProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description ? (
            <p className="text-xs text-white/60">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="relative min-h-[220px] flex-1">
        <div className="absolute inset-0">
          {isLoading ? (
            <ChartSkeleton />
          ) : isEmpty ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-white/10 bg-white/5">
              <p className="px-6 text-center text-xs text-white/60">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartCard;
