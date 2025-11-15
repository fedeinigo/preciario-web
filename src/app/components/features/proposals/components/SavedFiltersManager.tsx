import React, { useState, useEffect } from "react";
import { Save, Trash2, Download } from "lucide-react";
import { toast } from "@/app/components/ui/toast";

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    from?: string;
    to?: string;
    teamFilter?: string;
    countryFilter?: string;
    userFilter?: string;
    orderKey?: string;
    orderDir?: string;
  };
  createdAt: string;
}

interface SavedFiltersManagerProps {
  currentFilters: SavedFilter["filters"];
  onApplyFilter: (filters: SavedFilter["filters"]) => void;
  userEmail: string;
}

const STORAGE_KEY = "stats-saved-filters";

export function SavedFiltersManager({
  currentFilters,
  onApplyFilter,
  userEmail,
}: SavedFiltersManagerProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${userEmail}`);
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch {
        setSavedFilters([]);
      }
    }
  }, [userEmail]);

  const saveFilters = (filters: SavedFilter[]) => {
    localStorage.setItem(`${STORAGE_KEY}-${userEmail}`, JSON.stringify(filters));
    setSavedFilters(filters);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error("Por favor ingresa un nombre para el filtro");
      return;
    }

    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: filterName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    saveFilters(updated);
    toast.success(`Filtro "${filterName}" guardado exitosamente`);
    setFilterName("");
    setShowSaveDialog(false);
  };

  const handleDeleteFilter = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    saveFilters(updated);
    toast.success("Filtro eliminado");
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters);
    toast.success(`Filtro "${filter.name}" aplicado`);
  };

  return (
    <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-purple-900">Filtros Guardados</h3>
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
        >
          <Save className="h-3.5 w-3.5" />
          Guardar filtros actuales
        </button>
      </div>

      {showSaveDialog && (
        <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50/50 p-3">
          <input
            type="text"
            placeholder="Nombre del filtro (ej: Q1 2025 Colombia)"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveFilter()}
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSaveFilter}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setFilterName("");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {savedFilters.length > 0 && (
        <div className="mt-3 space-y-2">
          {savedFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-purple-200 hover:bg-purple-50/30"
            >
              <button
                onClick={() => handleApplyFilter(filter)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <Download className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">{filter.name}</span>
              </button>
              <button
                onClick={() => handleDeleteFilter(filter.id)}
                className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Eliminar filtro"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {savedFilters.length === 0 && !showSaveDialog && (
        <p className="mt-2 text-xs text-slate-500">
          No hay filtros guardados. Guarda tus configuraciones favoritas para acceso rápido.
        </p>
      )}
    </div>
  );
}
