# Case Study Notes

A narrative account of the decisions behind Forge — written for interviews, portfolio reviews, and anyone trying to understand *why* the codebase looks the way it does, not just *what* it does.

## The Problem

Non-technical teams want small, single-purpose AI tools constantly — a chatbot that answers FAQs, a generator that drafts product descriptions, a form that scores leads — but the two paths available to them today both fail:

- **Ask engineering.** Even a trivial tool competes with the real backlog and takes days or weeks to land.
- **Use a general no-code platform** (Retool, Appsmith, Webflow). These are built for technical builders — they expose databases, REST endpoints, and "node" terminology that assumes the user already thinks like a developer.

Forge's hypothesis: the gap is a builder that hides every technical concept that isn't load-bearing for the task — no schema, no JSON, no API config — while still being a real builder with properties, previews, live AI, and a publish button behind it.

## Target User

A non-technical marketing, support, operations, or product teammate — comfortable with spreadsheets and SaaS dashboards, not with code, JSON, or API documentation — who wants to self-serve a small AI tool without filing an engineering ticket. The apps they'd build are narrow and single-purpose by nature: an FAQ chatbot, a lead qualifier, a product description generator, a social caption generator, an image prompt generator, an internal workflow assistant, a learning assistant. None of these need a database schema or a workflow graph in the user's head — they need a handful of widgets, a way to wire one widget's output into another's prompt, a real model behind the "Generate" button, and a link they can hand to someone else. Every UX decision below is in service of that user specifically, not a technical builder who'd tolerate (or want) more exposed machinery.

## UX Decisions

### String-token references instead of visual wires
Rather than React Flow edges, widgets reference each other via `{{widgetId.value}}` tokens inside prompt text. This was the more "no-code-for-non-technical-users" choice in disguise: a visual wire diagram looks like a flowchart, which is exactly the "graph" mental model the product brief says to avoid surfacing. Typing a reference into a prompt — with inline validation catching broken references before generation — keeps the user's attention on the prompt itself, which is the actual product surface for an LLM widget.

### Graceful degradation as a first-class behavior, not an afterthought
From the first AI integration, "no API key configured" or "the provider failed" was treated as a normal, expected state — not an error path — because the product needs to demo and develop cleanly with zero external dependencies, and a non-technical user shouldn't ever see a broken widget because of a quota limit they have no way to understand. The same mock generator backs every failure mode (no key, quota exhausted, safety-blocked, network error) for both Text and Image Generator, and the UI *says* which situation it's in ("Generated with Gemini" / "AI generated" vs "Mock output," plus a friendly notice when a live provider failed) rather than hiding the distinction — silently swapping real output for mock output would be the kind of thing that erodes trust the moment someone notices.

### Publish state as a live promise, not a one-way flag
Early on, "Publish" only ever moved an app from Drafts to Published — nothing moved it back, so editing a published app silently left a stale "Published" label on something whose live content no longer matched what publishing implied. For a non-technical user, "Published" should mean "what's at this link is what I built" at all times, not "I clicked Publish once." The fix treats every edit to a published app as invalidating that promise: it reverts to Draft automatically, and the public page says plainly "This app is not currently published" rather than quietly serving something that drifted from what was published.

## Trade-offs

### Phased delivery over a big-bang build
The build plan explicitly forbids building the full app in one pass: static shell first, then a mock canvas, then properties/validation, then real AI, then productization (multi-app storage, app management, publishing, real image generation, publish-state correctness), with the real backend deliberately last. This kept every phase demoable and let the highest-uncertainty pieces — "does the prompt-reference + AI-generation UX actually feel simple?", later "does a localStorage-only app model hold up once there are multiple real apps, not one draft?" — get validated incrementally instead of front-loading auth and a database that might need to change shape once the widget model settled.

### A hand-rolled canvas instead of React Flow (so far)
The plan called for React Flow + Zustand from the start. In practice, Phase 2 shipped a simpler canvas: plain absolutely-positioned `div`s, manual mouse-event dragging, and local `useState` for everything. This was a deliberate sequencing choice — get widgets on screen and editable fast, defer the heavier dependency until it's clear visual *connections* (not just references) are actually needed. That's a named, tracked trade-off, not an unnoticed gap — it doesn't block the current value proposition but it caps how far the product can scale without a revisit.

### Provider-agnostic AI integration, chosen pragmatically
The Text Generator widget went through three provider iterations during development: Anthropic's Claude API → Hugging Face's free Inference API → Google's Gemini API. Each swap only ever touched one file (`src/app/api/generate-text/route.ts`) because the integration point was designed from the start as "one server route, one mock fallback, one response shape" — the client and the rest of the app never needed to know which provider was behind the curtain. That same isolation paid off again for the Image Generator: when Gemini's image models turned out to be paid-only, switching to Pollinations.ai touched exactly one route file and a few lines of UI copy.

### Choosing a free, unaffiliated image provider over Google's official one
The natural choice for image generation was extending the existing Gemini integration to its "Nano Banana" image models — same key, same API family, zero new setup. Live testing against the API disproved that plan: every Gemini image model (`gemini-2.5-flash-image`, both `gemini-3-pro-image` variants, both `gemini-3.1-flash-image` variants) returned a hard `RESOURCE_EXHAUSTED` with `limit: 0` on the free tier, and the standalone Imagen models rejected requests outright as paid-plan-only. Google appears to have made Gemini image generation entirely paid sometime after this project's key was first issued for text. Pollinations.ai — a free, keyless public image API — was adopted instead specifically because it cost nothing to integrate (no new package, no new secret, no billing setup), at the explicit cost of depending on a smaller, less accountable service with no SLA. That trade-off is named in the docs rather than hidden, since it's exactly the kind of thing a reviewer should be able to find and question.

### Migrating storage shape without a "migration script"
Going from one global draft to a real multi-app array could have been a breaking change for anyone with in-progress work. Instead, `lib/storage.ts` detects the old format on first read and folds it into the new array automatically, then deletes the old key — no separate migration step to remember to run, no user-visible "upgrading your data" moment. The cost was small (a few lines in the one module that already owned all storage access) for a real reliability win: nobody's work disappears across an upgrade.

### Reusing one render path for both "preview" and "published"
Once a public `/app/[appId]` route was needed, the obvious risk was ending up with two slightly-different implementations of "render this app's widgets live" — one for the builder's Preview button, one for the new public page — that would quietly drift apart over time. Instead, the actual widget-rendering logic was extracted into a single `AppCanvas` component used by both, and only the genuinely different surrounding chrome was left separate. Net result was less code than before, not more, despite adding a whole new route.

### Centralizing the publish/draft revert in one function
The fix for stale "Published" labels could have been implemented at each edit site (builder autosave, Reset button, My Apps rename) — three places independently checking "was this published? demote it." Instead it lives once, inside `saveApp`, the single function all three already call. This works because every call site already only invokes `saveApp` on a genuine change (the autosave effect diffs serialized state first; rename bails out on a no-op), so unconditionally demoting inside `saveApp` is correct without adding a second "did anything really change" check anywhere.

## Outcome

**Gemini's free-tier quota was unpredictable per-model, for both text and images.** For text, the first working key authenticated successfully but returned `RESOURCE_EXHAUSTED` on `gemini-2.0-flash`; the fix was a small ordered fallback chain across three models, advancing on any failure. For images, the same diagnostic instinct — test directly against the live API rather than assume — revealed something more fundamental: every Gemini image model had zero free-tier quota, full stop, which a fallback chain across Gemini models alone couldn't fix. Recognizing that distinction (a per-model quirk vs. a category-wide paid wall) was what led to pivoting providers entirely rather than just adding more retries.

**Verbose LLM output didn't match the product's voice.** Early generations were multi-paragraph and offered multiple options unprompted — fine for a chat assistant, wrong for a widget meant to drop a short marketing string into a non-technical user's app. Fixed with a Gemini `systemInstruction` (2–3 sentences, one version, copy only, no preamble) plus a lowered `maxOutputTokens`, rather than asking users to write better prompts themselves.

**A dropdown menu clipped by its own card.** The My Apps card needed `overflow-hidden` so its thumbnail respected rounded corners, but that same property clipped the rename/duplicate/delete dropdown the moment it opened. The fix was noticing the `overflow-hidden` was on the wrong element — moving it down to just the thumbnail `<div>` fixed the clipping with a two-line diff.

**A real correctness bug, not just a missing feature.** "Published apps stay published forever, even after editing" wasn't a stretch goal that got cut — it was a bug a user caught by actually using the product end to end (publish, then edit, then notice the status hadn't changed). That's the kind of gap that's nearly invisible in code review but obvious in five seconds of real usage, which is the whole argument for shipping incrementally and actually clicking through each phase rather than trusting the diff alone.

**Avoiding scope creep while shipping each step.** Every step in this build explicitly listed what *not* to touch — no database, no auth, no React Flow migration, no redesigning My Apps. That discipline is why a long arc (multi-app storage → rename/duplicate/delete → public route → real image generation → publish correctness) landed as a sequence of clean, reviewable diffs instead of one tangled one.

The throughline across all of this is sequencing: ship the smallest version of each capability that proves the UX works, name the resulting gap explicitly instead of papering over it, and keep each step's blast radius small by being precise about what it does *not* include. That discipline is also what made it safe to swap an entire AI provider (Pollinations for Gemini images) and fix a cross-cutting status bug (publish/draft correctness) in the same project without re-litigating earlier layers — the storage rewrite never touched the AI routes, and the new image provider never touched the publish logic.

## Future Improvements

- The backend phase (Supabase, real auth, real hosting) is the obvious next move — `localStorage` has done its job of letting the product surface get validated cheaply, but it's the ceiling now, not a stepping stone to optimize further.
- Replace Pollinations.ai with a more durable, accountable image provider once this needs to handle real (non-demo) user prompts — the free/keyless trade-off was right for proving the feature, not for a product with real users.
- Wire Discover's "Use template" into actually cloning a template's widgets, now that `duplicateApp`-style logic already exists and could be reused.
- Surface "unpublished changes" more gracefully than a binary draft/published flip — e.g., a "republish" prompt that shows what changed, rather than silently demoting and requiring the user to notice and re-publish.
- Once there's a real backend, revisit whether the canvas needs React Flow — multi-app management didn't end up requiring it, but real collaboration or cross-app connections might.
