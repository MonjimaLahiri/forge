@AGENTS.md

# Forge AI Builder

## Product Summary

Forge is a no-code AI app builder for non-technical users. Users can create simple AI-powered web apps by adding components, configuring properties, connecting components, previewing the result, and publishing a usable app.

The product is inspired by tools like Appsmith, Retool, Webflow, and lightweight AI workflow builders, but the MVP should stay focused and practical.


## Primary User

The primary user is a non-technical marketing, support, operations, or product teammate who wants to create a simple AI tool without asking engineering.

They may want to build:

\- FAQ chatbot

\- Lead qualifier

\- Product description generator

\- Social caption generator

\- Image prompt generator

\- Internal workflow assistant

\- Learning assistant


## UX Principle

The builder must feel simple and understandable. Avoid exposing technical terms like schema, JSON, API, nodes, or graph unless necessary. Use plain-language labels and helper text.

Good UX matters more than maximum flexibility.

## MVP Scope

Build these areas first:

1\. Auth placeholder or mock auth

2\. Dashboard showing saved apps

3\. My Apps page

4\. Discover/template gallery

5\. App Builder canvas

6\. Component sidebar

7\. Properties panel

8\. Preview mode

9\. Publish flow placeholder

## Build Rule

Do not build the full app at once. Work in phases.

Phase 1: static app shell and mock screens.
Phase 2: builder canvas with mock data.
Phase 3: widget properties and connections.
Phase 4: save/load app JSON locally.
Phase 5: backend, auth, database, and AI APIs.

Before writing code, always explain the plan first.
Do not install new packages without asking.
Do not add features beyond the current phase.

## Builder Components

The builder supports these component types:

### Static Text Box

Properties:

\- position: x, y

\- dimensions: width, height

\- title

\- text content


### Input Box

Properties:

\- position: x, y

\- dimensions: width, height

\- title

\- placeholder


### LLM Box

Properties:

\- position: x, y

\- dimensions: width, height

\- title

\- placeholder

\- prompt

\- model

\- temperature


### Image Box

Properties:

\- position: x, y

\- dimensions: width, height

\- title

\- image prompt

\- image style preset


### Chat Box

Properties:

\- position: x, y

\- dimensions: width, height

\- title

\- placeholder

\- initial prompt


## Core Interaction

Users should be able to:

\- Add components to the canvas

\- Drag components around

\- Select a component

\- Edit its properties

\- Connect components

\- Save the app

\- Preview the app

\- Publish the app

## Tech Stack

Use:

\- Next.js App Router

\- TypeScript

\- Tailwind CSS

\- React Flow for canvas and connections

\- Radix UI for accessible UI primitives

\- Zod for validation

\- Supabase and PostgreSQL later

\- Gemini/OpenAI API later through server-side routes only



## Frontend Design Direction

Use the installed frontend-design plugin when generating UI.

Design should feel:

\- clean

\- modern

\- product-led

\- trustworthy

\- slightly technical but approachable

\- more like a polished SaaS product than a playful toy

Avoid:

\- generic purple AI gradients

\- cookie-cutter cards

\- overly decorative UI

\- hard-to-read text

\- cluttered property panels


## Accessibility Rules

Always include:

\- semantic HTML

\- visible focus states

\- accessible labels

\- keyboard-friendly controls

\- responsive layouts

\- clear error states

\- loading states

\- empty states


## Coding Rules

\- Use TypeScript everywhere.

\- Keep components small and composable.

\- Do not expose API keys in client code.

\- Store app definitions as structured objects.

\- Keep builder state predictable.

\- Add comments only for complex logic.

\- Run lint/typecheck after major changes.

\- Prefer simple, working MVP over over-engineered architecture.

# Product Name

The product is called Forge.

Forge is an AI no-code app builder where users create small AI-powered apps by adding widgets, configuring prompts, connecting inputs, previewing, and publishing.

## Reference Images

Use the .png image references for UI in: \docs\reference wireframes
Interpret them as product references, not exact visual designs.


