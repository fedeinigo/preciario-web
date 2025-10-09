"use client";

import * as React from "react";

import { useInfiniteQuery } from "@tanstack/react-query";

import { toast } from "@/app/components/ui/toast";

import type { SerializedMapacheTask } from "../bootstrap-types";

type FetchTasksResponse = {
  tasks: SerializedMapacheTask[];
  meta: {
    total: number;
    count: number;
    limit: number;
    nextCursor: string | null;
  };
};

type UseTasksQueryOptions = {
  filtersKey: string;
  enabled?: boolean;
  initialPage?: FetchTasksResponse | null;
};

function buildTasksUrl(filtersKey: string, cursor: string | null) {
  const params = new URLSearchParams(filtersKey);
  if (cursor) {
    params.set("cursor", cursor);
  } else {
    params.delete("cursor");
  }
  return `/api/mapache/tasks${params.toString() ? `?${params.toString()}` : ""}`;
}

async function fetchTasks(
  url: string,
  signal: AbortSignal | undefined,
): Promise<FetchTasksResponse> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load tasks (${response.status})`);
  }
  const payload = (await response.json()) as FetchTasksResponse;
  return payload;
}

export function useTasksQuery({
  filtersKey,
  enabled = true,
  initialPage,
}: UseTasksQueryOptions) {
  const lastErrorRef = React.useRef<{ message: string; at: number } | null>(
    null,
  );
  const query = useInfiniteQuery<FetchTasksResponse, Error>({
    queryKey: ["mapache-portal", "tasks", filtersKey],
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam?: unknown;
      signal?: AbortSignal;
    }) => {
      const url = buildTasksUrl(
        filtersKey,
        typeof pageParam === "string" ? pageParam : null,
      );
      return fetchTasks(url, signal);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage: FetchTasksResponse) =>
      lastPage.meta.nextCursor ?? undefined,
    enabled,
    retry: 2,
    retryDelay: 2000,
    staleTime: 30_000,
    initialData: initialPage
      ? {
          pages: [initialPage],
          pageParams: [null],
        }
      : undefined,
  }) as {
    data: {
      pages: FetchTasksResponse[];
      pageParams: unknown[];
    } | undefined;
    isError: boolean;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
    refetch: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
  };

  React.useEffect(() => {
    if (!query.error) {
      lastErrorRef.current = null;
      return;
    }

    const message =
      query.error.message?.trim() || "No se pudieron cargar las tareas.";
    const now = Date.now();
    const last = lastErrorRef.current;

    if (!last || last.message !== message || now - last.at > 5000) {
      toast.error(message);
      lastErrorRef.current = { message, at: now };
    }
  }, [query.error]);

  const pages = React.useMemo<FetchTasksResponse[]>(
    () => query.data?.pages ?? [],
    [query.data],
  );

  const tasks = React.useMemo<SerializedMapacheTask[]>(
    () => pages.flatMap((page) => page.tasks),
    [pages],
  );

  const meta = React.useMemo(() => {
    if (pages.length === 0) {
      return {
        total: 0,
        count: 0,
        limit: 0,
        nextCursor: null as string | null,
      };
    }
    const last = pages[pages.length - 1]!;
    return {
      total: last.meta.total,
      count: tasks.length,
      limit: last.meta.limit,
      nextCursor: last.meta.nextCursor,
    };
  }, [pages, tasks.length]);

  return {
    query,
    tasks,
    meta,
    hasMore: Boolean(meta.nextCursor),
    fetchNext: query.fetchNextPage,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
