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
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "rgb(var(--text-label))" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "rounded-md border px-3 py-2 text-sm",
            "placeholder:opacity-40",
            "focus:outline-none focus:ring-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
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

MapacheInput.displayName = "MapacheInput";

export default MapacheInput;
