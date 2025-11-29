"use client";

import * as React from "react";

export interface MapacheTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const MapacheTextarea = React.forwardRef<HTMLTextAreaElement, MapacheTextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "rgb(var(--text-label))" }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            "rounded-md border px-3 py-2 text-sm",
            "placeholder:opacity-40",
            "focus:outline-none focus:ring-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            "resize-none",
            className,
          ].join(" ")}
          style={{
            borderColor: error ? "rgb(var(--status-error) / 0.5)" : "var(--mapache-glass-border, rgba(255,255,255,0.2))",
            background: "var(--mapache-glass-bg, rgba(2,6,23,0.6))",
            color: "rgb(var(--text-primary))",
            ...(props.style || {}),
          }}
          {...props}
        />
        {error && (
          <span className="text-xs" style={{ color: "rgb(var(--status-error))" }}>{error}</span>
        )}
      </div>
    );
  }
);

MapacheTextarea.displayName = "MapacheTextarea";

export default MapacheTextarea;
