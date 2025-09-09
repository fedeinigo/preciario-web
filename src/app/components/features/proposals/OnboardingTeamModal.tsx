"use client";

import React, { useEffect, useState } from "react";

type Team = { id: string; name: string };

export default function OnboardingTeamModal() {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    (async () => {
      const s = await fetch("/api/auth/session", { cache: "no-store" });
      if (!s.ok) return;
      const json = await s.json();
      if (!json?.user?.team) {
        setOpen(true);
        const t = await fetch("/api/teams", { cache: "no-store" });
        setTeams(t.ok ? await t.json() : []);
      }
    })();
  }, []);

  const save = async () => {
    if (!value) return;
    const r = await fetch("/api/my-team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: value }),
    });
    if (r.ok) setOpen(false);
    else alert("No se pudo guardar el equipo");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="heading-bar-sm">Selecciona tu equipo</div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-700">
            Bienvenido. Para personalizar tu experiencia, indícanos a qué equipo perteneces.
          </p>
          <select className="select w-full" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">(elige un equipo)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="px-4 py-3 flex justify-end gap-2 bg-gray-50 border-t">
          <button className="btn-ghost" onClick={() => setOpen(false)}>Más tarde</button>
          <button className="btn-primary" disabled={!value} onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
