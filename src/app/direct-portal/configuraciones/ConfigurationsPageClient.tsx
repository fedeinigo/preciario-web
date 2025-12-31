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
import UserAvatar from "@/app/components/ui/UserAvatar";

type TeamRow = { id: string; name: string };

type ConfigurationsPageClientProps = {
  isAdmin: boolean;
};

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
  };
}

export default function ConfigurationsPageClient({ isAdmin }: ConfigurationsPageClientProps) {
  void isAdmin;
  const configT = useTranslations("configurations");
  const sectionsT = useTranslations("configurations.sections");
  
  const { teams, loading: loadingTeams } = useTeamsData();
  const { users, loading: loadingUsers } = useAdminUsers({ isSuperAdmin: isAdmin });

  const summarySections = [
    {
      id: "teams",
      href: "/configuraciones/team-management",
      title: configT("tabs.teams"),
      description: configT("teamPanel.header.description"),
      Icon: Users2,
      gradient: "from-blue-500/10 to-blue-600/5",
      glowColor: "shadow-blue-500/10 hover:shadow-blue-500/20",
      stat: loadingTeams ? "..." : teams.length.toString(),
      statLabel: "equipos activos",
    },
    {
      id: "users",
      href: "/configuraciones/user-management",
      title: configT("tabs.users"),
      description: configT("userPanel.header.description"),
      Icon: ShieldCheck,
      gradient: "from-purple-500/10 to-purple-600/5",
      glowColor: "shadow-purple-500/10 hover:shadow-purple-500/20",
      stat: loadingUsers ? "..." : users.length.toString(),
      statLabel: "usuarios registrados",
    },
  ] as const;

  return (
    <ConfigPageShell>
      <div className="space-y-10">
        <header className="text-center">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-white/80 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              Panel de Administracion
            </div>
            <h1 className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              Configuraciones
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base text-slate-600">
              Gestiona equipos, usuarios y permisos de acceso desde un solo lugar.
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {summarySections.map(
            ({ id, href, title, description: desc, Icon, gradient, glowColor, stat, statLabel }) => (
              <Link
                key={id}
                href={href}
                className={[
                  "group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-left shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
                  glowColor,
                ].join(" ")}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />
                <div className="relative z-10">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 p-4 shadow-lg">
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900">{stat}</div>
                      <div className="text-xs font-medium text-slate-500">{statLabel}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600">
                    {sectionsT("visit")}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </ConfigPageShell>
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
    <ConfigPageShell>
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
    </ConfigPageShell>
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
    <ConfigPageShell>
      <SectionPageShell
        title={configT("tabs.users")}
        description={configT("userPanel.header.description")}
      >
        <UserManagementPanel
          teams={teams}
          users={users}
          loadingUsers={loadingUsers || loadingTeams}
          reloadUsers={reloadAdminUsers}
        />
      </SectionPageShell>
    </ConfigPageShell>
  );
}

function ConfigPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-var(--nav-h))] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -top-32 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-200/50 via-violet-200/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-indigo-200/40 via-blue-200/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-100/30 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-[1500px]">{children}</div>
    </div>
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
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-purple-200/60 bg-white/80 px-8 py-7 shadow-lg shadow-purple-500/5 backdrop-blur-sm">
        <h1 className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
        )}
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
  const portalsT = useTranslations("navbar.portalSwitcher.options");

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
          portal: portalsT(`${portal}.label`),
        }),
      );
      await reloadUsers().catch(() => undefined);
    } catch {
      toast.error(teamPanelT("portals.error"));
    } finally {
      setPortalSaving(false);
    }
  };

  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{teams.length}</span> equipos activos
          </div>
          {loadingTeams && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando...
            </span>
          )}
        </div>
        
        {isAdmin && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Crear Equipo
          </button>
        )}
      </div>

      {teamsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los equipos: {teamsError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">{teamPanelT("table.headings.team")}</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">{teamPanelT("table.headings.leaders")}</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">{teamPanelT("table.headings.members")}</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">{teamPanelT("table.headings.portals")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-700">{teamPanelT("table.headings.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamStats.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-sm text-slate-500" colSpan={5}>
                      <div className="flex flex-col items-center gap-2">
                        <Users2 className="h-12 w-12 text-slate-300" />
                        <p className="font-medium">{teamPanelT("table.empty")}</p>
                      </div>
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
                      <tr key={team.id} className="transition-colors hover:bg-purple-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-base font-bold text-white shadow-lg shadow-purple-500/30">
                              {team.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-base font-bold text-slate-900">{team.name}</div>
                              <p className="text-xs font-medium text-slate-500">
                                {teamMembers.length} {teamPanelT("table.people")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-900">{leaders.length}</span>
                            <ShieldCheck className="h-4 w-4 text-purple-500" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-slate-900">{members.length}</span>
                            {teamMembers.length > 0 && (
                              <div className="flex -space-x-2">
                    {teamMembers.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex">
                        <UserAvatar
                          name={member.name ?? undefined}
                          email={member.email ?? undefined}
                          image={member.image ?? undefined}
                          size={32}
                          className="border-2 border-white shadow-md"
                        />
                      </div>
                    ))}
                                {teamMembers.length > 3 && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-bold text-slate-600 shadow-md">
                                    +{teamMembers.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(activePortals).map((portal) => (
                              <span
                                key={portal}
                                className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700"
                              >
                                {portalsT(`${portal}.label`)}
                              </span>
                            ))}
                            {activePortals.size === 0 && (
                              <span className="text-xs font-medium text-slate-400">
                                {teamPanelT("table.noPortals")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md disabled:opacity-50"
                              onClick={() => setPortalTeam(team)}
                              disabled={!isAdmin}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {teamPanelT("actions.portals")}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md disabled:opacity-50"
                              onClick={() => openRenameModal(team)}
                              disabled={!isAdmin}
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              {teamPanelT("actions.rename")}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm transition-all hover:border-red-300 hover:bg-red-100 hover:shadow-md disabled:opacity-50"
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

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={teamPanelT("form.title")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{teamPanelT("form.subtitle")}</p>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder={teamPanelT("form.placeholder")}
            value={newTeam}
            onChange={(event) => setNewTeam(event.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setCreateModalOpen(false);
                setNewTeam("");
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              onClick={async () => {
                await handleCreateTeam();
                setCreateModalOpen(false);
              }}
              disabled={creating}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              {teamPanelT("form.submit")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(renameTeam)}
        onClose={() => setRenameTeam(null)}
        title={teamPanelT("rename.title")}
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
        title={teamPanelT("portals.title", { team: portalTeam?.name ?? "" })}
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
                          <div className="font-medium text-slate-900">{portalsT(`${portal}.label`)}</div>
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
                              ? "bg-purple-600 text-white"
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
  const portalsT = useTranslations("navbar.portalSwitcher.options");

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

  const getRoleBadge = (role: string) => {
    if (role === "admin") return "bg-purple-100 text-purple-700 border-purple-200";
    if (role === "lider") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-500/20">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            placeholder={userPanelT("filters.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">{userPanelT("filters.allRoles")}</option>
          <option value="admin">Admin</option>
          <option value="lider">Líder</option>
          <option value="usuario">Usuario</option>
        </select>

        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filteredUsers.length}</span> de {users.length}
          {loadingUsers && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">{userPanelT("table.headers.name")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">{userPanelT("table.headers.role")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">{userPanelT("table.headers.team")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">{userPanelT("table.headers.portals")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">{userPanelT("table.headers.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={5}>
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">{userPanelT("table.noResults")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          name={user.name ?? undefined}
                          email={user.email ?? undefined}
                          image={user.image ?? undefined}
                          size={36}
                          className="rounded-lg shadow-sm"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {user.name || userPanelT("table.placeholderName")}
                          </div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={`w-full rounded-lg border ${getRoleBadge(user.role)} px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60`}
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
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
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
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {portalsT("direct.label")}
                        </span>
                        {MUTABLE_PORTAL_ACCESS.map((portal) => {
                          const enabled = user.portals.includes(portal);
                          return (
                            <button
                              key={portal}
                              type="button"
                              disabled={savingId === user.id}
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                                enabled 
                                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                                  : "border border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50"
                              } ${savingId === user.id ? "cursor-not-allowed opacity-60" : ""}`}
                              onClick={() => toggleUserPortal(user, portal, !enabled)}
                            >
                              {enabled ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                              {portalsT(`${portal}.label`)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {savingId === user.id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {userPanelT("table.saving")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
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
      </div>
    </section>
  );
}
