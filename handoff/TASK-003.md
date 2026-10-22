# TASK-003: Create owner-scoped extraction drafts

## Reference

- **Phase:** PH-01
- **Feature:** F-001
- **Design source:** `docs/design-brief.md` §0; backend route only
- **Invariants:** INV-001, INV-003, INV-008, INV-011, INV-013, INV-AS-001, INV-AS-002
- **Anti-slop:** `docs/anti-slop-guardrails.md`

## Scope

Implement authenticated text and screenshot extraction, retry, private source storage, OCR followed by Cloudflare Llama 3.3, strict draft validation, and safe upload states under `docs/sdd.md` §2. Accept synthetic data for evaluation only until the real-data gate clears.

## Write scope

- `backend/src/`, `backend/supabase/migrations/`, `backend/package.json`, `backend/README.md`
- `backend/eval/ocr.mjs`, `backend/supabase/tests/`, `docs/sdd.md` (draft quantity contract), `docs/decision-ledger.md` (ADR-017)
- This packet and `docs/implementation-plan.md` for verified status
- **Do not touch:** `web/`, `seed/`, other task packets.

## Spec

- `POST /api/extractions`: text JSON `{kind:"text",text}` or image multipart with `kind=image` and repeated PNG `files`.
- `POST /api/extractions/{uploadId}/retry`: owner-scoped retry of a failed stored source.
- Authenticate before reading the body. Derive owner from Supabase Auth; use that token for all database and private Storage calls.
- Cap daily requests with an explicitly configured limit; validate body sizes and PNG signatures.
- OCR images locally with Tesseract `eng+tgl`, send text to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, validate one order, store drafts only. Unknown values remain null.
- Store failed attempts as failed uploads with safe public errors; return raw chat only through the owner-authenticated temporary text preview, never in errors. Never expose provider output, tokens, or Storage paths.
- Return the SDD extraction response union and owner-authenticated source previews. Evidence may be empty when no match can be validated.

## Acceptance criteria

- Anonymous requests are rejected before body processing; cross-owner retries and previews are denied.
- Valid extraction creates a reviewable draft and upload status; failure never appears complete.
- Unknown quantities, prices, and dates remain unknown; no real chat is used in tests.
- Daily cap and invalid input return safe errors.

## Verify command

`cd backend && npm run check && npm test`

## Status

- **State:** in progress
- **Verify result:** `npm run check` passed and `npm test` passed 22/22 outside the sandbox to allow the existing localhost server test; `git diff --check` passed. Route tests cover authentication before body parsing, text and PNG drafts, unknown quantity, the daily cap, and a cross-owner retry refusal. The live MabiList database accepted both migrations; a read-back found nullable quantity and the reservation function, the transaction-based two-owner cap test passed and rolled back, and security advisors reported no findings. Full signed-in Storage and successful retry tests have not run. Multiple distinct orders, complete no-order detection, and the frontend's non-null quantity type still need resolution under ADR-017.
- **Delivery Gate:** fail (live route and Storage verification pending; extraction accuracy below target)
