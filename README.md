# AI Image Generator — Full-Stack Web Application

A modern full-stack web app that generates, persists, and curates images from text prompts
using **OpenAI's `gpt-image-1`** model (the same model that powers ChatGPT's image generation).

Built with **React + Vite + Tailwind CSS** on the front, **fully async FastAPI + SQLAlchemy +
SQLite** on the back.

> **Note:** This project started as a 31-line Gradio prototype ([`Model.py`](Model.py))
> and was rebuilt as a production-style full-stack web application in three phases.
> The original file is preserved for reference.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, **TypeScript**, Vite, Tailwind CSS, React Router, TanStack Query, Axios |
| Backend | **Async** FastAPI, **Async** SQLAlchemy 2, Pydantic v2, Uvicorn, aiofiles, Pillow |
| Database | SQLite (`aiosqlite`) |
| AI | OpenAI `gpt-image-1` (images), `gpt-4o-mini` (translate + enhance), `omni-moderation-latest` (safety) |
| Storage | Local filesystem with auto-generated **WebP thumbnails** |

## Features

### Phase 1 — Core generator
- Text-to-image generation
- Advanced options (size / quality / background / output format)
- Dark / Light mode (persists in localStorage, follows `prefers-color-scheme`)
- Responsive mobile-first design
- Real-time loading states, friendly error handling, sample prompts
- Auto-generated **Swagger** API docs

### Phase 2 — Gallery, persistence & AI assist
- Persistent local storage of every image (no expiring URLs)
- Gallery page with paginated grid + click-to-zoom modal
- Download, Share, Delete with confirmation
- One-click Prompt Enhancement via GPT-4o-mini
- Toast notifications, client-side routing

### Phase 3 — Production-grade upgrades
- 🚀 **Migrated to `gpt-image-1`** — sharper images, text rendering, transparent backgrounds, native multi-format
- ⚡ **Fully async backend** — single Uvicorn worker now handles 100+ concurrent generations
- 🛡️ **OpenAI Moderation** pre-flight on every prompt — blocks TOS violations
- 🖼️ **WebP thumbnails** auto-generated via Pillow — gallery loads ~50× faster
- 💰 **Prompt cache (SHA-256)** — identical prompts return instantly with $0 cost
- 🌍 **Auto-detect Arabic → translate to English** before generation (silent, transparent in the UI)
- ✨ **Transparent backgrounds** supported (`background="transparent"`)

### Phase 4 — Frontend modernization & power-user features
- 🧠 **TanStack Query** — all data fetching now goes through `useQuery`/`useMutation` with shared cache, automatic refetch, and optimistic updates (delete is instant, rolls back on server error)
- 🔍 **Gallery search + filter** — debounced full-text search across prompt + effective_prompt, plus dropdowns for size / quality / background; resets pagination on filter change
- 🔄 **Regenerate similar** — one-click variation from the image modal (uses `force=true` to bypass cache and produce a fresh render with the same prompt + options)
- 📎 **PNG metadata embedding** — prompt, effective prompt, size, quality, background, and model are embedded as `tEXt` chunks in every PNG; images are self-describing and inspectable with `exiftool`

### Phase 5 — TypeScript end-to-end
- 🟦 **Full TypeScript migration** — every `.jsx`/`.js` file in `frontend/src` is now `.tsx`/`.ts` with strict mode enabled
- 📐 **Typed DTOs** — `src/types/api.ts` mirrors the Pydantic schemas; `Literal` unions become string-literal unions (`ImageSize`, `ImageQuality`, `ImageBackground`, `ImageOutputFormat`)
- 🔁 **Typed React Query hooks** — `useImagesQuery`, `useGenerateImage`, `useDeleteImage`, `useEnhancePrompt` all return fully typed data + errors + variables
- ⚙️ **Auto-generated OpenAPI client** — `npm run generate-types` regenerates types from the live `/openapi.json` via `openapi-typescript`
- ✅ **Build-time type checking** — `npm run build` runs `tsc --noEmit` before bundling; production never ships with type errors

### Phase 6 — One-command deploy + CI
- 🐳 **`docker compose up`** runs the whole stack — multi-stage Dockerfiles for both backend (Python 3.12-slim) and frontend (Node 20 → nginx:alpine)
- 🔗 **Nginx reverse proxy** in the frontend container forwards `/api/*` to the backend service, so there's a single origin (no CORS in prod)
- 📦 **Named volume** (`api_data`) persists the SQLite DB and the `images/` folder across container restarts
- 🩺 **Container healthchecks** on both services; the web container waits for `api` to be healthy before starting
- 👤 **Non-root container user** (`uid 1001`) for the backend
- 🤖 **GitHub Actions CI** runs on every push + PR: backend byte-compile + import smoke test, frontend `tsc --noEmit` + production build, and a Docker build smoke test that exercises both Dockerfiles
- 🚀 **Build cache via GHA** — repeat CI runs reuse layer caches via `type=gha`

### Phase 7 — Tests
- 🧪 **Backend: `pytest` + `pytest-asyncio` + `httpx.AsyncClient`** with full mocks for `AsyncOpenAI` — zero real network calls
- 🗄️ **In-memory SQLite per test** via async SQLAlchemy + dependency override; tests are fully isolated
- ✅ **Coverage of every branch** in the `/api/generate` pipeline: happy path, cache hit, `force=true`, Arabic auto-translate, moderation block, validation errors
- 📚 **Gallery CRUD tests** — list/pagination/search-q/filter-by-size/filter-by-background/get/delete/404
- 🛡️ **Service-layer tests** for `cache_service.compute_prompt_hash` (determinism, whitespace + case normalization)
- ⚛️ **Frontend: `vitest` + `@testing-library/react` + `jsdom`** with a typed `renderWithProviders` wrapper that injects QueryClient + Router + Toasts
- 🔄 **Hook tests** with fake timers (`useDebouncedValue`)
- 🧰 **Util tests** (`buildShareUrl`, `downloadImage` happy path + fallback)
- 🖱️ **Component interaction tests** (`AdvancedOptions`, `GallerySearch`) with `userEvent`
- 🔀 **Optimistic-update test** for `useDeleteImage` — verifies rollback on server error
- 🤖 **CI runs every test on every push** — backend pytest + frontend vitest both gate the Docker build

### Phase 8 — Production polish
- 🛡️ **React Error Boundary** wraps every route — a render crash shows a friendly fallback with a "Try again" button instead of a blank screen
- ⚡ **Code-splitting + Suspense** — `GalleryPage` is `React.lazy()`-loaded, shrinking the initial bundle for the Create page
- 📋 **Structured logging via `structlog`** — every log line is a JSON record (or pretty-printed in dev) with ISO timestamp, level, logger name, and `request_id`
- 🆔 **Correlation IDs** — a middleware generates / reuses `X-Request-ID` for every request and binds it into structlog's contextvars; one request is greppable across every async hop and the ID is echoed back to the client
- ⏱️ **Per-request timing** — automatic "request completed" log with status code + elapsed ms
- 🔧 **Pre-commit hooks** (`.pre-commit-config.yaml`): `ruff` (lint + format) for Python, `prettier` for everything else, plus generic safety hooks (trailing whitespace, EOF newline, merge-conflict markers, large-file guard)
- 📐 **`ruff` config in `backend/pyproject.toml`** — sensible rule selection (`E`, `F`, `I`, `W`, `B`, `UP`, `SIM`, `C4`, `RUF`), 100-char line length, Python 3.12 target

### Phase 9 — Live streaming generation
- ⚡ **Server-Sent Events** endpoint `POST /api/generate/stream` — the whole pipeline (moderate → translate → cache → generate → save) emits events as it runs
- 🖼️ **`gpt-image-1` `partial_images=3`** — the image fades in across 3 progressive renders the way ChatGPT does, instead of a 25-second blank spinner
- 🧭 **5-stage visual indicator** — moderating · translating (if Arabic) · cache check · generating · saving, with the active stage pulsing indigo and failed stages flashing red
- 🛑 **Cancellable** — `AbortController` lets the user click "Cancel generation" mid-flight; unmounting the page also tears the stream down
- 🔌 **No extra deps on the frontend** — fetch + ReadableStream + a 40-line inline SSE parser (handles `\n\n` and `\r\n\r\n` boundaries, multi-line `data:`, comment lines)
- 📡 **Backend uses `sse-starlette`** — clean dict-based event yields, automatic keep-alive comments, proper `text/event-stream` content type
- 🔁 **`POST /api/generate` (non-streaming) still works** — used by the gallery's "Regenerate similar" flow and as a fallback

### Phase 10 — Final feature wave (current)
- 🏛️ **Repository pattern + DI** — every DB query lives in `ImageRepository` / `TagRepository`; routes accept them via FastAPI `Depends`. The router layer is SQLAlchemy-free and trivially mockable.
- ☁️ **Pluggable storage backend** — `STORAGE_BACKEND=local|s3` chooses between local disk and any S3-compatible bucket (AWS S3, Cloudflare R2, MinIO, Backblaze B2). boto3 is lazy-imported, so local deployments don't pay the cost.
- 🛡️ **JWT auth (owner mode)** — opt-in via `AUTH_ENABLED=true`. `OWNER_USERNAME` + `OWNER_PASSWORD` (plain or bcrypt) → JWT issued from `POST /api/auth/login` → required Bearer on every write endpoint. Reads stay public.
- 🧠 **Embedding-based similar prompts** — every generation embeds its `effective_prompt` via `text-embedding-3-small`. As the user types, `GET /api/prompts/similar` ranks past prompts by cosine similarity and the form shows the top 3 with thumbnails.
- 💰 **Cost dashboard** — every Image carries an estimated `cost_usd`. `GET /api/stats` aggregates total spend, cache savings, translation count, distributions by quality/size, and daily spend. The `/stats` page renders it as cards + a CSS bar chart.
- 🏷️ **Tags + Collections** — `Tag` table + `image_tags` association. The image modal has a chip-style tag editor; the gallery has a clickable tag bar that filters in one click.
- 🎤 **Voice input** — microphone button on the prompt textarea uses the Web Speech API. Auto-detects Arabic vs English based on what's already typed. Hides itself in Firefox (no support).
- 🎨 **Style presets** — 8 one-click chips (Photorealistic, Anime, Oil Painting, Watercolor, Pixel Art, Cinematic, Studio Ghibli, 3D Render) that append a ready-made phrase to the prompt.
- 📱 **PWA** — `vite-plugin-pwa` generates a Workbox service worker, installable manifest, and runtime caching. The gallery + stored image files work offline once visited; the app is installable on phone/desktop home screens.
- 🐛 **Sentry** — env-gated DSN on both backend (`sentry-sdk[fastapi]` with FastAPI + SQLAlchemy + Starlette integrations) and frontend (`@sentry/react` with browser tracing). Zero-overhead when DSN is empty.

## Project Structure

```
.
├── backend/                            # FastAPI app (fully async)
│   ├── app/
│   │   ├── main.py                     # FastAPI factory + async lifespan
│   │   ├── config.py                   # pydantic-settings env loader
│   │   ├── schemas.py                  # request/response models
│   │   ├── database.py                 # async SQLAlchemy engine + session
│   │   ├── models.py                   # Image ORM model
│   │   ├── routers/
│   │   │   ├── images.py               # generate + gallery CRUD (orchestrates the pipeline)
│   │   │   └── prompt.py               # enhance-prompt endpoint
│   │   └── services/
│   │       ├── openai_client.py        # singleton AsyncOpenAI (shared httpx pool)
│   │       ├── gpt_image_service.py    # gpt-image-1 wrapper (base64 → bytes)
│   │       ├── moderation_service.py   # OpenAI Moderation API pre-flight
│   │       ├── prompt_service.py       # enhance + Arabic→English translate
│   │       ├── cache_service.py        # SHA-256 prompt hash
│   │       └── storage_service.py      # save file + generate WebP thumbnail
│   ├── requirements.txt
│   └── .env.example
├── frontend/                           # React + TypeScript + Vite + Tailwind + TanStack Query
│   ├── src/                            # see frontend/README.md for full layout
│   ├── Dockerfile                      # multi-stage: Node 20 build → nginx serve
│   ├── nginx.conf                      # reverse-proxy /api/ to api container
│   ├── tsconfig.json
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml                  # one-command stack
├── .dockerignore
├── .github/workflows/ci.yml            # backend + frontend + Docker build CI
├── Model.py                            # original Gradio prototype (reference)
├── idea.md                             # roadmap of future improvements
└── README.md
```

---

## Quick Start

There are two ways to run this: **Docker** (one command, recommended for evaluation) or **native** (two terminals, recommended for development).

### Option A — Docker (one command)

Requires Docker Desktop / Docker Engine v20+ with Compose v2.

From the **repo root**, copy the provided example and set your key:

```bash
# repo root
cp .env.example .env          # macOS / Linux
copy .env.example .env        # Windows PowerShell
```

Open `.env` and replace `sk-replace-me` with your real OpenAI API key, then:

```bash
docker compose up --build
```

Open http://localhost:8080. The SQLite DB and generated images persist in a
named Docker volume (`api_data`), so they survive `docker compose down`.

To wipe state: `docker compose down -v`.

### Option B — Native dev

Two terminals — one for the backend, one for the frontend.

#### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate              # Windows PowerShell
# source .venv/bin/activate         # macOS/Linux
pip install -r requirements.txt
```

Still inside `backend/`, copy the env template and set your key:

```bash
copy .env.example .env              # Windows PowerShell (run from backend/)
# cp .env.example .env              # macOS/Linux      (run from backend/)
```

Open `backend/.env` and set your `OPENAI_API_KEY`.

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

On first run, SQLite (`backend/app.db`) and the `backend/images/` folder are created automatically.

> **Upgrading from a previous version?** The DB schema changed in v3. Delete `backend/app.db`
> and the `backend/images/` folder before starting — a clean slate is the simplest path.

#### 2. Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and start generating.

---

## API Reference

### `POST /api/generate` — Generate (or return cached) image

The full pipeline runs in this order:
1. **Moderation** — OpenAI Moderation API blocks disallowed prompts.
2. **Arabic detection** — if the prompt looks Arabic, GPT-4o-mini silently translates to English.
3. **Cache lookup** — SHA-256 hash of `(effective_prompt + size + quality + background + format)`.
   If a record exists and `force=false`, it's returned with `cached: true` (zero API cost).
4. **Generation** — gpt-image-1 returns base64 image bytes.
5. **Persistence** — original saved to disk + WebP thumbnail generated in parallel + DB row inserted.

Request:
```json
{
  "prompt": "A serene Japanese garden at golden hour",
  "size": "1024x1024",
  "quality": "auto",
  "background": "auto",
  "output_format": "png",
  "force": false
}
```

Response (`201 Created`):
```json
{
  "id": 7,
  "uuid": "f4a1...",
  "prompt": "A serene Japanese garden at golden hour",
  "effective_prompt": "A serene Japanese garden at golden hour",
  "was_translated": false,
  "size": "1024x1024",
  "quality": "auto",
  "background": "auto",
  "output_format": "png",
  "filename": "f4a1....png",
  "thumbnail_filename": "f4a1...-thumb.webp",
  "file_size": 1854320,
  "created_at": "2026-06-03T18:30:00Z",
  "image_url": "/api/images/files/f4a1....png",
  "thumbnail_url": "/api/images/files/f4a1...-thumb.webp",
  "cached": false
}
```

### `POST /api/generate/stream` — Live streaming pipeline

(Same body as `/api/generate`.) Returns `text/event-stream`:

| Event | Data | When |
|---|---|---|
| `stage` | `{"stage": "moderating" \| "translating" \| "translated" \| "cache_check" \| "generating" \| "saving", "effective_prompt"?: string}` | On each pipeline transition |
| `partial` | `{"index": 0..2, "b64_json": "<base64-png>"}` | Every progressive render from gpt-image-1 |
| `complete` | Full `ImageRecord` (with `cached: bool`) | Terminal — pipeline finished successfully |
| `error` | `{"detail": "..."}` | Terminal — pipeline failed; stream closes after |

### Other endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check (also reports model in use) |
| GET | `/api/images?limit=&offset=&q=&size=&quality=&background=&tag=` | Paginated gallery with full search/filter |
| GET | `/api/images/{id}` | Single image record |
| DELETE | `/api/images/{id}` | Delete record + file + thumbnail (auth-gated) |
| PUT | `/api/images/{id}/tags` | Set tags for an image (auth-gated) |
| GET | `/api/tags` | List all tags with image counts |
| POST | `/api/enhance-prompt` | Expand a short prompt via GPT-4o-mini |
| GET | `/api/prompts/similar?q=&top_k=` | Cosine-similarity search over past prompts |
| GET | `/api/stats` | Cost dashboard aggregate |
| POST | `/api/auth/login` | Owner login → JWT (only if `AUTH_ENABLED=true`) |
| GET | `/api/auth/status` | Whether auth is enabled + the caller's identity |
| GET | `/api/images/files/{filename}` | Static file serving (full image **or** thumbnail) |

---

## Roadmap

All 27 ideas from [`idea.md`](idea.md) are now shipped (each one marked ✅ صح). The roadmap from the original plan is complete:

- ✅ Async backend, TanStack Query, WebP thumbnails, Arabic auto-translate
- ✅ Moderation, prompt cache, gallery search, image variations
- ✅ PNG metadata, Docker + CI, TypeScript + OpenAPI codegen, tests
- ✅ Server-Sent Events streaming with progressive renders
- ✅ Structured logging, pre-commit hooks, Error Boundary + Suspense
- ✅ Repository pattern, pluggable S3 storage, JWT auth
- ✅ Embedding-based similar prompts, cost dashboard, tags + collections
- ✅ Voice input, style presets, PWA, Sentry

---

## License

MIT — feel free to use as a portfolio reference.

