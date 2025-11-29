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
    <div className="flex h-full flex-col gap-4 rounded-lg border p-4" style={{
      borderColor: "var(--mapache-glass-border, rgba(255,255,255,0.16))",
      background: "var(--mapache-glass-bg, rgba(255,255,255,0.06))",
      boxShadow: "var(--shadow-md)",
    }}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>{title}</h3>
          {description ? (
            <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="relative min-h-[220px] flex-1">
        <div className="absolute inset-0">
          {isLoading ? (
            <ChartSkeleton />
          ) : isEmpty ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed" style={{
              borderColor: "var(--mapache-glass-border, rgba(255,255,255,0.16))",
              background: "var(--mapache-glass-bg, rgba(255,255,255,0.06))",
            }}>
              <p className="px-6 text-center text-xs" style={{ color: "rgb(var(--text-muted))" }}>{emptyMessage}</p>
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
