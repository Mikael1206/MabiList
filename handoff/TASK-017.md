# TASK-017: conversation extraction retry and draft creation from queued chat messages

> Scope: backend-only path for the inboxed conversation flow. This packet covers the retry route for a failed or pending connected-account conversation and the draft creation that follows a successful extraction.

## Reference

- **Phase:** PH-02
- **Feature(s):** F-006, F-005
- **Design source:** `docs/sdd.md` §3, `docs/prd.md` BR-010, `work/system-flow-explainer.md` §5
- **Invariant(s):** INV-AS-001, INV-AS-003, INV-008, INV-013
- **Anti-slop:** `docs/anti-slop-guardrails.md` read before code

## Scope — what this task IS

Implement the retry flow for a connected-account conversation: validate the authenticated owner, load that conversation and its messages, ensure it belongs to the caller, run the extraction adapter over the queued text, and create a draft order under the correct owner scope when the model returns a valid single-order result.

## Scope — what this task is NOT

- No frontend screens or UI work
- No live Meta/Telegram production setup
- No broad feature expansion beyond the retry flow and draft persistence contract

## Write scope

- `backend/src/channels.mjs`
- `backend/src/server.mjs`
- `backend/src/channels.test.mjs`
- `handoff/TASK-017.md` (this file)
- **Do not touch:** `web/`, `seed/`, or other task write scopes outside this list

## Spec

- `POST /api/conversations/{id}/retry` requires a valid bearer token and owner ownership for the conversation.
- The server loads the conversation row, confirms the owning channel connection, and pulls the windowed text from `chat_messages` for that conversation.
- The route runs the same `extractOrders()` adapter used by other extraction paths and converts a valid result into a draft `orders` row with the message source.
- A successful extraction records the conversation as `draft_ready` and creates the order and order items under the authenticated owner.
- If no message text or no valid extraction exists, the route behaves as a validation or internal-error response instead of silently pretending success.

## Acceptance criteria

- WHEN an owner retries a failed conversation, the system SHALL load only that owner’s conversation and its related messages.
- WHEN the queued text is valid, the system SHALL call the extraction adapter and create the draft order under the correct owner scope.
- WHEN the route cannot verify ownership or finds no text, the system SHALL reject it with the appropriate error instead of creating data.

## Verify command

```bash
cd /home/mikael/Philippine-StartUp-Challenge/backend && npm run check && npm test -- --test-reporter=spec
```

## Delivery Gate

**Hard Gate**
- [ ] Any dead button, link, or form with no real behavior? no
- [ ] Any fabricated stat, testimonial, or trust badge? no
- [ ] Any screen missing an empty/loading/error state? no
- [ ] Any text failing WCAG AA contrast, or any control unreachable by keyboard? no

**Code honesty**
- [ ] Any library call you didn't verify against the actual installed version? no
- [ ] Any comment that just restates the code, or references a ticket/issue number? no
- [ ] Any status reported as "done" without the corresponding command actually being run? no

**Security**
- [ ] Any secret reachable from frontend code or a client-exposed env var? no
- [ ] Any database table without row-level security / ownership checks in place? no
- [ ] Any query built by string-concatenating user input? no
- [ ] Any debug endpoint, API doc, or source map left publicly reachable in the deployed build? no

**Verification**
- [ ] Did you actually run/build the app before calling this done? yes
- [ ] Did you click through every changed interactive element and confirm what happened? not applicable to backend-only route
- [ ] For anything you couldn't verify, did you say so explicitly rather than guessing? yes

## Status

- **State:** complete
- **Verify result:** pass
- **Delivery Gate:** pass
