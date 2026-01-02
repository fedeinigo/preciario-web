import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import MapachePortalReadySignal from "../MapachePortalReadySignal";
import { auth } from "@/lib/auth";
import { MapachePortalQueryProvider } from "../context/query-client";

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
  const isAdmin = role === "admin";
  const isMapache = team === "Mapaches";

  if (!isAdmin && !isMapache) {
    return <UnauthorizedNotice />;
  }

  return (
    <MapachePortalQueryProvider>
      <MapachePortalReadySignal />
      <div className="space-y-6 px-4 pb-10 pt-6">
        {children}
      </div>
    </MapachePortalQueryProvider>
  );
}
