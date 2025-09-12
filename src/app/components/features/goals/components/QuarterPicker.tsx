// src/app/components/features/goals/components/QuarterPicker.tsx
"use client";

import React from "react";

export default function QuarterPicker({
  year,
  quarter,
  onYear,
  onQuarter,
}: {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  onYear: (v: number) => void;
  onQuarter: (v: 1 | 2 | 3 | 4) => void;
}) {
  const years = React.useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1, y + 2];
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <label className="block">
        <span className="block text-xs text-gray-600 mb-1">Año</span>
        <select
          className="w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#4c1d95]/30"
          value={year}
          onChange={(e) => onYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs text-gray-600 mb-1">Trimestre</span>
        <select
          className="w-full h-10 px-4 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#4c1d95]/30"
          value={quarter}
          onChange={(e) => onQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
        >
          <option value={1}>Q1</option>
          <option value={2}>Q2</option>
          <option value={3}>Q3</option>
          <option value={4}>Q4</option>
        </select>
      </label>
    </div>
  );
}
