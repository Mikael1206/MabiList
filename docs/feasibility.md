# Feasibility Assessment — MabiList

**Version:** 0.1 · **Status:** Living

> **Agent instructions:** End with an actual verdict — `go`, `go-with-cuts`, or `no-go` — not
> just a balanced list of pros and cons. A hackathon team needs a decision they can act on
> today, not a neutral analysis. Be willing to recommend cutting a feature or the whole idea
> if the evidence says so; that's more useful than false optimism.

*Written 2026-10-07 from `seed/`, `work/`, `docs/prd.md`, and `docs/decision-ledger.md`, plus
vendor terms checked the same day (cited inline). `work/system-flow-explainer.md` was empty on
disk when this was written, so the team's suggested stack is taken from what `docs/prd.md` §7
recorded from it. Not legal advice — the regulatory section needs review by the PUP mentor or a
lawyer before real customer chats are used.*

## 1. Executive verdict

**Feasible with cuts. The build itself is ordinary web work; the biggest risk is whether an AI
can read Taglish chat screenshots accurately enough on a free tier that's allowed to see real
customer data.**

| Dimension | Rating (High/Medium/Low) | Notes |
|---|---|---|
| Product / tech | Medium | Sign-in, a logbook, totals, and uploads are standard. AI accuracy on Taglish screenshots is unproven (A-003) and must be tested first (§3). Way 1 webhooks (F-006, ADR-012) are well-documented platform features, but real sellers' Pages need Meta App Review, outside the team's control. Prototype time budget `unknown` — PSC hasn't announced the later dates (`seed/context.md` §2) |
| Team fit | Medium–High | The chosen stack (Next.js + Supabase, ADR-008) uses what both developers have already built in (`seed/context.md` §4). Hours per day `unknown`; nobody on the team has listed prior AI-extraction work |
| Regulatory / compliance | Medium | The Data Privacy Act (RA 10173) applies to customer chats. Fine for a demo on synthetic chats; real chats need groundwork first, and the free Gemini tier can't be used for them (§4). Way 1 receives every message on a connected account, and Meta's platform terms apply to it (§4) |
| Unit economics (if monetized) | Low confidence | Revenue model chosen (ADR-005), but price and AI cost per order are unknown. Free AI quotas are tight (§3) |
| Go-to-market (if continuing past the hackathon) | Low–Medium | 1–2 known sellers plus referrals; no published channel reaches home-based personal-account sellers (`seed/market.md`) |

## 2. Problem–solution fit

| Structural problem (from seed/idea.md) | This product's response | Feasibility |
|---|---|---|
| A chat order forms gradually inside an unstructured conversation | AI reads a screenshot or pasted text and drafts a structured entry (F-001) | **plausible** — screenshot-to-order extraction exists (EV-013); Taglish accuracy unproven (A-003) |
| No tool can read personal-account chats (EV-014) | Screenshot or paste needs no platform access at all | **proven** — works on any image the owner takes of their own chat |
| Sellers who use a Page or Instagram professional account as well as a personal account keep two records `[assumption — A-008]` | Connected business accounts send messages by webhook into the same logbook (F-006, ADR-012) | **plausible** — business-account tools already read these chats (EV-011, EV-012); real sellers need Meta App Review; whether sellers connect is unproven (A-008) |
| Every option expects a finished order typed in by a person | AI drafts, owner only reviews and confirms (F-002) | **plausible** — whether it's actually faster than a notebook is unproven (A-001) |
| The record must be fixed every time the order changes | New screenshot updates the existing order after confirmation (F-005) | **unproven** — matching by customer display name may misfire (two customers with the same name) |
| It fails first on busy days | Logbook by delivery date and payment status; deliveries due (F-003, F-004) | **plausible** |
| Sellers must trust it with customer chats (A-005) | Keep only order fields; delete raw chats on confirmation or after 7 days (INV-001) | **unproven** — and limited by what the AI provider does with the data (§4) |

## 3. Technical feasibility

**Can build with confidence:**
- Owner sign-in with per-owner data isolation (F-007, INV-AS-001) using a hosted auth service.
- The logbook itself: create, edit, confirm, discard entries; statuses (BR-001 – BR-003).
- Totals and statistics as database queries over confirmed entries (F-004, BR-004 – BR-007).
- Image upload with progress and retry; deleting raw uploads on confirm or discard (INV-001).
- Live updates on the dashboard (F-003) — offered by the hosted databases being considered.
- Webhook routes that check Meta's signature and Telegram's secret token, and store messages per
  owner (F-006) — documented platform features; tested on the team's own test Page and bot.

**Uncertain / needs a spike before committing:**
- **AI accuracy on Taglish screenshots (A-003)** — the make-or-break unknown. Spike: run 30–50
  synthetic Taglish order chats (`seed/idea.md` §8) through at least two candidate AI services,
  score against the 90% target and the 70% / 80% rethink lines, and record time per draft. Do
  this **before** building the interface.
- **Free AI quota vs. use.** Gemini's free tier currently allows about **20 requests a day** on
  Flash models and about **500 on Flash-Lite**, per project; Google no longer publishes these
  numbers and says they can change (measured 2026-09-02:
  https://aiplug.work/en/blog/gemini-free-tier-limits; Google:
  https://ai.google.dev/gemini-api/docs/rate-limits). Cloudflare Workers AI gives **10,000
  "neurons" a day** free; its Llama 3.2 11B Vision model costs 4,410 neurons per million input
  tokens and 61,493 per million output tokens
  (https://developers.cloudflare.com/workers-ai/platform/pricing/). How many screenshots that
  covers depends on tokens per image — `unknown` until the spike measures it.
- **F-005 matching** — suggesting the right open order from a new screenshot (BR-008). If the
  spike shows it's unreliable, fall back to the owner picking the order to update.
- **Scheduled deletion after 7 days** (INV-001) — needs a scheduled job; the mechanism is chosen
  in `sdd.md`.
- **Chat text that tries to steer the AI** — handled by checking the AI's output against the
  BR-002 fields and dropping anything else (`prd.md` §6); needs a test case.
- **30-second draft target** (`prd.md` §6, proposed) — measured in the spike.
- **Meta App Review and business verification (F-006).** Development mode reaches only Pages and
  accounts where the team has a role; real sellers' Pages need App Review, which asks for a
  privacy policy URL and a demo of each permission, and may need business verification with
  registered-business documents the team may not have `[verify current Meta requirements]`.
  Timeline `unknown`. Until it passes, Way 1 is demoed on the team's own test Page (ADR-012).
- **Telegram reply path (F-006).** Customers message the shop bot, so the owner can't reply from
  their own Telegram app. Telegram Business connected bots may solve this; the Bot API 10.0
  changelog (May 8, 2026) says "Secretary Bots" may now manage accounts without Telegram Premium
  (https://core.telegram.org/bots/api) `[verify this covers our case]`.
- **Running Way 1 extraction after the webhook answer** on Vercel — confirm the after-response
  mechanism at build time; fall back to a Cron sweep (`sdd.md` §3).

**External dependencies not fully in your control:**

| Dependency | Status | Mitigation if it's unavailable during the demo |
|---|---|---|
| AI service that reads images | unconfirmed — candidates: Gemini (team's suggestion), Cloudflare Workers AI | Keep the AI behind one replaceable function; owner fills the entry by hand (F-002); show the error state honestly |
| Hosted database with auth and live updates | unconfirmed — Supabase (team's suggestion). Free plan: 500 MB database, 1 GB file storage, 2 active projects; **pauses after a week of inactivity**; data encrypted at rest (AES-256) and in transit (TLS) (https://supabase.com/pricing, https://supabase.com/security) | Open the project in the days before the demo so it isn't paused; refresh on demand if live updates fail |
| Web hosting, free tier | Vercel Hobby (ADR-009) — free, non-commercial use only; server functions up to 300 seconds (https://vercel.com/docs/plans/hobby) | Run the demo locally |
| Free-tier quotas and terms | can change without notice (Gemini already stopped publishing its free limits) | Re-check the week of the demo; keep a recorded walkthrough of the synthetic demo as a last resort |
| Meta app (Messenger Platform, Instagram messaging) | planned for F-006 (ADR-012); no fee found for these APIs `[verify]`; App Review needed for real sellers | Demo on the team's test Page; Way 2 still works if Meta is down |
| Telegram Bot API | planned for F-006 (ADR-012); free to use `[verify]` | Way 2 still works |

**Costs once past free tiers** (list prices checked 2026-10-07; USD, before usage beyond
included quotas):

| Item | When it's needed | List price | Source |
|---|---|---|---|
| Vercel Pro | Before charging sellers — Hobby is non-commercial only (ADR-009) | $20 a month per developer seat | https://vercel.com/pricing |
| Supabase Pro | When the app must not pause, needs backups, or outgrows the free plan | From $25 a month for one project on Micro compute | https://supabase.com/pricing |
| AI processing beyond free quotas | Real-chat pilot if Gemini wins the spike (its free tier is synthetic-only), or when free quotas run out | `unknown` — depends on tokens per screenshot, measured in the spike | — |
| Privacy / legal review | Before real customer chats (§4) | `unknown` | — |

## 4. Regulatory & legal feasibility (Philippines-first, if applicable)

*Common triggers worth checking explicitly: personal data collection → Data Privacy Act
2012 (RA 10173); health data; payments/e-money → BSP oversight; anything resembling lending
or factoring → SEC/lending company regulations; SMS-based services → telco/NTC considerations.*

| Topic | Applies? | Posture for the hackathon build | Gate before real-world use |
|---|---|---|---|
| **Data Privacy Act — customer chats contain personal information** (names; sometimes phone numbers and addresses) | **Yes** | **Synthetic chats only** for development and demo (INV-011). Only order fields kept; phone numbers and addresses never extracted; raw uploads deleted on confirm/discard or after 7 days (INV-001) | A documented lawful basis for processing (the DPA's Section 12 conditions — https://privacy.gov.ph/pips-and-pics/faqs/); a plain privacy notice for sellers; terms between each seller and MabiList, since the seller controls their customers' data and MabiList processes it for them `[verify with mentor or lawyer]`; a way for an owner to delete their account and data (`prd.md` §10) |
| **AI provider's use of submitted data** | **Yes** | Gemini's **free tier may use submitted content to improve Google's products, human reviewers may read it, and Google says not to submit personal information** (https://ai.google.dev/gemini-api/terms). Acceptable for synthetic chats only | Real chats only through a service whose terms exclude training on your data: Gemini **paid** use isn't used to improve products (same source) but needs a billing account, which breaks ₱0; **Cloudflare Workers AI** doesn't use inputs to train models or improve services, on its free allocation too (https://developers.cloudflare.com/workers-ai/platform/data-usage/) |
| **Sending data to providers abroad** | Yes | Synthetic data only | Under the DPA's accountability principle the controller stays responsible for data passed to processors, local or foreign `[verify]`; prefer an Asia-Pacific data region; list providers in the privacy notice |
| **NPC registration** | Probably not mandatory | Not needed for a synthetic demo | Mandatory only for 250+ employees, sensitive personal information of 1,000+ people, risky processing, or automated decision-making about people (NPC Circular 2022-04 §5: https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf). Order chats aren't normally sensitive personal information, and MabiList makes no decisions about customers — the owner confirms every entry. If not registering voluntarily, a sworn declaration is submitted (Circular §6) `[verify which applies]` |
| **Customers don't know their chats are processed** | Yes | Synthetic data | Data minimization and short retention reduce exposure; guidance for sellers on telling customers `[open — not yet designed]` |
| **Way 1 receives every message on a connected account, not just orders** | Yes (F-006) | Team-made messages on the test Page and bot only (INV-011) | Non-order messages create no draft and are deleted within 7 days (INV-001); covered in the privacy notice; same §4 gate as screenshots |
| **BIR** | Indirectly | MabiList is not a book of accounts; no tax features (`seed/idea.md` §10) | Never claim BIR compliance (INV-010) |
| **Payments / BSP** | No | Records payment *status* only; no money moves (`seed/idea.md` §10) | — |
| **Platform terms (Meta, Telegram)** | **Yes** (F-006, ADR-012) | Way 2: the owner uploads screenshots of their own chats; no scraping (rejected, `decision-ledger.md` §4). Way 1: official webhooks only, on the team's own test Page and bot | Meta: App Review, a public privacy policy URL, a data-deletion callback or instructions, and use of message data only for the reviewed purpose `[verify against current Meta Platform Terms and Developer Policies]`; possibly business verification. Telegram: Bot API terms `[verify]` |

**Honesty rule:** don't claim compliance you haven't actually implemented. State the demo's
actual posture ("mocked," "manual review," "not yet addressed") plainly.

*If the project touches regulated data (health, finance, legal), see [`backend-infrastructure-skills.md`](backend-infrastructure-skills.md) §2. The verdict in §7 must state explicitly whether the demo uses synthetic or de-identified data only, and must never claim a compliance certification the project hasn't earned. This is the same "no fabricated claims" rule as `anti-slop-guardrails.md` §1, applied to the feasibility verdict.*

*Applied here: customer chats aren't health or finance data, but they are personal information
under RA 10173, so §2 of that file is followed — synthetic data for the whole build and demo,
technical safeguards implemented (TLS, encryption at rest, per-owner isolation, data
minimization, a defined 7-day retention), and real compliance work deferred and stated as such.*

**What to say to judges:** "The demo runs on synthetic chats. Before real sellers use it with real
customer chats, we'll use an AI service that doesn't train on submitted data, publish a privacy
notice, and have the setup reviewed against the Data Privacy Act." — not "we're DPA-compliant."

## 5. Market feasibility

*Summarize from `seed/market.md` — don't re-derive here.*

The broad ceiling is about 2 million Philippine online sellers (EV-016); the beachhead —
home-based NCR sellers on personal accounts, chat-only, at 10+ orders a week — is unmeasured and
likely far smaller, since most sellers do under 50 orders a month (EV-017) and marketplace sellers
are excluded. Business-account sellers are already served (EV-011, EV-012); personal-account
sellers have only manual tools or one-off converters (`seed/market.md`). Since ADR-012 the MVP
also serves business-account sellers, competing on one logbook for both account types rather
than on access — unproven (A-008). Earlier chat-order tools
for micro-sellers failed on their business model, not on demand (EV-021, EV-022). Whether the
beachhead feels the pain at all is unproven (EV-010).

## 6. Go / no-go criteria

**Go (proceed as planned) when:**
1. A PUP mentor is secured and the application is submitted by 2026-10-11.
2. The AI spike reaches the 90% target on the synthetic Taglish set, within a free quota, on a
   service allowed to see real data later.
3. Interviews show beachhead sellers recording chat orders by hand and finding it painful
   (A-002).

**Go-with-cuts (proceed, but drop X) when:**
1. Accuracy lands between the rethink lines and 90% → keep F-001 but lean harder on review
   (F-002): highlight low-confidence fields.
2. F-005 matching is unreliable → the owner picks the order to update; AI still proposes the
   changes.
3. Free quota is tight → paste-text first (cheaper than images), a daily upload cap per owner
   (`prd.md` §6).
4. Real-chat gate (§4) isn't cleared → the seller test runs on sample chats only, and A-005 stays
   untested.
5. Meta App Review or business verification isn't passed → Way 1 stays a test-Page demo; the
   seller pilot runs on Way 2 (ADR-012).
6. The Telegram reply path proves unworkable → drop Telegram from F-006 and keep Messenger and
   Instagram (needs a ledger entry).
7. Build time runs out → F-006 is the first feature cut, since it's built last (needs a ledger
   entry, ADR-012).

**No-go / must-pivot when:**
1. Accuracy stays below **70% overall or 80% on key fields** after improving the instructions →
   switch to an AI-assisted form the owner fills in (`seed/idea.md` §9 kill criterion).
2. Interviews show sellers don't record orders or don't care to → rethink the segment (A-002).
3. No AI service is both free and allowed to see real customer chats, and no budget is approved →
   no real-chat pilot; the product stays a synthetic demo until funding.

*A missing mentor blocks the application, not the product.*

## 7. Verdict

**GO-WITH-CUTS** — The product is buildable with ordinary web tools (§3), and the problem–solution
fit is plausible though unproven on the points that matter most: accuracy, speed versus the
notebook, and trust (§2). The cuts: **(1) the whole build and demo use synthetic chats only; real
Data Privacy Act compliance is explicitly deferred** and no compliance is claimed (§4, INV-010,
INV-011); **(2) Gemini's free tier is used for synthetic data only**, never real customer chats,
because its terms allow Google to use and review submitted content (§4); **(3) the AI accuracy
spike runs before any interface work**, and its result decides between F-001 as designed, a
review-heavy version, or the AI-assisted-form fallback (§6); **(4) Way 1 (F-006) is built after
Way 2 and runs only on the team's own test Page, Instagram account, and bot until Meta App Review
passes** (ADR-012). The real-chat seller test (A-005) waits until the §4 gate is cleared and
logged in `decision-ledger.md`. The team builds in
skills it already has (Next.js + Supabase, `stack-decision.md`, ADR-008).

## Changelog

| Date | Change |
|---|---|
| 2026-10-07 | Initial feasibility pass — verdict GO-WITH-CUTS |
| 2026-10-07 | Team fit rated after the founder listed skills; stack decided (ADR-008) |
| 2026-10-08 | F-006 in the MVP (ADR-012): Meta App Review, Telegram reply path, platform terms, Way 1 data exposure; cuts 5–7 and verdict cut (4) added; verdict stays GO-WITH-CUTS |
