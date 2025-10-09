import type { ReactNode } from "react";

export interface ColumnMeta {
  [key: string]: unknown;
}

export interface CellContext<TData, TValue> {
  row: TData;
  value: TValue;
  column: ColumnDef<TData, TValue>;
}

export interface ColumnDef<TData, TValue> {
  id: string;
  accessor: (row: TData) => TValue;
  header: (context: { column: ColumnDef<TData, TValue> }) => ReactNode;
  cell: (context: CellContext<TData, TValue>) => ReactNode;
  meta: ColumnMeta;
  enableSorting: boolean;
  sortingFn: ((a: TData, b: TData) => number) | null;
  isDisplayColumn?: boolean;
}

export interface AccessorColumnOptions<TData, TValue> {
  id?: string;
  header?: ReactNode | ((context: { column: ColumnDef<TData, TValue> }) => ReactNode);
  cell?: ((context: CellContext<TData, TValue>) => ReactNode) | ReactNode;
  meta?: ColumnMeta;
  enableSorting?: boolean;
  sortingFn?: (a: TData, b: TData) => number;
}

export interface DisplayColumnOptions<TData, TValue = unknown>
  extends AccessorColumnOptions<TData, TValue> {}

export declare function createColumnHelper<TData>(): {
  accessor<TKey extends keyof TData>(
    key: TKey,
    column?: AccessorColumnOptions<TData, TData[TKey]>,
  ): ColumnDef<TData, TData[TKey]>;
  accessorFn<TValue>(
    accessor: (row: TData) => TValue,
    column?: AccessorColumnOptions<TData, TValue>,
  ): ColumnDef<TData, TValue>;
  display<TValue = unknown>(
    column?: DisplayColumnOptions<TData, TValue>,
  ): ColumnDef<TData, TValue>;
};

export declare function flexRender(renderer: unknown, context: unknown): unknown;

export declare function getCoreRowModel<TData>(options: {
  data: TData[];
}): { rows: Array<{ id: number; original: TData }>; };
