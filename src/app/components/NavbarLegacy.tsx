// src/app/components/NavbarLegacy.tsx
// Mantiene el Navbar original basado en useSession. QuedarÃƒÂ¡ deprecado cuando el flag
// FEATURE_PROPOSALS_CLIENT_REFACTOR se active permanentemente.
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import UserProfileModal from "@/app/components/ui/UserProfileModal";
import { LayoutGrid, Clock, BarChart2, Users, Users2, Target } from "lucide-react";
import { useLanguage, useTranslations } from "@/app/LanguageProvider";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import type { AppRole } from "@/constants/teams";
import { isMapachePath } from "@/lib/routing";
import {
  MAPACHE_PORTAL_DEFAULT_SECTION,
  MAPACHE_PORTAL_NAVIGATE_EVENT,
  MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
  type MapachePortalSection,
  isMapachePortalSection,
} from "@/app/mapache-portal/section-events";
import { normalizeProfileText } from "@/app/components/navbar/profile-format";


type Tab = "generator" | "history" | "stats" | "users" | "teams" | "goals";
type AnyRole =
  | "superadmin"
  | "admin"
  | "lider"
  | "comercial"
  | "usuario"
  | string
  | undefined;

const APP_ROLES: readonly AppRole[] = [
  "superadmin",
  "admin",
  "lider",
  "usuario",
];
const APP_ROLE_SET: ReadonlySet<AppRole> = new Set<AppRole>(APP_ROLES);
const ADMIN_ROLES: ReadonlySet<AppRole> = new Set<AppRole>(["superadmin", "admin"]);

function toAppRole(role: AnyRole): AppRole {
  return typeof role === "string" && APP_ROLE_SET.has(role as AppRole)
    ? (role as AppRole)
    : "usuario";
}

const LANGUAGE_LABEL_KEYS: Record<Locale, "spanish" | "english" | "portuguese"> = {
  es: "spanish",
  en: "english",
  pt: "portuguese",
};

function TabBtn({
  id,
  label,
  active,
  onClick,
  Icon,
}: {
  id: Tab;
  label: string;
  active: boolean;
  onClick: (t: Tab) => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0
        ${
          active
            ? "bg-white text-[#1f2937] border-transparent"
            : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
        }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MapacheSectionBtn({
  id,
  label,
  active,
  onClick,
}: {
  id: MapachePortalSection;
  label: string;
  active: boolean;
  onClick: (value: MapachePortalSection) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
        active
          ? "bg-white text-[#1f2937] shadow-soft"
          : "bg-transparent text-white/80 hover:bg-white/15"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("navbar");
  const tabsT = useTranslations("navbar.tabs");
  const profileT = useTranslations("navbar.profile");
  const fallbacksT = useTranslations("navbar.fallbacks");
  const languageT = useTranslations("common.language");
  const mapacheSectionsT = useTranslations("navbar.mapachePortalSections");

  const handleLocaleChange = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocale(next);
      router.refresh();
    },
    [locale, router, setLocale]
  );

  const { data: session, status } = useSession();

  const isMapachePortal = isMapachePath(pathname);

  // Tabs/acciones solo cuando estoy autenticado
  const showTabs = status === "authenticated" && !isMapachePortal;
  const showAuthActions = status === "authenticated";

  const role = (session?.user?.role as AnyRole) ?? "usuario";
  const appRole = toAppRole(role);
  const rawTeam = (session?.user?.team as string | null) ?? null;
  const team = normalizeProfileText(rawTeam) || fallbacksT("team");
  const name = normalizeProfileText(session?.user?.name) || fallbacksT("name");
  const canSeeUsers = ADMIN_ROLES.has(appRole);
  const canOpenMapachePortal = rawTeam === "Mapaches" || ADMIN_ROLES.has(appRole);
  const showMapacheReturn =
    showAuthActions && canOpenMapachePortal && isMapachePortal;
  const showMapacheLink =
    showAuthActions && canOpenMapachePortal && !isMapachePortal;

  const readHash = (): Tab => {
    const h = (globalThis?.location?.hash || "").replace("#", "");
    return (
      (["generator", "history", "stats", "users", "teams", "goals"].includes(h)
        ? (h as Tab)
        : "generator")
    );
  };

  const [activeTab, setActiveTab] = React.useState<Tab>(readHash());
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [mapacheSection, setMapacheSection] =
    React.useState<MapachePortalSection>(MAPACHE_PORTAL_DEFAULT_SECTION);

  const viewerProfile = React.useMemo(
    () => ({
      id: (session?.user?.id as string | undefined) ?? null,
      email: session?.user?.email ?? null,
      name: session?.user?.name ?? null,
      role: appRole,
      team: rawTeam,
    }),
    [session?.user?.id, session?.user?.email, session?.user?.name, appRole, rawTeam]
  );

  const targetProfile = React.useMemo(
    () => ({
      id: (session?.user?.id as string | undefined) ?? undefined,
      email: session?.user?.email ?? null,
      name: session?.user?.name ?? null,
      role: appRole,
      team: rawTeam,
    }),
    [session?.user?.id, session?.user?.email, session?.user?.name, appRole, rawTeam]
  );

  React.useEffect(() => {
    const onHash = () => setActiveTab(readHash());
    const onCustom = (e: Event) =>
      setActiveTab((e as CustomEvent).detail as Tab);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("app:setTab", onCustom as EventListener);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("app:setTab", onCustom as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (!isMapachePortal) return;

    const handleSectionChanged = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (isMapachePortalSection(detail)) {
        setMapacheSection(detail);
      }
    };

    window.addEventListener(
      MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
      handleSectionChanged as EventListener,
    );

    return () => {
      window.removeEventListener(
        MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
        handleSectionChanged as EventListener,
      );
    };
  }, [isMapachePortal]);

  React.useEffect(() => {
    if (!isMapachePortal) {
      setMapacheSection(MAPACHE_PORTAL_DEFAULT_SECTION);
    }
  }, [isMapachePortal]);

  function setTab(t: Tab) {
    setActiveTab(t);
    try {
      location.hash = t;
    } catch {}
    window.dispatchEvent(new CustomEvent("app:setTab", { detail: t }));
  }

  const handleMapacheSectionChange = React.useCallback(
    (next: MapachePortalSection) => {
      setMapacheSection(next);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<MapachePortalSection>(
            MAPACHE_PORTAL_NAVIGATE_EVENT,
            { detail: next },
          ),
        );
      }
    },
    [],
  );

return (
    <nav
      role="navigation"
      aria-label={t("ariaLabel")}
      className={`navbar fixed top-0 inset-x-0 z-50 border-b border-white/15 backdrop-blur supports-[backdrop-filter]:bg-opacity-80 ${isMapachePortal ? "navbar--mapache-portal" : ""}`}
      style={{ height: "var(--nav-h)" }}
    >
      <div className="navbar-inner mx-auto max-w-[2000px] px-3">
        {/* IZQUIERDA: logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt={t("logoAlt")}
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
          {showMapacheReturn && (
            <Link
              href="/"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
            >
              {profileT("mapachePortalReturn")}
            </Link>
          )}
        </div>

        {/* CENTRO: tabs / secciones Mapache */}
        <div
          className={`flex-1 min-w-0 ${
            isMapachePortal || showTabs ? "px-2" : ""
          }`}
        >
          {isMapachePortal ? (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-1 py-1">
                <MapacheSectionBtn
                  id="tasks"
                  label={mapacheSectionsT("tasks")}
                  active={mapacheSection === "tasks"}
                  onClick={handleMapacheSectionChange}
                />
                <MapacheSectionBtn
                  id="metrics"
                  label={mapacheSectionsT("metrics")}
                  active={mapacheSection === "metrics"}
                  onClick={handleMapacheSectionChange}
                />
              </div>
            </div>
          ) : showTabs ? (
            <div
              className="flex items-center gap-2 overflow-x-auto md:justify-center"
              role="tablist"
              aria-label={t("tabsAriaLabel")}
            >
              <TabBtn
                id="generator"
                label={tabsT("generator")}
                Icon={LayoutGrid}
                active={activeTab === "generator"}
                onClick={setTab}
              />
              <TabBtn
                id="history"
                label={tabsT("history")}
                Icon={Clock}
                active={activeTab === "history"}
                onClick={setTab}
              />
              <TabBtn
                id="stats"
                label={tabsT("stats")}
                Icon={BarChart2}
                active={activeTab === "stats"}
                onClick={setTab}
              />
              <TabBtn
                id="goals"
                label={tabsT("goals")}
                Icon={Target}
                active={activeTab === "goals"}
                onClick={setTab}
              />
              <TabBtn
                id="teams"
                label={tabsT("teams")}
                Icon={Users2}
                active={activeTab === "teams"}
                onClick={setTab}
              />
              {canSeeUsers && (
                <TabBtn
                  id="users"
                  label={tabsT("users")}
                  Icon={Users}
                  active={activeTab === "users"}
                  onClick={setTab}
                />
              )}
            </div>
          ) : null}
        </div>

        {/* DERECHA: perfil + cerrar sesiÃƒÂ³n (autenticado) */}
        <div className="flex items-center gap-2">
          {showAuthActions && (
            <button
              onClick={() => setProfileOpen(true)}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
              title={profileT("open")}
            >
              {name}
            </button>
          )}
          {showMapacheLink && (
            <Link
              href="/mapache-portal"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
            >
              {profileT("mapachePortal")}
            </Link>
          )}
          {showAuthActions && (
            <select
              className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-sm text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
              value={locale}
              onChange={(event) => handleLocaleChange(event.target.value as Locale)}
              aria-label={languageT("label")}
              title={languageT("label")}
            >
              {locales.map((code) => (
                <option key={code} value={code} className="text-gray-900">
                  {`${code.toUpperCase()} - ${languageT(LANGUAGE_LABEL_KEYS[code])}`}
                </option>
              ))}
            </select>
          )}
          {showAuthActions && (
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90"
            >
              {profileT("signOut")}
            </button>
          )}
        </div>
      </div>

      <UserProfileModal
        open={showAuthActions && profileOpen}
        onClose={() => setProfileOpen(false)}
        viewer={viewerProfile}
        targetUser={targetProfile}
      />
    </nav>
  );
}
























