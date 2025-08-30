import type { ProposalRecord, UserEntry } from "./types";

const LS_USERS = "wcx_users_v2";
const LS_PROPOSALS = "wcx_proposals_v2";

export function saveUser(entry: UserEntry) {
  try {
    const raw = localStorage.getItem(LS_USERS);
    const list: UserEntry[] = raw ? JSON.parse(raw) : [];
    if (!list.some(u => u.email === entry.email)) {
      list.push(entry);
      localStorage.setItem(LS_USERS, JSON.stringify(list));
    }
  } catch {}
}
export function readUsers(): UserEntry[] {
  try {
    const raw = localStorage.getItem(LS_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProposal(p: ProposalRecord) {
  try {
    const raw = localStorage.getItem(LS_PROPOSALS);
    const list: ProposalRecord[] = raw ? JSON.parse(raw) : [];
    list.push(p);
    localStorage.setItem(LS_PROPOSALS, JSON.stringify(list));
  } catch {}
}
export function readProposals(): ProposalRecord[] {
  try {
    const raw = localStorage.getItem(LS_PROPOSALS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
