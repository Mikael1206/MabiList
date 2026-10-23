# TASK-014: channel tables, secrets, and owner-scoped conversation storage

> Scope: backend-only path for the next phase after the Way 1 webhook routes. This packet covers the owner-scoped database layer for connected accounts and message histories.

## Reference

- **Phase:** PH-02
- **Feature(s):** F-006
- **Design source:** backend contract in `docs/sdd.md` §4 and the Way 1 flow in `work/system-flow-explainer.md` §5
- **Invariant(s):** INV-AS-001, INV-AS-002, INV-AS-003, INV-AS-005
- **Anti-slop:** `docs/anti-slop-guardrails.md` read before code

## Scope — what this task IS

Create the database tables and row-level security for connected account metadata, server-side credentials, conversation threads, and incoming chat messages. This keeps any Meta or Telegram webhook payloads owner-scoped and prevents cross-owner access.

## Scope — what this task is NOT

- No frontend screens or UI work
- No Meta OAuth flow beyond the server-side storage contract
- No production webhook deployment or live platform setup
- No broad feature expansion beyond the database and RLS contract for Way 1

## Write scope

- `backend/supabase/migrations/20261023101000_channel_connections.sql` (new)
- `handoff/TASK-014.md` (this file)
- **Do not touch:** `web/`, `seed/`, or other task write scopes outside this list

## Spec

- `channel_connections`: owner-scoped connection metadata for each connected platform account
- `channel_secrets`: server-only token storage, not readable by authenticated owners
- `conversations`: one row per customer thread on a connected account; owner-scoped and tied to a connection
- `chat_messages`: text content for the connection, kept only as long as the lifecycle allows, with expiry and cleanup semantics
- All tables use row-level security and owner checks so one owner cannot read another owner’s data
- Unknown or disconnected connections must be ignored by the webhook route rather than stored to a new owner

## Acceptance criteria

- WHEN a connected account belongs to an owner, the system SHALL store it under that owner’s row-level security scope.
- WHEN an owner session queries channel data, the system SHALL only return rows for that owner.
- WHEN a chat message is stored, the system SHALL be tied to a valid owner and conversation.
- WHEN channel secrets are accessed by an owner session, the system SHALL not expose them.

## Verify command

```bash
cd /home/mikael/Philippine-StartUp-Challenge/backend && npm run check && npm test -- --test-reporter=spec
```

## Status

- **State:** in progress
- **Verify result:** pending
- **Delivery Gate:** pending
