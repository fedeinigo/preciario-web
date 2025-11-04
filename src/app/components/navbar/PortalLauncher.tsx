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
  variant?: "dark" | "light";
};

type PortalOption = {
  id: PortalAccessId;
  label: string;
  description: string;
  href: string;
};

const PORTAL_ROUTES: Record<PortalAccessId, string> = {
  direct: "/",
  mapache: "/mapache-portal/generator",
  partner: "/partner-portal",
  marketing: "/marketing-portal",
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
  }, [
    canAccessMapache,
    canAccessMarketing,
    canAccessPartner,
    portalOptionsText,
  ]);

  if (options.length === 0) {
    return null;
  }

  const isDark = variant === "dark";
  const triggerClasses = isDark
    ? "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[13px] text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white/40"
    : "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-slate-400";

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={[
          triggerClasses,
          buttonClassName,
        ].join(" ")}
      >
        <span>{portalText("button")}</span>
        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={<span className="text-base font-semibold">{portalText("title")}</span>}
        panelWidthClassName="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{portalText("description")}</p>
          <div className="space-y-3">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {option.label}
                  </div>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate(option)}
                  className="rounded-md bg-[rgb(var(--primary))] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[rgb(var(--primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--primary))]"
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
                  "fixed inset-0 z-[70] flex flex-col items-center justify-center bg-slate-950/90 text-white transition-opacity duration-200 ease-out",
                  transitionOpaque ? "opacity-100" : "opacity-0",
                  className,
                ].join(" ")}
              >
                <Loader2 className="h-12 w-12 animate-spin text-white/80" aria-hidden="true" />
                <p className="mt-4 text-lg font-semibold">{portalText("loading")}</p>
              </div>,
              document.body,
            )
          : null
        : null}
    </>
  );
}



