# Anti-Slop Guardrails

**What this is:** a compiled, FMD-compatible rulebook that stops the three most common ways an
AI coding agent produces "slop" when building a full-stack app: generic AI-look UI/copy,
dishonest or hallucinated code, and shippable-looking code that's actually insecure. It's
synthesized (not copy-pasted) from real, currently-maintained public projects — sources listed
below — and reframed to slot into the `fmd-advanced/` pipeline: it uses the same `INV-###`
(invariant) language as `seed/idea.md §9` / `docs/prd.md §5`, and its Delivery Gate runs
right before `docs/qa-test-plan.md`'s manual demo-day checklist.

**Canonical owner:** this file. Other docs link here; they do not restated the rules.

## Sources this was compiled from

| Source | What it covers | Link |
|---|---|---|
| `miqdadbadjuber/anti-slop` | Generic-AI-look UI/design/copy patterns, a purpose-test for visual technique, a Delivery Gate | github.com/miqdadbadjuber/anti-slop |
| "Anti-Sycophancy Code Discipline" rule, in `PatrickJS/awesome-cursorrules` | Hallucinated APIs/signatures, false-confidence validation, sycophancy resistance, comment honesty, verification rigor | github.com/PatrickJS/awesome-cursorrules (file: `rules/anti-sycophancy-code-discipline-cursorrules-prompt-file.mdc`) |
| `benavlabs/vibe-check` | A concrete full-stack security baseline (secrets, auth, injection, SSRF, headers, CORS/CSRF, payments, error handling) aimed specifically at AI-generated apps | github.com/benavlabs/vibe-check |

Worth knowing, for context: independent audits cited by these projects have found AI-generated
apps fail basic security checks at a high rate (figures in the 40-90%+ range depending on the
study and what counts as "critical"), and separate research found the majority of AI-generated
code samples that compile and run correctly are still not secure. The specific numbers move
year to year — treat them as "this is a real, common failure mode," not as a stat to quote in
your pitch deck.

## How this plugs into the FMD-Advanced pipeline

1. This file lives at `docs/anti-slop-guardrails.md`. Cursor also auto-attaches
   `.cursor/rules/anti-slop.mdc` so coding sessions pick it up without being asked.
2. `AGENT_ROUTING.md` routes any "build / generate UI, code, or feature" request here first.
   The Delivery Gate in §6 must pass before any `handoff/TASK-###.md` is marked `done`.
3. §4 invariants are folded into `docs/prd.md §5` as `INV-AS-001` through `INV-AS-005` so they
   sit in the same invariant list as product rules, not as a separate easy-to-ignore checklist.
4. The Delivery Gate is a hard prerequisite for `docs/qa-test-plan.md`'s demo-day checklist,
   not a replacement for it — this gate checks the code and design are honest and safe; the QA
   plan checks the features actually work.
5. If a rule below and `docs/design-brief.md` conflict (e.g., a brand direction genuinely
   calls for a technique this file is wary of), don't silently override or silently comply —
   name the conflict and log the decision in `docs/decision-ledger.md`.

---

## §1 — Hard Gate: never do these, no exceptions

These protect honesty, security, and basic usability. Breaking any of them is a fail regardless
of how good the reason sounds.

**Design & copy**
- No fabricated stats, testimonials, avatars, or "trusted by" logos. If you don't have real
  ones, ship none — an empty section beats a fake one.
- No dead controls: every button, link, and form must do something real, or it shouldn't exist.
  A genuinely-not-ready feature gets a visible "coming soon" label, not a silent no-op.
- No navbar/links to pages or sections that don't exist yet.
- Every screen needs an empty state, a loading state, and an error state — "only looks right on
  the happy path" isn't finished.
- Text must clear WCAG AA contrast (4.5:1 normal text, 3:1 for large text), and every
  interactive element must be reachable and usable by keyboard alone, with a visible focus ring.
- No invented compliance/performance/security claims ("SOC 2 compliant", "300% faster") without
  real evidence behind them.

**Code honesty**
- Never invent a library function, parameter name, or return type. If you can't confirm the
  call exists in the version actually installed (check the lockfile/manifest), say so instead
  of writing it anyway.
- "It compiles" and "it works" are different claims. Confirm the function does what its name
  promises, not just that it returns *something*.
- Never report a task as done based on what was attempted rather than what was actually run and
  verified. "I wrote it but haven't run the tests" is the honest version of an unfinished task.
- Never soften a real risk because the user seems impatient or in a hurry. Name the trade-off
  once, then comply with the decision — don't repeat the warning, and don't cave to a repeated
  "just ship it" by silently dropping the caveat.

**Security (full-stack baseline)**
- No secrets — API keys, DB credentials, tokens — in frontend code or in any env var exposed to
  the client (anything prefixed `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, or bundled). `.env` must
  be in `.gitignore` *before* the first commit.
- Every database table with row-level security available (Supabase, Firebase, etc.) gets it
  turned on, default-deny, before deployment — never a policy that resolves to "allow
  everyone."
- Every API route that reads or writes user data authenticates *before* the handler runs, and
  separately checks that the authenticated user actually owns the resource being accessed —
  those are two different checks, not one.
- User input never gets concatenated into a SQL query — parameterized queries or an ORM only.
- No `innerHTML`/`dangerouslySetInnerHTML`/`v-html` with unsanitized user content.
- Passwords hashed with bcrypt/Argon2/scrypt only — never MD5, SHA-1, or plain SHA-256.
- No public exposure of API docs (`/docs`, `/openapi.json`), source maps, `.env`, `.git/`, or
  debug/error pages in whatever you deploy for the demo.

## §2 — Purpose-Gate: technique is fine, "just because AI defaults to it" isn't

Nothing here is *banned* — a gradient, a glow, a card grid, a monospace font are all legitimate
tools. What's not allowed is using one of them because it's the recognizable AI-generated
default, with no actual reason. Before shipping any of the following, be able to state the
reason in one line; if you can't, cut it or rework it.

- A blue→purple / purple→pink gradient as the default palette (fine if it's genuinely your
  brand's palette, with a stated reason).
- Glassmorphism or glow effects on more than one or two elements at once.
- Sparkle/star/lightning/robot icons picked because they're generically "AI," rather than for
  relevance to the actual content.
- Large monospace headings or uppercase-with-wide-tracking labels used purely for "tech" vibes.
- The default AI landing-page skeleton: hero → 3 identical feature cards → "trusted by" logo
  bar → 3-tier pricing with the middle one highlighted → 4-column footer, with no variation
  reflecting your actual content.
- Generic CTAs ("Get Started", "Learn More", "Try Now") instead of something specific to the
  action ("Start Free Trial", "See the Live Demo").
- Marketing buzzwords with no content behind them: "AI-Powered," "Revolutionary," "Seamless,"
  "Next-Generation," "Cutting-Edge."
- Cloning the overall visual identity of a well-known product (Linear, Stripe, Notion, Apple)
  without being explicitly asked to.

The one-line test that catches most of this: *if you swapped the logo and product name, would
this still feel specific to your product — or could it be any hackathon app from the last two
years?* If the honest answer is "any hackathon app," it needs a pass.

## §3 — Quality Locks: consistency, not creativity

- Comments explain *why*, never *what the code already says*. Delete: decorative banner
  comments (`// ======`), step-numbered narration (`// Step 1: ...`), comments that just
  restate the function signature, vague TODOs with no actual task named, and comments that
  reference the task/ticket that produced them ("added for issue #42") — that belongs in the
  commit message, not the code, and rots the moment the code moves.
- Keep comments that explain business rules, a non-obvious workaround, a security or
  concurrency consideration, or an API's real-world quirk (e.g., "Stripe may redeliver this
  webhook up to 3 days later — dedupe on event ID"). Value, not length, is the bar — one line
  beats a paragraph almost every time.
- Palette capped at 2-3 core colors plus one accent; don't let 5+ colors creep in without a
  reason.
- Border radius, spacing, and shadow use should be consistent enough that they read as a system,
  not as "however that one component happened to come out."
- Before installing any new dependency, check it actually exists on the real package registry
  with a real version and reasonable history — don't let an agent `npm install` something it
  hallucinated. Pin exact versions for anything going in the submission; commit the lockfile.

## §4 — Guardrail invariants (fold these into `docs/prd.md §5`)

These IDs are reserved system-wide. Copy them into the PRD invariant list; do not renumber.

- **INV-AS-001 — auth:** the system SHALL NEVER return or modify another user's data based on a
  client-supplied ID without a server-side ownership check.
- **INV-AS-002 — secrets:** the system SHALL NEVER ship a secret key or credential inside
  client-bundled code or a public repo.
- **INV-AS-003 — injection:** the system SHALL NEVER build a database query by concatenating
  raw user input into a query string.
- **INV-AS-004 — claims:** the system SHALL NEVER display a statistic, testimonial, or
  compliance claim that isn't backed by a real, citable source.
- **INV-AS-005 — dead controls:** the system SHALL NEVER ship an interactive element with no
  real behavior behind it.

If a project genuinely does not apply one of these (e.g., no database, so INV-AS-003 is
vacuous), log the waiver in `docs/decision-ledger.md` — do not silently drop the ID.

## §5 — A short prompt for auditing an already-built app

If you're retrofitting this onto something your agent already built (rather than building with
these rules from the start), paste this to your agent:

> Audit this project against `docs/anti-slop-guardrails.md`. Go section by section (§1 Hard
> Gate, §2 Purpose-Gate, §3 Quality Locks, §4 Invariants). For each violation found, cite the
> specific rule, the file and line, and a one-line fix. Output this as a numbered list — don't
> fix anything yet. I'll tell you which numbers to act on.

This mirrors the "audit, don't auto-fix" pattern from `vibe-check`'s own checklist prompt — it
keeps you in control of what actually changes, which matters more the closer you are to a
submission deadline.

## §6 — Delivery Gate (run before any `handoff/TASK-###.md` is marked `done`)

Answer every item. All Hard Gate and Security answers must be **no**; all Verification answers
must be **yes**. Don't mark the task done with an open item — fix it first, then re-run.

**Hard Gate**
- [ ] Any dead button, link, or form with no real behavior?
- [ ] Any fabricated stat, testimonial, or trust badge?
- [ ] Any screen missing an empty/loading/error state?
- [ ] Any text failing WCAG AA contrast, or any control unreachable by keyboard?

**Code honesty**
- [ ] Any library call you didn't verify against the actual installed version?
- [ ] Any comment that just restates the code, or references a ticket/issue number?
- [ ] Any status reported as "done" without the corresponding command actually being run?

**Security**
- [ ] Any secret reachable from frontend code or a client-exposed env var?
- [ ] Any database table without row-level security / ownership checks in place?
- [ ] Any query built by string-concatenating user input?
- [ ] Any debug endpoint, API doc, or source map left publicly reachable in the deployed build?

**Verification**
- [ ] Did you actually run/build the app (not just read the code) before calling this done?
- [ ] Did you click through every changed interactive element and confirm what happened?
- [ ] For anything you couldn't verify, did you say so explicitly rather than guessing?

A gate with every Hard-Gate/Security box unchecked and every Verification box checked is a
pass. Log the result in the task's `handoff/TASK-###.md` "Verify result" field — a claimed pass
with no evidence attached doesn't count as one.
