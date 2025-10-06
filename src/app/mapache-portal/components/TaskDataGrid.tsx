"use client";

import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { VirtualItem } from "@tanstack/react-virtual";

import type {
  MapacheStatusIndex,
  MapacheTask,
  MapacheTaskStatus,
  MapacheTaskSubstatus,
} from "../types";

type PresentationDateMeta = {
  label: string | null;
  indicatorClassName: string;
};

type TaskDataGridMessages = {
  title: string;
  presentationDate: string;
  status: string;
  substatus: string;
  assignee: string;
  actions: string;
  delete: string;
  deleting: string;
  exportCsv: string;
  density: string;
  densityComfortable: string;
  densityCompact: string;
  densitySpacious: string;
  columns: string;
  columnManagerTitle: string;
  virtualization: string;
  virtualizationHint: string;
  rowsPerPage: string;
  page: string;
  of: string;
};

type TaskDataGridProps = {
  tasks: MapacheTask[];
  statusKeys: MapacheTaskStatus[];
  substatusOptions: MapacheTaskSubstatus[];
  statusIndex: MapacheStatusIndex;
  statusIndicatorClassNames: Record<string, string>;
  unspecifiedOptionLabel: string;
  messages: TaskDataGridMessages;
  onOpen: (task: MapacheTask) => void;
  onStatusChange: (task: MapacheTask, status: MapacheTaskStatus) => void;
  onSubstatusChange: (
    task: MapacheTask,
    substatus: MapacheTaskSubstatus,
  ) => void;
  onRequestDeleteTask: (taskId: string) => void;
  deletingTaskId: string | null;
  updatingTaskId: string | null;
  getStatusBadgeKey: (
    task: MapacheTask,
    index: MapacheStatusIndex,
  ) => string;
  getPresentationDateMeta: (
    value: string | null | undefined,
  ) => PresentationDateMeta;
  formatStatusLabel: (status: MapacheTaskStatus) => string;
  formatSubstatusLabel: (substatus: MapacheTaskSubstatus) => string;
  formatAssigneeLabel: (task: MapacheTask) => string;
  getInitials: (value: string) => string;
};

type DensityOption = "compact" | "comfortable" | "spacious";

type ColumnMeta = {
  align?: "left" | "right";
  hideable?: boolean;
  defaultHidden?: boolean;
  label: string;
  includeInExport?: boolean;
  className?: string;
};

type ExportFormatter = (task: MapacheTask) => string;

type ColumnWithMeta = {
  id: string;
  accessor: (row: MapacheTask) => unknown;
  header: (context: { column: ColumnWithMeta }) => React.ReactNode;
  cell: (context: {
    row: MapacheTask;
    value: unknown;
    column: ColumnWithMeta;
  }) => React.ReactNode;
  meta: ColumnMeta & { exportFormatter?: ExportFormatter };
  enableSorting: boolean;
  sortingFn: ((a: MapacheTask, b: MapacheTask) => number) | null;
  isDisplayColumn?: boolean;
};

const DENSITY_CONFIG: Record<
  DensityOption,
  {
    labelKey: keyof Pick<
      TaskDataGridMessages,
      "densityComfortable" | "densityCompact" | "densitySpacious"
    >;
    rowHeight: number;
    cellPadding: string;
  }
> = {
  compact: {
    labelKey: "densityCompact",
    rowHeight: 54,
    cellPadding: "py-2.5",
  },
  comfortable: {
    labelKey: "densityComfortable",
    rowHeight: 70,
    cellPadding: "py-3.5",
  },
  spacious: {
    labelKey: "densitySpacious",
    rowHeight: 86,
    cellPadding: "py-5",
  },
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function toCsvValue(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateForCsv(label: string | null, fallback: string) {
  return label ?? fallback;
}

const columnHelper = createColumnHelper<MapacheTask>();

const TaskDataGrid = React.memo(function TaskDataGrid({
  tasks,
  statusKeys,
  substatusOptions,
  statusIndex,
  statusIndicatorClassNames,
  unspecifiedOptionLabel,
  messages,
  onOpen,
  onStatusChange,
  onSubstatusChange,
  onRequestDeleteTask,
  deletingTaskId,
  updatingTaskId,
  getStatusBadgeKey,
  getPresentationDateMeta,
  formatStatusLabel,
  formatSubstatusLabel,
  formatAssigneeLabel,
  getInitials,
}: TaskDataGridProps) {
  const [sorting, setSorting] = React.useState<
    { id: string; desc: boolean } | null
  >(null);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0] ?? 25);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [density, setDensity] = React.useState<DensityOption>("comfortable");
  const [virtualizationEnabled, setVirtualizationEnabled] = React.useState(
    tasks.length > 150,
  );
  const [columnsMenuOpen, setColumnsMenuOpen] = React.useState(false);

  const densityConfig = DENSITY_CONFIG[density];

  const columns = React.useMemo<ColumnWithMeta[]>(() => {
    const fallbackSubstatus =
      (substatusOptions[0] as MapacheTaskSubstatus | undefined) ?? "BACKLOG";
    const presentationAccessor = (task: MapacheTask) => task.presentationDate;

    const titleColumn = columnHelper.accessor("title", {
      id: "title",
      header: messages.title,
      enableSorting: true,
      sortingFn: (a: MapacheTask, b: MapacheTask) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      cell: ({ row }: { row: MapacheTask }) => {
        const task = row;
        const statusBadgeKey = getStatusBadgeKey(task, statusIndex);
        const assigneeLabel =
          formatAssigneeLabel(task) || unspecifiedOptionLabel;
        const assigneeInitials = getInitials(assigneeLabel);
        const clientLabel = task.clientName ?? unspecifiedOptionLabel;
        const substatusLabel = task.substatus
          ? formatSubstatusLabel(task.substatus)
          : null;
        return (
          <button
            type="button"
            onClick={() => onOpen(task)}
            className="group flex w-full items-start gap-3 rounded-lg border border-transparent bg-transparent px-0 text-left transition hover:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold uppercase text-white"
              title={assigneeLabel}
            >
              {assigneeInitials}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${statusIndicatorClassNames[statusBadgeKey] ?? "bg-white/40"}`}
                  aria-hidden="true"
                />
                <span className="line-clamp-2 text-sm font-semibold text-white">
                  {task.title}
                </span>
              </span>
              <span
                className="text-xs text-white/60"
                title={clientLabel}
              >
                {clientLabel}
              </span>
              {substatusLabel ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusIndicatorClassNames[statusBadgeKey] ?? "bg-white/40"}`}
                    aria-hidden="true"
                  />
                  {substatusLabel}
                </span>
              ) : null}
            </span>
          </button>
        );
      },
      meta: {
        align: "left",
        hideable: false,
        label: messages.title,
        includeInExport: true,
        exportFormatter: (task: MapacheTask) => task.title ?? "",
        className: "align-top",
      },
    });

    const presentationColumn = columnHelper.accessorFn(presentationAccessor, {
      id: "presentationDate",
      header: messages.presentationDate,
      enableSorting: true,
      sortingFn: (a: MapacheTask, b: MapacheTask) => {
        const aDate = a.presentationDate
          ? new Date(a.presentationDate).getTime()
          : Number.POSITIVE_INFINITY;
        const bDate = b.presentationDate
          ? new Date(b.presentationDate).getTime()
          : Number.POSITIVE_INFINITY;
        return aDate - bDate;
      },
      cell: ({ row }: { row: MapacheTask }) => {
        const task = row;
        const meta = getPresentationDateMeta(task.presentationDate);
        const label = meta.label ?? unspecifiedOptionLabel;
        return (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span
              className={`h-2 w-2 rounded-full ${meta.indicatorClassName}`}
              aria-hidden="true"
            />
            <span className="font-semibold text-white/80">{label}</span>
          </div>
        );
      },
      meta: {
        align: "left",
        hideable: true,
        label: messages.presentationDate,
        includeInExport: true,
        exportFormatter: (task: MapacheTask) =>
          formatDateForCsv(
            getPresentationDateMeta(task.presentationDate).label,
            task.presentationDate ?? "",
          ),
      },
    });

    const statusColumn = columnHelper.accessor("status", {
      id: "status",
      header: messages.status,
      enableSorting: true,
      sortingFn: (a: MapacheTask, b: MapacheTask) =>
        formatStatusLabel(a.status).localeCompare(
          formatStatusLabel(b.status),
          undefined,
          { sensitivity: "base" },
        ),
      cell: ({
        row,
        value,
      }: {
        row: MapacheTask;
        value: MapacheTaskStatus;
      }) => {
        const task = row;
        const currentStatus = value;
        const isUpdating = updatingTaskId === task.id;
        const isDeleting = deletingTaskId === task.id;
        return (
          <label className="flex items-center gap-2 text-xs text-white/70">
            <span className="hidden text-white/60 lg:inline">
              {messages.status}:
            </span>
            <select
              className="min-w-[140px] rounded-md border border-white/20 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-[rgb(var(--primary))] focus:outline-none"
              value={currentStatus}
              onChange={(event) =>
                onStatusChange(task, event.target.value as MapacheTaskStatus)
              }
              disabled={isUpdating || isDeleting}
            >
              {statusKeys.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        );
      },
      meta: {
        align: "left",
        hideable: true,
        label: messages.status,
        includeInExport: true,
        exportFormatter: (task: MapacheTask) => formatStatusLabel(task.status),
      },
    });

    const substatusColumn = columnHelper.accessor("substatus", {
      id: "substatus",
      header: messages.substatus,
      enableSorting: true,
      sortingFn: (a: MapacheTask, b: MapacheTask) =>
        formatSubstatusLabel(
          (a.substatus ?? fallbackSubstatus) as MapacheTaskSubstatus,
        ).localeCompare(
          formatSubstatusLabel(
            (b.substatus ?? fallbackSubstatus) as MapacheTaskSubstatus,
          ),
          undefined,
          { sensitivity: "base" },
        ),
      cell: ({
        row,
        value,
      }: {
        row: MapacheTask;
        value: MapacheTaskSubstatus;
      }) => {
        const task = row;
        const currentSubstatus = value;
        const isUpdating = updatingTaskId === task.id;
        const isDeleting = deletingTaskId === task.id;
        return (
          <label className="flex items-center gap-2 text-xs text-white/70">
            <span className="hidden text-white/60 lg:inline">
              {messages.substatus}:
            </span>
            <select
              className="min-w-[160px] rounded-md border border-white/20 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-[rgb(var(--primary))] focus:outline-none"
              value={currentSubstatus}
              onChange={(event) =>
                onSubstatusChange(
                  task,
                  event.target.value as MapacheTaskSubstatus,
                )
              }
              disabled={isUpdating || isDeleting}
            >
              {substatusOptions.map((substatus) => (
                <option key={substatus} value={substatus}>
                  {formatSubstatusLabel(substatus)}
                </option>
              ))}
            </select>
          </label>
        );
      },
      meta: {
        align: "left",
        hideable: true,
        label: messages.substatus,
        includeInExport: true,
        exportFormatter: (task: MapacheTask) =>
          task.substatus ? formatSubstatusLabel(task.substatus) : "",
      },
    });

    const assigneeColumn = columnHelper.accessorFn(formatAssigneeLabel, {
      id: "assignee",
      header: messages.assignee,
      enableSorting: true,
      sortingFn: (a: MapacheTask, b: MapacheTask) =>
        formatAssigneeLabel(a).localeCompare(formatAssigneeLabel(b), undefined, {
          sensitivity: "base",
        }),
      cell: ({
        value,
      }: {
        value: string;
      }) => {
        const label = value || unspecifiedOptionLabel;
        const initials = getInitials(label);
        return (
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold uppercase text-white"
              title={label}
            >
              {initials}
            </span>
            <span className="text-sm text-white/80">{label}</span>
          </div>
        );
      },
      meta: {
        align: "left",
        hideable: true,
        label: messages.assignee,
        includeInExport: true,
        exportFormatter: (task: MapacheTask) => formatAssigneeLabel(task),
      },
    });

    const actionsColumn = columnHelper.display({
      id: "actions",
      header: messages.actions,
      cell: ({ row }: { row: MapacheTask }) => {
        const task = row;
        const isUpdating = updatingTaskId === task.id;
        const isDeleting = deletingTaskId === task.id;
        return (
          <button
            type="button"
            onClick={() => onRequestDeleteTask(task.id)}
            disabled={isDeleting || isUpdating}
            className="inline-flex items-center rounded-md border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:bg-rose-500/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? messages.deleting : messages.delete}
          </button>
        );
      },
      meta: {
        align: "right",
        hideable: true,
        label: messages.actions,
        includeInExport: false,
      },
    });

    return [
      titleColumn as unknown as ColumnWithMeta,
      presentationColumn as unknown as ColumnWithMeta,
      statusColumn as unknown as ColumnWithMeta,
      substatusColumn as unknown as ColumnWithMeta,
      assigneeColumn as unknown as ColumnWithMeta,
      actionsColumn as unknown as ColumnWithMeta,
    ];
  }, [
    deletingTaskId,
    formatAssigneeLabel,
    formatStatusLabel,
    formatSubstatusLabel,
    getInitials,
    getPresentationDateMeta,
    getStatusBadgeKey,
    messages.actions,
    messages.assignee,
    messages.delete,
    messages.deleting,
    messages.presentationDate,
    messages.status,
    messages.substatus,
    messages.title,
    onOpen,
    onRequestDeleteTask,
    onStatusChange,
    onSubstatusChange,
    statusIndex,
    statusIndicatorClassNames,
    statusKeys,
    substatusOptions,
    unspecifiedOptionLabel,
    updatingTaskId,
  ]);

  const hideableColumns = React.useMemo(
    () => columns.filter((column) => column.meta.hideable !== false),
    [columns],
  );

  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>(
    () => {
      const initialVisibility: Record<string, boolean> = {};
      hideableColumns.forEach((column) => {
        initialVisibility[column.id] = column.meta.defaultHidden ? false : true;
      });
      columns
        .filter((column) => column.meta.hideable === false)
        .forEach((column) => {
          initialVisibility[column.id] = true;
        });
      return initialVisibility;
    },
  );

  React.useEffect(() => {
    setVisibleColumns((prev) => {
      const next = { ...prev };
      columns.forEach((column) => {
        if (!(column.id in next)) {
          next[column.id] = !column.meta.defaultHidden;
        }
      });
      return next;
    });
  }, [columns]);

  const activeColumns = React.useMemo(
    () =>
      columns.filter((column) =>
        column.meta.hideable === false ? true : visibleColumns[column.id] !== false,
      ),
    [columns, visibleColumns],
  );

  const columnMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!columnsMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!columnMenuRef.current) return;
      if (columnMenuRef.current.contains(event.target as Node)) return;
      setColumnsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [columnsMenuOpen]);

  const toggleSort = React.useCallback((columnId: string) => {
    setSorting((current) => {
      if (!current || current.id !== columnId) {
        return { id: columnId, desc: false };
      }
      if (current.desc === false) {
        return { id: columnId, desc: true };
      }
      return null;
    });
  }, []);

  const sortedTasks = React.useMemo(() => {
    if (!sorting) {
      return tasks.slice();
    }
    const column = columns.find((col) => col.id === sorting.id);
    if (!column) return tasks.slice();
    const data = tasks.slice();
    const comparator = column.sortingFn
      ? (a: MapacheTask, b: MapacheTask) => column.sortingFn!(a, b)
      : (a: MapacheTask, b: MapacheTask) => {
          const aValue = column.accessor(a);
          const bValue = column.accessor(b);
          const aString = aValue == null ? "" : String(aValue);
          const bString = bValue == null ? "" : String(bValue);
          return aString.localeCompare(bString, undefined, {
            sensitivity: "base",
            numeric: true,
          });
        };
    data.sort((a, b) => {
      const result = comparator(a, b);
      return sorting.desc ? -result : result;
    });
    return data;
  }, [columns, sorting, tasks]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [sorting, pageSize, virtualizationEnabled]);

  const virtualizationActive =
    virtualizationEnabled && sortedTasks.length > pageSize;

  const paginatedTasks = React.useMemo(() => {
    if (virtualizationActive) {
      return sortedTasks;
    }
    const start = pageIndex * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [pageIndex, pageSize, sortedTasks, virtualizationActive]);

  const pageCount = React.useMemo(() => {
    if (virtualizationActive) return 1;
    return Math.max(1, Math.ceil(sortedTasks.length / pageSize));
  }, [pageSize, sortedTasks.length, virtualizationActive]);

  React.useEffect(() => {
    if (virtualizationActive) {
      setPageIndex(0);
      return;
    }
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageCount, pageIndex, virtualizationActive]);

  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const getScrollElement = React.useCallback(
    () => scrollContainerRef.current,
    [],
  );
  const estimateSize = React.useCallback(
    () => densityConfig.rowHeight,
    [densityConfig.rowHeight],
  );

  const virtualizer = useVirtualizer({
    count: virtualizationActive ? sortedTasks.length : 0,
    estimateSize,
    getScrollElement,
    overscan: 6,
  });

  const virtualItems = virtualizationActive
    ? virtualizer.getVirtualItems()
    : [];

  const totalVirtualSize = virtualizationActive
    ? virtualizer.getTotalSize()
    : 0;

  const paddingTop = virtualizationActive && virtualItems.length > 0
    ? virtualItems[0]!.start
    : 0;
  const paddingBottom = virtualizationActive && virtualItems.length > 0
    ? Math.max(0, totalVirtualSize - virtualItems[virtualItems.length - 1]!.end)
    : 0;

  const rowClassName = React.useMemo(
    () =>
      `border-b border-white/10 last:border-0 ${densityConfig.cellPadding}`,
    [densityConfig.cellPadding],
  );

  const cellClassName = React.useCallback(
    (meta: ColumnMeta | undefined) => {
      const alignClass = meta?.align === "right" ? "text-right" : "text-left";
      const extraClass = typeof meta?.className === "string" ? meta.className : "";
      return `px-4 align-middle ${alignClass} ${extraClass}`.trim();
    },
    [],
  );

  const handleExportCsv = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const exportableColumns = activeColumns.filter(
      (column) => column.meta.includeInExport !== false,
    );
    const headerRow = exportableColumns.map((column) => column.meta.label);
    const rows = sortedTasks.map((task) =>
      exportableColumns.map((column) => {
        const formatter = column.meta.exportFormatter;
        if (formatter) {
          return formatter(task);
        }
        const value = column.accessor(task);
        return value == null ? "" : String(value);
      }),
    );
    const csv = [headerRow, ...rows]
      .map((row) => row.map((value) => toCsvValue(value ?? "")).join(","))
      .join("\n");
    const fileName = `mapache_tasks_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeColumns, sortedTasks]);

  const toggleAllColumns = React.useCallback(
    (visible: boolean) => {
      setVisibleColumns((prev) => {
        const next = { ...prev };
        hideableColumns.forEach((column) => {
          next[column.id] = visible;
        });
        return next;
      });
    },
    [hideableColumns],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white transition hover:border-white/30 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {messages.exportCsv}
          </button>
          <div className="relative" ref={columnMenuRef}>
            <button
              type="button"
              onClick={() => setColumnsMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {messages.columns}
            </button>
            {columnsMenuOpen ? (
              <div className="data-grid-menu absolute right-0 z-20 mt-2 w-56 rounded-lg border border-white/10 bg-slate-950/95 p-3 text-sm text-white shadow-lg backdrop-blur">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                  <span>{messages.columnManagerTitle}</span>
                  <button
                    type="button"
                    onClick={() => setColumnsMenuOpen(false)}
                    className="text-white/50 transition hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="mb-3 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <button
                    type="button"
                    onClick={() => toggleAllColumns(true)}
                    className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllColumns(false)}
                    className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    OFF
                  </button>
                </div>
                <div className="space-y-2">
                  {hideableColumns.map((column) => {
                    const checked = visibleColumns[column.id] !== false;
                    return (
                      <label
                        key={column.id}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs text-white/80 transition hover:bg-white/5"
                      >
                        <span>{column.meta.label}</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-white/30 bg-slate-900 text-[rgb(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/60"
                          checked={checked}
                          onChange={(event) =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [column.id]: event.target.checked,
                            }))
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80">
            <span className="uppercase tracking-[0.25em]">{messages.density}</span>
            <select
              value={density}
              onChange={(event) =>
                setDensity(event.target.value as DensityOption)
              }
              className="rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-[rgb(var(--primary))] focus:outline-none"
            >
              {(Object.keys(DENSITY_CONFIG) as DensityOption[]).map((option) => (
                <option key={option} value={option}>
                  {messages[DENSITY_CONFIG[option].labelKey]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-white/30 bg-slate-900 text-[rgb(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/60"
            checked={virtualizationEnabled}
            onChange={(event) => setVirtualizationEnabled(event.target.checked)}
          />
          <span>{messages.virtualization}</span>
        </label>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60 shadow-soft"
        style={{ maxHeight: "60vh" }}
      >
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="sticky top-0 z-10 bg-white/5 backdrop-blur">
            <tr className="text-xs uppercase tracking-wide text-white/60">
              {activeColumns.map((column) => {
                const isSorted = sorting?.id === column.id;
                const isDesc = sorting?.desc && isSorted;
                return (
                  <th
                    key={column.id}
                    className={`px-4 py-3 font-semibold ${
                      column.meta.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {column.enableSorting ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        className="inline-flex items-center gap-2 text-white/70 transition hover:text-white"
                      >
                        <span>{column.meta.label}</span>
                        <span className="text-[10px]">
                          {isSorted ? (isDesc ? "↓" : "↑") : ""}
                        </span>
                      </button>
                    ) : (
                      <span>{column.meta.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {virtualizationActive ? (
              <>
                {paddingTop > 0 ? (
                  <tr style={{ height: paddingTop }}>
                    <td colSpan={activeColumns.length} />
                  </tr>
                ) : null}
                {virtualItems.map((virtualRow: VirtualItem) => {
                  const task = paginatedTasks[virtualRow.index];
                  if (!task) return null;
                  return (
                    <tr
                      key={task.id}
                      className={rowClassName}
                      style={{ height: virtualRow.size }}
                    >
                      {activeColumns.map((column) => (
                        <td key={column.id} className={cellClassName(column.meta)}>
                          {column.cell({
                            row: task,
                            value: column.accessor(task),
                            column,
                          })}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 ? (
                  <tr style={{ height: paddingBottom }}>
                    <td colSpan={activeColumns.length} />
                  </tr>
                ) : null}
              </>
            ) : paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <tr key={task.id} className={rowClassName}>
                  {activeColumns.map((column) => (
                    <td key={column.id} className={cellClassName(column.meta)}>
                      {column.cell({
                        row: task,
                        value: column.accessor(task),
                        column,
                      })}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="px-4 py-6 text-center text-sm text-white/60"
                >
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {virtualizationActive ? (
        <p className="text-xs text-white/50">{messages.virtualizationHint}</p>
      ) : (
        <div className="flex flex-col gap-2 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.2em] text-white/50">
              {messages.rowsPerPage}
            </span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded-md border border-white/20 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-[rgb(var(--primary))] focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="uppercase tracking-[0.2em] text-white/50">
              {messages.page} {pageIndex + 1} {messages.of} {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
                disabled={pageIndex === 0}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  setPageIndex((index) => Math.min(pageCount - 1, index + 1))
                }
                disabled={pageIndex + 1 >= pageCount}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default TaskDataGrid;
