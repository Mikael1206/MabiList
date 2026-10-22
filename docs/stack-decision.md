# Stack Decision — MabiList

**Version:** 0.2 · **Status:** ADR-008 amended by ADR-014 — AI provider and backend hosting pending

> **Agent instructions:** "Best stack" is relative to the team and the deadline, not an
> absolute ranking of technologies. Pull the team's actual skills from `seed/context.md §5`
> and the time budget from `seed/context.md §5` before scoring anything. A stack the team has
> never touched should score low on "team fluency" even if it's objectively powerful — a
> hackathon is not the time to learn a new framework unless the time budget genuinely allows
> it. Weight the criteria with the founder, don't assume the weights.

*Written 2026-10-07. Skills and weights from the founder (same day); free-tier facts from
`docs/feasibility.md` §3–§4, which cites the vendor pages.*

## 1. Requirements driving the choice

*Pull straight from `prd.md` — don't re-derive.*

- Core features that need to work: F-001 screenshot/paste → entry (core), F-002 confirm/edit,
  F-003 live logbook, F-004 totals and statistics, F-005 follow changes, F-007 owner sign-in,
  then F-006 business-account connection by webhook — Messenger Page, Instagram professional,
  Telegram bot (`prd.md` §8, ADR-012). F-006 needs a public HTTPS URL for webhooks, server-only
  storage for platform tokens, and live updates to the open logbook.
- Non-functional constraints (`prd.md` §6): free tiers at ₱0, with a daily upload cap per owner
  if quotas are tight; phone browser first; AI output checked against the BR-002 fields before
  saving; no secrets in client code; per-owner data isolation (INV-AS-001); raw uploads deleted
  on confirm or discard, or after 7 days (INV-001); draft within 30 seconds `[proposed]`; upload
  retry without re-picking files (INV-013); Asia/Manila dates; WCAG AA.
- Data posture (`feasibility.md` §7): synthetic chats only for the build and demo; Gemini's free
  tier never receives real customer chats (ADR-008).
- Sponsor/event-mandated tech: none. The entry must be ICT-enabled, and AI and SaaS both qualify
  (`seed/context.md` §1, §5).
- Time budget: the MVP is built after the 2026-10-11 application. Prototype time budget
  `unknown` until PSC announces the later dates; hours per day per member `unknown`
  (`seed/context.md` §2, §4).
- Team's existing fluency (`seed/context.md` §4): Yancy (frontend) has built in React,
  Next.js, Tailwind CSS, Vue, and React Native + NativeWind. Tyrone (backend) has built in
  JavaScript/TypeScript, Node.js, SQL, Supabase, Python, and Java. Mikael designs in Figma and
  Canva and doesn't code on this project.
- Crawler / RAG / orchestration / graph (`core-architectural-engine-skills.md` §5): **none
  needed.** No crawling (scraping chats was rejected, `decision-ledger.md` §4); no document
  search; one AI call per upload or connected-account conversation, not a multi-agent setup; no
  graph. Way 1 uses the platforms' official webhooks, which is not crawling. The AI returns data, never
  code, so the sandboxing rule doesn't apply (ADR-006).

## 2. Candidate stacks

*List 2-4 realistic options — not every technology that exists. Each should be a coherent
stack (frontend + backend + data + hosting), not a single library choice.*

**The AI service is a separate choice from these stacks.** Each stack calls it from server-side
code behind one replaceable function. The spike in `feasibility.md` §3 picks between Gemini
(free tier, synthetic chats only) and Cloudflare Workers AI's Llama 3.2 11B Vision (free daily
allocation; doesn't train on inputs).

### Option A: Next.js + Supabase
- **Frontend:** Next.js (React) with Tailwind CSS, used in the phone browser.
- **Backend / API:** Next.js server-side routes for the AI call and for validating its output;
  everything else through Supabase with row-level security per owner.
- **Data store:** Supabase Postgres for entries; Supabase Storage for uploads until they're
  deleted (INV-001).
- **Hosting / deploy:** Vercel Hobby, free and non-commercial only (ADR-009, `sdd.md`).
- **Auth:** Supabase Auth.
- **Why it's a candidate:** both developers already know their half (Yancy: Next.js, React,
  Tailwind; Tyrone: Node.js, SQL, Supabase). Supabase covers sign-in, database, file storage, and
  scheduled jobs in one service (F-007, INV-001), plus live updates (Realtime), which F-006
  drafts need (ADR-012). Vercel gives the public HTTPS URL that Meta and Telegram webhooks call.
  It's also the stack the team's explainer suggested (`prd.md` §7).

### Option B: Vue + Python API + Supabase database
- **Frontend:** Vue (Vite) app in the phone browser.
- **Backend / API:** Python web API (for example FastAPI) for the AI call, validation, and
  business rules.
- **Data store:** Supabase Postgres and Storage.
- **Hosting / deploy:** two deployments — frontend and Python API — each on a free tier.
- **Auth:** Supabase Auth, with the Python API checking each request's sign-in token.
- **Why it's a candidate:** both developers know their half (Yancy: Vue; Tyrone: Python). Python
  has the widest choice of AI libraries if the extraction step grows.

### Option C: React Native app + Supabase
- **Frontend:** React Native with NativeWind (Expo), installed on the phone.
- **Backend / API:** Supabase Edge Functions (TypeScript) for the AI call and validation.
- **Data store:** Supabase Postgres and Storage.
- **Hosting / deploy:** the app is installed on test phones; functions run on Supabase.
- **Auth:** Supabase Auth.
- **Why it's a candidate:** Yancy knows React Native + NativeWind, and a native app can take
  screenshots straight from the phone's share menu. But it pulls the later Android app (F-104)
  into the MVP.

## 3. Weighted decision matrix

*Weights should sum to 100 and reflect what actually matters for THIS submission, not a
generic checklist. Score each option 1-5 per criterion.*

Weights chosen by the founder on 2026-10-07 ("fluency first"). Weighted total = Σ(weight ×
score) ÷ 5, so 100 is the maximum.

| Criterion | Weight | Option A | Option B | Option C |
|---|---|---|---|---|
| Team fluency (can we move fast in this, today) | 30 | 5 | 4 | 4 |
| Speed to a demoable slice | 20 | 5 | 3 | 3 |
| Fit to core features (does it make F-001/F-002 easy, not fight you) | 15 | 4 | 4 | 4 |
| Free-tier / cost feasibility | 15 | 4 | 3 | 3 |
| Reliability for a live demo (fewer moving parts to fail on stage) | 15 | 4 | 3 | 3 |
| Extensibility (if this continues past the hackathon) | 5 | 4 | 4 | 4 |
| Sponsor/event tech alignment (if relevant — some events score bonus points for using sponsor tech) | 0 | — | — | — |
| **Weighted total** | 100 | **90** | **70** | **70** |

Why the scores differ:
- **Fluency:** in A, each developer works in skills they listed (Next.js and React for Yancy;
  Node.js, SQL, and Supabase for Tyrone), sharing one language, JavaScript. B splits the code into
  Vue and Python, so neither developer can easily work on the other half. C runs its server code
  as Supabase Edge Functions, which nobody listed.
- **Speed:** A is one codebase, with sign-in, database, and live updates coming from Supabase. B
  adds a second service and sign-in checks between the two. C adds a mobile build and testing on
  real devices.
- **Feature fit:** all three handle uploads, the AI call, and live updates. C's share menu suits
  F-001 best, and B's Python suits the AI step best; A is equal overall.
- **Free tier:** A uses one hosted backend (Supabase) plus a web host. B needs a second free
  host for the Python API. C needs app builds and installs on testers' phones; iPhone
  distribution normally requires a paid Apple developer account `[verify]`.
- **Demo reliability:** A has two services that can fail, while B has three. With C, judges and
  testers must install an app, and a device has to be on hand.

## 4. Decision

**Original choice:** Option A — Next.js + Supabase (ADR-008). **Structure amendment:** ADR-014
places the Next.js frontend in `web/` and an independently runnable Node.js server in
`backend/`. Supabase remains the planned auth, database, and storage service. There is no
`shared/` package. The option scores above were calculated for the original single-deployment
design and have not been rescored for the separate backend.
Product-data reads and writes now go through backend HTTP routes; the frontend may still use
Supabase Auth for sign-in. The frontend's local types are checked against the HTTP contract,
not against database table types.

**Original ADR-008 rationale (historical):** Each developer builds in what they
already know, in one codebase. Supabase gives sign-in, per-owner data rules, file storage, and
live updates without writing a separate backend. That leaves time for the part that's actually
uncertain: getting the AI to read Taglish chat screenshots accurately (A-003). Sellers open it in
the phone browser, so nobody installs anything to test it.

ADR-014 changes the deployment tradeoff: the frontend and backend now have separate source and
run commands. The backend host, same-origin `/api` routing, and auth credential transport must
be chosen and verified before live integration. Until then, `web/` keeps its mock adapter and
the API behavior is specified in `sdd.md` §2.

**What we're explicitly giving up by not choosing the alternatives:** taking screenshots
straight from the phone's share menu, which a native app (C) does best. Sellers will pick
screenshots from their gallery instead, and the Android app stays later (F-104). Also Python's
AI libraries (B), which the MVP's single AI call doesn't need.

## 5. Known risks of this choice

| Risk | Mitigation |
|---|---|
| The best AI on accuracy (likely Gemini) can't see real chats on its free tier (ADR-008) | Spike both providers on synthetic chats; if Gemini wins, the real-chat pilot uses Workers AI if it passes the 70% / 80% lines, or waits for a logged decision on paid use |
| Free AI quotas: Gemini about 20 requests a day on Flash, about 500 on Flash-Lite (unpublished, can change); Workers AI 10,000 neurons a day, with images-per-day `unknown` | Measure tokens per image in the spike; resize images before upload (`prd.md` §6); set the per-owner daily upload cap from the measured numbers |
| Supabase's free project pauses after a week without activity | Use the project in the days before the demo; check it on the demo morning |
| The AI call takes longer than the host allows a server function to run (Vercel Hobby: 300 seconds) | Measure in the spike; make the extraction a background job with a visible pending state (INV-008, INV-013) if needed |
| A missing per-owner database rule leaks one seller's orders to another | Row-level security on every table; a negative test with two test accounts (`qa-test-plan.md`, INV-AS-001) |
| The AI key leaks into browser code | Call the AI only from server-side code; never use a `NEXT_PUBLIC_` variable for it (INV-AS-002) |
| Automatic 7-day deletion needs a scheduler | Hourly Supabase Cron job (ADR-009, `sdd.md`); test that it runs (INV-001) |
| Public webhook URLs accept forged requests | Check Meta's `X-Hub-Signature-256` and Telegram's secret-token header before storing anything; negative tests (`qa-test-plan.md`) |
| Page or bot tokens leak to the browser | Tokens only in a table with no client access, read by server routes with the service key (`sdd.md` §4, INV-AS-002) |
| Way 1 extraction after the webhook answer may be cut off on serverless hosting | Confirm the after-response mechanism against the installed Next.js / Vercel versions; fall back to a Cron sweep of pending conversations (`sdd.md` §3) |
| A busy Page triggers many AI calls and uses up the free quota | Count connected-account extractions in the per-owner daily cap (`prd.md` BR-010) |
| Realtime connections drop on phones | The logbook says it's not live and reloads on reconnect or focus (INV-008) |

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial decision: Option A (ADR-008), with founder-set weights and team skills |
| 2026-10-08 | F-006 in the MVP (ADR-012): requirements, Realtime, and webhook risks added; stack choice unchanged |
| 2026-10-23 | ADR-014: independent `backend/` and `web/` workspaces; original Option A scores retained as historical, backend hosting/auth transport open |
