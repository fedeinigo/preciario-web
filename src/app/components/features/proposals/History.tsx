// src/app/components/features/proposals/History.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ProposalRecord } from "@/lib/types";
import type { AppRole } from "@/constants/teams";
import { formatUSD, formatDateTime } from "./lib/format";
import { buildCsv, downloadCsv } from "./lib/csv";
import { copyToClipboard } from "./lib/clipboard";
import { TableSkeletonRows } from "@/app/components/ui/Skeleton";
import { ExternalLink, Copy, Trash2, Trophy } from "lucide-react";
import {
  q1Range,
  q2Range,
  q3Range,
  q4Range,
  currentMonthRange,
  prevMonthRange,
  currentWeekRange,
  prevWeekRange,
} from "./lib/dateRanges";
import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { useTranslations } from "@/app/LanguageProvider";
import { normalizeSearchText } from "@/lib/normalize-search-text";
import { fetchAllProposals, invalidateProposalsCache, type ProposalsListMeta } from "./lib/proposals-response";
import { useAdminUsers } from "./hooks/useAdminUsers";
import { usePathname } from "next/navigation";

type SortKey = "id" | "company" | "country" | "email" | "monthly" | "created" | "status";
type SortDir = "asc" | "desc";
type WonType = "NEW_CUSTOMER" | "UPSELL";

function QuickRanges({
  setFrom,
  setTo,
}: {
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
}) {
  const t = useTranslations("proposals.history.quickRanges");
  const year = new Date().getFullYear();
  const apply = (r: { from: string; to: string }) => {
    setFrom(r.from);
    setTo(r.to);
  };
  const quarters = [
    { label: "Q1", get: () => q1Range(year) },
    { label: "Q2", get: () => q2Range(year) },
    { label: "Q3", get: () => q3Range(year) },
    { label: "Q4", get: () => q4Range(year) },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {quarters.map((q) => (
        <button key={q.label} className="btn-ghost !py-1" onClick={() => apply(q.get())}>
          {q.label}
        </button>
      ))}
      <button className="btn-ghost !py-1" onClick={() => apply(currentMonthRange())}>
        {t("currentMonth")}
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(prevMonthRange())}>
        {t("previousMonth")}
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(currentWeekRange())}>
        {t("currentWeek")}
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(prevWeekRange())}>
        {t("previousWeek")}
      </button>
    </div>
  );
}

export default function History({
  role,
  currentEmail,
  leaderTeam,
  isSuperAdmin,
}: {
  role: AppRole;
  currentEmail: string;
  leaderTeam: string | null;
  isSuperAdmin: boolean;
}) {
  const t = useTranslations("proposals.history");
  const filtersT = useTranslations("proposals.history.filters");
  const tableT = useTranslations("proposals.history.table");
  const paginationT = useTranslations("proposals.history.pagination");
  const modalT = useTranslations("proposals.history.deleteModal");
  const toastT = useTranslations("proposals.history.toast");
  const csvT = useTranslations("proposals.history.csv");
  const statusT = useTranslations("proposals.history.table.statusLabels");
  const wonTypeModalT = useTranslations("proposals.history.wonTypeModal");

  const [rows, setRows] = useState<ProposalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [remoteMeta, setRemoteMeta] = useState<ProposalsListMeta | undefined>();
  const [wonSelection, setWonSelection] = useState<{ id: string; wonType: WonType } | null>(null);
  const [markingWon, setMarkingWon] = useState(false);

  type LoadOptions = { skipCache?: boolean };
  const load = useCallback(async (options?: LoadOptions) => {
    setLoading(true);
    try {
      const { proposals, meta } = await fetchAllProposals({
        skipCache: options?.skipCache ?? false,
      });
      setRows(proposals);
      setRemoteMeta(meta);
    } catch {
      setRows([]);
      setRemoteMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const onRefresh = () => {
      invalidateProposalsCache();
      load({ skipCache: true });
    };
    window.addEventListener("proposals:refresh", onRefresh as EventListener);
    return () => window.removeEventListener("proposals:refresh", onRefresh as EventListener);
  }, [load]);

  const manualRefresh = useCallback(() => {
    invalidateProposalsCache();
    load({ skipCache: true });
  }, [load]);

  // Aux
  const { users: adminUsers } = useAdminUsers({
    isSuperAdmin,
    isLeader: role === "lider",
  });
  const [teams, setTeams] = useState<string[]>([]);

  // sólo equipos con integrantes (igual que en Objetivos/Stats)
  useEffect(() => {
    if (!isSuperAdmin) return;
    const counts = new Map<string, number>();
    adminUsers.forEach((u) => {
      const t = (u.team || "").trim();
      if (!t) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    const visible = Array.from(counts.entries())
      .filter(([, c]) => c > 0)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
    setTeams(visible);
  }, [adminUsers, isSuperAdmin]);

  const emailToTeam = useMemo(() => {
    const m = new Map<string, string | null>();
    adminUsers.forEach((u) => {
      if (u.email) m.set(u.email, u.team);
    });
    return m;
  }, [adminUsers]);

  const countryOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  // filtros
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [idQuery, setIdQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // orden/pag
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const clearAll = () => {
    setTeamFilter("");
    setIdQuery("");
    setCompanyQuery("");
    setCountryFilter("");
    setEmailQuery("");
    setFrom("");
    setTo("");
    setSortKey("created");
    setSortDir("desc");
    setPage(1);
  };

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "created" ? "desc" : "asc");
    }
    setPage(1);
  };

  const subset = useMemo(() => {
    const normalizedIdQuery = normalizeSearchText(idQuery);
    const normalizedCompanyQuery = normalizeSearchText(companyQuery);
    const normalizedEmailQuery = normalizeSearchText(emailQuery);

    const filtered = rows.filter((p) => {
      if (isSuperAdmin) {
        if (teamFilter) {
          const t = emailToTeam.get(p.userEmail) ?? null;
          if (t !== teamFilter) return false;
        }
      } else if (role === "lider") {
        const t = emailToTeam.get(p.userEmail) ?? null;
        if (!leaderTeam || t !== leaderTeam) return false;
      } else {
        if (p.userEmail !== currentEmail) return false;
      }

      const idOk =
        !normalizedIdQuery || normalizeSearchText(p.id).includes(normalizedIdQuery);
      const compOk =
        !normalizedCompanyQuery ||
        normalizeSearchText(p.companyName).includes(normalizedCompanyQuery);
      const emailOk =
        !normalizedEmailQuery ||
        normalizeSearchText(p.userEmail).includes(normalizedEmailQuery);
      const countryOk = !countryFilter || p.country === countryFilter;

      const ts = new Date(p.createdAt as unknown as string).getTime();
      const fromTs = from ? new Date(from).getTime() : -Infinity;
      const toTs = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
      const dateOk = ts >= fromTs && ts <= toTs;

      return idOk && compOk && emailOk && countryOk && dateOk;
    });

    const sorted = [...filtered].sort((a, b) => {
      const am = Number(a.totalAmount);
      const bm = Number(b.totalAmount);
      const ta = new Date(a.createdAt as unknown as string).getTime();
      const tb = new Date(b.createdAt as unknown as string).getTime();
      const dir = sortDir === "asc" ? 1 : -1;

      switch (sortKey) {
        case "id":
          return a.id.localeCompare(b.id) * dir;
        case "company":
          return a.companyName.localeCompare(b.companyName) * dir;
        case "country":
          return a.country.localeCompare(b.country) * dir;
        case "email":
          return (a.userEmail || "").localeCompare(b.userEmail || "") * dir;
        case "monthly":
          return (am - bm) * dir;
        case "status":
          return ((a.status ?? "OPEN").localeCompare(b.status ?? "OPEN")) * dir;
        case "created":
        default:
          return (ta - tb) * dir;
      }
    });

    return sorted;
  }, [
    rows,
    emailToTeam,
    currentEmail,
    leaderTeam,
    role,
    isSuperAdmin,
    teamFilter,
    idQuery,
    companyQuery,
    emailQuery,
    countryFilter,
    from,
    to,
    sortKey,
    sortDir,
  ]);

  const localTotalPages = Math.max(1, Math.ceil(subset.length / pageSize));
  const totalPages =
    remoteMeta?.totalPages && remoteMeta.totalPages > 0
      ? Math.max(localTotalPages, Math.ceil(remoteMeta.totalPages))
      : localTotalPages;
  const pageStart = (page - 1) * pageSize;
  const paged = subset.slice(pageStart, pageStart + pageSize);

  const translateStatus = (status: string | null | undefined) => {
    const normalized = String(status ?? "open").toLowerCase();
    const key = `proposals.history.table.statusLabels.${normalized}`;
    const translated = statusT(normalized);
    return translated === key ? status ?? "OPEN" : translated;
  };

  const downloadCurrentCsv = () => {
    const headers = [
      csvT("headers.id"),
      csvT("headers.company"),
      csvT("headers.country"),
      csvT("headers.email"),
      csvT("headers.monthly"),
      csvT("headers.created"),
      csvT("headers.status"),
      csvT("headers.url"),
    ];
    const data = subset.map((p) => [
      p.id,
      p.companyName,
      p.country,
      p.userEmail || "",
      Number(p.totalAmount).toFixed(2),
      formatDateTime(p.createdAt as unknown as string),
      translateStatus(p.status ?? "OPEN"),
      p.docUrl || "",
    ]);
    const csv = buildCsv(headers, data);
    downloadCsv(csvT("fileName"), csv);
  };

  // Confirm delete modal
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const canDelete = (p: ProposalRecord) =>
    isSuperAdmin || (role === "usuario" && p.userEmail === currentEmail);

  const markWon = async (id: string, wonType: WonType): Promise<boolean> => {
    const r = await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WON", wonType }),
    });
    if (!r.ok) {
      const errorText = await r.text().catch(() => "");
      toast.error(errorText || toastT("markWonError"));
      return false;
    }
    toast.success(toastT("markWonSuccess"));
    return true;
  };

  const openWonModal = (id: string) => {
    setWonSelection({ id, wonType: "NEW_CUSTOMER" });
  };

  const closeWonModal = () => {
    if (!markingWon) {
      setWonSelection(null);
    }
  };

  const confirmWonSelection = async () => {
    if (!wonSelection) return;
    setMarkingWon(true);
    try {
      const ok = await markWon(wonSelection.id, wonSelection.wonType);
      if (ok) {
        setWonSelection(null);
        invalidateProposalsCache();
        load({ skipCache: true });
      }
    } finally {
      setMarkingWon(false);
    }
  };

  // NUEVO: revertir WON -> OPEN
  const setOpen = async (id: string) => {
    const r = await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OPEN" }),
    });
    if (!r.ok) {
      const errorText = await r.text().catch(() => "");
      toast.error(errorText || toastT("markOpenError"));
      return;
    }
    toast.success(toastT("markOpenSuccess"));
    invalidateProposalsCache();
    load({ skipCache: true });
  };

  const doDelete = async (id: string) => {
    const r = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const errorText = await r.text().catch(() => "");
      toast.error(errorText || toastT("deleteError"));
      return;
    }
    toast.success(toastT("deleteSuccess"));
    setConfirmId(null);
    invalidateProposalsCache();
    load({ skipCache: true });
  };

  return (
    <div className="p-4">
      <div className="card border-2 overflow-hidden">
        <div className="heading-bar-sm flex items-center justify-between">
          <span>{t("title")}</span>
          <div className="flex items-center gap-2">
            <button
              className="btn-bar"
              onClick={downloadCurrentCsv}
              title={t("actions.downloadCsvTitle")}
            >
              {t("actions.downloadCsv")}
            </button>
            <button className="btn-bar" onClick={manualRefresh} title={t("actions.refreshTitle")}>
              {t("actions.refresh")}
            </button>
          </div>
        </div>

        <div className="p-3">
          <QuickRanges setFrom={setFrom} setTo={setTo} />

          {(isSuperAdmin || role === "lider") && (
            <div className="mb-3 grid grid-cols-1 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("team.label")}</label>
                <select
                  className="select"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="">{filtersT("team.all")}</option>
                  {teams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("id.label")}</label>
                <input
                  className="input"
                  placeholder={filtersT("id.placeholder")}
                  value={idQuery}
                  onChange={(e) => setIdQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("company.label")}</label>
                <input
                  className="input"
                  placeholder={filtersT("company.placeholder")}
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("country.label")}</label>
                <select
                  className="select"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option value="">{filtersT("country.all")}</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("email.label")}</label>
                <input
                  className="input"
                  placeholder={filtersT("email.placeholder")}
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  className="btn-bar w-full transition hover:bg-[rgb(var(--primary))]/90"
                  onClick={clearAll}
                >
                  {filtersT("clear")}
                </button>
              </div>
            </div>
          )}

          <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{filtersT("from")}</label>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{filtersT("to")}</label>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="hidden md:block" />
            <div className="hidden md:block" />
          </div>

          <div className="overflow-x-auto rounded-md border-2">
            <table className="min-w-full bg-white text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {(
                    [
                      ["id", tableT("headers.id")],
                      ["company", tableT("headers.company")],
                      ["country", tableT("headers.country")],
                      ["email", tableT("headers.email")],
                      ["monthly", tableT("headers.monthly")],
                      ["created", tableT("headers.created")],
                      ["status", tableT("headers.status")],
                      ["", tableT("headers.actions")],
                    ] as Array<[SortKey | "", string]>
                  ).map(([k, label], idx) => {
                    const clickable = k !== "";
                    const active = k === sortKey;
                    const dir = sortDir === "asc" ? "▲" : "▼";
                    return (
                      <th
                        key={idx}
                        className={`table-th ${clickable ? "cursor-pointer select-none" : ""}`}
                        onClick={() => clickable && sortBy(k as SortKey)}
                        title={clickable ? tableT("sortTooltip") : ""}
                      >
                        {label} {active && dir}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {loading ? (
                <TableSkeletonRows rows={6} cols={8} />
              ) : (
                <tbody>
                  {paged.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-[rgb(var(--primary-soft))]/40"
                      } hover:bg-white`}
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <span className="font-mono truncate max-w-[260px]">{p.id}</span>
                          <button
                            className="btn-bar px-2 py-1"
                            onClick={() => copyToClipboard(p.id)}
                            title={tableT("copyId")}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="table-td">{p.companyName}</td>
                      <td className="table-td">{p.country}</td>
                      <td className="table-td">{p.userEmail || tableT("emailFallback")}</td>
                      <td className="table-td text-right font-semibold" title={tableT("monthlyTitle")}>
                        {formatUSD(Number(p.totalAmount) || 0)}
                      </td>
                      <td className="table-td whitespace-nowrap" title={tableT("createdTitle")}>
                        {formatDateTime(p.createdAt as unknown as string)}
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                              p.status === "WON"
                                ? "bg-green-100 text-green-700"
                                : p.status === "LOST"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                            title={
                              p.status === "WON"
                                ? tableT("statusBadges.won")
                                : p.status === "LOST"
                                ? tableT("statusBadges.lost")
                                : tableT("statusBadges.open")
                            }
                          >
                            {translateStatus(p.status)}
                          </span>
                          {p.status === "WON" && (
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                p.wonType === "UPSELL"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {p.wonType === "UPSELL"
                                ? tableT("wonTypeBadges.upsell")
                                : tableT("wonTypeBadges.newCustomer")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Toggle WON / OPEN */}
                          {p.status === "WON" ? (
                            <button
                              className="btn-ghost !py-1 text-[#4c1d95] hover:bg-[#4c1d95]/10"
                              title={tableT("actions.reopenTooltip")}
                              onClick={() => setOpen(p.id)}
                            >
                              {tableT("actions.reopen")}
                            </button>
                          ) : (
                            <button
                              className="btn-ghost !py-1 text-emerald-600"
                              title={tableT("actions.markWonTooltip")}
                              onClick={() => openWonModal(p.id)}
                            >
                              <Trophy className="h-4 w-4 mr-1" />
                              {tableT("actions.markWon")}
                            </button>
                          )}

                          {p.docUrl ? (
                            <>
                              <a
                                href={p.docUrl}
                                className="btn-bar inline-flex items-center justify-center !py-1"
                                target="_blank"
                                rel="noreferrer"
                                title={tableT("actions.open")}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                {tableT("actions.view")}
                              </a>
                              <button
                                className="btn-bar !py-1"
                                title={tableT("actions.copyLink")}
                                onClick={() => p.docUrl && copyToClipboard(p.docUrl)}
                              >
                                {tableT("actions.copy")}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">{tableT("actions.noLink")}</span>
                          )}
                          {canDelete(p) && (
                            <button
                              className="btn-ghost !py-1 text-red-700"
                              title={tableT("actions.deleteTooltip")}
                              onClick={() => setConfirmId(p.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {tableT("actions.delete")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={8}>
                        {tableT("empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>

          {!loading && subset.length > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-sm text-gray-600">
                {paginationT("display", {
                  start: pageStart + 1,
                  end: Math.min(pageStart + pageSize, subset.length),
                  total: subset.length,
                })}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {paginationT("perPage", { count: n })}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <button
                    className="btn-bar"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {paginationT("previous")}
                  </button>
                  <span className="text-sm">
                    {paginationT("pageStatus", { current: page, total: totalPages })}
                  </span>
                  <button
                    className="btn-bar"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    {paginationT("next")}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>

      <Modal
        open={!!wonSelection}
        onClose={closeWonModal}
        title={wonTypeModalT("title")}
        disableCloseOnBackdrop={markingWon}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={closeWonModal} disabled={markingWon}>
              {wonTypeModalT("cancel")}
            </button>
            <button
              className="btn-primary"
              onClick={confirmWonSelection}
              disabled={markingWon}
            >
              {markingWon ? wonTypeModalT("saving") : wonTypeModalT("confirm")}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{wonTypeModalT("description")}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                (wonSelection?.wonType ?? "NEW_CUSTOMER") === "NEW_CUSTOMER"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                  : "border-gray-300 text-gray-600 hover:border-emerald-400"
              }`}
              onClick={() =>
                setWonSelection((prev) => (prev ? { ...prev, wonType: "NEW_CUSTOMER" } : prev))
              }
              disabled={markingWon}
            >
              {wonTypeModalT("newCustomer")}
            </button>
            <button
              type="button"
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                wonSelection?.wonType === "UPSELL"
                  ? "border-amber-500 bg-amber-50 text-amber-600"
                  : "border-gray-300 text-gray-600 hover:border-amber-400"
              }`}
              onClick={() =>
                setWonSelection((prev) => (prev ? { ...prev, wonType: "UPSELL" } : prev))
              }
              disabled={markingWon}
            >
              {wonTypeModalT("upsell")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title={modalT("title")}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmId(null)}>
              {modalT("cancel")}
            </button>
            <button
              className="btn-primary bg-red-600 hover:bg-red-700"
              onClick={() => confirmId && doDelete(confirmId)}
            >
              {modalT("confirm")}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">
          {modalT("message")}
        </p>
      </Modal>
    </div>
  );
}
