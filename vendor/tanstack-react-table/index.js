const noop = () => null;

function normalizeHeader(header) {
  if (typeof header === "function" || header == null) {
    return header ?? noop;
  }
  return () => header;
}

function normalizeCell(cell) {
  if (typeof cell === "function") {
    return cell;
  }
  return () => cell ?? null;
}

function buildColumn(accessor, options = {}) {
  const { id, header, cell, meta, enableSorting = false, sortingFn } = options;
  return {
    id,
    accessor,
    header: normalizeHeader(header),
    cell: normalizeCell(cell),
    meta: meta ?? {},
    enableSorting,
    sortingFn: typeof sortingFn === "function" ? sortingFn : null,
  };
}

export function createColumnHelper() {
  return {
    accessor(keyOrAccessor, options = {}) {
      if (typeof keyOrAccessor === "function") {
        const column = buildColumn(keyOrAccessor, options);
        if (!column.id) {
          column.id = options.id ?? "accessor_fn";
        }
        return column;
      }
      const key = keyOrAccessor;
      const accessor = (row) => row?.[key];
      const column = buildColumn(accessor, options);
      column.id = options.id ?? String(key);
      return column;
    },
    accessorFn(accessor, options = {}) {
      const column = buildColumn(accessor, options);
      if (!column.id) {
        column.id = options.id ?? "accessor_fn";
      }
      return column;
    },
    display(options = {}) {
      const column = buildColumn(() => undefined, options);
      column.id = options.id ?? options.header ?? "display";
      column.isDisplayColumn = true;
      return column;
    },
  };
}

export function flexRender(renderer, context) {
  if (typeof renderer === "function") {
    return renderer(context);
  }
  return renderer ?? null;
}

export function getCoreRowModel({ data }) {
  return { rows: data?.map((row, index) => ({ id: index, original: row })) ?? [] };
}

