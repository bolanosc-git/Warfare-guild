import assert from "node:assert/strict";
import { test } from "node:test";
import { dungeonById } from "../public/progress-catalog.js";
import { dungeonKills, reportLink } from "./warcraft-logs.js";
import { GET, POST } from "../api/planning.js";

test("a Warcraft Logs import requires a matching character, dungeon, and boss kill", () => {
  const log = reportLink("https://forever.warcraftlogs.com/reports/ABcdEF1234567890#fight=last");
  assert.equal(log.code, "ABcdEF1234567890");
  assert.throws(() => reportLink("https://warcraftlogs.com.example.org/reports/ABcdEF1234567890"), { status: 422 });
  const boss = { encounterID: 99, name: "Boss", kill: true, friendlyPlayers: [6], gameZone: { name: "Wailing Caverns" } };
  const report = {
    masterData: { actors: [{ id: 6, type: "Player", name: "Grum Stormcaller" }, { id: 7, type: "Player", name: "Someone Else" }] },
    fights: [{ ...boss, kill: false }, boss, { ...boss, name: "Wrong party", friendlyPlayers: [7] }]
  };
  assert.deepEqual(dungeonKills(report, { name: "Grum Stormcaller" }, dungeonById.get("wailing-caverns")), ["Boss"]);
  assert.deepEqual(dungeonKills(report, { name: "Grum Stormcaller" }, dungeonById.get("ragefire-chasm")), []);
});

test("guild planning exposes synchronized quests and validates writes", async t => {
  const values = {
    BLIZZARD_CLIENT_ID: "fixture", BLIZZARD_CLIENT_SECRET: "fixture", GUILD_REPORT_TOKEN: "development-fixture-key-only",
    SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_fixture"
  };
  const prior = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  t.after(() => { for (const [key, value] of Object.entries(prior)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  } });
  const actor = (id, name, surname) => ({ character: { id, name, surname, level: 33, playable_class: { id: 7 } }, rank: id });
  const saved = [];
  const eventId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  t.mock.method(globalThis, "fetch", async (target, _options = {}) => {
    const url = new URL(target);
    const opts = _options;
    if (url.hostname === "oauth.battle.net") return Response.json({ access_token: "fixture", expires_in: 3600 });
    if (url.hostname === "us.api.blizzard.com") {
      if (url.pathname.endsWith("/guild/warfare")) return Response.json({ faction: { type: "HORDE" }, ruleset: { id: 2, name: "Normal" } });
      if (url.pathname.endsWith("/roster")) return Response.json({ members: [actor(1, "Grum", "Stormcaller"), actor(2, "Kaela", "Emberveil")] });
      if (url.pathname.endsWith("/quests/completed")) return Response.json({ quests: [{ id: 10, name: "Turned in" }] });
      if (url.pathname.endsWith("/quests")) return Response.json({ in_progress: [{ id: 20, name: "Shared quest" }] });
      if (url.pathname.endsWith("/encounters/dungeons")) return Response.json({});
    }
    if (url.hostname === "fixture.supabase.co") {
      const resource = url.pathname.split("/").at(-1);
      if (opts.method === "POST") saved.push([resource, JSON.parse(opts.body)]);
      if (resource === "guild_events" && opts.method !== "POST") return Response.json([{ starts_at: new Date(Date.now()+60_000).toISOString() }]);
      return Response.json([]);
    }
    throw Error(`Unexpected fixture path: ${url.pathname}`);
  });
  const endpoint = "http://localhost/api/planning";
  const read = async (query) => (await GET(new Request(endpoint+query))).json();
  const send = (body, token = values.GUILD_REPORT_TOKEN) => POST(new Request(endpoint, {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ character: "grum-stormcaller", ...body })
  }));
  const profile = await read("?view=character&slug=grum-stormcaller");
  assert.equal(profile.progress.active.quests[0].name, "Shared quest");
  assert.equal(profile.progress.completed.quests[0].name, "Turned in");
  const group = await read("?view=quests");
  assert.deepEqual(group.matches[0].characters, [1, 2]);
  assert.equal((await send({ action: "wish", dungeon: "ragefire-chasm", item: "Gear" }, "wrong")).status, 401);
  assert.equal((await send({ action: "dungeon", dungeon: "unknown", progress: "cleared" })).status, 422);
  assert.equal((await send({ action: "dungeon", dungeon: "ragefire-chasm", progress: "cleared" })).status, 200);
  assert.equal((await send({ action: "unlock", step: "dalaran-horde-1", done: true })).status, 200);
  assert.equal((await send({ action: "need", name: "Shared quest" })).status, 200);
  assert.equal((await send({ action: "wish", dungeon: "ragefire-chasm", item: "Gear" })).status, 200);
  assert.equal((await send({ action: "event", title: "Run", startsAt: new Date(Date.now()+60_000).toISOString() })).status, 200);
  assert.equal((await send({ action: "rsvp", eventId, role: "Healer", response: "Going" })).status, 200);
  assert.deepEqual(saved.map(([resource, row]) => row.kind ?? resource), ["dungeon", "unlock", "need", "wish", "guild_events", "guild_event_rsvps"]);
});
