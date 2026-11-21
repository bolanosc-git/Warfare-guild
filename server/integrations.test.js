import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeGear, normalizeProfessions, normalizeTalents } from "./armory.js";
import { importReport, parseReport, reportReference } from "./reports.js";

test("Forever profile normalization uses the active specialization group and talent ranks", () => {
  const result = normalizeTalents({ specialization_groups: [
    { is_active: false, specializations: [{ specialization_name: "Arms", spent_points: 20 }] },
    { is_active: true, specializations: [
      { specialization_name: "Fury", spent_points: 31, talents: [{ talent: { name: "Cruelty" }, talent_rank: 5 }] }
    ] }
  ] });
  assert.deepEqual(result, [{ name: "Fury", points: 31, talents: [{ name: "Cruelty", rank: 5 }] }]);
  assert.equal(normalizeGear({ equipped_items: [{ name: "Axe", level: { value: 60 } }] })[0].level, 60);
  assert.equal(normalizeProfessions({ primaries: [{ profession: { name: "Mining" }, tiers: [{ skill_points: 284, max_skill_points: 300 }] }] })[0].current, 284);
});

const reference = reportReference("https://www.raidbots.com/simbot/report/Example123?share=true");
const member = { id: 22, name: "Tharok Ironhide" };
const quickSim = { simbot: { type: "quick", createdAt: "2026-11-18T18:00:00Z" }, sim: {
  options: { max_time: 300, fight_style: "Patchwerk", desired_targets: 1 },
  players: [{ name: "Tharok Ironhide", collected_data: { dps: { mean: 1234.5 } } }]
} };

test("report parser rejects unrelated hosts, other characters, and gear-comparison reports", () => {
  assert.throws(() => reportReference("https://raidbots.com.example.org/simbot/report/Example123"), { status: 422 });
  assert.throws(() => parseReport(quickSim, { id: 23, name: "Other Person" }, reference), { status: 422 });
  assert.throws(() => parseReport({ ...quickSim, simbot: { type: "top_gear" } }, member, reference), { status: 422 });
  assert.equal(reference.url, "https://www.raidbots.com/simbot/report/Example123");
  const parsed = parseReport(quickSim, member, reference);
  assert.equal(parsed.dps, 1234.5);
  assert.equal(parsed.scenario, "Patchwerk · 1 target · 5m 0s");
  assert.equal(parsed.report_date, "2026-11-18T18:00:00.000Z");
  assert.equal(parseReport({ ...quickSim, simbot: { type: "quick" } }, member, reference).report_date, null);
});

test("report imports fail closed without configuration", async () => {
  if (process.env.GUILD_REPORT_TOKEN) return;
  await assert.rejects(importReport(new Request("http://localhost/api/reports", { method: "POST" })), { status: 503 });
});
