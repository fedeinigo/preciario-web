"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Users2,
  PencilLine,
  Trash2,
  ShieldCheck,
  Lock,
  Unlock,
  Loader2,
  Search,
  Filter,
  Globe,
  ArrowRight,
} from "lucide-react";

import { useTranslations } from "@/app/LanguageProvider";
import { useAdminUsers } from "@/app/components/features/proposals/hooks/useAdminUsers";
import type { AdminUser } from "@/app/components/features/proposals/hooks/useAdminUsers";
import Modal from "@/app/components/ui/Modal";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/toast";
import {
  MUTABLE_PORTAL_ACCESS,
  includeDefaultPortal,
  type PortalAccessId,
} from "@/constants/portals";

type TeamRow = { id: string; name: string };

type ConfigurationsPageClientProps = {
  isAdmin: boolean;
};

type TeamsStoreState = {
  teams: TeamRow[];
  loading: boolean;
  error: string | null;
};

let teamFetchCount = 0;

const teamsStore = {
  state: {
    teams: [] as TeamRow[],
    loading: true,
    error: null as string | null,
  },
  subscribers: new Set<() => void>(),
  fetchPromise: null as Promise<void> | null,
};

const notifyTeamsSubscribers = () => {
  teamsStore.subscribers.forEach((listener) => listener());
};

async function refreshTeamsData() {
  if (teamsStore.fetchPromise) {
    return teamsStore.fetchPromise;
  }
  teamsStore.state.loading = true;
  teamsStore.state.error = null;
  notifyTeamsSubscribers();

  teamFetchCount += 1;
  console.debug("[TeamsStore] fetching teams (#" + teamFetchCount + ")");

  const promise = (async () => {
    try {
      const response = await fetch("/api/teams", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(response.statusText || "Failed to load teams");
      }
      const data = (await response.json()) as TeamRow[];
      teamsStore.state.teams = data;
      teamsStore.state.error = null;
    } catch (error) {
      teamsStore.state.teams = [];
      teamsStore.state.error =
        error instanceof Error ? error.message : "Failed to load teams";
    } finally {
      teamsStore.state.loading = false;
      notifyTeamsSubscribers();
    }
  })();

  teamsStore.fetchPromise = promise;
  await promise;
  teamsStore.fetchPromise = null;
  return promise;
}

function useTeamsData() {
  const [state, setState] = React.useState(() => ({
    teams: teamsStore.state.teams,
    loading: teamsStore.state.loading,
    error: teamsStore.state.error,
  }));

  React.useEffect(() => {
    const listener = () => {
      setState({
        teams: teamsStore.state.teams,
        loading: teamsStore.state.loading,
        error: teamsStore.state.error,
      });
    };
    teamsStore.subscribers.add(listener);
    return () => {
      teamsStore.subscribers.delete(listener);
    };
  }, []);

  React.useEffect(() => {
    void refreshTeamsData();
  }, []);

  return {
    teams: state.teams,
    loading: state.loading,
    error: state.error,
    refresh: refreshTeamsData,
    fetchCount: teamFetchCount,
  };
}

export function getTeamsFetchCount() {
  return teamFetchCount;
}

export default function ConfigurationsPageClient({ isAdmin }: ConfigurationsPageClientProps) {
  void isAdmin;
  const configT = useTranslations("configurations");
  const sectionsT = useTranslations("configurations.sections");
  const summarySections = [
    {
      id: "teams",
      href: "/configuraciones/team-management",
      title: configT("tabs.teams"),
      description: configT("teamPanel.header.description"),
      Icon: Users2,
    },
    {
      id: "users",
      href: "/configuraciones/user-management",
      title: configT("tabs.users"),
      description: configT("userPanel.header.description"),
      Icon: ShieldCheck,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {summarySections.map(({ id, href, title, description: desc, Icon }) => (
          <Link
            key={id}
            href={href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(var(--primary))]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-900/10 p-2 text-slate-900">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-600">{desc}</p>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[rgb(var(--primary))]">
              {sectionsT("visit")}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TeamManagementPageClient({ isAdmin }: ConfigurationsPageClientProps) {
  const configT = useTranslations("configurations");
  const {
    teams,
    loading: loadingTeams,
    refresh: refreshTeams,
    error: teamsError,
  } = useTeamsData();
  const {
    users,
    reload: reloadAdminUsers,
  } = useAdminUsers({ isSuperAdmin: isAdmin });

  return (
    <SectionPageShell
      title={configT("tabs.teams")}
      description={configT("teamPanel.header.description")}
    >
      <TeamManagementPanel
        isAdmin={isAdmin}
        teams={teams}
        loadingTeams={loadingTeams}
        refreshTeams={refreshTeams}
        teamsError={teamsError}
        users={users}
        reloadUsers={reloadAdminUsers}
      />
    </SectionPageShell>
  );
}

export function UserManagementPageClient({ isAdmin }: ConfigurationsPageClientProps) {
  const configT = useTranslations("configurations");
  const { teams, loading: loadingTeams } = useTeamsData();
  const {
    users,
    loading: loadingUsers,
    reload: reloadAdminUsers,
  } = useAdminUsers({ isSuperAdmin: isAdmin });

  return (
    <SectionPageShell
      title={configT("tabs.users")}
      description={configT("userPanel.header.description")}
    >
      <UserManagementPanel teams={teams} users={users} loadingUsers={loadingUsers || loadingTeams} reloadUsers={reloadAdminUsers} />
    </SectionPageShell>
  );
}

function SectionPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const sectionsT = useTranslations("configurations.sections");

  return (
    <div className="space-y-6">
      <Link
        href="/configuraciones"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--primary))] hover:text-[rgb(var(--primary))]/80"
      >
        <ArrowRight className="h-3.5 w-3.5 -scale-x-100" aria-hidden="true" />
        {sectionsT("back")}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function TeamManagementPanel({
  isAdmin,
  teams,
  loadingTeams,
  refreshTeams,
  teamsError,
  users,
  reloadUsers,
}: {
  isAdmin: boolean;
  teams: TeamRow[];
  loadingTeams: boolean;
  refreshTeams: () => Promise<void>;
  teamsError?: string | null;
  users: AdminUser[];
  reloadUsers: () => Promise<AdminUser[]>;
}) {
  const teamPanelT = useTranslations("configurations.teamPanel");
  const portalsT = useTranslations("admin.users.portals");

  const [newTeam, setNewTeam] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [renameTeam, setRenameTeam] = React.useState<TeamRow | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [renaming, setRenaming] = React.useState(false);
  const [deleteTeam, setDeleteTeam] = React.useState<TeamRow | null>(null);
  const [portalTeam, setPortalTeam] = React.useState<TeamRow | null>(null);
  const [portalSaving, setPortalSaving] = React.useState(false);

  const teamStats = React.useMemo(() => {
    return teams.map((team) => {
      const teamMembers = users.filter((user) => (user.team || "") === team.name);
      const leaders = teamMembers.filter((user) => user.role === "lider");
      const members = teamMembers.filter((user) => user.role !== "lider");
      return { team, leaders, members };
    });
  }, [teams, users]);

  React.useEffect(() => {
    if (!teamsError) return;
    console.error("Failed to load teams:", teamsError);
  }, [teamsError]);

  const handleCreateTeam = async () => {
    const name = newTeam.trim();
    if (!name) return;
    setCreating(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        toast.error(data.error ?? teamPanelT("toast.createError"));
        return;
      }
      setNewTeam("");
      toast.success(teamPanelT("toast.createSuccess"));
      await refreshTeams();
    } catch {
      toast.error(teamPanelT("toast.createError"));
    } finally {
      setCreating(false);
    }
  };

  const openRenameModal = (team: TeamRow) => {
    setRenameTeam(team);
    setRenameValue(team.name);
  };

  const handleRenameTeam = async () => {
    if (!renameTeam) return;
    const next = renameValue.trim();
    if (!next || next === renameTeam.name) {
      setRenameTeam(null);
      return;
    }
    setRenaming(true);
    try {
      const response = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renameTeam.id, name: next }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        toast.error(data.error ?? teamPanelT("toast.renameError"));
        return;
      }
      toast.success(teamPanelT("toast.renameSuccess"));
      setRenameTeam(null);
      await refreshTeams();
      await reloadUsers().catch(() => undefined);
    } catch {
      toast.error(teamPanelT("toast.renameError"));
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeam) return;
    try {
      const response = await fetch("/api/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTeam.id, replaceWith: null }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        toast.error(data.error ?? teamPanelT("toast.deleteError"));
        return;
      }
      toast.success(teamPanelT("toast.deleteSuccess"));
      setDeleteTeam(null);
      await refreshTeams();
      await reloadUsers().catch(() => undefined);
    } catch {
      toast.error(teamPanelT("toast.deleteError"));
    }
  };

  const handleTeamPortalToggle = async (
    team: TeamRow,
    members: AdminUser[],
    portal: (typeof MUTABLE_PORTAL_ACCESS)[number],
    enable: boolean,
  ) => {
    if (members.length === 0) {
      toast.info(teamPanelT("portals.empty"));
      return;
    }
    setPortalSaving(true);
    try {
      const updates: Promise<void>[] = [];
      for (const member of members) {
        const hasPortal = member.portals.includes(portal);
        if (hasPortal === enable) continue;
        const base = enable
          ? [...member.portals, portal]
          : member.portals.filter((p) => p !== portal);
        const next = includeDefaultPortal(base);
        updates.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: member.id,
              portals: next,
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const data: { error?: string } = await response.json().catch(() => ({}));
              throw new Error(data.error ?? "Failed");
            }
          }),
        );
      }

      if (updates.length === 0) {
        toast.info(teamPanelT("portals.noChanges"));
        return;
      }

      const results = await Promise.allSettled(updates);
      const hasFailure = results.some((result) => result.status === "rejected");
      if (hasFailure) {
        throw new Error("portal update failed");
      }

      toast.success(
        teamPanelT("portals.updated", {
          team: team.name,
          portal: portalsT(portal),
        }),
      );
      await reloadUsers().catch(() => undefined);
    } catch {
      toast.error(teamPanelT("portals.error"));
    } finally {
      setPortalSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      {teamsError ? (
        <div className="rounded-b-none rounded-t-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudieron cargar los equipos: {teamsError}
        </div>
      ) : null}
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{teamPanelT("form.title")}</p>
            <p className="text-xs text-slate-600">{teamPanelT("form.subtitle")}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">{teamPanelT("form.placeholder")}</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={newTeam}
                onChange={(event) => setNewTeam(event.target.value)}
                disabled={!isAdmin}
              />
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={handleCreateTeam}
                disabled={!isAdmin || creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {teamPanelT("form.submit")}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            {teamPanelT("summary.label")}{" "}
            <span className="font-semibold text-slate-900">{teams.length}</span>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">{teamPanelT("table.title")}</p>
            {loadingTeams ? (
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {teamPanelT("table.loading")}
              </span>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{teamPanelT("table.headings.team")}</th>
                  <th className="px-4 py-3">{teamPanelT("table.headings.leaders")}</th>
                  <th className="px-4 py-3">{teamPanelT("table.headings.members")}</th>
                  <th className="px-4 py-3">{teamPanelT("table.headings.portals")}</th>
                  <th className="px-4 py-3 text-right">{teamPanelT("table.headings.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                      {teamPanelT("table.empty")}
                    </td>
                  </tr>
                ) : (
                  teamStats.map(({ team, leaders, members }) => {
                    const teamMembers = [...leaders, ...members];
                    const activePortals = new Set<PortalAccessId>();
                    teamMembers.forEach((member) => {
                      member.portals.forEach((portal) => activePortals.add(portal));
                    });
                    return (
                      <tr key={team.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{team.name}</div>
                          <p className="text-xs text-slate-500">
                            {teamMembers.length} {teamPanelT("table.people")}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{leaders.length}</td>
                        <td className="px-4 py-3 text-slate-700">{members.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {Array.from(activePortals).map((portal) => (
                              <span
                                key={portal}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                              >
                                {portalsT(portal)}
                              </span>
                            ))}
                            {activePortals.size === 0 ? (
                              <span className="text-slate-400">
                                {teamPanelT("table.noPortals")}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => setPortalTeam(team)}
                              disabled={!isAdmin}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {teamPanelT("actions.portals")}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => openRenameModal(team)}
                              disabled={!isAdmin}
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              {teamPanelT("actions.rename")}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-red-100 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              onClick={() => setDeleteTeam(team)}
                              disabled={!isAdmin}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {teamPanelT("actions.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(renameTeam)}
        onClose={() => setRenameTeam(null)}
        title={<span className="text-base font-semibold">{teamPanelT("rename.title")}</span>}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{teamPanelT("rename.description")}</p>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setRenameTeam(null)}
            >
              {teamPanelT("rename.cancel")}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={handleRenameTeam}
              disabled={renaming}
            >
              {renaming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {teamPanelT("rename.save")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(portalTeam)}
        onClose={() => setPortalTeam(null)}
        title={
          <span className="text-base font-semibold">
            {teamPanelT("portals.title", { team: portalTeam?.name ?? "" })}
          </span>
        }
      >
        {portalTeam ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{teamPanelT("portals.description")}</p>
            {(() => {
              const stats = teamStats.find((stat) => stat.team.id === portalTeam.id);
              const members = stats ? [...stats.leaders, ...stats.members] : [];
              return (
                <div className="space-y-3">
                  {MUTABLE_PORTAL_ACCESS.map((portal) => {
                    const withPortal = members.filter((member) => member.portals.includes(portal)).length;
                    const state =
                      withPortal === 0
                        ? "none"
                        : withPortal === members.length
                          ? "all"
                          : "partial";
                    return (
                      <label
                        key={portal}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{portalsT(portal)}</div>
                          <p className="text-xs text-slate-500">
                            {withPortal}/{members.length} {teamPanelT("portals.members")}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={portalSaving}
                          aria-busy={portalSaving || undefined}
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                            state === "all"
                              ? "bg-slate-900 text-white"
                              : state === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600",
                            portalSaving ? "cursor-not-allowed opacity-60" : "hover:opacity-90",
                          ].join(" ")}
                          onClick={() =>
                            handleTeamPortalToggle(portalTeam, members, portal, !(state === "all"))
                          }
                        >
                          {state === "all" ? (
                            <>
                              <Unlock className="h-3.5 w-3.5" />
                              {teamPanelT("portals.disable")}
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" />
                              {teamPanelT("portals.enable")}
                            </>
                          )}
                        </button>
                      </label>
                    );
                  })}
                  {portalSaving ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {teamPanelT("portals.saving")}
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTeam)}
        title={teamPanelT("dialogs.delete.title")}
        description={teamPanelT("dialogs.delete.description", { team: deleteTeam?.name ?? "" })}
        confirmText={teamPanelT("dialogs.delete.confirm")}
        onCancel={() => setDeleteTeam(null)}
        onConfirm={handleDeleteTeam}
      />
    </section>
  );
}

function UserManagementPanel({
  teams,
  users,
  loadingUsers,
  reloadUsers,
}: {
  teams: TeamRow[];
  users: AdminUser[];
  loadingUsers: boolean;
  reloadUsers: () => Promise<AdminUser[]>;
}) {
  const userPanelT = useTranslations("configurations.userPanel");
  const userToastT = useTranslations("configurations.userPanel.toast");
  const portalsT = useTranslations("admin.users.portals");

  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [teamFilter, setTeamFilter] = React.useState("all");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const pendingUserRequests = React.useRef(new Map<string, AbortController>());

  const teamOptions = React.useMemo(() => teams.map((team) => team.name), [teams]);

  const filteredUsers = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesText =
        !query ||
        user.email?.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesTeam =
        teamFilter === "all"
          ? true
          : teamFilter === "none"
            ? !user.team
            : (user.team || "").toLowerCase() === teamFilter.toLowerCase();
      return matchesText && matchesRole && matchesTeam;
    });
  }, [search, roleFilter, teamFilter, users]);

  const handleUpdateUser = async (
    userId: string,
    payload: Partial<{ role: string; team: string | null; portals: PortalAccessId[] }>,
  ) => {
    pendingUserRequests.current.get(userId)?.abort();
    const controller = new AbortController();
    pendingUserRequests.current.set(userId, controller);
    setSavingId(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        toast.error(data.error ?? userToastT("saveError"));
        return;
      }
      toast.success(userToastT("saveSuccess"));
      await reloadUsers();
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        return;
      }
      toast.error(userToastT("saveError"));
    } finally {
      const current = pendingUserRequests.current.get(userId);
      if (current === controller) {
        pendingUserRequests.current.delete(userId);
        setSavingId(null);
      }
    }
  };

  const toggleUserPortal = (
    user: AdminUser,
    portal: (typeof MUTABLE_PORTAL_ACCESS)[number],
    enable: boolean,
  ) => {
    const base = enable
      ? [...user.portals, portal]
      : user.portals.filter((entry) => entry !== portal);
    const next = includeDefaultPortal(base);
    void handleUpdateUser(user.id, { portals: next });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-4 px-6 py-6">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              className="flex-1 border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
              placeholder={userPanelT("filters.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="flex-1 border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">{userPanelT("filters.allRoles")}</option>
              <option value="admin">Admin</option>
              <option value="lider">Líder</option>
              <option value="usuario">Usuario</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="flex-1 border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="all">{userPanelT("filters.allTeams")}</option>
              <option value="none">{userPanelT("filters.onlyNoTeam")}</option>
              {teamOptions.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{userPanelT("table.headers.name")}</th>
                <th className="px-4 py-3">{userPanelT("table.headers.role")}</th>
                <th className="px-4 py-3">{userPanelT("table.headers.team")}</th>
                <th className="px-4 py-3">{userPanelT("table.headers.portals")}</th>
                <th className="px-4 py-3 text-right">{userPanelT("table.headers.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                    {userPanelT("table.noResults")}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {user.name || userPanelT("table.placeholderName")}
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        value={user.role}
                        disabled={savingId === user.id}
                        onChange={(event) => handleUpdateUser(user.id, { role: event.target.value })}
                      >
                        <option value="admin">Admin</option>
                        <option value="lider">Líder</option>
                        <option value="usuario">Usuario</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        value={user.team || ""}
                        disabled={savingId === user.id}
                        onChange={(event) => handleUpdateUser(user.id, { team: event.target.value || null })}
                      >
                        <option value="">{userPanelT("table.placeholderTeam")}</option>
                        {teamOptions.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          {portalsT("direct")}
                        </span>
                        {MUTABLE_PORTAL_ACCESS.map((portal) => {
                          const enabled = user.portals.includes(portal);
                          return (
                          <button
                            key={portal}
                            type="button"
                            disabled={savingId === user.id}
                            aria-busy={savingId === user.id || undefined}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                              enabled ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                            } ${savingId === user.id ? "cursor-not-allowed opacity-60" : "hover:opacity-90"}`}
                            onClick={() => toggleUserPortal(user, portal, !enabled)}
                          >
                              {enabled ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                              {portalsT(portal)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {savingId === user.id ? (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {userPanelT("table.saving")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {userPanelT("table.synced")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {loadingUsers ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {userPanelT("table.loading")}
          </div>
        ) : null}
      </div>
    </section>
  );
}
