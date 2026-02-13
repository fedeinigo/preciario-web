import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import MapachePortalReadySignal from "../MapachePortalReadySignal";
import { auth } from "@/lib/auth";
import { MapachePortalQueryProvider } from "../context/query-client";

const FULL_ACCESS_EMAILS = new Set(["federico.i@wisecx.com"]);

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
  const email = user.email?.trim().toLowerCase() ?? "";
  const isAdmin = role === "admin";
  const isMapache = team === "Mapaches";
  const hasFullAccess = FULL_ACCESS_EMAILS.has(email);

  if (!isAdmin && !isMapache && !hasFullAccess) {
    return <UnauthorizedNotice />;
  }

  return (
    <MapachePortalQueryProvider>
      <MapachePortalReadySignal />
      <div className="space-y-6 px-4 pb-10 -mt-[var(--nav-h)] pt-[var(--nav-h)]">
        {children}
      </div>
    </MapachePortalQueryProvider>
  );
}
