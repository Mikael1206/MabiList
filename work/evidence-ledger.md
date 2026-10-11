# Evidence ledger: MabiList

> **Agent instructions:** Every row needs a real, checkable source and a date. Use `Type` to
> classify the evidence honestly:
> - **said** — someone stated a fact/opinion (a news article, a report, an interview quote)
> - **did** — an observed action or existing artifact (a real product, a policy already in
>   effect, usage data)
> - **paid** — someone spent money/time proving willingness (a purchase, a waitlist signup, a
>   pilot commitment)
> `did` and `paid` evidence is stronger than `said` — weigh it accordingly in the five-tests
> scoring below. If you searched and found nothing, write `unknown — not found` rather than
> skipping the row.

**Last updated:** 2026-10-07

## Evidence log

| ID | Claim it supports | Type | Source (URL) | Date | Notes |
|---|---|---|---|---|---|
| EV-001 | Small business owners spend about 20 hours a week on accounting work (bookkeeping, invoicing, expense tracking, financial reporting, taxes); one in five spend 30+ hours | said | Cornerstone Advisors survey of 750 US small-business owners, as reported by Tight: https://www.tight.com/blog/accounting-insights-from-750-small-business-owners | Survey fielded Q4 2023 | **US data, not Philippine.** Reported by Tight, an embedded-accounting vendor with an interest in the finding; the original Cornerstone report wasn't read directly. Covers all accounting, not just transaction logging. Use only as "this is a known burden internationally." |
| EV-002 | Micro-businesses spend 15 of a 79-hour working week on financial admin; sole traders spend 9 of 29.5 hours (31%) | said | Starling Bank, "#MakeBusinessSimple" report: https://www.starlingbank.com/docs/reports-research/MakeBusinessSimpleReport.pdf · press release: https://www.starlingbank.com/news/starling-launches-make-business-simple-report/ | Published 2020-01-08 | **UK data, not Philippine.** Survey of 1,000+ UK micro-businesses, run with Opinium. Published by a bank selling business accounts (interest). Same report says accounting itself is 1.7 h/week, so most of the 15 h is other financial admin — don't quote 15 h as "bookkeeping." |
| EV-003 | The Philippines has 1,241,733 MSMEs (99.63% of establishments), of which 1,127,058 are micro enterprises (90.43%) | did | DTI, "2023 Philippine MSME Statistics in Brief" (source: PSA 2023 List of Establishments): https://dtiwebfiles.s3-ap-southeast-1.amazonaws.com/MSME+Resources/2023+Philippine+MSME+Statistics+in+Brief_as+of+22+November+2024.pdf | 2023 data, brief dated 2024-11-22 | Official statistics. Counts **registered establishments** only — informal and home-based online sellers are likely undercounted. Not all of these sell through chat. |
| EV-004 | NCR held 204,844 MSME establishments (18.54% of the national total), the largest share of any region | did | DTI, MSMED Plan 2022 Accomplishment Report (source: PSA 2022 List of Establishments): https://dtiwebfiles.s3.ap-southeast-1.amazonaws.com/BSMED/MSMED+Plan+Accomplishment+Report/MSMEDP+AR+2022_22Jan24.pdf | 2022 data, report dated 2024-01-22 | Official statistics; 2022 is the latest regional split found. Same registered-only caveat as EV-003. |
| EV-005 | 52% of surveyed online Philippine MSMEs used Facebook apps to communicate with customers, and 55% to market to them, in the past 30 days | said | DAI / Ipsos, "Insights from Emerging Markets — Philippines Country Brief": https://www.dai.com/uploads/final-msme-reports/philippines-country-brief.pdf | Fieldwork June 3 – July 23, 2021; published Feb 2022 | n = 1,000 face-to-face interviews. **Prepared for Facebook, Inc.** (interest). **Excluded home-based businesses** and businesses without a storefront or signage — exactly the sellers most likely to run on Messenger. The report itself says it is not nationally representative. Pandemic-era. |
| EV-006 | 91.6% of 300 Philippine consumer respondents preferred receiving MSME messages on Facebook Messenger; 54.2% Instagram DM; Viber 5.3%; WhatsApp 4% | said | Casimiro et al., "The Relationship of Facebook Messenger Marketing to the Purchasing Intention of the Consumers of Philippine MSMEs," *Journal of Business and Management Studies*: https://al-kindipublisher.com/index.php/jbms/article/view/3189 | Published 2022-04-09 | Consumer side, not seller side. Sampling method and representativeness not checked. Useful for channel priority: Messenger and Instagram far ahead of Viber and WhatsApp. |
| EV-007 | Philippine micro and small businesses mostly record transactions by hand in notebooks (single-entry); records are often incomplete, lost receipts cause losses, and some outsource bookkeeping because in-house expertise is lacking | said | Borromeo, Cervantes & Sumicad, "Analyzing the Recording Practices in Accounting of Micro and Small Businesses: The Case of the Philippines," *Review of Business and Economics Studies*: https://exa.ai/library/publication/01h7gk6wkr7 | Published 2024-06-26 | Qualitative: about 8 businesses plus outsourced bookkeepers. Supports "manual, error-prone recording," not how much **time** it takes. Not specific to chat sellers. |
| EV-008 | 14 of 18 (77.78%) studied rural micro-enterprises kept no formal records, relying on memory and verbal recall | said | "Financial Sustainability of Community-Based Micro-Enterprises… Sari-Sari Stores in a Rural Philippine Setting," *IJRISS*: https://rsisinternational.org/journals/ijriss/view/financial-sustainability-of-community-based-micro-enterprises-a-multi-case-study-on-informal-record-keeping-among-sari-sari-stores-in-a-rural-philippine-setting | 2026 (case data from April 2026) | **Weak:** 18 businesses, rural Bohol, student-generated data. Not NCR, not chat sellers. Supporting colour only — don't headline it. |
| EV-009 | Hours Philippine small business owners spend on bookkeeping / transaction logging | — | `unknown — not found` (searched 2026-10-07) | — | No Philippine-specific time figure found. Needs interviews or a primary survey (`work/interview-guide.md`). |
| EV-010 | Philippine chat-based sellers find logging their chat orders painful, and how they log them today | — | `unknown — not found` (searched 2026-10-07) | — | The core claim of §1, and the riskiest. Only interviews will answer it. |
| EV-011 | Tools already turn **business-account** chats into orders with AI, including following mid-chat changes and owner edits (Orders App; MessOrder AI; Pancake; Probaho AI) | did | https://orders.app/ · https://messorder.php83.kreativdev.com/public/documentation/ · https://docs.pancake.biz/pos/st-f4/st-p2/st-s1?lang=en · https://probahoai.com/en/order-automation | Checked 2026-10-07 | Existing products (vendor descriptions, not tested). **Contradicts** "no existing tool follows the conversation" for business accounts. Supports Relevant only for the personal-account gap. Details: `work/market-scan.md` |
| EV-012 | Meta Business Suite lets Page owners create orders from Messenger/Instagram chats and mark them ordered or paid, free; PH GCash receipt verification is in limited release | did | https://www.facebook.com/business/help/3401131513471596 · https://www.facebook.com/help/messenger-app/1969981486623740 · https://www.facebook.com/help/messenger-app/515883884587897 | Checked 2026-10-07 | Free, built-in, but manual entry and Page-only |
| EV-013 | A screenshot → order-table converter already exists for any chat app (ImageToTable.ai), but outputs one-off spreadsheets with no order status, updates, or totals | did | https://imagetotable.ai/extract/social-commerce-screenshots | Checked 2026-10-07 | F-001 alone is not novel; the running logbook around it is the difference |
| EV-014 | Every chat-reading order tool found requires a Page, Instagram professional, or WhatsApp Business account; none supports personal accounts through official means | did | `work/market-scan.md` (search of 2026-10-07) | 2026-10-07 | Absence of evidence from one day's search, not proof. The personal-account gap is the main open space |
| EV-015 | Online sellers, including social-media sellers, must register with the BIR and keep registered books of accounts (RA 11976 / RR 7-2024; RMC 65-2025) | said | https://www.sunstar.com.ph/cebu/tax-notes-eopt-is-here-updates-on-preservation-of-book-of-accounts-changes-in-taxpayer-registration · https://www.grantthornton.com.ph/insights/articles-and-updates1/tax-notes/bir-clarifies-bookkeeping-options-for-new-business-registrants/ | 2024 (RR 7-2024); 2025-07-16 (RMC 65-2025 summary) | Secondary summaries by tax firms/news, not the BIR issuances. Possible "Urgent" angle for **registered** sellers; MabiList is not a BIR book of accounts — no compliance claims (`INV-AS-004`) |
| EV-016 | DTI estimated about 2 million e-commerce participants (online sellers) in the Philippines in 2022, against a 2021 roadmap forecast of 750,000 | said | BusinessWorld, "DTI estimates e-commerce sellers at 2 million, exceeding forecasts": https://bworldonline.com/economy/2022/10/04/478595/dti-estimates-e-commerce-sellers-at-2-million-exceeding-forecasts/ | 2022-10-04 | A verbal estimate by a DTI Assistant Secretary on PTV, not a published count; "participant" isn't defined. Includes marketplace sellers (out of scope) and has no NCR split. Useful as a rough ceiling for the broad segment, not the beachhead. Larger than the registered-MSME count in EV-003, which is consistent with informal sellers being undercounted there. |
| EV-017 | In a survey of Philippine e-commerce sellers, Facebook Marketplace was the most-used channel (58%); **most sellers process fewer than 50 orders a month**; the top reported pains were logistics (late deliveries 53%, lost or damaged packages 44%), overseas competition (45%), and keeping up with buyer demands (44%) | said | Milieu Insight, "Filipino sellers ready to invest — but expect ROI, logistics efficiency, and ecosystem support in return": https://mili.eu/filipino-sellers-ready-to-invest-but-expect-roi-logistics-efficiency-and-ecosystem-support-in-return/ | Published 2025-12-12 | Sample size, method, and sponsor aren't stated on the page. Covers marketplace sellers too. **Cuts against us twice:** order recording doesn't appear among the reported pains (it may not have been asked), and fewer than 50 orders a month is about 12 a week — so the A-006 screener (10+ a week) may describe only a minority of sellers. |
| EV-018 | In a survey of 30 online sellers in Naga City, "allotting enough personal time" ranked as the biggest personal challenge; payment-system issues ranked as the hardest technological one | said | Alinarte et al., "Small-scale online sellers: Inputs for sustainable business strategy," *GPH-International Journal of Business Management* 8(1): https://gphjournal.org/index.php/bm/article/view/1727 | Published 2025-01-24 | **Weak:** 30 respondents, Naga City (not NCR), student authors. Shows time is scarce for small online sellers, but not what the time goes to — nothing specific to logging orders. |
| EV-019 | Commentary: Philippine sellers who take orders in chat end up "managing a growing business through conversations rather than systems"; chats are poor order records as volume grows; manual tracking and "mine" comment systems aren't sustainable | said | businesswire.ph, "From Facebook Orders to Structured Operations": https://businesswire.ph/from-facebook-orders-to-structured-operations-how-social-commerce-is-pushing-philippine-msmes-to-digitalize/ · BusinessMirror (Enstack): https://businessmirror.com.ph/2023/01/05/how-digitizing-can-help-merchants-adapt-to-the-return-of-in-person-shopping/ | 2026-07-08 · 2023-01-05 | **Opinion with no data.** The 2023 piece promotes a vendor (Enstack). Matches our root cause in `seed/idea.md` §4, but commentary isn't evidence that sellers feel the pain — it does **not** count toward a Real pass. |
| EV-020 | The Philippine selling peak runs from September to New Year ("Ber months"), with the 10.10, 11.11 and 12.12 sale days in Q4; 91% of surveyed APAC SMEs called online shopping festivals critical to holiday sales | said | Inquirer, FedEx SME survey: https://business.inquirer.net/562207/despite-global-trade-woes-70-of-smes-see-robust-christmas-sales · BusinessWorld (Criteo): https://bworldonline.com/economy/2025/12/21/720269/e-commerce-platform-promotional-events-seen-boosting-small-business-growth/ | Survey run Sept 2025 · 2025-12-21 | FedEx surveyed 850 SMEs across 13 APAC markets — not Philippines-only — and both sources sell to sellers. Mostly about marketplaces and cross-border trade. A **candidate recurring clock** for Urgent; not yet shown for home-based chat sellers. |
| EV-021 | AVANA (Malaysia), a social-commerce order-management platform for micro-sellers on Facebook, Instagram, and WhatsApp, reached 25,000 merchants by 2018 and shut down in January 2023. Its founder blames low-priced subscriptions (RM399–RM1,399 a year) that became unsustainable as server costs rose, high customer-acquisition cost and churn, and an early expansion into Indonesia | did | The Runway, founder interview with co-founder Yien Yee: https://www.therunway.ventures/p/avana | 2025-01-19 (shutdown Jan 2023) | A shutdown is an observed event; the reasons are the founder's account. The newsletter promotes EasyStore, where she now works. **Lesson for the business model:** cheap subscriptions sold to micro-sellers didn't cover running costs once funding dried up. |
| EV-022 | Orderdulu (Indonesia, Y Combinator W21), a WhatsApp ordering platform, shut down on 2023-08-11; its paid users were moved to Take App | did | Vulcan Post: https://vulcanpost.com/832325/take-app-orderdulu-expansion-into-indonesia/ | 2023-07-05 | Reason for the shutdown not stated. Small chat-ordering tools are being absorbed by larger ones — Take App is in `work/market-scan.md` |
| EV-023 | Outsourced bookkeeping in the Philippines costs about ₱2,500–₱5,000 a month for a home-based business (basic transaction recording only); an in-house bookkeeper's salary is ₱20,000–₱35,000 a month | said | Loft, "How Much Should You Pay for Bookkeeping in the Philippines?": https://loft.ph/how-much-should-you-pay-for-bookkeeping-in-the-philippines/ | 2025-10-17 | Written by a bookkeeping provider (interest). National, not NCR-specific; NCR rates are likely higher, not measured. Whether this is unaffordable for beachhead sellers depends on their income — `unknown` |
| EV-024 | In Valenzuela City (NCR), 13 micro coffee businesses that don't use accounting software rated financial constraints, lack of technical expertise, technology infrastructure, and resistance to change as moderate barriers — yet saw such software as useful and easy to learn | said | Geamoga et al., "Obstacles and Perceptions Regarding AIS Non-Adoption Among Micro Enterprises," *IJERIP*: https://ijerip.erio.org.ph/index.php/articles/article/view/1246 | Published 2026-07-19 | **Weak:** 13 businesses, coffee shops (not chat sellers), student research. The only NCR source found on why micro businesses don't adopt record-keeping tools: resources and skills, not dislike of technology |

## Five-tests scoring (roll this up into `seed/idea.md §3`)

*Re-scored 2026-10-07 (second pass, EV-016 – EV-020 added) for the beachhead in `seed/idea.md`
§2 (home-based NCR sellers on personal Messenger/Instagram accounts), with 0 interviews. No
verdict changed: none of the new evidence comes from the beachhead itself.*

| Test | Verdict | Evidence cited | Gap (be specific about what's missing) |
|---|---|---|---|
| Real | unknown | EV-007, EV-008; EV-019 (commentary only) | No evidence yet from chat-based sellers themselves (EV-010). The one recent PH seller survey doesn't list order recording among top pains (EV-017) |
| Large | unknown | EV-003, EV-004, EV-016, EV-017 | Rough ceiling for the broad segment exists (about 2 million online sellers nationally, EV-016). Unknown: the share that are NCR, home-based, on personal accounts (A-007), **and** above the volume threshold — most sellers do under 50 orders a month (EV-017, A-006) |
| Significant | unknown | EV-001, EV-002, EV-007, EV-018, EV-023 | Time-cost figures are US/UK only (EV-009). PH sellers say time is scarce (EV-018), but not that logging is what eats it. The paid alternative costs ₱2,500+ a month (EV-023), but whether that's unaffordable for beachhead sellers is unknown |
| Urgent | unknown | EV-015 (registered sellers only), EV-020 | Candidate recurring clock: the September–December peak (EV-020), which is happening now. Not yet shown that chat sellers' order volume or mix-ups spike then — interview question 5 |
| Relevant | unknown — leaning pass | EV-011 – EV-014, EV-021, EV-022 | Earlier chat-order tools for micro-sellers shut down or were absorbed (EV-021, EV-022) — the need was recognised, the business models didn't last. Solved for business accounts (EV-011, EV-012); open only for personal-account sellers (EV-014) — and how many beachhead sellers use personal accounts is unknown (A-007) |

**What would flip each test to `pass`:**
- **Real:** 2+ interviewed beachhead sellers describe a specific recent order mix-up, or show a
  logging habit they find tedious (`work/interview-guide.md` questions 2 and 4).
- **Large:** interviews show personal-account selling is common (screener question 3) and that
  10+ orders a week isn't rare (screener question 4) — then size the beachhead as a share of
  EV-016, marked `[assumption]`.
- **Significant:** a timed per-order logging figure from interviews (question 3) — the first
  Philippine number for EV-009.
- **Urgent:** sellers confirm their busy season or busy days cause mix-ups (question 5).
- **Relevant:** confirm personal-account use (A-007); the market gap itself is already
  documented.

## Primary research status

**Interviews conducted:** 0

**Reachable now:** 1–2 home-based NCR sellers the team knows personally (founder, 2026-10-07).

**Decision:** Interview the 1–2 known sellers before October 11 using `work/interview-guide.md`,
and ask each for one referral to reach 3–5. Each interview gets its own `EV-###` row (type
`said`, or `did` if they show their actual notebook or spreadsheet). Target: turn EV-009 (time
spent) and EV-010 (is chat-order logging painful) from `unknown` into real evidence for the
Problem and Traction slides. If no interviews happen in time, the deck says so plainly.

## Known weak points (say the quiet part)

- **The time-cost numbers are not Philippine.** EV-001 and EV-002 are US and UK surveys from
  vendors with an interest in the result. A judge can fairly ask, "How many hours do *Filipino*
  sellers spend?" Right now the honest answer is "we don't know yet" (EV-009).
- **Nothing yet shows chat sellers feel this pain** (EV-010). The evidence shows micro
  businesses keep manual records (EV-007) and that Facebook is a major sales channel (EV-005,
  EV-006), but not that logging chat orders is a problem they'd pay or switch to solve.
- **The best chat-selling evidence has a blind spot.** EV-005 was paid for by Facebook and
  excluded home-based sellers.
- **The volume threshold may shrink the beachhead.** Most Philippine sellers handle fewer than
  50 orders a month (EV-017), roughly 12 a week. If the pain only starts at 10–15 a week (A-006),
  the sellers who feel it may be a minority. Interviews must record real weekly volumes.
- **The one recent seller survey doesn't mention order recording** (EV-017). Logistics,
  competition, and costs dominate. It may simply not have been asked — but a judge could read
  it as "sellers don't see this as a problem."
- **Searched and not found (2026-10-07, second pass):** a Philippine survey that asks how long
  sellers spend recording orders; any study isolating chat-based or personal-account sellers'
  record-keeping; a count of NCR or home-based online sellers; direct evidence that spreadsheet
  setup is what stops micro sellers (closest: EV-024).
- **Predecessors failed on money, not on demand** (EV-021, EV-022). AVANA served the same kind of
  micro-sellers on cheap subscriptions and shut down when costs outran revenue. A judge may ask
  how MabiList avoids that — the business canvas must answer it, especially since AI calls
  cost money per screenshot once free tiers run out (A-004).
- **Rejected source (2026-10-07):** "The nexus of bookkeeping and tax compliance… barangay
  micro-entrepreneurs" (Nueva Ecija, n = 182; https://archive.aessweb.com/index.php/5008/article/download/5609/8447)
  rated "I find bookkeeping to be time-consuming" a moderate challenge — but the paper's own
  discussion refers to "this simulated dataset," so its data may not be real. Not logged as
  evidence; don't cite it.
