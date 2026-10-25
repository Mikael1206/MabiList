# TASK-015: webhook routes, connection lookup, dedupe, and answer-first ingestion

> Scope: backend-only path for the next phase after the channel storage contract. This packet covers the live F-006 webhook flow, not the frontend.

## Reference

- **Phase:** PH-02
- **Feature(s):** F-006
- **Design source:** `docs/sdd.md` §3 UJ-005 and `work/system-flow-explainer.md` §5
- **Invariant(s):** INV-AS-001, INV-AS-002, INV-AS-003, INV-AS-005
- **Anti-slop:** `docs/anti-slop-guardrails.md` read before code

## Scope — what this task IS

Implement the live webhook route behavior for Meta and Telegram: handshake validation, signature checks, connection lookup, dedupe, text-only storage, and immediate ack before any post-response processing. This stays on the backend and stays owner-scoped.

## Scope — what this task is NOT

- No frontend screens or UI work
- No deployment or production app-review flow
- No platform-level OAuth beyond the server-side connection contract
- No unrelated automation or broad messaging integrations

## Write scope

- `backend/src/channels.mjs` (extend if needed)
- `backend/src/server.mjs` (extend if needed)
- `backend/src/channels.test.mjs` (extend the regression suite)
- `handoff/TASK-015.md` (this file)
- **Do not touch:** `web/`, `seed/`, or other task write scopes outside this list

## Spec

- `GET /api/webhooks/meta`: accepts the Meta handshake and responds with the challenge only when the verify token matches the configured app setting.
- `POST /api/webhooks/meta`: verifies `X-Hub-Signature-256` against the raw request body using the app secret before storing anything.
- `POST /api/webhooks/telegram/{connectionId}`: validates the connection secret token, looks up the connection row, ignores unknown or disconnected connections, and deduplicates repeated `platform_message_id` values.
- Incoming messages are stored as owner-scoped `chat_messages` only after their connection belongs to the correct owner.
- The webhook must answer immediately so Meta and Telegram do not retry indefinitely while extraction is queued.
- The route does not create a confirmed order; it only stores the message data and leaves parsing/extraction for the follow-up processing step.

## Acceptance criteria

- WHEN a Meta handshake request includes the correct verify token, the system SHALL return the challenge and HTTP 200.
- WHEN a message request includes an invalid signature or token, the system SHALL reject it with HTTP 401.
- WHEN valid messages arrive for a connected account, the system SHALL look up the correct owner and store the message only under that owner’s rows.
- WHEN the same platform message is replayed, the system SHALL deduplicate it and avoid duplicate rows.
- WHEN the route is called for an unknown or disconnected connection, the system SHALL ignore the payload without storing it.

## Verify command

```bash
cd /home/mikael/Philippine-StartUp-Challenge/backend && npm run check && npm test -- --test-reporter=spec
```

## Status

- **State:** complete
- **Verify result:** pass
- **Delivery Gate:** passed for the backend contract in this repo
