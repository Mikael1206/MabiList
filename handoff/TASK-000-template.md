# TASK-000: {short title}

> **How to use:** Copy this file to `TASK-{next number}.md`, fill it in, then hand this single
> file to your coding agent (Claude Code, Cursor, etc.) as its *entire* task context — not the
> whole `docs/` folder. A packet should be scoped to roughly 1-3 hours of work. If it feels
> bigger than that, split it into two packets in `docs/implementation-plan.md` first.

## Reference

- **Phase:** PH-##
- **Feature(s):** F-###
- **Design source:** {link or path from `docs/design-brief.md` §0 — required for any UI packet; a UI packet with no source is invalid}
- **Invariant(s) this must respect:** INV-###, INV-AS-### (from `docs/anti-slop-guardrails.md` §4)
- **Anti-slop:** read `docs/anti-slop-guardrails.md` before writing code or UI

## Scope — what this task IS

{one or two sentences}

## Scope — what this task is NOT (explicit non-goals, prevents scope creep)

- Do not invent layout, palette, or components. Follow the design source above.
- {...}

## Write scope (files/paths this task is allowed to touch)

- {...}
- **Do not touch:** anything outside this list, `seed/`, or another task's write scope.

## Spec (state this BEFORE writing code — signature, data shape, edge cases)

*Per the SDD/PRD, not invented fresh here.*

- **Signature(s):** {...}
- **Data shape(s):** {...}
- **Edge cases to handle:** {...}
- **Edge cases explicitly deferred (and why):** {...}

## Acceptance criteria

*Copy the relevant EARS lines from `docs/prd.md` for this feature.*

- WHEN {...}, the system SHALL {...}.

## Verify command

*Must be a real, runnable command that fails on the current code and should pass once this
task is done. This is the fence — nothing is "done" without this going green.*

```
{command}
```

## Notes for the agent

- Read `docs/index.md` if you need to find where a fact lives — don't guess.
- Read `docs/anti-slop-guardrails.md` before writing UI, copy, or application code. Hard Gate
  (§1), Purpose-Gate (§2), and Quality Locks (§3) apply to this packet.
- This commit should contain no test files if a deferred-test workflow is in use (see
  `AGENTS.md`); otherwise, write the test alongside the change as your project's convention
  dictates.
- Return evidence when done: the Verify command actually run, its output, the Delivery Gate
  result, and the files touched — not just a claim that it works.

## Delivery Gate (from `docs/anti-slop-guardrails.md` §6)

*Required before this task can be marked `done`. Hard Gate and Security answers must be
**no**. Verification answers must be **yes**. Copy the filled result into Verify result
below — a claimed pass with no evidence does not count.*

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

## Status

- **State:** ready | in progress | blocked | done | cut
- **Blocked reason (if any):** {...}
- **Verify result:** {...}
- **Delivery Gate:** pass | fail (open items: {...})
