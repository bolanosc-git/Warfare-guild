import { dungeons, unlocks } from "./progress-catalog.js";
import { esc, intro, panel, validUrl } from "./ui.js";
import { dungeonQuestById } from "./dungeon-quests.js";
import { queueMutation } from "./offline.js";

const timeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dungeonStatus = { none: "No clear recorded", partial: "Partial clear", cleared: "Cleared" };
const reportHosts = ["warcraftlogs.com", "www.warcraftlogs.com", "forever.warcraftlogs.com", "classic.warcraftlogs.com"];
const empty = message => `<p class="empty">${esc(message)}</p>`;
const dungeonOptions = dungeons.map(({ id, name, levels }) => `<option value="${id}">${esc(name)} · ${levels}</option>`).join("");
const standIn = id => `<span class="subtle">${id ? "Former member" : "Unassigned"}</span>`;

function memberLink(member, progress = false) {
  if (!member) return standIn(true);
  return `<a class="link" href="/character/${encodeURIComponent(member.slug)}${progress ? "/progress" : ""}" data-nav>${esc(member.name)}</a>`;
}

function action(label, payload, primary = false) {
  return `<button type="button" class="button ${primary ? "primary" : "quiet"}" data-planning-action="${esc(JSON.stringify(payload))}">${esc(label)}</button>`;
}

function section(label, text, inner, control = "") {
  return panel(label, text, inner, control);
}

export function profileTabs(character, progress) {
  const url = `/character/${encodeURIComponent(character.slug)}`;
  return `<nav class="profile-tabs" aria-label="Character sections"><a class="button" href="${url}" data-nav ${!progress ? 'aria-current="page"' : ""}>Gear &amp; build</a><a class="button" href="${url}/progress" data-nav ${progress ? 'aria-current="page"' : ""}>Progress</a></nav>`;
}

function listRow(title, detail, control = "", badge = "") {
  return `<div class="detail-row line"><div class="planner-row-title"><div class="planner-row-heading"><strong>${title}</strong>${badge}</div>${detail ? `<small>${detail}</small>` : ""}</div>${control}</div>`;
}

function questList(quests, member, writable, namesRequested) {
  return quests.map(quest => listRow(esc(quest.name), `Quest #${quest.id}`, writable
    ? action(namesRequested.has(quest.name.toLowerCase()) ? "Remove request" : "Ask for group", {
      action: "need", character: member.slug, name: quest.name,
      remove: namesRequested.has(quest.name.toLowerCase())
    }) : "")).join("");
}

function availableQuests(progress, member, writable, entries) {
  const active = progress?.active;
  const completed = progress?.completed;
  const requests = new Set(entries.filter(entry => entry.kind === "need" && !entry.data.dungeonId).map(entry => entry.data.name.toLowerCase()));
  const synced = active?.updatedAt ? `Armory snapshot · ${timeFormat.format(new Date(active.updatedAt))}` : progress?.checkedAt ? `Checked ${timeFormat.format(new Date(progress.checkedAt))}` : "";
  const list = active?.available
    ? questList(active.quests, member, writable, requests) || empty("No active quests in the latest snapshot.")
    : empty("The Armory has no active quest snapshot available.");
  const done = completed?.available
    ? `<div class="planner-filter"><label for="completed-query">Find a completed quest</label><input type="search" id="completed-query" data-completed-query placeholder="Search by name or ID"><p class="subtle" data-completed-count></p></div>
        <div class="quest-results" data-completed-results role="region" aria-label="Completed quest results" tabindex="0">${empty("Loading quest history…")}</div>
        <div data-completed-more></div>`
    : empty("The Armory has no completed quest history available.");
  return `<div class="quest-grid">${section("Active quests", synced, list)}${section("Completed quests", completed?.available ? `${completed.quests.length} recorded by the Armory` : "", done)}</div>`;
}

function dungeonChecklist(member, entries, progress, writable, canImport) {
  const statuses = new Map(entries.filter(entry => entry.kind === "dungeon").map(entry => [entry.entry_key, entry.data]));
  const logEntries = new Map(entries.filter(entry => entry.kind === "dungeon-log").map(entry => [entry.entry_key, entry.data]));
  const fromArmory = new Map((progress?.encounters ?? []).map(entry => [entry.name.toLowerCase(), entry.status]));
  const needs = new Set(entries.filter(entry => entry.kind === "need" && entry.data.dungeonId).map(entry => entry.data.dungeonId));
  const rows = dungeons.map(dungeon => {
    const row = statuses.get(dungeon.id) ?? {};
    const imported = logEntries.get(dungeon.id) ?? {};
    const observed = fromArmory.get(dungeon.name.toLowerCase());
    const current = [row.status, imported.status, observed].includes("cleared") ? "cleared" :
      [row.status, imported.status, observed].includes("partial") ? "partial" : "none";
    const log = validUrl(row.log || imported.log, reportHosts);
    const tags = [`Levels ${dungeon.levels}`, row.note, imported.kills?.length ? `${imported.kills.length} logged boss kills` : "",
      row.status ? "Guild record" : observed ? "Blizzard Armory" : imported.status ? "Warcraft Logs" : ""].filter(Boolean);
    return listRow(esc(dungeon.name), tags.map(esc).join(" · ") + (log ? ` · <a class="link" href="${log}" target="_blank" rel="noopener">View log</a>` : ""),
      writable ? `<div class="row-actions">
        ${action("Edit", { action: "dungeon", character: member.slug, dungeon: dungeon.id, name: dungeon.name, progress: row.status ?? current, note: row.note ?? "", log: row.log ?? "", canImport })}
        ${action(needs.has(dungeon.id) ? "Remove request" : "Ask for group", { action: "need", character: member.slug, dungeon: dungeon.id, name: dungeon.name, remove: needs.has(dungeon.id) })}
      </div>` : "",
      `<span class="status-tag status-${current}">${dungeonStatus[current]}</span>`);
  }).join("");
  return section("Dungeon checklist", "A clear applies to the listed dungeon or wing. Guild entries can include a Warcraft Logs link.",
    `<div class="planner-scroll">${rows}</div>`);
}

function unlockChecklist(member, entries, progress, writable) {
  const completed = new Set(entries.filter(entry => entry.kind === "unlock").map(entry => entry.entry_key));
  const armoryNames = new Set((progress?.completed.quests ?? []).filter(quest => !quest.name.startsWith("Quest #")).map(quest => quest.name.toLowerCase()));
  const manualOnly = new Set(["upper-blackrock-spire-1", "upper-blackrock-spire-2"]);
  return section("Attunements & unlocks", "Horde checklists with Armory matches and guild-confirmed steps.",
    unlocks.map(unlock => {
      const isSynced = step => !manualOnly.has(step.id) && armoryNames.has(step.name.toLowerCase());
      const count = unlock.steps.filter(step => completed.has(step.id) || isSynced(step)).length;
      return `<details class="planner-details"><summary><span><strong>${esc(unlock.name)}</strong> <span class="subtle">· ${esc(unlock.reward)}</span></span><span class="subtle">${count}/${unlock.steps.length}${count === unlock.steps.length ? " · Recorded complete" : ""}</span></summary>
        ${unlock.steps.map(step => listRow(esc(step.name), isSynced(step) ? "Completed · Armory" : completed.has(step.id) ? "Completed · Guild checklist" : "Open step",
          writable && !isSynced(step) ? action(completed.has(step.id) ? "Undo" : "Mark done", { action: "unlock", character: member.slug, step: step.id, name: step.name, done: !completed.has(step.id) }) : "")).join("")}</details>`;
    }).join("") + '<p class="panel-note"><a class="link" href="https://wowforever.fit/attunements/" target="_blank" rel="noopener">View attunement guides</a></p>');
}

function groupPage(data, members) {
  const byId = new Map(members.map(member => [member.id, member]));
  const groups = new Map();
  (data.entries ?? []).filter(entry => entry.kind === "need" && byId.has(entry.character_id)).forEach(entry => {
    if (!groups.has(entry.entry_key)) groups.set(entry.entry_key, { data: entry.data, characters: [] });
    groups.get(entry.entry_key).characters.push(byId.get(entry.character_id));
  });
  const requests = [...groups.values()].sort((left, right) => right.characters.length - left.characters.length || left.data.name.localeCompare(right.data.name));
  const cards = requests.map(({ data: request, characters }) => listRow(esc(request.name), `${request.dungeonId ? "Dungeon" : "Quest"} · ${characters.map(member => memberLink(member, true)).join(", ")}`,
    data.writable ? action("Manage request", { action: "need", name: request.name, dungeon: request.dungeonId ?? "", manageable: characters.map(member => member.slug) }) : "")).join("");
  return section("Group requests", "Share a quest or dungeon your character wants help with.", cards || empty("No group requests yet."), data.writable ? action("Request a group", { action: "need" }, true) : "") +
    section("Shared active quests", "Find quests already in the Armory logs of two or more guild characters.", '<div data-active-matches></div>',
      '<button type="button" class="button quiet" data-find-matches>Find shared quests</button>');
}

function wowheadQuest(quest) {
  return `<a href="https://www.wowhead.com/forever/quest=${quest.id}" data-wowhead="quest=${quest.id}&amp;domain=forever" target="_blank" rel="noopener">${esc(quest.name)}</a>`;
}

function dungeonPriority(dungeon, data, activeQuests) {
  const guide = dungeonQuestById.get(dungeon.id);
  const [minLevel, maxLevel] = dungeon.levels.split(/[–-]/).map(Number);
  const characters = data.characters ?? [];
  const inRange = characters.filter(character => character.level >= minLevel && character.level <= maxLevel).length;
  const highestLevel = Math.max(0, ...characters.map(character => character.level ?? 0));
  const active = (guide?.quests ?? []).reduce((sum, quest) => sum + (activeQuests.get(quest.id)?.length ?? 0), 0);
  const shared = (guide?.quests ?? []).filter(quest => (activeQuests.get(quest.id)?.length ?? 0) > 1).length;
  return { dungeon, guide, active, shared, inRange, minLevel, levelDistance: Math.abs(highestLevel - maxLevel) };
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
      completed: completedQuests.get(quest.id)?.size ?? 0,
      checked: characters.filter(character => character.completedAvailable).length
    }))
  }));
}

function partySignups(signups, members) {
  const memberById = new Map(members.map(member => [member.id, member]));
  return signups.map(signup => ({ ...signup, member: memberById.get(signup.character_id) })).filter(signup => signup.member);
}

function questProgressLines(row) {
  if (!row.quests.length) return row.guide
    ? empty("This guide has no quest references in the current index.")
    : '<p class="empty">No Wowhead Forever dungeon guide is indexed yet.</p>';
  return row.quests.map(quest => {
    const activeNames = quest.active.map(member => memberLink(member, true)).join(", ") || "None active in the latest snapshots";
    const completion = quest.checked ? `${quest.completed} complete · ${quest.checked} logs checked` : "Quest history unavailable";
    return `<div class="dungeon-quest line"><div><strong>${wowheadQuest(quest)}</strong><small>${activeNames}</small></div><span class="subtle">${completion}</span></div>`;
  }).join("");
}

function dungeonCard(row, data, members) {
  const signups = partySignups((data.signups ?? []).filter(signup => signup.dungeon_id === row.dungeon.id), members);
  const signupsText = signups.map(signup => `${memberLink(signup.member, true)} · ${esc(signup.role)}${signup.note ? ` · ${esc(signup.note)}` : ""}`).join("<br>") || "No one signed up yet";
  const activeLabel = row.active ? `${row.active} active guide quest ${row.active === 1 ? "need" : "needs"}` : "No active guide quests found";
  const demand = row.shared ? `${row.shared} shared quests` : row.inRange ? `${row.inRange} characters in level range` : "";
  const guideLink = row.guide ? `<a class="link" href="${esc(row.guide.guideUrl)}" target="_blank" rel="noopener">Wowhead guide</a>` : "";
  const leaveButtons = signups.map(signup => data.writable
    ? action(`Leave · ${signup.member.name}`, { action: "signup", dungeon: row.dungeon.id, character: signup.member.slug, remove: true }) : "").join("");
  return `<section class="panel dungeon-plan-card" data-dungeon-card data-dungeon-name="${esc(row.dungeon.name.toLowerCase())}">
    <div class="panel-heading"><div><h2>${esc(row.dungeon.name)}</h2><p>Levels ${esc(row.dungeon.levels)}${demand ? ` · ${esc(demand)}` : ""} · ${esc(activeLabel)}</p></div>
      ${data.writable ? action("Join run", { action: "signup", dungeon: row.dungeon.id }, true) : ""}</div>
    <div class="dungeon-card-content"><div class="dungeon-quest-list">${questProgressLines(row)}${guideLink ? `<p class="panel-note">${guideLink}</p>` : ""}</div>
      <div class="dungeon-party"><strong>Run sign-ups</strong><p>${signupsText}</p>${leaveButtons}</div></div>
  </section>`;
}

function dungeonPlanner(data, members) {
  const plan = buildDungeonPlan(data);
  const available = (data.characters ?? []).filter(character => character.activeAvailable || character.completedAvailable).length;
  const recommended = plan.slice(0, 5);
  const remaining = plan.slice(5);
  const checked = data.checkedAt ? `Armory checked ${timeFormat.format(new Date(data.checkedAt))}` : "Armory quest data is unavailable";
  const introText = available ? `${available} of ${(data.characters ?? []).length} characters have quest snapshots. Quest statuses reflect the latest Armory logs; use Wowhead for guide details.` : "Armory quest logs are unavailable. Dungeon guide links and run sign-ups are still available.";
  return `<div class="dungeon-planner" data-planning>
    <p class="notice" role="status">${esc(introText)}</p>
    ${panel("Recommended next runs", checked, recommended.map(row => dungeonCard(row, data, members)).join("") || empty("No dungeons are indexed."))}
    <section class="panel dungeon-index-panel"><div class="panel-heading"><div><h2>All Forever dungeons</h2><p>Search guides, quest progress, and run sign-ups.</p></div></div>
      <div class="planner-filter"><label for="dungeon-search">Find a dungeon</label><input id="dungeon-search" type="search" placeholder="Search by dungeon name" data-dungeon-search autocomplete="off"></div>
      <div class="dungeon-index" data-dungeon-index>${remaining.map(row => dungeonCard(row, data, members)).join("")}</div>
      <p class="panel-note"><a href="https://www.wowhead.com/forever/guide/dungeons/every-dungeon-quest-location" target="_blank" rel="noopener">Full Wowhead Forever dungeon quest index</a> · Quest references are guide data, not a guarantee of faction or character eligibility.</p>
    </section><dialog aria-labelledby="planner-dialog-title" data-planner-dialog></dialog>
  </div>`;
}

export function planningPage(view, data, members, character, status) {
  const titles = { group: "Group Up", character: character?.name ?? "Character unavailable", planner: "Dungeon planner" };
  const subtitles = { group: "Find guildmates who need the same quests and dungeons.", character: character ? `Level ${character.level} · ${character.className}` : "This character is unavailable.", planner: "Pick the next run from shared quest needs, level range, and who is ready to join." };
  const entries = data.entries ?? [];
  let body;
  if (view === "character") {
    body = character ? profileTabs(character, true) + availableQuests(data.progress, character, data.writable, entries) +
      dungeonChecklist(character, entries, data.progress, data.writable, data.logs) +
      unlockChecklist(character, entries, data.progress, data.writable) : "";
  } else if (view === "planner") {
    body = dungeonPlanner(data, members);
  } else {
    body = groupPage(data, members);
  }
  return {
    title: `${titles[view]}${view === "character" ? " Progress" : ""} | Warfare`,
    result: intro(titles[view], subtitles[view], { back: view === "character" }) + (view === "planner"
      ? `<div class="frame content">${status ? `<p class="notice" role="status">${esc(status)}</p>` : ""}${body}</div>`
      : `<div class="frame content planner-grid${view === "group" ? " group-grid" : ""}" data-planning>
        ${status ? `<p class="notice" role="status">${esc(status)}</p>` : ""}${body}
        <dialog aria-labelledby="planner-dialog-title" data-planner-dialog></dialog>
        </div>`),
    completed: data.progress?.completed.quests ?? []
  };
}

const membershipOptions = (members, allowed) => members
  .filter(member => !allowed || allowed.includes(member.slug))
  .map(member => `<option value="${esc(member.slug)}">${esc(member.name)}</option>`).join("");

function labels(payload) {
  const p = payload;
  if (p.action === "dungeon") return {
    title: `Record ${p.name}`, fields: `<label>Status <select name="progress">${Object.entries(dungeonStatus).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>
      <label>Notes (optional) <input name="note" maxlength="200" placeholder="Bosses defeated or run details"></label>
      <label>Warcraft Logs report (optional) <input type="url" name="log" maxlength="300"></label>`,
    importButton: p.canImport
  };
  if (p.action === "unlock") return { title: p.done ? "Mark unlock step done" : "Reopen unlock step", description: p.name };
  if (p.action === "need") {
    if (p.remove || p.manageable) return { title: "Remove group request", description: p.name };
    if (p.name) return { title: "Request a group", description: p.name };
    return { title: "Request a group", fields: `<label>Dungeon <select name="dungeon"><option value="">Request a quest instead</option>${dungeonOptions}</select></label>
      <label>Quest name <input name="name" maxlength="85" placeholder="Fill in for a quest request"></label>` };
  }
  if (p.action === "signup") return {
    title: p.remove ? "Leave dungeon run" : "Join dungeon run",
    fields: p.remove ? "" : `<label>Role <select name="role"><option>Flexible</option><option>Tank</option><option>Healer</option><option>DPS</option></select></label>
      <label>Note (optional) <input name="note" maxlength="140" placeholder="Availability, key, or short note"></label>`
  };

}

function openPlanningDialog(dialog, payload, members, onSaved) {
  const view = labels(payload);
  const member = members.find(member => member.slug === payload.character);
  const memberField = member ? `<p class="subtle">Character · ${esc(member.name)}</p>` :
    `<label>Character <select name="character" required><option value="">Choose a character</option>${membershipOptions(members, payload.manageable)}</select></label>`;
  const confirmLabel = payload.remove || payload.manageable ? "Remove" : "Save";
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
    if (payload.manageable) data.remove = true;
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

export function bindPlanning(main, members, get, onSaved, completed) {
  const root = main.querySelector("[data-planning]");
  const dialog = root.querySelector("[data-planner-dialog]");
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-planning-action]");
    if (button) openPlanningDialog(dialog, JSON.parse(button.dataset.planningAction), members, onSaved);
  });
  root.querySelector("[data-dungeon-search]")?.addEventListener("input", event => {
    const query = event.currentTarget.value.trim().toLowerCase();
    root.querySelectorAll("[data-dungeon-card]").forEach(card => {
      card.hidden = Boolean(query) && !card.dataset.dungeonName.includes(query);
    });
  });
  const completedQuery = root.querySelector("[data-completed-query]");
  if (completedQuery) {
    const target = root.querySelector("[data-completed-results]");
    const more = root.querySelector("[data-completed-more]");
    const count = root.querySelector("[data-completed-count]");
    let limit = 40;
    const update = () => {
      const query = completedQuery.value.trim().toLowerCase();
      const result = completed.filter(quest => quest.name.toLowerCase().includes(query) || String(quest.id).includes(query));
      const visible = result.slice(0, limit);
      count.textContent = `Showing ${visible.length} of ${result.length}`;
      target.innerHTML = visible.length ? questList(visible, null, false, new Set()) : empty("No matching quests.");
      more.innerHTML = result.length > limit ? '<p class="panel-note"><button type="button" class="button quiet" data-more-completed>Show more</button></p>' : "";
    };
    completedQuery.addEventListener("input", () => { limit = 40; update(); target.scrollTop = 0; });
    more.addEventListener("click", event => {
      if (!event.target.closest("[data-more-completed]")) return;
      limit += 40;
      update();
      (more.querySelector("button") ?? target).focus();
    });
    update();
  }
  root.querySelector("[data-find-matches]")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    const results = root.querySelector("[data-active-matches]");
    const byId = new Map(members.map(member => [member.id, member]));
    button.disabled = true;
    results.innerHTML = '<p class="empty" role="status">Checking guild quest snapshots…</p>';
    try {
      const { matches, checked } = await get("/api/planning?view=quests");
      results.innerHTML = '<p class="panel-note">' + esc(`Active quest logs available for ${checked} guild characters.`) + '</p>' +
        (matches.map(quest => listRow(esc(quest.name), quest.characters.map(id => memberLink(byId.get(id), true)).join(", "))).join("") || empty("No shared active quests found."));
    } catch (error) {
      results.innerHTML = empty(error.message);
    } finally {
      button.disabled = false;
    }
  });
}
