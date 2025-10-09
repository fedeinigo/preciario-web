// src/app/components/features/goals/components/ManualWonDialog.tsx
"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import { useTranslations } from "@/app/LanguageProvider";

export type ManualWonTarget = {
  userId?: string;
  email?: string | null;
  name?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  target: ManualWonTarget | null;
  onSubmit: (payload: {
    companyName: string;
    monthlyFee: number;
    proposalUrl?: string | null;
    userId?: string;
  }) => Promise<void>;
};

export default function ManualWonDialog({ open, onClose, target, onSubmit }: Props) {
  const t = useTranslations("goals.manualDialog");
  const validationT = useTranslations("goals.validation");

  const [companyName, setCompanyName] = React.useState("");
  const [monthlyFee, setMonthlyFee] = React.useState<string>("0");
  const [proposalUrl, setProposalUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setCompanyName("");
      setMonthlyFee("0");
      setProposalUrl("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    const feeNumber = Number(monthlyFee);
    if (!companyName.trim()) {
      setError(validationT("required"));
      return;
    }
    if (!Number.isFinite(feeNumber) || feeNumber < 0) {
      setError(validationT("nonNegative"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        companyName: companyName.trim(),
        monthlyFee: feeNumber,
        proposalUrl: proposalUrl.trim() ? proposalUrl.trim() : undefined,
        userId: target?.userId,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        className="rounded-full border border-[#d8c7ff] px-4 py-2 text-sm font-semibold text-[#6d28d9] transition hover:bg-[#f4edff]"
        onClick={() => {
          if (!submitting) onClose();
        }}
        disabled={submitting}
      >
        {t("cancel")}
      </button>
      <button
        type="button"
        className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4c1d95] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? t("saving") : t("confirm")}
      </button>
    </div>
  );

  const targetLabel = target?.name || target?.email || null;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={t("title")}
      footer={footer}
      disableCloseOnBackdrop={submitting}
    >
      <div className="flex flex-col gap-4">
        {targetLabel && (
          <div className="rounded-xl bg-[#f5f0ff] px-4 py-3 text-sm text-[#4c1d95]">
            {t("target", { target: targetLabel })}
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#4c1d95]">
          <span>{t("companyLabel")}</span>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-11 rounded-xl border border-[#d8c7ff] px-3 text-sm font-medium text-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
            placeholder={t("companyPlaceholder")}
            disabled={submitting}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#4c1d95]">
          <span>{t("monthlyFeeLabel")}</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            className="h-11 rounded-xl border border-[#d8c7ff] px-3 text-sm font-medium text-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
            placeholder={t("monthlyFeePlaceholder")}
            disabled={submitting}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#4c1d95]">
          <span>{t("proposalUrlLabel")}</span>
          <input
            type="url"
            value={proposalUrl}
            onChange={(e) => setProposalUrl(e.target.value)}
            className="h-11 rounded-xl border border-[#d8c7ff] px-3 text-sm font-medium text-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
            placeholder={t("proposalUrlPlaceholder")}
            disabled={submitting}
          />
        </label>
        {error && <div className="text-sm font-medium text-[#b91c1c]">{error}</div>}
      </div>
    </Modal>
  );
}
