# stanwood.dev

Personal project hub built with Astro, React, and Tailwind CSS. Deployed on Vercel.

## Projects

- **Idea Shuffler** — Browse project ideas without ranking them. Rolodex-style card UI with AI-powered title condensing.
- **Lap Lab** — Swim workout generator. Pick duration, pace, and pool type to get a structured workout.
- **NBA Now** — Live NBA scores ranked by watchability. Retro neon scoreboard aesthetic.
- **TL;DR** — Drop a PDF, get a plain-language summary powered by Claude.
- **WTWTW** — What To Watch This Week. Shows the best game per day for your favorite teams.

## Setup

```sh
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev             # starts dev server at localhost:4321
```

## Commands

| Command           | Action                          |
| :---------------- | :------------------------------ |
| `npm run dev`     | Start local dev server          |
| `npm run build`   | Build for production            |
| `npm run preview` | Preview production build        |
| `npm test`        | Run tests (vitest)              |

## Tech Stack

- [Astro](https://astro.build) v5 — static site generator with server endpoints
- [React](https://react.dev) 19 — interactive components
- [Tailwind CSS](https://tailwindcss.com) v4 — styling
- [Anthropic SDK](https://docs.anthropic.com) — AI-powered features (TL;DR, Idea Shuffler)
- [Vercel](https://vercel.com) — hosting and serverless functions
