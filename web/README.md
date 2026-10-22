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
| `lib/api/` | `index.ts` is the one mock/real switch; `mock.ts` is the stand-in |
| `../backend/` | Independent server workspace; no source imports across the boundary |

## Not built yet

Totals, Settings (incl. sign out), connected accounts, order-update matching (F-005), and the chat
excerpt panel on "Check the entry". See `../handoff/TASK-021.md`.
