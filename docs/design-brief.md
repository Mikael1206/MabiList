# Design Brief — MabiList

**Version:** 0.1 · **Status:** Draft

> **Agent instructions:** This file exists so an AI writing backend copy, error messages, or
> data shapes stays consistent with the actual design — not to generate UI on the founder's
> behalf. If asked to "design the UI," point back to this file's boundary: capture inputs
> here, then hand off to the human designer. Do not generate wireframes, component code, or
> visual mockups from this file unless the founder explicitly asks for that separately.
> If a direction here conflicts with `anti-slop-guardrails.md`, log the conflict in
> `decision-ledger.md` before proceeding — do not silently override either file.
> After planning, fill §0 by asking the founder. Do not scaffold the app, write
> `handoff/TASK-###.md`, or generate UI while status is `unanswered`.

*Written 2026-10-07 from `prd.md`, `sdd.md`, and the founder's answers (ADR-010). This file lists
inputs for the designer — states, copy rules, data — not layouts, colors, or components.*

## 0. Founder design gate

*Ask the founder. Do not guess. Default is `unanswered`. If they say "not yet," stop: do not
draft screens, pick a component-library look, or generate a layout to unblock the build.*

- **Status:** founder-owned — prototype shared by the founder on 2026-10-23 (ADR-013).
- **Source:** An-joe's Figma Make prototype; preserve the supplied visual design.
- **Link or path:** https://www.figma.com/make/ekR2zUP2Glr5Gl7z0I1Wal/Prototype-MabiList-PWA
- **Screens it covers:** sign-in, logbook, capture, draft review, totals, settings, connected
  accounts, privacy/data, first-run and system-state previews. Prototype integrations are simulated.

**Accepted behavior adjustments (ADR-013):** retain nullable item unit prices; keep Not stated /
Unpaid / Paid; show unknown-payment counts separately from amount owed; provide temporary source
evidence; resolve shared-source drafts as a batch before deletion. Delete my logbook also
disconnects channels but keeps login/profile. Offline logbook access is read-only with freshness
time; copy must not promise queued orders. Clear cached shop data on sign-out and logbook deletion.
An-joe should consider confirmation-based totals labels such as “Orders confirmed today”; the
label itself remains a designer decision. These are behavior/copy inputs, not permission to redesign.

`founder-owned` means they handed you a real design and later UI packets must follow it.
`waived` only if they say this product has no UI, or they explicitly allow a backend-only
slice while they design — log that waiver in `decision-ledger.md` first.

## 1. Brand tone

*A few adjectives + a short "sounds like / doesn't sound like" pair, so AI-generated copy
(error messages, onboarding text, SMS templates) matches the product's voice.*

**Warm, friendly, plain, honest** [founder, 2026-10-07; ADR-010]. English in simple everyday words
for now; a Filipino toggle comes later. The app talks like a helpful friend who keeps your order
notebook tidy — glad to help, never pushy, and straight about what it doesn't know.

- **Sounds like:** "Got it! We found 1 order in this chat. Check the details, then tap Confirm."
  · "We couldn't find a price in the chat — add it if you know it." · "No orders yet. Add your
  first one from a chat screenshot."
- **Doesn't sound like:** "Our AI-powered engine seamlessly extracted your order with
  cutting-edge accuracy!" (hype, unproven) · "Error 422: validation failed" (technical) · "Oops!!
  Something went wrong 😢" (vague, no next step) · "You never have to worry about missed orders
  again" (a promise nobody has tested — A-001)

## 2. Must-have screens / states

*Not wireframes — just the list of screens or states the product needs, so backend and
frontend work stay in sync without you having to explain it twice.*

Every screen also needs its empty, loading, and error states (`anti-slop-guardrails.md` §1).
The rows below list the states specific to this product.

| Screen / state | Purpose | Maps to feature(s) |
|---|---|---|
| Sign up / sign in (email + password) | Gets a seller into their own logbook; wrong-password, account-already-exists, and no-connection messages | F-007 |
| Signed out | Shows only sign-in; nothing from a logbook is visible | F-007 |
| Logbook — first time (empty) | Explains in one or two lines how to add the first order from a chat | F-003 |
| Logbook — orders list | Confirmed orders by delivery date; filters for payment and delivery status; count of drafts waiting for review; where each order came from — screenshot, pasted, typed, Messenger, Instagram, Telegram (BR-009) | F-003 |
| Logbook — new draft arrives | A draft from a connected account appears without a refresh, clearly marked as a draft needing review | F-003, F-006 |
| Logbook — not live | The live connection dropped: says the list may be out of date and is reloading; never shows a stale list as current | F-003, INV-008 |
| Logbook — filter shows nothing | "No orders match" with a way to clear the filter, distinct from the first-time empty state | F-003 |
| Add from chat — choose input | Pick one or more screenshots of **one** conversation, or paste chat text | F-001 |
| Add from chat — uploading | Progress per screenshot; a failed upload can be retried without picking the files again | F-001, INV-013 |
| Add from chat — reading the chat | Shown while the AI works (up to about 30 seconds is the target `[proposed]`). Not streamed: there are no partial results, so this is a waiting state with honest wording, not a fake progress bar | F-001 |
| Add from chat — upload limits | Too many screenshots, wrong file type, or the day's upload limit reached `[proposed cap]` — each says what to do next | F-001 |
| Result — no order found | "We didn't find an order in this chat." Offers to enter the order by hand. Nothing was saved | F-001, F-002 |
| Result — couldn't read the image | Says it doesn't look like a readable chat; nothing was kept | F-001 |
| Result — reading failed | Says it failed and why, if known, with a **Try again** action; never shown as a finished entry (INV-008). It stays in the list until retried, discarded, or expired (INV-013) | F-001 |
| Interrupted — app closed while reading | When the seller comes back, the upload shows its real status (still reading, ready, or failed) — never silently gone | F-001, INV-013 |
| Review draft | Every field (BR-002) shown for checking; fields marked **not in chat** look clearly different from fields the AI filled; edit any field; **Confirm** or **Discard** | F-002, INV-003 |
| Review — several orders from one chat | One draft per order, each reviewed on its own | F-001, F-002 |
| Review — update to an existing order | Shows which open order it matches and each change ("Quantity 5 → 3"); the seller approves changes one by one, saves it as a new order instead, or discards it | F-005, INV-006 |
| Review — several possible matches | Same customer name on more than one open order: the seller picks which one, or none | F-005 |
| Discard confirmation | Makes clear the draft and its screenshot will be deleted and can't be undone | F-002, INV-001 |
| Enter an order by hand | The same fields as a draft, typed by the seller | F-002 |
| Order details | View and edit a confirmed order; quick actions to mark it paid or delivered | F-002, F-003 |
| Statistics | Sales today / this week / this month; orders by status; unpaid amount; top items; deliveries due in the next 7 days; "X orders have no price yet"; zero with an explanation when a period has no sales | F-004, INV-002 |
| Sample data label | Any logbook or statistics showing demo data says "Sample data" visibly | F-004, INV-009 |
| Draft expired notice | Tells the seller a draft wasn't confirmed within 7 days, so its screenshot and draft were deleted | F-002, INV-001 |
| What we keep and delete | A plain explanation, reachable from the app: only order details are kept; screenshots, pasted chats, and messages from connected accounts are deleted when you confirm or discard, or after 7 days; phone numbers and addresses aren't saved | F-001, F-002, F-006, INV-001 |
| Connected accounts — none yet | Explains that a Facebook Page, Instagram professional account, or Telegram shop bot can be connected so its messages arrive on their own, and that personal accounts use screenshots instead | F-006 |
| Connect Facebook / Instagram | Before leaving for Meta's login: what MabiList will receive (every message on the chosen Pages and linked Instagram accounts), what it keeps (order details), and what it deletes (messages, within 7 days). Then Meta's own screen; back in the app, pick which Pages to connect | F-006, INV-001 |
| Connect Facebook — cancelled or failed | The seller cancelled Meta's screen, gave no Page, or Meta returned an error — says what happened and offers to try again; nothing was connected | F-006 |
| Connect Telegram | Paste the bot token from Telegram's BotFather, with short steps; wrong-token and already-connected messages. Says customers will message the bot, not the seller's own account | F-006 |
| Connected accounts — list | Each Page, Instagram account, or bot with its status: connected, or disconnected with **Reconnect**; **Disconnect** on each | F-006 |
| Disconnect confirmation | Makes clear messages will stop arriving, stored messages and drafts from that account are deleted, and confirmed orders stay | F-006, INV-001 |
| Conversation reading failed | A connected-account conversation whose extraction failed, with **Try again**; never silently gone | F-006, INV-013 |
| Test accounts only (before Meta approval) | While Meta hasn't approved the app, Facebook connection works only for the team's own test Page — the screen must not suggest any seller can connect yet | F-006, INV-AS-005 |
| Sign out | Ends the session on this device | F-007 |

*Streamed agent output doesn't apply: extraction returns one finished result (`sdd.md` §1,
ADR-009). The states that matter instead are uploading → reading → result (draft ready / no order
/ unreadable / failed), plus "interrupted," listed above. Way 1 drafts arrive whole through live
updates (ADR-012) — also not streaming.*

**Not in the MVP, so it must not appear as a working control** (INV-AS-005): account deletion
(an open question in `prd.md` §10), the Filipino toggle, exports, reminders, WhatsApp, and Viber.
Connecting accounts (F-006) is in the MVP but built last — until it works, it must not appear.

## 3. Content & copy rules

*Banned words/phrases, required disclaimers (especially relevant if `INV-###` guardrails from
prd.md need to show up in the UI — e.g., a safety disclaimer, a freshness timestamp, a
"this is not medical/legal advice" notice).*

- **Must always show:**
  - The difference between a **draft** (needs review) and a **confirmed** order, everywhere
    orders appear (BR-001).
  - **"Not in chat"** on any field the chat didn't state — never a guessed value (INV-003).
  - That the seller is the one confirming: AI-filled values are suggestions until the seller
    taps Confirm.
  - **"Sample data"** on any demo data in the logbook or statistics (INV-009).
  - The 7-day rule wherever drafts are listed, e.g. "Drafts are deleted after 7 days if not
    confirmed" (INV-001).
  - Amounts in Philippine pesos (₱1,250.00) and dates in Philippine time (BR-004).
  - A next step in every error message ("Try again," "Enter it by hand," "Check your
    connection").
  - Before connecting an account: that every message on it is sent to MabiList, and that
    messages are deleted within 7 days (F-006, INV-001).
- **Must never say:**
  - "Compliant," "secure," "certified," or "Data Privacy Act compliant" — state the specific
    safeguard instead, e.g. "Screenshots are deleted after you confirm" (INV-010, INV-AS-004).
  - Accuracy or speed claims ("99% accurate," "10× faster") — nothing is measured yet (A-001,
    A-003).
  - "Automatic" or "reads your Messenger" about **personal** accounts — the seller uploads
    screenshots; nothing reads personal accounts. For a **connected** Page, Instagram professional
    account, or bot, say messages "arrive on their own once connected" (ADR-012), and never
    suggest personal accounts can be connected.
  - Hype words: "AI-powered," "revolutionary," "seamless," "next-generation," "cutting-edge,"
    "smart" as filler (`anti-slop-guardrails.md` §2).
  - Testimonials, user counts, or "trusted by" lines — there are no users yet (INV-AS-004).
  - Blame: "You uploaded the wrong file." Prefer "This doesn't look like a chat screenshot."
- **Purpose-Gate** (`anti-slop-guardrails.md` §2):
  - Name actions after what they do for the seller — "Add from chat," "Confirm order," "Mark as
    paid," "Try again" — not "Get Started," "Learn More," or "Submit."
  - No sparkle, robot, or magic-wand icons to signal "AI." The AI step is a means, not the
    product; if an icon marks AI-filled fields, it needs a one-line reason here first.
  - No landing-page skeleton (hero → three feature cards → logo bar → pricing). The MVP is a
    signed-in tool; there's no public marketing page in the PRD.
  - Visual choices (palette, type, layout) belong to the founder's design. If any technique on
    the §2 list is used, its one-line reason goes here.

## 4. Accessibility & context notes

*Especially relevant for PH-context products: low-bandwidth tolerance, basic-phone/SMS
fallback, Filipino/English bilingual needs, readability level for the target segment.*

- Contrast: WCAG AA (4.5:1 normal text, 3:1 large text); every control keyboard-reachable
  with a visible focus ring (`anti-slop-guardrails.md` §1).
- **Phone first.** Sellers chat and take screenshots on their phones `[assumption]` (`prd.md` §6),
  so every screen must work at phone width with one hand. Touch targets at least 24 × 24 CSS
  pixels (WCAG 2.2 AA); bigger is kinder for thumbs.
- **Status is never color alone.** Paid/unpaid, pending/delivered, draft/confirmed, and "not in
  chat" each need a word or icon too, not only a color (WCAG 1.4.1).
- **Slow connections** `[assumption]`: show upload progress; screenshots are shrunk before upload
  (`sdd.md` §3); a failed upload is retried without re-picking files (INV-013).
- **Language:** English in short, everyday words (ADR-010). Keep text in one place per screen so a
  Filipino toggle can be added later without redesigning. Customer names and item names appear
  exactly as written in the chat, including Taglish.
- **Sellers' screenshots are private.** Preview images only to the signed-in owner; never in
  shareable links or notifications.
- **No basic-phone or SMS fallback** — out of scope; sellers already use smartphone chat apps.

## 5. Data the UI needs from the backend (and vice versa)

*This is the actual coordination point between your design work and the AI-generated code —
a shared vocabulary for what data shapes exist.*

| UI element | Data it needs | Source (from sdd.md data model) |
|---|---|---|
| Orders list row | customer name, items (name × quantity), total or "no price yet," delivery date, payment status, delivery status, sample flag | `orders` + `order_items` (`state = confirmed`) |
| Drafts count | number of drafts awaiting review | `orders` (`state = draft`) |
| Upload status card | status: processing / draft_ready / no_order / failed / expired; failure reason; upload time; time left before deletion | `uploads` (`status`, `failure_reason`, `created_at`, `expires_at`) |
| Draft review | every BR-002 field; which fields are "not in chat"; screenshot preview or pasted text while the draft exists | `orders` (`not_in_chat`), `order_items`, `uploads` (`image_paths` / `raw_text`) |
| Update review (F-005) | matched order's confirmed values and the draft's values, field by field; other candidate orders if several match | draft `orders` row with `matches_order_id` + target `orders` row |
| Payment status label | unpaid / paid / not stated | `orders.payment_status` (BR-003) |
| Delivery status label | pending / delivered | `orders.delivery_status` (BR-003) |
| Statistics | sales today / week / month; counts by status; unpaid amount; top items; deliveries due in 7 days; count of orders without a total; sample flag | statistics function (`sdd.md` §4) |
| Error messages | a reason code the UI turns into friendly copy (§1, §3) — e.g. not a chat, no order found, AI unavailable, upload too large, daily limit reached, not signed in | server routes (`sdd.md` §2) |
| Draft expired notice | which upload expired and when | `uploads` (`status = expired`) |
| Order source label | screenshot / paste / manual / messenger / instagram / telegram | `orders.source` (BR-009) |
| Connected accounts list | platform, account name, status (active / disconnected) | `channel_connections` (never tokens — `channel_secrets` is server-only) |
| Conversation status | customer name, status (pending / processing / draft_ready / failed / expired), failure reason, last message time | `conversations` |
| Live connection indicator | whether the live subscription is connected | Supabase Realtime client state |

*Streamed agent output: not used (ADR-009). The backend still separates "still reading" from
"finished," "no order," and "failed" through the upload status, so a waiting upload is never shown
as done (INV-008).*

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial brief — §0 not yet (founder designing); English first; warm, friendly voice (ADR-010) |
| 2026-10-08 | F-006 in the MVP (ADR-012): connected-account screens and states, source label, live states, copy rule for connected vs. personal accounts, §5 data |
