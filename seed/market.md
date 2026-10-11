# Market: MabiList

> **Agent instructions:** This is a summary file — the legwork happens in
> `work/market-scan.md`. Don't research directly into this file; research into
> `work/market-scan.md`, then distill the findings here in a form a judge can skim in 60
> seconds. Every number needs a source; `[assumption]` is fine, a bare number is not.

**Last updated:** 2026-10-07 · Distilled from `work/market-scan.md` and
`work/evidence-ledger.md` (EV-###). 0 interviews so far — every segment number below is a
ceiling, not a measured market.

## Segment size

| Layer | Estimate | Basis |
|---|---|---|
| Total addressable (everyone with this problem, anywhere reachable) | **Up to about 2 million** Philippine online sellers (ceiling) | DTI verbal estimate of e-commerce participants for 2022 (EV-016). Includes marketplace sellers, who are out of scope, and not all of them take orders in chat. Registered MSMEs alone: 1,241,733 (EV-003) |
| Serviceable (reachable by your actual go-to-market in year 1) | **`unknown`** — NCR ceiling of roughly 370,000 online sellers, **only if** NCR's share of online sellers matches its 18.54% share of registered MSMEs `[assumption]` | NCR share: EV-004; national figure: EV-016. Three filters are still unmeasured: how many sell from **personal** accounts (A-007), how many reach **10+ orders a week** (A-006), and how many sell *only* through chat — sellers also on Shopee, Lazada, or TikTok Shop are excluded (`seed/idea.md` §2), and 52% and 46% of surveyed sellers use Shopee and TikTok Shop. Most PH sellers do fewer than 50 orders a month (EV-017), so the real number is likely far below this ceiling |
| Obtainable (realistic capture in a pilot / first year) | **5–10 tester sellers** in the prototype phase — a target, not a forecast | `seed/idea.md` §8. No first-year user or revenue number is claimed: the business model is chosen (free up to a monthly order limit, paid above it — `docs/business-canvas.md`), but the limit and price aren't set and there is no traction yet |

**Say in the deck:** "Up to 2 million online sellers nationally; our first segment is home-based
NCR sellers who take orders in Messenger and Instagram chats — on personal accounts, where no tool
reaches, and on business accounts — a number we're measuring through interviews." **Don't say:** "Our market is 2 million sellers" or "1.24 million MSMEs."

## Competitive landscape

*All checked 2026-10-07 from each vendor's own site or help pages; none tested.*

| Competitor / alternative | What they do | Where they fail for this segment | Your wedge |
|---|---|---|---|
| **Orders App, MessOrder AI, Pancake, Probaho AI** | AI turns business-account chats into orders; Orders App even follows mid-chat changes (EV-011) | Need a Facebook Page, Instagram professional, or WhatsApp Business account — can't read personal accounts (EV-014). Orders App has no Messenger. Capture phone numbers and addresses by default | Personal accounts through screenshots or pasted text, and business accounts through the same official webhooks (F-006, ADR-012) — one logbook for both; keeps only order details (INV-001). For Page-only sellers these are direct competitors |
| **Meta Business Suite order tools** | Free: create orders and mark them paid inside the Page inbox; GCash receipt check in limited release (EV-012) | Page-only, and the owner types each order in by hand | No retyping — the AI drafts the entry from the Page's messages, the owner confirms; personal-account orders in the same logbook |
| **ImageToTable.ai** | AI turns chat screenshots from any app into spreadsheet rows (EV-013) | One-off conversion: no order status, no updates when the chat continues, no totals | A running logbook: the same order updates as the chat continues, with payment, delivery, and sales totals |
| **Manual order trackers (My Orders PH, WISMO, Take App)** | Free or freemium apps to record chat orders, payments, and deliveries | Every order typed in by hand, or the customer must use a checkout link instead of chatting | The customer keeps chatting normally; nothing is retyped |
| **General AI chatbot (pasting into ChatGPT or Gemini)** | Can turn a pasted chat into a table on request | No saved record, status, or totals; whether sellers do this is `[assumption]` | A saved, structured logbook with owner confirmation |
| "Do nothing" | Notebook, spreadsheet, or memory — the most common method among PH micro businesses (EV-007) | Each order and each change rewritten by hand; receipts get lost (EV-007); memory breaks at about 10–15 orders a week `[assumption — A-006]`. Hours lost: PH figure `unknown` (EV-009) | Faster than writing it down — to be proven by timing testers (`seed/idea.md` §8) |

## Reachability

*How does this segment actually get reached — existing channels, communities, institutions,
or infrastructure you can piggyback on rather than build from zero?*

- **Now:** the 1–2 home-based NCR sellers the team knows personally, then one referral from each
  (`work/interview-guide.md`, question 10).
- **Later, not yet contacted `[assumption]`:** DTI Negosyo Centers and the Kapatid Mentor ME
  program as distribution partners; DTI already runs MSME digitalization and e-commerce training
  (`work/market-scan.md`).
- **Gap:** no published channel reaches *home-based personal-account* sellers specifically —
  the main chat-selling survey excluded home-based businesses (EV-005). Whether referrals spread
  beyond the team's circle is itself a reachability test.

## Timing — why now

*What changed recently that makes this solvable/urgent now and not five years ago?*

- **AI can now read chat screenshots.** A general tool already converts social-commerce
  screenshots into order rows (EV-013), so the extraction step is technically feasible. Whether
  it works on Taglish chats at our 90% accuracy target is unproven (A-003), and whether free tiers
  cover a pilot is an assumption (A-004).
- **More people sell online than planned.** DTI's 2022 estimate of 2 million e-commerce
  participants was well above its 750,000 forecast (EV-016).
- **A recurring busy season.** September to New Year is the Philippine selling peak (EV-020) —
  happening during this competition. Not yet shown to cause chat-seller mix-ups.
- **Record-keeping rules for registered online sellers** (RR 7-2024, RMC 65-2025; EV-015). This
  applies only to BIR-registered sellers, and MabiList is **not** a BIR book of accounts — never
  imply compliance (`INV-AS-004`).

## Open questions

*Things this file doesn't yet answer — feed these into `work/interview-guide.md` if primary
research is planned.*

- What share of beachhead sellers take orders on **personal** accounts, Pages, or both?
  (A-007, A-008 — screener question 3)
- How many chat orders a week do they really handle, and how many are open at once? (A-006 —
  screener question 4; EV-017 suggests most sellers are below 10 a week)
- Do chat sellers actually find logging orders painful, and has it cost them? (EV-010 — core
  questions 2 and 4)
- How long does logging one order take today? (EV-009 — core question 3)
- Would they upload real customer chats to an AI tool? (A-005 — core questions 8 and 9)
- Do sellers already paste chats into ChatGPT or Gemini? (core question 7)
- Can the AI read Taglish order chats accurately enough? (A-003 — tested in the prototype, not by
  interviews)
