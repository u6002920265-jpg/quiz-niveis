# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-first React quiz app (Portuguese, PT-PT) where users drag-and-drop name pills onto a circular diagram with 5 concentric "thinking level" slices. 21 participants must be placed into the correct level. The app is a fun group game shared via WhatsApp.

## Commands

All commands run from the `quiz-app/` directory:

```bash
cd quiz-app
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test framework is configured.

For local development with the leaderboard server:

```bash
cd server && npm start   # Express leaderboard server on :3001
# Then in quiz-app, set VITE_API_URL=http://localhost:3001 before npm run dev
```

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7** + **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **dnd-kit** for drag-and-drop (touch + mouse sensors)
- **marked** for rendering the report markdown (`public/report.md`) as HTML
- **Web Audio API** for synthesized sound effects (no audio files)
- **Canvas API** for confetti animation (`src/utils/confetti.ts`)
- **@vercel/kv** (Upstash Redis) for production leaderboard persistence
- Deploy target: **Vercel** (static frontend + serverless API function)

## Architecture

### State Management

Single `useReducer` in `src/hooks/useQuizState.ts` — no external state library. This hook owns all quiz state (screen navigation, assignments, locked names, scores, leaderboard) and exposes action callbacks. The reducer is the single source of truth.

Three localStorage keys persist data (`quiz-niveis-state`, `quiz-niveis-prefs`, `quiz-niveis-leaderboard`). All localStorage operations use try/catch wrappers from `src/hooks/useLocalStorage.ts` for Safari private browsing compatibility.

### Screen Flow

`App.tsx` renders one of three screens based on `state.screen`: `WelcomeScreen` → `QuizScreen` → `ReportScreen`. `LandscapeBlocker` renders as an overlay on all screens.

### Drag-and-Drop + Angular Detection

dnd-kit is used only for drag UX (pickup, overlay, pointer tracking). Drop logic is **custom**: `QuizScreen` captures the pointer coordinates from `onDragEnd`, converts them to page-relative position, then calls `getSliceForPoint()` in `src/utils/angleDetection.ts` which uses angular math relative to the circle center to determine which of the 5 pie slices the drop landed in. If a slice is full (at capacity), the drop is rejected.

The circle geometry constants (`CIRCLE_CX`, `CIRCLE_CY`, `CIRCLE_R`, `IMG_W`, `IMG_H`) are defined in `src/data/quizData.ts` and represent pixel coordinates in the original `nivel.png` image space. `QuizScreen` scales these to the rendered image size at runtime.

### Quiz Data & Obfuscation

`src/data/quizData.ts` contains all quiz data: level definitions (angle ranges, capacities, overlay colors, badge positions) and member-to-level mappings. Member names are XOR-encoded at module load with key `'aNossaTurma2024'` to discourage casual inspection via DevTools — this is intentionally basic obfuscation, not security.

### Sound & Haptics

`src/utils/sound.ts` generates all sounds programmatically via Web Audio API oscillators (no audio files). Haptics use `navigator.vibrate()` which silently fails on iOS Safari.

### Leaderboard API

Two backend implementations exist for the leaderboard:

- **Production (Vercel):** `quiz-app/api/leaderboard.js` — Vercel serverless function using `@vercel/kv` (Upstash Redis) with sorted sets for atomic leaderboard operations. Scores are stored in a Redis sorted set (`leaderboard:scores`) with a composite score encoding (score DESC + date ASC). Entry data is stored in Redis hashes (`leaderboard:entry:{id}`). Deployed automatically with the Vercel project. Requires `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars (auto-set by Vercel KV/Upstash integration).
- **Local development:** `server/index.js` — Express.js server on port 3001, reads/writes `server/data/leaderboard.json`.

The frontend API client (`src/utils/api.ts`) uses `VITE_API_URL` env var to determine the base URL. When empty (production on Vercel), API calls go to the same origin (`/api/leaderboard`). For local dev with the Express server, set `VITE_API_URL=http://localhost:3001`.

Both endpoints support GET (top 50 sorted by score desc, then date asc) and POST (with validation for name, score, correct, total, date fields). POST accepts an optional `submissionId` for client-side duplicate prevention. The frontend tracks submission status (`pending`/`success`/`error`) and exposes a retry mechanism in `ReportScreen`.

### Verification & Report Flow

Auto-verify triggers when all 21 names are assigned. Score ≥90% unlocks the detailed report (`ReportModal`), which fetches `/report.md` and renders it via `marked`. Perfect score (100%) triggers a canvas confetti animation. Scoring logic is in `src/utils/scoring.ts`.

### Styling

Tailwind CSS v4 with custom `@theme` colors defined in `src/index.css` (dark brown background `#1a1008`, gold accent `#d4a34a`). Custom keyframe animations (pulse-green, fly-back, fade-in, slide-up, glow) are also in `index.css`. No `tailwind.config.js` — everything is configured inline.

### Key Design Constraints

- Locked to ~390px width (mobile-only, portrait forced via `LandscapeBlocker`)
- Touch sensor has 150ms delay to disambiguate drag vs scroll
- Each level slice has a max capacity enforced by the reducer
- `nivel.png` is used as background image; overlay divs with `backdrop-filter: blur()` hide the answer text
- All UI text is in Portuguese (PT-PT)

## Reference Docs

- `SPEC.md` — Full product specification (in Portuguese) with level definitions, screen layouts, and scoring rules
- `TEAM-REVIEW.md` — Team review notes and architectural decisions
