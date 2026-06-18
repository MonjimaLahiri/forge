# Case Study Notes

A narrative account of the decisions behind Forge — written for interviews, portfolio reviews, and anyone trying to understand *why* the codebase looks the way it does, not just *what* it does.

## The Problem

Non-technical teams want small, single-purpose AI tools constantly — a chatbot that answers FAQs, a generator that drafts product descriptions, a form that scores leads — but the two paths available to them today both fail:

- **Ask engineering.** Even a trivial tool competes with the real backlog and takes days or weeks to land.
- **Use a general no-code platform** (Retool, Appsmith, Webflow). These are built for technical builders — they expose databases, REST endpoints, and "node" terminology that assumes the user already thinks like a developer.

Forge's hypothesis: the gap is a builder that hides every technical concept that isn't load-bearing for the task — no schema, no JSON, no API config — while still being a real builder with properties, previews, live AI, and a publish button behind it.

## Design Decisions & Trade-offs

### Phased delivery over a big-bang build
The build plan explicitly forbids building the full app in one pass: static shell first, then a mock canvas, then properties/validation, then real AI, then productization (multi-app storage, app management, publishing), with the real backend deliberately last. This kept every phase demoable and let the highest-uncertainty pieces — "does the prompt-reference + AI-generation UX actually feel simple?", later "does a localStorage-only app model hold up once there are multiple real apps, not one draft?" — get validated incrementally instead of front-loading auth and a database that might need to change shape once the widget model settled.

### A hand-rolled canvas instead of React Flow (so far)
The plan called for React Flow + Zustand from the start. In practice, Phase 2 shipped a simpler canvas: plain absolutely-positioned `div`s, manual mouse-event dragging, and local `useState` for everything. This was a deliberate sequencing choice — get widgets on screen and editable fast, defer the heavier dependency until it's clear visual *connections* (not just references) are actually needed. "Connections" between widgets are still implemented as string tokens in prompts rather than graph edges. That's a named, tracked trade-off, not an unnoticed gap — it doesn't block the current value proposition (configure a widget, reference another widget's value, generate, preview, publish) but it caps how far the product can scale without a revisit.

### String-token references instead of visual wires
Rather than React Flow edges, widgets reference each other via `{{widgetId.value}}` tokens inside prompt text. This was the more "no-code-for-non-technical-users" choice in disguise: a visual wire diagram looks like a flowchart, which is exactly the "graph" mental model the product brief says to avoid surfacing. Typing a reference into a prompt — with inline validation catching broken references before generation — keeps the user's attention on the prompt itself, which is the actual product surface for an LLM widget.

### Provider-agnostic AI integration, chosen pragmatically
The Text Generator widget went through three provider iterations during development: Anthropic's Claude API → Hugging Face's free Inference API → Google's Gemini API. Each swap only ever touched one file (`src/app/api/generate-text/route.ts`) because the integration point was designed from the start as "one server route, one mock fallback, one response shape" — the client and the rest of the app never needed to know which provider was behind the curtain. That isolation is what made it possible to land on Gemini in minutes once a key was available.

### Graceful degradation as a first-class behavior, not an afterthought
From the first AI integration, "no API key configured" was treated as a normal, expected state — not an error path — because the project needs to demo and develop cleanly with zero external dependencies. The mock generator (`lib/mockText.ts`) was extracted out specifically so the exact same function backs three situations: local dev with no key, a demo environment, and a live key that happens to fail. The UI was then built to *say* which situation it's in ("Generated with Gemini" vs "Mock output," plus a friendly notice when a live key failed) rather than hide the distinction — because silently swapping real output for mock output would be the kind of thing that erodes trust the moment someone notices.

### Migrating storage shape without a "migration script"
Going from one global draft to a real multi-app array could have been a breaking change for anyone with in-progress work. Instead, `lib/storage.ts` detects the old format on first read and folds it into the new array automatically, then deletes the old key — no separate migration step to remember to run, no user-visible "upgrading your data" moment. The cost was small (a few lines in the one module that already owned all storage access) for a real reliability win: nobody's work disappears across an upgrade.

### Reusing one render path for both "preview" and "published"
Once a public `/app/[appId]` route was needed, the obvious risk was ending up with two slightly-different implementations of "render this app's widgets live" — one for the builder's Preview button, one for the new public page — that would quietly drift apart over time (one gets a bugfix, the other doesn't). Instead, the actual widget-rendering logic was extracted into a single `AppCanvas` component used by both, and only the genuinely different surrounding chrome (preview's dismissible error banner vs. the public page's "Edit app" link) was left separate. Net result was less code than before, not more, despite adding a whole new route.

## Challenges & How They Were Solved

**Gemini's free-tier quota was unpredictable per-model.** The first working key authenticated successfully but returned `RESOURCE_EXHAUSTED` (zero allocated quota) on `gemini-2.0-flash`. Rather than surfacing that as a hard error, the route tries a small ordered list of models (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash`) and advances on *any* failure — quota, safety block, empty response, or network error — landing on whichever model the key actually has quota for.

**Verbose LLM output didn't match the product's voice.** Early generations were multi-paragraph and offered multiple options unprompted — fine for a chat assistant, wrong for a widget meant to drop a short marketing string into a non-technical user's app. Fixed with a Gemini `systemInstruction` (2–3 sentences, one version, copy only, no preamble) plus a lowered `maxOutputTokens`, rather than asking users to write better prompts themselves.

**A dropdown menu clipped by its own card.** The My Apps card needed `overflow-hidden` so its thumbnail respected rounded corners, but that same property clipped the new rename/duplicate/delete dropdown the moment it opened. The fix wasn't a portal or a z-index war — it was noticing the `overflow-hidden` was on the wrong element. Moving it down to just the thumbnail `<div>` (with matching corner-rounding) fixed the clipping with a two-line diff and zero new complexity.

**Avoiding scope creep while shipping each step.** Every step in this build explicitly listed what *not* to touch — no database, no auth, no React Flow migration, no real image generation, no redesigning My Apps. That discipline is why a four-step arc (multi-app storage → rename/duplicate/delete → public route → docs) landed as four clean, reviewable diffs instead of one tangled one.

## What I'd Do Differently / Next

- The backend phase (Supabase, real auth, real hosting) is the obvious next move — `localStorage` has done its job of letting the product surface get validated cheaply, but it's the ceiling now, not a stepping stone to optimize further.
- Wire Discover's "Use template" into actually cloning a template's widgets, now that `duplicateApp`-style logic already exists and could be reused.
- Once there's a real backend, revisit whether the canvas needs React Flow — multi-app management didn't end up requiring it, but real collaboration or cross-app connections might.

## Reflection

The throughline across these decisions is sequencing: ship the smallest version of each capability that proves the UX works, name the resulting gap explicitly instead of papering over it, and keep each step's blast radius small by being precise about what it does *not* include. That discipline is also what made the productization arc (steps 1–3) safe to build on top of the AI integration without re-litigating it — the storage rewrite never touched the Gemini route, and the publish flow never touched the prompt reference system. Each layer stayed reviewable on its own terms.
