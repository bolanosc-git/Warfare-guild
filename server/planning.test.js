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
    BLIZZARD_CLIENT_ID: "fixture", BLIZZARD_CLIENT_SECRET: "fixture",
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
  const reads = [];
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
      assert.equal(url.pathname, "/rest/v1/guild_progress");
      if (opts.method === "POST") {
        const body = JSON.parse(opts.body);
        saved.push(body);
        return Response.json([body]);
      }
      if (url.pathname.endsWith("guild_progress")) reads.push(url.searchParams.get("kind"));
      return Response.json([]);
    }
    throw Error(`Unexpected fixture path: ${url.pathname}`);
  });
  const endpoint = "http://localhost/api/planning";
  const read = async (query) => (await GET(new Request(endpoint+query))).json();
  const send = body => POST(new Request(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character: "grum-stormcaller", ...body })
  }));
  const profile = await read("?view=character&slug=grum-stormcaller");
  assert.equal(profile.writable, true);
  assert.equal(profile.progress.active.quests[0].name, "Shared quest");
  assert.equal(profile.progress.completed.quests[0].name, "Turned in");
  const planner = await read("?view=planner");
  assert.equal(planner.checked, 2);
  assert.equal(planner.characters[0].activeQuestIds[0], 20);
  assert.equal(planner.writable, true);
  assert.equal((await send({ action: "dungeon", dungeon: "unknown", progress: "cleared" })).status, 422);
  assert.equal((await send({ action: "dungeon", dungeon: "ragefire-chasm", progress: "cleared" })).status, 200);
  assert.equal((await send({ action: "unlock", step: "dalaran-horde-1", done: true })).status, 200);
  assert.equal((await GET(new Request(endpoint + "?view=calendar"))).status, 400);
  assert.equal((await GET(new Request(endpoint + "?view=group"))).status, 400);
  assert.deepEqual(reads, ["in.(dungeon,dungeon-log,unlock)", "in.(dungeon,dungeon-log)"]);
  for (const action of ["wish", "event", "rsvp", "cancel-event", "need", "signup"]) {
    assert.equal((await send({ action })).status, 422);
  }
  assert.deepEqual(saved.map(row => row.kind), ["dungeon", "unlock"]);
});
