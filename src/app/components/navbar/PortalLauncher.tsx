"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Loader2, RefreshCcw } from "lucide-react";
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
  descriptionColor: string;
  card: string;
  cardTitleColor: string;
  cardDescriptionColor: string;
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
      "rounded-[32px] border border-slate-200 bg-white shadow-[0_45px_130px_rgba(15,23,42,0.18)]",
    header: "bg-white border-b border-slate-100 px-6 py-4",
    title: "text-lg font-semibold",
    description: "text-sm",
    descriptionColor: "#64748b",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:shadow-md",
    cardTitleColor: "#0f172a",
    cardDescriptionColor: "#64748b",
    action:
      "rounded-full border border-transparent bg-[#4c1d95] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#3b0d71] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4b5fd]",
    overlay: "bg-white/95 text-slate-900",
    overlaySpinner: "text-slate-600",
    overlayText: "text-slate-900",
    backdrop: "bg-black/35",
  },
  direct: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-[#c4b5fd] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#4c1d95] shadow-sm transition hover:bg-[#ede9fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4b5fd]",
    panel:
      "rounded-[32px] border border-[#ede9fe] bg-white shadow-[0_45px_130px_rgba(76,29,149,0.15)]",
    header: "bg-white border-b border-[#ede9fe] px-6 py-4",
    title: "text-lg font-semibold",
    description: "text-sm",
    descriptionColor: "#475569",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-[#ede9fe] bg-[#faf5ff] px-4 py-3 shadow-sm transition hover:shadow-md",
    cardTitleColor: "#0f172a",
    cardDescriptionColor: "#64748b",
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
      "rounded-[32px] border border-white/15 bg-[#0f172a]/95 shadow-[0_45px_130px_rgba(0,0,0,0.6)] backdrop-blur-xl",
    header: "bg-transparent border-b border-white/10 px-6 py-4",
    title: "text-lg font-semibold",
    description: "text-sm",
    descriptionColor: "rgba(255,255,255,0.7)",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-sm transition hover:bg-white/10",
    cardTitleColor: "#ffffff",
    cardDescriptionColor: "rgba(255,255,255,0.6)",
    action:
      "rounded-full border border-transparent bg-gradient-to-r from-[#22d3ee] to-[#0ea5e9] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee]",
    overlay: "bg-[#0f172a]/95 text-white",
    overlaySpinner: "text-[#22d3ee]",
    overlayText: "text-white",
    backdrop: "bg-black/60",
  },
  light: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300",
    panel:
      "rounded-[32px] border border-slate-200 bg-white shadow-[0_45px_130px_rgba(15,23,42,0.15)]",
    header: "bg-white border-b border-slate-100 px-6 py-4",
    title: "text-lg font-semibold",
    description: "text-sm",
    descriptionColor: "#64748b",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:shadow-md",
    cardTitleColor: "#0f172a",
    cardDescriptionColor: "#64748b",
    action:
      "rounded-full border border-transparent bg-slate-800 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
    overlay: "bg-white/90 text-slate-900",
    overlaySpinner: "text-slate-600",
    overlayText: "text-slate-900",
    backdrop: "bg-black/30",
  },
  marketing: {
    trigger:
      "inline-flex items-center gap-2 rounded-full border border-[#b8dcff] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#0f406d] shadow-sm transition hover:bg-[#ecf5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#93c5fd]",
    panel:
      "rounded-[32px] border border-[#cce8ff] bg-white shadow-[0_45px_130px_rgba(15,23,42,0.18)]",
    header: "bg-white border-b border-[#cce8ff] px-6 py-4",
    title: "text-lg font-semibold",
    description: "text-sm",
    descriptionColor: "#475569",
    card:
      "flex items-center justify-between gap-4 rounded-2xl border border-[#cce8ff] bg-[#f5fbff] px-4 py-3 shadow-sm transition hover:shadow-md",
    cardTitleColor: "#0f172a",
    cardDescriptionColor: "#64748b",
    action:
      "rounded-full border border-transparent bg-[#1d6ee3] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#1452c5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#93c5fd]",
    overlay: "bg-white/95 text-[#0f406d]",
    overlaySpinner: "text-[#1d6ee3]",
    overlayText: "text-[#0f406d]",
    backdrop: "bg-black/30",
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
        headerClassName={theme.header}
        titleClassName={theme.title}
        panelWidthClassName="max-w-lg"
        panelClassName={theme.panel}
        variant={appearance === "mapache" ? "inverted" : "default"}
      >
        <div className="space-y-3">
          <p className={theme.description} style={{ color: theme.descriptionColor }}>
            {portalText("description")}
          </p>
          <div className="space-y-3">
            {options.map((option) => (
              <div key={option.id} className={theme.card}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: theme.cardTitleColor }}>
                    {option.label}
                  </div>
                  <p className="text-xs" style={{ color: theme.cardDescriptionColor }}>
                    {option.description}
                  </p>
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
