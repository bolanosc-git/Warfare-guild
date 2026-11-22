import { HttpError, readJson } from "./http.js";

const hosts = new Set(["warcraftlogs.com", "www.warcraftlogs.com", "forever.warcraftlogs.com", "classic.warcraftlogs.com"]);
const apiOrigin = "https://www.warcraftlogs.com";
const normalize = value => (typeof value === "string" ? value : "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
let credentials;
let pendingToken;

export function logsConfigured() {
  return Boolean(process.env.WCL_CLIENT_ID && process.env.WCL_CLIENT_SECRET);
}

export function reportLink(value) {
  const error = new HttpError(422, "Enter a Warcraft Logs report link.");
  if (typeof value !== "string" || value.length > 300) throw error;
  const url = URL.parse(value);
  const code = /^\/(?:forever\/)?reports\/([A-Za-z0-9]{10,24})\/?$/.exec(url?.pathname)?.[1];
  if (!url || url.protocol !== "https:" || !hosts.has(url.hostname) || url.port || url.username || url.password || !code) throw error;
  return { code, url: `${url.origin}${url.pathname.replace(/\/$/, "")}` };
}

async function accessToken() {
  if (credentials?.expires > Date.now()) return credentials.token;
  pendingToken ??= (async () => {
    const auth = Buffer.from(`${process.env.WCL_CLIENT_ID}:${process.env.WCL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${apiOrigin}/oauth/token`, {
      method: "POST", headers: { Authorization: `Basic ${auth}` },
      body: new URLSearchParams({ grant_type: "client_credentials" }), redirect: "error", signal: AbortSignal.timeout(7500)
    });
    if (!response.ok) throw new HttpError(502, "Warcraft Logs could not authenticate the guild connection.");
    const data = await readJson(response, 32_768);
    if (!data.access_token) throw new HttpError(502, "Warcraft Logs returned an incomplete access token.");
    credentials = { token: data.access_token, expires: Date.now() + Math.max(0, (Number(data.expires_in) - 60) * 1000) };
    return credentials.token;
  })().finally(() => { pendingToken = undefined; });
  return pendingToken;
}

export function dungeonKills(report, character, dungeon) {
  const name = normalize(character.name);
  const actors = (report.masterData?.actors ?? []).filter(actor => actor.type === "Player" && normalize(actor.name) === name);
  const expectedZone = normalize(dungeon.name);
  const fights = report.fights ?? [];
  const kills = new Set();
  for (const fight of fights) {
    if (!fight.kill || !(fight.encounterID > 0) || !actors.some(actor => fight.friendlyPlayers?.includes(actor.id))) continue;
    if (normalize(fight.gameZone?.name) !== expectedZone && normalize(report.zone?.name) !== expectedZone) continue;
    if (typeof fight.name === "string" && fight.name.length <= 100) kills.add(fight.name);
  }
  return [...kills].slice(0, 40);
}

export async function getLoggedKills(link, character, dungeon) {
  if (!logsConfigured()) throw new HttpError(503, "Warcraft Logs importing requires a guild API connection. You can attach the link when recording progress.");
  const response = await fetch(`${apiOrigin}/api/v2/client`, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(12_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}` },
    body: JSON.stringify({
      query: "query GuildDungeon($code: String!) { reportData { report(code: $code) { zone { name } masterData { actors { id name type } } fights { encounterID name kill friendlyPlayers gameZone { name } } } } }",
      variables: { code: link.code }
    })
  });
  if (!response.ok) throw new HttpError(502, "Warcraft Logs could not read this public report.");
  const data = await readJson(response, 2 * 1024 * 1024);
  const report = data.data?.reportData?.report;
  if (!report || data.errors?.length) throw new HttpError(422, "Use a public Warcraft Logs report for this dungeon.");
  const kills = dungeonKills(report, character, dungeon);
  if (!kills.length) throw new HttpError(422, "The report did not confirm a boss kill for this character in the selected dungeon.");
  return kills;
}
