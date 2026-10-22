# TASK-022: Totals, Settings, chat excerpt, delete order, order updates (frontend, mock API)

> Requested by Yancy on 2026-10-22, after TASK-021. Like TASK-021, shared planning files
> (`docs/implementation-plan.md`, `docs/decision-ledger.md`, `docs/sdd.md`) are left untouched to avoid
> merge conflicts; the spec changes below must be logged there in one docs commit.

## Reference

- **Phase:** PH-01 / PH-02 frontend (pending opening)
- **Feature(s):** F-002, F-003, F-004, F-005, F-007 (UI only)
- **Design source:** Figma `Mabilist` frames `totals` 20:4463, `noSales` 20:4642, `settings` 20:4805,
  `Settings/shopName` 20:4948 (+ saved 20:5001), `Settings/accountEmail` 20:5054 (+ saved 20:5107),
  `Settings/privacy` 20:5910, `Sheet` 20:473 (order-update draft row), `Today'sLogbook/paid` 20:2940
  and `/unpaid` 20:2854 (Changes from chat, Delete order), `Today'sLogbook/edit` 20:3161 (chat excerpt)
- **Invariants:** INV-001, INV-002, INV-003, INV-006, INV-009, INV-AS-005

## Scope — IS

Totals (with no-sales state), Settings (shop name, account email, privacy and data, sign out),
chat excerpt on draft review, delete a confirmed order, order-update drafts (review changes one by
one, several possible matches, Changes from chat on order detail). Bottom nav Totals / Settings
enabled.

## Scope — NOT

- Connected accounts, Install MabiList, System states, Preview first-run rows (not requested;
  connected accounts must stay hidden until F-006 works — design-brief §2).
- "Delete my logbook" on the privacy page: account deletion is not in the MVP (prd §10,
  design-brief §2 "must not appear as a working control").

## Write scope

`web/**`, `handoff/TASK-022.md`. Nothing else.

## Spec changes this introduces (log in decision-ledger before backend work)

| Change | Why | Needs |
|---|---|---|
| `DELETE /api/orders/{id}` also deletes **confirmed** orders | Figma "Delete Rico's order"; user request 2026-10-22 | sdd.md §2 says drafts only — ADR needed |
| Drafts carry `chat_excerpt` (customer/seller lines + highlighted phrases) | Figma chat excerpt panel | Raw chat text reaches the browser while a draft exists; still deleted on confirm/discard/expiry (INV-001) |
| Confirmed orders carry `changes` (quote + field + before → after) | Figma "Changes from chat" | No table for it in sdd.md §4 |
| Drafts carry `match_candidates` (several open orders with the same customer) | design-brief §2 "several possible matches" | sdd.md has only `matches_order_id` |
| Shop name + email update | Figma Settings | Shop name has no table (TASK-021 open question) |

## Deviations from the design (flag to An-joe)

- Totals caption says sales are grouped by **delivery date**; ADR-007 / sdd.md count sales by
  **confirmation date** (`confirmed_at`, Asia/Manila). Built per the ADR; caption reworded.
- Privacy page says chats are removed "after 5 days"; INV-001 is **7 days**. Built with 7.
- Top items show "6 sold", not "6 boxes": the data model has no unit field.
- No Figma frame for reviewing an order update / picking between several matches; built from the
  "Check the entry" patterns. Needs a design pass.
- Settings rows not built are hidden, not shown as dead links.
- Logbook "Needs your check" filter lists the drafts **under** the filter chips, like the other
  filters' results (Yancy's call, 2026-10-22). Figma `Logbook/needs` 20:2254 keeps them above the
  chips with a "listed above" note. The "All" view still shows them above, as designed.

## Verify command

```
cd web && npm run lint && npm run build && npm test
```

## Status

- **State:** in progress — needs a teammate click-through and An-joe's review of the deviations
- **Verify result (2026-10-22):** `npm run lint` clean · `npm run build` passes · `npm test` 16/16.
  Clicked through at 375×812: Totals; Joanna order update (untick payment → apply 1 change →
  "Changes from chat" shows only the quantity); Carla several matches (pick → review → "Pick a
  different order"); Shop name save → logbook header updates; Sign out → signed-out logbook
  redirects to sign-in.
- **Not verified in the browser:** the two delete confirmations (native `window.confirm`; delete
  logic covered by unit tests), Account email save, Totals "no sales" preview toggle, keyboard-only
  and screen-reader passes.
