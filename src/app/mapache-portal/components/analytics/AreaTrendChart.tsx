"use client";

import * as React from "react";

import { useElementSize } from "./hooks";

type AreaDatum = {
  key: string;
  label: string;
  value: number;
  meta?: string;
};

type AreaTrendChartProps = {
  data: AreaDatum[];
  height?: number;
  color?: string;
  valueFormatter?: (value: number) => string;
  metaFormatter?: (value: AreaDatum) => string | null;
};

type TooltipState = {
  x: number;
  y: number;
  datum: AreaDatum;
};

function formatDefault(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function AreaTrendChart({
  data,
  height = 260,
  color = "rgb(56, 189, 248)",
  valueFormatter = formatDefault,
  metaFormatter,
}: AreaTrendChartProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const width = size.width || Math.max(280, data.length * 80);
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);

  const margin = React.useMemo(
    () => ({ top: 24, right: 16, bottom: 48, left: 52 }),
    [],
  );

  const values = data.map((item) => item.value);
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const range = maxValue - Math.min(0, minValue);
  const chartHeight = Math.max(height, 220);
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const innerWidth = Math.max(width - margin.left - margin.right, 0);

  const getX = React.useCallback(
    (index: number) => {
      if (data.length <= 1) return innerWidth / 2;
      const step = innerWidth / (data.length - 1);
      return step * index;
    },
    [data.length, innerWidth],
  );

  const getY = React.useCallback(
    (value: number) => {
      if (range === 0) return innerHeight;
      const normalized = (value - Math.min(0, minValue)) / range;
      return innerHeight - normalized * innerHeight;
    },
    [innerHeight, minValue, range],
  );

  const path = React.useMemo(() => {
    if (data.length === 0) return "";
    const points = data.map((item, index) => `${getX(index)},${getY(item.value)}`);
    const start = `M0,${innerHeight}`;
    const line = points.map((point) => `L${point}`).join(" ");
    const close = `L${getX(data.length - 1)},${innerHeight} Z`;
    return `${start} ${line} ${close}`;
  }, [data, getX, getY, innerHeight]);

  const linePath = React.useMemo(() => {
    if (data.length === 0) return "";
    return data
      .map((item, index) => {
        const command = index === 0 ? "M" : "L";
        return `${command}${getX(index)},${getY(item.value)}`;
      })
      .join(" ");
  }, [data, getX, getY]);

  const ticks = React.useMemo(() => {
    if (maxValue <= 0) return [0];
    const step = Math.max(1, Math.ceil(maxValue / 4));
    return Array.from({ length: 5 }, (_, index) => step * index);
  }, [maxValue]);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGCircleElement>, datum: AreaDatum) => {
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

  const handlePointerLeave = React.useCallback(() => setTooltip(null), []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg width={width} height={chartHeight} className="overflow-visible">
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
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
                  stroke="rgba(148,163,184,0.15)"
                  strokeDasharray="4 6"
                />
                <text
                  x={-12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="rgba(226,232,240,0.75)"
                >
                  {valueFormatter(tick)}
                </text>
              </g>
            );
          })}

          <path d={path} fill="url(#area-fill)" />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

          {data.map((item, index) => {
            const cx = getX(index);
            const cy = getY(item.value);
            return (
              <circle
                key={item.key}
                cx={cx}
                cy={cy}
                r={4.5}
                fill={color}
                stroke="rgba(15,23,42,0.9)"
                strokeWidth={1.5}
                onPointerMove={(event) => handlePointerMove(event, item)}
                onPointerEnter={(event) => handlePointerMove(event, item)}
                onPointerLeave={handlePointerLeave}
              />
            );
          })}

          {data.map((item, index) => {
            const x = getX(index);
            return (
              <text
                key={`${item.key}-label`}
                x={x}
                y={innerHeight + 20}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(226,232,240,0.8)"
              >
                {item.label}
              </text>
            );
          })}
        </g>
      </svg>

      {tooltip ? (
        <div
          className="pointer-events-none absolute rounded-lg border border-white/10 bg-slate-900/95 p-3 text-xs text-white/80 shadow-lg backdrop-blur"
          style={{
            left: Math.max(8, Math.min(width - 180, tooltip.x - 90)),
            top: Math.max(8, tooltip.y - 110),
            width: 180,
          }}
        >
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            {tooltip.datum.label}
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {valueFormatter(tooltip.datum.value)}
          </div>
          {metaFormatter ? (
            <div className="mt-1 text-[11px] uppercase tracking-wide text-white/40">
              {metaFormatter(tooltip.datum)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { AreaDatum };

export default AreaTrendChart;
