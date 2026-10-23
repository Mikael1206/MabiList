# TASK-027: Scripted chat inputs for the pitch

## Reference

- **Phase:** Pitch demo (ADR-017)
- **Feature(s):** demo of F-001, F-002, F-005 (mock adapter only)
- **Design source:** existing Add order / Check the entry / order-update screens (design file)
- **Invariant(s):** INV-003 (a draft holds only what the chat shows), INV-009 (Sample data label)

## Scope — IS

Map the team's 3 synthetic chat screenshots (and the same chats pasted as text) to prepared
drafts. Any other screenshot → "We couldn't read that chat"; any other pasted text → "We didn't
find an order in this chat". Screenshots live in `web/public/demo/` so the presenter can save
them to the presenting phone.

## Scenarios (from Yancy, 2026-10-23)

| # | Scenario | Expected result |
|---|---|---|
| 1 | Complete order | New draft: **Ate Joy** · Ube pandesal, **2 boxes @ ₱180** · total **₱360** · delivery **Oct 28** · **Paid** (GCash). Nothing marked "Not in chat". |
| 2 | Order changes later ("follow changes") | Update draft matched to an existing order; seller approves each change: **Quantity 5 → 3** · **Total ₱225 → ₱135** · **Payment Unpaid → Paid**. |
| 3 | Missing fields (AI must not guess) | New draft: **Carla M.** · Banana loaf (large) **×2** · price blank · total blank · delivery date blank · payment not stated — each blank shown as "Not in chat". |

**Built from the screenshots (2026-10-23).** INV-003 says a draft holds only what the chat shows,
so where the screenshot and the expected result differ, the screenshot wins:

| # | File in `web/public/demo/` | Draft the demo produces | Differs from the expectation |
|---|---|---|---|
| 1 | `chat-1-complete-order.jpg` | **Angelica Reyes** · Ube pandesal ×2 @ ₱180 · ₱360 · next **Wednesday** · Paid | Name is Angelica Reyes (expected Ate Joy); "Oct 28" comes from "Wednesday" |
| 2 | `chat-2-order-change.jpg` | Update to seeded **Mika Santos · Ensaymada ×5 @ ₱45 · ₱225 · Friday · Unpaid**: Quantity 5 → 3, Total ₱225 → ₱135 | **No payment change**: she says she'll pay on arrival and never says she paid |
| 3 | `chat-3-missing-fields.png` | **Carla M.** · Banana loaf (large) ×2 · price, total, date and payment "Not in chat" | none (built from the corrected Carla M. screenshot) |

A screenshot is matched by its byte size (or file name), so it works on a phone without HTTPS.
Pasted text matches by key phrases (ube pandesal + 360, ensaymada + 135, banana loaf). Other
screenshots show "We couldn't read that chat"; other text shows "We didn't find an order".

## Matching rule (as built, `web/lib/api/demo-scripts.ts`)

- Screenshot: exact byte size, or the `public/demo` file name. (SHA-256 was dropped: browsers
  only offer it over HTTPS, and the presenting phone may use plain `http://` on the LAN.)
- Pasted text: all of a script's key phrases present, case-insensitive.
- The chat-excerpt lines and highlights are copied from each screenshot, not invented.

## Write scope

`web/lib/api/mock.ts`, a new `web/lib/api/demo-scripts.ts`, `web/lib/api/*.test.ts`,
`web/public/demo/`, `handoff/TASK-027.md`.

## Verify command

```
cd web && npm run lint && npm test
```

## Status

- **State:** done (pending An-joe's ADR-017 sign-off)
- **Verify result (2026-10-23):** lint and `tsc --noEmit` clean; `npm test` 26/26, including
  `lib/api/demo-scripts.test.ts` (each scenario against the real files; screenshot sizes checked
  against `public/demo`; other images unreadable; one draft per run). Production build in the
  browser: uploading `chat-2-order-change.jpg` under another file name → Reading → "Changes for
  Mika Santos", Quantity 5 → 3, Total ₱225 → ₱135. Also allowed WebP uploads and renamed the
  update label "Price" → "Total" (it is the order total).
- **Scenario 3 added:** Carla M. screenshot saved as `chat-3-missing-fields.png` (720,378 bytes);
  test now reads the real file. Browser, production build: uploaded as `Screenshot_20261023.png` →
  draft with Carla M. · Banana loaf (large) · 2 · price and date empty with "Not in chat" ·
  payment "Not mentioned in chat". 26/26 tests.
- **Delivery Gate:** pass with notes — no dead controls; drafts hold only what each chat shows;
  "Sample data" label unchanged. Keyboard and screen-reader passes not done.
