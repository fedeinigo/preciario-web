import { useCallback, useState } from "react";

import { priceWhatsApp } from "../lib/pricingClient";
import type { ProposalErrorCode } from "../lib/errors";
import type { WppForm, WppKind } from "../components/WhatsAppModal";

export type WhatsAppSubmitResult = {
  itemId: string;
  pricing: Awaited<ReturnType<typeof priceWhatsApp>>;
};

export type UseWhatsAppModalOptions = {
  resolveErrorMessage: (error: unknown, fallback: ProposalErrorCode) => string;
};

export function useWhatsAppModal({
  resolveErrorMessage,
}: UseWhatsAppModalOptions) {
  const [open, setOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [kind, setKind] = useState<WppKind>("marketing");
  const [form, setForm] = useState<WppForm>({ qty: 0, destCountry: "" });
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  const start = useCallback((itemId: string, nextKind: WppKind, defaultCountry: string) => {
    setPendingItemId(itemId);
    setKind(nextKind);
    setForm({ qty: 0, destCountry: defaultCountry });
    setError("");
    setOpen(true);
  }, []);

  const updateForm = useCallback((update: Partial<WppForm>) => {
    setForm((prev) => ({ ...prev, ...update }));
  }, []);

  const close = useCallback(() => {
    if (applying) return;
    setOpen(false);
    setPendingItemId(null);
    setError("");
  }, [applying]);

  const submit = useCallback(
    async ({ subsidiary, country }: { subsidiary: string; country: string }): Promise<WhatsAppSubmitResult | null> => {
      if (!pendingItemId) return null;
      try {
        setApplying(true);
        setError("");
        const pricing = await priceWhatsApp({
          subsidiary,
          destCountry: form.destCountry || country,
          kind,
          qty: Number(form.qty) || 0,
        });
        const itemId = pendingItemId;
        setOpen(false);
        setPendingItemId(null);
        return { itemId, pricing };
      } catch (err) {
        const message = resolveErrorMessage(err, "pricing.whatsAppFailed");
        setError(message);
        throw message;
      } finally {
        setApplying(false);
      }
    },
    [form.destCountry, form.qty, kind, pendingItemId, resolveErrorMessage]
  );

  return {
    state: {
      open,
      kind,
      form,
      error,
      applying,
    },
    start,
    updateForm,
    close,
    submit,
  };
}

export type UseWhatsAppModal = ReturnType<typeof useWhatsAppModal>;
