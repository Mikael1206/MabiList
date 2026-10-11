# AGENTS.md — Philippine-StartUp-Challenge (FMD-Advanced)

The FMD-Advanced pipeline lives at the root of this repo, so any agentic coding tool picks up
this file and `.cursor/rules/` automatically.

## What this repo contains

- The planning/spec pipeline (seed → work → docs → handoff): `AGENT_ROUTING.md`,
  `HOW_TO_USE_FMD.md`, `Playbook.md`, and the `seed/`, `work/`, `docs/`, `handoff/` folders.
  Read `AGENT_ROUTING.md` before doing any planning or documentation work.
- Everything else — the actual product code, once `handoff/TASK-###.md` packets start landing.

## Rules for any agent working in this repo

1. **Documentation requests route through `AGENT_ROUTING.md`.** Don't freehand a
   PRD, pitch deck, or README section without checking whether a template already exists for it.
2. **Code changes should trace to a `handoff/TASK-###.md` packet.** If asked to build something
   with no packet, either write one first (using `handoff/TASK-000-template.md`) or flag that
   you're working outside the tracked plan.
3. **`docs/implementation-plan.md` is the only source of truth for what's done.** Don't infer
   completion from chat history; update the plan file itself.
4. **Never invent product facts.** Market size, competitor claims, and user needs live in
   `seed/` and `work/`. If it's not there, it's `[assumption]` or `unknown` — say so instead of
   guessing.
5. **Log before you change.** A pivot or scope cut gets a line in `docs/decision-ledger.md`
   before the affected docs are edited.
6. **Respect the designer.** UI/visual decisions belong to the human designer on this team.
   `docs/design-brief.md` is your input for consistency (copy, data shapes, brand tone) — it is
   not a spec to generate pixels from unless explicitly asked. Planning does not authorize
   scaffolding: if `docs/design-brief.md` §0 is `unanswered`, ask whether they have their own
   UI and stop.
7. **Anti-slop on every build.** Before writing UI, copy, or application code, read
   `docs/anti-slop-guardrails.md`. Do not mark a `handoff/TASK-###.md` `done` until §6
   Delivery Gate passes. Do not invent APIs, fabricate stats, ship dead controls, or put
   secrets in client code. If a guardrail conflicts with `docs/design-brief.md`, log it in
   `docs/decision-ledger.md` first.
8. **Token-efficiency.** Any coding-agent session should follow `docs/token-efficiency-guardrails.md`'s session-hygiene rules (§3) and diff-not-rewrite rule (§2).
9. **`exit fmd`** (typed by the founder, case-insensitive): delete only files you created or
   edited this session under `work/`, `docs/`, or `handoff/`. Never touch
   `seed/` — that's the founder's own input, not generated output.

## Commands

There are no build commands defined in the FMD pipeline itself — it's documentation only. Once
`handoff/TASK-001.md` (or later) creates real project scaffolding, add the actual dev/build/test
commands here.
