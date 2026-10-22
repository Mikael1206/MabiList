# TASK-022: Pin the frontend/backend API contract

## Reference

- **Phase:** PH-01
- **Feature(s):** F-001, F-002, F-003, F-007
- **Design source:** `docs/design-brief.md` §0 (founder-owned, ADR-013); UI is out of scope.
- **Invariant(s):** INV-001, INV-002, INV-003, INV-AS-001, INV-AS-002
- **Anti-slop:** `docs/anti-slop-guardrails.md` §1–§3

## Scope — what this task IS

Document exact request/response examples and error behavior for the current core-loop API, then align shared TypeScript data and API types so the existing mock and future real adapter implement the same interface.

## Scope — what this task is NOT

- No real Next.js API routes, Supabase client/schema/migrations, authentication integration, AI provider, or external account integration.
- No layout, copy, or UI redesign; no broad mock behavior rewrite.
- No claim that this contract has been validated against a live backend.

## Write scope

- `docs/sdd.md` §2 and §4
- `web/lib/types.ts`
- `web/lib/api/index.ts`
- `web/lib/api/mock.ts` only if needed for type alignment
- `web/components/OrderForm.tsx` only to pass nullable unit-price data through the existing form contract
- `handoff/TASK-022.md`
- **Do not touch:** UI pages/components, migrations, env/config, other task packets, `seed/`.

## Spec

- JSON response bodies are resource-specific (`{order}`, `{orders}`, `{upload,drafts}`, or an extraction result union), not a generic success envelope.
- Errors use `{error:{code,message,fields?}}`; HTTP status is authoritative. Codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (400), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500). Messages are safe for display; field errors map field names to messages. No stack traces, provider output, tokens, or raw chat in errors.
- The browser never supplies `owner_id`; server derives owner from verified session and checks resource ownership.
- Money crosses JSON as PHP peso numbers with at most two decimal places; server calculations use integer centavos; null means unknown, zero is a valid amount.
- Extraction accepts pasted text as JSON `{kind:"text",text}` and images as multipart `files`; retry uses the upload ID in the route. Successful/readable extraction can return one or more drafts plus temporary source preview and field evidence. Image previews use an owner-checked backend URL; no private Storage path goes to the browser. Raw source/evidence follows ADR-013 batch resolution and seven-day expiry.
- `listOrders`/`getOrder` use the frontend adapter and backend GET routes under ADR-014; writes use backend HTTP routes as well. Batch resolution includes every unresolved draft for that source in one atomic request.
- `OrderInput` may omit item unit prices for compatibility with the current form; adapters serialize omitted prices as explicit `null`. Wire payloads always include `unit_price_php`.
- Profile data is stored in a `profiles` row and returned to the client as `Session {email, shop_name}`. HTTP-only session-cookie setup is part of the Supabase SSR implementation packet, not implemented here.

## Acceptance criteria

- WHEN the frontend calls an API function, the request and response shape SHALL match this contract and shared types.
- WHEN an API request fails, the backend SHALL return a stable safe error code/message and field errors where relevant.
- WHEN an owner-scoped resource is requested, the server SHALL derive and verify ownership; client-supplied owner IDs SHALL NOT authorize access.
- WHEN a money value is unknown, the API SHALL preserve `null`; it SHALL distinguish this from zero.

## Verify command

`git diff --check` (documentation and contract formatting). App lint/build/tests are intentionally deferred; this packet does not request running tests.

## Status

- **State:** in progress
- **Blocked reason:** none
- **Verify result:** `git diff --check` passed. App lint/build/tests were not run per session instruction; live routes are out of scope.
- **Delivery Gate:** not complete. No screen behavior was added; app execution and interactive checks remain unverified, so this packet stays in progress.
