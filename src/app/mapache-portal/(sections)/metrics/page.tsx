import { loadInsightsSummary } from "../../summary.server";

const numberFormatter = new Intl.NumberFormat("es-AR");
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function MapachePortalMetricsPage() {
  const summary = await loadInsightsSummary();

  const cards = [
    {
      title: "Snapshot global",
      data: summary.latestAll,
      accent: "border-sky-200/80 bg-sky-50 text-sky-700",
    },
    {
      title: "Snapshot filtrado",
      data: summary.latestFiltered,
      accent: "border-violet-200/80 bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="px-4 pb-10">
      <section className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Métricas en cache servidor
          </h2>
          <p className="text-sm text-slate-600">
            Últimas capturas persistidas desde el backend para el panel de
            insights.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`rounded-2xl border p-4 ${card.accent}`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                {card.title}
              </h3>
              {card.data ? (
                <dl className="mt-4 space-y-2 text-slate-800">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Capturado
                    </dt>
                    <dd className="text-sm font-medium">
                      {dateTimeFormatter.format(new Date(card.data.capturedAt))}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Total
                      </dt>
                      <dd className="text-base font-semibold">
                        {numberFormatter.format(card.data.total)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-amber-500">
                        En camino
                      </dt>
                      <dd className="text-base font-semibold">
                        {numberFormatter.format(card.data.dueSoonCount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-rose-500">
                        Atraso
                      </dt>
                      <dd className="text-base font-semibold">
                        {numberFormatter.format(card.data.overdueCount)}
                      </dd>
                    </div>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Aún no hay snapshots persistidos para esta vista.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
