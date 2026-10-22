# MabiList backend

This is the server workspace. It owns future API routes, input validation, order rules,
extraction, all Supabase product-data reads and writes, cleanup jobs, and server-only credentials. It imports no code from
`web/`. Implemented routes are `GET /health` and `GET /api/session`; product routes are still pending.

Run it locally with `npm run dev` from this directory. The default address is
`http://127.0.0.1:3001`; `HOST` and `PORT` can override it. No install step is needed yet because
the starter uses only Node.js built-ins.

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the backend process environment to enable
`GET /api/session`. That route requires `Authorization: Bearer <Supabase access token>`, verifies
it with Supabase Auth, then reads the owner's `profiles` row using the same token and row-level
security. Never pass an owner ID as a substitute for the token. Missing or invalid credentials
return `UNAUTHENTICATED`; missing configuration or an upstream failure returns `INTERNAL_ERROR`.
The response is `{email,shop_name}` and is marked `Cache-Control: no-store`.

The migrations in `supabase/migrations/` create owner-scoped tables, a profile signup trigger,
and the private `mabilist-uploads` bucket. They are applied to the dedicated MabiList project
`elnytafhuuzkzzeyriov` in Singapore (`https://elnytafhuuzkzzeyriov.supabase.co`). Run
`npm run check` and `npm test` locally. The transaction-based two-owner SQL check in
`supabase/tests/owner_isolation.sql` has passed there; browser sign-in and real Storage API
download checks remain for integration.

`docs/sdd.md` §2 owns the HTTP contract. `web/lib/types.ts` is the frontend's local view of
that contract; the backend will define and validate its own request data when routes are added.
There is no shared source package. An HTTP contract change needs review from both developers.
The frontend currently uses `web/lib/api/mock.ts` through `web/lib/api/index.ts`; it does not
call this process yet.

Before connecting the apps, establish same-origin `/api` routing to this service. The frontend
session layer can forward a verified access token to the backend; the browser-facing cookie and
refresh flow are still integration work. Hosting also remains open after ADR-014. Never put a
service key in `web/` or rely on an owner ID sent by the browser.

## TASK-001 accuracy spike

`src/extract-orders.mjs` has server-side Gemini and Cloudflare Workers AI adapters, plus an
OCR-text-only Hugging Face Inference Providers adapter for evaluation. The
`eval/` folder contains 30 **invented** Taglish conversations and their expected order fields.
`npm run eval:fixtures` renders them as PNG chat screenshots (requires ImageMagick's `magick`
command). Open a few images in `eval/generated/` to inspect them. That directory is ignored by
Git and can be regenerated from the committed fixtures.

Set `GEMINI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_AUTH_TOKEN` in the ignored
`backend/.env` file (or in the backend process environment). Run `npm run eval --
--provider=gemini` or `npm run eval -- --provider=cloudflare` to evaluate one provider, and
`npm run eval` to run both. Both candidate models process the same 30 images. The command prints overall accuracy, key-field accuracy, guessed-value count,
invalid/failed replies, and median/slowest provider response time. It writes per-case details
to ignored `eval/generated/results-<provider>.json` and exits nonzero below 70% overall, below 80% key,
or on provider failures. The Cloudflare adapter requests JSON Schema output and rejects replies
that are not one valid order. On the current Llama 3.2 Vision model, a live single-case request
still returned prose; JSON mode may not be supported for this model. Do not put any real customer chat in these fixtures or Gemini's free
tier. The Cloudflare account owner must first accept the model's Meta license by sending the
documented one-time `{"prompt":"agree"}` request. Do not automate that acceptance without
their approval.

The timing is **one provider extraction request**, not the full upload-to-draft path; TC-009's
end-to-end timing still needs the extraction route. The runner is an evaluation spike and does
not write to Supabase or choose a production provider automatically. Record actual results in
`work/evidence-ledger.md` and make the ADR-008 choice only after both runs.

To compare an OCR-first path, install Tesseract with English and Tagalog data (on Arch/CachyOS:
`sudo pacman -S tesseract tesseract-data-eng tesseract-data-tgl`; on Ubuntu/Debian, install
`tesseract-ocr`, `tesseract-ocr-eng`, and `tesseract-ocr-tgl`) and run `npm run eval:fixtures`, then
`npm run eval:ocr -- --provider=gemini` from `backend/`. Add `--limit=1` for a smoke test;
`--provider=cloudflare` uses the Cloudflare text extraction adapter; `--provider=huggingface`
uses the `Qwen/Qwen3-8B` text adapter and requires `HF_TOKEN` in the ignored `.env`. Start with
`--limit=1`; only expand after the smoke test succeeds and Hugging Face usage/billing allows it.
The Hugging Face adapter uses its OpenAI-compatible Inference Providers API with JSON-object
output mode. This runner reads
each PNG with local Tesseract OCR using both `eng` and `tgl`, sends **only the OCR transcript** to the AI provider, and
reports normalized character accuracy against the synthetic dialogue plus order-field accuracy.
It saves OCR transcripts, per-case scores, OCR time, and total OCR-plus-AI time in ignored
`eval/generated/results-ocr-<provider>.json`. OCR failures count as failed extractions. The
character score is diagnostic: it ignores case and punctuation, so inspect transcripts for
misread prices, quantities, speaker labels, and corrections. The same rethink lines apply.
For Cloudflare, this OCR-first runner uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (a text
model); the image-first evaluator continues to use the vision model.

For a Hugging Face OCR-first evaluation, set `HF_TOKEN` in `backend/.env` and run
`npm run eval:ocr -- --provider=huggingface --limit=1` first. It calls Qwen3-8B through
`https://router.huggingface.co/v1/chat/completions`; see the
[Hugging Face Inference Providers API](https://huggingface.co/docs/inference-providers/en/index).
Expand to 15 only after the one-case call succeeds and check account credits or billing first.
This adapter is an evaluation candidate, not a production-provider selection. Keep the token
server-side and use synthetic fixtures only.
