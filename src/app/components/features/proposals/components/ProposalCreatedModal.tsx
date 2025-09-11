// src/app/components/features/proposals/components/ProposalCreatedModal.tsx
"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import { copyToClipboard } from "../lib/clipboard";
import { toast } from "@/app/components/ui/toast";

type Props = {
  open: boolean;
  url: string;
  onClose: () => void;
};

export default function ProposalCreatedModal({ open, url, onClose }: Props) {
  const onCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) toast.success("Enlace copiado con éxito");
    else toast.error("No se pudo copiar el enlace");
  };

  const onView = () => {
    // Abrimos en nueva pestaña, y dejamos al usuario en el generador
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="inverted"
      title="¡Propuesta generada con éxito!"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn-ghost" onClick={onCopy}>
            Copiar enlace
          </button>
          <button className="btn-primary" onClick={onView}>
            Ver propuesta
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        <p className="text-sm opacity-95">
          Tu documento ya está listo. Podés copiar el enlace o abrirlo en una nueva pestaña.
        </p>
        <div className="text-[12px] opacity-80">
          ⚠️ Para abrir con <strong>“Ver propuesta”</strong> asegurate de tener
          habilitadas las ventanas emergentes en tu navegador.
        </div>

        <div className="mt-3 rounded-md border border-white/20 bg-white/5 p-2">
          <div className="text-[12px] opacity-80 mb-1">Enlace del documento</div>
          <div className="text-[13px] break-all opacity-95">{url}</div>
        </div>
      </div>
    </Modal>
  );
}
