# Frontend Kickoff Plan — MabiList

**Status:** proposal, not yet applied · **Written:** 2026-10-22 · **Owner:** Yancy (frontend)
**Needs sign-off from:** An-joe (design, PM) and Tyrone (backend)

> This is a working note, not a status tracker. `docs/implementation-plan.md` remains the only
> place where task status lives (`AGENTS.md` rule 3). Nothing here is "done" until the steps
> in §4 are applied to the real files.

---

## 1. Where we are

| Item | State | Source |
|---|---|---|
| UI design | **Exists now** (An-joe), but its link is not yet recorded | founder, 2026-10-22 |
| Design gate (`docs/design-brief.md` §0) | Still says "not yet", so every build task is blocked | ADR-010 |
| Backend code | None. The routes, data model and security are **specified** but not built | `docs/sdd.md` §2, §4, §6 |
| App code / frontend folder | None. The repo only holds `seed/`, `work/`, `docs/`, `handoff/` | repo, 2026-10-22 |
| Open phase | None. PH-01 is blocked | `docs/implementation-plan.md` |
| Handoff packets | Only `handoff/TASK-000-template.md` | repo |

## 2. Decision: start the frontend now, without waiting for the backend

**Recommendation: yes.** The design was the only thing blocking the frontend, and that's now
cleared.

**Why this is safe:**

1. **The backend has a written contract.** `docs/sdd.md` §2 lists every route, its input and
   output, and its auth check. §4 lists every table and field, with the allowed values for
   `status`, `state`, `payment_status` and the others. The frontend can be built against those.
2. **A mock API layer separates the two people.** The screens call one typed module whose
   function names match the SDD routes. In development, a mock version returns SDD-shaped data,
   including every error and edge state. When Tyrone's routes land, the mock is swapped for real
   `fetch` calls and the screens don't change.
3. **Most screens depend only on the design.** The capture and review flow (TASK-004), the
   logbook (TASK-007) and statistics (TASK-008) are mostly UI work.

**What it costs:** the mock can drift from the real API (see §7, R-1).

## 3. Where the code goes: one Next.js app in `web/`

There is **no separate "frontend" folder**. The stack is Next.js + Supabase (ADR-008), and the
SDD's backend routes (`/api/extractions`, `/api/orders/...`) are **Next.js API routes**. So the
frontend and backend live in **one app**:

```
Philippine-StartUp-Challenge/
├── seed/ work/ docs/ handoff/     ← planning (unchanged)
└── web/                           ← the Next.js app (new, created by TASK-021)
    ├── app/                       ← Yancy: pages and screens from the design
    ├── app/api/                   ← Tyrone: routes from sdd.md §2
    └── lib/
        ├── types.ts               ← shared types, written from sdd.md §4 (one source for both)
        ├── api/                   ← the functions the screens call (mock + real behind one switch)
        └── supabase/              ← Supabase client (Tyrone)
```

**Why a `web/` subfolder and not the repo root:** the root already holds the planning folders;
`create-next-app` doesn't scaffold cleanly into a folder that isn't empty; and keeping code apart
from planning makes both easier to navigate.

**Ownership rule:** Yancy owns `web/app/**` (except `app/api/`) and `web/lib/api/`. Tyrone owns
`web/app/api/**` and `web/lib/supabase/`. `web/lib/types.ts` is shared. Change it only together,
and update `docs/sdd.md` first.

## 4. Steps before any code is written (repo rules)

These are required by `AGENTS.md` and `AGENT_ROUTING.md`. Do them in this order.

| # | Step | File | Who | Why |
|---|---|---|---|---|
| 1 | Get the design link (Figma/Canva) and the list of screens it covers | — | An-joe → Yancy | Needed for §0 and for every UI packet's "Design source" |
| 2 | Log the design gate change as a new ADR (ADR-013) | `docs/decision-ledger.md` §5 | Yancy | "Log before you change" (`AGENTS.md` rule 5) |
| 3 | Set §0 to `founder-owned`; fill in Source, Link, Screens it covers | `docs/design-brief.md` §0 | Yancy | Unblocks the build (`AGENT_ROUTING.md` §2.4) |
| 4 | Log the TASK-001 split and the `web/` folder choice (same ADR-013 or ADR-014) | `docs/decision-ledger.md` | Yancy + Tyrone | Plan and structure changes are logged first |
| 5 | Split TASK-001 (see §5), set PH-01 to `open`, add a run-log line | `docs/implementation-plan.md` | Yancy | Exactly one phase open at a time (`AGENT_ROUTING.md` §5) |
| 6 | Add `.env` to `.gitignore`; create `.cursorignore` | repo root | Yancy | PH-01 pre-check (`docs/implementation-plan.md` §3) |
| 7 | Write `handoff/TASK-021.md` from the template | `handoff/` | Yancy | Code must trace to a packet (`AGENTS.md` rule 2) |

## 5. Proposed change to the task list

Today **TASK-001** bundles two unrelated jobs: the project setup (frontend-ish) and the AI accuracy
test (backend/AI). Split it so neither person waits on the other:

| Task | Owner | Description | Verify command |
|---|---|---|---|
| **TASK-021** *(new)* | Yancy | Scaffold `web/`: Next.js, Tailwind, lint, test runner; `lib/types.ts` from `sdd.md` §4; `lib/api/` with the mock behind one switch; add dev/build/test commands to `AGENTS.md` "Commands" | `lint`, `build` and `test` all exit 0 on a clean checkout; one test proves the mock returns each upload `status` from `sdd.md` §4 |
| **TASK-001** *(narrowed)* | Tyrone | AI accuracy test only: synthetic Taglish chat set, `extractOrders()` for both providers, scoring script | Unchanged: exits non-zero below 70% overall or 80% key fields |

*Task IDs are never renumbered or reused (`docs/decision-ledger.md` §1), so the new task takes
the next free number, TASK-021. Table order in the plan is the build order, so TASK-021 goes
first in PH-01.*

## 6. Frontend build order

Every screen below comes from An-joe's design and must cover its empty, loading and error states
(`docs/design-brief.md` §2, `docs/anti-slop-guardrails.md` §1). Each row is its own handoff
packet, written just before it's started.

| Order | Task | Screens (from `design-brief.md` §2) | Runs on mock? | Needs from Tyrone to go live |
|---|---|---|---|---|
| 1 | TASK-021 | — (scaffold, types, mock layer) | — | — |
| 2 | TASK-004 | Add from chat (choose input, uploading, reading, upload limits); Results (no order, unreadable, failed); Interrupted; Review draft with **not in chat**; several orders from one chat | Yes | `POST /api/extractions`, `/retry`, Storage upload (TASK-002, TASK-003) |
| 3 | TASK-005 (UI part) | Confirm / Discard + Discard confirmation; Enter an order by hand; Order details | Yes | `/api/orders` routes (TASK-005 backend part) |
| 4 | TASK-002 (UI part) | Sign up / sign in; Signed out; Sign out | Partly (fake session) | Supabase Auth (TASK-002) |
| 5 | TASK-007 | Logbook: first time, orders list, filter shows nothing, drafts count, 7-day notice, Draft expired notice | Yes | Tables with row-level security (TASK-002) |
| 6 | TASK-008 | Statistics, Sample data label | Yes | Statistics function (TASK-008 backend part) |
| 7 | TASK-009 | Review: update to an existing order; several possible matches | Yes | apply-to route (TASK-009) |
| 8 | TASK-016, TASK-018 | Connected accounts (all states); Logbook new draft arrives / not live | Yes, but **hidden** until F-006 works | F-006 tasks TASK-013 to TASK-019 |

**Note on TASK-002 and TASK-005:** both are written as single tasks mixing backend and UI. When
their packets are written, split each into a backend and a UI packet the same way as §5, and log
it.

**Must not appear as working controls** (`docs/design-brief.md` §2, INV-AS-005): account deletion,
Filipino toggle, exports, reminders, WhatsApp, Viber, and connected accounts until F-006 works.

## 7. How the mock layer works (rules)

1. **Types come from `sdd.md` §4, word for word.** Same field names (`customer_name`,
   `total_php`, `not_in_chat`, `payment_status`...), same allowed values. No invented fields.
2. **One function per SDD route**, named after it (e.g. `createExtraction()` for
   `POST /api/extractions`). Screens import only from `lib/api/`, never call `fetch` directly.
3. **The mock covers the unhappy paths**, not just the happy one: `no_order`, `failed` with a
   `failure_reason`, `expired`, slow responses (the "reading" wait of up to ~30 s), empty lists,
   several drafts from one upload, a draft with `matches_order_id`.
4. **One switch** chooses mock or real (e.g. an env flag). The default is real once a route exists.
5. **The mock never reaches the demo.** Demo data comes from the real backend's sample account
   with `is_sample = true` and the visible "Sample data" label (INV-009). Shipping the mock as if
   it were real would break the Hard Gate's "no fabricated data" rule.
6. **If the SDD is wrong or missing something, fix the SDD first**, then the types, then the mock.
   Don't let the code become the spec.

## 8. Coordination with Tyrone

- **Before TASK-021:** agree on `web/` and the ownership split in §3.
- **The contract is `docs/sdd.md`.** Any route or field change goes to the SDD first, so the mock
  and the real route stay matched.
- **Integration check per route:** when a route lands, flip the switch for that route only, run
  the screen's tests, and click through it on a phone browser.
- **Unknown to resolve together:** the SDD tables give inputs and meanings, but the exact
  response JSON (e.g. what `POST /api/extractions` returns for several drafts, or the error body
  shape) may not be pinned down yet. Agree on these before TASK-004 and write them into
  `sdd.md` §2.

## 9. Risks

| ID | Risk | Mitigation |
|---|---|---|
| R-1 | Mock drifts from the real API; integration breaks late | Shared `types.ts` from the SDD; SDD-first rule (§7.6); integrate per route as each lands |
| R-2 | The design doesn't cover every required state (expired draft, not live, upload limits...) | Check the design against `design-brief.md` §2 **before** TASK-004; gaps go to An-joe, not invented by the frontend |
| R-3 | Sign-in and live updates can't really be tested without Supabase | Build them on a fake session/mock; mark them unverified until TASK-002 and TASK-018 are done |
| R-4 | Hype or banned copy slips in ("AI-powered", "automatic", accuracy claims) | Follow `design-brief.md` §3; check in the Delivery Gate |
| R-5 | Scope creep into F-006 screens before the core loop works | F-006 is built last and hidden until it works (ADR-012) |

## 10. Housekeeping found while reading the repo (not part of the frontend work)

- `seed/context.md` still shows the **October 11, 2026** deadline and **"mentor not secured"**.
  Today is October 22, so record whether the application was submitted, the mentor's status, and
  the next dates (shortlist, mentorship, Regional Competition).
- `AGENTS.md` mentions `HOW_TO_USE_FMD.md`, but it's gitignored and not in the repo.

## 11. Open questions

1. What's the design link, and which screens from `design-brief.md` §2 does it cover?
2. Does Tyrone agree on `web/` and the ownership split?
3. Which test runner and package manager? (TASK-021 picks them; they go into `AGENTS.md`.)
4. Was the PSC application submitted on October 11, and what's the next deadline? This sets the
   time budget for PH-01.

## 12. Checklist

- [ ] Design link received and checked against `design-brief.md` §2 (R-2)
- [ ] ADR(s) logged: design gate, TASK-001 split, `web/` folder
- [ ] `design-brief.md` §0 → `founder-owned`
- [ ] `implementation-plan.md`: TASK-021 added, TASK-001 narrowed, PH-01 `open`, run-log line
- [ ] `.env` in `.gitignore`; `.cursorignore` created
- [ ] `handoff/TASK-021.md` written
- [ ] TASK-021 built, Verify green, Delivery Gate passed
- [ ] Response JSON shapes agreed with Tyrone and written into `sdd.md` §2
- [ ] `handoff/TASK-004.md` written, then build the screens
