# Business Requirements Document — MabiList

**Version:** 0.1 · **Status:** Draft · **Owner of record:** An-joe Mikael T. Albano (Product
Manager), with Tyrone Loius V. Teemer and Yancy Allen S. Tiburcio — PUP Sta. Mesa

> **Agent instructions:** Everything here should trace to `seed/idea.md` and
> `seed/context.md`. This document answers "why should this exist and how will we know it
> worked" for a non-technical reader (a judge, a mentor, a future co-founder) — it is not the
> place for architecture or feature-level detail (that's `prd.md`/`sdd.md`).

*Written 2026-10-07 from `seed/` and `work/` only. 0 interviews so far — every claim about
sellers' pain is evidenced from published sources or marked `[assumption]`.*

## 1. Background & problem

*Pull from `seed/idea.md §1, §4`. 2-3 paragraphs, plain language.*

Many small Philippine sellers take orders inside chat apps, Facebook Messenger above all
(EV-005, EV-006). A deal forms gradually across a conversation — the inquiry, the price, a change
of quantity, the delivery date, the payment proof — often hours or days apart. The record of that
deal (who ordered what, how much, when, and whether it's paid) has to be copied out by hand
afterwards. Philippine micro and small businesses mostly keep these records in notebooks, and
incomplete records and lost receipts cost them money (EV-007). Most can't justify a bookkeeper —
outsourced basic recording costs about ₱2,500–₱5,000 a month (EV-023) — so the owner does it,
and every hour spent copying is taken from selling `[assumption — founder's reasoning]`.

For sellers who take orders on **personal** Messenger and Instagram accounts, no tool can read
those chats: every chat-reading order tool works only with business accounts (Facebook Pages,
Instagram professional, WhatsApp Business), because that's all the official platform access
allows (EV-011, EV-014). Every option these sellers *can* use — a notebook, a spreadsheet, a
manual order-tracking app, or a one-off screenshot-to-spreadsheet converter (EV-013) — expects
the owner to type in or convert a finished order. So the owner is the only bridge between the
chat and the record: the work repeats every time an order changes, and it breaks first on busy
days (`seed/idea.md` §4).

Sellers who also run a Facebook Page, an Instagram professional account, or a Telegram shop bot
can use business-account tools for those chats (EV-011, EV-012), but their personal-account
orders still go in the notebook — so a seller using both kinds of account keeps two records
`[assumption — A-008]`. MabiList is designed to keep both in one logbook (ADR-012).

The founder estimates the problem appears at about 10–15 chat orders a week, or 4–6 orders open
at once `[assumption — A-006]`. Whether chat sellers themselves feel this as a real pain is the
biggest unknown: no source yet comes from them (EV-010), and the one recent survey of Philippine
sellers doesn't list order recording among their top problems (EV-017). Interviews with the
target sellers (`work/interview-guide.md`) are how the team will find out.

## 2. Business objectives

*What does success look like for the founder(s), not just the user? Be specific — "win the
hackathon," "validate before investing more time," "get into an accelerator" are all valid
and different objectives that shape different decisions later.*

- **Submit a complete, eligible PSC XI application at the Ideation stage by 2026-10-11** —
  the presentation deck finished by 2026-10-10 (`seed/context.md` §2, §5). This requires a PUP
  mentor, which isn't secured yet (eligibility blocker, `seed/context.md` §4).
- **Validate before building.** The team chose to settle the problem, segment, and evidence first
  and build the MVP only after (`seed/context.md` §1). Concretely: interview the 1–2 known sellers
  and their referrals, aiming for 3–5 interviews (`work/evidence-ledger.md`), and move the five
  tests off `unknown`.
- **Then prove the core feature with a prototype.** Show that a chat screenshot becomes a correct
  logbook entry (F-001) at the 90% accuracy target, tested with 5–10 real sellers
  (`seed/idea.md` §7–§8).
- **Advance in the competition** — selection into the top 20 NCR teams for the mentorship phase
  and Regional Competition (`seed/context.md` §1) `[assumption — implied by entering; founder
  hasn't stated a target stage]`.
- **Do all of this at ₱0** (`seed/context.md` §5).

## 3. Target users & stakeholders

| Stakeholder | Interest | Source |
|---|---|---|
| **Home-based NCR sellers who take orders on personal Messenger and Instagram accounts** (primary user; prioritise 10+ chat orders a week or 4+ open at once). Excludes sellers also on Shopee, Lazada, or TikTok Shop, and businesses already using a POS or accounting software; Facebook Marketplace sellers are included | Stop retyping orders; always know who ordered what, who has paid, and what's due | seed/idea.md §2 |
| **The sellers' customers** (people whose chat messages are processed) | Their phone numbers, addresses, and chats aren't kept; their orders are recorded correctly | seed/idea.md §6, §9 (INV-001); Data Privacy Act (RA 10173) |
| **Home-based NCR sellers who take orders on a Facebook Page, Instagram professional account, or Telegram shop bot** — often alongside a personal account (MVP, ADR-012) | One logbook for orders from every account; messages from connected accounts arrive on their own | seed/idea.md §2, §7; A-008 |
| **Broader segment** — small sellers on other messaging apps (WhatsApp, Viber — later) | Same need | seed/idea.md §2, §7 |
| **DICT-IIDB / PSC XI judges** | A real, validated problem; ICT-enabled solution; business model; honest traction | seed/context.md §1, §3, §7 |
| **PUP mentor** (required, **not yet secured**) | Guides the team; must be a PUP employee | seed/context.md §4 |
| **DTI (Negosyo Centers, Kapatid Mentor ME)** — possible distribution partners | MSME digitalization is DTI's stated strategy | work/market-scan.md `[assumption — not contacted]` |
| **Meta** (platform owner) | Platform terms — the reason personal accounts aren't read automatically; for F-006, Meta must approve the app (App Review) before real sellers' Pages can connect | seed/idea.md §10; docs/decision-ledger.md §4, ADR-012 |
| **Telegram** (platform owner) | Bot API terms for the shop-bot connection (F-006) `[verify]` | ADR-012 |

## 4. Scope

**In scope for this submission:**

The PSC XI application is at the **Ideation** stage: a clearly defined business idea, a deck,
and validation work (`seed/context.md` §1, §6). The MVP below is the planned product; it's built
after the application (`seed/context.md` §1), and the deck presents it as a design, not a working
product.

- **F-001 — Screenshot or paste → logbook entry (core).** The AI turns a chat into an order entry:
  customer display name, items, quantity, price, delivery date, payment status.
- **F-002 — Confirm / Edit.** Nothing counts until the owner confirms it.
- **F-003 — Live logbook dashboard.** Orders by delivery date and payment status.
- **F-004 — Sales totals and statistics** from confirmed entries only.
- **F-005 — Follow changes mid-conversation** without creating duplicates.
- **F-007 — Owner sign-in.** Each owner sees only their own logbook (added 2026-10-07, ADR-007).
- **F-006 — Connect a business account.** Messages on a connected Facebook Page, Instagram
  professional account, or Telegram shop bot arrive through the platforms' official webhooks and
  become drafts in the same logbook. Built after the features above; shown on the team's own test
  Page until Meta approves the app (ADR-012).

*Feature detail and acceptance criteria belong in `prd.md`.*

**Explicitly out of scope:**
- Marketplace sellers (Shopee, Lazada, TikTok Shop, Amazon, and similar), including their chat
  orders — marketplaces already track their own orders.
- Full accounting — tax filing, BIR forms, invoices, expenses, payroll. MabiList is not a BIR
  book of accounts, and the team makes no compliance claim.
- Replying to customers or a chatbot — the app only reads.
- Payment processing — it records payment status; it doesn't move money.
- Inventory or stock management.
- Reading personal accounts automatically (browser extensions, scraping) — breaks platform terms
  and conflicts with the Data Privacy Act.
- Staff or multiple users per business.
- Later, not in the MVP: WhatsApp (F-101), Viber (F-102), spreadsheet export (F-103), Android app
  (F-104).

*(Source: `seed/idea.md` §2, §7, §10.)*

## 5. Success criteria

*Pull from `seed/idea.md §8`, phrased for a business reader.*

**For the application (by 2026-10-11):** a complete, eligible submission with a mentor named,
and every claim in the deck traceable to a source or marked as an assumption.

**For the prototype (after the application)** — all are targets, none measured yet:

| What we want to know | How we'll know | Target |
|---|---|---|
| Is it faster than the notebook? | Each tester's time to log one order by hand (timed in the interview) vs. in MabiList | Faster for every tester |
| Does the AI read chats correctly? | Share of fields right without an edit, on 30–50 realistic Taglish order chats | 90% overall. Rethink if below 70% overall or 80% on items, quantity, price, and payment status |
| Do sellers start using it? | Testers who log 5+ real orders in their first session | Out of 5–10 testers |
| Do they come back? | Testers who use it on 3+ separate days in their first week | Fewer than half → the habit-switch assumption (A-001) fails |
| Would they keep it? | Whether they'd replace their notebook and pay later — and whether they actually kept using it | What they do counts more than what they say |
| Will they trust it with real chats? | Whether testers upload real customer chats, not only sample ones | Most refuse → the trust assumption (A-005) fails |
| Will business-account sellers connect? | Whether testers with a Page or Instagram professional account connect it once Meta approves the app, and keep using one logbook | Not set — interviews first (A-008) |

## 6. Constraints

*Pull from `seed/context.md §5`.*

- **Time:** application deadline 2026-10-11; deck finished by 2026-10-10. Time for the prototype
  and Regional Competition is `unknown` until PSC announces the later dates.
- **Budget:** ₱0 — free tools and free tiers only, no credit-card trials or usage billing beyond a
  free tier, unless a change is logged in `decision-ledger.md`.
- **Team:** three 2nd-year BS Computer Science students; skills listed in `seed/context.md` §4
  (Next.js/React, Node.js, SQL, Supabase among them).
- **Eligibility:** NCR team ✓, three enrolled students ✓, PUP mentor ✗ (not yet secured).
- **Technology:** must be ICT-enabled (AI qualifies); no sponsor technology required.
- **Legal:** the Data Privacy Act of 2012 (RA 10173) applies to customer chats
  (`seed/idea.md` §9).
- **Rules not yet read:** the PSC XI application and deck guidelines (`seed/context.md` §1, §6).

## 7. Risks (business-level, not technical)

*Likelihood is rated from current evidence; with 0 interviews, several are honestly `unknown`.*

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No PUP mentor by 2026-10-11 → application ineligible | Unknown | High — no entry | Founder is searching; the only hard blocker on the application (`seed/context.md` §4) |
| Sellers don't feel the pain (A-002) | Unknown — no evidence from chat sellers (EV-010); the one recent survey doesn't list it (EV-017) | High — no product | Interviews before building; kill criterion in `seed/idea.md` §9 |
| Sellers won't switch from their notebook (A-001, riskiest) | Unknown | High | Must be clearly faster; time per order and repeat use measured with testers |
| Sellers won't put customer chats through an AI tool (A-005, riskiest) | Unknown | High | Keep only order details and delete raw chats after confirmation (INV-001); test real vs. sample uploads |
| Few target sellers use personal accounts (A-007) | Unknown | Medium — Way 2 is the main gap; since ADR-012 the MVP also serves business-account sellers | Screener question 3 in every interview |
| Business-account sellers prefer Meta's free tools or other chat-order apps (A-008) | Unknown | Medium — F-006 adds little if they won't connect | Ask in interviews; the wedge is one logbook across both account types, not access |
| Meta doesn't approve the app, or requires business verification sellers' teams can't provide | Unknown `[verify]` | Medium — Way 1 stays a test-Page demo | Way 2 carries the pilot; apply after the test-Page build works (ADR-012) |
| The segment is small: most sellers do under 50 orders a month (EV-017), the pain may start at 10–15 a week (A-006), and marketplace sellers are excluded | Medium — supported by EV-017 | Medium–High | Record real volumes in interviews; size the beachhead before quoting a market |
| No sustainable business model — earlier chat-order tools for micro-sellers shut down when cheap subscriptions didn't cover costs (EV-021, EV-022) | Medium — happened to predecessors | High | Free tier with a monthly order limit, paid above it (ADR-005) — heavy users, who drive AI costs, are the ones who pay. Limit and price set from measured volumes and willingness to pay |
| Free tiers don't cover AI processing for 5–10 testers (A-004) | Unknown | Medium — breaks the ₱0 budget | Log in `decision-ledger.md` before spending anything |
| Data Privacy Act requires something the team can't do at ₱0 | Unknown | Medium | Demo with sample chats only until resolved (`seed/idea.md` §9); `feasibility.md` to assess |
| Overclaiming in the deck — "automatic" for personal accounts, BIR compliance, invented users, Way 1 shown as already working | Low if guardrails are followed | High — credibility with judges | Personal accounts: "one upload or paste per conversation." Connected accounts: messages "arrive on their own once connected," shown as designed. No compliance claims; traction stated honestly (`seed/idea.md` §6; `INV-AS-004`; ADR-012) |

## 8. Related documents

- [`prd.md`](prd.md) — feature-level detail
- [`business-canvas.md`](business-canvas.md) — one-page business model
- [`feasibility.md`](feasibility.md) — go/no-go analysis
- [`../seed/idea.md`](../seed/idea.md) — problem, segment, features, metrics, risks (source for this document)
- [`../work/evidence-ledger.md`](../work/evidence-ledger.md) — every `EV-###` cited here

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial draft from seed/ and work/ |
| 2026-10-07 | F-007 owner sign-in added to scope (ADR-007) |
| 2026-10-08 | F-006 back in scope (ADR-012): business-account stakeholders, Telegram, A-008 and Meta review risks |
