# Backend & Infrastructure Capabilities

**What this is:** a compiled reference for the three backend/infra capabilities you flagged —
task queues, privacy/compliance guardrails, and multi-tiered storage — sourced from real,
currently-maintained tools and real regulatory guidance, not invented from memory. One section
of this file needs a framing correction before anything else: **"auto-generate code adhering to
HIPAA/GDPR/SOC2" is not quite the right target.** Code can implement the technical safeguards
these frameworks require. Whether a system is actually *compliant* is a legal and organizational
determination — signed agreements, audits, policies, staff training — that no amount of
generated code confers by itself. §2 below explains why this distinction matters more than it
sounds like it should, especially for a hackathon.

## Sources this was compiled from

| Area | Source | Link |
|---|---|---|
| Task queues | 2026 comparisons of BullMQ, Celery, and durable-execution platforms (Temporal, Inngest) | appscale.blog, inngest.com/blog, codenicelystudio.com |
| Compliance / regulated data | An LLM-deployment compliance playbook covering HIPAA/SOC2/GDPR; a HIPAA developer checklist; SOC2-vs-GDPR mapping | truefoundry.com/blog, acquaintsoft.com/blog, sprinto.com/blog |
| Anonymization techniques | Standard de-identification/pseudonymization/anonymization terminology (ISO/TS 25237) and k-anonymity/l-diversity/t-closeness/differential-privacy models | docs.protegrity.com, academic surveys on privacy-preserving data publishing |
| Storage tiering | A tiered-storage cache-resolver pattern (Redis→Postgres→object storage); vector-database tiered-storage design; agent-observability tiering policy | docs.rs (sui-cache), zilliz.com/ai-faq, gravitee.io |

## How this plugs into your FMD-Advanced pipeline

1. Drop this in as `fmd-advanced/docs/backend-infrastructure-skills.md`.
2. **§2 (compliance) is direct input to `docs/feasibility.md §4`** — if your idea genuinely
   touches regulated data, that's a real go/no-go factor, not a footnote.
3. **§2 also extends `docs/anti-slop-guardrails.md`'s R-36** ("no fabricated compliance claims")
   to the architecture level, not just marketing copy — the same rule that says don't claim
   "SOC 2 compliant" on a landing page says don't claim it in your PRD or your code comments
   either.
4. **§3 (storage tiering) builds directly on `docs/core-architectural-engine-skills.md §2`**
   (you've already picked a vector store there — this file is about what sits around it) and
   echoes the model/role-tiering idea in `docs/token-efficiency-guardrails.md §5`: tiering by
   cost/speed trade-off is the same instinct applied to storage instead of model choice.
5. **§4's invariants fold into `docs/prd.md §5`**, continuing the ID numbering from your other
   guardrail files.

---

## §1 — Distributed Task Queues

### The distinction that actually matters: durable enqueueing vs. durable execution

Most comparisons frame this as "which queue is fastest," but the real fork for a
minutes-to-hours research job is different: **does the system just guarantee the task got
delivered, or does it guarantee the workflow's *progress* survives a crash?**

| Category | Examples | What you get | What you don't |
|---|---|---|---|
| **Traditional job queues** | BullMQ (Node/TS, Redis-backed), Celery (Python, Redis or RabbitMQ broker) | The task is reliably delivered to a worker, with retries, backoff, and priority | If a worker dies partway through a multi-step job, *where it was* in that sequence is your problem to track and recover — the queue guarantees delivery, not resumable progress |
| **Durable execution platforms** | Temporal, Inngest, Trigger.dev | The workflow's state itself survives a crash, a deploy, or a worker restart — a failed step retries from that step, not from the beginning | More infrastructure/vendor surface, and genuinely more to learn if your team hasn't used one before |

**Why this matters for a research job specifically:** a pipeline that searches, scrapes,
embeds, and synthesizes over the course of an hour is exactly the multi-step case where losing
progress at step 3 because a worker restarted is expensive to redo. If you're staying with a
traditional queue (the right hackathon default — see below), compensate for this by writing a
**status row per stage** to your database (search: done, scrape: done, embed: in-progress,
synthesize: pending) so a restart can resume from the last completed stage instead of from
scratch — a lightweight, DIY version of what a durable-execution platform gives you natively.

### Production requirements, whichever queue you pick

- **Idempotent jobs** — a job that runs twice (which will happen, eventually) must not double-
  charge, double-send, or double-count anything.
- **Backoff with jitter on retry**, not a fixed delay — avoids every failed job retrying at the
  exact same moment and re-triggering the failure that hit them all.
- **A monitored dead-letter queue** — a job that exhausts its retries should land somewhere
  visible, not vanish silently.
- **Know your broker's actual durability.** Redis-backed queues (both BullMQ and Celery-on-
  Redis) can lose an in-flight job on a Redis failover unless you've configured aggressive
  fsync settings that most teams don't run in practice. This is a real, known trade-off — worth
  knowing plainly rather than assuming "it's Redis-backed, so it's durable."

### Choice and hackathon recommendation

- **Node/TypeScript team →** BullMQ. Clean API, a real dashboard (Bull Board), good default
  for a research pipeline's queue.
- **Python team →** Celery, if your jobs are close to single-step and idempotent. If your
  pipeline is genuinely multi-step and losing progress mid-run would be costly to redo live
  during a demo, that's the signal to consider Temporal/Inngest instead — but only if the time
  cost of learning it fits your schedule.
- **Either way:** report job progress back to the UI the same way `docs/frontend-ux-deep-
  insights-skills.md §2` recommends for model output — streamed status updates, not a UI that
  just spins until the whole job finishes. A simple polling endpoint is a legitimate fallback if
  wiring up push updates for job progress specifically is more than your remaining time allows.

## §2 — Strict Privacy & Compliance Guardrails

### Read this before writing any compliance-flavored code

**No checklist, and no amount of AI-generated boilerplate, makes a system "HIPAA compliant,"
"GDPR compliant," or "SOC 2 compliant."** These are legal/organizational statuses:

- **HIPAA** compliance requires a signed **Business Associate Agreement (BAA)** with every
  vendor that touches Protected Health Information (PHI) on your behalf — and this includes
  your LLM provider. **Standard consumer-tier API access to OpenAI, Anthropic, and Google's
  public endpoints is generally not BAA-covered** — using one of these APIs on real PHI without
  an enterprise agreement that includes a BAA is a compliance gap by itself, independent of how
  well the rest of your app is built.
- **SOC 2** requires an actual third-party audit — Type I reviews whether controls exist and
  are suitably designed at a point in time; Type II reviews whether they operated effectively
  over a period that's typically measured in months. Neither is something a hackathon team
  obtains during the event, full stop.
- **GDPR** compliance is a set of legal obligations (lawful basis for processing, data-subject
  rights, breach notification timelines) that sit on top of, not instead of, the technical
  safeguards below.

**What this means practically: treat "compliant" as out of scope for the hackathon, and treat
"implements the relevant technical safeguards, with real compliance explicitly deferred" as the
honest, buildable target.** This is the same principle as
`docs/anti-slop-guardrails.md §1`'s rule against fabricated compliance claims — don't let your
pitch deck or your README claim a certification status the project doesn't and can't have at
this stage.

### For the demo itself: don't touch real regulated data

If your idea is genuinely in medicine, finance, or legal — **use synthetic or properly
de-identified sample data for the entire build and demo.** This sidesteps the BAA problem, the
audit-logging requirements, and most of the retention obligations below, and it's the honest,
credible thing to say out loud in your pitch: "the demo runs on synthetic patient records; a
production version would require a signed BAA with our model provider and a full compliance
program" is a *stronger* answer to a judge's question than pretending the hackathon build is
already compliant.

### Technical safeguards worth implementing regardless (these are good practice, not certification)

- **Encryption in transit:** TLS on every connection, no exceptions, including internal
  service-to-service calls if your architecture has any.
- **Encryption at rest:** database-level encryption, encrypted object storage buckets. Under
  HIPAA specifically, encrypted PHI is treated as "secured" for breach-notification purposes —
  making this the single highest-leverage safeguard if you're modeling toward HIPAA's technical
  safeguards at all.
- **Access control / least privilege:** scoped API keys, role-based access, and strict
  per-tenant data isolation if multiple users' data lives in the same system — one user should
  never be able to reach another's records through a predictable ID or a missing ownership
  check (the same rule as `docs/anti-slop-guardrails.md §1`'s auth invariant).
- **Audit logging:** who accessed what, when, and what they did with it — ideally append-only
  or hash-chained so the log itself can't be quietly edited after the fact.
- **Data minimization:** collect only what the feature actually needs — a GDPR principle that's
  also just good practice regardless of jurisdiction.
- **A defined retention policy**, even a short one for a demo — "we don't keep this data past
  the hackathon" is a legitimate policy, stated explicitly, rather than an unexamined default of
  keeping everything indefinitely.

### De-identification, if your data needs it

| Technique | What it does | When to use it |
|---|---|---|
| **Pseudonymization** | Replaces identifying data with a pseudonym, but keeps a way to re-link it | When you need to re-identify later (e.g., returning results to the same user) |
| **Anonymization** | Removes the link entirely, irreversibly | When you never need to re-link the record to a person |
| **k-anonymity** | Generalizes records so each is indistinguishable from at least k-1 others sharing the same quasi-identifiers | Structured datasets (age, ZIP, etc.) being shared or analyzed in aggregate |
| **Differential privacy** | Adds calibrated statistical noise so no single record materially changes an aggregate result | Public-facing aggregate statistics over sensitive data |

For a hackathon-scale demo, pseudonymization or straightforward anonymization of synthetic data
is almost always sufficient — k-anonymity and differential privacy are real techniques worth
knowing exist, but implementing them correctly is its own project, not a quick addition.

### Feed this into `docs/feasibility.md §4`

If the idea genuinely touches regulated data, the feasibility verdict should say so plainly:
**go-with-cuts, where the cut is "synthetic/de-identified data only, real compliance program
explicitly deferred post-hackathon."** A feasibility doc that glosses over this is setting up a
pitch that oversells what the build can actually claim.

## §3 — Memory & Storage Tiering

### The pattern

A three-tier split, matched to each tier's actual strength:

| Tier | Technology | What lives here | Why |
|---|---|---|---|
| **Hot** | Redis | Session state, rate-limit counters, the job queue itself (§1), anything needing sub-millisecond reads | In-memory, fastest tier, but the most expensive per GB and not your system of record |
| **Warm** | Your vector store (Qdrant/pgvector/Chroma — from `docs/core-architectural-engine-skills.md §2`) | Embeddings for semantic recall | Optimized for similarity search, not for being the durable source of truth |
| **Cold** | Postgres (structured records, the actual system of record) + object storage like S3/R2 (raw documents, large blobs, long-term archives) | Everything that must survive and be queryable/auditable long-term | Durable, cheap at scale, the right home for anything with a retention requirement (§2) |

**The read pattern that ties them together:** check hot first; on a hit, return immediately; on
a miss, check the next tier down and *promote* the result back up to the faster tier for next
time. The single metric that tells you whether this is working is your **cache hit rate** — if
most reads are being served from the hot tier, the tiering is doing its job; if you're
constantly falling through to cold storage, either your hot tier is too small or your access
pattern doesn't actually have the locality this design assumes.

### This is also how agent memory itself works, not just application data

The same three-tier shape shows up in how Anthropic's own published guidance frames an agent's
*own* memory during a long task: a working scratchpad for the current step (hot — often just a
file or in-memory state), semantic/vector recall of related past context when needed (warm),
and durable storage for anything that must survive past the current session (cold). If your
research tool has an agent that works over a long task, it's worth deciding deliberately which
of *its own* working state belongs in which tier — not just where the user-facing data lives.

### Hackathon-scale recommendation

Don't build an automatic hot→cold migration/promotion system — that's a real production
concern and genuine engineering time you don't have. Instead: **assign each kind of data to one
tier deliberately and write directly to it.** Session/job state → Redis. Embeddings → your
vector store. Everything else (user records, research results, uploaded documents) → Postgres,
with large raw files (PDFs, big scraped documents) → object storage instead of stuffed into a
database column. A simple, deliberate three-way split beats a half-built automatic tiering
system that adds complexity without the payoff, because you won't hit the scale where automatic
promotion/demotion actually matters during a hackathon demo.

## §4 — Guardrail invariants (fold into `docs/prd.md §5`)

- **INV — compliance honesty:** the system's documentation, pitch materials, and code comments
  SHALL NEVER state or imply a HIPAA/GDPR/SOC 2 "compliant" status; they may state which
  specific technical safeguards are implemented, with certification explicitly noted as out of
  scope.
- **INV — no real regulated data:** the system SHALL NEVER process real PHI, real financial
  account data, or other real regulated personal data during development or demo — synthetic or
  properly de-identified data only.
- **INV — encryption:** the system SHALL NEVER store sensitive personal data unencrypted at
  rest or transmit it over an unencrypted connection.
- **INV — job visibility:** a long-running background job SHALL NEVER lose progress on a
  worker crash without surfacing that loss visibly to the user — silent data loss presented as
  a still-running job is a stream-integrity failure, the same class as
  `docs/frontend-ux-deep-insights-skills.md §4`'s stream-integrity invariant.
- **INV — retention:** audit/access logs SHALL NEVER be deleted before whatever retention
  period applies (a real framework's requirement, or, absent that, an explicitly documented
  policy).

## §5 — Quick-reference checklist

- [ ] Have you decided whether this job needs durable *execution* (Temporal/Inngest) or just
      durable *enqueueing* (BullMQ/Celery is enough) — based on how costly losing mid-pipeline
      progress would actually be, not by default?
- [ ] Does your pitch, README, or PRD claim any compliance certification your project hasn't
      actually earned?
- [ ] If the idea touches regulated data, is the demo running on synthetic/de-identified data
      only, stated explicitly rather than left ambiguous?
- [ ] Is sensitive data encrypted at rest and in transit, regardless of certification status?
- [ ] Does each kind of data have one deliberately-assigned storage tier, rather than an
      unbuilt "we'll add tiering later" gap?
