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
    <div className="px-4 pb-12">
      <section className="mx-auto max-w-5xl space-y-8 rounded-[32px] border border-white/10 bg-white/[0.04] px-8 py-10 shadow-[0_45px_120px_rgba(2,6,23,0.55)] backdrop-blur-lg">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60">
            Panorama
          </span>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Panorama rápido del pipeline
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/70">
            Cifras renderizadas en el servidor para acelerar la navegación entre secciones y mantener la foto general del equipo.
          </p>
          {lastUpdatedLabel ? (
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/40">
              Actualizado {lastUpdatedLabel}
            </p>
          ) : null}
          {hasError ? (
            <p className="text-xs font-medium text-white/70">
              No pudimos conectar con la base de datos para obtener los datos más recientes. Mostramos valores en blanco por ahora.
            </p>
          ) : null}
        </header>

        <dl className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/20 via-white/10 to-transparent p-5 shadow-[0_22px_70px_rgba(2,6,23,0.45)]">
            <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
              Total de tareas
            </dt>
            <dd className="mt-3 text-3xl font-semibold text-white">
              {numberFormatter.format(summary.total)}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/15 via-white/10 to-transparent p-5 shadow-[0_22px_70px_rgba(2,6,23,0.45)]">
            <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
              Vencen en 7 días
            </dt>
            <dd className="mt-3 text-3xl font-semibold text-white">
              {numberFormatter.format(summary.dueSoon)}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/15 via-white/10 to-transparent p-5 shadow-[0_22px_70px_rgba(2,6,23,0.45)]">
            <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
              Atrasadas
            </dt>
            <dd className="mt-3 text-3xl font-semibold text-white">
              {numberFormatter.format(summary.overdue)}
            </dd>
          </div>
        </dl>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_32px_90px_rgba(2,6,23,0.5)]">
          <table className="min-w-full divide-y divide-white/5 text-sm text-white/80">
            <thead className="bg-white/[0.04] text-left text-[11px] font-semibold uppercase tracking-[0.35em] text-white/55">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {summary.statusBreakdown.map((entry) => {
                const label =
                  entry.label ??
                  entry.statusKey ??
                  (entry.statusId ? `Estado ${entry.statusId}` : "Sin estado");
                return (
                  <tr key={entry.statusId ?? label} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 text-white/70">{label}</td>
                    <td className="px-4 py-3 text-right text-base font-semibold text-white">
                      {numberFormatter.format(entry.count)}
                    </td>
                  </tr>
                );
              })}
              {summary.statusBreakdown.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-sm text-white/60"
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
