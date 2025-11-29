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

const variantStyles: Record<MapacheButtonVariant, string> = {
  primary: [
    "bg-white text-[rgb(var(--brand-primary))] font-medium",
    "shadow-[0_2px_8px_rgba(255,255,255,0.15)]",
    "hover:bg-white/90",
    "focus-visible:ring-white/60",
  ].join(" "),
  secondary: [
    "border border-white/30 text-white/80 bg-transparent",
    "hover:bg-white/10",
    "focus-visible:ring-white/40",
  ].join(" "),
  ghost: [
    "text-white/70 bg-transparent",
    "hover:bg-white/10 hover:text-white",
    "focus-visible:ring-white/40",
  ].join(" "),
  accent: [
    "bg-gradient-to-r from-cyan-400 to-violet-500 text-white font-medium",
    "shadow-[0_4px_16px_rgba(34,211,238,0.3)]",
    "hover:shadow-[0_6px_20px_rgba(34,211,238,0.4)]",
    "focus-visible:ring-cyan-400/60",
  ].join(" "),
  danger: [
    "bg-rose-500/20 border border-rose-500/40 text-rose-100",
    "hover:bg-rose-500/30",
    "focus-visible:ring-rose-500/40",
  ].join(" "),
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
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center gap-2",
          "transition-all duration-150",
          "focus:outline-none focus-visible:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(" ")}
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
