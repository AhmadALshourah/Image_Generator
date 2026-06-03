# Backend — AI Image Generator API

Fully async FastAPI service wrapping OpenAI `gpt-image-1` + `gpt-4o-mini` + `omni-moderation-latest`,
with persistent SQLite storage and auto-generated WebP thumbnails.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux
```

Edit `.env` and set `OPENAI_API_KEY`.

> **Upgrading from v2?** Delete `backend/app.db` and `backend/images/` first — the schema
> changed (new columns for `effective_prompt`, `was_translated`, `prompt_hash`,
> `thumbnail_filename`, `background`, `output_format`).

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API root: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

On startup the app creates:
- `backend/app.db` — SQLite database
- `backend/images/` — image + thumbnail storage directory

Both are listed in `.gitignore`.

## Generation pipeline

The same pipeline serves two endpoints. `POST /api/generate` returns a single
response. `POST /api/generate/stream` is a Server-Sent Events endpoint that
emits an event after each stage transition, plus three partial renders during
generation, plus the final ImageRecord — perfect for a "watch it draw" UI.

```
   POST /api/generate(/stream)
         │
         ▼
   1. moderation_service.assert_prompt_allowed         → stage: "moderating"
         │  (OpenAI Moderation API — free, ~80ms)
         ▼
   2. prompt_service.translate_to_english (if Arabic)  → stage: "translating"
         │  (gpt-4o-mini)                              → stage: "translated"
         ▼
   3. cache_service.compute_prompt_hash → DB lookup    → stage: "cache_check"
         │
         ├── cache HIT → return cached row (cached: true)
         │
         └── cache MISS:
                 │
                 ▼
   4. gpt_image_service.{generate_image | stream_…}    → stage: "generating"
         │  (gpt-image-1 → b64_json bytes              → partial × 3 (streaming only)
         │   OR with stream=True, partial_images=3)
         ▼
   5. storage_service.save_image_with_thumbnail        → stage: "saving"
         │  (write file + Pillow WebP thumbnail in parallel)
         ▼
   6. INSERT into images table → return ImageRecord    → event: "complete"
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/generate` | Generate (or return cached) image — single response |
| POST | `/api/generate/stream` | Same pipeline, streamed via SSE with stage + partial events |
| GET | `/api/images` | List images (paginated: `?limit=&offset=`) |
| GET | `/api/images/{id}` | Get a single image record |
| DELETE | `/api/images/{id}` | Delete record + file + thumbnail |
| POST | `/api/enhance-prompt` | Expand a short prompt via GPT-4o-mini |
| GET | `/api/images/files/{filename}` | Serve a stored image or thumbnail |

### Example

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "قطة في الفضاء",
    "size": "1024x1024",
    "quality": "auto",
    "background": "auto",
    "output_format": "png",
    "force": false
  }'
```

The Arabic prompt will be translated automatically; the response will include both the
original Arabic and the English `effective_prompt`.

## Tests

```bash
pip install -r requirements-dev.txt
pytest -v
```

Tests run against an **in-memory SQLite** DB and a fully **mocked AsyncOpenAI**
client (no real API calls, no real network). Each test gets its own temp directory
for image storage so they can run in parallel without trampling each other.

The test suite covers:

- `/api/generate` — happy path, cache hit, `force=true`, Arabic auto-translate,
  moderation block, validation errors, all four image sizes
- `/api/images` — pagination, search by `q`, filter by size/quality/background,
  combined filters, get-one (200 + 404), delete (200 + 404)
- `/api/enhance-prompt` — happy path, validation, empty response, OpenAI error
- `cache_service.compute_prompt_hash` — determinism, whitespace + case
  normalization, distinct hashes for distinct inputs

## Logging

Logs are emitted as JSON (or colorized text in local dev) via `structlog`. Every
request gets a UUID `request_id` propagated as `X-Request-ID` and bound to every
log line in the request's async task, so you can grep a single request across
the whole log stream:

```
$ docker compose logs api | grep <some-uuid>
```

Switch formats with the `LOG_FORMAT` env var (`console` for dev, `json` for prod).

## Architecture

```
app/
├── main.py                          # FastAPI factory + async lifespan
├── config.py                        # pydantic-settings
├── schemas.py                       # Pydantic request/response models
├── logging_config.py                # structlog + stdlib bridge
├── database.py                      # async engine + AsyncSession + Base
├── models.py                        # ORM: Image
├── middleware/
│   └── request_id.py                # X-Request-ID + per-request timing logs
├── routers/
│   ├── images.py                    # generate + list + get + delete (orchestrator)
│   └── prompt.py                    # enhance-prompt
└── services/
    ├── openai_client.py             # singleton AsyncOpenAI
    ├── gpt_image_service.py         # gpt-image-1 → bytes
    ├── moderation_service.py        # pre-flight content moderation
    ├── prompt_service.py            # enhance + translate (Arabic→English)
    ├── cache_service.py             # SHA-256 prompt hash
    └── storage_service.py           # async file IO + Pillow WebP thumbnails
```

## Notes on Async

The whole backend is async end-to-end:
- `AsyncOpenAI` is created **once** via `lru_cache` so its internal httpx pool is shared
  across all requests.
- DB access uses `sqlalchemy.ext.asyncio` (`create_async_engine`, `AsyncSession`).
- File IO uses `aiofiles`; the CPU-bound Pillow thumbnail step is offloaded to a thread
  via `asyncio.to_thread`.
- The full image write and the thumbnail generation run **in parallel** via
  `asyncio.create_task`.
