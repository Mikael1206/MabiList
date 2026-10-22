# System Design Document — MabiList

**Version:** 0.1 · **Status:** Draft

> **Agent instructions:** Design to the features in `prd.md`, not to an imagined "complete"
> system. If `stack-decision.md` hasn't been filled yet, do that first — this document
> depends on it.

*Written 2026-10-07 from `prd.md`, `stack-decision.md` (ADR-008), and `feasibility.md`. Design
decisions made here are logged as ADR-009; the Way 1 additions (F-006) as ADR-012 on 2026-10-08.
Library and platform calls are named at the level of "what", not exact function signatures —
confirm every API against the installed version and current platform docs at build time
(anti-slop Hard Gate).*

## 0. Accepted contract decisions — 2026-10-23 (ADR-013)

These decisions govern the design below. TASK-022 pins the frontend-facing contract and aligns
the existing types and mock; live API and database behavior remain unimplemented.

- **Prices:** `order_items.unit_price_php` is nullable; `orders.total_php` remains nullable.
  Calculate quantity × unit price using decimal money arithmetic when all items are priced;
  otherwise preserve an explicit order total or null. Return a review conflict if the stated
  total differs from the calculation; require seller resolution before confirming. Never map
  null to zero. The implementation contract uses PHP peso numbers with at most two decimal places
  and integer centavo calculations.
- **Payment and totals:** preserve `not_stated` rather than defaulting to unpaid. Amount owed
  includes only confirmed, priced, explicitly unpaid orders, whether delivered or pending.
  Return unknown-payment count separately. Period monetary totals use `confirmed_at` in
  Asia/Manila, Monday-start weeks; delivery-date lists are separate.
- **Review evidence:** provide owner-authorized temporary source access and field-to-source
  references. Highlight only validated matches. Treat copied excerpts/OCR text as raw content:
  do not copy them into permanent order fields, logs, or the offline cache. TASK-022 defines
  half-open text offsets and normalized image rectangles; matching and validation remain backend work.
- **Shared sources:** all confirm/discard/apply-update deletion references below mean source
  batch resolution when multiple drafts share an upload or extraction window. Review all such
  drafts together, then resolve them together; preserve the original seven-day expiry. Expiry
  removes unresolved drafts and raw content. Source cleanup must be retryable after storage
  failures and never reported complete until the raw content and evidence are gone.
- **Delete my logbook:** owner-authenticated operation removes orders/items, drafts, raw uploads,
  messages, conversations, review evidence, connections, and credentials; retains login/profile.
  Fence mutations and incoming/in-flight extraction writes before cleanup so late results cannot
  recreate deleted data. Unsubscribe channels and retry partial cleanup safely. Reconnection is
  explicit. Clear local logbook caches and invalidate other devices' caches on next contact;
  an offline device cannot be remotely cleared immediately. Endpoint and fencing mechanism are
  implementation-contract work, not existing routes.
- **Offline:** cache only the last successfully loaded owner-specific logbook, with a freshness
  timestamp. Reads only; no queued mutations, extraction, or raw-evidence cache. Clear cached
  shop data on sign-out/account switch and logbook deletion; reload on reconnect. Without a cache,
  show offline/error with retry. Never present cached values as current.

## 1. Architecture overview

*A short paragraph + a simple diagram (ASCII is fine) of the major components and how they
talk to each other.*

A Next.js web app in `web/` uses Supabase Auth for sign-in and its API adapter for product data.
An independent Node.js service in `backend/` owns all product-data reads and writes, uploads,
AI calls, deletion, platform tokens, and business rules. The intended browser path is same-origin
`/api`; routing and backend hosting are still to be set up (ADR-014). The backend verifies each
user and Supabase row-level security protects its owner-scoped database operations. One server
function calls the selected AI provider (`feasibility.md` §3). An hourly Supabase Cron job calls
a protected backend route to delete raw chat content before it turns 7 days old (INV-001).

Chats come in two ways (ADR-012). **Way 2** (built first): the owner uploads screenshots or pastes
text, and the extraction route answers with the draft directly. **Way 1** (built second): Meta
and Telegram send each new message on a connected Page, Instagram professional account, or shop
bot to a public webhook route; the route checks the platform's signature, stores the text under
the owner of that connection, answers the platform, and then runs the same `extractOrders()` on
the conversation. Because the owner didn't start that request, the backend must notify the open
logbook through an owner-scoped live channel; the transport is still to be chosen. The logbook
reloads on focus if live updates fail. No crawler, search index, agents, graph, or job queue —
`stack-decision.md` §1 and ADR-009 explain why none is needed.

```
 Browser (`web/`) ── sign-in ─────────────────────▶ Supabase Auth
      │
      └── product reads, uploads, writes via `/api` ──▶ Backend (`backend/`)
             ▲  owner-scoped live notifications            │
             └─────────────────────────────────────────────┤
                                                           ├──▶ Supabase Postgres + private Storage
 Meta / Telegram webhooks ─────────────────────────────────▶├──▶ AI provider (selected by spike)
 Supabase Cron (expiry) ────────────────────────────────────▶┘
```

## 2. Components

| Component | Responsibility | Maps to feature(s) |
|---|---|---|
| Sign-in pages | Email + password sign-up, sign-in, sign-out through Supabase Auth; everything else hidden until signed in | F-007 |
| Capture screen | Pick screenshots from the gallery or paste text; resize images in the browser; send them to the backend extraction route, which owns private Storage paths; show upload progress and retry without re-picking (INV-013) | F-001 |
| Review screen | Show a draft field by field, marking "not in chat" fields; edit; confirm or discard; for a matched update, show changes field by field and let the owner approve each one | F-002, F-005 |
| Logbook screen | Confirmed orders sorted by delivery date, filtered by payment/delivery status; count of drafts awaiting review; source of each order (BR-009); mark paid or delivered; live new drafts from connected accounts, with a "not live — reloading" notice if the connection drops; empty, loading, and error states | F-003, F-002, F-006 |
| Connected accounts screen | Connect Facebook (Pages + linked Instagram professional accounts) through Meta's login dialog; connect a Telegram bot by token; list connections with status (active / disconnected — reconnect); disconnect; list conversations whose extraction failed, with retry | F-006 |
| Statistics screen | Totals today / this week / this month, orders by status, unpaid amount, top items, deliveries due in 7 days, count of orders with no price; "sample data" label when applicable | F-004 |
| Extraction route | Check sign-in and ownership; enforce the daily upload cap; call `extractOrders()`; validate the result; save drafts; find a matching open order; record the upload's status | F-001, F-005 |
| `extractOrders()` adapter | The only code that talks to an AI provider. Sends the image(s) or text with fixed instructions, asks for JSON in the BR-002 shape, returns raw JSON to the validator. One implementation per provider; chosen by an environment variable | F-001 |
| Output validator | Accepts only the BR-002 fields with the right types; drops anything else; strips phone-number-like strings from names; turns missing values into "not in chat"; computes the order total from item prices (BR-005) | F-001, INV-001, INV-003 |
| Order routes | Confirm, edit, discard, apply-update, manual entry, mark paid/delivered — each checks sign-in, then ownership; confirm and discard delete the raw upload through the Storage API | F-002, F-005, INV-001, INV-006 |
| Statistics query | One database function computing every F-004 number from confirmed, priced entries in Asia/Manila time, run with the caller's permissions | F-004, INV-002 |
| Expiry job | Hourly Supabase Cron → `/api/jobs/expire-uploads` (shared secret) → deletes raw uploads and connected-account messages older than 6 days 23 hours (Storage API for files), deletes their drafts, marks the upload or conversation expired | F-002, F-006, INV-001 |
| Webhook routes | Public endpoints for Meta and Telegram. Check the signature or secret token before reading the body; find the connection by the platform's account ID; drop messages for unknown or disconnected accounts; store text messages once (unique platform message ID); mark the conversation pending; answer the platform; then run conversation extraction | F-006, INV-001, INV-AS-001 |
| Conversation extraction | Loads the conversation's messages in the BR-010 window plus its open order; enforces the daily AI cap; calls `extractOrders()` with text; runs the same validator; creates a draft (new order) or a proposed update (`matches_order_id` = the conversation's open order); records the conversation's status | F-006, F-005, INV-006, INV-013 |
| Connect routes | Meta: start the login dialog with a one-time `state` value, handle the callback, let the owner pick Pages, save each Page (and its linked Instagram professional account) with its token, subscribe the app to the Page's messages `[verify current Graph API steps]`. Telegram: check the bot token with the Bot API, register the webhook with a random secret token, save | F-006, INV-AS-002 |

**Core API contract — TASK-022, amended by ADR-014.** These routes belong to `backend/` and are
intended to appear under same-origin `/api` to the browser. The hosting/proxy and Supabase auth
credential transport are still to be decided; no product route is implemented yet. Except for
sign-in/sign-up/password reset, every user route rejects missing or invalid credentials before
processing the body, derives `owner_id` from the verified identity, and separately verifies
ownership of referenced rows (INV-AS-001). The browser never
sends `owner_id`. Route responses omit `owner_id`; it is a database field, not frontend data.
Requests with JSON use `Content-Type: application/json`. Product route responses are JSON except
the source-preview stream. Resource responses are
direct objects (no generic success envelope). The server validates all request data; TypeScript
types are not runtime validation.

Errors use `{ "error": { "code": "...", "message": "...", "fields": { "field": "..." } } }`;
`fields` is optional and maps request field paths to safe user-facing messages. The HTTP status
is authoritative. Codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
`VALIDATION_ERROR` (400), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).
Never return stack traces, provider output, secrets, or raw chat in an error. For repeated
confirm/discard, return `CONFLICT` if the resource is already resolved; clients may refresh.
Idempotency keys and a general retry guarantee are deferred until a concrete operation needs
them. The mock's internal simulated failure is not a wire error response.

Money in JSON is a number of Philippine pesos with at most two fractional digits; null means
unknown and zero means ₱0. The backend must validate finite non-negative values and at most two
decimal places, then calculate using integer centavos. `OrderItem.unit_price_php` is required
and nullable in responses and writes. `OrderInput` keeps `total_php` as the seller-confirmed
order total. Extraction drafts may also have `OrderItem.quantity: null` when quantity is absent
from the chat (ADR-017); confirmation requires a positive integer. The frontend's local type
must be reconciled before live integration. If every item has a known quantity and unit price,
the calculated total is quantity × unit price for each item. If this conflicts with an
explicitly supplied total, return `CONFLICT` with a field error until the seller resolves it;
do not silently choose one. When a quantity or price is unknown, an explicit order total may
still be recorded. Never infer zero from null.

Extraction sends pasted input as JSON `{ "kind": "text", "text": "..." }`; image input is
`multipart/form-data` with `kind=image` and repeated `files` parts. The frontend adapter maps its
`File[]` input to that multipart request. Retry has an empty JSON body. A successful `draft_ready`
response includes temporary source preview and field evidence alongside the drafts; `no_order`,
`unreadable`, and `failed` return the upload and a safe failure reason where applicable. Preview
access is owner-authenticated; image preview supplies a same-origin `preview_path` such as
`/api/uploads/{uploadId}/source`. The backend checks ownership and streams the private image;
it never returns a Storage path or public URL. Text evidence uses half-open character offsets into the preview text;
image evidence uses normalized `[0,1]` rectangles. Only validated evidence is returned. Raw
preview and evidence are erased together when the source batch resolves or its original seven-day
expiry arrives. The server must not persist evidence in order fields, errors, logs, or offline
cache.

**Examples** (IDs and values illustrative; auth transport omitted until integration is chosen;
no real owner identifiers are returned):

```http
POST /api/orders
Content-Type: application/json

{"customer_name":"Lyn Ramos","items":[{"name":"Brownie box","quantity":2,"unit_price_php":null}],"total_php":600,"delivery_date":"2026-10-21","payment_status":"not_stated"}
```

```json
{"order":{"id":"ord_123","upload_id":null,"source":"manual","state":"confirmed","customer_name":"Lyn Ramos","items":[{"id":"item_123","order_id":"ord_123","name":"Brownie box","quantity":2,"unit_price_php":null}],"total_php":600,"delivery_date":"2026-10-21","payment_status":"not_stated","delivery_status":"pending","not_in_chat":[],"matches_order_id":null,"is_sample":false,"confirmed_at":"2026-10-20T10:00:00Z","created_at":"2026-10-20T10:00:00Z","updated_at":"2026-10-20T10:00:00Z"}}
```

```json
{"error":{"code":"CONFLICT","message":"The item prices do not add up to the order total.","fields":{"total_php":"Review the order total or item prices."}}}
```

The frontend API adapter exposes `listOrders(): Promise<Order[]>` and
`getOrder(id): Promise<Order>`; the real adapter fetches `GET /api/orders` and
`GET /api/orders/{id}` and unwraps their JSON resource objects. The backend maps database rows
to owner-free responses. Discard returns HTTP 204 with no body. Extraction response union:

```ts
type ExtractionResponse =
  | { status: "draft_ready"; upload: Upload; drafts: Order[]; source_preview: SourcePreview; field_evidence: FieldEvidence[] }
  | { status: "no_order"; upload: Upload }
  | { status: "unreadable"; upload: Upload }
  | { status: "failed"; upload: Upload };
```

Each `FieldEvidence` has an `order_id`, `field`, and either text `start`/`end` offsets plus a
short matched quote, or a normalized image rectangle. Exact evidence storage and generation stay
behind the API; callers must not treat an absent match as evidence.

"Owner check" means the route verifies
the signed-in user on the server, then confirms the row's `owner_id` matches —
two separate checks (INV-AS-001). The routes use the signed-in user's Supabase client, so
row-level security applies as a third layer. Only the expiry job and the webhook routes use the
service key, because no user is signed in for them; webhook routes take the owner only from the
verified connection row, never from anything in the request (INV-AS-001).

| Route | Does | Owner check | Feature |
|---|---|---|---|
| `GET /api/orders` | Returns `{orders: Order[]}` for this owner; list includes drafts and confirmed orders | yes | F-002, F-003 |
| `GET /api/session` | Verifies the Supabase access token with Auth, then returns `{email,shop_name}` from the verified owner's profile | yes | F-007 |
| `GET /api/orders/{id}` | Returns `{order: Order}` for this owner's order | yes — referenced order | F-002, F-003 |
| `GET /api/uploads/{uploadId}/source` | Streams the private source image while its upload remains available; no public Storage URL | yes — referenced upload | F-002, INV-001 |
| `POST /api/extractions` | Text JSON or image multipart request per contract above. Returns `ExtractionResponse`; creates owner-scoped upload and drafts | yes — server owns all stored paths | F-001, F-005 |
| `POST /api/extractions/{uploadId}/retry` | Empty JSON body; reruns a failed extraction on stored upload; same response union | yes | F-001, INV-013 |
| `POST /api/orders` | Body: `OrderInput`; returns `{order: Order}` for manually confirmed entry | yes (owner from verified identity) | F-002 |
| `POST /api/orders/{id}/confirm` | Body: `OrderInput`; returns `{order: Order}`; sets state/confirmed_at. For shared sources, delete only after the full source batch resolves | yes | F-002, INV-001 |
| `PATCH /api/orders/{id}` | Body: partial `OrderInput` plus optional `delivery_status`; returns `{order: Order}` | yes | F-002, F-003 |
| `DELETE /api/orders/{id}` | Discards a draft; HTTP 204, no body. Delete its source only when the shared source batch resolves | yes | F-002, INV-001 |
| `POST /api/uploads/{uploadId}/resolve` | Body: `{resolutions:[{order_id,action:"confirm",values:OrderInput}|{order_id,action:"discard"}]}`; must include exactly one action for every unresolved draft tied to the source. Returns `{confirmed_orders,discarded_order_ids}`. Resolve atomically, then remove raw content/evidence. Single-order confirm/discard routes return `CONFLICT` when sibling drafts remain | yes; every draft must belong to this upload and owner | F-002, INV-001 |
| `POST /api/orders/{draftId}/apply-to/{targetId}` | Body: the fields the owner approved. Copies only those onto the target confirmed order, then deletes the draft and its raw upload | yes — both orders | F-005, INV-006 |
| `POST /api/jobs/expire-uploads` | Deletes overdue raw uploads and connected-account messages and their drafts; marks the upload or conversation expired | shared secret, not a user session | INV-001 |
| `GET /api/connect/meta/start` | Creates a one-time `state` tied to the session; redirects to Meta's login dialog asking only for the Page and Instagram messaging permissions F-006 needs `[verify exact permission names]` | yes (owner from session) | F-006 |
| `GET /api/connect/meta/callback` | Checks `state`, exchanges the code for tokens server-side, shows the owner's Pages to pick | yes — `state` must match the session | F-006 |
| `POST /api/connections/meta` | Body: chosen Page IDs. Saves a connection per Page (and linked Instagram account), tokens into `channel_secrets`, subscribes the app to each Page | yes — only Pages returned for this owner's login | F-006, INV-AS-002 |
| `POST /api/connections/telegram` | Body: bot token. Checks it with the Bot API, registers the webhook URL with a random secret token, saves the connection | yes (owner from session) | F-006, INV-AS-002 |
| `DELETE /api/connections/{id}` | Unsubscribes the Page or removes the bot's webhook, deletes the token, conversations' stored messages, and drafts from them; confirmed orders stay | yes | F-006, INV-001 |
| `POST /api/conversations/{id}/retry` | Re-runs a failed conversation extraction | yes | F-006, INV-013 |
| `GET`/`POST /api/webhooks/meta` | `GET`: Meta's verification handshake (verify token). `POST`: Messenger and Instagram message events, checked against `X-Hub-Signature-256` (HMAC-SHA256 of the raw body with the app secret) | signature, then owner from the connection row | F-006 |
| `POST /api/webhooks/telegram/{connectionId}` | Telegram updates for one bot, checked against `X-Telegram-Bot-Api-Secret-Token` | secret token for that connection, then owner from the connection row | F-006 |
| `POST /api/webhooks/meta/data-deletion` | Meta's data-deletion callback: deletes stored messages for the named user and returns a status reference `[verify Meta's required request and response format]` | Meta's signed request | F-006, INV-001 |

All product-data reads — logbook, drafts, upload statuses, private source images, and statistics
— go through the frontend API adapter to backend routes. Screens and the adapter do not query
product tables or Storage directly. The backend calls Supabase under verified owner identity
and row-level security. The exact statistics response and route will be pinned in its task packet.

## 3. Data flow

*Walk through one full user journey (`UJ-###` from prd.md) end to end at the system level.*

**UJ-001 — Log a new order from a chat**

1. The owner signs in with email and password; Supabase Auth sets the session (F-007).
2. On the capture screen they pick two screenshots of one conversation. The browser shrinks
   them `[proposed: longest side about 1,600 px]` and sends them as multipart files to
   `POST /api/extractions`. Progress shows; a failed upload can be retried from the same files
   still held by the page.
3. The backend verifies the user, checks the daily upload cap `[proposed — value set from the
   spike]`, stores the images in that owner's private Storage folder, and saves an `uploads` row
   with status `processing` and `expires_at` = upload time + 7 days.
4. The route downloads the images and calls `extractOrders()`. The instructions tell the AI that
   the chat is data, not instructions; to return only the BR-002 fields as JSON; to return
   `null` for anything not stated (INV-003); and to return one object per distinct order. The
   browser shows "Reading the chat…".
5. The validator checks the JSON. Unknown fields are dropped; names containing phone-number-like
   digit runs are cleaned (INV-001); missing fields become "not in chat"; if every item has a
   stated price, the server adds them up for the total, otherwise the total is empty unless the
   chat stated it (BR-005). Invalid output counts as a failed extraction.
6. For each order found, the route saves an `orders` row in state `draft` with its
   `order_items`, linked to the upload. It then looks for the owner's open orders (BR-008) with
   the same customer name, compared ignoring capitals and extra spaces. One match is saved as
   `matches_order_id`; several are offered as a list; none means a new order (F-005). The upload
   becomes `draft_ready`. If nothing is found, it becomes `no_order` and the raw upload is
   deleted at once. If the AI call or validation fails, it becomes `failed` with a reason and a
   retry button (INV-008, INV-013).
7. The route returns the drafts. The review screen shows every field, with "not in chat" fields
   marked. The owner fixes the delivery date and taps Confirm.
8. `POST /api/orders/{id}/confirm` re-checks identity and ownership, saves the owner's values, sets
   `state = confirmed` and `confirmed_at = now()`, deletes both screenshots through the Storage
   API, and marks the upload `consumed` with `raw_deleted_at` (INV-001).
9. The logbook and statistics screens update from the response without a page refresh, and
   reload when the app regains focus (F-003, ADR-009). Statistics count the order on its
   confirmation day in Asia/Manila (BR-004), once it has a total (INV-002).

**If the owner never confirms:** the hourly job finds the upload older than 6 days 23 hours,
deletes the screenshots through the Storage API, deletes its drafts (BR-001 has no third state),
and marks the upload `expired`. The upload row, which no longer holds any chat content, is what
lets the app tell the owner "A draft expired after 7 days" (F-002).

**UJ-005 — An order arrives from a connected account (Way 1)**

1. Earlier, the owner connected their test Page through Meta's login dialog (UJ-004). The Page's
   token sits in `channel_secrets`, which no browser can read.
2. A customer messages the Page. Meta sends a `POST` to `/api/webhooks/meta`. The route computes
   HMAC-SHA256 of the raw body with the app secret and compares it with `X-Hub-Signature-256` in
   constant time; a mismatch gets an error and nothing is stored.
3. The route finds the `channel_connections` row for the Page ID in the event. Unknown or
   disconnected Page: ignore. Otherwise it finds or creates the `conversations` row for that
   customer thread, inserts each text message into `chat_messages` (a repeat of the same platform
   message ID is skipped), and marks the conversation `pending`. Non-text messages are skipped
   `[proposed]`. The owner of every row comes from the connection, not the request.
4. The route answers Meta right away, then runs conversation extraction after the response
   `[choose and verify a post-response mechanism for the backend host; if it
   isn't reliable, a Supabase Cron sweep picks up pending conversations]`. If an extraction for
   that conversation is already running, the new message waits for the next run.
5. Conversation extraction loads the BR-010 window, checks the daily AI cap, and calls
   `extractOrders()` with the text, marking customer and owner turns. The validator runs as in
   UJ-001. If the conversation has an open order, the result is saved as a proposed update to it
   (F-005); otherwise as a new draft with `source = messenger` and `conversation_id` set. No
   order found: no draft. Failure: the conversation becomes `failed` with a retry (INV-013).
6. The owner's open logbook receives changes through the backend's owner-scoped live channel;
   the new draft appears without a refresh. If the connection drops, the screen says so and reloads on
   reconnect or focus (INV-008).
7. The owner confirms as in UJ-001 steps 7–8. Confirm deletes the conversation's `chat_messages`
   in the window used for that draft (INV-001); the conversation row keeps only the customer name,
   status, and open-order link.

Telegram is the same, except the update arrives at `/api/webhooks/telegram/{connectionId}` and is
checked against that connection's secret token. Messages the owner never confirms or discards
are deleted by the hourly job before 7 days.

## 4. Data model (summary — detail can live in a separate data-model.md if the project grows)

| Entity | Key fields | Notes |
|---|---|---|
| Owner | Supabase Auth user: `id`, email, password hash; `profiles` row: `owner_id` (primary key/FK), `shop_name` | Auth managed by Supabase. The profile supplies the shop name and is retained by Delete my logbook (ADR-013) |
| `uploads` | `id`, `owner_id`, `kind` (image / text), `image_paths` (text[]), `raw_text` (nullable), `status` (processing / draft_ready / no_order / failed / consumed / expired), `failure_reason`, `created_at`, `expires_at`, `raw_deleted_at` | The only place raw chat content lives. `raw_text` is set to null and Storage files are deleted on confirm, discard, no-order, or expiry (INV-001) |
| `orders` | `id`, `owner_id`, `upload_id` (nullable), `conversation_id` (nullable), `source` (screenshot / paste / manual / messenger / instagram / telegram — BR-009), `state` (draft / confirmed), `customer_name`, `total_php` (numeric, nullable), `delivery_date` (date, nullable), `payment_status` (unpaid / paid / not_stated), `delivery_status` (pending / delivered), `not_in_chat` (text[] of field names), `matches_order_id` (nullable), `is_sample` (boolean), `confirmed_at`, `created_at`, `updated_at` | BR-001 – BR-003. Drafts and confirmed orders share one table; totals filter on `state = confirmed` (INV-002). A draft with `matches_order_id` is a proposed update — the target keeps its confirmed values until the owner applies it (F-005). `is_sample` drives the "sample data" label (INV-009) |
| `order_items` | `id`, `order_id`, `owner_id`, `name`, `quantity` (positive integer or null on drafts), `unit_price_php` (numeric, nullable) | BR-002, BR-005, ADR-013, ADR-017. Retain unknown extracted values; seller resolves conflicting totals. Top items (BR-006) group by `lower` + collapsed spaces of `name` |
| `channel_connections` | `id`, `owner_id`, `platform` (messenger / instagram / telegram), `external_id` (Page ID, Instagram account ID, or bot ID; unique per platform), `display_name`, `status` (active / disconnected), `created_at` | F-006. Which connected account belongs to which owner. No tokens here |
| `channel_secrets` | `connection_id`, `access_token` (Page token or bot token), `webhook_secret` (Telegram) | F-006. Row-level security on with **no** policies, so only the service key can read it; never sent to the browser (INV-AS-002) |
| `conversations` | `id`, `owner_id`, `connection_id`, `platform_thread_id`, `customer_name`, `status` (idle / pending / processing / draft_ready / failed / expired), `failure_reason`, `open_order_id` (nullable), `window_start_at`, `last_message_at` | F-006. One customer thread on a connected account. Holds no message text |
| `chat_messages` | `id`, `owner_id`, `conversation_id`, `platform_message_id` (unique per connection — dedupe), `from_customer` (boolean), `text`, `sent_at`, `expires_at` | F-006. The only place connected-account chat text lives. Deleted on confirm, discard, no-order, disconnect, or expiry (INV-001) |
| Statistics function | Input: none (uses the signed-in owner). Output: totals today / week / month, counts by status, unpaid amount, top items, deliveries due in 7 days, count without a total | Runs with the caller's permissions, so row-level security applies. Dates use `confirmed_at` in Asia/Manila; Postgres weeks start on Monday, matching BR-004 |

Every table has row-level security: an owner can read only rows where `owner_id` equals their
user ID (`channel_secrets`: nobody but the service key). Database writes go through the server
routes; the backend writes screenshot files into the owner's private Storage folder. Never store phone numbers or addresses
(INV-001) — the schema has no column for them.

## 5. External integrations

*Cross-reference `prd.md §7` (Dependencies) — for each, note the actual API/SDK and the
fallback behavior if it's unavailable.*

| Integration | Purpose | Fallback |
|---|---|---|
| Supabase Auth (official JS client) | Email + password sign-in; sessions read on the server for every route | None needed for the demo beyond Supabase being up; check the project isn't paused (free projects pause after a week idle) |
| Supabase Postgres + row-level security | Orders, items, uploads, statistics function | Same project; open it in the days before the demo |
| Supabase Storage (private bucket) | Holds raw screenshots until confirm / discard / expiry | Paste-text capture still works if uploads fail |
| Supabase Cron | Hourly call to `/api/jobs/expire-uploads` | Vercel's daily scheduled job with a shorter cut-off — needs a ledger entry first (ADR-009) `[verify at setup that Cron can make HTTP calls on the free plan]` |
| Gemini API (Google's official JS SDK or REST) | Candidate AI provider; JSON output in the BR-002 shape | **Free tier: synthetic chats only** (ADR-008). If down or over quota: the upload shows as failed with retry, and the owner can enter the order by hand (F-002) |
| Cloudflare Workers AI (REST API), Llama 3.3 70B Instruct after Tesseract OCR | Selected for the next synthetic demo iteration (ADR-016); 15-case key-field accuracy is 58.3%, below the target. Do not process real seller chats until INV-011's privacy gate is cleared | Same as above. The direct Llama 3.2 Vision path is not selected; verify current model terms before deployment |
| Vercel Hobby | Planned host for the Next.js frontend; backend hosting and public webhook URL are pending ADR-014 integration work | Run the frontend locally with mock data until the backend is deployed |
| Live update transport (pending) | Backend relays owner-scoped draft and conversation status changes to the open logbook (F-006, ADR-014) | The logbook reloads on focus and on a manual refresh |
| Meta app — Messenger Platform and Instagram messaging (Graph API, webhooks) | F-006: Facebook Login for Pages, Page subscription, message webhooks, data-deletion callback. Development mode reaches only Pages and accounts where the team has a role; real sellers need App Review and possibly business verification `[verify]`; App Review asks for a privacy policy URL `[verify]` | Demo on the team's test Page and Instagram account; if Meta is down, Way 2 still works |
| Telegram Bot API | F-006: check the bot token, register / remove the webhook with a secret token, receive updates | Way 2 still works |

## 6. Security & data handling

*Cross-reference `feasibility.md §4`. What data is collected, where it's stored, who can see
it, and what happens to it after the hackathon.*

- **What's collected:** the owner's email and password hash; order fields per BR-002 (customer
  display name, items and quantities, total, delivery date, statuses); raw screenshots, pasted
  chat text, or connected-account message text, temporarily. For F-006: which Pages, Instagram
  accounts, and bots the owner connected, their tokens, and each customer thread's platform ID and
  display name. No phone numbers or addresses — no column exists for them, and the validator
  strips number-like strings from names (INV-001). Way 1 sends every customer message on a
  connected account to MabiList, including ones that aren't orders; those are deleted within 7
  days and never become drafts.
- **During development and the demo:** synthetic chats only (INV-011) — for Way 1, team members
  messaging the team's own test Page, Instagram account, and bot. Gemini's free tier never
  receives real chats (ADR-008).
- **Where it's stored:** Supabase in the Singapore region; Supabase encrypts data at rest
  (AES-256) and in transit (TLS). Both deployed apps must serve over HTTPS (INV-012). AI providers receive the
  upload only for the duration of the call; what each does with it is set by its terms
  (`feasibility.md` §4).
- **Who can see it:** only the owner who created it. Every server route checks the session, then
  ownership; row-level security enforces the same rule in the database; Storage paths are
  confined to the owner's folder (INV-AS-001). Tester accounts can't see each other's data — a
  QA negative test with two accounts proves it.
- **Webhooks:** the URLs are public, so every request is checked before anything is read or
  stored — Meta's `X-Hub-Signature-256` against the app secret, Telegram's secret-token header
  against that bot's secret, both compared in constant time. The owner is taken only from the
  matching connection row. Meta's login uses a one-time `state` value so a connection can't be
  attached to someone else's account.
- **How long raw chats live:** deleted on confirm/discard (source-batch resolution for shared
  sources), "no order found," disconnect, or logbook deletion, and by the hourly job before
  7 days (INV-001, ADR-013). Copied evidence follows the same rule. Order fields stay until
  Delete my logbook; account deletion remains a separate open question (`prd.md` §10).
- **Secrets:** the Supabase service key, AI provider keys, the job secret, the Meta app secret and
  webhook verify token live only in server environment variables; Page and bot tokens live only
  in `channel_secrets`. None are ever in client code, `NEXT_PUBLIC_` variables, or the repo. The
  browser gets only Supabase's public key for Auth; product tables and private Storage are
  accessed through the backend, with row-level security on every table
  (INV-AS-002).
- **Untrusted chat content:** chat text is passed to the AI as data; the AI's output is validated
  against the BR-002 fields before anything is saved; database access goes through the Supabase
  client's parameterized queries, never string-built SQL (INV-AS-003). No AI-generated code is
  executed (ADR-006).
- **Passwords:** handled by Supabase Auth, which stores bcrypt hashes.
- **After the hackathon:** the demo data is synthetic and can be deleted with the project. Before
  any real seller uses it, clear the `feasibility.md` §4 gate and log it. No compliance is claimed
  (INV-010).

## 7. Known limitations / technical debt (be upfront)

*What corners are being cut for the demo, and what would need to change for real use? This
section makes your feasibility.md's "go-with-cuts" verdict concrete.*

| Limitation | Why (time/scope reason) | What real use would require |
|---|---|---|
| Synthetic chats only; Gemini free tier allowed only for those | Data Privacy Act gate not cleared; Gemini free-tier terms (ADR-008) | The `feasibility.md` §4 gate, and a provider that doesn't train on inputs |
| Vercel Hobby is for non-commercial use only | ₱0 budget | A paid Vercel plan or another host before the paid plan starts (ADR-005, ADR-009) |
| Supabase free project pauses after a week idle, which also stops the deletion job | ₱0 budget | A paid Supabase plan; until then, overdue uploads are deleted on the first run after resuming |
| No automatic backups on Supabase Free | ₱0 budget | A paid plan or scheduled exports |
| One AI call per upload awaited by the browser; no job queue | Simplest design that keeps failures visible (INV-013) | A background queue if calls regularly approach the 300-second limit or volume grows |
| Realtime is used for Way 1 drafts; owner edits on one device reach another open device through the same subscription, but a dropped connection falls back to reload on focus | ADR-012 replaced ADR-009 item 4 for Way 1 | Nothing more unless the pilot shows missed updates |
| Way 1 works only on the team's own test Page, Instagram account, and bot until Meta App Review (and possibly business verification) passes | Meta's development mode; review takes time `[verify]` | App Review with a privacy policy URL and screencast; business verification if Meta asks |
| Telegram: customers message the shop bot, and the owner can't reply from their own Telegram app | Bot API design; Telegram Business connected bots would let the owner reply from their own account, and the Bot API 10.0 changelog (May 2026) says "Secretary Bots" no longer need Premium `[verify this covers our case]` | Decide after testing whether to support connected bots or keep bot-only |
| Way 1 reads text only; photos (such as GCash receipts), voice notes, and stickers are skipped | Keeps the AI call text-only and cheap `[proposed]` | Add image messages if sellers ask |
| Way 1 extraction runs after the webhook answer, inside the same function call | No job queue | A queue if bursts of messages pile up or calls time out |
| Messages sent while Supabase or the backend is down may be lost after the platform stops retrying `[verify each platform's retry window]` | Free tiers; no queue | Keep both services ready before demos; paid plans for real use |
| Vercel Hobby is non-commercial and Meta App Review expects a stable public app | ₱0 budget | Paid hosting before real sellers connect |
| Customer matching for F-005 is by exact name (ignoring capitals and spaces) | Simple and predictable; the owner always confirms (INV-006) | Better matching only if the pilot shows misses |
| No audit or access log | INV-014 waived (ADR-006) | Revisit if the Data Privacy Act review finds a processing record is needed |
| Account deletion remains unspecified; logbook deletion is accepted but unbuilt | ADR-013 retains login/profile while clearing the logbook and disconnecting channels | Implement logbook cleanup with retry and write fencing; decide account deletion separately |
| Daily AI cap value unknown (uploads plus connected-account extractions) | Depends on the spike's measured AI quota use | Set the cap from measured numbers |
| Image size and per-upload limits are proposals | Not yet measured | Tune after the spike |

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial design (ADR-009) |
| 2026-10-08 | Way 1 (F-006) added: webhook, connect, and conversation routes; `channel_connections`, `channel_secrets`, `conversations`, `chat_messages`; `orders.source` and `conversation_id`; Supabase Realtime; UJ-005 data flow; limitations (ADR-012) |
