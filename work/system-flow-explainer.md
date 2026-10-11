# How the MabiList system works — team explainer

> **Status:** working note for the team, reconciled 2026-10-07 with the decisions in
> `docs/decision-ledger.md` (ADR-002 – ADR-010), and on 2026-10-08 with ADR-012 (both ways in the
> MVP). Not a spec: `docs/sdd.md` owns the architecture,
> `docs/stack-decision.md` the stack, and `docs/prd.md` the features. Anything tagged `[verify]`
> must be checked against the platform's current official docs before we promise it in the deck.

## The short version

We are **not** building an extension that lives inside Messenger, Instagram, Viber, Telegram, or
WhatsApp — their mobile apps are closed, and scraping their web versions risks the owner's account
and breaks Meta's terms.

**The MVP has two ways in, feeding one logbook** (ADR-012):

- **Personal accounts → screenshot / paste (Way 2, F-001, built first).** No outside app is
  allowed to read personal Messenger and Instagram chats. So the owner uploads a screenshot of the
  chat or pastes its text, AI turns it into a draft logbook entry, and the owner confirms it.
- **Business accounts → official webhooks (Way 1, F-006, built second).** The owner connects a
  Facebook Page, an Instagram professional account, or a Telegram shop bot once; new customer
  messages arrive on their own, and AI drafts entries for the owner to confirm.

Either way, the raw screenshot, text, or message is deleted once the entry is confirmed or
discarded, or after 7 days (ADR-002, ADR-007). The owner keeps chatting in their usual apps.
Business-account tools already exist (EV-011, EV-012); what's different is one logbook for both
kinds of account. WhatsApp and Viber stay later (F-101, F-102).

Way 1 has two parts: a **one-time setup** where the owner connects their accounts, and a **live
loop** that runs on every message.

---

## Two ways to use the system

```text
Way 1 — Business account → official webhooks   [MVP, F-006, built second] ─┐
                                                                            ├→ AI → draft → owner confirms → logbook
Way 2 — Personal account → screenshot / paste   [MVP, F-001, built first]  ─┘
```

| | Way 1: Connected business account (MVP) | Way 2: Manual capture (MVP) |
|---|---|---|
| When | Second, after the screenshot flow (F-006, ADR-012) | First — the core feature (F-001, ADR-003) |
| Who it's for | Owners with a business account: Facebook Page, Instagram professional account, or Telegram shop bot | Owners who use personal accounts |
| How messages get in | The platform sends every message to our server by itself | The owner uploads a screenshot or pastes the chat |
| Owner effort | One-time "Connect," then confirm each draft | One tap per conversation, then confirm |
| Works with | MVP: Messenger (Page), Instagram (professional), Telegram (bot). Later: WhatsApp (Business Platform, F-101) | Any app, including Viber and personal profiles |
| Real sellers | Messenger and Instagram: after Meta App Review — until then, the team's own test Page. Telegram: no review needed | From the first pilot, after the privacy gate (INV-011) |
| Setup on our side | Our team registers one Meta app and one Telegram integration; keys stay on our server. Owners never handle API keys | No platform setup — only the AI step |

### Personal vs. business accounts

For chatting, they do the same thing. The difference is **whether outside apps are allowed in**:

- A **personal account** is for friends and family. Platforms treat those chats as private and
  don't let any outside app read them, even with the owner's permission.
- A **business account** is made for talking to customers. Platforms expect businesses to use
  helper tools (chatbots, inbox tools, logbooks like ours), and with the owner's permission they
  send messages to those tools.

"Business account" doesn't mean a registered corporation. A Facebook Page and an Instagram
professional account are free settings any small seller can turn on `[verify]`.

**Same email, separate inboxes.** On Facebook, a Page has no email or password of its own — it
lives under the owner's personal login:

```text
juan@gmail.com (one login)
   ├── Juan Dela Cruz      → personal profile → personal Messenger inbox
   └── Juan's Lechon Page  → business Page    → Page inbox
```

When Juan clicks "Connect Facebook," Facebook asks which **Pages** to share. Our app only gets the
Page inbox; his personal Messenger stays private. On Instagram, one email can hold several
accounts, each personal or professional on its own. WhatsApp accounts are tied to **phone
numbers**, not email.

**Telegram exception:** Telegram lets apps log into a *user* account through its client API, so
reading a personal Telegram account is possible the official way, with more build effort and
Telegram's terms `[verify]`. Not planned for the MVP.

### Example: one seller, both ways (illustrative)

Maria sells homemade ube polvoron.

| | Personal account | Business account |
|---|---|---|
| Facebook | **Maria Santos** — her own profile | **Maria's Ube Treats** — a Page she created from her profile |
| Instagram | **@mariasantos** — private, for friends | **@mariasubetreats** — switched to professional |
| Who messages it | Friends, family, some customers out of habit | Customers who see her shop posts |
| How orders reach our app | Way 2: she screenshots the chat and uploads it | Way 1: the message arrives on its own after she connects the Page |

- A customer messages **Maria Santos** directly. Maria takes a screenshot, uploads it, checks the
  draft the AI made, and taps Confirm.
- A customer messages **Maria's Ube Treats**: "Pabili po 2 boxes." A draft appears in her
  logbook for her to confirm (F-006).

Both kinds of order land in the same logbook and totals. If Maria moves more customers to her
Page, more of her orders arrive without screenshots — same app, same logbook.

### Way 2 flow (manual capture — the MVP)

Full detail in `docs/sdd.md` §3.

1. Owner signs in (email + password) and taps **Add from chat**.
2. Owner uploads one or more screenshots of one conversation, or pastes the copied text.
3. Screenshots go to the owner's private folder in storage; they're kept only until the entry is
   confirmed or discarded, and never more than 7 days (ADR-002, ADR-007).
4. Our server sends them to the AI — a model that can read images — and gets back JSON with only
   the order fields: customer display name, items and quantities, total, delivery date, payment
   status (`docs/prd.md` BR-002). Phone numbers and addresses are never extracted.
5. The server validates the JSON and saves a **draft**. If the customer already has an open
   order, it suggests that order and shows the changes ("Quantity 5 → 3") instead (F-005).
6. Owner checks the draft, edits anything wrong, and taps **Confirm** (or Discard). The
   screenshot or text is deleted right away.

Way 2 is still manual, so it has to be clearly faster than writing notes or a spreadsheet:
"type out the order" becomes "one tap + confirm." Interviews should measure that `[assumption]`.

---

Parts 1 and 2 below describe **Way 1 (connected business accounts)** in detail. **It's in the
MVP (F-006, ADR-012), built after Way 2.** Full design in `docs/sdd.md`.

## Part 1: One-time setup (owner, about 5 minutes)

1. **Owner signs up** for our web app (email login).
2. **Owner connects their channels:**
   - **Facebook Page / Instagram:** the owner clicks "Connect Facebook," logs in through Meta's
     official login screen, and picks the Page they sell from. Our server receives an access
     token for that Page and subscribes it to message notifications (webhooks). We never see the
     owner's password.
   - **Telegram:** the owner creates a bot for their shop with Telegram's @BotFather and pastes
     the bot token into our app. Customers message the shop bot. **Open (ADR-012):** the owner
     can't answer those customers from their own Telegram app, and MabiList doesn't send replies.
     Telegram Business connected bots may solve it — Telegram's Bot API 10.0 changelog (May 2026)
     says "Secretary Bots" no longer need Telegram Premium `[verify this covers our case]`.
   - **WhatsApp (later):** the owner goes through Meta's WhatsApp Business signup flow inside our
     app. `[verify]`
3. **Our server stores each connection** (business ↔ channel ↔ token) in the database — never in
   the browser.

From then on, the owner keeps chatting in Messenger, Instagram, or Telegram as usual.

---

## Part 2: The live loop (every message, a few seconds)

```text
Customer sends "Pabili po 2 boxes ng ube polvoron, deliver sa Sat"
        │
        ▼
[1] Platform (Meta / Telegram) sends the message to our server (webhook)
        │
        ▼
[2] Server checks it really came from Meta/Telegram, replies "OK" right away
        │
        ▼
[3] Server saves the raw message under the right business, customer, and conversation
        │
        ▼
[4] AI reads the recent conversation + any open order for that customer
        │   and returns structured data (JSON)
        ▼
[5] Server validates the AI output, then creates or updates a logbook entry
        │
        ▼
[6] Database change is pushed live to the owner's dashboard
        │
        ▼
[7] Owner sees "New order – needs review", taps Confirm or edits it
```

### What happens at each step

1. **Webhook arrives.** Meta sends an HTTPS request to our server's URL with the message, sender
   ID, Page ID, and timestamp. Telegram can do the same, or our server can ask Telegram for new
   messages (polling), which is easier during development because it needs no public URL.
2. **Security check.** Meta signs every webhook with our app secret, so the server checks the
   signature and rejects anything fake. Meta also does a one-time handshake with a verify token
   when we first register the webhook URL. The server replies quickly, because platforms retry or
   complain if we're slow.
3. **Save the raw message — temporarily.** It's kept only until the owner confirms or discards
   the entry built from it, and never more than 7 days (ADR-002, ADR-007). If the AI step fails,
   the owner sees the failure and can retry (INV-013).
4. **AI extraction.** The AI gets an instruction like "Extract the order from this conversation.
   Return only JSON in this shape," plus the last few messages and any open order for that
   customer. It returns something like:

   ```json
   {
     "intent": "new_order",
     "customer_name": "Ana",
     "items": [{ "name": "ube polvoron", "qty": 2, "unit": "box", "price": null }],
     "delivery_date": "Saturday",
     "status": "ordered",
     "confidence": 0.82
   }
   ```

   Unknown fields stay `null` — the AI must not guess prices that weren't mentioned (INV-003).
   The MVP's actual fields are BR-002 in `docs/prd.md`; the example above is illustrative.
5. **Validate and save.** The server checks the JSON shape and decides whether to create a new
   entry or update an existing one (e.g. "make it 3 na lang" updates the quantity). Low-confidence
   results are flagged for review.
6. **Live push.** For Way 1, the open logbook subscribes to database changes (Supabase Realtime)
   so new drafts appear without a refresh (ADR-012). Way 2 doesn't need this — the owner's own
   upload returns the draft directly (ADR-009).
7. **Owner confirms.** At the start, nothing counts as final until the owner taps Confirm. This
   handles AI mistakes, and it's an honest feature to show in the pitch.

### The owner's own replies count too

When the owner replies in Messenger ("Total ₱300 po, GCash"), Meta can send that reply to our
server as an "echo" webhook `[verify]`. The same loop runs: the AI fills in the price or moves the
status to "awaiting payment." When the customer says "Paid na po," the status becomes "paid." The
logbook follows the whole deal from inquiry to payment.

Our app only **reads** messages, so Meta's 24-hour rule on businesses *sending* messages doesn't
affect us.

---

## Part 3: What we need

### Accounts and platform access

**MVP:** Way 2 needs none of the platform accounts below, so it's built first (ADR-003). Way 1 is
also in the MVP (ADR-012) and needs the Meta app, test Page, and Telegram bot; WhatsApp stays
later.

| Need | What it's for | Notes |
|---|---|---|
| Meta developer account + a Meta app | Messenger and Instagram webhooks | Free. In development mode it works with Pages where our team has a role — enough for a demo `[verify]` |
| A test Facebook Page (+ Instagram professional account) | Our demo shop | Free |
| Telegram bot via @BotFather | Easiest first channel | Free, instant, no review |
| WhatsApp Business Platform | Later phase | Has number rules and per-conversation pricing — check current terms before promising it `[verify]` |
| Meta app review + business verification | Going live with *real* businesses | Not needed for the Ideation application or an early demo, but on the roadmap `[verify]` |

### Technology

Decided 2026-10-07 (ADR-008, ADR-009; details in `docs/stack-decision.md` and `docs/sdd.md`):

| Part | MVP choice | Owner on team |
|---|---|---|
| Web app (phone browser first) | Next.js + Tailwind CSS | Yancy |
| Server routes (AI calls, validation, business rules, deletion job) | Next.js server routes on Vercel Hobby (free, non-commercial only) | Tyrone |
| Login | Supabase Auth, email + password | Tyrone |
| Database | Supabase Postgres (free tier, Singapore region), row-level security on every table | Tyrone |
| Screenshot storage | Supabase Storage, private bucket, one folder per owner | Tyrone |
| Deleting raw chats after 7 days | Supabase Cron, hourly | Tyrone |
| AI model | Chosen by an accuracy test on synthetic Taglish chats: Gemini (free tier — **synthetic chats only**, because Google may use free-tier inputs) or Cloudflare Workers AI (doesn't train on inputs) (`docs/feasibility.md` §4) | Tyrone |
| UI/UX and flows | Figma / Canva — **no build starts until the design exists** (ADR-010) | Mikael |
| Webhook routes (Meta, Telegram) | Next.js server routes on the Vercel deployment's public HTTPS URL; signature / secret-token check on every request (ADR-012) | Tyrone |
| Live updates for Way 1 drafts | Supabase Realtime (ADR-012) | Tyrone / Yancy |

Free tiers change, so confirm each before committing. Budget is ₱0 (`seed/context.md` §5), so
anything that needs a credit card is out unless we log a decision to change that.

**Web vs. APK:** one web app, used in the phone browser, covers phone and desktop. A Play Store
app is later (F-104).

### Database tables

**MVP** (full list in `docs/sdd.md` §4):

- `uploads` — a screenshot set or pasted text, kept only until confirm / discard / 7 days, with
  its status (reading, ready, no order, failed, expired)
- `orders` — drafts and confirmed orders: customer display name, total, delivery date, payment
  and delivery status, which fields were "not in chat"
- `order_items` — item name and quantity

No permanent chat history, no customer table, and no phone numbers or addresses (ADR-002).

**Also MVP, for Way 1** (ADR-012): `channel_connections` — which Page / Instagram account / bot
belongs to which owner, tokens stored server-side only; `conversations` — one row per customer
thread on a connected account; `chat_messages` — incoming message text, kept only until the
entry is confirmed or discarded, and never more than 7 days.

### Security and privacy (required, not optional)

- **Secrets live only on the server** — app secrets, Page tokens, bot tokens, AI keys
  (also required by `docs/anti-slop-guardrails.md`).
- **Verify every webhook signature.**
- **Privacy policy URL and data-deletion instructions** — Meta requires both before our app can
  connect real Pages `[verify]`.
- **Data Privacy Act of 2012 (RA 10173).** We process customers' personal data on the owner's
  behalf. Screenshots are private to the owner and deleted automatically once the entry is
  confirmed or discarded, or after 7 days (ADR-002, ADR-007). The build and demo use **synthetic
  chats only**; real customer chats wait for the checks in `docs/feasibility.md` §4 (INV-011).
  We never claim to be "compliant" (INV-010).

### Things we need that aren't code

- **Talk to real small business owners.** What do they sell on — a Page, a personal profile, or
  both? What do they track today? Both ways are in the MVP (ADR-012); interviews check how many
  sell from personal accounts (A-007) and whether Page sellers would connect (A-008,
  `work/interview-guide.md`).
- **A Taglish test set.** Collect around 30–50 realistic order chats ("pa-reserve po," "COD ba,"
  "magkano shipping") to measure AI accuracy before claiming anything.
- **A PUP mentor** — still an open blocker for the application (`seed/context.md` §4).

---

## Platform reality check

| Platform | Official route | Main catch |
|---|---|---|
| Messenger | Messenger Platform webhooks for a **Facebook Page** | Dev mode works on our own test Page; real businesses' Pages need Meta app review `[verify]` |
| Instagram | Instagram messaging API | Needs a professional (business/creator) account linked to a Page `[verify]` |
| WhatsApp | WhatsApp Business Platform (Cloud API) | Business numbers only, with pricing and number rules `[verify]` |
| Telegram | Bot API | Easiest. Customers message the shop's bot, not the owner's personal account |
| Viber | Viber bots | Commercial terms may not fit a ₱0 budget `[verify]` |

## Why not the browser-extension / Android-WebView scraping idea

- Reading private chats and sending them to our server is the category Meta has sued extension
  makers over, and it breaks Meta's terms.
- Only the owner consents — the customer doesn't — which is a problem under RA 10173.
- Automated scrolling/reading looks like bot activity; the owner's account could get restricted.
- The owner would have to chat inside our app's built-in browser instead of the real apps.
- Meta changes its page code often, and every platform would need its own scraper.
- Judges score real-world feasibility; a product built on breaking platform rules is an easy
  target.

---

## Suggested build order (after the application)

Nothing starts until Mikael's UI design exists (ADR-010). Then, per ADR-003 and
`docs/feasibility.md` §6:

1. AI accuracy test: 30–50 synthetic Taglish order chats through both candidate AI services;
   its result picks the provider, or the fallback form (`seed/idea.md` §9).
2. Sign-in + database with row-level security.
3. Screenshot / paste → draft → Confirm / Edit (F-001, F-002).
4. Logbook and statistics (F-003, F-004).
5. Following changes in a later screenshot (F-005).
6. Business-account connection (F-006): Meta app + test Page and Instagram account, Telegram bot,
   webhook routes, conversation-based drafts, live updates (ADR-012).
7. Later: WhatsApp, Viber, spreadsheet export, Android app.

For the **October 11 application** (Ideation stage), no working build is required. The Solution
and Features slides show both ways as the planned design — neither is shown as already working.
