import type { ProposalRecord, UserEntry } from "./types";

// Re-exporta los tipos para poder importarlos desde "./lib/storage"
export type { ProposalRecord, UserEntry } from "./types";

const LS_USERS = "wcx_users_v2";
const LS_PROPOSALS = "wcx_proposals_v2";
const LS_FILIALES = "wcx_filiales_v1";
const LS_GLOSSARY = "wcx_glossary_v1";

/** Parseo seguro con tipado genérico para evitar any implícitos */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- usuarios / propuestas ----
export function saveUser(entry: UserEntry) {
  try {
    const list = safeParse<UserEntry[]>(localStorage.getItem(LS_USERS), []);
    if (!list.some((u) => u.email === entry.email)) {
      list.push(entry);
      localStorage.setItem(LS_USERS, JSON.stringify(list));
    }
  } catch {
    /* noop */
  }
}

export function readUsers(): UserEntry[] {
  try {
    return safeParse<UserEntry[]>(localStorage.getItem(LS_USERS), []);
  } catch {
    return [];
  }
}

export function saveProposal(p: ProposalRecord) {
  try {
    const list = safeParse<ProposalRecord[]>(localStorage.getItem(LS_PROPOSALS), []);
    list.push(p);
    localStorage.setItem(LS_PROPOSALS, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export function readProposals(): ProposalRecord[] {
  try {
    return safeParse<ProposalRecord[]>(localStorage.getItem(LS_PROPOSALS), []);
  } catch {
    return [];
  }
}

// ---- filiales & glosario (side panels) ----
export type FilialGroup = { id: string; title: string; countries: string[] };
export type GlossaryLink = { id: string; label: string; url: string };

export function readFiliales(): FilialGroup[] {
  try {
    return safeParse<FilialGroup[]>(localStorage.getItem(LS_FILIALES), []);
  } catch {
    return [];
  }
}

export function saveFiliales(list: FilialGroup[]) {
  try {
    localStorage.setItem(LS_FILIALES, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export function readGlossary(): GlossaryLink[] {
  try {
    return safeParse<GlossaryLink[]>(localStorage.getItem(LS_GLOSSARY), []);
  } catch {
    return [];
  }
}

export function saveGlossary(list: GlossaryLink[]) {
  try {
    localStorage.setItem(LS_GLOSSARY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}
