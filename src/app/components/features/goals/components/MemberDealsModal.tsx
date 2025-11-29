// src/app/components/features/goals/components/MemberDealsModal.tsx
"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { formatUSD } from "../../proposals/lib/format";
import type { UserWonDeal } from "./BillingSummaryCard";
import type { TeamGoalRow } from "./TeamMembersTable";
import { CircleUser, Users, Briefcase, AtSign, TrendingUp, Calendar } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  member: TeamGoalRow;
  deals: UserWonDeal[];
  theme?: "direct" | "mapache";
  year?: number;
  quarter?: number;
};

export default function MemberDealsModal({ open, onClose, member, deals, theme = "direct", year, quarter }: Props) {
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
  
  // Role display helpers
  const roleDisplayMap: Record<string, string> = {
    admin: "Admin",
    lider: "Líder",
    usuario: "Usuario",
  };
  const displayRole = member.role ? (roleDisplayMap[member.role] || member.role) : "-";
  
  // Normalize numeric values (handle potential string inputs from cache)
  const goalNum = Number(member.goal) || 0;
  const progressNum = Number(member.progress) || 0;
  const pctNum = Number(member.pct) || 0;
  
  // Progress calculation with normalized values
  const pctSafe = Number.isFinite(pctNum) ? pctNum : 0;
  const progressWidth = Math.min(100, Math.max(0, pctSafe));
  const remaining = Math.max(0, goalNum - progressNum);
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
      panelDataAttributes={isMapache ? { "mapache-modal": "true" } : undefined}
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
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" style={isMapache ? { color: "#fff" } : undefined}>
        {/* User Header */}
        <div className="flex items-center gap-3 pb-3 border-b" style={isMapache ? { borderColor: "rgba(103, 232, 249, 0.2)" } : { borderColor: "#e2e8f0" }}>
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
          </div>
        </div>

        {/* Profile Info Grid */}
        <div className={`grid grid-cols-2 gap-3 p-4 rounded-xl ${isMapache ? "bg-slate-800/50 border border-violet-400/15" : "bg-slate-50 border border-slate-200"}`}>
          <div className="flex items-start gap-2">
            <CircleUser className={`h-4 w-4 mt-0.5 ${isMapache ? "text-cyan-300" : "text-purple-500"}`} />
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Rol</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{displayRole}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className={`h-4 w-4 mt-0.5 ${isMapache ? "text-cyan-300" : "text-purple-500"}`} />
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Equipo</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{member.team || "-"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Briefcase className={`h-4 w-4 mt-0.5 ${isMapache ? "text-cyan-300" : "text-purple-500"}`} />
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Posición</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{member.positionName || "-"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AtSign className={`h-4 w-4 mt-0.5 ${isMapache ? "text-cyan-300" : "text-purple-500"}`} />
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Líder</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{member.leaderEmail || "-"}</p>
            </div>
          </div>
        </div>

        {/* Performance Section */}
        <div className={`p-4 rounded-xl ${isMapache ? "bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-400/20" : "bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`h-4 w-4 ${isMapache ? "text-cyan-300" : "text-purple-600"}`} />
            <span className={`text-sm font-semibold uppercase tracking-wide ${isMapache ? "text-cyan-200" : "text-purple-700"}`}>
              Desempeño Q{quarter || "-"} {year || "-"}
            </span>
          </div>
          
          {/* Big percentage */}
          <div className="flex items-baseline justify-between mb-3">
            <span className={`text-3xl font-bold ${isMapache ? "text-white" : "text-purple-900"}`}>
              {pctSafe.toFixed(1)}%
            </span>
            <span className={`text-sm ${isMapache ? "text-white/80" : "text-slate-600"}`}>
              {formatUSD(progressNum)} / {formatUSD(goalNum)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className={`relative h-2.5 w-full overflow-hidden rounded-full ${isMapache ? "bg-white/10" : "bg-slate-200"}`}>
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${isMapache ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-purple-500" : "bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700"}`}
              style={{ width: `${progressWidth}%` }}
            />
            {pctSafe > 100 && (
              <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-amber-400 to-transparent opacity-70" />
            )}
          </div>
          
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Objetivo</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{formatUSD(goalNum)}</p>
            </div>
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Avance (WON)</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{formatUSD(progressNum)}</p>
            </div>
            <div>
              <p className={labelMuted} style={isMapache ? { color: "#67e8f9" } : undefined}>Faltante</p>
              <p className={valueBold} style={isMapache ? { color: "#fff" } : undefined}>{formatUSD(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Deals Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${isMapache ? "text-cyan-300" : "text-purple-600"}`} />
              <span className={`text-sm font-semibold uppercase tracking-wide ${isMapache ? "text-cyan-200" : "text-purple-700"}`}>
                Deals ganados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={badgeClass}>{sortedDeals.length} deals</span>
              <span className={badgeClass}>{formatUSD(total)}</span>
            </div>
          </div>
          
          {sortedDeals.length === 0 ? (
            <div className={emptyClass} style={isMapache ? { color: "#cffafe" } : undefined}>
              <p className="text-sm font-medium">
                Aún no hay deals sincronizados para este miembro.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
      </div>
    </Modal>
  );
}
