# Garuda — AI Interviewer

Garuda is a private, resume-aware mock interviewer built for realistic spoken
practice. Upload a resume, choose Software Engineer, Product Manager, or Data
Scientist, and complete an adaptive interview with local coaching and a scored
report.

The MVP is a mobile-first web application and installable PWA. It requires no
account, database, API key, or backend.

## What works

- PDF, DOCX, and TXT resume parsing in the browser
- Resume-aware opening question
- SWE, PM, and Data Scientist question packs
- Adaptive probes for vague answers, unclear ownership, and missing outcomes
- Browser text-to-speech and speech-to-text where supported
- Editable typed-answer fallback in every browser
- Pace, filler-word, pause, clarity, and structure analysis
- Explainable final score with strengths and next-practice actions
- Printable and downloadable PDF report
- Browser Prompt API adapter for on-device generation
- Required deterministic fallback when the local model is unavailable
- PWA manifest and offline shell cache

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317).

Production:

```bash
npm run build
npm start
```

## Quality checks

```bash
npm run lint
npm test
npm run build
# or all three:
npm run check
```

Tests cover resume extraction, role-specific question generation, adaptive
follow-ups, delivery analytics, scoring, and report generation.

## Architecture

```text
Resume (PDF/DOCX/TXT)
        │ local parse
        ▼
Candidate context ───▶ Interview orchestrator ◀── Role pack
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
          Browser on-device AI   Deterministic fallback
                    │                    │
                    └─────────┬──────────┘
                              ▼
                   Voice / typed Q&A loop
                              │
                              ▼
                 Local analytics + score report
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries, privacy
decisions, the adaptive interview state machine, and the native mobile SLM path.

### On-device AI

The web app uses Chrome's `LanguageModel` / Prompt API when the browser has an
on-device model. The feature is an enhancement, not a dependency. A deterministic
local engine handles every required flow when the API is missing or fails.

The planned native mobile adapter uses a quantized 1–2B instruction model (for
example Qwen2.5-1.5B-Instruct Q4) with `llama.cpp` or MLC. The interview
orchestrator and scoring modules remain shared.

## Privacy

- Resume text, transcripts, and scores stay in page memory.
- There is no application backend, telemetry SDK, account, or persistent DB.
- Refreshing or closing the tab clears the session.
- Speech recognition support depends on the browser and may use its speech
  service. Typing and speech synthesis remain available without recognition.
- Scores are practice guidance and must not be used as hiring decisions.

## MVP boundaries

Not included by design: accounts, persistent practice history, video or
body-language analysis, multilingual interviews, and roles beyond SWE / PM / DS.

## Deployment

Deploy as a standard Next.js application. HTTPS is required for microphone
permissions and PWA installation.

```bash
npx vercel
```

No environment variables are required.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
