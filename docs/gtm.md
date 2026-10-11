# Go-To-Market — MabiList

**Version:** 0.1 · **Status:** Draft

> **Agent instructions:** This document answers "what happens if you keep building after the
> hackathon" — many judging rubrics score this even if a working product only needs to exist
> for the demo. Keep it grounded in `seed/market.md`'s actual reachability findings, not
> generic startup-playbook language.

*Written 2026-10-07 from `seed/market.md`, `business-canvas.md`, `seed/idea.md` §8–§9, and
`feasibility.md`. 0 interviews and no users so far — everything past the pilot is a plan, not
a forecast.*

## 1. Positioning

*One paragraph — where this sits in the market, from `business-canvas.md`.*

MabiList is one running order logbook for chat sellers on both kinds of account: screenshots or
pasted messages for **personal** Messenger and Instagram accounts, and messages that arrive on
their own from a connected Facebook Page, Instagram professional account, or Telegram shop bot
(ADR-012). Business-account sellers already have tools that read their chats (Orders App,
MessOrder AI, Pancake, Meta Business Suite — EV-011, EV-012); personal-account sellers have
notebooks, typed-in trackers, and one-off screenshot converters (EV-013, EV-014). The main gap
is still personal accounts: lighter than typing every order, and a running record rather than a
one-off conversion. For sellers who use both, the difference is one record instead of two
`[assumption — A-008]`. It is not accounting software, a chatbot, or a payment tool
(`business-canvas.md`, "What we are / are not").

## 2. Beachhead segment

*The narrowest possible first market — not "everyone with this problem," the specific first
group you'd actually go get, and why they're first.*

**Home-based NCR sellers who take orders in Messenger and Instagram chats — on personal accounts
first, and on Pages, Instagram professional accounts, or Telegram shop bots too — with about 10+
chat orders a week or 4+ open at once, and who don't sell on Shopee, Lazada, or TikTok Shop**
(`seed/idea.md` §2, ADR-012).

Why them first:
- **Unserved:** no chat-reading tool can reach personal accounts (EV-014). Sellers with a Page as
  well keep a second record for their personal-account orders `[assumption — A-008]`.
- **Reachable:** the team knows 1–2 of them personally and is in NCR, the region with the most
  registered MSMEs (EV-004).
- **Pain most likely:** the founder estimates the pain starts around 10–15 orders a week
  `[assumption — A-006]`.

Size: `unknown`. The national ceiling is about 2 million online sellers (EV-016); how many fit
the beachhead is what interviews measure (`seed/market.md`). Risk: most sellers do under 50
orders a month (EV-017), so the volume filter may make the beachhead small.

## 3. Channels

| Channel | Why it fits this segment | Cost/effort |
|---|---|---|
| The 1–2 sellers the team knows, then one referral from each | The only channel proven to reach home-based personal-account sellers today (`seed/market.md`); referral spread is itself a reachability test | ₱0; team time for interviews and onboarding |
| Testers' own customers and fellow sellers `[assumption — untested]` | Home sellers know other home sellers; a seller who saves time may tell others | ₱0; depends on the product actually being faster (A-001) |
| DTI Negosyo Centers and the Kapatid Mentor ME program `[assumption — not contacted]` | DTI already runs MSME digitalization and e-commerce training (`work/market-scan.md`) | Low cash, high coordination; needs a working pilot first |
| PSC partner incubators, if shortlisted | Finalists and winners may be connected with partner incubators (`seed/context.md` §1) | Depends on competition results |

No paid acquisition: the budget is ₱0 (`seed/context.md` §5).

## 4. Pricing / revenue model (if applicable)

*If this is a public-good/free service, say so explicitly and describe the sustainability
model instead (grant, institutional partnership, government adoption).*

**Free up to a monthly order limit; paid plan above it** (ADR-005). The limit and price are **not
set**; they come from measured order volumes, willingness to pay (interview question 9), and AI
cost per order from the prototype. The design answers the main lesson from AVANA, which shut down
when cheap flat subscriptions didn't cover rising server costs (EV-021): the heaviest users cause
the most AI cost, and they're the ones who pay.

Reference points, not prices: Take App is free up to 50 orders a month and WISMO free for 30
(`work/market-scan.md`); outsourced bookkeeping costs about ₱2,500–₱5,000 a month (EV-023).

Before charging anyone: move hosting off Vercel Hobby, which is non-commercial only (ADR-009),
and clear the Data Privacy Act gate (`feasibility.md` §4).

## 5. Rollout plan

*PSC's later dates aren't announced (`seed/context.md` §2), so phases are set by conditions, not
dates.*

| Phase | Milestone | Target |
|---|---|---|
| Alpha | Prototype built after the founder's design (ADR-010): screenshot flow first, then business-account connection (F-006) on the team's own test Page, Instagram account, and bot. AI accuracy test on 30–50 synthetic Taglish chats. Team and 1–2 known sellers try it **on sample chats only**: timing vs. their notebook (A-001), first reactions to the privacy rule (A-005), interest in connecting a Page (A-008). Submit Meta App Review once the test-Page build works | Accuracy ≥ 90% (rethink below 70% overall / 80% key fields); faster than the notebook for each seller tried |
| Beta | Real-chat pilot with 5–10 sellers — **only after** the `feasibility.md` §4 gate (an AI provider that doesn't train on inputs, privacy notice, seller terms, review) is cleared and logged. Sellers with a Page or Instagram professional account connect it only if Meta has approved the app; otherwise everyone uses screenshots | 5+ orders logged in the first session; use on 3+ days in week one; testers upload real chats (A-005); business-account testers connect and keep using one logbook (A-008) (`seed/idea.md` §8) |
| GA / scale | Set the free limit and price from beta data; paid hosting and database; then DTI channels, and WhatsApp / Viber (F-101, F-102) if sellers ask | Paying sellers whose fees cover their AI and hosting cost `[target — no figure yet]` |

Kill criteria apply at each phase (`seed/idea.md` §9): if sellers don't care, don't switch, or
won't trust it with real chats, rethink before building further.

## 6. Metrics that would tell you it's working

*Pull from `seed/idea.md §8` — extend with longer-horizon metrics if relevant.*

**Pilot (from `seed/idea.md` §8 — targets, not results):**
- Time per order: MabiList vs. each seller's own notebook time — faster for every tester.
- AI accuracy: 90% of fields right without an edit; key fields reported separately.
- Activation: testers logging 5+ real orders in their first session.
- Repeat use: testers using it on 3+ separate days in their first week.
- Value: whether testers keep using it instead of the notebook — what they do over what they say.

**Later (proposed, once there are users):**
- Share of sellers still logging orders after a month.
- Share of sellers above the free limit who pay.
- AI and hosting cost per order vs. revenue per paying seller — the AVANA check (EV-021).
- Referrals: new sellers who came from an existing user.

## 7. What would need to be true to raise money / get institutional backing (if relevant)

- **Demand shown, not assumed:** interviews and the pilot turn EV-009 and EV-010 into real
  evidence — Filipino sellers spend measurable time logging chat orders and want it gone.
- **The core works:** the accuracy test passes on Taglish chats, and pilot sellers are faster
  than with their notebook (A-001, A-003).
- **Trust:** pilot sellers upload real customer chats once the privacy rules are explained
  (A-005), with the Data Privacy Act groundwork done (`feasibility.md` §4).
- **Unit economics:** measured AI cost per order sits well below what heavy sellers will pay.
- **Segment size:** interviews show personal-account selling at 10+ orders a week isn't rare
  (A-006, A-007), so the beachhead is worth building for.
- **Platform approval:** Meta approves the app for real sellers' Pages (ADR-012), so Way 1 works
  beyond the team's test Page.

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial GTM draft |
| 2026-10-08 | Both account types (ADR-012): positioning, beachhead, rollout (F-006 in alpha on the test Page, Meta App Review), backing condition |
