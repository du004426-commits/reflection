# Reflection

Reflection is an AI conversational reflection assistant: a quiet place to turn completed work into experience.

## V1: Project Review vertical slice

This first milestone deliberately implements one complete loop:

1. Create a project.
2. Mark it completed to create an immediate review reminder.
3. Start a five-step conversational review: facts → evaluation → causes → insight → transfer.
4. Receive a structured, editable summary.
5. Confirm it to save a reflection.

## Continuous check-ins (current)

Projects can now be followed while they are still active:

- Choose a daily, weekly, or biweekly reflection cadence.
- Save an optional ChatGPT Project link for one-click context switching.
- Start a check-in at any time; after confirming it, the next check-in is scheduled.
- Use an eight-question Chinese conversation that moves through facts, wins, friction, tentative causes, feelings, patterns, insight, and a small next experiment.

The ChatGPT Project link is deliberately manual. The app does not read or sync your private ChatGPT conversations.

## Project profile and tracking

Each project can include a client contact, client company and type, project category, amount, next action and due date. Active projects expose a persistent progress control (0–100%) alongside their next reflection. These fields are intentionally optional so a quick personal project remains lightweight.

Notion is connected in the assistant workspace, but the web app does not yet automatically synchronize to Notion or a calendar. That requires a server-side OAuth integration and an explicit destination database/calendar.

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
