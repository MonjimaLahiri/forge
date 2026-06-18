# Project Status

Last updated: Phase 4 complete.

## Build Philosophy

Forge is built in phases, each one shippable and demoable on its own, rather than building the full app at once:

1. **Phase 1** — static app shell and mock screens
2. **Phase 2** — builder canvas with mock data
3. **Phase 3** — widget properties and connections (prompt references)
4. **Phase 4** — real AI integration (this phase)
5. **Phase 5** — backend, auth, database, production AI infrastructure (not started)

## Completed Phases

### Phase 1 — Shell & mock screens
Dashboard, My Apps, and Discover pages exist with seeded mock data (`lib/mock-data.ts`) and full navigation. **Gap from the original plan:** `/login` and `/onboarding` were never built — there is no auth placeholder at all, just a hardcoded mock user.

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

## Feature Matrix

| Feature | Status | Notes |
|---|---|---|
| Dashboard / My Apps / Discover navigation | ✅ Built | Seeded mock data, not live persistence |
| Add/drag/select/delete widgets | ✅ Built | Custom canvas, not React Flow |
| Widget properties panel | ✅ Built | All 5 widget types |
| Prompt reference system | ✅ Built | `{{widgetId.value}}` tokens |
| Validation / readiness checklist | ✅ Built | Errors + warnings, blocks nothing — advisory only |
| Preview mode | ✅ Built | Toggled in-component, not a route |
| Text Generator → real AI | ✅ Built | Gemini, server-side, 3-model fallback chain |
| Image Generator | 🟡 Mocked | CSS/SVG gradient placeholder, explicitly not connected to any API |
| Chat Box | 🟡 Mocked | Keyword-based canned replies |
| Auto-save | ✅ Built | Single global draft in `localStorage`, debounced 500ms |
| Multi-app persistence | ❌ Not built | `[appId]` route param exists but is ignored |
| Login / onboarding | ❌ Not built | Hardcoded mock user |
| Real publish flow | ❌ Not built | Checklist modal placeholder only |
| Database / Supabase | ❌ Not built | Phase 5 |
| Real auth | ❌ Not built | Phase 5 |
| React Flow / Zustand | ❌ Not adopted | Custom canvas + local state used instead |

## Known Limitations

- **Single global draft, not multi-app.** The builder route is `/builder/[appId]`, but `BuilderRoot.tsx` ignores the `appId` param entirely and always reads/writes one `localStorage` key (`forge_builder_draft`). "Create New" always opens the same draft slot.
- **My Apps and Discover are static.** They render `MOCK_DRAFT_APPS`, `MOCK_PUBLISHED_APPS`, and `MOCK_TEMPLATES` from `lib/mock-data.ts`. Deleting, editing, or publishing an app there doesn't touch real state.
- **No auth.** The sidebar greets a hardcoded "Alex." There's no session, no login form, no per-user data isolation.
- **Publish is a placeholder.** Clicking Publish opens a checklist modal; it does not change any app's status or make anything accessible outside the builder.
- **Widget connections are textual, not visual.** There are no graph edges between widgets — references live inside prompt strings as `{{id.value}}` tokens, validated but not drawn.
- **Image Generator and Chat Box are fully mocked.** No real image generation API and no real conversational AI are wired up yet, by design for this phase.
- **No undo/redo, no responsive/mobile builder layout, no multi-page apps** — all explicitly out of scope per the build plan.
- **localStorage has practical size limits** (~5MB) that haven't been addressed; not a problem yet at this scale.

## Future Improvements (Roadmap)

Near-term (extends current architecture, no Phase 5 dependencies):
- Per-app persistence keyed by `appId`, so the builder route param is actually used
- Real `/preview/[appId]` route instead of an in-component mode toggle
- Wire My Apps delete/edit/preview actions to real saved-app state
- Real publish flow: flip `status` to `published`, set `publishedAt`, surface in My Apps
- Connect Image Generator to a real image API, Chat Box to a real conversational flow

Longer-term (Phase 5):
- Supabase/PostgreSQL backend
- Real authentication (replacing the mock user)
- Login/onboarding flow
- Possible migration of the canvas to React Flow + Zustand if visual connections become a priority
- Zod schema validation at system boundaries
