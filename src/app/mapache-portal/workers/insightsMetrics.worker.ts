/// <reference lib="webworker" />

import { computeInsightsMetrics } from "../insights/compute-insights";

import type {
  ComputeInsightsPayload,
  ComputeInsightsResult,
} from "../insights/compute-insights";

type ComputeMessage = {
  id: number;
  type: "compute";
  payload: {
    filtered: ComputeInsightsPayload;
    all: ComputeInsightsPayload;
  };
};

type WorkerMessage = ComputeMessage;

type WorkerResponse = {
  id: number;
  ok: true;
  result: {
    filtered: ComputeInsightsResult;
    all: ComputeInsightsResult;
  };
};

type WorkerErrorResponse = {
  id: number;
  ok: false;
  error: string;
};

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (!message || message.type !== "compute") {
    return;
  }

  const { id, payload } = message;

  try {
    const filtered = computeInsightsMetrics(payload.filtered);
    const all = computeInsightsMetrics(payload.all);

    const response: WorkerResponse = {
      id,
      ok: true,
      result: { filtered, all },
    };
    ctx.postMessage(response);
  } catch (error) {
    const response: WorkerErrorResponse = {
      id,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to compute insights metrics",
    };
    ctx.postMessage(response);
  }
});
