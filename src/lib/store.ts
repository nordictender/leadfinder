import { useSyncExternalStore } from "react";
import type { Company } from "./cvr/types";
import type { SearchFilters } from "./search";

/**
 * Lokal lagring (browserens localStorage) af ringelister, ring-ikke-liste og gemte søgninger.
 * Udskiftes med en database, når der kommer login og teams.
 */
export type Outcome = "ny" | "ingen_svar" | "ring_tilbage" | "interesseret" | "moede" | "nej_tak" | "forkert_nr";

export const OUTCOMES: { id: Outcome; label: string; done: boolean }[] = [
  { id: "ny", label: "Ikke ringet", done: false },
  { id: "ingen_svar", label: "Intet svar", done: false },
  { id: "ring_tilbage", label: "Ring tilbage", done: false },
  { id: "interesseret", label: "Interesseret", done: false },
  { id: "moede", label: "Møde booket", done: true },
  { id: "nej_tak", label: "Nej tak", done: true },
  { id: "forkert_nr", label: "Forkert nummer", done: true },
];

export type Lead = {
  company: Company;
  outcome: Outcome;
  note: string;
  followUp: string | null;
  attempts: number;
  lastCallAt: string | null;
  history: { at: string; outcome: Outcome; note: string }[];
};

export type CallList = { id: string; name: string; createdAt: string; leads: Lead[]; pitch?: string };
export type SavedSearch = { id: string; name: string; filters: SearchFilters; createdAt: string };

export type Profile = { description: string; icp: import("./icp").Icp | null; updatedAt: string };
type State = { lists: CallList[]; activeListId: string | null; doNotCall: string[]; savedSearches: SavedSearch[]; profile: Profile | null };

const KEY = "leadfinder:v1";
const EMPTY: State = { lists: [], activeListId: null, doNotCall: [], savedSearches: [], profile: null };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    state = EMPTY;
  }
}

function set(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* fuld eller blokeret lagring — behold i hukommelsen */
  }
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (load(), state),
    () => EMPTY,
  );
}

const id = () => Math.random().toString(36).slice(2, 10);

export function newLead(company: Company): Lead {
  return { company, outcome: "ny", note: "", followUp: null, attempts: 0, lastCallAt: null, history: [] };
}

export function createList(name: string, companies: Company[] = [], pitch?: string): string {
  load();
  const list: CallList = { id: id(), name, createdAt: new Date().toISOString(), leads: companies.map(newLead), ...(pitch ? { pitch } : {}) };
  set({ ...state, lists: [list, ...state.lists], activeListId: list.id });
  return list.id;
}

export function setActiveList(listId: string) {
  set({ ...state, activeListId: listId });
}

export function deleteList(listId: string) {
  const lists = state.lists.filter((l) => l.id !== listId);
  set({ ...state, lists, activeListId: state.activeListId === listId ? (lists[0]?.id ?? null) : state.activeListId });
}

/** Tilføjer virksomheder til en liste. Springer dubletter over. Returnerer antal tilføjede. */
export function addToList(listId: string, companies: Company[]): number {
  load();
  let added = 0;
  const lists = state.lists.map((l) => {
    if (l.id !== listId) return l;
    const have = new Set(l.leads.map((x) => x.company.cvr));
    const fresh = companies.filter((c) => !have.has(c.cvr) && (have.add(c.cvr), true)).map(newLead);
    added = fresh.length;
    return { ...l, leads: [...l.leads, ...fresh] };
  });
  set({ ...state, lists });
  return added;
}

export function updateLead(listId: string, cvr: string, patch: Partial<Omit<Lead, "company" | "history">>, logCall = false) {
  const now = new Date().toISOString();
  const lists = state.lists.map((l) =>
    l.id !== listId
      ? l
      : {
          ...l,
          leads: l.leads.map((lead) => {
            if (lead.company.cvr !== cvr) return lead;
            const next = { ...lead, ...patch };
            if (logCall) {
              next.attempts = lead.attempts + 1;
              next.lastCallAt = now;
              next.history = [...lead.history, { at: now, outcome: next.outcome, note: next.note }];
            }
            return next;
          }),
        },
  );
  set({ ...state, lists });
}

export function removeLead(listId: string, cvr: string) {
  set({ ...state, lists: state.lists.map((l) => (l.id !== listId ? l : { ...l, leads: l.leads.filter((x) => x.company.cvr !== cvr) })) });
}

export function addDoNotCall(cvrs: string[]) {
  load();
  set({ ...state, doNotCall: [...new Set([...state.doNotCall, ...cvrs])] });
}

export function removeDoNotCall(cvr: string) {
  set({ ...state, doNotCall: state.doNotCall.filter((x) => x !== cvr) });
}

export function saveSearch(name: string, filters: SearchFilters) {
  load();
  set({ ...state, savedSearches: [{ id: id(), name, filters, createdAt: new Date().toISOString() }, ...state.savedSearches] });
}

export function deleteSavedSearch(searchId: string) {
  set({ ...state, savedSearches: state.savedSearches.filter((s) => s.id !== searchId) });
}

/** Næste lead i ringekøen: forfaldne opfølgninger først, så nye, så "intet svar" med færrest forsøg. */
export function nextLead(leads: readonly Lead[], now = new Date()): Lead | null {
  const today = now.toISOString().slice(0, 10);
  const open = leads.filter((l) => !OUTCOMES.find((o) => o.id === l.outcome)?.done);
  const due = open.filter((l) => l.followUp && l.followUp <= today).sort((a, b) => a.followUp!.localeCompare(b.followUp!));
  if (due[0]) return due[0];
  const fresh = open.find((l) => l.outcome === "ny");
  if (fresh) return fresh;
  const retry = open.filter((l) => l.outcome === "ingen_svar" || (l.outcome !== "ny" && !l.followUp)).sort((a, b) => a.attempts - b.attempts);
  return retry[0] ?? null;
}

export function saveProfile(profile: Profile) {
  load();
  set({ ...state, profile });
}

/** Filtre + replik der skal åbnes på søgesiden (overføres i hukommelsen ved navigation). */
let pending: { filters: SearchFilters; name: string; pitch: string } | null = null;
export function setPendingSegment(p: typeof pending) {
  pending = p;
}
export function takePendingSegment() {
  const p = pending;
  pending = null;
  return p;
}
