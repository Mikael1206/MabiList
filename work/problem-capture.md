# Problem capture: MabiList

> **Agent instructions:** Do this *before* writing `seed/idea.md §4` (root cause). The
> five-whys should feel a little uncomfortable — if every answer feels obvious, you probably
> stopped one level too early. Don't resolve contradictions by picking the flattering answer;
> note them and flag for a human/interview to settle.

**Last updated:** 2026-10-07 · **Source:** founder answers (2026-10-07) unless an `EV-###` is
cited. Interviews conducted: 0 — every link below is `[assumption]` until interviews confirm it.

## Five whys

*Revised 2026-10-07 (second pass). The first pass stopped early: its whys 4–5 listed why the
obvious fixes fail instead of asking why the problem exists. The first-pass chain is kept at the
bottom of this file for the record.*

### Chain A — why the problem exists

1. **Problem (observed):** Home-based NCR sellers who take orders over Messenger and Instagram
   spend time copying each deal out of the chat into a notebook or spreadsheet, and records go
   missing when they don't (`seed/idea.md` §1; manual notebook recording and lost receipts:
   EV-007).
2. **Why does that happen?** The deal and the record live in two different places. The deal
   happens in the chat; the record lives in a notebook or spreadsheet. Nothing connects them, so
   a person has to carry every order across by hand. `[assumption]`
3. **Why can't it be carried across once, quickly?** Because a chat order isn't finished when
   it starts. It forms over several messages — inquiry, price, quantity, a change ("make it 3 na
   lang"), delivery date, then payment proof, often hours or days apart. The owner either waits
   until the order is final (and risks forgetting it) or writes it early and has to find and fix
   it later. `[assumption — founder's §4 answer on mid-conversation changes; verify in
   interviews]`
4. **Why don't existing tools handle that?** Record-keeping tools — spreadsheets, accounting
   apps, POS — are built around entering a *finished* transaction into a form. None of them
   follows the conversation where the order is still forming, so the owner still has to decide
   when it's "done" and type it in. `[assumption — the market scan must confirm. If a tool
   already does this, the root cause shifts to "sellers don't know it exists or can't afford
   it."]`
   **⚠ Contradicted for business accounts by the market scan (2026-10-07):** Orders App,
   MessOrder AI, Pancake, and Probaho AI already follow business-account chats and create
   orders, and Meta Business Suite offers free order tracking in the Page inbox (EV-011,
   EV-012). This why still holds for **personal accounts**, which no chat-reading tool
   supports (EV-014). **Resolved 2026-10-07 (ADR-004):** positioning narrowed to
   personal-account sellers; root cause restated below. **2026-10-08 (ADR-012):** business
   accounts are back in the MVP through webhooks, with personal accounts still the main gap; for
   sellers using both, the remaining problem is two separate records `[assumption — A-008]`.
5. **Why haven't the chat apps themselves solved it?** Messaging apps are built for
   conversation. Where they offer shop or checkout features, the buyer has to order through a
   structured flow — and chat buyers often just message "pabili po" instead. So the order stays
   unstructured text. `[assumption — the founder team has never seen or used a Facebook or
   Instagram built-in shop/checkout purchase (2026-10-07); that's an anecdote, not a source.
   Still verify what shop features exist for PH sellers today]`
6. **Root cause (confirmed by founder; restated 2026-10-07 after the market scan, ADR-004):**
   A chat order forms gradually inside an unstructured conversation. For sellers on
   **personal** Messenger and Instagram accounts, no tool can read that conversation — the
   official APIs only cover business accounts — and every record-keeping option they can use
   expects a finished order typed or converted by a person. So the owner is the only bridge
   between the chat and the record — the work is manual, it repeats every time an order
   changes, and it fails first on busy days.

### Chain B — why the owner puts up with it (the uncomfortable one)

1. **Problem:** The owner keeps doing this by hand, even though it costs time and orders go
   missing.
2. **Why hasn't the owner fixed it already?** Each single copy feels small — a minute or two —
   so the cost is invisible day to day. It only hurts on busy days, or when a payment is missed
   or an order is forgotten. `[assumption — founder said the pain peaks on busy days]`
3. **Why doesn't that occasional hurt push them to change?** Because the fix they know about
   (a spreadsheet, an app) costs effort *up front* every day, while the loss happens only
   *sometimes*. People tend to accept an occasional loss over a guaranteed daily chore.
   `[assumption]`
4. **Why does the owner need a record at all?** To know who has paid, what to deliver when, and
   what the business earns. But at low volume, memory and the chat thread itself may be enough
   — the owner can just scroll back. `[assumption]`
5. **So when does the problem actually start?** Founder estimate `[assumption — A-006]`:
   memory works up to about 5–8 chat orders a week when each order is finished before the next
   starts. It breaks at about 10–15 a week, or sooner when 4–6 orders are open at once — unpaid,
   undelivered, or both, often due on different days. Then the seller mixes up who ordered
   what, who paid, and which day to deliver; busy days are when orders go missing.
6. **What this means:** The pain may be real but **diffuse** — felt only by sellers above a
   certain volume, and only sometimes. A product that asks for effort on every order (even one
   tap) must save more than it costs, every day, not just on busy days. This is the same risk as
   A-001 (habit switch), seen from the owner's side.

## Existing "solutions" and why they don't close the gap

*From the founder's reasoning — not yet checked against real products. The competitor and
alternatives pass (`work/market-scan.md`) must confirm or correct each row.*

| Existing thing | What it actually does | The specific gap it leaves |
|---|---|---|
| Notebook / paper logbook | Free, familiar; the most common method among PH micro businesses (EV-007) | Every order is written by hand; changes mean crossing out and rewriting; receipts get lost (EV-007) |
| Spreadsheet (Excel, Google Sheets) | Free; sortable totals | Still typed by hand from the chat; needs setup the owner may not do `[assumption]` |
| Accounting / bookkeeping apps | Structured records and reports | Too much setup, or the owner doesn't know they exist (founder); still need manual entry `[assumption — verify in market scan]` |
| POS systems | Records sales at a counter | Built for in-person checkout, not chat orders `[assumption]`. Businesses already using one are excluded from the segment (§2) |
| Hiring a bookkeeper or assistant | Takes the work off the owner | Unaffordable for many; some owners prefer to work alone (founder). Outsourced basic recording for a home-based business: about ₱2,500–₱5,000 a month; an in-house bookkeeper: ₱20,000–₱35,000 a month (EV-023, national figures). NCR-specific cost `unknown` |
| Doing nothing / memory | No effort up front | Orders and payments are forgotten; profit is unclear (EV-007, EV-008) |

## Who else has tried to solve this, and what happened

Current tools that already attempt this are in `work/market-scan.md` (scan of 2026-10-07):
Orders App, MessOrder AI, Pancake POS, Probaho AI, and Meta Business Suite for business
accounts; ImageToTable.ai for screenshots.

**Failed or shut-down attempts** (searched 2026-10-07):
- **AVANA (Malaysia, 2016–2023)** — order management for micro-sellers on Facebook, Instagram,
  and WhatsApp; 25,000 merchants by 2018; shut down because cheap subscriptions didn't cover
  rising costs, plus high churn and an early expansion abroad (EV-021).
- **Orderdulu (Indonesia, YC W21)** — WhatsApp ordering; shut down August 2023, users moved to
  Take App (EV-022). Reason not stated.
- **What this tells us:** the need was real enough to fund — both reached paying users — but
  the business models didn't last. MabiList's business model has to answer this, not just
  its features. No failed **screenshot-based** or **personal-account** attempt was found.

## Contradictions to settle (don't resolve by picking the flattering answer)

- **"Too much setup" cuts both ways.** If setup is why sellers skip existing tools, our product
  has setup too: connecting a Facebook Page or Instagram professional account, or uploading
  screenshots for personal accounts (`work/system-flow-explainer.md`). Setup has to be clearly
  lighter than a spreadsheet, or this reason applies to us as well. Interviews and the
  prototype must test it.
- **"Not knowing tools exist" is a distribution problem, not only a product one.** If sellers
  haven't found existing tools, they may not find ours either. The go-to-market plan
  (`docs/gtm.md`) has to say how we reach them.
- **Screenshots are part of today's slow workaround** (founder answer 2). Way 2 in the explainer
  also asks owners to upload screenshots. It must be noticeably faster than today — one tap and
  confirm, not copy and retype — or it won't feel like an improvement.
- **"Busy days" is recurring, not a deadline.** It shows when the pain peaks, but it doesn't
  give the "Urgent" test a clock. Interviews should ask what happened on the last busy day.
- **Low-volume sellers may not feel this at all** (Chain B). If a seller gets a few orders a
  week, scrolling back through the chat may work fine. The beachhead may need a volume floor
  ("sellers with at least N chat orders a week") once interviews show where the pain starts.
- **Diffuse pain vs. willingness to switch or pay** (Chain B). An occasional loss is easy to
  tolerate. The strongest evidence would be a concrete story: a forgotten order, a missed
  payment, a wrong delivery — with what it cost. Interviews should ask for the last time it
  happened, not whether it's a problem. **Status (2026-10-07): no such story known yet** — the
  team doesn't know whether its 1–2 known sellers have had one.

## Assumptions surfaced during this exercise

*Feed these into `seed/idea.md §9` (A-001, A-002…) and `work/interview-guide.md`.*

- Chat sellers copy orders out of chats by hand today, rather than just relying on memory.
- Mid-conversation changes (quantity, date, price) are common enough to be the main hassle.
- Sellers skip existing tools mainly because of setup effort and low awareness, not cost.
- Many sellers can't afford, or don't want, a bookkeeper or assistant.
- The pain peaks on busy days, and that's when records go missing.
- Setup for our product can be made lighter than the setup sellers already avoid.
- Chat orders usually form over several messages, often hours or days apart (Chain A, why 3).
- No existing tool follows the conversation while the order forms (Chain A, why 4) — the
  market scan must confirm.
- Chat buyers mostly message "pabili po" instead of using in-app shop or checkout features
  (Chain A, why 5).
- The problem only starts above ~10–15 chat orders a week, or 4–6 open orders at once (Chain B;
  A-006, founder estimate).
- Sellers can name a concrete recent loss — a forgotten order, a missed payment — and what it
  cost (Chain B).

## First-pass chain (superseded 2026-10-07, kept for the record)

1. Problem: owners copy each chat deal into a notebook or spreadsheet; records go missing.
2. Why: the deal only exists in the chat; nothing records it automatically.
3. Why: orders are spread across messages and change mid-conversation.
4. Why: existing tools need too much setup, aren't known, and still need manual entry.
5. Why: the owner can't afford, or doesn't want, a bookkeeper.
6. Root cause: every way of recording the deal sits outside the chat and depends on someone
   re-entering it by hand; for a solo seller that's always the owner, and it breaks on busy
   days.
