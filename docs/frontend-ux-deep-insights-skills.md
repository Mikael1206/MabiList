# Frontend & UX Capabilities (for Deep Insights)

**What this is:** a compiled reference for the three "research-tool UI" capabilities you
flagged — heavy data visualization, streaming/partial-state UI, and citation/provenance
tracking — sourced from real, currently-maintained libraries and Anthropic's own shipped
Citations API, not invented from memory. Same framing as the other engine-skill files: a
decision guide for which real tool fits which job, and — just as important — where the
"advanced-sounding" default costs you more engineering time than it's worth on a hackathon
clock.

## Sources this was compiled from

| Area | Source | Link |
|---|---|---|
| Visualization libraries | 2026 comparisons of D3.js, Chart.js, Cytoscape.js, vis-network, Sigma.js, Recharts/Visx | pkgpulse.com/guides, lightningchart.com/blog, cambridge-intelligence.com/blog |
| Streaming transport | Independent 2026 write-ups on why every major LLM provider (OpenAI, Anthropic, Gemini) and the Vercel AI SDK default to SSE, and when teams move to WebSockets | websocket.org/guides, buildmvpfast.com/blog, vercel.com/docs |
| Citations / provenance | Anthropic's own Citations API documentation and its design rationale | platform.claude.com/docs (Citations); simonwillison.net (write-up); agentpatternscatalog.org |
| Citation reliability research | Academic and independent measurement of how often ungrounded RAG citations are simply wrong | arxiv.org/abs/2504.18225 (Pleias-RAG) |

## How this plugs into your FMD-Advanced pipeline

1. Drop this in as `fmd-advanced/docs/frontend-ux-deep-insights-skills.md`.
2. **This feeds `docs/design-brief.md` and `docs/stack-decision.md`, not a replacement for
   either.** You're the designer on this team — use §1's "pick by what the graph actually is"
   table to choose a library, then design the actual screen yourself; this file stops at the
   engineering decision, not the visual one.
3. **§2's partial-state guidance is a direct extension of `docs/anti-slop-guardrails.md`'s
   R-27** (every UI showing data needs an empty/loading/error state) — streaming just adds a
   fourth state ("partial") in between loading and complete, and an explicit fifth
   (interrupted/reconnecting) that's easy to forget.
4. **§4's invariants fold into `docs/prd.md §5`**, same pattern as your other guardrail files.
5. If your idea uses the RAG/retrieval pipeline from `docs/core-architectural-engine-skills.md
   §2`, §3 below (citations) is the UI-side half of that same system — read them together.

---

## §1 — Complex Data Visualization

**Pick by what the visualization actually is, not by which library sounds most capable.**

| Library | Best for | The honest cost |
|---|---|---|
| **Cytoscape.js** | Interactive knowledge-graph exploration where graph *analysis* matters (centrality, path-finding, clustering algorithms) | The right default for "interactive knowledge graph," specifically because it ships the graph-theory algorithms, not just rendering. |
| **vis-network** | An interactive network diagram users drag, drop, and edit, with physics-based layout | Choose this over Cytoscape when the graph is a diagram to manipulate, not a dataset to analyze. |
| **Sigma.js** | Genuinely large graphs (thousands of nodes) | WebGL rendering matters once you're past what SVG-based libraries render smoothly; adds real complexity you don't want at a normal hackathon graph size (dozens to low hundreds of nodes). |
| **Chart.js** | Standard chart types — line, bar, time-series, doughnut | Canvas-based, ~20 minutes of configuration for a chart that would take D3 half a day to build from primitives. This is the default for time-series trends unless you need something D3-only supports. |
| **Recharts / Visx** | The same standard charts, but idiomatic React | Pick over raw Chart.js if your whole stack is React and you want the chart to compose like any other component. |
| **D3.js** | A visualization that's genuinely custom — a bespoke interaction, a layout no chart library ships | The power tool, and the expensive one: a from-scratch line chart with axes, tooltip, and zoom is a real engineering task, not a quick win. Reach for it only when the visualization can't be built any other way. |

**The purpose test (same instinct as `docs/anti-slop-guardrails.md §2`):** before reaching for
D3 because it's "the real data-viz tool," ask whether a standard chart type or an
existing graph library already does what you need. If the honest answer is yes, using D3
anyway just spends hours of your limited build time recreating what Chart.js or Cytoscape
already ships — time a judged demo won't reward more than the same chart built faster.

**Hackathon-scale recommendation:** Cytoscape.js for the knowledge-graph view, Chart.js (or
Recharts if you're in React) for time-series trends. Reach for D3 only for the one visualization
in your product that's genuinely novel enough that nothing else fits — and know that's a
real time investment when you do.

## §2 — Streaming & Partial-State UI

### SSE vs. WebSockets — this is a more settled question than it looks

OpenAI, Anthropic, and Google Gemini all stream model output over **Server-Sent Events**, and
the Vercel AI SDK's default transport does too. This isn't an accident: token streaming is
one-directional (you send a prompt, the server streams tokens back), which is exactly what SSE
was designed for, and it rides on plain HTTP — no protocol upgrade, no special load-balancer
config, and it multiplexes cleanly under HTTP/2.

**Move to WebSockets only when you actually need bidirectional communication mid-stream** —
letting the user interrupt or redirect the agent while it's still generating, human-in-the-loop
approval of a tool call before it runs, or coordinating state across multiple connected agents.
If your research tool just streams synthesis text, citations, and "agent is now doing X"
status updates to a single viewer, that's the one-directional case SSE was built for.

**A pragmatic middle ground worth knowing about:** the Vercel AI SDK's `ChatTransport`
abstraction (and similar patterns in other frameworks) makes the transport a swappable
implementation detail — you can start with the default SSE-based transport and swap in a
WebSocket transport later without rewriting how your UI consumes the stream, if it turns out
you need it. Worth designing your streaming consumption code against that seam from the start,
even if you don't need it for the hackathon build.

### What "partial state" actually means for a research-synthesis UI

This extends `docs/anti-slop-guardrails.md §1`'s rule that every UI needs empty/loading/error
states — a streaming research UI has more states than that pattern originally covers:

| State | What the user sees | Common mistake |
|---|---|---|
| **Empty** | No query yet | (standard) |
| **Streaming/partial** | Text arriving token-by-token, citations attaching as they resolve, an indicator of what the agent is currently doing (searching, reading, synthesizing) | Treating this as just "loading" with a spinner — a research tool's value is *in* this state; showing the agent's actual step (not a generic spinner) is most of what makes it feel trustworthy rather than opaque |
| **Interrupted/reconnecting** | The connection dropped mid-stream | The state teams most often skip. A dropped stream must never silently render as if it finished — the user needs to see it stopped short, and ideally the ability to resume without losing what already arrived |
| **Complete** | Final synthesis with all citations attached | (standard) |
| **Error** | The agent's process itself failed (not just a network drop) | Conflating this with "interrupted" — a failed tool call deep in the agent's reasoning is a different failure than a dropped connection, and probably needs a different recovery action |

**Don't render citations only at the end.** If your retrieval pipeline resolves sources
progressively (as `docs/core-architectural-engine-skills.md §2`'s pipeline does), attach and
show each citation as it becomes available during the stream, not as one batch dump once
generation finishes — that's the actual point of showing your work as you go, not just
animating text for its own sake.

**Hackathon-scale recommendation:** build on SSE with whatever streaming primitive your
framework ships (the Vercel AI SDK if you're on Next.js; plain `EventSource`/`fetch` streaming
otherwise). Design the interrupted/reconnecting state deliberately — it's the one most likely
to get skipped under time pressure, and it's also the one most likely to make a live demo look
broken if you haven't handled it.

## §3 — Citation & Provenance Tracking

### The problem this actually solves

Free-text citations a model generates on request — "according to the source, X" with no
structural link back to real text — are wrong at a documented, non-trivial rate; independent
measurement has found meaningfully-sized fractions of RAG-generated citation URLs turn out to
be fabricated or mismatched even in otherwise-working systems. Asking the model to "cite your
sources" in the prompt doesn't fix this, because the citation is still just generated text with
no verification behind it. The fix has to be structural, not a prompting trick.

### The model to build toward: extracted, not generated

Anthropic's own **Citations API** is the clearest published example of the right shape for
this. Source documents are chunked; the model's response comes back as a sequence of text
blocks, and each block carries citations pointing at **specific locations in the source** — a
character range for plain text, a page number for a PDF, a block index for structured content.
Critically, **the cited text is extracted directly from the source document, not generated by
the model** — so a citation is guaranteed to point at real text that actually exists in the
source, rather than a plausible-sounding paraphrase. Citations stream incrementally alongside
the response text, which is exactly what §2 above wants: attach-as-you-go, not batch-at-the-end.

You don't have to call that specific API to build the same *shape* into your own UI/UX schema
(useful if you're using multiple models, or a provider without an equivalent feature):

- **`grounded_span`** — which part of the generated answer text this citation attaches to
- **`source`** — a pointer back to the retrieved document/chunk (an ID resolvable to the
  actual source, not just a display string)
- **`cited_text`** — the exact quoted span from the source, extracted verbatim, not reworded
- **`location`** — enough to jump to the actual spot in the original (character offset, page
  number, or chunk ID)

This mirrors how independent implementations building citation support on top of other model
providers have converged on the same shape — a typed citation object with a source pointer and
a grounded span, rather than a flat list of "sources" disconnected from which sentence they
actually support.

### UI pattern

- **Inline, hoverable/clickable footnote markers** attached to the specific claim they support
  — not a single "sources" list at the bottom of the response with no link back to which
  sentence each source backs.
- **A popover or expandable panel showing the exact quoted snippet**, not just a link — the
  user should be able to see the actual sentence that grounds the claim without leaving the
  page, the same way a footnote lets you check without losing your place.
- **A visibly different treatment for an ungrounded statement** (the model's own synthesis or
  inference, not a direct claim from a source) versus a grounded one — conflating the two is
  how a research tool quietly starts asserting things confidently it can't actually back up.

### The guardrail this all serves

**Never show a citation marker for a claim that isn't actually backed by a verifiable source.**
This is `docs/anti-slop-guardrails.md §1`'s "no fabricated claims" rule, applied specifically to
citations: an unverifiable claim should render with *no* citation marker (or an explicit "not
directly sourced" treatment), never a citation marker attached to a source that doesn't
actually support it. A fake-looking citation is worse than an honest gap, because it invites
trust the tool hasn't earned.

## §4 — Guardrail invariants (fold into `docs/prd.md §5`)

- **INV — citation grounding:** the system SHALL NEVER attach a citation marker to generated
  text unless the cited span is extracted verbatim from a real, resolvable source document.
- **INV — stream integrity:** an interrupted or dropped stream SHALL NEVER be presented to the
  user as a complete, successful response — the UI must show the interruption explicitly.
- **INV — visualization honesty:** a chart or graph SHALL NEVER render from placeholder or
  synthetic data without a visible "sample data" label (this is `docs/anti-slop-guardrails.md`
  §1's "no fabricated statistics" rule, applied to charts specifically).

## §5 — Quick-reference checklist

- [ ] Did you pick a visualization library by what the graph/chart actually is, or by which
      one sounds most sophisticated?
- [ ] Are you defaulting to SSE, and reaching for WebSockets only if you have a genuine
      bidirectional need (mid-stream interruption, human approval, multi-agent coordination)?
- [ ] Have you designed the interrupted/reconnecting state deliberately, not left it to
      whatever happens by default when a connection drops?
- [ ] Do citations attach progressively as they resolve, rather than arriving as one block at
      the end?
- [ ] Is every citation's `cited_text` traceable to real, verbatim source text — and does an
      ungrounded claim render with no citation rather than an invented one?
