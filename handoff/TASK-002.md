# TASK-002: Establish owner-scoped data and backend session checks

## Reference

- **Phase:** PH-01
- **Feature(s):** F-007 and the data foundation for F-001/F-002
- **Design source:** `docs/design-brief.md` §0 (founder-owned); no UI in this packet.
- **Invariant(s):** INV-001, INV-AS-001, INV-AS-002
- **Anti-slop:** `docs/anti-slop-guardrails.md` §1–§3

## Scope — what this task IS

Create a versioned Supabase migration for profiles, uploads, orders, items, owner-scoped row-level security, and a private upload bucket. Add an authenticated backend session endpoint that verifies a Supabase access token and reads only the verified owner's profile.

## Scope — what this task is NOT

- No frontend sign-in UI or live adapter, product CRUD/extraction routes, or deployment.
- No changes to existing non-MabiList Supabase projects.

## Write scope

- `backend/supabase/migrations/`
- `backend/supabase/tests/owner_isolation.sql`
- `backend/src/server.mjs`, `backend/src/server.test.mjs`, `backend/src/session.mjs`, `backend/src/session.test.mjs`, `backend/package.json`, `backend/README.md`
- `handoff/TASK-002.md`, `docs/implementation-plan.md`, `docs/sdd.md` §2, `AGENTS.md` commands
- **Do not touch:** `web/`, `seed/`, other task packets.

## Spec

- `GET /api/session` accepts a Supabase access token in `Authorization: Bearer ...`. It verifies the token with Supabase Auth before reading `profiles` under that same token. Response: `{email,shop_name}`. Missing/invalid token returns the contract's 401 error without user data.
- The browser does not send `owner_id`; server-derived identity and RLS scope all owner data.
- Upload objects live in a private bucket under `{owner_id}/...`; each storage operation checks the folder and object owner.
- The future same-origin frontend proxy may forward the access token from its HTTP-only session cookie. Its implementation remains a separate frontend integration task.

## Acceptance criteria

- WHEN a caller has no valid session, the backend SHALL refuse the session route with `UNAUTHENTICATED` and reveal no owner data.
- WHEN Owner B reads or changes Owner A's rows or files, row-level security SHALL deny it.
- WHEN the backend returns a session, it SHALL use the identity verified by Supabase Auth and that owner's profile.

## Verify command

`cd backend && npm run check && npm test`; apply both migrations to the dedicated MabiList Supabase project and run `backend/supabase/tests/owner_isolation.sql` against it. Check security advisors and verify the bucket is private. Full Storage download and sign-in/out browser checks remain part of TC-N14/TC-031.

## Status

- **State:** in progress
- **Blocked reason:** frontend sign-in/out and the same-origin auth handoff are still integration work; Storage download checks need real signed-in test accounts.
- **Verify result:** Local `npm run check` passed; `npm test` passed 5 tests outside the sandbox because localhost binding was denied inside it. Both migrations applied to MabiList Supabase project `elnytafhuuzkzzeyriov` in Singapore. Four public tables have RLS enabled; bucket `mabilist-uploads` is private. The transaction-based two-owner SQL test passed and rolled back its synthetic rows; security advisors returned no findings. `git diff --check` passed. Full sign-in/out and real Storage API download tests have not run.
- **Delivery Gate:** in progress. No UI was changed; code/security checks above passed, but live browser sign-in/out and Storage API tests remain open. Do not mark this packet done yet.
