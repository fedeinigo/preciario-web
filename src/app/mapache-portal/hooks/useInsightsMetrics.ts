"use client";

import * as React from "react";

import type {
  MapachePortalInsightsMetrics,
  MapachePortalInsightsScope,
} from "../MapachePortalInsights";
import type { MapacheTask, MapacheTaskStatus } from "../types";
import { computeInsightsMetrics } from "../insights/compute-insights";

export type UseInsightsMetricsOptions = {
  assigneeLabelMap: Map<string, string>;
  deferredFilteredTasks: MapacheTask[];
  isMetricsSection: boolean;
  mapacheTeamMemberIds: Set<string>;
  tasks: MapacheTask[];
  statusKeys: MapacheTaskStatus[];
};

export type UseInsightsMetricsResult = {
  insightsMetrics: Record<MapachePortalInsightsScope, MapachePortalInsightsMetrics>;
};

type WorkerComputePayload = {
  filtered: {
    tasks: MapacheTask[];
    statusKeys: MapacheTaskStatus[];
    assigneeLabelEntries: Array<[string, string]>;
    mapacheTeamMemberIds: string[];
  };
  all: {
    tasks: MapacheTask[];
    statusKeys: MapacheTaskStatus[];
    assigneeLabelEntries: Array<[string, string]>;
    mapacheTeamMemberIds: string[];
  };
};

type WorkerMessage = {
  id: number;
  type: "compute";
  payload: WorkerComputePayload;
};

type WorkerSuccessEvent = {
  id: number;
  ok: true;
  result: Record<
    MapachePortalInsightsScope,
    MapachePortalInsightsMetrics
  >;
};

type WorkerErrorEvent = {
  id: number;
  ok: false;
  error: string;
};

type WorkerEvent = WorkerSuccessEvent | WorkerErrorEvent;

export function useInsightsMetrics({
  assigneeLabelMap,
  deferredFilteredTasks,
  isMetricsSection,
  mapacheTeamMemberIds,
  tasks,
  statusKeys,
}: UseInsightsMetricsOptions): UseInsightsMetricsResult {
  const assigneeLabelEntries = React.useMemo(
    () => Array.from(assigneeLabelMap.entries()),
    [assigneeLabelMap],
  );
  const mapacheTeamMemberIdList = React.useMemo(
    () => Array.from(mapacheTeamMemberIds),
    [mapacheTeamMemberIds],
  );

  const computeInsightsSync = React.useCallback(
    (source: MapacheTask[]): MapachePortalInsightsMetrics =>
      computeInsightsMetrics({
        tasks: source,
        statusKeys,
        assigneeLabelEntries,
        mapacheTeamMemberIds: mapacheTeamMemberIdList,
      }),
    [assigneeLabelEntries, mapacheTeamMemberIdList, statusKeys],
  );

  const [insightsMetrics, setInsightsMetrics] = React.useState(() => ({
    filtered: computeInsightsSync([]),
    all: computeInsightsSync([]),
  }));
  const insightsHydratedRef = React.useRef(false);
  const workerRef = React.useRef<Worker | null>(null);
  const requestIdRef = React.useRef(0);
  const latestRequestIdRef = React.useRef(0);
  const latestPayloadRef = React.useRef<WorkerComputePayload | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let mounted = true;
    try {
      const worker = new Worker(
        new URL("../workers/insightsMetrics.worker.ts", import.meta.url),
      );
      if (!mounted) {
        worker.terminate();
        return;
      }

      workerRef.current = worker;

      const handleMessage = (event: MessageEvent<WorkerEvent>) => {
        const data = event.data;
        if (!data || data.id !== latestRequestIdRef.current) {
          return;
        }

        if (data.ok) {
          insightsHydratedRef.current = true;
          setInsightsMetrics(data.result);
        } else if (latestPayloadRef.current) {
          console.error("Mapache insights worker failed:", data.error);
          const { filtered, all } = latestPayloadRef.current;
          insightsHydratedRef.current = true;
          setInsightsMetrics({
            filtered: computeInsightsSync(filtered.tasks),
            all: computeInsightsSync(all.tasks),
          });
        }
      };

      const handleError = (event: ErrorEvent) => {
        console.error("Mapache insights worker error", event.message);
        workerRef.current = null;
        if (latestPayloadRef.current) {
          const { filtered, all } = latestPayloadRef.current;
          insightsHydratedRef.current = true;
          setInsightsMetrics({
            filtered: computeInsightsSync(filtered.tasks),
            all: computeInsightsSync(all.tasks),
          });
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      return () => {
        mounted = false;
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        worker.terminate();
        workerRef.current = null;
      };
    } catch (error) {
      console.error("Mapache insights worker setup failed", error);
    }
  }, [computeInsightsSync]);

  React.useEffect(() => {
    const alreadyHydrated = insightsHydratedRef.current;
    if (!isMetricsSection && !alreadyHydrated) {
      return;
    }

    const payload: WorkerComputePayload = {
      filtered: {
        tasks: deferredFilteredTasks,
        statusKeys,
        assigneeLabelEntries,
        mapacheTeamMemberIds: mapacheTeamMemberIdList,
      },
      all: {
        tasks,
        statusKeys,
        assigneeLabelEntries,
        mapacheTeamMemberIds: mapacheTeamMemberIdList,
      },
    };

    latestPayloadRef.current = payload;

    const worker = workerRef.current;
    if (worker) {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      latestRequestIdRef.current = requestId;
      const message: WorkerMessage = {
        id: requestId,
        type: "compute",
        payload,
      };
      worker.postMessage(message);
      return;
    }

    const nextInsights = {
      filtered: computeInsightsSync(deferredFilteredTasks),
      all: computeInsightsSync(tasks),
    } satisfies Record<
      MapachePortalInsightsScope,
      MapachePortalInsightsMetrics
    >;
    insightsHydratedRef.current = true;
    setInsightsMetrics(nextInsights);
  }, [
    assigneeLabelEntries,
    deferredFilteredTasks,
    isMetricsSection,
    mapacheTeamMemberIdList,
    computeInsightsSync,
    tasks,
    statusKeys,
  ]);

  return { insightsMetrics };
}
