// src/app/components/features/proposals/lib/items.ts
import type { Item } from "./types";
import { getNextSku } from "./ids";

/** Semilla mínima para construir un Item real */
export type Seed = {
  category: string;
  name: string;
  description?: string;
  devHours?: number;
  unitPrice?: number;
};

/** ================= ÍTEMS ESPECIALES (NO TOCAR NOMBRES) =================
 * Estos 6 ítems disparan modales o lógica especial (WhatsApp/Minutos/Wiser PRO).
 * Se mantienen exactamente con estos nombres.
 */
const SPECIAL_ITEMS: Seed[] = [
  { category: "Power Inbox", name: "Conv. Whatsapp - Utility" },
  { category: "Power Inbox", name: "Conv. Whatsapp - Marketing" },
  { category: "Power Inbox", name: "Conv. Whatsapp - Authentication" },
  { category: "Power Inbox", name: "Minutos de Telefonia - Salientes" },
  { category: "Power Inbox", name: "Minutos de Telefonia - Entrantes" },
  { category: "Power Inbox", name: "Wiser PRO" },
];

/** ================= ÍTEMS NORMALES (TU LISTADO COMPLETO) =================
 * Funcionan como ítems estándar (checkbox + cantidad + precio editable).
 * Si deseas poner precios/horas por defecto, agrega unitPrice/devHours en cada Seed.
 */
const LEGACY_ITEMS: Seed[] = [
  // ---- Power Inbox ----
  { category: "Power Inbox", name: "Canal WhatsApp" },
  { category: "Power Inbox", name: "Canal META" },
  { category: "Power Inbox", name: "Canal Email" },
  { category: "Power Inbox", name: "Canal LinkedIn" },
  { category: "Power Inbox", name: "Canal YouTube" },
  { category: "Power Inbox", name: "Canal TikTok" },
  { category: "Power Inbox", name: "Canal X (Twitter)" },
  { category: "Power Inbox", name: "Canal Chat" },
  { category: "Power Inbox", name: "Canal Formulario Web" },
  { category: "Power Inbox", name: "Canal Mercado Libre" },
  { category: "Power Inbox", name: "Canal Google My Business" },
  { category: "Power Inbox", name: "Canal Teléfono / Voz" },
  { category: "Power Inbox", name: "Canal de Llamadas Simultaneas" },
  { category: "Power Inbox", name: "Canal Google Spreadsheets" },
  { category: "Power Inbox", name: "Canal AppStore" },
  { category: "Power Inbox", name: "Canal Google Playstore" },
  { category: "Power Inbox", name: "Número Full Cloud" },

  { category: "Power Inbox", name: "Minutos SipTrunk - 1.000 minutos" },

  { category: "Power Inbox", name: "Smart IVR" },
  { category: "Power Inbox", name: "Licencias - 1 a 30" },
  { category: "Power Inbox", name: "Licencias - 30 a 100" },
  { category: "Power Inbox", name: "Integracion Shopify" },
  { category: "Power Inbox", name: "Integracion Vtex" },
  { category: "Power Inbox", name: "Integracion Woocommerce" },
  { category: "Power Inbox", name: "Integracion Prestashop" },
  { category: "Power Inbox", name: "Integracion Magento" },
  { category: "Power Inbox", name: "Integracion Fenicio" },
  { category: "Power Inbox", name: "Integracion TiendaNube" },
  { category: "Power Inbox", name: "Integracion Jira Service Desk" },
  { category: "Power Inbox", name: "Integracion Woowup" },
  { category: "Power Inbox", name: "Integracion Azure Active Directory" },
  { category: "Power Inbox", name: "Usuario API" },
  { category: "Power Inbox", name: "WebHooks" },
  { category: "Power Inbox", name: "Módulo Nitro" },
  { category: "Power Inbox", name: "Módulo Encuestas" },
  { category: "Power Inbox", name: "Power Inbox AI" },
  { category: "Power Inbox", name: "Geolocalización" },

  // ---- Bot ----
  { category: "Bot", name: "BOT Encuestador" },
  { category: "Bot", name: "BOT Encuestador Prodigy" },
  { category: "Bot", name: "BOT QuickBot" },

  { category: "Bot", name: "Wiser PLUS" },

  // ---- Integracion ----
  { category: "Integracion", name: "Cart Recovery" },
  { category: "Integracion", name: "Sales Recovery" },

  // ---- Social Listening ----
  { category: "Social Listening", name: "Social Listening Advanced" },
  { category: "Social Listening", name: "Social Listening Lite" },
  { category: "Social Listening", name: "5 Cuentas RRSS Extras" },
  { category: "Social Listening", name: "Licencia Extra" },
  { category: "Social Listening", name: "Listening Extra - 50.000 Tweets" },
  { category: "Social Listening", name: "5 Alertas Extra" },
  { category: "Social Listening", name: "Clipping" },

  // ---- Logios ----
  { category: "Logios", name: "Speech Analytics" },

  // ---- API ----
  { category: "API", name: "API Wise CX" },
];

/** ================= Helpers ================= */
function hydrate(seed: Seed, idx: number): Item {
  return {
    id: Date.now() + idx,
    sku: getNextSku(),
    category: seed.category,
    name: seed.name,
    description: seed.description ?? "",
    quantity: 1,
    unitPrice: seed.unitPrice ?? 100, // puedes ajustar default si lo deseas
    devHours: seed.devHours ?? 1,     // puedes ajustar default si lo deseas
    selected: false,
  };
}

/** ================= API pública ================= */
export function getInitialItems(): Item[] {
  // Orden: primero especiales (para que queden arriba si no hay filtro), luego catálogo.
  const seeds: Seed[] = [...SPECIAL_ITEMS, ...LEGACY_ITEMS];
  return seeds.map(hydrate);
}
