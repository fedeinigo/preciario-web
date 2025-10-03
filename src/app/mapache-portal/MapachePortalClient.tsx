"use client";

import * as React from "react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { useTranslations } from "@/app/LanguageProvider";

import type {
  MapacheTask,
  MapacheTaskStatus,
  MapacheTaskSubstatus,
  MapacheTaskDeliverable,
  MapacheDeliverableType,
} from "./types";
import {
  MAPACHE_TASK_STATUSES,
  MAPACHE_TASK_SUBSTATUSES,
  MAPACHE_DELIVERABLE_TYPES,
} from "./types";

type MapachePortalClientProps = {
  initialTasks: MapacheTask[];
};

type TaskFilter = "all" | MapacheTaskStatus;

type FormState = {
  title: string;
  description: string;
  status: MapacheTaskStatus;
};

const DEFAULT_FORM_STATE: FormState = {
  title: "",
  description: "",
  status: "PENDING",
};

const STATUS_ORDER: MapacheTaskStatus[] = [...MAPACHE_TASK_STATUSES];

const STATUS_LABEL_KEYS: Record<MapacheTaskStatus, "pending" | "in_progress" | "completed"> = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "completed",
};

const SUBSTATUS_ORDER: MapacheTaskSubstatus[] = [...MAPACHE_TASK_SUBSTATUSES];
const DELIVERABLE_TYPE_ORDER: MapacheDeliverableType[] = [...MAPACHE_DELIVERABLE_TYPES];

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

function normalizeDeliverable(deliverable: unknown): MapacheTaskDeliverable | null {
  if (typeof deliverable !== "object" || deliverable === null) return null;
  const record = deliverable as Record<string, unknown>;
  const id = record.id;
  const type = record.type;
  const title = record.title;
  const url = record.url;

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (!DELIVERABLE_TYPE_ORDER.includes(type as MapacheDeliverableType)) return null;
  if (typeof title !== "string" || typeof url !== "string") return null;

  return {
    id: String(id),
    type: type as MapacheDeliverableType,
    title,
    url,
    addedById:
      typeof record.addedById === "string"
        ? record.addedById
        : record.addedById == null
          ? null
          : undefined,
    createdAt: typeof record.createdAt === "string" ? (record.createdAt as string) : undefined,
  };
}

function normalizeTask(task: unknown): MapacheTask | null {
  if (typeof task !== "object" || task === null) return null;
  const record = task as Record<string, unknown>;
  const id = record.id;
  const title = record.title;
  const description = record.description;
  const status = record.status;
  const substatus = record.substatus;
  const assigneeId = record.assigneeId;
  const deliverables = record.deliverables;

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (typeof title !== "string") return null;
  if (!STATUS_ORDER.includes(status as MapacheTaskStatus)) return null;

  const normalizedSubstatus = SUBSTATUS_ORDER.includes(substatus as MapacheTaskSubstatus)
    ? (substatus as MapacheTaskSubstatus)
    : "BACKLOG";
  const normalizedAssigneeId =
    typeof assigneeId === "string"
      ? assigneeId
      : assigneeId == null
        ? null
        : undefined;

  const normalizedDeliverables = Array.isArray(deliverables)
    ? deliverables
        .map(normalizeDeliverable)
        .filter((item): item is MapacheTaskDeliverable => item !== null)
    : [];

  return {
    id: String(id),
    title,
    description: typeof description === "string" ? description : null,
    status: status as MapacheTaskStatus,
    substatus: normalizedSubstatus,
    assigneeId: normalizedAssigneeId,
    deliverables: normalizedDeliverables,
    createdAt: typeof record.createdAt === "string" ? (record.createdAt as string) : undefined,
    updatedAt: typeof record.updatedAt === "string" ? (record.updatedAt as string) : undefined,
    createdById:
      typeof record.createdById === "string" ? (record.createdById as string) : undefined,
  };
}

export default function MapachePortalClient({ initialTasks }: MapachePortalClientProps) {
  const t = useTranslations("mapachePortal");
  const statusT = useTranslations("mapachePortal.statuses");
  const statusBadgeT = useTranslations("mapachePortal.statusBadges");
  const substatusT = useTranslations("mapachePortal.substatuses");
  const deliverablesT = useTranslations("mapachePortal.deliverables");
  const deliverableTypesT = useTranslations("mapachePortal.deliverables.types");
  const formT = useTranslations("mapachePortal.form");
  const toastT = useTranslations("mapachePortal.toast");
  const emptyT = useTranslations("mapachePortal.empty");
  const actionsT = useTranslations("mapachePortal.actions");

  const [tasks, setTasks] = React.useState<MapacheTask[]>(() =>
    Array.isArray(initialTasks) ? initialTasks : []
  );
  const [activeFilter, setActiveFilter] = React.useState<TaskFilter>("all");
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [formState, setFormState] = React.useState<FormState>(DEFAULT_FORM_STATE);
  const [submitting, setSubmitting] = React.useState(false);

  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = React.useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      try {
        setLoading(true);
        setFetchError(null);
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
              .map(normalizeTask)
              .filter((task): task is MapacheTask => task !== null)
          : [];

        if (!cancelled) {
          setTasks(nextTasks);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError((error as Error).message);
          toast.error(toastT("loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [toastT]);

  React.useEffect(() => {
    setTasks(Array.isArray(initialTasks) ? initialTasks : []);
  }, [initialTasks]);

  const filteredTasks = React.useMemo(() => {
    if (activeFilter === "all") return tasks;
    return tasks.filter((task) => task.status === activeFilter);
  }, [tasks, activeFilter]);

  const resetForm = React.useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
  }, []);

  const handleOpenModal = React.useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const handleCloseModal = React.useCallback(() => {
    if (submitting) return;
    setModalOpen(false);
  }, [submitting]);

  const handleFormChange = React.useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCreateTask = React.useCallback(async () => {
    if (!formState.title.trim()) {
      toast.error(formT("titleRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/mapache/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formState.title.trim(),
          description: formState.description.trim(),
          status: formState.status,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const task = normalizeTask(payload);

      if (!task) {
        throw new Error("Invalid response payload");
      }

      setTasks((prev) => [task, ...prev]);
      toast.success(toastT("createSuccess"));
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(toastT("createError"));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }, [formState, formT, resetForm, toastT]);

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
        const updatedTask = normalizeTask(payload) ?? { ...task, status: nextStatus };

        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, ...updatedTask } : item))
        );
        toast.success(toastT("updateSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(toastT("updateError"));
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [toastT]
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
    [toastT]
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
            onClick={handleOpenModal}
            className="inline-flex items-center rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {actionsT("add")}
          </button>
        </div>
      </header>

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
        open={modalOpen}
        onClose={handleCloseModal}
        title={<span className="text-base font-semibold">{formT("title")}</span>}
        variant="inverted"
        footer={
          <div className="flex justify-end gap-2 rounded-lg bg-white/10 px-4 py-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              disabled={submitting}
            >
              {formT("cancel")}
            </button>
            <button
              type="button"
              onClick={handleCreateTask}
              className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? formT("saving") : formT("confirm")}
            </button>
          </div>
        }
        panelClassName="!bg-slate-950/95 !text-white !border-white/10 !shadow-[0_25px_60px_rgba(2,6,23,0.7)]"
        backdropClassName="!bg-slate-950/85"
      >
        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/80">{formT("titleLabel")}</span>
            <input
              type="text"
              value={formState.title}
              onChange={(event) => handleFormChange("title", event.target.value)}
              className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
              placeholder={formT("titlePlaceholder")}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/80">{formT("descriptionLabel")}</span>
            <textarea
              value={formState.description}
              onChange={(event) => handleFormChange("description", event.target.value)}
              className="min-h-[100px] rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
              placeholder={formT("descriptionPlaceholder")}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/80">{formT("statusLabel")}</span>
            <select
              value={formState.status}
              onChange={(event) =>
                handleFormChange("status", event.target.value as MapacheTaskStatus)
              }
              className="rounded-md border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-[rgb(var(--primary))] focus:outline-none"
            >
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {statusT(getStatusLabelKey(status))}
                </option>
              ))}
            </select>
          </label>
        </form>
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
