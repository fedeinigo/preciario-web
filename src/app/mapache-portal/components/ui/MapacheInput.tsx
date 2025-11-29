"use client";

import * as React from "react";

export interface MapacheInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const MapacheInput = React.forwardRef<HTMLInputElement, MapacheInputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-cyan-300/80"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white",
            "placeholder:text-white/40",
            "focus:border-[rgb(var(--brand-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--brand-primary))]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            error ? "border-rose-500/50" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-400">{error}</span>
        )}
      </div>
    );
  }
);

MapacheInput.displayName = "MapacheInput";

export default MapacheInput;
