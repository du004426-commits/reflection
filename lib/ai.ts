import { nextPrompt, nextStage } from "@/lib/review";
import type { Message, ReviewStage } from "@/lib/types";

export interface ReviewAiProvider { reply(stage: ReviewStage, messages: Message[]): Promise<{ stage: ReviewStage; message: string }>; }
export class LocalGuidedReviewProvider implements ReviewAiProvider {
  async reply(stage: ReviewStage) { const next = nextStage(stage); return { stage: next, message: next === "summary" ? "Thank you. I have enough to draft a reflection. Please review it and make it yours." : nextPrompt(next) }; }
}
export function reviewAiProvider(): ReviewAiProvider { return new LocalGuidedReviewProvider(); }
