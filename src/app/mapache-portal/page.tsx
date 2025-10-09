import { redirect } from "next/navigation";

import MapachePortalClient from "./MapachePortalClient";
import { auth } from "@/lib/auth";
import { loadMapachePortalBootstrap } from "./bootstrap.server";

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

export default async function MapachePortalPage() {
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
    <div className="space-y-6 px-4 pb-10">
      <MapachePortalClient initialBootstrap={bootstrap} />
    </div>
  );
}
