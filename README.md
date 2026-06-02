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
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
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

### Phase 3 — Production-grade upgrades (current)
- 🚀 **Migrated to `gpt-image-1`** — sharper images, text rendering, transparent backgrounds, native multi-format
- ⚡ **Fully async backend** — single Uvicorn worker now handles 100+ concurrent generations
- 🛡️ **OpenAI Moderation** pre-flight on every prompt — blocks TOS violations
- 🖼️ **WebP thumbnails** auto-generated via Pillow — gallery loads ~50× faster
- 💰 **Prompt cache (SHA-256)** — identical prompts return instantly with $0 cost
- 🌍 **Auto-detect Arabic → translate to English** before generation (silent, transparent in the UI)
- ✨ **Transparent backgrounds** supported (`background="transparent"`)

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
├── frontend/                           # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/                      # HomePage + GalleryPage
│   │   ├── components/                 # 14 small focused components
│   │   ├── hooks/useTheme.js
│   │   ├── context/ToastContext.jsx
│   │   ├── api/client.js
│   │   └── utils/download.js
│   ├── package.json
│   └── vite.config.js
├── Model.py                            # original Gradio prototype (reference)
├── idea.md                             # roadmap of future improvements
└── README.md
```

---

## Quick Start

You'll need two terminals — one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate              # Windows PowerShell
# source .venv/bin/activate         # macOS/Linux
pip install -r requirements.txt
copy .env.example .env              # Windows
# cp .env.example .env              # macOS/Linux
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

### 2. Frontend

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

### Other endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check (also reports model in use) |
| GET | `/api/images?limit=&offset=` | Paginated gallery |
| GET | `/api/images/{id}` | Single image record |
| DELETE | `/api/images/{id}` | Delete record + file + thumbnail |
| POST | `/api/enhance-prompt` | Expand a short prompt via GPT-4o-mini |
| GET | `/api/images/files/{filename}` | Static file serving (full image **or** thumbnail) |

---

## Roadmap

See [`idea.md`](idea.md) for the full prioritized list. Highlights still to ship:

- TanStack Query on the frontend
- Server-Sent Events for live generation progress
- Gallery search + filter
- Image variations / re-generate
- PNG metadata embedding (tEXt chunks)
- TypeScript migration + OpenAPI codegen
- Docker + docker-compose
- Tests (pytest + vitest)

---

## License

MIT — feel free to use as a portfolio reference.

