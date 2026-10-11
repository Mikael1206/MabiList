# Token-Efficiency Guardrails

**What this is:** a compiled set of practices for stretching a limited AI budget (a capped
Cursor plan, a Claude/ChatGPT subscription with message limits, a metered API key) across a
whole hackathon build, without giving up output quality. The framing below isn't "cheaper but
worse" — the research it's built from shows that past a certain point, *more* context actually
makes a model perform worse, not better. Cutting the excess is a quality move that happens to
also save tokens, not a trade-off between the two.

## Sources this was compiled from

| Source | What it covers | Link |
|---|---|---|
| Anthropic, "Effective context engineering for AI agents" | Why context is a finite resource with diminishing (then negative) returns; just-in-time retrieval, sub-agents, compaction, structured note-taking | anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| Chroma, "Context Rot" research | Measured evidence that model recall/accuracy degrades as input length grows, even well inside the advertised context window | trychroma.com/research/context-rot |
| Aider (`aider-ai/aider`) | Concrete "edit formats" — asking a model to return only a diff instead of a whole rewritten file cuts output tokens dramatically and reduces lazy/incomplete rewrites | github.com/aider-ai/aider |
| Community guides on `.cursorignore` / `.cursorindexingignore` and Cursor quota mechanics | Config-level fixes: what Cursor indexes by default, what silently eats your quota, how to stop it | techhub.iodigital.com/articles/cursorignore-file; fast.io/resources/cursor-usage-limits |
| Community "Claude Code token saving" guides and context-window breakdowns | Concrete numbers on where a 200K context window actually goes, and the specific commands (`/clear`, `/compact`, `/context`, subagents) that claw it back | morphllm.com/claude-code-context-window; morphllm.com/claude-code-token-limit; github.com/JuanjoFuchs/claude-code-tips |
| Anthropic prompt caching docs | API-level cost reduction for repeated stable context (only relevant if you're calling the API directly, e.g. inside a built product, not through the Cursor/Claude chat UI) | docs.anthropic.com (prompt caching) |

## The core idea (read this before the checklists)

Anthropic's own framing: context is a **finite resource with diminishing returns** — the job
isn't "fit as much in as possible," it's finding **the smallest set of high-signal tokens that
makes the desired output likely.** Independent research (Chroma's "context rot" work, and the
older "Lost in the Middle" findings) backs this up empirically: as the token count in a context
window grows, a model's ability to accurately use everything in it goes *down*, well before the
window is actually full. Community trackers of Claude Code sessions report visible quality
degradation starting around 40% of the window's capacity, with some experienced users keeping
sessions under 30% for anything that actually requires careful reasoning.

**What this means for you:** trimming context isn't just about not running out of messages
sooner. A tightly-scoped prompt with only the files and instructions that matter usually
produces *better* code than the same request buried in a 150K-token conversation that's drifted
across six different topics. The techniques below serve both goals at once.

## How this plugs into your FMD-Advanced pipeline

Good news: **your `handoff/TASK-###.md` pattern already does the single most important thing
here.** Feeding a coding agent one scoped, 1-3-hour task packet — instead of the whole
`docs/prd.md` or the whole repo — is exactly the "smallest set of high-signal tokens" principle
in practice. This file adds the layer *around* that: how to keep the session itself lean while
you work through those packets, and how to configure the tools so they're not silently burning
budget on things you never asked about.

1. Add this file as `fmd-advanced/docs/token-efficiency-guardrails.md`.
2. Add a line to `AGENT_ROUTING.md`: *"starting a new `handoff/TASK-###.md` → start a fresh
   session/`/clear` first, per `docs/token-efficiency-guardrails.md §3`, rather than continuing
   an old one."*
3. If you're on Cursor: do the one-time setup in §4 (ignore files) once per project — it costs
   five minutes and keeps paying off for the life of the repo.
4. If you're on Claude Code specifically: §3's session commands are your day-to-day habit.

---

## §1 — Give the agent less, not more, as the default

- **Don't paste a whole file when a targeted excerpt will do.** Asking for "lines 40-90 of
  `handler.ts`" costs roughly 500-800 tokens versus 5,000-8,000+ for the full file — and this
  compounds fast in a debugging back-and-forth where the same file gets re-read repeatedly.
- **Don't keep unrelated work in the same session.** Mixed context degrades quality on every
  sub-task *and* makes every subsequent turn more expensive, because the model re-processes
  irrelevant history on top of what actually matters right now.
- **One coherent workstream per conversation.** The moment you catch yourself typing "okay,
  switching topics," that's the signal to close out, not to keep going.
- **Feed one `handoff/TASK-###.md` packet at a time** (you already have this pattern) — never
  the whole `docs/` folder "just in case." If the agent needs a fact from another doc, name the
  specific doc and section, don't attach the folder.

## §2 — Ask for diffs, not full rewrites

This is the single biggest lever for **output** tokens (which are typically billed/limited more
heavily than input tokens):

- When asking an agent to change a file, **explicitly ask for the change as a diff / search-
  replace block**, not a full rewritten copy of the file. Returning only the changed lines
  instead of the entire file is dramatically cheaper, and as a side effect tends to produce more
  careful, less "lazy" edits — the model can't hand-wave through unchanged sections it isn't
  rewriting anyway.
- If your tool defaults to whole-file rewrites for small edits, say so directly in your prompt
  or your rules file: *"For any edit under ~30 lines, return a diff/patch, not the whole file."*
- This is also why keeping files reasonably small matters beyond code cleanliness — a monolithic
  1,000-line file makes even a targeted diff request more expensive than five focused files
  would be.

## §3 — Session hygiene (the daily habit)

- **Start a fresh session for a genuinely new task.** Reuse a session only when the next task
  is a close continuation of what's already loaded (e.g., writing docs for a feature you just
  built in this same session) — not out of habit.
- **Compact deliberately, don't wait for auto-compact.** If your tool has a manual compact
  command, use it *with a hint* about what to keep ("compact, but keep the auth refactor
  context, drop the earlier test-debugging back-and-forth"). Letting automatic compaction fire
  on its own tends to happen exactly when the model is already struggling under a bloated
  context — the worst possible moment for it to also be summarizing.
- **Prefer rewind-and-reprompt over correct-in-place** when an attempt goes wrong. Leaving a
  failed attempt plus your corrections sitting in context is pure noise for every turn after
  it; stepping back to before the failed attempt and re-prompting with what you learned is
  cheaper and cleaner.
- **Ask for a short handoff note before closing a session** you'll need to resume: "summarize
  the current goal, files changed, and next step in 5 lines" — then start the next session with
  that note instead of the full history.
- **If your tool exposes a context/usage inspector, check it before big tasks**, not just when
  something goes wrong — it's the fastest way to see whether a bloated tool list or an
  unnecessary attached file is quietly eating your budget every single turn.

## §4 — One-time config: stop indexing what you'll never ask about

If you're using an editor with codebase indexing (Cursor and similar tools index your whole
project by default to power semantic search):

- **Add an ignore file** (`.cursorignore` or equivalent — same syntax as `.gitignore`) excluding
  at minimum: `node_modules/`, lockfiles (`package-lock.json`, `yarn.lock`), build output
  (`.next/`, `dist/`, `build/`), and any large generated/data files (JSON fixtures, DB dumps,
  SDK client code you didn't write). None of these need AI reasoning applied to them, and they
  can silently make up a large share of what gets pulled into context on a broad query.
- **Never let `.env` or anything holding real credentials be indexable** — this is a security
  concern as much as a token one; a stray credential pulled into a chat context can end up
  logged or sent to a model provider.
- **If your tool distinguishes "don't index" from "don't allow AI to read at all,"** use the
  softer exclusion for things you might occasionally want to reference manually, and the harder
  one for things that should never be in context, period.
- **Turn off tool integrations (MCP servers, plugins) you're not using in a given session.**
  Each one's tool definitions get loaded into context on every single turn whether you use it or
  not — a handful of unused integrations can cost several thousand tokens before you've typed
  anything.
- **Keep your always-loaded instructions file short.** A project's `AGENTS.md`/`CLAUDE.md`/
  `.cursor/rules` content typically loads on every request and survives context-clearing —
  which makes it valuable for things that must always be true, and expensive if it's padded
  with prose. Write it as tight bullets aimed at the model, not paragraphs aimed at a human
  reader. Your existing `fmd-advanced/AGENT_ROUTING.md` and `AGENTS.md` are already close to
  this style — keep them that way as you extend them.

## §5 — Model tiering: don't use your biggest model for everything

Not every step in a build needs your most capable (and most expensive/rate-limited) model:

- **Route mechanical work to a cheaper/faster model**: boilerplate scaffolding, formatting,
  straightforward CRUD, simple test-writing, and rephrasing tasks rarely need your top-tier
  model's reasoning budget.
- **Reserve your best model for what actually needs it**: architecture decisions, debugging a
  subtle failure, writing the PRD's acceptance criteria, anything in `docs/decision-ledger.md`,
  and the final pass on anything judge-facing (the pitch script, the README).
- **This is exactly the instinct behind assigning different models to different roles** — the
  same idea as giving your research pass to one model, quick asset/boilerplate generation to
  another, and the deepest reasoning work to a third. If you're working solo across multiple
  tools/subscriptions, the same split applies: don't burn your scarcest, most capable quota on a
  task a lighter tool would handle just as well.
- **If your tool supports isolated sub-agents or sub-tasks**, delegate noisy, exploratory work
  to one (a broad file search, running a test suite, digging through logs) and only bring back
  the conclusion — not the 20 file reads and 12 dead ends it took to get there — into your main
  working context.

## §6 — API-level option (only if you end up calling the API directly)

If any part of your build calls the Claude API directly (rather than going through the Cursor
or Claude chat UI), **prompt caching** is worth knowing about: marking a large, stable prefix
(a long system prompt, a reference document, your tool definitions) as cacheable means repeat
requests that reuse it are billed at a steep discount on those tokens, with faster responses as
a side effect. It only pays off when the same large block is reused across multiple calls in a
short window — not relevant if you're just chatting in the Cursor/Claude UI, but worth
remembering if this project (or a future one) ends up wrapping the API in its own tool.

## §7 — Quick-reference checklist

Run through this at the start of a work session, and again anytime a session feels sluggish or
you notice a quota warning:

- [ ] Am I feeding one scoped `handoff/TASK-###.md` packet, not a whole folder of docs?
- [ ] Am I asking for a diff on this edit, or defaulting to "just rewrite the file"?
- [ ] Has this session drifted onto a second, unrelated topic? If yes → wrap up, `/clear` (or
      equivalent), start fresh.
- [ ] Is there a failed attempt + corrections sitting in this context that I should rewind past
      instead of building on top of?
- [ ] Do my ignore files actually exclude `node_modules`, lockfiles, and build output?
- [ ] Are there MCP servers/plugins enabled that I'm not using right now?
- [ ] Is this task actually mechanical enough to hand to a lighter/cheaper model instead of my
      best one?
- [ ] Is my always-loaded rules file (`AGENTS.md`/`.cursor/rules`) still short and bullet-based,
      or has it crept up in length since I last checked?

A session that passes all eight tends to be both cheaper *and* more accurate than one that
doesn't — that's the whole point: this isn't a quality tax, it's mostly free.
