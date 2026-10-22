# TASK-001: AI extraction accuracy spike

## Reference

- **Phase:** PH-01
- **Feature:** F-001
- **Design source:** none; backend-only evaluation
- **Invariants:** INV-001, INV-003, INV-011, INV-AS-002
- **Anti-slop:** `docs/anti-slop-guardrails.md`

## Scope — what this task IS

Use the existing `web/` scaffold. Add a synthetic Taglish chat screenshot set, replaceable server-side Gemini and Cloudflare extraction adapters, and evaluation commands that score candidates against the same labels. By ADR-015, include Hugging Face Inference Providers with Qwen3-8B as an OCR-text-only evaluation candidate. Report measured results before choosing a provider under ADR-008.

## Scope — what this task is NOT

- No frontend edits, live extraction route, database writes, real customer chats, or provider claim without measured output. Hugging Face evaluation is synthetic-only and does not change the production-provider decision.
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
- **Verification:** local checks and screenshot inspection required; Hugging Face live evaluation currently requires usable account credits or billing.

## Status

- **State:** in progress
- **Blocked reason:** Gemini 3.6 Flash's full run had 17 API failures (six HTTP 503 high-demand responses and eleven HTTP 429 quota responses). A later one-case OCR-first Gemini request using the latest key returned HTTP 500 (`Internal error encountered`), so the conditional 30-case run was not started. Cloudflare Llama 3.2 Vision returned prose despite a schema request. OCR-first Cloudflare Llama 3.3 70B returned valid responses for 15/15 cases but scored only 58.3% on key fields and made three guesses, below acceptance. The founder selected this OCR-first path for the next synthetic demo iteration under ADR-016; this does not waive TASK-001's accuracy gate or authorize real chats. The first OCR-first Hugging Face/Qwen3-8B request returned HTTP 402 and no extraction, so the conditional 15-case evaluation was not run.
- **Verify result:** `npm run check` passed; the extractor test passed; `npm test` previously passed (13/13); `npm run eval:fixtures` rendered 30 PNGs and one was visually inspected; `git diff --check` passed. On 2026-10-23, the Gemini 3.6 Flash one-case test with explicit schema returned valid JSON (50% overall, 25% key, 0 guesses, 0 invalid, 6,595 ms). The full 30-case run scored 31.7% overall and 25.8% key, with 17 failed/invalid cases, 0 guesses, median 3,582 ms, slowest 8,144 ms. The 13 valid replies alone scored 73.1% overall and 59.6% key; this diagnostic excludes API failures and does not satisfy acceptance. The full per-case output is in ignored `backend/eval/generated/results-gemini-3.6-flash-full.json`.
- **OCR-first alternative:** `npm run eval:ocr` uses local Tesseract with `eng+tgl`, records OCR character accuracy and transcript, and sends text to the provider. The Cloudflare OCR path uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; direct image evaluation retains the Llama 3.2 Vision model. On 2026-10-23 the 15-case Cloudflare run had 98.7% mean OCR character accuracy, 71.1% overall order accuracy, 58.3% key-field accuracy, three guesses, zero failed/invalid replies, 3,455 ms median, and 5,116 ms slowest request. It does not clear the 80% key-field rethink line. A one-case Gemini OCR-first retry with the latest key produced 98.9% OCR accuracy but Gemini returned HTTP 500 (`Internal error encountered`) in 2,671 ms; no extraction was scored and the conditional 30-case run was not started. The Hugging Face/Qwen3-8B one-case attempt produced 98.9% OCR character accuracy, then returned HTTP 402 in 1,838 ms; no extraction was scored and the conditional 15-case run was not started. The response body did not include a provider explanation, so the exact account/billing cause remains unverified. Reports are in ignored `backend/eval/generated/results-ocr-*.json`.
- **Delivery Gate:** fail (live provider evaluation pending)
