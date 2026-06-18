# Architecture

This document explains how Forge is actually built today — not the original plan, where the two diverge. It's written for engineers evaluating the codebase.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | This Next.js version has breaking changes from prior majors — see `AGENTS.md` |
| UI | React 19 | |
| Language | TypeScript | Used everywhere, including the API route |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme` in `globals.css`, no `tailwind.config.js` |
| AI provider | Google Gemini API | Called via raw `fetch`, no SDK |
| Persistence | `localStorage` | No database yet |
| State | Local React `useState`/`useRef` | No global store (Zustand) yet |
| Canvas | Hand-built absolute positioning | No React Flow yet |

**Why no React Flow / Zustand yet?** The original plan called for both, but Phase 2/3 implementation went a simpler route: a single `BuilderRoot.tsx` component owns all canvas state (`widgets`, `selectedId`, drag state) via `useState`/`useRef`, and widgets are plain `<div>`s with manual `onMouseDown`/`onMouseMove` handlers for dragging. This was a pragmatic choice to move fast through early phases without taking on two new dependencies before the data model stabilized. It's a deliberate, revisitable trade-off, not an oversight — see [`case-study-notes.md`](case-study-notes.md) for the reasoning.

## Folder Structure

```
src/
  app/
    page.tsx                      # redirects to /dashboard
    dashboard/page.tsx
    my-apps/page.tsx
    discover/page.tsx, DiscoverClient.tsx
    builder/[appId]/page.tsx, BuilderRoot.tsx   # appId is currently unused
    api/generate-text/route.ts    # server-only Gemini integration

  components/
    layout/        # Sidebar, TopBar, AppShell
    builder/        # WidgetPalette, WidgetCard, PropertiesPanel, PreviewWidget, ChecklistModal
    ui/             # Button, AppCard, EmptyState

  lib/
    types.ts        # Widget, App, Template, MockUser
    mock-data.ts     # seeded apps/templates for Dashboard/My Apps/Discover
    storage.ts       # localStorage draft save/load/clear
    resolvePrompt.ts  # {{widgetId.value}} token resolution
    validateApp.ts    # readiness/validation checks
    mockText.ts       # shared mock text generator (client fallback source of truth)
```

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

`App`/`Template`/`MockUser` types back the seeded Dashboard/My Apps/Discover data; they don't yet have a `widgets[]`/`connections[]` shape, because the builder doesn't persist per-app data yet (see Known Limitations in [`project-status.md`](project-status.md)).

## State & Persistence

- All builder state (widgets, selection, app name, save status, preview mode) lives in `BuilderRoot.tsx` via `useState`.
- Auto-save is debounced 500ms after any change, writing `{ name, widgets }` to `localStorage` under a single key (`forge_builder_draft`) via `lib/storage.ts`.
- On load, duplicate widget IDs are repaired (`repairDuplicateIds`) before hydrating state, guarding against stale/corrupted drafts from earlier sessions.
- Dashboard/My Apps/Discover read from `lib/mock-data.ts` constants — entirely separate from the builder's `localStorage` draft. There is currently no bridge between "what's in the builder" and "what shows up in My Apps."

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

## AI Integration Flow

Only the Text Generator (`llm`) widget calls a real model. Sequence, end to end:

```
User clicks "Generate" (PreviewWidget.tsx → LLMPreview)
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
- **Identical behavior with or without a key.** The same `generateMockText()` (extracted to `lib/mockText.ts` so both the route and, historically, the client could share it) backs both the "no key" and "all models failed" paths, so demos and local dev without a key look the same as the documented fallback behavior.
- **A system instruction enforces output shape** (2–3 sentences, one version, no preamble) — done via Gemini's `systemInstruction` field rather than prompt-stuffing, keeping the user's own prompt untouched.

Image Generator and Chat Box do not call any external API; their "generation" is local templated/randomized output with an artificial delay, explicitly to keep this phase scoped to one widget type.
