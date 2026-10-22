# TASK-021: Frontend scaffold, mock API layer, and core-loop screens

> Proposed in `work/frontend-kickoff-plan.md` §5. Not yet added to `docs/implementation-plan.md`,
> and `docs/design-brief.md` §0 / `docs/decision-ledger.md` are not yet updated. Those shared files
> were deliberately left untouched to avoid merge conflicts with teammates' branches (Yancy,
> 2026-10-22). Apply them in one small docs commit once the team agrees.

## Reference

- **Phase:** PH-01 (pending opening)
- **Feature(s):** F-001, F-002, F-003, F-007 (UI only, against the mock)
- **Design source:**
  - Figma design: https://www.figma.com/design/2QHsLrO5ElGW2RpWUBjQ96/Mabilist (Page 1, 39 frames)
  - Figma Make prototype: https://www.figma.com/make/ekR2zUP2Glr5Gl7z0I1Wal/Prototype-MabiList-PWA
  - Frames used here: `Sign-in` 1:1982, `Logbook/all` 20:1746, `AddOrder` 20:3296,
    `AddOrder/readingSS` 20:3779, `AddOrder/enterOrder` 20:4135, `Today'sLogbook/edit` 20:3161
- **Invariant(s) this must respect:** INV-001 (7-day / delete-on-confirm copy), INV-002 (no price →
  not in totals), INV-003 (**Not in chat**, never a guessed value), INV-009 (Sample data label),
  INV-AS-001 (no secrets in client code), INV-AS-005 (no dead controls)
- **Anti-slop:** `docs/anti-slop-guardrails.md` read before writing code

## Scope — what this task IS

Create the Next.js app in `web/`, the shared types from `docs/sdd.md` §4, a mock API layer
(one function per `sdd.md` §2 route), and the core-loop screens from the frames above.

## Scope — what this task is NOT

- No backend: no Supabase client, no `app/api/` routes (Tyrone's scope).
- No Totals, Settings, Sign-up, Forgot password, Connected accounts, or several-orders / match
  screens yet; each gets its own packet.
- Do not invent layout, palette, or components beyond the design.

## Write scope

- `web/**` (new folder)
- `handoff/TASK-021.md` (this file)
- **Do not touch:** `seed/`, `docs/`, root `.gitignore`, `AGENTS.md`, or any other shared file.

## Spec

- **Types:** `web/lib/types.ts`, field names and allowed values copied from `sdd.md` §4
  (`orders`, `order_items`, `uploads`).
- **API:** `web/lib/api/index.ts` exports `createExtraction`, `retryExtraction`, `listOrders`,
  `getOrder`, `createManualOrder`, `confirmOrder`, `discardDraft`, `updateOrder`. The mock lives in
  `web/lib/api/mock.ts`; the real `fetch` version is added per route as Tyrone's routes land.
- **Edge cases handled in the mock:** `no_order`, `failed` (with `failure_reason`), unreadable,
  draft with `not_in_chat` fields, price-less draft.
- **Deferred:** real auth (sign-in screen validates input and calls a mock session), live updates.

## Verify command

```
cd web && npm run lint && npm run build && npm test
```

## Built (2026-10-22)

Screens: Sign in (+ error, forgot-password notice), Sign up, Logbook (sample badge, attention
strip, drafts banner + rows, filters, grouped list, loading / empty / no-match / error), Add order
(choose, paste, reading, unreadable, no order, failed + retry, upload limits, interrupted, several
orders, design's "sample input states" panel shown only on the mock), Enter by hand, Check the
entry (draft, Not in chat chips, confirm / delete with confirmation), Order detail (Mark
delivered, Edit), Edit order.

**Deviations / open questions for the team:**
- **Shop name** (sign-up, logbook header) has no home in `sdd.md` §4 (no profile table) → Tyrone.
- **"Unreadable" result** is not an `uploads.status` value in the SDD; the mock returns it as its
  own extraction result → agree the response JSON with Tyrone.
- **Chat excerpt panel** on "Check the entry" not built: the API doesn't return chat text to the
  browser yet, and showing it must respect INV-001.
- **"Delete Rico's order"** on Order detail and **"Changes from chat"** (F-005) not built: the
  SDD only allows deleting drafts; F-005 is TASK-009.
- **Several orders** frame wraps oddly in Figma; built as a clean row list.
- **Totals / Settings** nav items shown disabled (no dead links) until their packets.
- Next 16 dev overlay flags "instant navigation" on the signed-in pages because the mock session
  is client-only; goes away when Supabase Auth checks the session on the server (TASK-002).

## Status

- **State:** in progress — Delivery Gate items below need a teammate click-through
- **Verify result:** `npm run lint` clean · `npm run build` passes (11 routes) · `npm test` 10/10
  (2026-10-22). Clicked through in a 375×812 browser: sign-in error → sign-in → logbook → paste
  chat → reading → check entry → confirm → logbook shows the order; order detail → Mark
  delivered; several-orders sample state.
- **Delivery Gate:** partial —
  - Hard Gate: no dead controls (Totals/Settings disabled, not links); sample data labelled; every
    screen has loading / empty / error states. Placeholder "Not mentioned in chat" uses the
    design's 50% ink, which is below WCAG AA for text → ask An-joe.
  - Security: no secrets, env vars, or API keys in `web/` (grep clean); no tables yet.
  - Not verified: upload path with real image files, keyboard-only pass, screen reader pass.
