import { armoryConfigured, getGuildMember, getCharacterProgress, getQuestMatches } from "./armory.js";
import { database, databaseConfigured, guildWritesEnabled, validEditor } from "./database.js";
import { HttpError, readJson } from "./http.js";
import { dungeonById, unlockStepIds, roles, rsvpStatuses } from "../public/progress-catalog.js";
import { getLoggedKills, logsConfigured, reportLink } from "./warcraft-logs.js";

const progressTable = "guild_progress";
const eventTable = "guild_events";
const rsvpTable = "guild_event_rsvps";
const progressFields = "character_id,kind,entry_key,data,updated_at";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  const writable = guildWritesEnabled() && armoryConfigured();
  if (view === "quests") {
    return armoryConfigured() ? getQuestMatches() : { checked: 0, matches: [] };
  }
  if (view === "character") {
    if (!armoryConfigured()) return { progress: null, entries: [], writable: false, logs: false };
    const member = await getGuildMember(params.get("slug"));
    const [progress, entries] = await Promise.all([
      getCharacterProgress(member),
      databaseConfigured() ? rows(progressTable, { select: progressFields, character_id: `eq.${member.id}`, order: "kind,entry_key" }) : []
    ]);
    return { progress, entries, writable, logs: logsConfigured() };
  }
  if (view === "group") {
    const entries = databaseConfigured() ? await rows(progressTable, { select: progressFields, kind: "in.(need,wish)", order: "kind,character_id,entry_key" }) : [];
    return { entries, writable };
  }
  if (view === "calendar") {
    if (!databaseConfigured()) return { events: [], writable: false };
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const events = await rows(eventTable, {
      select: "id,character_id,title,starts_at,dungeon_id,details,cancelled,guild_event_rsvps(character_id,role,status)",
      cancelled: "eq.false", starts_at: `gte.${since}`, order: "starts_at,id"
    });
    return { events, writable };
  }
  throw new HttpError(400, "Choose a guild planning view.");
}

function writeOptions(body, preference = "return=representation") {
  return { method: "POST", headers: { "Content-Type": "application/json", Prefer: preference }, body: JSON.stringify(body) };
}

function upsert(table, conflict, body) {
  return database(table, { on_conflict: conflict }, writeOptions(body, "resolution=merge-duplicates,return=representation"));
}

async function saveEntry(character, kind, key, data, remove = false) {
  if (remove) {
    await database(progressTable, { character_id: `eq.${character.id}`, kind: `eq.${kind}`, entry_key: `eq.${key}` }, {
      method: "DELETE", headers: { Prefer: "return=representation" }
    });
    return;
  }
  await upsert(progressTable, "character_id,kind,entry_key", { character_id: character.id, kind, entry_key: key, data, updated_at: new Date().toISOString() });
}

export async function updatePlanning(request) {
  if (!guildWritesEnabled() || !armoryConfigured()) throw new HttpError(503, "Guild publishing is unavailable.");
  if (!validEditor(request)) throw new HttpError(401, "The guild publishing key is invalid.");
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
  if (input.action === "wish") {
    const dungeonId = dungeon(input.dungeon);
    const item = field(input.item, 75, "item name", true);
    const note = field(input.note, 150, "loot note");
    await saveEntry(character, "wish", `${dungeonId}:${normalizedKey(item)}`, { dungeonId, item, note }, input.remove === true);
    return { message: input.remove ? "Wishlist item removed." : "Wishlist item saved." };
  }
  if (input.action === "event") {
    const title = field(input.title, 100, "event title", true);
    const details = field(input.details, 600, "event details");
    const dungeonId = dungeon(input.dungeon, false);
    const startsAt = typeof input.startsAt === "string" ? new Date(input.startsAt) : new Date(NaN);
    if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) throw invalid("Choose a future date and time.");
    if (input.eventId) {
      if (!uuid.test(input.eventId)) throw invalid("Choose a valid guild event.");
      const changes = await database(eventTable, { id: `eq.${input.eventId}`, character_id: `eq.${character.id}`, cancelled: "eq.false" }, {
        ...writeOptions({ title, details, dungeon_id: dungeonId, starts_at: startsAt.toISOString() }), method: "PATCH"
      });
      if (!changes.length) throw new HttpError(404, "Select the character who organized this event.");
      return { message: "Guild event updated." };
    }
    await database(eventTable, {}, writeOptions({ character_id: character.id, title, details, dungeon_id: dungeonId, starts_at: startsAt.toISOString() }));
    return { message: "Guild event added." };
  }
  if (input.action === "rsvp" || input.action === "cancel-event") {
    if (typeof input.eventId !== "string" || !uuid.test(input.eventId)) throw invalid("Choose a valid guild event.");
    if (input.action === "cancel-event") {
      const cancelled = await database(eventTable, { id: `eq.${input.eventId}`, character_id: `eq.${character.id}`, cancelled: "eq.false" }, {
        ...writeOptions({ cancelled: true }), method: "PATCH"
      });
      if (!cancelled.length) throw new HttpError(404, "Select the character who organized this event.");
      return { message: "Guild event cancelled." };
    }
    if (!roles.includes(input.role) || !rsvpStatuses.includes(input.response)) throw invalid("Choose a role and response.");
    const [event] = await database(eventTable, { id: `eq.${input.eventId}`, cancelled: "eq.false", select: "starts_at", limit: "1" });
    if (!event || Date.parse(event.starts_at) <= Date.now()) throw invalid("This event is closed for RSVPs.");
    await upsert(rsvpTable, "event_id,character_id", { event_id: input.eventId, character_id: character.id, role: input.role, status: input.response, updated_at: new Date().toISOString() });
    return { message: "RSVP saved." };
  }
  throw invalid("Choose a valid guild update.");
}
