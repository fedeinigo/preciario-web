"use client";

import { useMemo } from "react";

import type { MapacheTask } from "./tasks.stub";

type Props = {
  initialTasks: MapacheTask[];
};

const STATUS_LABELS: Record<MapacheTask["status"], string> = {
  "backlog": "Backlog",
  "in-progress": "En curso",
  "blocked": "Bloqueada",
  "qa": "QA",
  "done": "Completada",
};

export default function MapachePortalClient({ initialTasks }: Props) {
  const summary = useMemo(() => {
    return initialTasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc.byStatus[task.status] += 1;
        return acc;
      },
      {
        total: 0,
        byStatus: {
          backlog: 0,
          "in-progress": 0,
          blocked: 0,
          qa: 0,
          done: 0,
        } as Record<MapacheTask["status"], number>,
      },
    );
  }, [initialTasks]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-muted uppercase tracking-wide">Total tareas</p>
          <p className="mt-2 text-2xl font-semibold">{summary.total}</p>
        </div>
        {(
          Object.keys(summary.byStatus) as Array<MapacheTask["status"]>
        ).map((status) => (
          <div key={status} className="card">
            <p className="text-xs text-muted uppercase tracking-wide">
              {STATUS_LABELS[status]}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.byStatus[status]}
            </p>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Backlog del equipo Mapaches</h2>
            <p className="text-sm text-muted">
              Última actualización {formatUpdatedAt(initialTasks)} — prioriza las tareas con
              fecha próxima.
            </p>
          </div>
          <span className="chip bg-white/10 text-xs uppercase tracking-wide">
            vista inicial
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">ID</th>
                <th className="table-th">Título</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Responsable</th>
                <th className="table-th">Entrega</th>
                <th className="table-th">Etiquetas</th>
              </tr>
            </thead>
            <tbody>
              {initialTasks.map((task) => (
                <tr key={task.id} className="border-b border-[rgba(255,255,255,0.06)] last:border-none">
                  <td className="table-td font-medium">{task.id}</td>
                  <td className="table-td">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted mt-1">{task.description}</p>
                  </td>
                  <td className="table-td">
                    <StatusPill status={task.status} />
                  </td>
                  <td className="table-td">{task.owner}</td>
                  <td className="table-td">{formatDate(task.dueDate)}</td>
                  <td className="table-td">
                    <TagList tags={task.tags} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type StatusPillProps = {
  status: MapacheTask["status"];
};

function StatusPill({ status }: StatusPillProps) {
  const label = STATUS_LABELS[status];

  return (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-white/5 text-white">
      {label}
    </span>
  );
}

type TagListProps = {
  tags?: string[];
};

function TagList({ tags }: TagListProps) {
  if (!tags || tags.length === 0) {
    return <span className="text-xs text-muted">—</span>;
  }

  return (
    <ul className="flex flex-wrap gap-1 text-xs text-muted">
      {tags.map((tag) => (
        <li key={tag} className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-wide">
          {tag}
        </li>
      ))}
    </ul>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatUpdatedAt(tasks: MapacheTask[]) {
  const timestamp = tasks
    .map((task) => task.lastUpdated)
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .sort((a, b) => b - a)[0];

  if (!timestamp) return "reciente";

  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(timestamp));
  } catch {
    return "reciente";
  }
}
