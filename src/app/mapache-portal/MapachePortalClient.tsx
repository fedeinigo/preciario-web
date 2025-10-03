"use client";

import * as React from "react";

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
  MAPACHE_TASK_STATUSES,
  normalizeMapacheTask,
} from "./types";

const STATUS_ORDER: MapacheTaskStatus[] = [...MAPACHE_TASK_STATUSES];
const NEED_OPTIONS: MapacheNeedFromTeam[] = [...MAPACHE_NEEDS_FROM_TEAM];
const DIRECTNESS_OPTIONS: MapacheDirectness[] = [...MAPACHE_DIRECTNESS];
const INTEGRATION_TYPES: (MapacheIntegrationType | "")[] = [
  "",
  ...MAPACHE_INTEGRATION_TYPES,
];
const INTEGRATION_OWNERS: (MapacheIntegrationOwner | "")[] = [
  "",
  ...MAPACHE_INTEGRATION_OWNERS,
];
const DELIVERABLE_TYPES: MapacheDeliverableType[] = [...MAPACHE_DELIVERABLE_TYPES];

const EMAIL_REGEX = /.+@.+\..+/i;

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
};

type TaskFilter = "all" | "mine" | "unassigned" | MapacheTaskStatus;

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

const SUBSTATUS_BADGE_CLASSNAME =
  "border-white/10 bg-white/5 text-white/60 backdrop-blur-sm";

type StatusBadgeKey = keyof typeof STATUS_BADGE_CLASSNAMES;
function getStatusLabelKey(status: MapacheTaskStatus) {
  return STATUS_LABEL_KEYS[status];
}


function getStatusBadgeKey(task: MapacheTask): StatusBadgeKey {
  if (task.status === "PENDING") {
    return task.assigneeId ? "assigned" : "unassigned";
  }

  if (task.status === "IN_PROGRESS") {
    return "in_progress";
  }

  return "completed";
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
    status: "PENDING",
    substatus: "BACKLOG",
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
}: MapachePortalClientProps) {
  const { data: session } = useSession();
  const t = useTranslations("mapachePortal");
  const statusT = useTranslations("mapachePortal.statuses");
  const statusBadgeT = useTranslations("mapachePortal.statusBadges");
  const substatusT = useTranslations("mapachePortal.substatuses");
  const deliverablesT = useTranslations("mapachePortal.deliverables");
  const formT = useTranslations("mapachePortal.form");
  const toastT = useTranslations("mapachePortal.toast");
  const validationT = useTranslations("mapachePortal.validation");
  const emptyT = useTranslations("mapachePortal.empty");
  const actionsT = useTranslations("mapachePortal.actions");
  const filtersT = useTranslations("mapachePortal.filters");
  const assignmentT = useTranslations("mapachePortal.assignment");
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

  const deliverableTypeT = React.useCallback(
    (value: MapacheDeliverableType) => deliverableTypeTranslations(value),
    [deliverableTypeTranslations],
  );

  const [tasks, setTasks] = React.useState<MapacheTask[]>(() =>
    Array.isArray(initialTasks) ? initialTasks : [],
  );
  const [activeFilter, setActiveFilter] = React.useState<TaskFilter>("all");
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [assignmentRatios, setAssignmentRatios] = React.useState<AssignmentRatios>({});
  const [ratiosLoaded, setRatiosLoaded] = React.useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = React.useState(false);
  const [assignmentDraft, setAssignmentDraft] = React.useState<Record<string, string>>({});
  const [autoAssigning, setAutoAssigning] = React.useState(false);

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
              .map(normalizeMapacheTask)
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
    [toastT],
  );

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
              } satisfies MapacheUser;
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

  const filteredTasks = React.useMemo(() => {
    if (activeFilter === "all") return tasks;
    if (activeFilter === "unassigned") {
      return tasks.filter((task) => !task.assigneeId);
    }
    if (activeFilter === "mine") {
      if (!currentUserId && !currentUserEmail) {
        return [];
      }
      return tasks.filter((task) => {
        const assigneeId =
          typeof task.assigneeId === "string" && task.assigneeId.trim()
            ? task.assigneeId.trim()
            : null;
        if (assigneeId && currentUserId && assigneeId === currentUserId) {
          return true;
        }
        const assigneeEmail =
          typeof task.assignee?.email === "string"
            ? task.assignee.email.trim().toLowerCase()
            : null;
        if (assigneeEmail && currentUserEmail && assigneeEmail === currentUserEmail) {
          return true;
        }
        return false;
      });
    }
    return tasks.filter((task) => task.status === activeFilter);
  }, [
    activeFilter,
    currentUserEmail,
    currentUserId,
    tasks,
  ]);

  const filterOptions = React.useMemo(
    () =>
      [
        { value: "all" as TaskFilter, label: statusT("all") },
        { value: "mine" as TaskFilter, label: filtersT("mine") },
        {
          value: "unassigned" as TaskFilter,
          label: filtersT("unassigned"),
        },
        ...STATUS_ORDER.map((status) => ({
          value: status as TaskFilter,
          label: statusT(getStatusLabelKey(status)),
        })),
      ],
    [filtersT, statusT],
  );

  const assignmentDraftTotal = React.useMemo(() => {
    return mapacheUsers.reduce((sum, user) => {
      const raw = assignmentDraft[user.id];
      const parsed = raw ? parsePercentageInput(raw) : null;
      if (parsed === null) return sum;
      return sum + parsed;
    }, 0);
  }, [assignmentDraft, mapacheUsers]);

  const handleOpenAssignmentModal = React.useCallback(() => {
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
    setShowAssignmentModal(true);
  }, [assignmentRatios, mapacheUsers]);

  const handleCloseAssignmentModal = React.useCallback(() => {
    setShowAssignmentModal(false);
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
      setShowAssignmentModal(false);
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
      setShowAssignmentModal(false);
      return;
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (total <= 0) {
      setAssignmentRatios({});
      setShowAssignmentModal(false);
      return;
    }

    setAssignmentRatios(
      Object.fromEntries(
        entries.map(([id, value]) => [id, value / total] as const),
      ),
    );
    setShowAssignmentModal(false);
  }, [assignmentDraft, mapacheUsers]);

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
          onClick={handleCloseAssignmentModal}
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
      const task = normalizeMapacheTask(payloadResponse);

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
  }, [formState, handleCloseForm, loadTasks, toastT, validationMessages]);

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
          normalizeMapacheTask(payload) ?? { ...task, status: nextStatus };

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
    [toastT],
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
      const updatedTask = normalizeMapacheTask(payloadResponse);

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

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOpenAssignmentModal}
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
        open={showAssignmentModal}
        onClose={handleCloseAssignmentModal}
        variant="inverted"
        title={assignmentT("title")}
        panelClassName="w-full max-w-xl"
        footer={assignmentModalFooter}
      >
        <div className="space-y-4 text-white">
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
                        <option key={user.email} value={user.email}>
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

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
                className={`rounded-full border px-4 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  isActive
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))] text-white"
                    : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {activeFilter === "unassigned" ? (
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

      {loading && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
          {t("loading")}
        </div>
      )}

      {!loading && filteredTasks.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
          <p className="font-medium text-white">{emptyT("title")}</p>
          <p className="mt-1 text-white/70">{emptyT("description")}</p>
        </div>
      )}

      {fetchError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {t("loadFallback")}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTasks.map((task) => {
          const isUpdating = updatingTaskId === task.id;
          const isDeleting = deletingTaskId === task.id;
          const statusBadgeKey = getStatusBadgeKey(task);
          return (
            <article
              key={task.id}
              className="flex h-full flex-col justify-between rounded-xl border border-white/10 bg-slate-950/80 p-4 text-white shadow-soft"
            >
              <div className="flex flex-1 flex-col gap-4">
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => openTask(task)}
                  aria-label={`Abrir detalles de ${task.title}`}
                  className="flex flex-col gap-3 rounded-lg border border-transparent bg-transparent p-0 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white">{task.title}</h2>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_BADGE_CLASSNAMES[statusBadgeKey]}`}
                      >
                        {statusBadgeT(statusBadgeKey)}
                      </span>
                      {task.substatus ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${SUBSTATUS_BADGE_CLASSNAME}`}
                        >
                          {substatusT(getSubstatusKey(task.substatus))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {task.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-white/40">{t("noDescription")}</p>
                  )}
                </button>

                <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <header className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/60">
                    <span>{deliverablesT("title")}</span>
                    <span className="text-[10px] font-medium text-white/40">
                      {task.deliverables.length}
                    </span>
                  </header>
                  {task.deliverables.length > 0 ? (
                    <ul className="flex flex-col gap-2 text-sm text-white/70">
                      {task.deliverables.map((deliverable) => (
                        <li
                          key={deliverable.id}
                          className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-white/5 bg-slate-950/70 p-2"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                              {deliverableTypeT(deliverable.type)}
                            </span>
                            <p className="truncate text-sm text-white/80" title={deliverable.title}>
                              {deliverable.title}
                            </p>
                          </div>
                          <a
                            href={deliverable.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-[rgb(var(--primary))]/50 hover:text-[rgb(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50"
                          >
                            {deliverablesT("open")}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/50">{deliverablesT("empty")}</p>
                  )}
                </section>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-white/70">
                  <span>{actionsT("statusLabel")}:</span>
                  <select
                    className="min-w-[140px] rounded-md border border-white/20 bg-slate-950/60 px-2 py-1 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
                    value={task.status}
                    onChange={(event) =>
                      handleStatusChange(task, event.target.value as MapacheTaskStatus)
                    }
                    disabled={isUpdating || isDeleting}
                  >
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {statusT(getStatusLabelKey(status))}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => handleRequestDeleteTask(task.id)}
                  disabled={isDeleting || isUpdating}
                  className="ml-auto inline-flex items-center rounded-md border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:bg-rose-500/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? actionsT("deleting") : actionsT("delete")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

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
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    STATUS_BADGE_CLASSNAMES[getStatusBadgeKey(selectedTask)]
                  }`}
                >
                  {statusBadgeT(getStatusBadgeKey(selectedTask))}
                </span>
                {selectedTask.substatus ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
                    {substatusT(getSubstatusKey(selectedTask.substatus))}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 text-xs text-white/70 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white/80">
                    {actionsT("statusLabel")}
                  </span>
                  <span>{statusT(getStatusLabelKey(selectedTask.status))}</span>
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
                        <option key={user.email} value={user.email}>
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
    </section>
  );
}
