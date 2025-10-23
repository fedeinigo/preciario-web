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
    },
    {
      title: "Snapshot filtrado",
      data: summary.latestFiltered,
    },
  ];

  return (
    <div className="px-4 pb-12">
      <section className="mx-auto max-w-4xl space-y-8 rounded-[32px] border border-white/10 bg-white/[0.04] px-8 py-10 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur-lg">
        <header className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">
            Métricas en cache servidor
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/70">
            Últimas capturas persistidas desde el backend para el panel de insights y comparativas rápidas dentro del equipo.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 text-white/80 shadow-[0_28px_90px_rgba(2,6,23,0.5)]"
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                {card.title}
              </h3>
              {card.data ? (
                <dl className="mt-4 space-y-3 text-white">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-white/55">
                      Capturado
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-white/80">
                      {dateTimeFormatter.format(new Date(card.data.capturedAt))}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm text-white/70">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                        Total
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-white">
                        {numberFormatter.format(card.data.total)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                        En camino
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-white">
                        {numberFormatter.format(card.data.dueSoonCount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                        Atraso
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-white">
                        {numberFormatter.format(card.data.overdueCount)}
                      </dd>
                    </div>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-white/65">
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
