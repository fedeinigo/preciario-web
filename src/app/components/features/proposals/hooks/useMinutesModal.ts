import { useCallback, useState } from "react";

import { priceMinutes } from "../lib/pricingClient";
import type { ProposalErrorCode } from "../lib/errors";
import type { MinForm, MinutesKind } from "../components/MinutesModal";

export type MinutesSubmitResult = {
  itemId: string;
  pricing: Awaited<ReturnType<typeof priceMinutes>>;
};

export type UseMinutesModalOptions = {
  resolveErrorMessage: (error: unknown, fallback: ProposalErrorCode) => string;
};

export function useMinutesModal({ resolveErrorMessage }: UseMinutesModalOptions) {
  const [open, setOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [kind, setKind] = useState<MinutesKind>("out");
  const [form, setForm] = useState<MinForm>({ qty: 0, destCountry: "" });
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  const start = useCallback((itemId: string, nextKind: MinutesKind, defaultCountry: string) => {
    setPendingItemId(itemId);
    setKind(nextKind);
    setForm({ qty: 0, destCountry: defaultCountry });
    setError("");
    setOpen(true);
  }, []);

  const updateForm = useCallback((update: Partial<MinForm>) => {
    setForm((prev) => ({ ...prev, ...update }));
  }, []);

  const close = useCallback(() => {
    if (applying) return;
    setOpen(false);
    setPendingItemId(null);
    setError("");
  }, [applying]);

  const submit = useCallback(
    async ({ subsidiary, country }: { subsidiary: string; country: string }): Promise<MinutesSubmitResult | null> => {
      if (!pendingItemId) return null;
      try {
        setApplying(true);
        setError("");
        const pricing = await priceMinutes({
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
        const message = resolveErrorMessage(err, "pricing.minutesFailed");
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

export type UseMinutesModal = ReturnType<typeof useMinutesModal>;
