// src/app/components/features/goals/components/DealDetailsModal.tsx
"use client";

import React from "react";
import { X, Calendar, DollarSign, FileText, TrendingUp, Building2, ExternalLink } from "lucide-react";
import type { UserWonDeal } from "./BillingSummaryCard";

type Props = {
  deal: UserWonDeal | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: "direct" | "mapache";
};

export default function DealDetailsModal({ deal, isOpen, onClose, theme = "direct" }: Props) {
  if (!isOpen || !deal) return null;

  const createdDate = new Date(deal.createdAt);
  const formattedDate = createdDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isMapache = theme === "mapache";
  const overlayClass = isMapache
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";
  const containerClass = isMapache
    ? "rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1426] via-[#0c1020] to-[#0a0d16] text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
    : "bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200";
  const headerClass = isMapache
    ? "bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] px-6 py-5 flex items-start justify-between sticky top-0 z-10"
    : "bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex items-start justify-between sticky top-0 z-10";
  const headerIconClass = isMapache
    ? "h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
    : "h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0";
  const headerTitleClass = isMapache ? "text-xl font-bold text-white" : "text-xl font-bold text-white";
  const headerChipBase = isMapache
    ? "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white/20 text-white"
    : "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white/20 text-white";
  const headerChipUpsell = isMapache
    ? "bg-amber-400/25 text-amber-100"
    : "bg-amber-500/20 text-amber-100";
  const headerChipNew = isMapache ? "bg-sky-400/25 text-sky-100" : "bg-blue-500/20 text-blue-100";
  const closeButtonClass = isMapache
    ? "h-8 w-8 rounded-lg bg-white/15 hover:bg-white/25 transition flex items-center justify-center flex-shrink-0"
    : "h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center justify-center flex-shrink-0";
  const metricsCardClass = isMapache
    ? "p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    : "p-4 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100";
  const metricsLabelClass = isMapache
    ? "text-xs font-bold uppercase tracking-wider text-white/70"
    : "text-xs font-bold uppercase tracking-wider text-purple-600";
  const metricPurple = isMapache ? "text-emerald-300" : "text-emerald-600";
  const metricAmber = isMapache ? "text-amber-300" : "text-amber-600";
  const progressCardClass = isMapache
    ? "p-5 bg-gradient-to-br from-white/5 via-[#0f162c] to-[#0b1024] rounded-2xl border border-white/10"
    : "p-5 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-100";
  const progressTitleClass = isMapache
    ? "text-sm font-bold text-white"
    : "text-sm font-bold text-slate-700";
  const progressPctClass = isMapache ? "text-lg font-bold text-[#a78bfa]" : "text-lg font-bold text-purple-600";
  const progressTrackClass = isMapache ? "relative h-4 w-full overflow-hidden rounded-xl bg-white/10" : "relative h-4 w-full overflow-hidden rounded-xl bg-slate-200";
  const progressFillClass = isMapache
    ? "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#c084fc] shadow-sm"
    : "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm";
  const progressScaleClass = isMapache ? "mt-3 flex items-center justify-between text-xs font-semibold text-white/60" : "mt-3 flex items-center justify-between text-xs font-semibold text-slate-500";
  const sectionTitleClass = isMapache
    ? "text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2"
    : "text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2";
  const detailItemClass = isMapache
    ? "flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5"
    : "flex items-center justify-between p-3 bg-slate-50 rounded-xl";
  const detailLabelClass = isMapache ? "text-sm font-semibold text-white/70" : "text-sm font-semibold text-slate-600";
  const detailValueClass = isMapache ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-900";
  const detailMonoClass = isMapache ? "text-xs font-mono font-semibold text-white/80" : "text-xs font-mono font-semibold text-slate-700";
  const linksCardBase = isMapache
    ? "flex items-center justify-between p-3 rounded-xl border transition group"
    : "flex items-center justify-between p-3 border rounded-xl transition group";
  const proposalLinkClass = isMapache
    ? `${linksCardBase} border-white/10 bg-white/5 hover:bg-white/10`
    : `${linksCardBase} bg-purple-50 hover:bg-purple-100 border border-purple-200`;
  const docLinkClass = isMapache
    ? `${linksCardBase} border-white/10 bg-white/5 hover:bg-white/10`
    : `${linksCardBase} bg-blue-50 hover:bg-blue-100 border border-blue-200`;
  const linkTextProposal = isMapache ? "text-sm font-semibold text-[#c4d6ff]" : "text-sm font-semibold text-purple-700";
  const linkTextDoc = isMapache ? "text-sm font-semibold text-[#8ee0ff]" : "text-sm font-semibold text-blue-700";
  const footerClass = isMapache
    ? "px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end sticky bottom-0"
    : "px-6 py-4 bg-slate-50 flex justify-end sticky bottom-0";
  const closeCtaClass = isMapache
    ? "px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] text-sm font-semibold text-white shadow-lg shadow-[#8b5cf6]/30 hover:shadow-xl hover:shadow-[#8b5cf6]/40 transition"
    : "px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition";

  return (
    <div className={overlayClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className={headerClass}>
          <div className="flex items-start gap-3">
            <div className={headerIconClass}>
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={headerTitleClass}>{deal.companyName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={headerChipBase}>
                  {deal.type === "auto" ? "Automático" : "Manual"}
                </span>
                <span className={`${headerChipBase} ${deal.wonType === "UPSELL" ? headerChipUpsell : headerChipNew}`}>
                  {deal.wonType === "UPSELL" ? "Upsell" : "Cliente Nuevo"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={closeButtonClass}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={metricsCardClass}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={isMapache ? "h-4 w-4 text-[#a78bfa]" : "h-4 w-4 text-purple-600"} />
                <p className={metricsLabelClass}>Mensualidad</p>
              </div>
              <p className={isMapache ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>
                ${deal.monthlyFee.toLocaleString()}
              </p>
            </div>

            <div className={metricsCardClass}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={isMapache ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-emerald-600"} />
                <p className={isMapache ? "text-xs font-bold uppercase tracking-wider text-emerald-200/90" : "text-xs font-bold uppercase tracking-wider text-emerald-600"}>
                  Facturado
                </p>
              </div>
              <p className={`text-2xl font-bold ${metricPurple}`}>
                ${deal.billedAmount.toLocaleString()}
              </p>
            </div>

            <div className={metricsCardClass}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={isMapache ? "h-4 w-4 text-amber-300" : "h-4 w-4 text-amber-600"} />
                <p className={isMapache ? "text-xs font-bold uppercase tracking-wider text-amber-200/90" : "text-xs font-bold uppercase tracking-wider text-amber-600"}>
                  Pendiente
                </p>
              </div>
              <p className={`text-2xl font-bold ${metricAmber}`}>
                ${deal.pendingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={progressCardClass}>
            <div className="flex items-center justify-between mb-3">
              <p className={progressTitleClass}>Progreso de Facturación</p>
              <p className={progressPctClass}>{deal.billingPct.toFixed(1)}%</p>
            </div>
            <div className={progressTrackClass}>
              <div
                className={progressFillClass}
                style={{ width: `${Math.min(100, Math.max(0, deal.billingPct))}%` }}
              />
            </div>
            <div className={progressScaleClass}>
              <span>$0</span>
              <span>${deal.monthlyFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h3 className={sectionTitleClass}>
              <FileText className="h-4 w-4" />
              Detalles
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div className={detailItemClass}>
                <span className={detailLabelClass}>Fecha de Cierre</span>
                <span className={detailValueClass}>{formattedDate}</span>
              </div>

              <div className={detailItemClass}>
                <span className={detailLabelClass}>ID</span>
                <span className={detailMonoClass}>{deal.id}</span>
              </div>

              {deal.proposalId && (
                <div className={detailItemClass}>
                  <span className={detailLabelClass}>ID de Propuesta</span>
                  <span className={detailMonoClass}>{deal.proposalId}</span>
                </div>
              )}

              {deal.docId && (
                <div className={detailItemClass}>
                  <span className={detailLabelClass}>ID de Documento</span>
                  <span className={detailMonoClass}>{deal.docId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          {(deal.link || deal.docUrl) && (
            <div className="space-y-3">
              <h3 className={sectionTitleClass}>
                <ExternalLink className="h-4 w-4" />
                Enlaces
              </h3>

              <div className="space-y-2">
                {deal.link && (
                  <a
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={proposalLinkClass}
                  >
                    <span className={linkTextProposal}>Ver Propuesta</span>
                    <ExternalLink
                      className={isMapache ? "h-4 w-4 text-[#a78bfa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" : "h-4 w-4 text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"}
                    />
                  </a>
                )}

                {deal.docUrl && (
                  <a
                    href={deal.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={docLinkClass}
                  >
                    <span className={linkTextDoc}>Ver Documento</span>
                    <ExternalLink
                      className={isMapache ? "h-4 w-4 text-[#7dd3fc] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" : "h-4 w-4 text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"}
                    />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={footerClass}>
          <button
            onClick={onClose}
            className={closeCtaClass}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
