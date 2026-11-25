import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDungeonPlan } from "./planning.js";
import { dungeonQuestById } from "./dungeon-quests.js";
import { simCoverage, tierPrepPage } from "./tier-prep.js";

test("dungeon recommendations prioritize shared active quests and expose completion counts", () => {
  const guide = dungeonQuestById.get("hall-of-thanes");
  const questId = guide.quests[0].id;
  const data = { characters: [
    { id: 1, name: "Grum", slug: "grum", level: 15, activeAvailable: true, completedAvailable: true, activeQuestIds: [questId], completedQuestIds: [] },
    { id: 2, name: "Kaela", slug: "kaela", level: 16, activeAvailable: true, completedAvailable: true, activeQuestIds: [questId], completedQuestIds: [questId] }
  ] };
  const plan = buildDungeonPlan(data);
  assert.equal(plan[0].dungeon.id, "hall-of-thanes");
  assert.equal(plan[0].shared, 1);
  assert.deepEqual(plan[0].quests.find(quest => quest.id === questId).active.map(member => member.id), [1, 2]);
  assert.equal(plan[0].quests.find(quest => quest.id === questId).completed, 1);
});

test("sim coverage marks recent results and Tier 1 prep includes a path to the planner", () => {
  const now = Date.parse("2026-11-24T12:00:00Z");
  const members = [
    { id: 1, slug: "grum", name: "Grum", level: 60 },
    { id: 2, slug: "kaela", name: "Kaela", level: 55 }
  ];
  const reports = [{ characterId: 1, date: new Date(now - 5 * 86400000).toISOString(), dps: 100 }];
  const coverage = simCoverage(members, reports, now);
  assert.equal(coverage.current, 1);
  assert.equal(coverage.total, 2);
  const page = tierPrepPage(members, reports);
  assert.match(page, /Open dungeon planner/);
  assert.match(page, /December 9, 2026/);
});
