import { dungeons, unlocks } from "./progress-catalog.js";
import { esc, intro, validUrl, sortCompare, sortData, sortSelect } from "./ui.js";
import { dungeonQuestById, dungeonQuestSeries, questAvailableForClass } from "./dungeon-quests.js";
import { queueMutation } from "./offline.js";

const timeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dungeonStatus = { none: "No clear recorded", partial: "Partial clear", cleared: "Cleared" };
const reportHosts = ["warcraftlogs.com", "www.warcraftlogs.com", "forever.warcraftlogs.com", "classic.warcraftlogs.com"];
const empty = message => `<p class="empty">${esc(message)}</p>`;
const standIn = id => `<span class="subtle">${id ? "Former member" : "Unassigned"}</span>`;

function memberLink(member, progress = false) {
  if (!member) return standIn(true);
  return `<a class="link" href="/character/${encodeURIComponent(member.slug)}${progress ? "/progress" : ""}" data-nav>${esc(member.name)}</a>`;
}

function action(label, payload, primary = false) {
  return `<button type="button" class="button ${primary ? "primary" : "quiet"}" data-planning-action="${esc(JSON.stringify(payload))}">${esc(label)}</button>`;
}

function collapsibleSection(label, text, inner, open = false, tools = "") {
  return `<details class="panel planner-section"${open ? " open" : ""}>
    <summary class="panel-heading"><div><h2>${esc(label)}</h2>${text ? `<p>${esc(text)}</p>` : ""}</div></summary>
    ${tools}<div class="planner-section-body">${inner}</div>
  </details>`;
}

const questOrder = [
  ["name:asc", "Quest name (A–Z)"], ["name:desc", "Quest name (Z–A)"],
  ["id:asc", "Lowest quest ID"], ["id:desc", "Highest quest ID"]
];

export function profileTabs(character, progress) {
  const url = `/character/${encodeURIComponent(character.slug)}`;
  return `<nav class="profile-tabs" aria-label="Character sections"><a class="button" href="${url}" data-nav ${!progress ? 'aria-current="page"' : ""}>Gear &amp; build</a><a class="button" href="${url}/progress" data-nav ${progress ? 'aria-current="page"' : ""}>Progress</a></nav>`;
}

function listRow(title, detail, control = "", badge = "", sort = null) {
  return `<div class="detail-row line" ${sort ? sortData(sort) : ""}><div class="planner-row-title"><div class="planner-row-heading"><strong>${title}</strong>${badge}</div>${detail ? `<small>${detail}</small>` : ""}</div>${control}</div>`;
}

function questList(quests) {
  return quests.map(quest => listRow(esc(quest.name), `Quest #${quest.id}`, "", "", { name: quest.name, id: quest.id })).join("");
}

function questSeriesFor(questId) {
  const id = Number(questId);
  return dungeonQuestSeries.find(series => series.steps.some(step => step.id === id)) ?? null;
}

function orderedQuestGroups(quests) {
  const groups = [];
  const bySeries = new Map();
  const other = [];
  for (const quest of quests) {
    const series = questSeriesFor(quest.id);
    if (!series) {
      other.push(quest);
      continue;
    }
    if (!bySeries.has(series.id)) {
      const group = { series, quests: [] };
      bySeries.set(series.id, group);
      groups.push(group);
    }
    bySeries.get(series.id).quests.push(quest);
  }
  for (const group of groups) {
    const order = new Map(group.series.steps.map((step, index) => [step.id, index]));
    group.quests.sort((left, right) => (order.get(Number(left.id)) ?? 0) - (order.get(Number(right.id)) ?? 0));
  }
  if (other.length) groups.push({ series: null, quests: other });
  return groups;
}

function renderQuestGroups(quests, listClass, renderQuest) {
  return orderedQuestGroups(quests).map(group =>
    '<section class="task-series-group">' +
      '<h4>' + esc(group.series?.name ?? "Other quests") + '</h4>' +
      '<ul class="' + listClass + '">' + group.quests.map(renderQuest).join("") + '</ul>' +
    '</section>'
  ).join("");
}

function activeSeriesPredecessor(questId, activeIds, completedIds) {
  const targetId = Number(questId);
  for (const series of dungeonQuestSeries) {
    const steps = new Map(series.steps.map(step => [step.id, step]));
    const target = steps.get(targetId);
    if (!target) continue;
    const pending = [...(target.after ?? [])];
    const visited = new Set();
    while (pending.length) {
      const predecessorId = pending.shift();
      if (visited.has(predecessorId)) continue;
      visited.add(predecessorId);
      if (activeIds.has(predecessorId) && !completedIds.has(predecessorId)) return predecessorId;
      pending.push(...(steps.get(predecessorId)?.after ?? []));
    }
  }
  return null;
}

function characterDungeonQuestSection(character, progress, selectedDungeonId) {
  const completedAvailable = Boolean(character.completedAvailable || progress?.completed?.available);
  const activeAvailable = Boolean(character.activeAvailable || progress?.active?.available);
  const completedIds = new Set([
    ...(character.completedQuestIds ?? []),
    ...(progress?.completed?.quests ?? []).map(quest => quest.id)
  ].map(Number));
  const activeIds = new Set([
    ...(character.activeQuestIds ?? []),
    ...(progress?.active?.quests ?? []).map(quest => quest.id)
  ].map(Number));
  const selectedGuide = dungeonQuestById.get(selectedDungeonId);
  const selected = Boolean(selectedGuide?.quests.some(quest =>
    questAvailableForClass(quest.id, character.className)));
  const rows = dungeons.map(dungeon => {
    const guide = dungeonQuestById.get(dungeon.id);
    if (!guide?.quests?.length) return "";
    const quests = guide.quests.filter(quest => questAvailableForClass(quest.id, character.className));
    if (!quests.length) return "";
    const count = completedAvailable ? quests.filter(quest => completedIds.has(quest.id)).length : null;
    const summary = count === null
      ? quests.length + ' indexed quests · completion history unavailable'
      : count + '/' + quests.length + ' quests complete · ' + (quests.length - count) + ' missing';
    const grouped = renderQuestGroups(quests, "character-quest-steps", quest => {
      const complete = completedIds.has(quest.id);
      const active = activeIds.has(quest.id);
      const status = complete ? "Completed" : active ? "Active · not complete" : completedAvailable ? "Missing" : "Unverified";
      const statusClass = complete ? "status-cleared" : active ? "status-partial" : "";
      return '<li><span class="status-tag ' + statusClass + '">' + status + '</span>' +
        wowheadQuest(quest) + '</li>';
    });
    const isSelected = dungeon.id === selectedDungeonId;
    return '<details class="planner-details character-dungeon-quest"' +
      (isSelected ? ' id="selected-dungeon-quest" data-selected-dungeon-quest open' : '') +
      '>' +
      '<summary><span><strong>' + esc(dungeon.name) + '</strong></span><span class="subtle">' + esc(summary) + '</span></summary>' +
      (completedAvailable
        ? '<p class="character-quest-note">' + (activeAvailable
          ? 'Missing quests are not in completion history; Active means the quest is in the current log.'
          : 'Missing quests are not in completion history; the active quest snapshot is unavailable.') + '</p>'
        : '<p class="character-quest-note">Completion history is unavailable, so missing quest status cannot be confirmed.' +
          (activeAvailable ? ' Active quests are still identified from the current log.' : '') + '</p>') +
      grouped + '</details>';
  }).join("");
  const inner = rows || empty("No Horde dungeon quests are indexed.");
  return collapsibleSection(
    "Dungeon quest breakdown",
    "Horde dungeon quest completion and any quests still missing from the character’s history.",
    inner,
    selected
  );
}

function availableQuests(progress) {
  const active = progress?.active;
  const completed = progress?.completed;
  const synced = active?.updatedAt ? `Armory snapshot · ${timeFormat.format(new Date(active.updatedAt))}` : progress?.checkedAt ? `Checked ${timeFormat.format(new Date(progress.checkedAt))}` : "";
  const list = active?.available
    ? questList(active.quests) || empty("No active quests in the latest snapshot.")
    : empty("The Armory has no active quest snapshot available.");
  const done = completed?.available
    ? `<div class="planner-filter"><label for="completed-query">Find a completed quest</label><input type="search" id="completed-query" data-completed-query placeholder="Search by name or ID">${sortSelect("completed-quests", questOrder, "completed quests")}<p class="subtle" data-completed-count></p></div>
        <div class="quest-results" data-completed-results role="region" aria-label="Completed quest results" tabindex="0">${empty("Loading quest history…")}</div>
        <div data-completed-more></div>`
    : empty("The Armory has no completed quest history available.");
  const activeSection = collapsibleSection("Active quests", synced, `<div data-sort-list="active-quests">${list}</div>`, true,
    active?.quests?.length ? `<div class="planner-section-tools">${sortSelect("active-quests", questOrder, "active quests")}</div>` : "");
  const completedSection = collapsibleSection("Completed quests", completed?.available ? `${completed.quests.length} recorded by the Armory` : "", done);
  return `<div class="quest-grid">${activeSection}${completedSection}</div>`;
}

function dungeonChecklist(member, entries, progress, writable, canImport) {
  const statuses = new Map(entries.filter(entry => entry.kind === "dungeon").map(entry => [entry.entry_key, entry.data]));
  const logEntries = new Map(entries.filter(entry => entry.kind === "dungeon-log").map(entry => [entry.entry_key, entry.data]));
  const fromArmory = new Map((progress?.encounters ?? []).map(entry => [entry.name.toLowerCase(), entry.status]));
  const rows = dungeons.map((dungeon, catalogIndex) => {
    const row = statuses.get(dungeon.id) ?? {};
    const imported = logEntries.get(dungeon.id) ?? {};
    const observed = fromArmory.get(dungeon.name.toLowerCase());
    const current = [row.status, imported.status, observed].includes("cleared") ? "cleared" :
      [row.status, imported.status, observed].includes("partial") ? "partial" : "none";
    const log = validUrl(row.log || imported.log, reportHosts);
    const tags = [`Levels ${dungeon.levels}`, row.note, imported.kills?.length ? `${imported.kills.length} logged boss kills` : "",
      row.status ? "Guild record" : observed ? "Blizzard Armory" : imported.status ? "Warcraft Logs" : ""].filter(Boolean);
    const level = Number(dungeon.levels.split(/[–-]/)[0]) || 0;
    const status = { none: 0, partial: 1, cleared: 2 }[current];
    return listRow(esc(dungeon.name), tags.map(esc).join(" · ") + (log ? ` · <a class="link" href="${log}" target="_blank" rel="noopener">View log</a>` : ""),
      writable ? action("Edit", { action: "dungeon", character: member.slug, dungeon: dungeon.id, name: dungeon.name, progress: row.status ?? current, note: row.note ?? "", log: row.log ?? "", canImport }) : "",
      `<span class="status-tag status-${current}">${dungeonStatus[current]}</span>`, { name: dungeon.name, level, status, catalog: catalogIndex });
  }).join("");
  const order = [
    ["catalog:asc", "Catalog order"], ["name:asc", "Dungeon (A–Z)"], ["name:desc", "Dungeon (Z–A)"],
    ["status:asc", "Needs progress first"], ["status:desc", "Most complete first"],
    ["level:asc", "Lowest level"], ["level:desc", "Highest level"]
  ];
  const tools = `<div class="planner-section-tools">${sortSelect("character-dungeons", order, "dungeon checklist")}</div>`;
  return collapsibleSection("Dungeon checklist", "A clear applies to the listed dungeon or wing. Guild entries can include a Warcraft Logs link.",
    `<div class="planner-scroll" data-sort-list="character-dungeons">${rows}</div>`, true, tools);
}

function unlockChecklist(member, entries, progress, writable) {
  const completed = new Set(entries.filter(entry => entry.kind === "unlock").map(entry => entry.entry_key));
  const armoryNames = new Set((progress?.completed?.quests ?? []).filter(quest => !quest.name.startsWith("Quest #")).map(quest => quest.name.toLowerCase()));
  const manualOnly = new Set(["upper-blackrock-spire-1", "upper-blackrock-spire-2"]);
  const rows = unlocks.map((unlock, index) => {
    const target = `unlock-${unlock.id}`;
    const steps = unlock.steps.map(step => {
      const synced = !manualOnly.has(step.id) && armoryNames.has(step.name.toLowerCase());
      return { ...step, synced, done: synced || completed.has(step.id) };
    });
    const count = steps.filter(step => step.done).length;
    const stepRows = steps.map((step, index) => listRow(
      esc(step.name), step.synced ? "Completed · Armory" : step.done ? "Completed · Guild checklist" : "Open step",
      writable && !step.synced ? action(step.done ? "Undo" : "Mark done",
        { action: "unlock", character: member.slug, step: step.id, name: step.name, done: !step.done }) : "",
      "", { index, name: step.name, done: Number(step.done) })).join("");
    const stepOrder = [
      ["index:asc", "Quest chain order"], ["name:asc", "Step (A–Z)"], ["name:desc", "Step (Z–A)"],
      ["done:asc", "Open steps first"], ["done:desc", "Completed steps first"]
    ];
    return `<details class="planner-details" ${sortData({ index, name: unlock.name, progress: count / steps.length })}>
      <summary><span><strong>${esc(unlock.name)}</strong> <span class="subtle">· ${esc(unlock.reward)}</span></span><span class="subtle">${count}/${steps.length}${count === steps.length ? " · Recorded complete" : ""}</span></summary>
      ${steps.length > 1 ? `<div class="planner-section-tools">${sortSelect(target, stepOrder, `${unlock.name} steps`)}</div>` : ""}
      <div data-sort-list="${target}">${stepRows}</div>
    </details>`;
  }).join("");
  const order = [
    ["index:asc", "Checklist order"], ["name:asc", "Attunement (A–Z)"], ["name:desc", "Attunement (Z–A)"],
    ["progress:asc", "Least progress"], ["progress:desc", "Most progress"]
  ];
  return collapsibleSection("Attunements & unlocks", "Horde checklists with Armory matches and guild-confirmed steps.",
    `<div data-sort-list="attunements">${rows}</div><p class="panel-note"><a class="link" href="https://wowforever.fit/attunements/" target="_blank" rel="noopener">View attunement guides</a></p>`,
    false, `<div class="planner-section-tools">${sortSelect("attunements", order, "attunements")}</div>`);
}

function wowheadQuest(quest) {
  return `<a href="https://www.wowhead.com/forever/quest=${quest.id}" data-wowhead="quest=${quest.id}&amp;domain=forever" target="_blank" rel="noopener">${esc(quest.name)}</a>`;
}

function dungeonPriority(dungeon, data, activeQuests) {
  const guide = dungeonQuestById.get(dungeon.id);
  const [minLevel, maxLevel] = dungeon.levels.split(/[–-]/).map(Number);
  const characters = data.characters ?? [];
  const inRangeMembers = characters.filter(character => character.level >= minLevel && character.level <= maxLevel);
  const highestLevel = Math.max(0, ...characters.map(character => character.level ?? 0));
  const activeMembers = quest => (activeQuests.get(quest.id) ?? [])
    .filter(character => questAvailableForClass(quest.id, character.className));
  const active = (guide?.quests ?? []).reduce((sum, quest) => sum + activeMembers(quest).length, 0);
  const shared = (guide?.quests ?? []).filter(quest => activeMembers(quest).length > 1).length;
  return { dungeon, guide, active, shared, inRange: inRangeMembers.length, inRangeMembers, minLevel, levelDistance: Math.abs(highestLevel - maxLevel) };
}

export function buildDungeonPlan(data) {
  const characters = data.characters ?? [];
  const activeQuests = new Map();
  const completedQuests = new Map();
  for (const character of characters) {
    for (const id of character.activeQuestIds ?? []) {
      if (!activeQuests.has(id)) activeQuests.set(id, []);
      activeQuests.get(id).push(character);
    }
    for (const id of character.completedQuestIds ?? []) {
      if (!completedQuests.has(id)) completedQuests.set(id, new Set());
      completedQuests.get(id).add(character.id);
    }
  }
  const ranked = dungeons.map(dungeon => dungeonPriority(dungeon, data, activeQuests))
    .sort((left, right) => right.shared - left.shared || right.active - left.active || right.inRange - left.inRange || left.levelDistance - right.levelDistance || left.minLevel - right.minLevel);
  return ranked.map(row => ({
    ...row,
    quests: (row.guide?.quests ?? [])
      .filter(quest => characters.some(character => questAvailableForClass(quest.id, character.className)))
      .map(quest => {
        const eligibleMembers = characters.filter(character => questAvailableForClass(quest.id, character.className));
        const checkedMembers = eligibleMembers.filter(character => character.completedAvailable);
        const completedMembers = eligibleMembers.filter(character =>
          character.completedAvailable && completedQuests.get(quest.id)?.has(character.id));
        return {
          ...quest,
          eligibleMembers,
          active: (activeQuests.get(quest.id) ?? []).filter(character => questAvailableForClass(quest.id, character.className)),
          completedMembers,
          incompleteMembers: checkedMembers.filter(character => !completedQuests.get(quest.id)?.has(character.id)),
          unknownMembers: eligibleMembers.filter(character => !character.completedAvailable),
          completed: completedMembers.length,
          checked: checkedMembers.length
        };
      })
  }));
}

function matrixHeader(label, key, direction, attributes = "") {
  return `<th scope="col" ${attributes}><button type="button" class="sort-column"
    data-sort-column="dungeon-matrix" data-sort-key="${key}" data-sort-direction="${direction}">${esc(label)}<span class="sort-indicator" aria-hidden="true"></span></button></th>`;
}

function dungeonMatrix(characters, plan) {
  const title = "Dungeon quest completion matrix";
  if (!characters.length) return collapsibleSection(title, "", empty("No characters on the roster."));

  const planById = new Map(plan.map(row => [row.dungeon.id, row]));
  const columns = dungeons.map(dungeon => ({
    ...dungeon,
    questIds: [...new Set(planById.get(dungeon.id).quests.map(quest => quest.id))]
  }));
  const headings = columns.map(({ id, name }) =>
    matrixHeader(name, id, "desc", `data-matrix-dungeon="${id}" data-dungeon-name="${esc(name.toLowerCase())}"`)).join("");
  const allQuestIds = [...new Set(columns.flatMap(({ questIds }) => questIds))];

  const rows = characters.map(character => {
    const history = character.completedAvailable && Array.isArray(character.completedQuestIds)
      ? new Set(character.completedQuestIds.map(Number)) : null;
    const eligibleQuestIds = allQuestIds.filter(questId => questAvailableForClass(questId, character.className));
    const completion = history ? eligibleQuestIds.filter(questId => history.has(Number(questId))).length : -1;
    const sortKeys = { name: character.name, completion };
    const cells = columns.map(({ id, name, questIds }) => {
      const totalIndexed = questIds.length;
      const availableQuestIds = questIds.filter(questId => questAvailableForClass(questId, character.className));
      const total = availableQuestIds.length;
      const notApplicable = totalIndexed > 0 && total === 0;
      const count = total && history ? availableQuestIds.filter(questId => history.has(Number(questId))).length : null;
      const status = notApplicable ? "not-applicable" : count === total ? "complete" : count === null ? "unknown" : "incomplete";
      const label = notApplicable
        ? "No indexed quests available for " + (character.className || "this") + " class"
        : !totalIndexed ? "No quests indexed" : count === null ? "No Armory completion history"
        : count + " of " + total + " class-available indexed quests complete";
      const value = notApplicable ? "N/A" : !totalIndexed ? "No index" : count === null ? "No history"
        : (status === "complete" ? "✓" : "×") + " " + count + "/" + total;
      sortKeys[id] = count;
      const profileLabel = "Open " + character.name + "'s " + name + " quest details" +
        (notApplicable ? " (no quests indexed for this class)" : count === null ? " (completion history unavailable)" :
          ", " + count + " of " + total + " quests complete");
      const href = "/character/" + encodeURIComponent(character.slug ?? character.id ?? "") +
        "/progress?dungeon=" + encodeURIComponent(id);
      const cellContent = total
        ? '<a class="matrix-cell-link" href="' + href + '" data-nav aria-label="' + esc(profileLabel) + '">' +
          '<span aria-hidden="true">' + value + '</span></a>'
        : '<span aria-hidden="true">' + value + '</span>';
      return '<td class="matrix-' + status + '" data-matrix-dungeon="' + id + '" title="' + esc(label) + '">' +
        cellContent + '<span class="matrix-visually-hidden">' + esc(label) + '</span></td>';
    }).join("");
    return `<tr ${sortData(sortKeys)}><th scope="row">${memberLink(character, true)}${character.level == null ? "" : `<small>Level ${esc(character.level)}</small>`}</th>${cells}</tr>`;
  }).join("");

  const tools = `<div class="matrix-toolbar">
    <label for="matrix-dungeon-search">Filter dungeon columns
      <input id="matrix-dungeon-search" type="search" placeholder="Dungeon or wing name" autocomplete="off" data-matrix-search>
    </label>
    <ul class="matrix-legend" aria-label="Completion key">
      <li class="matrix-complete"><span aria-hidden="true">✓</span> All complete</li>
      <li class="matrix-incomplete"><span aria-hidden="true">×</span> Incomplete</li>
      <li class="matrix-unknown"><span aria-hidden="true">—</span> No history or quest index</li>
    </ul>
  </div>`;
  const body = `<div class="matrix-scroll" data-matrix-scroll role="region" tabindex="0" aria-label="Scrollable dungeon quest matrix">
    <table class="dungeon-matrix">
      <caption class="matrix-visually-hidden">Indexed dungeon quest completion by guild character</caption>
      <thead><tr>${matrixHeader("Character", "name", "asc")}${headings}</tr></thead>
      <tbody data-sort-list="dungeon-matrix" data-sort-default="completion:desc">${rows}</tbody>
    </table>
  </div>
  <p class="empty" data-matrix-empty role="status" hidden>No matching dungeons.</p>
  <p class="panel-note">Counts use the Planner’s Horde and class-available quest index and the Armory’s completed quest history.</p>`;
  return collapsibleSection(title, "Scroll to compare dungeons and select a column heading to sort.", body, true, tools);
}

function questProgressLines(row) {
  if (!row.quests.length) return row.guide
    ? empty("This guide has no quest references in the current index.")
    : '<p class="empty">No Wowhead Forever dungeon guide is indexed yet.</p>';
  return row.quests.map((quest, index) => {
    const activeNames = quest.active.map(member => memberLink(member, true)).join(", ") || "None active in the latest snapshots";
    const complete = quest.completedMembers.length;
    const incomplete = quest.incompleteMembers.length;
    const unknown = quest.unknownMembers.length;
    const completion = quest.checked
      ? `<div class="quest-status-counts"><span class="status-tag status-cleared">${complete} completed</span><span class="status-tag status-partial">${incomplete} not completed</span>${unknown ? `<span class="status-tag">${unknown} untracked</span>` : ""}</div>`
      : '<span class="status-tag">Quest history unavailable</span>';
    const characterGroup = (title, list, statusClass) => `<section class="quest-character-group"><strong class="status-tag ${statusClass}">${title} · ${list.length}</strong><p>${list.map(member => memberLink(member, true)).join(", ") || "None"}</p></section>`;
    const details = quest.checked || unknown ? `<details class="quest-character-status"><summary>View characters</summary><div class="quest-status-groups">
      ${characterGroup("Completed", quest.completedMembers, "status-cleared")}
      ${characterGroup("Not completed", quest.incompleteMembers, "status-partial")}
      ${unknown ? characterGroup("No snapshot", quest.unknownMembers, "") : ""}
      </div></details>` : "";
    return `<div class="dungeon-quest line" ${sortData({ name: quest.name, id: quest.id, active: quest.active.length, completed: complete, index })}>
      <div class="dungeon-quest-main"><strong>${wowheadQuest(quest)}</strong><small><b>Active:</b> ${activeNames}</small>${completion}${details}</div>
    </div>`;
  }).join("");
}

function dungeonCard(row, priority, section) {
  const { dungeon } = row;
  const target = `${section}-${dungeon.id}`;
  const activeLabel = row.active ? `${row.active} active quest ${row.active === 1 ? "match" : "matches"}` : "No active quest matches";
  const guideLink = row.guide ? `<a class="link" href="${esc(row.guide.guideUrl)}" target="_blank" rel="noopener">Wowhead guide</a>` : "";
  const order = [
    ["index:asc", "Guide order"], ...questOrder,
    ["active:desc", "Most active characters"], ["active:asc", "Fewest active characters"],
    ["completed:desc", "Most completed"], ["completed:asc", "Least completed"]
  ];
  return `<details class="panel planner-details dungeon-plan-card" data-dungeon-card data-dungeon-name="${esc(dungeon.name.toLowerCase())}"
    ${sortData({ name: dungeon.name, priority, shared: row.shared, active: row.active, range: row.inRange, level: row.minLevel })}
    ${priority === 0 && section === "recommended" ? "open" : ""}>
    <summary class="dungeon-card-summary"><span><strong>${esc(dungeon.name)}</strong><span class="subtle">Levels ${esc(dungeon.levels)} · ${row.inRange} in range · ${esc(activeLabel)}</span></span></summary>
    <div class="dungeon-card-content">
      <p class="panel-note"><strong>In suggested level range</strong> · ${row.inRangeMembers.map(member => memberLink(member, true)).join(", ") || "No characters"}</p>
      ${row.quests.length > 1 ? `<div class="planner-section-tools">${sortSelect(target, order, `${dungeon.name} quests`)}</div>` : ""}
      <div class="dungeon-quest-list" data-sort-list="${target}">${questProgressLines(row)}</div>
      ${guideLink ? `<p class="panel-note">${guideLink}</p>` : ""}
    </div>
  </details>`;
}

function characterQuestSection(characters, plan) {
  const order = [
    ["name:asc", "Character (A–Z)"], ["name:desc", "Character (Z–A)"],
    ["level:desc", "Highest level"], ["level:asc", "Lowest level"],
    ["quests:desc", "Most active quests"], ["quests:asc", "Fewest active quests"]
  ];
  const rows = characters.map(character => {
    const activeIds = new Set((character.activeQuestIds ?? []).map(Number));
    const groups = character.activeAvailable ? plan.map(({ dungeon, quests }) => ({
      dungeon, quests: quests.filter(quest => activeIds.has(Number(quest.id)) &&
        questAvailableForClass(quest.id, character.className))
    })).filter(group => group.quests.length) : [];
    const count = new Set(groups.flatMap(group => group.quests.map(quest => quest.id))).size;
    const status = character.activeAvailable
      ? (count ? `${count} active dungeon ${count === 1 ? "quest" : "quests"}` : "No indexed dungeon quests active")
      : "Active quest log unavailable";
    const links = groups.length ? `<ul class="character-quest-groups">${groups.map(({ dungeon, quests }) =>
      `<li><strong>${esc(dungeon.name)}</strong><span>${quests.map(wowheadQuest).join(", ")}</span></li>`).join("")}</ul>` : "";
    return `<div class="character-quest-row line" ${sortData({ name: character.name, level: character.level, quests: character.activeAvailable ? count : null })}>
      <div><strong>${memberLink(character, true)}</strong>${character.level != null ? `<span class="subtle"> · Level ${esc(character.level)}</span>` : ""}</div>
      ${links ? `<details class="quest-character-status"><summary>${esc(status)}</summary>${links}</details>` : `<p class="subtle">${esc(status)}</p>`}
    </div>`;
  }).join("");
  return collapsibleSection("Active dungeon quests by character", "See which indexed dungeon quests each character has picked up. Character links open the full quest log.",
    `<div data-sort-list="character-quests">${rows || empty("No characters on the roster.")}</div>`, true,
    characters.length ? `<div class="planner-section-tools">${sortSelect("character-quests", order, "characters by active dungeon quests")}</div>` : "");
}

function personalizedTaskResult(character, plan) {
  const completedIds = new Set((character.completedQuestIds ?? []).map(Number));
  const activeIds = new Set((character.activeQuestIds ?? []).map(Number));
  const hasCompletion = Boolean(character.completedAvailable);
  const hasActive = Boolean(character.activeAvailable);
  const level = character.level == null || character.level === "" ? null : Number.isFinite(Number(character.level)) ? Number(character.level) : null;
  const recommendations = plan.map((row, index) => {
    const quests = row.quests.filter(quest =>
      questAvailableForClass(quest.id, character.className) &&
      (!hasCompletion || !completedIds.has(Number(quest.id))));
    if (!quests.length) return null;
    const items = quests.map(quest => {
      const active = activeIds.has(Number(quest.id));
      const blockedBy = !active && hasActive ? activeSeriesPredecessor(quest.id, activeIds, completedIds) : null;
      return { quest, active, blockedBy };
    });
    const actionableCount = items.filter(item => !item.blockedBy).length;
    const activeCount = items.filter(item => item.active).length;
    const sharedActive = quests.filter(quest => (quest.active ?? []).some(member => member.id !== character.id)).length;
    const [minLevel, maxLevel] = row.dungeon.levels.split(/[–-]/).map(Number);
    const inRange = level !== null && level >= minLevel && level <= maxLevel;
    const levelDistance = level === null ? Number.POSITIVE_INFINITY
      : level < minLevel ? minLevel - level : level > maxLevel ? level - maxLevel : 0;
    return { row, items, quests, actionableCount, activeCount, sharedActive, inRange, levelDistance, index };
  }).filter(Boolean).sort((left, right) =>
    right.actionableCount - left.actionableCount ||
    right.activeCount - left.activeCount ||
    right.sharedActive - left.sharedActive ||
    Number(right.inRange) - Number(left.inRange) ||
    left.levelDistance - right.levelDistance ||
    left.quests.length - right.quests.length ||
    left.index - right.index
  );
  if (!recommendations.length) {
    const message = hasCompletion
      ? "All indexed Horde dungeon quests are complete for this character."
      : "No dungeon quest recommendations are available from the current roster data.";
    return '<div class="task-list-result" data-personalized-task-list-for="' + esc(character.id ?? character.slug) + '" hidden><p class="empty">' + esc(message) + '</p></div>';
  }
  const recommendation = recommendations[0];
  const { row, items, quests } = recommendation;
  const reasons = [];
  if (recommendation.activeCount) reasons.push(recommendation.activeCount + ' quest' + (recommendation.activeCount === 1 ? '' : 's') + ' already active');
  if (recommendation.sharedActive) reasons.push(recommendation.sharedActive + ' quest' + (recommendation.sharedActive === 1 ? '' : 's') + ' also active for guild members');
  if (recommendation.inRange) reasons.push('level ' + level + ' is in the suggested range');
  const reasonText = reasons.length ? reasons.join(" · ") : 'Closest level match for level ' + (level ?? "unknown");
  const guidance = recommendation.actionableCount === 0
    ? "The remaining quests follow an active series step. Complete the active quest first; later quests are not marked for pickup."
    : hasCompletion
      ? hasActive
        ? "Grouped quests follow their series order. Pick up only available steps; later steps stay marked until the active prerequisite is complete."
        : "Completion history is available, but the active quest log is not; verify each quest before picking it up."
      : "Completion history is unavailable, so check each quest before picking it up.";
  const itemById = new Map(items.map(item => [Number(item.quest.id), item]));
  const tasks = renderQuestGroups(quests, "task-list-steps", quest => {
    const item = itemById.get(Number(quest.id));
    const action = item.active ? "Continue" : item.blockedBy ? "Later in series" : hasCompletion && hasActive ? "Pick up" : "Check status";
    const statusClass = item.active ? "status-cleared" : item.blockedBy ? "status-series-wait" : "status-partial";
    const note = item.blockedBy ? '<small>Wait until the active quest in this series is complete.</small>' : "";
    return '<li><span class="status-tag ' + statusClass + '">' + action + '</span>' +
      wowheadQuest(quest) + note + '</li>';
  });
  const guide = row.guide?.guideUrl
    ? '<a class="link" href="' + esc(row.guide.guideUrl) + '" target="_blank" rel="noopener">Dungeon guide</a>'
    : "";
  const laterNote = recommendation.items.some(item => item.blockedBy)
    ? '<p class="panel-note">Later series steps are shown for context and are not pickup recommendations.</p>' : "";
  return '<div class="task-list-result" data-personalized-task-list-for="' + esc(character.id ?? character.slug) + '" hidden>' +
    '<h3>' + (recommendation.actionableCount ? 'Recommended next dungeon: ' : 'Finish the active quest first: ') + esc(row.dungeon.name) + '</h3>' +
    '<p class="panel-note">' + esc(reasonText) + ' · ' + recommendation.actionableCount + ' available step' +
      (recommendation.actionableCount === 1 ? '' : 's') + (hasCompletion ? ' · ' + quests.length + ' unfinished indexed quest' +
      (quests.length === 1 ? '' : 's') : ' to review') + '.</p>' +
    '<p class="panel-note">' + esc(guidance) + ' ' + guide + '</p>' +
    laterNote + tasks +
  '</div>';
}

function personalizedTaskListSection(characters, plan) {
  const roster = [...characters].sort((left, right) => String(left.name).localeCompare(String(right.name)));
  const options = roster.map(character =>
    `<option value="${esc(character.id ?? character.slug)}">${esc(character.name)}${character.level != null ? ` · Level ${esc(character.level)}` : ""}</option>`
  ).join("");
  const results = roster.map(character => personalizedTaskResult(character, plan)).join("");
  const inner = `<div class="task-list-selector">
      <label for="planner-task-character">Select a character from the guild roster</label>
      <select id="planner-task-character" data-task-list-character>
        <option value="">Choose a character</option>${options}
      </select>
    </div>
    <div class="task-list-results" aria-live="polite">${results}</div>`;
  return collapsibleSection("Personalized Task List", "Open this section, then choose a character to see dungeon preparation tasks.", inner);
}

function dungeonPlanner(data) {
  const plan = buildDungeonPlan(data);
  const characters = data.characters ?? [];
  const available = characters.filter(character => character.activeAvailable || character.completedAvailable).length;
  const recommended = plan.slice(0, 5);
  const checked = data.checkedAt ? `Armory checked ${timeFormat.format(new Date(data.checkedAt))}` : "";
  const introText = available ? `${available} of ${characters.length} characters have quest snapshots. Open a dungeon to see active quests, completion, and who’s in level range.` : "Armory quest logs are unavailable. You can still use the dungeon guides and level ranges.";
  const dungeonSort = [
    ["priority:asc", "Recommended"], ["name:asc", "Dungeon (A–Z)"], ["name:desc", "Dungeon (Z–A)"],
    ["level:asc", "Lowest level range"], ["level:desc", "Highest level range"],
    ["shared:desc", "Most shared quests"], ["shared:asc", "Fewest shared quests"],
    ["active:desc", "Most active quests"], ["active:asc", "Fewest active quests"],
    ["range:desc", "Most characters in range"], ["range:asc", "Fewest characters in range"]
  ];
  const recommendedRuns = recommended.map((row, index) => dungeonCard(row, index, "recommended")).join("") || empty("No dungeons are indexed.");
  const allRuns = plan.map((row, index) => dungeonCard(row, index, "catalog")).join("");
  const controls = `<div class="planner-filter"><label for="dungeon-search">Find a dungeon</label><input id="dungeon-search" type="search" placeholder="Search by dungeon name" data-dungeon-search autocomplete="off">${sortSelect("all-dungeons", dungeonSort, "all dungeons")}</div>`;
  return `<div class="dungeon-planner" data-planning>
    <p class="notice" role="status">${esc(introText)}</p>
    ${dungeonMatrix(characters, plan)}
    ${personalizedTaskListSection(characters, plan)}
    ${characterQuestSection(characters, plan)}
    ${collapsibleSection("Recommended next runs", checked, `<div class="dungeon-index" data-sort-list="recommended-dungeons">${recommendedRuns}</div>`, true,
      `<div class="planner-section-tools">${sortSelect("recommended-dungeons", dungeonSort, "recommended dungeons")}</div>`)}
    ${collapsibleSection("All Forever dungeons", "Search guides and quest progress.", `<div class="dungeon-index" data-sort-list="all-dungeons">${allRuns}</div>
      <p class="empty" data-dungeon-empty hidden>No matching dungeons.</p>
      <p class="panel-note"><a href="https://www.wowhead.com/forever/guide/dungeons/every-dungeon-quest-location" target="_blank" rel="noopener">Full Wowhead Forever dungeon quest index</a> · Quest availability can depend on faction and character progress.</p>`, false, controls)}
  </div>`;
}

export function planningPage(view, data, character, status) {
  const titles = { character: character?.name ?? "Character unavailable", planner: "Dungeon planner" };
  const subtitles = { character: character ? `Level ${character.level} · ${character.className}` : "This character is unavailable.", planner: "Choose the next dungeon using shared quests, character levels, and completion progress." };
  const entries = data.entries ?? [];
  let body;
  if (view === "character") {
    const selectedDungeonId = new URLSearchParams(location.search).get("dungeon");
    body = character ? profileTabs(character, true) +
      characterDungeonQuestSection(character, data.progress, selectedDungeonId) + availableQuests(data.progress) +
      dungeonChecklist(character, entries, data.progress, data.writable, data.logs) +
      unlockChecklist(character, entries, data.progress, data.writable) : "";
  } else if (view === "planner") {
    body = dungeonPlanner(data);
  }
  return {
    title: `${titles[view]}${view === "character" ? " Progress" : ""} | Warfare`,
    result: intro(titles[view], subtitles[view], { back: view === "character" }) + (view === "planner"
      ? `<div class="frame content">${status ? `<p class="notice" role="status">${esc(status)}</p>` : ""}${body}</div>`
      : `<div class="frame content planner-grid" data-planning>
        ${status ? `<p class="notice" role="status">${esc(status)}</p>` : ""}${body}
        <dialog aria-labelledby="planner-dialog-title" data-planner-dialog></dialog>
        </div>`),
    completed: data.progress?.completed?.quests ?? []
  };
}

function labels(payload) {
  const p = payload;
  if (p.action === "dungeon") return {
    title: `Record ${p.name}`, fields: `<label>Status <select name="progress">${Object.entries(dungeonStatus).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>
      <label>Notes (optional) <input name="note" maxlength="200" placeholder="Bosses defeated or run details"></label>
      <label>Warcraft Logs report (optional) <input type="url" name="log" maxlength="300"></label>`,
    importButton: p.canImport
  };
  if (p.action === "unlock") return { title: p.done ? "Mark unlock step done" : "Reopen unlock step", description: p.name };
}

function openPlanningDialog(dialog, payload, members, onSaved) {
  const view = labels(payload);
  const member = members.find(member => member.slug === payload.character);
  const memberField = member ? `<p class="subtle">Character · ${esc(member.name)}</p>` : '<p class="subtle">Character unavailable in the current roster.</p>';
  const confirmLabel = "Save";
  dialog.innerHTML = `<form>
    <h2 id="planner-dialog-title" class="section-title">${esc(view.title)}</h2>
    ${view.description ? `<p class="subtle">${esc(view.description)}</p>` : ""}
    ${memberField}${view.fields ?? ""}
    <p class="form-status" role="status"></p>
    <div class="actions"><button type="submit" class="button primary">${confirmLabel}</button>
      ${view.importButton ? '<button type="submit" class="button" value="import-log">Import logged kills</button>' : ""}
      <button type="button" class="button" data-close-planning>Back</button></div>
    </form>`;
  const form = dialog.querySelector("form");
  for (const element of form.elements) {
    if (element.name && typeof payload[element.name] === "string") {
      element.value = payload[element.name];
    }
  }
  const dismiss = dialog.querySelector("[data-close-planning]");
  dismiss.addEventListener("click", () => dialog.close());
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form));
    const data = { ...payload, ...fields };
    if (event.submitter?.value === "import-log") data.action = "import-log";
    const feedback = form.querySelector(".form-status");
    const buttons = [...form.querySelectorAll('button[type="submit"]')];
    buttons.forEach(button => { button.disabled = true; });
    feedback.textContent = "Saving…";
    try {
      const res = await fetch("/api/planning", { method: "POST", headers: {
        "Content-Type": "application/json"
      }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) throw Error(result.error ?? "This update could not be saved.");
      dialog.close();
      onSaved(result.message || "Saved.");
    } catch (error) {
      if (error instanceof TypeError && data.action !== "import-log") {
        try {
          queueMutation(data);
          dialog.close();
          onSaved("Saved on this device. It will sync when Warfare is back online.");
        } catch (queueError) {
          feedback.textContent = queueError.message;
        }
      } else {
        feedback.textContent = error.message;
      }
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  });
  dialog.showModal();
}

export function bindPlanning(main, members, onSaved, completed) {
  const root = main.querySelector("[data-planning]");
  const dialog = root.querySelector("[data-planner-dialog]");
  if (dialog) root.addEventListener("click", event => {
    const button = event.target.closest("[data-planning-action]");
    if (button) openPlanningDialog(dialog, JSON.parse(button.dataset.planningAction), members, onSaved);
  });
  const selectedDungeonDetails = root.querySelector("[data-selected-dungeon-quest]");
  if (selectedDungeonDetails) requestAnimationFrame(() => selectedDungeonDetails.scrollIntoView({ block: "start" }));
  const taskCharacter = root.querySelector("[data-task-list-character]");
  if (taskCharacter) {
    const taskLists = [...root.querySelectorAll("[data-personalized-task-list-for]")];
    taskCharacter.addEventListener("change", event => {
      const selectedCharacter = event.currentTarget.value;
      for (const taskList of taskLists) {
        taskList.hidden = taskList.dataset.personalizedTaskListFor !== selectedCharacter;
      }
    });
  }
  const matrixSearch = root.querySelector("[data-matrix-search]");
  if (matrixSearch) {
    const viewport = root.querySelector("[data-matrix-scroll]");
    const headings = [...viewport.querySelectorAll("thead [data-matrix-dungeon]")];
    const cells = [...viewport.querySelectorAll("[data-matrix-dungeon]")];
    const noMatches = root.querySelector("[data-matrix-empty]");
    const filter = () => {
      const query = matrixSearch.value.trim().toLowerCase();
      const matching = new Set(headings.filter(cell => cell.dataset.dungeonName.includes(query))
        .map(cell => cell.dataset.matrixDungeon));
      for (const cell of cells) cell.hidden = !matching.has(cell.dataset.matrixDungeon);
      viewport.hidden = !matching.size;
      noMatches.hidden = Boolean(matching.size);
      viewport.scrollLeft = 0;
    };
    matrixSearch.addEventListener("input", filter);
    if (matrixSearch.value) filter();
  }
  root.querySelector("[data-dungeon-search]")?.addEventListener("input", event => {
    const query = event.currentTarget.value.trim().toLowerCase();
    let matches = 0;
    for (const card of root.querySelectorAll('[data-sort-list="all-dungeons"] > [data-dungeon-card]')) {
      card.hidden = !card.dataset.dungeonName.includes(query);
      if (!card.hidden) matches++;
    }
    root.querySelector("[data-dungeon-empty]").hidden = matches > 0;
  });
  const completedQuery = root.querySelector("[data-completed-query]");
  if (completedQuery) {
    const target = root.querySelector("[data-completed-results]");
    const completedSort = root.querySelector('[data-sort-target="completed-quests"]');
    const more = root.querySelector("[data-completed-more]");
    const count = root.querySelector("[data-completed-count]");
    let limit = 40;
    const update = () => {
      const query = completedQuery.value.trim().toLowerCase();
      const result = completed.filter(quest => quest.name.toLowerCase().includes(query) || String(quest.id).includes(query));
      result.sort((left, right) => sortCompare(completedSort.value, left, right));
      const visible = result.slice(0, limit);
      count.textContent = `Showing ${visible.length} of ${result.length}`;
      target.innerHTML = visible.length ? questList(visible) : empty("No matching quests.");
      more.innerHTML = result.length > limit ? '<p class="panel-note"><button type="button" class="button quiet" data-more-completed>Show more</button></p>' : "";
    };
    const reset = () => {
      limit = 40;
      update();
      target.scrollTop = 0;
    };
    completedQuery.addEventListener("input", reset);
    completedSort.addEventListener("change", reset);
    more.addEventListener("click", event => {
      if (!event.target.closest("[data-more-completed]")) return;
      limit += 40;
      update();
      (more.querySelector("button") ?? target).focus();
    });
    update();
  }
}
