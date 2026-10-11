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

## 1. Architecture overview

*A short paragraph + a simple diagram (ASCII is fine) of the major components and how they
talk to each other.*

A Next.js web app, used in the phone browser, talks to Supabase for sign-in, data, and file
storage. Anything involving the AI, deletion of raw chat content, platform tokens, or business
rules runs in Next.js server routes on Vercel; the browser only reads its own data directly,
protected by Supabase's row-level security. The AI is called from one server-side function with
two interchangeable providers; the accuracy spike picks which one (`feasibility.md` §3). An hourly
Supabase Cron job calls a protected route that deletes raw chat content before it turns 7 days
old (INV-001).

Chats come in two ways (ADR-012). **Way 2** (built first): the owner uploads screenshots or pastes
text, and the extraction route answers with the draft directly. **Way 1** (built second): Meta
and Telegram send each new message on a connected Page, Instagram professional account, or shop
bot to a public webhook route; the route checks the platform's signature, stores the text under
the owner of that connection, answers the platform, and then runs the same `extractOrders()` on
the conversation. Because the owner didn't start that request, the new draft reaches an open
logbook through Supabase Realtime. No crawler, search index, agents, graph, or job queue —
`stack-decision.md` §1 and ADR-009 explain why none is needed.

```
 Phone browser (Next.js pages)
   │  ① sign in (email + password)          ┌──────────────────────── Supabase (Singapore) ─┐
   ├──────────────────────────────────────▶ │ Auth            (bcrypt password hashes)      │
   │  ② upload screenshots (resized)        │ Storage: private "chat-uploads" bucket        │
   ├──────────────────────────────────────▶ │   one folder per owner, row-level security    │
   │  ③ read own orders / stats             │ Postgres: uploads, orders, order_items,       │
   ├──────────────────────────────────────▶ │   channel_connections, conversations,         │
   │  ⑧ live new drafts (Realtime) ◀────────│   chat_messages; channel_secrets (no client   │
   │                                        │   access); row-level security on all          │
   │                                        │ Cron (hourly) ─────────────┐                  │
   │  ④ extract / confirm / edit / discard  └──────────▲─────────────────┼──────────────────┘
   │     connect / disconnect accounts                 │                 │ ⑥ HTTP + secret
   ▼                                                   │                 │
 Next.js server routes (Vercel, Singapore region) ─────┘                 │
   │  user routes: check sign-in, then ownership; validate AI output     │
   │  /api/jobs/expire-uploads ◀─────────────────────────────────────────┘
   │  /api/webhooks/meta, /api/webhooks/telegram/{id} ◀── ⑦ Meta / Telegram push each
   │     check signature or secret token first                 new message (Way 1)
   │  ⑤ one AI call per upload or conversation, behind extractOrders()
   ▼
 AI provider (chosen by spike):  Gemini API (free tier — synthetic chats only)
                                 or Cloudflare Workers AI (Llama 3.2 11B Vision)
```

## 2. Components

| Component | Responsibility | Maps to feature(s) |
|---|---|---|
| Sign-in pages | Email + password sign-up, sign-in, sign-out through Supabase Auth; everything else hidden until signed in | F-007 |
| Capture screen | Pick screenshots from the gallery or paste text; resize images in the browser; upload to the owner's Storage folder; show upload progress and retry without re-picking (INV-013) | F-001 |
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

**Server routes (API surface).** All take and return JSON. "Owner check" means the route reads
the signed-in user from the session on the server, then confirms the row's `owner_id` matches —
two separate checks (INV-AS-001). The routes use the signed-in user's Supabase client, so
row-level security applies as a third layer. Only the expiry job and the webhook routes use the
service key, because no user is signed in for them; webhook routes take the owner only from the
verified connection row, never from anything in the request (INV-AS-001).

| Route | Does | Owner check | Feature |
|---|---|---|---|
| `POST /api/extractions` | Body: pasted text, or the Storage paths of 1–5 uploaded screenshots `[proposed limit]`. Creates an `uploads` row, runs extraction, returns the drafts, or "no order found," or a failure | yes — the paths must sit in the owner's folder | F-001, F-005 |
| `POST /api/extractions/{uploadId}/retry` | Re-runs a failed extraction on the stored upload | yes | F-001, INV-013 |
| `POST /api/orders` | Manual entry: saves an owner-typed order as confirmed | yes (owner from session) | F-002 |
| `POST /api/orders/{id}/confirm` | Saves the owner's values, sets the state to confirmed and `confirmed_at`, deletes the raw upload | yes | F-002, INV-001 |
| `PATCH /api/orders/{id}` | Edits a confirmed order (any BR-002 field, including payment and delivery status) | yes | F-002, F-003 |
| `DELETE /api/orders/{id}` | Discards a draft and deletes its raw upload. Drafts only — deleting confirmed orders isn't in the PRD | yes | F-002, INV-001 |
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

Reads — the logbook list, drafts, upload statuses, and the statistics function — go straight
from the browser to Supabase under row-level security.

## 3. Data flow

*Walk through one full user journey (`UJ-###` from prd.md) end to end at the system level.*

**UJ-001 — Log a new order from a chat**

1. The owner signs in with email and password; Supabase Auth sets the session (F-007).
2. On the capture screen they pick two screenshots of one conversation. The browser shrinks
   them `[proposed: longest side about 1,600 px]` and uploads them to
   `chat-uploads/{owner_id}/{upload_id}/`. Storage row-level security lets an owner write only
   inside their own folder. Progress shows; a failed upload can be retried from the same files
   still held by the page.
3. The browser calls `POST /api/extractions` with the two paths. The route reads the user from the
   session, confirms the paths are inside that user's folder, checks the daily upload cap
   `[proposed — value set from the spike]`, and saves an `uploads` row with status `processing`
   and `expires_at` = upload time + 7 days.
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
8. `POST /api/orders/{id}/confirm` re-checks session and ownership, saves the owner's values, sets
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
   `[confirm the after-response mechanism against the installed Next.js / Vercel versions; if it
   isn't reliable, a Supabase Cron sweep picks up pending conversations]`. If an extraction for
   that conversation is already running, the new message waits for the next run.
5. Conversation extraction loads the BR-010 window, checks the daily AI cap, and calls
   `extractOrders()` with the text, marking customer and owner turns. The validator runs as in
   UJ-001. If the conversation has an open order, the result is saved as a proposed update to it
   (F-005); otherwise as a new draft with `source = messenger` and `conversation_id` set. No
   order found: no draft. Failure: the conversation becomes `failed` with a retry (INV-013).
6. The owner's open logbook is subscribed to Realtime changes on `orders` and `conversations`.
   Realtime applies row-level security, so the owner receives only their own rows; the new draft
   appears without a refresh. If the subscription drops, the screen says so and reloads on
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
| Owner | Supabase Auth user: `id`, email, password hash | Managed by Supabase Auth (bcrypt). No separate profile table in the MVP |
| `uploads` | `id`, `owner_id`, `kind` (image / text), `image_paths` (text[]), `raw_text` (nullable), `status` (processing / draft_ready / no_order / failed / consumed / expired), `failure_reason`, `created_at`, `expires_at`, `raw_deleted_at` | The only place raw chat content lives. `raw_text` is set to null and Storage files are deleted on confirm, discard, no-order, or expiry (INV-001) |
| `orders` | `id`, `owner_id`, `upload_id` (nullable), `conversation_id` (nullable), `source` (screenshot / paste / manual / messenger / instagram / telegram — BR-009), `state` (draft / confirmed), `customer_name`, `total_php` (numeric, nullable), `delivery_date` (date, nullable), `payment_status` (unpaid / paid / not_stated), `delivery_status` (pending / delivered), `not_in_chat` (text[] of field names), `matches_order_id` (nullable), `is_sample` (boolean), `confirmed_at`, `created_at`, `updated_at` | BR-001 – BR-003. Drafts and confirmed orders share one table; totals filter on `state = confirmed` (INV-002). A draft with `matches_order_id` is a proposed update — the target keeps its confirmed values until the owner applies it (F-005). `is_sample` drives the "sample data" label (INV-009) |
| `order_items` | `id`, `order_id`, `owner_id`, `name`, `quantity` (integer) | BR-002. Item prices are used only to compute the total and aren't stored. Top items (BR-006) group by `lower` + collapsed spaces of `name` |
| `channel_connections` | `id`, `owner_id`, `platform` (messenger / instagram / telegram), `external_id` (Page ID, Instagram account ID, or bot ID; unique per platform), `display_name`, `status` (active / disconnected), `created_at` | F-006. Which connected account belongs to which owner. No tokens here |
| `channel_secrets` | `connection_id`, `access_token` (Page token or bot token), `webhook_secret` (Telegram) | F-006. Row-level security on with **no** policies, so only the service key can read it; never sent to the browser (INV-AS-002) |
| `conversations` | `id`, `owner_id`, `connection_id`, `platform_thread_id`, `customer_name`, `status` (idle / pending / processing / draft_ready / failed / expired), `failure_reason`, `open_order_id` (nullable), `window_start_at`, `last_message_at` | F-006. One customer thread on a connected account. Holds no message text |
| `chat_messages` | `id`, `owner_id`, `conversation_id`, `platform_message_id` (unique per connection — dedupe), `from_customer` (boolean), `text`, `sent_at`, `expires_at` | F-006. The only place connected-account chat text lives. Deleted on confirm, discard, no-order, disconnect, or expiry (INV-001) |
| Statistics function | Input: none (uses the signed-in owner). Output: totals today / week / month, counts by status, unpaid amount, top items, deliveries due in 7 days, count without a total | Runs with the caller's permissions, so row-level security applies. Dates use `confirmed_at` in Asia/Manila; Postgres weeks start on Monday, matching BR-004 |

Every table has row-level security: an owner can read only rows where `owner_id` equals their
user ID (`channel_secrets`: nobody but the service key). Database writes go through the server
routes; only screenshot files are written by the browser, straight into the owner's Storage
folder. Never store phone numbers or addresses
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
| Cloudflare Workers AI (REST API), Llama 3.2 11B Vision | Candidate AI provider; doesn't train on inputs | Same as above. The model requires accepting Meta's license once before first use `[confirm the exact step in Cloudflare's model page at build time]` |
| Vercel Hobby | Hosts the Next.js app and server routes (up to 300 s per call); gives the public HTTPS URL the webhooks need | Run the demo locally (Way 2 only — webhooks need a public URL) |
| Supabase Realtime | Pushes new drafts and conversation statuses to the open logbook (F-006, ADR-012) | The logbook reloads on focus and on a manual refresh |
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
  (AES-256) and in transit (TLS). Vercel serves over HTTPS (INV-012). AI providers receive the
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
- **How long raw chats live:** deleted on confirm, discard, "no order found," or disconnect, and
  by the hourly job before 7 days (INV-001). Order fields stay until the owner deletes their account — the
  deletion flow is an open question (`prd.md` §10).
- **Secrets:** the Supabase service key, AI provider keys, the job secret, the Meta app secret and
  webhook verify token live only in server environment variables; Page and bot tokens live only
  in `channel_secrets`. None are ever in client code, `NEXT_PUBLIC_` variables, or the repo. The
  browser gets only Supabase's public key, which is safe because row-level security is on for every table
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
| Messages sent while Supabase is paused or Vercel is down may be lost after the platform stops retrying `[verify each platform's retry window]` | Free tiers; no queue | Keep the project awake before demos; paid plans for real use |
| Vercel Hobby is non-commercial and Meta App Review expects a stable public app | ₱0 budget | Paid hosting before real sellers connect |
| Customer matching for F-005 is by exact name (ignoring capitals and spaces) | Simple and predictable; the owner always confirms (INV-006) | Better matching only if the pilot shows misses |
| No audit or access log | INV-014 waived (ADR-006) | Revisit if the Data Privacy Act review finds a processing record is needed |
| No account or data deletion flow | Open question (`prd.md` §10) | A self-service delete that removes all of the owner's rows and files |
| Daily AI cap value unknown (uploads plus connected-account extractions) | Depends on the spike's measured AI quota use | Set the cap from measured numbers |
| Image size and per-upload limits are proposals | Not yet measured | Tune after the spike |

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial design (ADR-009) |
| 2026-10-08 | Way 1 (F-006) added: webhook, connect, and conversation routes; `channel_connections`, `channel_secrets`, `conversations`, `chat_messages`; `orders.source` and `conversation_id`; Supabase Realtime; UJ-005 data flow; limitations (ADR-012) |
