"use client";

import * as React from "react";

export interface MapacheSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const MapacheSelect = React.forwardRef<HTMLSelectElement, MapacheSelectProps>(
  ({ className = "", label, error, id, children, ...props }, ref) => {
    const selectId = id || React.useId();
    
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium uppercase tracking-wider text-cyan-300/80"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            "rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white",
            "focus:border-[rgb(var(--brand-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--brand-primary))]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            error ? "border-rose-500/50" : "",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </select>
        {error && (
          <span className="text-xs text-rose-400">{error}</span>
        )}
      </div>
    );
  }
);

MapacheSelect.displayName = "MapacheSelect";

export default MapacheSelect;
