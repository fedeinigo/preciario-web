"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import MapachePortalClient from "./MapachePortalClient";

type AuthorizationState = "loading" | "authorized" | "unauthorized" | "redirect";

export default function MapachePortalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authorization, setAuthorization] = React.useState<AuthorizationState>(
    "loading",
  );
  const hasRedirectedRef = React.useRef(false);
  const sessionUser = session?.user ?? null;

  React.useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!sessionUser) {
      setAuthorization((prev) => (prev === "redirect" ? prev : "redirect"));
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace("/");
      }
      return;
    }

    const isMapache = sessionUser.team === "Mapaches";
    const isAdmin = ["admin", "superadmin"].includes(sessionUser.role ?? "");

    if (!isMapache && !isAdmin) {
      setAuthorization((prev) =>
        prev === "unauthorized" ? prev : "unauthorized",
      );
      return;
    }

    setAuthorization((prev) => (prev === "authorized" ? prev : "authorized"));
  }, [router, sessionUser, status]);

  if (status === "loading" || authorization === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Cargando portal…</p>
      </div>
    );
  }

  if (authorization === "redirect") {
    return null;
  }

  if (authorization === "unauthorized") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2 px-4 text-center">
        <h1 className="text-lg font-semibold">No tienes acceso al portal Mapache.</h1>
        <p className="text-sm text-muted-foreground">
          Ponte en contacto con una persona administradora si consideras que se trata
          de un error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-10">
      <MapachePortalClient initialTasks={[]} />
    </div>
  );
}
