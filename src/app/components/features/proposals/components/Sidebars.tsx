"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useTranslations } from "@/app/LanguageProvider";
import { toast } from "@/app/components/ui/toast";
import type {
  ProposalActionResult,
  ProposalError,
} from "../lib/errors";

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
  onConfirm: (values: Record<string, string>) => void | Promise<void>;
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
        <div className="flex justify-end gap-3">
          <button className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/20" onClick={onCancel}>{dialogT("cancel")}</button>
          <button
            className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            onClick={() => {
              Promise.resolve(onConfirm(values)).catch((err) => {
                console.error(err);
              });
            }}
          >
            {dialogT("accept")}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-xs font-medium text-slate-700 mb-2">{f.label}</label>
            <input
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
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
  onConfirm: () => void | Promise<void>;
}) {
  const dialogT = useTranslations("proposals.sidebars.dialog");
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex justify-end gap-3">
          <button className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/20" onClick={onCancel}>{dialogT("cancel")}</button>
          <button
            className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400/50"
            onClick={() => {
              Promise.resolve(onConfirm()).catch((err) => {
                console.error(err);
              });
            }}
          >
            {confirmLabel ?? dialogT("confirm")}
          </button>
        </div>
      }
    >
      <div className="text-sm text-slate-700">{message}</div>
    </Modal>
  );
}

type ToggleLabels = { collapse: string; expand: string };

function CollapsibleSidebarCard({
  title,
  labels,
  children,
}: {
  title: string;
  labels: ToggleLabels;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const label = expanded ? labels.collapse : labels.expand;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20 hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={label}
          title={label}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded && <div className="p-4 space-y-3">{children}</div>}
    </div>
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
  addFilial: (title: string) => Promise<ProposalActionResult>;
  editFilialTitle: (id: string, title: string) => Promise<ProposalActionResult>;
  removeFilial: (id: string) => Promise<ProposalActionResult>;
  addCountry: (groupId: string, name: string) => Promise<ProposalActionResult>;
  editCountry: (
    groupId: string,
    oldName: string,
    newName: string
  ) => Promise<ProposalActionResult>;
  removeCountry: (groupId: string, name: string) => Promise<ProposalActionResult>;
}) {
  const filialesT = useTranslations("proposals.sidebars.filiales");
  const errorsT = useTranslations("proposals.errors");
  const [promptCfg, setPromptCfg] = React.useState<{
    title: string;
    fields: Field[];
    onConfirm: (values: Record<string, string>) => void | Promise<void>;
  } | null>(null);

  const [confirmCfg, setConfirmCfg] = React.useState<{
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const resolveError = React.useCallback(
    (error: ProposalError) =>
      error.kind === "message" ? error.message : errorsT(error.code),
    [errorsT]
  );

  const handleResult = React.useCallback(
    (result: ProposalActionResult) => {
      if (!result.ok) {
        toast.error(resolveError(result.error));
      }
      return result.ok;
    },
    [resolveError]
  );

  return (
    <>
      <CollapsibleSidebarCard
        title={filialesT("title")}
        labels={{
          collapse: filialesT("toggle.collapse"),
          expand: filialesT("toggle.expand"),
        }}
      >
        <>
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
                    if (!t) {
                      setPromptCfg(null);
                      return;
                    }
                    return addFilial(t).then((result) => {
                      handleResult(result);
                      setPromptCfg(null);
                    });
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
                              if (!t) {
                                setPromptCfg(null);
                                return;
                              }
                              return editFilialTitle(g.id, t).then((result) => {
                                handleResult(result);
                                setPromptCfg(null);
                              });
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
                              void removeFilial(g.id).then(handleResult);
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
                    const countryId = typeof c === "string" ? undefined : c.id;
                    const key = `${g.id}:${name}`;
                    return (
                      <li key={key} className="flex items-center justify-between">
                        <span>{name}</span>
                        {isAdmin && countryId && (
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
                                    if (!t) {
                                      setPromptCfg(null);
                                      return;
                                    }
                                    return editCountry(g.id, countryId ?? name, t).then(
                                      (result) => {
                                        handleResult(result);
                                        setPromptCfg(null);
                                      }
                                    );
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
                                    void removeCountry(g.id, countryId ?? name).then(
                                      handleResult
                                    );
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
                              if (!n) {
                                setPromptCfg(null);
                                return;
                              }
                              return addCountry(g.id, n).then((result) => {
                                handleResult(result);
                                setPromptCfg(null);
                              });
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
          </div>

          {filiales.length === 0 && (
            <div className="text-sm text-gray-500">{filialesT("empty")}</div>
          )}
        </>
      </CollapsibleSidebarCard>

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
    </>
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
  addLink: (label: string, url: string) => Promise<ProposalActionResult>;
  editLink: (id: string, label: string, url: string) => Promise<ProposalActionResult>;
  removeLink: (id: string) => Promise<ProposalActionResult>;
}) {
  const glossaryT = useTranslations("proposals.sidebars.glossary");
  const errorsT = useTranslations("proposals.errors");
  const [promptCfg, setPromptCfg] = React.useState<{
    title: string;
    fields: Field[];
    onConfirm: (values: Record<string, string>) => void | Promise<void>;
  } | null>(null);

  const [confirmCfg, setConfirmCfg] = React.useState<{
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const resolveError = React.useCallback(
    (error: ProposalError) =>
      error.kind === "message" ? error.message : errorsT(error.code),
    [errorsT]
  );

  const handleResult = React.useCallback(
    (result: ProposalActionResult) => {
      if (!result.ok) {
        toast.error(resolveError(result.error));
      }
      return result.ok;
    },
    [resolveError]
  );

  return (
    <>
      <CollapsibleSidebarCard
        title={glossaryT("title")}
        labels={{
          collapse: glossaryT("toggle.collapse"),
          expand: glossaryT("toggle.expand"),
        }}
      >
        <>
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
                    if (!l || !u) {
                      setPromptCfg(null);
                      return;
                    }
                    return addLink(l, u).then((result) => {
                      handleResult(result);
                      setPromptCfg(null);
                    });
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
                            if (!l || !u) {
                              setPromptCfg(null);
                              return;
                            }
                            return editLink(g.id, l, u).then((result) => {
                              handleResult(result);
                              setPromptCfg(null);
                            });
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
                            void removeLink(g.id).then(handleResult);
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

          {glossary.length === 0 && (
            <div className="text-sm text-gray-500">{glossaryT("empty")}</div>
          )}
        </>
      </CollapsibleSidebarCard>

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
    </>
  );
}
