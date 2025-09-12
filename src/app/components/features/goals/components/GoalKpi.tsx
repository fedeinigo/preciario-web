// src/app/components/features/goals/components/GoalKpi.tsx
"use client";

import React from "react";

export default function GoalKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-white px-4 py-3 shadow-[0_6px_18px_rgba(76,29,149,0.25)]">
      <div className="text-[12px] opacity-90">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      {hint ? <div className="text-[11px] opacity-80 mt-1">{hint}</div> : null}
    </div>
  );
}
