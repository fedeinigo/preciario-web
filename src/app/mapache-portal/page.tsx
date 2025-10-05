import { notFound, redirect } from "next/navigation";

import MapachePortalClient from "./MapachePortalClient";
import { normalizeMapacheTask } from "./types";
import type { MapacheTask } from "./types";
import { auth } from "@/lib/auth";
import { taskSelect } from "@/app/api/mapache/tasks/access";
import prisma from "@/lib/prisma";

type MapacheTaskDelegate = {
  findMany: (args: unknown) => Promise<unknown>;
};

const mapacheTask = (
  prisma as unknown as { mapacheTask: MapacheTaskDelegate }
).mapacheTask;

export const dynamic = "force-dynamic";

export default async function MapachePortalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const isMapache = session.user.team === "Mapaches";
  const isAdmin = ["admin", "superadmin"].includes(session.user.role ?? "");
  const hasAccess = isMapache || isAdmin;

  if (!hasAccess) {
    return notFound();
  }

  const records = (await mapacheTask.findMany({
    select: taskSelect,
    orderBy: { createdAt: "desc" },
  })) as unknown[];

  const initialTasks: MapacheTask[] = records
    .map((record) => normalizeMapacheTask(record))
    .filter((task): task is MapacheTask => task !== null);

  return (
    <div className="space-y-6 px-4 pb-10">
      <MapachePortalClient initialTasks={initialTasks} />
    </div>
  );
}
