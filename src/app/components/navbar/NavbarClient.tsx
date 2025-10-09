// src/app/components/navbar/NavbarClient.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Target,
  Wand2,
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
  MAPACHE_PORTAL_NAVIGATE_EVENT,
  MAPACHE_PORTAL_SECTION_CHANGED_EVENT,
  type MapachePortalSection,
  isMapachePortalSection,
} from "@/app/mapache-portal/section-events";

export type NavbarClientProps = {
  session: Session | null;
};

type Tab = "generator" | "history" | "stats" | "users" | "teams" | "goals";

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

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

function initials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  return (i1 + i2).toUpperCase();
}

function readHash(): Tab {
  const h = (globalThis?.location?.hash || "").replace("#", "");
  return (["generator", "history", "stats", "users", "teams", "goals"].includes(h)
    ? (h as Tab)
    : "generator");
}

export default function NavbarClient({ session }: NavbarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  const handleLocaleChange = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocale(next);
      router.refresh();
    },
    [locale, router, setLocale]
  );

  const isMapachePortal = isMapachePath(pathname);
  const status = session ? "authenticated" : "unauthenticated";
  const showTabs = status === "authenticated" && !isMapachePortal;
  const showAuthActions = status === "authenticated";

  const role = (session?.user?.role as AnyRole) ?? "usuario";
  const appRole = toAppRole(role);
  const rawTeam = (session?.user?.team as string | null) ?? null;
  const team = normalizeProfileText(rawTeam) || fallbacksT("team");
  const name = normalizeProfileText(session?.user?.name) || fallbacksT("name");
  const email = session?.user?.email ?? fallbacksT("email");
  const currentEmail = session?.user?.email ?? "";
  const canSeeUsers = ADMIN_ROLES.has(appRole);
  const canOpenMapachePortal = rawTeam === "Mapaches" || ADMIN_ROLES.has(appRole);
  const showMapacheReturn = showAuthActions && canOpenMapachePortal && isMapachePortal;
  const showMapacheLink = showAuthActions && canOpenMapachePortal && !isMapachePortal;

  const [activeTab, setActiveTab] = React.useState<Tab>(readHash());
  const [userModal, setUserModal] = React.useState(false);
  const [mapacheSection, setMapacheSection] =
    React.useState<MapachePortalSection>(MAPACHE_PORTAL_DEFAULT_SECTION);
  const [mapacheTransitionVisible, setMapacheTransitionVisible] =
    React.useState(false);
  const [mapacheTransitionOpaque, setMapacheTransitionOpaque] =
    React.useState(false);
  const mapacheTransitionStartedRef = React.useRef(false);

  const beginMapacheTransition = React.useCallback(() => {
    if (mapacheTransitionStartedRef.current) return;
    mapacheTransitionStartedRef.current = true;

    if (typeof router.prefetch === "function") {
      try {
        void router.prefetch("/mapache-portal");
      } catch {
        // ignore prefetch errors and proceed with navigation
      }
    }

    const navigate = () => {
      router.push("/mapache-portal");
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
        setMapacheTransitionVisible(true);
        setMapacheTransitionOpaque(false);
        transition.ready
          .then(() => {
            setMapacheTransitionOpaque(true);
          })
          .catch(() => {
            setMapacheTransitionOpaque(true);
          });
        transition.finished
          .finally(() => {
            setMapacheTransitionOpaque(false);
            window.setTimeout(() => {
              setMapacheTransitionVisible(false);
              mapacheTransitionStartedRef.current = false;
            }, 200);
          });
        return;
      } catch {
        // fall through to manual animation
      }
    }

    showOverlay();
    window.setTimeout(() => {
      navigate();
    }, 220);
    if (typeof window === "undefined") {
      router.push("/mapache-portal");
      return;
    }

    setMapacheTransitionVisible(true);
    requestAnimationFrame(() => {
      setMapacheTransitionOpaque(true);
    });
    window.setTimeout(() => {
      router.push("/mapache-portal");
    }, 240);
  }, [router]);

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

  React.useEffect(() => {
    if (!mapacheTransitionVisible) return;
    if (typeof window === "undefined") return;
    if (!pathname?.startsWith("/mapache-portal")) return;

    const fadeTimeout = window.setTimeout(() => {
      setMapacheTransitionOpaque(false);
    }, 150);

    const hideTimeout = window.setTimeout(() => {
      setMapacheTransitionVisible(false);
      mapacheTransitionStartedRef.current = false;
    }, 420);

    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [mapacheTransitionVisible, pathname]);

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
          {showMapacheReturn && (
            <Link
              href="/"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
            >
              {profileT("mapachePortalReturn")}
            </Link>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center">
          {isMapachePortal ? (
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
          ) : showTabs ? (
            <div className="hidden w-full max-w-xl items-center justify-center gap-2 md:flex">
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

        <div className="flex items-center gap-2">
          {showAuthActions && (
            <button
              onClick={() => setUserModal(true)}
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
                  Preparando tablero inteligente…
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-white/70" aria-hidden="true" />
                <span>Sincronizando tareas y métricas del equipo</span>
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










