"use client";

import React, { useEffect, useState } from "react";
import { toast } from "@/app/components/ui/toast";

import { useTranslations } from "@/app/LanguageProvider";

type Team = { id: string; name: string };

const SEEN_KEY = "onboardingTeam_seen_session";

export default function OnboardingTeamModal() {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [value, setValue] = useState("");
  const t = useTranslations("proposals.onboarding");

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY) === "1") return;

        const s = await fetch("/api/auth/session", { cache: "no-store" });
        if (!s.ok) return;
        const json = await s.json();
        if (!json?.user?.team) {
          const t = await fetch("/api/teams", { cache: "no-store" });
          setTeams(t.ok ? await t.json() : []);
          setOpen(true);
        }
      } catch {
        // no-op
      }
    })();
  }, []);

  const closeForSession = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const save = async () => {
    if (!value) return;
    const r = await fetch("/api/my-team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: value }),
    });
    if (r.ok) {
      closeForSession();
      toast.success(t("toasts.saved"));
    } else {
      toast.error(t("toasts.error"));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="heading-bar-sm">{t("title")}</div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-700">{t("intro")}</p>
          <select className="select w-full" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">{t("selectPlaceholder")}</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="px-4 py-3 flex justify-end gap-2 bg-gray-50 border-t">
          <button className="btn-ghost" onClick={closeForSession}>{t("actions.later")}</button>
          <button className="btn-primary" disabled={!value} onClick={save}>
            {t("actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
