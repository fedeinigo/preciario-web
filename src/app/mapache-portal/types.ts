export const MAPACHE_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;

export const MAPACHE_TASK_SUBSTATUSES = [
  "BACKLOG",
  "WAITING_CLIENT",
  "BLOCKED",
] as const;

export const MAPACHE_DELIVERABLE_TYPES = [
  "SCOPE",
  "QUOTE",
  "SCOPE_AND_QUOTE",
  "OTHER",
] as const;

export type MapacheTaskStatus = (typeof MAPACHE_TASK_STATUSES)[number];

export type MapacheTaskSubstatus = (typeof MAPACHE_TASK_SUBSTATUSES)[number];

export type MapacheDeliverableType = (typeof MAPACHE_DELIVERABLE_TYPES)[number];

export type MapacheTaskDeliverable = {
  id: string;
  type: MapacheDeliverableType;
  title: string;
  url: string;
  addedById?: string | null;
  createdAt?: string;
};

export type MapacheTask = {
  id: string;
  title: string;
  description?: string | null;
  status: MapacheTaskStatus;
  substatus: MapacheTaskSubstatus;
  assigneeId?: string | null;
  deliverables: MapacheTaskDeliverable[];
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
};
