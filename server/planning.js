import { armoryConfigured, getGuildMember, getCharacterProgress, getGuildQuestStatus, getQuestMatches } from "./armory.js";
import { database, databaseConfigured } from "./database.js";
import { HttpError, readJson } from "./http.js";
import { dungeonById, unlockStepIds } from "../public/progress-catalog.js";
import { getLoggedKills, logsConfigured, reportLink } from "./warcraft-logs.js";

const progressTable = "guild_progress";
const signupsTable = "guild_dungeon_signups";
const progressFields = "character_id,kind,entry_key,data,updated_at";
const invalid = message => new HttpError(422, message);

function field(value, limit, label, required = false) {
  if (value == null && !required) return "";
  if (typeof value !== "string") throw invalid(`Enter a valid ${label}.`);
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > limit || (required && !text)) throw invalid(`Enter a ${label} of up to ${limit} characters.`);
  return text;
}

function dungeon(value, required = true) {
  if (!required && !value) return null;
  if (!dungeonById.has(value)) throw invalid("Choose a dungeon from the list.");
  return value;
}

function normalizedKey(value) {
  return value.normalize("NFKC").toLowerCase();
}

async function rows(table, query) {
  const all = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const page = await database(table, { ...query, limit: String(size), offset: String(offset) });
    all.push(...page);
    if (page.length < size) return all;
  }
}

export async function getPlanning(request) {
  const params = new URL(request.url).searchParams;
  const view = params.get("view");
  const writable = databaseConfigured() && armoryConfigured();
  if (view === "quests") {
    return armoryConfigured() ? getQuestMatches() : { checked: 0, matches: [] };
  }
  if (view === "planner") {
    const [questStatus, entries, signups] = await Promise.all([
      armoryConfigured() ? getGuildQuestStatus() : Promise.resolve({ checked: 0, characters: [], checkedAt: new Date().toISOString() }),
      databaseConfigured() ? rows(progressTable, { select: progressFields, kind: "in.(dungeon,dungeon-log,need)", order: "kind,character_id,entry_key" }) : [],
      databaseConfigured() ? rows(signupsTable, { select: "dungeon_id,character_id,role,note,updated_at", order: "dungeon_id,role,character_id" }) : []
    ]);
    return { ...questStatus, entries, signups, writable: databaseConfigured() && armoryConfigured() };
  }
  if (view === "character") {
    if (!armoryConfigured()) return { progress: null, entries: [], writable: false, logs: false };
    const member = await getGuildMember(params.get("slug"));
    const [progress, entries] = await Promise.all([
      getCharacterProgress(member),
      databaseConfigured() ? rows(progressTable, { select: progressFields, character_id: `eq.${member.id}`, kind: "in.(dungeon,dungeon-log,unlock,need)", order: "kind,entry_key" }) : []
    ]);
    return { progress, entries, writable, logs: logsConfigured() };
  }
  if (view === "group") {
    const entries = databaseConfigured() ? await rows(progressTable, { select: progressFields, kind: "eq.need", order: "character_id,entry_key" }) : [];
    return { entries, writable };
  }
  throw new HttpError(400, "Choose a guild planning view.");
}

async function saveEntry(character, kind, key, data, remove = false) {
  if (remove) {
    await database(progressTable, { character_id: `eq.${character.id}`, kind: `eq.${kind}`, entry_key: `eq.${key}` }, {
      method: "DELETE", headers: { Prefer: "return=representation" }
    });
    return;
  }
  await database(progressTable, { on_conflict: "character_id,kind,entry_key" }, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ character_id: character.id, kind, entry_key: key, data, updated_at: new Date().toISOString() })
  });
}

async function saveSignup(character, dungeonId, role, note, remove = false) {
  if (remove) {
    await database(signupsTable, { character_id: `eq.${character.id}`, dungeon_id: `eq.${dungeonId}` }, {
      method: "DELETE", headers: { Prefer: "return=representation" }
    });
    return;
  }
  await database(signupsTable, { on_conflict: "dungeon_id,character_id" }, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ dungeon_id: dungeonId, character_id: character.id, role, note, updated_at: new Date().toISOString() })
  });
}

export async function updatePlanning(request) {
  if (!databaseConfigured() || !armoryConfigured()) throw new HttpError(503, "Guild publishing is unavailable.");
  const input = await readJson(request, 8192).catch(() => null);
  if (!input || typeof input.character !== "string") throw invalid("Choose a guild character.");
  const character = await getGuildMember(input.character);
  if (input.action === "dungeon" || input.action === "import-log") {
    const key = dungeon(input.dungeon);
    if (input.action === "import-log") {
      const log = reportLink(input.log);
      const kills = await getLoggedKills(log, character, dungeonById.get(key));
      await saveEntry(character, "dungeon-log", key, { status: "partial", log: log.url, kills });
      return { message: `Imported ${kills.length} logged boss ${kills.length === 1 ? "kill" : "kills"}.` };
    }
    if (!["none", "partial", "cleared"].includes(input.progress)) throw invalid("Choose a dungeon status.");
    const log = input.log ? reportLink(input.log).url : "";
    const note = field(input.note, 200, "dungeon note");
    await saveEntry(character, "dungeon", key, { status: input.progress, note, log }, input.progress === "none");
    return { message: "Dungeon progress saved." };
  }
  if (input.action === "unlock") {
    if (!unlockStepIds.has(input.step) || typeof input.done !== "boolean") throw invalid("Choose a valid unlock step.");
    await saveEntry(character, "unlock", input.step, { done: input.done }, !input.done);
    return { message: "Unlock checklist updated." };
  }
  if (input.action === "need") {
    const dungeonId = dungeon(input.dungeon, false);
    const name = dungeonId ? dungeonById.get(dungeonId).name : field(input.name, 85, "quest name", true);
    const key = dungeonId ? `dungeon:${dungeonId}` : `quest:${normalizedKey(name)}`;
    await saveEntry(character, "need", key, { name, dungeonId }, input.remove === true);
    return { message: input.remove ? "Group request removed." : "Group request shared." };
  }
  if (input.action === "signup") {
    const dungeonId = dungeon(input.dungeon);
    if (input.remove === true) {
      await saveSignup(character, dungeonId, "Flexible", "", true);
      return { message: "Run sign-up removed." };
    }
    if (!["Tank", "Healer", "DPS", "Flexible"].includes(input.role)) throw invalid("Choose a valid party role.");
    const note = field(input.note, 140, "run note");
    await saveSignup(character, dungeonId, input.role, note);
    return { message: "Run sign-up saved." };
  }
  throw invalid("Choose a valid guild update.");
}
