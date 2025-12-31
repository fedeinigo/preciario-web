// src/app/portal/mapache/page.tsx
import { redirect } from "next/navigation";

import MapachePortalReadySignal from "@/app/mapache-portal/MapachePortalReadySignal";
import { auth } from "@/lib/auth";

function UnauthorizedNotice() {
  return (
    <div className="flex min-h-[calc(100vh-var(--nav-h))] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
        <h1 className="text-lg font-semibold text-white">
          No tienes acceso al portal Mapache.
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Ponte en contacto con una persona administradora si consideras que se trata de un error.
        </p>
      </div>
    </div>
  );
}

export default async function MapachePortalLobbyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { user } = session;
  const isAdmin = user.role === "admin";
  const isMapache = user.team === "Mapaches";

  if (!isAdmin && !isMapache) {
    return (
      <>
        <MapachePortalReadySignal />
        <UnauthorizedNotice />
      </>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-var(--nav-h))] space-y-6 px-4 pb-12 -mt-[var(--nav-h)] pt-[var(--nav-h)]">
      <MapachePortalReadySignal />
      <div className="pointer-events-none absolute -top-16 right-8 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-6 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <section className="relative z-10 mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          Portal Mapache
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Bienvenido al equipo Mapache
        </h1>
        <p className="mt-3 text-sm text-white/70">
          Este es el lobby del portal. En breve vas a encontrar accesos y recursos del equipo aqui.
        </p>
      </section>
    </div>
  );
}
