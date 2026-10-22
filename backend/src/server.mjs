import { createServer } from "node:http";
import { getSession } from "./session.mjs";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3001);

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200);
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (request.method === "GET" && request.url === "/api/session") {
    const result = await getSession(request.headers.authorization, process.env);
    response.setHeader("Cache-Control", "no-store");
    response.writeHead(result.status);
    response.end(JSON.stringify(result.body));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found." } }));
});

server.listen(port, host, () => {
  process.stdout.write(`Backend listening on http://${host}:${server.address().port}\n`);
});
