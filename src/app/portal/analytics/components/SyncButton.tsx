"use client";

import { RefreshCw, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@/hooks/useAnalyticsData";

type SyncButtonProps = {
  syncedAt: string | null;
  isSyncing: boolean;
  onSync: () => void;
  error?: string | null;
  cacheError?: string | null;
  className?: string;
};

export function SyncButton({
  syncedAt,
  isSyncing,
  onSync,
  error,
  cacheError,
  className = "",
}: SyncButtonProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-600">{error}</span>
            </>
          ) : syncedAt ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-slate-500">
                Actualizado {formatRelativeTime(syncedAt)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">Sin datos sincronizados</span>
          )}
        </div>
        {cacheError && (
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-amber-600">{cacheError}</span>
          </div>
        )}
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw
          className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
        />
        {isSyncing ? "Sincronizando..." : "Actualizar"}
      </button>
    </div>
  );
}
