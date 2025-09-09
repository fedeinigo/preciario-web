// src/app/components/features/proposals/hooks/useProposalTotals.ts
import { useMemo } from "react";
import type { UIItem } from "../lib/types";

/**
 * Calcula los totales de la propuesta a partir de los ítems seleccionados.
 */
export function useProposalTotals(items: UIItem[]) {
  return useMemo(() => {
    const selectedItems = items.filter((i) => i.selected && i.quantity > 0);

    const totalAmount = selectedItems.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
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
