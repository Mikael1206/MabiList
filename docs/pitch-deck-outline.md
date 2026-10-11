# Pitch Deck Outline & Judge Prep — MabiList

**Version:** 0.1 · **Status:** Draft — for the PSC XI NCR application deck (PDF due with the
application by 2026-10-11; finish by 2026-10-10)

> **Agent instructions:** Every number or claim in this outline must trace back to `seed/`,
> `work/`, or `business-canvas.md` — do not invent a statistic to make a slide punchier. Write
> the script the way the founder actually talks; read it out loud and time it against the
> event's slide/time limit (check `seed/context.md §6`).

*Written 2026-10-07. **Format rules** (`seed/context.md` §6): PDF, under 30 slides, no
animations, videos, or sounds, no official template. **Required sections:** Problem Description,
SDG Priority, Target Market Segment, Business Model, Solution, Features, Proposed use of funds /
asks from investors, Progress / Traction — each mapped below. This is the **Ideation-stage**
deck: nothing is built yet, so there's no live demo, and every product statement says "designed
to," not "does." Visual design is the founder's (ADR-010).*

## 1. Slide-by-slide (adapt count to the event's actual limit)

15 slides. Placeholders in `{braces}` get filled only if the fact exists by 2026-10-10.

| # | Slide | Content | PSC section | Source |
|---|---|---|---|---|
| 1 | Title | **MabiList** — "One logbook for every chat order." Team names, PUP Sta. Mesa, PSC XI NCR, Ideation stage. Mentor: {name — required before submitting} | — | `seed/context.md` §1, §4 |
| 2 | Hook | "91.6% of Filipino consumers surveyed prefer to message small businesses on Messenger (n = 300)." Then: "Most Philippine micro businesses still keep their records in notebooks." Ask: so who copies each chat order into the notebook? *The owner — by hand.* | Problem Description | EV-006, EV-007 |
| 3 | The problem | A chat order forms bit by bit — inquiry, price, a change, delivery date, payment proof — often over hours or days. The owner copies it out by hand, and fixes the record every time the order changes. Lost receipts and incomplete records cost owners money and clarity. The pain is the seller's own time, taken from selling | Problem Description | `seed/idea.md` §1, §4; EV-007 |
| 4 | Why it isn't solved | Tools that read chats only work with **business** accounts (Pages) — official APIs don't cover personal accounts. Sellers on personal Messenger and Instagram accounts are left with notebooks, typed-in trackers, or one-off screenshot converters. A seller who uses both kinds of account ends up with two records `[assumption — A-008]` | Problem Description | EV-011, EV-012, EV-013, EV-014 |
| 5 | What we know — and don't yet | **Known:** PH micro businesses keep manual records (EV-007); consumers prefer to message small businesses on Messenger and Instagram (EV-006), and half of surveyed online MSMEs use Facebook apps with customers (EV-005). **Not yet known:** whether chat sellers feel this as a pain (EV-010) and how many hours it takes Filipino sellers (EV-009) — that's what our interviews measure. Interviews done: {N, as of date} | Problem Description, Progress | `work/evidence-ledger.md`; `seed/idea.md` §3 |
| 6 | SDG priority | **SDG 8** (primary) — target 8.2, productivity through technology: time spent copying orders goes back to selling; target 8.3, growth of micro and small enterprises. **SDG 9** (secondary) — target 9.3, small enterprises' access to markets and value chains: a simple digital record for sellers who work entirely in chat. "We'd contribute for our users; we don't claim national impact" | SDG Priority | `seed/idea.md` §1 |
| 7 | Target market | **First:** home-based NCR sellers who take orders in Messenger and Instagram chats — on **personal** accounts (the main gap), on business accounts, or both — not on Shopee, Lazada, or TikTok Shop. **Ceiling:** "Up to 2 million online sellers nationally" (DTI estimate for 2022). NCR holds the largest share of registered MSMEs: 204,844 (18.54%). **Our segment's size is what interviews are measuring** | Target Market Segment | `seed/market.md`; EV-004, EV-016 |
| 8 | Alternatives | Notebook/spreadsheet — retyping, lost receipts. Manual trackers (My Orders PH, WISMO, Take App) — still typed in. Screenshot converter (ImageToTable.ai) — one-off rows, no running record. Business-account tools (Orders App, MessOrder AI, Pancake, Meta Business Suite) — can't read personal accounts, so personal-account orders stay in a separate notebook | Solution (context) | `seed/market.md` competitive table |
| 9 | Solution | "MabiList is designed to turn chats into order records — items, delivery date, payment status — and keep them updated as the chat continues, in one logbook. Two ways in: for a **personal** account, a screenshot or pasted messages; for a connected **Facebook Page, Instagram professional account, or Telegram shop bot**, new messages arrive on their own. The owner confirms every entry. It's designed to keep only the order details, not customers' phone numbers or addresses." | Solution | `seed/idea.md` §6; `business-canvas.md`; ADR-012 |
| 10 | How it works | Two inputs, one flow, as a picture. **Way 2 (personal account):** ① screenshot or paste the chat. **Way 1 (business account):** ① connect once; customer messages arrive through Meta's and Telegram's official webhooks. Then, for both: ② AI drafts the order (blanks stay blank — no guessing) → ③ owner checks and taps Confirm → ④ it's in the logbook and the sales totals; the chat is deleted. Concept screens from the founder's design, labelled "concept — not yet built" | Solution | `sdd.md` §1, §3; `design-brief.md` §2 |
| 11 | Features | MVP: screenshot/paste → order (F-001), confirm/edit (F-002), logbook by delivery date and payment (F-003), sales totals and statistics (F-004), follow changes as the chat continues (F-005), owner sign-in (F-007), connect a Facebook Page, Instagram professional account, or Telegram shop bot (F-006 — built after the screenshot flow; real Pages after Meta approves the app). Later: WhatsApp, Viber, spreadsheet export, Android app | Features | `prd.md` §3, §8 |
| 12 | Business model | **Free up to a monthly order limit; paid plan above it.** Heavy sellers — who cause the most AI cost and feel the pain most — are the ones who pay. Why: an earlier order tool for micro-sellers (AVANA) shut down when cheap flat subscriptions didn't cover rising server costs. The limit and price are set after interviews and the prototype measure order volumes, willingness to pay, and AI cost per order | Business Model | `business-canvas.md`; ADR-005; EV-021 |
| 13 | Progress / traction | Honest Ideation-stage progress: sourced evidence ledger (EV-001 – EV-024); competitor scan; interview guide (Taglish, Data Privacy Act consent); full product spec, system design, and test plan; interviews: {N done / 0}. **No users, no revenue, no prototype yet.** Next: an AI accuracy test on 30–50 synthetic Taglish chats (target 90%) | Progress / Traction | `work/`; `docs/index.md`; `seed/idea.md` §8 |
| 14 | What we're testing next | Riskiest beliefs: sellers will switch from the notebook because it's faster (A-001); sellers will trust it with customer chats (A-005); AI reads Taglish chats accurately (A-003). Also: whether business-account sellers will connect and want one logbook (A-008). If accuracy stays under 70% overall or 80% on key fields, we switch to an AI-assisted form | Progress / Traction | `seed/idea.md` §9 |
| 15 | Asks / use of funds | **Asks:** 5–10 home-based NCR sellers for a pilot, with personal accounts and with Pages; mentorship on business model, on Data Privacy Act review before real chats, and on Meta's app review. **Use of funds:** AI processing beyond free tiers; paid hosting and database (free plans are non-commercial or pause when idle); a privacy review. Amounts set after the prototype measures AI cost per order — no figure yet | Proposed use of funds | `business-canvas.md` cost structure; `feasibility.md` §4; ADR-009 |

**Words to keep out of every slide:** "automatic" for personal accounts (capture is one upload
per conversation — `seed/idea.md` §6; for connected business accounts, say messages "arrive on
their own once connected," ADR-012), anything showing Way 1 as already working, "compliant" or
"secure" (INV-010), any accuracy or time-saved figure (nothing
measured), "2 million users/customers," testimonials, logos of companies we haven't worked with
(INV-AS-004).

## 2. The 60-90 second version (elevator pitch script)

*Write this as continuous prose the founder would actually say out loud, not bullet points.
Time it — most events have a hard limit.*

About 210 words — roughly 85 seconds at a calm pace. Read it aloud and adjust.

> In one survey, nine in ten Filipino consumers said they prefer to message small businesses on
> Messenger. So a lot of selling happens in chats — and for a home-based seller, every order in that chat has
> to be copied into a notebook by hand: who ordered, what, how much, when to deliver, whether
> they've paid. When the customer changes the order, the owner finds the note and fixes it. On a
> busy day, things get mixed up.
>
> Tools that read chats exist, but only for business Pages. Sellers on personal accounts are left
> with the notebook — and sellers with both end up keeping two records.
>
> MabiList is designed to give them one logbook. On a personal account, the seller takes a
> screenshot of the chat. On a connected Page, Instagram business account, or Telegram shop bot,
> new messages come in on their own. Either way, our AI drafts the order, the owner checks it and
> taps Confirm — nothing counts until they do — and it lands in a logbook with deliveries due,
> unpaid orders, and sales totals. We're designing it to keep only order details and delete the
> chat.
>
> We're at the idea stage. Next, we're testing whether the AI reads Taglish chats accurately, and
> whether sellers find it faster than their notebook. We're looking for sellers to pilot it with
> us.

## 3. Judge scrutiny prep — the questions you're avoiding are the ones to rehearse

*Pull the weakest points straight from `work/evidence-ledger.md`'s "Known weak points" and
`feasibility.md`'s uncertain items — don't soften them here.*

| Likely question | Honest answer | What NOT to say |
|---|---|---|
| "How do you know people actually want this?" | "We don't yet. We know micro businesses keep manual records and that customers prefer to message small businesses on Messenger, but no study asks chat sellers about this. That's what our interviews ask, and the pilot measures whether they actually keep using it." Cite interviews if any are done | "Sellers love it" / "there's huge demand" |
| "How many hours do Filipino sellers lose?" | "Unknown — the only figures are US and UK surveys, and we won't quote them as Philippine. We'll time sellers logging one order during interviews." | Quoting 15 or 20 hours a week as a Philippine figure |
| "Most sellers do under 50 orders a month — is your segment big enough?" | "Fair point; that's about 12 a week, near where we think the pain starts. We're recording real weekly volumes in interviews. If the pain only hits heavy sellers, our free tier covers the light ones and the heavy ones are who'd pay." | "Our market is 2 million sellers" |
| "A recent seller survey doesn't list order recording as a pain" | "True — logistics and competition top it. It may not have been asked. That's exactly why we interview before building." | Dismissing the survey |
| "Why don't sellers just make a Facebook Page and use existing tools?" | "Some will, and we connect Pages too. But those tools can't see the seller's personal-account chats, so many sellers would still keep a second record. Our bet is one logbook for both — that's an assumption the interviews check." | "Nobody uses Pages" |
| "Why won't Meta or Orders App just do this?" | "They can't read personal chats either — the official APIs only cover business accounts. A screenshot tool could add a running logbook, though; our edge isn't proven yet. What we're testing is Taglish accuracy, how light the flow is for home sellers, and whether one logbook across both account types matters to them." | "We have no competitors" / "they can't copy us" |
| "Meta has to approve apps that read Page messages. What if it doesn't?" | "Right — until Meta approves the app, the Page connection works only on our own test Page. The screenshot flow doesn't need Meta at all, so the pilot runs on it either way. We apply once the test-Page version works." | "We're already approved" / "Meta will approve it" |
| "Why Telegram and not WhatsApp or Viber?" | "Telegram's bot connection is free and simple to set up. WhatsApp's business platform has number rules and per-conversation pricing we haven't checked for a ₱0 budget, and Viber is less preferred by customers in the one survey we found. Both are on the later list." | "WhatsApp is too hard" without the reason |
| "How accurate is the AI on Taglish?" | "Not measured yet. Our target is 90% of fields right without an edit; if it's under 70% overall or 80% on key fields like price and payment, we switch to an AI-assisted form. The owner confirms every entry either way." | Any accuracy number |
| "What about the Data Privacy Act?" | "Customer chats are personal data, so the build and demo use synthetic chats only. Before real chats: an AI service that doesn't train on inputs, a privacy notice, terms with sellers, and a review with our mentor. It's designed to keep only order details and delete screenshots." | "We're DPA-compliant" |
| "What happens if the AI service is down or the free tier runs out?" | "The upload shows as failed with a retry, and the owner can enter the order by hand. The AI sits behind one replaceable function, so we can switch providers." | "It never fails" |
| "AVANA shut down. Why won't you?" | "AVANA's flat cheap plans didn't cover costs. We charge heavy users above a monthly order limit, so revenue grows with AI cost — and we set the price only after measuring cost per order." | "We'll figure out money later" |
| "How is this different from pasting into ChatGPT or ImageToTable?" | "Those give a one-off answer. MabiList keeps a running record: the order updates when the chat continues, with payment, delivery dates, and totals, and nothing counts until the owner confirms." | "ChatGPT can't do this" |
| "Why not read their Messenger directly?" | "We do for business accounts — a connected Page or Instagram professional account sends messages through Meta's official webhooks. For personal accounts, the only way is scraping, which breaks Meta's terms, risks the seller's account, and processes customers' data without their say. So personal accounts use screenshots." | Hinting at a browser extension |
| "Doesn't connecting a Page send you every customer message?" | "Yes, every message on that Page. Messages that aren't orders never become entries, and every message is deleted when the owner confirms or discards the entry, or after 7 days. The seller is told this before connecting." | "We only see orders" |
| "Is this a BIR-compliant book of accounts?" | "No. It's an order logbook, not accounting or tax software." | Anything implying tax compliance |
| "Why you?" | "We're three PUP CS students in NCR who know sellers like this personally, with a stack we've already worked in. Our edge isn't proven — the interviews and accuracy test are how we earn one." | Claiming an unfair advantage |

## 4. Demo script / backup plan

*Ideation stage: the application needs no working build (`seed/context.md` §1). This section is
for the Regional Competition, if shortlisted, once the prototype exists.*

- **Primary demo flow:** sign in → Add from chat → pick a synthetic Taglish screenshot →
  "Reading the chat…" → draft with one field marked "not in chat" → type the missing value →
  Confirm → logbook shows the order → newer screenshot ("3 na lang po, paid na") → suggested
  update shown field by field → apply → statistics update. Then Way 1: a teammate messages the
  team's **test** Page from a second phone → the draft appears in the open logbook with source
  "Messenger" → Confirm.
- **If wifi/live demo fails:** recorded walkthrough of the same flow; manual entry if the AI call
  fails on stage; if the webhook doesn't arrive, continue with the screenshot flow
  (`qa-test-plan.md` §3).
- **Data shown during demo:** synthetic chats only, labelled "Sample data" (INV-009, INV-011).
  No real customer names or numbers.

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial outline for the PSC XI NCR application deck |
| 2026-10-08 | Two ways in the MVP (ADR-012): slides 1, 4, 7–11, 14, 15; word rule; elevator script; four judge questions; demo flow |
