# MabiList web app

Next.js 16 + Tailwind 4. This directory owns the frontend screens, local API types, and API
adapter. The server lives in `../backend/`. Product routes from `../docs/sdd.md` §2 are not
built yet, so screens still run on the local mock adapter. The real adapter will call backend
HTTP routes for product data; frontend code does not import backend source or query product
tables directly.

## Commands

```bash
npm ci
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm test         # Vitest
```

Sign in with any email and a password of 8+ characters (mock rule). Shorter passwords show the
error state.

## Layout

| Path | What it is |
|---|---|
| `app/sign-in`, `app/sign-up` | Auth screens (mock session in localStorage) |
| `app/(app)/logbook` | Logbook: attention strip, drafts, filters, grouped orders |
| `app/(app)/add` | Add order: upload / paste, reading, every result state |
| `app/(app)/add/manual` | Enter order by hand |
| `app/(app)/orders/[id]` | Draft → "Check the entry"; confirmed → "Order detail" |
| `app/(app)/orders/[id]/edit` | Edit a confirmed order |
| `lib/types.ts` | Frontend view of the HTTP contract in `../docs/sdd.md` §2 |
| `app/(app)/totals` | Totals (still owed, sales, chart, counts, top items, due soon) |
| `app/(app)/settings/*` | Settings, shop name, account email, privacy and data, sign out |
| `lib/stats.ts` | Totals maths, mirroring the SDD statistics function |
| `lib/updates.ts` | Field-by-field changes an order-update draft proposes |
| `lib/types.ts` | Shapes from `sdd.md` §4 — change the SDD first |
| `lib/api/` | `index.ts` is the one mock/real switch; `mock.ts` is the stand-in |
| `../backend/` | Independent server workspace; no source imports across the boundary |

## Not built yet

Connected accounts (waits for the real backend, F-006), Install MabiList, System states, Preview
first-run, and "Delete my logbook". See `../handoff/TASK-021.md` and `../handoff/TASK-022.md`.
