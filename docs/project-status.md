# Project Status

Last updated: Phase 5 (Productization) Step 5 complete — real image generation and publish/draft correctness.

## Build Philosophy

Forge is built in phases, each one shippable and demoable on its own, rather than building the full app at once:

1. **Phase 1** — static app shell and mock screens
2. **Phase 2** — builder canvas with mock data
3. **Phase 3** — widget properties and connections (prompt references)
4. **Phase 4** — real AI integration
5. **Phase 5 (Productization)** — turn the single-draft builder into a real multi-app product, still on `localStorage` only (complete: storage, app management, publishing, real image generation, publish/draft correctness)
6. **Backend phase (not started)** — Supabase/PostgreSQL, real auth, real hosting

Note on naming: the original build plan called the backend/auth/database work "Phase 5." That work hasn't started yet — what's labeled "Phase 5" below is a productization arc inserted before it, intentionally still local-only, to prove out multi-app management and a publish flow before taking on a real backend.

## Completed Phases

### Phase 1 — Shell & mock screens
Dashboard and Discover pages exist with seeded mock data (`lib/mock-data.ts`) and full navigation. **Gap from the original plan:** `/login` and `/onboarding` were never built — there is no auth placeholder at all, just a hardcoded mock user.

### Phase 2 — Builder canvas
A working canvas where widgets can be added from a palette, dragged, selected, and deleted. Built with plain absolutely-positioned `div`s and manual mouse-event handlers rather than React Flow (see [`architecture.md`](architecture.md) for why).

### Phase 3 — Properties, validation, preview
- Per-widget-type property forms (`PropertiesPanel.tsx`)
- `{{widgetId.value}}` prompt reference system (`lib/resolvePrompt.ts`)
- Validation engine flagging missing prompts, dangling references, missing titles (`lib/validateApp.ts`)
- Preview mode (a render mode inside `BuilderRoot.tsx`, not a separate route)
- Mocked behavior for all widget types: templated text, gradient-placeholder images, keyword-based chat replies
- Debounced (500ms) auto-save to `localStorage`

### Phase 4 — Real AI integration
- New server-only route `src/app/api/generate-text/route.ts`
- Calls Google's Gemini API directly via `fetch` (no SDK installed)
- Tries `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash` in order; any failure (quota, blocked content, empty response, network error) advances to the next model
- Falls back to the original mock generator (`lib/mockText.ts`) if no API key is configured, or if every model fails
- System instruction enforces concise (2–3 sentence), single-version, copy-only output
- UI shows a small "Generated with Gemini" / "Mock output" label, a "Generating with Gemini…" loading state, and a friendly amber notice when Gemini failed and the mock silently took over
- Image Generator and Chat Box were **explicitly left mocked** in this phase — only the Text Generator widget is wired to a real model

### Phase 5 Step 1 — Multi-app local storage
- Replaced the single `forge_builder_draft` key with one array under `forge_apps`, each entry a full `App` (id, name, status, `widgets[]`, timestamps)
- `lib/storage.ts`: `listApps`, `getApp`, `createApp`, `saveApp`
- "Create New" generates a real unique id; `/builder/[appId]` now actually loads/saves the matching app instead of ignoring the route param
- Old single-draft data auto-migrates into the new array the first time it's read, then the legacy key is removed
- My Apps renders real saved apps (via `AppCard`) instead of `MOCK_DRAFT_APPS`/`MOCK_PUBLISHED_APPS`

### Phase 5 Step 2 — App management
- My Apps card overflow menu: **Rename** (inline, same pattern as the builder header), **Duplicate** (deep-cloned widgets, new id, forced back to `draft`), **Delete** (confirmation required)
- `lib/storage.ts`: added `duplicateApp`
- Fixed a UI bug where the dropdown menu was clipped by the card's `overflow-hidden` — moved that property to just the thumbnail element

### Phase 5 Step 3 — Public app route and mock publishing
- `lib/storage.ts`: added `publishApp` (sets `status: 'published'`, stamps `publishedAt`)
- Publish button → readiness modal → confirming now actually persists the status change (previously a no-op UI mock) and surfaces an **"Open published app"** link
- New route `/app/[appId]` (`RuntimeRoot.tsx`): loads the app from storage, renders it with no builder chrome at all — just a small header (logo + "Edit app" link) and the live widgets
- Extracted the widget-rendering logic shared by builder Preview mode and the new public route into `components/builder/AppCanvas.tsx`, so there's one implementation of "run this app's widgets," not two
- My Apps: published apps now open `/app/[id]` (view) by default, with an "Edit" item added to the card menu so publishing doesn't lock the app out of further edits

### Phase 5 Step 4 — Real image generation
- New server-only route `src/app/api/generate-image/route.ts`
- First implementation called Google's Gemini image models ("Nano Banana" family) directly, mirroring the Text Generator's pattern exactly — but direct API testing revealed every Gemini image model, and the standalone Imagen models, require a paid plan as of mid-2026 (zero free-tier quota across the board, confirmed against six different model names)
- Pivoted to **Pollinations.ai**, a free, keyless public image API — chosen specifically because it needed no new package, no new secret, and no billing setup, consistent with the project's local-only, no-installs-without-asking constraints
- A random `seed` query parameter on each request ensures "Regenerate" returns a fresh image rather than a cached one for an identical prompt
- Falls back to the existing mock gradient (`lib/mockImage.ts`, extracted unchanged from the prior inline implementation) on any non-2xx response, non-image content type, or network error — same graceful-degradation philosophy as text
- UI: "Generating image…" loading state, "AI generated" / "Mock output" label, amber fallback notice — mirrors the Text Generator's established pattern exactly

### Phase 5 Step 5 — Publish/draft correctness
- Previously, editing a published app left it marked `published` even though the live version no longer matched what was published — a real bug, not a cosmetic one
- `lib/storage.ts`'s `saveApp` (the single function behind the builder's autosave, the Reset button, and My Apps' rename) now demotes `status: 'published'` back to `'draft'` and clears `publishedAt` whenever it's called against a published app — no separate dirty-tracking needed, since every call site already only invokes `saveApp` on a real change
- `/app/[appId]` (`RuntimeRoot.tsx`) now checks `app.status === 'published'` before rendering; if an app has been edited back to draft, it shows "This app is not currently published." with a link back to the builder, instead of serving stale/inconsistent content

## Feature Matrix

| Feature | Status | Notes |
|---|---|---|
| Dashboard / Discover navigation | ✅ Built | Seeded mock data, not live persistence |
| **My Apps** | ✅ Built | Real saved apps, Drafts/Published split, rename/duplicate/delete |
| Add/drag/select/delete widgets | ✅ Built | Custom canvas, not React Flow |
| Widget properties panel | ✅ Built | All 5 widget types |
| Prompt reference system | ✅ Built | `{{widgetId.value}}` tokens |
| Validation / readiness checklist | ✅ Built | Errors + warnings, blocks nothing — advisory only |
| Preview mode | ✅ Built | Toggled in-component, not a route |
| Text Generator → real AI | ✅ Built | Gemini, server-side, 3-model fallback chain |
| Image Generator → real AI | ✅ Built | Pollinations.ai, server-side, no API key needed |
| Chat Box | 🟡 Mocked | Keyword-based canned replies |
| **Multi-app persistence** | ✅ Built | One `localStorage` array, each app independent |
| **Rename / Duplicate / Delete** | ✅ Built | From My Apps card menu and builder header (rename) |
| **Mock publish flow** | ✅ Built | Real local status change, not real hosting |
| **Public runtime route** (`/app/[appId]`) | ✅ Built | No builder chrome, reads from `localStorage`, shows a clear message if unpublished |
| **Publish/draft correctness** | ✅ Built | Editing a published app reverts it to draft until republished |
| Login / onboarding | ❌ Not built | Hardcoded mock user |
| Database / Supabase | ❌ Not built | Backend phase |
| Real auth | ❌ Not built | Backend phase |
| Real hosting for published apps | ❌ Not built | Currently local-browser-only |
| React Flow / Zustand | ❌ Not adopted | Custom canvas + local state used instead |

## Known Limitations

- **No auth.** The sidebar greets a hardcoded "Alex." There's no session, no login form, no per-user data isolation — anyone using the same browser sees the same apps.
- **"Published" isn't really public.** `/app/[appId]` reads from the current browser's `localStorage`, so the URL only resolves for whoever has that app saved locally. There's no server-side copy, no real shareable link yet.
- **Discover is still static.** Templates are seeded mock data; "Use template" links to `/builder/new` but doesn't actually clone the template's content into the new app.
- **Widget connections are textual, not visual.** There are no graph edges between widgets — references live inside prompt strings as `{{id.value}}` tokens, validated but not drawn.
- **Chat Box is fully mocked.** No real conversational AI wired up yet, by design.
- **Image Generator depends on a free, unaffiliated third-party service (Pollinations.ai)** with no uptime SLA and no privacy guarantees — fine for a demo, but a real product would need a more durable, billable provider.
- **No undo/redo, no responsive/mobile builder layout, no multi-page apps** — all explicitly out of scope per the build plan.
- **localStorage has practical size limits** (~5MB) that haven't been addressed; not a problem yet at this scale, but will be the forcing function for the backend phase.
- **"Published" is a local snapshot, not a real deploy.** Editing a published app correctly reverts it to draft, but there's still no server-side copy — the published URL only resolves in the browser that has the app saved locally.

## Future Roadmap

Near-term (still local-only, extends current architecture):
- Wire Discover's "Use template" into real app creation (clone seeded widgets into a new app)
- Per-app thumbnails reflecting actual widget content instead of a rotating color palette
- A more durable image provider once the project needs to handle real (non-demo) user prompts

Backend phase:
- **Supabase/PostgreSQL** — replace `localStorage` with real, server-side persistence
- **Real authentication** — Supabase Auth replacing the hardcoded mock user, with real per-user data isolation
- **Real publishing/hosting** — a published app reachable from any browser, not just the creator's own `localStorage`
- Connect Chat Box to a real conversational flow
- Login/onboarding pages
- Possible migration of the canvas to React Flow + Zustand if visual connections become a priority
- Zod schema validation at system boundaries
