"use client";

import * as React from "react";

export type MapacheButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "danger";
export type MapacheButtonSize = "sm" | "md" | "lg";

export interface MapacheButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MapacheButtonVariant;
  size?: MapacheButtonSize;
  loading?: boolean;
}

const variantBaseClass = "inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

const getVariantStyles = (variant: MapacheButtonVariant): React.CSSProperties => {
  switch (variant) {
    case "primary":
      return {
        background: "rgb(var(--text-primary))",
        color: "rgb(var(--brand-primary))",
        fontWeight: 500,
        boxShadow: "0 2px 8px rgba(255,255,255,0.15)",
      };
    case "secondary":
      return {
        background: "transparent",
        border: "1px solid var(--mapache-glass-border, rgba(255,255,255,0.3))",
        color: "rgb(var(--text-secondary))",
      };
    case "ghost":
      return {
        background: "transparent",
        color: "rgb(var(--text-muted))",
      };
    case "accent":
      return {
        background: `linear-gradient(to right, rgb(var(--brand-accent)), rgb(var(--brand-primary)))`,
        color: "rgb(var(--text-primary))",
        fontWeight: 500,
        boxShadow: "0 4px 16px rgba(34,211,238,0.3)",
      };
    case "danger":
      return {
        background: "rgb(var(--status-error) / 0.2)",
        border: "1px solid rgb(var(--status-error) / 0.4)",
        color: "rgb(var(--status-error))",
      };
    default:
      return {};
  }
};

const sizeStyles: Record<MapacheButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-6 py-3 text-base rounded-lg",
};

const MapacheButton = React.forwardRef<HTMLButtonElement, MapacheButtonProps>(
  (
    {
      className = "",
      variant = "secondary",
      size = "md",
      loading = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          variantBaseClass,
          sizeStyles[size],
          className,
        ].join(" ")}
        style={{
          ...getVariantStyles(variant),
          ...style,
        }}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

MapacheButton.displayName = "MapacheButton";

export default MapacheButton;
