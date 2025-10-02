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
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
      <div className="flex items-center gap-3 flex-1">
        {isAdmin && (
          <button
            onClick={onAddItem}
            className="btn-bar px-2 py-2 w-9 h-9 rounded-full"
            title={actionsT("addItem")}
            aria-label={actionsT("addItem")}
          >
            <Plus className="h-4 w-4" />
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
          <span className="text-sm text-gray-700">{orderT("label")}</span>
          <select
            className="select h-9"
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

        <button onClick={onGenerate} className="btn-bar" disabled={disabled}>
          {actionsT("generate")}
        </button>
        <button onClick={onReset} className="btn-bar" title={resetTitle}>
          {actionsT("reset")}
        </button>
      </div>
    </div>
  );
}

export default React.memo(CatalogToolbar);
