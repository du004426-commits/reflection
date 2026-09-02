# Reflection

Reflection is an AI conversational reflection assistant: a quiet place to turn completed work into experience.

## V1: Project Review vertical slice

This first milestone deliberately implements one complete loop:

1. Create a project.
2. Mark it completed to create an immediate review reminder.
3. Start a five-step conversational review: facts → evaluation → causes → insight → transfer.
4. Receive a structured, editable summary.
5. Confirm it to save a reflection.

Data is persisted in browser `localStorage` for this MVP, so it can be tried without a database or account. The UI includes loading, empty, error, and mobile states.

## Architecture

- `app/` — Next.js UI and application shell.
- `lib/types.ts` — the domain model.
- `lib/review.ts` — review flow and evidence-safe summary assembly.
- `lib/ai.ts` — replaceable `ReviewAiProvider`; V1 uses a local guided provider.
- `lib/reminders.ts` — replaceable `ReminderProvider`; V1 creates in-app review reminders.
- `lib/storage.ts` — replaceable browser persistence adapter.

No API key is embedded in source. See `.env.example` for optional AI-provider configuration; provider wiring is intentionally kept separate from the review domain.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Next suggested increments

1. Add an authenticated database and server-side project/reflection repository.
2. Replace the guided local provider with a real structured-output AI provider.
3. Add snooze/reschedule and scheduled weekly-review reminders.
4. Build weekly then monthly synthesis over confirmed reflections.
5. Add evidence-backed, confidence-scored long-term memories.
