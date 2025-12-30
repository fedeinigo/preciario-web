// src/app/portal/mapache/page.tsx
import { redirect } from "next/navigation";

import MapachePortalReadySignal from "@/app/mapache-portal/MapachePortalReadySignal";
import { auth } from "@/lib/auth";

function UnauthorizedNotice() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2 px-4 text-center">
      <h1 className="text-lg font-semibold">
        No tienes acceso al portal Mapache.
      </h1>
      <p className="text-sm text-muted-foreground">
        Ponte en contacto con una persona administradora si consideras que se
        trata de un error.
      </p>
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
    <div className="space-y-6 px-4 pb-10 -mt-[var(--nav-h)] pt-[var(--nav-h)]">
      <MapachePortalReadySignal />
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          Portal Mapache
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Bienvenido al equipo Mapache
        </h1>
        <p className="mt-3 text-sm text-white/70">
          Este es el lobby del portal. En breve vas a encontrar accesos y recursos
          del equipo aqu&#237;.
        </p>
      </section>
    </div>
  );
}
