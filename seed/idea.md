---
status: unvalidated-by-choice   # unvalidated-by-choice | validated | invalidated
riskiest_assumption: A-001, A-005   # habit switch; trust with customer chats
last_updated: 2026-10-07
---

# Idea: MabiList

> **Agent instructions:** Interview the founder section by section — don't dump all nine
> sections as one question. Push for specifics over vibes ("PH gig workers" is not a segment;
> "solo motorbike food-delivery riders in Metro Manila who own their bike" is). Where the
> founder is guessing, write `[assumption]`, not a confident-sounding sentence. Do not fill
> §3 (Evidence) from your own training knowledge — that belongs in `work/evidence-ledger.md`,
> researched, then summarized back here with `EV-###` references.

## 1. Problem statement

*What's actually going wrong, for whom, and why does it matter? Two to four sentences. No
solution language yet — just the pain.*

Small business owners who sell through messaging apps (Facebook Messenger, Instagram, Telegram,
Viber, WhatsApp) close deals inside chat threads, but the record of each deal — who ordered
what, how much, when, and whether it's paid — has to be copied out afterward by hand into a
notebook or spreadsheet. Most can't afford someone whose only job is keeping the books, so the
owner does it, and every hour spent re-typing orders, matching receipts, and scrolling back
through chats is an hour taken from revenue-generating work like marketing, finding new
customers, or improving the product. When the copying is skipped or done late, orders and
receipts go missing and the owner loses a clear picture of what the business actually earns.

**Claim status (what's evidenced vs. assumed):**

| Claim in the statement above | Status |
|---|---|
| Philippine micro and small businesses record transactions by hand (notebooks, single-entry) | Evidenced — EV-007 (supporting: EV-008) |
| Incomplete records and lost receipts cost the owner money and clarity | Evidenced — EV-007 |
| Small sellers take orders through messaging apps, Messenger above all | Partly evidenced — EV-005, EV-006 (Messenger and Instagram dominate; Viber and WhatsApp are far smaller) |
| Chat-based sellers specifically must copy orders out of chats by hand, and find it painful | `[assumption]` — EV-010 unknown; needs interviews |
| Owners can't afford a dedicated bookkeeper | `[assumption]` — founder's statement; EV-007 notes some outsource bookkeeping. Cost is known: about ₱2,500–₱5,000 a month outsourced, ₱20,000–₱35,000 in-house (EV-023); whether beachhead sellers can afford it is unknown |
| Manual bookkeeping takes many hours a week | Evidenced **for the US and UK only** — EV-001, EV-002; Philippine figure unknown (EV-009) |
| Time spent on bookkeeping is taken from revenue-generating work | `[assumption]` — founder's reasoning; EV-002 makes the same argument for UK micro-businesses |

**SDG priority** (required in the deck, `seed/context.md` §6) [founder, 2026-10-07]:
- **Primary — SDG 8, Decent Work and Economic Growth.** Target 8.2: higher productivity through
  technological upgrading and innovation — time copying orders goes back to selling. Target
  8.3: the growth of micro, small, and medium-sized enterprises — the beachhead is micro,
  home-based sellers (EV-003).
- **Secondary — SDG 9, Industry, Innovation and Infrastructure.** Target 9.3: small enterprises'
  integration into value chains and markets — a simple digital record for sellers who work
  entirely in chat.
- *Keep the claim proportionate:* MabiList would contribute to these targets for its users; it
  doesn't move national indicators, and no impact number exists yet (`INV-AS-004`).

## 2. Target segment

*Who exactly has this problem? Be narrow enough that you could recruit five real people from
this description for an interview tomorrow.*

**Primary segment:** Small business owners of any product or service type and any size up to
small (solo sellers through small teams) who take orders and close deals through social
messaging apps — Facebook Messenger, Instagram, Viber, and Telegram — on **both personal and
business accounts**, and who log those deals by hand today [founder, 2026-10-07].

- **Product type:** any [founder]
- **Business size:** any, within small business [founder]
- **Order channel:** messaging apps, personal and business accounts [founder]. Consumer
  preference is heavily skewed to Messenger (91.6%) and Instagram DM (54.2%), with Viber at
  5.3% (EV-006) — so Messenger and Instagram likely cover most chat orders. WhatsApp was named
  in §1 but not here; treat it as lower priority unless interviews say otherwise.
- **Location:** Philippines; NCR first, since that's where the team is and where the largest
  share of MSMEs is (EV-004) [NCR-first confirmed by founder, 2026-10-07]

**Beachhead (the narrower group we interview and pitch first):** **Home-based sellers in NCR**,
selling any product or service, who take orders through **Facebook Messenger and Instagram**
chats **on their personal accounts**, with many chat orders a week that each have a **delivery
date and a payment** to track [founder, 2026-10-07; personal-account focus from ADR-004].
**Business-account sellers are served in the MVP too** (ADR-012): those who sell from a Facebook
Page, an Instagram professional account, or a Telegram shop bot connect it once (F-006), and both
kinds of seller share one logbook. Personal-account sellers stay the main gap the pitch
emphasizes, since tools for business accounts already exist (EV-011, EV-012). The broad segment
above stays as the long-term market.

*Volume screener (for interviews and testers, not yet a hard exclusion):* prioritize sellers
with about 10+ chat orders a week, or 4+ orders open at once — where the founder estimates the
pain starts (§4, A-006).

*What makes this findable:* the team knows 1–2 such sellers personally [founder, 2026-10-07].
*Gap:* EV-005, the main chat-selling survey, excluded home-based businesses — so the beachhead
has almost no published evidence yet, and interviews are the main way to get it.

**Not in this segment (explicitly excluded):** — *this list is as useful as the
inclusion list; it stops feature creep later.*

- Businesses that **already use an automated logbook** — POS systems, accounting or
  bookkeeping software — because their transactions are already recorded automatically
  [founder, 2026-10-07].
- **Sellers who sell on online marketplaces with their own checkout** — Shopee, Lazada, TikTok
  Shop, Amazon, and similar — because the marketplace already records every order, payment, and
  shipment [founder, 2026-10-07]. They are **fully out of scope, including any Messenger or
  Instagram orders they also take** [founder, 2026-10-07; scope cut logged in
  `docs/decision-ledger.md` §3]. *Facebook Marketplace is not excluded:* it has no checkout, and
  its orders are closed in Messenger chats [confirmed by founder, 2026-10-07].

## 3. Evidence

*Do not write these from memory. Pull them from `work/evidence-ledger.md` after research is
done, and cite the `EV-###` IDs.*

| Claim | EV-### | Source | Date |
|---|---|---|---|
| Small business owners spend ~20 h/week on accounting work (US) | EV-001 | Cornerstone Advisors via Tight | Q4 2023 |
| Micro-businesses spend 15 of 79 weekly hours on financial admin (UK) | EV-002 | Starling Bank / Opinium | 2020-01-08 |
| 1,241,733 Philippine MSMEs; 1,127,058 micro (90.43%) | EV-003 | DTI / PSA 2023 List of Establishments | 2023 data |
| NCR holds 204,844 MSMEs (18.54%), the largest regional share | EV-004 | DTI / PSA 2022 List of Establishments | 2022 data |
| 52% of surveyed online PH MSMEs use Facebook apps to talk to customers | EV-005 | DAI / Ipsos (prepared for Facebook, Inc.) | Jun–Jul 2021 |
| 91.6% of 300 PH consumers prefer MSME messages on Messenger | EV-006 | Casimiro et al., *JBMS* | 2022-04-09 |
| PH micro/small businesses mostly keep manual notebook records; lost receipts cause losses | EV-007 | Borromeo et al., *RBES* | 2024-06-26 |
| Business-account chat-to-order tools already exist; Meta offers free order tracking for Pages | EV-011, EV-012 | Vendor sites / Meta Help Center | checked 2026-10-07 |
| A screenshot → table converter exists but keeps no running record | EV-013 | ImageToTable.ai | checked 2026-10-07 |
| No chat-reading tool supports personal accounts | EV-014 | Market scan | 2026-10-07 |
| Online sellers must keep registered books of accounts (BIR) | EV-015 | Tax-firm / news summaries | 2024–2025 |
| DTI estimated about 2 million PH e-commerce participants in 2022 | EV-016 | BusinessWorld (DTI verbal estimate) | 2022-10-04 |
| Most PH e-commerce sellers process fewer than 50 orders a month; top pains are logistics and competition, not order recording | EV-017 | Milieu Insight | 2025-12-12 |
| Small online sellers (Naga City, n = 30) rank lack of personal time as their biggest personal challenge | EV-018 | Alinarte et al., *GPH-IJBM* | 2025-01-24 |
| The PH selling peak runs September to New Year, with Q4 sale days | EV-020 | FedEx SME survey (Inquirer); Criteo (BusinessWorld) | Sept–Dec 2025 |
| Earlier chat-order tools for micro-sellers shut down: AVANA (cheap subscriptions didn't cover costs), Orderdulu (absorbed by Take App) | EV-021, EV-022 | The Runway (founder interview); Vulcan Post | Jan 2023; Aug 2023 |
| Outsourced basic bookkeeping for a home-based business costs about ₱2,500–₱5,000 a month | EV-023 | Loft (bookkeeping provider) | 2025-10-17 |
| NCR micro businesses skip accounting software over cost, skills, and infrastructure, not dislike of technology (n = 13) | EV-024 | Geamoga et al., *IJERIP* | 2026-07-19 |

*Full sources, caveats, the `unknown` rows (EV-008 to EV-010), and EV-019 (commentary only, not
counted as evidence) are in `work/evidence-ledger.md`.*

**The five tests** (score from the ledger, not from confidence — see `AGENT_ROUTING.md §4`):

*Re-scored 2026-10-07 after the second evidence pass, with 0 interviews. Every test is honestly
`unknown` — this is what the interviews and prototype must change. What would flip each one is
listed in `work/evidence-ledger.md`.*

| Test | Pass / Fail / Unknown | Why |
|---|---|---|
| Real | Unknown | PH micro businesses keep manual, error-prone records (EV-007, EV-008), but nothing yet from chat sellers themselves (EV-010); the one recent seller survey doesn't list order recording among top pains (EV-017) |
| Large | Unknown | Broad ceiling: about 2 million online sellers (EV-016), 1.24M registered MSMEs, 204,844 in NCR (EV-003, EV-004). The beachhead's share is unknown — personal accounts (A-007) and 10+ orders a week (A-006), when most sellers do under 50 a month (EV-017) |
| Significant | Unknown | Time cost evidenced only for the US and UK (EV-001, EV-002); PH figure unknown (EV-009); PH sellers say time is scarce (EV-018); lost receipts cause losses, qualitatively (EV-007) |
| Urgent | Unknown | Candidate recurring clock: the September–December peak (EV-020), not yet shown for chat sellers; BIR record-keeping rules apply to registered sellers only (EV-015) |
| Relevant | Unknown — leaning pass | Solved for business accounts (EV-011, EV-012); open for personal accounts (EV-013, EV-014) — but that rests on one day's search and on A-007. Earlier chat-order tools for micro-sellers failed on their business model, not on demand (EV-021, EV-022) |

## 4. Root cause (the WHY)

*Five-whys or equivalent. What's the structural reason this problem exists and hasn't been
solved by an obvious fix already? See `work/problem-capture.md` for the worked version.*

**Root cause:** A chat order forms gradually inside an unstructured conversation — inquiry,
price, a change, delivery date, payment proof, often hours or days apart. For sellers on
**personal** Messenger and Instagram accounts, no tool can read that conversation — the
official APIs only cover business accounts (EV-014) — and every record-keeping option they can
use (notebook, spreadsheet, manual order tracker, one-off screenshot converter) expects a
finished order typed or converted by a person. So the owner is the only bridge between the chat
and the record: the work is manual, it repeats every time an order changes, and it fails first
on busy days.
`[assumption — restated 2026-10-07 after the market scan (ADR-004); 0 interviews so far]` Full
analysis: `work/problem-capture.md` (second pass); competitors: `work/market-scan.md`.
For sellers who also take orders on a Page or business account, tools that read those chats
exist, but none found also covers personal-account chats, so a seller using both keeps two
separate records `[assumption — added with ADR-012; interviews to check how many sellers use
both]`.

**When the pain starts** `[assumption — founder estimate, 2026-10-07]`: memory works up to about
5–8 chat orders a week when each order is finished before the next starts. It breaks at about
10–15 a week, or sooner when 4–6 orders are open at once (unpaid, undelivered, or both, often
due on different days). Then the seller mixes up who ordered what, who paid, and which day to
deliver — and busy days are when orders go missing. Sellers below this volume may not feel the
problem at all.

**Why the obvious fixes haven't closed it** [founder, 2026-10-07]:
- **Existing tools:** too much setup, or sellers don't know they exist. For personal-account
  sellers, every tool they can use still needs each order typed in by hand or converted one
  screenshot at a time with no running record (EV-013, EV-014). Business-account tools that read
  chats exist but don't reach personal accounts (EV-011).
- **Copying from chat is slow:** screenshotting and copying takes time, and when order details
  change mid-conversation the record has to be found and fixed.
- **Hiring help:** many owners can't afford a bookkeeper, and some prefer to work alone.
- **When it breaks:** busy days in general.

**Contradiction to keep in view:** if setup is why sellers avoid existing tools, our product's
own setup (uploading screenshots or pasting chats) must be clearly lighter — otherwise
that reason applies to us too. See `work/problem-capture.md` for this and three other
contradictions.

## 5. Market & alternatives

- **Size band:** Outer bound only: about 2 million online sellers nationally (DTI estimate for
  2022, EV-016); 1,241,733 registered Philippine MSMEs, 1,127,058 of them micro (EV-003);
  204,844 MSMEs in NCR (EV-004). How many are **home-based NCR sellers taking chat orders on
  personal accounts at 10+ orders a week** is `unknown` — registered counts miss informal online
  sellers, the main chat-selling survey excluded home-based businesses (EV-005), and most sellers
  handle fewer than 50 orders a month (EV-017), so the volume screener may cut the number
  sharply. Excluding sellers who also use Shopee, Lazada, or TikTok Shop (§2) cuts it further —
  in EV-017, 52% of sellers use Shopee and 46% TikTok Shop. Do not quote 2 million or 1.24M as the market in the deck; they're ceilings, not the
  segment. Summary for judges: `seed/market.md`.
- **Reachability:** First 1–2 sellers the team knows personally, then one referral each
  (`work/evidence-ledger.md`). Possible later channels: DTI Negosyo Centers and the Kapatid
  Mentor ME program (`work/market-scan.md`) `[assumption — not contacted]`.
- **Top 3 alternatives + their key failure** (`work/market-scan.md`, checked 2026-10-07):
  1. **Notebook, spreadsheet, or memory ("do nothing")** — fails at keeping up once orders
     overlap: every order and every change is retyped, receipts get lost (EV-007), and memory
     breaks at roughly 10–15 orders a week (A-006).
  2. **Free manual order trackers (My Orders PH, WISMO, Take App)** — fails at the copying
     itself: the owner still types each order in, or the customer must order through a
     checkout link instead of chatting.
  3. **One-off screenshot converters (ImageToTable.ai) or pasting into a general AI chatbot** —
     fails at keeping a record: each screenshot becomes a separate row or answer, with no order
     status, no update when the chat continues, and no totals (EV-013; chatbot use
     `[assumption]`).
  *Business-account tools* (Orders App, MessOrder AI, Pancake, Meta Business Suite) can't read
  personal accounts (EV-011, EV-014), so they aren't an option for personal-account sellers. For
  sellers with a Page or business account they are direct competitors to `F-006` (ADR-012).

## 6. Value proposition

*Fill this Geoffrey Moore-style template — resist the urge to make it fancier than it needs
to be:*

> For **{segment}** who **{problem}**, {Project Name} is a **{category}** that **{key
> benefit}**, unlike **{main alternative}**, because **{reason to believe}**.

> For **home-based NCR sellers who take orders in Messenger and Instagram chats — on personal
> accounts, business accounts, or both** — and **lose time copying each deal into a notebook or
> spreadsheet**, MabiList is a **sales logbook built from their chats** that **turns a chat into
> an order record — items, delivery date, payment status — and keeps that order updated as the
> chat continues: from a screenshot or pasted text for personal accounts, and from messages that
> arrive on their own once a Page, Instagram professional account, or Telegram shop bot is
> connected**, unlike **a notebook, a spreadsheet, a one-off screenshot converter, or tools that
> only read business accounts**, because **it builds one running record across both kinds of
> account instead of asking the owner to retype anything, keeps only the order details rather
> than customers' phone numbers and addresses, and the owner reviews and can correct every
> AI-made entry before it counts.**

[founder, 2026-10-07; restated for personal-account sellers per ADR-004; both account types per
ADR-012, 2026-10-08]

**Reasons to believe, and what each one covers:**
- **Running record, not a one-off conversion** — a screenshot updates an existing order
  (F-005) and feeds payment status, delivery dates, and totals (F-003, F-004). The closest
  screenshot tool, ImageToTable.ai, outputs one spreadsheet row per screenshot and keeps no
  order state (EV-013). **Design, not yet built.**
- **One logbook for both account types** — screenshots and pasted chats (F-001) and connected
  business accounts (F-006) feed the same logbook. No tool found in the market scan covers both
  (EV-013, EV-014). **Design, not yet built.**
- **"Automatic" needs care in the deck.** For personal accounts, capture is one upload or paste
  per conversation, then the AI fills the entry — not hands-free. Say "turns a screenshot into an
  order in one tap," not "records orders by itself" or "reads your Messenger." Only for a
  connected business account do messages arrive on their own (`F-006`), and only once built.
- **Owner review and correction** — the owner confirms or edits every AI entry before it counts,
  so AI misreads are caught. This is an honest, checkable promise.
- **Privacy — keeps only the order details** — decided 2026-10-07 (`docs/decision-ledger.md`
  ADR-002, `INV-001`). Raw chats and screenshots are deleted once the owner confirms the entry;
  the logbook keeps only customer display name, items, quantity, price, delivery date, and
  payment status. **Design commitment, not yet built** — in the deck, say "designed to," not
  "does," until it's tested. Competitors capture phone numbers and addresses by default
  (Orders App, MessOrder AI, Probaho AI — `work/market-scan.md`).

## 7. Feature set

### MVP — smallest path to core value + a learning signal

*Every feature gets an ID and a one-line justification tying it back to §1/§3. This is the
list that becomes `docs/prd.md`.*

**Core feature:** `F-001`. If it alone works, the idea is proven [founder, 2026-10-07;
`docs/decision-ledger.md` ADR-003]. The MVP has **two ways in** (ADR-012): screenshots or paste
for personal accounts (F-001) and connected business accounts (F-006). Features are listed in
build order.

- **F-001 — Screenshot or paste → logbook entry (core).** The owner uploads a chat screenshot or
  pastes the text; AI reads it and creates a structured logbook entry: customer display name,
  items, quantity, price, delivery date, payment status. Unknown fields stay empty — the AI
  must not guess a price that wasn't mentioned. → solves the copying itself (§1); works for
  personal *and* business accounts with no platform setup. Evidenced by EV-007 (manual
  recording is the norm); that screenshots are today's workaround is `[assumption — founder]`.
- **F-002 — Confirm / Edit.** No AI entry counts until the owner confirms it; any field can be
  corrected. → solves AI misreads; the honesty mechanism in §6. `[assumption]` that owners will
  accept a review step.
- **F-003 — Live logbook dashboard.** Orders listed by delivery date and payment status,
  updating without a page refresh. → solves losing track of orders on busy days (§1, §4).
  `[assumption]`
- **F-004 — Sales totals and statistics.** Calculated from confirmed entries only
  [list confirmed by founder, 2026-10-07]:
  - total sales today / this week / this month
  - number of orders by status (needs review, awaiting payment, paid, delivered)
  - unpaid amount still owed
  - top-selling items
  - deliveries due in the next 7 days

  Entries with no price are left out of totals and counted separately ("3 orders have no price
  yet"), so a total is never silently wrong. → solves "loses a clear picture of what the business
  actually earns" (§1; EV-007 notes owners compute income simplistically). Also shows the MVP
  really queries its database [founder].
- **F-005 — Follow changes mid-conversation.** "Make it 3 na lang" or "Paid na po" updates the
  existing entry instead of creating a duplicate. → solves the mid-conversation hassle from
  §4 [founder]. `[assumption]` that changes are common.
- **F-007 — Owner sign-in.** Each owner signs in and sees and changes only their own logbook.
  → lets 5–10 testers use it at the same time without seeing each other's orders (`INV-AS-001`).
  Added 2026-10-07 while writing the PRD [founder; `docs/decision-ledger.md` ADR-007].
- **F-006 — Connect a business account (Way 1).** *Moved out of the MVP on 2026-10-07
  (ADR-004); back in the MVP on 2026-10-08 (ADR-012), built after F-001–F-005 and F-007.* The
  owner connects a **Facebook Page**, an **Instagram professional account**, or a **Telegram shop
  bot** once; new customer messages arrive through the platform's official webhooks, and the AI
  drafts entries from them for the owner to confirm, in the same logbook as screenshots. → removes
  manual capture for sellers with a business account. Existing tools already serve business
  accounts (EV-011, EV-012); the difference is one logbook across both account types. Real
  sellers' Pages and Instagram accounts need Meta App Review first — until then, demoed on the
  team's own test Page. Telegram reply path still open (ADR-012). Platform details `[verify]` in
  `work/system-flow-explainer.md`. `[assumption — A-008]` that business-account sellers will
  connect.

### Later / full-vision (explicitly out of MVP scope)

- **F-101** — WhatsApp (WhatsApp Business Platform) — has number rules and per-conversation
  pricing that may not fit a ₱0 budget `[verify]`; low consumer preference (EV-006).
- **F-102** — Viber — commercial terms may not fit a ₱0 budget `[verify]`; low consumer
  preference (EV-006).
- **F-103** — Export the logbook to a spreadsheet.
- **F-104** — Android app (APK), wrapping the same web app.

## 8. Success metrics

*How would you know, during or right after the hackathon, that this is working? Prefer a
metric with a comparison point (a baseline, a before/after) over a raw number.*

*All numbers below are **targets**, not results [founder, 2026-10-07]. None has been measured
yet; the deck must present them as goals until they are.*

**Prototype test group:** 5–10 home-based NCR sellers who take Messenger/Instagram orders
[founder target]. Currently reachable: 1–2 (`work/evidence-ledger.md`) — the rest must come
from referrals.

| Metric | How it's measured | Comparison point / target |
|---|---|---|
| **Time per order** | Seconds to log one order by hand (notebook or spreadsheet) vs. screenshot/paste + confirm in MabiList (F-001, F-002) | Each seller's own manual time, measured during the interview — target: MabiList is faster for every tester |
| **AI accuracy** | Share of extracted fields (customer display name, items, quantity, price, delivery date, payment status) correct without an owner edit, on a set of 30–50 realistic Taglish order chats. A field left empty because the chat didn't mention it counts as correct; a guessed value counts as wrong. Key fields (items, quantity, price, payment status) are also reported separately | **Target: 90%** overall [founder]. Rethink lines: 70% overall, 80% key fields (§9) |
| **Activation** | Testers who log 5+ real orders in their first session | Out of the 5–10 testers |
| **Retention / repeat use** | Testers who use it on 3+ separate days in their first week | Out of the 5–10 testers |
| **Value (non-revenue proxy)** | Whether each tester would keep using it instead of their notebook, and whether they'd pay for it later — plus whether they actually kept using it | Their answer vs. what they did; what they *did* counts more than what they *said* |

## 9. Constraints, risks & kill criteria

**Riskiest assumption — A-001:** *the one belief that, if false, means the whole idea doesn't
work. State it as a testable claim, not a hope.*

*Two assumptions are rated riskiest, A-001 and A-005 [founder, 2026-10-07]. Either one being
false sinks the idea.*

- **A-001 (riskiest) — habit switch.** Home-based chat sellers will switch from their notebook
  to screenshot/paste + confirm for each order, because it is noticeably faster.
  *Test:* time per order and repeat use (§8) with the 5–10 testers.
  *Fails if:* MabiList isn't faster than the notebook for most testers, or fewer than half of
  testers use it on 3+ days in their first week.
- **A-005 (riskiest) — trust.** Sellers are comfortable putting their customers' chats through
  an AI tool, given the "keep only order details" rule (`INV-001`).
  *Test:* in interviews, ask how they'd feel about it — then, in the prototype test, see whether
  they actually upload **real** customer chats or only sample ones (what they *do* counts more).
  *Fails if:* most testers refuse to upload real customer chats even after the deletion rule is
  explained.

**Secondary assumption(s) — A-002, A-003...**

- **A-002 — the pain is real.** Chat sellers copy orders out of chats by hand today and find it
  painful. `unknown` — EV-010; interviews will tell.
- **A-003 — accuracy.** AI can extract order fields from Taglish chat screenshots at the 90%
  target (§8) using a free AI service.
- **A-004 — ₱0 is enough.** Free tiers (AI model that reads images, database, hosting) cover
  5–10 testers without a credit card.
- **A-007 — personal accounts.** A meaningful share of beachhead sellers take orders on
  **personal** Messenger/Instagram accounts, where no chat-reading tool works (EV-014).
  Secondary [founder, 2026-10-07]. Since ADR-012 it's no longer make-or-break: sellers on Pages
  are served by F-006 too. It still decides how much of the pitch rests on the personal-account
  gap, so the interviews ask it.
- **A-008 — business accounts will connect.** Sellers with a Page, Instagram professional
  account, or Telegram shop bot will connect it to MabiList and value one logbook across their
  accounts over Meta Business Suite's free order tools and existing apps (EV-011, EV-012)
  [added with ADR-012, 2026-10-08]. *Test:* in the pilot, whether business-account sellers
  connect and keep using it.
- **A-006 — volume threshold.** The pain starts at about 10–15 chat orders a week, or 4–6 orders
  open at once; below about 5–8 a week, memory works (§4) [founder estimate].

**Kill criteria (explicit fail-states — what result would make you walk away or pivot):**
- **Demand:** most interviewed sellers say they don't keep records, or don't care to → rethink
  the segment (A-002).
- **Habit / trust:** the A-001 or A-005 fail conditions above are met → rethink the product
  before building further.
- **Regulatory:** the Data Privacy Act of 2012 (RA 10173) requires something the team can't do
  at ₱0 → pause real customer chats and demo with sample chats only.
- **Economics / resourcing:** no free AI service reads images within limits that cover 5–10
  testers → the ₱0 budget breaks; log in `docs/decision-ledger.md` before spending anything
  (A-004).
- **Technical:** accuracy on the 30–50-chat Taglish test set, after improving the AI
  instructions, stays below **70% overall** [founder, 2026-10-07] **or below 80% on key fields**
  [80% confirmed by founder, 2026-10-07] → switch from full automation to an AI-assisted
  form the owner fills in. *Key fields* are the ones that change money or obligations: items,
  quantity, price, and payment status. They get a stricter line because one wrong price or a
  wrong "paid" corrupts the sales totals (F-004); a misspelled display name or loosely worded
  delivery date is easier to tolerate [founder: the threshold must account for error tolerance
  in key fields]. Key-field accuracy is reported separately from overall accuracy.

**Invariants (`INV-###`) — hard rules that must hold across every pivot:**
*Things the product must NEVER do, regardless of how the feature set changes. Safety,
compliance, or trust rules usually live here. Also fold in the reserved anti-slop
invariants from `docs/anti-slop-guardrails.md` §4 (`INV-AS-001`–`INV-AS-005`) when this
list is copied into `docs/prd.md §5`. Do not renumber those IDs; waive one only in
`docs/decision-ledger.md`.*

- **INV-001** — the system must never keep a raw chat message or screenshot after the owner has
  confirmed or deleted the logbook entry built from it, or for more than 7 days if neither
  happens, and must never store a customer's phone number or address unless the owner types it in
  (`docs/decision-ledger.md` ADR-002, ADR-007).
- **INV-002** — the system must never count an unconfirmed entry, or an entry with no price, in
  sales totals or statistics (from F-002, F-004) [founder, 2026-10-07].
- **INV-003** — the AI must never fill in a value that isn't in the chat — e.g., guessing a price
  or a delivery date that wasn't mentioned; unknown fields stay empty (from F-001)
  [founder, 2026-10-07].
- **INV-AS-001** through **INV-AS-005** — reserved (auth, secrets, injection, claims, dead controls)

## 10. Out of scope (for now)

*Say why, not just what — this list protects you from scope creep mid-hackathon.*

*Confirmed by founder, 2026-10-07.*

- **Marketplace sellers (Shopee, Lazada, TikTok Shop, Amazon, and similar), including their chat
  orders** — because marketplaces already track their own orders, payments, and shipments (§2;
  scope cut 2026-10-07).
- **Full accounting — tax filing, BIR forms, invoices or official receipts, expense tracking,
  payroll** — because the promise is an order logbook, not accounting software, and tax
  features would need compliance claims we can't back up (`INV-AS-004`).
- **Replying to customers or auto-replying (a chatbot)** — because the app only *reads*
  messages, including from connected business accounts (F-006); sending adds platform messaging
  rules and is a different product (`work/system-flow-explainer.md`).
- **WhatsApp and Viber connections** (F-101, F-102) — later; the MVP's business-account
  connection covers Messenger, Instagram, and Telegram only (ADR-012).
- **Payment processing (e.g., accepting GCash in-app)** — because the logbook records payment
  *status*; it doesn't move money.
- **Inventory or stock management** — because it's a separate problem from "record the order
  and keep it updated" (§6).
- **Reading personal accounts automatically (browser extensions, scraping, Telegram personal
  accounts via the client API)** — because it breaks platform terms and conflicts with the Data
  Privacy Act (RA 10173); personal-account sellers use screenshot or paste (F-001) instead
  (`docs/decision-ledger.md` §4).
- **Staff or multiple users per business** — because the beachhead is solo or family-run
  home-based sellers (§2).
