"use client";

import { useState } from "react";
import {
  Users,
  Building2,
  Save,
  UserPlus,
  X,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function AnalyticsConfiguracionPage() {
  const [isLoading] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const teams = [
    {
      id: 1,
      name: "Aguilas",
      members: ["Juan Perez", "Ana Martinez", "Roberto Silva"],
    },
    {
      id: 2,
      name: "Halcones",
      members: ["Maria Garcia", "Luis Fernandez"],
    },
    {
      id: 3,
      name: "Panteras",
      members: ["Carlos Rodriguez", "Carmen Diaz", "Diego Ruiz"],
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-h))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-500">Cargando configuracion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--nav-h))]">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/portal/analytics">
            <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Volver al Portal
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuracion</h1>
            <p className="text-slate-500 text-sm">
              Gestiona equipos y asignacion de personas
            </p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Equipos y Personas
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Asigna personas de Pipedrive a los equipos internos para filtrar
            correctamente los datos del dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-slate-800">
                      {team.name}
                    </span>
                  </span>
                  <span className="text-sm text-slate-500">
                    {team.members.length} miembros
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      Agregar imagen
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                  >
                    <span className="text-sm text-slate-700">{member}</span>
                    <button className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <button className="w-full mt-2 inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <UserPlus className="h-3 w-3" />
                  Agregar persona
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-400">
                <Plus className="h-4 w-4" />
                <span className="font-semibold">Nuevo Equipo</span>
              </div>
            </div>

            <div className="px-5 py-4">
              {showNewTeamForm ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="teamName"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nombre del equipo
                    </label>
                    <input
                      id="teamName"
                      type="text"
                      placeholder="Ej: Aguilas"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors">
                      <Save className="h-3 w-3" />
                      Crear
                    </button>
                    <button
                      onClick={() => {
                        setShowNewTeamForm(false);
                        setNewTeamName("");
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTeamForm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Agregar nuevo equipo
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
