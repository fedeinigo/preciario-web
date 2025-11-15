// src/app/components/ui/ConfirmDialog.tsx
"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import { useTranslations } from "@/app/LanguageProvider";

type ConfirmDialogProps = {
  /** Controla apertura */
  open: boolean;
  /** Título del modal */
  title?: React.ReactNode;
  /** Texto o nodo descriptivo */
  description?: React.ReactNode;
  /** Texto del botón confirmar (default traducido) */
  confirmText?: string;
  /** Texto del botón cancelar (default traducido) */
  cancelText?: string;
  /** Llamado al confirmar. Si hay input, recibe el valor */
  onConfirm: (value?: string) => void | Promise<void>;
  /** Llamado al cerrar/cancelar */
  onCancel: () => void;

  /** Estado de envío/bloqueo (deshabilita controles) */
  loading?: boolean;
  /** Estiliza el botón de confirmar como destructivo */
  destructive?: boolean;

  /** Si se provee, el dialog incluye un input de texto */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  inputRequired?: boolean;
  /** Validación opcional. Debe retornar string con error o null si ok */
  validateInput?: (value: string) => string | null;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
  inputLabel,
  inputPlaceholder,
  inputDefaultValue = "",
  inputRequired = false,
  validateInput,
}: ConfirmDialogProps) {
  const t = useTranslations("common.dialog");
  const [value, setValue] = React.useState(inputDefaultValue);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setValue(inputDefaultValue);
      setError(null);
    }
  }, [open, inputDefaultValue]);

  const handleConfirm = async () => {
    if (inputLabel) {
      const trimmed = (value ?? "").trim();
      if (inputRequired && !trimmed) {
        setError(t("required"));
        return;
      }
      if (validateInput) {
        const e = validateInput(trimmed);
        if (e) {
          setError(e);
          return;
        }
      }
      await onConfirm(trimmed);
    } else {
      await onConfirm();
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onCancel}
      title={title ?? t("title")}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelText ?? t("cancel")}
          </button>
          <button
            className={
              destructive
                ? "rounded-md bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                : "btn-primary"
            }
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t("processing") : (confirmText ?? t("confirm"))}
          </button>
        </div>
      }
    >
      {description ? (
        <div className="text-sm text-slate-700 mb-3">{description}</div>
      ) : null}

      {inputLabel ? (
        <div>
          <label className="block text-xs text-slate-600 mb-1">{inputLabel}</label>
          <input
            className={`input w-full ${error ? "border-red-400 ring-1 ring-red-400" : ""}`}
            placeholder={inputPlaceholder}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
          />
          {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </Modal>
  );
}
