import { HttpError } from "./http.js";

const classNames = { 1: "Warrior", 2: "Paladin", 3: "Hunter", 4: "Rogue", 5: "Priest", 6: "Death Knight", 7: "Shaman", 8: "Mage", 9: "Warlock", 10: "Monk", 11: "Druid", 12: "Demon Hunter", 13: "Evoker" };
const raceNames = { 1: "Human", 2: "Orc", 3: "Dwarf", 4: "Night Elf", 5: "Undead", 6: "Tauren", 7: "Gnome", 8: "Troll", 9: "Goblin", 10: "Blood Elf", 11: "Draenei", 22: "Worgen", 24: "Pandaren" };
const records = Array.isArray;
const localized = value => typeof value === "string" ? value : value?.en_US ?? value?.en_GB ?? value?.name?.en_US ?? "";
const fallback = (value, replacement) => localized(value) || replacement;
const numeric = value => typeof value === "number" && Number.isFinite(value) ? value : null;
const list = value => records(value) ? value : [];
const slugPattern = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}-]{0,99}$/u;
let token;
let pendingToken;
let roster;
let pendingRoster;

export function armoryConfigured() {
  const id = Boolean(process.env.BLIZZARD_CLIENT_ID);
  const secret = Boolean(process.env.BLIZZARD_CLIENT_SECRET);
  if (id !== secret) throw new HttpError(503, "The Battle.net credentials are incomplete.");
  return id && secret;
}

function config() {
  const region = (process.env.BLIZZARD_REGION || "us").toLowerCase();
  const guild = (process.env.BLIZZARD_GUILD_SLUG || "warfare").toLowerCase();
  const ruleset = process.env.BLIZZARD_RULESET_ID;
  if (!["us", "eu", "kr", "tw"].includes(region) || !slugPattern.test(guild) || (ruleset && !/^\d{1,3}$/.test(ruleset))) {
    throw new HttpError(503, "The Warcraft guild settings are invalid.");
  }
  return { region, guild, ruleset };
}

async function getToken() {
  if (token?.expires > Date.now()) return token.value;
  pendingToken ??= (async () => {
    const credentials = Buffer.from(`${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`).toString("base64");
    const response = await fetch("https://oauth.battle.net/token", {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      signal: AbortSignal.timeout(7500)
    });
    if (!response.ok) throw new HttpError(502, "Battle.net could not authenticate the Armory connection.");
    const data = await response.json();
    if (!data.access_token) throw new HttpError(502, "Battle.net returned an incomplete token.");
    token = { value: data.access_token, expires: Date.now() + Math.max(0, (Number(data.expires_in) - 60) * 1000) };
    return token.value;
  })().finally(() => { pendingToken = undefined; });
  return pendingToken;
}

async function blizzard(path) {
  const { region } = config();
  const url = new URL(path, `https://${region}.api.blizzard.com`);
  url.search = new URLSearchParams({ namespace: `profile-forever-${region}`, locale: "en_US" });
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${await getToken()}` },
    signal: AbortSignal.timeout(7500),
    redirect: "error"
  });
  if (response.status === 404) return { data: null };
  if (response.status === 401) token = undefined;
  if (!response.ok) throw new HttpError(502, "Blizzard’s Armory is temporarily unavailable.");
  return { data: await response.json(), updatedAt: response.headers.get("last-modified") };
}

function normalizeMember({ character, rank }) {
  if (!character || !Number.isSafeInteger(character.id) || !character.name) return null;
  const name = [localized(character.name), localized(character.surname)].filter(Boolean).join(" ");
  const slug = character.slug || name.toLowerCase().replace(/\s+/g, "-");
  if (!name || !slugPattern.test(slug)) return null;
  const playableClass = character.playable_class;
  const race = character.playable_race;
  return {
    id: character.id,
    slug,
    name,
    rank: numeric(rank),
    level: numeric(character.level),
    className: fallback(playableClass?.name, classNames[playableClass?.id] ?? "Unknown class"),
    race: fallback(race?.name, raceNames[race?.id] ?? "")
  };
}

export async function getGuild() {
  if (roster?.expires > Date.now()) return roster.value;
  pendingRoster ??= (async () => {
    const { region, guild, ruleset } = config();
    const path = `/data/wow/guild/${encodeURIComponent(guild)}`;
    const [guildResponse, rosterResponse] = await Promise.all([blizzard(path), blizzard(`${path}/roster`)]);
    const data = guildResponse.data;
    if (!data || !Array.isArray(rosterResponse.data?.members)) {
      throw new HttpError(503, "Warfare’s roster could not be found in the configured Blizzard region.");
    }
    if (data.faction?.type !== "HORDE" || (ruleset && Number(ruleset) !== data.ruleset?.id)) {
      throw new HttpError(503, "The Armory returned a guild that does not match Warfare’s faction or ruleset.");
    }
    const members = rosterResponse.data.members.map(normalizeMember).filter(Boolean);
    members.sort((left, right) => (left.rank ?? Infinity) - (right.rank ?? Infinity) || left.name.localeCompare(right.name));
    const value = { region, ruleset: localized(data.ruleset?.name), faction: "Horde", members };
    roster = { value, expires: Date.now() + 300_000 };
    return value;
  })().finally(() => { pendingRoster = undefined; });
  return pendingRoster;
}

export async function getGuildMember(slug) {
  if (!slug || !slugPattern.test(slug)) throw new HttpError(400, "Choose a valid character.");
  const { members } = await getGuild();
  const member = members.find(entry => entry.slug === slug);
  if (!member) throw new HttpError(404, "This character was not found in Warfare’s roster.");
  return member;
}

export function normalizeGear(data) {
  return list(data?.equipped_items).map(item => ({
    slot: fallback(item.slot?.name, item.slot?.type?.replaceAll("_", " ") ?? "Equipment"),
    name: fallback(item.name, "Unknown item"),
    level: numeric(item.level?.value),
    qualityLabel: localized(item.quality?.name),
    enchant: list(item.enchantments).map(enchant => localized(enchant.display_string)).filter(Boolean).join(", ")
  }));
}

export function normalizeTalents(data) {
  const groups = list(data?.specialization_groups);
  const activeGroup = groups.find(group => group.is_active) ?? groups[0];
  const trees = list(activeGroup?.specializations ?? data?.specializations);
  return trees.map(tree => ({
    name: fallback(tree.specialization_name ?? tree.specialization?.name ?? tree.name, "Talent tree"),
    points: numeric(tree.spent_points ?? tree.points_spent),
    talents: list(tree.talents ?? tree.selected_talents).map(talent => ({
      name: fallback(talent.talent?.name ?? talent.spell_tooltip?.spell?.name ?? talent.name, "Talent"),
      rank: numeric(talent.talent_rank ?? talent.rank ?? talent.rank_used)
    }))
  }));
}

export function normalizeProfessions(data) {
  return [["Primary", list(data?.primaries)], ["Secondary", list(data?.secondaries)]].flatMap(([group, professions]) =>
    professions.flatMap(profession => {
      const name = fallback(profession.profession?.name ?? profession.name, "Profession");
      const tiers = list(profession.tiers);
      return (tiers.length ? tiers : [profession]).map(tier => ({
        name, group, tier: localized(tier.tier?.name),
        current: numeric(tier.skill_points ?? tier.current_skill_points),
        max: numeric(tier.max_skill_points)
      }));
    })
  );
}

export async function getCharacter(slug) {
  const member = await getGuildMember(slug);
  const { region, guild } = config();
  const path = `/profile/wow/character/${encodeURIComponent(slug)}`;
  const [{ data: profile, updatedAt }, equipment, talents, professions] = await Promise.all([
    blizzard(path), blizzard(`${path}/equipment`), blizzard(`${path}/specializations`), blizzard(`${path}/professions`)
  ]);
  const emptyProfile = { ...member, gear: [], talents: [], professions: [] };
  if (!profile || profile.id !== member.id || (profile.guild?.slug && profile.guild.slug !== guild)) {
    const profileUnavailable = member.level < 10
      ? "Blizzard publishes character details from level 10 after the character logs out."
      : "Blizzard has not published the detailed profile for this roster entry.";
    return { ...emptyProfile, profileUnavailable };
  }
  const locale = region === "eu" ? "en-gb" : region === "kr" ? "ko-kr" : region === "tw" ? "zh-tw" : "en-us";
  return {
    ...member,
    updatedAt: updatedAt || null,
    level: numeric(profile.level) ?? member.level,
    race: fallback(profile.race?.name, member.race),
    itemLevel: numeric(profile.equipped_item_level ?? profile.average_item_level),
    armoryUrl: `https://worldofwarcraft.blizzard.com/${locale}/forever/${region}/armory/character/${encodeURIComponent(slug)}`,
    gear: normalizeGear(equipment.data),
    talents: normalizeTalents(talents.data),
    professions: normalizeProfessions(professions.data)
  };
}

const activeQuestCache = new Map();

function questEntries(entries) {
  return list(entries).flatMap(entry => {
    const quest = entry?.quest ?? entry;
    return Number.isSafeInteger(quest?.id) ? [{ id: quest.id, name: localized(quest.name) || `Quest #${quest.id}` }] : [];
  });
}

async function activeQuestLog(member) {
  const previous = activeQuestCache.get(member.id);
  if (previous?.expires > Date.now()) return previous.result;
  const path = `/profile/wow/character/${encodeURIComponent(member.slug)}/quests`;
  const result = blizzard(path).then(({ data, updatedAt }) => ({
    available: data !== null,
    quests: questEntries(data?.in_progress ?? data?.active_quests),
    updatedAt: updatedAt || null
  })).catch(() => ({ available: false, quests: [], updatedAt: null }));
  activeQuestCache.set(member.id, { expires: Date.now() + 300_000, result });
  return result;
}

const rejectUnreported = response => ({ data: response.status === "fulfilled" ? response.value.data : null });

export async function getCharacterProgress(member) {
  const path = `/profile/wow/character/${encodeURIComponent(member.slug)}`;
  const [active, completedResponse, encountersResponse] = await Promise.allSettled([
    activeQuestLog(member), blizzard(`${path}/quests/completed`), blizzard(`${path}/encounters/dungeons`)
  ]);
  const completed = rejectUnreported(completedResponse).data;
  const encounters = rejectUnreported(encountersResponse).data;
  return {
    active: active.value ?? { available: false, quests: [], updatedAt: null },
    completed: { available: completed !== null, quests: questEntries(completed?.quests) },
    encounters: list(encounters?.expansions).flatMap(expansion => list(expansion.instances).flatMap(instance => {
      const name = localized(instance.instance?.name);
      const modes = list(instance.modes).filter(mode => mode.progress?.completed_count > 0);
      if (!name || !modes.length) return [];
      const fullClear = modes.some(mode => mode.progress.total_count > 0 && mode.progress.completed_count >= mode.progress.total_count);
      return [{ name, status: fullClear ? "cleared" : "partial" }];
    })),
    checkedAt: new Date().toISOString()
  };
}

export async function getQuestMatches() {
  const { members } = await getGuild();
  const eligible = members.filter(member => member.level >= 10);
  const matches = new Map();
  let checked = 0;
  for (let index = 0; index < eligible.length; index += 8) {
    const batch = eligible.slice(index, index + 8);
    const logs = await Promise.all(batch.map(activeQuestLog));
    logs.forEach((log, memberIndex) => {
      if (!log.available) return;
      checked++;
      for (const quest of log.quests) {
        if (!matches.has(quest.id)) matches.set(quest.id, { ...quest, characters: [] });
        const characters = matches.get(quest.id).characters;
        if (!characters.includes(batch[memberIndex].id)) characters.push(batch[memberIndex].id);
      }
    });
  }
  return { checked, matches: [...matches.values()].filter(quest => quest.characters.length > 1).sort((a, b) => b.characters.length - a.characters.length || a.name.localeCompare(b.name)) };
}
