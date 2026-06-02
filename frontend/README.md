# Frontend — AI Image Generator UI

React 18 + Vite + Tailwind CSS frontend that talks to the FastAPI backend.

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
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Structure

```
src/
├── api/client.js              # axios instance + helpers
├── components/
│   ├── Header.jsx
│   ├── PromptForm.jsx
│   ├── AdvancedOptions.jsx
│   ├── ImageDisplay.jsx
│   ├── LoadingSpinner.jsx
│   ├── ErrorMessage.jsx
│   └── ThemeToggle.jsx
├── hooks/useTheme.js          # dark/light mode hook
├── App.jsx
├── main.jsx
└── index.css                  # Tailwind directives + custom utility classes
```
