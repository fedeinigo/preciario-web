"use client";

import React from "react";
import { createPortal } from "react-dom";

type PanelStyle = React.CSSProperties;

export type ModalPortal = "directo" | "mapache" | "marketing" | "partner";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  panelWidthClassName?: string;
  titleClassName?: string;
  panelStyle?: PanelStyle;
  backdropClassName?: string;
  variant?: "default" | "inverted";
  disableCloseOnBackdrop?: boolean;
  panelDataAttributes?: Record<string, string>;
  portal?: ModalPortal;
};

export default function Modal({
  open,
  onClose,
  title,
  footer,
  children,
  containerClassName = "",
  panelClassName = "",
  headerClassName = "",
  panelWidthClassName = "max-w-2xl",
  titleClassName = "",
  panelStyle,
  backdropClassName = "",
  variant = "default",
  disableCloseOnBackdrop = false,
  panelDataAttributes,
  portal,
}: Props) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  const detectedPortal = React.useMemo<ModalPortal>(() => {
    if (portal) return portal;
    if (typeof document === "undefined") return "directo";
    const html = document.documentElement;
    if (html.classList.contains("mapache-theme") || html.getAttribute("data-portal") === "mapache") {
      return "mapache";
    }
    if (html.classList.contains("marketing-theme") || html.getAttribute("data-portal") === "marketing") {
      return "marketing";
    }
    if (html.getAttribute("data-portal") === "partner") {
      return "partner";
    }
    return "directo";
  }, [portal]);

  const isDarkPortal = detectedPortal === "mapache";
  const _isInverted = variant === "inverted" || isDarkPortal;

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

  const content = (
    <div
      className={[
        "fixed inset-0 z-[9999] flex items-start md:items-center justify-center overflow-y-auto p-4 backdrop-blur-md modal-backdrop",
        backdropClassName,
        containerClassName,
      ].join(" ")}
      style={{ backgroundColor: "var(--modal-backdrop)" }}
      onClick={!disableCloseOnBackdrop ? onClose : undefined}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        data-portal-modal={detectedPortal}
        className={[
          "w-full max-h-[calc(100vh-2rem)] rounded-xl overflow-hidden flex flex-col min-h-0 modal-panel",
          panelWidthClassName,
          panelClassName,
        ].join(" ")}
        style={{
          background: "var(--modal-surface)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--modal-border)",
          boxShadow: "var(--shadow-modal)",
          color: "var(--modal-text)",
          ...panelStyle,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        {...(panelDataAttributes ? Object.fromEntries(
          Object.entries(panelDataAttributes).map(([k, v]) => [`data-${k}`, v])
        ) : {})}
      >
        {title !== undefined && (
          <div
            className={[
              "px-4 py-3 text-sm font-semibold modal-header",
              headerClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              background: "var(--modal-header-bg)",
              borderBottom: `1px solid var(--modal-border)`,
            }}
            id={titleId}
          >
            <div className="flex items-start justify-between gap-3">
              <div 
                className={["flex-1 min-w-0 text-left", titleClassName].join(" ")}
                style={{ color: "var(--modal-text)" }}
              >
                {title}
              </div>
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
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-lg leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 modal-close-btn"
                  style={{ color: "var(--modal-close-color)" }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div 
          className="flex-1 overflow-y-auto px-4 py-4 modal-content"
          style={{ color: "var(--modal-text)" }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="px-4 py-3 modal-footer"
            style={{
              background: isDarkPortal ? "rgba(255, 255, 255, 0.05)" : "var(--modal-header-bg)",
              borderTop: `1px solid var(--modal-border)`,
            }}
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
