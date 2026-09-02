"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildSummary, nextPrompt } from "@/lib/review";
import { reviewAiProvider } from "@/lib/ai";
import { loadStore, saveStore, type Store } from "@/lib/storage";
import { reminderProvider } from "@/lib/reminders";
import type { Message, Project, ProjectSummary, ReviewDraft } from "@/lib/types";

const id = () => crypto.randomUUID();
const message = (role: Message["role"], content: string): Message => ({ id: id(), role, content, createdAt: new Date().toISOString() });
const label: Record<keyof ProjectSummary, string> = { projectName: "Project name", period: "Period", outcome: "Outcome", wentWell: "What went well", friction: "Problems / friction", rootCauses: "Root causes", learning: "Learning", nextTime: "What to do differently next time", takeaway: "One memorable takeaway" };

export default function Home() {
  const [store, setStore] = useState<Store | null>(null);
  const [projectName, setProjectName] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ProjectSummary | null>(null);
  useEffect(() => setStore(loadStore()), []);
  useEffect(() => { if (store) saveStore(store); }, [store]);

  const activeProject = useMemo(() => store?.projects.find((p) => p.id === activeProjectId), [store, activeProjectId]);
  const draft = useMemo(() => store?.drafts.find((d) => d.projectId === activeProjectId), [store, activeProjectId]);
  if (!store) return <main className="shell"><p className="muted">Loading your quiet space…</p></main>;
  const currentStore: Store = store;

  function createProject(event: FormEvent) { event.preventDefault(); const name = projectName.trim(); if (!name) return; setStore({ ...currentStore, projects: [{ id: id(), name, startedAt: new Date().toISOString(), status: "active" }, ...currentStore.projects] }); setProjectName(""); }
  function complete(project: Project) { const completed = { ...project, status: "completed" as const, completedAt: new Date().toISOString() }; const reminder = reminderProvider().createProjectReview(project.id); setStore({ ...currentStore, projects: currentStore.projects.map((p) => p.id === project.id ? completed : p), reminders: [reminder, ...currentStore.reminders] }); }
  function start(project: Project) { const existing = currentStore.drafts.find((d) => d.projectId === project.id); if (!existing) { const first = message("assistant", nextPrompt("facts")); const draft: ReviewDraft = { id: id(), projectId: project.id, stage: "facts", messages: [first] }; setStore({ ...currentStore, reminders: currentStore.reminders.map((r) => r.projectId === project.id ? { ...r, status: "dismissed" } : r), drafts: [...currentStore.drafts, draft] }); } setActiveProjectId(project.id); setEditing(null); }
  async function send(event: FormEvent) { event.preventDefault(); if (!draft || !text.trim()) return; setBusy(true); setError(""); try { const user = message("user", text.trim()); const response = await reviewAiProvider().reply(draft.stage, [...draft.messages, user]); const assistant = response.message ? message("assistant", response.message) : undefined; const messages = assistant ? [...draft.messages, user, assistant] : [...draft.messages, user]; const summary = response.stage === "summary" && activeProject ? buildSummary(activeProject, messages) : undefined; setStore({ ...currentStore, drafts: currentStore.drafts.map((d) => d.id === draft.id ? { ...d, messages, stage: response.stage, summary } : d) }); setText(""); if (summary) setEditing(summary); } catch { setError("That reply could not be saved. Please try again."); } finally { setBusy(false); } }
  function saveReflection() { if (!draft || !editing) return; setStore({ ...currentStore, reflections: [{ id: id(), projectId: draft.projectId, createdAt: new Date().toISOString(), messages: draft.messages, summary: editing }, ...currentStore.reflections], drafts: currentStore.drafts.filter((d) => d.id !== draft.id) }); setActiveProjectId(null); setEditing(null); }
  const reminders = store.reminders.filter((r) => r.status === "pending");
  return <main className="shell">
    <header><span className="eyebrow">REFLECTION</span><h1>Make the experience useful.</h1><p>One thoughtful conversation after the work is done.</p></header>
    {!activeProject ? <>
      <section className="card"><h2>Start with a project</h2><form onSubmit={createProject} className="row"><input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Launch the new website" aria-label="Project name"/><button>Create project</button></form></section>
      <section><div className="section-heading"><h2>Projects awaiting review</h2><span>{reminders.length}</span></div>{reminders.length ? <div className="stack">{reminders.map((r) => { const p = store.projects.find((x) => x.id === r.projectId); return p ? <article className="item" key={r.id}><div><strong>{p.name}</strong><p>Completed — ready when you are.</p></div><button onClick={() => start(p)}>Reflect</button></article> : null; })}</div> : <p className="empty">When you complete a project, its review will appear here.</p>}</section>
      <section><div className="section-heading"><h2>Active projects</h2><span>{store.projects.filter((p) => p.status === "active").length}</span></div><div className="stack">{store.projects.filter((p) => p.status === "active").map((p) => <article className="item" key={p.id}><div><strong>{p.name}</strong><p>Started {new Date(p.startedAt).toLocaleDateString()}</p></div><button className="quiet" onClick={() => complete(p)}>Mark completed</button></article>)}</div>{!store.projects.some((p) => p.status === "active") && <p className="empty">No active projects yet.</p>}</section>
      <section><div className="section-heading"><h2>Recent reflections</h2><span>{store.reflections.length}</span></div>{store.reflections.slice(0, 3).map((r) => <article className="item" key={r.id}><div><strong>{r.summary.projectName}</strong><p>{r.summary.takeaway}</p></div></article>)}{!store.reflections.length && <p className="empty">Your completed reflections will live here.</p>}</section>
    </> : <section className="review"><button className="back" onClick={() => setActiveProjectId(null)}>← Back</button><span className="eyebrow">PROJECT REVIEW</span><h2>{activeProject?.name}</h2>{!editing ? <><div className="conversation">{draft?.messages.map((m) => <p key={m.id} className={m.role}>{m.content}</p>)}</div>{error && <p className="error">{error}</p>}<form onSubmit={send} className="composer"><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write what comes to mind…" disabled={busy}/><button disabled={busy}>{busy ? "Thinking…" : "Continue"}</button></form></> : <><p className="muted">A draft, based only on what you shared. Edit anything that does not sound right.</p><div className="summary">{(Object.keys(editing) as (keyof ProjectSummary)[]).map((key) => <label key={key}>{label[key]}<textarea value={editing[key]} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}/></label>)}</div><button onClick={saveReflection}>Confirm and save reflection</button></>}</section>}
  </main>;
}
