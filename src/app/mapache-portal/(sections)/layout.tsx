import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import MapachePortalSectionLayout from "../MapachePortalSectionLayout";
import MapachePortalReadySignal from "../MapachePortalReadySignal";
import { auth } from "@/lib/auth";
import { loadMapachePortalBootstrap } from "../bootstrap.server";

function UnauthorizedNotice() {
  return (
    <>
      <MapachePortalReadySignal />
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2 px-4 text-center">
        <h1 className="text-lg font-semibold">
          No tienes acceso al portal Mapache.
        </h1>
        <p className="text-sm text-muted-foreground">
          Ponte en contacto con una persona administradora si consideras que se
          trata de un error.
        </p>
      </div>
    </>
  );
}

type MapachePortalSectionsLayoutProps = {
  children: ReactNode;
};

export default async function MapachePortalSectionsLayout({
  children,
}: MapachePortalSectionsLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { user } = session;
  const role = user.role ?? "";
  const team = user.team ?? null;
  const isAdmin = role === "admin" || role === "superadmin";
  const isMapache = team === "Mapaches";

  if (!isAdmin && !isMapache) {
    return <UnauthorizedNotice />;
  }

  const bootstrap = await loadMapachePortalBootstrap();

  return (
    <MapachePortalSectionLayout initialBootstrap={bootstrap}>
      {children}
    </MapachePortalSectionLayout>
  );
}
