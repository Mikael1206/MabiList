# MabiList web app

Next.js 16 + Tailwind 4. This directory owns the frontend screens, local API types, and API
adapter. The server lives in `../backend/`. Screens call the backend through same-origin `/api`
routes (forwarded by `next.config.ts`); sign-in goes straight to Supabase Auth. Frontend code does
not import backend source or query product tables directly.

## Commands

```bash
npm ci
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm test         # Vitest
```

Create `web/.env.local` (ignored by Git) before `npm run dev`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://elnytafhuuzkzzeyriov.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the project's publishable key>
# BACKEND_URL=http://127.0.0.1:3001   # default
```

Start the backend too (`cd ../backend && npm run dev`, with `backend/.env` filled from
`.env.example`), then create an account on the sign-up screen.

## Layout

| Path | What it is |
|---|---|
| `app/sign-in`, `app/sign-up` | Auth screens (Supabase Auth; tokens in localStorage) |
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
| `lib/api/` | `index.ts`: the only module that talks to the backend and Supabase Auth |
| `../backend/` | Independent server workspace; no source imports across the boundary |

## Not built yet

Connected accounts (waits for the real backend, F-006), Install MabiList, System states, Preview
first-run, and "Delete my logbook". See `../handoff/TASK-021.md` and `../handoff/TASK-022.md`.
