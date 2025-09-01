import { getNextSku } from "./ids";
import type { Item } from "./types";

export type Seed = {
  category: string;
  name: string;
  description?: string;
  devHours?: number;
  unitPrice?: number;
};

export const SEED_ITEMS: Seed[] = [
  // WhatsApp (3)
  { category: "Power Inbox", name: "Conv. Whatsapp - Utility" },
  { category: "Power Inbox", name: "Conv. Whatsapp - Marketing" },
  { category: "Power Inbox", name: "Conv. Whatsapp - Authentication" },
  // Telefonía (2)
  { category: "Power Inbox", name: "Minutos de Telefonia - Salientes" },
  { category: "Power Inbox", name: "Minutos de Telefonia - Entrantes" },
  // Resto (se conservan)
  { category: "Power Inbox", name: "Wiser PRO" },
  { category: "Power Inbox", name: "Canal WhatsApp" },
  { category: "Power Inbox", name: "Canal META" },
  { category: "Power Inbox", name: "Canal Email" },
  { category: "Power Inbox", name: "Canal LinkedIn" },
  { category: "Power Inbox", name: "Canal YouTube" },
  { category: "Power Inbox", name: "Canal TikTok" },
  { category: "Power Inbox", name: "Canal X (Twitter)" },
  { category: "Power Inbox", name: "Canal Chat" },
];

export function hydrate(seed: Seed, idx: number): Item {
  return {
    id: Date.now() + idx,
    sku: getNextSku(),
    category: seed.category,
    name: seed.name,
    description: seed.description ?? "",
    quantity: 1,
    unitPrice: seed.unitPrice ?? 100,
    devHours: seed.devHours ?? 1,
    selected: false,
  };
}
