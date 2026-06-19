# Project Status

Last updated: Phase 6 (Supabase backend) complete — auth, profile setup, cloud persistence, local-app import, password reset.

## Build Philosophy

Forge is built in phases, each one shippable and demoable on its own, rather than building the full app at once:

1. **Phase 1** — static app shell and mock screens
2. **Phase 2** — builder canvas with mock data
3. **Phase 3** — widget properties and connections (prompt references)
4. **Phase 4** — real AI integration
5. **Phase 5 (Productization)** — turn the single-draft builder into a real multi-app product, still on `localStorage` only (complete: storage, app management, publishing, real image generation, publish/draft correctness)
6. **Phase 6 (Backend)** — Supabase Auth, profile setup, Postgres-backed app storage with RLS, local-to-cloud import, password reset (complete)

Note on naming: the original build plan called the backend/auth/database work "Phase 5." That work is now what's labeled "Phase 6" below — a productization arc (local-only multi-app management and publishing) was inserted before it as "Phase 5," to prove out the product surface before taking on a real backend.

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

### Phase 6.1–6.3 — Supabase Auth, identity, schema
- `@supabase/ssr` browser/server clients; `src/proxy.ts` refreshes the session on each request, no-op'ing gracefully when Supabase env vars aren't set
- `/login`, `/signup`, `/logout` (via Sidebar) wired to real `supabase.auth` calls; Sidebar shows real identity instead of a hardcoded mock user
- `docs/supabase-schema.sql`: `profiles` and `apps` tables, Row Level Security on both, a `handle_new_user()` trigger that auto-creates a profile row at signup

### Phase 6.4 — Cloud app storage
- `lib/cloudStorage.ts`: Supabase-backed equivalent of every `storage.ts` operation (`listApps`, `getApp`, `createApp`, `saveApp`, `deleteApp`, `publishApp`, `duplicateApp`), including the publish/draft-revert rule
- `lib/appStore.ts`: auth-aware dispatcher — logged out routes to the original, untouched `storage.ts`; logged in routes to `cloudStorage.ts`
- `BuilderRoot.tsx`, `AppCard.tsx`, `RuntimeRoot.tsx`, `my-apps/page.tsx` switched from `storage.ts` to `appStore.ts`; added an `'error'` save state so a failed cloud write is visible, not silent

### Phase 6.5 — Local app import after login
- After login, My Apps compares local app ids against the user's cloud app ids and shows a one-time banner for anything not yet imported
- Import reuses each local app's original id/timestamps (a copy, not a fresh row) — naturally idempotent, since a repeat import collides on the primary key instead of duplicating
- Declining or dismissing never deletes the local copy; it's re-offered on a future login

### Phase 6.6 — Auth/profile UX, password reset
- `/profile-setup`: username + one of 8 fixed emoji avatars, required after first login (detected via `getPostAuthRedirect`, which checks whether `display_name` is set)
- Real identity (`useIdentity.ts`) replaces the hardcoded "Alex" greeting/avatar everywhere: dashboard, my-apps, discover topbar, and the sidebar identity block
- `PasswordInput.tsx`: hand-rolled show/hide eye icon (no icon package installed, consistent with the rest of the project's inline SVGs)
- `/forgot-password` → email link → `/reset-password`, using Supabase's `resetPasswordForEmail`/`updateUser`; forgot-password always shows the same success copy regardless of whether the account exists, to avoid leaking account existence
- **Bug found during manual testing, fixed in the same phase:** accounts created before the Phase 6.3 trigger existed had no `profiles` row at all. `saveProfile()`'s plain `UPDATE` against that missing row silently affected zero rows (no error) — the save appeared to succeed but nothing persisted, which also explained why the sidebar kept showing the letter-fallback avatar instead of the chosen emoji. Fixed with an `insert` RLS policy (`auth.uid() = id`) plus switching `saveProfile()` from `.update()` to `.upsert()`.

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
| **Multi-app persistence** | ✅ Built | `localStorage` (logged out) or Supabase `apps` table (logged in), each app independent |
| **Rename / Duplicate / Delete** | ✅ Built | From My Apps card menu and builder header (rename) |
| **Publish flow** | ✅ Built | Real status change; cloud apps get a real shareable row, local apps stay browser-bound |
| **Public runtime route** (`/app/[appId]`) | ✅ Built | No builder chrome; cloud apps resolve from any browser, local-only apps stay browser-bound |
| **Publish/draft correctness** | ✅ Built | Editing a published app reverts it to draft until republished — enforced in both `storage.ts` and `cloudStorage.ts` |
| **Authentication (Supabase Auth)** | ✅ Built | Sign up, log in, log out, forgot/reset password |
| **Profile setup** (username + avatar) | ✅ Built | Required after first login; drives real identity in greeting/sidebar |
| **Cloud app persistence (Supabase)** | ✅ Built | RLS-protected `apps`/`profiles` tables; auth-aware dispatch via `appStore.ts` |
| **localStorage fallback** | ✅ Built | Logged-out users keep the full Phase 5 local-only experience, untouched |
| **Local app import after login** | ✅ Built | One-time banner, copy not move, idempotent, never deletes local data |
| React Flow / Zustand | ❌ Not adopted | Custom canvas + local state used instead |
| Real hosting for *local-only* published apps | ❌ Not built | Apps published while logged out are still browser-bound; logging in + importing resolves this |

## Known Limitations

- **Local-only "published" apps aren't really public.** If a logged-out user publishes an app, `/app/[appId]` still reads from that browser's `localStorage` — the URL only resolves for whoever has that app saved locally. Logging in and importing the app makes it a real, anywhere-reachable cloud row.
- **Pre-migration accounts needed a backfill fix.** Any Supabase account created before the Phase 6.3 schema/trigger was applied has no `profiles` row at all; `saveProfile()` now upserts (with a matching `insert` RLS policy) specifically to handle this, but it's a reminder that schema migrations and existing auth users can drift apart silently.
- **Discover is still static.** Templates are seeded mock data; "Use template" links to `/builder/new` but doesn't actually clone the template's content into the new app.
- **Widget connections are textual, not visual.** There are no graph edges between widgets — references live inside prompt strings as `{{id.value}}` tokens, validated but not drawn.
- **Chat Box is fully mocked.** No real conversational AI wired up yet, by design.
- **Image Generator depends on a free, unaffiliated third-party service (Pollinations.ai)** with no uptime SLA and no privacy guarantees — fine for a demo, but a real product would need a more durable, billable provider.
- **No undo/redo, no responsive/mobile builder layout, no multi-page apps** — all explicitly out of scope per the build plan.
- **No social/OAuth login** — email/password only.
- **localStorage has practical size limits** (~5MB), only relevant to logged-out usage now that logged-in storage is in Postgres.

## Future Roadmap

- Real hosting/CDN for published apps regardless of auth state — the remaining gap now that cloud-stored published apps already resolve from any browser
- Wire Discover's "Use template" into real app creation (clone seeded widgets into a new app)
- Per-app thumbnails reflecting actual widget content instead of a rotating color palette
- A more durable image provider once the project needs to handle real (non-demo) user prompts
- Connect Chat Box to a real conversational flow
- Social/OAuth login options
- Possible migration of the canvas to React Flow + Zustand if visual connections become a priority
- Zod schema validation at system boundaries
