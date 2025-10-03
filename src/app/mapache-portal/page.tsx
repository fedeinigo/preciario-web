import { notFound, redirect } from "next/navigation";

import MapachePortalClient from "./MapachePortalClient";
import type {
  MapacheTask,
  MapacheTaskStatus,
  MapacheTaskSubstatus,
  MapacheDeliverableType,
} from "./types";
import { auth } from "@/lib/auth";
import { taskSelect } from "@/app/api/mapache/tasks/access";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MapacheTaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  substatus: string;
  assigneeId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: string | null;
  deliverables?: Array<{
    id: string;
    type: string;
    title: string;
    url: string;
    addedById: string | null;
    createdAt: Date | null;
  }>;
};

const mapacheTaskClient = (prisma as unknown as { mapacheTask: { findMany: (args: unknown) => Promise<unknown> } }).mapacheTask;

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

  const tasks = (await mapacheTaskClient.findMany({
    select: taskSelect,
    orderBy: { createdAt: "desc" },
  })) as MapacheTaskRecord[];


  const initialTasks: MapacheTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status as MapacheTaskStatus,
    substatus: task.substatus as MapacheTaskSubstatus,
    assigneeId: task.assigneeId,
    deliverables: task.deliverables?.map((deliverable) => ({
      id: deliverable.id,
      type: deliverable.type as MapacheDeliverableType,
      title: deliverable.title,
      url: deliverable.url,
      addedById: deliverable.addedById,
      createdAt: deliverable.createdAt?.toISOString(),
    })) ?? [],
    createdAt: task.createdAt?.toISOString(),
    updatedAt: task.updatedAt?.toISOString(),
    createdById: task.createdById ?? undefined,
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
