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

const toolbarStyles: React.CSSProperties = {
  borderRadius: "0.5rem",
  border: "1px solid rgb(var(--border-primary, 226 232 240))",
  backgroundColor: "rgba(var(--surface-secondary), 0.5)",
  padding: "1rem",
};

const selectStyles: React.CSSProperties = {
  height: "2.5rem",
  borderRadius: "0.5rem",
  border: "1px solid rgb(var(--border-primary, 226 232 240))",
  backgroundColor: "var(--form-input-bg, #ffffff)",
  padding: "0 2rem 0 0.75rem",
  fontSize: "0.875rem",
  color: "var(--form-input-text, #0f172a)",
  boxShadow: "var(--shadow-sm)",
};

const primaryButtonStyles: React.CSSProperties = {
  borderRadius: "0.5rem",
  background: "linear-gradient(to right, rgb(var(--brand-secondary)), rgb(var(--brand-primary)))",
  padding: "0.625rem 1.25rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "rgb(var(--brand-on-primary, 255 255 255))",
  boxShadow: "var(--shadow-md)",
};

const secondaryButtonStyles: React.CSSProperties = {
  borderRadius: "0.5rem",
  border: "1px solid rgb(var(--border-primary, 226 232 240))",
  backgroundColor: "var(--form-input-bg, #ffffff)",
  padding: "0.625rem 1.25rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "rgb(var(--text-secondary, 71 85 105))",
  boxShadow: "var(--shadow-sm)",
};

const addButtonStyles: React.CSSProperties = {
  display: "flex",
  height: "2.5rem",
  width: "2.5rem",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "9999px",
  background: "linear-gradient(to bottom right, rgb(var(--brand-secondary)), rgb(var(--brand-primary)))",
  color: "rgb(var(--brand-on-primary, 255 255 255))",
  boxShadow: "var(--shadow-md)",
};

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
    <div style={toolbarStyles} className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-3 flex-1">
        {isAdmin && (
          <button
            onClick={onAddItem}
            style={addButtonStyles}
            className="transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--form-input-focus-ring)]"
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
          <span 
            className="text-sm font-medium"
            style={{ color: "rgb(var(--text-secondary, 71 85 105))" }}
          >
            {orderT("label")}
          </span>
          <select
            style={selectStyles}
            className="transition focus:border-[var(--form-input-focus-border)] focus:outline-none focus:ring-2 focus:ring-[var(--form-input-focus-ring)]"
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
          style={primaryButtonStyles}
          className="transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={disabled}
        >
          {actionsT("generate")}
        </button>
        <button 
          onClick={onReset} 
          style={secondaryButtonStyles}
          className="transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20" 
          title={resetTitle}
        >
          {actionsT("reset")}
        </button>
      </div>
    </div>
  );
}

export default React.memo(CatalogToolbar);
