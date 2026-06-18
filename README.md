# Forge

**A no-code AI app builder for non-technical teams.** Drag widgets onto a canvas, wire them together with plain-language prompts, preview the result, and publish a standalone app — no engineering ticket required.

> Status: active build. Phases 1–4 (shell, builder canvas, properties/validation, real AI) plus Phase 5 productization (multi-app storage, app management, public app route, mock publishing) are complete. See [`docs/project-status.md`](docs/project-status.md) for the detailed feature matrix and [`docs/case-study-notes.md`](docs/case-study-notes.md) for the design narrative.

---

## What Forge Is

Forge lets a marketing, support, ops, or product teammate build a small AI-powered web app — an FAQ chatbot, a lead qualifier, a product description generator — by:

1. Dropping widgets onto a canvas
2. Filling in plain-language properties (no JSON, no schema, no "nodes")
3. Referencing other widgets' values inside a prompt
4. Previewing the live result
5. Publishing it to a standalone, shareable-looking URL

The mental model sits between Retool/Appsmith (visual builder) and a workflow tool (AI-native), but trimmed down to exactly what a non-technical user needs.

## Problem Statement

Non-technical teams constantly want small, focused AI tools — a chatbot that answers FAQs, a generator that writes product descriptions, a form that scores leads — but building even a simple one today means either:

- Filing a ticket with engineering and waiting in a backlog for something that should take an afternoon, or
- Wrestling with a general-purpose no-code platform (Retool, Appsmith) that exposes databases, APIs, and technical concepts the user was never trained on.

Forge's bet: most of these tools don't need a database connection or a REST API panel. They need a handful of widget types, a way to reference one widget's value from another, a connection to a real LLM, and a button that makes the result something other people can open. Strip everything else away.

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
| Dashboard, Discover (template gallery) | Built, seeded with mock data |
| **My Apps** | Built — shows real saved apps, not mock cards |
| Builder canvas — add/drag/select/delete widgets | Built |
| Widget properties panel | Built, per-widget-type fields |
| Prompt reference system (`{{widget.value}}`) | Built |
| Validation + publish-readiness checklist | Built |
| Preview mode | Built |
| **Text Generator widget → real Gemini API** | Built — server-side route, model fallback chain, mock fallback |
| **Multi-app local storage** | Built — every app is a separate, independently-saved entry |
| **Rename / duplicate / delete apps** | Built — from the My Apps card menu |
| **Mock publishing** | Built — flips an app's status and makes it viewable at a public-style runtime URL |
| **Public runtime route** (`/app/[appId]`) | Built — no builder chrome, just the live app |
| Image Generator, Chat Box widgets | Polished mock only (no real API calls yet) |
| Auth, onboarding, database, real hosting | Not yet built |

Full detail in [`docs/project-status.md`](docs/project-status.md).

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript** throughout
- **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`)
- **Google Gemini API** (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash` fallback chain) for real text generation, called server-side only
- **localStorage** for all persistence (no database yet)

Planned but not yet introduced: React Flow (canvas), Zustand (global state), Radix UI, Zod, Supabase/PostgreSQL — see [`docs/architecture.md`](docs/architecture.md) for why the current canvas is hand-built instead.

## AI Integration Flow

The Text Generator widget is the one widget connected to a real model:

1. In Preview mode (or on the published runtime page), the user clicks **Generate**.
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

## App Storage Model

Every app — draft or published — is one entry in a single JSON array under `localStorage['forge_apps']`. Each entry carries its own `id`, `name`, `status` (`draft`/`published`), `widgets[]`, and timestamps. `lib/storage.ts` exposes the only way to touch that array: `listApps`, `getApp`, `createApp`, `saveApp` (name/widgets, debounced autosave), `duplicateApp` (deep-cloned widgets, forced back to draft), `deleteApp`, and `publishApp` (flips status). Every operation reads the whole array, mutates one entry, and writes the whole array back in a single synchronous call — there's no partial-write state. An older single-draft format (`forge_builder_draft`) is auto-migrated into this array the first time it's read, so upgrading doesn't lose in-progress work.

## Public App Route

Publishing an app (via the builder's Publish button → confirm) sets its status to `published` and makes it viewable at `/app/[appId]` — a clean runtime page with no sidebar, no widget palette, no properties panel. It reads the app straight out of `localStorage` and renders its widgets live: the Text Generator still calls real Gemini, Image Generator and Chat Box stay mocked. It's "public" in the sense of having its own clean URL and no editing UI — it isn't yet hosted anywhere real, since there's no backend (see Known Limitations).

## Screenshots

> _Placeholder — add real screenshots/GIFs here once the builder UI is final._

- [ ] Dashboard
- [ ] My Apps (Drafts + Published, card menu open)
- [ ] Discover / template gallery
- [ ] Builder canvas (widget palette open)
- [ ] Properties panel (Text Generator widget selected)
- [ ] Preview mode — real Gemini output
- [ ] Publish flow — confirmation + "Open published app"
- [ ] Public runtime view (`/app/[appId]`)

Early design references (not final screenshots) live in `docs/reference wireframes/`.

## Setup Instructions

```bash
# Install dependencies
npm install

# (Optional) enable real AI generation — without this, the app uses mock output
cp .env.local.example .env.local
# then add your Gemini API key (see Environment Variables below)

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/dashboard` (there is currently no login screen — see Known Limitations).

```bash
npm run lint        # ESLint
npx tsc --noEmit     # Type-check
```

## Environment Variables

| Variable | Required? | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Enables real Text Generator output via Google's Gemini API. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Without it, the app uses a polished mock generator — every other feature works identically either way. |

Set it in `.env.local` (gitignored; never commit it). `.env.local.example` documents the variable with no real value and is the only env file tracked in git.

## Known Limitations

- No auth or onboarding flow — a single mock user is hardcoded.
- "Published" apps are viewable at a clean local URL, but there's no real hosting/CDN — the URL only works in the same browser that has the app in its `localStorage`.
- Discover's template gallery is still static seeded data — "Use template" doesn't yet clone a template into a real app.
- Image Generator and Chat Box are fully mocked — no real API calls.
- No undo/redo, no responsive/mobile builder layout, no multi-page apps.

Full list with context in [`docs/project-status.md`](docs/project-status.md).

## Future Roadmap

- **Supabase/PostgreSQL backend** — replace `localStorage` with real persistence
- **Real authentication** — replace the hardcoded mock user with Supabase Auth
- **Real image generation** — connect the Image Generator widget to an actual image API
- **Real publishing/hosting** — a published app reachable outside the creator's own browser
- Login/onboarding pages
- Wire Discover's "Use template" into real app creation
- Connect Chat Box to a real conversational flow

See [`docs/project-status.md`](docs/project-status.md) for the full roadmap and [`docs/case-study-notes.md`](docs/case-study-notes.md) for the reasoning behind current trade-offs.
