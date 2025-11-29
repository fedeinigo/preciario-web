"use client";

import * as React from "react";

import { Command } from "cmdk";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  HelpCircle,
  Loader2,
  Search,
  Sparkles,
  User,
  UserMinus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  FloatingFocusManager,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";

import type {
  MapacheDirectness,
  MapacheIntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
  MapacheStatusDetails,
  MapacheTaskStatus,
} from "../types";
import {
  DATE_INPUT_REGEX,
  createDefaultFiltersState,
  type AdvancedFiltersState,
  type OwnershipFilterValue,
  type StatusFilterValue,
  type TaskFilterState,
} from "../filters";
import { normalizeSearchText } from "@/lib/normalize-search-text";

const mapacheGlassPanel = "rounded-2xl border bg-white/5 p-4" + " " + "border-[var(--mapache-glass-border,rgba(255,255,255,0.1))]";
const mapacheInputField = "rounded-full border border-white/10 bg-black/30 px-3 py-2";
const mapacheListContainer = "rounded-xl border border-white/10 bg-black/30";

const OWNERSHIP_OPTIONS: OwnershipFilterValue[] = [
  "all",
  "mine",
  "unassigned",
];

function sanitizeDateInput(value: string): string | null {
  if (!value) return null;
  if (!DATE_INPUT_REGEX.test(value)) return null;
  return value;
}

type AssigneeOption = {
  id: string;
  label: string;
};

type MapachePortalFiltersProps = {
  className?: string;
  activeFilter: TaskFilterState;
  setActiveFilter: React.Dispatch<React.SetStateAction<TaskFilterState>>;
  advancedFilters: AdvancedFiltersState;
  setAdvancedFilters: React.Dispatch<
    React.SetStateAction<AdvancedFiltersState>
  >;
  statusOptions: MapacheStatusDetails[];
  statusLabel: string;
  statusAllLabel: string;
  formatStatusLabel: (status: MapacheTaskStatus) => string;
  needOptions: MapacheNeedFromTeam[];
  directnessOptions: MapacheDirectness[];
  integrationTypeOptions: MapacheIntegrationType[];
  originOptions: MapacheSignalOrigin[];
  assigneeOptions: AssigneeOption[];
  filtersT: (key: string) => string;
  needFromTeamT: (value: MapacheNeedFromTeam) => string;
  directnessT: (value: MapacheDirectness) => string;
  integrationTypeT: (value: MapacheIntegrationType) => string;
  originT: (value: MapacheSignalOrigin) => string;
  hasActiveAdvancedFilters: boolean;
  advancedFiltersCount: number;
  ownershipLabel: string;
  filterPresets: Array<{ id: string; name: string }>;
  filterPresetsLoading: boolean;
  savingFilterPreset: boolean;
  onSaveCurrentFilters: () => void;
  onApplyPreset: (presetId: string | null) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: React.Dispatch<React.SetStateAction<string | null>>;
  filtering?: boolean;
};

function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    icon?: React.ReactNode;
  }>;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 text-sm text-white/70"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              isActive
                ? "bg-[rgb(var(--primary))] text-white shadow-soft"
                : "text-white/70 hover:bg-white/10"
            }`}
          >
            {option.icon ? (
              <span className="inline-flex h-4 w-4 items-center justify-center">
                {option.icon}
              </span>
            ) : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type MultiSelectOptionShape = {
  value: string;
  label: string;
  hint?: string;
};

function highlightMatch(label: string, query: string): React.ReactNode {
  if (!query) return label;
  const normalizedLabel = label.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  const startIndex = normalizedLabel.indexOf(normalizedQuery);
  if (startIndex === -1) return label;
  const endIndex = startIndex + query.length;
  return (
    <>
      {label.slice(0, startIndex)}
      <mark className="rounded-sm bg-[rgb(var(--primary))]/20 px-0.5 text-[rgb(var(--primary))]">
        {label.slice(startIndex, endIndex)}
      </mark>
      {label.slice(endIndex)}
    </>
  );
}

type MultiSelectCommandProps = {
  label: string;
  tooltip: string;
  helperText: string;
  searchPlaceholder: string;
  emptyText: string;
  clearSelectionLabel: string;
  clearSearchLabel: string;
  values: readonly string[];
  options: MultiSelectOptionShape[];
  onChange: (values: string[]) => void;
};

type AdvancedGroupConfig = {
  id: string;
  label: string;
  tooltip: string;
  helperText: string;
  searchPlaceholder: string;
  emptyText: string;
  values: readonly string[];
  options: MultiSelectOptionShape[];
  onChange: (values: string[]) => void;
};

function MultiSelectCommand({
  label,
  tooltip,
  helperText,
  searchPlaceholder,
  emptyText,
  clearSelectionLabel,
  clearSearchLabel,
  values,
  options,
  onChange,
}: MultiSelectCommandProps) {
  const [query, setQuery] = React.useState("");

  const normalizedOptions = React.useMemo(
    () =>
      options.map((option) => ({
        ...option,
        searchValue: normalizeSearchText(option.label),
      })),
    [options],
  );

  const normalizedQuery = React.useMemo(
    () => normalizeSearchText(query),
    [query],
  );

  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) return normalizedOptions;
    return normalizedOptions.filter((option) =>
      option.searchValue.includes(normalizedQuery),
    );
  }, [normalizedOptions, normalizedQuery]);

  const toggleValue = React.useCallback(
    (value: string) => {
      onChange(
        values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      );
    },
    [onChange, values],
  );

  const clear = React.useCallback(() => {
    if (values.length === 0) return;
    onChange([]);
  }, [onChange, values]);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );

  return (
    <section className={`${mapacheGlassPanel} space-y-3 text-sm text-white`}>
      <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
        <span>{label}</span>
        <span className="text-white/40" title={tooltip} aria-hidden="true">
          <HelpCircle className="h-3.5 w-3.5" />
        </span>
        {values.length > 0 ? (
          <span className="ml-auto inline-flex items-center rounded-full bg-[rgb(var(--primary))]/20 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
            {values.length}
          </span>
        ) : null}
      </header>
      <Command className="space-y-3" label={label}>
        <div className={`${mapacheInputField} flex items-center gap-2`}>
          <Search className="h-4 w-4 text-white/40" aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-white/40 transition hover:text-white"
              aria-label={clearSearchLabel}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className={`${mapacheListContainer} max-h-60 overflow-y-auto`}>
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-white/50">
              {emptyText}
            </div>
          ) : (
            <Command.List className="divide-y divide-white/5">
              {filteredOptions.map((option) => {
                const checked = values.includes(option.value);
                return (
                  <Command.Item
                    key={option.value}
                    value={`${option.value} ${option.label}`}
                    onSelect={() => toggleValue(option.value)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm transition focus:outline-none ${
                      checked
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                        checked
                          ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/20 text-[rgb(var(--primary))]"
                          : "border-white/20 text-white/40"
                      }`}
                      aria-hidden="true"
                    >
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="flex-1 truncate">
                      {highlightMatch(option.label, query)}
                    </span>
                    {option.hint ? (
                      <span className="text-xs text-white/50">{option.hint}</span>
                    ) : null}
                  </Command.Item>
                );
              })}
            </Command.List>
          )}
        </div>
      </Command>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
        <button
          type="button"
          onClick={clear}
          disabled={values.length === 0}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
            values.length === 0
              ? "cursor-not-allowed border-white/10 text-white/30"
              : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
          }`}
        >
          <XCircle className="h-3 w-3" aria-hidden="true" />
          <span>{clearSelectionLabel}</span>
        </button>
        <span className="text-white/60">
          {values.length}/{options.length}
        </span>
      </div>
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="group inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-white/80"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => toggleValue(option.value)}
                className="text-white/60 transition group-hover:text-white"
                aria-label={`${clearSelectionLabel}: ${option.label}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/40">{helperText}</p>
      )}
    </section>
  );
}

const STATUS_ALL_ICON = <Sparkles className="h-4 w-4" aria-hidden="true" />;
const STATUS_FIRST_ICON = <Clock className="h-4 w-4" aria-hidden="true" />;
const STATUS_MIDDLE_ICON = <Loader2 className="h-4 w-4" aria-hidden="true" />;
const STATUS_LAST_ICON = <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;

function getStatusFilterIcon(
  status: StatusFilterValue,
  orderedStatuses: MapacheTaskStatus[],
): React.ReactNode {
  if (status === "all") {
    return STATUS_ALL_ICON;
  }

  if (orderedStatuses.length === 0) {
    return STATUS_MIDDLE_ICON;
  }

  const normalized = status.trim().toUpperCase();
  const first = orderedStatuses[0];
  const last = orderedStatuses[orderedStatuses.length - 1];

  if (normalized === last) {
    return STATUS_LAST_ICON;
  }

  if (normalized === first) {
    return STATUS_FIRST_ICON;
  }

  return STATUS_MIDDLE_ICON;
}

const OWNERSHIP_ICON_MAP: Record<OwnershipFilterValue, React.ReactNode> = {
  all: <Users className="h-4 w-4" aria-hidden="true" />,
  mine: <User className="h-4 w-4" aria-hidden="true" />,
  unassigned: <UserMinus className="h-4 w-4" aria-hidden="true" />,
};

export default function MapachePortalFilters({
  className,
  activeFilter,
  setActiveFilter,
  advancedFilters,
  setAdvancedFilters,
  statusOptions,
  statusLabel,
  statusAllLabel,
  formatStatusLabel,
  needOptions,
  directnessOptions,
  integrationTypeOptions,
  originOptions,
  assigneeOptions,
  filtersT,
  needFromTeamT,
  directnessT,
  integrationTypeT,
  originT,
  hasActiveAdvancedFilters,
  advancedFiltersCount,
  ownershipLabel,
  filterPresets,
  filterPresetsLoading,
  savingFilterPreset,
  onSaveCurrentFilters,
  onApplyPreset,
  selectedPresetId,
  setSelectedPresetId,
  filtering = false,
}: MapachePortalFiltersProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const presetSelectId = React.useId();

  const popoverFloating = useFloating({
    open: popoverOpen,
    onOpenChange: setPopoverOpen,
    placement: "bottom-end",
    middleware: [offset(16)],
  });
  const popoverClick = useClick(popoverFloating.context);
  const popoverDismiss = useDismiss(popoverFloating.context);
  const popoverRole = useRole(popoverFloating.context, { role: "dialog" });
  const { getReferenceProps: getPopoverReferenceProps, getFloatingProps: getPopoverFloatingProps } =
    useInteractions([popoverClick, popoverDismiss, popoverRole]);

  const safeFiltersT = React.useCallback(
    (key: string, fallback: string) => {
      try {
        const value = filtersT(key);
        if (!value || value === key) {
          return fallback;
        }
        return value;
      } catch {
        return fallback;
      }
    },
    [filtersT],
  );

  const handleStatusChange = React.useCallback(
    (next: StatusFilterValue) => {
      setActiveFilter((prev) => ({ ...prev, status: next }));
    },
    [setActiveFilter],
  );

  const handleOwnershipChange = React.useCallback(
    (next: OwnershipFilterValue) => {
      setActiveFilter((prev) => ({ ...prev, ownership: next }));
    },
    [setActiveFilter],
  );

  const handlePresentationDateChange = React.useCallback(
    (key: keyof AdvancedFiltersState["presentationDate"], value: string) => {
      setAdvancedFilters((prev) => {
        const sanitized = sanitizeDateInput(value);
        return {
          ...prev,
          presentationDate: {
            ...prev.presentationDate,
            [key]: sanitized,
          },
        };
      });
    },
    [setAdvancedFilters],
  );

  const handleClearPresentationDates = React.useCallback(() => {
    setAdvancedFilters((prev) => ({
      ...prev,
      presentationDate: { from: null, to: null },
    }));
  }, [setAdvancedFilters]);

  const handleNeedChange = React.useCallback(
    (next: string[]) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        needFromTeam: next as MapacheNeedFromTeam[],
      }));
    },
    [setAdvancedFilters],
  );

  const handleDirectnessChange = React.useCallback(
    (next: string[]) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        directness: next as MapacheDirectness[],
      }));
    },
    [setAdvancedFilters],
  );

  const handleIntegrationTypeChange = React.useCallback(
    (next: string[]) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        integrationTypes: next as MapacheIntegrationType[],
      }));
    },
    [setAdvancedFilters],
  );

  const handleOriginChange = React.useCallback(
    (next: string[]) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        origins: next as MapacheSignalOrigin[],
      }));
    },
    [setAdvancedFilters],
  );

  const handleAssigneeChange = React.useCallback(
    (next: string[]) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        assignees: next,
      }));
    },
    [setAdvancedFilters],
  );

  const handleResetAdvancedFilters = React.useCallback(() => {
    setAdvancedFilters(createDefaultFiltersState());
    setPopoverOpen(false);
  }, [setAdvancedFilters]);

  const summaryItems = React.useMemo(() => {
    return [
      { label: filtersT("needFromTeam"), count: advancedFilters.needFromTeam.length },
      { label: filtersT("directness"), count: advancedFilters.directness.length },
      {
        label: filtersT("integrationType"),
        count: advancedFilters.integrationTypes.length,
      },
      { label: filtersT("origin"), count: advancedFilters.origins.length },
      { label: filtersT("assignee"), count: advancedFilters.assignees.length },
    ].filter((item) => item.count > 0);
  }, [advancedFilters, filtersT]);

  const statusKeys = React.useMemo(
    () => statusOptions.map((option) => option.key),
    [statusOptions],
  );

  const statusOptionsWithLabels = React.useMemo(
    () => {
      const options: Array<{
        value: StatusFilterValue;
        label: string;
        icon: React.ReactNode;
      }> = [
        {
          value: "all",
          label: statusAllLabel,
          icon: getStatusFilterIcon("all", statusKeys),
        },
      ];

      statusKeys.forEach((status) => {
        options.push({
          value: status,
          label: formatStatusLabel(status),
          icon: getStatusFilterIcon(status, statusKeys),
        });
      });

      return options;
    },
    [formatStatusLabel, statusAllLabel, statusKeys],
  );

  const ownershipOptionsWithLabels = React.useMemo(
    () =>
      OWNERSHIP_OPTIONS.map((option) => ({
        value: option,
        label:
          option === "all"
            ? statusAllLabel
            : option === "mine"
            ? filtersT("mine")
            : filtersT("unassigned"),
        icon: OWNERSHIP_ICON_MAP[option],
      })),
    [filtersT, statusAllLabel],
  );

  const [activeAdvancedTab, setActiveAdvancedTab] = React.useState<string>(
    "needFromTeam",
  );

  const resetLabel = safeFiltersT("reset", "Restablecer");
  const searchPlaceholderText = safeFiltersT("searchPlaceholder", "Buscar...");
  const emptyResultsText = safeFiltersT("noResults", "Sin coincidencias");
  const clearSelectionLabel = safeFiltersT("clearSelection", resetLabel);
  const clearSearchLabel = safeFiltersT("clearSearch", "Limpiar búsqueda");
  const helperSelectionText = safeFiltersT(
    "selectionHelper",
    "Aún no hay elementos seleccionados.",
  );
  const applyingFiltersLabel = safeFiltersT(
    "applyingFilters",
    "Aplicando filtros...",
  );
  const noAssigneesText = safeFiltersT(
    "noAssignees",
    "Sin colaboradores disponibles.",
  );

  const needLabel = filtersT("needFromTeam");
  const directnessLabel = filtersT("directness");
  const integrationLabel = filtersT("integrationType");
  const originLabel = filtersT("origin");
  const assigneeLabel = filtersT("assignee");

  const advancedGroups = React.useMemo<AdvancedGroupConfig[]>(
    () => [
      {
        id: "needFromTeam",
        label: needLabel,
        tooltip: safeFiltersT(
          "needFromTeamTooltip",
          `Selecciona ${needLabel.toLowerCase()} relevantes.`,
        ),
        helperText: safeFiltersT(
          "needFromTeamHelper",
          helperSelectionText,
        ),
        searchPlaceholder: safeFiltersT(
          "needFromTeamSearch",
          searchPlaceholderText,
        ),
        emptyText: safeFiltersT(
          "needFromTeamEmpty",
          emptyResultsText,
        ),
        values: advancedFilters.needFromTeam,
        options: needOptions.map((value) => ({
          value,
          label: needFromTeamT(value),
        })),
        onChange: handleNeedChange,
      },
      {
        id: "directness",
        label: directnessLabel,
        tooltip: safeFiltersT(
          "directnessTooltip",
          `Filtra por ${directnessLabel.toLowerCase()}.`,
        ),
        helperText: safeFiltersT(
          "directnessHelper",
          helperSelectionText,
        ),
        searchPlaceholder: safeFiltersT(
          "directnessSearch",
          searchPlaceholderText,
        ),
        emptyText: safeFiltersT(
          "directnessEmpty",
          emptyResultsText,
        ),
        values: advancedFilters.directness,
        options: directnessOptions.map((value) => ({
          value,
          label: directnessT(value),
        })),
        onChange: handleDirectnessChange,
      },
      {
        id: "integrationTypes",
        label: integrationLabel,
        tooltip: safeFiltersT(
          "integrationTypeTooltip",
          `Elige ${integrationLabel.toLowerCase()} disponibles.`,
        ),
        helperText: safeFiltersT(
          "integrationTypeHelper",
          helperSelectionText,
        ),
        searchPlaceholder: safeFiltersT(
          "integrationTypeSearch",
          searchPlaceholderText,
        ),
        emptyText: safeFiltersT(
          "integrationTypeEmpty",
          emptyResultsText,
        ),
        values: advancedFilters.integrationTypes,
        options: integrationTypeOptions.map((value) => ({
          value,
          label: integrationTypeT(value),
        })),
        onChange: handleIntegrationTypeChange,
      },
      {
        id: "origins",
        label: originLabel,
        tooltip: safeFiltersT(
          "originTooltip",
          `Delimita ${originLabel.toLowerCase()} relevantes.`,
        ),
        helperText: safeFiltersT(
          "originHelper",
          helperSelectionText,
        ),
        searchPlaceholder: safeFiltersT(
          "originSearch",
          searchPlaceholderText,
        ),
        emptyText: safeFiltersT("originEmpty", emptyResultsText),
        values: advancedFilters.origins,
        options: originOptions.map((value) => ({
          value,
          label: originT(value),
        })),
        onChange: handleOriginChange,
      },
      {
        id: "assignees",
        label: assigneeLabel,
        tooltip: safeFiltersT(
          "assigneeTooltip",
          `Encuentra ${assigneeLabel.toLowerCase()} rápidamente.`,
        ),
        helperText:
          assigneeOptions.length === 0
            ? noAssigneesText
            : safeFiltersT("assigneeHelper", helperSelectionText),
        searchPlaceholder: safeFiltersT(
          "assigneeSearch",
          searchPlaceholderText,
        ),
        emptyText:
          assigneeOptions.length === 0
            ? noAssigneesText
            : safeFiltersT("assigneeEmpty", emptyResultsText),
        values: advancedFilters.assignees,
        options: assigneeOptions.map((option) => ({
          value: option.id,
          label: option.label,
        })),
        onChange: handleAssigneeChange,
      },
    ],
    [
      advancedFilters.assignees,
      advancedFilters.directness,
      advancedFilters.integrationTypes,
      advancedFilters.needFromTeam,
      advancedFilters.origins,
      assigneeLabel,
      assigneeOptions,
      directnessLabel,
      directnessOptions,
      directnessT,
      emptyResultsText,
      handleAssigneeChange,
      handleDirectnessChange,
      handleIntegrationTypeChange,
      handleNeedChange,
      handleOriginChange,
      helperSelectionText,
      integrationLabel,
      integrationTypeOptions,
      integrationTypeT,
      needFromTeamT,
      needLabel,
      needOptions,
      noAssigneesText,
      originLabel,
      originOptions,
      originT,
      safeFiltersT,
      searchPlaceholderText,
    ],
  );

  React.useEffect(() => {
    if (advancedGroups.length === 0) return;
    if (!advancedGroups.some((group) => group.id === activeAdvancedTab)) {
      setActiveAdvancedTab(advancedGroups[0].id);
    }
  }, [activeAdvancedTab, advancedGroups]);

  const activeGroup = React.useMemo(
    () =>
      advancedGroups.find((group) => group.id === activeAdvancedTab) ??
      advancedGroups[0] ??
      null,
    [activeAdvancedTab, advancedGroups],
  );

  const advancedSummary = React.useMemo(
    () =>
      advancedGroups
        .map((group) => ({
          id: group.id,
          label: group.label,
          values: group.values
            .map((value) =>
              group.options.find((option) => option.value === value)?.label ??
              value,
            )
            .filter(Boolean),
        }))
        .filter((item) => item.values.length > 0),
    [advancedGroups],
  );

  const advancedFiltersLabel = filtersT("advancedFilters");
  const popoverTitle = safeFiltersT(
    "advancedFiltersTitle",
    advancedFiltersLabel,
  );
  const popoverSubtitle = safeFiltersT(
    "advancedFiltersSubtitle",
    "Combina distintos criterios para encontrar los casos adecuados.",
  );
  const summaryTitle = safeFiltersT(
    "advancedFiltersSummary",
    safeFiltersT("summary", "Resumen"),
  );
  const summaryEmpty = safeFiltersT(
    "advancedFiltersSummaryEmpty",
    "Aún no hay filtros avanzados activos.",
  );
  const closeLabel = safeFiltersT("close", "Cerrar");
  const resetAdvancedLabel = safeFiltersT(
    "resetAdvancedFilters",
    resetLabel,
  );
  const hintText = safeFiltersT(
    "advancedFiltersHint",
    "Los filtros se aplican automáticamente al cerrar este panel.",
  );
  const presentationDate = advancedFilters.presentationDate;
  const hasDateFilter = Boolean(presentationDate.from || presentationDate.to);

  return (
    <div
      className={`flex flex-col gap-3 text-sm text-white ${className ?? ""}`.trim()}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            label={statusLabel}
            value={activeFilter.status}
            onChange={handleStatusChange}
            options={statusOptionsWithLabels}
          />
          <SegmentedControl
            label={ownershipLabel}
            value={activeFilter.ownership}
            onChange={handleOwnershipChange}
            options={ownershipOptionsWithLabels}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Calendar className="h-4 w-4 text-white/60" aria-hidden="true" />
            <label className="flex items-center gap-1">
              <span className="hidden text-white/50 sm:inline">{filtersT("from")}</span>
              <input
                type="date"
                value={presentationDate.from ?? ""}
                onChange={(event) =>
                  handlePresentationDateChange("from", event.target.value)
                }
                className="w-28 rounded border-none bg-transparent text-sm text-white outline-none focus-visible:ring-0"
              />
            </label>
            <span className="text-white/30">—</span>
            <label className="flex items-center gap-1">
              <span className="hidden text-white/50 sm:inline">{filtersT("to")}</span>
              <input
                type="date"
                value={presentationDate.to ?? ""}
                onChange={(event) =>
                  handlePresentationDateChange("to", event.target.value)
                }
                className="w-28 rounded border-none bg-transparent text-sm text-white outline-none focus-visible:ring-0"
              />
            </label>
            {hasDateFilter ? (
              <button
                type="button"
                onClick={handleClearPresentationDates}
                className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label={`${filtersT("reset")} ${filtersT("presentationDate")}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              ref={popoverFloating.refs.setReference}
              {...getPopoverReferenceProps({
                className: `inline-flex w-full items-center justify-between gap-2 rounded-full border px-3 py-1 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  popoverOpen
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/15 text-white"
                    : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                }`,
              })}
            >
              <span className="flex items-center gap-2">
                <Filter
                  className={`h-4 w-4 ${
                    hasActiveAdvancedFilters
                      ? "text-[rgb(var(--primary))]"
                      : "text-white/60"
                  }`}
                  aria-hidden="true"
                />
                <span>{advancedFiltersLabel}</span>
              </span>
              <span className="flex items-center gap-1">
                {advancedFiltersCount > 0 ? (
                  <span className="rounded-full bg-[rgb(var(--primary))]/20 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                    {advancedFiltersCount}
                  </span>
                ) : null}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    popoverOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
            {popoverOpen ? (
              <FloatingPortal>
                <FloatingFocusManager context={popoverFloating.context}>
                  <div
                    ref={popoverFloating.refs.setFloating}
                    style={popoverFloating.floatingStyles}
                    {...getPopoverFloatingProps({
                      className:
                        "animate-in fade-in zoom-in fixed z-[120] w-[min(42rem,calc(100vw-2rem))] space-y-5 rounded-3xl border border-white/10 bg-slate-950/95 p-5 text-sm text-white shadow-xl backdrop-blur-xl",
                    })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {popoverTitle}
                        </h3>
                        <p className="mt-1 text-xs text-white/50">
                          {popoverSubtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPopoverOpen(false)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        aria-label={closeLabel}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {advancedGroups.map((group) => {
                        const isActive = group.id === activeAdvancedTab;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setActiveAdvancedTab(group.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                              isActive
                                ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/20 text-white"
                                : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <span>{group.label}</span>
                            {group.values.length > 0 ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-white/10 text-white/70"
                                }`}
                              >
                                {group.values.length}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.9fr)]">
                      <div className="space-y-4">
                        {activeGroup ? (
                          <MultiSelectCommand
                            key={activeGroup.id}
                            label={activeGroup.label}
                            tooltip={activeGroup.tooltip}
                            helperText={activeGroup.helperText}
                            searchPlaceholder={activeGroup.searchPlaceholder}
                            emptyText={activeGroup.emptyText}
                            clearSelectionLabel={clearSelectionLabel}
                            clearSearchLabel={clearSearchLabel}
                            values={activeGroup.values}
                            options={activeGroup.options}
                            onChange={activeGroup.onChange}
                          />
                        ) : null}
                      </div>
                      <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Filter className="h-4 w-4" aria-hidden="true" />
                          {summaryTitle}
                        </h4>
                        {advancedSummary.length === 0 ? (
                          <p>{summaryEmpty}</p>
                        ) : (
                          <div className="space-y-3">
                            {advancedSummary.map((item) => (
                              <div
                                key={item.id}
                                className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"
                              >
                                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                                  <span className="text-white/70">{item.label}</span>
                                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                                    {item.values.length}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-xs text-white/70">
                                  {item.values.map((value) => (
                                    <span
                                      key={`${item.id}-${value}`}
                                      className="rounded-full bg-white/10 px-2 py-0.5"
                                    >
                                      {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </aside>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-white/60">
                      <button
                        type="button"
                        onClick={handleResetAdvancedFilters}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 font-medium text-white/70 transition hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>{resetAdvancedLabel}</span>
                      </button>
                      <span className="max-w-[18rem] text-right md:text-left">{hintText}</span>
                    </div>
                  </div>
                </FloatingFocusManager>
              </FloatingPortal>
            ) : null}
          </div>
          {filtering ? (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>{applyingFiltersLabel}</span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={onSaveCurrentFilters}
          disabled={savingFilterPreset}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
            savingFilterPreset
              ? "cursor-wait border-white/10 bg-white/10 text-white/60"
              : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          {savingFilterPreset ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {savingFilterPreset
              ? filtersT("savingPreset")
              : filtersT("savePreset")}
          </span>
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
          <Users className="h-4 w-4 text-white/60" aria-hidden="true" />
          <label className="sr-only" htmlFor={presetSelectId}>
            {filtersT("presetsLabel")}
          </label>
          <select
            id={presetSelectId}
            value={selectedPresetId ?? ""}
            onChange={(event) =>
              setSelectedPresetId(
                event.target.value ? event.target.value : null,
              )
            }
            disabled={filterPresetsLoading || filterPresets.length === 0}
            className="flex-1 rounded-md border border-white/20 bg-black/20 px-2 py-1 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:text-white/40"
          >
            {filterPresets.length === 0 ? (
              <option value="">{filtersT("noPresets")}</option>
            ) : (
              <>
                <option value="">{filtersT("selectPresetPlaceholder")}</option>
                {filterPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <button
            type="button"
            onClick={() => onApplyPreset(selectedPresetId)}
            disabled={!selectedPresetId || filterPresetsLoading}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              !selectedPresetId || filterPresetsLoading
                ? "cursor-not-allowed border-white/10 text-white/40"
                : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            {filterPresetsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{filtersT("loadPreset")}</span>
          </button>
        </div>
      </div>
      {summaryItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-white/60">
          {summaryItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"
            >
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium text-white/80">{item.label}</span>
              <span className="text-white/60">{item.count}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
