# Vercel Deployment Guide — JourneyMind

This project deploys as a **single Vercel project** (frontend + API routes).

## Prerequisites

- GitHub repository with this code pushed
- [Vercel account](https://vercel.com)
- [Gemini API key](https://aistudio.google.com/apikey)

## Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: JourneyMind agentic companion"
git push origin main
```

## Step 2: Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | (auto from `vercel.json`) `cd ../.. && pnpm turbo build --filter=@culturecompass/web` |
| **Install Command** | (auto from `vercel.json`) `cd ../.. && pnpm install` |
| **Output Directory** | `.next` (default) |

## Step 3: Environment Variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Value | Environments |
|------|-------|--------------|
| `GEMINI_API_KEY` | Your Google AI Studio API key | Production, Preview, Development |
| `GEMINI_MODEL` | `gemini-2.5-flash` (optional override) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_NAME` | `JourneyMind` | Production, Preview, Development |

**Important:** Never add `GEMINI_API_KEY` as a `NEXT_PUBLIC_*` variable.  
**Do not** set `USE_MOCK_AI=true` on Production if you want live Gemini.

## Step 4: Deploy

Click **Deploy**. Vercel will install from the monorepo root via pnpm and build `@culturecompass/web`.

## Step 5: Verify Production

```bash
curl https://YOUR_APP.vercel.app/api/health
```

### Phase 9 smoke checklist (desktop + one mobile width)

| # | Check | Pass? |
|---|---|---|
| 1 | Start Exploring opens fresh Create (no silent restore of old plan) | ☐ |
| 2 | Create → Review → Build → Explore shows day-wise itinerary | ☐ |
| 3 | TripMate Analyze → Apply updates a day; culture section still visible | ☐ |
| 4 | Kill network / bad key: TripMate fails soft; Explore days remain | ☐ |
| 5 | Prepare packing lists with reasons; tick items; refresh keeps ticks | ☐ |
| 6 | Save → My journeys → Open restores Explore + packing | ☐ |
| 7 | Delete one journey; Clear all empties library | ☐ |
| 8 | Stage rail / companion jumps (Explore · Improve · Prepare) work | ☐ |
| 9 | `prefers-reduced-motion: reduce` — no jarring motion | ☐ |

Full judge path: [docs/reproduction-guide.md](docs/reproduction-guide.md).

### Demo tip

Prefer live Gemini on Production (`GEMINI_API_KEY` set, **no** `USE_MOCK_AI`). Keep a mock-local fallback for recording if the key is cold.

## Troubleshooting

### Build fails: "Cannot find module @culturecompass/*"

Ensure Root Directory is `apps/web` and install runs from monorepo root (`cd ../.. && pnpm install`).

### API returns 502 "Missing GEMINI_API_KEY"

Add `GEMINI_API_KEY` in Vercel and redeploy.

### `/api/itinerary` or `/api/tripmate` returns 502

These routes use **`gemini-2.5-flash`** (same as compass). Only `GEMINI_API_KEY` is required.

If Gemini still fails, the routes fall back to deterministic mock results so Explore / TripMate stay usable for demos.

If it still 502s: check Function logs for validation errors before the AI call.

### `/api/compass/plan` times out

Vercel Hobby ~10s timeout. Use `gemini-2.0-flash`, upgrade to Pro, or use mock for demos.

### pnpm not found

Root `package.json` specifies `"packageManager": "pnpm@9.15.0"`. If needed: `cd ../.. && corepack enable && pnpm install`.

## Local Production Preview

```bash
pnpm build
cd apps/web && pnpm start
```

Set `apps/web/.env.local` with `GEMINI_API_KEY` before testing AI routes locally.
