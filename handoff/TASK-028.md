# TASK-028: Simulated Facebook and Instagram connection for the pitch

## Reference

- **Phase:** Pitch demo (ADR-017)
- **Feature(s):** demo of F-006 (mock adapter only)
- **Design source:** Figma design file `Settings/connectedAcc` 20:5160, `/FB` 20:5262,
  `/FB/connect` 20:5379, `/IG/connect` 20:5703 (`docs/design-brief.md` §0, ADR-015)
- **Invariant(s):** INV-001 (7-day copy), INV-003 (draft holds only what the message says),
  INV-AS-005 (no control pretends to be real)
- **Anti-slop:** `docs/anti-slop-guardrails.md` read

## Scope — IS

Settings → Connected accounts: Facebook Page and Instagram professional with connect (bottom
sheet), "Not now", disconnect (confirmation; drafts from that account are deleted, confirmed
orders stay), and a demo-only "Simulate an incoming message" that adds a draft to Needs your
check. Every state is labelled simulated; no Meta logos or login screen.

## Scope — NOT

Telegram shop bot, "Preview a connection issue" / reconnect, real Meta login or webhooks.

## Write scope

`web/lib/api/mock.ts`, `web/lib/api/demo-storage.test.ts`, `web/app/(app)/settings/accounts/`,
`web/app/(app)/settings/page.tsx`, `web/components/Sheet.tsx`, `web/public/icons/link.svg`,
`handoff/TASK-028.md`.

## Deviations from the design file

- Notice reads "Simulated for this demo…" instead of the team-test-Page note; button says
  "Connect (simulated)".
- Sheet says messages are deleted after **7** days (INV-001); the frame says 5.
- Telegram row and the connection-issue preview are left out (not in ADR-017).

## Verify command

```
cd web && npm run lint && npm test
```

## Status

- **State:** done (pending An-joe's ADR-017 sign-off)
- **Verify result (2026-10-23):** lint clean; `npm test` 20/20 — connect, simulated draft (no
  price, "Not in chat", next Saturday as the message says), connection kept after reload,
  disconnect removes that account's drafts, reset disconnects. Production build in the browser at
  375×812: connect sheet → Connect (simulated) → Simulate an incoming message → "Check it" note →
  draft "Bea Santos · Ube pandesal box ×2" in the logbook.
- **Delivery Gate:** pass with notes — every control works on the mock and is labelled simulated;
  disconnect uses the browser's own confirmation (not clicked by the agent; covered by tests).
  Keyboard: the sheet closes on Escape; full keyboard/screen-reader pass not done.
