"use client";

import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-0 flex items-start justify-center p-4 md:p-6"
      >
        <div className="w-full max-w-3xl mt-10 rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-xl md:text-2xl font-semibold">{title ?? "Resumen"}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-auto">{children}</div>

          {/* Footer */}
          {footer && <div className="px-6 py-4 border-t bg-gray-50">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
