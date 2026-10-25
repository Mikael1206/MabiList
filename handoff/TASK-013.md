# TASK-013: Meta and Telegram channel connections, webhook validation, and conversation ingestion

> Scope: backend-only path after the screenshot flow. This packet covers F-006 connection setup and the server-side ingestion flow without any frontend work.

## Reference

- **Phase:** PH-02
- **Feature(s):** F-006
- **Design source:** no UI work in this packet; backend contract only
- **Invariant(s):** INV-AS-001, INV-AS-002, INV-AS-003, INV-AS-005
- **Anti-slop:** `docs/anti-slop-guardrails.md` read before code

## Scope — what this task IS

Implement connection storage and validation for Meta and Telegram, then add webhook routes for the handshake and signed message ingestion flow. This includes owner-scoped `channel_connections`, `channel_secrets`, `conversations`, and `chat_messages` handling, plus expiry/lifecycle cleanup hooks for stale messages.

## Scope — what this task is NOT

- No frontend screens or UI state changes
- No file uploads or screenshot parsing changes
- No marketing or unrelated automation work
- No broad webhook platform integrations beyond the server-side validation and ingestion path

## Write scope

- `backend/src/channels.mjs` (new)
- `backend/src/server.mjs`
- `backend/src/channels.test.mjs` (new)
- `backend/supabase/migrations/20261023100000_channel_connections.sql` (new)
- **Do not touch:** `web/`, `seed/`, or other task write scopes outside this list

## Spec

- **Connection storage:** each owner can create one or more authenticated channel connections for `meta` and `telegram`.
- **Webhook security:** Meta handshake must validate `hub.mode`, `hub.challenge`, and `hub.verify_token`. Meta `/POST` must validate `x-hub-signature-256` against `META_APP_SECRET`. Telegram `/POST` must validate the configured secret token from `x-telegram-token` or the query token.
- **Conversation ingestion:** incoming messages from Meta or Telegram are normalized into owner-scoped conversation rows and chat message rows.
- **Lifecycle:** stale or disconnected channel records and expired chat payloads are handled through the same server-side cleanup pattern used by the upload expiry job.
- **Edge cases:** invalid signatures, missing channel config, invalid payloads, duplicate message IDs, and unauthenticated channel requests.
- **Deferred:** UI screens and authenticated channel OAuth flow beyond the server-side connection record setup.

## Acceptance criteria

- WHEN a Meta handshake request includes the correct verify token, the system SHALL return the challenge and an HTTP 200.
- WHEN a Meta message request includes an invalid signature, the system SHALL reject it with HTTP 401.
- WHEN a Telegram webhook request includes an invalid token, the system SHALL reject it with HTTP 401.
- WHEN valid Meta or Telegram payloads are accepted, the system SHALL create or update owner-scoped conversation and message rows.
- WHEN a connection is deleted or a job expires stale channel data, the system SHALL clean up the relevant records under the owner scope.

## Verify command

```bash
cd /home/mikael/Philippine-StartUp-Challenge/backend && npm run check && npm test -- --test-reporter=spec
```

## Status

- **State:** complete
- **Verify result:** pass
- **Delivery Gate:** passed for the backend contract in this repo
