export const MAPACHE_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;

export type MapacheTaskStatus = (typeof MAPACHE_TASK_STATUSES)[number];

export type MapacheTask = {
  id: string;
  title: string;
  description?: string | null;
  status: MapacheTaskStatus;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
};
