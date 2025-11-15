import React from "react";
import { Sparkline, type SparklineData } from "./Sparkline";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface EnhancedGlassKpiProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  sparklineData?: SparklineData;
  trend?: "up" | "down" | "neutral";
  comparison?: {
    value: string;
    period: string;
  };
  icon?: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
}

export function EnhancedGlassKpi({
  label,
  value,
  hint,
  sparklineData,
  trend = "neutral",
  comparison,
  icon,
  tooltip,
  onClick,
}: EnhancedGlassKpiProps) {
  const trendIcon = {
    up: <TrendingUp className="h-4 w-4 text-green-600" />,
    down: <TrendingDown className="h-4 w-4 text-red-600" />,
    neutral: <Minus className="h-4 w-4 text-slate-400" />,
  };

  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-slate-500",
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-5 shadow-lg shadow-purple-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-200/60 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-purple-200/40 to-transparent blur-2xl transition-all duration-300 group-hover:scale-125"
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700/80">
                {label}
              </p>
              {tooltip && (
                <div className="group/tooltip relative">
                  <Info className="h-3.5 w-3.5 cursor-help text-purple-400" />
                  <div className="pointer-events-none absolute left-0 top-full mt-1 hidden w-48 rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg group-hover/tooltip:block">
                    {tooltip}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-purple-900">{value}</p>
              {comparison && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor[trend]}`}>
                  {trendIcon[trend]}
                  <span>{comparison.value}</span>
                </div>
              )}
            </div>
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
            {comparison && (
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                vs {comparison.period}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100/60 text-purple-600 transition-all duration-300 group-hover:bg-purple-200/60">
              {icon}
            </div>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Sparkline data={sparklineData} width={100} height={28} trend={trend} showDots />
          </div>
        )}
      </div>
    </div>
  );
}
