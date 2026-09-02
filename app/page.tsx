"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildSummary, nextPrompt } from "@/lib/review";
import { reviewAiProvider } from "@/lib/ai";
import { loadStore, saveStore, type Store } from "@/lib/storage";
import { reminderProvider } from "@/lib/reminders";
import type { Message, Project, ProjectSummary, ReflectionCadence, ReviewDraft } from "@/lib/types";

const id = () => crypto.randomUUID();
const message = (role: Message["role"], content: string): Message => ({ id: id(), role, content, createdAt: new Date().toISOString() });
const label: Record<keyof ProjectSummary, string> = { projectName: "项目名称", period: "时间段", outcome: "发生了什么", wentWell: "做得不错的地方", friction: "阻力与摩擦", rootCauses: "可能的原因", feelings: "感受与观察", emergingPattern: "正在浮现的模式", learning: "关键认识", nextTime: "下次的小实验", takeaway: "一句值得记住的话" };
const cadenceLabel: Record<ReflectionCadence, string> = { daily: "每天", weekly: "每周", biweekly: "每两周" };
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }) : "未安排";

export default function Home() {
  const [store, setStore] = useState<Store | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [projectType, setProjectType] = useState("");
  const [amount, setAmount] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [cadence, setCadence] = useState<ReflectionCadence>("weekly");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ProjectSummary | null>(null);
  useEffect(() => setStore(loadStore()), []);
  useEffect(() => { if (store) saveStore(store); }, [store]);

  const activeProject = useMemo(() => store?.projects.find((p) => p.id === activeProjectId), [store, activeProjectId]);
  const draft = useMemo(() => store?.drafts.find((d) => d.projectId === activeProjectId), [store, activeProjectId]);
  if (!store) return <main className="shell"><p className="muted">正在打开你的反思空间…</p></main>;
  const currentStore: Store = store;
  const completionReminders = store.reminders.filter((r) => r.status === "pending" && r.kind !== "check_in");
  const checkIns = store.reminders.filter((r) => r.status === "pending" && r.kind === "check_in");

  function createProject(event: FormEvent) {
    event.preventDefault(); const name = projectName.trim(); if (!name) return;
    const projectId = id(); const reminder = reminderProvider().createCheckIn(projectId, cadence);
    const project: Project = { id: projectId, name, startedAt: new Date().toISOString(), status: "active", chatgptProjectUrl: projectLink.trim() || undefined, reflectionCadence: cadence, nextCheckIn: reminder.dueAt, clientName: clientName.trim() || undefined, companyName: companyName.trim() || undefined, companyType: companyType.trim() || undefined, projectType: projectType.trim() || undefined, amount: amount.trim() || undefined, progress: 0, nextAction: nextAction.trim() || undefined, nextActionAt: nextActionAt || undefined };
    setStore({ ...currentStore, projects: [project, ...currentStore.projects], reminders: [reminder, ...currentStore.reminders] }); setProjectName(""); setProjectLink(""); setClientName(""); setCompanyName(""); setCompanyType(""); setProjectType(""); setAmount(""); setNextAction(""); setNextActionAt("");
  }
  function complete(project: Project) {
    const completed = { ...project, status: "completed" as const, completedAt: new Date().toISOString(), nextCheckIn: undefined }; const reminder = reminderProvider().createProjectReview(project.id);
    setStore({ ...currentStore, projects: currentStore.projects.map((p) => p.id === project.id ? completed : p), reminders: [reminder, ...currentStore.reminders.map((r) => r.projectId === project.id ? { ...r, status: "dismissed" as const } : r)] });
  }
  function start(project: Project) {
    const existing = currentStore.drafts.find((d) => d.projectId === project.id);
    if (!existing) { const first = message("assistant", nextPrompt("facts")); const newDraft: ReviewDraft = { id: id(), projectId: project.id, stage: "facts", messages: [first] }; setStore({ ...currentStore, reminders: currentStore.reminders.map((r) => r.projectId === project.id ? { ...r, status: "dismissed" as const } : r), drafts: [...currentStore.drafts, newDraft] }); }
    setActiveProjectId(project.id); setEditing(null);
  }
  function updateProject(projectId: string, changes: Partial<Project>) { setStore({ ...currentStore, projects: currentStore.projects.map((project) => project.id === projectId ? { ...project, ...changes } : project) }); }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!draft || !text.trim()) return; setBusy(true); setError("");
    try { const user = message("user", text.trim()); const response = await reviewAiProvider().reply(draft.stage, [...draft.messages, user]); const assistant = response.message ? message("assistant", response.message) : undefined; const messages = assistant ? [...draft.messages, user, assistant] : [...draft.messages, user]; const summary = response.stage === "summary" && activeProject ? buildSummary(activeProject, messages) : undefined; setStore({ ...currentStore, drafts: currentStore.drafts.map((d) => d.id === draft.id ? { ...d, messages, stage: response.stage, summary } : d) }); setText(""); if (summary) setEditing(summary); }
    catch { setError("这条回复没有保存成功，请再试一次。"); } finally { setBusy(false); }
  }
  function saveReflection() {
    if (!draft || !editing || !activeProject) return;
    const cadenceToUse = activeProject.reflectionCadence || "weekly"; const nextReminder = activeProject.status === "active" ? reminderProvider().createCheckIn(activeProject.id, cadenceToUse) : undefined;
    setStore({ ...currentStore, reflections: [{ id: id(), projectId: draft.projectId, createdAt: new Date().toISOString(), messages: draft.messages, summary: editing }, ...currentStore.reflections], drafts: currentStore.drafts.filter((d) => d.id !== draft.id), reminders: nextReminder ? [nextReminder, ...currentStore.reminders] : currentStore.reminders, projects: currentStore.projects.map((p) => p.id === activeProject.id && nextReminder ? { ...p, nextCheckIn: nextReminder.dueAt } : p) });
    setActiveProjectId(null); setEditing(null);
  }

  return <main className="shell">
    <header><span className="eyebrow">REFLECTION</span><h1>让经历留下来。</h1><p>不急着评价自己。先聊一聊，再找到下一步。</p></header>
    {!activeProject ? <>
      <section className="card"><h2>开始跟进一个项目</h2><p className="muted">项目档案让反思不只停留在感受，也能回到客户、金额、进度和具体下一步。</p><form onSubmit={createProject} className="project-form">
        <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="项目名称，例如：新网站上线" aria-label="项目名称"/>
        <div className="form-grid"><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="客户联系人（可选）"/><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="客户公司（可选）"/></div>
        <div className="form-grid"><input value={companyType} onChange={(e) => setCompanyType(e.target.value)} placeholder="公司类型，例如：品牌方／SaaS"/><input value={projectType} onChange={(e) => setProjectType(e.target.value)} placeholder="项目类别，例如：咨询／设计"/></div>
        <div className="form-grid"><input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="项目金额，例如：¥50,000"/><input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="下一步行动（可选）"/></div>
        <input value={nextActionAt} onChange={(e) => setNextActionAt(e.target.value)} aria-label="下一步日期" type="date"/>
        <input value={projectLink} onChange={(e) => setProjectLink(e.target.value)} placeholder="可选：粘贴 ChatGPT 项目链接" aria-label="ChatGPT 项目链接" type="url"/>
        <div className="row"><select value={cadence} onChange={(e) => setCadence(e.target.value as ReflectionCadence)} aria-label="反思频率"><option value="daily">每天一次短 Check-in</option><option value="weekly">每周一次深度反思</option><option value="biweekly">每两周一次深度反思</option></select><button>开始跟进</button></div>
      </form></section>
      <section><div className="section-heading"><h2>等待完成复盘</h2><span>{completionReminders.length}</span></div>{completionReminders.length ? <div className="stack">{completionReminders.map((r) => { const p = store.projects.find((x) => x.id === r.projectId); return p ? <article className="item" key={r.id}><div><strong>{p.name}</strong><p>项目已完成，适合停下来回顾一下。</p></div><button onClick={() => start(p)}>开始复盘</button></article> : null; })}</div> : <p className="empty">完成项目后，最终复盘会出现在这里。</p>}</section>
      <section><div className="section-heading"><h2>下一次 Check-in</h2><span>{checkIns.length}</span></div>{checkIns.length ? <div className="stack">{checkIns.map((r) => { const p = store.projects.find((x) => x.id === r.projectId); return p ? <article className="item" key={r.id}><div><strong>{p.name}</strong><p>{formatDate(r.dueAt)} · {cadenceLabel[p.reflectionCadence || "weekly"]}反思</p></div><button className="quiet" onClick={() => start(p)}>现在聊聊</button></article> : null; })}</div> : <p className="empty">建立项目后，会在这里看到下一次反思安排。</p>}</section>
      <section><div className="section-heading"><h2>进行中的项目</h2><span>{store.projects.filter((p) => p.status === "active").length}</span></div><div className="stack">{store.projects.filter((p) => p.status === "active").map((p) => <article className="item project-item" key={p.id}><div className="project-copy"><strong>{p.name}</strong><p>{[p.companyName, p.companyType, p.projectType, p.amount].filter(Boolean).join(" · ") || "尚未补充客户与项目档案"}</p><p>下一步：{p.nextAction || "未填写"}{p.nextActionAt && ` · ${formatDate(p.nextActionAt)}`}{p.chatgptProjectUrl && <> · <a href={p.chatgptProjectUrl} target="_blank" rel="noreferrer">打开 ChatGPT 项目</a></>}</p><div className="progress-row"><span>进度 {p.progress || 0}%</span><input type="range" min="0" max="100" value={p.progress || 0} onChange={(event) => updateProject(p.id, { progress: Number(event.target.value) })}/></div></div><div className="actions"><button className="quiet" onClick={() => start(p)}>Check-in</button><button className="quiet" onClick={() => complete(p)}>标记完成</button></div></article>)}</div>{!store.projects.some((p) => p.status === "active") && <p className="empty">还没有进行中的项目。</p>}</section>
      <section><div className="section-heading"><h2>最近的反思记录</h2><span>{store.reflections.length}</span></div>{store.reflections.slice(0, 3).map((r) => <article className="item" key={r.id}><div><strong>{r.summary.projectName}</strong><p>{r.summary.takeaway}</p></div></article>)}{!store.reflections.length && <p className="empty">完成的反思会沉淀在这里。</p>}</section>
    </> : <section className="review"><button className="back" onClick={() => setActiveProjectId(null)}>← 返回</button><span className="eyebrow">{activeProject?.status === "completed" ? "项目复盘" : "项目 CHECK-IN"}</span><h2>{activeProject?.name}</h2>{!editing ? <><p className="muted">一次只问一个问题。你可以简短回答，也可以从最想说的地方开始。</p><div className="conversation">{draft?.messages.map((m) => <p key={m.id} className={m.role}>{m.content}</p>)}</div>{error && <p className="error">{error}</p>}<form onSubmit={send} className="composer"><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="写下此刻最真实的想法…" disabled={busy}/><button disabled={busy}>{busy ? "整理中…" : "继续"}</button></form></> : <><p className="muted">这是一份基于你刚才表达的草稿。只保留你认同的内容，任何字段都可以改。</p><div className="summary">{(Object.keys(editing) as (keyof ProjectSummary)[]).map((key) => <label key={key}>{label[key]}<textarea value={editing[key]} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}/></label>)}</div><button onClick={saveReflection}>确认并保存反思</button></>}</section>}
  </main>;
}
