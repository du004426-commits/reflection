import type { Project, Reflection, ReviewDraft, ReviewReminder } from "@/lib/types";
const KEY = "reflection-v1";
export type Store = { projects: Project[]; reminders: ReviewReminder[]; drafts: ReviewDraft[]; reflections: Reflection[] };
const empty: Store = { projects: [], reminders: [], drafts: [], reflections: [] };
export function loadStore(): Store { if (typeof window === "undefined") return empty; try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty; } }
export function saveStore(store: Store) { localStorage.setItem(KEY, JSON.stringify(store)); }
