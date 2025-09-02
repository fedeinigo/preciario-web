// src/app/components/TeamSelectModal.tsx
"use client";

import Modal from "@/app/components/ui/Modal";
import React from "react";

export type TeamName =
  | "Leones" | "Lobos" | "Tigres" | "Panteras" | "Jaguares" | "Pirañas" | "Tiburones"
  | "Gorilas" | "Abejas" | "Mapaches" | "Hormigas" | "Carpinchos" | "Buhos";

const TEAMS: { name: TeamName; emoji: string }[] = [
  { name: "Leones", emoji: "🦁" },
  { name: "Lobos", emoji: "🐺" },
  { name: "Tigres", emoji: "🐯" },
  { name: "Panteras", emoji: "🐆" },
  { name: "Jaguares", emoji: "🐆" },
  { name: "Pirañas", emoji: "🐟" },
  { name: "Tiburones", emoji: "🦈" },
  { name: "Gorilas", emoji: "🦍" },
  { name: "Abejas", emoji: "🐝" },
  { name: "Mapaches", emoji: "🦝" },
  { name: "Hormigas", emoji: "🐜" },
  { name: "Carpinchos", emoji: "🦫" }, // aproximamos con castor
  { name: "Buhos", emoji: "🦉" },
];

export default function TeamSelectModal({
  open,
  onConfirm,
  onClose,
  submitting,
}: {
  open: boolean;
  onConfirm: (team: TeamName) => void;
  onClose: () => void;
  submitting?: boolean;
}) {
  const [selected, setSelected] = React.useState<TeamName | null>(null);

  return (
    <Modal
      open={open}
      onClose={() => { if (!submitting) onClose(); }}
      title="Elegí tu equipo"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || submitting}
          >
            {submitting ? "Guardando…" : "Confirmar"}
          </button>
        </div>
      }
    >
      <p className="text-sm text-muted mb-3">
        Esta selección se usará para segmentar Histórico y Estadísticas.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {TEAMS.map((t) => {
          const active = selected === t.name;
          return (
            <button
              key={t.name}
              onClick={() => setSelected(t.name)}
              className={`flex items-center gap-3 rounded-[var(--radius)] border p-3 text-left
                ${active ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]" : "border-[rgb(var(--border))] hover:bg-gray-50"}`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="font-medium">{t.name}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
