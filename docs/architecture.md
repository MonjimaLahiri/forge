# Architecture

This document explains how Forge is actually built today — not the original plan, where the two diverge. It's written for engineers evaluating the codebase.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | This Next.js version has breaking changes from prior majors — see `AGENTS.md` |
| UI | React 19 | |
| Language | TypeScript | Used everywhere, including the API route |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme` in `globals.css`, no `tailwind.config.js` |
| AI providers | Google Gemini API (text), Pollinations.ai (image) | Both called via raw `fetch`, no SDK; Pollinations needs no API key |
| Persistence | `localStorage` | No database yet |
| State | Local React `useState`/`useRef` | No global store (Zustand) yet |
| Canvas | Hand-built absolute positioning | No React Flow yet |

**Why no React Flow / Zustand yet?** The original plan called for both, but Phase 2/3 implementation went a simpler route: a single `BuilderRoot.tsx` component owns all canvas state (`widgets`, `selectedId`, drag state) via `useState`/`useRef`, and widgets are plain `<div>`s with manual `onMouseDown`/`onMouseMove` handlers for dragging. This was a pragmatic choice to move fast through early phases without taking on two new dependencies before the data model stabilized. It's a deliberate, revisitable trade-off, not an oversight — see [`case-study-notes.md`](case-study-notes.md) for the reasoning.

## Folder Structure

```
src/
  app/
    page.tsx                       # redirects to /dashboard
    dashboard/page.tsx
    my-apps/page.tsx                # real saved apps, Drafts/Published
    discover/page.tsx, DiscoverClient.tsx
    builder/[appId]/page.tsx, BuilderRoot.tsx   # editor — loads/saves the matching app
    app/[appId]/page.tsx, RuntimeRoot.tsx       # public runtime view — no builder chrome
    api/generate-text/route.ts      # server-only Gemini integration
    api/generate-image/route.ts     # server-only Pollinations.ai integration

  components/
    layout/        # Sidebar, TopBar, AppShell
    builder/        # WidgetPalette, WidgetCard, PropertiesPanel, PreviewWidget,
                    # AppCanvas (shared run-mode renderer), ChecklistModal
    ui/             # Button, AppCard, EmptyState

  lib/
    types.ts        # Widget, App, Template, MockUser
    mock-data.ts     # seeded templates for Discover (+ thumbnail color palette)
    storage.ts       # localStorage CRUD for the multi-app array, with legacy migration
    resolvePrompt.ts  # {{widgetId.value}} token resolution
    validateApp.ts    # readiness/validation checks
    mockText.ts       # shared mock text generator (route + historical client fallback)
    mockImage.ts       # shared mock gradient generator (route's client-side fallback)
```

Note: `src/app/app/[appId]/` is a literal route segment named `app` (so the URL is `/app/[appId]`) — unrelated to the Next.js `app/` *directory* convention at the project root. Slightly confusable name, intentional per the route the product spec asked for.

## Data Model

Widgets use a single flattened interface rather than a discriminated union, with optional fields per type:

```typescript
// lib/types.ts
export type WidgetType = 'static_text' | 'input' | 'llm' | 'image' | 'chat';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number; y: number;
  w: number; h: number;
  title: string;
  content?: string;       // static_text
  placeholder?: string;   // input | llm | chat
  prompt?: string;        // llm | chat
  model?: string;         // llm (currently cosmetic — see AI Integration Flow)
  temperature?: number;   // llm
  imagePrompt?: string;   // image
  imageStyle?: string;    // image
}
```

`App` is the persisted unit — one of these per saved app, whether draft or published:

```typescript
export interface App {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published';
  thumbnail: string;       // key into a fixed color palette, for the My Apps card
  ownerId: string;         // always 'mock_user' — no real auth yet
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;    // set by publishApp()
  widgets: Widget[];
}
```

`Template`/`MockUser` remain seed-only types backing Discover's gallery and the hardcoded sidebar user — neither is wired to real persistence.

## State & Persistence

- All builder state (widgets, selection, app name, save status, preview mode) lives in `BuilderRoot.tsx` via `useState`; the only thing it reads from outside is the `appId` route param.
- `lib/storage.ts` is the single source of truth for persisted apps — one JSON array under `localStorage['forge_apps']`. Every function (`listApps`, `getApp`, `createApp`, `saveApp`, `duplicateApp`, `deleteApp`, `publishApp`) follows the same shape: read the whole array, mutate exactly one entry (or none, for create/list), write the whole array back with a single synchronous `localStorage.setItem`. There's no partial-write state to reason about.
- **Loading an app:** `BuilderRoot` calls `getApp(appId)` on mount. If `appId === 'new'` (the literal link every "Create New" button points to), it calls `createApp()` instead and `router.replace`s the URL to the real generated id — so every other page in the app never needed to learn how to mint ids themselves.
- **Saving an app:** debounced 500ms after any widget/name change, via `saveApp(id, { name, widgets })`, which always bumps `updatedAt`.
- **Duplicating an app:** `duplicateApp(id)` deep-clones `widgets` (`JSON.parse(JSON.stringify(...))`) so the copy can never share array/object references with the original, assigns a new id, appends `" Copy"` to the name, and forces `status: 'draft'` regardless of the original's status.
- **Publishing an app:** `publishApp(id)` is the only function that sets `status` to `'published'`; it's called once, when the user confirms in the publish modal — never from the autosave path, so there's no race between "saving edits" and "publishing." See Publish & Draft Behavior below for how `saveApp` reverses this on the next edit.
- **Migration:** an older single-draft format lived under `localStorage['forge_builder_draft']`. The first time `forge_apps` is read and doesn't exist yet, that legacy draft (if non-empty) is converted into the first entry of the new array, then the old key is removed. This runs at most once per browser.
- On load, duplicate widget IDs are repaired (`repairDuplicateIds`) before hydrating state, guarding against stale/corrupted data from earlier sessions.
- Dashboard/Discover still read from `lib/mock-data.ts` constants — entirely separate from real app storage. Only My Apps and the builder/runtime routes touch `forge_apps`.

## Publish & Draft Behavior

A published app is a snapshot of widgets at the moment `publishApp` was called, not a permanent flag — so it has to fall out of sync the moment the underlying app changes. `saveApp` is the single function every edit path already calls (the builder's debounced autosave, the Reset button, and My Apps' inline rename), so the revert logic lives there once: if the app being saved currently has `status: 'published'`, `saveApp` sets it back to `'draft'` and clears `publishedAt` before writing.

This needed no new "is this a real edit" check, because every call site already only invokes `saveApp` when something changed — the builder's autosave effect bails out if the serialized `{name, widgets}` matches the last save, and My Apps' `commitRename` bails out on a no-op rename. So by the time `saveApp` runs, it's always a genuine edit, and demoting unconditionally is correct.

Two surfaces read `status` and need no separate logic to stay correct:
- **My Apps** filters `listApps()` into Drafts/Published purely by `status` — an app demoted by `saveApp` moves sections on the very next read.
- **`/app/[appId]`** (`RuntimeRoot.tsx`) checks `app.status === 'published'` before rendering. If the app exists but isn't published (either never published, or demoted by a later edit), it shows "This app is not currently published." with a link back to `/builder/[appId]`, instead of silently serving a stale runtime view.

## Supabase Schema (Phase 6.3 — not yet connected)

The full SQL lives in [`docs/supabase-schema.sql`](supabase-schema.sql), meant to be run once in the Supabase Dashboard's SQL Editor. As of this phase, nothing in the app calls these tables — the builder and My Apps still read/write `localStorage` exclusively, exactly as described above. This is schema-and-policy groundwork for a later phase that actually wires up persistence.

**Schema:** two tables, deliberately mirroring shapes that already exist in code rather than inventing a new model:
- `profiles` mirrors the identity half of `MockUser` — `id` (same uuid as the Supabase auth user, not a separate generated id), `display_name`, `avatar_index`, `created_at`. One row per user, created automatically (see trigger below), never inserted by the user directly.
- `apps` mirrors `App` from `lib/types.ts` almost field-for-field — `status` is constrained to `'draft' | 'published'` via a `check` constraint, the same two states the local version uses. `widgets` stays one `jsonb` column rather than a normalized table, because Forge never queries into individual widgets — they're only ever read/written as one full array per app, both locally and (eventually) remotely, so normalizing would add joins for no benefit.

**RLS strategy:** both tables have Row Level Security enabled, with narrow, single-purpose policies rather than one broad rule per table:
- `profiles`: `select`/`update` are restricted to `auth.uid() = id`. There's intentionally no `insert` policy — profile rows only ever come from the `handle_new_user()` trigger, which runs as `SECURITY DEFINER` and bypasses RLS entirely, since a brand-new user has no rows (and therefore no RLS grant) yet to authorize an insert against.
- `apps`: four ownership policies (`select`/`insert`/`update`/`delete`, all keyed on `auth.uid() = user_id`), plus one additional `select` policy with no ownership check at all: `using (status = 'published')`. Postgres unions multiple permissive policies for the same command with `OR`, so the effective read rule becomes "you can see a row if you own it, **or** if it's published" — without needing one combined boolean expression to express both halves.

**Why published apps are publicly readable:** this is the database-layer version of a rule the local-only build already established — `/app/[appId]` is meant to be a link anyone can open, not just the app's owner, the same way `RuntimeRoot.tsx` already renders straight from storage with no ownership check today. Once real persistence is connected, an anonymous (logged-out) visitor still has to be able to `select` a published app's row for that page to keep working for non-owners — hence a policy with no `auth.uid()` check at all, scoped only by `status`.

**Why drafts stay private:** a draft is work in progress — exposing it would let anyone who discovers or guesses an app's UUID read its prompts, widget configuration, and content before the owner ever chose to publish. Restricting `select` to `auth.uid() = user_id` for everything that isn't `published` preserves the exact "draft = private, published = public" boundary the local `saveApp`/`publishApp` behavior already enforces — just expressed as a database policy instead of an `if` statement.

One gap worth naming rather than hiding: this schema has no trigger replicating `saveApp`'s "editing a published app reverts it to draft" rule (see Publish & Draft Behavior above). That logic lives in application code locally; whichever code eventually writes to this table will need to either reimplement it as a Postgres trigger or keep enforcing it at the application layer, the same way `storage.ts` does today.

## Builder Canvas

The canvas is a `position: relative` container; each widget is a `position: absolute` `<div>` placed at `widget.x, widget.y`. Dragging is implemented with three handlers wired to the canvas container:

- `onMouseDown` on a widget captures the drag start point and the widget's original position into a `useRef`
- `onMouseMove` on the canvas computes the delta and updates the widget's position in state
- `onMouseUp` clears the drag ref

Selection is a single `selectedId` string in state; clicking empty canvas or pressing `Escape` clears it. When a widget is selected, the right-hand panel swaps from the widget palette to the properties form for that widget.

## Prompt Reference System

Widgets reference each other's runtime values through string tokens embedded in prompt text, rather than graph edges:

```
{{widgetId.value}}
```

**Resolution** (`lib/resolvePrompt.ts`), run client-side at generate-time against a `Record<widgetId, string>` of live input values:

- Unknown ID → `[missing: id]` substituted, plus a warning
- Known but empty → `""` substituted, plus a warning naming the widget by title (not raw ID)
- Known and non-empty → value substituted directly

**Validation** (`lib/validateApp.ts`), run continuously (memoized on the `widgets` array) independent of generation:

- Flags `{{...}}` references to widgets that no longer exist, or that exist but aren't `input` type
- Flags missing prompts on `llm`/`image` widgets (errors — generation would do nothing useful)
- Flags missing titles/placeholders (warnings — cosmetic, non-blocking)

These two systems are intentionally separate: validation gives proactive feedback while editing (readiness indicator, checklist modal), while resolution happens at the moment of generation and produces user-facing inline warnings rather than blocking the action.

## Run-Mode Rendering: `AppCanvas`

Both the builder's "Preview" toggle and the public `/app/[appId]` route need to render "this app's widgets, live, with no editing affordances." That logic — owning a `runtimeValues` map, deriving a widget-id-to-title lookup, laying out each widget absolutely, and wiring `PreviewWidget`'s callbacks — lives in exactly one place, `components/builder/AppCanvas.tsx`, and both call sites just pass `widgets`. The two call sites still own their own surrounding chrome separately (the builder's preview header has a dismissible validation-error banner and a "Back to Editor" link; the public route's header has a logo and an "Edit app" link instead) — those are legitimately different surfaces, so only the part with real shared logic was extracted.

## Text Generation Flow (Gemini)

The Text Generator (`llm`) widget calls a real model. Sequence, end to end:

```
User clicks "Generate" (PreviewWidget.tsx → LLMPreview, reached via
either BuilderRoot's preview mode or the public /app/[appId] route)
  │
  ├─ resolvePrompt(template, runtimeValues, widgetTitles)
  │     → resolved prompt string + warnings array (shown immediately)
  │
  ├─ fetch POST /api/generate-text { prompt, model, temperature }
  │
  │   ┌─ route.ts (server-only) ───────────────────────────────┐
  │   │ 1. validate prompt is non-empty (400 if not)            │
  │   │ 2. if no GEMINI_API_KEY → return mockText (reason:no-key)│
  │   │ 3. else, for model in [flash-lite, flash, 2.0-flash]:    │
  │   │      fetch generativelanguage.googleapis.com/.../        │
  │   │        generateContent  (key sent via x-goog-api-key     │
  │   │        header, never in the URL or client)               │
  │   │      on success with non-empty text → return it          │
  │   │      on quota/blocked/empty/network error → next model   │
  │   │ 4. if every model failed → return mockText               │
  │   │      (reason:fallback)                                   │
  │   └───────────────────────────────────────────────────────┘
  │
  └─ Client renders: output text, "Generated with Gemini" /
     "Mock output" label, and (if reason===fallback) a friendly
     amber notice that Gemini was unavailable.
```

Key properties of this design:
- **The API key never leaves the server.** It's read from `process.env.GEMINI_API_KEY` only inside the route handler.
- **No SDK dependency.** The route uses the platform `fetch`, calling Gemini's REST endpoint directly — avoids an install for a single endpoint call.
- **Identical behavior with or without a key.** The same `generateMockText()` (in `lib/mockText.ts`) backs both the "no key" and "all models failed" paths, so demos and local dev without a key look the same as the documented fallback behavior — and this holds in both the builder's preview and the published runtime page, since both go through the same `AppCanvas` → `PreviewWidget` → route path.
- **A system instruction enforces output shape** (2–3 sentences, one version, no preamble) — done via Gemini's `systemInstruction` field rather than prompt-stuffing, keeping the user's own prompt untouched.

## Image Generation Flow (Pollinations)

The Image Generator (`image`) widget also calls a real provider, via the same shape as text generation but with no API key at all:

```
User clicks "Generate" (PreviewWidget.tsx → ImagePreview, reached via
either BuilderRoot's preview mode or the public /app/[appId] route)
  │
  ├─ resolvePrompt(imagePrompt template, runtimeValues, widgetTitles)
  │     → resolved prompt + warnings, same resolution system as text
  │
  ├─ fetch POST /api/generate-image { prompt, imageStyle }
  │
  │   ┌─ route.ts (server-only) ───────────────────────────────────┐
  │   │ 1. validate prompt is non-empty (400 if not)                 │
  │   │ 2. append imageStyle to the prompt if set                    │
  │   │ 3. GET image.pollinations.ai/prompt/<encoded prompt>          │
  │   │      ?seed=<random>  — no API key, Pollinations is a free,    │
  │   │      keyless public image API                                 │
  │   │ 4. on a 2xx image/* response → base64-encode the body into    │
  │   │      a data: URL                                              │
  │   │ 5. on any non-2xx response, non-image content type, or        │
  │   │      network error → return mock (reason: 'fallback')         │
  │   └────────────────────────────────────────────────────────────┘
  │
  └─ Client renders a real <img src={dataUrl}> OR the original
     gradient-card mock (lib/mockImage.ts, unchanged), plus an
     "AI generated" / "Mock output" label and the same amber
     "temporarily unavailable" notice pattern text uses.
```

**Why Pollinations instead of Gemini's own image models:** the first implementation called Gemini's "Nano Banana" image models directly, mirroring the text route's model-fallback-chain pattern exactly. Testing it live against the API revealed every Gemini image model — `gemini-2.5-flash-image`, both `gemini-3-pro-image` variants, both `gemini-3.1-flash-image` variants — returns `RESOURCE_EXHAUSTED` with a hard `limit: 0` free-tier quota, and the standalone Imagen models reject free-tier requests outright with "only available on paid plans." Google made Gemini image generation paid-only sometime before mid-2026, after this project's Gemini API key was first set up for text. Pollinations' free, keyless endpoint was adopted instead specifically because it required zero new packages, zero new secrets, and zero billing — preserving the project's "no installs without asking, no billing yet" constraints. The trade-off, called out explicitly rather than hidden: Pollinations is a smaller, unaffiliated service with no uptime SLA and no enterprise privacy terms, acceptable for a demo but not for a product handling real user data.

A random `seed` query parameter is included on every request specifically so clicking "Regenerate" gets a new image rather than Pollinations returning an identical cached result for the same prompt.

Chat Box does not call any external API; its "replies" are local keyword-matched canned text with an artificial delay — the one widget type still fully mocked, by design.
