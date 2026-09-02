import type { Message, Project, ProjectSummary, ReviewStage } from "./types";

export const stages: ReviewStage[] = ["facts", "evaluation", "friction", "causes", "feelings", "pattern", "insight", "transfer", "summary"];
const prompts: Record<Exclude<ReviewStage, "summary">, string> = {
  facts: "先不急着判断：最近这个项目发生了什么？从一个具体场景或变化说起就好。",
  evaluation: "其中哪一件事做得不错，或者比你预期更有价值？",
  friction: "最近最让你卡住、消耗或反复拖延的一个地方是什么？",
  causes: "你猜它背后有哪些条件或原因？这只是暂时假设，不需要马上下结论。",
  feelings: "这段经历让你有什么感受或身体上的信号？例如兴奋、焦虑、疲惫，或意外地平静。",
  pattern: "它和你过去做项目时的某个习惯或模式有相似之处吗？如果没有也完全没关系。",
  insight: "如果只留下一条对未来有帮助的认识，你想记住什么？",
  transfer: "接下来你愿意试一个多小的不同做法？最好是下一次就能验证的。"
};
export function nextStage(stage: ReviewStage): ReviewStage { return stages[Math.min(stages.indexOf(stage) + 1, stages.length - 1)]; }
export function nextPrompt(stage: ReviewStage) { return stage === "summary" ? "" : prompts[stage]; }
function answer(messages: Message[], index: number) { return messages.filter((m) => m.role === "user")[index]?.content.trim() || "Not captured yet."; }
export function buildSummary(project: Project, messages: Message[]): ProjectSummary {
  const start = new Date(project.startedAt).toLocaleDateString();
  const end = project.completedAt ? new Date(project.completedAt).toLocaleDateString() : "present";
  const facts = answer(messages, 0); const positive = answer(messages, 1); const friction = answer(messages, 2); const causes = answer(messages, 3); const feelings = answer(messages, 4); const pattern = answer(messages, 5); const learning = answer(messages, 6); const nextTime = answer(messages, 7);
  return { projectName: project.name, period: `${start} – ${end}`, outcome: facts, wentWell: positive, friction, rootCauses: causes, feelings, emergingPattern: pattern, learning, nextTime, takeaway: learning };
}
