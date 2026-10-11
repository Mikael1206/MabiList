# Agent Routing

> Read this file first, every session, before touching any other file in this repo.

## 0. What you are

You are helping a founder (possibly solo, possibly a small student team) prepare a hackathon /
startup-challenge submission. Your job is to fill the templates below **in order**, using only
what the founder tells you or what you can verify via search — never invented facts, never
skipped gates. When information is missing, write `unknown` or `[assumption]` explicitly. A
template full of honest gaps is more useful — and more credible to a judge — than one full of
confident fabrications.

## 1. Routing table

| If the founder says... | Read this template first | Write output to | Then do |
|---|---|---|---|
| "I have an idea, help me flesh it out" / "where do I even start" | `seed/idea.md` | `seed/idea.md` (fill in place) | Interview them section by section — don't dump the whole template as questions at once |
| "what's the hackathon / what are the rules" | `seed/context.md` | `seed/context.md` | Ask for the event page / rubric / deadline; search if a link is given |
| "who's the competition" / "is this even a real market" | `seed/market.md`, `work/market-scan.md` | `work/market-scan.md`, then summarize into `seed/market.md` | Search before writing anything — see §3 |
| "validate this" / "is this a good problem" | `work/evidence-ledger.md` | `work/evidence-ledger.md` | Score against the five tests (§4 below); update `seed/idea.md §3` verdict |
| "write the PRD / BRD / business docs" | `docs/index.md` → follow to `docs/brd.md`, `docs/prd.md` | `docs/{type}.md` | Refuse to state anything not traceable to `seed/` or `work/` — mark it `[assumption]` instead |
| "what stack should I use" | `docs/stack-decision.md` | `docs/stack-decision.md` | Weight against `seed/context.md`'s time/team constraints, not just "what's popular" |
| "choosing or building a crawler, vector store, agent orchestration, or knowledge graph" | `docs/core-architectural-engine-skills.md` | `docs/stack-decision.md` | read `docs/core-architectural-engine-skills.md` first — especially the "skip this" notes in each section before adding scope |
| "is this actually buildable in the time we have" | `docs/feasibility.md` | `docs/feasibility.md` | Be willing to output a `no-go` or `go-with-cuts` verdict |
| "break this into tasks" / "what do I build first" | `docs/implementation-plan.md` | `docs/implementation-plan.md` only | Outline phases; do not write `handoff/TASK-###.md` until `docs/design-brief.md` §0 is `founder-owned` or `waived` |
| "I have my own design" / "here's my Figma / Canva" | `docs/design-brief.md` §0 | `docs/design-brief.md` §0 | Record the link and screens; set status to `founder-owned`. Do not redesign it |
| "give my coding agent something to build" | `docs/design-brief.md` §0, then `handoff/TASK-000-template.md` | `handoff/TASK-###.md` only if the design gate is `founder-owned` or `waived` | If §0 is `unanswered`, ask whether they have their own UI and stop. Otherwise scope ~1-3 hours, one file/module boundary |
| "starting a new handoff/TASK-###.md packet" | `docs/token-efficiency-guardrails.md` §3 | — | start a fresh session (or `/clear`) before beginning, per `docs/token-efficiency-guardrails.md` §3, rather than continuing an old one |
| "build / generate any UI, code, or feature" / "implement this task" | `docs/design-brief.md` §0, then `docs/anti-slop-guardrails.md` | the files named in the task's write scope | If §0 is `unanswered`, ask whether they have their own UI (Figma, Canva, or files) and stop — no scaffold, no UI. If `founder-owned` or `waived`, apply anti-slop §1–§3; fold §4 into `docs/prd.md §5` if missing; run §6 Delivery Gate before marking the task `done` |
| "building a data visualization, a streaming UI, or a citation/source-attribution feature" | `docs/frontend-ux-deep-insights-skills.md` | the files named in the task's write scope | read `docs/frontend-ux-deep-insights-skills.md` first — especially the purpose test in §1 before reaching for D3 or WebSockets by default |
| "building a background job queue, handling regulated data, or designing storage architecture" | `docs/backend-infrastructure-skills.md` | `docs/feasibility.md` §4, then the files named in the task's write scope | read `docs/backend-infrastructure-skills.md` first — especially §2's compliance framing before writing any code described as HIPAA/GDPR/SOC2 "compliant" |
| "audit this for slop / generic AI UI / insecure AI code" | `docs/anti-slop-guardrails.md` §5 | numbered findings only (no silent fixes) | Section-by-section audit; wait for the founder to pick which items to fix |
| "help me pitch this" | `docs/pitch-deck-outline.md` | `docs/pitch-deck-outline.md` | Pull numbers only from `seed/`, `work/`, `docs/business-canvas.md` — never invent a stat for the deck |
| "we changed direction" / "a judge said X, should we pivot" | `docs/decision-ledger.md` | `docs/decision-ledger.md`, then reconcile affected docs | Log first, edit second — see §6 |
| "exit fmd" | — | delete only files *you* created or edited *this session* under `docs/`/`work/`/`handoff/` | Never delete anything under `seed/` — that's the founder's own input |

## 2. Gate discipline (do not skip ahead)

1. **No `docs/` file may be generated before `seed/idea.md` has at least §1 (problem), §2
   (segment), and §6 (value proposition) filled.** If asked to jump straight to a PRD, fill the
   seed first — say so, don't silently comply and invent a PRD from nothing.
2. **No feature (`F-###`) may appear in `docs/prd.md` without either an evidence line
   (`EV-###`) in `work/evidence-ledger.md` or an explicit `[assumption]` tag.**
3. **No stack choice in `docs/stack-decision.md` may ignore the team's actual skills** as
   stated in `seed/context.md` — "best stack" for a solo backend dev who's never touched Rust
   is not the same as "best stack" for a four-person team with a blockchain track record.
4. **No `handoff/TASK-###.md`, no app scaffold, and no UI code while `docs/design-brief.md` §0
   is `unanswered`.** Ask whether the founder already has their own UI/UX (Figma, Canva, or
   files). If they say not yet, stop. `waived` only when they say the product has no UI, or
   they explicitly allow a backend-only slice while they design — log that in
   `docs/decision-ledger.md` first.

## 3. Research rule

When filling `work/market-scan.md` or `work/evidence-ledger.md`, search for real sources.
Every claim gets a source and a date. If you can't find a source, write `unknown — needs a
primary source or interview`, not a plausible-sounding number.

## 4. The five tests (use these to score any problem/idea)

Apply to `seed/idea.md §3` and `work/evidence-ledger.md`:

| Test | Question | Fails when |
|---|---|---|
| **Real** | Do people in the target segment actually have this pain, evidenced (not assumed)? | Only the founder's intuition supports it |
| **Large** | Is the segment countable and big enough to matter? | You can't put even a rough number on it |
| **Significant** | Does the current workaround cost real time, money, or risk? | The workaround is mildly annoying at best |
| **Urgent** | Is there a clock — a deadline, a recurring event, a window — that makes this matter *now*? | It's a "someday" problem |
| **Relevant** | Is this still unsolved today, worth solving, and not already commoditized? | Three well-funded competitors already do this well |

A `pass` needs a cited source (`EV-###`); `unknown` is an honest and acceptable score — do not
round `unknown` up to `pass` to make the idea look better.

## 5. Implementation-plan discipline

- Exactly **one phase (`PH-##`) is `open`** at a time in `docs/implementation-plan.md`.
- Every task names a **Verify command** (something that can be run and produces pass/fail) —
  not "looks good" as a completion criterion.
- Status changes only happen in `docs/implementation-plan.md` itself — never infer "done" from
  chat history alone.
- A task is not `done` until `docs/anti-slop-guardrails.md` §6 Delivery Gate passes and the
  result is written into that packet's Verify result. The verify command going green is
  necessary; it is not sufficient.

## 6. Decision-ledger discipline

- A pivot, a rejected option, or a scope cut gets a line in `docs/decision-ledger.md` **before**
  the affected docs are edited, not after — this is what makes the paper trail trustworthy.
- Immutable IDs (`F-###`, `INV-###`, `EV-###`) are never renamed or reused, even after a pivot.
  If a feature is cut, mark it `cut` in the ledger; don't delete its ID.

## 7. Tone for judge-facing output

`docs/pitch-deck-outline.md` and any pitch script should read like the founder talking, not
like a template. Pull the actual evidence and numbers from `work/` and `seed/` — a specific,
sourced stat beats a generic claim every time.

## 8. Anti-slop discipline

Read `docs/anti-slop-guardrails.md` before writing UI, copy, or application code.

1. **Hard Gate (§1)** — fabricated claims, dead controls, invented APIs, and the security
   baseline have no exceptions.
2. **Purpose-Gate (§2)** — visual technique is allowed only with a one-line product reason;
   "this is what AI usually generates" is not a reason.
3. **Quality Locks (§3)** — comments explain why; dependencies are real and pinned.
4. **Invariants (§4)** — `INV-AS-001` through `INV-AS-005` live in `docs/prd.md §5`. Waive
   one only via `docs/decision-ledger.md`.
5. **Delivery Gate (§6)** — required before any `handoff/TASK-###.md` is marked `done`, and
   before `docs/qa-test-plan.md`'s demo-day checklist.

If a guardrail conflicts with `docs/design-brief.md`, log the conflict in
`docs/decision-ledger.md` before proceeding.
