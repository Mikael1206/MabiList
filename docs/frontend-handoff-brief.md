# Frontend Handoff Brief

## Backend status

The backend is ready for frontend integration. It was verified with:

```bash
cd /home/mikael/Philippine-StartUp-Challenge/backend && npm run check && npm test -- --test-reporter=dot
```

Result:
- 36 tests passed
- 0 failed

This includes the owner-scoped logbook stream regression fix and the main backend verification pass. The implementation lives in:
- `backend/src/server.mjs`
- `backend/src/session.mjs`
- `backend/src/channels.mjs`
- `backend/src/orders.mjs`
- `backend/src/extractions.mjs`

---

## 1) Authentication contract

Use the same bearer pattern everywhere an owner-scoped route is hit:

```http
Authorization: Bearer <token>
```

Behavior:
- `GET /api/session` validates the bearer token and returns the signed-in owner profile
- invalid or missing auth returns 401
- owner data is strictly isolated by `owner_id`

Response shape:

```json
{
  "email": "user@example.com",
  "shop_name": "My Shop"
}
```

This is enforced in `backend/src/session.mjs`.

---

## 2) API surface to integrate against

| Route | Method | Purpose | Notes |
|---|---|---|---|
| `/health` | GET | health check | public |
| `/api/session` | GET | current owner profile | requires bearer token |
| `/api/extractions` | POST | create extraction job | owner-scoped |
| `/api/extractions/:id/retry` | POST | retry extraction | owner-scoped |
| `/api/uploads/:id/source` | GET | fetch upload source for review | owner-scoped |
| `/api/orders` | POST | create or store order | owner-scoped |
| `/api/orders/:id` | DELETE | remove order/draft | owner-scoped |
| `/api/jobs/expire-uploads` | POST | expired upload cleanup | server job |
| `/api/logbook/live` | GET | SSE stream for owner logbook | authenticated stream |
| `/api/logbook/notify` | POST | logbook update signal | internal/backend path |
| `/api/webhooks/meta` | GET/POST | Meta webhook handling | server-side only |
| `/api/webhooks/meta/data-deletion` | GET/POST | delete owner data callback | server-side only |
| `/api/webhooks/telegram` | GET/POST | Telegram webhook | server-side only |
| `/api/conversations/:id/retry` | POST | retry queued conversation processing | owner-scoped |
| `/api/connections/:id` | DELETE | disconnect channel account | owner-scoped |

The route map is defined in `backend/src/server.mjs`.

---

## 3) Realtime contract

The frontend should use `GET /api/logbook/live` as a Server-Sent Events stream.

Important behavior:
- the stream is owner-scoped
- one authenticated user only receives their own updates
- the frontend should reconnect on network drop
- updates are intended for logbook and conversation-status flows

This is the live stream the frontend should subscribe to after login.

---

## 4) Frontend expectations

- Do not hit Supabase directly from the browser for owner-protected data.
- Do not build frontend logic around raw secrets or webhook endpoints.
- Treat all owner actions as backend-driven.
- Use the session route as the bootstrap for current user identity and shop name.
- Every write/read to order, upload, conversation, or connection data should go through the backend API.
- For logbook refreshes, rely on the SSE stream rather than polling the whole dataset.

---

## 5) Production-only items still pending

These are not frontend blockers, but they still need completion before launch:

- TASK-011 — production deployment
- TASK-012 — demo rehearsal
- TASK-020 — Meta App Review

These are operational tasks, not backend implementation blockers.

---

## 6) Recommended next step

The frontend developer can start against the backend contract immediately:
1. authenticate with the bearer token
2. fetch `/api/session`
3. hydrate the current user/shop
4. render orders/logbook from backend responses
5. subscribe to `/api/logbook/live` for update events

This should be treated as the working contract for integration unless a later deployment-specific requirement changes it.
