# JourneyMind

**JourneyMind** helps travellers turn fragmented trip context (preferences, rough plans, cultural intent) into a journey they can **explore, improve, and prepare for**.

Built for the **micro1 Agentic Workflows** hackathon on the CultureCompass Next.js monorepo.

**Story:** Cultural journey → day-wise itinerary → TripMate (analyze → propose → verify → apply) → journey-aware packing → multi-journey library.

**Live demo:** Vercel Root Directory `apps/web` + `GEMINI_API_KEY` (or `USE_MOCK_AI=true` for offline). See [DEPLOYMENT.md](DEPLOYMENT.md) Phase 9 smoke checklist.

**Demo video:** Record from [docs/video-script.md](docs/video-script.md) (≤5 min) — paste public URL in the script’s `VIDEO_URL=` field after upload.

---

## For judges — quick demo flow

1. **Discover** (`/`) — problem-led hero; **Start Exploring** (always fresh) or **Improve my plan** / **My journeys**
2. **Create → Review** — destination → interests → companions → budget → duration → Review
3. **Generate** — purposeful progress → Explore workspace
4. **Explore** — **day-wise itinerary first**; cultural insight secondary; Local Lens + Story Mode
5. **Improve** — TripMate Analyze → Apply a finding → watch the day timeline change
6. **Prepare** — Pack for this trip (reasons cite itinerary / climate / duration)
7. **Library** — Save → `/journeys` → Open / Delete / Clear all

Evidence package:

| Deliverable | Link |
|---|---|
| Improvement changelog | [docs/improvement-changelog.md](docs/improvement-changelog.md) |
| Reproduction guide | [docs/reproduction-guide.md](docs/reproduction-guide.md) |
| Schedule Quality Score table | [docs/eval/schedule-quality-results.md](docs/eval/schedule-quality-results.md) |
| Agent trajectories | [docs/agent-trajectories.md](docs/agent-trajectories.md) |
| Hot take | [docs/hot-take.md](docs/hot-take.md) |
| Video script (≤5 min) | [docs/video-script.md](docs/video-script.md) |
| Deploy | [DEPLOYMENT.md](DEPLOYMENT.md) |

Reproduce eval: `cd apps/web && pnpm eval:schedule`

---

### Problem statement alignment

| Brief need | JourneyMind |
|---|---|
| Recommend attractions | Explore cards + Local Lens (Tourist) |
| Hidden gems | Local Lens (Local) |
| Immersive storytelling | Story Mode + TTS |
| Heritage | Heritage card + etiquette / traditions |
| Local events | Events card + festival packing cues |
| Authentic experiences | Experiences card + itinerary culture stops |
| **Agentic improvement** | **TripMate** on a real day-wise schedule |
| **Measured improvement** | **Schedule Quality Score** E01–E10 baseline vs +TripMate |
| Prepare the traveller | Journey-aware packing (reasons, quantities, itinerary block) |

### AI evaluation criteria (micro1 / tooling)

| Criterion | How we address it |
|---|---|
| **Code quality** | Turborepo (`shared` / `ai` / `web` / `ui`), strict TypeScript, Zod boundaries, extracted helpers (e.g. packing merge, security headers) |
| **Security** | Server-only `GEMINI_API_KEY`, Zod limits, prompt sanitize + XML wrap, POST `/api/*` rate limit, site-wide security headers (`X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy) |
| **Efficiency** | Composite `/api/compass/plan`, Gemini JSON mode, singleton client, bounded inputs, mock path for demos without burning quota |
| **Testing** | Broad Node test suite: schemas, sanitize, rate limit, TripMate apply, packing context/merge/session, SQS eval runner, library CRUD, security headers |
| **Accessibility** | Skip link, labels, ARIA live regions (TripMate / packing progress), day nav, keyboard-friendly packing “why” disclosure, `prefers-reduced-motion` |
| **Problem alignment** | Demo + docs follow Discover→Prepare; agent evidence + SQS Δ; changelog shows kept/revised/cut experiments |

---

## Features

### Conversational planner (`/plan`)
Create → Review → Build — companion tone; Start Exploring never auto-restores.

### Explore workspace
- Day-wise itinerary (primary) with loading / error / retry  
- TripMate Improve (non-blocking)  
- Journey-aware packing (Prepare)  
- Save to My journeys  
- Cultural insight, Local Lens, Story Mode  

### My journeys (`/journeys`)
Multi-save on-device: Open, Continue latest, delete one, clear all (theme untouched).

### AI model selection

| Option | Model | When |
|---|---|---|
| Fast | `gemini-2.0-flash` | Demos / Vercel Hobby |
| Balanced | `gemini-2.5-flash` | Recommended when available |
| Quality | `gemini-1.5-pro` | Richer narratives |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, Tailwind, Framer Motion |
| Backend | Next.js Route Handlers |
| AI | Google Gemini (`@culturecompass/ai`) |
| Validation | Zod (`@culturecompass/shared`) |
| Monorepo | Turborepo + pnpm |
| Deploy | Vercel (`apps/web`) |

---

## Project structure

```
├── apps/web/           # UI + /api routes
├── packages/shared/    # Schemas, types, locations
├── packages/ai/        # Gemini client + prompts
├── packages/ui/        # Shared UI
└── docs/               # Changelog, reproduction, eval, hot take, video, trajectories
```

---

## Local setup

```bash
pnpm install
cp .env.example apps/web/.env.local
# Mock: USE_MOCK_AI=true
# Live: GEMINI_API_KEY=... (do not set USE_MOCK_AI)
pnpm dev:web
```

```bash
pnpm test
pnpm typecheck
cd apps/web && pnpm eval:schedule
```

See [docs/reproduction-guide.md](docs/reproduction-guide.md) for the full judge path.
