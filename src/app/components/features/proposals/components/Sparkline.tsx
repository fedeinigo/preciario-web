import React, { useMemo } from "react";

export type SparklineData = { value: number; label?: string }[];

interface SparklineProps {
  data: SparklineData;
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  trend?: "up" | "down" | "neutral";
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#7c3aed",
  showDots = false,
  trend = "neutral",
}: SparklineProps) {
  const points = useMemo(() => {
    if (data.length === 0) return "";
    
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    
    const padding = 2;
    const effectiveHeight = height - padding * 2;
    const effectiveWidth = width - padding * 2;
    const stepX = effectiveWidth / Math.max(data.length - 1, 1);
    
    return data
      .map((d, i) => {
        const x = padding + i * stepX;
        const normalized = (d.value - min) / range;
        const y = padding + effectiveHeight - normalized * effectiveHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data, width, height]);

  const trendColor = useMemo(() => {
    if (trend === "up") return "#10b981";
    if (trend === "down") return "#ef4444";
    return color;
  }, [trend, color]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-300"
        style={{ width, height }}
      >
        <svg width={width} height={height} className="opacity-30">
          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </svg>
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={trendColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      {showDots &&
        data.map((d, i) => {
          const values = data.map((item) => item.value);
          const max = Math.max(...values, 1);
          const min = Math.min(...values, 0);
          const range = max - min || 1;
          const padding = 2;
          const effectiveHeight = height - padding * 2;
          const effectiveWidth = width - padding * 2;
          const stepX = effectiveWidth / Math.max(data.length - 1, 1);
          const x = padding + i * stepX;
          const normalized = (d.value - min) / range;
          const y = padding + effectiveHeight - normalized * effectiveHeight;
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.5"
              fill={trendColor}
              className="transition-all duration-300"
            />
          );
        })}
    </svg>
  );
}
