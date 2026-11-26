import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { extname, isAbsolute, relative, resolve } from "node:path";
import * as guild from "../api/guild.js";
import * as character from "../api/character.js";
import * as reports from "../api/reports.js";
import * as planning from "../api/planning.js";

const routes = { "/api/guild": guild, "/api/character": character, "/api/reports": reports, "/api/planning": planning };
const mime = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const root = resolve(import.meta.dirname, "../public");
const port = Number(process.env.PORT || 3000);

createServer(async (input, output) => {
  try {
    const url = new URL(input.url, `http://localhost:${port}`);
    if (/^\/(?:group-up|simulations)\/?$/.test(url.pathname)) {
      output.writeHead(308, { Location: url.pathname.includes("simulations") ? "/roster" : "/dungeon-planner" }).end();
      return;
    }
    const route = routes[url.pathname];
    if (route) {
      const handler = route[input.method];
      if (!handler) return output.writeHead(405).end();
      const init = { method: input.method, headers: input.headers };
      if (input.method === "POST") Object.assign(init, { body: Readable.toWeb(input), duplex: "half" });
      const response = await handler(new Request(url, init));
      output.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) return Readable.fromWeb(response.body).pipe(output);
      return output.end();
    }
    const spa = /^\/(?:roster\/?|dungeon-planner\/?|tier-prep\/?|character\/[^/]+(?:\/progress)?\/?|)$/.test(url.pathname);
    const file = spa ? resolve(root, "index.html") : resolve(root, `.${decodeURIComponent(url.pathname)}`);
    const path = relative(root, file);
    if (isAbsolute(path) || path === ".." || path.startsWith("../") || !(await stat(file)).isFile()) return output.writeHead(404).end();
    output.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream" });
    if (input.method === "HEAD") return output.end();
    return createReadStream(file).pipe(output);
  } catch {
    output.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Warfare is running at http://127.0.0.1:${port}`));
