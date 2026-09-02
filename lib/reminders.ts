import type { ReflectionCadence, ReviewReminder } from "@/lib/types";
export interface ReminderProvider { createProjectReview(projectId: string): ReviewReminder; createCheckIn(projectId: string, cadence: ReflectionCadence): ReviewReminder; }
const daysFor = (cadence: ReflectionCadence) => cadence === "daily" ? 1 : cadence === "biweekly" ? 14 : 7;
export class LocalReminderProvider implements ReminderProvider {
  createProjectReview(projectId: string): ReviewReminder { return { id: crypto.randomUUID(), projectId, dueAt: new Date().toISOString(), status: "pending", kind: "completion" }; }
  createCheckIn(projectId: string, cadence: ReflectionCadence): ReviewReminder { const due = new Date(); due.setDate(due.getDate() + daysFor(cadence)); return { id: crypto.randomUUID(), projectId, dueAt: due.toISOString(), status: "pending", kind: "check_in" }; }
}
export const reminderProvider = (): ReminderProvider => new LocalReminderProvider();
