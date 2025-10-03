"use client";

import * as React from "react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { useTranslations } from "@/app/LanguageProvider";

import type { MapacheTask, MapacheTaskStatus } from "./types";
import { MAPACHE_TASK_STATUSES } from "./types";

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

function getStatusLabelKey(status: MapacheTaskStatus) {
  return STATUS_LABEL_KEYS[status];
}

function normalizeTask(task: unknown): MapacheTask | null {
  if (typeof task !== "object" || task === null) return null;
  const record = task as Record<string, unknown>;
  const id = record.id;
  const title = record.title;
  const description = record.description;
  const status = record.status;

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (typeof title !== "string") return null;
  if (!STATUS_ORDER.includes(status as MapacheTaskStatus)) return null;

  return {
    id: String(id),
    title,
    description: typeof description === "string" ? description : null,
    status: status as MapacheTaskStatus,
    createdAt: typeof record.createdAt === "string" ? (record.createdAt as string) : undefined,
    updatedAt: typeof record.updatedAt === "string" ? (record.updatedAt as string) : undefined,
  };
}

export default function MapachePortalClient({ initialTasks }: MapachePortalClientProps) {
  const t = useTranslations("mapachePortal");
  const statusT = useTranslations("mapachePortal.statuses");
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
    async (task: MapacheTask) => {
      const confirmed = window.confirm(actionsT("deleteConfirm"));
      if (!confirmed) return;

      setDeletingTaskId(task.id);
      try {
        const response = await fetch(`/api/mapache/tasks`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: task.id }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setTasks((prev) => prev.filter((item) => item.id !== task.id));
        toast.success(toastT("deleteSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(toastT("deleteError"));
      } finally {
        setDeletingTaskId(null);
      }
    },
    [actionsT, toastT]
  );

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
          return (
            <article
              key={task.id}
              className="flex h-full flex-col justify-between rounded-xl border border-white/10 bg-slate-900/80 p-4 text-white shadow-soft"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{task.title}</h2>
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
                    {statusT(getStatusLabelKey(task.status))}
                  </span>
                </div>
                {task.description ? (
                  <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-white/40">{t("noDescription")}</p>
                )}
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
                  onClick={() => handleDeleteTask(task)}
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
    </section>
  );
}
