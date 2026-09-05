# Garuda — AI Interviewer

Garuda is a private, resume-aware mock interviewer built for realistic spoken
practice. Upload a resume, choose Software Engineer, Product Manager, or Data
Scientist, and complete an adaptive interview with local coaching and a scored
report.

The MVP is a mobile-first web application and installable PWA with candidate
and placement/L&D entry plus a provisioned super-admin role. It requires no API
key or backend.

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
- Device-local session history, score trends, and dimension comparisons
- Candidate and placement/L&D persona entry
- Cohort dashboard with completion, readiness, trends, and attention flags
- Central RBAC capability map and super-admin account/role console
- Candidate-first public home with concrete interview and privacy data points
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
follow-ups, delivery analytics, scoring, report generation, and private session
summary persistence.

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
                              │
                              ▼
                  Device-local progress summary
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

- Resume text and transcripts stay in page memory.
- Completed score summaries persist in this browser so users can track progress.
  They contain role, scores, strengths, and improvement prompts—not resume text
  or answer transcripts—and can be deleted from the Progress screen.
- There is no application backend, telemetry SDK, account, or persistent DB.
- The MVP persona login is a local browser identity, not production
  authentication. Cross-device institutional access requires verified,
  role-based authentication and shared storage.
- Super-admin demo actions persist locally. A production implementation must
  enforce role and account-status checks on the server and audit every change.
- Super Admin is intentionally absent from public login. Privileged identities
  must be assigned by a trusted identity provider or backend.
- Refreshing or closing the tab clears the active interview.
- Speech recognition support depends on the browser and may use its speech
  service. Typing and speech synthesis remain available without recognition.
- Scores are practice guidance and must not be used as hiring decisions.

## MVP boundaries

Not included by design: production authentication, account-based or cross-device
history, video or body-language analysis, multilingual interviews, and roles
beyond SWE / PM / DS.

## Deployment

Deploy as a standard Next.js application. HTTPS is required for microphone
permissions and PWA installation.

```bash
npx vercel
```

No environment variables are required.
