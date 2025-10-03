import { notFound, redirect } from "next/navigation";

import MapachePortalClient from "./MapachePortalClient";
import type { MapacheTask } from "./types";
import { auth } from "@/lib/auth";
import { taskSelect } from "@/app/api/mapache/tasks/access";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MapachePortalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const isMapache = session.user.team === "Mapaches";
  const isAdmin = session.user.role === "superadmin";

  if (!isMapache && !isAdmin) {
    return notFound();
  }

  const tasks = await prisma.mapacheTask.findMany({
    select: taskSelect,
    orderBy: { createdAt: "desc" },
  });

  const initialTasks: MapacheTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    createdAt: task.createdAt?.toISOString(),
    updatedAt: task.updatedAt?.toISOString(),
    createdById: task.createdById,
  }));

  return (
    <div className="space-y-6 px-4 pb-10">
      <header className="space-y-1 pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Portal interno</p>
        <h1 className="text-3xl font-bold">Equipo Mapaches</h1>
        <p className="text-sm text-muted max-w-2xl">
          Accede al backlog priorizado, últimas actualizaciones y responsables para
          coordinar entregables clave del trimestre.
        </p>
      </header>

      <MapachePortalClient initialTasks={initialTasks} />
    </div>
  );
}
