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
  ShieldCheck,
  Target,
  Loader2,
  Settings,
  Home,
} from "lucide-react";

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
import UserProfileModal from "@/app/components/ui/UserProfileModal";

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

type NavbarAppearance = "dark" | "light" | "mapache" | "direct" | "marketing";
type PortalLauncherVariant = "dark" | "light" | "mapache" | "direct" | "marketing";

type NavTheme = {
  surface: string;
  configButton: (active: boolean) => string;
  profileButton: string;
  languageSelect: string;
  signOutButton: string;
  portalVariant: PortalLauncherVariant;
  profileAppearance: NavbarAppearance;
};

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
  variant = "default",
}: {
  label: string;
  active: boolean;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "marketing";
}) {
  const marketingActive = "bg-white text-[rgb(var(--marketing-primary))] border-transparent shadow-sm";
  const marketingInactive =
    "bg-[rgb(var(--marketing-primary))] text-white border-transparent shadow-[0_8px_24px_rgba(32,94,179,0.35)]";

  const normalActive = "bg-white text-[#1f2937] border-transparent";
  const normalInactive = "bg-transparent text-white/90 border-white/20 hover:bg-white/10";

  const activeClass =
    variant === "marketing" ? marketingActive : normalActive;
  const inactiveClass =
    variant === "marketing" ? marketingInactive : normalInactive;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition whitespace-nowrap shrink-0
        ${active ? activeClass : inactiveClass}`}
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
      className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-semibold transition border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6e8ff]/60 ${
        active
          ? "bg-gradient-to-r from-[#f9e8ff] to-[#f7d7ff] text-[#3b0764] border-transparent shadow-sm"
          : "border-white/25 text-white/85 hover:bg-white/10"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
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
    isMarketingPortal &&
    (normalizedPath.startsWith("/portal/marketing/history") ||
      (normalizedPath.startsWith("/marketing-portal") && searchParams?.get("view") === "history"))
      ? "history"
      : "generator";
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("navbar");
  const tabsT = useTranslations("navbar.tabs");
  const profileT = useTranslations("navbar.profile");
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

  const navbarAppearance: NavbarAppearance = isMapachePortal
    ? "mapache"
    : isMarketingPortal
      ? "marketing"
      : navbarVariant === "direct" || navbarVariant === "config" || navbarVariant === "home"
        ? "direct"
        : "dark";

  React.useEffect(() => {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  if (isMarketingPortal) {
    html.classList.add("marketing-theme");
    body.classList.add("marketing-theme");
    return () => {
      html.classList.remove("marketing-theme");
      body.classList.remove("marketing-theme");
    };
  }
  html.classList.remove("marketing-theme");
  body.classList.remove("marketing-theme");
}, [isMarketingPortal]);

  const logoSrc = isMarketingPortal ? "/logo_color.png" : "/logo.png";

  const navTheme = React.useMemo<NavTheme>(() => {
    if (navbarAppearance === "marketing") {
      return {
        surface:
          "border-b border-[#cde6ff] bg-white/90 text-[#0f406d] backdrop-blur supports-[backdrop-filter]:bg-opacity-80 shadow-[0_6px_24px_rgba(15,76,139,0.08)]",
        configButton: (active: boolean) =>
          `inline-flex items-center justify-center rounded-full border px-2.5 py-1.5 text-[13px] transition ${
            active
              ? "border-transparent bg-[#1d6ee3] text-white shadow"
              : "border-[#cce8ff] bg-white/80 text-[#0f406d] hover:bg-[#ecf5ff]"
          }`,
        profileButton:
          "inline-flex items-center rounded-full border border-[#cce8ff] bg-white px-3 py-1.5 text-[13px] text-[#0f406d] hover:bg-[#ecf5ff] transition",
        languageSelect:
          "rounded-md border border-[#cce8ff] bg-white px-2 py-1 text-sm text-[#0f406d] focus:border-[#1d6ee3] focus:outline-none focus:ring-2 focus:ring-[#1d6ee3]/30",
        signOutButton:
          "inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-[#1d6ee3] text-white hover:bg-[#1452c5]",
        portalVariant: "marketing",
        profileAppearance: "light",
      };
    }
    const isMapacheTheme = navbarAppearance === "mapache";
    if (isMapacheTheme) {
      return {
        surface:
          "border-b border-white/15 backdrop-blur supports-[backdrop-filter]:bg-opacity-80 bg-slate-950/90 text-white navbar--mapache-portal",
        configButton: (active: boolean) =>
          `inline-flex items-center justify-center rounded-full border px-2.5 py-1.5 text-[13px] transition ${
            active
              ? "border-transparent bg-white text-[#1f2937] shadow-sm"
              : "border-white/25 bg-white/10 text-white hover:bg-white/15"
          }`,
        profileButton:
          "inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition",
        languageSelect:
          "rounded-md border border-white/25 bg-white/10 px-2 py-1 text-sm text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40",
        signOutButton:
          "inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90",
        portalVariant: "mapache",
        profileAppearance: "mapache",
      };
    }
    if (navbarAppearance === "direct") {
      return {
        surface:
          "border-b border-white/20 bg-[rgb(var(--primary))] text-white shadow-[0_6px_18px_rgba(17,6,33,0.4)]",
        configButton: (active: boolean) =>
          `inline-flex items-center justify-center rounded-full border px-2.5 py-1.5 text-[13px] transition ${
            active
              ? "border-transparent bg-white text-[#2b0a52] shadow-sm"
              : "border-white/30 bg-white/5 text-white hover:bg-white/10"
          }`,
        profileButton:
          "inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/30 bg-white/10 hover:bg-white/20 transition",
        languageSelect:
          "rounded-md border border-white/25 bg-white/10 px-2 py-1 text-sm text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/35",
        signOutButton:
          "inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90",
        portalVariant: "direct",
        profileAppearance: "direct",
      };
    }
    return {
      surface:
        "border-b border-white/15 backdrop-blur supports-[backdrop-filter]:bg-opacity-80 bg-slate-950/80 text-white",
      configButton: (active: boolean) =>
        `inline-flex items-center justify-center rounded-full border px-2.5 py-1.5 text-[13px] transition ${
          active
            ? "border-transparent bg-white text-[#1f2937] shadow-sm"
            : "border-white/25 bg-white/10 text-white hover:bg-white/15"
        }`,
      profileButton:
        "inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition",
      languageSelect:
        "rounded-md border border-white/25 bg-white/10 px-2 py-1 text-sm text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40",
      signOutButton:
        "inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90",
      portalVariant: "dark",
      profileAppearance: "dark",
    };
  }, [navbarAppearance]);

  const role = (session?.user?.role as AnyRole) ?? "usuario";
  const appRole = toAppRole(role);
  const rawTeam = (session?.user?.team as string | null) ?? null;
  const team = normalizeProfileText(rawTeam) || fallbacksT("team");
  const name = normalizeProfileText(session?.user?.name) || fallbacksT("name");
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

  // ---- Tabs del portal directo (navegaci├│n nueva) ----
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

    const targetPath = "/portal/mapache/generator";

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
    if (pathname?.startsWith("/portal/mapache")) {
      setMapacheSection("generator");
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
    if (!pathname.startsWith("/portal/mapache")) {
      hideMapacheTransition();
    }
  }, [pathname, mapacheTransitionVisible, hideMapacheTransition]);

  const handleMapacheSectionChange = React.useCallback(
    (next: MapachePortalSection) => {
      setMapacheSection(next);
      if (!isMapachePortal) return;
      const target = "/portal/mapache/generator";
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
      className={`navbar fixed top-0 inset-x-0 z-50 ${navTheme.surface}`}
      style={{ height: "var(--nav-h)" }}
    >
      <div className="navbar-inner mx-auto max-w-[2000px] px-3">
        <div className="flex items-center gap-2">
          <Link href="/home" aria-label="Ir a Home" className="inline-flex">
            <Image
              src={logoSrc}
              alt="Wise CX"
              width={140}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          {showPortalSwitcher ? (
            <PortalLauncher
              canAccessMapache={canOpenMapachePortal}
              canAccessPartner={canAccessPartnerPortal}
              canAccessMarketing={canAccessMarketingPortal}
              variant={navTheme.portalVariant}
              onMapacheNavigate={beginMapacheTransition}
            />
          ) : null}
        </div>

        <div className="flex flex-1 items-center justify-center">
          {isMapachePortal ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <MapacheSectionBtn
                id="generator"
                label={mapacheSectionsT("generator")}
                active={mapacheSection === "generator"}
                onClick={handleMapacheSectionChange}
              />
            </div>
          ) : isMarketingPortal ? (
            <div className="flex items-center gap-2">
              <TabBtn
                label={tabsT("generator")}
                Icon={LayoutGrid}
                href="/portal/marketing/generator"
                active={marketingView === "generator"}
                variant="marketing"
              />
              <TabBtn
                label={tabsT("history")}
                Icon={Clock}
                href="/portal/marketing/history"
                active={marketingView === "history"}
                variant="marketing"
              />
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
              className={navTheme.configButton(isConfigurationsPath)}
              aria-label={configurationsLabel}
              title={configurationsLabel}
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
          {showAuthActions && (
            <button
              onClick={() => setUserModal(true)}
              className={navTheme.profileButton}
              title={profileT("open")}
            >
              {name}
            </button>
          )}
          {showAuthActions && (
            <select
              className={navTheme.languageSelect}
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
              className={navTheme.signOutButton}
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

          {showAuthActions ? (
            <UserProfileModal
              open={userModal}
              onClose={() => setUserModal(false)}
              viewer={{
                id: (session?.user?.id as string | null | undefined) ?? null,
                email: session?.user?.email ?? null,
                role: appRole,
                team,
                name,
                image: session?.user?.image ?? null,
                positionName: (session?.user?.positionName as string | null | undefined) ?? null,
                leaderEmail: (session?.user?.leaderEmail as string | null | undefined) ?? null,
              }}
              appearance={navTheme.profileAppearance}
            />
          ) : null}
    </nav>
  );
}


