# Forge — MVP Build Plan

## 1. Product Summary

Forge is a no-code AI app builder for non-technical users. The primary audience is marketing, support, operations, and product teammates who want to create simple AI-powered tools without involving engineering.

Users build apps by:
1. Adding widgets to a canvas (text boxes, chat interfaces, AI generators)
2. Configuring each widget's properties through a panel
3. Drawing connections between widget outputs and inputs
4. Previewing the live result
5. Publishing a shareable link

The mental model is closer to a simplified Retool or Webflow, but purpose-built for AI use cases. Good UX matters more than maximum flexibility — this must feel simple enough for someone who has never opened a developer tool.

Example apps users might build: FAQ chatbot, lead qualifier, product description generator, social caption generator, internal workflow assistant.

---

## 2. MVP Scope

Build only what is listed here. Nothing else.

- Mock auth (no real OAuth or sessions)
- Dashboard / home screen
- My Apps page (drafts + published)
- Discover Apps / template gallery
- App Builder canvas
- Widget sidebar panel
- Widget properties panel
- Preview mode
- Publish flow placeholder (no real publishing)
- Local state only (no database)

---

## 3. Route List

| Route | Page |
|---|---|
| `/` | Redirect to `/login` |
| `/login` | Login / Signup (mock) |
| `/onboarding` | Profile creation (username + avatar) |
| `/dashboard` | Home dashboard |
| `/my-apps` | My Apps (drafts + published) |
| `/discover` | Discover Apps / template gallery |
| `/builder/[appId]` | App Builder canvas |
| `/preview/[appId]` | Preview mode (read-only render) |

---

## 4. Page-by-Page Breakdown

### `/login` — Login / Signup

**Layout:** Split panel. Left: branding, tagline, "Continue with Google" button, "Or" divider, email input, "Continue with email" button, "Already have an account? Log in" link. Right: a placeholder illustration area.

**Behavior (mock):**
- "Continue with Google" → navigates to `/onboarding`
- "Continue with email" → navigates to `/onboarding`
- "Log in" → navigates to `/dashboard`

**State:** None. Purely navigational in Phase 1.

---

### `/onboarding` — Profile Creation

**Layout:** Left half: large "Welcome, [name]!" heading. Right half: "Set your Username" labeled input, "Choose an Avatar" section with 8 preset circular avatar images arranged in a grid, "Save" button.

**Behavior:**
- Username and avatar selection saved to `localStorage` as the mock user profile
- Save → navigates to `/dashboard`

**Empty/error state:** Show inline error if username is blank on Save.

---

### `/dashboard` — Home

**Layout:**
- Top bar: "Hello, [username]!" greeting (left), "Create New" button (right)
- Left sidebar: persistent nav
- Content area: two-column grid
  - Left column: "Small Guides & Graphics" card (static), "Explore our Top Picks" card (links to `/discover`)
  - Right column: hero banner (decorative), "Build your App using Description" card with a textarea and "Generate App" button (disabled in Phase 1)

**Behavior:**
- "Create New" creates a new blank draft app (generates a UUID, writes to `localStorage`), navigates to `/builder/[newId]`
- "Explore" link → `/discover`
- "Generate App" button is visible but shows a "Coming soon" tooltip

---

### `/my-apps` — My Apps

**Layout:**
- Top bar: "Hello, [username]!" greeting, "Create New" button
- Left sidebar: persistent nav (My Apps active)
- Content area:
  - "Drafts" section header with arrow icon → scrollable row of app cards
  - "Published" section header with "View All" link → row of app cards
  - Each card: auto-generated thumbnail (preset icon), app name, last-edited or published date, `...` overflow button

**Card overflow menu actions:**
- Edit → navigates to `/builder/[appId]`
- Preview → navigates to `/preview/[appId]`
- Delete → confirmation, then removes from local store

**Empty states:**
- Drafts empty: "No drafts yet. Create your first app." with a "Create New" button
- Published empty: "Nothing published yet. Finish a draft and publish it."

---

### `/discover` — Discover Apps

**Layout:**
- Top bar: "Hello, [username]!", "Create New" button
- Left sidebar (Discover Apps active)
- Search bar (client-side filter of seeded data)
- "Featured" section: large colorful cards (3–4 items), each showing: app name, short description, author avatar + name, published date
- "All apps" section: standard 4-column grid of smaller cards with rating and clone count

**Behavior:**
- Search filters the seeded template list by name/description
- Clicking any template card: "Use this template" → clones the template as a new draft app → navigates to `/builder/[newId]`
- All data is seeded mock data — no API

---

### `/builder/[appId]` — App Builder

This is the most complex screen. Three distinct zones:

**Top bar:**
- Forge logo (left, links to `/dashboard`)
- App name (center-left, inline editable — click to edit)
- Auto-save status indicator ("Saved" / "Saving...")
- "Publish" button (right)

**Left sidebar (persistent across all pages):**
- Nav items: App Builder, My Apps, Discover Apps
- Lower: Support, Settings, Logout
- Bottom: user avatar + name

**Canvas (center, main area):**
- React Flow provider wraps the canvas
- Empty state: sparkle ✦ icon + "Start adding widgets to make your own customised AI app." + "Add a widget +" button
- Placed widgets render as React Flow custom nodes
- Connections rendered as React Flow edges
- Pan and zoom enabled

**Widget panel (right side, collapsible):**
- Collapsed: narrow strip showing icon for each widget type, with a `<` chevron to open
- Open: wider panel listing widget types with name, icon, and brief description
  - Static Text
  - User Input
  - Chat Box
  - Image Generator
  - Text Generator (LLM)
- Clicking a widget type adds it to the canvas at a default position
- `>` chevron to collapse

**Properties panel (replaces widget panel when a widget is selected):**
- Shows the selected widget's type as a heading
- Form fields for each property (see Widget Data Model)
- Changes are applied immediately (controlled inputs synced to builder state)
- "Delete widget" button at bottom

**Keyboard shortcuts:**
- `Escape` → deselect widget
- `Delete` / `Backspace` (when widget focused) → delete widget

---

### `/preview/[appId]` — Preview Mode

**Layout:**
- Minimal top bar: "Preview" label, back to builder link, "Publish" button
- Full-width canvas render of the app — widgets displayed in their configured positions
- Input widgets are interactive (type in them)
- LLM, Chat, and Image widgets show mock placeholder output ("AI response will appear here")
- No editing controls

---

## 5. Builder Component Architecture

```
src/
  app/
    layout.tsx                    # root layout (font, dark theme, globals)
    page.tsx                      # redirect to /login
    login/
      page.tsx
    onboarding/
      page.tsx
    dashboard/
      page.tsx
    my-apps/
      page.tsx
    discover/
      page.tsx
    builder/
      [appId]/
        page.tsx
    preview/
      [appId]/
        page.tsx

  components/
    layout/
      Sidebar.tsx                 # persistent left nav (receives activeRoute prop)
      TopBar.tsx                  # page-level top bar (title, CTA)
      AppShell.tsx                # Sidebar + main content wrapper

    builder/
      BuilderLayout.tsx           # top bar + sidebar + canvas + right panel
      BuilderTopBar.tsx           # app name edit + save status + publish button
      BuilderCanvas.tsx           # React Flow setup, node/edge rendering
      WidgetPanel.tsx             # right panel: closed icon strip / open widget list
      PropertiesPanel.tsx         # selected widget property form

    widgets/
      StaticTextNode.tsx          # React Flow custom node — static text
      InputNode.tsx               # React Flow custom node — user input
      LLMNode.tsx                 # React Flow custom node — text generator
      ImageNode.tsx               # React Flow custom node — image generator
      ChatNode.tsx                # React Flow custom node — chat box

    ui/
      AppCard.tsx                 # reusable app card (My Apps + Discover)
      AvatarPicker.tsx            # avatar selection grid (onboarding)
      EmptyState.tsx              # reusable empty state with icon + message + CTA
      IconButton.tsx              # accessible icon-only button

  lib/
    store.ts                      # Zustand store: apps[], selectedAppId, selectedWidgetId
    mock-data.ts                  # seeded apps, templates, user profile
    types.ts                      # all TypeScript types and interfaces
    utils.ts                      # ID generation, date formatting helpers

  hooks/
    useApp.ts                     # get/set/delete app from store
    useBuilder.ts                 # builder-specific state: canvas, selection, panel open
```

---

## 6. Widget Data Model

```typescript
// lib/types.ts

export type WidgetType = 'static_text' | 'input' | 'llm' | 'image' | 'chat';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetDimensions {
  width: number;
  height: number;
}

interface BaseWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  dimensions: WidgetDimensions;
}

export interface StaticTextWidget extends BaseWidget {
  type: 'static_text';
  title: string;
  content: string;
}

export interface InputWidget extends BaseWidget {
  type: 'input';
  title: string;
  placeholder: string;
}

export interface LLMWidget extends BaseWidget {
  type: 'llm';
  title: string;
  placeholder: string;
  prompt: string;
  model: string;       // e.g. "claude-sonnet-4-6" — unused until Phase 5
  temperature: number; // 0.0–1.0
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  title: string;
  imagePrompt: string;
  stylePreset: string; // e.g. "photorealistic", "illustration", "pixel art"
}

export interface ChatWidget extends BaseWidget {
  type: 'chat';
  title: string;
  placeholder: string;
  initialPrompt: string;
}

export type Widget =
  | StaticTextWidget
  | InputWidget
  | LLMWidget
  | ImageWidget
  | ChatWidget;
```

Widget default dimensions:
| Type | Width | Height |
|---|---|---|
| static_text | 320 | 160 |
| input | 320 | 120 |
| llm | 360 | 200 |
| image | 360 | 280 |
| chat | 400 | 360 |

---

## 7. App JSON Schema

This is the full app object that is saved to `localStorage` and later to the database.

```typescript
// lib/types.ts

export interface AppConnection {
  id: string;
  sourceWidgetId: string;
  targetWidgetId: string;
  sourceHandle?: string;  // React Flow handle ID
  targetHandle?: string;
}

export type AppStatus = 'draft' | 'published';

export interface App {
  id: string;             // UUID, e.g. "app_k7f2m3x9"
  name: string;           // display name, editable inline
  description: string;    // optional, used in Discover / template cards
  status: AppStatus;
  thumbnail: string;      // key from a preset thumbnail set, e.g. "thumb_play"
  ownerId: string;        // mock user ID for now
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
  publishedAt?: string;   // set when status changes to 'published'
  widgets: Widget[];
  connections: AppConnection[];
}
```

Example minimal app JSON (stored in `localStorage` under key `forge_apps`):

```json
{
  "id": "app_k7f2m3x9",
  "name": "Product Description Generator",
  "description": "Turn a product name into a marketing description.",
  "status": "draft",
  "thumbnail": "thumb_bolt",
  "ownerId": "mock_user",
  "createdAt": "2026-06-16T10:00:00Z",
  "updatedAt": "2026-06-16T10:05:00Z",
  "widgets": [
    {
      "id": "w_1",
      "type": "input",
      "position": { "x": 100, "y": 100 },
      "dimensions": { "width": 320, "height": 120 },
      "title": "Product Name",
      "placeholder": "Enter a product name..."
    },
    {
      "id": "w_2",
      "type": "llm",
      "position": { "x": 500, "y": 100 },
      "dimensions": { "width": 360, "height": 200 },
      "title": "Description Generator",
      "placeholder": "Your description will appear here...",
      "prompt": "Write a compelling product description for: {{input}}",
      "model": "claude-sonnet-4-6",
      "temperature": 0.7
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "sourceWidgetId": "w_1",
      "targetWidgetId": "w_2"
    }
  ]
}
```

The `forge_apps` key in `localStorage` holds an array of `App` objects. The `forge_user` key holds the mock user profile.

---

## 8. Phase Build Checklists

### Phase 1 — Static shell and mock screens

Goal: every route exists, looks right, navigation works, no blank pages.

- [ ] Read `node_modules/next/dist/docs/` for Next.js 16 breaking changes before writing any Next.js code
- [ ] Configure Tailwind v4 (CSS-first config in `globals.css`, no `tailwind.config.js`)
- [ ] Load DM Sans from Google Fonts in `layout.tsx` (or via `next/font`)
- [ ] Set dark background globally (`#0D0D0D` base, `#161616` sidebar)
- [ ] Define CSS custom properties: `--accent`, `--accent-fg`, `--surface`, `--surface-2`, `--text`, `--text-muted`, `--border`
- [ ] Build `Sidebar.tsx` — nav items, Support/Settings/Logout at bottom, user avatar
- [ ] Build `TopBar.tsx` — greeting or title, right-side CTA button slot
- [ ] Build `AppShell.tsx` — sidebar + scrollable main content
- [ ] `/login` page — split panel, mock buttons, navigation
- [ ] `/onboarding` page — username input, avatar picker grid, save to localStorage
- [ ] `/dashboard` page — greeting, two content cards, "Build from description" disabled widget
- [ ] `/my-apps` page — Drafts + Published sections with mock app data
- [ ] `/discover` page — Featured + All apps with seeded templates
- [ ] `AppCard.tsx` — thumbnail, name, date metadata, `...` button
- [ ] `EmptyState.tsx` — icon, message, optional CTA
- [ ] Seed `mock-data.ts` — 5 draft apps, 3 published apps, 6 discover templates
- [ ] "Create New" on dashboard/my-apps creates a blank app in localStorage and navigates to builder
- [ ] Verify all nav links route correctly

### Phase 2 — Builder canvas with mock widgets

Goal: the builder canvas is interactive. Users can open the widget panel, add widgets, drag them around, and see them on the canvas.

- [ ] Install React Flow (verify React 19 compatibility first)
- [ ] Install Zustand for builder state
- [ ] Build `BuilderLayout.tsx` — top bar + sidebar + canvas + right panel zones
- [ ] Build `BuilderTopBar.tsx` — inline app name edit, save status, Publish button stub
- [ ] Build `BuilderCanvas.tsx` — React Flow provider, empty state (sparkle + CTA)
- [ ] Build `WidgetPanel.tsx` — collapsed icon strip + expanded widget list with chevron toggle
- [ ] Panel remembers open/closed state per session
- [ ] Clicking a widget in the panel adds it to canvas at a default offset position
- [ ] Build all 5 custom React Flow nodes with minimal visual design:
  - `StaticTextNode.tsx`
  - `InputNode.tsx`
  - `LLMNode.tsx`
  - `ImageNode.tsx`
  - `ChatNode.tsx`
- [ ] Drag widgets on canvas to reposition (React Flow handles this)
- [ ] Click widget to select it (highlights border)
- [ ] `Escape` to deselect
- [ ] Builder state (widgets, connections, selectedWidgetId) lives in Zustand store
- [ ] Canvas reads from store; panel writes to store

### Phase 3 — Widget properties and connections

Goal: selecting a widget opens a properties panel. Users can edit all properties. Users can draw connections between widgets.

- [ ] Build `PropertiesPanel.tsx` — rendered when `selectedWidgetId` is set
- [ ] Properties panel replaces widget panel when a widget is selected
- [ ] Each widget type renders its specific property fields:
  - StaticText: title (text input), content (textarea)
  - Input: title (text input), placeholder (text input)
  - LLM: title, placeholder, prompt (textarea), model (select), temperature (slider 0–1)
  - Image: title, image prompt (textarea), style preset (select)
  - Chat: title, placeholder, initial prompt (textarea)
- [ ] All property changes update the widget in the Zustand store immediately
- [ ] "Delete widget" button in properties panel removes widget + its connections from store
- [ ] `Delete`/`Backspace` key shortcut when widget is focused
- [ ] Enable React Flow edge creation (drag from widget output handle to input handle)
- [ ] Connections stored in `app.connections[]`
- [ ] Inline app name editing in top bar — click to edit, blur or Enter to confirm
- [ ] Save to localStorage: debounced auto-save (500ms) on any store change
- [ ] Auto-save status indicator in top bar ("Saving..." / "Saved")

### Phase 4 — Save/load and preview

Goal: apps persist across page refreshes. Preview mode shows a working read-only render of the app.

- [ ] `/builder/[appId]` loads app from localStorage by ID on mount
- [ ] Handle invalid/missing appId (redirect to `/my-apps` with error message)
- [ ] Build `/preview/[appId]` route
- [ ] Preview renders each widget in its configured position
- [ ] Preview: Input widget is a real HTML input (interactive)
- [ ] Preview: Static Text widget displays configured content
- [ ] Preview: LLM widget shows "AI response will appear here (preview mode)" placeholder
- [ ] Preview: Image widget shows a grey placeholder box
- [ ] Preview: Chat widget shows a minimal chat UI with mock first message
- [ ] Preview top bar: "Previewing: [app name]", "← Back to builder" link, "Publish" button
- [ ] Publish button: changes `app.status` to `'published'`, sets `publishedAt`, shows success toast
- [ ] Published apps appear in the "Published" section of My Apps
- [ ] My Apps `...` menu: Delete removes from localStorage and reloads the list

---

## 9. Technical Risks

**Next.js 16 and React 19 are very new.**
The AGENTS.md explicitly warns that this version has breaking changes. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Do not assume App Router conventions from Next.js 13–15 are identical. Heed deprecation notices.

**Tailwind CSS v4 is a breaking change from v3.**
v4 uses CSS-first configuration — there is no `tailwind.config.js`. All configuration happens in `globals.css` using `@theme` blocks. The class names and plugin system may differ. Verify before using any v3 utility classes that feel unfamiliar.

**React Flow compatibility with React 19.**
React Flow v12 targets React 18. Before installing, check the React Flow changelog or npm page for a React 19 compatible release. If incompatible, evaluate `@xyflow/react` as the updated package name.

**Zustand compatibility with React 19.**
Zustand v4+ is generally forward-compatible but verify before installing.

**Canvas performance.**
React Flow re-renders on every drag event. Keep widget node components memoized with `React.memo`. Avoid putting large state slices in the Flow context. Widget property state should live in Zustand, not inside the React Flow node component.

**`{{input}}` template syntax in prompts.**
The LLM widget prompt field uses `{{widgetId}}` or `{{widgetTitle}}` placeholders to reference connected input values. This interpolation logic must be clearly defined before Phase 5 (AI calls) to avoid breaking changes to saved apps.

**localStorage size limit.**
Browsers limit localStorage to ~5MB. For MVP with a small number of apps this is fine, but large canvases with many widgets could hit limits. Consider compressing app JSON or warn users if storage is nearly full. This becomes a database concern in Phase 5.

---

## 10. What NOT to Build Yet

The following are explicitly out of scope until Phase 5 or later. Do not add stubs, placeholders, imports, or file structure for these unless listed in a phase above.

- **Supabase / any database** — localStorage only until Phase 5
- **Real authentication** — no OAuth flows, no JWT, no sessions, no middleware auth guards
- **Gemini / OpenAI / Anthropic API calls** — all AI output is mocked
- **MCP integration** — not in scope for any phase of this plan
- **Real-time collaboration** — single-user only
- **Image generation** — Image widget is a placeholder; no API calls
- **"Build from description" AI feature** — shown on dashboard as disabled
- **Public app URLs** — Publish is a status change only; no hosting, no CDN, no iframe embed
- **Comments, ratings, sharing** — Discover apps are read-only seeded data
- **Admin or template management UI**
- **Mobile/responsive layout for the builder** — desktop-first; canvas does not work on small screens
- **Undo/redo history** — keep for a later phase
- **Multi-page apps** — single canvas only for MVP
- **Custom widget theming** — no per-widget color or font overrides
- **Export to code** — not in scope
