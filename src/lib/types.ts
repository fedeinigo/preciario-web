// src/lib/types.ts

// Ítems para UI (catálogo + selección en generador)
export type UIItem = {
  id: string;            // id local (para selección en UI)
  dbId?: string;         // id real en DB del catálogo
  sku: string;
  category: string;
  name: string;
  description: string;
  devHours: number;      // se mantiene para cálculo de oneShot, pero NO se muestra en tabla
  unitPrice: number;     // unitario base (sin descuento)
  selected: boolean;
  quantity: number;
  discountPct?: number;  // 0..100
};

// Payload para guardar propuestas (unitPrice NETO por ítem)
export type SaveProposalInput = {
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  totalAmount: number;   // mensual NETO
  totalHours: number;
  oneShot: number;
  docUrl: string;
  docId?: string | null;

  userId: string;
  userEmail: string;

  // NUEVO (opcionales para no romper backend actual)
  pipedriveLink?: string;
  pipedriveDealId?: string;

  items: Array<{
    itemId: string;      // id del ítem de catálogo
    quantity: number;
    unitPrice: number;   // NETO
    devHours: number;
  }>;
};

// Registro que devuelve la API
export type ProposalRecord = {
  id: string;
  seq: number;
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  totalAmount: number;
  totalHours: number;
  oneShot: number;
  docUrl: string | null;
  docId?: string | null;
  userId: string;
  userEmail: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  status?: "OPEN" | "WON" | "LOST";
  wonAt?: string | Date | null;

  // NUEVO (pueden venir null si todavía no sincronizaste)
  pipedriveLink?: string | null;
  pipedriveDealId?: string | null;
  pipedriveSyncedAt?: string | Date | null;
  pipedriveSyncStatus?: "OK" | "ERROR" | null;
  pipedriveSyncNote?: string | null;

  items?: Array<{ sku: string; name: string; quantity: number }>;
};
