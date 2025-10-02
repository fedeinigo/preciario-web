import type { Locale } from "@/lib/i18n/config";

// UI items for catalog + generator selection
export type UIItem = {
  id: string;
  dbId?: string;
  sku: string;
  category: string;
  name: string;
  description: string;
  devHours: number;      // kept for oneshot calculations, hidden in table
  unitPrice: number;     // base unit price (without discount)
  selected: boolean;
  quantity: number;
  discountPct?: number;  // 0..100
  translations: Record<Locale, {
    name: string;
    description: string;
    category: string;
  }>;
};

// Payload for saving proposals (unitPrice NET per item)
export type SaveProposalInput = {
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  totalAmount: number;   // monthly NET
  totalHours: number;
  oneShot: number;
  docUrl: string;
  docId?: string | null;

  userId: string;
  userEmail: string;

  // Optional fields for backward compatibility
  pipedriveLink?: string;
  pipedriveDealId?: string;

  items: Array<{
    itemId: string;      // catalog item id
    quantity: number;
    unitPrice: number;   // NET
    devHours: number;
  }>;
};

// Proposal record returned by the API
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

  // Optional if not yet synced
  pipedriveLink?: string | null;
  pipedriveDealId?: string | null;
  pipedriveSyncedAt?: string | Date | null;
  pipedriveSyncStatus?: "OK" | "ERROR" | null;
  pipedriveSyncNote?: string | null;

  items?: Array<{ sku: string; name: string; quantity: number }>;
};
