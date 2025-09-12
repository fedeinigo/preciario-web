// src/app/components/features/proposals/hooks/useProposalTotals.ts
import { useMemo } from "react";
import type { UIItem } from "../lib/types";

export function useProposalTotals(items: UIItem[]) {
  return useMemo(() => {
    const selected = items.filter((i) => i.selected && i.quantity > 0);

    // enriquecer con unitNet
    const selectedItems = selected.map((it) => {
      const pct = Math.max(0, Math.min(100, Number(it.discountPct ?? 0)));
      const unitNet = Math.max(0, it.unitPrice * (1 - pct / 100));
      return {
        id: it.id,
        dbId: it.dbId,
        sku: it.sku,
        name: it.name,
        category: it.category,
        description: it.description,
        devHours: it.devHours,
        unitPrice: it.unitPrice,
        discountPct: pct,
        unitNet,
        quantity: it.quantity,
      };
    });

    const totalAmount = selectedItems.reduce(
      (sum, it) => sum + it.unitNet * it.quantity,
      0
    );

    const totalHours = selectedItems.reduce(
      (sum, it) => sum + it.devHours * it.quantity,
      0
    );

    return { selectedItems, totalAmount, totalHours };
  }, [items]);
}

export default useProposalTotals;
