# Implementation Plan — MabiList

**Status:** living · **This is the only place execution status is tracked.**

> **Agent instructions:** Once the Design gate is `founder-owned` or `waived`, exactly one
> phase (`PH-##`) is `open` at a time. Until then, none are. Every task names a
> **Verify command** — something runnable that returns pass/fail, not "looks right." Don't
> mark a task `done` from chat context alone; the Verify command actually has to have been run
> against the current code, **and** `docs/anti-slop-guardrails.md` §6 Delivery Gate must pass
> with evidence in that task's packet. When a phase completes, close it and open the next
> one explicitly. Do not open a build phase, write `handoff/TASK-###.md`, or scaffold the
> app while the Design gate below is `unanswered`.

**SDLC:** Plan (seed, work, specs) → Design (founder; record in `design-brief.md` §0) →
Implement (PH-01) → Test (`qa-test-plan.md`, PH-02) → Deploy (PH-03) → Maintain (`gtm.md`,
`decision-ledger.md`).

**Design gate:** founder-owned — the static Figma design file is the visual source and the Make
prototype is the flow reference (ADR-013, ADR-015; `design-brief.md` §0).
**PH-01 is open.** No implementation completion is inferred from the prototype or chat.

**Planning status (2026-10-07):** Stage 3 specs drafted — `brd.md`, `prd.md`, `feasibility.md`
(GO-WITH-CUTS), `stack-decision.md`, `sdd.md`, `design-brief.md`, `qa-test-plan.md`,
`pitch-deck-outline.md`, `gtm.md`. The PSC application (deck by 2026-10-10, submit by 2026-10-11)
needs no build (`seed/context.md` §1). Blockers outside the build: PUP mentor not secured;
0 interviews.

**2026-10-08:** F-006 (Way 1, connected business accounts) is back in the MVP (ADR-012). Its
tasks (TASK-013 – TASK-019) run in PH-02 after the Way 2 tasks and before the full QA run; Meta
App Review (TASK-020) follows deployment. Task IDs follow creation order, not build order — the
table order is the build order.

## 0. Team & roles

| Name | Role |
|---|---|
| An-joe Mikael T. Albano | Product manager; UI/UX designer — owns `design-brief.md` §0 and the design (Figma/Canva) |
| Tyrone Loius V. Teemer | Backend — Supabase schema and row-level security, server routes, AI adapter, deletion job, accuracy test, Meta app and Telegram bot setup, webhook routes |
| Yancy Allen S. Tiburcio | Frontend — Next.js screens from the founder's design |
| Mentor | `unknown` — not yet secured; must be a PUP employee (`seed/context.md` §4) |

## 1. Phases

*The frontend has Vitest, lint, and build scripts in `web/package.json`. Backend-specific test
commands remain to be pinned in each packet; existing descriptive Verify entries name what must
be proved. Each packet is scoped to about 1–3 hours; split larger tasks before claiming them.*

### PH-01 — Implement: prove the core loop — **status: open**

*Goal: the smallest demoable slice that delivers the core value — a screenshot becomes a confirmed
order (F-001, F-002) — and the measurement that decides whether F-001 works as designed (A-003).*

| Task | Feature | Description | Verify command | Status |
|---|---|---|---|---|
| TASK-001 | F-001 | Project setup (Next.js, test runner, lint) + **AI accuracy test**: synthetic Taglish chat set (30–50, with expected fields), `extractOrders()` for both candidate providers, scoring script per `seed/idea.md` §8 (TC-008, TC-009, TC-N06). Result picks the provider (ADR-008) and goes in `work/evidence-ledger.md` | Eval script runs both providers on the set and prints overall and key-field accuracy, guessed-value count, and timing; exits non-zero below 70% overall or 80% key fields | not started |
| TASK-002 | F-007 | Supabase project (Singapore), tables `uploads`, `orders`, `order_items` with row-level security; private Storage bucket with per-owner folders; email + password sign-in and sign-out (`sdd.md` §4) | Tests: TC-030, TC-N14 (Owner B can't read or change Owner A's rows or files), TC-N16 (no secrets in the bundle) | in progress |
| TASK-003 | F-001 | `POST /api/extractions` and retry: session + ownership checks, daily cap, output validator (BR-002 fields only, phone/address stripping, BR-005 totals), upload status handling | Tests: TC-002, TC-003, TC-005, TC-007, TC-N01, TC-N04, TC-N08, TC-N17 | not started |
| TASK-004 | F-001, F-002 | Capture and review screens from the founder's design: choose input, uploading, reading, results (no order / unreadable / failed), draft review with "not in chat" | TC-001, TC-006, TC-N13 manual steps pass on a phone browser; Delivery Gate UI items (states, contrast, keyboard) | not started |
| TASK-005 | F-002 | Confirm, edit, discard, manual entry routes; raw upload deleted through the Storage API on confirm / discard / no order | Tests: TC-010 – TC-013, TC-N02 | not started |
| TASK-006 | F-002 | Hourly deletion job: Supabase Cron → `/api/jobs/expire-uploads` with secret; expired-draft notice (ADR-009) | Tests: TC-014, TC-N03, TC-N15; check at setup that Cron can make HTTP calls on the free plan | not started |

### PH-02 — Test: round out the MVP and run the QA plan — **status: not started**

| Task | Feature | Description | Verify command | Status |
|---|---|---|---|---|
| TASK-007 | F-003 | Logbook screen: sort by delivery date, filters, drafts count, empty / no-match / error states, updates without reload | Tests: TC-015, TC-017; manual TC-016, TC-018, TC-019 | not started |
| TASK-008 | F-004 | Statistics function (Asia/Manila, Monday weeks, confirmed and priced only) and screen; "sample data" label | Tests: TC-020 – TC-024, TC-N05; manual TC-025, TC-N09 | not started |
| TASK-009 | F-005 | Matching open orders by customer name (BR-008), update review, apply approved fields only | Tests: TC-026 – TC-029, TC-N07 | not started |
| TASK-013 | F-006 | Meta app in development mode with the team's test Page and linked Instagram professional account; Telegram test bot; server-only environment variables for the app secret and verify token (ADR-012) | Setup checklist in the packet: app in development mode, only team roles, test accounts listed; TC-N25 bundle search finds no Meta secrets | not started |
| TASK-014 | F-006 | Tables `channel_connections`, `channel_secrets` (no client policies), `conversations`, `chat_messages` with row-level security; `orders.source` and `conversation_id` (`sdd.md` §4) | Tests: TC-045 (query part), TC-N23 (row-level part), TC-N25 (`channel_secrets` unreadable with an owner session) | not started |
| TASK-015 | F-006 | Webhook routes: Meta handshake and signed `POST`, Telegram route with secret token; connection lookup; dedupe; text-only storage; answer first | Tests: TC-033 (handshake), TC-038, TC-040, TC-N20, TC-N21, TC-N22 | not started |
| TASK-016 | F-006 | Connect and disconnect: Meta login with `state`, Page picking, Page subscription; Telegram token check and webhook registration; Connected accounts screen from the founder's design | Tests: TC-034, TC-041, TC-042, TC-N24, TC-N25; manual TC-033 on the test Page; Delivery Gate UI items | not started |
| TASK-017 | F-006, F-005 | Conversation extraction after the webhook answer (confirm the mechanism against installed versions; Cron sweep fallback), BR-010 window, daily cap, proposed updates matched by conversation, retry | Tests: TC-037, TC-039, TC-043, TC-N27; manual TC-035, TC-036 | not started |
| TASK-018 | F-003, F-006 | Realtime on the logbook for new drafts and conversation status; "not live" state; source labels | Manual TC-035, TC-044, TC-045; TC-N23 Realtime part | not started |
| TASK-019 | F-006 | Expiry job covers `chat_messages`; delete on confirm / discard / no order / disconnect; Meta data-deletion callback | Tests: TC-N26 | not started |
| TASK-010 | — | Full QA run: every `TC-###` and `TC-N##` in `qa-test-plan.md`; results recorded there | Test runner passes all Auto tests; manual results logged; TC-N10, TC-N12 commands pass | not started |

### PH-03 — Deploy: demo readiness — **status: not started**

| Task | Feature | Description | Verify command | Status |
|---|---|---|---|---|
| TASK-011 | — | Deploy `web/`, `backend/`, and production Supabase; select backend host and same-origin `/api` routing first (ADR-014); server-only environment variables, synthetic demo account, and webhooks pointed at the backend URL | TC-N11, TC-N12, TC-N16, TC-N28 against the deployed URL | not started |
| TASK-012 | — | Demo rehearsal on the actual device and network; recorded backup walkthrough; `qa-test-plan.md` §3 checklist | Every demo-day checklist item ticked, by someone other than the builder | not started |
| TASK-020 | F-006 | Meta App Review submission for real sellers' Pages: public privacy policy URL, data-deletion instructions, screencast per permission; business verification if Meta asks `[verify current requirements]`. Not needed for the demo (ADR-012) | Submission recorded in the packet with Meta's status; TC-N28 still passes until approval | not started |

*Not planned: F-101 – F-104, the Filipino toggle (no feature ID yet, ADR-010), account deletion
(open question, `prd.md` §10). If time runs out, F-006 tasks are cut first — with a ledger entry
(ADR-012).*

### ADR-013 scope reconciliation — accepted, implementation pending

These additions do not mark any feature done. Narrow TASK-001's setup work against the existing
frontend before its next packet; do not scaffold a second app. TASK-021 exists but requires
Delivery Gate review and reconciliation with TASK-002/004/007 before assigning overlapping work.

| Task | Owner | Scope / accepted change | Verify command | Status |
|---|---|---|---|---|
| TASK-021 | Frontend | Existing scaffold, mock, and screens — including Totals, Settings, chat excerpt, delete order and order updates (commit `3ad9e7c`); follows the design file per ADR-015; reconcile with the ADR-013 contract before integration | `cd web && npm run lint && npm run build && npm test`; teammate Delivery Gate review | in progress |
| TASK-022 | Backend + frontend review | Pin ADR-013 request/response examples, money serialization, evidence shape, shared-source batch operation, errors and retry behavior; reconcile existing types/mock without implementing real integrations | `git diff --check` (app lint/build/tests deferred by packet) | in progress |
| TASK-023 | Backend | Logbook deletion: fence incoming/in-flight writes, disconnect channels, remove credentials/raw/order data, retain login/profile, retry partial cleanup | `cd web && npm test` must cover TC-050/TC-051 before completion | not started |
| TASK-024 | Frontend | Read-only owner-scoped offline logbook cache, freshness, sign-out clearing, reconnect/deletion invalidation; no raw-evidence cache | `cd web && npm test` must cover TC-052; browser offline checks in TC-019 | not started |
| TASK-025 | Backend + frontend integration | Separate `web/` and runnable `backend/` under ADR-014 without `shared/`; preserve the HTTP contract and frontend mock | `node --check backend/src/server.mjs`; frontend lint/build/tests; backend `/health`; `git diff --check` | done |

TASK-022 pins the contract; TASK-025 establishes the separate workspaces before live route work.
TASK-023 runs in PH-02 after channel lifecycle work; TASK-024 runs
in PH-02 after TASK-007. Both precede full QA (TASK-010). Their packets may split further if
they exceed 1–3 hours. Existing tasks gain these acceptance requirements:

- TASK-002/003/005: nullable unit prices, explicit unknown payment, price conflicts (TC-046/047).
- TASK-003/004/005/006/017/019: temporary evidence, shared-source batches and expiry (TC-048/049).
- TASK-008: explicit unpaid-only amount owed, unknown count, confirmed-date totals (TC-020–022).
- TASK-004/007/016: preserve the designer's layout while reflecting ADR-013 behavior/copy inputs.

## 2. Task states

`not started` → `ready` → `in progress` → `blocked` (with reason) → `done` (Verify green
**and** Delivery Gate pass) or `cut` (see `decision-ledger.md` for why).

## 3. Phase gate checklist

A phase closes only when:
- [ ] every task is `done` or `cut` (with a ledger entry for any cut)
- [ ] the Verify command for every `done` task has actually been run on the current code
- [ ] every `done` task has a Delivery Gate pass logged in its `handoff/TASK-###.md`
- [ ] nothing under the phase's features breaches an `INV-###` or `INV-AS-###` (spot-check manually)

**Before PH-01 opens:** `.env` added to `.gitignore` and a `.cursorignore` created
(`anti-slop-guardrails.md` §1; `token-efficiency-guardrails.md` §4).

## 4. Run log

*Brief dated notes — what actually happened, especially anything that didn't go as planned.
This becomes useful raw material for the pitch's "we're not guessing, we're not done either"
honesty and for a postmortem later.*

| Date | Note |
|---|---|
| 2026-10-23 | ADR-015: the static Figma design file is the visual source; the Make prototype is the flow reference only. TASK-022 keeps its API-contract scope; the 2026-10-22 screens (Totals, Settings, chat excerpt, delete order, order updates) are recorded under TASK-021. |
| 2026-10-23 | TASK-002 backend slice: dedicated Singapore Supabase project created at $0/month; two versioned migrations applied. RLS enabled on four tables, private upload bucket, owner isolation SQL test passes with rollback, security advisors empty. Backend session route and 5 Node tests pass. Frontend sign-in/out, same-origin handoff, and real Storage API download checks remain; task stays in progress. |
| 2026-10-23 | TASK-025 verified: backend syntax and localhost `/health` (200)/unimplemented route (404); frontend lint, 10 tests, and Webpack production build pass. Turbopack build cannot bind its CSS worker port in this sandbox. |
| 2026-10-23 | ADR-014: founder chose separate `backend/` and `web/` directories without `shared/`. TASK-025 opened for a structure-only migration; independent backend hosting and same-origin routing require a later integration decision. |
| 2026-10-23 | TASK-022 started: SDD wire contract and shared types/mock aligned; backend routes and live integration remain future tasks. |
| 2026-10-23 | ADR-013: founder supplied the prototype and accepted six contract decisions. Design gate reconciled; PH-01 opened; TASK-021 recorded as in progress pending verification, TASK-022–024 added. Documentation only; no backend implemented or tests claimed passing. |
| 2026-10-07 | Plan created. Stage 3 specs drafted in one day. Design gate not yet (ADR-010), so PH-01 is blocked; the application deck needs no build. `work/system-flow-explainer.md` was found empty, restored by the founder, and reconciled with ADR-002 – ADR-010 |
| 2026-10-08 | ADR-012: F-006 (webhooks for business accounts) back in the MVP after Way 2; TASK-013 – TASK-020 added; PH-01 still blocked by the design gate |

## Related documents

- [`handoff/`](../handoff/) — one `TASK-###.md` packet per task, written just before it's claimed
- [`decision-ledger.md`](decision-ledger.md) — for any cut task or scope change
- [`anti-slop-guardrails.md`](anti-slop-guardrails.md) — Delivery Gate before any task is `done`
