# Forge

**A no-code AI app builder for non-technical teams.** Drag widgets onto a canvas, wire them together with plain-language prompts, preview the result, and publish a standalone app — no engineering ticket required.

> Status: active build. Phases 1–4 (shell, builder canvas, properties/validation, real AI) plus Phase 5 productization (multi-app storage, app management, public app route, mock publishing, real image generation, publish/draft correctness) are complete. See [`docs/project-status.md`](docs/project-status.md) for the detailed feature matrix and [`docs/case-study-notes.md`](docs/case-study-notes.md) for the design narrative.

## Live Demo

> https://forge-ai-builder.vercel.app/dashboard

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
| **Public runtime route** (`/app/[appId]`) | Built — no builder chrome, just the live app; shows a clear message if the app is no longer published |
| **Publish/draft correctness** | Built — editing a published app automatically reverts it to draft until republished |
| **Image Generator widget → real Pollinations.ai image API** | Built — server-side route, no API key needed, mock fallback |
| Chat Box widget | Polished mock only (no real API calls yet) |
| Auth, onboarding, database, real hosting | Not yet built |

Full detail in [`docs/project-status.md`](docs/project-status.md).

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript** throughout
- **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`)
- **Google Gemini API** (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash` fallback chain) for real text generation, called server-side only
- **Pollinations.ai** (free, keyless public image API) for real image generation, called server-side only
- **localStorage** for all persistence (no database yet)

Planned but not yet introduced: React Flow (canvas), Zustand (global state), Radix UI, Zod, Supabase/PostgreSQL — see [`docs/architecture.md`](docs/architecture.md) for why the current canvas is hand-built instead.

## AI Providers Used

| Widget | Provider | Why this one | Needs a key? |
|---|---|---|---|
| Text Generator | Google Gemini (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash`) | Free tier, no SDK needed, called via raw `fetch` | Yes — `GEMINI_API_KEY` |
| Image Generator | Pollinations.ai | Genuinely free and keyless — chosen after Google made every Gemini image model ("Nano Banana") and the standalone Imagen models paid-only in mid-2026, confirmed by testing all of them directly against the live API | No |
| Chat Box | None (mocked) | Explicitly out of scope so far — keyword-matched canned replies | — |

Both real-provider widgets follow the same shape: one server-only route, the API key (if any) never reaches the browser, and any provider failure (quota, network, safety block) falls back to a polished mock rather than a broken UI — see the AI flow sections in [`docs/architecture.md`](docs/architecture.md) for the full request/fallback sequence.

## Text Generation Flow (Gemini)

The Text Generator widget is connected to a real model:

1. In Preview mode (or on the published runtime page), the user clicks **Generate**.
2. The client resolves `{{widgetId.value}}` tokens in the prompt against live widget values (see Prompt Reference System below).
3. The resolved prompt is POSTed to `/api/generate-text` — a server-only Next.js route handler.
4. The route reads `GEMINI_API_KEY` from the server environment (never sent to the browser) and calls Google's Gemini API directly via `fetch` — no SDK installed.
5. It tries three models in order (cheapest/most available first); if one returns a quota error, blocked content, or an empty response, it tries the next.
6. If no key is configured, or all three models fail, the route returns the same polished mock copy the UI always had — so the app works identically with or without a live key.
7. The UI shows a small label ("Generated with Gemini" / "Mock output") and a friendly notice if Gemini failed and the mock kicked in, so the degradation is never silent or confusing.

## Image Generation Flow (Pollinations)

The Image Generator widget is connected to a real provider too, with no API key required:

1. In Preview mode (or on the published runtime page), the user clicks **Generate**.
2. The client resolves the image prompt template the same way text prompts are resolved, and appends the widget's image style if set.
3. The resolved prompt is POSTed to `/api/generate-image` — a server-only route handler.
4. The route requests `image.pollinations.ai/prompt/<encoded prompt>` with a random `seed` (so "Regenerate" produces a fresh image instead of a cached one), then base64-encodes the response body into a `data:` URL.
5. Any non-2xx response, non-image content type, or network error falls back to the original gradient-card mock — never a broken widget.
6. The UI shows the same "AI generated" / "Mock output" label and fallback notice pattern the Text Generator uses.

## Prompt Reference System

Instead of visual wires between widgets (React Flow edges), Forge widgets reference each other through plain tokens inside prompt text: `{{widgetId.value}}`. At generate-time:

- An unresolved/unknown widget ID → replaced with `[missing: id]` and a warning shown to the user.
- A known but empty input → replaced with `""` and a warning naming the widget ("Enter a value in 'Product Name' before generating.").
- A resolved value → substituted directly.

A separate validator (`lib/validateApp.ts`) catches dangling references and missing prompts *before* generation, surfaced as a readiness indicator and checklist in the builder — so users see problems while editing, not just when something breaks at runtime.

## App Storage Model

Every app — draft or published — is one entry in a single JSON array under `localStorage['forge_apps']`. Each entry carries its own `id`, `name`, `status` (`draft`/`published`), `widgets[]`, and timestamps. `lib/storage.ts` exposes the only way to touch that array: `listApps`, `getApp`, `createApp`, `saveApp` (name/widgets, debounced autosave), `duplicateApp` (deep-cloned widgets, forced back to draft), `deleteApp`, and `publishApp` (flips status). Every operation reads the whole array, mutates one entry, and writes the whole array back in a single synchronous call — there's no partial-write state. An older single-draft format (`forge_builder_draft`) is auto-migrated into this array the first time it's read, so upgrading doesn't lose in-progress work.

## Publish & Draft Behavior

A published app is a snapshot, not a permanent flag: editing a published app's name or widgets (in the builder, via Reset, or by renaming it from My Apps) automatically reverts its `status` back to `draft` and clears `publishedAt`, since the live published version no longer matches what's been published. This is handled centrally in `saveApp`, the one function every edit path already calls, so there's no separate "dirty" tracking to keep in sync. The user has to explicitly publish again to make the new version live.

## Public App Route

Publishing an app (via the builder's Publish button → confirm) sets its status to `published` and makes it viewable at `/app/[appId]` — a clean runtime page with no sidebar, no widget palette, no properties panel. It reads the app straight out of `localStorage` and renders its widgets live: Text Generator calls real Gemini, Image Generator calls real Pollinations, Chat Box stays mocked. If the app has since been edited back to draft, the page shows "This app is not currently published." with a link back to the builder instead of serving stale content. It's "public" in the sense of having its own clean URL and no editing UI — it isn't yet hosted anywhere real, since there's no backend (see Known Limitations).

## Screenshots

> _Placeholder — add real screenshots/GIFs here once the builder UI is final._

- [ ] Dashboard
- [ ] My Apps (Drafts + Published, card menu open)
- [ ] Discover / template gallery
- [ ] Builder canvas (widget palette open)
- [ ] Properties panel (Text Generator widget selected)
- [ ] Preview mode — real Gemini text output
- [ ] Preview mode — real Pollinations image output
- [ ] Publish flow — confirmation + "Open published app"
- [ ] Public runtime view (`/app/[appId]`)

Early design references (not final screenshots) live in `docs/reference wireframes/`.

## Setup Instructions

```bash
# Install dependencies
npm install

# (Optional) enable real Text Generator output — without this, it uses mock output.
# The Image Generator needs no setup at all; it works out of the box.
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

That's the only environment variable in the project. The Image Generator widget needs no key — it calls Pollinations.ai's free, keyless public image API directly. Set `GEMINI_API_KEY` in `.env.local` (gitignored; never commit it). `.env.local.example` documents it with no real value and is the only env file tracked in git.

## Known Limitations

- No auth or onboarding flow — a single mock user is hardcoded.
- "Published" apps are viewable at a clean local URL, but there's no real hosting/CDN — the URL only works in the same browser that has the app in its `localStorage`.
- Discover's template gallery is still static seeded data — "Use template" doesn't yet clone a template into a real app.
- Image Generator depends on Pollinations.ai, a free third-party service with no uptime SLA or privacy guarantees — fine for a demo, not something to send sensitive prompts through.
- Chat Box is fully mocked — no real conversational API.
- No undo/redo, no responsive/mobile builder layout, no multi-page apps.

Full list with context in [`docs/project-status.md`](docs/project-status.md).

## Future Roadmap

- **Supabase/PostgreSQL backend** — replace `localStorage` with real persistence
- **Real authentication** — replace the hardcoded mock user with Supabase Auth
- **Real publishing/hosting** — a published app reachable outside the creator's own browser
- A more durable image provider — Pollinations.ai works well for a demo but isn't an enterprise-grade dependency
- Login/onboarding pages
- Wire Discover's "Use template" into real app creation
- Connect Chat Box to a real conversational flow

See [`docs/project-status.md`](docs/project-status.md) for the full roadmap and [`docs/case-study-notes.md`](docs/case-study-notes.md) for the reasoning behind current trade-offs.
