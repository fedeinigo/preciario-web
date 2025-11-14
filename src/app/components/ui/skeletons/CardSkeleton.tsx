// src/app/components/ui/skeletons/CardSkeleton.tsx
"use client";

export default function CardSkeleton() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-pulse">
      <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
            <div className="h-6 w-40 bg-slate-300 rounded"></div>
          </div>
          <div className="h-10 w-24 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
        </div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
      </div>
    </div>
  );
}
