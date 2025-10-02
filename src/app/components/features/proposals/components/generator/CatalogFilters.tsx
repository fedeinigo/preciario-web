"use client";

import * as React from "react";

interface CatalogFiltersProps {
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filtersT: (key: string) => string;
  availableCategories: string[];
}

function CatalogFilters({
  categoryFilter,
  onCategoryChange,
  searchTerm,
  onSearchTermChange,
  filtersT,
  availableCategories,
}: CatalogFiltersProps) {
  const handleCategory = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onCategoryChange(event.target.value);
    },
    [onCategoryChange]
  );

  const handleSearch = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchTermChange(event.target.value);
    },
    [onSearchTermChange]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
      <select className="select h-9" value={categoryFilter} onChange={handleCategory}>
        <option value="">{filtersT("categoriesAll")}</option>
        {availableCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <input
        className="input h-9"
        placeholder={filtersT("searchPlaceholder")}
        value={searchTerm}
        onChange={handleSearch}
      />
    </div>
  );
}

export default React.memo(CatalogFilters);
