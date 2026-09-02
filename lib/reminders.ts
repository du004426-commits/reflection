import type { ReviewReminder } from "@/lib/types";
export interface ReminderProvider { createProjectReview(projectId: string): ReviewReminder; }
export class LocalReminderProvider implements ReminderProvider { createProjectReview(projectId: string): ReviewReminder { return { id: crypto.randomUUID(), projectId, dueAt: new Date().toISOString(), status: "pending" }; } }
export const reminderProvider = (): ReminderProvider => new LocalReminderProvider();
