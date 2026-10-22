# Decision Ledger — MabiList

**Status:** living

> **Agent instructions:** Log a decision *before* editing the documents it affects, not
> after — this is what makes the trail trustworthy instead of retconned. Never rename or
> reuse an ID (`F-###`, `INV-###`, `EV-###`) after a pivot; if something's cut, log it as `cut`
> here and leave the ID retired.

## 1. Immutable IDs (never renamed, even after a pivot)

*Just a running note of ID ranges in use, so nobody accidentally reuses one.*

| ID type | Range in use | Notes |
|---|---|---|
| F-### | F-001 – F-007 (MVP); F-101 – F-104 (later) | F-001 is the core feature, built first (ADR-003); F-006 moved to later (ADR-004), then back into the MVP for Messenger, Instagram, and Telegram (ADR-012); F-007 owner sign-in added (ADR-007) |
| INV-### | INV-001 – INV-003 (product); INV-004 – INV-014 (reserved) | INV-001 customer-data minimization (ADR-002, 7-day limit ADR-007); INV-002 totals use confirmed, priced entries only; INV-003 AI never fills in values not in the chat. Reserved set kept/waived per ADR-006 — INV-006, 008–013 kept; INV-003 (reserved meaning), 004, 005, 007, 014 waived |
| INV-AS-### | INV-AS-001 – INV-AS-005 | reserved anti-slop set; waive in §5, do not renumber |
| EV-### | EV-001 – EV-024 | EV-009 and EV-010 are `unknown — not found` rows awaiting interviews; EV-011–EV-015 from the market scan; EV-016–EV-024 from the evidence passes of 2026-10-07 |

## 2. Assumptions register

*Every `[assumption]` tag anywhere in seed/, work/, or docs/ should have a line here, so
they're trackable in one place instead of scattered.*

| ID | Assumption | Status | Where it appears |
|---|---|---|---|
| A-001 | **(riskiest)** Home-based chat sellers will switch from their notebook to screenshot/paste + confirm, because it's noticeably faster | UNVALIDATED | seed/idea.md §9 |
| A-002 | Chat sellers copy orders out of chats by hand today and find it painful (EV-010) | UNVALIDATED | seed/idea.md §1, §9; work/problem-capture.md |
| A-003 | AI extracts order fields from Taglish screenshots at the 90% target with a free AI service | UNVALIDATED | seed/idea.md §8, §9 |
| A-004 | Free tiers cover 5–10 testers at ₱0 without a credit card | UNVALIDATED | seed/idea.md §9; seed/context.md §5 |
| A-005 | **(riskiest)** Sellers are comfortable putting customer chats through an AI tool, given `INV-001` | UNVALIDATED | seed/idea.md §9 |
| A-007 | A meaningful share of beachhead sellers take orders on personal Messenger/Instagram accounts (where no chat-reading tool works) | UNVALIDATED (surfaced by market scan) | seed/idea.md §9; work/market-scan.md |
| A-006 | The pain starts at ~10–15 chat orders a week, or 4–6 orders open at once; memory works below ~5–8 a week | UNVALIDATED (founder estimate) | seed/idea.md §2, §4, §9; work/problem-capture.md Chain B |
| A-008 | Sellers with a business account (Page, Instagram professional, Telegram bot) will connect it to MabiList, and value one logbook across their accounts over Meta Business Suite's free order tools and existing apps | UNVALIDATED (added with ADR-012) | seed/idea.md §9; docs/prd.md F-006 |

## 3. Pivots

*A pivot is logged here, and every affected canonical document is reconciled in the same
sitting — don't leave stale contradictions across docs.*

| Date | What changed | Why | Docs reconciled |
|---|---|---|---|
| 2026-10-07 | Positioning narrowed to personal-account sellers; `F-006` moved out of the MVP; root cause and value proposition restated (ADR-004) | Market scan showed business-account chat-to-order tools already exist; personal accounts are unserved | seed/idea.md §2, §4, §6, §7, §9; work/problem-capture.md; work/system-flow-explainer.md; work/market-scan.md |
| 2026-10-07 | **Scope cut:** sellers who also sell on an online marketplace with its own checkout (Shopee, Lazada, TikTok Shop, Amazon, and similar) are now **fully out of scope** — including their chat orders. Previously their chat orders counted. Facebook Marketplace is *not* treated as such a marketplace, because it has no checkout and its orders happen in Messenger [confirmed by founder, 2026-10-07] | Founder decision, 2026-10-07: keeps the beachhead to chat-only sellers. Cost: shrinks the segment further — in EV-017, 52% of sellers use Shopee and 46% TikTok Shop | seed/idea.md §2, §5; seed/market.md; work/interview-guide.md (screener 5) |
| 2026-10-08 | **Two ways in the MVP:** `F-006` (business-account connection through official webhooks — Messenger Page, Instagram professional, Telegram shop bot) moves back into the MVP next to screenshot/paste (`F-001`). Positioning becomes one logbook for both account types, with personal accounts still the main gap (ADR-012) | Founder and team decision, 2026-10-08, following `work/system-flow-explainer.md` | seed/idea.md; seed/market.md; work/system-flow-explainer.md; docs/prd.md, sdd.md, stack-decision.md, feasibility.md, design-brief.md, qa-test-plan.md, implementation-plan.md, brd.md, business-canvas.md, gtm.md, pitch-deck-outline.md, index.md; Project_Document.md; Project_Document2.md |

## 4. Rejected options

*Options seriously considered and not chosen — this is what stops the same debate from
happening twice, and shows judges the thinking wasn't accidental.*

| Option | Considered for | Why rejected |
|---|---|---|
| Browser extension / Android WebView that scrapes Messenger, Instagram, and other web chats from the owner's personal account | Capturing personal-account chats automatically | Breaks Meta's terms (Meta has sued extension makers over this); only the owner consents, not the customer, which conflicts with RA 10173; automated reading can get the owner's account restricted; breaks whenever page code changes; an easy feasibility target for judges. Personal accounts use screenshot/paste (F-001) instead. Rejected 2026-10-07 (reasoning in `work/system-flow-explainer.md`). |
| Keep every raw chat message and screenshot permanently (stored privately, owner can delete) | Customer-data handling (ADR-002) | Contradicts the founder's privacy promise that the system reads only what the transaction needs. Keeping full chat history also holds more customer personal data than the logbook requires under RA 10173 (Data Privacy Act of 2012). Rejected 2026-10-07. |

## 5. Architecture / product decision records (ADRs)

*One entry per significant, hard-to-reverse decision.*

### ADR-001: Adopt anti-slop guardrails as a build gate
- **Context:** AI-generated UI, copy, and backend code often looks finished while shipping
  generic visuals, invented APIs, fabricated claims, or insecure defaults.
- **Decision:** `docs/anti-slop-guardrails.md` is canonical. `INV-AS-001`–`INV-AS-005` fold
  into `prd.md §5`. No `handoff/TASK-###.md` is `done` until §6 Delivery Gate passes.
- **Consequences:** Coding agents must read the guardrails before writing UI or code. Conflicts
  with `design-brief.md` are logged here before either file is overridden.
- **Date:** 2026-09-23

### ADR-002: Keep only the order data — delete raw chats after confirmation
- **Context:** The founder's value proposition (`seed/idea.md` §6) promises the system reads
  only the data the transaction needs and protects customers' other personal information. The
  team explainer (`work/system-flow-explainer.md`) saved every raw message permanently and
  extracted the customer's name, so the claim and the design disagreed.
- **Decision:** A raw chat message or screenshot is kept only until the owner confirms (or
  deletes) the logbook entry built from it, then it is deleted. The logbook stores only order
  fields: customer display name, items, quantity, price, delivery date, payment status. Phone
  numbers and addresses are not stored unless the owner types them in. Recorded as `INV-001`.
- **Consequences:** The privacy claim becomes true and pitchable — but only once it's built and
  tested; until then the deck describes it as a design commitment, not a shipped feature.
  Loses the "original message is never lost" safety net after confirmation, so re-checking an
  old entry against its source chat means opening the chat app itself. The extraction step
  must still see the recent conversation while an entry is open. Retention of unconfirmed
  raw messages (e.g., if the owner never confirms) needs a time limit — `open`, to be set in
  `docs/prd.md`.
- **Date:** 2026-10-07

### ADR-003: The MVP's core feature is screenshot/paste → logbook entry (Way 2 first)
- **Context:** The team explainer's suggested build order started with the Telegram bot and the
  official-API flow (Way 1), with screenshot/paste capture (Way 2) third. The founder named
  "turning a screenshot into a proper database entry" as the single feature that proves the
  idea (2026-10-07).
- **Decision:** `F-001` is screenshot/paste → structured logbook entry, and it's built and
  demoed first. Official-API connection (Way 1) stays in the MVP as `F-006`, built last, and is
  the first candidate to cut if time runs short. Sales totals and statistics (`F-004`) are in
  the MVP.
- **Consequences:** The first build needs no Meta app, no Telegram bot, and no public webhook
  URL — only the AI step, the database, and the dashboard — which lowers setup risk for the
  team and for sellers (the "too much setup" contradiction in `work/problem-capture.md`). It
  also serves personal-account sellers from day one. The value proposition's "official APIs"
  reason to believe is not demonstrated until `F-006` is built; the deck must not show it as
  working before then.
- **Date:** 2026-10-07

### ADR-004: Position for personal-account sellers; official-API connection becomes a later add-on
- **Context:** The market scan (2026-10-07, `work/market-scan.md`) found that turning
  **business-account** chats into orders already exists — Orders App, MessOrder AI, Pancake,
  Probaho AI — and Meta Business Suite offers free order tracking in the Page inbox (EV-011,
  EV-012). No chat-reading tool supports **personal** accounts, because the official APIs only
  cover business accounts (EV-014). A screenshot → table converter exists (ImageToTable.ai,
  EV-013) but keeps no running record.
- **Decision:** AI Logbook leads with **home-based sellers who take orders on personal
  Messenger and Instagram accounts**: a screenshot/paste-first running logbook. `F-006`
  (official-API connection) moves from the MVP to the later list; its ID is kept. The root
  cause in `seed/idea.md` §4 is restated for personal-account sellers, and the value
  proposition in §6 drops "official APIs" as its reason to believe.
- **Consequences:** The MVP needs no Meta app review or Telegram bot at all. The pitch no longer
  competes head-on with business-account tools. The idea now depends on A-007 (enough beachhead
  sellers use personal accounts) — a secondary assumption the interviews must check. Sellers
  who later move to a Page can be served by `F-006` without changing apps.
- **Date:** 2026-10-07

### ADR-005: Revenue model — free tier with a monthly order limit, paid plan above it
- **Context:** The deck requires a Business Model section (`seed/context.md` §6), and none was
  defined. AI processing costs grow with every screenshot once free tiers run out (A-004). AVANA,
  an order tool for the same kind of micro-sellers, shut down after cheap flat subscriptions
  failed to cover rising server costs (EV-021). The closest alternatives are free or freemium
  with order limits — Take App free up to 50 orders a month, WISMO free for 30 orders
  (`work/market-scan.md`). Options compared in `docs/business-canvas.md`.
- **Decision:** AI Logbook is free up to a monthly order limit, with a paid plan above it
  [founder, 2026-10-07]. **The limit and the price are not set** — they're decided after
  interviews and the prototype measure willingness to pay and AI cost per order
  (`seed/idea.md` §8).
- **Consequences:** Revenue comes from the heaviest users, who also cause the most AI cost and
  feel the pain most (A-006). Risk: most sellers do under 50 orders a month (EV-017), so a high
  limit means almost nobody pays and a low one pushes away the beachhead — the limit has to be set
  from measured volumes, not guessed. The deck states the model, not a price or revenue forecast
  (`INV-AS-004`). Rejected alternatives: free with grant funding (no revenue, unsecured funding)
  and a flat subscription (light users overpay; repeats AVANA's pattern).
- **Date:** 2026-10-07

### ADR-006: Product INV-003 keeps its ID; reserved invariants kept or waived for this product
- **Context:** `docs/prd.md` reserves `INV-003`–`INV-014` for engine, frontend, and backend
  rules (`HOW_TO_USE_FMD.md` Step 3.3). This project's seed had already assigned `INV-003` to
  "the AI never fills in a value that isn't in the chat" (`seed/idea.md` §9, audit log
  2026-10-07). Both rules say never renumber.
- **Decision:** Product `INV-003` keeps its ID and meaning. The reserved **sandboxing** rule that
  shared the number is waived: AI Logbook never executes AI-generated code. The other reserved
  rules are kept or waived as follows:

  | Reserved rule | Decision | Why |
  |---|---|---|
  | INV-003 sandboxing (reserved meaning) | **waived** | No AI-generated code is executed; the ID belongs to the product rule |
  | INV-004 crawling compliance | **waived** | No crawling; scraping chats was rejected (§4) |
  | INV-005 content licensing | **waived** | No crawled content is stored or shown |
  | INV-006 entity-merge review | **kept** | Applies to F-005: a new screenshot is never merged into an existing order without the owner confirming |
  | INV-007 citation grounding | **waived** | The product generates no citations |
  | INV-008 stream integrity | **kept** | Applies to AI extraction and the live dashboard: a failed or interrupted extraction is never shown as a complete entry |
  | INV-009 visualization honesty | **kept** | Applies to F-004 statistics; demo data must be labelled as sample data |
  | INV-010 compliance honesty | **kept** | Extended to the Data Privacy Act (RA 10173) and BIR — never claim "compliant" |
  | INV-011 no real regulated data | **kept for development and demo** | Customer chats contain personal data. The real-chat test with sellers (A-005, `seed/idea.md` §9) may only start after `feasibility.md` covers RA 10173 and a decision is logged here |
  | INV-012 encryption | **kept** | Order entries include customer display names |
  | INV-013 job visibility | **kept** | Applies to AI extraction: an upload whose extraction fails is never silently lost |
  | INV-014 audit-log retention | **waived** | The MVP keeps no audit or access logs; revisit if `feasibility.md` finds RA 10173 needs a processing record |
- **Consequences:** `docs/prd.md` §5 lists all IDs with these statuses; none is deleted.
  `qa-test-plan.md` needs negative tests only for the kept ones. The real-chat test is gated
  behind `feasibility.md`.
- **Date:** 2026-10-07

### ADR-007: PRD decisions — 7-day limit on unconfirmed raw chats, owner sign-in (F-007), sales counted by confirmation date
- **Context:** Writing `docs/prd.md` surfaced three gaps in `seed/`: ADR-002 left the retention of
  never-confirmed raw chats open; 5–10 testers each need to see only their own orders
  (`INV-AS-001`), but sign-in wasn't a feature; and F-004's "total sales today / this week /
  this month" didn't say which date an order counts on.
- **Decision** [founder, 2026-10-07]:
  1. A raw chat or screenshot whose entry is never confirmed or discarded is deleted
     automatically **7 days** after upload.
  2. **F-007 — Owner sign-in** is added to the MVP; each owner sees and changes only their own
     logbook.
  3. Sales totals count an order on **the day it was confirmed in the logbook** (Asia/Manila).
- **Consequences:** INV-001 gains the 7-day limit. F-007 is a new ID added to `seed/idea.md` §7
  before the PRD. Sales totals never depend on a date the chat may not show; orders confirmed
  late are counted on the confirmation day, not the day the customer ordered.
- **Date:** 2026-10-07

### ADR-008: Stack — Next.js web app + Supabase; AI provider chosen by a spike; Gemini free tier for synthetic chats only
- **Context:** `docs/stack-decision.md` needed the team's real skills and criterion weights. The
  founder listed them on 2026-10-07 (`seed/context.md` §4) and chose fluency-first weights.
  `docs/feasibility.md` §4 found that Gemini's free tier may use submitted content to improve
  Google's products and lets human reviewers read it, and Google says not to submit personal
  information to it; Cloudflare Workers AI says it doesn't train on inputs, including on its free
  allocation.
- **Decision** [founder weights and skills, 2026-10-07]:
  1. Stack: a **Next.js** web app used in the phone browser, **Supabase** (Postgres, Auth,
     Storage, Realtime) for data and sign-in, and the AI called only from server-side code.
     Hosting is chosen in `sdd.md`.
  2. The AI call sits behind one replaceable server function. The provider is chosen by the
     accuracy spike (`feasibility.md` §3) between Gemini (free tier) and Cloudflare Workers AI
     (Llama 3.2 11B Vision).
  3. **Gemini's free tier only ever receives synthetic chats.** Real customer chats go only to a
     provider whose terms exclude training on submitted data, and only after the `feasibility.md`
     §4 gate is cleared and logged here (INV-011).
- **Consequences:** Both developers work in languages they already know. A native Android app
  stays later (F-104). If Gemini wins the spike on accuracy, the real-chat pilot needs either a
  paid tier, which breaks ₱0 and needs a new decision, or a switch to the second-best provider.
  Alternatives scored in `docs/stack-decision.md` §3: Vue + Python API, React Native app.
- **Date:** 2026-10-07

### ADR-009: System design — Vercel Hobby hosting, email + password sign-in, hourly deletion job, no live-update connection
- **Context:** `docs/sdd.md` had to settle what `stack-decision.md` left open: hosting, the
  sign-in method (F-007), how raw uploads are deleted after 7 days (INV-001), and whether F-003
  needs a live connection. Checked 2026-10-07: Vercel's free Hobby plan allows server functions up
  to 300 seconds, but scheduled jobs only once a day with up to 59 minutes' drift, and it's
  limited to non-commercial use (https://vercel.com/docs/cron-jobs/usage-and-pricing,
  https://vercel.com/docs/limits/fair-use-guidelines). Supabase files must be deleted through
  its Storage API, not SQL (https://supabase.com/docs/guides/storage/management/delete-objects).
  Supabase Cron can run hourly and make HTTP requests (https://supabase.com/docs/guides/cron).
  Supabase Auth stores passwords as bcrypt hashes
  (https://supabase.com/docs/guides/auth/password-security).
- **Decision:**
  1. Host the Next.js app on **Vercel Hobby**, functions pinned near the Supabase project
     (Singapore).
  2. Sign-in is **email + password** through Supabase Auth [founder, 2026-10-07]. Tester
     accounts may skip email confirmation.
  3. An **hourly Supabase Cron job** calls a protected server route that deletes raw uploads
     older than 6 days 23 hours through the Storage API, so nothing outlives 7 days. If the
     scheduler can't make HTTP calls on the free plan, the fallback is Vercel's daily job with a
     shorter cut-off, which needs the owner-facing "7 days" wording revisited here first.
  4. **No live-update connection, job queue, or streaming in the MVP.** One AI call per upload,
     awaited by the browser, with its status saved in the database so a failure is never lost
     (INV-013). F-003's "no page refresh" is met by updating the screen after the owner's own
     actions and re-loading when the app regains focus. Supabase Realtime stays available if
     testers use two devices at once.
- **Consequences:** Fewer moving parts for the demo. Before AI Logbook charges anyone (ADR-005),
  hosting must move to a paid Vercel plan or another host, because Hobby is non-commercial. A
  paused Supabase project also pauses the deletion job, so overdue uploads are deleted on the
  first run after it resumes. Two devices open at once won't see each other's changes until
  refocus.
- **Date:** 2026-10-07

### ADR-010: Design brief inputs — UI design not yet made; English interface first; warm, friendly voice
- **Context:** `docs/design-brief.md` §0 must come from the founder, who is also the team's UI/UX
  designer. `docs/prd.md` §6 left the interface language to the design brief. Nothing in `seed/`
  set a brand voice.
- **Decision** [founder, 2026-10-07]:
  1. §0 status **not yet** — the founder will design the UI. Nothing is scaffolded or generated,
     and no `handoff/TASK-###.md` is written, until a design exists. A backend-only slice was not
     authorized.
  2. Interface language: **English first**, in simple everyday words; a Filipino toggle comes
     later and has no feature ID yet. Chats themselves are still read in Taglish and English.
  3. Voice: **warm and friendly** — casual and encouraging, within the anti-slop rules: no hype
     words, no unproven claims.
- **Consequences:** No build task starts until §0 changes — including the backend-only AI accuracy
  spike, since the founder declined a backend-first waiver. Planning (Stage 3) continues. A Filipino
  toggle needs an `F-###` in `seed/idea.md` §7 before it's specified.
- **Date:** 2026-10-07

### ADR-011: Product name — MabiList
- **Context:** Every file used the working name "AI Logbook" while the name was open. The project
  document and deck are due 2026-10-10 / 2026-10-11 and need a final name.
- **Decision** [founder, 2026-10-08]: the product is named **MabiList**. "AI Logbook (working
  name)" is replaced with "MabiList" in `seed/`, `work/`, `docs/`, and `Project_Document.md`.
- **Consequences:** ADR-001 to ADR-010 above keep the working name as written; they refer to the
  same product. Any tagline or meaning given for the name comes from the founder, not from
  generated copy. Whether the name is free to use as a business or trade name is not checked.
- **Date:** 2026-10-08

### ADR-012: Two ways in the MVP — webhooks for business accounts, screenshots for personal accounts
- **Context:** ADR-004 moved business-account connection (`F-006`, "Way 1" in
  `work/system-flow-explainer.md`) out of the MVP because business-account tools already exist
  (EV-011, EV-012). The founder and team decided on 2026-10-08 to keep both ways from the
  explainer: personal-account sellers use screenshots or paste (Way 2), business-account sellers
  connect their account and messages arrive through the platform's official webhooks (Way 1).
- **Decision** [founder, 2026-10-08]:
  1. **`F-006` is back in the MVP** for **Facebook Messenger (Page)**, **Instagram professional
     accounts**, and a **Telegram shop bot**. WhatsApp (`F-101`) and Viber (`F-102`) stay later.
  2. **Positioning:** one logbook for both account types. Personal accounts stay the main gap the
     pitch emphasizes, since business-account tools already exist; ADR-004's "personal accounts
     only" positioning is superseded, its reasoning about the gap stands.
  3. **Build order:** Way 2 first (`F-001` stays the core feature, ADR-003), then `F-006`. Both
     are MVP. Cutting `F-006` later needs a new entry here.
  4. **Meta review:** until Meta approves the app, Way 1 is built and demoed on the team's own
     test Page and Instagram account (development mode). Real sellers' Pages and Instagram
     accounts connect only after Meta App Review and business verification `[verify current Meta
     requirements]`. Telegram bots need no review.
  5. **System design** (detail in `sdd.md`): webhook routes verify every request (Meta's
     signature, Telegram's secret token) and answer fast; page and bot tokens stay on the server;
     raw webhook messages follow INV-001 (deleted when the entry built from them is confirmed or
     discarded, or after 7 days); the MVP reads text messages only `[proposed]`; each new customer
     message triggers one extraction for that conversation, counted against the daily cap. New
     drafts from webhooks reach the open logbook through **Supabase Realtime**, which replaces
     ADR-009 item 4 for Way 1; Way 2 still needs no live connection.
- **Consequences:**
  - A-007 (enough sellers on personal accounts) is no longer make-or-break: sellers on Pages are
    served too. New assumption A-008: business-account sellers will connect their account and
    prefer one logbook over Meta's free tools and existing apps.
  - MabiList now overlaps with business-account tools (Orders App, MessOrder AI, Pancake, Meta
    Business Suite). The differentiator to pitch: no tool found covers personal and business
    accounts in one running logbook (EV-013, EV-014).
  - New dependencies: a Meta developer app (free), a test Page, a Telegram bot, and a public HTTPS
    webhook URL (the Vercel deployment). Meta needs a privacy policy URL and data-deletion
    instructions before real Pages connect `[verify]`. Meta's business verification may require
    registered business documents, which the team doesn't have `[verify]` — a possible blocker for
    real Pages, not for the demo.
  - **Open — Telegram reply path:** customers who message a shop bot can't be answered from the
    owner's own Telegram app, and MabiList doesn't send replies. Options: Telegram Business
    "connected bots," which read the owner's own business chats but need Telegram Premium
    `[verify]`, or a separate reply tool. Must be settled before the Telegram part is built.
    *Note added 2026-10-08:* the Bot API changelog for Bot API 10.0 (May 8, 2026) says "Secretary
    Bots" may now manage accounts of users without Telegram Premium, and the API delivers
    `business_message` updates from a connected business account
    (https://core.telegram.org/bots/api, checked 2026-10-08). If that covers this case, the owner
    could connect a bot to their own Telegram account and reply from their own app `[verify]`.
  - Way 1 receives every message sent to a connected account, including chats with no order. More
    personal data passes through the system, so INV-001's 7-day limit and the data-deletion
    callback matter more; INV-011 still keeps real chats out until the `feasibility.md` §4 gate.
  - The design brief's "never say automatic / reads your Messenger" rule still holds for personal
    accounts; for connected business accounts the copy may say messages "arrive on their own."
- **Date:** 2026-10-08

### ADR-013: Prototype reference and six backend contract decisions
- **Context:** The founder shared the MabiList Make prototype on 2026-10-23 and accepted all six recommendations after comparing its behavior with the current specs. Source: founder approval in this chat; prototype: https://www.figma.com/make/ekR2zUP2Glr5Gl7z0I1Wal/Prototype-MabiList-PWA . Prototype behavior is simulated, not evidence of a working backend.
- **Decision** [founder, 2026-10-23]:
  1. Store nullable item unit prices and a nullable order total. Compute quantity × unit price when every item is priced; otherwise use an explicitly stated total or leave it unknown. Conflicting stated/calculated totals require seller resolution; zero is not unknown.
  2. Keep `not_stated`, `unpaid`, and `paid`. Only explicitly unpaid confirmed orders contribute to amount owed, including delivered orders; unknown payment gets a separate count. This supersedes BR-003/BR-007's inclusion of unknown payment in unpaid figures.
  3. Return temporary source previews and validated field-evidence references for draft review. Delete copied evidence with its source. Resolve drafts sharing one upload as a batch before deleting the source; the original seven-day expiry never extends. This explicitly amends INV-001's per-entry deletion trigger for shared sources.
  4. Delete my logbook removes orders, drafts, raw content, and review data and disconnects channels/removes their credentials, while retaining login and shop profile. Block incoming processing before cleanup; do not allow in-flight work to recreate deleted data. Account deletion remains separate.
  5. Offline access is read-only to the last successfully loaded logbook, with a last-updated time. No offline mutation queue. Clear cached shop data on sign-out; do not cache raw chat evidence. Offline copy must not imply queued changes.
  6. Monetary period totals use confirmation date in Asia/Manila, Monday-start weeks; due-date views use delivery date. Ask the designer to consider clearer confirmation-based labels; no visual redesign is authorized.
- **Design gate:** The founder-supplied prototype establishes a founder-owned design reference. Record it in `design-brief.md` and open PH-01; this does not mark existing frontend work complete.
- **Consequences:** Reconcile PRD, SDD, design inputs, QA cases, and task scopes before implementation. The prototype's item-price/payment controls and deletion/offline behavior require contract changes. Existing code/types remain unchanged in this documentation pass. HTTP transport details, auth verification behavior, and exact evidence serialization still need an implementation contract; the six decisions do not settle those details or change the selected stack.
- **Date:** 2026-10-23

### ADR-014: Separate frontend and backend directories without a shared package
- **Context:** The contract work in TASK-022 lives partly under `web/`, while the founder wants
  frontend and backend developers to work in separate directories and merge their work cleanly.
  The earlier stack choice placed server routes inside the Next.js app.
- **Decision** [founder, 2026-10-23]: Keep `web/` for the Next.js frontend and its local API
  adapter/mock; create an independently runnable `backend/` for server code and all product-data
  reads and writes. The frontend may use Supabase Auth for sign-in, but screens and the adapter
  will not query product tables or private Storage directly. Do not create a `shared/` package.
  `docs/sdd.md` is the agreed HTTP contract; each side owns its own types and changes the
  contract deliberately when request or response shapes change.
- **Consequences:** The backend needs its own deployment and a same-origin `/api` routing plan
  before live integration. The existing frontend mock stays usable during backend work. The
  original Option A score assumed a single Next.js deployment and is now historical; hosting,
  auth transport, and deployment cost must be checked before shipping. ADR-012's direct
  browser Supabase Realtime subscription is superseded; the backend must deliver owner-scoped
  notifications or another live update path, with reload on focus as fallback. TASK-022's
  contract work is preserved, and a separate structure packet tracks this migration.
- **Date:** 2026-10-23

### ADR-00N: {title}
- **Context:** {...}
- **Decision:** {...}
- **Consequences:** {...}
- **Date:** {...}

## 6. Invariant audit log

*Any change that touches an `INV-###` surface gets a line here, even if the invariant itself
didn't change — this is the audit trail a judge or future teammate would want to see.*

| Date | INV-### | Change made | Still holds? |
|---|---|---|---|
| 2026-10-23 | INV-001 | ADR-013: shared-source drafts resolve as a batch; evidence follows raw-source deletion and the original seven-day expiry; logbook deletion removes raw content | amended deletion trigger — design only, not implemented |
| 2026-10-23 | INV-002, INV-003 | ADR-013: optional unit prices, seller-resolved discrepancies, unknown payment separated from owed totals | retained — design only, not implemented |
| 2026-10-23 | INV-AS-001, INV-008 | ADR-013: owner-scoped offline cache, sign-out clearing, freshness labels, and deletion fencing | retained — design only, not implemented |
| 2026-10-07 | INV-001 | Created (ADR-002): raw chats/screenshots deleted after the entry is confirmed; logbook keeps order fields only | yes — design only, not yet built |
| 2026-10-07 | INV-002 | Created: unconfirmed or price-less entries never counted in totals (F-002, F-004) | yes — design only, not yet built |
| 2026-10-07 | INV-003 | Created: AI never fills in a value not present in the chat (F-001) | yes — design only, not yet built |
| 2026-10-07 | INV-001 | 7-day automatic deletion added for raw chats never confirmed or discarded (ADR-007) | yes — design only, not yet built |
| 2026-10-07 | INV-003 – INV-014 (reserved) | Kept or waived per ADR-006; product INV-003 keeps its ID, reserved sandboxing meaning waived | n/a — folded into `docs/prd.md` §5 |
| 2026-10-07 | INV-011 | Gemini's free tier restricted to synthetic chats; real chats only via a provider that doesn't train on inputs, after the `feasibility.md` §4 gate (ADR-008) | yes — design only, not yet built |
| 2026-10-08 | INV-001 | Extended to raw messages received through webhooks (F-006): deleted when the entry built from them is confirmed or discarded, or after 7 days (ADR-012) | yes — design only, not yet built |
| 2026-10-08 | INV-008, INV-013 | Extended to webhook-triggered extractions and live updates: a failed extraction from an incoming message is shown, never lost (ADR-012) | yes — design only, not yet built |
| 2026-10-08 | INV-AS-001, INV-AS-002 | Extended to channel connections: page and bot tokens server-side only; a webhook message is only ever attached to the owner of the connected account (ADR-012) | yes — design only, not yet built |
