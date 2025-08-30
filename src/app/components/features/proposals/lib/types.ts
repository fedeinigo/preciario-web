export type Role = "admin" | "comercial";

export interface Item {
  id: number;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
  selected: boolean;
}

export interface StoredItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
}

export interface ProposalRecord {
  id: string;              // PPT-#########
  userId: string;
  userEmail: string;
  createdAt: string;       // ISO
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  items: StoredItem[];
  totalAmount: number;
  totalHours: number;
  oneShot: number;
}

export interface UserEntry {
  email: string;
  userId: string;
}
