import PipedriveCard from "./PipedriveCard";
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
    <div className="card border-2">
      <div className="heading-bar mb-3">{heading}</div>

      <PipedriveCard
        value={pipedrive.value}
        dealId={pipedrive.dealId}
        example={pipedrive.example}
        onChange={pipedrive.onChange}
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

      <div className="mt-3 flex justify-end">
        <div className="rounded-sm border-2 bg-white px-5 py-3 shadow-soft text-right">
          <div className="text-sm text-gray-500">{totals.label}</div>
          <div className="text-[22px] font-semibold text-primary">{formattedTotal}</div>
        </div>
      </div>
    </div>
  );
}
