"use client";

import * as React from "react";

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

type MapachePortalClientProps = {
  initialTasks: MapacheTask[];
};

type TaskFilter = "all" | MapacheTaskStatus;

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
type DeliverableTypeKey = "scope" | "quote" | "scope_and_quote" | "other";

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

function getDeliverableTypeKey(type: MapacheDeliverableType): DeliverableTypeKey {
  switch (type) {
    case "SCOPE":
      return "scope";
    case "QUOTE":
      return "quote";
    case "SCOPE_AND_QUOTE":
      return "scope_and_quote";
    case "OTHER":
    default:
      return "other";
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
    assigneeId: state.assigneeId ?? null,
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
  return user.name ? `${user.name} (${user.email})` : user.email;
}

export default function MapachePortalClient({
  initialTasks,
}: MapachePortalClientProps) {
  const t = useTranslations("mapachePortal");
  const statusT = useTranslations("mapachePortal.statuses");
  const statusBadgeT = useTranslations("mapachePortal.statusBadges");
  const substatusT = useTranslations("mapachePortal.substatuses");
  const deliverablesT = useTranslations("mapachePortal.deliverables");
  const deliverableTypesT = useTranslations("mapachePortal.deliverables.types");
  const formT = useTranslations("mapachePortal.form");
  const toastT = useTranslations("mapachePortal.toast");
  const validationT = useTranslations("mapachePortal.validation");
  const emptyT = useTranslations("mapachePortal.empty");
  const actionsT = useTranslations("mapachePortal.actions");

  const [tasks, setTasks] = React.useState<MapacheTask[]>(() =>
    Array.isArray(initialTasks) ? initialTasks : [],
  );
  const [activeFilter, setActiveFilter] = React.useState<TaskFilter>("all");
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [showForm, setShowForm] = React.useState(false);
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
    loadTasks();
  }, [loadTasks]);

  React.useEffect(() => {
    setTasks(Array.isArray(initialTasks) ? initialTasks : []);
  }, [initialTasks]);

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
    return tasks.filter((task) => task.status === activeFilter);
  }, [tasks, activeFilter]);

  const resetForm = React.useCallback(() => {
    setFormState(createDefaultFormState());
    setFormErrors({});
  }, []);

  const handleToggleForm = React.useCallback(() => {
    setShowForm((prev) => {
      const next = !prev;
      if (!next) {
        resetForm();
      } else {
        setFormState(createDefaultFormState());
        setFormErrors({});
      }
      return next;
    });
  }, [resetForm]);

  const handleFormChange = React.useCallback(<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleWebsiteUrlsChange = React.useCallback(
    (value: string) => {
      const urls = value.split("\n");
      handleFormChange(
        "clientWebsiteUrls",
        urls.map((url) => url.trim()),
      );
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
  }, []);

  const handleRemoveDeliverable = React.useCallback((index: number) => {
    setFormState((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, idx) => idx !== index),
    }));
    setFormErrors((prev) => {
      if (!prev.deliverables) return prev;
      const nextDeliverables = prev.deliverables.filter((_, idx) => idx !== index);
      if (nextDeliverables.length === 0) {
        const nextErrors: FormErrors = { ...prev };
        delete nextErrors.deliverables;
        return nextErrors;
      }
      return {
        ...prev,
        deliverables: nextDeliverables,
      };
    });
  }, []);

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
    [],
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
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error(error);
      toast.error(toastT("createError"));
    } finally {
      setSubmitting(false);
    }
  }, [formState, loadTasks, resetForm, toastT, validationMessages]);

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
            onClick={handleToggleForm}
            className="inline-flex items-center rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {showForm ? formT("cancel") : actionsT("add")}
          </button>
        </div>
      </header>

      {showForm ? (
        <form
          className="rounded-xl border border-white/10 bg-slate-950/70 p-6 text-white shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            if (!submitting) {
              void handleCreateTask();
            }
          }}
        >
          <div className="grid gap-6">
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
                        {option}
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
                        {option}
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
            </section>

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

            <section className="grid gap-4">
              <h2 className="text-lg font-semibold text-white">Integración</h2>
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
                        {option || unspecifiedOptionLabel}
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
                        {option || unspecifiedOptionLabel}
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
            </section>

            <section className="grid gap-4">
              <h2 className="text-lg font-semibold text-white">Descripción</h2>
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

            <section className="grid gap-4">
              <h2 className="text-lg font-semibold text-white">Entregables</h2>
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
                              {option}
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
            </section>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Estado inicial: {formState.status} / {formState.substatus} · Origen: {" "}
              {formState.origin}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                disabled={submitting}
              >
                {formT("cancel")}
              </button>
              <button
                type="submit"
                className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? formT("saving") : formT("confirm")}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {["all", ...STATUS_ORDER].map((status) => {
          const isActive = activeFilter === status;
          const label =
            status === "all"
              ? statusT("all")
              : statusT(getStatusLabelKey(status as MapacheTaskStatus));
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveFilter(status as TaskFilter)}
              className={`rounded-full border px-4 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                isActive
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))] text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          );
        })}
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
                <div className="flex flex-col gap-3">
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
                </div>

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
                              {deliverableTypesT(getDeliverableTypeKey(deliverable.type))}
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
