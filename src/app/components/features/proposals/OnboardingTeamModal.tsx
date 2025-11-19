"use client";

import React from "react";
import { toast } from "@/app/components/ui/toast";

import { useTranslations } from "@/app/LanguageProvider";

type Team = { id: string; name: string };

const CUSTOM_OPTION = "__custom";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type SessionShape = {
  user?: {
    team?: string | null;
    positionName?: string | null;
    leaderEmail?: string | null;
  };
};

export default function OnboardingTeamModal() {
  const [open, setOpen] = React.useState(false);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [teamValue, setTeamValue] = React.useState("");
  const [customTeam, setCustomTeam] = React.useState("");
  const [positionName, setPositionName] = React.useState("");
  const [leaderEmail, setLeaderEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const t = useTranslations("proposals.onboarding");

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        if (!sessionRes.ok) return;
        const session = (await sessionRes.json()) as SessionShape;
        if (!session?.user) {
          return;
        }
        const hasTeam = Boolean(session.user.team);
        if (hasTeam) {
          return;
        }
        const teamsRes = await fetch("/api/teams", { cache: "no-store" });
        if (!active) return;
        setTeams(teamsRes.ok ? await teamsRes.json() : []);
        setTeamValue(session.user.team ?? "");
        setPositionName(session.user.positionName ?? "");
        setLeaderEmail(session.user.leaderEmail ?? "");
        setOpen(true);
      } catch {
        // Ignore errors silently
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const requiresCustomTeam = teamValue === CUSTOM_OPTION;
  const trimmedCustomTeam = customTeam.trim();
  const trimmedPosition = positionName.trim();
  const normalizedLeader = leaderEmail.trim().toLowerCase();
  const hasLeader = normalizedLeader.length > 0;
  const isLeaderValid =
    normalizedLeader.endsWith("@wisecx.com") && EMAIL_REGEX.test(normalizedLeader);
  const showLeaderError = hasLeader && !isLeaderValid;

  const teamOptions = React.useMemo(() => {
    const existingNames = new Set(teams.map((team) => team.name));
    const options = [...teams];
    if (teamValue && teamValue !== CUSTOM_OPTION && !existingNames.has(teamValue)) {
      options.unshift({ id: `user-team-${teamValue}`, name: teamValue });
    }
    return options;
  }, [teams, teamValue]);

  const canSave =
    !loading &&
    teamValue !== "" &&
    (!requiresCustomTeam || trimmedCustomTeam.length > 0) &&
    trimmedPosition.length > 0 &&
    isLeaderValid;

  const handleSave = async () => {
    if (!canSave) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        team: teamValue || null,
        positionName: trimmedPosition,
        leaderEmail: normalizedLeader,
      };
      if (requiresCustomTeam) {
        payload.team = CUSTOM_OPTION;
        payload.customTeam = trimmedCustomTeam;
      }
      const response = await fetch("/api/my-team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast.error(t("toasts.error"));
        return;
      }
      toast.success(t("toasts.saved"));
      setOpen(false);
    } catch {
      toast.error(t("toasts.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!open || checking) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex flex-col gap-2 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-7 py-6 text-white">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            Onboarding
          </span>
          <h2 className="text-2xl font-semibold leading-tight">{t("title")}</h2>
          <p className="text-sm text-white/80">{t("intro")}</p>
        </div>
        <div className="space-y-6 px-7 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              <span>{t("teamLabel")}</span>
              <select
                className="select w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-base shadow-sm transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                value={teamValue}
                onChange={(event) => {
                  setTeamValue(event.target.value);
                  if (event.target.value !== CUSTOM_OPTION) {
                    setCustomTeam("");
                  }
                }}
              >
                <option value="">{t("selectPlaceholder")}</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
                <option value={CUSTOM_OPTION}>{t("teamOtherOption")}</option>
              </select>
            </label>

            {requiresCustomTeam ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 md:col-span-2">
                <span>{t("customTeamLabel")}</span>
                <input
                  className="input w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-200"
                  value={customTeam}
                  onChange={(event) => setCustomTeam(event.target.value)}
                  placeholder={t("customTeamPlaceholder")}
                />
              </label>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              <span>{t("positionLabel")}</span>
              <input
                className="input w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-200"
                value={positionName}
                onChange={(event) => setPositionName(event.target.value)}
                placeholder={t("positionPlaceholder")}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 md:col-span-2">
              <span>{t("leaderEmailLabel")}</span>
              <input
                className={`input w-full rounded-2xl border px-4 py-3 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-slate-200 ${
                  showLeaderError
                    ? "border-red-400 focus-visible:ring-red-200"
                    : "border-slate-200 focus:border-slate-900"
                }`}
                value={leaderEmail}
                onChange={(event) => setLeaderEmail(event.target.value)}
                placeholder="nombre@wisecx.com"
                inputMode="email"
              />
              <span className="text-xs text-slate-500">{t("leaderEmailHint")}</span>
              {showLeaderError ? (
                <span className="text-xs font-semibold text-red-600">{t("errors.leaderEmail")}</span>
              ) : null}
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-7 py-5">
          <button
            className="btn-primary min-w-[160px] rounded-2xl px-6 py-2.5 text-base shadow-sm disabled:opacity-60"
            disabled={!canSave}
            onClick={handleSave}
          >
            {loading ? t("actions.saving") : t("actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
