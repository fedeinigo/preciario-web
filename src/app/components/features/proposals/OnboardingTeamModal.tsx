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
        const hasTeam = Boolean(session?.user?.team);
        const hasPosition = Boolean(session?.user?.positionName);
        const hasLeader = Boolean(session?.user?.leaderEmail);
        if (hasTeam && hasPosition && hasLeader) {
          return;
        }
        const teamsRes = await fetch("/api/teams", { cache: "no-store" });
        if (!active) return;
        setTeams(teamsRes.ok ? await teamsRes.json() : []);
        setTeamValue(session?.user?.team ?? "");
        setPositionName(session?.user?.positionName ?? "");
        setLeaderEmail(session?.user?.leaderEmail ?? "");
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="heading-bar-sm">{t("title")}</div>
        <div className="space-y-5 p-5">
          <p className="text-sm text-slate-600">{t("intro")}</p>

          <label className="space-y-1 text-sm font-medium text-slate-800">
            {t("teamLabel")}
            <select
              className="select w-full"
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
            <label className="space-y-1 text-sm font-medium text-slate-800">
              {t("customTeamLabel")}
              <input
                className="input w-full"
                value={customTeam}
                onChange={(event) => setCustomTeam(event.target.value)}
                placeholder={t("customTeamPlaceholder")}
              />
            </label>
          ) : null}

          <label className="space-y-1 text-sm font-medium text-slate-800">
            {t("positionLabel")}
            <input
              className="input w-full"
              value={positionName}
              onChange={(event) => setPositionName(event.target.value)}
              placeholder={t("positionPlaceholder")}
            />
          </label>

          <label className="space-y-1 text-sm font-medium text-slate-800">
            {t("leaderEmailLabel")}
            <input
              className={`input w-full ${showLeaderError ? "border-red-400 focus-visible:ring-red-200" : ""}`}
              value={leaderEmail}
              onChange={(event) => setLeaderEmail(event.target.value)}
              placeholder="nombre@wisecx.com"
              inputMode="email"
            />
            <span className="text-xs text-slate-500">{t("leaderEmailHint")}</span>
            {showLeaderError ? (
              <span className="text-xs font-medium text-red-600">{t("errors.leaderEmail")}</span>
            ) : null}
          </label>
        </div>
        <div className="flex justify-end border-t bg-slate-50 px-5 py-4">
          <button
            className="btn-primary min-w-[140px]"
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
