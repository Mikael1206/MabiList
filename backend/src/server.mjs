import { createServer } from "node:http";
import { getSession } from "./session.mjs";
import { handleExtraction } from "./extractions.mjs";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3001);

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.writeHead(200);
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/session") {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    const result = await getSession(request.headers.authorization, process.env);
    response.setHeader("Cache-Control", "no-store");
    response.writeHead(result.status);
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/webhooks/mock") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === "demo-token" && challenge) {
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.writeHead(200);
      response.end(challenge);
      return;
    }

    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.writeHead(400);
    response.end(JSON.stringify({ error: { code: "INVALID_CHALLENGE", message: "Missing or invalid webhook challenge." } }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/webhooks/mock") {
    const secret = request.headers["x-mock-secret"];
    if (secret !== "demo-secret") {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.writeHead(401);
      response.end(JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Invalid webhook secret." } }));
      return;
    }

    let payload;
    try {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks).toString("utf8");
      payload = body ? JSON.parse(body) : {};
    } catch {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.writeHead(400);
      response.end(JSON.stringify({ error: { code: "INVALID_BODY", message: "Webhook payload must be valid JSON." } }));
      return;
    }

    const text = typeof payload?.text === "string" ? payload.text : "";
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.writeHead(200);
    response.end(JSON.stringify({ ok: true, source: "mock-webhook", text }));
    return;
  }

  if ((request.method === "POST" && (url.pathname === "/api/extractions" || /^\/api\/extractions\/[0-9a-f-]{36}\/retry$/i.test(url.pathname))) ||
      (request.method === "GET" && /^\/api\/uploads\/[0-9a-f-]{36}\/source$/i.test(url.pathname))) {
    const result = await handleExtraction(request);
    response.setHeader("Cache-Control", "no-store");
    if (result.binary) {
      response.setHeader("Content-Type", result.contentType);
      response.writeHead(result.status);
      response.end(result.binary);
    } else {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.writeHead(result.status);
      response.end(JSON.stringify(result.body));
    }
    return;
  }

  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.writeHead(404);
  response.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found." } }));
});

server.listen(port, host, () => {
  process.stdout.write(`Backend listening on http://${host}:${server.address().port}\n`);
});
