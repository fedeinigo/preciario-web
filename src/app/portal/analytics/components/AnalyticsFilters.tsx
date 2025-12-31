"use client";

import { useMemo } from "react";
import { Calendar, X } from "lucide-react";
import {
  type Quarter,
  type AnalyticsFilters as FiltersState,
  getDefaultFilters,
  getQuarterDateRange,
} from "@/hooks/useAnalyticsData";

export type { Quarter, FiltersState as AnalyticsFiltersState };
export { getDefaultFilters };

type AnalyticsFiltersProps = {
  value: FiltersState;
  onChange: (filters: FiltersState) => void;
  className?: string;
};

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

function formatDateRange(year: number, quarter: Quarter): { fromStr: string; toStr: string } {
  const { from, to } = getQuarterDateRange(year, quarter);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  return {
    fromStr: formatDate(from),
    toStr: formatDate(to),
  };
}

export function AnalyticsFilters({ value, onChange, className = "" }: AnalyticsFiltersProps) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const { fromStr, toStr } = useMemo(
    () => formatDateRange(value.year, value.quarter),
    [value.year, value.quarter]
  );

  const handleYearChange = (year: number) => {
    onChange({ ...value, year });
  };

  const handleQuarterChange = (quarter: Quarter) => {
    onChange({ ...value, quarter });
  };

  const handleReset = () => {
    onChange(getDefaultFilters());
  };

  const defaults = getDefaultFilters();
  const isDefault = value.year === defaults.year && value.quarter === defaults.quarter;

  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>Filtros Activos:</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            <span>Desde: {fromStr}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            <span>Hasta: {toStr}</span>
          </div>
          {!isDefault && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Trimestre</label>
            <select
              value={value.quarter}
              onChange={(e) => handleQuarterChange(e.target.value as Quarter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Año</label>
            <select
              value={value.year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
