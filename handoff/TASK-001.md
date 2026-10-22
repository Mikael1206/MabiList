# TASK-001: AI extraction accuracy spike

## Reference

- **Phase:** PH-01
- **Feature:** F-001
- **Design source:** none; backend-only evaluation
- **Invariants:** INV-001, INV-003, INV-011, INV-AS-002
- **Anti-slop:** `docs/anti-slop-guardrails.md`

## Scope — what this task IS

Use the existing `web/` scaffold. Add a synthetic Taglish chat screenshot set, replaceable server-side Gemini and Cloudflare extraction adapters, and an evaluation command that scores both providers against the same labels. Report measured results before choosing a provider under ADR-008.

## Scope — what this task is NOT

- No frontend edits, live extraction route, database writes, real customer chats, or provider claim without measured output.
- No second Next.js scaffold or duplicated frontend test/lint setup.

## Write scope

- `backend/package.json`, `backend/src/extract-orders.mjs`, `backend/eval/**`, `backend/README.md`
- `handoff/TASK-001.md`, `docs/implementation-plan.md`, `work/evidence-ledger.md` for status and measured evidence
- **Do not touch:** `web/`, `seed/`, or another task's scope.

## Spec

- `extractOrders({ images, text }, { provider, ...credentials })` returns provider JSON for one conversation. Each image is a PNG byte buffer. Credentials stay server-side.
- Output schema: `{ orders: [{ customer_name, items: [{ name, quantity, unit_price_php }], total_php, delivery_date, payment_status }] }`; nullable unknown values; `payment_status` is `paid`, `unpaid`, or `not_stated`.
- Each fixture has synthetic dialogue and expected fields. Renderer creates screenshots from it. Scorer compares six field groups per order, separately reports key fields and guesses, and counts failed/invalid provider replies as wrong rather than omitting them.
- Live calls use a per-request timeout. No real conversations are permitted in the eval.
- Edge cases: omitted fields, corrections, paid/unpaid/unknown, multiple items, quoted prices, inquiry-only or multiple-order extraction deferred to later route/QA work.

## Acceptance criteria

- WHEN the full synthetic set runs through each candidate, report overall and key-field accuracy, guessed values, and median/slowest request latency (TC-008, TC-009).
- WHEN the chat omits a field, the model leaves it empty; any guessed value fails that field (TC-N06, INV-003).
- WHEN model output is malformed or the request fails, the evaluation records a failure and never reports a passing score for that case.

## Verify command

```sh
cd backend && npm run check && npm test && npm run eval:fixtures && npm run eval
```

The last command requires both providers' credentials and license setup, and exits nonzero if either is absent or either score falls below the rethink lines. Before credentials exist, run the first three commands and leave the task in progress.

## Delivery Gate

- **Hard Gate:** no UI or fabricated claims; no affected controls.
- **Code honesty:** provider calls checked against current official docs; no score reported without live output.
- **Security:** synthetic fixtures only; keys read from server environment, never frontend.
- **Verification:** local checks and screenshot inspection required; live provider check pending credentials.

## Status

- **State:** in progress
- **Blocked reason:** live two-provider evaluation requires provider credentials; Cloudflare model license must be accepted by the account owner.
- **Verify result:** `npm run check` passed; `npm test` passed (12/12); `npm run eval:fixtures` rendered 30 PNGs and one was visually inspected; `git diff --check` passed. `npm run eval` exited 2 with the explicit missing-credential message, so no provider score was measured.
- **Delivery Gate:** fail (live provider evaluation pending)
