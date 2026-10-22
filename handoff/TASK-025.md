# TASK-025: Separate the frontend and backend workspaces

## Reference

- **Phase:** PH-01
- **Feature(s):** F-001, F-002, F-007 (structure only)
- **Design source:** `docs/design-brief.md` §0 (founder-owned; no UI work)
- **Invariant(s):** INV-AS-001, INV-AS-002
- **Anti-slop:** `docs/anti-slop-guardrails.md` §1–§3
- **Decision:** ADR-014

## Scope — what this task IS

Give the backend an independent runnable directory while preserving the working frontend mock
and the TASK-022 HTTP contract. Correct the frontend type fixture affected by TASK-022.

## Scope — what this task is NOT

- No `shared/` package, live order/extraction routes, Supabase migration, or frontend redesign.
- No claim that the health endpoint proves any product feature works.

## Write scope

- `backend/package.json`, `backend/src/server.mjs`, `backend/README.md`, `backend/.gitignore`
- `web/lib/format.test.ts` (stale `owner_id` fixture only)
- `web/lib/types.ts`, `web/lib/api/mock.ts` (private image preview becomes a backend URL)
- `web/README.md` (workspace ownership and commands)
- `web/next.config.ts` (keep Next.js tracing and Turbopack inside `web/`)
- `docs/decision-ledger.md`, `docs/stack-decision.md`, `docs/sdd.md`, `docs/implementation-plan.md`
- `AGENTS.md` (developer commands only)
- `handoff/TASK-022.md`, `handoff/TASK-025.md` (reconcile the active contract packet)
- **Do not touch:** `seed/`, UI pages, feature routes, credentials, other task packets.

## Spec

- `web/` owns screens, frontend types, and its API adapter/mock. `backend/` owns future server
  routes, validation, all product-data reads and writes, jobs, and secrets. Neither directory
  imports source from the other.
- `docs/sdd.md` §2 is the HTTP request/response contract; changes to it are reviewed by both
  developers. Backend and frontend each keep their own local types, with no shared build package.
- Backend starts on `127.0.0.1:3001` by default. `GET /health` returns JSON; all other paths
  return 404. It does not expose product data or accept user writes.
- Preserve same-origin `/api` as the intended browser URL. Reverse routing and auth transport
  must be established before any live frontend/backend integration.
- `listOrders` and `getOrder` will fetch backend GET routes through the frontend adapter.
  Private source images will stream through an owner-checked backend route.

## Acceptance criteria

- WHEN either developer works in their directory, the other application SHALL not be required
  as a source dependency or build input.
- WHEN the backend process starts, `GET /health` SHALL respond without loading frontend code.
- WHEN the frontend remains on its mock adapter, existing screens SHALL keep their behavior.

## Verify command

`node --check backend/src/server.mjs`; `cd web && npm run lint && npm run build && npm test`;
run backend and request `/health`; `git diff --check`.

## Status

- **State:** done
- **Blocked reason:** none
- **Verify result:** `npm run check` in `backend/` passed; local `GET /health` returned 200
  with `{ "status": "ok" }`; `/api/orders` returned 404. In `web/`, `npm run lint` passed,
  `npm test` passed (10 tests), and `npm run build -- --webpack` passed including TypeScript.
  `git diff --check` passed. Next.js tracing/Turbopack roots are pinned to `web/`, removing the
  ambiguous root-lockfile warning. Default Turbopack build failed because the sandbox denied its
  CSS worker's local port; the Webpack build completed. The apps are not connected yet.
- **Delivery Gate:** pass for this structure task. No UI controls or screens changed. No
  unverified external API calls, client secrets, database queries, or data routes were added.
  Backend process and frontend build were run; interactive-element check is not applicable.
