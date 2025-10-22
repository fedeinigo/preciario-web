import { loadTaskSummary } from "../../summary.server";

const numberFormatter = new Intl.NumberFormat("es-AR");
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function MapachePortalTasksPage() {
  const summary = await loadTaskSummary();

  const lastUpdatedLabel = summary.lastUpdatedAt
    ? dateTimeFormatter.format(new Date(summary.lastUpdatedAt))
    : null;
  const hasError = Boolean(summary.error);

  return (
    <div className="px-4 pb-10">
      <section className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Panorama rápido del pipeline
          </h2>
          <p className="text-sm text-slate-600">
            Cifras renderizadas en el servidor para acelerar la navegación entre
            secciones.
          </p>
          {lastUpdatedLabel ? (
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Actualizado {lastUpdatedLabel}
            </p>
          ) : null}
          {hasError ? (
            <p className="text-xs font-medium text-amber-600">
              No pudimos conectar con la base de datos para obtener los datos
              más recientes. Mostramos valores en blanco por ahora.
            </p>
          ) : null}
        </header>

        <dl className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total de tareas
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">
              {numberFormatter.format(summary.total)}
            </dd>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-amber-600">
              Vencen en 7 días
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-amber-700">
              {numberFormatter.format(summary.dueSoon)}
            </dd>
          </div>
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-rose-600">
              Atrasadas
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-rose-700">
              {numberFormatter.format(summary.overdue)}
            </dd>
          </div>
        </dl>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {summary.statusBreakdown.map((entry) => {
                const label =
                  entry.label ??
                  entry.statusKey ??
                  (entry.statusId ? `Estado ${entry.statusId}` : "Sin estado");
                return (
                  <tr key={entry.statusId ?? label}>
                    <td className="px-4 py-2 text-slate-700">{label}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                      {numberFormatter.format(entry.count)}
                    </td>
                  </tr>
                );
              })}
              {summary.statusBreakdown.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-center text-slate-500"
                  >
                    No hay registros de estados cargados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
