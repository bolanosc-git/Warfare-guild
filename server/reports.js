import { createHash, timingSafeEqual } from "node:crypto";
import { armoryConfigured, getGuildMember } from "./armory.js";
import { HttpError, readJson } from "./http.js";

const hosts = ["www.raidbots.com", "raidbots.com", "mimiron.raidbots.com"];
export const reportsConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
export const reportsWritable = () => reportsConfigured() && (process.env.GUILD_REPORT_TOKEN?.length ?? 0) >= 24;

export function reportReference(value) {
  let url;
  try {
    if (typeof value !== "string" || value.length > 240) throw Error();
    url = new URL(value);
  } catch {
    throw new HttpError(422, "Enter a completed Raidbots report URL.");
  }
  const id = /^\/simbot\/report\/([A-Za-z0-9]{8,64})\/?$/.exec(url.pathname)?.[1];
  if (url.protocol !== "https:" || !hosts.includes(url.hostname) || url.port || url.username || url.password || !id) {
    throw new HttpError(422, "Enter a completed Raidbots report URL.");
  }
  const host = url.hostname === "mimiron.raidbots.com" ? url.hostname : "www.raidbots.com";
  return { id, url: `https://${host}/simbot/report/${id}` };
}

const normalizeName = name => name.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
const asString = value => typeof value === "string" ? value : "";
const styles = { patchwerk: "Patchwerk", hecticaddcleave: "Hectic Add Cleave", dungeonslice: "Dungeon Slice", trainingdummy: "Training Dummy", castingpatchwerk: "Casting Patchwerk" };

export function parseReport(data, member, reference, importedAt = new Date()) {
  const type = asString(data.simbot?.simType ?? data.simbot?.type).toLowerCase().replace(/[^a-z]/g, "");
  if ((type && !["quick", "quicksim"].includes(type)) || data.sim?.profilesets?.results?.length) {
    throw new HttpError(422, "Use an individual Quick Sim report for this character.");
  }
  const players = data.sim?.players;
  const name = normalizeName(member.name);
  const firstName = member.name.trim().split(/\s+/)[0];
  const named = Array.isArray(players) ? players.filter(player => normalizeName(asString(player?.name)) === name) : [];
  const actor = named.length === 1 ? named[0]
    : Array.isArray(players) && players.length === 1 && normalizeName(asString(players[0]?.name)) === normalizeName(firstName) ? players[0] : null;
  const dps = actor?.collected_data?.dps?.mean;
  if (typeof dps !== "number" || !Number.isFinite(dps) || dps <= 0 || dps > 1_000_000_000) {
    throw new HttpError(422, "The report did not contain a valid DPS result for the selected character.");
  }
  const metadata = data.simbot ?? {};
  const options = data.sim?.options ?? {};
  const simOptions = metadata.simc ?? metadata.job?.simc ?? {};
  const style = asString(simOptions.fightStyle ?? options.fight_style);
  const seconds = Number(simOptions.fightLength ?? options.max_time);
  const targets = Number(simOptions.enemyCount ?? options.desired_targets);
  const scenario = [
    styles[style.toLowerCase()] ?? (style.replace(/[^a-z0-9 _-]/gi, "").slice(0, 55) || "Quick Sim"),
    Number.isInteger(targets) && targets > 0 ? (targets === 1 ? "1 target" : `${targets} targets`) : "",
    Number.isFinite(seconds) && seconds > 0 ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s` : ""
  ].filter(Boolean).join(" · ");
  const rawDate = metadata.createdAt ?? metadata.job?.createdAt ?? data.sim?.options?.timestamp ?? data.timestamp;
  const date = typeof rawDate === "number" && rawDate > 0
    ? new Date(rawDate < 10_000_000_000 ? rawDate * 1000 : rawDate)
    : typeof rawDate === "string" ? new Date(rawDate) : null;
  return {
    report_id: reference.id,
    character_id: member.id,
    character_name: member.name,
    dps,
    scenario,
    report_url: reference.url,
    report_date: date && Number.isFinite(date.getTime()) ? date.toISOString() : null,
    imported_at: importedAt.toISOString()
  };
}

function publicReport(row) {
  return {
    id: row.report_id, characterId: row.character_id, characterName: row.character_name,
    dps: Number(row.dps), scenario: row.scenario, url: row.report_url,
    date: row.report_date ?? row.imported_at, dateKind: row.report_date ? "simulated" : "imported"
  };
}

async function database(search, options = {}) {
  const origin = new URL(process.env.SUPABASE_URL);
  if (origin.protocol !== "https:" || origin.username || origin.password) {
    throw new HttpError(503, "The simulation database URL is invalid.");
  }
  const url = new URL("/rest/v1/guild_sim_reports", origin);
  url.search = new URLSearchParams(search);
  const key = process.env.SUPABASE_SECRET_KEY;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
      ...options.headers
    },
    redirect: "error",
    signal: AbortSignal.timeout(7500)
  });
  if (!response.ok) throw new HttpError(502, "The simulation database is temporarily unavailable.");
  return response.json();
}

export async function getReports() {
  if (!reportsConfigured() || !armoryConfigured()) return [];
  const rows = await database({
    select: "report_id,character_id,character_name,dps,scenario,report_url,report_date,imported_at",
    order: "sort_date.desc,report_id.desc",
    limit: "250"
  });
  return rows.map(publicReport);
}

function validEditor(request) {
  const expected = process.env.GUILD_REPORT_TOKEN;
  const presented = request.headers.get("Authorization")?.match(/^Bearer (.{1,256})$/i)?.[1];
  if (!presented) return false;
  const hash = value => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(expected), hash(presented));
}

export async function importReport(request) {
  if (!reportsWritable() || !armoryConfigured()) throw new HttpError(503, "Guild report publishing has not been configured.");
  if (!validEditor(request)) throw new HttpError(401, "The guild publishing key is invalid.");
  const input = await readJson(request, 4096).catch(() => null);
  if (!input || typeof input.character !== "string") throw new HttpError(422, "Choose a character and enter a Raidbots report URL.");
  const reference = reportReference(input.url);
  const member = await getGuildMember(input.character);
  const existing = await database({ report_id: `eq.${reference.id}`, limit: "1" });
  if (existing.length) {
    if (existing[0].character_id !== member.id) throw new HttpError(409, "This report is already assigned to another character.");
    return publicReport(existing[0]);
  }
  let data;
  try {
    const response = await fetch(`${reference.url}/data.json`, { signal: AbortSignal.timeout(12_000), redirect: "error" });
    if (!response.ok) throw Error();
    data = await readJson(response, 16 * 1024 * 1024);
  } catch {
    throw new HttpError(422, "Raidbots could not provide this report. Check that it is complete, shared, and still available.");
  }
  if (!data || typeof data !== "object") throw new HttpError(422, "Raidbots did not return a readable report.");
  const row = parseReport(data, member, reference);
  const result = await database({ on_conflict: "report_id" }, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(row)
  });
  if (result.length) return publicReport(result[0]);
  const [stored] = await database({ report_id: `eq.${reference.id}`, limit: "1" });
  if (!stored || stored.character_id !== member.id) throw new HttpError(409, "This report is already assigned to another character.");
  return publicReport(stored);
}
