# Product Requirements Document — MabiList

**Version:** 0.1 · **Status:** Draft

> **Agent instructions:** This is the spine every other technical doc traces to. Write
> acceptance criteria in **EARS format** (Easy Approach to Requirements Syntax):
> `WHEN <trigger>, the system SHALL <result>`. Guardrails use
> `the system SHALL NEVER <X>` and map 1:1 to an `INV-###` from `seed/idea.md §9`. Do not
> invent a feature that isn't in `seed/idea.md §7` without flagging it as a new addition and
> getting it added there first — the seed is upstream of this document, not the other way
> around.

*Written 2026-10-07 from `seed/idea.md` §7–§10 and `docs/decision-ledger.md` (ADR-002 –
ADR-007). Items marked `[assumption]` or `[proposed]` are design choices not yet confirmed by
interviews or the founder — they're listed in §10 so they don't harden by accident.*

## 1. Overview

*One paragraph — what is this product, for whom, in one sentence each.*

MabiList is a web app that turns customer chats into structured order entries — customer display
name, items, quantity, price, delivery date, payment status — which the owner confirms before they
count, and which update when the chat continues. Chats come in two ways (ADR-012): a screenshot
or pasted text for **personal** accounts (F-001), or messages that arrive through official
webhooks from a connected **Facebook Page, Instagram professional account, or Telegram shop bot**
(F-006). It's for home-based NCR sellers who take orders in Messenger and Instagram chats, on
personal accounts — where no tool can read the chat directly — or business accounts
(`seed/idea.md` §2, §6). The MVP proves one thing first: that a screenshot becomes a correct
logbook entry (F-001, ADR-003); F-006 is built next.

## 2. User journeys

*Name the 1-3 critical paths a user takes through the MVP. Give each a `UJ-###` ID.*

- **UJ-001 — Log a new order from a chat:** sign in (F-007) → upload one or more screenshots of
  a conversation, or paste its text (F-001) → AI drafts an entry → owner reviews, corrects any
  field, and confirms (F-002) → the order appears in the logbook (F-003) and in totals (F-004) →
  the raw screenshot or text is deleted (INV-001).
- **UJ-002 — Update an order when the chat continues:** upload a newer screenshot of the same
  conversation (F-001) → AI suggests which open order it belongs to and shows the proposed
  changes (F-005) → owner applies the update, saves it as a new order instead, or discards it
  (F-002) → the logbook and totals update (F-003, F-004).
- **UJ-003 — Check the day's business:** open the logbook → see deliveries due, unpaid orders,
  and sales totals (F-003, F-004) → mark an order paid or delivered (F-002) → totals update.
- **UJ-004 — Connect a business account (once):** sign in (F-007) → choose Facebook Page /
  Instagram or Telegram → approve access in Meta's own login screen, or paste a Telegram bot token
  → the account shows as connected (F-006).
- **UJ-005 — An order arrives from a connected account:** a customer messages the connected Page,
  Instagram account, or bot → AI drafts an entry from the conversation (F-006) → the draft appears
  in the open logbook without a refresh (F-003) → owner reviews and confirms (F-002) → later
  messages in the same conversation propose updates to that order (F-005) → the raw messages are
  deleted (INV-001).

## 3. Features

*One entry per `F-###` from `seed/idea.md §7`. Do not renumber — IDs are permanent even if a
feature is later cut (mark it `cut` in `decision-ledger.md` instead of deleting the ID).*

### F-001 — Screenshot or paste → logbook entry (core)

- **Solves:** copying each order out of the chat by hand (`seed/idea.md` §1, §4).
- **Evidence:** EV-007 (manual recording is the norm); that screenshots are today's workaround is
  `[assumption — founder]`. AI extraction from chat screenshots is technically feasible (EV-013);
  accuracy on Taglish chats is unproven (A-003).
- **User journey:** UJ-001, UJ-002
- **Acceptance criteria (EARS):**
  - WHEN the owner uploads one or more screenshots of a single conversation, the system SHALL
    send them to the AI and create a **draft** entry with the fields in BR-002.
  - WHEN the owner pastes chat text instead, the system SHALL create a draft entry the same way.
  - WHEN a field isn't stated in the chat, the system SHALL leave it empty and mark it "not in
    chat" (INV-003).
  - WHEN the chat contains a phone number or address, the system SHALL NOT extract or store it
    (INV-001).
  - WHEN the AI finds more than one distinct order in the input, the system SHALL create one
    draft per order `[assumption — check how often this happens in interviews]`.
  - WHEN the AI finds no order (for example, only an inquiry), the system SHALL say "No order
    found in this chat," save nothing, and offer to fill in an entry by hand (F-002).
  - WHEN the image can't be read or isn't a chat, the system SHALL show an error that says so and
    keep nothing.
  - WHEN extraction fails or is interrupted, the system SHALL show the upload as failed with a
    retry option, never as a complete entry (INV-008, INV-013).
  - WHEN extraction is running, the system SHALL show a loading state.
- **Out of scope for this feature:** messages from connected business accounts (F-006); reading
  personal accounts automatically (rejected, `decision-ledger.md` §4); replying to customers;
  reading voice notes, videos, or product photos.

### F-002 — Confirm / Edit

- **Solves:** AI misreads — the honesty mechanism behind the value proposition (`seed/idea.md` §6).
- **Evidence:** `[assumption]` that owners will accept a review step.
- **User journey:** UJ-001, UJ-002, UJ-003
- **Acceptance criteria (EARS):**
  - WHEN a draft is created, the system SHALL show every field for review, with fields marked
    "not in chat" clearly distinguished from fields the AI filled.
  - WHEN the owner edits any field and confirms, the system SHALL save the entry as **confirmed**
    with the owner's values.
  - WHEN the owner discards a draft, the system SHALL delete the draft and its raw screenshot or
    text (INV-001).
  - WHEN an entry is confirmed or discarded, the system SHALL delete its raw screenshot or text
    immediately (INV-001). Drafts sharing one source are reviewed and resolved as one batch;
    delete that source when the batch resolves, without extending its original seven-day expiry (ADR-013).
  - WHEN reviewing a draft, the system SHALL show temporary source content and highlight only
    evidence matched to that source; copied evidence expires and is deleted with the raw content.
  - WHEN the owner confirms Delete my logbook, the system SHALL stop incoming processing,
    disconnect channels, remove their credentials, and delete orders, drafts, raw content, and
    review data while retaining login and shop profile (ADR-013; founder-approved scope, `[assumption]` of seller need).
  - WHEN a draft is neither confirmed nor discarded within 7 days of upload, the system SHALL
    delete its raw screenshot or text automatically (INV-001, ADR-007) and tell the owner the
    draft expired.
  - WHEN the owner changes the payment status or delivery status of a confirmed order, the system
    SHALL save it immediately and update totals (F-004).
  - WHEN the AI finds no order, or the owner chooses to, the system SHALL let the owner fill in an
    entry by hand.
- **Out of scope for this feature:** undoing a deletion; multi-person approval.

### F-003 — Live logbook dashboard

- **Solves:** losing track of orders on busy days (`seed/idea.md` §1, §4).
- **Evidence:** `[assumption]`; the busy-day failure is the founder's estimate (A-006).
- **User journey:** UJ-001, UJ-003
- **Acceptance criteria (EARS):**
  - WHEN the owner opens the logbook, the system SHALL list their confirmed orders, sortable by
    delivery date and filterable by payment status and delivery status.
  - WHEN an entry is confirmed, edited, or updated, the system SHALL show the change without a page
    refresh.
  - WHEN a new draft is created from a connected account while the logbook is open, the system
    SHALL show it without a page refresh (F-006, ADR-012).
  - WHEN the live connection drops, the system SHALL say so and reload the logbook when it
    reconnects or the app regains focus — never show a stale list as current (INV-008).
  - WHEN an order is shown, the system SHALL show where it came from (BR-009).
  - WHEN there are drafts awaiting review, the system SHALL show how many, separately from
    confirmed orders.
  - WHEN the owner has no orders yet, the system SHALL show an empty state that explains how to add
    the first one.
  - WHEN offline with a previously loaded logbook, the system SHALL show the owner-scoped cached
    list and last-updated time, disable mutations, and explain that changes require a connection.
    Without cached data, show an error with retry. Never persist raw chat evidence in this cache.
  - WHEN signing out, the system SHALL clear cached shop data (ADR-013).
- **Out of scope for this feature:** offline writes or queued changes; calendar views; reminders or notifications.

### F-004 — Sales totals and statistics

- **Solves:** the owner losing a clear picture of what the business earns (`seed/idea.md` §1;
  EV-007 notes owners compute income loosely). Also shows the MVP really queries its database
  [founder].
- **Evidence:** EV-007; statistics list confirmed by the founder (`seed/idea.md` §7).
- **User journey:** UJ-003
- **Acceptance criteria (EARS):**
  - WHEN the owner opens the statistics, the system SHALL show, from confirmed entries only
    (INV-002): total sales today, this week, and this month (BR-004); number of orders by status
    (BR-003); unpaid amount still owed; top-selling items (BR-006); deliveries due in the next
    7 days.
  - WHEN a confirmed entry has no price, the system SHALL leave it out of every total and show
    the count separately, e.g. "3 orders have no price yet" (INV-002).
  - WHEN there's no data for a period, the system SHALL show zero with an explanation, not an empty
    chart.
  - WHEN the statistics show sample or demo data, the system SHALL label them "sample data"
    (INV-009).
- **Out of scope for this feature:** profit (no costs are recorded), forecasts, exports (F-103,
  later).

### F-005 — Follow changes mid-conversation

- **Solves:** the hassle of finding and fixing a record when the order changes in the chat
  (`seed/idea.md` §4).
- **Evidence:** `[assumption]` that changes are common [founder]. Orders App already follows
  mid-chat changes for business accounts (EV-011) — the behaviour is known to be useful there.
- **User journey:** UJ-002
- **Acceptance criteria (EARS):**
  - WHEN a new upload has the same customer display name as an open order (BR-008), the
    system SHALL suggest that order and show the proposed changes field by field, e.g.
    "Quantity 5 → 3," "Payment: unpaid → paid."
  - WHEN a new message arrives in a connected-account conversation that already has an open
    order, the system SHALL propose the changes to that order (matched by conversation, not by
    name) instead of creating a new draft (F-006).
  - WHEN the owner applies the suggested update, the system SHALL change only the fields the
    owner approved and keep the order confirmed.
  - WHEN the owner rejects the match, the system SHALL let them save the upload as a new draft or
    discard it.
  - WHEN no open order matches, the system SHALL treat the upload as a new order (F-001).
  - WHEN an update is pending review, the system SHALL keep using the order's last confirmed
    values in totals (INV-002).
  - The system SHALL NEVER apply an update to an existing order without the owner confirming it
    (INV-006).
- **Out of scope for this feature:** merging two existing orders; matching across different
  customers.

### F-006 — Connect a business account (Way 1)

*Moved to later on 2026-10-07 (ADR-004); back in the MVP on 2026-10-08 (ADR-012), built after
F-001–F-005 and F-007. Updated in `seed/idea.md` §7 before this document.*

- **Solves:** copying orders by hand for sellers who take orders on a Facebook Page, an Instagram
  professional account, or a Telegram shop bot — and keeping those orders in the same logbook as
  personal-account orders (`seed/idea.md` §2, §6).
- **Evidence:** business-account chat-to-order tools exist (EV-011, EV-012), so reading these
  chats is feasible through official webhooks; whether sellers will connect is `[assumption —
  A-008]`. Platform details `[verify]` in `work/system-flow-explainer.md`.
- **User journey:** UJ-004, UJ-005
- **Acceptance criteria (EARS):**
  - WHEN the owner connects Facebook, the system SHALL use Meta's own login and permission screen,
    connect only the Pages and Instagram professional accounts the owner selects, and never ask
    for or see the owner's password.
  - WHEN the owner connects Telegram, the system SHALL accept a bot token, register the webhook
    with a secret token, and show the bot as connected.
  - WHEN a webhook request arrives, the system SHALL check Meta's signature or Telegram's secret
    token and reject the request, storing nothing, if the check fails.
  - WHEN a valid customer text message arrives, the system SHALL store it only under the owner of
    that connected account (INV-AS-001), answer the platform quickly, and run one extraction for
    that conversation (BR-010), creating or updating a **draft** with the fields in BR-002.
  - WHEN the platform sends the same message twice, the system SHALL process it once.
  - WHEN the owner's own reply arrives as an echo (Messenger, Instagram), the system SHALL use it
    as context for the same conversation `[verify which echoes each platform sends]`.
  - WHEN a message has no order (for example, a greeting), the system SHALL create no draft and
    delete the message within 7 days (INV-001).
  - WHEN extraction from incoming messages fails, the system SHALL show the conversation as failed
    with a retry option (INV-008, INV-013).
  - WHEN a connection stops working (token expired, access removed, bot deleted), the system SHALL
    show it as disconnected with a way to reconnect.
  - WHEN the owner disconnects an account, the system SHALL stop accepting its messages and delete
    its token and stored raw messages; confirmed orders stay in the logbook.
  - WHEN the platform sends a data-deletion request for a user, the system SHALL delete that user's
    stored raw messages `[verify Meta's data-deletion callback requirements]`.
  - The system SHALL NEVER store page or bot tokens anywhere the browser can read (INV-AS-002).
- **Out of scope for this feature:** WhatsApp (F-101) and Viber (F-102); replying to customers;
  reading photos, voice notes, or videos sent in chat `[proposed — text only in the MVP]`; real
  sellers' Pages and Instagram accounts before Meta App Review (demo on the team's test Page,
  ADR-012).

### F-007 — Owner sign-in

*Added 2026-10-07 (ADR-007); added to `seed/idea.md` §7 before this document.*

- **Solves:** 5–10 testers using the app at the same time without seeing each other's orders.
- **Evidence:** required by `INV-AS-001`; tester count from `seed/idea.md` §8.
- **User journey:** UJ-001
- **Acceptance criteria (EARS):**
  - WHEN someone who isn't signed in opens the app, the system SHALL show only the sign-in screen.
  - WHEN a signed-in owner reads, creates, edits, or deletes any entry, the system SHALL check on
    the server that the entry belongs to that owner (INV-AS-001).
  - WHEN a request refers to another owner's entry, the system SHALL refuse it and reveal nothing
    about that entry.
  - WHEN the owner signs out, the system SHALL end the session on that device.
- **Out of scope for this feature:** staff or multiple users per business (`seed/idea.md` §10);
  sign-in methods other than email + password (ADR-009).

## 4. Business rules

*Domain logic that isn't a single feature's behavior but governs several — give each a
`BR-###` ID so `sdd.md` and `qa-test-plan.md` can reference it precisely.*

- **BR-001 — Entry states.** Every entry is a **draft** (needs review) or **confirmed**. Only
  confirmed entries appear in the logbook's order list and in totals. A discarded draft is
  deleted, not kept as a third state.
- **BR-002 — Fields kept.** An entry has: customer display name; items (name, quantity, and nullable
  unit price for each); nullable order total price; delivery date; payment status; delivery status. Nothing else about the
  customer is stored unless the owner types it in (INV-001). The AI may fill all fields except
  delivery status, which starts as "pending" and is changed by the owner (or proposed by the AI
  from a later chat and confirmed by the owner, F-005).
- **BR-003 — Statuses.** Payment status: **unpaid**, **paid**, or **not stated** (when the chat
  doesn't say — INV-003). Delivery status: **pending** or **delivered**. The "orders by status"
  counts in F-004 are: needs review (drafts), awaiting payment (confirmed, explicitly unpaid),
  payment unknown (confirmed, not stated), paid, and delivered. Missing payment never defaults
  to unpaid. An order can be counted as both paid and delivered (ADR-013).
- **BR-004 — Sales date.** An order counts toward "today / this week / this month" on the day it
  was **confirmed** in the logbook, in Asia/Manila time (ADR-007). Weeks run Monday to Sunday
  (accepted, ADR-013). Delivery-date views remain separate from confirmation-date totals.
- **BR-005 — Order total.** The AI fills the order total only if the chat states it, or states a
  price for every item (then it adds them up). Otherwise the total stays empty (INV-003) and the
  order is left out of totals (INV-002) until the owner adds a price. Amounts are in Philippine
  pesos. Store optional unit prices as well as the order total; compute quantity × unit price
  for each item when all prices are known. A stated total that conflicts with that calculation
  must be resolved by the seller before confirmation, never silently overwritten. Zero is a
  valid price and is distinct from unknown (ADR-013).
- **BR-006 — Top-selling items.** Ranked by total quantity across confirmed orders in the chosen
  period. Item names are compared ignoring capitals and extra spaces; other differences ("ube jam"
  vs. "ube jam 250g") count as different items, and the owner can edit names to merge them.
- **BR-007 — Unpaid amount.** The sum of order totals of confirmed orders whose payment status is
  explicitly unpaid, including delivered orders. Unknown payment is counted separately and adds
  nothing to amount owed. Orders with no total are excluded and counted separately (INV-002, ADR-013).
- **BR-008 — Open order (for F-005 matching).** A confirmed order whose delivery status is pending,
  or whose payment status isn't paid.
- **BR-009 — Order source.** Every entry records where it came from: screenshot, pasted text,
  typed by hand, Messenger (Page), Instagram, or Telegram (ADR-012). The source is shown on the
  order; it doesn't change any total.
- **BR-010 — Conversation window (F-006).** An extraction from a connected account reads the
  messages in that conversation since its last confirmed or discarded entry, never older than 7
  days, plus the conversation's open order if there is one. Each run counts against the owner's
  daily AI limit `[proposed]`.

## 5. Invariants (guardrails)

*Copy product invariants from `seed/idea.md §9`, restated as testable SHALL-NEVER statements.
Then fold in the reserved anti-slop invariants from `anti-slop-guardrails.md` §4. Do not
renumber `INV-AS-###`. Waive one only via `decision-ledger.md`.*

*Kept/waived status for INV-003 – INV-014 is decided in `decision-ledger.md` ADR-006. Waived IDs
stay listed so nobody reuses them.*

- **INV-001 — data minimization:** the system SHALL NEVER keep a raw chat screenshot, pasted
  text, or message received from a connected account after the owner has confirmed or discarded
  the entry built from it (or resolved the batch of drafts sharing that source), or for more than
  7 days after it arrived if neither happens. Copied review evidence follows the same lifecycle;
  batch review never resets expiry (ADR-013). The system SHALL
  NEVER store a customer's phone number or address unless the owner types it in (ADR-002, ADR-007,
  ADR-012).
- **INV-002 — honest totals:** the system SHALL NEVER count a draft, or a confirmed entry with no
  price, in any sales total or statistic (F-002, F-004).
- **INV-003 — no guessing:** the AI SHALL NEVER fill in a value that isn't stated in the chat —
  for example a price, quantity, or delivery date that wasn't mentioned; unknown fields stay empty
  (F-001). *(Product rule; it keeps this ID — ADR-006.)*
- **INV-003 (reserved meaning) — sandboxing:** **waived** (ADR-006) — the system never executes
  AI-generated code.
- **INV-004 — crawling compliance:** **waived** (ADR-006) — no crawling; scraping chats was
  rejected (`decision-ledger.md` §4).
- **INV-005 — content licensing:** **waived** (ADR-006) — no crawled content.
- **INV-006 — entity-merge review:** the system SHALL NEVER apply a new upload or new
  connected-account messages to an existing order without the owner confirming the match and the
  changes (F-005, F-006).
- **INV-007 — citation grounding:** **waived** (ADR-006) — no citations are generated.
- **INV-008 — stream integrity:** a failed or interrupted AI extraction or live update SHALL NEVER
  be presented as a complete, successful entry — the UI shows the failure explicitly.
- **INV-009 — visualization honesty:** a chart or statistic SHALL NEVER render from sample or
  demo data without a visible "sample data" label.
- **INV-010 — compliance honesty:** the system's documentation, pitch materials, and code comments
  SHALL NEVER state or imply that MabiList is "compliant" with the Data Privacy Act (RA 10173),
  BIR requirements, or any certification; they may state which specific safeguards are
  implemented.
- **INV-011 — no real regulated data:** the system SHALL NEVER process real customer chats during
  development or demo — synthetic or properly de-identified chats only; for F-006 that means
  team members messaging the team's own test Page, Instagram account, and bot. The real-chat test
  with sellers starts only after `feasibility.md` covers RA 10173 and a decision is logged
  (ADR-006, ADR-012).
- **INV-012 — encryption:** the system SHALL NEVER store order entries or raw uploads
  unencrypted at rest, or transmit them over an unencrypted connection.
- **INV-013 — job visibility:** an upload or connected-account conversation whose extraction fails
  or stops SHALL NEVER disappear silently — the owner sees it failed and can retry.
- **INV-014 — retention of audit logs:** **waived** (ADR-006) — the MVP keeps no audit or access
  logs; revisit if `feasibility.md` finds RA 10173 requires a processing record.

### Reserved anti-slop invariants (always present unless waived)

- **INV-AS-001 — auth:** the system SHALL NEVER return or modify another user's data based on a
  client-supplied ID without a server-side ownership check.
- **INV-AS-002 — secrets:** the system SHALL NEVER ship a secret key or credential inside
  client-bundled code or a public repo.
- **INV-AS-003 — injection:** the system SHALL NEVER build a database query by concatenating
  raw user input into a query string.
- **INV-AS-004 — claims:** the system SHALL NEVER display a statistic, testimonial, or
  compliance claim that isn't backed by a real, citable source.
- **INV-AS-005 — dead controls:** the system SHALL NEVER ship an interactive element with no
  real behavior behind it.

## 6. Non-functional requirements

*Only include what actually matters for a hackathon-stage build — don't pad this with
enterprise boilerplate. Common relevant ones: response time for a demo, offline/low-bandwidth
tolerance (relevant for many PH-context products), basic data privacy.*

| Category | Requirement | Why it matters here |
|---|---|---|
| Data privacy | INV-001 deletion rules; the owner is told plainly what's kept, what's deleted, and the 7-day limit. Real customer chats only after the RA 10173 gate (INV-011) | Customer chats contain personal data; trust is a riskiest assumption (A-005) — check `feasibility.md` |
| Untrusted chat content | Chat text is treated as data, never as instructions; the AI's output is checked against the BR-002 fields before anything is saved, and anything else is dropped | A chat can contain text that tries to steer the AI; extra fields could leak phone numbers or addresses |
| Security | INV-AS-001 – INV-AS-003, INV-012; no secrets in client code; every webhook request's Meta signature or Telegram secret token checked before anything is stored; page and bot tokens server-side only (F-006) | Several testers' data in one system; webhook URLs are public, so anyone can send to them |
| Cost | Runs on free tiers at ₱0 (`seed/context.md` §5); if free limits are tight, a per-owner daily AI cap `[proposed]` covering uploads and connected-account extractions (BR-010), set in `stack-decision.md` | A-004; AI calls cost money once free tiers run out (ADR-005); a busy Page could trigger many extractions |
| Device | Works in a phone browser first, with screens usable at phone width `[assumption — sellers take screenshots and chat on their phones]` | The seller's chats and screenshots are on the phone |
| Connectivity | Upload progress is shown; a failed upload can be retried without re-picking files (INV-013); images are reduced in size before upload `[proposed]` | Home connections may be slow `[assumption]` |
| Responsiveness | A draft appears within 30 seconds of upload for the demo `[proposed — measure in the prototype]`; a loading state is always shown. Webhook requests are answered quickly and processed after `[verify each platform's timeout and retry rules]` | A slow draft defeats "faster than the notebook" (A-001); slow webhook answers make platforms resend or disable delivery |
| Accessibility | WCAG AA contrast; every control reachable by keyboard with a visible focus ring; every screen has empty, loading, and error states | `anti-slop-guardrails.md` Hard Gate |
| Language | Reads chats in Taglish and English (A-003 test set). Interface in English with simple everyday words; a Filipino toggle later (ADR-010, `design-brief.md`) | Beachhead sellers chat in Taglish |
| Locale | Philippine pesos; Asia/Manila time for all dates and totals (BR-004) | NCR sellers |

## 7. Dependencies

*External services, APIs, sponsor tech, or data sources this depends on — and what happens if
one is unavailable during the demo.*

| Dependency | Status | Fallback if unavailable |
|---|---|---|
| AI model that reads images and text, on a free tier | planned — chosen by the accuracy spike between Gemini and Cloudflare Workers AI; Gemini's free tier gets synthetic chats only (ADR-008, `feasibility.md` §3–§4) | The owner fills in the entry by hand (F-002); the demo shows the error state honestly rather than a fake result |
| Database with sign-in and live updates, on a free tier | planned — Supabase, including Realtime for F-006 drafts (ADR-008, ADR-012, `stack-decision.md`) | Live updates: the logbook refreshes on demand instead |
| Web hosting, free tier | planned — Vercel Hobby, non-commercial use only (ADR-009, `sdd.md`) | Run the demo locally — but webhooks need a public HTTPS URL, so F-006 can't be demoed locally without a tunnel `[verify]` |
| Meta app (Messenger Platform, Instagram messaging) | planned — F-006, MVP (ADR-012). Development mode works only on Pages where the team has a role; real sellers' Pages need App Review and possibly business verification `[verify]` | Demo on the team's own test Page; if review is slow, F-006 stays test-Page-only and Way 2 carries the pilot |
| Telegram Bot API | planned — F-006, MVP (ADR-012) | Way 2 (screenshot/paste) |

## 8. Scope boundary: MVP vs. later

| | MVP (this submission) | Later (if this continues past the hackathon) |
|---|---|---|
| Features | F-001, F-002, F-003, F-004, F-005, F-007, then F-006 (Messenger Page, Instagram professional, Telegram bot) | F-101 WhatsApp, F-102 Viber, F-103 spreadsheet export, F-104 Android app |
| Reasoning | F-001 is the one feature that proves the idea and is built first (ADR-003); F-002–F-005 turn single conversions into a running logbook, the difference from screenshot converters (EV-013); F-007 lets several testers use it safely. F-006 gives sellers who use both account types one logbook (ADR-012); it's built last, and cutting it needs a new decision-ledger entry. The application itself is at the Ideation stage — the MVP is built after it (`seed/context.md` §1) | WhatsApp and Viber have low consumer preference (EV-006) and may not fit ₱0. The monthly order count per owner from F-004 is what the paid plan's limit would be based on (ADR-005) — no limit is enforced in the MVP |

## 9. Milestones

*Absolute dates, pulled from `seed/context.md §2` — not relative phrasing like "in 3 days,"
which goes stale the moment someone reads this later.*

| Milestone | Date |
|---|---|
| Interviews with the 1–2 known sellers and their referrals | before 2026-10-11 (target) |
| Presentation deck finished | 2026-10-10 |
| PSC XI application deadline (Ideation stage) | 2026-10-11 |
| Shortlist, mentorship phase, NCR Regional Competition | `unknown` — not yet announced |
| Prototype build, F-001 first, F-006 last | after the application; date `unknown` |
| Meta App Review submission for F-006 | after F-006 works on the test Page; date `unknown` |
| AI accuracy test on 30–50 synthetic Taglish chats | during the prototype build; date `unknown` |
| Test with 5–10 sellers on real chats | after the RA 10173 gate (INV-011, ADR-006); date `unknown` |

## 10. Open questions

*Design choices made here that interviews or the founder should confirm before the build.*

- Do customers often pay in parts — a downpayment, then the balance? The MVP has only unpaid / paid
  / not stated (BR-003); partial payments would need a new field.
- How do sellers state prices — per item, as a total, or both? (BR-005)
- How often does one screenshot hold more than one order? (F-001)
- Is the 30-second draft target acceptable to sellers? (§6)
- Account deletion remains open; Delete my logbook is accepted in ADR-013 and retains the login
  and shop profile. These are distinct actions.
- **Telegram reply path (F-006):** customers message the shop bot, so the owner can't reply from
  their own Telegram app. Telegram Business connected bots may solve this; the Bot API 10.0
  changelog (May 2026) says "Secretary Bots" no longer need Telegram Premium `[verify this covers
  our case]`. Is a bot-only Telegram flow useful to sellers?
- Will Meta require business verification (registered business documents) before App Review for
  the permissions F-006 needs? Many beachhead sellers aren't registered `[verify]`.
- Should F-006 read photos sent in chat, such as GCash receipts? MVP: text only `[proposed]`.
- Can the customer's display name be read from the platform for each conversation, or does it need
  a separate profile lookup? `[verify]`
- How many Page / Instagram sellers would connect, and would they prefer one logbook over Meta's
  free order tools? (A-008)

## Related documents

- [`sdd.md`](sdd.md), [`qa-test-plan.md`](qa-test-plan.md), [`implementation-plan.md`](implementation-plan.md), [`anti-slop-guardrails.md`](anti-slop-guardrails.md)
- [`brd.md`](brd.md), [`business-canvas.md`](business-canvas.md), [`../seed/idea.md`](../seed/idea.md)

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial draft from seed/idea.md §7–§10 and ADR-002 – ADR-007; F-007 added (ADR-007) |
| 2026-10-08 | ADR-012: F-006 back in the MVP (built last); UJ-004, UJ-005, BR-009, BR-010 added; INV-001, INV-006, INV-011, INV-013, §6–§10 updated |
