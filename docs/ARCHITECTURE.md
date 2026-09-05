# Garuda architecture

Garuda is a local-first mock interviewer. The MVP is a responsive Next.js
Progressive Web App; the production mobile target reuses the same domain model
with native speech and a quantized small language model.

## Runtime architecture

```text
┌──────────────────────── Mobile-first PWA ────────────────────────┐
│                                                                  │
│  Candidate view         Interview session        Feedback         │
│  Resume intake ───────▶ Orchestrator ─────────▶ Scoring          │
│  PDF / DOCX / TXT       question + answer        Delivery metrics │
│          │                    │                         │          │
│          ▼                    ▼                         ▼          │
│  Candidate context      Inference adapter         Printable report │
│  skills / roles         ├─ Browser Prompt API                      │
│                         └─ Deterministic fallback                   │
│                                  │                                 │
│                         Speech adapter                             │
│                         TTS + STT + text fallback                  │
│                                                                  │
│  Admin view ◀──── local score summaries ──── Cohort readiness    │
└──────────────────────────────────────────────────────────────────┘
```

There is no application server in the MVP. Static assets are hosted, but resume
text, transcripts, and audio-derived metrics stay in page memory. Completed
score summaries and the selected demo persona are stored in browser localStorage.
A service worker caches the shell for repeat/offline use.

## Domain modules

- `resume/parser.ts` parses PDF, DOCX, and TXT and extracts a compact candidate
  profile. Parsing runs in the browser.
- `interview/engine.ts` owns role packs, resume-aware opening questions, and the
  adaptive follow-up state machine.
- `interview/local-model.ts` calls the browser Prompt API when an on-device model
  is available. The deterministic engine is the required fallback.
- `interview/analytics.ts` calculates pace, filler words, pauses, specificity,
  answer structure, and explainable competency scores.
- `speech/use-speech.ts` wraps Web Speech recognition and synthesis. Text entry
  remains a first-class path on unsupported browsers.
- React state owns the interview session. Refreshing intentionally clears it.
- `local-identity.ts` stores the selected candidate/admin demo identity.
- `session-history.ts` stores transcript-free score summaries for candidate
  trends and the local admin cohort view.

## Interview sequence

```text
Setup
  │ parse resume + choose role
  ▼
Opening question (resume evidence)
  │ answer / transcript
  ▼
Local analysis
  ├─ vague / no example ──▶ probing follow-up (maximum two per session)
  ├─ no measurable result ▶ impact follow-up
  └─ sufficient evidence ─▶ next competency
  ▼
Final report
```

## Local model strategy

The web MVP first checks Chrome's `LanguageModel` / Prompt API. When available,
it uses the browser-managed on-device model only to rewrite a tightly constrained
follow-up; no resume or transcript is sent to a remote API. If unavailable,
Garuda uses role-specific templates and answer-signal rules. The whole interview
therefore works offline after the shell is cached.

For a native mobile build, the inference adapter is replaced with a quantized
1–2B instruction model (for example Qwen2.5-1.5B-Instruct Q4) through
`llama.cpp`/MLC. The orchestrator, prompts, fallback logic, and score model remain
portable TypeScript.

## Privacy and security boundaries

- No production accounts, analytics SDK, database, or server-side resume endpoint.
- The persona entry is a local demo identity and is not an authorization boundary.
- A production team rollout requires verified role-based authentication, tenant
  isolation, consent, retention controls, and shared encrypted storage.
- Files are read with browser APIs and discarded when the tab closes.
- Speech recognition availability varies by browser; Garuda states when the
  browser may provide recognition rather than claiming all STT is offline.
- Speech synthesis and typed answers work without an AI model.
- Generated scores are coaching signals, not hiring decisions.

## Deployment

The app is a standard Next.js static-capable frontend. Vercel is the primary web
target. The same build can run on any Node host; `npm run build && npm start`
serves production locally. HTTPS is required in deployment for microphone and
PWA installation.
