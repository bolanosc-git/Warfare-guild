import { esc, dateLabel, intro, panel } from "./ui.js";

const tierOne = new Date("2026-12-09T00:00:00Z");
const day = 24 * 60 * 60 * 1000;

function reportDate(report) {
  const date = new Date(report.date ?? report.importedAt ?? "");
  return Number.isNaN(date.getTime()) ? null : date;
}

export function simCoverage(members, reports, now = Date.now()) {
  const latestByCharacter = new Map();
  for (const report of reports) {
    const date = reportDate(report);
    if (!date) continue;
    const previous = latestByCharacter.get(report.characterId);
    if (!previous || date > previous.date) latestByCharacter.set(report.characterId, { report, date });
  }
  const entries = members.map(member => {
    const record = latestByCharacter.get(member.id);
    const current = Boolean(record && now - record.date.getTime() <= 30 * day && now >= record.date.getTime());
    return { member, report: record?.report ?? null, date: record?.date ?? null, current };
  });
  return { entries, current: entries.filter(entry => entry.current).length, total: members.length };
}

export function tierPrepPage(members, reports) {
  const coverage = simCoverage(members, reports);
  const level60 = members.filter(member => member.level >= 60).length;
  const remaining = Math.ceil((tierOne.getTime() - Date.now()) / day);
  const timer = remaining > 0 ? `${remaining} days until Tier 1` : `Tier 1 launched ${dateLabel(tierOne)}`;
  const gaps = coverage.entries.filter(entry => !entry.current);
  const missing = gaps.length ? gaps.map(({ member, report, date }) => `<div class="detail-row line"><span><a href="/character/${encodeURIComponent(member.slug)}" data-nav><strong>${esc(member.name)}</strong></a><small>${report && date ? `Last sim ${dateLabel(date)}` : "No published sim"}</small></span><a class="link" href="https://mythicsim.com/wow-forever/sim" target="_blank" rel="noopener">Run Quick Sim</a></div>`).join("") : '<p class="empty">Every roster character has a sim from the last 30 days.</p>';
  const checklist = [
    `<li><strong>Reach level 60</strong><span>${level60} of ${members.length} roster characters are level 60.</span></li>`,
    `<li><strong>Refresh Quick Sims</strong><span>${coverage.current} of ${coverage.total} characters have a result from the last 30 days.</span></li>`,
    '<li><strong>Review Best Gear</strong><span>Use the current MythicSim addon export to compare bag upgrades after gear changes.</span></li>',
    '<li><strong>Record dungeon needs</strong><span>Use Warfare’s planner to find shared guide quests and build a party.</span></li>'
  ].join("");
  return intro("Tier 1 readiness", "A shared prep board for Warfare’s first WoW Forever content tier.", { eyebrow: timer }) + `
    <div class="frame content tier-grid">
      ${panel("Readiness checklist", "Tier 1 begins December 9, 2026, according to MythicSim’s Forever roadmap.", `<ul class="readiness-list">${checklist}</ul>`, '<a class="link" href="https://mythicsim.com/wow-forever" target="_blank" rel="noopener">MythicSim roadmap</a>')}
      ${panel("Sim coverage", "A recent snapshot helps compare builds; it is not a raid ranking.", `<div class="coverage-meter"><strong>${coverage.current}/${coverage.total}</strong><span>characters simulated in the last 30 days</span></div>${missing}`, '<a class="link" href="/simulations" data-nav>All sim reports</a>')}
      ${panel("MythicSim workflow", "The simulator currently runs on MythicSim’s site.", '<ol class="steps-list"><li>Install the MythicSim Forever Exporter addon.</li><li>In game, run <code>/msim</code> and copy the character export.</li><li>Paste the export into MythicSim and run Quick Sim or Best Gear.</li><li>Publish the result URL and DPS on Warfare’s Simulations page.</li></ol>', '<a class="button primary" href="https://mythicsim.com/wow-forever/sim" target="_blank" rel="noopener">Open MythicSim</a>')}
      ${panel("Choose the next dungeon", "Use shared Armory quest status and level ranges to plan what the guild should tackle next.", '<a class="button primary" href="/dungeon-planner" data-nav>Open dungeon planner</a>')}
      <p class="panel-note tier-disclaimer">Warfare tracks submitted MythicSim results; simulations run on MythicSim and the site does not calculate DPS directly.</p>
    </div>`;
}
