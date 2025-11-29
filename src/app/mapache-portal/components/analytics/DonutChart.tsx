"use client";

import * as React from "react";

import { useElementSize } from "./hooks";

type DonutDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutDatum[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
};

type TooltipState = {
  x: number;
  y: number;
  datum: DonutDatum;
  percentage: number;
};

function formatDefault(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function DonutChart({
  data,
  valueFormatter = formatDefault,
  emptyLabel = "Sin datos",
}: DonutChartProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const width = size.width || 280;
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  const total = React.useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data],
  );

  const radius = Math.min(width, 260) / 2;
  const innerRadius = radius * 0.58;
  const centerX = width / 2;
  const centerY = Math.max(radius + 8, 120);

  const normalizedData = React.useMemo(() => {
    let startAngle = -Math.PI / 2;
    return data
      .filter((item) => item.value > 0)
      .map((item) => {
        const angle = total === 0 ? 0 : (item.value / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const segment = {
          ...item,
          startAngle,
          endAngle,
        };
        startAngle = endAngle;
        return segment;
      });
  }, [data, total]);

  const describeArc = React.useCallback(
    (startAngle: number, endAngle: number) => {
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const startX = centerX + radius * Math.cos(startAngle);
      const startY = centerY + radius * Math.sin(startAngle);
      const endX = centerX + radius * Math.cos(endAngle);
      const endY = centerY + radius * Math.sin(endAngle);
      const innerStartX = centerX + innerRadius * Math.cos(endAngle);
      const innerStartY = centerY + innerRadius * Math.sin(endAngle);
      const innerEndX = centerX + innerRadius * Math.cos(startAngle);
      const innerEndY = centerY + innerRadius * Math.sin(startAngle);

      return [
        "M",
        startX,
        startY,
        "A",
        radius,
        radius,
        0,
        largeArc,
        1,
        endX,
        endY,
        "L",
        innerStartX,
        innerStartY,
        "A",
        innerRadius,
        innerRadius,
        0,
        largeArc,
        0,
        innerEndX,
        innerEndY,
        "Z",
      ].join(" ");
    },
    [centerX, centerY, innerRadius, radius],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGPathElement>, datum: DonutDatum) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const percentage = total === 0 ? 0 : Math.round((datum.value / total) * 100);
      setTooltip({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        datum,
        percentage,
      });
    },
    [containerRef, total],
  );

  const handlePointerLeave = React.useCallback(() => setTooltip(null), []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg width={width} height={Math.max(centerY * 2, 220)}>
        {normalizedData.length === 0 ? (
          <g transform={`translate(${centerX}, ${centerY})`}>
            <circle r={radius} fill="var(--mapache-glass-bg, rgba(255,255,255,0.04))" />
            <text
              textAnchor="middle"
              fontSize={12}
              fill="var(--chart-text-muted, rgba(148,163,184,0.8))"
              dy={4}
            >
              {emptyLabel}
            </text>
          </g>
        ) : (
          <>
            {normalizedData.map((segment) => (
              <path
                key={segment.key}
                d={describeArc(segment.startAngle, segment.endAngle)}
                fill={segment.color}
                onPointerMove={(event) => handlePointerMove(event, segment)}
                onPointerEnter={(event) => handlePointerMove(event, segment)}
                onPointerLeave={handlePointerLeave}
              />
            ))}
            <text
              x={centerX}
              y={centerY - 8}
              textAnchor="middle"
              fontSize={24}
              fontWeight={600}
              fill="var(--chart-text-primary, rgba(255,255,255,0.95))"
            >
              {valueFormatter(total)}
            </text>
            <text
              x={centerX}
              y={centerY + 16}
              textAnchor="middle"
              fontSize={12}
              fill="var(--chart-text-muted, rgba(148,163,184,0.8))"
            >
              Total
            </text>
          </>
        )}
      </svg>

      {tooltip ? (
        <div
          className="pointer-events-none absolute rounded-lg border p-3 text-xs shadow-lg backdrop-blur"
          style={{
            left: Math.max(8, Math.min(width - 180, tooltip.x - 90)),
            top: Math.max(8, tooltip.y - 100),
            width: 180,
            borderColor: "var(--mapache-glass-border, rgba(255,255,255,0.1))",
            background: "var(--chart-tooltip-bg, rgba(15,23,42,0.95))",
            color: "var(--chart-tooltip-text, rgba(255,255,255,0.8))",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: tooltip.datum.color }}
              />
              <span>{tooltip.datum.label}</span>
            </span>
            <span className="tabular-nums text-white/70">
              {valueFormatter(tooltip.datum.value)}
            </span>
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-wide text-white/50">
            {tooltip.percentage}% del total
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { DonutDatum };

export default DonutChart;
