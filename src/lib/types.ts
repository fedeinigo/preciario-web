// src/lib/types.ts

// Ítems para UI (catálogo + selección en generador)
export type UIItem = {
  id: string;           // id local (para selección en UI)
  dbId?: string;        // id real en DB del catálogo
  sku: string;
  category: string;
  name: string;
  description: string;
  devHours: number;
  unitPrice: number;
  selected: boolean;
  quantity: number;
};

// Payload para guardar propuestas
export type SaveProposalInput = {
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  totalAmount: number;
  totalHours: number;
  oneShot: number;
  docUrl: string;
  docId?: string | null;

  // 👇 necesarios para filtrar por equipo (History/Stats)
  userId: string;
  userEmail: string;

  items: Array<{
    itemId: string;     // id del ítem de catálogo
    quantity: number;
    unitPrice: number;
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

  // Para Stats (opcional si la API lo trae expandido)
  items?: Array<{ sku: string; name: string; quantity: number }>;
};
