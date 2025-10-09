import * as React from "react";

import { toast } from "@/app/components/ui/toast";

import {
  normalizeBoardConfig,
  normalizeBoardList,
  type MapacheBoardConfig,
} from "../board-types";
import {
  didColumnStatusesChange,
  normalizeColumnStatuses,
} from "../status-management";
import type { MapacheStatusIndex, MapacheTaskStatus } from "../types";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type BoardColumnDraft = {
  id: string | null;
  title: string;
  statuses: MapacheTaskStatus[];
};

export type BoardDraft = {
  id: string;
  name: string;
  columns: BoardColumnDraft[];
};

function createBoardDraft(board: MapacheBoardConfig): BoardDraft {
  return {
    id: board.id,
    name: board.name,
    columns: board.columns
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((column) => ({
        id: column.id,
        title: column.title,
        statuses: [...column.filters.statuses],
      })),
  };
}

function mapDraftToPayload(draft: BoardDraft, statusIndex: MapacheStatusIndex) {
  const allowedStatuses = statusIndex.byKey;
  return {
    name: draft.name.trim(),
    columns: draft.columns.map((column) => ({
      id: column.id ?? undefined,
      title: column.title.trim(),
      filters: {
        statuses: column.statuses.filter((status) => allowedStatuses.has(status)),
      },
    })),
  };
}

function getSuggestedStatuses(
  columns: BoardColumnDraft[],
  orderedStatuses: MapacheTaskStatus[],
): MapacheTaskStatus[] {
  if (orderedStatuses.length === 0) {
    return [];
  }
  const used = new Set<MapacheTaskStatus>();
  columns.forEach((column) => {
    column.statuses.forEach((status) => {
      used.add(status);
    });
  });
  const available = orderedStatuses.filter((status) => !used.has(status));
  if (available.length > 0) {
    return [available[0]!];
  }
  return [orderedStatuses[0]!];
}

export type UseBoardManagerParams = {
  bootstrapBoards: MapacheBoardConfig[];
  statusIndex: MapacheStatusIndex;
  statusKeys: MapacheTaskStatus[];
  boardsT: TranslateFn;
  boardsToastT: TranslateFn;
};

export function useBoardManager({
  bootstrapBoards,
  statusIndex,
  statusKeys,
  boardsT,
  boardsToastT,
}: UseBoardManagerParams) {
  const bootstrapBoardList = React.useMemo(
    () => normalizeBoardList(bootstrapBoards, statusIndex),
    [bootstrapBoards, statusIndex],
  );
  const [boards, setBoards] = React.useState<MapacheBoardConfig[]>(() => [
    ...bootstrapBoardList,
  ]);
  const shouldInitialFetchBoards = bootstrapBoards.length === 0;
  const [boardsLoading, setBoardsLoading] = React.useState(false);
  const [boardsError, setBoardsError] = React.useState<string | null>(null);
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);
  const [boardDraft, setBoardDraft] = React.useState<BoardDraft | null>(null);
  const [boardDraftError, setBoardDraftError] = React.useState<string | null>(
    null,
  );
  const [boardPendingDeletion, setBoardPendingDeletion] = React.useState<
    string | null
  >(null);
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(
    null,
  );
  const [savingBoard, setSavingBoard] = React.useState(false);
  const [creatingBoard, setCreatingBoard] = React.useState(false);
  const [reorderingBoards, setReorderingBoards] = React.useState(false);

  const boardLoadErrorMessage = boardsT("loadError");

  const loadBoards = React.useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setBoardsLoading(true);
        setBoardsError(null);
      }
      try {
        const response = await fetch(`/api/mapache/boards`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as { boards?: unknown };
        const normalized = normalizeBoardList(data?.boards, statusIndex);
        setBoards(normalized);
        setBoardsError(null);
      } catch (error) {
        console.error(error);
        setBoardsError(boardLoadErrorMessage);
      } finally {
        if (!silent) {
          setBoardsLoading(false);
        }
      }
    },
    [boardLoadErrorMessage, statusIndex],
  );

  React.useEffect(() => {
    if (!shouldInitialFetchBoards) return;
    void loadBoards();
  }, [loadBoards, shouldInitialFetchBoards]);

  React.useEffect(() => {
    if (boards.length === 0) {
      setActiveBoardId(null);
      return;
    }
    setActiveBoardId((prev) => {
      if (prev && boards.some((board) => board.id === prev)) {
        return prev;
      }
      return boards[0]!.id;
    });
  }, [boards]);

  React.useEffect(() => {
    if (!activeBoardId) {
      setBoardDraft(null);
      setBoardDraftError(null);
      setBoardPendingDeletion(null);
      return;
    }
    const board = boards.find((item) => item.id === activeBoardId);
    if (!board) {
      setBoardDraft(null);
      setBoardDraftError(null);
      setBoardPendingDeletion(null);
      return;
    }
    setBoardDraft(createBoardDraft(board));
    setBoardDraftError(null);
    setBoardPendingDeletion(null);
  }, [activeBoardId, boards]);

  React.useEffect(() => {
    setBoardDraft((prev) => {
      if (!prev) return prev;
      let changed = false;
      const nextColumns = prev.columns.map((column) => {
        const nextStatuses = normalizeColumnStatuses(column.statuses, statusIndex);
        if (!didColumnStatusesChange(column.statuses, nextStatuses)) {
          return column;
        }
        changed = true;
        return { ...column, statuses: nextStatuses };
      });
      if (!changed) {
        return prev;
      }
      return { ...prev, columns: nextColumns };
    });
  }, [statusIndex]);

  const activeBoard = React.useMemo(() => {
    if (!activeBoardId) return null;
    return boards.find((board) => board.id === activeBoardId) ?? null;
  }, [activeBoardId, boards]);

  const handleBoardNameChange = React.useCallback((value: string) => {
    setBoardDraft((prev) => (prev ? { ...prev, name: value } : prev));
    setBoardDraftError(null);
  }, []);

  const handleBoardColumnTitleChange = React.useCallback(
    (index: number, value: string) => {
      setBoardDraft((prev) => {
        if (!prev) return prev;
        const columns = prev.columns.map((column, columnIndex) =>
          columnIndex === index ? { ...column, title: value } : column,
        );
        return { ...prev, columns };
      });
      setBoardDraftError(null);
    },
    [],
  );

  const handleToggleBoardColumnStatus = React.useCallback(
    (index: number, status: MapacheTaskStatus) => {
      setBoardDraft((prev) => {
        if (!prev) return prev;
        const columns = prev.columns.map((column, columnIndex) => {
          if (columnIndex !== index) return column;
          const nextStatuses = column.statuses.includes(status)
            ? column.statuses.filter((item) => item !== status)
            : [...column.statuses, status];
          return { ...column, statuses: nextStatuses };
        });
        return { ...prev, columns };
      });
      setBoardDraftError(null);
    },
    [],
  );

  const handleAddBoardColumn = React.useCallback(() => {
    setBoardDraft((prev) => {
      if (!prev) return prev;
      const title = boardsT("columns.defaultTitle", {
        index: prev.columns.length + 1,
      });
      const statuses = getSuggestedStatuses(prev.columns, statusKeys);
      return {
        ...prev,
        columns: [...prev.columns, { id: null, title, statuses }],
      };
    });
    setBoardDraftError(null);
  }, [boardsT, statusKeys]);

  const handleRemoveBoardColumn = React.useCallback((index: number) => {
    setBoardDraft((prev) => {
      if (!prev) return prev;
      const columns = prev.columns.filter((_, columnIndex) => columnIndex !== index);
      return { ...prev, columns };
    });
    setBoardDraftError(null);
  }, []);

  const handleMoveBoardColumn = React.useCallback(
    (index: number, direction: -1 | 1) => {
      setBoardDraft((prev) => {
        if (!prev) return prev;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= prev.columns.length) return prev;
        const columns = [...prev.columns];
        const [moved] = columns.splice(index, 1);
        columns.splice(targetIndex, 0, moved);
        return { ...prev, columns };
      });
      setBoardDraftError(null);
    },
    [],
  );

  const handleBoardSelectorChange = React.useCallback((boardId: string) => {
    setActiveBoardId(boardId || null);
  }, []);

  const persistBoardOrder = React.useCallback(
    async (orderedBoards: MapacheBoardConfig[]) => {
      setReorderingBoards(true);
      try {
        const response = await fetch(`/api/mapache/boards/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardIds: orderedBoards.map((board) => board.id),
          }),
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(error);
        toast.error(boardsToastT("reorderError"));
        await loadBoards({ silent: true });
      } finally {
        setReorderingBoards(false);
      }
    },
    [boardsToastT, loadBoards],
  );

  const handleMoveBoard = React.useCallback(
    (boardId: string, direction: "up" | "down") => {
      let nextBoards: MapacheBoardConfig[] | null = null;
      setBoards((prev) => {
        const index = prev.findIndex((board) => board.id === boardId);
        if (index < 0) return prev;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;
        const ordered = [...prev];
        const [moved] = ordered.splice(index, 1);
        ordered.splice(targetIndex, 0, moved);
        const reindexed = ordered.map((board, order) => ({ ...board, order }));
        nextBoards = reindexed;
        return reindexed;
      });
      if (nextBoards) {
        void persistBoardOrder(nextBoards);
      }
    },
    [persistBoardOrder],
  );

  const handleCreateBoard = React.useCallback(async () => {
    if (creatingBoard) return;
    setCreatingBoard(true);
    try {
      const defaultName = boardsT("create.defaultName", {
        index: boards.length + 1,
      });
      const response = await fetch(`/api/mapache/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultName }),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as { board?: unknown };
      const board = normalizeBoardConfig(data?.board, statusIndex);
      if (!board) {
        throw new Error("Invalid response");
      }
      setBoards((prev) => {
        const next = [...prev.filter((item) => item.id !== board.id), board].sort(
          (a, b) => a.order - b.order,
        );
        return next;
      });
      setActiveBoardId(board.id);
      setBoardDraft(createBoardDraft(board));
      setBoardDraftError(null);
      setBoardPendingDeletion(null);
      toast.success(boardsToastT("createSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(boardsToastT("createError"));
    } finally {
      setCreatingBoard(false);
    }
  }, [boards.length, boardsToastT, boardsT, creatingBoard, statusIndex]);

  const handleSaveBoard = React.useCallback(async () => {
    if (!boardDraft) return;
    const trimmedName = boardDraft.name.trim();
    if (!trimmedName) {
      setBoardDraftError(boardsT("validation.nameRequired"));
      return;
    }
    if (boardDraft.columns.length === 0) {
      setBoardDraftError(boardsT("validation.columnsRequired"));
      return;
    }
    for (const column of boardDraft.columns) {
      if (!column.title.trim()) {
        setBoardDraftError(boardsT("validation.columnTitleRequired"));
        return;
      }
      if (column.statuses.length === 0) {
        setBoardDraftError(boardsT("validation.columnStatusesRequired"));
        return;
      }
    }
    setBoardDraftError(null);
    setSavingBoard(true);
    try {
      const payload = mapDraftToPayload(
        {
          ...boardDraft,
          name: trimmedName,
        },
        statusIndex,
      );
      const response = await fetch(`/api/mapache/boards/${boardDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as { board?: unknown };
      const board = normalizeBoardConfig(data?.board, statusIndex);
      if (!board) {
        throw new Error("Invalid response");
      }
      setBoards((prev) => {
        const others = prev.filter((item) => item.id !== board.id);
        const next = [...others, board].sort((a, b) => a.order - b.order);
        return next;
      });
      setBoardDraft(createBoardDraft(board));
      toast.success(boardsToastT("updateSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(boardsToastT("updateError"));
    } finally {
      setSavingBoard(false);
    }
  }, [boardDraft, boardsToastT, boardsT, statusIndex]);

  const handleRequestDeleteBoard = React.useCallback(() => {
    if (!boardDraft) return;
    setBoardPendingDeletion(boardDraft.id);
  }, [boardDraft]);

  const handleCancelDeleteBoard = React.useCallback(() => {
    setBoardPendingDeletion(null);
  }, []);

  const handleConfirmDeleteBoard = React.useCallback(async () => {
    if (!boardDraft) return;
    setDeletingBoardId(boardDraft.id);
    try {
      const response = await fetch(`/api/mapache/boards/${boardDraft.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setBoards((prev) => {
        const remaining = prev.filter((board) => board.id !== boardDraft.id);
        const reindexed = remaining.map((board, order) => ({ ...board, order }));
        return reindexed;
      });
      setBoardPendingDeletion(null);
      setBoardDraft(null);
      setBoardDraftError(null);
      setActiveBoardId((prev) => (prev === boardDraft.id ? null : prev));
      toast.success(boardsToastT("deleteSuccess"));
      void loadBoards({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error(boardsToastT("deleteError"));
    } finally {
      setDeletingBoardId(null);
    }
  }, [boardDraft, boardsToastT, loadBoards]);

  const resetBoardUiState = React.useCallback(() => {
    setBoardPendingDeletion(null);
    setBoardDraftError(null);
  }, []);

  return {
    boards,
    boardsLoading,
    boardsError,
    activeBoardId,
    activeBoard,
    boardDraft,
    boardDraftError,
    boardPendingDeletion,
    deletingBoardId,
    savingBoard,
    creatingBoard,
    reorderingBoards,
    loadBoards,
    handleBoardNameChange,
    handleBoardColumnTitleChange,
    handleToggleBoardColumnStatus,
    handleAddBoardColumn,
    handleRemoveBoardColumn,
    handleMoveBoardColumn,
    handleBoardSelectorChange,
    handleMoveBoard,
    handleCreateBoard,
    handleSaveBoard,
    handleRequestDeleteBoard,
    handleCancelDeleteBoard,
    handleConfirmDeleteBoard,
    resetBoardUiState,
  };
}
