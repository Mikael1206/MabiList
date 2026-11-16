<p align="center">
  <img src="web/public/icons/logo-hero.svg" alt="MabiList logo" width="128">
</p>

<h1 align="center">MabiList</h1>

<p align="center"><b>From chat to order list.</b><br>
A running sales logbook built from chats: it turns each Messenger or Instagram conversation into an order record, keeps it updated as the chat continues, and lets the seller confirm every entry.</p>

<p align="center">
  <img alt="Web: Next.js 16" src="https://img.shields.io/badge/Web-Next.js%2016-000000?style=flat&labelColor=111111&logo=nextdotjs&logoColor=white">
  <img alt="UI: React 19 | Tailwind 4" src="https://img.shields.io/badge/UI-React%2019%20%7C%20Tailwind%204-149ECA?style=flat&labelColor=20232A&logo=react&logoColor=white">
  <img alt="Backend: Node.js, no framework" src="https://img.shields.io/badge/Backend-Node.js%20built--ins-5FA04E?style=flat&labelColor=233D1A&logo=nodedotjs&logoColor=white">
  <img alt="Data: Supabase + RLS" src="https://img.shields.io/badge/Data-Supabase%20%2B%20RLS-3ECF8E?style=flat&labelColor=1C5C3F&logo=supabase&logoColor=white"><br>
  <img alt="AI: OCR-first, Cloudflare Llama 3.3" src="https://img.shields.io/badge/AI-OCR--first%20%7C%20Llama%203.3-F6821F?style=flat&labelColor=7A3A0A&logo=cloudflare&logoColor=white">
  <img alt="Privacy: raw chats deleted" src="https://img.shields.io/badge/Privacy-raw%20chats%20deleted-4E83C4?style=flat&labelColor=213B5E">
  <img alt="PSC XI NCR Regional Finalist: top 15 of 108" src="https://img.shields.io/badge/PSC%20XI%20NCR-Regional%20Finalist%20(Top%2015%20of%20108)-F59E0B?style=flat&labelColor=7C4A03">
  <img alt="Stage: Ideation" src="https://img.shields.io/badge/Stage-Ideation-8B5CF6?style=flat&labelColor=3B2478">
  <img alt="Tests: 43 backend passing" src="https://img.shields.io/badge/Backend%20tests-43%20passing-0E9F6E?style=flat&labelColor=065F46">
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="docs/index.md">Docs</a> ·
  <a href="AGENTS.md">Project rules</a> ·
  <a href="docs/prd.md">PRD</a> ·
  <a href="docs/sdd.md">System design</a>
</p>

> 🏆 ** NCR Regional Finalist, Philippine Startup Challenge XI.** MabiList is one of the **top 15 out of 108 participants** in the NCR regional round.
>
> **Built by team The Followers of Ultron.** MabiList is at the **Ideation** stage. The web app, the backend and the database are real and tested; AI chat reading is still being measured and runs on **synthetic chats only** (see [Honest status](#honest-status)).

## See it

<!--
  Add your media here once exported, same pattern as a product README:
  <table align="center"><tr>
    <td align="center" width="50%"><a href="YOUR_DEMO_VIDEO_URL"><img src="docs/media/poster.jpg" width="420"></a><br><b>Watch the demo</b></td>
    <td align="center" width="50%"><img src="docs/media/demo.gif" width="420"><br><b>Upload, review, confirm</b></td>
  </tr></table>
-->

### The pitch in one story

Mia sells ube pandesal from her home in Quezon City. Her customers order in Messenger. She changes a quantity mid-chat, a payment arrives, a delivery date moves. MabiList reads the chat, drafts one order entry, and shows what it could not find as **"not in chat"** instead of guessing. Mia checks it, taps **Confirm**, and the screenshot is deleted.

### Screens

| Screen | What it does |
| :-- | :-- |
| **Logbook** | Every order sorted by delivery date, with an attention strip, drafts, filters and payment and delivery status |
| **Add order** | Upload a chat screenshot or paste the text, then watch it get read, with every result state handled (no order, unreadable, failed) |
| **Check the entry** | The draft review: fix any field, see which fields are "not in chat", then confirm |
| **Order detail and edit** | A confirmed order, editable, with proposed updates when the chat continues |
| **Totals** | Still owed, sales today, this week and this month, orders by status, top items, due soon |
| **Settings** | Shop name, account email, privacy and data, sign out |

## The problem

Small sellers close deals inside chat threads, but the record of each deal (who ordered what, how much, when, and whether it is paid) is copied out afterward, by hand, into a notebook or spreadsheet. Most cannot pay a bookkeeper, so the owner does it, and every hour spent retyping orders is an hour taken from selling.

- **Retyping.** Every order is written twice: once in the chat, once in the notebook.
- **Mid-chat changes.** A changed quantity or a moved delivery date means finding and fixing the old record.
- **Personal accounts are the gap.** Tools that read chats need a Facebook Page, an Instagram professional account or WhatsApp Business. Many home-based sellers just use their personal accounts.
- **Totals you cannot trust.** When copying is late or skipped, orders and receipts go missing and the owner loses sight of what is owed.

| Evidence | Figure | Source |
| :-- | :-- | :-- |
| Registered MSMEs in the Philippines | 1,241,733, which is 99.63% of establishments | DTI, 2023 MSME Statistics in Brief (EV-003) |
| Consumers who prefer Messenger for MSME messages | 91.6%, with Instagram DM at 54.2% (n = 300) | Casimiro et al., 2022 (EV-006) |
| How micro and small businesses record transactions | Mostly by hand in notebooks, with incomplete records and lost receipts | Borromeo et al., 2024 (EV-007) |
| Online sellers in the Philippines | About 2 million in 2022, against a 750,000 forecast (DTI verbal estimate) | BusinessWorld (EV-016) |
| Seller volume | Most sellers process fewer than 50 orders a month | Milieu Insight (EV-017) |

Some of these are ceilings, not measurements, and the chat-seller pain itself is still an assumption to be tested in interviews. The honest full ledger, with caveats for every row, is in [work/evidence-ledger.md](work/evidence-ledger.md). Problem analysis: [work/problem-capture.md](work/problem-capture.md).

**SDG fit:** SDG 8 (targets 8.2 and 8.3) as primary, SDG 9 (target 9.3) as secondary. MabiList contributes for its users; it does not claim to move national indicators.

## How MabiList works

One logbook, **two ways in**, one rule: **the owner confirms every entry.**

- **Way 2: personal accounts.** Upload a chat screenshot or paste the messages, once per conversation. Local OCR (Tesseract, English plus Filipino) reads the image, and only the transcript goes to the AI.
- **Way 1: business accounts.** Connect a Facebook Page, an Instagram professional account or a Telegram shop bot once. Messages then arrive through the platform's official, signed webhooks and appear in the logbook as drafts.
- **Drafts, never guesses.** The AI may fill only what the chat states. A missing price, date or payment status is shown as "not in chat" and left out of totals until the owner adds it.
- **Follows the chat.** When a conversation continues, MabiList proposes field-by-field updates to the matching open order. The owner approves what applies.
- **Totals you can trust.** Unconfirmed drafts and unpriced orders never count toward sales. The app shows how many orders have no price yet.
- **Keeps only order details.** No phone numbers or addresses are captured by default.

### Rules the code enforces

| Rule | What it means |
| :-- | :-- |
| **INV-001, data minimization** | Raw screenshots and pasted text are deleted when the entry is confirmed or discarded, or after 7 days |
| **INV-002, honest totals** | Drafts and entries with no price never count |
| **INV-003, no guessing** | The AI never fills a value the chat does not state |
| **INV-006, entity-merge review** | An update never applies to an order without owner approval |
| **INV-008 and INV-013, failures are visible** | A failed extraction shows a retry, never a half-finished entry |
| **INV-009, visualization honesty** | Charts never render sample data as real, and sample data is labelled |

The full list is in [docs/prd.md](docs/prd.md) §5, with a test or negative test for each in [docs/qa-test-plan.md](docs/qa-test-plan.md).

## Honest status

We would rather you hear it from us than from a judge.

| Area | State |
| :-- | :-- |
| Web app (Next.js) | Logbook, Add order, manual entry, order detail and edit, Totals, Settings and auth screens built from the founder's Figma design |
| Backend (Node.js) | Health, session, extraction (with retry), source preview, orders CRUD and confirm, and the Meta and Telegram webhook routes. **43 tests pass** |
| Database (Supabase) | Owner-scoped tables with row-level security, private upload bucket, a transaction-based two-owner isolation test, a daily extraction cap |
| AI reading | **Below target.** On 15 synthetic chats the OCR-first Llama 3.3 path scored 71.1% overall and 58.3% on key fields, against our 90% goal and our 80% key-field rethink line. It is used as a **reviewable draft** only |
| Real customer chats | **Not allowed yet.** A privacy and Data Privacy Act (RA 10173) gate must clear first |
| Meta live accounts | Developed on the team's own test Page. Real sellers connect only after Meta App Review |
| Pitch demo mode | Scripted reading and simulated account connection, labelled "Simulated for this demo", with no accuracy claims (ADR-017) |

Live task status lives in one place: [docs/implementation-plan.md](docs/implementation-plan.md).

## FAQ

**What is MabiList?**
A sales logbook for home-based sellers who take orders in Messenger and Instagram chats. It turns a chat into an order entry, keeps it updated as the chat continues, and tracks payment, delivery and totals.

**Who is it for?**
Our first group is home-based sellers in Metro Manila who take orders in Messenger and Instagram on personal or business accounts, ideally with about 10 or more chat orders a week. Shopee, Lazada and TikTok Shop sellers are out of scope.

**Does it reply to my customers?**
No. It is not a chatbot, a payment processor or accounting software. It records payment **status**; no money moves through it.

**Does the AI decide my orders?**
No. The AI drafts, you confirm. Nothing counts toward totals until you do.

**Is it a BIR book of accounts?**
No, and we never imply it is.

**What happens to my customers' chats?**
Raw screenshots and messages are deleted when you confirm or discard the entry, or after 7 days. Only the order details stay, and each owner can see only their own rows.

**How will it make money?**
Free up to a monthly order limit, paid above it (ADR-005). The limit and price are not set yet; they will come from interviews and measured AI cost. Details: [docs/business-canvas.md](docs/business-canvas.md).

**What does the name mean?**
The meaning of the name comes from the founder, not generated copy (ADR-011).

## Quick start

You need **Node.js 22+** and a Supabase project (the repo documents the dedicated Singapore project it uses).

```bash
git clone https://github.com/<your-org>/MabiList.git
cd MabiList
```

**1. Backend** (uses Node.js built-ins, so no install step):

```bash
cd backend
cp .env.example .env     # fill SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, Cloudflare keys, DAILY_EXTRACTION_LIMIT
npm run dev              # http://127.0.0.1:3001
```

**2. Web app:**

```bash
cd web
npm ci
# create web/.env.local
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
#   BACKEND_URL=http://127.0.0.1:3001     # optional, this is the default
npm run dev              # http://localhost:3000
```

Create an account on the sign-up screen. The browser talks only to same-origin `/api`, which Next.js forwards to the backend. Service keys never go in `web/`.

**Checks:**

```bash
cd backend && npm run check && npm test     # 43 tests
cd web && npm run lint && npm test && npm run build
```

### Screenshot reading (optional)

Install Tesseract with English and Filipino data (`tesseract-ocr`, `tesseract-ocr-eng`, `tesseract-ocr-fil` on Ubuntu or Debian). Set `TESSERACT_PATH` and `TESSDATA_PREFIX` in `backend/.env` if it is not on your PATH.

### Run the accuracy evaluation

The `backend/eval/` folder holds **30 invented Taglish chats** and their expected fields. No real customer chat is ever used.

```bash
cd backend
npm run eval:fixtures                            # renders PNG chat screenshots (needs ImageMagick)
npm run eval:ocr -- --provider=cloudflare --limit=1   # smoke test first
npm run eval:ocr -- --provider=cloudflare
```

It reports overall accuracy, key-field accuracy, guessed values, failures and timing, and exits nonzero below 70% overall or 80% key fields.

## Scripts

| Where | Script | What it does |
| :-- | :-- | :-- |
| `backend/` | `npm run dev` / `npm start` | Run the API with a `.env` file (watch mode for dev) |
| `backend/` | `npm run check` | Syntax-check every source file |
| `backend/` | `npm test` | Node test runner (43 tests) |
| `backend/` | `npm run eval:fixtures` | Render synthetic chat screenshots |
| `backend/` | `npm run eval` / `npm run eval:ocr` | Image-first or OCR-first accuracy runs |
| `web/` | `npm run dev` / `build` / `start` | Next.js development, build and production |
| `web/` | `npm run lint` / `npm test` | ESLint and Vitest |

## Tech stack

| Area | Tools |
| :-- | :-- |
| Web | Next.js 16, React 19, Tailwind 4, TypeScript, Vitest |
| Backend | Node.js built-ins (no framework), `node --test`, server-sent logbook updates |
| Data and auth | Supabase Postgres with row-level security, Supabase Auth, private Storage bucket, SQL isolation tests |
| Reading chats | Tesseract OCR (`eng` plus `tgl`), then Cloudflare Workers AI Llama 3.3 70B for JSON extraction. Gemini and Hugging Face adapters exist for evaluation |
| Channels | Meta Messenger and Instagram webhooks (signed requests), Telegram bot webhook (secret token) |
| Process | Spec-first: seed, work, docs, then handoff packets, with a decision ledger and anti-slop delivery gate |

## Project layout

```text
web/        Next.js app: screens, components, API adapter, stats and format helpers
backend/    Node.js API, extraction, channels, Supabase migrations and tests, eval harness
seed/       The founder's inputs: idea, market, event context
work/       Evidence ledger, problem capture, market scan, interview guide, system flow
docs/       BRD, PRD, SDD, stack decision, QA plan, GTM, design brief, decision ledger
handoff/    One bounded task packet per work session (TASK-###)
```

## How we work

MabiList follows a written pipeline: **seed → work → docs → handoff**. Every product fact traces to `seed/` or `work/`, and anything unproven is marked `[assumption]` or `unknown` instead of guessed. Every pivot gets a line in [docs/decision-ledger.md](docs/decision-ledger.md) before docs change, and [docs/implementation-plan.md](docs/implementation-plan.md) is the only source of truth for what is done. See [AGENTS.md](AGENTS.md) and [AGENT_ROUTING.md](AGENT_ROUTING.md).

## Team

| Name | Role |
| :-- | :-- |
| An-joe Mikael T. Albano | Product manager, UI/UX designer |
| Tyrone Loius V. Teemer | Backend |
| Yancy Allen S. Tiburcio | Frontend |

*Team The Followers of Ultron: Regional Finalist (top 15 of 108 participants), Philippine Startup Challenge XI, NCR.*
