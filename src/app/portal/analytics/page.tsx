import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Globe,
  Calendar,
  ArrowRight,
  BarChart3,
} from "lucide-react";

import { auth } from "@/lib/auth";

type QuickAccessCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
};

const QUICK_ACCESS_CARDS: QuickAccessCard[] = [
  {
    title: "Dashboard",
    description: "Panel principal con KPIs y graficos de rendimiento",
    href: "/portal/analytics/dashboard",
    icon: LayoutDashboard,
    gradient: "from-purple-500/10 to-violet-500/10",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
  },
  {
    title: "Equipos",
    description: "Rendimiento por ejecutivo y equipo comercial",
    href: "/portal/analytics/equipos",
    icon: Users,
    gradient: "from-blue-500/10 to-indigo-500/10",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    title: "Regiones",
    description: "Analisis de rendimiento por region geografica",
    href: "/portal/analytics/regiones",
    icon: Globe,
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    title: "Reuniones Directo",
    description: "Analisis de deals de origen directo",
    href: "/portal/analytics/reuniones-directo",
    icon: Calendar,
    gradient: "from-amber-500/10 to-orange-500/10",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
];

export default async function AnalyticsPortalLobbyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userName = session.user.name?.split(" ")[0] || "Usuario";

  return (
    <div className="relative min-h-[calc(100vh-var(--nav-h))] px-4 pb-16 sm:px-6 lg:px-8 pt-8">
      <div className="pointer-events-none absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-300/30 via-violet-300/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-indigo-300/25 via-blue-300/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[250px] w-[250px] -translate-x-1/2 rounded-full bg-purple-200/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-10">
        <header className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-white/80 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Bienvenido, {userName}
          </div>
          <h1 className="bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Portal Analitico
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-600">
            Centro de metricas y analytics comerciales
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACCESS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 hover:bg-white hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <div className="relative z-10">
                  <div
                    className={`mb-4 inline-flex rounded-xl p-3 shadow-lg ${card.iconBg}`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-500">
                    {card.description}
                  </p>

                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600">
                    Acceder
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-5 py-3 text-sm text-slate-500 backdrop-blur-sm">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span>Datos sincronizados con Pipedrive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
