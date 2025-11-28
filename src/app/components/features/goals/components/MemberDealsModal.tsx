// src/app/components/features/goals/components/MemberDealsModal.tsx
"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { formatUSD } from "../../proposals/lib/format";
import type { UserWonDeal } from "./BillingSummaryCard";
import type { TeamGoalRow } from "./TeamMembersTable";

type Props = {
  open: boolean;
  onClose: () => void;
  member: TeamGoalRow;
  deals: UserWonDeal[];
  theme?: "direct" | "mapache";
};

export default function MemberDealsModal({ open, onClose, member, deals, theme = "direct" }: Props) {
  const sortedDeals = React.useMemo(() => {
    return [...deals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [deals]);

  const total = React.useMemo(
    () => sortedDeals.reduce((acc, deal) => acc + (Number(deal.monthlyFee) || 0), 0),
    [sortedDeals]
  );

  const isMapache = theme === "mapache";
  const cardClass = isMapache
    ? "mapache-surface-card rounded-2xl border-white/15 px-5 py-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    : "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 px-5 py-4 shadow-sm";
  const labelMuted = isMapache
    ? "text-xs font-semibold text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
    : "text-xs font-semibold text-slate-500";
  const valueBold = isMapache
    ? "text-sm font-bold text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]"
    : "text-sm font-bold text-slate-900";
  const badgeClass = isMapache
    ? "inline-flex rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-3 py-1 text-[11px] font-semibold text-white shadow-sm"
    : "inline-flex rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-[11px] font-semibold";
  const emptyClass = isMapache
    ? "mapache-surface-card rounded-2xl border-2 border-dashed border-white/25 p-6 text-center text-white"
    : "rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-6 text-center";

  const panelClass = isMapache
    ? "mapache-surface-card border-white/15 text-white shadow-[0_45px_130px_rgba(0,0,0,0.8)] backdrop-blur-[28px]"
    : "";
  const headerClass = isMapache
    ? "bg-gradient-to-r from-[#8b5cf6]/22 via-[#6d28d9]/16 to-[#22d3ee]/22 border-b border-white/12 text-white px-6 py-4"
    : "";
  const titleClass = isMapache ? "text-lg font-semibold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" : "";
  const backdropClass = isMapache ? "bg-slate-950/75" : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member.name || member.email || "Miembro"}
      variant={isMapache ? "inverted" : "default"}
      panelClassName={panelClass}
      headerClassName={headerClass}
      titleClassName={titleClass}
      backdropClassName={backdropClass}
      footer={
        <div className="flex justify-end">
          <button
            className={
              isMapache
                ? "rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                : "rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            }
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={member.name || member.email || member.userId}
            email={member.email ?? undefined}
            image={member.image ?? undefined}
            size={56}
            className={isMapache ? "ring-2 ring-white/20" : "ring-2 ring-purple-200/70"}
          />
          <div>
            <p className={valueBold}>{member.name || member.email || member.userId}</p>
            {member.email && <p className={labelMuted}>{member.email}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className={badgeClass}>{sortedDeals.length} deals</span>
              <span className={badgeClass}>{formatUSD(total)}</span>
            </div>
          </div>
        </div>

        {sortedDeals.length === 0 ? (
          <div className={emptyClass}>
            <p className="text-sm font-medium">
              Aún no hay deals sincronizados para este miembro.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {sortedDeals.map((deal) => (
              <div key={deal.id} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={valueBold}>{deal.companyName}</p>
                    <p className={labelMuted}>
                      {new Date(deal.createdAt).toLocaleDateString("es-AR")}
                    </p>
                    {deal.link && (
                      <a
                        href={deal.link}
                        target="_blank"
                        rel="noreferrer"
                        className={isMapache ? "text-xs text-emerald-300 hover:underline" : "text-xs text-purple-700 hover:underline"}
                      >
                        Ver en Pipedrive
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={valueBold}>{formatUSD(deal.monthlyFee)}</p>
                    <p className={labelMuted}>{deal.wonType === "UPSELL" ? "Upsell" : "Nuevo"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
