"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  LayoutGrid,
  Loader2,
  Megaphone,
  RefreshCcw,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import Modal from "@/app/components/ui/Modal";
import { useTranslations } from "@/app/LanguageProvider";
import type { PortalAccessId } from "@/constants/portals";

type PortalLauncherProps = {
  canAccessMapache: boolean;
  canAccessPartner: boolean;
  canAccessMarketing: boolean;
  onMapacheNavigate?: () => void;
  className?: string;
  buttonClassName?: string;
  variant?: "dark" | "light" | "mapache" | "direct" | "marketing";
};

type PortalOption = {
  id: PortalAccessId;
  label: string;
  description: string;
  href: string;
};

const PORTAL_ROUTES: Record<PortalAccessId, string> = {
  direct: "/portal/directo",
  mapache: "/portal/mapache/generator",
  partner: "/partner-portal",
  marketing: "/portal/marketing/generator",
};

type PortalLauncherVariant = NonNullable<PortalLauncherProps["variant"]>;

type LauncherTheme = {
  trigger: string;
  panel: string;
  header: string;
  title: string;
  description: string;
  card: string;
  cardTitle: string;
  cardDescription: string;
  action: string;
  overlay: string;
  overlaySpinner: string;
  overlayText: string;
  backdrop: string;
};

const launcherThemes: Record<PortalLauncherVariant, LauncherTheme> = {
  dark: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[13px] text-white transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
    panel:
      "rounded-[28px] border border-white/10 bg-slate-950/90 text-white shadow-[0_40px_120px_rgba(2,6,23,0.75)]",
    header: "bg-transparent border-b border-white/10 px-6 py-4 text-white",
    title: "text-lg font-semibold text-white",
    description: "text-sm text-white/60",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.6)]",
    cardTitle: "text-sm font-semibold text-white",
    cardDescription: "text-xs text-white/50",
    action:
      "rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
    overlay: "bg-slate-950/90 text-white",
    overlaySpinner: "text-white/80",
    overlayText: "text-white",
    backdrop: "bg-black/55",
  },
  direct: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-[#c4b5fd] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#4c1d95] shadow-sm transition hover:bg-[#ede9fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4b5fd]",
    panel:
      "rounded-[32px] border border-[#ede9fe] bg-white text-slate-900 shadow-[0_45px_130px_rgba(76,29,149,0.15)]",
    header: "bg-white border-b border-[#ede9fe] px-6 py-4 text-[#4c1d95]",
    title: "text-lg font-semibold text-[#4c1d95]",
    description: "text-sm text-slate-600",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-[#ede9fe] bg-[#faf5ff] px-4 py-3 shadow-sm",
    cardTitle: "text-sm font-semibold text-slate-900",
    cardDescription: "text-xs text-slate-500",
    action:
      "rounded-full border border-transparent bg-[#4c1d95] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#3b0d71] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4b5fd]",
    overlay: "bg-white/95 text-[#4c1d95]",
    overlaySpinner: "text-[#4c1d95]",
    overlayText: "text-[#4c1d95]",
    backdrop: "bg-black/35",
  },
  mapache: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-white/25 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_10px_35px_rgba(0,0,0,0.4)] transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
    panel:
      "mapache-surface-card rounded-[32px] border-white/15 bg-gradient-to-br from-[#0f1426]/95 via-[#090f1f]/95 to-[#070b16]/95 text-white shadow-[0_55px_150px_rgba(0,0,0,0.9)] backdrop-blur-[28px] text-white/95",
    header:
      "bg-gradient-to-r from-[#8b5cf6]/20 via-[#6d28d9]/18 to-[#22d3ee]/22 border-b border-white/12 px-7 py-5 text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
    title: "text-xl font-semibold text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
    description: "text-sm text-white/85 drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]",
    card:
      "mapache-surface-card flex items-center justify-between gap-4 rounded-2xl border-white/15 px-4 py-3 shadow-[0_28px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl",
    cardTitle: "text-sm font-semibold text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]",
    cardDescription: "text-xs text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
    action:
      "mapache-modal-btn rounded-full border border-white/25 bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_14px_38px_rgba(139,92,246,0.4)] transition hover:shadow-[0_18px_48px_rgba(139,92,246,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
    overlay: "bg-slate-950/90 text-white",
    overlaySpinner: "text-white/80",
    overlayText: "text-white",
    backdrop: "bg-slate-950/75",
  },
  light: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300",
    panel:
      "rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-[0_35px_90px_rgba(15,23,42,0.15)]",
    header: "bg-white border-b border-slate-100 px-6 py-4 text-slate-900",
    title: "text-lg font-semibold text-slate-900",
    description: "text-sm text-slate-500",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-[0_15px_40px_rgba(15,23,42,0.08)]",
    cardTitle: "text-sm font-semibold text-slate-900",
    cardDescription: "text-xs text-slate-500",
    action:
      "rounded-full border border-transparent bg-[rgb(var(--primary))] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[rgb(var(--primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--primary))]/40",
    overlay: "bg-white/90 text-slate-900",
    overlaySpinner: "text-slate-600",
    overlayText: "text-slate-900",
    backdrop: "bg-black/30",
  },
  marketing: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-[#b8dcff] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#0f406d] shadow-sm transition hover:bg-[#ecf5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#93c5fd]",
    panel:
      "rounded-[32px] border border-[#cce8ff] bg-white text-slate-900 shadow-[0_45px_130px_rgba(15,23,42,0.18)]",
    header: "bg-white border-b border-[#cce8ff] px-6 py-4 text-[#0f406d]",
    title: "text-lg font-semibold text-[#0f406d]",
    description: "text-sm text-slate-600",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-[#cce8ff] bg-[#f5fbff] px-4 py-3 shadow-[0_15px_40px_rgba(15,23,42,0.08)]",
    cardTitle: "text-sm font-semibold text-slate-900",
    cardDescription: "text-xs text-slate-500",
    action:
      "rounded-full border border-transparent bg-[#1d6ee3] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#1452c5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#93c5fd]",
    overlay: "bg-white/95 text-[#0f406d]",
    overlaySpinner: "text-[#1d6ee3]",
    overlayText: "text-[#0f406d]",
    backdrop: "bg-[#0f172a]/30",
  },
};

export default function PortalLauncher({
  canAccessMapache,
  canAccessPartner,
  canAccessMarketing,
  onMapacheNavigate,
  className = "",
  buttonClassName = "",
  variant = "dark",
}: PortalLauncherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const portalText = useTranslations("navbar.portalSwitcher");
  const portalOptionsText = useTranslations("navbar.portalSwitcher.options");
  const appearance: PortalLauncherVariant = variant ?? "dark";
  const theme = launcherThemes[appearance];
  const isMapacheAppearance = appearance === "mapache";

  const optionIcons: Record<PortalAccessId, React.ComponentType<{ className?: string }>> = {
    direct: LayoutGrid,
    mapache: Users2,
    partner: ShieldCheck,
    marketing: Megaphone,
  };

  const optionAccent: Record<PortalAccessId, string> = {
    direct: "from-[#a855f7] to-[#7c3aed]",
    mapache: "from-[#22d3ee] to-[#0ea5e9]",
    partner: "from-[#f472b6] to-[#fb7185]",
    marketing: "from-[#fbbf24] to-[#f97316]",
  };

  const [modalOpen, setModalOpen] = React.useState(false);
  const [transitionVisible, setTransitionVisible] = React.useState(false);
  const [transitionOpaque, setTransitionOpaque] = React.useState(false);
  const transitionTargetRef = React.useRef<string | null>(null);
  const transitionTimeoutRef = React.useRef<number | null>(null);

  const clearTransitionTimeout = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const stopTransition = React.useCallback(() => {
    if (!transitionVisible) return;
    clearTransitionTimeout();
    setTransitionOpaque(false);
    if (typeof window === "undefined") {
      setTransitionVisible(false);
      transitionTargetRef.current = null;
      return;
    }
    window.setTimeout(() => {
      setTransitionVisible(false);
      transitionTargetRef.current = null;
    }, 180);
  }, [clearTransitionTimeout, transitionVisible]);

  const startTransition = React.useCallback(
    (targetPath: string) => {
      transitionTargetRef.current = targetPath;
      clearTransitionTimeout();
      setTransitionVisible(true);
      if (typeof window === "undefined") {
        setTransitionOpaque(true);
        return;
      }
      setTransitionOpaque(false);
      requestAnimationFrame(() => {
        setTransitionOpaque(true);
      });
      transitionTimeoutRef.current = window.setTimeout(() => {
        stopTransition();
      }, 15000);
    },
    [clearTransitionTimeout, stopTransition],
  );

  React.useEffect(() => {
    return () => clearTransitionTimeout();
  }, [clearTransitionTimeout]);

  React.useEffect(() => {
    if (!transitionVisible) return;
    const target = transitionTargetRef.current;
    if (!target) return;
    if (!pathname) return;
    if (pathname === target) {
      stopTransition();
    }
  }, [pathname, stopTransition, transitionVisible]);

  const handleNavigate = React.useCallback(
    (option: PortalOption) => {
      setModalOpen(false);
      const targetPath = option.href;

      if (option.id === "mapache" && onMapacheNavigate) {
        onMapacheNavigate();
        return;
      }

      if (pathname === targetPath) {
        startTransition(targetPath);
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            stopTransition();
          }, 600);
        }
        return;
      }

      startTransition(targetPath);
      try {
        router.push(targetPath);
      } catch {
        stopTransition();
      }
    },
    [onMapacheNavigate, pathname, router, startTransition, stopTransition],
  );

  const options = React.useMemo(() => {
    const list: PortalOption[] = [
      {
        id: "direct",
        label: portalOptionsText("direct.label"),
        description: portalOptionsText("direct.description"),
        href: PORTAL_ROUTES.direct,
      },
    ];

    if (canAccessMapache) {
      list.push({
        id: "mapache",
        label: portalOptionsText("mapache.label"),
        description: portalOptionsText("mapache.description"),
        href: PORTAL_ROUTES.mapache,
      });
    }

    if (canAccessPartner) {
      list.push({
        id: "partner",
        label: portalOptionsText("partner.label"),
        description: portalOptionsText("partner.description"),
        href: PORTAL_ROUTES.partner,
      });
    }

    if (canAccessMarketing) {
      list.push({
        id: "marketing",
        label: portalOptionsText("marketing.label"),
        description: portalOptionsText("marketing.description"),
        href: PORTAL_ROUTES.marketing,
      });
    }

    return list;
  }, [canAccessMapache, canAccessMarketing, canAccessPartner, portalOptionsText]);

  if (options.length <= 1) {
    return null;
  }

  const headerClassName = isMapacheAppearance
    ? "border-none bg-transparent px-2 pt-2 pb-0"
    : theme.header;
  const titleClassName = isMapacheAppearance ? "sr-only" : theme.title;
  const formattedOptionCount = new Intl.NumberFormat().format(options.length);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={[theme.trigger, buttonClassName].join(" ")}
      >
        <span>{portalText("button")}</span>
        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={portalText("title")}
        backdropClassName={theme.backdrop}
        headerClassName={headerClassName}
        titleClassName={titleClassName}
        panelWidthClassName="max-w-lg"
        panelClassName={theme.panel}
        variant={appearance === "light" || appearance === "marketing" ? "default" : "inverted"}
      >
        {isMapacheAppearance ? (
          <div className="space-y-5 text-white">
            <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-r from-[#4c1d95] via-[#7c3aed] to-[#22d3ee] p-6 shadow-[0_35px_120px_rgba(5,9,24,0.65)]">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                      <LayoutGrid className="h-7 w-7 text-white" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white">
                        {portalText("title")}
                      </p>
                      <h2 className="text-2xl font-semibold text-white leading-tight">
                        {portalOptionsText("mapache.label")}
                      </h2>
                      <p className="text-sm text-white max-w-xl">
                        {portalText("description")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                    {formattedOptionCount} {portalText("button")}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                    {portalText("action")}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {options.map((option) => {
                const Icon = optionIcons[option.id] ?? LayoutGrid;
                const accent = optionAccent[option.id] ?? "from-white/30 to-white/10";
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleNavigate(option)}
                    className="group relative flex w-full flex-col gap-4 rounded-3xl border border-white/12 bg-gradient-to-br from-white/8 via-[#080b19]/70 to-[#04060d]/90 p-5 text-left text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl p-3 bg-gradient-to-br ${accent}`}>
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1 space-y-1 text-white">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.4em]">
                          {portalText("button")}
                        </p>
                        <h3 className="text-lg font-semibold">{option.label}</h3>
                        <p className="text-sm text-white/85">{option.description}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                        {portalText("action")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white">
                      <span className="text-white">{portalText("loading")}</span>
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_15px_40px_rgba(99,102,241,0.4)]">
                        {portalText("action")}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={theme.description}>{portalText("description")}</p>
            <div className="space-y-3">
              {options.map((option) => (
                <div key={option.id} className={theme.card}>
                  <div>
                    <div className={theme.cardTitle}>{option.label}</div>
                    <p className={theme.cardDescription}>{option.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigate(option)}
                    className={theme.action}
                  >
                    {portalText("action")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {transitionVisible
        ? typeof window !== "undefined"
          ? createPortal(
              <div
                className={[
                  "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-opacity duration-200 ease-out",
                  theme.overlay,
                  transitionOpaque ? "opacity-100" : "opacity-0",
                  className,
                ].join(" ")}
              >
                <Loader2 className={`h-12 w-12 animate-spin ${theme.overlaySpinner}`} aria-hidden="true" />
                <p className={`mt-4 text-lg font-semibold ${theme.overlayText}`}>
                  {portalText("loading")}
                </p>
              </div>,
              document.body,
            )
          : null
        : null}
    </>
  );
}
