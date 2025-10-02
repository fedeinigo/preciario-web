import { useCallback, useState } from "react";

export function useWiserModal() {
  const [open, setOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const start = useCallback((itemId: string) => {
    setPendingItemId(itemId);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPendingItemId(null);
  }, []);

  const confirm = useCallback((): string | null => {
    const itemId = pendingItemId;
    setOpen(false);
    setPendingItemId(null);
    return itemId;
  }, [pendingItemId]);

  return {
    state: {
      open,
    },
    start,
    close,
    confirm,
  };
}

export type UseWiserModal = ReturnType<typeof useWiserModal>;
