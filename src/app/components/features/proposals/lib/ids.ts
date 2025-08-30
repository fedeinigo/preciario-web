import type { Item } from "./types";

const LS_SKU_COUNTER = "wcx_sku_counter_v1";
const LS_PPT_COUNTER = "wcx_ppt_counter_v1";

function readCounter(key: string, fallback = 1): number {
  try {
    const raw = localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch { return fallback; }
}
function writeCounter(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch {}
}
const pad = (num: number, size: number) => String(num).padStart(size, "0");

export function getNextSku(): string {
  const current = readCounter(LS_SKU_COUNTER, 1);
  const sku = `SKU-${pad(current, 3)}`;
  writeCounter(LS_SKU_COUNTER, current + 1);
  return sku;
}

export function getNextProposalId(): string {
  const current = readCounter(LS_PPT_COUNTER, 1);
  const id = `PPT-${pad(current, 9)}`;
  writeCounter(LS_PPT_COUNTER, current + 1);
  return id;
}

export function initSkuCounterIfNeeded(items: Item[]) {
  const current = readCounter(LS_SKU_COUNTER, 0);
  if (current > 0) return;
  const max = items.reduce((acc, it) => {
    const m = it.sku.match(/^SKU-(\d{3,})$/);
    return Math.max(acc, m ? Number(m[1]) : 0);
  }, 0);
  writeCounter(LS_SKU_COUNTER, max + 1);
}
