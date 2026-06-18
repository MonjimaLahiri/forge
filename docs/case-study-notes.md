# Case Study Notes

A narrative account of the decisions behind Forge — written for interviews, portfolio reviews, and anyone trying to understand *why* the codebase looks the way it does, not just *what* it does.

## The Problem

Non-technical teams want small, single-purpose AI tools constantly — a chatbot that answers FAQs, a generator that drafts product descriptions, a form that scores leads — but the two paths available to them today both fail:

- **Ask engineering.** Even a trivial tool competes with the real backlog and takes days or weeks to land.
- **Use a general no-code platform** (Retool, Appsmith, Webflow). These are built for technical builders — they expose databases, REST endpoints, and "node" terminology that assumes the user already thinks like a developer.

Forge's hypothesis: the gap is a builder that hides every technical concept that isn't load-bearing for the task — no schema, no JSON, no API config — while still being a real builder with properties, previews, and live AI behind it.

## Design Decisions & Trade-offs

### Phased delivery over a big-bang build
The build plan explicitly forbids building the full app in one pass: static shell first, then a mock canvas, then properties/validation, then real AI, with backend/auth deliberately last. This kept every phase demoable and let the highest-uncertainty piece — "does the prompt-reference + AI-generation UX actually feel simple?" — get validated in Phase 3/4 without first sinking time into auth and a database that might need to change shape once the widget model settled.

### A hand-rolled canvas instead of React Flow (so far)
The plan called for React Flow + Zustand from the start. In practice, Phase 2 shipped a simpler canvas: plain absolutely-positioned `div`s, manual mouse-event dragging, and local `useState` for everything. This was a deliberate sequencing choice — get widgets on screen and editable fast, defer the heavier dependency until it's clear visual *connections* (not just references) are actually needed. The cost is visible now: the `[appId]` route param is unused, there's no per-app persistence, and "connections" between widgets are implemented as string tokens in prompts rather than graph edges. Both are named, tracked trade-offs (see [`project-status.md`](project-status.md)), not unnoticed gaps — they don't block the current value proposition (configure a widget, reference another widget's value, generate, preview) but they cap how far the product can scale without a revisit.

### String-token references instead of visual wires
Rather than React Flow edges, widgets reference each other via `{{widgetId.value}}` tokens inside prompt text. This was the more "no-code-for-non-technical-users" choice in disguise: a visual wire diagram looks like a flowchart, which is exactly the "graph" mental model the product brief says to avoid surfacing. Typing a reference into a prompt — with inline validation catching broken references before generation — keeps the user's attention on the prompt itself, which is the actual product surface for an LLM widget.

### Provider-agnostic AI integration, chosen pragmatically
The Text Generator widget went through three provider iterations during development: Anthropic's Claude API → Hugging Face's free Inference API → Google's Gemini API. Each swap only ever touched one file (`src/app/api/generate-text/route.ts`) because the integration point was designed from the start as "one server route, one mock fallback, one response shape" — the client and the rest of the app never needed to know which provider was behind the curtain. That isolation is what made it possible to land on Gemini in minutes once a key was available, after both Anthropic (no key available) and Hugging Face (would have required a separate token + had cold-start reliability issues) were ruled out.

### Graceful degradation as a first-class behavior, not an afterthought
From the first AI integration, "no API key configured" was treated as a normal, expected state — not an error path — because the project needs to demo and develop cleanly with zero external dependencies. The mock generator (`lib/mockText.ts`) was extracted out specifically so the exact same function backs three situations: local dev with no key, a demo environment, and a live key that happens to fail. The UI was then built to *say* which situation it's in ("Generated with Gemini" vs "Mock output," plus a friendly notice when a live key failed) rather than hide the distinction — because silently swapping real output for mock output would be the kind of thing that erodes trust the moment someone notices.

## Challenges & How They Were Solved

**Gemini's free-tier quota was unpredictable per-model.** The first working key authenticated successfully but returned `RESOURCE_EXHAUSTED` (zero allocated quota) on `gemini-2.0-flash`. Rather than surfacing that as a hard error, the route tries a small ordered list of models (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash`) and advances on *any* failure — quota, safety block, empty response, or network error — landing on whichever model the key actually has quota for. This turned a brittle single-model integration into one that's resilient to a category of failure that's effectively unavoidable on free-tier API keys.

**Verbose LLM output didn't match the product's voice.** Early generations were multi-paragraph and offered multiple options unprompted — fine for a chat assistant, wrong for a widget meant to drop a short marketing string into a non-technical user's app. Fixed with a Gemini `systemInstruction` (2–3 sentences, one version, copy only, no preamble) plus a lowered `maxOutputTokens`, rather than asking users to write better prompts themselves.

**Avoiding scope creep while integrating a real API.** Each AI-integration step explicitly listed what *not* to touch — no database, no auth, no React Flow migration, no real image generation — so a single feature (real text generation) didn't quietly drag in four other half-finished systems. This kept the AI integration reviewable as one coherent change instead of a sprawling refactor.

## What I'd Do Differently / Next

- Introduce per-app persistence (keyed by the already-existing `[appId]` route param) before adding more widget types — right now every "app" the builder edits is actually the same global draft.
- Revisit the canvas once visual connections are actually needed; React Flow is still the right tool if/when prompt-token references stop being sufficient for users.
- Add a real publish flow before adding more AI providers — the value of "real AI" is capped until a published app is actually shareable.
- Extend the provider-isolation pattern (one route, one mock fallback, one response shape) to Image Generator and Chat Box when those move off mock, rather than designing those integrations from scratch.

## Reflection

The throughline across these decisions is sequencing: ship the smallest version of each capability that proves the UX works, name the resulting gap explicitly instead of papering over it, and keep the next phase's blast radius small by being precise about what it does *not* include. The codebase has visible seams as a result (an unused route param, a mocked Image Generator) — but every one of them is a known, written-down trade-off rather than a surprise waiting to be discovered in code review.
