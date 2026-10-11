# Market scan: MabiList

> **Agent instructions:** Search before writing. For each competitor/alternative, find their
> actual site/app/reviews rather than describing them from general knowledge — things launch,
> shut down, and pivot constantly. Note the check date so staleness is visible later.

**Scan date:** 2026-10-07 · **Method:** web search plus each product's own site, docs, app-store
listing, or help center. Claims below are **what each vendor says about itself** unless marked
otherwise — none of these products was signed up for or tested. Prices change; re-check before
quoting any of them in the deck.

**Headline finding:** reading chats and turning them into orders is **not new**. Several tools
already do it for **business accounts** (Facebook Page, Instagram professional, WhatsApp
Business) through Meta's official APIs, and Meta's own Business Suite lets Page owners create
orders and mark them paid from the inbox for free. One tool already turns **chat screenshots**
into order tables. What the scan did *not* find is a tool that keeps a **running logbook from
screenshots or pastes** — one that updates an existing order as the chat continues, tracks
payment and delivery, and totals sales — for sellers on **personal accounts**.

## Direct competitors

*Tools that read a seller's chats (or chat screenshots) and turn them into order records.
Ordered from closest to MabiList to least close.*

| Name | What they do | Pricing | Strengths | Weaknesses (for this segment specifically) | Checked on |
|---|---|---|---|---|---|
| **Orders App** — https://orders.app/ | Reads WhatsApp Business and Instagram Business DMs and turns each chat into an order (product, address, contact). Follows the whole conversation, so mid-chat changes (size, colour, address) update the captured order. Orders stay editable, link back to the original chat, and sync to Google Sheets. | Free during early access, no card; paid plans "arrive later" | Closest match to our concept, including following mid-chat changes and owner edits | **No Facebook Messenger** — WhatsApp and Instagram only, the reverse of PH consumer preference (EV-006). Needs business accounts (official Meta API). Captures phone numbers and addresses by default. Global product, not Taglish- or PH-specific (unverified). Early access — pricing unknown | 2026-10-07 |
| **MessOrder AI** (KreativDev) — https://codecanyon.net/item/messorder-ai-aipowered-messenger-chattoorder-automation-dashboard-storage-saas/61920735 · docs: https://messorder.php83.kreativdev.com/public/documentation/ | Connects a Facebook Page's Messenger inbox. When the seller types a trigger keyword (e.g., "Order Confirmed"), AI scans the conversation and stores the order (customer, product, quantity, price, address, payment) in a dashboard within 1–2 minutes. Owner can edit; sales reports, statistics, CSV export. | Sold as a white-label SaaS script on CodeCanyon for others to run; end-user price depends on whoever hosts it (not checked) | Almost the same feature set as our F-002–F-004 for Messenger, including AI extraction, editing, and statistics | Page-only. Seller must publish a Meta developer app and type a trigger keyword each time — setup-heavy for a home-based seller. Saves customer info (including address) automatically. A script, not a PH-focused product | 2026-10-07 |
| **Pancake POS** (Pancake, Vietnam; PH presence) — https://pos.pancake.ph/ · https://docs.pancake.biz/pos/st-f4/st-p2/st-s1?lang=en | Multichannel sales system: orders from Facebook inbox, comments, and livestreams; inventory; courier hand-off (SPX, LBC, Flash, J&T); automated status messages. "Automatically create orders from Facebook comments, inbox, and livestream." | POS listed as free; the paid conversation inbox is sold per page/seat in 3/6/12-month terms. iOS app in-app plans: ₱499 / ₱1,790 / ₱2,990 (https://apps.apple.com/ph/app/pancake/id6449825597) | Established, PH-localized, broad feature set; a third-party study claims about 260,000 small sellers (https://roadmap.flyer.vn/pancake/, unverified) | Built for shops with Pages, staff, inventory, and couriers — far more than a solo home-based seller needs. Page-based; no personal accounts. How "automated order" works isn't documented beyond one sentence | 2026-10-07 (order-UI update dated 2026-04-16) |
| **Meta Business Suite — orders in the Page inbox** — https://www.facebook.com/business/help/3401131513471596 · https://www.facebook.com/help/messenger-app/1969981486623740 | Page owners can create an order from a Messenger or Instagram conversation (amount, description), mark conversations as ordered or paid, and see order insights for the Page. | Free | Built into the inbox sellers already use; no extra app. Free | **Manual** — the owner types the order in. Page / professional accounts only; personal profiles excluded. Not a full logbook (no delivery-date view or totals per product found in the help pages) | 2026-10-07 (help-page text read via search excerpt; the page itself didn't render) |
| **Meta GCash receipt verification (PH)** — https://www.facebook.com/help/messenger-app/515883884587897 | When a customer sends a GCash receipt in a Page chat, Meta checks it against GCash and shows the transfer status. | Free; limited release | Solves "did they really pay?" — part of our payment-status problem — directly inside Messenger | Limited release; Page only; payment check only, no order record | 2026-10-07 |
| **ImageToTable.ai** — https://imagetotable.ai/extract/social-commerce-screenshots · pricing: https://imagetotable.ai/blog/imagetotable-pricing-vs-competitors-2026 | Upload chat screenshots (WhatsApp, Instagram, LINE, TikTok, others), name the columns (buyer, item, quantity, amount, address), and AI returns a spreadsheet row per order. Batch upload, Google Sheets export. | Free: 20 credits/month after signup (per its own blog); Basic $9/month for 150 pages | **Does our core feature F-001** — screenshot → structured order — and works with any chat app, personal or business | A one-off converter to a spreadsheet, not a logbook: no order status, no updating an existing order when the chat continues, no payment or delivery tracking, no totals. Generic document tool, not built for sellers. Taglish handling unknown. Credits cap free use | 2026-10-07 |
| **Probaho AI** (Bangladesh) — https://probahoai.com/en/order-automation | AI reads Messenger chats, extracts name, phone, address, product, and creates an order; also auto-replies. | Not checked | Same idea for Messenger | Bangladesh-focused; Page-based; extracts phone and address by default | 2026-10-07 |

### AI chatbots that take the order *for* the seller

*A different approach: a bot talks to the customer and writes the order itself. Relevant
because a judge may ask "why not just use a chatbot?"*

| Name | What they do | Pricing | Strengths | Weaknesses (for this segment specifically) | Checked on |
|---|---|---|---|---|---|
| **Anito Connect** (PH) — https://anitoconnect.com/ | AI assistant for Messenger and website chat; answers in Bisaya, Tagalog, Taglish, or English; collects order details, totals items, guides payment | From ₱499/month; 14-day Pro trial | PH-built, Taglish-aware | The bot replaces the owner in the conversation — a different product. Page-based. Paid | 2026-10-07 |
| **Botcake** (Pancake) — https://botcake.io/ph/use-cases/messenger · https://botcake.io/ph/pricing | Messenger/Instagram chatbot with in-chat order forms, cart, and checkout | First 500,000 automated messages/month free; paid from $30 | Free tier is generous | Customer must go through bot forms — clashes with buyers who just type "pabili po". Page-based | 2026-10-07 |
| **Menue AI agent** (PH, restaurants) — https://www.menue.io/ai-agent | Messenger AI agent that takes orders, sends payment links, answers order status | Not checked | PH payments (GCash, Maya, QR Ph) | Restaurant-focused; needs a Menue storefront; Page-based | 2026-10-07 |
| **VenderIT** (PH) — https://www.venderit.com/services/ai-automation/messenger-chatbot · OMS: https://www.venderit.com/solutions/business-systems/order-management-system | Custom Taglish Messenger chatbot and order system built per client | OMS from ₱99,000 one-time + ₱499/month hosting after year one | Taglish-trained, PH payments | Agency build — priced far above a home-based seller | 2026-10-07 |
| **Replyk** (Morocco) — https://www.replyk.io/ | AI sales agent on WhatsApp, Instagram, Messenger that negotiates and creates COD orders | Not checked | Full COD order cycle | Not PH-focused; replaces the owner in the chat | 2026-10-07 |

## Indirect / substitute alternatives

*Includes manual workarounds, spreadsheets, "do nothing," or adjacent tools people bend to
fit this use case.*

| Alternative | Why people use it instead | Where it breaks down | Checked on |
|---|---|---|---|
| **Notebook / paper logbook** | Free, familiar, no setup; the most common method among PH micro and small businesses (EV-007) | Every order handwritten; changes mean rewriting; receipts get lost; income computed loosely (EV-007) | 2026-10-07 (via EV-007) |
| **Spreadsheet (Excel, Google Sheets)** | Free; totals and sorting | Still retyped from the chat; needs setting up `[assumption]` | not researched — founder reasoning |
| **Memory / scrolling back through the chat** | Zero effort at low volume | Breaks at roughly 10–15 orders a week or 4–6 open orders (founder estimate, A-006); 14 of 18 studied rural micro-enterprises kept no formal records (EV-008) | 2026-10-07 (via EV-008) |
| **Free manual order trackers for chat sellers** — **My Orders PH** (https://myorders.ph/, "100% free"), **WISMO** (https://wismo.live/, free for the first 30 orders, then $9.99/month), **Take App** (https://www.take.app/countries/philippines, free up to 50 orders/month) | Built for sellers who take orders by message; track payment, delivery, customers, sales; some PH-focused | All **manual entry**, or (Take App) require the customer to order through a catalog/checkout link instead of chatting. None reads the chat | 2026-10-07 |
| **Free PH POS / bookkeeping app — Peddlr** (https://www.peddlr.io/en/) | Free mobile POS, expense tracker, credit ledger, profit-and-loss reports; offline; vendor claims 2M+ downloads in the PH | Counter/POS model — the owner enters each sale; doesn't read chats. Businesses already using a POS are excluded from our segment (§2 of `seed/idea.md`) | 2026-10-07 |
| **General AI chatbot (paste a screenshot into ChatGPT, Gemini, etc. and ask for a table)** | Free and already familiar to some sellers | One-off answer each time — no saved logbook, no order status, no totals | not researched — `[assumption]`; worth asking in interviews whether sellers already do this |
| **Hiring a bookkeeper or assistant** | Takes the work off the owner | Unaffordable for many; some prefer to work alone (founder). About ₱2,500–₱5,000 a month outsourced for basic recording; ₱20,000–₱35,000 a month in-house (EV-023, national). NCR cost `unknown` | 2026-10-07 |

## Adjacent government / institutional programs (if relevant)

- **BIR bookkeeping rules for online sellers.** Under the Ease of Paying Taxes Act (RA 11976)
  and RR 7-2024, online sellers — including those selling through social media — must register,
  display their Certificate of Registration on their online profile, issue invoices, and keep
  registered books of accounts (manual, loose-leaf, or computerized)
  (https://www.sunstar.com.ph/cebu/tax-notes-eopt-is-here-updates-on-preservation-of-book-of-accounts-changes-in-taxpayer-registration;
  RMC 91-2024 summary: https://8box.solutions/rmc-no-91-2024/; RMC 65-2025:
  https://www.grantthornton.com.ph/insights/articles-and-updates1/tax-notes/bir-clarifies-bookkeeping-options-for-new-business-registrants/,
  dated 2025-07-16). **Implications:** (1) registered sellers are legally required to keep
  records — a possible "why now" angle; (2) **MabiList is not a BIR book of accounts.**
  Computerized books need a BIR Acknowledgement Certificate, so the deck must never imply BIR
  compliance (`INV-AS-004`; full accounting is out of scope in `seed/idea.md` §10). These are
  secondary summaries by tax firms and news — not the BIR issuances themselves.
- **DTI support for MSME digitalization.** The MSME Development Plan 2023–2028 makes
  digitalization the main strategic shift
  (https://dtiwebfiles.s3.ap-southeast-1.amazonaws.com/BSMED/MSMED+Plan+2023-2028/MSMED+Plan+2023-2028_approved+07Nov2024.v2.pdf).
  DTI publishes a free *Simplified Accounting Handbook for Small Business*
  (https://www.dti.gov.ph/dti-business-center/dti-msme-publications), runs e-commerce training
  such as Unlad Lokal with TikTok Shop (https://insiderph.com/dti-tiktok-forge-pact-to-boost-msme-growth-with-digital-skills-training,
  2025-09-01), and reported onboarding 16,000 MSMEs to e-commerce platforms in 2025
  (https://pia.gov.ph/news/dti-promotes-business-registration-digital-readiness-during-msme-week-2026/).
  None of these record chat orders; they're potential **distribution partners** (Negosyo
  Centers, Kapatid Mentor ME) rather than competitors.

## Positioning summary

The scan contradicts the idea that "no tool follows the conversation"
(`work/problem-capture.md`, Chain A why 4): for **business accounts**, Orders App, MessOrder
AI, Pancake, and Probaho already turn chats into orders, and Meta itself offers free order
tracking and GCash verification in the Page inbox. MabiList can't win there on features. The
open space is narrower and specific: **home-based PH sellers who take orders on personal
Messenger and Instagram accounts**, which every chat-reading tool excludes because the official
APIs only cover business accounts. For them, today's options are a notebook, a manual tracker
(My Orders PH, WISMO), or a one-off screenshot converter (ImageToTable.ai) that produces a
spreadsheet but no running record. MabiList would sit in that gap: screenshots or pastes
become a **running logbook** that updates the same order as the chat continues, tracks payment
and delivery, and totals sales — **free**, with owner confirmation before anything counts, and
keeping only order details rather than phone numbers and addresses (competitors capture those
by default). Two things this positioning depends on and the scan can't answer: whether a large
share of beachhead sellers really sell from **personal** accounts (if most use Pages, free Meta
tools and Pancake cover them), and whether MabiList handles **Taglish** better than generic
tools — both unverified.

## Sources checked but found nothing relevant

*Worth recording — it shows the search was real, and stops you or a teammate re-searching the
same dead end later.*

- Search for a Philippine-built tool that turns chat **screenshots** into a running order
  logbook with payment status and totals (2026-10-07): **none found.**
- Search for any chat-to-order tool that supports **personal** Messenger/Instagram accounts
  through official means (2026-10-07): **none found** — every chat-reading tool found requires a
  Page, Instagram professional, or WhatsApp Business account.
- Meta Business Help Center page on creating orders from conversations
  (https://www.facebook.com/business/help/3401131513471596): page body didn't render when
  fetched; facts above come from the search-result excerpt of that page.
- ImageToTable.ai pricing page (https://imagetotable.ai/pricing): returned 404; pricing taken
  from its own comparison blog post instead.
- Shut-down chat-to-order startups (searched 2026-10-07): **AVANA** (Malaysia, closed January
  2023, EV-021) and **Orderdulu** (Indonesia, closed August 2023, EV-022) — details in
  `work/problem-capture.md` "Who else has tried." **Sellsuki** (Thailand, chat-order invoicing
  for Facebook sellers, https://startupxplore.com/en/startups/sellsuki): current status not
  confirmed. No failed screenshot-based or personal-account tool found.
- Not searched (interview question instead): whether sellers already paste screenshots into
  ChatGPT/Gemini.
