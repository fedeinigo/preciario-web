"use client";

export default function DocumentationLoading() {
  return (
    <div className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
