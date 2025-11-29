"use client";

import * as React from "react";

export interface MapacheTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const MapacheTextarea = React.forwardRef<HTMLTextAreaElement, MapacheTextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium uppercase tracking-wider text-cyan-300/80"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            "rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white",
            "placeholder:text-white/40",
            "focus:border-[rgb(var(--brand-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--brand-primary))]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            "resize-none",
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

MapacheTextarea.displayName = "MapacheTextarea";

export default MapacheTextarea;
