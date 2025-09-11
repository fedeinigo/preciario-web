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
  if (!open) return null;

  const isInverted = variant === "inverted";

  const content = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4
                  bg-black/50 backdrop-blur-md ${backdropClassName}`}
      onClick={!disableCloseOnBackdrop ? onClose : undefined}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={[
          "w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border",
          isInverted
            ? "bg-[rgb(var(--primary))] text-white border-white/10"
            : "bg-white text-gray-900 border-gray-200",
          panelClassName,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div
            className={[
              "px-4 py-3 text-sm font-semibold",
              isInverted
                ? "border-b border-white/10"
                : "bg-gray-50 border-b border-gray-200",
            ].join(" ")}
          >
            {title}
          </div>
        )}

        <div className="p-4">{children}</div>

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

  // Portal al body para que no quede dentro del navbar ni afecte el layout
  if (typeof window !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
