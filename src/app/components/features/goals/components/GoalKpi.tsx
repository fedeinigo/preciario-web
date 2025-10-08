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
    <div className="rounded-2xl border border-[#efe7ff] bg-white/80 px-4 py-3 shadow-[0_10px_25px_rgba(124,58,237,0.08)]">
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7c3aed]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[#2f0f5d]">{value}</div>
      {hint ? <div className="mt-2 text-[11px] text-[#6d28d9]">{hint}</div> : null}
    </div>
  );
}
