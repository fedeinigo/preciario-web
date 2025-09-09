"use client";

import React from "react";

/** País puede venir como string ("Argentina") o como objeto {id,name}. */
type CountryLike = string | { id: string; name: string };
/** Grupo flexible para que encaje con el hook actual y/o API. */
type GroupLike = { id: string; title: string; countries: CountryLike[] };

export function FilialesSidebar({
  isAdmin,
  filiales,
  addFilial,
  editFilialTitle,
  removeFilial,
  addCountry,
  /** ⬇️ Firmas alineadas al hook useFiliales */
  editCountry, // (groupId, oldName, newName)
  removeCountry, // (groupId, name)
}: {
  isAdmin: boolean;
  filiales: GroupLike[];
  addFilial: (title: string) => void;
  editFilialTitle: (id: string, title: string) => void;
  removeFilial: (id: string) => void;
  addCountry: (groupId: string, name: string) => void;
  editCountry: (groupId: string, oldName: string, newName: string) => void | Promise<void>;
  removeCountry: (groupId: string, name: string) => void | Promise<void>;
}) {
  return (
    <div className="card border p-3 space-y-3">
      <div className="font-semibold text-sm">Filiales</div>

      {isAdmin && (
        <button
          className="btn-ghost w-full"
          onClick={() => {
            const title = prompt("Nombre del grupo/filial:") ?? "";
            if (title.trim()) addFilial(title.trim());
          }}
        >
          + Agregar grupo
        </button>
      )}

      <div className="space-y-4">
        {filiales.map((g) => (
          <div key={g.id} className="rounded border bg-white shadow-soft">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="font-medium">{g.title}</div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    className="text-xs underline"
                    onClick={() => {
                      const title = prompt("Editar nombre del grupo:", g.title) ?? "";
                      if (title.trim()) editFilialTitle(g.id, title.trim());
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-xs underline text-red-600"
                    onClick={() => {
                      if (confirm("¿Eliminar grupo y sus países?")) removeFilial(g.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            <ul className="px-3 py-2 space-y-1">
              {g.countries.map((c) => {
                const name = typeof c === "string" ? c : c.name;
                const key = `${g.id}:${name}`;
                return (
                  <li key={key} className="flex items-center justify-between">
                    <span>{name}</span>
                    {isAdmin && (
                      <span className="flex gap-2">
                        <button
                          className="text-xs underline"
                          onClick={() => {
                            const newName = prompt("Editar país:", name) ?? "";
                            if (newName.trim()) editCountry(g.id, name, newName.trim());
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs underline text-red-600"
                          onClick={() => {
                            if (confirm("¿Eliminar país?")) removeCountry(g.id, name);
                          }}
                        >
                          Eliminar
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}

              {isAdmin && (
                <li>
                  <button
                    className="text-xs underline"
                    onClick={() => {
                      const name = prompt("Agregar país al grupo:") ?? "";
                      if (name.trim()) addCountry(g.id, name.trim());
                    }}
                  >
                    + Agregar país
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}

        {filiales.length === 0 && (
          <div className="text-sm text-gray-500">Sin filiales aún.</div>
        )}
      </div>
    </div>
  );
}

type GlossaryLink = { id: string; label: string; url: string };

export function GlossarySidebar({
  isAdmin,
  glossary,
  addLink,
  editLink,
  removeLink,
}: {
  isAdmin: boolean;
  glossary: GlossaryLink[];
  addLink: (label: string, url: string) => void;
  editLink: (id: string, label: string, url: string) => void;
  removeLink: (id: string) => void;
}) {
  return (
    <div className="card border p-3 space-y-3">
      <div className="font-semibold text-sm">Glosario</div>

      {isAdmin && (
        <button
          className="btn-ghost w-full"
          onClick={() => {
            const label = prompt("Etiqueta del enlace:") ?? "";
            const url = label ? prompt("URL del enlace:") ?? "" : "";
            if (label.trim() && url.trim()) addLink(label.trim(), url.trim());
          }}
        >
          + Agregar enlace
        </button>
      )}

      <ul className="space-y-1">
        {glossary.map((g) => (
          <li key={g.id} className="flex items-center justify-between">
            <a
              className="text-sm underline"
              href={g.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {g.label}
            </a>
            {isAdmin && (
              <span className="flex gap-2">
                <button
                  className="text-xs underline"
                  onClick={() => {
                    const label = prompt("Editar etiqueta:", g.label) ?? "";
                    const url = label ? prompt("Editar URL:", g.url) ?? "" : "";
                    if (label.trim() && url.trim()) editLink(g.id, label.trim(), url.trim());
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-xs underline text-red-600"
                  onClick={() => {
                    if (confirm("¿Eliminar enlace?")) removeLink(g.id);
                  }}
                >
                  Eliminar
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

      {glossary.length === 0 && (
        <div className="text-sm text-gray-500">Aún no hay enlaces.</div>
      )}
    </div>
  );
}
