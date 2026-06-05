# AI Image Generator — Design Brief

> A single-document overview of the project, written for designers (human or
> AI). Everything a design tool needs to produce screens that map cleanly onto
> what the codebase already supports.

---

## 1. Elevator Pitch

A polished, production-grade **AI image generation web app** powered by
OpenAI's `gpt-image-1`. The user types (or speaks) a prompt → watches the
image render progressively in real time → manages a searchable gallery of
their creations with tags, costs, and AI-powered "similar prompts" hints.

**Tagline:** *"Turn words into images, watch them take shape live."*

---

## 2. Target User

- A hobbyist or creative professional exploring AI image generation
- An indie developer / designer using this as a tool for thumbnails, mockups, blog hero images
- An Arabic speaker who wants prompts auto-translated for better model output
- A power user who cares about cost visibility, tagging, organization

**Not the target:** enterprise buyers, multi-tenant SaaS, casual one-shot users.

---

## 3. Core Value Propositions (what to highlight visually)

1. **Live progressive rendering** — image fades in across 3 partial renders during generation (the killer UX moment, like ChatGPT)
2. **Smart cache** — re-running the same prompt is instant + free
3. **Arabic-native** — type in Arabic, app silently translates to English for better results
4. **Cost transparent** — every image shows its estimated cost; a dashboard tracks total spend
5. **Power-user organized** — tags, filters, search, similar-prompts autocomplete

---

## 4. Tech Constraints (designer should know)

- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query
- **No design system framework** (no MUI, no shadcn) — just Tailwind utility classes + small custom component layer
- **Theme:** Dark/Light mode with persistent preference + system-detection fallback
- **RTL support:** Required — Arabic text in prompts and labels needs to flow right-to-left where present
- **Mobile-first responsive** — must work down to 360px width
- **PWA** — installable, with offline gallery (the design should feel native enough to live on a home screen)
- **Accessibility:** Keyboard navigation, ARIA labels, focus rings, sufficient color contrast in both themes

---

## 5. Pages / Screens (3 routes, lazy-loaded)

### 5.1 `/` — Create Page (Home)

**Purpose:** Where the user describes their image and watches it generate.

**Layout:** Two-column on desktop (form left, preview right). Stacks on mobile.

**Left column — Prompt Form Card:**
- Header: "Describe your image" with two icon buttons on the right:
  - 🎙 **Voice input button** (microphone icon, pulses red while listening)
  - ✨ **Enhance with AI button** (sparkles icon, calls GPT to expand the prompt)
- Large **textarea** (auto-direction: LTR for English, RTL for Arabic). Min 5 rows. Character counter (`0 / 4000`).
- Inline **Similar Past Prompts** suggestions (collapsible list, appears while typing 4+ chars):
  - Each row: small thumbnail + truncated prompt + similarity % badge
  - Click to copy that prompt
- **Style preset chips** row — 8 pill buttons (Photorealistic, Anime, Oil Painting, Watercolor, Pixel Art, Cinematic, Studio Ghibli, 3D Render) — click appends a style suffix to the prompt
- Collapsible **Advanced Options** panel with 4 select dropdowns (Size, Quality, Background, Format) + a "Force re-generation" checkbox
- Footer row: sample prompt chips on the left, prominent **Generate button** on the right (gradient indigo→violet)

**Right column — Preview Card:**
Three mutually-exclusive states inside the same card:

**State A — Empty:**
- Centered icon (image placeholder)
- "Your generated image will appear here."
- Small link: "Or browse your past creations →"

**State B — Streaming in progress (the hero moment):**
- Square image area at top — starts blank, then fills with the latest partial render
- "Refining · pass N/3" badge in the bottom-left corner with a pulsing emerald dot
- Below the image: **5-stage progress list** with icons
  - ✓ Moderating prompt (when done, green check)
  - ✓ Translating to English (only shown if Arabic detected)
  - ✓ Checking cache
  - ◉ Generating image (currently active, pulsing indigo)
  - ○ Saving + thumbnail (pending, gray)
- Each stage has a tiny gray hint line ("Safety check (~80ms)", "gpt-image-1 · streaming partials", etc.)
- If translation happened: amber-tinted reveal showing the translated English prompt
- Subtle "Cancel generation" link below

**State C — Complete:**
- Full-quality image at top (with soft fade-in)
- Row of badges: `1024x1024`, `quality: auto`, `bg: auto`, optional `Cached` (amber), `Saved` (emerald)
- If translated: collapsible details with original Arabic + English
- Three action buttons: **Download**, **Share**, **View in gallery**

### 5.2 `/gallery` — Gallery Page

**Purpose:** Browse, search, filter, and manage every generated image.

**Layout:**
- Header row: page title "Gallery" + count subtitle, "New image" CTA button on the right (indigo gradient)
- **Search + Filter Card** (sticky-feel section):
  - Full-width search input with magnifier icon (left) and clear × (right)
  - Row of mini-select dropdowns: Any size, Any quality, Any background
  - "X total" or "X matches" count
  - Right-aligned "Clear filters" link when any filter is active
  - Below: **Tag chips row** — all tags as small pills with image counts (e.g., `#anime · 12`). Clicking a tag toggles a filter; the active tag chip is indigo.
- **Image grid** — 2 columns on mobile, 3 on tablet, 4 on desktop. Each card:
  - Aspect-ratio-correct thumbnail (square / portrait / landscape based on the image's actual ratio)
  - Soft lift on hover (1px translate-y + larger shadow)
  - Below the image: truncated prompt (2 lines max), date, "AR→EN" badge if translated, size label
- **Pagination** at the bottom: "Showing 1–12 of 47" + Prev / Next + page indicator

**Modal (opens on card click):**
- Full-bleed image on the left (≈60% of modal width)
- Details panel on the right with scrollable content:
  - Prompt (auto-direction)
  - If translated: "✨ Translated → English (sent to model)" with the English version
  - **Tag editor** — current tags as removable chips + a small "Add a tag…" input that creates new ones on Enter
  - Badges: size, quality, background, format, **cost** (e.g., `≈ $0.042`)
  - Metadata: Created date, file size
  - Action row at the bottom: **Download** · **Share** · **Regenerate similar** (indigo primary) · **Delete** (red outline, two-click confirm pattern)
- Close button (×) top-right
- Escape key + clicking outside both close

### 5.3 `/stats` — Stats / Cost Dashboard

**Purpose:** Show how much the user has spent and how usage breaks down.

**Layout:** Pure content page, no sidebar.

- Page title "Usage & cost" + subtitle explaining the numbers are estimates
- **Four KPI cards** in a row (stacks to 2×2 on mobile), each on a soft-color gradient:
  - **Images generated** — count (indigo card)
  - **Total spend** — `$X.XX` USD (violet card)
  - **Cache hits** — count + "≈ $X saved" hint (emerald card)
  - **Auto-translated** — count (amber card)
- **Daily spend chart card** — horizontal bar chart showing last 30 days:
  - Each row: date (mono font) + bar (indigo→violet gradient) + label inside the bar ("$X.XX · N img")
  - Bars scale to the highest-spend day
- **Two distribution cards** in a row:
  - "By quality" — progress-bar list (low / medium / high / auto + counts + percentages)
  - "By size" — same pattern (1024x1024 / 1024x1536 / 1536x1024 / auto)

---

## 6. Global Components (used across all pages)

### 6.1 Header (sticky)
- Logo: gradient (indigo→violet) rounded-square with a small "image" icon, plus brand text "AI Image Generator · Powered by gpt-image-1"
- Nav links: **Create** / **Gallery** / **Stats** — active route gets indigo pill background
- Right side: **Sign in** button (only renders when auth is enabled on the backend) + **Theme toggle** (sun/moon)

### 6.2 Footer
- Single line, muted, centered: "Built with React, TypeScript, Tailwind CSS, TanStack Query, and FastAPI."

### 6.3 Toast notifications
- Stack in the top-right (top-center on mobile)
- 3 variants: success (emerald), error (red), info (slate)
- Each: icon + message + small × close button + auto-dismiss after 3.5s
- Slide-up entry animation

### 6.4 Modal pattern (image modal, login modal, future confirmations)
- Backdrop: `bg-slate-950/70 backdrop-blur-sm`
- Card: rounded-2xl, max-width 4xl for image modal, max-width sm for forms
- Escape closes; clicking backdrop closes; ESC + focus trap

### 6.5 Login modal (only when auth enabled)
- Title: "Owner sign-in"
- Sub: "Authentication protects write operations (generate / delete / edit tags)."
- Two fields: Username + Password
- Buttons: Cancel (ghost) + Sign in (primary gradient)

### 6.6 Error Boundary fallback (for catastrophic render errors)
- Centered column: red-tinted icon, "Something went wrong" headline, soft sub-message
- Collapsible "Error details" with stack
- Two buttons: "Try again" (primary) + "Go home" (ghost)

### 6.7 Loading spinner
- 16×16 gradient halo with a centered spinning ring
- Sub-text: "Conjuring your image... this can take 15–30 seconds."

---

## 7. Visual Identity

### 7.1 Color Palette

| Role | Light mode | Dark mode |
|---|---|---|
| Background | `slate-50` | `slate-950` |
| Surface | `white` | `slate-900` |
| Border | `slate-200` | `slate-800` |
| Text primary | `slate-900` | `slate-100` |
| Text secondary | `slate-500` | `slate-400` |
| Brand gradient | `indigo-500 → violet-500` | same |
| Success | `emerald-500` | `emerald-400` |
| Error | `red-500` | `red-400` |
| Warning (translation) | `amber-500` | `amber-300` |

### 7.2 Accent colors per metadata badge

- **Size** → indigo
- **Quality** → violet
- **Background** → fuchsia
- **Format** → slate
- **Cost** → emerald
- **Cached** → amber
- **Saved** → emerald
- **AR→EN translation** → amber

### 7.3 Typography
- **Font family:** Inter (loaded from Google Fonts) — weights 300, 400, 500, 600, 700, 800
- **Headings:** bold, tight tracking
- **Body:** 14–16px, regular
- **Mono** (only for dates in stats): system mono

### 7.4 Layout / Spacing
- **Max content width:** `max-w-6xl` (about 1152px) for app shell
- **Border radius:** generous — `rounded-xl` (12px) for inputs, `rounded-2xl` (16px) for cards, `rounded-full` for chips/avatars
- **Shadows:** soft, multi-layer (`shadow-xl shadow-slate-200/40` in light, `shadow-black/40` in dark)
- **Spacing scale:** Tailwind defaults (4px base unit)

### 7.5 Mood / Aesthetic
- **Modern, premium, ChatGPT-adjacent** — clean cards, generous whitespace
- **Subtle gradient backgrounds** on hero sections (indigo→violet hint)
- **Glassmorphism** on the sticky header (`bg-white/70 backdrop-blur-md`)
- **Motion is intentional** — fade-ins, slide-ups, pulse for active states, no spinners-for-spinners-sake
- **NOT brutalist, NOT skeuomorphic, NOT neon, NOT cyberpunk** — keep it tasteful

---

## 8. Key Interactions / Animations

| Moment | Animation |
|---|---|
| Page transition between routes | Suspense fallback shows a centered spinner (300ms typical) |
| New partial image arrives | `key={partialIndex}` on `<img>` triggers a fade-in over 500ms |
| Active stage in progress list | Indigo dot pulses with a 4px ring glow |
| Pending stage in progress list | 40% opacity, no animation |
| Hovering an image card | Lifts 0.5rem (`-translate-y-0.5`) + shadow grows |
| Successful save | Toast slides up from top-right corner |
| Image arrives in modal | Cross-fade from thumbnail to full-quality image |
| Theme toggle | Color transition over 300ms on body |
| Cache hit | Amber "Cached" badge fades in next to "Saved" |
| Voice input listening | Mic icon turns red with a pinging dot |
| Tag added | Chip appears with subtle scale animation |

---

## 9. States to Cover for Every Data View

For every list/page, design the following:

1. **Empty (first-time user)** — friendly illustration + CTA back to Create
2. **Empty (filter returned nothing)** — different copy: "No images match your filters" + "Clear filters" CTA
3. **Loading** — skeleton or spinner, depending on context
4. **Error** — red-tinted card with the message + ability to retry
5. **Populated** — the main happy path
6. **Stale / refetching** — populated content at 60% opacity while next page loads (TanStack Query handles this with `keepPreviousData`)

---

## 10. Accessibility & i18n

- **Auto-direction text** — every prompt textarea, every list item that may contain Arabic uses `dir="auto"` so the layout flips correctly per content
- **Keyboard navigation** — every action reachable by Tab; visible focus rings (indigo)
- **ARIA labels** — every icon-only button has an `aria-label`
- **Color contrast** — meets WCAG AA in both themes
- **Reduced motion** — respect `prefers-reduced-motion` (animations should degrade gracefully)
- **Screen-reader friendly** — modal uses `role="dialog"` + `aria-modal="true"`

---

## 11. Mobile Considerations

- Header collapses: hide brand text, keep only the logo + nav + theme toggle
- Stats KPI cards: 2×2 grid instead of 1×4
- Gallery: 2 columns
- Modal: full-screen on mobile, content stacks vertically (image on top, details below)
- Sticky bottom action bar (optional design improvement): when in the modal on mobile, the Download / Share / Delete actions could anchor to the bottom

---

## 12. Inspiration / References (mood, not copy)

- **ChatGPT image generation** — the way partial renders fade in progressively
- **Midjourney showcase grid** — clean, dense, prompt-first cards
- **Linear app** — UI density + crisp typography + soft gradients
- **Vercel dashboard** — KPI card aesthetic for the Stats page
- **Notion** — empty states with friendly illustrations

---

## 13. What's Already Built (no need to design from scratch)

The codebase already has these components, so designs should respect their structure:

- `Header`, `ThemeToggle`, `LoginButton`
- `PromptForm` (with sub-components: `AdvancedOptions`, `EnhancePromptButton`, `VoiceInputButton`, `SimilarPrompts`, `StylePresets`)
- `ImageDisplay`, `GenerationProgress`, `LoadingSpinner`, `ErrorMessage`
- `ImageCard`, `ImageModal`, `Pagination`, `GallerySearch`
- `TagChip`, `TagEditor`
- `StatsPage` (with internal `StatCard`, `BarChart`, `Distribution` widgets)
- `ActionButton`, `DownloadButton`, `ShareButton`, `DeleteButton`
- `Toast` system
- `ErrorBoundary` + `PageFallback`

If a redesign changes a component's behavior, the change must be feasible
to wire into the existing TypeScript + TanStack Query layer.

---

## 14. The 5 Most Important Screens to Design First

If the design tool can only produce a few hero screens, prioritize these:

1. **Create page — State B (streaming with partial image)** — the headline moment of the entire product
2. **Create page — State A (empty preview, prompt being typed with similar-prompts dropdown visible)** — shows the smart-typeahead feature
3. **Gallery page (populated, with tag chips visible)** — the curation surface
4. **Image modal (full open with tag editor + all metadata badges + actions)** — the management surface
5. **Stats page (populated with chart + KPIs + distributions)** — the product-thinking surface

---

## 15. Brand Voice (microcopy guidance)

- **Direct, technical, warm.** Not playful, not stiff.
- "Generating image" — yes. "Working some magic ✨" — no.
- "Returned a cached image (no API cost)." — yes. "We found a match!" — no.
- "Your prompt was auto-translated to English first." — yes. "Translated for ya 👍" — no.
- Numbers should always have units ($, ms, KB)
- Errors should explain WHAT failed and offer a NEXT step
