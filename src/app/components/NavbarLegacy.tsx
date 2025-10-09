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
import { LayoutGrid, Clock, BarChart2, Users, Users2, Target, Wand2 } from "lucide-react";
import { useLanguage, useTranslations } from "@/app/LanguageProvider";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import type { AppRole } from "@/constants/teams";
import { isMapachePath } from "@/lib/routing";
import {
  MAPACHE_PORTAL_DEFAULT_SECTION,
  MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
  MAPACHE_PORTAL_READY_EVENT,
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

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

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
  const isPartnerPortal = pathname.startsWith("/partner-portal");
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
  const name = normalizeProfileText(session?.user?.name) || fallbacksT("name");
  const canSeeUsers = ADMIN_ROLES.has(appRole);
  const canOpenMapachePortal = rawTeam === "Mapaches" || ADMIN_ROLES.has(appRole);
  const showMapacheReturn =
    showAuthActions && canOpenMapachePortal && isMapachePortal;
  const showMapacheLink =
    showAuthActions && canOpenMapachePortal && !isMapachePortal;
  const showPartnerPortal =
    showAuthActions && ADMIN_ROLES.has(appRole) && !isPartnerPortal;

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
  const [mapacheTransitionVisible, setMapacheTransitionVisible] =
    React.useState(false);
  const [mapacheTransitionOpaque, setMapacheTransitionOpaque] =
    React.useState(false);
  const mapacheTransitionStartedRef = React.useRef(false);
  const mapacheTransitionOriginRef = React.useRef<string | null>(null);
  const mapacheHideTimeoutRef = React.useRef<number | null>(null);
  const mapacheFallbackTimeoutRef = React.useRef<number | null>(null);

  const clearMapacheHideTimeout = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (mapacheHideTimeoutRef.current !== null) {
      window.clearTimeout(mapacheHideTimeoutRef.current);
      mapacheHideTimeoutRef.current = null;
    }
  }, []);

  const clearMapacheFallbackTimeout = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (mapacheFallbackTimeoutRef.current !== null) {
      window.clearTimeout(mapacheFallbackTimeoutRef.current);
      mapacheFallbackTimeoutRef.current = null;
    }
  }, []);

  const hideMapacheTransition = React.useCallback(() => {
    if (typeof window === "undefined") {
      setMapacheTransitionOpaque(false);
      setMapacheTransitionVisible(false);
      mapacheTransitionStartedRef.current = false;
      mapacheTransitionOriginRef.current = null;
      return;
    }
    clearMapacheFallbackTimeout();
    clearMapacheHideTimeout();
    setMapacheTransitionOpaque(false);
    mapacheHideTimeoutRef.current = window.setTimeout(() => {
      setMapacheTransitionVisible(false);
      mapacheTransitionStartedRef.current = false;
      mapacheTransitionOriginRef.current = null;
      mapacheHideTimeoutRef.current = null;
    }, 240);
  }, [clearMapacheFallbackTimeout, clearMapacheHideTimeout]);

  const scheduleMapacheFallback = React.useCallback(() => {
    if (typeof window === "undefined") return;
    clearMapacheFallbackTimeout();
    mapacheFallbackTimeoutRef.current = window.setTimeout(() => {
      hideMapacheTransition();
    }, 15000);
  }, [clearMapacheFallbackTimeout, hideMapacheTransition]);

  const beginMapacheTransition = React.useCallback(() => {
    if (mapacheTransitionStartedRef.current) return;
    mapacheTransitionStartedRef.current = true;
    mapacheTransitionOriginRef.current = pathname ?? null;

    const targetPath = "/mapache-portal/tasks";

    if (typeof router.prefetch === "function") {
      try {
        void router.prefetch(targetPath);
      } catch {
        // ignore prefetch errors
      }
    }

    const navigate = () => {
      router.push(targetPath);
    };

    if (typeof window === "undefined") {
      navigate();
      return;
    }

    const showOverlay = (makeOpaqueImmediately = false) => {
      setMapacheTransitionVisible(true);
      if (makeOpaqueImmediately) {
        setMapacheTransitionOpaque(true);
        return;
      }
      setMapacheTransitionOpaque(false);
      requestAnimationFrame(() => {
        setMapacheTransitionOpaque(true);
      });
    };

    const doc = document as DocumentWithViewTransition;

    if (doc?.startViewTransition) {
      try {
        const transition = doc.startViewTransition(() => {
          navigate();
        });
        showOverlay();
        scheduleMapacheFallback();
        transition.ready
          .then(() => {
            setMapacheTransitionOpaque(true);
          })
          .catch(() => {
            setMapacheTransitionOpaque(true);
          });
        return;
      } catch {
        // fall through to manual animation
      }
    }

    showOverlay();
    scheduleMapacheFallback();
    window.setTimeout(() => {
      navigate();
    }, 120);
  }, [pathname, router, scheduleMapacheFallback]);

  const handleMapacheLinkClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      event.preventDefault();
      beginMapacheTransition();
    },
    [beginMapacheTransition],
  );

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
      return;
    }
    if (pathname.startsWith("/mapache-portal/metrics")) {
      setMapacheSection("metrics");
    } else {
      setMapacheSection("tasks");
    }
  }, [isMapachePortal, pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleReady = () => {
      hideMapacheTransition();
    };
    window.addEventListener(
      MAPACHE_PORTAL_READY_EVENT,
      handleReady as EventListener,
    );
    return () => {
      window.removeEventListener(
        MAPACHE_PORTAL_READY_EVENT,
        handleReady as EventListener,
      );
      clearMapacheHideTimeout();
      clearMapacheFallbackTimeout();
    };
  }, [
    hideMapacheTransition,
    clearMapacheHideTimeout,
    clearMapacheFallbackTimeout,
  ]);

  React.useEffect(() => {
    if (!mapacheTransitionVisible) return;
    if (!mapacheTransitionStartedRef.current) return;
    if (!pathname) return;
    if (pathname === mapacheTransitionOriginRef.current) return;
    if (!pathname.startsWith("/mapache-portal")) {
      hideMapacheTransition();
    }
  }, [pathname, mapacheTransitionVisible, hideMapacheTransition]);

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
      if (!isMapachePortal) return;
      const target =
        next === "metrics"
          ? "/mapache-portal/metrics"
          : "/mapache-portal/tasks";
      if (pathname !== target) {
        router.push(target);
      }
    },
    [isMapachePortal, pathname, router],
  );

  if (isPartnerPortal) {
    return null;
  }

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
          {showPartnerPortal && (
            <Link
              href="/partner-portal"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
            >
              Portal Partner
            </Link>
          )}
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
              href="/mapache-portal/tasks"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
              onClick={handleMapacheLinkClick}
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

      {mapacheTransitionVisible ? (
        <>
          <div
            aria-hidden="true"
            className={`fixed inset-0 z-[60] overflow-hidden bg-gradient-to-br from-[#020617]/85 via-[#00010a]/95 to-[#020617]/85 backdrop-blur-xl transition-opacity duration-400 ease-out ${
              mapacheTransitionOpaque ? "opacity-100" : "opacity-0"
            } pointer-events-auto`}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -inset-[35%] animate-[spin_18s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(15,118,254,0.08),transparent,rgba(59,130,246,0.16),transparent)] opacity-60" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.18),rgba(2,6,23,0.92))]" />
            </div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-white">
              <div className="relative flex items-center justify-center">
                <span className="absolute h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                <span className="absolute h-24 w-24 rounded-full border border-white/20" />
                <span className="absolute h-24 w-24 rounded-full border border-white/10 animate-ping" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white/90 shadow-[0_0_30px_rgba(59,130,246,0.35)] backdrop-blur-lg">
                  <Wand2 className="h-8 w-8 drop-shadow-[0_6px_16px_rgba(148,163,184,0.45)]" />
                </span>
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.6em] text-white/60">
                  Portal Mapache
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Preparando tablero inteligente...
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-white/70" aria-hidden="true" />
                <span>Sincronizando tareas y metricas del equipo</span>
              </div>
            </div>
          </div>
          <div
            className={`fixed inset-0 z-[60] bg-gradient-to-br from-[#0f172a]/80 via-[#020617]/95 to-[#00010a]/90 backdrop-blur-md transition-opacity duration-300 ease-out ${
              mapacheTransitionOpaque ? "opacity-100" : "opacity-0"
            } pointer-events-auto cursor-wait`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
            </div>
          </div>
        </>
      ) : null}

      <UserProfileModal
        open={showAuthActions && profileOpen}
        onClose={() => setProfileOpen(false)}
        viewer={viewerProfile}
        targetUser={targetProfile}
      />
    </nav>
  );
}
























