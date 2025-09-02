export type Role = "admin" | "comercial";

export interface Item {
  id: number;
  sku: string;
  category: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
  selected: boolean;
}

export interface StoredItem {
  sku: string;
  category: string;
  name: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
  meta?: Record<string, string | number | boolean>;
}

export interface ProposalRecord {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  items: StoredItem[];
  totalAmount: number;
  totalHours: number;
  oneShot: number;

  /** URL directa al documento (preferido) */
  docUrl?: string;

  /** Fallback: id de Google Docs si la API lo devuelve */
  docId?: string;
}

export interface UserEntry {
  email: string;
  userId: string;
}
