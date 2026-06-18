# Forge

**A no-code AI app builder for non-technical teams.** Drag widgets onto a canvas, wire them together with plain-language prompts, preview the result, and ship a working AI tool — no engineering ticket required.

> Status: active build, Phase 4 of 5 complete. See [`docs/project-status.md`](docs/project-status.md) for the detailed feature matrix and [`docs/case-study-notes.md`](docs/case-study-notes.md) for the design narrative.

---

## What Forge Is

Forge lets a marketing, support, ops, or product teammate build a small AI-powered web app — an FAQ chatbot, a lead qualifier, a product description generator — by:

1. Dropping widgets onto a canvas
2. Filling in plain-language properties (no JSON, no schema, no "nodes")
3. Referencing other widgets' values inside a prompt
4. Previewing the live result
5. Publishing it

The mental model sits between Retool/Appsmith (visual builder) and a workflow tool (AI-native), but trimmed down to exactly what a non-technical user needs.

## Problem Statement

Non-technical teams constantly want small, focused AI tools — a chatbot that answers FAQs, a generator that writes product descriptions, a form that scores leads — but building even a simple one today means either:

- Filing a ticket with engineering and waiting in a backlog for something that should take an afternoon, or
- Wrestling with a general-purpose no-code platform (Retool, Appsmith) that exposes databases, APIs, and technical concepts the user was never trained on.

Forge's bet: most of these tools don't need a database connection or a REST API panel. They need a handful of widget types, a way to reference one widget's value from another, and a connection to a real LLM. Strip everything else away.

## Target Users

Non-technical teammates in marketing, support, operations, and product roles who want to self-serve a small AI tool. They are comfortable with spreadsheets and SaaS dashboards, not with code, JSON, or API documentation. Example apps they'd build:

- FAQ chatbot
- Lead qualifier
- Product description generator
- Social caption generator
- Image prompt generator
- Internal workflow assistant
- Learning assistant

## Current Features

| Area | Status |
|---|---|
| Dashboard, My Apps, Discover (template gallery) | Built, seeded with mock data |
| Builder canvas — add/drag/select/delete widgets | Built |
| Widget properties panel | Built, per-widget-type fields |
| Prompt reference system (`{{widget.value}}`) | Built |
| Validation + publish-readiness checklist | Built |
| Preview mode | Built |
| **Text Generator widget → real Gemini API** | Built — server-side route, model fallback chain, mock fallback |
| Image Generator, Chat Box widgets | Polished mock only (no real API calls yet) |
| Auth, onboarding, database, multi-app persistence, real publish | Not yet built |

Full detail in [`docs/project-status.md`](docs/project-status.md).

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript** throughout
- **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`)
- **Google Gemini API** (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash` fallback chain) for real text generation, called server-side only
- **localStorage** for persistence (no database yet)

Planned but not yet introduced: React Flow (canvas), Zustand (global state), Radix UI, Zod, Supabase/PostgreSQL — see [`docs/architecture.md`](docs/architecture.md) for why the current canvas is hand-built instead.

## AI Integration Flow

The Text Generator widget is the one widget connected to a real model:

1. In Preview mode, the user clicks **Generate**.
2. The client resolves `{{widgetId.value}}` tokens in the prompt against live widget values (see Prompt Reference System below).
3. The resolved prompt is POSTed to `/api/generate-text` — a server-only Next.js route handler.
4. The route reads `GEMINI_API_KEY` from the server environment (never sent to the browser) and calls Google's Gemini API directly via `fetch` — no SDK installed.
5. It tries three models in order (cheapest/most available first); if one returns a quota error, blocked content, or an empty response, it tries the next.
6. If no key is configured, or all three models fail, the route returns the same polished mock copy the UI always had — so the app works identically with or without a live key.
7. The UI shows a small label ("Generated with Gemini" / "Mock output") and a friendly notice if Gemini failed and the mock kicked in, so the degradation is never silent or confusing.

## Prompt Reference System

Instead of visual wires between widgets (React Flow edges), Forge widgets reference each other through plain tokens inside prompt text: `{{widgetId.value}}`. At generate-time:

- An unresolved/unknown widget ID → replaced with `[missing: id]` and a warning shown to the user.
- A known but empty input → replaced with `""` and a warning naming the widget ("Enter a value in 'Product Name' before generating.").
- A resolved value → substituted directly.

A separate validator (`lib/validateApp.ts`) catches dangling references and missing prompts *before* generation, surfaced as a readiness indicator and checklist in the builder — so users see problems while editing, not just when something breaks at runtime.

## Screenshots

> _Placeholder — add real screenshots/GIFs here once the builder UI is final._

- [ ] Dashboard
- [ ] My Apps
- [ ] Discover / template gallery
- [ ] Builder canvas (widget palette open)
- [ ] Properties panel (Text Generator widget selected)
- [ ] Preview mode — real Gemini output
- [ ] Preview mode — mock fallback notice

Early design references (not final screenshots) live in `docs/reference wireframes/`.

## Setup Instructions

```bash
# Install dependencies
npm install

# (Optional) enable real AI generation — without this, the app uses mock output
cp .env.local.example .env.local
# then add your Gemini API key, free at https://aistudio.google.com/apikey
# GEMINI_API_KEY=your-key-here

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/dashboard` (there is currently no login screen — see Known Limitations).

```bash
npm run lint        # ESLint
npx tsc --noEmit     # Type-check
```

## Known Limitations

- No auth or onboarding flow — a single mock user is hardcoded.
- The builder persists a single global draft to `localStorage`, not per-app — the `[appId]` route segment exists but is currently ignored.
- My Apps and Discover render seeded mock data, not real saved apps.
- Publish is a placeholder checklist modal, not a real status change.
- Image Generator and Chat Box are fully mocked — no real API calls.

Full list with context in [`docs/project-status.md`](docs/project-status.md).

## Future Improvements

- Multi-app persistence keyed by `appId`
- Real publish flow (status flip, appears in My Apps → Published)
- Login/onboarding pages
- Connect Image Generator and Chat Box to real APIs
- Supabase/PostgreSQL backend + real auth (Phase 5)

See [`docs/project-status.md`](docs/project-status.md) for the full roadmap and [`docs/case-study-notes.md`](docs/case-study-notes.md) for the reasoning behind current trade-offs.
