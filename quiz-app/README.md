# Quiz Níveis de Pensamento

A mobile-first drag-and-drop quiz built with React. Players assign 21 members of the WhatsApp group "A Nossa Turma" to their correct thinking level on a circular diagram.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm

## Getting Started

1. Install dependencies:

   ```bash
   cd quiz-app
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the URL shown in the terminal (usually `http://localhost:5173`). For the best experience, use your browser's mobile device emulation (~390px width, portrait).

## Available Scripts

| Command             | Description                              |
|---------------------|------------------------------------------|
| `npm run dev`       | Start the Vite dev server with HMR       |
| `npm run build`     | Type-check with TypeScript and build for production |
| `npm run lint`      | Run ESLint                               |
| `npm run preview`   | Serve the production build locally       |

## Production Build

```bash
npm run build
```

Output goes to `dist/`. Deploy this folder to any static hosting provider (e.g. Vercel).

## Tech Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS v4
- dnd-kit (drag-and-drop)
- Web Audio API (synthesized sounds, no audio files)
