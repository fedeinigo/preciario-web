"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import { readProposals, readUsers } from "./lib/storage";
import { countryIdFromName, subsidiaryIdFromName } from "./lib/catalogs";
import { formatUSD } from "./lib/format";
import type { ProposalRecord, UserEntry } from "./lib/types";

interface HistoryProps {
  isAdmin: boolean;
  currentEmail: string;
}

const TitleBar = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary text-white font-semibold px-3 py-2 text-sm">
    {children}
  </div>
);

export default function History({ isAdmin, currentEmail }: HistoryProps) {
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);

  const [filterId, setFilterId] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSubsidiary, setFilterSubsidiary] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortTotal, setSortTotal] = useState<"none" | "asc" | "desc">("none");

  const [redirectOpen, setRedirectOpen] = useState(false);

  useEffect(() => {
    setProposals(readProposals());
    setUsers(readUsers());
  }, []);

  const scopeFiltered = useMemo(() => {
    return proposals
      .filter((p) =>
        isAdmin ? (selectedUser ? p.userEmail === selectedUser.email : true) : p.userEmail === currentEmail
      )
      .filter((p) => !filterId || p.id.toLowerCase().includes(filterId.toLowerCase()))
      .filter((p) => !filterCompany || p.companyName.toLowerCase().includes(filterCompany.toLowerCase()))
      .filter((p) => !filterCountry || p.country === filterCountry)
      .filter((p) => !filterSubsidiary || p.subsidiary === filterSubsidiary)
      .filter((p) => {
        if (!filterDate) return true;
        const d = new Date(p.createdAt);
        const only = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        return only === filterDate;
      })
      .sort((a, b) =>
        sortTotal === "asc"
          ? a.totalAmount - b.totalAmount
          : sortTotal === "desc"
          ? b.totalAmount - a.totalAmount
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [
    proposals,
    isAdmin,
    selectedUser,
    currentEmail,
    filterId,
    filterCompany,
    filterCountry,
    filterSubsidiary,
    filterDate,
    sortTotal,
  ]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortTotal(e.target.value as "none" | "asc" | "desc");
  };

  return (
    <div className="p-4">
      <div className="border bg-white">
        <TitleBar>Histórico</TitleBar>

        <div className="p-3">
          {isAdmin ? (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Usuarios</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`btn ${selectedUser === null ? "tab-active" : "tab-inactive"} border`}
                  onClick={() => setSelectedUser(null)}
                >
                  Todos
                </button>
                {users.map((u) => (
                  <button
                    key={u.email}
                    className={`btn ${selectedUser?.email === u.email ? "tab-active" : "tab-inactive"} border`}
                    onClick={() => setSelectedUser(u)}
                    title={u.userId}
                  >
                    {u.email}
                    <span className="ml-2 text-xs text-gray-500">({u.userId})</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-600">
              Viendo histórico de <span className="font-medium">{currentEmail}</span>
            </div>
          )}

          <div className="border bg-white p-3 mb-2">
            <div className="grid grid-cols-7 gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID (PPT)</label>
                <input
                  className="input"
                  placeholder="PPT-000000123"
                  value={filterId}
                  onChange={(e) => setFilterId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                <input
                  className="input"
                  placeholder="Buscar…"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">País</label>
                <select className="select" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                  <option value="">Todos</option>
                  {Array.from(new Set(proposals.map((p) => p.country))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Filial</label>
                <select
                  className="select"
                  value={filterSubsidiary}
                  onChange={(e) => setFilterSubsidiary(e.target.value)}
                >
                  <option value="">Todas</option>
                  {Array.from(new Set(proposals.map((p) => p.subsidiary))).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Orden por mensual</label>
                <select className="select" value={sortTotal} onChange={handleSortChange}>
                  <option value="none">—</option>
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha (día)</label>
                <input type="date" className="input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setFilterId("");
                    setFilterCompany("");
                    setFilterCountry("");
                    setFilterSubsidiary("");
                    setFilterDate("");
                    setSortTotal("none");
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">ID Propuesta</th>
                  <th className="table-th">Empresa</th>
                  <th className="table-th">País</th>
                  <th className="table-th">Filial</th>
                  <th className="table-th text-right">Mensual</th>
                  <th className="table-th">Fecha</th>
                  <th className="table-th w-40 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {scopeFiltered.map((p) => (
                  <tr key={p.id}>
                    <td className="table-td">
                      <span className="text-gray-500 font-mono">{p.id}</span>
                    </td>
                    <td className="table-td">{p.companyName}</td>
                    <td className="table-td">
                      {p.country} <span className="text-xs text-gray-500">({countryIdFromName(p.country)})</span>
                    </td>
                    <td className="table-td">
                      {p.subsidiary}{" "}
                      <span className="text-xs text-gray-500">({subsidiaryIdFromName(p.subsidiary)})</span>
                    </td>
                    <td className="table-td text-right">{formatUSD(p.totalAmount)}</td>
                    <td className="table-td">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="table-td text-center">
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setRedirectOpen(true);
                          setTimeout(() => setRedirectOpen(false), 2000);
                        }}
                      >
                        Ver propuesta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={redirectOpen} onClose={() => setRedirectOpen(false)} title="Redireccionando" footer={null}>
        <p className="text-gray-700">Estás siendo redireccionado a la propuesta…</p>
      </Modal>
    </div>
  );
}
