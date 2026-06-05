# Issues — AI Image Generator

> Every problem I found during a thorough audit, grouped by severity.
> 🔴 = blocking · 🟠 = silent/important · 🟡 = UX/quality · 🔵 = polish

---

## 🔴 CRITICAL — Why the page looked like raw HTML

### #1 — Tailwind doesn't scan TypeScript files (THE CSS BUG)

**File:** `frontend/tailwind.config.js` line 3

**Current (broken):**
```js
content: ['./index.html', './src/**/*.{js,jsx}'],
```

**Root cause:** The project was migrated to TypeScript in Phase 5 (every file is now
`.ts` / `.tsx`), but Tailwind's content glob was never updated. Tailwind reads
this config to figure out which class names to keep in the final CSS. With the
current glob, **it sees zero files** — so it generates **zero utility classes**.
The result: `bg-slate-50`, `flex`, `rounded-xl`, *everything* gets purged out
of the output CSS. The browser receives an essentially empty stylesheet and
the page falls back to user-agent styles → **looks like raw HTML**.

**Fix:**
```js
content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
```

That single change brings every Tailwind utility back. Restart `npm run dev`
after editing.

---

### #2 — Frontend TypeScript build fails (`GalleryFilters` field mismatch)

**File:** `frontend/src/components/GallerySearch.test.tsx` line 8

**Current (broken):**
```ts
const EMPTY: GalleryFilters = { q: '', size: '', quality: '', background: '' };
```

**Root cause:** Phase 10 added `tag: string` to `GalleryFilters` in
`types/api.ts`. The test fixture still uses the old shape → TypeScript
strict mode errors out → `npm run build` fails → CI red.

**Fix:** Add `tag: ''` to every fixture in this file:
```ts
const EMPTY: GalleryFilters = { q: '', size: '', quality: '', background: '', tag: '' };

// And in the "clears all filters" test:
filters={{ q: 'cat', size: '1024x1024', quality: '', background: '', tag: '' }}
```

---

### #3 — Frontend test `queries.test.tsx` build fails (missing `ImageRecord` fields)

**File:** `frontend/src/api/queries.test.tsx` lines 17–37 (the `makeImage` helper)

**Root cause:** Phase 10 added `cost_usd: number` and `tags: TagSummary[]`
to `ImageRecord`. The test helper still returns the old shape → TypeScript
build fails on the test file.

**Fix:** Add the missing fields to `makeImage`:
```ts
function makeImage(overrides: Partial<ImageRecord> = {}): ImageRecord {
  return {
    // … existing fields …
    cost_usd: 0.042,
    tags: [],
    ...overrides,
  };
}
```

---

### #4 — `GallerySearch` tests now throw at runtime (no `QueryClientProvider`)

**File:** `frontend/src/components/GallerySearch.test.tsx`

**Root cause:** Phase 10 added `useTagsQuery()` *inside* `GallerySearch`. That
hook calls `useQuery` and requires a `QueryClientProvider` ancestor in the
tree. The tests use bare `render(…)` from `@testing-library/react` with no
provider → every test throws `No QueryClient set, use QueryClientProvider`.

**Fix:** Switch to the existing `renderWithProviders` helper:
```ts
// Replace:
import { render, screen } from '@testing-library/react';

// With:
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

// And in every test:
renderWithProviders(<GallerySearch ... />);   // instead of render(...)
```

---

## 🟠 HIGH — Silent breakage / production bugs

### #5 — Storage backend cache leaks between tests

**File:** `backend/app/storage/factory.py` (`@lru_cache` on `get_storage_backend`) + `backend/tests/conftest.py`

**Root cause:** `get_storage_backend()` is decorated with `@lru_cache(maxsize=1)`
so it returns the same `LocalDiskStorage` instance forever. In tests, every
`client` fixture sets a fresh `DATA_DIR` env var and clears `get_settings`,
but never clears `get_storage_backend`. After the first test, every subsequent
test writes images into the **first test's** temp directory.

**Fix in `conftest.py`** (already has `get_settings.cache_clear()`):
```python
from app.storage.factory import get_storage_backend
# …
get_settings.cache_clear()
get_storage_backend.cache_clear()
```

---

### #6 — SQLite doesn't enforce CASCADE for tag deletes

**File:** `backend/app/database.py` (engine setup) + `backend/app/models.py` (image_tags association)

**Root cause:** The `image_tags` association table declares
`ondelete="CASCADE"`, but **SQLite doesn't enforce foreign keys by default** —
they have to be turned on per connection. Right now, deleting an `Image`
leaves orphan rows in `image_tags`.

**Fix:** Add a connection-pool event listener in `database.py`:
```python
from sqlalchemy import event

@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragmas(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

This is a one-time fix that lasts forever.

---

### #7 — PWA can't actually be installed (no PNG icons)

**Files:** `frontend/public/` (only `favicon.svg`) + `frontend/vite.config.ts` (manifest)

**Root cause:** The PWA manifest only references `favicon.svg`. Chrome and
Edge accept SVG icons for install, but **iOS Safari and most Android Chrome
versions require 192×192 and 512×512 PNG icons**. Without them, the install
prompt is suppressed.

**Fix options:**

A) **Quick / pragmatic:** Generate two PNG icons (e.g. via PWA Asset Generator
   or a one-shot script) and reference them:
   ```ts
   icons: [
     { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
     { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
     { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
   ],
   ```

B) **Programmatic:** add a Vite plugin like `vite-plugin-pwa`'s
   `pwa-assets-generator` to derive PNGs from the SVG at build time.

C) **Document the limitation** in README and accept SVG-only (works on
   Chrome/Edge desktop).

---

### #8 — S3 storage URLs aren't actually used in the API response

**File:** `backend/app/schemas.py` lines 53–66 (`ImageRecord.from_orm_with_urls`)

**Root cause:** The method hard-codes `/api/images/files/{filename}` as the
URL, regardless of which `StorageBackend` is configured. When
`STORAGE_BACKEND=s3`, images are saved to S3 but the API still returns the
local `/api/images/files/...` URL — which 404s because the file isn't on disk.

**Fix:** Plumb the storage's `public_url()` through the schema:
```python
@classmethod
def from_orm_with_urls(cls, image, cached: bool = False) -> "ImageRecord":
    from app.storage import get_storage_backend  # avoid circular import
    storage = get_storage_backend()
    record = cls.model_validate(image)
    record.image_url = storage.public_url(image.filename)
    record.thumbnail_url = (
        storage.public_url(image.thumbnail_filename)
        if image.thumbnail_filename else record.image_url
    )
    record.cached = cached
    return record
```

(Local storage already returns `/api/images/files/{filename}` via its
`public_url`, so this works for both backends.)

---

### #9 — Service worker may not actually register on first load

**File:** `frontend/vite.config.ts` (PWA plugin) + `frontend/src/main.tsx`

**Root cause:** `vite-plugin-pwa` with `registerType: 'autoUpdate'` requires
**either** `injectRegister: 'auto'` (the default in recent versions) **or** an
explicit `import { registerSW } from 'virtual:pwa-register'` in `main.tsx`.
We rely on the default and never import the virtual module, which works on
some plugin versions and fails silently on others.

**Fix:** Be explicit. Add to `vite.config.ts`:
```ts
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',           // explicit — survives plugin upgrades
  // … rest unchanged
}),
```

Or alternatively in `main.tsx` add:
```ts
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
```

---

### #10 — `Model.py` still has the original typos

**File:** `Model.py` (kept for historical reference)

**Root cause:** `idea.md` and the README claim the typos `clint` and `respone`
were fixed during the migration. They were fixed *in the rewrite* (the
new code is at `backend/app/services/gpt_image_service.py`) but `Model.py`
itself still has them.

**Fix options:**

A) **Leave it alone** — it's a historical artefact. The README explicitly says
   so. Decision documented earlier.

B) **Add a header comment** at the top of `Model.py` clarifying: "This is the
   original prototype with its original bugs. The production fix lives in
   `backend/app/services/gpt_image_service.py`."

Recommended: option **B**. Two-line comment, zero risk.

---

## 🟡 MEDIUM — Docs / UX / minor bugs

### #11 — `docker compose up` fails immediately with no root `.env.example`

**File:** `docker-compose.yml` line 21 + repo root

**Root cause:** `docker-compose.yml` reads variables from `./. env` (Docker
Compose's default behaviour) and uses `${OPENAI_API_KEY:?…}` which hard-fails
the moment that variable is missing. There's no `.env.example` at the repo
root — only at `backend/.env.example`. A new user clones, runs
`docker compose up`, gets a cryptic error.

**Fix:** Add a root-level `.env.example`:
```env
# Copy this file to .env at the repo root, then run `docker compose up`.
OPENAI_API_KEY=sk-replace-me
# Optional:
# WEB_PORT=8080
# LOG_FORMAT=json
```

And add a one-liner to README's quick-start: *"Copy `.env.example` to `.env`
and set `OPENAI_API_KEY`."*

---

### #12 — Header is cramped on mobile

**File:** `frontend/src/components/Header.tsx`

**Root cause:** On screens narrower than ~400px the row holds: logo + 3 nav
links + Sign-in button + theme toggle. Items wrap or get squished.

**Fix:** Hide nav labels on very small screens and use icons, or use a slide-
out drawer:
```tsx
// Quick fix: hide nav text under 380px
<nav className="flex items-center gap-0.5 sm:gap-1">
  <NavLink to="/" end>
    <span className="hidden xs:inline">Create</span>
    <span className="xs:hidden">✨</span>
  </NavLink>
  // …
</nav>
```

Better long-term fix: bottom-nav-bar on mobile, top-nav on desktop.

---

### #13 — `ImageDisplay` doesn't show `cost_usd` or `tags`

**File:** `frontend/src/components/ImageDisplay.tsx`

**Root cause:** The component renders right after a successful generation, but
shows neither the estimated cost nor a tag editor. The same data is shown in
the `ImageModal` (after the user clicks into the gallery), creating an
inconsistency between the two surfaces.

**Fix:** Add a cost pill next to the metadata badges, and optionally a "Add
tags" chip-input. Keeps the two views aligned.

---

### #14 — Quick-start instructions assume the wrong CWD

**File:** `README.md` (Backend section)

**Root cause:** The README shows `copy .env.example .env` *without* explicitly
saying you must be in `backend/` first. A reader skimming the block can run it
from the repo root and create a stray `.env` at the wrong level.

**Fix:** Wrap the env step inside the `cd backend` block clearly, or use full
paths:
```bash
# At the repo root:
copy backend\.env.example backend\.env       # Windows
cp backend/.env.example backend/.env         # macOS/Linux
```

---

### #15 — Frontend tests don't cover the new flows

**Files:** `frontend/src/` (whole subtree)

**Root cause:** Phase 10 added a lot: Voice input, Similar prompts, Style
presets, Tag editor, Login modal, Stats page, AuthContext, streaming hook.
None of these have tests. The CI green light is misleading for these features.

**Fix:** Add at least smoke tests for: `useVoiceInput` (mock `SpeechRecognition`),
`SimilarPrompts` rendering with mocked query, `StylePresets` `onApply`
behaviour, `useStreamGenerate` state machine with a mocked SSE stream,
`AuthContext` login flow with mocked client.

Not blocking — just deferred coverage.

---

### #16 — Backend tests don't cover new endpoints

**Files:** `backend/tests/`

**Root cause:** Same as #15 but for the API. No tests for `/api/stats`,
`/api/tags`, `/api/auth/login`, `/api/auth/status`, `/api/prompts/similar`,
`/api/generate/stream`. Repository pattern is untested too.

**Fix:** Add `tests/test_auth.py`, `tests/test_tags.py`, `tests/test_stats.py`,
`tests/test_prompts.py`. The existing `conftest.py` fixture infrastructure
handles auth-disabled-by-default and the mocked OpenAI, so each new file should
need <50 lines.

---

## 🔵 LOW — Polish / future work

### #17 — No `apple-touch-icon` for iOS

**File:** `frontend/index.html`

**Root cause:** iOS Safari ignores the PWA manifest icons and looks for
`<link rel="apple-touch-icon" href="…">` instead. We don't supply one, so
adding to iOS home screen produces a default icon.

**Fix:** Add to `index.html`:
```html
<link rel="apple-touch-icon" href="/icon-180.png" />
```
(After producing a 180×180 PNG — see #7.)

---

### #18 — No rate limiting on write endpoints

**File:** `backend/app/routers/images.py`

**Root cause:** When `AUTH_ENABLED=false` (the default), anyone with network
access to the server can spam `/api/generate` and run up the OpenAI bill.

**Fix:** Add `slowapi` and a per-IP limit on `/api/generate*`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
# In main.py:  app.state.limiter = limiter
# In routes:    @limiter.limit("10/minute")
```

Worth doing before any public deploy.

---

### #19 — `docker-compose.yml` hard-fails on missing OPENAI_API_KEY

**File:** `docker-compose.yml` line 21

**Root cause:** `${OPENAI_API_KEY:?…}` aborts compose immediately. The error
message is technical and doesn't tell the user *how* to fix it.

**Fix:** Combined with #11: add a root `.env.example` and a friendlier error
message:
```yaml
OPENAI_API_KEY: ${OPENAI_API_KEY:?Set OPENAI_API_KEY in .env at the repo root}
```

---

### #20 — `AuthContext` hits `/api/auth/status` on every page load

**File:** `frontend/src/context/AuthContext.tsx`

**Root cause:** `useAuthStatus()` fires immediately on mount. When auth is
disabled (the common case), this is a wasted round trip. Cached for 60s by
React Query, so impact is small, but still.

**Fix:** Read a build-time env var (`VITE_AUTH_ENABLED`) and skip the call
when it's clearly false. Or add `staleTime: Infinity` for the negative case.

---

### #21 — No image moderation on the *output*

**File:** `backend/app/services/gpt_image_service.py`

**Root cause:** We pass `moderation="auto"` to gpt-image-1 which is the
strictest built-in setting, but we don't run a second pass (e.g. NSFW
classifier) on the rendered image. For a public deploy this is a risk.

**Fix:** Optional second-pass moderation via OpenAI's vision Moderation API
once it's GA, or a self-hosted NSFW detector.

---

### #22 — `numpy` in production requirements is heavy for one use case

**File:** `backend/requirements.txt`

**Root cause:** `numpy` is ~30 MB of binary wheels and we only use it for
cosine similarity in `embedding_service`. Not a real problem, just oversized.

**Fix (optional):** Hand-roll the cosine math with `math.sqrt` + a loop. We'd
shave the dep but lose readability. Not worth doing.

---

### #23 — `boto3` version pinned generously

**File:** `backend/requirements.txt`

**Root cause:** `boto3>=1.35.0` — `botocore` and `boto3` move quickly and
sometimes break in patch versions. Production deployments should pin to an
exact minor.

**Fix:** Pin to a known-good minor before production deploy.

---

---

## 🟢 FIXED — Design & i18n phase (resolved)

### #24 — Tests broke after adding `LangProvider` ✅ FIXED

**Root cause:** All components were updated to call `useLang()`, but the test utility
`src/test/test-utils.tsx` was missing `LangProvider` in `AllProviders`. Every test
that rendered a component using `useLang()` threw `"useLang must be used inside <LangProvider>"`.

**Affected files:** `StylePresets.test.tsx`, `GallerySearch.test.tsx`,
`AdvancedOptions.test.tsx`, `SimilarPrompts.test.tsx`.

**Fix applied:** Added `LangProvider` to `AllProviders` in `test-utils.tsx`. All
42 tests now pass.

---

### #25 — `useDeleteImage` optimistic-update test failed after `gcTime: 0` ✅ FIXED

**File:** `src/test/test-utils.tsx`, `src/api/queries.test.tsx`

**Root cause:** `makeQueryClient()` set `gcTime: 0` ("garbage collect immediately when
no observers"). In `useDeleteImage`, `onSettled` calls `invalidateQueries`, which
marks the query stale. With `gcTime: 0` and no active observer in the hook test,
React Query schedules a 0ms timeout to evict the cache entry. Since the test uses
`async/await` (multiple event-loop ticks), the GC fires before line 117 reads
`qc.getQueryData(listKey)` → returns `undefined` → `TypeError`.

**Fix applied:** Changed `gcTime: 0` → `gcTime: Infinity` in `makeQueryClient()`.
Data persists through async test operations; cache isolation between tests is still
handled by creating a fresh `QueryClient` per test.

---

### #26 — `AdvancedOptions` test used bare `render` and stale label text ✅ FIXED

**File:** `src/components/AdvancedOptions.test.tsx`

**Root cause 1:** Test used `render(...)` directly (no providers) — broke after
`AdvancedOptions` started calling `useLang()`.

**Root cause 2:** Test searched `/^output format$/i` for the format select's label.
After i18n, `t('formatLabel')` = "Format" (not "Output format") — mismatch.

**Fix applied:** Switched to `renderWithProviders(...)` and updated the regex to
`/^format$/i`.

---

### #27 — `GallerySearch` test used stale placeholder text ✅ FIXED

**File:** `src/components/GallerySearch.test.tsx`

**Root cause:** Placeholder changed from `"Search by prompt..."` to `t('searchPh')`
= `"Search prompts…"`. The test still searched for `/search by prompt/i`.

**Fix applied:** Updated regex to `/search prompts/i`.

---

### #28 — `SimilarPrompts` empty-state test used fragile `toBeEmptyDOMElement()` ✅ FIXED

**File:** `src/components/SimilarPrompts.test.tsx`

**Root cause:** `renderWithProviders` always renders `ToastProvider`, which outputs a
viewport `<div>` even when there are no toasts. The test asserted
`expect(container).toBeEmptyDOMElement()` — false because of the Toast viewport div.
(Was always fragile; only newly visible after `LangProvider` fix exposed the test.)

**Fix applied:** Replaced with `expect(screen.queryByRole('button')).not.toBeInTheDocument()`
and `expect(screen.queryByText(/similar past prompts/i)).not.toBeInTheDocument()` —
checks that the `SimilarPrompts` component rendered nothing meaningful.

---

## 📋 Recommended Fix Order

1. **Fix #1 immediately** — restores the entire UI in 30 seconds
2. **Fix #2, #3, #4** — unblocks `npm run build` and CI
3. **Fix #5, #6** — quietly fixes test isolation and FK enforcement
4. **Fix #11** — improves first-time `docker compose up` experience
5. **Fix #8, #9** — required if you ever enable S3 / want a real PWA install
6. **Fix #7** — produce the icons whenever you next polish the brand
7. **Everything else** — backlog, prioritise as needed

---

## 🧪 How to verify each fix

After applying #1–#4:
```bash
cd frontend
npm run typecheck     # should pass
npm run build         # should pass
npm run test          # all tests should pass
npm run dev           # open http://localhost:5173 — UI should look styled
```

After applying #5–#6:
```bash
cd backend
pytest -v             # all tests should still pass, including parallel runs
```

After applying #11:
```bash
# At repo root, with .env created
docker compose up --build
# Should bring up both containers without erroring on missing env vars
```
