"use client";

import * as React from "react";

import { useElementSize } from "./hooks";

type ChartSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type ChartDatum = {
  key: string;
  label: string;
  segments: ChartSegment[];
  total: number;
};

type StackedBarChartProps = {
  data: ChartDatum[];
  height?: number;
  valueFormatter?: (value: number) => string;
  axisLabel?: string;
};

type TooltipState = {
  x: number;
  y: number;
  datum: ChartDatum;
};

function formatDefault(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function StackedBarChart({
  data,
  height = 260,
  valueFormatter = formatDefault,
  axisLabel,
}: StackedBarChartProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const fallbackWidth = React.useMemo(() => (data.length > 0 ? 320 : 240), [
    data.length,
  ]);
  const width = size.width || fallbackWidth;
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  const margin = React.useMemo(
    () => ({ top: 24, right: 16, bottom: 48, left: 52 }),
    [],
  );

  const maxValue = React.useMemo(() => {
    return data.reduce((max, item) => Math.max(max, item.total), 0);
  }, [data]);

  const chartHeight = Math.max(height, 200);
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const barGap = data.length > 1 ? Math.min(24, innerWidth / data.length / 3) : 24;
  const barWidth =
    data.length === 0
      ? 0
      : Math.min(
          96,
          Math.max(12, (innerWidth - barGap * (data.length - 1)) / data.length),
        );

  const ticks = React.useMemo(() => {
    if (maxValue <= 0) return [0];
    const step = Math.max(1, Math.ceil(maxValue / 4));
    return Array.from({ length: 5 }, (_, index) => step * index);
  }, [maxValue]);

  const handlePointerLeave = React.useCallback(() => setTooltip(null), []);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGRectElement>, datum: ChartDatum) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setTooltip({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        datum,
      });
    },
    [containerRef],
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg width={width} height={chartHeight} className="overflow-visible">
        <defs>
          <linearGradient id="stacked-bar-grid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-grid-start, rgba(255,255,255,0.18))" />
            <stop offset="100%" stopColor="var(--chart-grid-end, rgba(148,163,184,0.12))" />
          </linearGradient>
        </defs>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {ticks.map((tick) => {
            const y = innerHeight - (maxValue === 0 ? 0 : (tick / maxValue) * innerHeight);
            return (
              <g key={tick}>
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={y}
                  y2={y}
                  stroke="var(--chart-grid-line, rgba(148,163,184,0.15))"
                  strokeDasharray="4 6"
                />
                <text
                  x={-12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--chart-axis-text, rgba(226,232,240,0.75))"
                >
                  {valueFormatter(tick)}
                </text>
              </g>
            );
          })}

          {data.map((datum, index) => {
            const x = index * (barWidth + barGap);
            let offset = 0;
            const segments = datum.segments.filter((segment) => segment.value > 0);
            return (
              <g key={datum.key} transform={`translate(${x},0)`}>
                {segments.map((segment) => {
                  const segmentHeight =
                    maxValue === 0
                      ? 0
                      : (segment.value / maxValue) * innerHeight;
                  const y = innerHeight - offset - segmentHeight;
                  offset += segmentHeight;
                  return (
                    <rect
                      key={segment.key}
                      x={0}
                      width={barWidth}
                      y={y}
                      height={Math.max(segmentHeight, 0)}
                      fill={segment.color}
                      rx={6}
                      onPointerMove={(event) => handlePointerMove(event, datum)}
                      onPointerEnter={(event) => handlePointerMove(event, datum)}
                      onPointerLeave={handlePointerLeave}
                    />
                  );
                })}
                <text
                  x={barWidth / 2}
                  y={innerHeight + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--chart-label-text, rgba(226,232,240,0.8))"
                >
                  {datum.label}
                </text>
              </g>
            );
          })}

          {axisLabel ? (
            <text
              x={-margin.left + 4}
              y={-12}
              fontSize={10}
              fill="var(--chart-text-muted, rgba(148,163,184,0.7))"
            >
              {axisLabel}
            </text>
          ) : null}
        </g>
      </svg>

      {tooltip ? (
        <div
          className="pointer-events-none absolute rounded-lg border p-3 text-xs shadow-lg backdrop-blur"
          style={{
            left: Math.max(8, Math.min(width - 160, tooltip.x - 80)),
            top: Math.max(8, tooltip.y - 120),
            width: 160,
            borderColor: "var(--mapache-glass-border, rgba(255,255,255,0.1))",
            background: "var(--chart-tooltip-bg, rgba(15,23,42,0.95))",
            color: "var(--chart-tooltip-text, rgba(255,255,255,0.8))",
          }}
        >
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            {tooltip.datum.label}
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {tooltip.datum.segments
              .filter((segment) => segment.value > 0)
              .map((segment) => {
                const total = tooltip.datum.total || 1;
                const percentage = Math.round((segment.value / total) * 100);
                return (
                  <div key={segment.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span>{segment.label}</span>
                    </span>
                    <span className="tabular-nums text-white/70">
                      {valueFormatter(segment.value)} · {percentage}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { ChartDatum as StackedBarChartDatum, ChartSegment as StackedBarChartSegment };

export default StackedBarChart;
