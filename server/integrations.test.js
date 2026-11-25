import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeGear, normalizeProfessions, normalizeTalents } from "./armory.js";
import { importReport, reportDetails, reportReference, reportsWritable } from "./reports.js";

test("Forever profile normalization uses the active specialization group and talent ranks", () => {
  const result = normalizeTalents({ specialization_groups: [
    { is_active: false, specializations: [{ specialization_name: "Arms", spent_points: 20 }] },
    { is_active: true, specializations: [
      { specialization_name: "Fury", spent_points: 31, talents: [{ talent: { id: 166, name: "Cruelty" }, talent_rank: 5 }] }
    ] }
  ] });
  assert.deepEqual(result, [{ name: "Fury", points: 31, talents: [{ name: "Cruelty", spellId: 166, rank: 5 }] }]);
  const gear = normalizeGear({ equipped_items: [{ item: { id: 120 }, name: "Axe", level: { value: 60 } }] })[0];
  assert.equal(gear.level, 60);
  assert.equal(gear.id, 120);
  assert.equal(normalizeProfessions({ primaries: [{ profession: { name: "Mining" }, tiers: [{ skill_points: 284, max_skill_points: 300 }] }] })[0].current, 284);
});

const simId = "06d928d0-e422-4de0-a4a6-e2d2a8204039";
const resultUrl = `https://mythicsim.com/sims/${simId}`;

test("only MythicSim result URLs are accepted for new reports", () => {
  const reference = reportReference(`https://www.mythicsim.com/sims/${simId.toUpperCase()}/?ref=share#dps`);
  assert.equal(reference.url, resultUrl);
  assert.equal(reference.id, "ms06d928d0e4224de0a4a6e2d2a8204039");
  for (const url of [
    `https://mythicsim.com.example.org/sims/${simId}`,
    `https://mythicsim.com@evil.example/sims/${simId}`,
    `https://mythicsim.com:444/sims/${simId}`,
    `https://mythicsim.com/sims/${simId}/extra`,
    `http://mythicsim.com/sims/${simId}`,
    "https://mythicsim.com/wow-forever/sim",
    "https://www.raidbots.com/simbot/report/Example123"
  ]) {
    assert.throws(() => reportReference(url), { status: 422 }, url);
  }
});

test("published sim values require positive numerical DPS and normalize encounter settings", () => {
  assert.deepEqual(reportDetails({ dps: 523.7, scenario: "  Single target,   2 minutes " }),
    { dps: 523.7, scenario: "Single target, 2 minutes" });
  assert.deepEqual(reportDetails({ dps: 523.7 }), { dps: 523.7, scenario: "Quick Sim" });
  for (const invalid of [undefined, null, "523.7", 0, -1, Infinity, 1_000_000_001]) {
    assert.throws(() => reportDetails({ dps: invalid }), { status: 422 });
  }
  assert.throws(() => reportDetails({ dps: 523.7, scenario: "x".repeat(101) }), { status: 422 });
});

test("report imports fail closed without configuration", async () => {
  if (reportsWritable()) return;
  await assert.rejects(importReport(new Request("http://localhost/api/reports", { method: "POST" })), { status: 503 });
});
