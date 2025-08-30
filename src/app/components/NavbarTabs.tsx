"use client";

import React from "react";
import { LayoutGrid, Clock, BarChart2, Users } from "lucide-react";

type Tab = "generator" | "history" | "stats" | "users";

type IconType = React.ComponentType<{ className?: string }>;

export default function NavbarTabs({
  active,
  onChange,
  showUsers,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  showUsers?: boolean;
}) {
  const Btn = ({
    id,
    icon: Icon,
    label,
  }: {
    id: Tab;
    icon: IconType;
    label: string;
  }) => (
    <button
      className={`tab ${active === id ? "tab-active" : "tab-inactive"}`}
      onClick={() => onChange(id)}
    >
      <Icon className="mr-2 h-4 w-4" /> {label}
    </button>
  );

  return (
    <div className="px-6 pt-6">
      <div className="flex gap-3">
        <Btn id="generator" icon={LayoutGrid} label="Generador" />
        <Btn id="history" icon={Clock} label="Histórico" />
        <Btn id="stats" icon={BarChart2} label="Estadísticas" />
        {showUsers && <Btn id="users" icon={Users} label="Usuarios" />}
      </div>
    </div>
  );
}
