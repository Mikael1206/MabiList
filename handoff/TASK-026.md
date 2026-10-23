# TASK-026: Demo data survives reloads, with a reset

## Reference

- **Phase:** Pitch demo (ADR-017)
- **Feature(s):** demo support for F-002, F-003, F-004 (mock adapter only)
- **Design source:** Figma design file `settings` 20:4805 (row style); `docs/design-brief.md` §0
- **Invariant(s) this must respect:** INV-009 (sample data stays labelled), INV-AS-001 (no secrets)
- **Anti-slop:** read `docs/anti-slop-guardrails.md` before writing code or UI

## Scope — what this task IS

Keep the mock adapter's orders (and later, connected-account state) in browser storage so a reload
during the demo doesn't lose what was just confirmed, and add a Settings row that restores the
seeded sample data.

## Scope — what this task is NOT

- No backend calls, no real persistence, no offline mode (that is TASK-024).
- No new layout: the reset row reuses the existing Settings row pattern.
- Do not invent layout, palette, or components.

## Write scope

- `web/lib/api/mock.ts`, `web/lib/api/mock.test.ts`
- `web/app/(app)/settings/page.tsx`
- `handoff/TASK-026.md`
- **Do not touch:** `backend/`, `docs/sdd.md`, other packets, `seed/`.

## Spec

- **Storage:** one key (e.g. `mabilist.demo-orders`); read once on module load, write after every
  mutation. Wrap every read/write in try/catch; on missing or broken data, fall back to `seed()`.
- **Reset:** `resetDemoData()` reseeds, writes, and is exported only from the mock adapter.
- **Settings row:** "Reset demo data — Restores the sample orders" shown only when `IS_MOCK`;
  asks for confirmation, then reloads the logbook.
- **Edge cases:** storage blocked (private mode) → app still works for the session; saved data
  from an older shape → fall back to seed.
- **Deferred:** auto-reseeding stale dates — not needed for a one-day demo (reset that morning).

## Acceptance criteria

- WHEN an order is confirmed and the page reloads, the system SHALL still show it.
- WHEN the seller taps Reset demo data and confirms, the system SHALL show the seeded sample
  orders and nothing added since.
- WHEN browser storage is unavailable, the system SHALL keep working for the current session.

## Verify command

```
cd web && npm run lint && npm test
```

## Status

- **State:** done
- **Blocked reason:** —
- **Verify result (2026-10-23):** `npm run lint` clean; `npm test` 20/20, including
  `lib/api/demo-storage.test.ts` (order kept after a module reload; new ids don't collide with
  saved ones; reset restores the seed; broken/older saved data falls back to the seed; blocked
  storage still works for the session). Production build passes. Browser: a draft created in the
  demo was still in the logbook after a full page load. Also fixed stale `stats.test.ts`
  fixtures (`unit_price_php`, `owner_id`) left by the TASK-022 type change; `tsc --noEmit` passes.
- **Delivery Gate:** pass — the reset row is a real control behind a confirmation; shown only on
  the mock adapter; no secrets; "Sample data" labels unchanged. The confirmation uses the
  browser's own dialog (not clicked through by the agent; logic covered by the unit test).
