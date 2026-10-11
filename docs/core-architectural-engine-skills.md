# Core Architectural & Engine Skills

**What this is:** a compiled reference for the four "deep research engine" capabilities you
flagged — crawling/ingestion, vector/RAG retrieval, LLM orchestration, and knowledge-graph
synthesis — sourced from real, currently-maintained tools and Anthropic's own published
research, not invented from memory. It's written as a **decision framework**, not a tutorial:
for each capability, which real tools exist, what they actually cost you, and — just as
important — when a hackathon build should *skip* the sophisticated version entirely. The
biggest risk with this particular skill set isn't picking the wrong tool, it's building more
architecture than a judged demo needs and running out of time before the core loop works.

## Sources this was compiled from

| Area | Source | Link |
|---|---|---|
| Crawling | Comparative guides on Scrapy, Playwright, Crawlee, Firecrawl, Crawl4AI, Colly | firecrawl.dev/blog, scrapfly.io/blog, webscraping.fyi |
| RAG / retrieval | Anthropic, "Introducing Contextual Retrieval" (own published benchmarks) | anthropic.com/engineering/contextual-retrieval |
| Vector databases | Independent 2026 comparisons of pgvector, Qdrant, Pinecone, Weaviate, Chroma, Milvus | dupple.com/learn, encore.dev/articles, guptadeepak.com |
| Orchestration | 2026 multi-agent framework comparisons (LangGraph, CrewAI, AutoGen/AG2) | langchain.com/resources, dev.to, uvik.net |
| Sandboxed execution | E2B and Anthropic's own docs on sandboxed tool execution for agents | e2b.dev/docs, platform.claude.com |
| Dedup / entity resolution | `moj-analytical-services/splink`, `dedupeio/dedupe` (official repos) | github.com/moj-analytical-services/splink; github.com/dedupeio/dedupe |
| Knowledge graphs | Official Neo4j GraphRAG Python package; independent GraphRAG-vs-RAG explainers | github.com/neo4j/neo4j-graphrag-python |

## How this plugs into your FMD-Advanced pipeline

1. Drop this in as `fmd-advanced/docs/core-architectural-engine-skills.md`.
2. **This is input to `docs/stack-decision.md`, not a replacement for it.** Once you've picked
   which of these four capabilities your idea actually needs (not all of them do — see the
   "skip this" notes throughout), run the picks through your existing weighted decision matrix
   against your team's real skills and time budget.
3. **The legal/scope cautions below (crawling ToS, IP on embedded content, graph scope-creep)
   feed `docs/feasibility.md §4`** the same way your other regulatory checks do.
4. **§6's invariants fold into `docs/prd.md §5`**, same pattern as your other guardrail files.
5. If you haven't already, read `docs/anti-slop-guardrails.md` and
   `docs/token-efficiency-guardrails.md` first — several notes below explicitly build on both
   (sandboxed execution ties to the security section of the first; agent-role tiering ties to
   the model-tiering section of the second).

---

## §1 — Asynchronous Scraper & Crawler Pipelines

**Before anything else: check whether you need to scrape at all.** An official API, a public
dataset, an RSS feed, or a government open-data portal is faster to build against, won't break
when a target site redesigns its markup, and sidesteps every legal question below. Reach for a
crawler only when no such source exists for the data your idea genuinely needs.

### Tool choice

| Tool | Best for | Notes |
|---|---|---|
| **Scrapy** (Python) | Large-scale, static-HTML crawls | Mature, async via Twisted, built-in queuing/middleware/rate-limiting. The default choice for "crawl a lot of pages fast" when JS rendering isn't needed. |
| **Playwright** | JavaScript-rendered / SPA pages | Full browser automation; currently has the strongest built-in evasion of basic bot-detection among the major browser-automation libraries, and runs Chromium/Firefox/WebKit. |
| **Crawlee** (Apify, Python or JS/TS) | Modern async scraping needing both HTTP and browser modes | Auto-scaling, built-in queue and storage, picks HTTP-only or full-browser crawling per URL. Good default if you want one framework instead of stitching Scrapy + Playwright together. |
| **Firecrawl / Crawl4AI** | Feeding scraped content straight into an LLM pipeline | Output arrives pre-cleaned as markdown instead of raw HTML — meaningfully less post-processing before it hits your chunking/embedding step. Less battle-tested at massive scale than Scrapy, which is fine for a hackathon corpus size. |
| **Colly** (Go) | Raw throughput, small footprint | Worth it only if your team is already Go-fluent; not a place to learn a new language mid-hackathon. |

### Architecture pattern (the actual "resilient, parallel" part)

- **Queue-based, not one-shot.** URLs go into a work queue; a pool of async workers pulls from
  it, respecting a concurrency limit per domain (not just globally — hammering one target with
  50 parallel requests gets you blocked fast regardless of your total concurrency setting).
- **Exponential backoff on failure**, not immediate retry — a 429/503 response is the target
  telling you to slow down, and retrying instantly just extends the block.
- **Rotate user agents and, if you have proxy infrastructure, IP address**, primarily to avoid
  a *single identity* triggering per-IP rate limits at moderate scale — not as a way to defeat a
  site's access controls. If a target site is actively and deliberately blocking automated
  access, that's a signal to find another source, not an obstacle to engineer around.
- **Persist progress.** A crawl that dies at hour 3 of an overnight run without checkpointing
  its queue state is a night wasted; both Scrapy and Crawlee support resumable state out of the
  box — use it.

### Legal and ethical checklist (feed this into `docs/feasibility.md §4`)

- [ ] Checked the target's `robots.txt` and respected its disallow rules
- [ ] Checked the target's Terms of Service for an explicit no-scraping clause
- [ ] Rate-limited to something a human wouldn't consider abusive load on the target's servers
- [ ] Only collecting data that's publicly accessible without bypassing a login/paywall
- [ ] Considered whether an official API exists that makes scraping unnecessary
- [ ] If storing/displaying scraped text at any real volume, considered copyright on the
      underlying content (see §6's invariant on this)

**Hackathon-scale recommendation:** for a demo-sized corpus, Firecrawl or Crawl4AI's
LLM-ready-markdown output saves real time in your pipeline versus hand-rolling HTML parsing —
unless your team already has a Scrapy pipeline they can reuse, in which case reuse it.

## §2 — Vector Embeddings & RAG Architecture

### Vector store choice

| Store | Best for | Notes |
|---|---|---|
| **pgvector** | You're already running Postgres | No new infrastructure — an extension on a database you probably already have. Caps out around a couple thousand dimensions per vector on standard indexes, which covers essentially every current embedding model. The lowest-friction choice for a hackathon backend. |
| **Chroma** | Fastest local prototyping | Cleanest developer experience of any option here, runs embedded (in-process) for local dev. The path of least resistance if you're not sure yet how much scale you'll need. |
| **Qdrant** | Self-hosted with strong metadata filtering | Rust-based, genuinely fast at both ingest and query; free tier is generous. Worth it if your retrieval needs real filter logic (tenant/user/category), not just plain similarity search. |
| **Pinecone** | Zero-ops managed, if you don't want to run any infrastructure yourself | Free tier exists but production usage bills per query; fine for a demo, reconsider if this becomes a real product. |
| **Weaviate** | Hybrid (keyword + vector) search as a first-class feature | Worth considering only if hybrid search (§ below) is central to your quality bar and you don't want to wire BM25 + vector fusion yourself. |

**Hackathon-scale recommendation:** start with Chroma or pgvector. Only reach for Qdrant/
Pinecone/Weaviate if you hit a concrete limitation (scale, filtering, or hybrid search) the
simpler option can't handle — don't pick the "production-grade" option by default; it's more
setup for no benefit at demo scale.

### The retrieval quality problem, and Anthropic's fix for it

The default RAG failure mode: a document gets split into chunks before embedding, and a chunk
like "the company's revenue grew 3% over the previous quarter" loses the information (which
company, which quarter) that made it findable in the first place, because that context lived
in a different chunk. This is the single most common reason a RAG system returns "I couldn't
find that" or confidently states something wrong.

Anthropic's own published fix, **contextual retrieval**, is close to a one-line change to the
pipeline: before embedding (and before building a keyword index) a chunk, prepend a short,
LLM-generated note situating it in the source document — which company, which section, which
time period. In Anthropic's own published benchmarks, layering these on top of a traditional
embedding-only pipeline reduced retrieval failures substantially at each added step: adding
contextual embeddings alone, then adding a combined keyword+vector (hybrid) search on top of
that, then adding a reranking pass on top of both. Anthropic's own guidance is explicit that
these gains are benchmark-specific and worth measuring against your own documents rather than
assumed — but the shape of the improvement (each layer adds an independent gain, and hybrid
search catches exact-match cases embeddings alone tend to miss, like an error code or an exact
term) is worth designing around from the start rather than retrofitting.

### The full pipeline, in order of "worth doing"

1. **Chunking that respects real boundaries** (paragraphs/sections, not a blind fixed-token
   cut) — do this regardless of everything else below; it's close to free and the naive version
   actively hurts you.
2. **Contextual chunk augmentation** (the technique above) — cheap to add (a small/fast model
   can generate the context note per chunk) and the highest-leverage single addition if your
   corpus has documents where the same terms recur in different contexts (multiple companies,
   multiple time periods, multiple people with similar names).
3. **Hybrid search** (combine a keyword method like BM25 with vector similarity, then fuse the
   rankings) — catches exact-match queries (an error code, a specific proper noun) that
   semantic similarity alone can miss.
4. **Reranking** (a cross-encoder or a hosted reranker takes your top-N candidates and re-scores
   them more carefully before the final cut) — the most expensive layer per query and the one
   most worth cutting first if you're short on time; the earlier three layers do most of the
   work.

**Hackathon-scale recommendation:** do #1 and #2 — they're cheap and they're the difference
between a demo that finds the right chunk and one that visibly doesn't. Add #3 only if your
actual test queries include exact-match lookups (codes, specific names). Treat #4 as a
stretch goal, not a baseline requirement.

## §3 — LLM Orchestration & Agent Tooling

### Framework choice

| Framework | Orchestration model | Best for |
|---|---|---|
| **CrewAI** | Role-based "crews" (each agent has a persona, tools, a task) | The fastest path from idea to a working multi-agent prototype — the most commonly cited advantage across independent comparisons is setup speed, not production robustness. |
| **LangGraph** | Explicit directed graph (agents/tools/checkpoints as nodes, conditional edges) | The choice when you need precise control over execution order, retries, and human-approval checkpoints — more code to get a basic agent running, but that structure pays off once flows get complex. Considered the leading choice for production deployments as of 2026 by most independent comparisons. |
| **AutoGen / AG2** | Conversational, multi-agent "group chat" | Strongest fit for research-style multi-agent debate/verification patterns; less commonly the production default than LangGraph. |
| **A single well-orchestrated agent with tools** (no framework) | Most hackathon builds, honestly | If your actual flow is "gather context → reason → produce an answer," a framework adds coordination overhead you don't need yet. Reach for multi-agent orchestration when the task genuinely splits into independent subtasks that benefit from separate context windows — not by default. |

**Model Context Protocol (MCP)**, Anthropic's open standard for how an agent discovers and
calls external tools, is increasingly the common layer underneath several of these frameworks
rather than a competing choice — if you're building custom tool integrations, building them as
MCP-compatible costs little extra and means they're reusable outside this one project.

### Sandboxed code execution (if your agent runs LLM-generated code at all)

If any part of your pipeline lets a model generate code and then run it — a data-analysis step,
a "compute this from the scraped numbers" feature — **that code must run in an isolated
sandbox, never directly in your application's own process or host.** This is the same rule as
`docs/anti-slop-guardrails.md`'s security section, applied to a different surface: LLM-generated
code is untrusted input by construction, the same as user input. **E2B** and **Daytona** are the
two commonly-used sandbox providers built specifically for this pattern (sub-second cold starts,
isolated filesystem/network per session); both have direct integration examples with Claude and
other model APIs. Don't `eval()` or `exec()` generated code inline as a shortcut, even for a
demo — it's a real security invariant, not a nice-to-have (see §6).

### Multi-agent context isolation (ties to your token-efficiency file)

If you do use multiple agents, the reason to isolate them isn't just organizational — each
subagent gets its **own context window**, so a broad, noisy subtask (searching many files,
running a long tool-call chain, exploring dead ends) can happen inside a subagent's context
without polluting your main session; only the conclusion needs to come back. This is the same
principle as `docs/token-efficiency-guardrails.md §5`'s note on delegating noisy work — multi-
agent orchestration is partly a context-management technique, not purely a capability upgrade.
It also costs more: published estimates put multi-agent token usage well above single-agent
chat for the same task, so this is a deliberate trade of tokens for parallelism and isolation,
made when a task actually needs it — not a default.

**Hackathon-scale recommendation:** start with a single agent with a small, well-chosen tool
set. Move to CrewAI (fastest to stand up) only if your actual concept requires genuinely
independent subtasks (e.g., one agent researching while another drafts). Reach for LangGraph
only if you need explicit human-approval checkpoints in the flow itself — that's a real feature,
not architecture for its own sake.

## §4 — Data Deduplication & Graph Synthesis

### Deduplication / entity resolution

The general pattern, regardless of tool: **blocking** (cheaply group likely-duplicate candidates
so you're not comparing every record to every other record) → **similarity scoring** (compare
candidates within a block on multiple fields) → **threshold-based decision** (auto-merge above a
high-confidence threshold, flag a middle band for human review, discard below a low threshold).

| Tool | Approach | Notes |
|---|---|---|
| **Splink** (`moj-analytical-services/splink`) | Probabilistic record linkage (Fellegi-Sunter model), unsupervised | No labeled training data required; runs on DuckDB locally (their own published claim: roughly a million records linked on a laptop in about a minute) or scales to Spark/Athena backends. Strong default for structured records (names, dates, addresses) without unique IDs. |
| **dedupe** (`dedupeio/dedupe`) | Active-learning fuzzy matching | Needs a small amount of human-labeled "is this the same entity" training pairs, which it uses to learn matching rules — a reasonable trade if you have someone available to label ~10-15 minutes of examples and want higher precision than the unsupervised default. |
| **Embedding-similarity + threshold** (roll your own) | Compare embeddings of free-text records, merge above a cosine-similarity cutoff | The simplest option when your "records" are closer to prose than structured fields (e.g., deduplicating scraped article summaries) — no new dependency, reuses the embedding pipeline from §2. |

**Whichever you pick, always log the human-review band** (the medium-confidence matches your
threshold doesn't auto-resolve) rather than picking a single hard cutoff and moving on — a
silent merge of two actually-different entities is a data-integrity bug that's hard to notice
later and easy to prevent now (see §6's invariant).

### Knowledge graphs (GraphRAG)

Plain RAG (§2) retrieves the most similar *chunks* to a query. A knowledge graph adds a layer
where documents are first processed to extract entities and relationships, stored as a graph
(most commonly in Neo4j), so a query can *traverse* connections instead of only matching
similarity — useful specifically for **multi-hop questions** ("what connects X and Y") that a
plain similarity search handles poorly, because the answer isn't semantically similar to the
question, it's *structurally* reachable from it.

The official `neo4j/neo4j-graphrag-python` package is the most maintained option for building
this pattern in Python — it handles the extraction pipeline (unstructured text → entities and
relationships → graph) and the retrieval side (query → graph traversal → context for the LLM).

**This is the one capability in this document to be genuinely skeptical of adding to a
hackathon build.** Building a knowledge-graph layer is real engineering time — extraction
pipeline, entity resolution feeding into the graph (§4's dedup step, now load-bearing), graph
schema design, traversal query logic — for a payoff that only matters if your actual judged
problem is multi-hop and relationship-heavy. If your real use case is "search documents and
answer questions about them," a well-built plain RAG pipeline (§2) will out-perform a rushed
graph layer on both quality and how much of your time budget survives to work on the rest of
the product. Add a graph when the *problem itself* is about relationships (who's connected to
whom, what depends on what) — not because it sounds more advanced in a pitch deck. This is the
same purpose test `docs/anti-slop-guardrails.md §2` applies to visual techniques, applied here:
state the reason in one line, or cut it.

## §5 — Putting it together: a default stack for a solo/small-team hackathon build

If your idea genuinely needs several of these capabilities, here's a reasonable default to run
through `docs/stack-decision.md` rather than starting from a blank page:

1. **Ingestion:** official API/dataset first; Firecrawl or Crawl4AI if scraping is genuinely
   necessary.
2. **Storage/retrieval:** Chroma or pgvector, with chunking that respects document structure
   and contextual chunk augmentation (§2, steps 1-2). Add hybrid search only if your test
   queries need exact-match lookups.
3. **Orchestration:** a single agent with a focused tool set. Add CrewAI only if the concept
   splits into genuinely independent subtasks.
4. **Execution safety:** any LLM-generated code runs in E2B/Daytona, never inline — non-
   negotiable regardless of time pressure (§6).
5. **Dedup:** Splink if you have structured records without unique IDs; embedding-similarity
   threshold if your data is closer to free text.
6. **Graph:** skip by default. Add only if multi-hop relationship reasoning is the actual
   differentiator judges will see in the demo.

## §6 — Guardrail invariants (fold into `docs/prd.md §5`)

- **INV — sandboxing:** the system SHALL NEVER execute LLM-generated code outside an isolated
  sandbox (E2B/Daytona or equivalent).
- **INV — crawling compliance:** the system SHALL NEVER crawl a source that its `robots.txt` or
  Terms of Service explicitly disallows, without a documented, deliberate exception logged in
  `docs/decision-ledger.md`.
- **INV — content licensing:** the system SHALL NEVER store or redisplay full-length copyrighted
  text ingested via crawling beyond a short, clearly-attributed excerpt — summarize or link to
  the source instead of reproducing it at length.
- **INV — entity merges:** the system SHALL NEVER auto-merge two entity records below your
  chosen high-confidence threshold without logging the decision for human review.

## §7 — Quick-reference checklist

- [ ] Have you confirmed no official API/dataset exists before building a scraper?
- [ ] Does your chunking respect document structure, and have you added contextual chunk
      augmentation (the cheapest, highest-leverage RAG improvement here)?
- [ ] Is your orchestration a single agent unless the task genuinely splits into independent
      subtasks?
- [ ] Does any LLM-generated code execution happen inside a sandbox, with zero exceptions?
- [ ] If you're deduplicating, is there a logged human-review band instead of one hard cutoff?
- [ ] If you're building a knowledge graph, can you state in one line why the *problem itself*
      is multi-hop — or is this a "sounds advanced" addition that should be cut?
