# Documentation Index — MabiList

**Last updated:** 2026-10-08 (ADR-012 — two ways in the MVP)

> **Agent instructions:** Keep this table current whenever a new doc is generated or a fact
> moves. The rule is **one fact, one home** — if you find the same number stated differently
> in two documents, that's a bug: fix it here first (which doc *should* own it), then correct
> the other document to link rather than restate.

## 0. Source-of-truth map

*"Owner today" is where the fact lives right now. Where a Stage 3 doc will take a fact over, the
note says when ownership moves — after that, the old home links to the new one instead of
restating it.*

| Concern | Canonical owner | Note |
|---|---|---|
| Problem, segment, evidence, riskiest assumption | [`seed/idea.md`](../seed/idea.md) | the seed everything else derives from. Problem §1; segment, beachhead, and exclusions §2; five-tests verdicts §3; root cause §4; value proposition §6 |
| SDG priority (deck requirement) | [`seed/idea.md`](../seed/idea.md) §1 | SDG 8 primary (targets 8.2, 8.3), SDG 9 secondary (target 9.3) |
| Evidence detail — sources, dates, caveats, `EV-###` types | [`work/evidence-ledger.md`](../work/evidence-ledger.md) | `seed/idea.md` §3 is a short summary that cites `EV-###` IDs; if the two disagree, the ledger wins and §3 is corrected |
| Five-tests scoring and what would flip each test | [`work/evidence-ledger.md`](../work/evidence-ledger.md) | verdicts rolled up into `seed/idea.md` §3 |
| Root cause analysis (five-whys), workarounds, failed predecessors | [`work/problem-capture.md`](../work/problem-capture.md) | `seed/idea.md` §4 holds the one-paragraph root cause |
| Market size, competitors | [`seed/market.md`](../seed/market.md) | summary; detail in `work/market-scan.md`. `seed/idea.md` §5 restates the size ceilings and top 3 alternatives — must match `seed/market.md` (checked 2026-10-07: they match) |
| Competitor detail — pricing, URLs, check dates | [`work/market-scan.md`](../work/market-scan.md) | re-check prices before quoting them in the deck |
| Interview script and screener | [`work/interview-guide.md`](../work/interview-guide.md) | screener must match `seed/idea.md` §2 |
| Interview records | `work/interview-log.md` | **doesn't exist yet** — created only when a real interview happens; never fabricated. Each interview is promoted to an `EV-###` row in the ledger |
| Team's suggested system flow (Way 1 / Way 2) | [`work/system-flow-explainer.md`](../work/system-flow-explainer.md) | team input, not a decision; reconciled with ADR-002 – ADR-010 on 2026-10-07 and with ADR-012 (both ways in the MVP) on 2026-10-08. `docs/sdd.md` owns the architecture and `docs/stack-decision.md` the stack |
| Event rules, deadlines, team, constraints | [`seed/context.md`](../seed/context.md) | re-verify against the official event page, not memory. Deadline 2026-10-11; ₱0 budget; mentor not yet secured (eligibility blocker) |
| Deck sections required by PSC XI, and which file feeds each | [`seed/context.md`](../seed/context.md) §6 | `pitch-deck-outline.md` assembles the deck from those files |
| Why this is worth building, for whom, success looks like | [`brd.md`](brd.md) | |
| What we build (`F-###`), acceptance criteria, invariants (`INV-###`) | [`prd.md`](prd.md) | the spine everything downstream traces to. **Owner since 2026-10-07** — acceptance criteria, business rules (`BR-###`), and the full invariant list live here; `seed/idea.md` §7 and §9 keep only the short list. New features go into the seed first, then here |
| Success metrics and targets (90% accuracy; 70% / 80% rethink lines; 5–10 testers) | [`seed/idea.md`](../seed/idea.md) §8–§9 | `prd.md` and `qa-test-plan.md` cite these, not restate different numbers |
| Assumptions register (`A-###`) | [`decision-ledger.md`](decision-ledger.md) §2 | every `[assumption]` tag in seed/, work/, or docs/ needs a line there |
| ID ranges in use (`F-###`, `INV-###`, `EV-###`) | [`decision-ledger.md`](decision-ledger.md) §1 | check before assigning a new ID; never reuse one |
| One-page business model | [`business-canvas.md`](business-canvas.md) | free tier with a monthly order limit, paid plan above it (ADR-005); limit and price not set. Also feeds the deck's "proposed use of funds" |
| Can we actually build/ship/comply with this, go/no-go | [`feasibility.md`](feasibility.md) | verdict GO-WITH-CUTS: synthetic chats only for build and demo; real Data Privacy Act (RA 10173) work deferred, with a gate before real chats |
| task queue durability, compliance posture for regulated data, and storage tiering | [`backend-infrastructure-skills.md`](backend-infrastructure-skills.md) | |
| Tech stack choice + why | [`stack-decision.md`](stack-decision.md) | Next.js + Supabase (ADR-008); AI provider picked by the accuracy spike |
| which crawling/RAG/orchestration/graph tools to use and when to skip them | [`core-architectural-engine-skills.md`](core-architectural-engine-skills.md) | |
| Architecture, data flow, integrations | [`sdd.md`](sdd.md) | server routes, data model, deletion job; decisions in ADR-009 |
| Design inputs (brand, must-have screens, a11y) | [`design-brief.md`](design-brief.md) | UI itself belongs to the human designer. §0 is **not yet** (founder designing, ADR-010) — no UI, scaffold, or handoff packet, including the AI spike, until a design exists |
| which visualization/streaming/citation approach to use, and where the simpler option beats the advanced-sounding one | [`frontend-ux-deep-insights-skills.md`](frontend-ux-deep-insights-skills.md) | |
| Anti-slop rules, Delivery Gate, reserved `INV-AS-###` | [`anti-slop-guardrails.md`](anti-slop-guardrails.md) | required before any build task is marked `done`; conflicts with the design brief go to `decision-ledger.md` |
| keeping AI sessions lean / within budget | [`token-efficiency-guardrails.md`](token-efficiency-guardrails.md) | |
| Tests, traceability (`TC-###`) | [`qa-test-plan.md`](qa-test-plan.md) | every `F-###` ≥1 test, every `INV-###` ≥1 negative test; Delivery Gate first |
| What happens after the hackathon | [`gtm.md`](gtm.md) | beachhead, channels, rollout gated on the Data Privacy Act check |
| Live execution state (`PH-##`, `TASK-###`) | [`implementation-plan.md`](implementation-plan.md) | the *only* status file — don't track progress elsewhere |
| One task's bounded brief | [`handoff/TASK-###.md`](../handoff/) | one packet per work session |
| Pitch structure + judge Q&A prep | [`pitch-deck-outline.md`](pitch-deck-outline.md) | application deck: PDF, under 30 slides, Ideation stage — no live demo |
| Pivots, rejected options, decisions | [`decision-ledger.md`](decision-ledger.md) | log before you edit downstream docs |

**Allowed restatements** (summaries that cite their owner and must stay identical to it):
`seed/idea.md` §3 ← `work/evidence-ledger.md`; `seed/idea.md` §5 ← `seed/market.md`;
`seed/idea.md` §4 ← `work/problem-capture.md`. When the owner changes, update the summary in the
same sitting.

## 1. Document suite status

**Upstream inputs (Stages 1–2):**

| Document | Status | Last updated |
|---|---|---|
| seed/context.md | Draft — open: mentor, PSC guidelines, later dates, team skills | 2026-10-07 |
| seed/idea.md | Draft — all sections filled; status `unvalidated-by-choice` (0 interviews); both account types (ADR-012) | 2026-10-08 |
| seed/market.md | Draft | 2026-10-08 |
| work/problem-capture.md | Draft (second pass) | 2026-10-07 |
| work/market-scan.md | Draft | 2026-10-07 |
| work/evidence-ledger.md | Draft — EV-001 to EV-024; all five tests `unknown` | 2026-10-07 |
| work/interview-guide.md | Ready to use | 2026-10-07 |
| work/system-flow-explainer.md | Team input — Way 1 and Way 2 both in the MVP (ADR-012) | 2026-10-08 |

**Spec suite (Stage 3):**

| Document | Status | Last updated |
|---|---|---|
| index.md | Draft | 2026-10-08 |
| brd.md | Draft | 2026-10-08 |
| prd.md | Draft — F-001–F-007 (F-006 built last, ADR-012); reserved INV kept/waived per ADR-006 | 2026-10-08 |
| business-canvas.md | Draft — revenue model chosen (ADR-005); limit and price open | 2026-10-08 |
| feasibility.md | Draft — GO-WITH-CUTS | 2026-10-08 |
| stack-decision.md | Decided (ADR-008) — AI provider pending the spike | 2026-10-08 |
| sdd.md | Draft (ADR-009, ADR-012) | 2026-10-08 |
| design-brief.md | Draft — §0 not yet (founder designing) | 2026-10-08 |
| anti-slop-guardrails.md | living (system default) | |
| token-efficiency-guardrails.md | Draft | |
| core-architectural-engine-skills.md | Draft | |
| frontend-ux-deep-insights-skills.md | Draft | |
| backend-infrastructure-skills.md | Draft | |
| qa-test-plan.md | Draft — 45 feature tests, 28 negative tests, all `not run` | 2026-10-08 |
| gtm.md | Draft — rollout by conditions (PSC dates unknown) | 2026-10-08 |
| implementation-plan.md | Living — 20 tasks in PH-01 – PH-03; PH-01 blocked on the design gate (ADR-010) | 2026-10-08 |
| pitch-deck-outline.md | Draft — 15 slides mapped to PSC's required sections; interview counts and mentor to fill | 2026-10-08 |
| decision-ledger.md | living — ADR-001 to ADR-012 (ADR-011: product name MabiList; ADR-012: both ways in the MVP), three pivots/scope changes | 2026-10-08 |
| ../Project_Document.md | Draft — PSC project document (sections I–X, from the files above); mentor name to fill | 2026-10-08 |
| ../Project_Document2.md | Draft — improved version of the PSC project document; mentor name to fill | 2026-10-08 |

*(Update `Status` to `Draft` → `Reviewed` → `Locked` as each doc matures. "Locked" means
changes require a `decision-ledger.md` entry, per `AGENT_ROUTING.md §6`.)*

## 2. Health check (run through this before calling the suite "submission-ready")

- [x] Every `F-###` in `prd.md` has ≥1 `TC-###` in `qa-test-plan.md`. *(MVP features F-001 –
      F-007; F-006 added 2026-10-08 as TC-033 – TC-043.)*
- [x] Every `INV-###` has ≥1 negative test in `qa-test-plan.md`. *(Every kept invariant;
      waived ones per ADR-006 have none; webhook cases TC-N20 – TC-N28 added 2026-10-08.)*
- [x] `INV-AS-001` through `INV-AS-005` are listed in `prd.md §5`, or each missing one has a
      waiver in `decision-ledger.md`. *(Confirmed 2026-10-07: all five, none waived.)*
- [ ] Every `done` task has a Delivery Gate pass logged in its `handoff/TASK-###.md`.
- [ ] No document restates a fact owned by another (§0 respected).
- [x] `feasibility.md` has an explicit go / go-with-cuts / no-go verdict, not just analysis.
- [ ] `implementation-plan.md` has exactly one `PH-##` marked `open`. *(None open by design until
      the design gate moves — ADR-010.)*
- [x] Every number in `pitch-deck-outline.md` traces to `seed/`, `work/`, or `business-canvas.md`.
      *(Checked 2026-10-07; recheck after filling interview counts.)*
- [ ] `decision-ledger.md` reflects every pivot that actually happened — check against your own
      memory of the week, not just what got written down in the moment.
