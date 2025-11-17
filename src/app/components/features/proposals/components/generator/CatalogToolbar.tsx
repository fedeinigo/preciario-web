"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import CatalogFilters from "./CatalogFilters";

interface CatalogToolbarProps {
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
  actionsT: (key: string) => string;
  filtersT: (key: string) => string;
  orderT: (key: string) => string;
  availableCategories: string[];
  resetTitle: string;
}

function CatalogToolbar({
  isAdmin,
  categoryFilter,
  onCategoryChange,
  searchTerm,
  onSearchTermChange,
  sortKey,
  onSortChange,
  onAddItem,
  onGenerate,
  onReset,
  disabled = false,
  actionsT,
  filtersT,
  orderT,
  availableCategories,
  resetTitle,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center gap-3 flex-1">
        {isAdmin && (
          <button
            onClick={onAddItem}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-md transition hover:from-purple-700 hover:to-purple-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            title={actionsT("addItem")}
            aria-label={actionsT("addItem")}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}

        <CatalogFilters
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          filtersT={filtersT}
          availableCategories={availableCategories}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{orderT("label")}</span>
          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            value={sortKey}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="popular">{orderT("options.popular")}</option>
            <option value="sku">{orderT("options.sku")}</option>
            <option value="unitPrice">{orderT("options.unitPrice")}</option>
            <option value="name">{orderT("options.name")}</option>
            <option value="category">{orderT("options.category")}</option>
          </select>
        </div>

        <button 
          onClick={onGenerate} 
          className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-purple-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={disabled}
        >
          {actionsT("generate")}
        </button>
        <button 
          onClick={onReset} 
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20" 
          title={resetTitle}
        >
          {actionsT("reset")}
        </button>
      </div>
    </div>
  );
}

export default React.memo(CatalogToolbar);
