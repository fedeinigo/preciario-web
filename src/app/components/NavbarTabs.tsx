// src/app/components/NavbarTabs.tsx
"use client";

import React from "react";
import { LayoutGrid, Clock, BarChart2, Users, Group } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

type Tab = "generator" | "history" | "stats" | "teams" | "users";
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
  const { status } = useSession();
  const tabsT = useTranslations("navbar.tabs");
  const isAuthed = status === "authenticated";
  if (!isAuthed) return null;

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
      className={`px-3 py-2 rounded-[var(--radius)] text-[13.5px] font-medium
        ${active === id
          ? "bg-white text-[rgb(var(--primary))]"
          : "bg-white/15 text-white hover:bg-white/20"}`}
      onClick={() => onChange(id)}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="mr-1 h-4 w-4" /> {label}
      </span>
    </button>
  );

  return (
    <div className="w-full bg-[rgb(var(--primary))]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2">
        <Btn id="generator" icon={LayoutGrid} label={tabsT("generator")} />
        <Btn id="history" icon={Clock} label={tabsT("history")} />
        <Btn id="stats" icon={BarChart2} label={tabsT("stats")} />
        <Btn id="teams" icon={Group} label={tabsT("teams")} />
        {showUsers && <Btn id="users" icon={Users} label={tabsT("users")} />}
      </div>
    </div>
  );
}
