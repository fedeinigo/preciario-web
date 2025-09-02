"use client";

import React, { useMemo, useState, useEffect } from "react";
import { readProposals } from "./lib/storage";
import { countryIdFromName } from "./lib/catalogs";

const TitleBar = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary text-white font-semibold px-3 py-2 text-sm">
    {children}
  </div>
);

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-extrabold text-primary">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="bg-primary text-white font-semibold px-3 py-2 text-xs">{title}</div>
      <div className="overflow-x-auto border">{children}</div>
    </div>
  );
}

export default function Stats({
  isAdmin,
  currentEmail,
}: {
  isAdmin: boolean;
  currentEmail: string;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ✅ Una sola lectura inicial (lazy) + refresco al volver al foco
  const [all, setAll] = useState(() => readProposals());
  useEffect(() => {
    const onFocus = () => setAll(readProposals());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const subset = useMemo(() => {
    return all.filter((p) => {
      const scopeOk = isAdmin ? true : p.userEmail === currentEmail;
      if (!scopeOk) return false;
      const t = new Date(p.createdAt).getTime();
      const f = from ? new Date(from).getTime() : -Infinity;
      const tt = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
      return t >= f && t <= tt;
    });
  }, [all, isAdmin, currentEmail, from, to]);

  const uniqueUsers = useMemo(
    () => new Set(subset.map((p) => p.userEmail)).size,
    [subset]
  );
  const uniqueCompanies = useMemo(
    () => new Set(subset.map((p) => p.companyName)).size,
    [subset]
  );

  const bySku = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, { name: string; qty: number }>>((acc, p) => {
          p.items.forEach((it) => {
            const cur = acc[it.sku] ?? { name: it.name, qty: 0 };
            cur.qty += it.quantity;
            cur.name = cur.name || it.name;
            acc[it.sku] = cur;
          });
          return acc;
        }, {})
      ).sort((a, b) => b[1].qty - a[1].qty),
    [subset]
  );

  const byCountry = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, number>>((acc, p) => {
          acc[p.country] = (acc[p.country] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]),
    [subset]
  );

  return (
    <div className="p-4">
      <div className="border bg-white">
        <TitleBar>Estadísticas</TitleBar>

        <div className="p-3">
          <div className="border bg-white p-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                <input
                  type="date"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Propuestas generadas" value={String(subset.length)} />
            <StatCard label="Usuarios únicos" value={String(uniqueUsers)} />
            <StatCard label="Empresas distintas" value={String(uniqueCompanies)} />
          </div>

          <Section title="Ítems más cotizados (por SKU)">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Ítem</th>
                  <th className="table-th w-40 text-right">Cantidad total</th>
                </tr>
              </thead>
              <tbody>
                {bySku.map(([sku, info]) => (
                  <tr key={sku}>
                    <td className="table-td">
                      <span className="text-gray-500 font-mono">{sku}</span>
                    </td>
                    <td className="table-td">{info.name}</td>
                    <td className="table-td text-right font-semibold">{info.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Propuestas por país">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">País</th>
                  <th className="table-th w-40 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {byCountry.map(([c, n]) => (
                  <tr key={c}>
                    <td className="table-td">
                      {c}{" "}
                      <span className="text-xs text-gray-500">
                        ({countryIdFromName(c)})
                      </span>
                    </td>
                    <td className="table-td text-right font-semibold">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    </div>
  );
}
  