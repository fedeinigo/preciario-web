import { useMemo } from "react";
import type { Item } from "../lib/types";

export function useProposalTotals(items: Item[]) {
  return useMemo(() => {
    const selectedItems = items.filter((i) => i.selected);
    const totalAmount = selectedItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const totalHours = selectedItems.reduce((s, it) => s + it.devHours * it.quantity, 0);
    return { selectedItems, totalAmount, totalHours };
  }, [items]);
}
