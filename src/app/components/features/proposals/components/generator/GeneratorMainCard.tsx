import PipedriveCard, { type PipedriveSyncMode } from "./PipedriveCard";
import CompanyCard from "./CompanyCard";
import CatalogToolbar from "./CatalogToolbar";

import ItemsTable from "../ItemsTable";
import { formatUSD } from "../../lib/format";
import type { UIItem } from "../../lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { CountryOption } from "../../lib/catalogs";

export type TranslateFn = (
  key: string,
  replacements?: Record<string, string | number>
) => string;

export interface GeneratorMainCardProps {
  heading: string;
  pipedrive: {
    value: string;
    dealId: string;
    example: string;
    onChange: (value: string) => void;
    mode: PipedriveSyncMode;
    onModeChange: (mode: PipedriveSyncMode) => void;
    t: TranslateFn;
  };
  company: {
    companyName: string;
    onCompanyNameChange: (value: string) => void;
    country: string;
    onCountryChange: (value: string) => void;
    subsidiary: string;
    emptyValue: string;
    countryOptions: CountryOption[];
    t: TranslateFn;
  };
  toolbar: {
    isAdmin: boolean;
    categoryFilter: string;
    onCategoryChange: (value: string) => void;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    sortKey: string;
    onSortChange: (value: string) => void;
    onAddItem: () => void;
    onGenerate: () => void;
    onReset: () => void;
    disabled?: boolean;
    actionsT: TranslateFn;
    filtersT: TranslateFn;
    orderT: TranslateFn;
    availableCategories: string[];
    resetTitle: string;
  };
  itemsTable: {
    items: UIItem[];
    isAdmin: boolean;
    showSku: boolean;
    onToggle: (item: UIItem, checked: boolean) => void;
    onChangeQty: (itemId: string, qty: number) => void;
    onChangeDiscountPct: (itemId: string, pct: number) => void;
    onEdit: (item: UIItem) => void;
    onDelete: (itemId: string) => void;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    locale: Locale;
  };
  totals: {
    label: string;
    amount: number;
  };
}

export default function GeneratorMainCard({
  heading,
  pipedrive,
  company,
  toolbar,
  itemsTable,
  totals,
}: GeneratorMainCardProps) {
  const formattedTotal = formatUSD(totals.amount);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-purple-100 bg-white">
        <h1 className="text-xl font-bold text-[#4c1d95]">{heading}</h1>
      </div>

      <div className="p-6 space-y-6">
        <PipedriveCard
          value={pipedrive.value}
          dealId={pipedrive.dealId}
          example={pipedrive.example}
          mode={pipedrive.mode}
          onChange={pipedrive.onChange}
          onModeChange={pipedrive.onModeChange}
          t={pipedrive.t}
        />

        <CompanyCard
          companyName={company.companyName}
          onCompanyNameChange={company.onCompanyNameChange}
          country={company.country}
          onCountryChange={company.onCountryChange}
          subsidiary={company.subsidiary}
          emptyValue={company.emptyValue}
          countryOptions={company.countryOptions}
          t={company.t}
        />

        <CatalogToolbar
          isAdmin={toolbar.isAdmin}
          categoryFilter={toolbar.categoryFilter}
          onCategoryChange={toolbar.onCategoryChange}
          searchTerm={toolbar.searchTerm}
          onSearchTermChange={toolbar.onSearchTermChange}
          sortKey={toolbar.sortKey}
          onSortChange={toolbar.onSortChange}
          onAddItem={toolbar.onAddItem}
          onGenerate={toolbar.onGenerate}
          onReset={toolbar.onReset}
          disabled={toolbar.disabled}
          actionsT={toolbar.actionsT}
          filtersT={toolbar.filtersT}
          orderT={toolbar.orderT}
          availableCategories={toolbar.availableCategories}
          resetTitle={toolbar.resetTitle}
        />

        <ItemsTable
          items={itemsTable.items}
          isAdmin={itemsTable.isAdmin}
          showSku={itemsTable.showSku}
          onToggle={itemsTable.onToggle}
          onChangeQty={itemsTable.onChangeQty}
          onChangeDiscountPct={itemsTable.onChangeDiscountPct}
          onEdit={itemsTable.onEdit}
          onDelete={itemsTable.onDelete}
          page={itemsTable.page}
          pageSize={itemsTable.pageSize}
          onPageChange={itemsTable.onPageChange}
          onPageSizeChange={itemsTable.onPageSizeChange}
          locale={itemsTable.locale}
        />

        <div className="flex justify-end">
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white px-6 py-4 shadow-md">
            <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">{totals.label}</div>
            <div className="mt-1 text-2xl font-bold text-purple-700">{formattedTotal}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
