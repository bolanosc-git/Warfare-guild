import { armoryConfigured, getGuildMember } from "./armory.js";
import { HttpError, readJson } from "./http.js";
import { database, databaseConfigured } from "./database.js";

export const reportsWritable = () => databaseConfigured() && armoryConfigured();

const mythicSimHosts = new Set(["mythicsim.com", "www.mythicsim.com"]);
const raidbotsHosts = new Set(["raidbots.com", "www.raidbots.com", "mimiron.raidbots.com"]);
const resultPath = /^\/sims\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

export function reportReference(value) {
  const message = "Paste the MythicSim result URL from the address bar after Quick Sim finishes.";
  let url;
  try {
    if (typeof value !== "string" || value.length > 240) throw Error();
    url = new URL(value);
  } catch {
    throw new HttpError(422, message);
  }
  const simId = resultPath.exec(url.pathname)?.[1]?.toLowerCase();
  if (url.protocol !== "https:" || !mythicSimHosts.has(url.hostname) || url.port || url.username || url.password || !simId) {
    throw new HttpError(422, message);
  }
  return { id: `ms${simId.replaceAll("-", "")}`, url: `https://mythicsim.com/sims/${simId}` };
}

export function reportDetails(input) {
  const dps = typeof input.dps === "number" ? input.dps : NaN;
  if (!Number.isFinite(dps) || dps <= 0 || dps > 1_000_000_000) {
    throw new HttpError(422, "Enter the DPS shown on the completed Quick Sim result.");
  }
  const scenario = typeof input.scenario === "string" ? input.scenario.trim().replace(/\s+/g, " ") : "";
  if (scenario.length > 100) throw new HttpError(422, "Keep the encounter settings to 100 characters or fewer.");
  return { dps, scenario: scenario || "Quick Sim" };
}

function publicReport(row) {
  const hostname = URL.parse(row.report_url)?.hostname;
  const provider = mythicSimHosts.has(hostname) ? "MythicSim" : raidbotsHosts.has(hostname) ? "Raidbots" : null;
  return {
    id: row.report_id, characterId: row.character_id, characterName: row.character_name,
    dps: Number(row.dps), scenario: row.scenario, url: row.report_url, provider,
    date: row.report_date ?? row.imported_at, dateKind: row.report_date ? "simulated" : "imported"
  };
}


export async function getReports() {
  if (!reportsWritable()) return [];
  const rows = await database("guild_sim_reports", {
    select: "report_id,character_id,character_name,dps,scenario,report_url,report_date,imported_at",
    order: "sort_date.desc,report_id.desc",
    limit: "250"
  });
  return rows.map(publicReport);
}


export async function importReport(request) {
  if (!reportsWritable()) throw new HttpError(503, "Guild report publishing has not been configured.");
  const input = await readJson(request, 4096).catch(() => null);
  if (!input || typeof input.character !== "string") throw new HttpError(422, "Choose a character and enter a MythicSim result URL.");
  const reference = reportReference(input.url);
  const details = reportDetails(input);
  const member = await getGuildMember(input.character);
  const existing = await database("guild_sim_reports", { report_id: `eq.${reference.id}`, limit: "1" });
  if (existing.length) {
    if (existing[0].character_id !== member.id) throw new HttpError(409, "This report is already assigned to another character.");
    return publicReport(existing[0]);
  }
  const row = {
    report_id: reference.id,
    character_id: member.id,
    character_name: member.name,
    report_url: reference.url,
    imported_at: new Date().toISOString(),
    ...details
  };
  const result = await database("guild_sim_reports", { on_conflict: "report_id" }, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(row)
  });
  if (result.length) return publicReport(result[0]);
  const [stored] = await database("guild_sim_reports", { report_id: `eq.${reference.id}`, limit: "1" });
  if (!stored || stored.character_id !== member.id) throw new HttpError(409, "This report is already assigned to another character.");
  return publicReport(stored);
}
