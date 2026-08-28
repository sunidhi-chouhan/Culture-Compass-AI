# CultureCompass AI

**CultureCompass AI** is a GenAI-powered travel platform for **Destination Discovery & Cultural Experiences**. It helps travelers discover destinations, uncover hidden gems, explore heritage, find local events, and connect with authentic cultural experiences.

Built for the **Google Build with AI / PromptWars** hackathon.

**Live demo:** Deploy on Vercel with Root Directory `apps/web` and set `GEMINI_API_KEY`.

---

## For judges — quick demo flow

1. Open the **landing page** — immersive hero with example destinations (Jaipur, Kyoto, Bali, Rome, Kerala)
2. Click **Start Exploring** or search a destination → conversational planner at `/plan`
3. Answer one question at a time: destination → interests → companions → budget → duration
4. Click **Generate Journey** — Gemini builds a full cultural plan
5. Explore the **Journey Dashboard**: hero stats, **Story Mode** (parchment narrative + Play/Pause speech), **Local Lens** toggle (Tourist vs Local View), and nine insight cards
6. Toggle **Local View** — recommendations refresh from a local resident's perspective
7. Tap **Play Story** — browser speech synthesis reads the narrative with live word highlighting
8. Toggle **dark/light theme** in the header

### Problem statement alignment

| Requirement | Implementation |
|-------------|----------------|
| Recommend attractions | Tourist View in Local Lens + Heritage & Attractions cards |
| Uncover hidden gems | Local View surfaces hidden cafes, markets, street food, workshops |
| Immersive storytelling | **Story Mode** — Gemini narrative on parchment card with TTS playback |
| Promote heritage | Heritage card + traditions, etiquette, cultural significance |
| Suggest local events | Events card + community festivals in Local View |
| Authentic experiences | Experiences card + artisan workshops, local rituals |
| GenAI-powered | All content generated server-side via Google Gemini |

### AI evaluation criteria

| Criterion | How we address it |
|-----------|---------------------|
| **Code quality** | Turborepo monorepo, strict TypeScript, layered packages (`shared` / `ai` / `web` / `ui`), consistent API error handling, ESLint + CI |
| **Problem alignment** | Every feature maps to the hackathon brief; README demo flow matches the live app |
| **Accessibility** | Semantic HTML, skip link, ARIA tabs/toggles/live regions, keyboard controls, `prefers-reduced-motion` |
| **Testability** | **55+ unit tests** (Node.js test runner) across schemas, prompts, API utils, sanitization, rate limits, helpers; CI on every push |
| **Efficiency** | Single composite `/api/compass/plan` call, Gemini JSON mode, client singleton, 55s timeout, bounded inputs |
| **Security** | Server-only API key, Zod input limits, prompt sanitization + XML wrapping, rate limiting, security headers |

---

## Features

### Conversational planner (`/plan`)
Chat-style flow — one question at a time, then **Generate Journey**.

### Journey Dashboard
- Hero image with destination stats (weather, season, cultural rating, AI match)
- **Story Mode** — immersive second-person narrative in a parchment card; Play/Pause via Web Speech API with word highlighting
- **Local Lens** — Tourist View (famous attractions) vs Local View (hidden gems, markets, street food, neighborhood temples, artisan workshops, community festivals); Gemini prompt adapts automatically
- Nine staggered insight cards with detail sheets

### Landing page (`/`)
Full-viewport hero, animated globe, floating cultural icons, destination search, feature cards.

### AI model selection

| Option | Model | When to use |
|--------|-------|-------------|
| Fast | `gemini-2.0-flash` | Quick demos |
| **Balanced** | **`gemini-2.5-flash`** | **Recommended** |
| Quality | `gemini-1.5-pro` | Richest narratives |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, Tailwind CSS, Framer Motion |
| Backend | Next.js Route Handlers (serverless API) |
| AI | Google Gemini API (`@google/generative-ai`) |
| Validation | Zod (`@culturecompass/shared`) |
| Monorepo | Turborepo + pnpm |
| Deploy | Vercel (single deployment for FE + BE) |

---

## Project structure

```
├── apps/web/              # Next.js app (UI + /api routes)
│   ├── components/
│   │   ├── dashboard/     # Journey dashboard, Local Lens, cards
│   │   ├── planner/       # Conversational planner session
│   │   ├── story/         # Story Mode parchment + TTS
│   │   └── landing/       # Immersive home page
│   ├── hooks/             # use-story-speech
│   └── lib/               # API client, helpers, tests
├── packages/shared/       # Schemas, types, constants
├── packages/ai/           # Gemini client, prompts, services
└── packages/ui/           # Shared UI components
```

---

## Gen AI usage

All AI runs **server-side** via `GEMINI_API_KEY` (never exposed to the browser).

| Feature | API route | Gemini service |
|---------|-----------|----------------|
| Full cultural plan | `POST /api/compass/plan` | `generateCompassPlan()` |
| Immersive story (deep dive) | `POST /api/culture/story` | `generateStory()` |
| Destinations, attractions, gems, heritage, events, experiences | `/api/discover/*`, `/api/culture/*` | Granular services |

The dashboard uses composite `/api/compass/plan` for one fast round-trip. Prompts live in `packages/ai/src/prompts/`. User input is sanitized and wrapped in XML delimiters. Responses are structured JSON validated with Zod. **Local Lens** and **Story Mode** fields are generated in the same call.

---

## Quality, security & accessibility

| Area | Approach |
|------|----------|
| **Code quality** | Monorepo layers, strict TS, ESLint (`next/core-web-vitals`), Prettier, CI pipeline |
| **Testing** | Node.js test runner — schemas, lens constants, compass prompts, API utils, AI sanitization, rate limits, dashboard/story helpers |
| **Security** | Server-only API key, Zod limits, prompt injection filtering, rate limiting on POST `/api/*`, security headers |
| **Accessibility** | Skip link, form labels, ARIA tabs (`Local Lens`), `aria-live` regions (`Story Mode`), `aria-pressed` toggles, reduced-motion |
| **Efficiency** | Single AI call per journey, JSON mode, singleton client, bounded input lengths |

---

## Local setup

```bash
pnpm install
cp .env.example apps/web/.env.local
# Add GEMINI_API_KEY from https://aistudio.google.com/apikey
# Or enable offline demo mode (no API key needed):
# USE_MOCK_AI=true
pnpm dev:web
```

### Demo without Gemini (save API quota)

In `apps/web/.env` or `.env.local`:

```bash
USE_MOCK_AI=true
# GEMINI_API_KEY=   # leave unset or commented out
```

Restart the dev server. **Generate Journey** and **Local Lens** toggles use rich mock data (Jaipur by default) — Story Mode, dashboard cards, and speech playback all work.

### Location search (GeoNames)

Global city/country autocomplete uses a **server-side GeoNames index** (free, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Data is **not** bundled into the browser.

Regenerate the index:

```bash
node scripts/build-locations-index.mjs
```

For a lightweight mock index in tests/dev: `USE_MOCK_LOCATIONS=true` in `apps/web/.env.local`.

See [packages/shared/data/README.md](packages/shared/data/README.md) for attribution.

### Scripts

```bash
pnpm dev:web      # Start development server
pnpm build        # Production build
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm test         # Run all package tests
```

---

## Deployment (Vercel)

- **Root Directory:** `apps/web`
- **Environment variable:** `GEMINI_API_KEY` (required)
- Optional: `GEMINI_MODEL` to override default model

See `DEPLOYMENT.md` for full steps.
