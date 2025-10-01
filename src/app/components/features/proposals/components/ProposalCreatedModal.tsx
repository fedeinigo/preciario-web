// src/app/components/features/proposals/components/ProposalCreatedModal.tsx
"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import { copyToClipboard } from "../lib/clipboard";
import { toast } from "@/app/components/ui/toast";

import { useTranslations } from "@/app/LanguageProvider";

type Props = {
  open: boolean;
  url: string;
  onClose: () => void;
};

export default function ProposalCreatedModal({ open, url, onClose }: Props) {
  const t = useTranslations("proposals.createdModal");
  const toastT = useTranslations("proposals.createdModal.toast");

  const onCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) toast.success(toastT("copied"));
    else toast.error(toastT("copyError"));
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
      title={t("title")}
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button className="btn-ghost" onClick={onClose}>
            {t("actions.close")}
          </button>
          <button className="btn-ghost" onClick={onCopy}>
            {t("actions.copy")}
          </button>
          <button className="btn-primary" onClick={onView}>
            {t("actions.view")}
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        <p className="text-sm opacity-95">{t("body.ready")}</p>
        <div className="text-[12px] opacity-80">{t("body.popups")}</div>

        <div className="mt-3 rounded-md border border-white/20 bg-white/5 p-2">
          <div className="text-[12px] opacity-80 mb-1">{t("body.linkLabel")}</div>
          <div className="text-[13px] break-all opacity-95">{url}</div>
        </div>
      </div>
    </Modal>
  );
}
