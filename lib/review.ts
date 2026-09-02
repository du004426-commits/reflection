import type { Message, Project, ProjectSummary, ReviewStage } from "./types";

export const stages: ReviewStage[] = ["facts", "evaluation", "causes", "insight", "transfer", "summary"];
const prompts: Record<Exclude<ReviewStage, "summary">, string> = {
  facts: "What happened during this project? Start wherever feels most useful.",
  evaluation: "Looking back, what went especially well — or had the strongest positive effect?",
  causes: "Where did things feel difficult or slower than they needed to be? What might have contributed?",
  insight: "What did this experience teach you that you would want to remember?",
  transfer: "If you met a similar project again, what would you try differently?"
};
export function nextStage(stage: ReviewStage): ReviewStage { return stages[Math.min(stages.indexOf(stage) + 1, stages.length - 1)]; }
export function nextPrompt(stage: ReviewStage) { return stage === "summary" ? "" : prompts[stage]; }
function answer(messages: Message[], index: number) { return messages.filter((m) => m.role === "user")[index]?.content.trim() || "Not captured yet."; }
export function buildSummary(project: Project, messages: Message[]): ProjectSummary {
  const start = new Date(project.startedAt).toLocaleDateString();
  const end = project.completedAt ? new Date(project.completedAt).toLocaleDateString() : "present";
  const facts = answer(messages, 0); const positive = answer(messages, 1); const friction = answer(messages, 2); const learning = answer(messages, 3); const nextTime = answer(messages, 4);
  return { projectName: project.name, period: `${start} – ${end}`, outcome: facts, wentWell: positive, friction, rootCauses: `A hypothesis to revisit: ${friction}`, learning, nextTime, takeaway: learning };
}
