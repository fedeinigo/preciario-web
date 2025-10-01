"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";

import { useTranslations } from "@/app/LanguageProvider";

/** País puede venir como string ("Argentina") o como objeto {id,name}. */
type CountryLike = string | { id: string; name: string };
/** Grupo flexible para que encaje con el hook actual y/o API. */
type GroupLike = { id: string; title: string; countries: CountryLike[] };

/* ===========================
   Dialogs reutilizables
   =========================== */

type Field = { name: string; label: string; placeholder?: string; initial?: string };

function PromptDialog({
  open,
  title,
  fields,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  fields: Field[];
  onCancel: () => void;
  onConfirm: (values: Record<string, string>) => void;
}) {
  const dialogT = useTranslations("proposals.sidebars.dialog");
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const base: Record<string, string> = {};
    fields.forEach((f) => (base[f.name] = f.initial ?? ""));
    setValues(base);
  }, [open, fields]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>{dialogT("cancel")}</button>
          <button className="btn-primary" onClick={() => onConfirm(values)}>
            {dialogT("accept")}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-xs text-gray-600 mb-1">{f.label}</label>
            <input
              className="input"
              placeholder={f.placeholder}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogT = useTranslations("proposals.sidebars.dialog");
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>{dialogT("cancel")}</button>
          <button className="btn-primary" onClick={onConfirm}>
            {confirmLabel ?? dialogT("confirm")}
          </button>
        </div>
      }
    >
      <div className="text-sm text-gray-700">{message}</div>
    </Modal>
  );
}

/* ===========================
   Sidebar de Filiales
   =========================== */

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
  const filialesT = useTranslations("proposals.sidebars.filiales");
  const [promptCfg, setPromptCfg] = React.useState<{
    title: string;
    fields: Field[];
    onConfirm: (values: Record<string, string>) => void;
  } | null>(null);

  const [confirmCfg, setConfirmCfg] = React.useState<{
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div className="card border p-3 space-y-3">
      <div className="heading-bar-sm">{filialesT("title")}</div>

      {isAdmin && (
        <button
          className="btn-ghost w-full"
          onClick={() =>
            setPromptCfg({
              title: filialesT("prompts.addGroup.title"),
              fields: [
                {
                  name: "title",
                  label: filialesT("prompts.addGroup.label"),
                  placeholder: filialesT("prompts.addGroup.placeholder"),
                },
              ],
              onConfirm: ({ title }) => {
                const t = (title ?? "").trim();
                if (t) addFilial(t);
                setPromptCfg(null);
              },
            })
          }
        >
          {filialesT("buttons.addGroup")}
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
                    onClick={() =>
                      setPromptCfg({
                        title: filialesT("prompts.editGroup.title"),
                        fields: [
                          {
                            name: "title",
                            label: filialesT("prompts.editGroup.label"),
                            initial: g.title,
                          },
                        ],
                        onConfirm: ({ title }) => {
                          const t = (title ?? "").trim();
                          if (t) editFilialTitle(g.id, t);
                          setPromptCfg(null);
                        },
                      })
                    }
                  >
                    {filialesT("buttons.edit")}
                  </button>
                  <button
                    className="text-xs underline text-red-600"
                    onClick={() =>
                      setConfirmCfg({
                        title: filialesT("confirmations.deleteGroup.title"),
                        message: filialesT("confirmations.deleteGroup.message", {
                          group: g.title,
                        }),
                        onConfirm: () => {
                          removeFilial(g.id);
                          setConfirmCfg(null);
                        },
                      })
                    }
                  >
                    {filialesT("buttons.delete")}
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
                          onClick={() =>
                            setPromptCfg({
                              title: filialesT("prompts.editCountry.title"),
                              fields: [
                                {
                                  name: "name",
                                  label: filialesT("prompts.editCountry.label"),
                                  initial: name,
                                },
                              ],
                              onConfirm: ({ name: newName }) => {
                                const t = (newName ?? "").trim();
                                if (t) editCountry(g.id, name, t);
                                setPromptCfg(null);
                              },
                            })
                          }
                        >
                          {filialesT("buttons.edit")}
                        </button>
                        <button
                          className="text-xs underline text-red-600"
                          onClick={() =>
                            setConfirmCfg({
                              title: filialesT("confirmations.deleteCountry.title"),
                              message: filialesT("confirmations.deleteCountry.message", {
                                country: name,
                                group: g.title,
                              }),
                              onConfirm: () => {
                                removeCountry(g.id, name);
                                setConfirmCfg(null);
                              },
                            })
                          }
                        >
                          {filialesT("buttons.delete")}
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
                    onClick={() =>
                      setPromptCfg({
                        title: filialesT("prompts.addCountry.title"),
                        fields: [
                          {
                            name: "name",
                            label: filialesT("prompts.addCountry.label"),
                            placeholder: filialesT("prompts.addCountry.placeholder"),
                          },
                        ],
                        onConfirm: ({ name }) => {
                          const n = (name ?? "").trim();
                          if (n) addCountry(g.id, n);
                          setPromptCfg(null);
                        },
                      })
                    }
                  >
                    {filialesT("buttons.addCountry")}
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}

        {filiales.length === 0 && (
          <div className="text-sm text-gray-500">{filialesT("empty")}</div>
        )}
      </div>

      {/* Modales */}
      {promptCfg && (
        <PromptDialog
          open={!!promptCfg}
          title={promptCfg.title}
          fields={promptCfg.fields}
          onCancel={() => setPromptCfg(null)}
          onConfirm={(v) => promptCfg.onConfirm(v)}
        />
      )}
      {confirmCfg && (
        <ConfirmDialog
          open={!!confirmCfg}
          title={confirmCfg.title}
          message={confirmCfg.message}
          onCancel={() => setConfirmCfg(null)}
          onConfirm={() => confirmCfg.onConfirm()}
        />
      )}
    </div>
  );
}

/* ===========================
   Sidebar de Glosario
   =========================== */

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
  const glossaryT = useTranslations("proposals.sidebars.glossary");
  const [promptCfg, setPromptCfg] = React.useState<{
    title: string;
    fields: Field[];
    onConfirm: (values: Record<string, string>) => void;
  } | null>(null);

  const [confirmCfg, setConfirmCfg] = React.useState<{
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div className="card border p-3 space-y-3">
      <div className="heading-bar-sm">{glossaryT("title")}</div>

      {isAdmin && (
        <button
          className="btn-ghost w-full"
          onClick={() =>
            setPromptCfg({
              title: glossaryT("prompts.add.title"),
              fields: [
                {
                  name: "label",
                  label: glossaryT("prompts.add.label"),
                  placeholder: glossaryT("prompts.add.labelPlaceholder"),
                },
                {
                  name: "url",
                  label: glossaryT("prompts.add.url"),
                  placeholder: glossaryT("prompts.add.urlPlaceholder"),
                },
              ],
              onConfirm: ({ label, url }) => {
                const l = (label ?? "").trim();
                const u = (url ?? "").trim();
                if (l && u) addLink(l, u);
                setPromptCfg(null);
              },
            })
          }
        >
          {glossaryT("buttons.add")}
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
                  onClick={() =>
                    setPromptCfg({
                      title: glossaryT("prompts.edit.title"),
                      fields: [
                        {
                          name: "label",
                          label: glossaryT("prompts.edit.label"),
                          initial: g.label,
                        },
                        {
                          name: "url",
                          label: glossaryT("prompts.edit.url"),
                          initial: g.url,
                        },
                      ],
                      onConfirm: ({ label, url }) => {
                        const l = (label ?? "").trim();
                        const u = (url ?? "").trim();
                        if (l && u) editLink(g.id, l, u);
                        setPromptCfg(null);
                      },
                    })
                  }
                >
                  {glossaryT("buttons.edit")}
                </button>
                <button
                  className="text-xs underline text-red-600"
                  onClick={() =>
                    setConfirmCfg({
                      title: glossaryT("confirmations.delete.title"),
                      message: glossaryT("confirmations.delete.message", {
                        label: g.label,
                      }),
                      onConfirm: () => {
                        removeLink(g.id);
                        setConfirmCfg(null);
                      },
                    })
                  }
                >
                  {glossaryT("buttons.delete")}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Modales */}
      {promptCfg && (
        <PromptDialog
          open={!!promptCfg}
          title={promptCfg.title}
          fields={promptCfg.fields}
          onCancel={() => setPromptCfg(null)}
          onConfirm={(v) => promptCfg.onConfirm(v)}
        />
      )}
      {confirmCfg && (
        <ConfirmDialog
          open={!!confirmCfg}
          title={confirmCfg.title}
          message={confirmCfg.message}
          onCancel={() => setConfirmCfg(null)}
          onConfirm={() => confirmCfg.onConfirm()}
        />
      )}

      {glossary.length === 0 && (
        <div className="text-sm text-gray-500">{glossaryT("empty")}</div>
      )}
    </div>
  );
}
