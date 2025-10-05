// src/app/components/ui/Modal.tsx
"use client";

import React from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Estilos extra para el panel */
  panelClassName?: string;
  /** Estilos extra para el backdrop */
  backdropClassName?: string;
  /** Variante del panel */
  variant?: "default" | "inverted"; // inverted = morado con texto blanco
  /** Evita cerrar al clickear fuera */
  disableCloseOnBackdrop?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  footer,
  children,
  panelClassName = "",
  backdropClassName = "",
  variant = "default",
  disableCloseOnBackdrop = false,
}: Props) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(selectors));
    const closeButton = closeButtonRef.current;
    const initialTarget =
      closeButton && !disableCloseOnBackdrop ? closeButton : focusable[0] ?? panel;
    initialTarget.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disableCloseOnBackdrop) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? focusable.indexOf(active) : -1;
      let nextIndex = currentIndex;

      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
      }

      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    panel.addEventListener("keydown", handleKeyDown);
    return () => panel.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, disableCloseOnBackdrop]);

  if (!open) return null;

  const isInverted = variant === "inverted";

  const content = (
    <div
      className={`fixed inset-0 z-[9999] flex items-start md:items-center justify-center overflow-y-auto p-4
                  bg-black/50 backdrop-blur-md ${backdropClassName}`}
      onClick={!disableCloseOnBackdrop ? onClose : undefined}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        className={[
          "w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-xl shadow-2xl overflow-hidden border flex flex-col min-h-0",
          isInverted
            ? "bg-[rgb(var(--primary))] text-white border-white/10"
            : "bg-white text-gray-900 border-gray-200",
          panelClassName,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {title !== undefined && (
          <div
            className={[
              "px-4 py-3 text-sm font-semibold",
              isInverted
                ? "border-b border-white/10"
                : "bg-gray-50 border-b border-gray-200",
            ].join(" ")}
            id={titleId}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 text-left">{title}</div>
              {typeof onClose === "function" && (
                <button
                  type="button"
                  aria-label="Cerrar modal"
                  onClick={() => {
                    if (!disableCloseOnBackdrop) {
                      onClose();
                    }
                  }}
                  disabled={disableCloseOnBackdrop}
                  ref={closeButtonRef}
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-lg leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    isInverted
                      ? "text-white hover:bg-white/10 focus-visible:outline-white/40 disabled:text-white/60 disabled:hover:bg-transparent"
                      : "text-gray-500 hover:bg-gray-100 focus-visible:outline-gray-300 disabled:text-gray-300 disabled:hover:bg-transparent",
                  ].join(" ")}
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div
            className={[
              "px-4 py-3",
              isInverted
                ? "border-t border-white/10 bg-white/5"
                : "bg-gray-50 border-t border-gray-200",
            ].join(" ")}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
