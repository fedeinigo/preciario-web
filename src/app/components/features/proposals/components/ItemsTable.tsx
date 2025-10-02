// src/app/components/features/proposals/components/ItemsTable.tsx
"use client";

import React, { useMemo, useCallback } from "react";

import { useTranslations } from "@/app/LanguageProvider";
import type { Locale } from "@/lib/i18n/config";

import { formatUSD } from "../lib/format";
import type { UIItem } from "../lib/types";

type Props = {
  items: UIItem[];
  isAdmin: boolean;
  onToggle: (item: UIItem, checked: boolean) => void;
  onChangeQty: (itemId: string, qty: number) => void;
  onChangeDiscountPct: (itemId: string, pct: number) => void;
  onEdit: (it: UIItem) => void;
  onDelete: (itemId: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  locale: Locale;
};

type PageInfo = {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalRows: number;
};

type TranslateFn = (key: string, replacements?: Record<string, string | number>) => string;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

const ItemsTableRow = React.memo(function ItemsTableRow({
  item,
  locale,
  isAdmin,
  onToggle,
  onChangeQty,
  onChangeDiscountPct,
  onEdit,
  onDelete,
  titlesT,
  actionsT,
}: {
  item: UIItem;
  locale: Locale;
  isAdmin: boolean;
  onToggle: (item: UIItem, checked: boolean) => void;
  onChangeQty: (itemId: string, qty: number) => void;
  onChangeDiscountPct: (itemId: string, pct: number) => void;
  onEdit: (it: UIItem) => void;
  onDelete: (itemId: string) => void;
  titlesT: TranslateFn;
  actionsT: TranslateFn;
}) {
  const pct = useMemo(
    () => Math.max(0, Math.min(100, Number(item.discountPct ?? 0))),
    [item.discountPct]
  );
  const unitNet = useMemo(
    () => Math.max(0, item.unitPrice * (1 - pct / 100)),
    [item.unitPrice, pct]
  );
  const subtotal = useMemo(
    () => Math.max(0, unitNet * item.quantity),
    [unitNet, item.quantity]
  );
  const translation = item.translations?.[locale];
  const displayName = translation?.name ?? item.name;
  const displayDescription = translation?.description ?? item.description;

  const handleToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onToggle(item, event.target.checked);
    },
    [item, onToggle]
  );

  const handleQuantityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeQty(item.id, Number(event.target.value));
    },
    [item.id, onChangeQty]
  );

  const handleDiscountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeDiscountPct(item.id, Number(event.target.value));
    },
    [item.id, onChangeDiscountPct]
  );

  const handleEdit = useCallback(() => onEdit(item), [item, onEdit]);
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);

  return (
    <tr>
      <td className="table-td">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={handleToggle}
          title={titlesT("selectAction")}
        />
      </td>
      <td className="table-td">
        <span className="font-mono text-gray-600">{item.sku}</span>
      </td>
      <td className="table-td">{item.category}</td>
      <td className="table-td">
        <div className="font-medium">{displayName}</div>
        {displayDescription && (
          <div className="text-xs text-gray-500">{displayDescription}</div>
        )}
      </td>
      <td className="table-td text-right">
        <input
          className="input h-9 text-right"
          type="number"
          min={0}
          value={item.quantity}
          onChange={handleQuantityChange}
        />
      </td>
      <td
        className="table-td text-right"
        title={titlesT("unitPriceWithNet", { value: formatUSD(unitNet) })}
      >
        {formatUSD(item.unitPrice)}
      </td>
      <td className="table-td text-right">
        <div className="flex items-center justify-end gap-2">
          <input
            className="input h-9 w-20 text-right"
            type="number"
            min={0}
            max={100}
            value={pct}
            onChange={handleDiscountChange}
            title={titlesT("discountInput")}
          />
          <span className="text-xs text-gray-500 mr-1" title={titlesT("netUnit")}>
            {formatUSD(unitNet)}
          </span>
        </div>
      </td>
      <td className="table-td text-right" title={titlesT("subtotalValue")}>
        {formatUSD(subtotal)}
      </td>
      {isAdmin && (
        <td className="table-td text-center">
          <div className="flex items-center justify-center gap-2">
            <button className="btn-ghost" onClick={handleEdit} title={actionsT("edit")}>
              {actionsT("edit")}
            </button>
            <button className="btn-ghost" onClick={handleDelete} title={actionsT("delete")}>
              {actionsT("delete")}
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

ItemsTableRow.displayName = "ItemsTableRow";

const ItemsTablePagination = React.memo(function ItemsTablePagination({
  pageInfo,
  pageSize,
  onPageChange,
  onPageSizeChange,
  paginationT,
  titlesT,
}: {
  pageInfo: PageInfo;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  paginationT: TranslateFn;
  titlesT: TranslateFn;
}) {
  const handlePageSize = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onPageSizeChange(Number(event.target.value));
    },
    [onPageSizeChange]
  );

  const handlePrev = useCallback(() => {
    onPageChange(clampPage(pageInfo.currentPage - 1, pageInfo.totalPages));
  }, [onPageChange, pageInfo]);

  const handleNext = useCallback(() => {
    onPageChange(clampPage(pageInfo.currentPage + 1, pageInfo.totalPages));
  }, [onPageChange, pageInfo]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t">
      <div className="text-sm text-gray-600">
        {paginationT("display", {
          start: pageInfo.startIndex + 1,
          end: pageInfo.endIndex,
          total: pageInfo.totalRows,
        })}
      </div>
      <div className="flex items-center gap-2">
        <select className="select h-9" value={pageSize} onChange={handlePageSize}>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {paginationT("perPage", { count: n })}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            className="btn-bar"
            onClick={handlePrev}
            disabled={pageInfo.currentPage === 1}
            title={titlesT("previous")}
          >
            {paginationT("previous")}
          </button>
          <span className="text-sm">
            {paginationT("pageStatus", {
              current: pageInfo.currentPage,
              total: pageInfo.totalPages,
            })}
          </span>
          <button
            className="btn-bar"
            onClick={handleNext}
            disabled={pageInfo.currentPage === pageInfo.totalPages}
            title={titlesT("next")}
          >
            {paginationT("next")}
          </button>
        </div>
      </div>
    </div>
  );
});

ItemsTablePagination.displayName = "ItemsTablePagination";

export default function ItemsTable({
  items,
  isAdmin,
  onToggle,
  onChangeQty,
  onChangeDiscountPct,
  onEdit,
  onDelete,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  locale,
}: Props) {
  const totalRows = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize))),
    [pageSize, totalRows]
  );
  const currentPage = useMemo(
    () => clampPage(page, totalPages),
    [page, totalPages]
  );
  const startIndex = (currentPage - 1) * pageSize;
  const visible = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize]
  );
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const pageInfo = useMemo<PageInfo>(
    () => ({
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      totalRows,
    }),
    [currentPage, totalPages, startIndex, endIndex, totalRows]
  );

  const colSpan = useMemo(() => (isAdmin ? 9 : 8), [isAdmin]);

  const baseT = useTranslations("proposals.itemsTable");
  const headersT = useTranslations("proposals.itemsTable.headers");
  const titlesT = useTranslations("proposals.itemsTable.titles");
  const actionsT = useTranslations("proposals.itemsTable.actions");
  const paginationT = useTranslations("proposals.itemsTable.pagination");

  return (
    <div className="overflow-x-auto rounded-md border-2 bg-white">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-th w-10" title={titlesT("select")} />
            <th className="table-th">{headersT("sku")}</th>
            <th className="table-th">{headersT("category")}</th>
            <th className="table-th">{headersT("item")}</th>
            <th className="table-th w-28 text-right" title={titlesT("quantity")}>
              {headersT("quantity")}
            </th>
            <th className="table-th w-32 text-right" title={titlesT("unitPrice")}>
              {headersT("unitPrice")}
            </th>
            <th className="table-th w-40 text-right" title={titlesT("discount")}>
              {headersT("discount")}
            </th>
            <th className="table-th w-40 text-right" title={titlesT("subtotal")}>
              {headersT("subtotal")}
            </th>
            {isAdmin && <th className="table-th w-36 text-center">{headersT("actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {visible.map((item) => (
            <ItemsTableRow
              key={item.id}
              item={item}
              locale={locale}
              isAdmin={isAdmin}
              onToggle={onToggle}
              onChangeQty={onChangeQty}
              onChangeDiscountPct={onChangeDiscountPct}
              onEdit={onEdit}
              onDelete={onDelete}
              titlesT={titlesT}
              actionsT={actionsT}
            />
          ))}
          {totalRows === 0 && (
            <tr>
              <td className="table-td text-center text-gray-500" colSpan={colSpan}>
                {baseT("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalRows > 0 && (
        <ItemsTablePagination
          pageInfo={pageInfo}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          paginationT={paginationT}
          titlesT={titlesT}
        />
      )}
    </div>
  );
}
