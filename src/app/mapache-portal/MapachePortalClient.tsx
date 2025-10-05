"use client";

import * as React from "react";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Settings, Wand2 } from "lucide-react";
import { useSession } from "next-auth/react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { useTranslations } from "@/app/LanguageProvider";

import type {
  MapacheDeliverableType,
  MapacheDirectness,
  MapacheIntegrationOwner,
  MapacheIntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
  MapacheStatusDetails,
  MapacheStatusIndex,
  MapacheTask,
  MapacheTaskStatus,
  MapacheTaskSubstatus,
} from "./types";
import {
  MAPACHE_DELIVERABLE_TYPES,
  MAPACHE_DIRECTNESS,
  MAPACHE_INTEGRATION_OWNERS,
  MAPACHE_INTEGRATION_TYPES,
  MAPACHE_NEEDS_FROM_TEAM,
  MAPACHE_SIGNAL_ORIGINS,
  MAPACHE_TASK_SUBSTATUSES,
  createStatusIndex,
  normalizeMapacheStatus,
  normalizeMapacheTask,
} from "./types";
import MapachePortalFilters from "./components/MapachePortalFilters";
import MapachePortalInsights, {
  type MapachePortalInsightsMetrics,
  type MapachePortalInsightsScope,
  type MapachePortalInsightsWorkloadEntry,
  type NeedMetricKey,
} from "./MapachePortalInsights";
import {
  MAPACHE_PORTAL_DEFAULT_SECTION,
  MAPACHE_PORTAL_NAVIGATE_EVENT,
  MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
  type MapachePortalSection,
  isMapachePortalSection,
} from "./section-events";
import {
  DATE_INPUT_REGEX,
  createDefaultFiltersState,
  createDefaultTaskFilterState,
  type AdvancedFiltersState,
  type PresentationDateFilter,
  type OwnershipFilterValue,
  type StatusFilterValue,
  type TaskFilterState,
} from "./filters";
import {
  normalizeBoardConfig,
  normalizeBoardList,
  type MapacheBoardConfig,
} from "./board-types";

const NEED_OPTIONS: MapacheNeedFromTeam[] = [...MAPACHE_NEEDS_FROM_TEAM];
const DIRECTNESS_OPTIONS: MapacheDirectness[] = [...MAPACHE_DIRECTNESS];
const INTEGRATION_TYPE_OPTIONS: MapacheIntegrationType[] = [
  ...MAPACHE_INTEGRATION_TYPES,
];
const INTEGRATION_TYPES: (MapacheIntegrationType | "")[] = [
  "",
  ...MAPACHE_INTEGRATION_TYPES,
];
const INTEGRATION_OWNERS: (MapacheIntegrationOwner | "")[] = [
  "",
  ...MAPACHE_INTEGRATION_OWNERS,
];
const DELIVERABLE_TYPES: MapacheDeliverableType[] = [...MAPACHE_DELIVERABLE_TYPES];
const ORIGIN_OPTIONS: MapacheSignalOrigin[] = [...MAPACHE_SIGNAL_ORIGINS];
const NEED_METRIC_KEYS: NeedMetricKey[] = [...NEED_OPTIONS, "NONE"];
const SUBSTATUS_OPTIONS: MapacheTaskSubstatus[] = [...MAPACHE_TASK_SUBSTATUSES];
const MS_IN_DAY = 86_400_000;

type BoardColumnDraft = {
  id: string | null;
  title: string;
  statuses: MapacheTaskStatus[];
};

type BoardDraft = {
  id: string;
  name: string;
  columns: BoardColumnDraft[];
};

function createBoardDraft(board: MapacheBoardConfig): BoardDraft {
  return {
    id: board.id,
    name: board.name,
    columns: board.columns
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((column) => ({
        id: column.id,
        title: column.title,
        statuses: [...column.filters.statuses],
      })),
  };
}

function mapDraftToPayload(draft: BoardDraft, statusIndex: MapacheStatusIndex) {
  const allowedStatuses = statusIndex.byKey;
  return {
    name: draft.name.trim(),
    columns: draft.columns.map((column) => ({
      id: column.id ?? undefined,
      title: column.title.trim(),
      filters: {
        statuses: column.statuses.filter((status) => allowedStatuses.has(status)),
      },
    })),
  };
}

function getSuggestedStatuses(
  columns: BoardColumnDraft[],
  orderedStatuses: MapacheTaskStatus[],
): MapacheTaskStatus[] {
  if (orderedStatuses.length === 0) {
    return [];
  }
  const used = new Set<MapacheTaskStatus>();
  columns.forEach((column) => {
    column.statuses.forEach((status) => {
      used.add(status);
    });
  });
  const available = orderedStatuses.filter((status) => !used.has(status));
  if (available.length > 0) {
    return [available[0]!];
  }
  return [orderedStatuses[0]!];
}

const EMAIL_REGEX = /.+@.+\..+/i;
const VIEW_MODE_STORAGE_KEY = "mapache_portal_view_mode";

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

function isValidUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
}

function getDateInputValue(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const [datePart] = trimmed.split("T");
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  const match = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

type MapachePortalClientProps = {
  initialTasks: MapacheTask[];
  heading?: React.ReactNode;
  subheading?: React.ReactNode;
};

type DeliverableFormState = {
  type: MapacheDeliverableType;
  title: string;
  url: string;
};

type FormState = {
  title: string;
  description: string;
  status: MapacheTaskStatus;
  substatus: MapacheTaskSubstatus;
  origin: MapacheSignalOrigin;
  requesterEmail: string;
  clientName: string;
  productKey: string;
  needFromTeam: MapacheNeedFromTeam;
  directness: MapacheDirectness;
  assigneeId: string | null;
  presentationDate: string;
  interlocutorRole: string;
  clientWebsiteUrls: string[];
  pipedriveDealUrl: string;
  clientPain: string;
  managementType: string;
  docsCountApprox: string;
  docsLengthApprox: string;
  integrationType: MapacheIntegrationType | "";
  integrationOwner: MapacheIntegrationOwner | "";
  integrationName: string;
  integrationDocsUrl: string;
  avgMonthlyConversations: string;
  deliverables: DeliverableFormState[];
};

type DeliverableError = {
  title?: string;
  url?: string;
};

type FieldErrorKey = Exclude<keyof FormState, "deliverables">;
type FormErrors = Partial<Record<FieldErrorKey, string>> & {
  deliverables?: DeliverableError[];
};

type StepFieldKey = FieldErrorKey | "deliverables";

const FORM_STEP_LABELS = [
  "Datos generales",
  "Contacto y contexto",
  "Documentación",
  "Integración/Entregables",
] as const;

const FORM_STEP_FIELDS: StepFieldKey[][] = [
  ["title", "clientName", "productKey", "description"],
  [
    "requesterEmail",
    "interlocutorRole",
    "presentationDate",
    "pipedriveDealUrl",
    "clientWebsiteUrls",
    "clientPain",
  ],
  ["managementType", "docsCountApprox", "docsLengthApprox", "avgMonthlyConversations"],
  [
    "integrationType",
    "integrationOwner",
    "integrationName",
    "integrationDocsUrl",
    "deliverables",
  ],
];

type CreateTaskPayload = {
  title: string;
  description: string | null;
  status: MapacheTaskStatus;
  substatus: MapacheTaskSubstatus;
  origin: MapacheSignalOrigin;
  requesterEmail: string;
  clientName: string;
  productKey: string;
  needFromTeam: MapacheNeedFromTeam;
  directness: MapacheDirectness;
  assigneeId: string | null;
  presentationDate: string | null;
  interlocutorRole: string | null;
  clientWebsiteUrls: string[];
  pipedriveDealUrl: string | null;
  clientPain: string | null;
  managementType: string | null;
  docsCountApprox: number | null;
  docsLengthApprox: string | null;
  integrationType: MapacheIntegrationType | null;
  integrationOwner: MapacheIntegrationOwner | null;
  integrationName: string | null;
  integrationDocsUrl: string | null;
  avgMonthlyConversations: number | null;
};

type DeliverableInput = {
  type: MapacheDeliverableType;
  title: string;
  url: string;
};

type NormalizedFormResult = {
  payload: CreateTaskPayload | null;
  deliverables: DeliverableInput[];
  errors: FormErrors;
};

type ValidationMessages = {
  titleRequired: string;
  emailInvalid: string;
  clientNameRequired: string;
  productKeyRequired: string;
  websitesInvalid: string;
  presentationDateInvalid: string;
  urlInvalid: string;
  numberInvalid: string;
  deliverableTitleRequired: string;
  deliverableUrlRequired: string;
};

type MapacheUser = {
  id: string;
  name: string | null;
  email: string;
};

type AssignmentRatios = Record<string, number>;

type AssignmentWeight = { userId: string; weight: number };

const FILTERS_STORAGE_KEY = "mapache_portal_filters";
const ASSIGNMENT_STORAGE_KEY = "mapache_assignment_ratios";

const STATUS_LABEL_KEYS: Record<
  MapacheTaskStatus,
  "pending" | "in_progress" | "completed"
> = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "completed",
};


const STATUS_BADGE_CLASSNAMES: Record<
  "unassigned" | "assigned" | "in_progress" | "completed",
  string
> = {
  unassigned:
    "border-slate-600/60 bg-slate-900/70 text-white/70 backdrop-blur-sm",
  assigned: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  in_progress: "border-amber-400/50 bg-amber-400/10 text-amber-200",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
};

const STATUS_INDICATOR_ACCENT_CLASSNAMES: Record<
  StatusBadgeKey,
  string
> = {
  unassigned: "bg-slate-400",
  assigned: "bg-cyan-400",
  in_progress: "bg-amber-400",
  completed: "bg-emerald-400",
};

type StatusBadgeKey = keyof typeof STATUS_BADGE_CLASSNAMES;
function humanizeStatusKey(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0] ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part)
    .join(" ");
}

function getStatusBadgeKey(
  task: MapacheTask,
  statusIndex: MapacheStatusIndex,
): StatusBadgeKey {
  if (statusIndex.ordered.length === 0) {
    return task.assigneeId ? "assigned" : "unassigned";
  }

  const details = statusIndex.byKey.get(task.status);
  if (!details) {
    return task.assigneeId ? "assigned" : "in_progress";
  }

  const first = statusIndex.ordered[0];
  const last = statusIndex.ordered[statusIndex.ordered.length - 1];

  if (details.key === last.key) {
    return "completed";
  }

  if (details.key === first.key) {
    return task.assigneeId ? "assigned" : "unassigned";
  }

  return "in_progress";
}

function deriveStatusesFromTasks(tasks: MapacheTask[]): MapacheStatusDetails[] {
  const byKey = new Map<string, MapacheStatusDetails>();
  let fallbackOrder = 0;

  tasks.forEach((task) => {
    const key = typeof task.status === "string" ? task.status.trim().toUpperCase() : "";
    if (!key) return;

    if (task.statusDetails) {
      const normalized: MapacheStatusDetails = {
        id: String(task.statusDetails.id),
        key: task.statusDetails.key.trim().toUpperCase(),
        label: task.statusDetails.label.trim(),
        order: task.statusDetails.order,
      };
      byKey.set(normalized.key, normalized);
      return;
    }

    if (!byKey.has(key)) {
      byKey.set(key, {
        id: task.statusId ?? key,
        key,
        label: humanizeStatusKey(key),
        order: fallbackOrder,
      });
      fallbackOrder += 1;
    }
  });

  return Array.from(byKey.values()).sort((a, b) => a.order - b.order);
}

function parseEnumArray<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number][] {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set(allowed);
  const selected = new Set<T[number]>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (allowedSet.has(item as T[number])) {
      selected.add(item as T[number]);
    }
  }
  if (selected.size === 0) return [];
  return allowed.filter((option) => selected.has(option)) as T[number][];
}

function parseAssigneeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    seen.add(trimmed);
  }
  return Array.from(seen);
}

function parsePresentationDate(value: unknown): PresentationDateFilter {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { from: null, to: null };
  }
  const record = value as Record<string, unknown>;
  const from =
    typeof record.from === "string" && DATE_INPUT_REGEX.test(record.from)
      ? record.from
      : null;
  const to =
    typeof record.to === "string" && DATE_INPUT_REGEX.test(record.to)
      ? record.to
      : null;
  return { from, to };
}

function parseStoredAdvancedFilters(value: unknown): AdvancedFiltersState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return createDefaultFiltersState();
  }

  const record = value as Record<string, unknown>;

  return {
    needFromTeam: parseEnumArray(record.needFromTeam, MAPACHE_NEEDS_FROM_TEAM),
    directness: parseEnumArray(record.directness, MAPACHE_DIRECTNESS),
    integrationTypes: parseEnumArray(
      record.integrationTypes,
      MAPACHE_INTEGRATION_TYPES,
    ),
    origins: parseEnumArray(record.origins, MAPACHE_SIGNAL_ORIGINS),
    assignees: parseAssigneeArray(record.assignees),
    presentationDate: parsePresentationDate(record.presentationDate),
  };
}

function parseStatusFilterValue(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): StatusFilterValue {
  if (value === "all") return "all";
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    if (allowedStatuses.includes(upper as MapacheTaskStatus)) {
      return upper as MapacheTaskStatus;
    }
  }
  return "all";
}

function parseOwnershipFilterValue(value: unknown): OwnershipFilterValue {
  if (value === "mine" || value === "unassigned") {
    return value;
  }
  return "all";
}

function parseStoredTaskFilterState(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): TaskFilterState {
  if (typeof value === "string") {
    if (value === "mine" || value === "unassigned") {
      return { status: "all", ownership: value };
    }
    if (value === "all") {
      return createDefaultTaskFilterState();
    }
    const upper = value.trim().toUpperCase();
    if (allowedStatuses.includes(upper as MapacheTaskStatus)) {
      return { status: upper as MapacheTaskStatus, ownership: "all" };
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const status = parseStatusFilterValue(record.status, allowedStatuses);
    const ownership = parseOwnershipFilterValue(record.ownership);
    return { status, ownership };
  }

  return createDefaultTaskFilterState();
}

function parseStoredFiltersSnapshot(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): {
  activeFilter: TaskFilterState;
  advancedFilters: AdvancedFiltersState;
} {
  const defaults = {
    activeFilter: createDefaultTaskFilterState(),
    advancedFilters: createDefaultFiltersState(),
  } as const;

  if (value === null || value === undefined) {
    return { ...defaults };
  }

  if (typeof value === "string") {
    return {
      activeFilter: parseStoredTaskFilterState(value, allowedStatuses),
      advancedFilters: defaults.advancedFilters,
    };
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return { ...defaults };
  }

  const record = value as Record<string, unknown>;

  const rawAdvanced =
    "advancedFilters" in record
      ? record.advancedFilters
      : (value as Record<string, unknown>);

  const advancedFilters = parseStoredAdvancedFilters(rawAdvanced);

  let activeFilter = defaults.activeFilter;
  if ("activeFilter" in record) {
    activeFilter = parseStoredTaskFilterState(
      record.activeFilter,
      allowedStatuses,
    );
  } else if ("filter" in record) {
    activeFilter = parseStoredTaskFilterState(record.filter, allowedStatuses);
  } else if ("status" in record || "ownership" in record) {
    activeFilter = parseStoredTaskFilterState({
      status: record.status,
      ownership: record.ownership,
    }, allowedStatuses);
  }

  return { activeFilter, advancedFilters };
}

function getTaskAssigneeId(task: MapacheTask): string | null {
  if (typeof task.assigneeId === "string") {
    const trimmed = task.assigneeId.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

function getTaskAssigneeEmail(task: MapacheTask): string | null {
  const email = task.assignee?.email;
  if (typeof email === "string") {
    const trimmed = email.trim().toLowerCase();
    return trimmed ? trimmed : null;
  }
  return null;
}

function formatTaskAssigneeLabel(task: MapacheTask): string {
  const name = task.assignee?.name;
  if (typeof name === "string") {
    const trimmed = name.trim();
    if (trimmed) return trimmed;
  }
  const email = task.assignee?.email;
  if (typeof email === "string") {
    const trimmed = email.trim();
    if (trimmed) return trimmed;
  }
  return getTaskAssigneeId(task) ?? "";
}

function getSubstatusKey(
  substatus: MapacheTaskSubstatus
): "backlog" | "waiting_client" | "blocked" {
  switch (substatus) {
    case "WAITING_CLIENT":
      return "waiting_client";
    case "BLOCKED":
      return "blocked";
    case "BACKLOG":
    default:
      return "backlog";
  }
}

type TaskMetaChipTone = "default" | "warning" | "danger" | "success" | "muted";

const TASK_META_TONE_CLASSNAMES: Record<TaskMetaChipTone, string> = {
  default: "border-white/10 bg-white/5 text-white/70",
  warning: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  danger: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  muted: "border-white/10 bg-white/5 text-white/50",
};

const TASK_META_INDICATOR_CLASSNAMES: Record<TaskMetaChipTone, string> = {
  default: "bg-white/60",
  warning: "bg-amber-300",
  danger: "bg-rose-400",
  success: "bg-emerald-300",
  muted: "bg-white/30",
};

function getInitials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  const first = parts[0]!.charAt(0);
  const last = parts[parts.length - 1]!.charAt(0);
  return `${first}${last}`.toUpperCase();
}

type PresentationDateMeta = {
  label: string | null;
  tone: TaskMetaChipTone;
  indicatorClassName: string;
};

function getPresentationDateMeta(
  value: string | null | undefined,
): PresentationDateMeta {
  if (!value) {
    return {
      label: null,
      tone: "muted",
      indicatorClassName: TASK_META_INDICATOR_CLASSNAMES.muted,
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      label: value,
      tone: "muted",
      indicatorClassName: TASK_META_INDICATOR_CLASSNAMES.muted,
    };
  }

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const normalized = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
  const diffDays = Math.round(
    (normalized.getTime() - startOfToday.getTime()) / MS_IN_DAY,
  );

  let tone: TaskMetaChipTone = "success";
  if (diffDays < 0) {
    tone = "danger";
  } else if (diffDays <= 3) {
    tone = "warning";
  } else {
    tone = "success";
  }

  return {
    label: normalized.toLocaleDateString(),
    tone,
    indicatorClassName: TASK_META_INDICATOR_CLASSNAMES[tone],
  };
}

function createDefaultFormState(): FormState {
  return {
    title: "",
    description: "",
    status: "PENDING",
    substatus: "BACKLOG",
    origin: "MANUAL",
    requesterEmail: "",
    clientName: "",
    productKey: "",
    needFromTeam: "OTHER",
    directness: "DIRECT",
    assigneeId: null,
    presentationDate: "",
    interlocutorRole: "",
    clientWebsiteUrls: [],
    pipedriveDealUrl: "",
    clientPain: "",
    managementType: "",
    docsCountApprox: "",
    docsLengthApprox: "",
    integrationType: "",
    integrationOwner: "",
    integrationName: "",
    integrationDocsUrl: "",
    avgMonthlyConversations: "",
    deliverables: [],
  };
}

function isEqualFieldValue<T>(a: T, b: T): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => isEqualFieldValue(value, b[index]!));
  }

  return a === b;
}

function areDeliverablesEqual(
  next: DeliverableInput[],
  prev: DeliverableInput[],
): boolean {
  if (next.length !== prev.length) return false;
  return next.every((deliverable, index) => {
    const previous = prev[index];
    if (!previous) return false;
    return (
      deliverable.type === previous.type &&
      deliverable.title === previous.title &&
      deliverable.url === previous.url
    );
  });
}

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className="rounded-lg border border-white/10 bg-white/5 text-sm text-white/80"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none rounded-lg px-4 py-3 text-sm font-semibold text-white outline-none transition focus-visible:ring-2 focus-visible:ring-white/40">
        <span>{title}</span>
        {description ? (
          <span className="mt-1 block text-xs font-normal text-white/60">
            {description}
          </span>
        ) : null}
      </summary>
      <div className="border-t border-white/10 p-4 pt-3">{children}</div>
    </details>
  );
}

function useTaskFormHandlers({
  setFormState,
  setFormErrors,
}: {
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}) {
  const handleFormChange = React.useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
      setFormErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [setFormErrors, setFormState],
  );

  const handleWebsiteUrlsChange = React.useCallback(
    (value: string) => {
      const urls = value.split("\n").map((url) => url.trim());
      handleFormChange("clientWebsiteUrls", urls);
    },
    [handleFormChange],
  );

  const handleAddDeliverable = React.useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      deliverables: [
        ...prev.deliverables,
        { type: "SCOPE_AND_QUOTE", title: "", url: "" },
      ],
    }));
    setFormErrors((prev) => {
      if (!prev.deliverables) return prev;
      return {
        ...prev,
        deliverables: [...prev.deliverables, {}],
      };
    });
  }, [setFormErrors, setFormState]);

  const handleRemoveDeliverable = React.useCallback(
    (index: number) => {
      setFormState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.filter((_, idx) => idx !== index),
      }));
      setFormErrors((prev) => {
        const { deliverables, ...rest } = prev;
        if (!deliverables) return prev;
        const nextDeliverables = deliverables.filter((_, idx) => idx !== index);
        if (nextDeliverables.length === 0) {
          return rest;
        }
        return {
          ...prev,
          deliverables: nextDeliverables,
        };
      });
    },
    [setFormErrors, setFormState],
  );

  const handleDeliverableChange = React.useCallback(
    <K extends keyof DeliverableFormState>(
      index: number,
      key: K,
      value: DeliverableFormState[K],
    ) => {
      setFormState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((deliverable, idx) =>
          idx === index ? { ...deliverable, [key]: value } : deliverable,
        ),
      }));
      setFormErrors((prev) => {
        if (!prev.deliverables || !prev.deliverables[index]) return prev;
        const nextErrors = prev.deliverables.map((item, idx) =>
          idx === index ? { ...item, [key]: undefined } : item,
        );
        return {
          ...prev,
          deliverables: nextErrors,
        };
      });
    },
    [setFormErrors, setFormState],
  );

  return {
    handleFormChange,
    handleWebsiteUrlsChange,
    handleAddDeliverable,
    handleRemoveDeliverable,
    handleDeliverableChange,
  };
}

function createFormStateFromTask(task: MapacheTask): FormState {
  const base = createDefaultFormState();
  const assigneeEmail =
    typeof task.assignee?.email === "string"
      ? task.assignee.email.trim()
      : "";
  const assigneeIdFromTask =
    typeof task.assigneeId === "string" ? task.assigneeId.trim() : null;
  const assigneeIdentifier = assigneeEmail || assigneeIdFromTask;
  return {
    ...base,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    substatus: task.substatus,
    origin: task.origin,
    requesterEmail: task.requesterEmail ?? "",
    clientName: task.clientName ?? "",
    productKey: task.productKey ?? "",
    needFromTeam: task.needFromTeam ?? base.needFromTeam,
    directness: task.directness ?? base.directness,
    assigneeId: assigneeIdentifier,
    presentationDate: getDateInputValue(task.presentationDate),
    interlocutorRole: task.interlocutorRole ?? "",
    clientWebsiteUrls: Array.isArray(task.clientWebsiteUrls)
      ? task.clientWebsiteUrls
      : base.clientWebsiteUrls,
    pipedriveDealUrl: task.pipedriveDealUrl ?? "",
    clientPain: task.clientPain ?? "",
    managementType: task.managementType ?? "",
    docsCountApprox:
      typeof task.docsCountApprox === "number"
        ? String(task.docsCountApprox)
        : "",
    docsLengthApprox: task.docsLengthApprox ?? "",
    integrationType: task.integrationType ?? "",
    integrationOwner: task.integrationOwner ?? "",
    integrationName: task.integrationName ?? "",
    integrationDocsUrl: task.integrationDocsUrl ?? "",
    avgMonthlyConversations:
      typeof task.avgMonthlyConversations === "number"
        ? String(task.avgMonthlyConversations)
        : "",
    deliverables: Array.isArray(task.deliverables)
      ? task.deliverables.map((deliverable) => ({
          type: deliverable.type,
          title: deliverable.title,
          url: deliverable.url,
        }))
      : base.deliverables,
  };
}

function normalizeFormState(
  state: FormState,
  messages: ValidationMessages,
): NormalizedFormResult {
  const errors: FormErrors = {};
  const deliverableErrors: DeliverableError[] = [];

  const trimmedTitle = state.title.trim();
  const trimmedDescription = state.description.trim();
  const trimmedRequesterEmail = state.requesterEmail.trim();
  const trimmedClientName = state.clientName.trim();
  const trimmedProductKey = state.productKey.trim();
  const trimmedInterlocutorRole = state.interlocutorRole.trim();
  const trimmedPipedriveDealUrl = state.pipedriveDealUrl.trim();
  const trimmedClientPain = state.clientPain.trim();
  const trimmedManagementType = state.managementType.trim();
  const trimmedDocsLengthApprox = state.docsLengthApprox.trim();
  const trimmedIntegrationName = state.integrationName.trim();
  const trimmedIntegrationDocsUrl = state.integrationDocsUrl.trim();
  const trimmedAssigneeId =
    typeof state.assigneeId === "string" ? state.assigneeId.trim() : "";

  let finalTitle = trimmedTitle;
  const fallbackParts: string[] = [];
  if (trimmedClientName) fallbackParts.push(trimmedClientName);
  const suffixParts: string[] = [];
  if (trimmedProductKey) suffixParts.push(trimmedProductKey);
  if (state.needFromTeam) suffixParts.push(state.needFromTeam);
  if (suffixParts.length) {
    const suffix = suffixParts.join("/");
    if (suffix) fallbackParts.push(suffix);
  }
  if (!finalTitle && fallbackParts.length) {
    finalTitle = fallbackParts.join(" — ");
  }

  if (!finalTitle) {
    errors.title = messages.titleRequired;
  }

  if (!trimmedRequesterEmail) {
    errors.requesterEmail = messages.emailInvalid;
  } else if (!isValidEmail(trimmedRequesterEmail)) {
    errors.requesterEmail = messages.emailInvalid;
  }

  if (!trimmedClientName) {
    errors.clientName = messages.clientNameRequired;
  }

  if (!trimmedProductKey) {
    errors.productKey = messages.productKeyRequired;
  }

  const normalizedWebsiteUrls = state.clientWebsiteUrls
    .map((url) => url.trim())
    .filter((url) => Boolean(url));

  for (const url of normalizedWebsiteUrls) {
    if (!isValidUrl(url)) {
      errors.clientWebsiteUrls = messages.websitesInvalid;
      break;
    }
  }

  let presentationDate: string | null = null;
  if (state.presentationDate) {
    const isoCandidate = `${state.presentationDate}T00:00:00.000Z`;
    const date = new Date(isoCandidate);
    if (Number.isNaN(date.getTime())) {
      errors.presentationDate = messages.presentationDateInvalid;
    } else {
      presentationDate = date.toISOString();
    }
  }

  let pipedriveDealUrl: string | null = null;
  if (trimmedPipedriveDealUrl) {
    if (!isValidUrl(trimmedPipedriveDealUrl)) {
      errors.pipedriveDealUrl = messages.urlInvalid;
    } else {
      pipedriveDealUrl = trimmedPipedriveDealUrl;
    }
  }

  let integrationDocsUrl: string | null = null;
  if (trimmedIntegrationDocsUrl) {
    if (!isValidUrl(trimmedIntegrationDocsUrl)) {
      errors.integrationDocsUrl = messages.urlInvalid;
    } else {
      integrationDocsUrl = trimmedIntegrationDocsUrl;
    }
  }

  const docsCountValue = state.docsCountApprox.trim();
  let docsCountApprox: number | null = null;
  if (docsCountValue) {
    const parsed = Number(docsCountValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.docsCountApprox = messages.numberInvalid;
    } else {
      docsCountApprox = Math.floor(parsed);
    }
  }

  const avgMonthlyValue = state.avgMonthlyConversations.trim();
  let avgMonthlyConversations: number | null = null;
  if (avgMonthlyValue) {
    const parsed = Number(avgMonthlyValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.avgMonthlyConversations = messages.numberInvalid;
    } else {
      avgMonthlyConversations = Math.floor(parsed);
    }
  }

  const normalizedDeliverables: DeliverableInput[] = [];
  state.deliverables.forEach((deliverable, index) => {
    const trimmedDeliverableTitle = deliverable.title.trim();
    const trimmedDeliverableUrl = deliverable.url.trim();
    const hasContent = Boolean(
      trimmedDeliverableTitle || trimmedDeliverableUrl,
    );

    const currentErrors: DeliverableError = {};

    if (!hasContent) {
      return;
    }

    if (!trimmedDeliverableTitle) {
      currentErrors.title = messages.deliverableTitleRequired;
    }

    if (!trimmedDeliverableUrl) {
      currentErrors.url = messages.deliverableUrlRequired;
    } else if (!isValidUrl(trimmedDeliverableUrl)) {
      currentErrors.url = messages.urlInvalid;
    }

    if (Object.keys(currentErrors).length > 0) {
      deliverableErrors[index] = currentErrors;
      return;
    }

    normalizedDeliverables.push({
      type: deliverable.type,
      title: trimmedDeliverableTitle,
      url: trimmedDeliverableUrl,
    });
  });

  if (deliverableErrors.length) {
    errors.deliverables = deliverableErrors;
  }

  const hasErrors = Object.keys(errors).length > 0;

  const normalizedAssigneeId =
    trimmedAssigneeId && trimmedAssigneeId.length > 0
      ? trimmedAssigneeId
      : null;

  if (hasErrors) {
    return { payload: null, deliverables: normalizedDeliverables, errors };
  }

  const payload: CreateTaskPayload = {
    title: finalTitle,
    description: trimmedDescription ? trimmedDescription : null,
    status: state.status,
    substatus: state.substatus,
    origin: "MANUAL",
    requesterEmail: trimmedRequesterEmail,
    clientName: trimmedClientName,
    productKey: trimmedProductKey,
    needFromTeam: state.needFromTeam,
    directness: state.directness,
    assigneeId: normalizedAssigneeId,
    presentationDate,
    interlocutorRole: trimmedInterlocutorRole || null,
    clientWebsiteUrls: normalizedWebsiteUrls,
    pipedriveDealUrl,
    clientPain: trimmedClientPain || null,
    managementType: trimmedManagementType || null,
    docsCountApprox,
    docsLengthApprox: trimmedDocsLengthApprox || null,
    integrationType: state.integrationType || null,
    integrationOwner: state.integrationOwner || null,
    integrationName: trimmedIntegrationName || null,
    integrationDocsUrl,
    avgMonthlyConversations,
  };

  return { payload, deliverables: normalizedDeliverables, errors };
}

function formatAssigneeOption(user: MapacheUser) {
  const name = user.name?.trim();
  return name && name.length > 0 ? name : user.email;
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = roundToTwoDecimals(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function ratioToPercentageInput(ratio: number): string {
  return formatPercentage(ratio * 100);
}

function parsePercentageInput(value: string): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeAssignmentWeights(
  ratios: AssignmentRatios,
  users: MapacheUser[],
): AssignmentWeight[] {
  if (users.length === 0) return [];
  const entries = users.map((user) => ({
    userId: user.id,
    weight:
      typeof ratios[user.id] === "number" && Number.isFinite(ratios[user.id])
        ? ratios[user.id]
        : 0,
  }));

  const positive = entries.filter((entry) => entry.weight > 0);
  if (positive.length === 0) {
    const equalWeight = 1 / users.length;
    return users.map((user) => ({ userId: user.id, weight: equalWeight }));
  }

  const total = positive.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    const equalWeight = 1 / positive.length;
    return positive.map((entry) => ({
      userId: entry.userId,
      weight: equalWeight,
    }));
  }

  return positive.map((entry) => ({
    userId: entry.userId,
    weight: entry.weight / total,
  }));
}

function createAssignmentSequence(
  count: number,
  weights: AssignmentWeight[],
): string[] {
  if (count <= 0 || weights.length === 0) return [];
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  const normalized =
    total > 0
      ? weights.map((entry) => ({
          userId: entry.userId,
          weight: entry.weight / total,
        }))
      : weights.map((entry) => ({
          userId: entry.userId,
          weight: 1 / weights.length,
        }));

  const assignedCounts = new Array(normalized.length).fill(0);
  const result: string[] = [];

  for (let index = 0; index < count; index += 1) {
    let chosenIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let candidate = 0; candidate < normalized.length; candidate += 1) {
      const weight = normalized[candidate]!.weight;
      if (weight <= 0) continue;
      const score = (assignedCounts[candidate]! + 1) / weight;
      if (score < bestScore) {
        bestScore = score;
        chosenIndex = candidate;
      }
    }
    assignedCounts[chosenIndex] += 1;
    result.push(normalized[chosenIndex]!.userId);
  }

  return result;
}

export default function MapachePortalClient({
  initialTasks,
  heading,
  subheading,
}: MapachePortalClientProps) {
  const { data: session } = useSession();
  const t = useTranslations("mapachePortal");
  const statusT = useTranslations("mapachePortal.statuses");
  const statusBadgeT = useTranslations("mapachePortal.statusBadges");
  const substatusT = useTranslations("mapachePortal.substatuses");
  const formT = useTranslations("mapachePortal.form");
  const toastT = useTranslations("mapachePortal.toast");
  const validationT = useTranslations("mapachePortal.validation");
  const emptyT = useTranslations("mapachePortal.empty");
  const actionsT = useTranslations("mapachePortal.actions");
  const filtersT = useTranslations("mapachePortal.filters");
  const assignmentT = useTranslations("mapachePortal.assignment");
  const settingsT = useTranslations("mapachePortal.settings");
  const boardsT = useTranslations("mapachePortal.boards");
  const boardsToastT = useTranslations("mapachePortal.boards.toast");
  const needFromTeamTranslations = useTranslations(
    "mapachePortal.enums.needFromTeam",
  );
  const directnessTranslations = useTranslations(
    "mapachePortal.enums.directness",
  );
  const integrationTypeTranslations = useTranslations(
    "mapachePortal.enums.integrationType",
  );
  const integrationOwnerTranslations = useTranslations(
    "mapachePortal.enums.integrationOwner",
  );
  const originTranslations = useTranslations("mapachePortal.enums.origin");
  const deliverableTypeTranslations = useTranslations(
    "mapachePortal.enums.deliverableType",
  );

  const needFromTeamT = React.useCallback(
    (value: MapacheNeedFromTeam) => needFromTeamTranslations(value),
    [needFromTeamTranslations],
  );

  const directnessT = React.useCallback(
    (value: MapacheDirectness) => directnessTranslations(value),
    [directnessTranslations],
  );

  const integrationTypeT = React.useCallback(
    (value: MapacheIntegrationType) => integrationTypeTranslations(value),
    [integrationTypeTranslations],
  );

  const integrationOwnerT = React.useCallback(
    (value: MapacheIntegrationOwner) => integrationOwnerTranslations(value),
    [integrationOwnerTranslations],
  );

  const originT = React.useCallback(
    (value: MapacheSignalOrigin) => originTranslations(value),
    [originTranslations],
  );

  const deliverableTypeT = React.useCallback(
    (value: MapacheDeliverableType) => deliverableTypeTranslations(value),
    [deliverableTypeTranslations],
  );

  const [statuses, setStatuses] = React.useState<MapacheStatusDetails[]>(() =>
    deriveStatusesFromTasks(Array.isArray(initialTasks) ? initialTasks : []),
  );

  const statusIndex = React.useMemo(() => createStatusIndex(statuses), [statuses]);

  const statusKeys = React.useMemo(
    () => statusIndex.ordered.map((status) => status.key),
    [statusIndex],
  );

  const formatStatusLabel = React.useCallback(
    (status: MapacheTaskStatus) => {
      const match = statusIndex.byKey.get(status);
      if (match) return match.label;
      return humanizeStatusKey(status);
    },
    [statusIndex],
  );

  React.useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    async function fetchStatuses() {
      try {
        const response = await fetch(`/api/mapache/statuses`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as { statuses?: unknown };
        const loaded = Array.isArray(data?.statuses)
          ? data.statuses
              .map(normalizeMapacheStatus)
              .filter(
                (status): status is MapacheStatusDetails => status !== null,
              )
          : [];
        if (!cancelled && loaded.length > 0) {
          setStatuses(loaded);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error(error);
      }
    }

    void fetchStatuses();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, []);

  const [tasks, setTasks] = React.useState<MapacheTask[]>(() =>
    Array.isArray(initialTasks) ? initialTasks : [],
  );

  React.useEffect(() => {
    setTasks((prev) =>
      prev.map((task) => {
        const match = statusIndex.byKey.get(task.status);
        if (!match) {
          return task;
        }

        const nextStatusId = task.statusId ?? match.id;
        const needsDetails =
          !task.statusDetails ||
          task.statusDetails.id !== match.id ||
          task.statusDetails.label !== match.label ||
          task.statusDetails.order !== match.order;
        const needsId = task.statusId !== nextStatusId;
        const needsKey = task.status !== match.key;

        if (!needsDetails && !needsId && !needsKey) {
          return task;
        }

        return {
          ...task,
          status: match.key,
          statusId: nextStatusId,
          statusDetails: match,
        };
      }),
    );
  }, [statusIndex]);
  const [activeFilter, setActiveFilter] = React.useState<TaskFilterState>(
    () => createDefaultTaskFilterState(),
  );
  const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(
    () => createDefaultFiltersState(),
  );
  const [filtersHydrated, setFiltersHydrated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"lista" | "tablero">(
    "lista",
  );
  const [viewModeHydrated, setViewModeHydrated] = React.useState(false);
  const [insightsScope, setInsightsScope] =
    React.useState<MapachePortalInsightsScope>("filtered");
  const [activeSection, setActiveSection] =
    React.useState<MapachePortalSection>(MAPACHE_PORTAL_DEFAULT_SECTION);

  const [assignmentRatios, setAssignmentRatios] = React.useState<AssignmentRatios>({});
  const [ratiosLoaded, setRatiosLoaded] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [assignmentDraft, setAssignmentDraft] = React.useState<Record<string, string>>({});
  const [autoAssigning, setAutoAssigning] = React.useState(false);

  const [settingsTab, setSettingsTab] = React.useState<"assignment" | "boards">(
    "assignment",
  );
  const [boards, setBoards] = React.useState<MapacheBoardConfig[]>([]);
  const [boardsLoading, setBoardsLoading] = React.useState(false);
  const [boardsError, setBoardsError] = React.useState<string | null>(null);
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);
  const [boardDraft, setBoardDraft] = React.useState<BoardDraft | null>(null);
  const [boardDraftError, setBoardDraftError] = React.useState<string | null>(
    null,
  );
  const [boardPendingDeletion, setBoardPendingDeletion] = React.useState<
    string | null
  >(null);
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(
    null,
  );
  const [savingBoard, setSavingBoard] = React.useState(false);
  const [creatingBoard, setCreatingBoard] = React.useState(false);
  const [reorderingBoards, setReorderingBoards] = React.useState(false);

  const [showForm, setShowForm] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formState, setFormState] = React.useState<FormState>(
    () => createDefaultFormState(),
  );
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const [mapacheUsers, setMapacheUsers] = React.useState<MapacheUser[]>([]);
  const [assigneesLoading, setAssigneesLoading] = React.useState(false);
  const [assigneesError, setAssigneesError] = React.useState<string | null>(
    null,
  );

  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(
    null,
  );
  const [deletingTaskId, setDeletingTaskId] = React.useState<string | null>(
    null,
  );
  const [pendingDeletion, setPendingDeletion] = React.useState<string | null>(
    null,
  );
  const [selectedTask, setSelectedTask] = React.useState<MapacheTask | null>(
    null,
  );
  const [selectedTaskFormState, setSelectedTaskFormState] = React.useState<FormState>(
    () => createDefaultFormState(),
  );
  const [selectedTaskFormErrors, setSelectedTaskFormErrors] = React.useState<FormErrors>({});
  const [selectedTaskSubmitting, setSelectedTaskSubmitting] = React.useState(false);
  const selectedTaskInitialPayloadRef = React.useRef<CreateTaskPayload | null>(null);
  const selectedTaskInitialDeliverablesRef = React.useRef<DeliverableInput[]>([]);

  const assigneesErrorMessage = formT("assigneeLoadError");

  const assigneeLabelMap = React.useMemo(() => {
    const entries = new Map<string, string>();

    mapacheUsers.forEach((user) => {
      const name = typeof user.name === "string" ? user.name.trim() : "";
      if (name) {
        entries.set(user.id, name);
        return;
      }
      const email = typeof user.email === "string" ? user.email.trim() : "";
      entries.set(user.id, email || user.id);
    });

    return entries;
  }, [mapacheUsers]);

  const boardLoadErrorMessage = boardsT("loadError");

  const loadBoards = React.useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setBoardsLoading(true);
        setBoardsError(null);
      }
      try {
        const response = await fetch(`/api/mapache/boards`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as { boards?: unknown };
        const normalized = normalizeBoardList(data?.boards, statusIndex);
        setBoards(normalized);
        setBoardsError(null);
      } catch (error) {
        console.error(error);
        setBoardsError(boardLoadErrorMessage);
      } finally {
        if (!silent) {
          setBoardsLoading(false);
        }
      }
    },
    [boardLoadErrorMessage, statusIndex],
  );

  React.useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  React.useEffect(() => {
    if (boards.length === 0) {
      setActiveBoardId(null);
      return;
    }
    setActiveBoardId((prev) => {
      if (prev && boards.some((board) => board.id === prev)) {
        return prev;
      }
      return boards[0]!.id;
    });
  }, [boards]);

  React.useEffect(() => {
    if (!activeBoardId) {
      setBoardDraft(null);
      setBoardDraftError(null);
      setBoardPendingDeletion(null);
      return;
    }
    const board = boards.find((item) => item.id === activeBoardId);
    if (!board) {
      setBoardDraft(null);
      setBoardDraftError(null);
      setBoardPendingDeletion(null);
      return;
    }
    setBoardDraft(createBoardDraft(board));
    setBoardDraftError(null);
    setBoardPendingDeletion(null);
  }, [activeBoardId, boards]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const storedViewMode = window.localStorage.getItem(
      VIEW_MODE_STORAGE_KEY,
    );
    if (storedViewMode === "lista" || storedViewMode === "tablero") {
      setViewMode(storedViewMode);
    }
    setViewModeHydrated(true);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !viewModeHydrated) return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode, viewModeHydrated]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSectionNavigation = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (isMapachePortalSection(detail)) {
        setActiveSection(detail);
      }
    };

    window.addEventListener(
      MAPACHE_PORTAL_NAVIGATE_EVENT,
      handleSectionNavigation as EventListener,
    );

    return () => {
      window.removeEventListener(
        MAPACHE_PORTAL_NAVIGATE_EVENT,
        handleSectionNavigation as EventListener,
      );
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent<MapachePortalSection>(
        MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
        {
          detail: activeSection,
        },
      ),
    );
  }, [activeSection]);

  const validationMessages = React.useMemo(
    () => ({
      titleRequired: formT("titleRequired"),
      emailInvalid: validationT("emailInvalid"),
      clientNameRequired: validationT("clientNameRequired"),
      productKeyRequired: validationT("productKeyRequired"),
      websitesInvalid: validationT("websitesInvalid"),
      presentationDateInvalid: validationT("presentationDateInvalid"),
      urlInvalid: validationT("urlInvalid"),
      numberInvalid: validationT("numberInvalid"),
      deliverableTitleRequired: validationT("deliverableTitleRequired"),
      deliverableUrlRequired: validationT("deliverableUrlRequired"),
    }),
    [formT, validationT],
  );

  const unspecifiedOptionLabel = formT("unspecifiedOption");
  const createTaskFormId = React.useId();
  const totalSteps = FORM_STEP_FIELDS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const currentUserId = React.useMemo(() => {
    const id = session?.user?.id;
    if (typeof id === "string" && id.trim()) return id;
    if (typeof id === "number") return String(id);
    return null;
  }, [session?.user?.id]);

  const currentUserEmail = React.useMemo(() => {
    const email = session?.user?.email;
    if (typeof email === "string" && email.trim()) {
      return email.trim().toLowerCase();
    }
    return null;
  }, [session?.user?.email]);

  const loadTasks = React.useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setFetchError(null);
      try {
        const response = await fetch("/api/mapache/tasks", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const nextTasks = Array.isArray(payload)
          ? payload
              .map((task) => normalizeMapacheTask(task, statusIndex))
              .filter((task): task is MapacheTask => task !== null)
          : [];
        setTasks(nextTasks);
      } catch (error) {
        setFetchError((error as Error).message);
        toast.error(toastT("loadError"));
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [statusIndex, toastT],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        const { activeFilter: nextFilter, advancedFilters: nextAdvanced } =
          parseStoredFiltersSnapshot(parsed, statusKeys);
        setActiveFilter(nextFilter);
        setAdvancedFilters(nextAdvanced);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFiltersHydrated(true);
    }
  }, [statusKeys]);

  React.useEffect(() => {
    if (!filtersHydrated) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          activeFilter,
          advancedFilters,
        }),
      );
    } catch (error) {
      console.error(error);
    }
  }, [activeFilter, advancedFilters, filtersHydrated]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const entries = Object.entries(parsed).filter(
            (entry): entry is [string, number] => {
              const value = entry[1];
              return typeof value === "number" && Number.isFinite(value) && value > 0;
            },
          );
          if (entries.length > 0) {
            const total = entries.reduce((sum, [, value]) => sum + value, 0);
            if (total > 0) {
              setAssignmentRatios(
                Object.fromEntries(
                  entries.map(([id, value]) => [id, value / total] as const),
                ),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRatiosLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!ratiosLoaded) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        ASSIGNMENT_STORAGE_KEY,
        JSON.stringify(assignmentRatios),
      );
    } catch (error) {
      console.error(error);
    }
  }, [assignmentRatios, ratiosLoaded]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  React.useEffect(() => {
    setTasks(Array.isArray(initialTasks) ? initialTasks : []);
  }, [initialTasks]);

  React.useEffect(() => {
    setAssignmentRatios((prev) => {
      if (mapacheUsers.length === 0) return prev;
      const allowed = new Set(mapacheUsers.map((user) => user.id));
      const entries = Object.entries(prev).filter(([id, value]) => {
        return (
          allowed.has(id) && typeof value === "number" && Number.isFinite(value)
        );
      });
      if (entries.length === Object.keys(prev).length) {
        return prev;
      }
      if (entries.length === 0) {
        return {};
      }
      const total = entries.reduce((sum, [, value]) => sum + value, 0);
      if (total <= 0) {
        return {};
      }
      return Object.fromEntries(
        entries.map(([id, value]) => [id, value / total] as const),
      );
    });
  }, [mapacheUsers]);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchAssignees() {
      setAssigneesLoading(true);
      setAssigneesError(null);
      try {
        const response = await fetch("/api/mapache/team", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(payload)) {
          const normalized = payload
            .map((item) => {
              if (typeof item !== "object" || item === null) return null;
              const record = item as Record<string, unknown>;
              if (typeof record.id !== "string") return null;
              if (typeof record.email !== "string") return null;
              return {
                id: record.id,
                email: record.email,
                name: typeof record.name === "string" ? record.name : null,
              } as MapacheUser;
            })
            .filter((user): user is MapacheUser => user !== null);
          if (!cancelled) {
            setMapacheUsers(normalized);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setAssigneesError(assigneesErrorMessage);
        }
      } finally {
        if (!cancelled) {
          setAssigneesLoading(false);
        }
      }
    }

    fetchAssignees();

    return () => {
      cancelled = true;
    };
  }, [assigneesErrorMessage]);

  const baseFilteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (
        activeFilter.status !== "all" &&
        task.status !== activeFilter.status
      ) {
        return false;
      }

      if (activeFilter.ownership === "unassigned") {
        return !getTaskAssigneeId(task);
      }

      if (activeFilter.ownership === "mine") {
        if (!currentUserId && !currentUserEmail) {
          return false;
        }
        const assigneeId = getTaskAssigneeId(task);
        if (assigneeId && currentUserId && assigneeId === currentUserId) {
          return true;
        }
        const assigneeEmail = getTaskAssigneeEmail(task);
        if (
          assigneeEmail &&
          currentUserEmail &&
          assigneeEmail === currentUserEmail
        ) {
          return true;
        }
        return false;
      }

      return true;
    });
  }, [activeFilter, currentUserEmail, currentUserId, tasks]);

  const normalizedAdvancedFilters = React.useMemo(() => {
    const needSet = new Set<MapacheNeedFromTeam>(advancedFilters.needFromTeam);
    const directnessSet = new Set<MapacheDirectness>(advancedFilters.directness);
    const integrationTypeSet = new Set<MapacheIntegrationType>(
      advancedFilters.integrationTypes,
    );
    const originSet = new Set<MapacheSignalOrigin>(advancedFilters.origins);
    const assigneeIds = advancedFilters.assignees
      .map((id) => id.trim())
      .filter((id) => id);
    const assigneeSet = new Set<string>(assigneeIds);
    const fromDate =
      typeof advancedFilters.presentationDate.from === "string" &&
      DATE_INPUT_REGEX.test(advancedFilters.presentationDate.from)
        ? advancedFilters.presentationDate.from
        : null;
    const toDate =
      typeof advancedFilters.presentationDate.to === "string" &&
      DATE_INPUT_REGEX.test(advancedFilters.presentationDate.to)
        ? advancedFilters.presentationDate.to
        : null;
    const hasAny =
      needSet.size > 0 ||
      directnessSet.size > 0 ||
      integrationTypeSet.size > 0 ||
      originSet.size > 0 ||
      assigneeSet.size > 0 ||
      Boolean(fromDate) ||
      Boolean(toDate);
    const activeCount =
      needSet.size +
      directnessSet.size +
      integrationTypeSet.size +
      originSet.size +
      assigneeSet.size +
      (fromDate ? 1 : 0) +
      (toDate ? 1 : 0);

    return {
      needSet,
      directnessSet,
      integrationTypeSet,
      originSet,
      assigneeSet,
      fromDate,
      toDate,
      hasAny,
      activeCount,
    } as const;
  }, [advancedFilters]);

  const filteredTasks = React.useMemo(() => {
    if (!normalizedAdvancedFilters.hasAny) return baseFilteredTasks;

    const {
      needSet,
      directnessSet,
      integrationTypeSet,
      originSet,
      assigneeSet,
      fromDate,
      toDate,
    } = normalizedAdvancedFilters;

    return baseFilteredTasks.filter((task) => {
      if (needSet.size > 0) {
        if (!task.needFromTeam || !needSet.has(task.needFromTeam)) return false;
      }

      if (directnessSet.size > 0) {
        if (!task.directness || !directnessSet.has(task.directness)) return false;
      }

      if (integrationTypeSet.size > 0) {
        if (!task.integrationType || !integrationTypeSet.has(task.integrationType)) {
          return false;
        }
      }

      if (originSet.size > 0 && !originSet.has(task.origin)) {
        return false;
      }

      if (assigneeSet.size > 0) {
        const assigneeId = getTaskAssigneeId(task);
        if (!assigneeId || !assigneeSet.has(assigneeId)) return false;
      }

      if (fromDate || toDate) {
        const taskDate = getDateInputValue(task.presentationDate);
        if (fromDate && (!taskDate || taskDate < fromDate)) return false;
        if (toDate && (!taskDate || taskDate > toDate)) return false;
      }

      return true;
    });
  }, [baseFilteredTasks, normalizedAdvancedFilters]);

  const computeInsights = React.useCallback(
    (source: MapacheTask[]): MapachePortalInsightsMetrics => {
      const statusTotals: Record<MapacheTaskStatus, number> = {};
      statusKeys.forEach((status) => {
        statusTotals[status] = 0;
      });
      const substatusTotals: Record<MapacheTaskSubstatus, number> = {
        BACKLOG: 0,
        WAITING_CLIENT: 0,
        BLOCKED: 0,
      };
      const needTotals = NEED_METRIC_KEYS.reduce(
        (acc, key) => {
          acc[key] = 0;
          return acc;
        },
        {} as Record<NeedMetricKey, number>,
      );

      const workloadMap = new Map<string, MapachePortalInsightsWorkloadEntry>();
      const upcomingMap = new Map<string, { date: Date; value: number }>();
      let dueSoonCount = 0;
      let overdueCount = 0;

      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      source.forEach((task) => {
        statusTotals[task.status] = (statusTotals[task.status] ?? 0) + 1;
        substatusTotals[task.substatus] =
          (substatusTotals[task.substatus] ?? 0) + 1;

        const needKey: NeedMetricKey = task.needFromTeam
          ? (NEED_OPTIONS.includes(task.needFromTeam)
              ? task.needFromTeam
              : "NONE")
          : "NONE";
        needTotals[needKey] = (needTotals[needKey] ?? 0) + 1;

        const assigneeId = getTaskAssigneeId(task);
        const workloadKey = assigneeId ?? "__unassigned__";
        const existingWorkload = workloadMap.get(workloadKey);
        if (existingWorkload) {
          existingWorkload.value += 1;
        } else {
          const label =
            assigneeId === null
              ? null
              : assigneeLabelMap.get(assigneeId) ||
                formatTaskAssigneeLabel(task) ||
                assigneeId;

          workloadMap.set(workloadKey, {
            key: workloadKey,
            label,
            value: 1,
            isUnassigned: assigneeId === null,
          });
        }

        if (task.presentationDate) {
          const parsed = new Date(task.presentationDate);
          if (!Number.isNaN(parsed.getTime())) {
            const normalized = new Date(
              parsed.getFullYear(),
              parsed.getMonth(),
              parsed.getDate(),
            );
            const diffDays = Math.round(
              (normalized.getTime() - startOfToday.getTime()) / MS_IN_DAY,
            );
            if (diffDays < 0) {
              overdueCount += 1;
            } else if (diffDays <= 7) {
              dueSoonCount += 1;
            }

            const bucketKey = normalized.toISOString();
            const bucket = upcomingMap.get(bucketKey);
            if (bucket) {
              bucket.value += 1;
            } else {
              upcomingMap.set(bucketKey, { date: normalized, value: 1 });
            }
          }
        }
      });

      const workload = Array.from(workloadMap.values())
        .sort((a, b) => {
          if (b.value !== a.value) return b.value - a.value;
          const labelA = a.label ?? "";
          const labelB = b.label ?? "";
          return labelA.localeCompare(labelB, "es", { sensitivity: "base" });
        })
        .slice(0, 12);

      const upcomingDue = Array.from(upcomingMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, { date, value }]) => ({
          key,
          date: date.toISOString(),
          value,
        }))
        .slice(0, 12);

      return {
        total: source.length,
        dueSoonCount,
        overdueCount,
        statusTotals,
        substatusTotals,
        needTotals,
        workload,
        upcomingDue,
      };
    },
    [assigneeLabelMap, statusKeys],
  );

  const filteredInsightsMetrics = React.useMemo(
    () => computeInsights(filteredTasks),
    [computeInsights, filteredTasks],
  );

  const allInsightsMetrics = React.useMemo(
    () => computeInsights(tasks),
    [computeInsights, tasks],
  );

  const insightsMetrics = React.useMemo(
    () => ({
      filtered: filteredInsightsMetrics,
      all: allInsightsMetrics,
    }),
    [allInsightsMetrics, filteredInsightsMetrics],
  );

  const activeBoard = React.useMemo(() => {
    if (!activeBoardId) return null;
    return boards.find((board) => board.id === activeBoardId) ?? null;
  }, [activeBoardId, boards]);

  const boardColumnsWithTasks = React.useMemo(() => {
    if (!activeBoard) return [];
    return activeBoard.columns.map((column) => {
      const statuses = column.filters.statuses;
      const tasksForColumn = filteredTasks.filter((task) =>
        statuses.includes(task.status),
      );
      return {
        id: column.id,
        title: column.title,
        statuses,
        tasks: tasksForColumn,
      };
    });
  }, [activeBoard, filteredTasks]);

  const hasActiveAdvancedFilters = normalizedAdvancedFilters.hasAny;
  const advancedFiltersCount = normalizedAdvancedFilters.activeCount;
  const hasActiveQuickFilter =
    activeFilter.status !== "all" || activeFilter.ownership !== "all";
  const showFilteredEmptyMessage =
    hasActiveQuickFilter || hasActiveAdvancedFilters;

  const assigneeOptions = React.useMemo(() => {
    const entries = new Map<string, string>();

    mapacheUsers.forEach((user) => {
      entries.set(user.id, formatAssigneeOption(user));
    });

    tasks.forEach((task) => {
      const assigneeId = getTaskAssigneeId(task);
      if (!assigneeId) return;
      if (entries.has(assigneeId)) return;
      const label = formatTaskAssigneeLabel(task) || assigneeId;
      entries.set(assigneeId, label);
    });

    return Array.from(entries.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  }, [mapacheUsers, tasks]);

  const statusSegmentLabel = formT("statusLabel");
  const ownershipSegmentLabel = filtersT("assignee");
  const statusAllLabel = statusT("all");

  const renderFilterBar = (className?: string) => (
    <MapachePortalFilters
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      advancedFilters={advancedFilters}
      setAdvancedFilters={setAdvancedFilters}
      statusOptions={statusIndex.ordered}
      statusLabel={statusSegmentLabel}
      statusAllLabel={statusAllLabel}
      formatStatusLabel={formatStatusLabel}
      needOptions={NEED_OPTIONS}
      directnessOptions={DIRECTNESS_OPTIONS}
      integrationTypeOptions={INTEGRATION_TYPE_OPTIONS}
      originOptions={ORIGIN_OPTIONS}
      assigneeOptions={assigneeOptions}
      filtersT={filtersT}
      needFromTeamT={needFromTeamT}
      directnessT={directnessT}
      integrationTypeT={integrationTypeT}
      originT={originT}
      hasActiveAdvancedFilters={hasActiveAdvancedFilters}
      advancedFiltersCount={advancedFiltersCount}
      ownershipLabel={ownershipSegmentLabel}
      className={className}
    />
  );

  const assignmentDraftTotal = React.useMemo(() => {
    return mapacheUsers.reduce((sum, user) => {
      const raw = assignmentDraft[user.id];
      const parsed = raw ? parsePercentageInput(raw) : null;
      if (parsed === null) return sum;
      return sum + parsed;
    }, 0);
  }, [assignmentDraft, mapacheUsers]);

  const renderViewModeToggle = () => (
    <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 p-1 text-xs font-medium text-white/70">
      <button
        type="button"
        onClick={() => setViewMode("lista")}
        className={`rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
          viewMode === "lista"
            ? "bg-[rgb(var(--primary))] text-white shadow-soft"
            : "text-white/70 hover:bg-white/10"
        }`}
        aria-pressed={viewMode === "lista"}
      >
        Lista
      </button>
      <button
        type="button"
        onClick={() => setViewMode("tablero")}
        className={`rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
          viewMode === "tablero"
            ? "bg-[rgb(var(--primary))] text-white shadow-soft"
            : "text-white/70 hover:bg-white/10"
        }`}
        aria-pressed={viewMode === "tablero"}
      >
        Tablero
      </button>
    </div>
  );

  const renderBoardSelector = () => {
    if (viewMode !== "tablero") return null;
    if (boardsLoading) {
      return (
        <div className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/60">
          {boardsT("loading")}
        </div>
      );
    }
    if (boards.length === 0) {
      return (
        <div className="rounded-full border border-dashed border-white/20 bg-white/5 px-3 py-1 text-xs text-white/60">
          {boardsT("selector.empty")}
        </div>
      );
    }
    return (
      <label className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/70">
        <span className="uppercase tracking-[0.2em] text-white/50">
          {boardsT("selector.label")}
        </span>
        <select
          value={activeBoardId ?? ""}
          onChange={(event) => handleBoardSelectorChange(event.target.value)}
          className="rounded-md border border-white/20 bg-black/20 px-2 py-1 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </label>
    );
  };

  const handleOpenSettingsModal = React.useCallback(() => {
    const hasConfiguredRatios = Object.values(assignmentRatios).some(
      (value) => typeof value === "number" && value > 0,
    );
    setAssignmentDraft(() => {
      const next: Record<string, string> = {};
      const defaultValue =
        !hasConfiguredRatios && mapacheUsers.length > 0
          ? 100 / mapacheUsers.length
          : null;
      mapacheUsers.forEach((user) => {
        const ratio = assignmentRatios[user.id];
        if (typeof ratio === "number" && ratio > 0) {
          next[user.id] = ratioToPercentageInput(ratio);
        } else if (defaultValue !== null) {
          next[user.id] = formatPercentage(defaultValue);
        } else {
          next[user.id] = "";
        }
      });
      return next;
    });
    setSettingsTab("assignment");
    setShowSettingsModal(true);
  }, [assignmentRatios, mapacheUsers]);

  const handleCloseSettingsModal = React.useCallback(() => {
    setShowSettingsModal(false);
    setBoardPendingDeletion(null);
    setBoardDraftError(null);
  }, []);

  const handleAssignmentDraftChange = React.useCallback((userId: string, value: string) => {
    setAssignmentDraft((prev) => ({ ...prev, [userId]: value }));
  }, []);

  const handleResetAssignmentDraft = React.useCallback(() => {
    if (mapacheUsers.length === 0) {
      setAssignmentDraft({});
      return;
    }
    const equal = 100 / mapacheUsers.length;
    setAssignmentDraft(() => {
      const next: Record<string, string> = {};
      mapacheUsers.forEach((user) => {
        next[user.id] = formatPercentage(equal);
      });
      return next;
    });
  }, [mapacheUsers]);

  const handleSaveAssignmentRatios = React.useCallback(() => {
    if (mapacheUsers.length === 0) {
      setAssignmentRatios({});
      setShowSettingsModal(false);
      return;
    }

    const entries: [string, number][] = [];
    mapacheUsers.forEach((user) => {
      const raw = assignmentDraft[user.id];
      const parsed = raw ? parsePercentageInput(raw) : null;
      if (parsed && parsed > 0) {
        entries.push([user.id, parsed / 100]);
      }
    });

    if (entries.length === 0) {
      setAssignmentRatios({});
      setShowSettingsModal(false);
      return;
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (total <= 0) {
      setAssignmentRatios({});
      setShowSettingsModal(false);
      return;
    }

    setAssignmentRatios(
      Object.fromEntries(
        entries.map(([id, value]) => [id, value / total] as const),
      ),
    );
    setShowSettingsModal(false);
  }, [assignmentDraft, mapacheUsers]);

  const handleBoardNameChange = React.useCallback((value: string) => {
    setBoardDraft((prev) => (prev ? { ...prev, name: value } : prev));
    setBoardDraftError(null);
  }, []);

  const handleBoardColumnTitleChange = React.useCallback(
    (index: number, value: string) => {
      setBoardDraft((prev) => {
        if (!prev) return prev;
        const columns = prev.columns.map((column, columnIndex) =>
          columnIndex === index ? { ...column, title: value } : column,
        );
        return { ...prev, columns };
      });
      setBoardDraftError(null);
    },
    [],
  );

  const handleToggleBoardColumnStatus = React.useCallback(
    (index: number, status: MapacheTaskStatus) => {
      setBoardDraft((prev) => {
        if (!prev) return prev;
        const columns = prev.columns.map((column, columnIndex) => {
          if (columnIndex !== index) return column;
          const nextStatuses = column.statuses.includes(status)
            ? column.statuses.filter((item) => item !== status)
            : [...column.statuses, status];
          return { ...column, statuses: nextStatuses };
        });
        return { ...prev, columns };
      });
      setBoardDraftError(null);
    },
    [],
  );

  const handleAddBoardColumn = React.useCallback(() => {
    setBoardDraft((prev) => {
      if (!prev) return prev;
      const title = boardsT("columns.defaultTitle", {
        index: prev.columns.length + 1,
      });
      const statuses = getSuggestedStatuses(prev.columns, statusKeys);
      return {
        ...prev,
        columns: [...prev.columns, { id: null, title, statuses }],
      };
    });
    setBoardDraftError(null);
  }, [boardsT, statusKeys]);

  const handleRemoveBoardColumn = React.useCallback((index: number) => {
    setBoardDraft((prev) => {
      if (!prev) return prev;
      const columns = prev.columns.filter((_, columnIndex) => columnIndex !== index);
      return { ...prev, columns };
    });
    setBoardDraftError(null);
  }, []);

  const handleMoveBoardColumn = React.useCallback(
    (index: number, direction: -1 | 1) => {
      setBoardDraft((prev) => {
        if (!prev) return prev;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= prev.columns.length) return prev;
        const columns = [...prev.columns];
        const [moved] = columns.splice(index, 1);
        columns.splice(targetIndex, 0, moved);
        return { ...prev, columns };
      });
      setBoardDraftError(null);
    },
    [],
  );

  const handleBoardSelectorChange = React.useCallback((boardId: string) => {
    setActiveBoardId(boardId || null);
  }, []);

  const persistBoardOrder = React.useCallback(
    async (orderedBoards: MapacheBoardConfig[]) => {
      setReorderingBoards(true);
      try {
        const response = await fetch(`/api/mapache/boards/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardIds: orderedBoards.map((board) => board.id),
          }),
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(error);
        toast.error(boardsToastT("reorderError"));
        await loadBoards({ silent: true });
      } finally {
        setReorderingBoards(false);
      }
    },
    [boardsToastT, loadBoards],
  );

  const handleMoveBoard = React.useCallback(
    (boardId: string, direction: "up" | "down") => {
      let nextBoards: MapacheBoardConfig[] | null = null;
      setBoards((prev) => {
        const index = prev.findIndex((board) => board.id === boardId);
        if (index < 0) return prev;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;
        const ordered = [...prev];
        const [moved] = ordered.splice(index, 1);
        ordered.splice(targetIndex, 0, moved);
        const reindexed = ordered.map((board, order) => ({ ...board, order }));
        nextBoards = reindexed;
        return reindexed;
      });
      if (nextBoards) {
        void persistBoardOrder(nextBoards);
      }
    },
    [persistBoardOrder],
  );

  const handleCreateBoard = React.useCallback(async () => {
    if (creatingBoard) return;
    const defaultName = boardsT("list.defaultName", {
      index: boards.length + 1,
    });
    setCreatingBoard(true);
    try {
      const response = await fetch(`/api/mapache/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultName }),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as { board?: unknown };
      const board = normalizeBoardConfig(data?.board, statusIndex);
      if (!board) {
        throw new Error("Invalid response");
      }
      setBoards((prev) => {
        const next = [...prev.filter((item) => item.id !== board.id), board].sort(
          (a, b) => a.order - b.order,
        );
        return next;
      });
      setActiveBoardId(board.id);
      setBoardDraft(createBoardDraft(board));
      setBoardDraftError(null);
      setBoardPendingDeletion(null);
      toast.success(boardsToastT("createSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(boardsToastT("createError"));
    } finally {
      setCreatingBoard(false);
    }
  }, [boards.length, boardsToastT, boardsT, creatingBoard, statusIndex]);

  const handleSaveBoard = React.useCallback(async () => {
    if (!boardDraft) return;
    const trimmedName = boardDraft.name.trim();
    if (!trimmedName) {
      setBoardDraftError(boardsT("validation.nameRequired"));
      return;
    }
    if (boardDraft.columns.length === 0) {
      setBoardDraftError(boardsT("validation.columnsRequired"));
      return;
    }
    for (const column of boardDraft.columns) {
      if (!column.title.trim()) {
        setBoardDraftError(boardsT("validation.columnTitleRequired"));
        return;
      }
      if (column.statuses.length === 0) {
        setBoardDraftError(boardsT("validation.columnStatusesRequired"));
        return;
      }
    }
    setBoardDraftError(null);
    setSavingBoard(true);
    try {
      const payload = mapDraftToPayload(
        {
          ...boardDraft,
          name: trimmedName,
        },
        statusIndex,
      );
      const response = await fetch(`/api/mapache/boards/${boardDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as { board?: unknown };
      const board = normalizeBoardConfig(data?.board, statusIndex);
      if (!board) {
        throw new Error("Invalid response");
      }
      setBoards((prev) => {
        const others = prev.filter((item) => item.id !== board.id);
        const next = [...others, board].sort((a, b) => a.order - b.order);
        return next;
      });
      setBoardDraft(createBoardDraft(board));
      toast.success(boardsToastT("updateSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(boardsToastT("updateError"));
    } finally {
      setSavingBoard(false);
    }
  }, [boardDraft, boardsToastT, boardsT, statusIndex]);

  const handleRequestDeleteBoard = React.useCallback(() => {
    if (!boardDraft) return;
    setBoardPendingDeletion(boardDraft.id);
  }, [boardDraft]);

  const handleCancelDeleteBoard = React.useCallback(() => {
    setBoardPendingDeletion(null);
  }, []);

  const handleConfirmDeleteBoard = React.useCallback(async () => {
    if (!boardDraft) return;
    setDeletingBoardId(boardDraft.id);
    try {
      const response = await fetch(`/api/mapache/boards/${boardDraft.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setBoards((prev) => {
        const remaining = prev.filter((board) => board.id !== boardDraft.id);
        const reindexed = remaining.map((board, order) => ({ ...board, order }));
        return reindexed;
      });
      setBoardPendingDeletion(null);
      setBoardDraft(null);
      setBoardDraftError(null);
      setActiveBoardId((prev) => (prev === boardDraft.id ? null : prev));
      toast.success(boardsToastT("deleteSuccess"));
      void loadBoards({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error(boardsToastT("deleteError"));
    } finally {
      setDeletingBoardId(null);
    }
  }, [boardDraft, boardsToastT, loadBoards]);

  const handleAutoAssign = React.useCallback(async () => {
    if (autoAssigning) return;
    const unassignedTasks = tasks.filter((task) => !task.assigneeId);
    if (unassignedTasks.length === 0) {
      toast.info(toastT("autoAssignNone"));
      return;
    }

    const weights = normalizeAssignmentWeights(assignmentRatios, mapacheUsers);
    if (weights.length === 0) {
      toast.error(toastT("autoAssignNoUsers"));
      return;
    }

    const plan = createAssignmentSequence(unassignedTasks.length, weights);
    if (plan.length === 0) {
      toast.error(toastT("autoAssignNoUsers"));
      return;
    }

    setAutoAssigning(true);
    try {
      for (let index = 0; index < unassignedTasks.length; index += 1) {
        const task = unassignedTasks[index]!;
        const assigneeId = plan[index % plan.length]!;
        const response = await fetch(`/api/mapache/tasks`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: task.id, assigneeId }),
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      await loadTasks({ silent: true });
      toast.success(toastT("autoAssignSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(toastT("autoAssignError"));
    } finally {
      setAutoAssigning(false);
    }
  }, [
    assignmentRatios,
    autoAssigning,
    loadTasks,
    mapacheUsers,
    tasks,
    toastT,
  ]);

  const assignmentModalFooter = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCloseSettingsModal}
          className="rounded-md border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {assignmentT("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSaveAssignmentRatios}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--primary))] shadow-soft transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={mapacheUsers.length === 0}
        >
          {assignmentT("save")}
        </button>
      </div>
    </div>
  );

  const resetForm = React.useCallback(() => {
    setFormState(createDefaultFormState());
    setFormErrors({});
    setCurrentStep(0);
  }, []);

  const handleOpenForm = React.useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const handleCloseForm = React.useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  const handleNextStep = React.useCallback(() => {
    if (currentStep >= FORM_STEP_FIELDS.length - 1) {
      return true;
    }

    const { errors } = normalizeFormState(formState, validationMessages);
    setFormErrors(errors);

    const stepKeys = FORM_STEP_FIELDS[currentStep] ?? [];
    const hasStepErrors = stepKeys.some((field) => {
      if (field === "deliverables") {
        return Boolean(
          errors.deliverables?.some(
            (deliverableError) =>
              deliverableError &&
              Object.values(deliverableError).some((value) => Boolean(value)),
          ),
        );
      }
      return Boolean(errors[field]);
    });

    if (hasStepErrors) {
      toast.error(toastT("validationError"));
      return false;
    }

    setCurrentStep((prev) =>
      prev >= FORM_STEP_FIELDS.length - 1 ? prev : prev + 1,
    );
    return true;
  }, [currentStep, formState, toastT, validationMessages]);

  const handlePreviousStep = React.useCallback(() => {
    setCurrentStep((prev) => (prev <= 0 ? 0 : prev - 1));
  }, []);

  const {
    handleFormChange,
    handleWebsiteUrlsChange,
    handleAddDeliverable,
    handleRemoveDeliverable,
    handleDeliverableChange,
  } = useTaskFormHandlers({
    setFormState,
    setFormErrors,
  });

  const {
    handleFormChange: handleSelectedTaskFormChange,
    handleWebsiteUrlsChange: handleSelectedTaskWebsiteUrlsChange,
    handleAddDeliverable: handleSelectedTaskAddDeliverable,
    handleRemoveDeliverable: handleSelectedTaskRemoveDeliverable,
    handleDeliverableChange: handleSelectedTaskDeliverableChange,
  } = useTaskFormHandlers({
    setFormState: setSelectedTaskFormState,
    setFormErrors: setSelectedTaskFormErrors,
  });

  const selectedTaskAssigneeLabel = React.useMemo(() => {
    if (!selectedTask) {
      return unspecifiedOptionLabel;
    }

    const stateAssigneeIdentifier =
      typeof selectedTaskFormState.assigneeId === "string"
        ? selectedTaskFormState.assigneeId.trim()
        : null;

    if (stateAssigneeIdentifier) {
      const stateAssignee = mapacheUsers.find((user) => {
        if (user.email.toLowerCase() === stateAssigneeIdentifier.toLowerCase()) {
          return true;
        }
        return user.id === stateAssigneeIdentifier;
      });
      if (stateAssignee) {
        return formatAssigneeOption(stateAssignee);
      }
    }

    if (selectedTask.assignee?.name) {
      return selectedTask.assignee.name;
    }
    if (selectedTask.assignee?.email) {
      return selectedTask.assignee.email;
    }

    const assigneeIdentifier =
      typeof selectedTask.assigneeId === "string"
        ? selectedTask.assigneeId.trim()
        : null;
    const user = mapacheUsers.find((item) => {
      if (!assigneeIdentifier) return false;
      if (item.email.toLowerCase() === assigneeIdentifier.toLowerCase()) {
        return true;
      }
      return item.id === assigneeIdentifier;
    });
    return user ? formatAssigneeOption(user) : unspecifiedOptionLabel;
  }, [
    mapacheUsers,
    selectedTask,
    selectedTaskFormState.assigneeId,
    unspecifiedOptionLabel,
  ]);

  const selectedTaskPresentationDateLabel = React.useMemo(() => {
    if (!selectedTask?.presentationDate) {
      return "—";
    }
    const parsed = new Date(selectedTask.presentationDate);
    if (Number.isNaN(parsed.getTime())) {
      return selectedTask.presentationDate;
    }
    return parsed.toLocaleDateString();
  }, [selectedTask?.presentationDate]);

  const selectedTaskSummaryMeta = React.useMemo<SelectedTaskSummaryMeta | null>(
    () => {
      if (!selectedTask) {
        return null;
      }

      const needValue: MapacheNeedFromTeam =
        selectedTask.needFromTeam ?? selectedTaskFormState.needFromTeam;
      const directnessValue: MapacheDirectness =
        selectedTask.directness ?? selectedTaskFormState.directness;
      const presentationSource = selectedTaskFormState.presentationDate
        ? `${selectedTaskFormState.presentationDate}T00:00:00.000Z`
        : selectedTask.presentationDate;
      const presentationMeta = getPresentationDateMeta(presentationSource);
      const presentationLabel =
        presentationMeta.label ?? formT("unspecifiedOption");
      const assigneeLabel =
        selectedTaskAssigneeLabel || formT("unspecifiedOption");
      const assigneeInitials = getInitials(assigneeLabel);
      const clientNameCandidate =
        (selectedTask.clientName ?? selectedTaskFormState.clientName)?.trim() ??
        "";
      const clientLabel =
        clientNameCandidate.length > 0
          ? clientNameCandidate
          : formT("unspecifiedOption");

      return {
        task: selectedTask,
        needValue,
        directnessValue,
        presentationMeta,
        presentationLabel,
        assigneeLabel,
        assigneeInitials,
        clientLabel,
      } as SelectedTaskSummaryMeta;
    },
    [
      formT,
      selectedTask,
      selectedTaskAssigneeLabel,
      selectedTaskFormState.clientName,
      selectedTaskFormState.directness,
      selectedTaskFormState.needFromTeam,
      selectedTaskFormState.presentationDate,
    ],
  );

  const handleCreateTask = React.useCallback(async () => {
    const { payload: requestPayload, deliverables, errors } = normalizeFormState(
      formState,
      validationMessages,
    );
    setFormErrors(errors);

    if (!requestPayload) {
      toast.error(toastT("validationError"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/mapache/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payloadResponse = await response.json();
      const task = normalizeMapacheTask(payloadResponse, statusIndex);

      if (!task) {
        throw new Error("Invalid response payload");
      }

      if (deliverables.length > 0) {
        for (const deliverable of deliverables) {
          const deliverableResponse = await fetch(
            `/api/mapache/tasks/${task.id}/deliverables`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(deliverable),
            },
          );
          if (!deliverableResponse.ok) {
            throw new Error(
              `Deliverable request failed with status ${deliverableResponse.status}`,
            );
          }
        }
      }

      await loadTasks({ silent: true });

      window.dispatchEvent(
        new CustomEvent("mapache_task_created", {
          detail: {
            origin: requestPayload.origin,
            needFromTeam: requestPayload.needFromTeam,
            directness: requestPayload.directness,
            assigneeId: requestPayload.assigneeId ?? null,
            productKey: requestPayload.productKey,
          },
        }),
      );

      toast.success(toastT("createSuccess"));
      handleCloseForm();
    } catch (error) {
      console.error(error);
      toast.error(toastT("createError"));
    } finally {
      setSubmitting(false);
    }
  }, [
    formState,
    handleCloseForm,
    loadTasks,
    statusIndex,
    toastT,
    validationMessages,
  ]);

  const modalFooter = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs uppercase tracking-[0.2em] text-white/70">
        Estado inicial: {formState.status} / {formState.substatus} · Origen: {" "}
        {formState.origin}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCloseForm}
          className="rounded-md border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          disabled={submitting}
        >
          {formT("cancel")}
        </button>
        <button
          type="submit"
          form={createTaskFormId}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--primary))] shadow-soft transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting || !isLastStep}
        >
          {submitting ? formT("saving") : formT("confirm")}
        </button>
      </div>
    </div>
  );

  const handleStatusChange = React.useCallback(
    async (task: MapacheTask, nextStatus: MapacheTaskStatus) => {
      if (task.status === nextStatus) return;

      setUpdatingTaskId(task.id);
      try {
        const response = await fetch(`/api/mapache/tasks`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: task.id, status: nextStatus }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const updatedTask =
          normalizeMapacheTask(payload, statusIndex) ?? {
            ...task,
            status: nextStatus,
            statusId: task.statusId,
            statusDetails: task.statusDetails,
          };

        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, ...updatedTask } : item)),
        );
        toast.success(toastT("updateSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(toastT("updateError"));
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [statusIndex, toastT],
  );

  const handleSubstatusChange = React.useCallback(
    async (task: MapacheTask, nextSubstatus: MapacheTaskSubstatus) => {
      if (task.substatus === nextSubstatus) return;

      setUpdatingTaskId(task.id);
      try {
        const response = await fetch(`/api/mapache/tasks`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: task.id, substatus: nextSubstatus }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        await loadTasks({ silent: true });
        toast.success(toastT("updateSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(toastT("updateError"));
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [loadTasks, toastT],
  );

  const handleTaskDroppedOnStatus = React.useCallback(
    (
      taskId: string,
      fromStatus: MapacheTaskStatus,
      nextStatus: MapacheTaskStatus,
    ) => {
      if (viewMode !== "tablero") return;
      if (fromStatus === nextStatus) return;
      if (!statusKeys.includes(nextStatus)) return;

      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;

      void handleStatusChange(task, nextStatus);
    },
    [handleStatusChange, statusKeys, tasks, viewMode],
  );

  const handleDeleteTask = React.useCallback(
    async (taskId: string) => {
      setDeletingTaskId(taskId);
      try {
        const response = await fetch(`/api/mapache/tasks`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: taskId }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setTasks((prev) => prev.filter((item) => item.id !== taskId));
        toast.success(toastT("deleteSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(toastT("deleteError"));
      } finally {
        setDeletingTaskId(null);
      }
    },
    [toastT],
  );

  const handleRequestDeleteTask = React.useCallback((taskId: string) => {
    setPendingDeletion(taskId);
  }, []);

  const handleCancelDeleteTask = React.useCallback(() => {
    setPendingDeletion(null);
  }, []);

  const handleConfirmDeleteTask = React.useCallback(async () => {
    if (!pendingDeletion) return;
    try {
      await handleDeleteTask(pendingDeletion);
    } finally {
      setPendingDeletion(null);
    }
  }, [handleDeleteTask, pendingDeletion]);

  const openTask = React.useCallback(
    (task: MapacheTask) => {
      setSelectedTask(task);
      const nextFormState = createFormStateFromTask(task);
      setSelectedTaskFormState(nextFormState);
      setSelectedTaskFormErrors({});
      setSelectedTaskSubmitting(false);
      const { payload, deliverables } = normalizeFormState(
        nextFormState,
        validationMessages,
      );
      selectedTaskInitialPayloadRef.current = payload;
      selectedTaskInitialDeliverablesRef.current = deliverables;
    },
    [validationMessages],
  );

  const closeTask = React.useCallback(() => {
    setSelectedTask(null);
    setSelectedTaskFormState(createDefaultFormState());
    setSelectedTaskFormErrors({});
    setSelectedTaskSubmitting(false);
    selectedTaskInitialPayloadRef.current = null;
    selectedTaskInitialDeliverablesRef.current = [];
  }, []);

  const submitSelectedTask = React.useCallback(async () => {
    if (!selectedTask) return;

    const { payload, errors, deliverables } = normalizeFormState(
      selectedTaskFormState,
      validationMessages,
    );
    setSelectedTaskFormErrors(errors);

    if (!payload) {
      toast.error(toastT("validationError"));
      return;
    }

    const initialPayload = selectedTaskInitialPayloadRef.current;
    const changedEntries = (
      Object.keys(payload) as (keyof CreateTaskPayload)[]
    ).filter((key) => {
      if (!initialPayload) return true;
      return !isEqualFieldValue(payload[key], initialPayload[key]);
    });

    const changedPayload = Object.fromEntries(
      changedEntries.map((key) => [key, payload[key]] as const),
    ) as Partial<CreateTaskPayload>;

    const deliverablesChanged = !areDeliverablesEqual(
      deliverables,
      selectedTaskInitialDeliverablesRef.current,
    );

    if (Object.keys(changedPayload).length === 0 && !deliverablesChanged) {
      toast.info("No hay cambios para guardar.");
      return;
    }

    const requestPayload: Record<string, unknown> = {
      id: selectedTask.id,
      status: selectedTask.status,
      substatus: selectedTask.substatus,
      origin: selectedTask.origin,
      ...changedPayload,
    };

    if (deliverablesChanged) {
      requestPayload.deliverables = deliverables;
    }

    setSelectedTaskSubmitting(true);
    try {
      const response = await fetch(`/api/mapache/tasks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payloadResponse = await response.json();
      const updatedTask = normalizeMapacheTask(payloadResponse, statusIndex);

      if (updatedTask) {
        setTasks((prev) =>
          prev.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
        );
      } else {
        await loadTasks({ silent: true });
      }

      toast.success(toastT("updateSuccess"));
      closeTask();
    } catch (error) {
      console.error(error);
      toast.error(toastT("updateError"));
    } finally {
      setSelectedTaskSubmitting(false);
    }
  }, [
    closeTask,
    loadTasks,
    selectedTask,
    selectedTaskFormState,
    toastT,
    validationMessages,
  ]);

type TaskBoardCardProps = {
  task: MapacheTask;
  onOpen: (task: MapacheTask) => void;
  isDragging?: boolean;
};

type TaskListRowProps = {
  task: MapacheTask;
  onOpen: (task: MapacheTask) => void;
};

type TaskListViewProps = {
  tasks: MapacheTask[];
  onOpen: (task: MapacheTask) => void;
};

type TaskMetaChipProps = {
  label: string;
  tone?: TaskMetaChipTone;
  children: React.ReactNode;
  className?: string;
};

type SelectedTaskSummaryMeta = {
  task: MapacheTask;
  needValue: MapacheNeedFromTeam;
  directnessValue: MapacheDirectness;
  presentationMeta: PresentationDateMeta;
  presentationLabel: string;
  assigneeLabel: string;
  assigneeInitials: string;
  clientLabel: string;
};

function TaskMetaChip({
  label,
  tone = "default",
  children,
  className,
}: TaskMetaChipProps) {
  const toneClass = TASK_META_TONE_CLASSNAMES[tone] ?? "";
  const containerClass = className
    ? `${toneClass} ${className}`.trim()
    : toneClass;

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs ${containerClass}`}
    >
      <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white">
        {children}
      </span>
    </span>
  );
}

  const TaskBoardCard = ({
    task,
    onOpen,
    isDragging = false,
  }: TaskBoardCardProps) => {
    const statusBadgeKey = getStatusBadgeKey(task, statusIndex);
    const presentationMeta = getPresentationDateMeta(task.presentationDate);
    const presentationLabel =
      presentationMeta.label ?? formT("unspecifiedOption");
    const statusLabel = statusBadgeT(statusBadgeKey);
    const assigneeLabel =
      formatTaskAssigneeLabel(task) || formT("unspecifiedOption");
    const assigneeInitials = getInitials(assigneeLabel);
    const clientLabel = task.clientName ?? formT("unspecifiedOption");

    return (
      <article
        className={`group relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/80 p-3 text-white shadow-soft transition ${
          isDragging
            ? "ring-2 ring-[rgb(var(--primary))]/80 ring-offset-2 ring-offset-slate-950"
            : "hover:border-white/20"
        }`}
      >
        <span
          className={`absolute left-0 top-0 h-full w-1 ${STATUS_INDICATOR_ACCENT_CLASSNAMES[statusBadgeKey]}`}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => onOpen(task)}
          aria-label={`Abrir detalles de ${task.title}`}
          className="flex w-full flex-col gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-sm font-semibold text-white">
                {task.title}
              </h2>
              <p
                className="mt-1 line-clamp-1 text-xs text-white/60"
                title={clientLabel}
              >
                {clientLabel}
              </p>
            </div>
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold uppercase text-white"
              title={assigneeLabel}
            >
              {assigneeInitials}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${STATUS_INDICATOR_ACCENT_CLASSNAMES[statusBadgeKey]}`}
                aria-hidden="true"
              />
              <span className="font-semibold text-white/80">{statusLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${presentationMeta.indicatorClassName}`}
                aria-hidden="true"
              />
              <span className="font-semibold text-white/80">
                {presentationLabel}
              </span>
            </div>
          </div>
        </button>
      </article>
    );
  };

  const TaskListRow = ({ task, onOpen }: TaskListRowProps) => {
    const isUpdating = updatingTaskId === task.id;
    const isDeleting = deletingTaskId === task.id;
    const statusBadgeKey = getStatusBadgeKey(task, statusIndex);
    const presentationMeta = getPresentationDateMeta(task.presentationDate);
    const presentationLabel =
      presentationMeta.label ?? formT("unspecifiedOption");
    const assigneeLabel =
      formatTaskAssigneeLabel(task) || formT("unspecifiedOption");
    const assigneeInitials = getInitials(assigneeLabel);
    const clientLabel = task.clientName ?? formT("unspecifiedOption");

    return (
      <tr className="border-b border-white/10 last:border-0">
        <td className="max-w-xs px-4 py-3 align-top">
          <button
            type="button"
            tabIndex={0}
            onClick={() => onOpen(task)}
            aria-label={`Abrir detalles de ${task.title}`}
            className="flex w-full flex-col gap-2 rounded-lg border border-transparent bg-transparent p-0 text-left transition hover:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <div className="flex items-start gap-3">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold uppercase text-white"
                title={assigneeLabel}
              >
                {assigneeInitials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_INDICATOR_ACCENT_CLASSNAMES[statusBadgeKey]}`}
                    aria-hidden="true"
                  />
                  <span className="line-clamp-2 text-sm font-semibold text-white">
                    {task.title}
                  </span>
                </div>
                <p className="text-xs text-white/60" title={clientLabel}>
                  {clientLabel}
                </p>
                {task.substatus ? (
                  <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_INDICATOR_ACCENT_CLASSNAMES[statusBadgeKey]}`}
                      aria-hidden="true"
                    />
                    {substatusT(getSubstatusKey(task.substatus))}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${presentationMeta.indicatorClassName}`}
              aria-hidden="true"
            />
            <span className="font-semibold text-white/80">{presentationLabel}</span>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-white/80">
          <label className="flex items-center gap-2">
            <span className="hidden text-white/60 lg:inline">
              {actionsT("statusLabel")}:
            </span>
            <select
              className="min-w-[140px] rounded-md border border-white/20 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-[rgb(var(--primary))] focus:outline-none"
              value={task.status}
              onChange={(event) =>
                handleStatusChange(task, event.target.value as MapacheTaskStatus)
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
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-white/80">
          <label className="flex items-center gap-2">
            <span className="hidden text-white/60 lg:inline">
              {actionsT("substatusLabel")}:
            </span>
            <select
              className="min-w-[160px] rounded-md border border-white/20 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-[rgb(var(--primary))] focus:outline-none"
              value={task.substatus}
              onChange={(event) =>
                handleSubstatusChange(
                  task,
                  event.target.value as MapacheTaskSubstatus,
                )
              }
              disabled={isUpdating || isDeleting}
            >
              {SUBSTATUS_OPTIONS.map((substatus) => (
                <option key={substatus} value={substatus}>
                  {substatusT(getSubstatusKey(substatus))}
                </option>
              ))}
            </select>
          </label>
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-white/80">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold uppercase text-white"
              title={assigneeLabel}
            >
              {assigneeInitials}
            </span>
            <span className="text-sm text-white/80">{assigneeLabel}</span>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-middle text-right text-sm text-white/80">
          <button
            type="button"
            onClick={() => handleRequestDeleteTask(task.id)}
            disabled={isDeleting || isUpdating}
            className="inline-flex items-center rounded-md border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:bg-rose-500/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? actionsT("deleting") : actionsT("delete")}
          </button>
        </td>
      </tr>
    );
  };

  const TaskListView = ({ tasks, onOpen }: TaskListViewProps) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-white/60">
              <th className="px-4 py-3 text-left font-semibold">
                {formT("titleLabel")}
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                {filtersT("presentationDate")}
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                {actionsT("statusLabel")}
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                {actionsT("substatusLabel")}
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                {filtersT("assignee")}
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                {actionsT("delete")}
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskListRow key={task.id} task={task} onOpen={onOpen} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  type PipelineDragData = {
    type: "mapache-task";
    taskId: string;
    status: MapacheTaskStatus;
  };

  type PipelineColumnProps = {
    title: string;
    statuses: MapacheTaskStatus[];
    tasks: MapacheTask[];
    onTaskDrop: (
      taskId: string,
      fromStatus: MapacheTaskStatus,
      nextStatus: MapacheTaskStatus,
    ) => void;
    formatStatus: (status: MapacheTaskStatus) => string;
  };

  const PipelineDraggableTask = ({ task }: { task: MapacheTask }) => {
    const draggableRef = React.useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    React.useEffect(() => {
      const element = draggableRef.current;
      if (!element) return;

      return draggable({
        element,
        getInitialData: () => ({
          type: "mapache-task",
          taskId: task.id,
          status: task.status,
        } satisfies PipelineDragData),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onDragEnd: () => setIsDragging(false),
      });
    }, [task.id, task.status]);

    return (
      <div ref={draggableRef} className="cursor-grab active:cursor-grabbing">
        <TaskBoardCard task={task} onOpen={openTask} isDragging={isDragging} />
      </div>
    );
  };

  const PipelineColumn = ({
    title,
    statuses,
    tasks,
    onTaskDrop,
    formatStatus,
  }: PipelineColumnProps) => {
    const columnRef = React.useRef<HTMLDivElement | null>(null);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

    const statusSummary = React.useMemo(() => {
      if (statuses.length === 0) return "";
      return statuses.map((status) => formatStatus(status)).join(" • ");
    }, [formatStatus, statuses]);

    React.useEffect(() => {
      const element = columnRef.current;
      if (!element) return;

      return dropTargetForElements({
        element,
        getData: () => ({ type: "mapache-column", statuses }),
        onDragEnter: ({ source }) => {
          const data = source.data as PipelineDragData | undefined;
          if (data?.type === "mapache-task") {
            setIsDraggingOver(true);
          }
        },
        onDragLeave: () => {
          setIsDraggingOver(false);
        },
        onDrop: ({ source }) => {
          setIsDraggingOver(false);
          const data = source.data as PipelineDragData | undefined;
          if (!data || data.type !== "mapache-task") {
            return;
          }
          const targetStatus = statuses[0];
          if (!targetStatus) {
            return;
          }

          onTaskDrop(data.taskId, data.status, targetStatus);
        },
        onDragEnd: () => {
          setIsDraggingOver(false);
        },
      });
    }, [onTaskDrop, statuses]);

    return (
      <section className="flex min-w-[260px] max-w-[280px] flex-1 flex-col rounded-xl border border-white/10 bg-slate-950/70 text-white shadow-soft">
        <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white/80">{title}</span>
            {statusSummary ? (
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                {statusSummary}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-white/50">{tasks.length}</span>
        </header>
        <div
          ref={columnRef}
          className={`flex min-h-[140px] flex-1 flex-col gap-2 p-3 transition ${
            isDraggingOver ? "bg-white/5" : ""
          }`}
        >
          {tasks.map((task) => (
            <PipelineDraggableTask key={task.id} task={task} />
          ))}
          {tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 p-3 text-xs text-white/40">
              Soltá señales acá
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  const isTasksSection = activeSection === "tasks";
  const isMetricsSection = activeSection === "metrics";

  const renderLoadingMessage = () =>
    !loading ? null : (
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
        {t("loading")}
      </div>
    );

  const renderFetchErrorMessage = () =>
    !fetchError ? null : (
      <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {t("loadFallback")}
      </div>
    );

  const headerTitle = heading;
  const headerSubtitle = subheading;
  const hasHeaderTitle =
    headerTitle !== null && headerTitle !== undefined && headerTitle !== false;
  const hasHeaderSubtitle =
    headerSubtitle !== null &&
    headerSubtitle !== undefined &&
    headerSubtitle !== false;
  const hasHeaderContent = hasHeaderTitle || hasHeaderSubtitle;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {hasHeaderContent ? (
          <div>
            {hasHeaderTitle ? (
              <h1 className="text-2xl font-semibold text-white">{headerTitle}</h1>
            ) : null}
            {hasHeaderSubtitle ? (
              <p className="mt-1 text-sm text-white/70">{headerSubtitle}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-2 md:ml-auto">
          <button
            type="button"
            onClick={handleOpenSettingsModal}
            className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span>{assignmentT("configure")}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenForm}
            className="inline-flex items-center rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {actionsT("add")}
          </button>
        </div>
      </header>

      <Modal
        open={showSettingsModal}
        onClose={handleCloseSettingsModal}
        variant="inverted"
        title={settingsT("title")}
        panelClassName="w-full max-w-4xl"
        footer={settingsTab === "assignment" ? assignmentModalFooter : undefined}
      >
        <div className="space-y-6 text-white">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/10 p-1 text-xs text-white/60">
            <button
              type="button"
              onClick={() => setSettingsTab("assignment")}
              className={`rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                settingsTab === "assignment"
                  ? "bg-white text-[rgb(var(--primary))] shadow-soft"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {settingsT("tabs.assignment")}
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("boards")}
              className={`rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                settingsTab === "boards"
                  ? "bg-white text-[rgb(var(--primary))] shadow-soft"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {settingsT("tabs.boards")}
            </button>
          </div>

          {settingsTab === "assignment" ? (
            <div className="space-y-4">
              <p className="text-sm text-white/70">{assignmentT("description")}</p>
              {mapacheUsers.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
                  {assignmentT("empty")}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleResetAssignmentDraft}
                      className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wide text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      {assignmentT("reset")}
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {mapacheUsers.map((user) => {
                      const value = assignmentDraft[user.id] ?? "";
                      return (
                        <label
                          key={user.id}
                          className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80"
                        >
                          <span className="font-medium text-white">{formatAssigneeOption(user)}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={value}
                              onChange={(event) =>
                                handleAssignmentDraftChange(user.id, event.target.value)
                              }
                              className="flex-1 rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                              placeholder="0"
                            />
                            <span className="text-sm text-white/60">%</span>
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                            {assignmentT("percentageLabel")}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
                    <span>{assignmentT("totalLabel")}</span>
                    <span className="text-white">{`${formatPercentage(assignmentDraftTotal)}%`}</span>
                  </div>
                  <p className="text-xs text-white/40">{assignmentT("normalizedHint")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-white/70">{boardsT("description")}</p>
              {boardsError ? (
                <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {boardsError}
                </div>
              ) : null}
              <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                <aside className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      {boardsT("list.heading")}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCreateBoard}
                      className="rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wide text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={creatingBoard}
                    >
                      {boardsT("empty.action")}
                    </button>
                  </div>
                  {boardsLoading ? (
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                      {boardsT("loading")}
                    </div>
                  ) : null}
                  {boards.length === 0 && !boardsLoading ? (
                    <div className="space-y-3 rounded-md border border-dashed border-white/15 bg-white/5 px-3 py-4 text-xs text-white/70">
                      <div>
                        <p className="font-medium text-white">{boardsT("empty.title")}</p>
                        <p className="mt-1">{boardsT("empty.description")}</p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {boards.map((board, index) => {
                        const isActive = board.id === activeBoardId;
                        return (
                          <li key={board.id}>
                            <div
                              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                                isActive
                                  ? "border-white/60 bg-white/15 text-white"
                                  : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleBoardSelectorChange(board.id)}
                                className="flex-1 text-left"
                              >
                                {board.name}
                              </button>
                              <div className="flex items-center gap-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleMoveBoard(board.id, "up")}
                                  className="rounded-md border border-white/20 px-2 py-1 text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                                  disabled={index === 0 || reorderingBoards}
                                  title={boardsT("list.reorderHint")}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveBoard(board.id, "down")}
                                  className="rounded-md border border-white/20 px-2 py-1 text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                                  disabled={index === boards.length - 1 || reorderingBoards}
                                  title={boardsT("list.reorderHint")}
                                >
                                  ↓
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </aside>
                <section className="space-y-4">
                  {boardsLoading && !boardDraft ? (
                    <div className="rounded-md border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
                      {boardsT("loading")}
                    </div>
                  ) : null}
                  {!boardsLoading && !boardDraft ? (
                    <div className="rounded-md border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-white/70">
                      {boardsT("selector.empty")}
                    </div>
                  ) : null}
                  {boardDraft ? (
                    <div className="space-y-4">
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="text-white/80">{boardsT("form.nameLabel")}</span>
                        <input
                          type="text"
                          value={boardDraft.name}
                          onChange={(event) => handleBoardNameChange(event.target.value)}
                          placeholder={boardsT("form.namePlaceholder")}
                          className="rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        />
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">
                            {boardsT("columns.heading")}
                          </h4>
                          <button
                            type="button"
                            onClick={handleAddBoardColumn}
                            className="rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wide text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                          >
                            {boardsT("columns.add")}
                          </button>
                        </div>
                        {boardDraft.columns.length === 0 ? (
                          <div className="rounded-md border border-dashed border-white/15 bg-white/5 px-3 py-4 text-xs text-white/70">
                            {boardsT("columns.empty")}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {boardDraft.columns.map((column, index) => (
                              <div
                                key={column.id ?? `draft-${index}`}
                                className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4"
                              >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <label className="flex-1 text-sm">
                                    <span className="text-white/80">{boardsT("columns.titleLabel")}</span>
                                    <input
                                      type="text"
                                      value={column.title}
                                      onChange={(event) =>
                                        handleBoardColumnTitleChange(index, event.target.value)
                                      }
                                      className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                    />
                                  </label>
                                  <div className="flex items-center gap-1 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveBoardColumn(index, -1)}
                                      className="rounded-md border border-white/20 px-2 py-1 text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                                      disabled={index === 0}
                                    >
                                      {boardsT("columns.moveUp")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveBoardColumn(index, 1)}
                                      className="rounded-md border border-white/20 px-2 py-1 text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                                      disabled={index === boardDraft.columns.length - 1}
                                    >
                                      {boardsT("columns.moveDown")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBoardColumn(index)}
                                      className="rounded-md border border-white/20 px-2 py-1 text-white/70 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                                    >
                                      {boardsT("columns.delete")}
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <span className="uppercase tracking-[0.2em] text-white/50">
                                    {boardsT("columns.statusesLabel")}
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {statusKeys.map((status) => {
                                      const checked = column.statuses.includes(status);
                                      return (
                                        <label
                                          key={status}
                                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                                            checked
                                              ? "border-white bg-white/10 text-white"
                                              : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleToggleBoardColumnStatus(index, status)}
                                            className="sr-only"
                                          />
                                          <span>{formatStatusLabel(status)}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {boardDraftError ? (
                        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                          {boardDraftError}
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        {boardPendingDeletion === boardDraft.id ? (
                          <div className="space-y-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                            <p className="font-semibold">{boardsT("form.confirmDeleteTitle")}</p>
                            <p className="text-xs text-rose-100/80">
                              {boardsT("form.confirmDeleteDescription", {
                                name:
                                  boardDraft.name.trim() || boardsT("form.namePlaceholder"),
                              })}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={handleCancelDeleteBoard}
                                className="rounded-md border border-rose-100/40 px-3 py-1.5 text-xs uppercase tracking-wide text-rose-100/80 transition hover:bg-rose-500/20"
                              >
                                {boardsT("form.cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmDeleteBoard}
                                className="rounded-md bg-rose-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={deletingBoardId === boardDraft.id}
                              >
                                {boardsT("form.confirmDelete")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestDeleteBoard}
                            className="self-start rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wide text-white/70 transition hover:bg-white/10"
                          >
                            {boardsT("form.delete")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveBoard}
                          className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={savingBoard}
                        >
                          {boardsT("form.save")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showForm}
        onClose={handleCloseForm}
        variant="inverted"
        title={actionsT("add")}
        footer={modalFooter}
        panelClassName="w-full max-w-3xl"
      >
        <form
          id={createTaskFormId}
          className="grid gap-6 text-white"
          onSubmit={(event) => {
            event.preventDefault();
            if (submitting) {
              return;
            }
            if (!isLastStep) {
              handleNextStep();
              return;
            }
            void handleCreateTask();
          }}
        >
          <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold text-white">
              {FORM_STEP_LABELS[currentStep]}
            </span>
            <span>
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </div>

          <div className="grid gap-6">
            {currentStep === 0 ? (
              <section className="grid gap-4">
                <h2 className="text-lg font-semibold text-white">Datos generales</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">{formT("statusLabel")}</span>
                    <select
                      value={formState.status}
                      onChange={(event) =>
                        handleFormChange(
                          "status",
                          event.target.value as MapacheTaskStatus,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {statusKeys.map((option) => (
                        <option key={option} value={option}>
                          {formatStatusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">{formT("substatusLabel")}</span>
                    <select
                      value={formState.substatus}
                      onChange={(event) =>
                        handleFormChange(
                          "substatus",
                          event.target.value as MapacheTaskSubstatus,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {SUBSTATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {substatusT(getSubstatusKey(option))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">{formT("titleLabel")}</span>
                    <input
                      type="text"
                      value={formState.title}
                      onChange={(event) =>
                        handleFormChange("title", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder={formT("titlePlaceholder")}
                    />
                    {formErrors.title ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.title}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Cliente</span>
                    <input
                      type="text"
                      value={formState.clientName}
                      onChange={(event) =>
                        handleFormChange("clientName", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="Ej. ACME Corp"
                    />
                    {formErrors.clientName ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.clientName}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Producto</span>
                    <input
                      type="text"
                      value={formState.productKey}
                      onChange={(event) =>
                        handleFormChange("productKey", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="Ej. Wiser PRO"
                    />
                    {formErrors.productKey ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.productKey}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Necesidad del equipo</span>
                    <select
                      value={formState.needFromTeam}
                      onChange={(event) =>
                        handleFormChange(
                          "needFromTeam",
                          event.target.value as MapacheNeedFromTeam,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {NEED_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {needFromTeamT(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Canal</span>
                    <select
                      value={formState.directness}
                      onChange={(event) =>
                        handleFormChange(
                          "directness",
                          event.target.value as MapacheDirectness,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {DIRECTNESS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {directnessT(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Asignado a</span>
                    <select
                      value={formState.assigneeId ?? ""}
                      onChange={(event) =>
                        handleFormChange(
                          "assigneeId",
                          event.target.value ? event.target.value : null,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      <option value="">Sin asignar</option>
                      {mapacheUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {formatAssigneeOption(user)}
                        </option>
                      ))}
                    </select>
                    {assigneesLoading ? (
                      <span className="text-xs text-white/60">Cargando…</span>
                    ) : null}
                    {assigneesError ? (
                      <span className="text-xs text-rose-300">
                        {assigneesError}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-white/80">{formT("descriptionLabel")}</span>
                  <textarea
                    value={formState.description}
                    onChange={(event) =>
                      handleFormChange("description", event.target.value)
                    }
                    className="min-h-[120px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    placeholder={formT("descriptionPlaceholder")}
                  />
                </label>
              </section>
            ) : null}

            {currentStep === 1 ? (
              <section className="grid gap-4">
                <h2 className="text-lg font-semibold text-white">Contacto y contexto</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm md:col-span-1">
                    <span className="text-white/80">Email del solicitante</span>
                    <input
                      type="email"
                      value={formState.requesterEmail}
                      onChange={(event) =>
                        handleFormChange("requesterEmail", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="persona@compania.com"
                    />
                    {formErrors.requesterEmail ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.requesterEmail}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-1">
                    <span className="text-white/80">Rol del interlocutor</span>
                    <input
                      type="text"
                      value={formState.interlocutorRole}
                      onChange={(event) =>
                        handleFormChange("interlocutorRole", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="Ej. CTO"
                    />
                    {formErrors.interlocutorRole ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.interlocutorRole}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-1">
                    <span className="text-white/80">Fecha de presentación</span>
                    <input
                      type="date"
                      value={formState.presentationDate}
                      onChange={(event) =>
                        handleFormChange("presentationDate", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {formErrors.presentationDate ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.presentationDate}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-1">
                    <span className="text-white/80">Pipedrive Deal URL</span>
                    <input
                      type="url"
                      value={formState.pipedriveDealUrl}
                      onChange={(event) =>
                        handleFormChange("pipedriveDealUrl", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="https://"
                    />
                    {formErrors.pipedriveDealUrl ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.pipedriveDealUrl}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-white/80">Sitios web del cliente</span>
                  <textarea
                    value={formState.clientWebsiteUrls.join("\n")}
                    onChange={(event) => handleWebsiteUrlsChange(event.target.value)}
                    className="min-h-[88px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    placeholder="Una URL por línea"
                  />
                  {formErrors.clientWebsiteUrls ? (
                    <span className="text-xs text-rose-300">
                      {formErrors.clientWebsiteUrls}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-white/80">Dolor del cliente</span>
                  <textarea
                    value={formState.clientPain}
                    onChange={(event) =>
                      handleFormChange("clientPain", event.target.value)
                    }
                    className="min-h-[88px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    placeholder="Contexto adicional"
                  />
                  {formErrors.clientPain ? (
                    <span className="text-xs text-rose-300">
                      {formErrors.clientPain}
                    </span>
                  ) : null}
                </label>
              </section>
            ) : null}

            {currentStep === 2 ? (
              <section className="grid gap-4">
                <h2 className="text-lg font-semibold text-white">Documentación</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Tipo de gestión</span>
                    <input
                      type="text"
                      value={formState.managementType}
                      onChange={(event) =>
                        handleFormChange("managementType", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {formErrors.managementType ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.managementType}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Cantidad de docs (aprox)</span>
                    <input
                      type="number"
                      min={0}
                      value={formState.docsCountApprox}
                      onChange={(event) =>
                        handleFormChange("docsCountApprox", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {formErrors.docsCountApprox ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.docsCountApprox}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Extensión de docs</span>
                    <input
                      type="text"
                      value={formState.docsLengthApprox}
                      onChange={(event) =>
                        handleFormChange("docsLengthApprox", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {formErrors.docsLengthApprox ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.docsLengthApprox}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Conversaciones mensuales</span>
                    <input
                      type="number"
                      min={0}
                      value={formState.avgMonthlyConversations}
                      onChange={(event) =>
                        handleFormChange(
                          "avgMonthlyConversations",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {formErrors.avgMonthlyConversations ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.avgMonthlyConversations}
                      </span>
                    ) : null}
                  </label>
                </div>
              </section>
            ) : null}

            {currentStep === 3 ? (
              <section className="grid gap-4">
                <h2 className="text-lg font-semibold text-white">Integración/Entregables</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Tipo</span>
                    <select
                      value={formState.integrationType}
                      onChange={(event) =>
                        handleFormChange(
                          "integrationType",
                          event.target.value as FormState["integrationType"],
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {INTEGRATION_TYPES.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option
                            ? integrationTypeT(option)
                            : unspecifiedOptionLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Responsable</span>
                    <select
                      value={formState.integrationOwner}
                      onChange={(event) =>
                        handleFormChange(
                          "integrationOwner",
                          event.target.value as FormState["integrationOwner"],
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {INTEGRATION_OWNERS.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option
                            ? integrationOwnerT(option)
                            : unspecifiedOptionLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="text-white/80">Nombre de la integración</span>
                    <input
                      type="text"
                      value={formState.integrationName}
                      onChange={(event) =>
                        handleFormChange("integrationName", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {formErrors.integrationName ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.integrationName}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="text-white/80">Documentación</span>
                    <input
                      type="url"
                      value={formState.integrationDocsUrl}
                      onChange={(event) =>
                        handleFormChange("integrationDocsUrl", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="https://"
                    />
                    {formErrors.integrationDocsUrl ? (
                      <span className="text-xs text-rose-300">
                        {formErrors.integrationDocsUrl}
                      </span>
                    ) : null}
                  </label>
                </div>
                <div className="grid gap-4">
                  <h3 className="text-base font-semibold text-white">Entregables</h3>
                  <div className="grid gap-4">
                    {formState.deliverables.length === 0 ? (
                      <p className="text-sm text-white/60">
                        Podés agregar entregables después desde la tarea.
                      </p>
                    ) : null}
                    {formState.deliverables.map((deliverable, index) => {
                      const deliverableError = formErrors.deliverables?.[index];
                      return (
                        <div
                          key={`deliverable-${index}`}
                          className="grid gap-3 rounded-lg border border-white/10 bg-slate-900/70 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                        >
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-white/80">Tipo</span>
                            <select
                              value={deliverable.type}
                              onChange={(event) =>
                                handleDeliverableChange(
                                  index,
                                  "type",
                                  event.target.value as MapacheDeliverableType,
                                )
                              }
                              className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                            >
                              {DELIVERABLE_TYPES.map((option) => (
                                <option key={option} value={option}>
                                  {deliverableTypeT(option)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-white/80">Título</span>
                            <input
                              type="text"
                              value={deliverable.title}
                              onChange={(event) =>
                                handleDeliverableChange(
                                  index,
                                  "title",
                                  event.target.value,
                                )
                              }
                              className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                            />
                            {deliverableError?.title ? (
                              <span className="text-xs text-rose-300">
                                {deliverableError.title}
                              </span>
                            ) : null}
                          </label>
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-white/80">URL</span>
                            <input
                              type="url"
                              value={deliverable.url}
                              onChange={(event) =>
                                handleDeliverableChange(
                                  index,
                                  "url",
                                  event.target.value,
                                )
                              }
                              className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                            />
                            {deliverableError?.url ? (
                              <span className="text-xs text-rose-300">
                                {deliverableError.url}
                              </span>
                            ) : null}
                          </label>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliverable(index)}
                              className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-wide text-white/70 transition hover:bg-white/10"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      className="inline-flex items-center rounded-md border border-dashed border-white/30 px-3 py-2 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
                    >
                      Agregar entregable
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/70">
              {FORM_STEP_LABELS[currentStep]}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="rounded-md border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isFirstStep}
              >
                Anterior
              </button>
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-md bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Siguiente
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </Modal>

      {isMetricsSection ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">{renderFilterBar()}</div>
          </div>
          <div className="mt-6 space-y-6">
            <MapachePortalInsights
              scope={insightsScope}
              onScopeChange={setInsightsScope}
              metricsByScope={insightsMetrics}
              statuses={statusIndex.ordered}
              formatStatusLabel={formatStatusLabel}
            />
          </div>
          {renderLoadingMessage()}
          {renderFetchErrorMessage()}
        </>
      ) : null}

      {isTasksSection ? (
        <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">{renderFilterBar()}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {renderBoardSelector()}
          {renderViewModeToggle()}
          {activeFilter.ownership === "unassigned" ? (
            <button
              type="button"
              onClick={handleAutoAssign}
                  disabled={autoAssigning || mapacheUsers.length === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 px-4 py-1 text-sm text-[rgb(var(--primary))] transition hover:bg-[rgb(var(--primary))]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                  {autoAssigning
                    ? assignmentT("autoAssigning")
                    : assignmentT("autoAssign")}
                </button>
              ) : null}
            </div>
          </div>

          {renderLoadingMessage()}

          {!loading && filteredTasks.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
              <p className="font-medium text-white">
                {showFilteredEmptyMessage ? emptyT("filteredTitle") : emptyT("title")}
              </p>
              <p className="mt-1 text-white/70">
                {showFilteredEmptyMessage
                  ? emptyT("filteredDescription")
                  : emptyT("description")}
              </p>
            </div>
          )}

      {viewMode === "lista" ? (
        <TaskListView tasks={filteredTasks} onOpen={openTask} />
      ) : (
        <div className="space-y-3">
          {boardsError ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {boardsError}
            </div>
          ) : null}
          {boards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white/70">
              {boardsT("selector.empty")}
            </div>
          ) : boardColumnsWithTasks.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
              {boardsT("columns.empty")}
            </div>
          ) : (
            <div className="-mx-1 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4 px-1">
                {boardColumnsWithTasks.map((column) => (
                  <PipelineColumn
                    key={column.id}
                    title={column.title}
                    statuses={column.statuses}
                    tasks={column.tasks}
                    onTaskDrop={handleTaskDroppedOnStatus}
                    formatStatus={formatStatusLabel}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={selectedTask !== null}
        onClose={closeTask}
        variant="inverted"
        disableCloseOnBackdrop={selectedTaskSubmitting}
        title={
          <div className="flex flex-col">
            <span className="text-base font-semibold">
              {selectedTask?.title ?? ""}
            </span>
            {selectedTask?.clientName ? (
              <span className="text-xs text-white/60">
                {selectedTask.clientName}
              </span>
            ) : null}
          </div>
        }
        footer={
          <div className="flex justify-end gap-2 rounded-lg bg-white/10 px-4 py-3">
            <button
              type="button"
              onClick={closeTask}
              className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              disabled={selectedTaskSubmitting}
            >
              {formT("cancel")}
            </button>
            <button
              type="submit"
              form="selected-task-form"
              className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={selectedTaskSubmitting}
            >
              {selectedTaskSubmitting ? formT("saving") : formT("confirm")}
            </button>
          </div>
        }
      >
        {selectedTask ? (
          <form
            id="selected-task-form"
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedTaskSubmitting) {
                void submitSelectedTask();
              }
            }}
          >
            <CollapsibleSection
              title="Resumen de la señal"
              description="Información clave para entender rápidamente el estado actual."
            >
              {selectedTaskSummaryMeta ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        STATUS_BADGE_CLASSNAMES[
                      getStatusBadgeKey(selectedTaskSummaryMeta.task, statusIndex)
                        ]
                      }`}
                    >
                      {statusBadgeT(
                        getStatusBadgeKey(selectedTaskSummaryMeta.task, statusIndex),
                      )}
                    </span>
                    {selectedTaskSummaryMeta.task.substatus ? (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
                        {substatusT(
                          getSubstatusKey(
                            selectedTaskSummaryMeta.task.substatus,
                          ),
                        )}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TaskMetaChip label="Cliente">
                      <span className="truncate text-xs font-semibold text-white">
                        {selectedTaskSummaryMeta.clientLabel}
                      </span>
                    </TaskMetaChip>
                    <TaskMetaChip label="Necesidad">
                      <span className="text-xs font-semibold text-white">
                        {needFromTeamT(selectedTaskSummaryMeta.needValue)}
                      </span>
                    </TaskMetaChip>
                    <TaskMetaChip label="Canal">
                      <span className="text-xs font-semibold text-white">
                        {directnessT(selectedTaskSummaryMeta.directnessValue)}
                      </span>
                    </TaskMetaChip>
                    <TaskMetaChip
                      label="Presentación"
                      tone={selectedTaskSummaryMeta.presentationMeta.tone}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${selectedTaskSummaryMeta.presentationMeta.indicatorClassName}`}
                          aria-hidden="true"
                        />
                        <span className="truncate text-xs font-semibold text-white">
                          {selectedTaskSummaryMeta.presentationLabel}
                        </span>
                      </span>
                    </TaskMetaChip>
                    <TaskMetaChip label="Asignado">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold uppercase text-white">
                          {selectedTaskSummaryMeta.assigneeInitials}
                        </span>
                        <span className="truncate text-xs font-semibold text-white">
                          {selectedTaskSummaryMeta.assigneeLabel}
                        </span>
                      </span>
                    </TaskMetaChip>
                  </div>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 text-xs text-white/70 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">
                    {actionsT("statusLabel")}
                  </span>
                  <span>
                    {formatStatusLabel(selectedTaskFormState.status)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Origen</span>
                  <span>{selectedTask.origin}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Asignado a</span>
                  <span>{selectedTaskAssigneeLabel}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Necesidad del equipo</span>
                  <span>
                    {selectedTask.needFromTeam
                      ? needFromTeamT(selectedTask.needFromTeam)
                      : needFromTeamT(selectedTaskFormState.needFromTeam)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Canal</span>
                  <span>
                    {selectedTask.directness
                      ? directnessT(selectedTask.directness)
                      : directnessT(selectedTaskFormState.directness)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Email solicitante</span>
                  <span>{selectedTask.requesterEmail ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Fecha de presentación</span>
                  <span>{selectedTaskPresentationDateLabel}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">Pipedrive</span>
                  {selectedTask.pipedriveDealUrl ? (
                    <a
                      href={selectedTask.pipedriveDealUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[rgb(var(--primary))] hover:underline"
                    >
                      {selectedTask.pipedriveDealUrl}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            <div className="grid gap-4">
              <CollapsibleSection
                title="Datos generales"
                description="Actualizá los campos principales de la señal."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">{formT("statusLabel")}</span>
                    <select
                      value={selectedTaskFormState.status}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "status",
                          event.target.value as MapacheTaskStatus,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {statusKeys.map((option) => (
                        <option key={option} value={option}>
                          {formatStatusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">{formT("substatusLabel")}</span>
                    <select
                      value={selectedTaskFormState.substatus}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "substatus",
                          event.target.value as MapacheTaskSubstatus,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {SUBSTATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {substatusT(getSubstatusKey(option))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">{formT("titleLabel")}</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.title}
                      onChange={(event) =>
                        handleSelectedTaskFormChange("title", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.title ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.title}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Cliente</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.clientName}
                      onChange={(event) =>
                        handleSelectedTaskFormChange("clientName", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.clientName ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.clientName}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Producto</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.productKey}
                      onChange={(event) =>
                        handleSelectedTaskFormChange("productKey", event.target.value)
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.productKey ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.productKey}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Asignado a</span>
                      <select
                        value={selectedTaskFormState.assigneeId ?? ""}
                        onChange={(event) =>
                          handleSelectedTaskFormChange(
                            "assigneeId",
                            event.target.value ? event.target.value : null,
                          )
                        }
                        className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      >
                        <option value="">Sin asignar</option>
                        {mapacheUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {formatAssigneeOption(user)}
                          </option>
                        ))}
                      </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Necesidad del equipo</span>
                    <select
                      value={selectedTaskFormState.needFromTeam}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "needFromTeam",
                          event.target.value as MapacheNeedFromTeam,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {NEED_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {needFromTeamT(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Canal</span>
                    <select
                      value={selectedTaskFormState.directness}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "directness",
                          event.target.value as MapacheDirectness,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {DIRECTNESS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {directnessT(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-4 flex flex-col gap-1 text-sm">
                  <span className="text-white/80">{formT("descriptionLabel")}</span>
                  <textarea
                    value={selectedTaskFormState.description}
                    onChange={(event) =>
                      handleSelectedTaskFormChange("description", event.target.value)
                    }
                    className="min-h-[120px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    placeholder={formT("descriptionPlaceholder")}
                  />
                </label>
              </CollapsibleSection>

              <CollapsibleSection
                title="Contacto y contexto"
                description="Información de seguimiento y contexto comercial."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Email del solicitante</span>
                    <input
                      type="email"
                      value={selectedTaskFormState.requesterEmail}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "requesterEmail",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.requesterEmail ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.requesterEmail}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Rol del interlocutor</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.interlocutorRole}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "interlocutorRole",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.interlocutorRole ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.interlocutorRole}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Fecha de presentación</span>
                    <input
                      type="date"
                      value={selectedTaskFormState.presentationDate}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "presentationDate",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.presentationDate ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.presentationDate}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Pipedrive Deal URL</span>
                    <input
                      type="url"
                      value={selectedTaskFormState.pipedriveDealUrl}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "pipedriveDealUrl",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="https://"
                    />
                    {selectedTaskFormErrors.pipedriveDealUrl ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.pipedriveDealUrl}
                      </span>
                    ) : null}
                  </label>
                </div>
                <div className="mt-4 grid gap-4">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Sitios web del cliente</span>
                    <textarea
                      value={selectedTaskFormState.clientWebsiteUrls.join("\n")}
                      onChange={(event) =>
                        handleSelectedTaskWebsiteUrlsChange(event.target.value)
                      }
                      className="min-h-[88px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="Una URL por línea"
                    />
                    {selectedTaskFormErrors.clientWebsiteUrls ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.clientWebsiteUrls}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Dolor del cliente</span>
                    <textarea
                      value={selectedTaskFormState.clientPain}
                      onChange={(event) =>
                        handleSelectedTaskFormChange("clientPain", event.target.value)
                      }
                      className="min-h-[88px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="Contexto adicional"
                    />
                    {selectedTaskFormErrors.clientPain ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.clientPain}
                      </span>
                    ) : null}
                  </label>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Documentación"
                description="Datos para dimensionar el esfuerzo del equipo."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Tipo de gestión</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.managementType}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "managementType",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.managementType ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.managementType}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Cantidad de docs (aprox)</span>
                    <input
                      type="number"
                      min={0}
                      value={selectedTaskFormState.docsCountApprox}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "docsCountApprox",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.docsCountApprox ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.docsCountApprox}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Extensión de docs</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.docsLengthApprox}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "docsLengthApprox",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.docsLengthApprox ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.docsLengthApprox}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Conversaciones mensuales</span>
                    <input
                      type="number"
                      min={0}
                      value={selectedTaskFormState.avgMonthlyConversations}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "avgMonthlyConversations",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.avgMonthlyConversations ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.avgMonthlyConversations}
                      </span>
                    ) : null}
                  </label>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Integración y entregables"
                description="Configurá la integración y administrá los entregables."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Tipo</span>
                    <select
                      value={selectedTaskFormState.integrationType}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "integrationType",
                          event.target.value as FormState["integrationType"],
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {INTEGRATION_TYPES.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option
                            ? integrationTypeT(option)
                            : unspecifiedOptionLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/80">Responsable</span>
                    <select
                      value={selectedTaskFormState.integrationOwner}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "integrationOwner",
                          event.target.value as FormState["integrationOwner"],
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    >
                      {INTEGRATION_OWNERS.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option
                            ? integrationOwnerT(option)
                            : unspecifiedOptionLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="text-white/80">Nombre de la integración</span>
                    <input
                      type="text"
                      value={selectedTaskFormState.integrationName}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "integrationName",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    />
                    {selectedTaskFormErrors.integrationName ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.integrationName}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="text-white/80">Documentación</span>
                    <input
                      type="url"
                      value={selectedTaskFormState.integrationDocsUrl}
                      onChange={(event) =>
                        handleSelectedTaskFormChange(
                          "integrationDocsUrl",
                          event.target.value,
                        )
                      }
                      className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                      placeholder="https://"
                    />
                    {selectedTaskFormErrors.integrationDocsUrl ? (
                      <span className="text-xs text-rose-300">
                        {selectedTaskFormErrors.integrationDocsUrl}
                      </span>
                    ) : null}
                  </label>
                </div>
                <div className="mt-4 grid gap-4">
                  {selectedTaskFormState.deliverables.length === 0 ? (
                    <p className="text-sm text-white/60">
                      Podés agregar entregables para compartir el material actualizado.
                    </p>
                  ) : null}
                  {selectedTaskFormState.deliverables.map((deliverable, index) => {
                    const deliverableError =
                      selectedTaskFormErrors.deliverables?.[index];
                    return (
                      <div
                        key={`selected-deliverable-${index}`}
                        className="grid gap-3 rounded-lg border border-white/10 bg-slate-900/70 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                      >
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="text-white/80">Tipo</span>
                          <select
                            value={deliverable.type}
                            onChange={(event) =>
                              handleSelectedTaskDeliverableChange(
                                index,
                                "type",
                                event.target.value as MapacheDeliverableType,
                              )
                            }
                            className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                          >
                            {DELIVERABLE_TYPES.map((option) => (
                              <option key={option} value={option}>
                                {deliverableTypeT(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="text-white/80">Título</span>
                          <input
                            type="text"
                            value={deliverable.title}
                            onChange={(event) =>
                              handleSelectedTaskDeliverableChange(
                                index,
                                "title",
                                event.target.value,
                              )
                            }
                            className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                          />
                          {deliverableError?.title ? (
                            <span className="text-xs text-rose-300">
                              {deliverableError.title}
                            </span>
                          ) : null}
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="text-white/80">URL</span>
                          <input
                            type="url"
                            value={deliverable.url}
                            onChange={(event) =>
                              handleSelectedTaskDeliverableChange(
                                index,
                                "url",
                                event.target.value,
                              )
                            }
                            className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                          />
                          {deliverableError?.url ? (
                            <span className="text-xs text-rose-300">
                              {deliverableError.url}
                            </span>
                          ) : null}
                        </label>
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => handleSelectedTaskRemoveDeliverable(index)}
                            className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-wide text-white/70 transition hover:bg-white/10"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleSelectedTaskAddDeliverable}
                    className="inline-flex items-center rounded-md border border-dashed border-white/30 px-3 py-2 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
                  >
                    Agregar entregable
                  </button>
                </div>
              </CollapsibleSection>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={pendingDeletion !== null}
        onClose={handleCancelDeleteTask}
        title={<span className="text-base font-semibold">{actionsT("delete")}</span>}
        variant="inverted"
        disableCloseOnBackdrop={deletingTaskId === pendingDeletion}
        footer={
          <div className="flex justify-end gap-2 rounded-lg bg-white/10 px-4 py-3">
            <button
              type="button"
              onClick={handleCancelDeleteTask}
              className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              disabled={deletingTaskId === pendingDeletion}
            >
              {actionsT("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteTask}
              className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-rose-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!pendingDeletion || deletingTaskId !== null}
            >
              {deletingTaskId === pendingDeletion ? actionsT("deleting") : actionsT("delete")}
            </button>
          </div>
        }
        panelClassName="!bg-slate-950/95 !text-white !border-white/10 !shadow-[0_25px_60px_rgba(2,6,23,0.7)]"
        backdropClassName="!bg-slate-950/85"
      >
        <div className="flex flex-col gap-3 text-sm text-white/80">
          <p>{pendingDeletion ? actionsT("deleteConfirm", { id: pendingDeletion }) : null}</p>
        </div>
       </Modal>

      </>
    ) : null}

    </section>
  );
}
