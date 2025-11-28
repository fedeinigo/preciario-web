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
    ? "rounded-2xl border border-violet-400/25 bg-gradient-to-br from-slate-800/80 via-slate-900/70 to-indigo-950/60 px-5 py-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-lg"
    : "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 px-5 py-4 shadow-sm";
  const labelMuted = isMapache
    ? "text-xs font-semibold text-cyan-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
    : "text-xs font-semibold text-slate-500";
  const valueBold = isMapache
    ? "text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
    : "text-sm font-bold text-slate-900";
  const badgeClass = isMapache
    ? "inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(34,211,238,0.4)]"
    : "inline-flex rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-[11px] font-semibold";
  const emptyClass = isMapache
    ? "rounded-2xl border-2 border-dashed border-cyan-400/30 bg-slate-800/50 p-6 text-center text-cyan-100 backdrop-blur-lg"
    : "rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-6 text-center";

  const panelClass = isMapache
    ? "rounded-[28px] border border-cyan-400/20 shadow-[0_45px_130px_rgba(0,0,0,0.8)] backdrop-blur-[28px]"
    : "";
  const panelStyle = isMapache 
    ? { 
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.98))",
        color: "#fff"
      } 
    : undefined;
  const headerClass = isMapache
    ? "bg-gradient-to-r from-[#8b5cf6]/25 via-[#6d28d9]/20 to-[#22d3ee]/25 border-b border-cyan-400/20 text-white px-6 py-4"
    : "";
  const titleClass = isMapache ? "text-lg font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : "";
  const backdropClass = isMapache ? "bg-slate-950/80" : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member.name || member.email || "Miembro"}
      variant={isMapache ? "inverted" : "default"}
      panelClassName={panelClass}
      panelStyle={panelStyle}
      headerClassName={headerClass}
      titleClassName={titleClass}
      backdropClassName={backdropClass}
      footer={
        <div className="flex justify-end">
          <button
            className={
              isMapache
                ? "rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(34,211,238,0.35)] transition hover:shadow-[0_12px_32px_rgba(34,211,238,0.45)]"
                : "rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            }
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-4" style={isMapache ? { color: "#fff" } : undefined}>
        <div className="flex items-center gap-3">
          <UserAvatar
            name={member.name || member.email || member.userId}
            email={member.email ?? undefined}
            image={member.image ?? undefined}
            size={56}
            className={isMapache ? "ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.25)]" : "ring-2 ring-purple-200/70"}
          />
          <div>
            <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>
              {member.name || member.email || member.userId}
            </p>
            {member.email && (
              <p className={labelMuted} style={isMapache ? { color: "#a5f3fc" } : undefined}>
                {member.email}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className={badgeClass}>{sortedDeals.length} deals</span>
              <span className={badgeClass}>{formatUSD(total)}</span>
            </div>
          </div>
        </div>

        {sortedDeals.length === 0 ? (
          <div className={emptyClass} style={isMapache ? { color: "#cffafe" } : undefined}>
            <p className="text-sm font-medium">
              Aún no hay deals sincronizados para este miembro.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {sortedDeals.map((deal) => (
              <div key={deal.id} className={cardClass} style={isMapache ? { color: "#fff" } : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>
                      {deal.companyName}
                    </p>
                    <p className={labelMuted} style={isMapache ? { color: "#a5f3fc" } : undefined}>
                      {new Date(deal.createdAt).toLocaleDateString("es-AR")}
                    </p>
                    {deal.link && (
                      <a
                        href={deal.link}
                        target="_blank"
                        rel="noreferrer"
                        className={isMapache ? "text-xs hover:underline" : "text-xs text-purple-700 hover:underline"}
                        style={isMapache ? { color: "#6ee7b7" } : undefined}
                      >
                        Ver en Pipedrive
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>
                      {formatUSD(deal.monthlyFee)}
                    </p>
                    <p className={labelMuted} style={isMapache ? { color: "#a5f3fc" } : undefined}>
                      {deal.wonType === "UPSELL" ? "Upsell" : "Nuevo"}
                    </p>
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
