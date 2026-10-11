# MabiList — Lean Business Canvas

**Version:** 0.1 · **Date:** 2026-10-07 · **Updated:** 2026-10-08 (ADR-012)

> **Agent instructions:** Keep every cell to 1-3 lines. This is a summary of `brd.md`,
> `prd.md`, and `seed/market.md` — don't introduce new facts here that don't exist upstream.

*Solution follows `prd.md` §3. Revenue model decided
2026-10-07 (`decision-ledger.md` ADR-005); limit and price not yet set.*

| Block | Content |
|---|---|
| **Problem** | 1. Chat orders must be copied out by hand into a notebook or spreadsheet (EV-007; chat-seller pain `unknown`, EV-010). 2. Every mid-chat change means finding and fixing the record. 3. On busy days, orders, payments, and delivery dates get mixed up `[assumption — A-006]`. |
| **Customer segments** | **Beachhead:** home-based NCR sellers taking orders in Messenger/Instagram chats — on personal accounts (the main gap), business accounts, or both — ideally 10+ chat orders a week; not on Shopee, Lazada, or TikTok Shop. **Later:** WhatsApp and Viber sellers (`seed/idea.md` §2, ADR-012). |
| **Unique value proposition** | One running order logbook for both account types: a screenshot or pasted text for personal accounts, messages that arrive on their own from a connected Page, Instagram professional account, or Telegram shop bot. Keeps orders updated as the chat continues; keeps only order details; the owner confirms every entry (`seed/idea.md` §6). |
| **Solution** | F-001 screenshot/paste → logbook entry · F-002 confirm/edit · F-003 live dashboard by delivery date and payment · F-004 sales totals and statistics · F-005 follow mid-chat changes · F-007 owner sign-in · F-006 connect a business account by webhook, built last (`prd.md` §3). |
| **Channels** | Now: the 1–2 sellers the team knows, then one referral each. Later: DTI Negosyo Centers, Kapatid Mentor ME `[assumption — not contacted]` (`seed/market.md`). |
| **Revenue streams** | **Free up to a monthly order limit; paid plan above it** (ADR-005). Limit and price **not set** — decided after interviews and the prototype. Value metric meanwhile: time saved per order vs. the notebook (`seed/idea.md` §8). |
| **Cost structure** | Now: ₱0 — free tiers only, team's own time (`seed/context.md` §5). At scale: AI processing per screenshot or connected-account conversation once free limits run out, plus database and hosting — amounts `unknown` (A-004). |
| **Key metrics** | Time per order vs. notebook · AI accuracy (target 90%; rethink below 70% overall / 80% key fields) · 5+ orders in first session · use on 3+ days in week one (`seed/idea.md` §8). |
| **Unfair advantage** | **None proven yet.** Positioning (personal-account sellers, one logbook across account types, privacy, running record) is copyable. Possible but untested: Taglish accuracy and closeness to NCR sellers. |
| **Key partners** | Supabase and Vercel free tiers; an AI service that reads images, picked by the accuracy test (ADR-008, ADR-009); Meta (App Review needed for real sellers' Pages) and Telegram platforms (ADR-012). PUP mentor (required, not secured). DTI programs `[assumption]`. |

## Revenue model — Option A chosen (ADR-005)

*The founder chose **Option A** on 2026-10-07. The comparison is kept so the reasoning is
visible to judges and teammates.*

**Still open:** the free order limit and the paid price. Set them from measured order volumes
(screener question 4), willingness to pay (interview question 9), and AI cost per order from the
prototype — not guessed. Until then the deck states the model only, with no price or revenue
forecast (`INV-AS-004`).

**What the evidence says any model has to handle:**
- **Running costs grow with use.** Each screenshot is an AI call; free tiers cover only a pilot,
  if that (A-004). A model where heavy users pay nothing repeats AVANA's failure: cheap
  subscriptions that didn't cover rising server costs (EV-021).
- **Free is the norm for the closest alternatives.** My Orders PH is free; Take App is free up to
  50 orders a month; WISMO is free for the first 30 orders, then $9.99 a month; ImageToTable.ai
  gives 20 free credits a month, then $9 a month (`work/market-scan.md`). The notebook costs
  nothing (EV-007).
- **The paid alternative is a bookkeeper:** about ₱2,500–₱5,000 a month outsourced (EV-023) — a
  ceiling on what the job is worth, not a price.
- **Willingness to pay is `unknown`.** It's asked last in interviews and measured in the
  prototype (`seed/idea.md` §8). No price should be set before then.

| Option | How it works | For it | Against it |
|---|---|---|---|
| **A. Free tier with a monthly order limit, paid above it — chosen** | Free up to a set number of orders a month; a paid plan above that | Costs and revenue grow together — heavy users, who cause the AI costs, are the ones who pay. Matches how Take App and WISMO price (`work/market-scan.md`) | Most sellers do under 50 orders a month (EV-017), so the free limit decides whether anyone pays at all. Price and limit unknown until tested |
| **B. Free for sellers, funded by grants or partners** | No charge; costs covered by competition prizes, incubators, or programs such as DTI's | Removes the price barrier for micro-sellers | No revenue; depends on funding that isn't secured. DTI partnership is `[assumption — not contacted]` |
| **C. Flat monthly subscription after a free trial** | Everyone pays the same after a trial | Simple to explain | Light users pay as much as heavy ones; AVANA's flat cheap plans didn't cover costs (EV-021); competes against free tools |

## One-liner (for the pitch deck and README)

> MabiList is a sales logbook built from chats: it turns each conversation into an order record
> and keeps it updated as the chat continues — from a screenshot or pasted messages for personal
> accounts, and from messages that arrive on their own once a Facebook Page, Instagram
> professional account, or Telegram shop bot is connected — for home-based NCR sellers who take
> orders in Messenger and Instagram chats, so that they stop retyping orders and always know who
> ordered what, who has paid, and what's due.

*The earlier one-liner called it an "automatic sales logbook." Since ADR-012, "arrive on their
own" applies only to connected business accounts; for personal accounts, describe capture as
"one upload or paste per conversation," not "records orders by itself" (`seed/idea.md` §6).*

## What we are / are not

| We are | We are not |
|---|---|
| A running order logbook built from chat screenshots, pasted messages, and connected business accounts | A chatbot that replies to customers |
| For sellers on **personal** accounts first, and on Pages, Instagram professional accounts, and Telegram shop bots too — one logbook for both | A tool that scrapes or reads personal accounts automatically |
| A record of payment **status** | A payment processor — no money moves through it |
| An order logbook that keeps only order details | Accounting software, a BIR book of accounts, or a tax tool |
| AI that drafts each entry for the owner to confirm | AI that guesses missing prices or dates, or counts unconfirmed entries |
| For solo or family-run home sellers | A marketplace tool, an inventory system, or a multi-staff system |

*(Sources: `seed/idea.md` §6, §9, §10.)*

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial canvas from seed/ and work/; revenue model pending founder decision |
| 2026-10-07 | Revenue model set to Option A (ADR-005); limit and price still open |
| 2026-10-08 | Both account types (ADR-012): segment, UVP, solution, partners, one-liner, we-are table |
