# MabiList backend

This is the server workspace. It owns future API routes, input validation, order rules,
extraction, all Supabase product-data reads and writes, cleanup jobs, and server-only credentials. It imports no code from
`web/`. The only implemented route today is `GET /health`; it proves the process starts, not
that the product API is ready.

Run it locally with `npm run dev` from this directory. The default address is
`http://127.0.0.1:3001`; `HOST` and `PORT` can override it. No install step is needed yet because
the starter uses only Node.js built-ins.

`docs/sdd.md` §2 owns the HTTP contract. `web/lib/types.ts` is the frontend's local view of
that contract; the backend will define and validate its own request data when routes are added.
There is no shared source package. An HTTP contract change needs review from both developers.
The frontend currently uses `web/lib/api/mock.ts` through `web/lib/api/index.ts`; it does not
call this process yet.

Before connecting the apps, establish same-origin `/api` routing to this service and decide how
the backend verifies the Supabase session on each request. Hosting and auth transport are still
open after ADR-014. Never put a service key in `web/` or rely on an owner ID sent by the browser.
