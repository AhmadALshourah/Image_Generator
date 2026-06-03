# Phases — AI Image Generator Project Roadmap

> The full journey, divided into phases. Items marked **✅ صح** are shipped.
> Items without that marker are planned but not yet implemented — the roadmap
> beyond the original [`idea.md`](idea.md).

---

## Status Summary

| Range | Status | Description |
|---|---|---|
| Phase 0 | Baseline | Original Gradio prototype (preserved as `Model.py`) |
| Phase 1 → 10 | ✅ **All done** | Every item from `idea.md` (27 / 27) shipped |
| Phase 11 → 18 | Roadmap | Future enhancements beyond the original scope |

---

## Phase 0 — Origin (Baseline)

The starting point — a 31-line `Model.py` using Gradio + DALL-E 3 with typos
(`clint`, `respone`), no architecture, no tests, no deploy story. Preserved
in the repo as a "before" reference for the CV story.

- Single file, single function, single UI textbox
- DALL-E 3 via `openai.OpenAI()` synchronously
- `gradio.Blocks()` auto-generates the UI
- No state, no persistence, no error handling, no docs

---

## ✅ Phase 1 — Core Full-Stack Foundation صح

Replace the Gradio prototype with a real full-stack architecture.

- ✅ **FastAPI backend** with proper layering (routers / services / schemas / config)
- ✅ **React 18 + Vite + Tailwind CSS** frontend, hand-scaffolded (no CRA)
- ✅ **Pydantic-settings** for env-driven config (`OPENAI_API_KEY`, `CORS_ORIGINS`)
- ✅ **Vite dev-server proxy** to backend (no CORS pain in dev)
- ✅ **Dark / Light mode** with `localStorage` persistence + `prefers-color-scheme` detection
- ✅ **Responsive mobile-first layout**
- ✅ **AdvancedOptions** (size / quality / style) collapsible panel
- ✅ **Sample prompts** for quick experimentation
- ✅ **Loading & error states** with friendly messages
- ✅ **Auto-generated Swagger UI** at `/docs`
- ✅ **Bug fixes** from the prototype: `clint` → `client`, `respone` → `response`

---

## ✅ Phase 2 — Gallery, Persistence & Prompt Enhancement صح

Make every generated image survive a refresh, add a curated gallery, and
introduce GPT-powered prompt help.

- ✅ **SQLite + SQLAlchemy** (sync at the time) — `Image` ORM model
- ✅ **Persistent local image storage** (no expiring OpenAI URLs)
- ✅ **Gallery page** with paginated grid + click-to-zoom modal
- ✅ **React Router** for `/` (Create) + `/gallery`
- ✅ **Toast notifications** system (context + portal)
- ✅ **Download** (real blob download, not just opening a tab)
- ✅ **Share** via Web Share API with clipboard fallback
- ✅ **Delete** with two-click confirmation
- ✅ **Prompt enhancement** via GPT-4o-mini — one-click expansion
- ✅ **Pagination** with stable URL-less state
- ✅ **Static files mount** at `/api/images/files`

---

## ✅ Phase 3 — `gpt-image-1` Migration + Production-Grade Backend صح

Adopt the newer / better OpenAI model and rebuild the backend as a fully
async, production-quality pipeline. Maps to idea.md items **#1, #3, #4, #6, #7**.

- ✅ **Migrated DALL-E 3 → gpt-image-1** (richer images, text rendering, transparent BG)
- ✅ **Fully async backend** — `AsyncOpenAI` + async SQLAlchemy + `aiosqlite` + `aiofiles`
- ✅ **Singleton `AsyncOpenAI` client** via `lru_cache` (shared httpx pool)
- ✅ **OpenAI Moderation API** pre-flight on every prompt (`omni-moderation-latest`)
- ✅ **WebP thumbnails** auto-generated via Pillow (~25KB vs ~1.5MB PNG)
- ✅ **Thumbnail generated in parallel** with original write (`asyncio.create_task`)
- ✅ **CPU-bound work off the event loop** via `asyncio.to_thread`
- ✅ **Prompt deduplication cache** — SHA-256 of canonicalized inputs
- ✅ **Auto-detect Arabic → translate to English** before generation (GPT-4o-mini)
- ✅ **Both `prompt` and `effective_prompt` stored** in DB
- ✅ **Transparent backgrounds** supported (`background="transparent"`)
- ✅ **Multiple output formats** (png / jpeg / webp)
- ✅ **`DATA_DIR` env var** — paths configurable for Docker volumes
- ✅ **`base64` decode** instead of httpx-streaming-from-temporary-URL

---

## ✅ Phase 4 — Frontend Modernization & Power-User Features صح

Replace 200+ lines of bespoke `useState/useEffect` data fetching with industry-
standard tooling, and add features power users actually want. Maps to **#2, #8, #9, #10**.

- ✅ **TanStack Query** (React Query) — `useQuery` / `useMutation` everywhere
- ✅ **Centralized `queryKeys`** for typo-free cache invalidation
- ✅ **Optimistic delete** with automatic rollback on server error
- ✅ **Gallery search** — debounced full-text search (300ms) across prompt + effective_prompt
- ✅ **Filters** — size, quality, background (resets pagination on change)
- ✅ **Regenerate similar** button in the image modal (uses `force=true`)
- ✅ **PNG metadata embedding** — prompt + options stored as `tEXt` chunks
- ✅ **Images are self-describing** — inspectable with `exiftool` after download

---

## ✅ Phase 5 — TypeScript End-to-End صح

Type safety from the wire all the way to the UI. Maps to **#12**.

- ✅ **Full `.jsx` → `.tsx`, `.js` → `.ts` migration** (30+ source files)
- ✅ **Strict TypeScript config** (`strict`, `noImplicitOverride`, `noFallthroughCasesInSwitch`)
- ✅ **`src/types/api.ts`** mirrors backend Pydantic schemas (string-literal unions)
- ✅ **Typed React Query hooks** — `UseMutationResult<ImageRecord, Error, GenerateRequest>` everywhere
- ✅ **Build-time type checking** — `npm run build` runs `tsc --noEmit` first
- ✅ **`openapi-typescript`** for regenerating types from `/openapi.json`
- ✅ **`vite.config.js` → `vite.config.ts`** + `vite-env.d.ts`
- ✅ **Path alias** `@/*` → `src/*`
- ✅ **No `any` types** in production code

---

## ✅ Phase 6 — One-Command Deploy + CI صح

Make the project a `docker compose up` away from running, and gate every push
on a real CI pipeline. Maps to **#11, #26**.

- ✅ **Multi-stage `backend/Dockerfile`** — Python 3.12-slim, wheel-builder + slim runtime
- ✅ **Multi-stage `frontend/Dockerfile`** — Node 20 build → nginx:alpine serve
- ✅ **`nginx.conf`** — reverse-proxies `/api/*` to backend (single origin in prod)
- ✅ **`docker-compose.yml`** with named volume (`api_data`) for persistence
- ✅ **Container healthchecks** on both services; `web` waits for `api` to be healthy
- ✅ **Non-root container user** (uid 1001) for the backend
- ✅ **Pluggable env via `.env`** at repo root (Docker Compose auto-loads it)
- ✅ **GitHub Actions CI** — runs on every push + PR
- ✅ **Parallel jobs**: backend byte-compile + import smoke test; frontend `tsc` + `vite build`; Docker build smoke
- ✅ **GHA layer cache** (`type=gha`) for fast repeat builds
- ✅ **`.dockerignore`** at root + per-app to keep images small

---

## ✅ Phase 7 — Tests صح

Real test coverage on both sides, with proper isolation and zero real API calls.
Maps to **#13**.

- ✅ **`pytest` + `pytest-asyncio` + `httpx.AsyncClient`** for FastAPI integration tests
- ✅ **In-memory SQLite per test** via async SQLAlchemy + dependency override
- ✅ **Fully mocked `AsyncOpenAI`** — `images.generate`, `moderations.create`, `chat.completions.create`, `embeddings.create`
- ✅ **Tiny PNG generated via Pillow** in conftest for realistic byte-level tests
- ✅ **~30 backend test cases** across: generate / cache / force / Arabic / moderation / images CRUD / pagination / search / tags / prompts / cache hash determinism
- ✅ **`vitest` + `@testing-library/react` + `jsdom`** for frontend tests
- ✅ **`renderWithProviders`** wrapper (QueryClient + Router + ToastProvider)
- ✅ **~20 frontend test cases** — debounced hook (fake timers), util fns, component interaction (`userEvent`), optimistic mutation rollback
- ✅ **CI runs both suites** before letting Docker images build
- ✅ **V8 coverage** via `npm run test:coverage`

---

## ✅ Phase 8 — Production Polish صح

The small things that separate a portfolio app from a real one. Maps to **#16, #24, #25**.

- ✅ **React Error Boundary** — class component with `getDerivedStateFromError` + `componentDidCatch`
- ✅ **Default fallback UI** with "Try again" + "Go home" + collapsible error details
- ✅ **Code-splitting + Suspense** — `GalleryPage` is `React.lazy`-loaded
- ✅ **`structlog`** structured logging bridging stdlib `logging.getLogger()`
- ✅ **JSON or console output** based on `LOG_FORMAT` env var
- ✅ **Request-ID middleware** — generates/reuses `X-Request-ID`, binds to `contextvars`
- ✅ **Per-request timing log** with `elapsed_ms` + `status_code`
- ✅ **Response always echoes back `X-Request-ID`** so users can quote it in bug reports
- ✅ **`.pre-commit-config.yaml`** — `ruff` (lint + format) + `prettier` + safety hooks
- ✅ **`backend/pyproject.toml`** — sensible ruff rule selection (E/F/I/W/B/UP/SIM/C4/RUF)
- ✅ **`frontend/.prettierrc.json`** + `.prettierignore`

---

## ✅ Phase 9 — Live Streaming Generation صح

The most visible UX upgrade: replace a 25-second blank spinner with a live,
progressively-rendered image preview. Maps to **#5**.

- ✅ **`POST /api/generate/stream`** Server-Sent Events endpoint
- ✅ **`sse-starlette`** for clean dict-yields → `text/event-stream`
- ✅ **`gpt-image-1` `stream=True, partial_images=3`** — the model emits 3 progressive renders
- ✅ **5 stage events**: moderating → translating → cache_check → generating → saving
- ✅ **3 partial events** with full base64-encoded interim images
- ✅ **Terminal `complete` event** with the full `ImageRecord`
- ✅ **Terminal `error` event** that preserves which stage failed
- ✅ **Frontend SSE parser** — fetch + ReadableStream + 40-line inline parser (no extra deps)
- ✅ **`AbortController` cancellation** — user-clickable Cancel button + auto-cancel on unmount
- ✅ **`useStreamGenerate` state-machine hook**
- ✅ **`GenerationProgress` component** — animated stage indicator + fading partial preview
- ✅ **Backward compatibility** — `POST /api/generate` (non-streaming) still works for the Gallery's "Regenerate similar" flow

---

## ✅ Phase 10 — Final Feature Wave صح

The ambitious finishing wave that ships every remaining `idea.md` item.
Maps to **#14, #15, #17, #18, #19, #20, #21, #22, #23, #27**.

### Architecture refactors

- ✅ **Repository pattern + DI** — `ImageRepository`, `TagRepository` injected via FastAPI `Depends`
- ✅ **Router layer is SQLAlchemy-free** — trivially mockable in tests
- ✅ **Pluggable storage** — `StorageBackend` Protocol with `LocalDiskStorage` + `S3Storage`
- ✅ **`STORAGE_BACKEND=s3`** switch (AWS S3 / Cloudflare R2 / MinIO / Backblaze B2)
- ✅ **`boto3` lazy-imported** — local installs don't pay the cost

### Security & auth

- ✅ **JWT auth (owner mode)** — opt-in via `AUTH_ENABLED=true`
- ✅ **`OWNER_USERNAME` + `OWNER_PASSWORD`** (plain or bcrypt) → JWT issuance
- ✅ **Bearer-token-protected writes**: generate, delete, set tags
- ✅ **Reads stay public** (gallery is share-friendly)
- ✅ **`require_owner` FastAPI dependency** — no-op when auth disabled

### AI / smart features

- ✅ **Embedding-based similar prompts** — `text-embedding-3-small` per image
- ✅ **Packed float32 vectors** in `images.embedding` BLOB column
- ✅ **Cosine similarity** via `numpy`, threshold-filtered (`> 0.55`)
- ✅ **`GET /api/prompts/similar?q=&top_k=`** — live typeahead under the prompt textarea
- ✅ **Best-effort embedding** — never blocks the request if it fails

### Product features

- ✅ **Cost dashboard** — `cost_usd` column + `GET /api/stats` aggregate
- ✅ **`/stats` page** with cards + 30-day CSS bar chart + distributions by quality/size
- ✅ **Cache savings estimation** displayed
- ✅ **Tags (many-to-many)** — `Tag` table + `image_tags` association
- ✅ **`PUT /api/images/{id}/tags`** + `GET /api/tags` (with image counts)
- ✅ **TagChip + TagEditor** components in the image modal
- ✅ **Clickable tag bar** in Gallery filters by tag in one click

### UX delight

- ✅ **Voice input** via Web Speech API — auto-detects Arabic vs English
- ✅ **Style presets** — 8 chips (Photorealistic, Anime, Oil Painting, Watercolor, Pixel Art, Cinematic, Studio Ghibli, 3D Render)
- ✅ **PWA** via `vite-plugin-pwa` + Workbox
- ✅ **Installable manifest** + theme color + service worker
- ✅ **Offline gallery** — image files + listings cached via Workbox runtime caching

### Observability

- ✅ **Sentry SDK** on backend (`sentry-sdk[fastapi]` + Starlette + SQLAlchemy integrations)
- ✅ **Sentry SDK** on frontend (`@sentry/react` with browser tracing)
- ✅ **Env-gated DSN** — zero overhead when unset

---

# 🛠 Roadmap — Future Phases (not yet shipped)

The original [`idea.md`](idea.md) is **100% complete**. The phases below are
forward-looking — ambitious next steps that would extend the project beyond
the original portfolio scope.

---

## Phase 11 — Image Editing (img2img + Inpainting + Outpainting)

Use `gpt-image-1`'s `images.edit` endpoint to let users *modify* existing
images, not just create new ones.

- Image-to-image: upload a reference + prompt → variation
- Inpainting: paint a mask on a canvas, describe what should fill it
- Outpainting: extend the canvas in any direction
- Edit history (parent/child links in DB)
- Mask drawing UI with brush size + eraser
- "Use this as reference" button on every gallery card

---

## Phase 12 — Multi-Model Support (FLUX / Stable Diffusion / Imagen)

Apply the same Protocol pattern that abstracted storage — but for image
providers. Let users pick which model to use, and compare results side-by-side.

- `ImageProvider` Protocol matching the `StorageBackend` design
- `OpenAIImageProvider` (gpt-image-1) — already done
- `ReplicateImageProvider` (FLUX, SDXL)
- `FalImageProvider` (FLUX schnell, ultra-fast)
- `GoogleImagenProvider` (Imagen 3)
- Side-by-side comparison view (generate the same prompt with N models, render in a grid)
- Per-model cost tracking in the dashboard
- Model selector in `AdvancedOptions`

---

## Phase 13 — Postgres + pgvector (Scale)

SQLite is great until it isn't. Migrate to Postgres for concurrent writes,
proper vector search, and prepare the DB layer for real production load.

- Alembic migrations with autogenerated diffs
- `pgvector` extension for the `embedding` column (HNSW index)
- True ANN search instead of in-memory cosine (handles 100k+ images at <50ms)
- Connection pooling tuned for async workloads
- Read replicas hint via SQLAlchemy `bind_mapper`
- Postgres-first Docker compose (with a `db` service)

---

## Phase 14 — True Multi-User Mode

Beyond owner-mode JWT — full user system with registration, per-user
galleries, and quotas.

- `User` table + email verification flow
- Registration / password reset endpoints
- `user_id` foreign key on `Image` (nullable for legacy rows)
- Per-user gallery scoping (replaces public read)
- Quota engine — daily / monthly image limits per user
- Slowapi rate limiting per route + per user
- Admin dashboard (Phase-13-only feature) for usage moderation

---

## Phase 15 — Public Sharing & Social

Turn private galleries into a discovery surface.

- `is_public` flag per image
- Public, slug-based share URLs (`/i/<uuid>`)
- Open-Graph + Twitter Card meta tags for rich link previews
- Likes / favorites
- Public "Discover" feed sorted by recency or popularity
- Report-this-image flow (NSFW / TOS violations)
- Anonymous viewing of public images (no login required)

---

## Phase 16 — Native Mobile App (React Native / Expo)

Reuse the typed API client and TanStack Query layer in a real native app.

- Expo project sharing the same TypeScript types
- Tab nav: Create / Gallery / Stats
- Touch-optimized prompt editor with native voice input
- Background generation with local push notifications when complete
- Native Share Sheet integration
- Offline-first sync (Workbox-style, but native)

---

## Phase 17 — Sora / Video Generation

When OpenAI's video API is GA, add it as a first-class generation type.

- `VideoRecord` model alongside `Image`
- Storyboard editor (multi-prompt sequence)
- Video gallery with HTML5 `<video>` players + scrubber
- Frame extraction to PNG (any frame becomes an image record)
- Cost tracking extended to video (which is much pricier per generation)

---

## Phase 18 — Commercial Readiness (Stripe + BYOK + Quotas)

If the project ever needs to charge for itself.

- Stripe Checkout integration for subscription tiers
- "Bring Your Own Key" — users add their own OpenAI key, charged only by Stripe for the UI layer
- Stripe webhooks → quota adjustments
- Usage caps + email receipts
- Customer portal (cancel / change plan)
- Self-hosted billing event log for auditability

---

## Roadmap Build Order Recommendation

If you ever return to this project, here's the order I'd attack the future
phases:

| Order | Phase | Effort | Reason |
|---|---|---|---|
| 1 | **Phase 11** — Image editing | 1 week | Highest UX delta; biggest new capability |
| 2 | **Phase 12** — Multi-model | 1 week | Lifts the product from "DALL-E app" to "image platform" |
| 3 | **Phase 13** — Postgres + pgvector | 3 days | Removes the only real scale ceiling |
| 4 | **Phase 14** — Multi-user | 1 week | Prerequisite for #15 and #18 |
| 5 | **Phase 15** — Public sharing | 4 days | Unlocks organic growth |
| 6 | **Phase 17** — Sora when ready | 3 days | Hot, distinctive, recruiter-grabbing |
| 7 | **Phase 16** — Native mobile | 2 weeks | Largest scope; do last |
| 8 | **Phase 18** — Commercial | 1 week | Only if you ever decide to monetize |
