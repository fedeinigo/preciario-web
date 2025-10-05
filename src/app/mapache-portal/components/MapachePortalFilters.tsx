"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Sparkles,
  User,
  UserMinus,
  Users,
  X,
} from "lucide-react";

import type {
  MapacheDirectness,
  MapacheIntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
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

const OWNERSHIP_OPTIONS: OwnershipFilterValue[] = [
  "all",
  "mine",
  "unassigned",
];

function toggleValue<T extends string>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

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
  statusOptions: MapacheTaskStatus[];
  statusLabel: string;
  needOptions: MapacheNeedFromTeam[];
  directnessOptions: MapacheDirectness[];
  integrationTypeOptions: MapacheIntegrationType[];
  originOptions: MapacheSignalOrigin[];
  assigneeOptions: AssigneeOption[];
  filtersT: (key: string) => string;
  statusT: (key: "all" | "pending" | "in_progress" | "completed") => string;
  needFromTeamT: (value: MapacheNeedFromTeam) => string;
  directnessT: (value: MapacheDirectness) => string;
  integrationTypeT: (value: MapacheIntegrationType) => string;
  originT: (value: MapacheSignalOrigin) => string;
  hasActiveAdvancedFilters: boolean;
  advancedFiltersCount: number;
  ownershipLabel: string;
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

function AdvancedFiltersPopover({
  open,
  onClose,
  children,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  anchorRef: React.RefObject<HTMLElement>;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [portalElement, setPortalElement] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [position, setPosition] = React.useState<{ top: number; right: number }>(
    { top: 0, right: 0 },
  );

  const updatePosition = React.useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      right: Math.max(window.innerWidth - rect.right, 0),
    });
  }, [anchorRef]);

  React.useEffect(() => {
    const element = document.createElement("div");
    element.setAttribute("data-advanced-filters-portal", "true");
    document.body.appendChild(element);
    setPortalElement(element);

    return () => {
      document.body.removeChild(element);
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    updatePosition();

    const handleWindowChange = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [open, onClose, updatePosition]);

  if (!open || !portalElement) return null;

  return createPortal(
    <div
      ref={containerRef}
      style={{ top: position.top, right: position.right }}
      className="fixed z-[100] w-[min(22rem,calc(100vw-2rem))] space-y-4 rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-sm text-white shadow-xl backdrop-blur max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain"
    >
      {children}
    </div>,
    portalElement,
  );
}

const STATUS_ICON_MAP: Record<StatusFilterValue, React.ReactNode> = {
  all: <Sparkles className="h-4 w-4" aria-hidden="true" />,
  PENDING: <Clock className="h-4 w-4" aria-hidden="true" />,
  IN_PROGRESS: <Loader2 className="h-4 w-4" aria-hidden="true" />,
  DONE: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
};

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
  needOptions,
  directnessOptions,
  integrationTypeOptions,
  originOptions,
  assigneeOptions,
  filtersT,
  statusT,
  needFromTeamT,
  directnessT,
  integrationTypeT,
  originT,
  hasActiveAdvancedFilters,
  advancedFiltersCount,
  ownershipLabel,
}: MapachePortalFiltersProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const popoverAnchorRef = React.useRef<HTMLButtonElement | null>(null);

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

  const handleToggleNeed = React.useCallback(
    (value: MapacheNeedFromTeam) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        needFromTeam: toggleValue(prev.needFromTeam, value),
      }));
    },
    [setAdvancedFilters],
  );

  const handleToggleDirectness = React.useCallback(
    (value: MapacheDirectness) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        directness: toggleValue(prev.directness, value),
      }));
    },
    [setAdvancedFilters],
  );

  const handleToggleIntegrationType = React.useCallback(
    (value: MapacheIntegrationType) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        integrationTypes: toggleValue(prev.integrationTypes, value),
      }));
    },
    [setAdvancedFilters],
  );

  const handleToggleOrigin = React.useCallback(
    (value: MapacheSignalOrigin) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        origins: toggleValue(prev.origins, value),
      }));
    },
    [setAdvancedFilters],
  );

  const handleToggleAssignee = React.useCallback(
    (value: string) => {
      setAdvancedFilters((prev) => ({
        ...prev,
        assignees: toggleValue(prev.assignees, value),
      }));
    },
    [setAdvancedFilters],
  );

  const handleResetAdvancedFilters = React.useCallback(() => {
    setAdvancedFilters(createDefaultFiltersState());
    setPopoverOpen(false);
  }, [setAdvancedFilters]);

  const handleClosePopover = React.useCallback(() => {
    setPopoverOpen(false);
  }, []);

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

  const statusOptionsWithLabels = React.useMemo(
    () =>
      ["all" as StatusFilterValue, ...statusOptions].map((option) => ({
        value: option,
        label:
          option === "all"
            ? statusT("all")
            : statusT(
                option === "PENDING"
                  ? "pending"
                  : option === "IN_PROGRESS"
                  ? "in_progress"
                  : "completed",
              ),
        icon: STATUS_ICON_MAP[option as StatusFilterValue],
      })),
    [statusOptions, statusT],
  );

  const ownershipOptionsWithLabels = React.useMemo(
    () =>
      OWNERSHIP_OPTIONS.map((option) => ({
        value: option,
        label:
          option === "all"
            ? statusT("all")
            : option === "mine"
            ? filtersT("mine")
            : filtersT("unassigned"),
        icon: OWNERSHIP_ICON_MAP[option],
      })),
    [filtersT, statusT],
  );

  const presentationDate = advancedFilters.presentationDate;
  const hasDateFilter = Boolean(presentationDate.from || presentationDate.to);

  return (
    <div
      className={`flex flex-col gap-3 text-sm text-white ${className ?? ""}`.trim()}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
          <div className="relative">
            <button
              ref={popoverAnchorRef}
              type="button"
              onClick={() => setPopoverOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                hasActiveAdvancedFilters
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span>{filtersT("open")}</span>
              {advancedFiltersCount > 0 ? (
                <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[rgb(var(--primary))] px-2 text-xs font-semibold text-white">
                  {advancedFiltersCount}
                </span>
              ) : null}
            </button>
            <AdvancedFiltersPopover
              open={popoverOpen}
              onClose={handleClosePopover}
              anchorRef={popoverAnchorRef}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {filtersT("title")}
                </h3>
                <button
                  type="button"
                  onClick={handleResetAdvancedFilters}
                  className="text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
                >
                  {filtersT("reset")}
                </button>
              </div>
              <section className="space-y-2">
                <header className="text-xs uppercase tracking-wide text-white/50">
                  {filtersT("needFromTeam")}
                </header>
                <div className="grid gap-2">
                  {needOptions.map((option) => {
                    const checked = advancedFilters.needFromTeam.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleNeed(option)}
                          className="h-4 w-4 rounded border-white/30 bg-black/30 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                        />
                        <span>{needFromTeamT(option)}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
              <section className="space-y-2">
                <header className="text-xs uppercase tracking-wide text-white/50">
                  {filtersT("directness")}
                </header>
                <div className="grid gap-2">
                  {directnessOptions.map((option) => {
                    const checked = advancedFilters.directness.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleDirectness(option)}
                          className="h-4 w-4 rounded border-white/30 bg-black/30 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                        />
                        <span>{directnessT(option)}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
              <section className="space-y-2">
                <header className="text-xs uppercase tracking-wide text-white/50">
                  {filtersT("integrationType")}
                </header>
                <div className="grid gap-2">
                  {integrationTypeOptions.map((option) => {
                    const checked = advancedFilters.integrationTypes.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleIntegrationType(option)}
                          className="h-4 w-4 rounded border-white/30 bg-black/30 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                        />
                        <span>{integrationTypeT(option)}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
              <section className="space-y-2">
                <header className="text-xs uppercase tracking-wide text-white/50">
                  {filtersT("origin")}
                </header>
                <div className="grid gap-2">
                  {originOptions.map((option) => {
                    const checked = advancedFilters.origins.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleOrigin(option)}
                          className="h-4 w-4 rounded border-white/30 bg-black/30 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                        />
                        <span>{originT(option)}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
              <section className="space-y-2">
                <header className="text-xs uppercase tracking-wide text-white/50">
                  {filtersT("assignee")}
                </header>
                {assigneeOptions.length === 0 ? (
                  <p className="text-xs text-white/60">
                    {filtersT("noAssignees")}
                  </p>
                ) : (
                  <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
                    {assigneeOptions.map((option) => {
                      const checked = advancedFilters.assignees.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className="flex items-center gap-2 rounded-md border border-white/5 bg-black/20 px-3 py-2 text-sm text-white/80"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleAssignee(option.id)}
                            className="h-4 w-4 rounded border-white/30 bg-black/30 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                          />
                          <span className="truncate">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>
            </AdvancedFiltersPopover>
          </div>
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
