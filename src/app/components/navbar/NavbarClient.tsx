// src/app/components/navbar/NavbarClient.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutGrid,
  Clock,
  BarChart2,
  Users,
  Users2,
  Mail,
  Shield,
  ShieldCheck,
  Target,
  Loader2,
  Settings,
  Home,
} from "lucide-react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { formatUSD } from "@/app/components/features/proposals/lib/format";
import {
  q1Range,
  q2Range,
  q3Range,
  q4Range,
} from "@/app/components/features/proposals/lib/dateRanges";
import { loadNavbarProgress } from "@/app/components/navbar/load-progress";
import { normalizeProfileText } from "@/app/components/navbar/profile-format";
import { useLanguage, useTranslations } from "@/app/LanguageProvider";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import type { AppRole } from "@/constants/teams";
import { isMapachePath } from "@/lib/routing";
import {
  MAPACHE_PORTAL_DEFAULT_SECTION,
  MAPACHE_PORTAL_READY_EVENT,
  MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
  type MapachePortalSection,
  isMapachePortalSection,
} from "@/app/mapache-portal/section-events";
import PortalLauncher from "@/app/components/navbar/PortalLauncher";

export type NavbarClientProps = {
  session: Session | null;
};

// ---- Tipos de tabs ----
type DirectTab = "generator" | "history" | "stats" | "goals";
type LegacyTab = DirectTab | "teams" | "users";

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

type AnyRole =
  | "admin"
  | "lider"
  | "comercial"
  | "usuario"
  | string
  | undefined;

const APP_ROLES: readonly AppRole[] = ["admin", "lider", "usuario"];
const APP_ROLE_SET: ReadonlySet<AppRole> = new Set<AppRole>(APP_ROLES);
const ADMIN_ROLES: ReadonlySet<AppRole> = new Set<AppRole>(["admin"]);

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

const DIRECT_PORTAL_TAB_ROUTES: Record<DirectTab, string> = {
  generator: "/portal/directo/generator",
  history: "/portal/directo/history",
  stats: "/portal/directo/stats",
  goals: "/portal/directo/goals",
};

function TabBtn({
  label,
  active,
  href,
  Icon,
}: {
  label: string;
  active: boolean;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
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
    </Link>
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

function initials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  return (i1 + i2).toUpperCase();
}

export default function NavbarClient({ session }: NavbarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPathRaw = pathname ?? "";
  const normalizedPath =
    normalizedPathRaw.length > 1 ? normalizedPathRaw.replace(/\/+$/, "") : normalizedPathRaw;
  const isHomePath = normalizedPath === "/home";
  const isPartnerPortal =
    normalizedPath.startsWith("/partner-portal") || normalizedPath.startsWith("/portal/partner");
  const searchParams = useSearchParams();
  const isMarketingPortal =
    normalizedPath.startsWith("/marketing-portal") || normalizedPath.startsWith("/portal/marketing");
  const marketingView =
    isMarketingPortal && searchParams?.get("view") === "history"
      ? "history"
      : "generator";
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("navbar");
  const tabsT = useTranslations("navbar.tabs");
  const profileT = useTranslations("navbar.profile");
  const modalT = useTranslations("navbar.modal");
  const modalLabelsT = useTranslations("navbar.modal.labels");
  const modalLogT = useTranslations("navbar.modal.log");
  const toastT = useTranslations("navbar.toast");
  const fallbacksT = useTranslations("navbar.fallbacks");
  const mapacheSectionsT = useTranslations("navbar.mapachePortalSections");
  const languageT = useTranslations("common.language");
  const configurationsT = useTranslations("configurations");
  const configurationsLabel = configurationsT("title");
  const configurationNavLinks = React.useMemo<
    Array<{
      id: "home" | "teams" | "users";
      href: string;
      label: string;
      Icon: React.ComponentType<{ className?: string }>;
    }>
  >(
    () => [
      {
        id: "home",
        href: "/home",
        label: configurationsT("tabs.home"),
        Icon: Home,
      },
      {
        id: "teams",
        href: "/configuraciones/team-management",
        label: configurationsT("tabs.teams"),
        Icon: Users2,
      },
      {
        id: "users",
        href: "/configuraciones/user-management",
        label: configurationsT("tabs.users"),
        Icon: ShieldCheck,
      },
    ],
    [configurationsT],
  );

  const handleLocaleChange = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocale(next);
      router.refresh();
    },
    [locale, router, setLocale]
  );

  const isMapachePortal = isMapachePath(pathname);
  const isDirectPortalNew = normalizedPath.startsWith("/portal/directo");
  const isDirectPortalLegacy = normalizedPath.startsWith("/direct-portal");
  const isDirectPortal = isDirectPortalNew || isDirectPortalLegacy;
  const isConfigurationsPath = normalizedPath.startsWith("/configuraciones");
  type NavbarVariant = "home" | "direct" | "config" | "default";
  const navbarVariant: NavbarVariant = isConfigurationsPath
    ? "config"
    : isDirectPortal
      ? "direct"
      : isHomePath
        ? "home"
        : "default";
  const status = session ? "authenticated" : "unauthenticated";
  const showDirectTabs = status === "authenticated" && navbarVariant === "direct";
  const showConfigTabs = status === "authenticated" && navbarVariant === "config";
  const showLegacyTabs =
    status === "authenticated" &&
    !isMapachePortal &&
    !isMarketingPortal &&
    navbarVariant === "default";
  const showAuthActions = status === "authenticated";
  const showPortalSwitcher = showAuthActions && navbarVariant !== "home";

  const role = (session?.user?.role as AnyRole) ?? "usuario";
  const appRole = toAppRole(role);
  const rawTeam = (session?.user?.team as string | null) ?? null;
  const team = normalizeProfileText(rawTeam) || fallbacksT("team");
  const name = normalizeProfileText(session?.user?.name) || fallbacksT("name");
  const email = session?.user?.email ?? fallbacksT("email");
  const currentEmail = session?.user?.email ?? "";
  const isAdminRole = ADMIN_ROLES.has(appRole);
  const showConfigurationsShortcut =
    showAuthActions &&
    isAdminRole &&
    (navbarVariant === "direct" || navbarVariant === "home");
  const userPortals = session?.user?.portals ?? ["direct"];
  const canOpenMapachePortal = userPortals.includes("mapache");
  const canAccessPartnerPortal = userPortals.includes("partner");
  const canAccessMarketingPortal = userPortals.includes("marketing");
  const canSeeUsers = isAdminRole;

  // ---- Tabs del portal directo (navegación nueva) ----
  const directActiveTab = React.useMemo<DirectTab | null>(() => {
    if (navbarVariant !== "direct") {
      return null;
    }
    const base = isDirectPortalNew ? "/portal/directo" : "/direct-portal";
    if (normalizedPath.startsWith(`${base}/history`)) return "history";
    if (normalizedPath.startsWith(`${base}/stats`)) return "stats";
    if (normalizedPath.startsWith(`${base}/goals`)) return "goals";
    return "generator";
  }, [navbarVariant, isDirectPortalNew, normalizedPath]);

  // ---- Tabs legacy (incluye teams/users) ----
  const readLegacyTab = React.useCallback((): LegacyTab => {
    const h = (globalThis?.location?.hash || "").replace("#", "");
    return (["generator", "history", "stats", "users", "teams", "goals"].includes(h)
      ? (h as LegacyTab)
      : "generator");
  }, []);

  const [legacyTab, setLegacyTab] = React.useState<LegacyTab>(() => readLegacyTab());

  React.useEffect(() => {
    const onHash = () => setLegacyTab(readLegacyTab());
    const onCustom = (e: Event) => setLegacyTab((e as CustomEvent).detail as LegacyTab);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("app:setTab", onCustom as EventListener);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("app:setTab", onCustom as EventListener);
    };
  }, [readLegacyTab]);

  const handleLegacyTabClick = React.useCallback((tab: LegacyTab) => {
    setLegacyTab(tab);
    try {
      location.hash = tab;
    } catch {}
    window.dispatchEvent(new CustomEvent("app:setTab", { detail: tab }));
  }, []);

  const configActiveTab = React.useMemo<"home" | "teams" | "users" | null>(() => {
    if (!isConfigurationsPath) return null;
    if (normalizedPath === "/configuraciones" || normalizedPath === "/configuraciones/") {
      return "home";
    }
    if (normalizedPath.startsWith("/configuraciones/team-management")) {
      return "teams";
    }
    if (normalizedPath.startsWith("/configuraciones/user-management")) {
      return "users";
    }
    return "home";
  }, [isConfigurationsPath, normalizedPath]);

  const [userModal, setUserModal] = React.useState(false);
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

    const targetPath = "/mapache-portal/generator";

    if (typeof router.prefetch === "function") {
      try {
        void router.prefetch(targetPath);
      } catch {
        // ignore prefetch errors and proceed with navigation
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
    if (pathname?.startsWith("/mapache-portal/generator")) {
      setMapacheSection("generator");
      return;
    }
    if (pathname?.startsWith("/mapache-portal/metrics")) {
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

  const handleMapacheSectionChange = React.useCallback(
    (next: MapachePortalSection) => {
      setMapacheSection(next);
      if (!isMapachePortal) return;
      const target = (() => {
        switch (next) {
          case "generator":
            return "/mapache-portal/generator";
          case "metrics":
            return "/mapache-portal/metrics";
          default:
            return "/mapache-portal/generator";
        }
      })();
      if (pathname !== target) {
        router.push(target);
      }
    },
    [isMapachePortal, pathname, router],
  );

  const now = new Date();
  const initialQuarter: 1 | 2 | 3 | 4 = (() => {
    const m = now.getMonth();
    if (m <= 2) return 1;
    if (m <= 5) return 2;
    if (m <= 8) return 3;
    return 4;
  })();

  const [yearSel, setYearSel] = React.useState<number>(now.getFullYear());
  const [quarterSel, setQuarterSel] = React.useState<1 | 2 | 3 | 4>(initialQuarter);
  const range = React.useMemo(
    () => [q1Range, q2Range, q3Range, q4Range][quarterSel - 1](yearSel),
    [yearSel, quarterSel]
  );

  const [goal, setGoal] = React.useState<number>(0);
  const [progress, setProgress] = React.useState<number>(0);
  const [inputAmount, setInputAmount] = React.useState<number>(0);
  const [loadingGoal, setLoadingGoal] = React.useState<boolean>(false);

  const loadMyGoal = React.useCallback(async () => {
    setLoadingGoal(true);
    try {
      const r = await fetch(`/api/goals/user?year=${yearSel}&quarter=${quarterSel}`);
      const j = await r.json();
      const amt = Number(j.amount || 0);
      setGoal(amt);
      setInputAmount(amt);
    } catch {
      setGoal(0);
      setInputAmount(0);
    } finally {
      setLoadingGoal(false);
    }
  }, [yearSel, quarterSel]);

  const loadMyProgress = React.useCallback(async () => {
    try {
      const total = await loadNavbarProgress({ userEmail: currentEmail, range });
      setProgress(total);
    } catch {
      setProgress(0);
    }
  }, [currentEmail, range]);

  React.useEffect(() => {
    if (!userModal || !currentEmail) return;
    loadMyGoal();
    loadMyProgress();
  }, [userModal, currentEmail, loadMyGoal, loadMyProgress]);

  const saveMyGoal = async () => {
    try {
      const r = await fetch("/api/goals/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: inputAmount, year: yearSel, quarter: quarterSel }),
      });
      if (!r.ok) throw new Error();
      setGoal(inputAmount);
      toast.success(toastT("goalSaved"));
    } catch {
      toast.error(toastT("goalError"));
    }
  };

  const pct = goal > 0 ? (progress / goal) * 100 : 0;

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
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Wise CX"
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
          {showPortalSwitcher ? (
            <PortalLauncher
              canAccessMapache={canOpenMapachePortal}
              canAccessPartner={canAccessPartnerPortal}
              canAccessMarketing={canAccessMarketingPortal}
              onMapacheNavigate={beginMapacheTransition}
            />
          ) : null}
        </div>

        <div className="flex flex-1 items-center justify-center">
          {isMapachePortal ? (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-1 py-1">
              <MapacheSectionBtn
                id="generator"
                label={mapacheSectionsT("generator")}
                active={mapacheSection === "generator"}
                onClick={handleMapacheSectionChange}
              />
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
          ) : isMarketingPortal ? (
            <div className="flex items-center gap-2">
              <Link
                href="/marketing-portal"
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  marketingView === "generator"
                    ? "bg-white text-[#3b0a69] border-transparent shadow-sm"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/15"
                }`}
                aria-current={marketingView === "generator" ? "page" : undefined}
              >
                {tabsT("generator")}
              </Link>
              <Link
                href="/marketing-portal?view=history"
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  marketingView === "history"
                    ? "bg-white text-[#3b0a69] border-transparent shadow-sm"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/15"
                }`}
                aria-current={marketingView === "history" ? "page" : undefined}
              >
                {tabsT("history")}
              </Link>
            </div>
          ) : showDirectTabs ? (
            <div className="relative hidden w-full md:block">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto flex items-center gap-2">
                  <TabBtn
                    label={tabsT("generator")}
                    Icon={LayoutGrid}
                    active={!isConfigurationsPath && directActiveTab === "generator"}
                    href={DIRECT_PORTAL_TAB_ROUTES.generator}
                  />
                  <TabBtn
                    label={tabsT("history")}
                    Icon={Clock}
                    active={directActiveTab === "history"}
                    href={DIRECT_PORTAL_TAB_ROUTES.history}
                  />
                  <TabBtn
                    label={tabsT("stats")}
                    Icon={BarChart2}
                    active={directActiveTab === "stats"}
                    href={DIRECT_PORTAL_TAB_ROUTES.stats}
                  />
                  <TabBtn
                    label={tabsT("goals")}
                    Icon={Target}
                    active={directActiveTab === "goals"}
                    href={DIRECT_PORTAL_TAB_ROUTES.goals}
                  />
                </div>
              </div>
            </div>
          ) : showConfigTabs ? (
            <div className="relative hidden w-full md:block">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto flex items-center gap-2">
                  {configurationNavLinks.map(({ id, label, href, Icon }) => (
                    <TabBtn
                      key={id}
                      label={label}
                      Icon={Icon}
                      active={configActiveTab === id}
                      href={href}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : showLegacyTabs ? (
            <div
              className="flex items-center gap-2 overflow-x-auto md:justify-center"
              role="tablist"
              aria-label={t("tabsAriaLabel")}
            >
              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0 ${
                  legacyTab === "generator"
                    ? "bg-white text-[#1f2937] border-transparent"
                    : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
                }`}
                onClick={() => handleLegacyTabClick("generator")}
              >
                <LayoutGrid className="h-4 w-4" />
                {tabsT("generator")}
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0 ${
                  legacyTab === "history"
                    ? "bg-white text-[#1f2937] border-transparent"
                    : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
                }`}
                onClick={() => handleLegacyTabClick("history")}
              >
                <Clock className="h-4 w-4" />
                {tabsT("history")}
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0 ${
                  legacyTab === "stats"
                    ? "bg-white text-[#1f2937] border-transparent"
                    : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
                }`}
                onClick={() => handleLegacyTabClick("stats")}
              >
                <BarChart2 className="h-4 w-4" />
                {tabsT("stats")}
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0 ${
                  legacyTab === "goals"
                    ? "bg-white text-[#1f2937] border-transparent"
                    : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
                }`}
                onClick={() => handleLegacyTabClick("goals")}
              >
                <Target className="h-4 w-4" />
                {tabsT("goals")}
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0 ${
                  legacyTab === "teams"
                    ? "bg-white text-[#1f2937] border-transparent"
                    : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
                }`}
                onClick={() => handleLegacyTabClick("teams")}
              >
                <Users2 className="h-4 w-4" />
                {tabsT("teams")}
              </button>
              {canSeeUsers && (
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0 ${
                    legacyTab === "users"
                      ? "bg-white text-[#1f2937] border-transparent"
                      : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => handleLegacyTabClick("users")}
                >
                  <Users className="h-4 w-4" />
                  {tabsT("users")}
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {showConfigurationsShortcut && (
            <Link
              href="/configuraciones"
              className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1.5 text-[13px] transition
                ${
                  isConfigurationsPath
                    ? "border-transparent bg-white text-[#1f2937] shadow-sm"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/15"
                }`}
              aria-label={configurationsLabel}
              title={configurationsLabel}
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
          {showAuthActions && (
            <button
              onClick={() => setUserModal(true)}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
              title={profileT("open")}
            >
              {name}
            </button>
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
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[65] flex flex-col items-center justify-center bg-slate-950/90 text-white transition-opacity duration-200 ease-out ${
            mapacheTransitionOpaque ? "opacity-100" : "opacity-0"
          }`}
        >
          <Loader2 className="h-12 w-12 animate-spin text-white/80" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold">Ingresando al portal</p>
        </div>
      ) : null}

      <Modal
        open={showAuthActions && userModal}
        onClose={() => setUserModal(false)}
        title={modalT("title")}
        variant="inverted"
        panelClassName="max-w-2xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-[12px] text-white/80">
              {modalT("periodLabel")}: {yearSel} - Q{quarterSel} ({range.from} — {range.to})
            </div>
            <div className="flex gap-2">
              <button className="btn-bar" onClick={() => setUserModal(false)}>
                {modalT("close")}
              </button>
              <button className="btn-bar" onClick={saveMyGoal}>
                {modalT("save")}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold bg-white text-[rgb(var(--primary))]">
              {initials(name)}
            </div>
            <div>
              <div className="text-base font-semibold">{name}</div>
              <div className="text-sm text-white/90 inline-flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {email}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 flex items-center gap-1 mb-0.5">
                <Shield className="h-3.5 w-3.5" />
                {modalLabelsT("role")}
              </div>
              <div className="font-medium">{(role ?? "usuario").toString()}</div>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 flex items-center gap-1 mb-0.5">
                <Users2 className="h-3.5 w-3.5" />
                {modalLabelsT("team")}
              </div>
              <div className="font-medium">{team}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              {modalLabelsT("year")}
              <select
                className="select-on-dark mt-1 w-full"
                value={yearSel}
                onChange={(e) => setYearSel(Number(e.target.value))}
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y} className="text-black">
                      {y}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm">
              {modalLabelsT("quarter")}
              <select
                className="select-on-dark mt-1 w-full"
                value={quarterSel}
                onChange={(e) => setQuarterSel(Number(e.target.value) as 1 | 2 | 3 | 4)}
              >
                <option value={1} className="text-black">
                  Q1
                </option>
                <option value={2} className="text-black">
                  Q2
                </option>
                <option value={3} className="text-black">
                  Q3
                </option>
                <option value={4} className="text-black">
                  Q4
                </option>
              </select>
            </label>
            <label className="text-sm">
              {modalLabelsT("goal")}
              <input
                className="input-pill mt-1 w-full"
                type="number"
                min={0}
                value={inputAmount}
                onChange={(e) => setInputAmount(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 mb-1">{modalLabelsT("currentGoal")}</div>
              <div className="text-lg font-semibold">{formatUSD(goal)}</div>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 mb-1">{modalLabelsT("progress")}</div>
              <div className="text-lg font-semibold">{formatUSD(progress)}</div>
              <div className="text-[12px] text-white/70">{`${pct.toFixed(1)}${modalT("progressSuffix")}`}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[12px] text-white/80">{modalLogT("title")}</div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[13px]">
              {loadingGoal ? modalLogT("loading") : modalLogT("info")}
            </div>
          </div>
        </div>
      </Modal>
    </nav>
  );
}
