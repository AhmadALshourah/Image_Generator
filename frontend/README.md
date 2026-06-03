# Frontend — AI Image Generator UI

React 18 + **TypeScript** + Vite + Tailwind CSS + TanStack Query frontend that talks to the FastAPI backend.

## Setup

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Then open http://localhost:5173.

The dev server proxies `/api/*` to `http://localhost:8000` (configured in `vite.config.js`),
so the backend must be running there during development.

## Build

```bash
npm run build       # type-checks + outputs to dist/
npm run typecheck   # type-check only
npm run preview     # preview the production build locally
```

## Tests

```bash
npm test                  # vitest, one shot
npm run test:watch        # vitest in watch mode
npm run test:coverage     # vitest + V8 coverage report (HTML in coverage/)
```

Vitest runs in `jsdom` with `@testing-library/react`. The
`src/test/test-utils.tsx` helper renders components inside fresh `QueryClient`
+ `MemoryRouter` + `ToastProvider` wrappers, so any UI under test has the
full app context available without coupling to global state.

## Auto-generated API types (optional)

The committed `src/types/api.ts` is hand-written and mirrors the Pydantic schemas
in `backend/app/schemas.py`. To regenerate from the live OpenAPI spec instead,
start the backend on port 8000 and run:

```bash
npm run generate-types
```

This produces `src/types/openapi.ts` via `openapi-typescript`. Use it as a
source-of-truth check or wire it into the client.

## Structure

```
src/
├── App.tsx                    # router + theme + toast provider
├── main.tsx                   # QueryClientProvider + ReactQueryDevtools
├── index.css                  # Tailwind directives + custom utility classes
├── vite-env.d.ts              # Vite client type augmentations
├── types/api.ts               # all DTOs mirrored from backend schemas
├── api/
│   ├── client.ts              # axios instance + typed request fns
│   ├── queries.ts             # useQuery / useMutation hooks + queryKeys
│   ├── queryClient.ts         # shared QueryClient defaults
│   └── streamClient.ts        # fetch + ReadableStream SSE parser
├── context/ToastContext.tsx   # toast provider + useToast()
├── hooks/
│   ├── useTheme.ts            # dark/light mode
│   ├── useDebouncedValue.ts   # generic debounced state
│   └── useStreamGenerate.ts   # streaming generation state machine
├── utils/download.ts          # blob-based download + share URL helpers
├── pages/
│   ├── HomePage.tsx
│   └── GalleryPage.tsx
└── components/                # 15 typed components
    ├── Header.tsx
    ├── PromptForm.tsx
    ├── AdvancedOptions.tsx
    ├── ImageDisplay.tsx
    ├── ImageCard.tsx
    ├── ImageModal.tsx
    ├── Pagination.tsx
    ├── GallerySearch.tsx
    ├── ActionButton.tsx
    ├── DownloadButton.tsx
    ├── ShareButton.tsx
    ├── DeleteButton.tsx
    ├── EnhancePromptButton.tsx
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── ThemeToggle.tsx
```
