import { dungeons, unlocks } from "./progress-catalog.js";
import { esc, intro, validUrl, sortCompare, sortData, sortSelect } from "./ui.js";
import { dungeonQuestById } from "./dungeon-quests.js";
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
  const active = (guide?.quests ?? []).reduce((sum, quest) => sum + (activeQuests.get(quest.id)?.length ?? 0), 0);
  const shared = (guide?.quests ?? []).filter(quest => (activeQuests.get(quest.id)?.length ?? 0) > 1).length;
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
    quests: (row.guide?.quests ?? []).map(quest => ({
      ...quest,
      active: activeQuests.get(quest.id) ?? [],
      completedMembers: characters.filter(character => character.completedAvailable && completedQuests.get(quest.id)?.has(character.id)),
      incompleteMembers: characters.filter(character => character.completedAvailable && !completedQuests.get(quest.id)?.has(character.id)),
      unknownMembers: characters.filter(character => !character.completedAvailable),
      completed: completedQuests.get(quest.id)?.size ?? 0,
      checked: characters.filter(character => character.completedAvailable).length
    }))
  }));
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
    const activeIds = new Set(character.activeQuestIds ?? []);
    const groups = character.activeAvailable ? plan.map(({ dungeon, quests }) => ({
      dungeon, quests: quests.filter(quest => activeIds.has(quest.id))
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
    body = character ? profileTabs(character, true) + availableQuests(data.progress) +
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
