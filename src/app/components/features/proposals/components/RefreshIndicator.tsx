import React, { useState, useEffect } from "react";
import { RefreshCw, Circle } from "lucide-react";

interface RefreshIndicatorProps {
  onRefresh: () => Promise<void>;
  lastUpdated?: Date;
  hasNewData?: boolean;
}

export function RefreshIndicator({ onRefresh, lastUpdated, hasNewData = false }: RefreshIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    if (!lastUpdated) return;

    const updateRelativeTime = () => {
      const now = Date.now();
      const diff = now - lastUpdated.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setRelativeTime("hace unos segundos");
      } else if (minutes < 60) {
        setRelativeTime(`hace ${minutes} min`);
      } else if (hours < 24) {
        setRelativeTime(`hace ${hours}h`);
      } else {
        setRelativeTime(lastUpdated.toLocaleDateString());
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {hasNewData && (
        <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <Circle className="h-2 w-2 animate-pulse fill-green-600" />
          Datos nuevos disponibles
        </div>
      )}
      
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {lastUpdated && <span>Actualizado {relativeTime}</span>}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          title="Refrescar datos"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Refrescar"}
        </button>
      </div>
    </div>
  );
}
