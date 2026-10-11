# Interview guide: MabiList

> **Agent instructions:** Only fill this if primary interviews are actually feasible before
> the deadline. If not, leave it as a template and note in `work/evidence-ledger.md` that
> primary research didn't happen this cycle — don't fabricate interview logs to fill this
> file. Questions should be open-ended and behavior-focused ("tell me about the last time...")
> rather than leading ("would you use an app that...").

**Prepared:** 2026-10-07 · **Feasible:** yes — the team knows 1–2 sellers in the segment
(`work/evidence-ledger.md`). **Target:** 3–5 interviews before October 10 (each known seller +
one referral each). **Length:** 15–20 minutes. Face-to-face, video call, or voice call all work;
in person is best because you can see their notebook or spreadsheet.

**What these interviews must answer** — every question below maps to one of these:

| Gap | What we need to learn | Where it's tracked |
|---|---|---|
| **A-007** personal accounts | Do they take orders on a personal account or a Facebook Page / Instagram professional account? Personal accounts are the main gap we pitch (ADR-004, ADR-012) | `seed/idea.md` §9 |
| **A-008** one logbook | Sellers with a Page as well: do they keep Page and personal-account orders in separate records, and do they already use a tool for Page orders? (ADR-012) | `seed/idea.md` §9 |
| **A-006** volume | How many chat orders a week, and how many are open at once? | `seed/idea.md` §4 |
| **EV-010 / A-002** the pain is real | How do they record orders today, and has it actually gone wrong? | `work/evidence-ledger.md` |
| **EV-009** time cost | How long does logging one order take them? | `work/evidence-ledger.md`; `seed/idea.md` §8 baseline |
| **A-001** habit switch | What have they tried before, and what made them stop? | `seed/idea.md` §9 |
| **A-005** trust | How do they handle customer chats and screenshots today? | `seed/idea.md` §9 |
| Mid-chat changes | How often do orders change after the first message? | `seed/idea.md` F-005 |

## Who we're talking to

*Should match `seed/idea.md §2`'s segment definition exactly — if you can't find 3-5 real
people matching it, that itself is useful evidence about §5's "Reachability."*

Home-based sellers in NCR, selling any product or service, who take orders through Facebook
Messenger or Instagram chats — preferably on a **personal** account — with orders that each have
a delivery date and a payment to track. Prefer sellers with about **10+ chat orders a week or
4+ orders open at once** (A-006 screener), but still interview lower-volume sellers and note it
— whether they feel the pain is useful evidence too.

**Before you start — consent and privacy (RA 10173):**
- Say who you are, that this is for a student startup competition (PSC XI), that it takes about
  15–20 minutes, and that you won't sell or publish anything that identifies them.
- Ask: "Okay lang ba kung mag-take ako ng notes? Pwede ko bang i-record yung audio?" Only
  record with a clear yes.
- **Never write down or photograph their customers' names, phone numbers, or addresses.** If
  they show you a notebook or chat, describe what you see ("12 orders on one page, 3 crossed
  out"), don't copy it.
- Ask whether you may quote them by first name, by initials only, or not at all — and write
  down the answer.

## Screener (to confirm they're actually in-segment)

*Ask all five. If 1 or 2 is "no," or 5 is "yes," thank them and stop — they're out of segment.
Answers to 3 and 4 don't disqualify anyone; record them.*

1. **"Do you take orders from customers through Messenger or Instagram chat?"**
   *"Tumatanggap ka ba ng orders sa Messenger o Instagram chat?"* — must be **yes**.
2. **"Do you run the business from home, and is it mostly you (or you and family) handling
   it?"**
   *"Sa bahay mo ba pinapatakbo yung business, at ikaw lang (o kayo ng pamilya) ang
   nag-aasikaso?"* — must be **yes**, in NCR.
3. **"When customers message you to order, which account do they message — your personal
   profile, or a Facebook Page / business Instagram?"** *(A-007 — the most important answer.)*
   *"Pag nag-oorder sila, saan sila nagme-message — sa personal account mo, o sa Facebook Page
   o business Instagram?"* — record: personal / Page / both (roughly what share each).
   **If Page or both:** *"How do you keep track of the Page orders — same notebook as the others,
   or separate? Any app for them, like Meta Business Suite?"* *(A-008, ADR-012)*
   *"Yung mga order sa Page, saan mo nililista — kasama ba sa ibang orders o hiwalay? May app ka
   bang ginagamit para doon, gaya ng Meta Business Suite?"* — record: same / separate, and any
   tool named. Don't pitch connecting the Page.
4. **"About how many orders come in through chat in a normal week? And right now, how many are
   still not paid or not delivered yet?"** *(A-006)*
   *"Mga ilang orders ang pumapasok sa chat sa isang normal na linggo? Ngayon, ilan pa yung
   hindi pa bayad o hindi pa na-deliver?"* — record both numbers.
5. **"Do you also sell on Shopee, Lazada, or TikTok Shop, or use a POS or accounting app?"**
   *"Nagbebenta ka rin ba sa Shopee, Lazada, o TikTok Shop? May ginagamit ka bang POS o
   accounting app?"* — must be **no**. Sellers on those marketplaces are fully out of scope,
   chat orders included, and so are POS or accounting-app users (`seed/idea.md` §2). Selling on
   **Facebook Marketplace** is fine — those orders happen in Messenger. Record what they use.

## Core questions (behavior first, opinion second)

*Ask in order. Follow up with "Ano'ng nangyari after?" and "Bakit?" — never suggest an answer.
Don't mention MabiList, apps, or AI until question 9.*

1. **The last order, start to finish.** "Tell me about the last order you got through chat —
   from the first message to when it was paid and delivered." *(behavior)*
   *"Kwento mo naman yung huling order na natanggap mo sa chat — mula sa unang message hanggang
   nabayaran at na-deliver."*
   - Listen for: how many messages, over how many days; did anything change (quantity, date,
     price, address)? *(F-005)*
2. **How it got recorded.** "Where did you write that order down, if anywhere? When did you
   write it — right away, or later?" *(behavior — today's workaround)*
   *"Saan mo sinulat yung order na yun, kung sinulat mo man? Kailan — agad-agad, o mamaya na?"*
   - If they're willing: **"Can you show me?"** — seeing the notebook, spreadsheet, or notes
     app makes this `did` evidence, not just `said`. Describe it; don't copy customer details.
3. **Time it.** "Could you show me how you'd write down one order the way you normally do? Any
   order — it can be a made-up one." Time it with your phone from start to finish.
   *(EV-009 — this is the baseline for "time per order" in `seed/idea.md` §8)*
   *"Pwede mo bang ipakita kung paano mo sinusulat ang isang order, yung usual mong ginagawa?
   Kahit kunwari lang na order."*
   - Also ask: "When an order changes after you've written it, what do you do?"
     *"Pag nagbago yung order pagkatapos mo isulat, ano'ng ginagawa mo?"*
4. **The last time it went wrong.** "Tell me about the last time an order got mixed up —
   forgotten, wrong item, wrong delivery day, or someone you thought had paid but hadn't."
   *(EV-010 / A-002 — the strongest evidence we can get)*
   *"Kwento mo yung huling beses na nagkamali o nagkagulo sa order — nakalimutan, mali yung
   item, maling araw ng delivery, o akala mo bayad na pero hindi pa pala."*
   - Follow up: "What did it cost you — money, time, the customer?" *"Ano'ng naging epekto —
     pera, oras, o yung customer?"*
   - If they say it never happens, that's a real answer. Record it; don't push.
5. **Busy days.** "Think of your last really busy day. How did you keep track of orders that
   day?" *(Chain B in `work/problem-capture.md`)*
   *"Isipin mo yung huling sobrang busy na araw mo. Paano mo na-track yung mga orders noon?"*
6. **How often.** "How often do you sit down to update your records — every order, once a day,
   once a week?" *(frequency — Significant test)*
   *"Gaano kadalas ka nag-a-update ng records mo — every order, isang beses sa isang araw, o
   isang beses sa isang linggo?"*
7. **What they've tried.** "Have you ever tried anything else to keep track — a spreadsheet,
   an app, asking someone to help? What happened?" *(prior attempts — A-001)*
   *"Nasubukan mo na bang gumamit ng iba para mag-track — spreadsheet, app, o nagpatulong sa
   iba? Ano'ng nangyari?"*
   - Listen for: why they stopped (setup, cost, forgot, too slow). Also ask: "Have you ever
     pasted a chat or screenshot into ChatGPT or Gemini?" *(market-scan gap)*
8. **Screenshots and customer chats today.** "Do you ever take screenshots of customer chats?
   What for? Do you share them with anyone, like a partner or delivery rider?" *(A-005 —
   behavior before opinion)*
   *"Nag-i-screenshot ka ba ng chats ng customers? Para saan? Pinapakita o sine-send mo ba sa
   iba, tulad ng partner o rider?"*
9. *(Only near the end, if at all)* **The idea.** "Suppose you could upload a screenshot of
   an order chat and it became a logbook entry — items, price, delivery date, paid or not — and
   it updated when the customer changed the order. Would that matter to you? Why or why not?"
   *(weak signal — what they did in Q1–Q8 matters more)*
   *"Halimbawa, pwede mong i-upload yung screenshot ng order chat tapos magiging logbook entry
   na siya — items, presyo, delivery date, bayad o hindi — at nag-a-update pag binago ng customer
   yung order. Makakatulong ba yun sa'yo? Bakit o bakit hindi?"*
   - Then the trust question *(A-005)*: "How would you feel about uploading real customer chats
     to an app like that, if it deleted the screenshot right after you confirmed the order?"
     *"Okay lang ba sa'yo mag-upload ng totoong chats ng customers sa ganung app, kung buburahin
     agad yung screenshot pagka-confirm mo ng order?"*
10. **Referral and follow-up.** "Do you know another seller who takes orders through chat who
    might talk to us for 15 minutes? And would you be willing to try an early version later?"
    *(reachability — 5–10 testers in `seed/idea.md` §8)*
    *"May kilala ka bang ibang seller na nag-o-order sa chat na pwede naming makausap ng 15
    minutes? At okay lang ba sa'yo na i-try yung early version namin later?"*
    - A "yes, try it later" is a commitment worth logging as `did`-leaning evidence; a referral
      given on the spot is stronger than "I'll ask around."

## Log template (copy per interview into `work/interview-log.md`)

*Fill this right after each interview, while it's fresh. Use initials or "Seller A/B/C," never
customers' details.*

```
### Interview #{n} — {date} — Seller {A/B/C} ({initials or "anonymous"}, quote permission: yes/initials only/no)
- Interviewer(s):
- Format: in person / video / voice · Recorded: yes/no (consent given: yes/no)
- Segment fit confirmed: yes/no — {why}
- Screener: account type = personal / Page / both ({rough share}) · chat orders per week = {n}
  · open orders right now = {n} · also sells on marketplace / uses POS: {what}
- What they sell:
- Today's method (Q2): {notebook / spreadsheet / notes app / memory / other} — seen: yes/no
- Time to log one order (Q3): {seconds} — timed: yes/no (estimate if not timed)
- Orders that change mid-chat (Q1, Q3): {how often, what changes}
- Last time it went wrong (Q4): {story, and what it cost} — or "never happened"
- Busy-day behavior (Q5):
- Tools tried and why they stopped (Q7): · Used ChatGPT/Gemini for this: yes/no
- Screenshots / sharing customer chats today (Q8):
- Reaction to the idea (Q9) — weak signal: · Trust in uploading real chats (Q9b):
- Referral given: yes/no · Willing to test later: yes/no
- Key quotes (their words, Taglish as said):
- Surprises / contradicts our assumptions:
- New EV-### candidates: (promote to work/evidence-ledger.md, Type = said, or did if you
  observed rather than were told)
- Assumptions affected: A-001 / A-002 / A-005 / A-006 / A-007 — supports / weakens / no signal
```

## What NOT to do

- Don't interview friends/classmates as a stand-in for the real segment unless they
  genuinely are in it — note the substitution honestly if you do (weaker evidence, say so).
- Don't lead with the solution. If they start designing your product for you, that's still
  interesting, but log it as their idea, not validation of yours.
- Don't say "AI," "app," or "MabiList" before question 9 — it turns the interview into a
  pitch and they'll start being polite.
- Don't ask "Would you use…?" or "Is this a problem for you?" — ask what happened last time.
- Don't round up. "Minsan lang" (only sometimes) is not "it happens all the time." A seller
  who says it never goes wrong is evidence too — log it as weakening A-002.
- Don't promise features, dates, or that it will be free forever.
- Don't put interview quotes in the deck without the seller's quote permission, and never
  invent or merge quotes (`INV-AS-004`).
