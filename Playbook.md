# Playbook (human-readable version of AGENT_ROUTING.md)

This is the same routing logic as `AGENT_ROUTING.md`, written for you instead of your AI
assistant. Read this once; let your agent read the other one every session.

## The four gates, in plain terms

**1. Seed — one honest sitting.**
Before you write a line of code or open Figma, fill `seed/idea.md` and `seed/context.md`.
This is the "who, what, why, under what constraints" — and it's supposed to be uncomfortable,
because it forces you to say what you *don't* know yet instead of hiding it behind confident
prose. Twenty minutes here saves you from building the wrong thing for three days.

**2. Work — go find out if you're right.**
Your idea makes claims (people have this problem, it's big enough, it's urgent). `work/`
is where you or your agent go check. Desk research counts. A few real conversations count
more. Write down what you found *and* what you couldn't find — "unknown, needs an interview"
is a completely legitimate line in `work/evidence-ledger.md`.

**3. Docs — the spec suite a judge (and your future self) can actually read.**
Everything here should trace back to seed/ and work/. If your agent starts writing things that
aren't grounded in those two folders, stop it — that's where AI-generated docs turn into
convincing-sounding fiction.

**4. Handoff — bite-sized build tasks.**
Don't hand your coding agent the whole `docs/prd.md` and say "build this." Hand it one
`handoff/TASK-###.md` packet at a time — a couple hours of scoped work with a clear "how do I
know this is done" check. You'll get better code and you'll actually be able to tell what's
finished. Before any packet is marked done, the agent must pass the Delivery Gate in
`docs/anti-slop-guardrails.md` — that stops generic AI-look UI, invented APIs, and insecure
defaults from shipping as if they were finished.

## Specific to the Philippine Startup Challenge (and similar DICT/PSIA-style challenges)

Based on how these competitions have historically run (verify current-year specifics against
your own event page — rules, tracks, and deadlines change year to year):

- **They're explicitly ideation-to-MVP stage.** You are not expected to ship a production
  system. A working, demoable slice that proves your riskiest assumption beats a half-broken
  "full" product every time. Let `docs/feasibility.md` and `docs/implementation-plan.md` keep
  you honest about scope.
- **Judging historically weighs problem legitimacy and business viability alongside the tech.**
  That's exactly why this pack has `docs/business-canvas.md`, `docs/feasibility.md`, and
  `docs/gtm.md` as first-class documents, not afterthoughts bolted onto a README.
- **Teams are typically small (historically ~3 students + 1 mentor)** and entries have
  historically had to fall within specific tech categories (e.g., software/IoT) set by that
  year's call for applications. Put your actual team composition and the current year's
  specific rules into `seed/context.md` — don't assume last year's rules still apply.
- **A crisp, evidence-backed pitch matters as much as the repo.** `docs/pitch-deck-outline.md`
  includes a judge-scrutiny section for exactly this reason — the questions you're most afraid
  of are the ones worth rehearsing.

Since you mentioned the specific Facebook post about this year's run wasn't something I could
open directly (Facebook blocks automated access), copy the actual rubric, tracks, and
deadline text into `seed/context.md` yourself, or paste it to your agent to fill it in — don't
let the templates run on stale assumptions about the rules.

## Where your own design skill fits

`docs/design-brief.md` is intentionally light. It captures brand tone, must-have screens, and
accessibility notes — enough for your agent to keep backend responses, copy, and data shapes
consistent with what you're designing — without trying to out-design a working UI/UX designer.
Fill it briefly, then go design; don't let an agent generate wireframes you didn't ask for.
Finished specs do not mean "start building": the agent must ask if you already have a Figma,
Canva, or file design, and wait if you don't.
If a brand choice conflicts with `docs/anti-slop-guardrails.md` (for example you *do* want a
purple gradient because it is the actual brand), log that in `docs/decision-ledger.md` —
don't let the agent silently drop either rule.

## A note on the "advanced" part

The most advanced thing in the source material this pack was built from wasn't a fancier
template — it was **discipline**: an ID spine that makes every feature traceable to evidence
and every evidence line traceable to a source, a ledger that logs pivots instead of quietly
rewriting history, and an explicit allowance for "unknown." Copy that discipline more than you
copy any specific file name.
