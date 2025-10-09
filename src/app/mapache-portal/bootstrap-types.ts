import type {
  MapacheDeliverableType,
  MapacheDirectness,
  MapacheIntegrationOwner,
  MapacheIntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
  MapacheStatusDetails,
  MapacheTaskSubstatus,
} from "./types";
import type { MapacheBoardConfig } from "./board-types";

export type SerializedStatus = MapacheStatusDetails & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedMapacheTaskDeliverable = {
  id: string;
  type: MapacheDeliverableType;
  title: string;
  url: string;
  addedById: string | null;
  createdAt?: string;
};

export type SerializedMapacheTaskAssignee = {
  id: string;
  name: string | null;
  email: string | null;
} | null;

export type SerializedMapacheTaskStatus = {
  id: string;
  key: string;
  label: string;
  order: number;
} | null;

export type SerializedMapacheTask = {
  id: string;
  title: string;
  description: string | null;
  statusId: string | null;
  status: SerializedMapacheTaskStatus;
  substatus: MapacheTaskSubstatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assigneeId: string | null;
  assignee: SerializedMapacheTaskAssignee;
  requesterEmail: string;
  clientName: string;
  presentationDate: string | null;
  interlocutorRole: string | null;
  clientWebsiteUrls: string[];
  directness: MapacheDirectness | null;
  pipedriveDealUrl: string | null;
  needFromTeam: MapacheNeedFromTeam | null;
  clientPain: string | null;
  productKey: string | null;
  managementType: string | null;
  docsCountApprox: number | null;
  docsLengthApprox: string | null;
  integrationType: MapacheIntegrationType | null;
  integrationOwner: MapacheIntegrationOwner | null;
  integrationName: string | null;
  integrationDocsUrl: string | null;
  avgMonthlyConversations: number | null;
  origin: MapacheSignalOrigin | null;
  deliverables: SerializedMapacheTaskDeliverable[];
};

export type SerializedFilterPreset = {
  id: string;
  name: string;
  filters: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

export type MapachePortalBootstrap = {
  statuses: SerializedStatus[];
  tasks: SerializedMapacheTask[];
  tasksMeta: {
    total: number;
    count: number;
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
  filterPresets: SerializedFilterPreset[];
  boards: MapacheBoardConfig[];
  team: {
    id: string;
    name: string | null;
    email: string | null;
  }[];
};
