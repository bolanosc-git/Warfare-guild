import { dungeons, dungeonById, unlocks, roles, rsvpStatuses } from "./progress-catalog.js";
import { dateLabel, esc, intro, panel, validUrl } from "./ui.js";

const timeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dungeonStatus = { none: "No clear recorded", partial: "Partial clear", cleared: "Cleared" };
const reportHosts = ["warcraftlogs.com", "www.warcraftlogs.com", "forever.warcraftlogs.com", "classic.warcraftlogs.com"];
const empty = message => `<p class="empty">${esc(message)}</p>`;
const options = values => values.map(value => `<option>${esc(value)}</option>`).join("");
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

function listRow(title, detail, control = "") {
  return `<div class="detail-row line"><div class="planner-row-title"><strong>${title}</strong>${detail ? `<small>${detail}</small>` : ""}</div>${control}</div>`;
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
        <div data-completed-results>${empty("Loading quest history…")}</div>`
    : empty("The Armory has no completed quest history available.");
  return section("Active quests", synced, list) + section("Completed quests", completed?.available ? `${completed.quests.length} quests returned by the Armory` : "", done);
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
    const tags = [dungeon.levels, dungeonStatus[current], row.note, imported.kills?.length ? `${imported.kills.length} logged boss kills` : "",
      row.status ? "Guild record" : observed ? "Blizzard Armory" : imported.status ? "Warcraft Logs" : ""].filter(Boolean);
    return listRow(esc(dungeon.name), tags.map(esc).join(" · ") + (log ? ` · <a class="link" href="${log}" target="_blank" rel="noopener">View log</a>` : ""),
      writable ? `<div class="row-actions">
        ${action("Edit", { action: "dungeon", character: member.slug, dungeon: dungeon.id, name: dungeon.name, progress: row.status ?? current, note: row.note ?? "", log: row.log ?? "", canImport })}
        ${action(needs.has(dungeon.id) ? "Remove request" : "Ask for group", { action: "need", character: member.slug, dungeon: dungeon.id, name: dungeon.name, remove: needs.has(dungeon.id) })}
      </div>` : "");
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

function wishlistPage(data, members, character = null) {
  const byId = new Map(members.map(member => [member.id, member]));
  const entries = (data.entries ?? []).filter(entry => entry.kind === "wish" && byId.has(entry.character_id) && (!character || entry.character_id === character.id));
  const groups = new Map();
  for (const entry of entries) {
    const id = entry.data.dungeonId;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(entry);
  }
  const lists = [...groups].sort((a, b) => b[1].length - a[1].length).map(([id, items]) =>
    `<div data-dungeon-wishes="${esc(id)}"><h3 class="tree-heading">${esc(dungeonById.get(id)?.name ?? id)} · ${items.length} ${items.length === 1 ? "wish" : "wishes"}</h3>${items.map(entry => {
      const member = byId.get(entry.character_id);
      const { item, note } = entry.data;
      return listRow(esc(item), `${memberLink(member, true)}${note ? ` · ${esc(note)}` : ""}`,
        data.writable ? action("Remove", { action: "wish", character: member.slug, dungeon: id, item, remove: true }) : "");
    }).join("")}</div>`).join("");
  const filter = entries.length && !character ? `<div class="planner-filter"><label for="wishlist-dungeon">Filter by dungeon</label><select id="wishlist-dungeon" data-wishlist-filter><option value="">All dungeons</option>${dungeonOptions}</select><p class="subtle" data-wishlist-empty hidden>No wishlist items for this dungeon.</p></div>` : "";
  return section(character ? "Gear wishlist" : "Wishlist by dungeon", "Pick runs that have upgrades for multiple guildmates.",
    filter + (lists || empty("No items on this wishlist yet.")),
    data.writable ? action("Add item", { action: "wish", character: character?.slug }, true) : "");
}

function calendarPage(data, members) {
  const byId = new Map(members.map(member => [member.id, member]));
  const events = data.events ?? [];
  const renderEvent = event => {
    const start = new Date(event.starts_at);
    const future = start.getTime() > Date.now();
    const owner = byId.get(event.character_id);
    const responses = event.guild_event_rsvps ?? [];
    const going = responses.filter(response => response.status === "Going");
    const bucket = response => `${memberLink(byId.get(response.character_id))} · ${esc(response.role)}`;
    const list = rsvpStatuses.map(status => {
      const names = responses.filter(response => response.status === status).map(bucket);
      return names.length ? `<p class="subtle"><strong>${status}</strong> · ${names.join(", ")}</p>` : "";
    }).join("");
    return `<article class="calendar-event line">
      <div class="calendar-date"><time datetime="${esc(event.starts_at)}">${esc(timeFormat.format(start))}</time>${event.dungeon_id ? `<small>${esc(dungeonById.get(event.dungeon_id)?.name)}</small>` : ""}</div>
      <div class="calendar-body"><h3>${esc(event.title)}</h3><p class="subtle">Organizer · ${memberLink(owner)}</p>
      ${event.details ? `<p class="calendar-notes">${esc(event.details)}</p>` : ""}
      <p class="calendar-roles">${roles.map(role => `<span>${going.filter(response => response.role === role).length} ${role}</span>`).join("")}</p>
      ${list}<div class="row-actions">${data.writable && future ? action("RSVP", { action: "rsvp", eventId: event.id, name: event.title, existing: responses.map(response => ({
        character: byId.get(response.character_id)?.slug, role: response.role, response: response.status
      })) }) : ""}
      ${data.writable && future && owner ? action("Edit event", { action: "event", eventId: event.id, character: owner.slug, title: event.title, details: event.details, dungeon: event.dungeon_id ?? "", startsAt: event.starts_at }) + action("Cancel event", { action: "cancel-event", eventId: event.id, character: owner.slug, name: event.title }) : ""}</div></div></article>`;
  };
  const upcoming = events.filter(event => Date.parse(event.starts_at) > Date.now());
  const past = events.filter(event => Date.parse(event.starts_at) <= Date.now());
  return section("Upcoming events", "Dates and times use your device’s time zone.", upcoming.map(renderEvent).join("") || empty("No upcoming events yet."),
    data.writable ? action("Schedule event", { action: "event" }, true) : "") +
    (past.length ? section("Recent events", "Past 30 days", past.reverse().map(renderEvent).join("")) : "");
}

export function planningPage(view, data, members, character, status) {
  const titles = { group: "Group Up", calendar: "Guild calendar", wishlists: "Gear wishlists", character: character?.name ?? "Character unavailable" };
  const subtitles = { group: "Find guildmates who need the same quests and dungeons.", calendar: "Plan guild runs and RSVP as tank, healer, or DPS.", wishlists: "See which dungeon drops guildmates are looking for.", character: character ? `Level ${character.level} · ${character.className}` : "This character is unavailable." };
  const entries = data.entries ?? [];
  let body;
  if (view === "character") {
    body = character ? profileTabs(character, true) + availableQuests(data.progress, character, data.writable, entries) +
      dungeonChecklist(character, entries, data.progress, data.writable, data.logs) +
      unlockChecklist(character, entries, data.progress, data.writable) + wishlistPage(data, members, character) : "";
  } else if (view === "group") body = groupPage(data, members);
  else if (view === "wishlists") body = wishlistPage(data, members);
  else body = calendarPage(data, members);
  return {
    title: `${titles[view]}${view === "character" ? " Progress" : ""} | Warfare`,
    result: intro(titles[view], subtitles[view], { back: view === "character" }) + `<div class="frame content planner-grid" data-planning>
      ${status ? `<p class="notice" role="status">${esc(status)}</p>` : ""}${body}
      <dialog aria-labelledby="planner-dialog-title" data-planner-dialog></dialog>
      </div>`,
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
    if (p.remove) return { title: "Remove group request", description: p.name };
    if (p.manageable) return { title: "Remove group request", description: p.name };
    if (p.name) return { title: "Request a group", description: p.name };
    return { title: "Request a group", fields: `<label>Dungeon <select name="dungeon"><option value="">Request a quest instead</option>${dungeonOptions}</select></label>
      <label>Quest name <input name="name" maxlength="85" placeholder="Fill in for a quest request"></label>` };
  }
  if (p.action === "wish") return p.remove ? { title: "Remove wishlist item", description: p.item } :
    { title: "Add a gear wish", fields: `<label>Dungeon <select name="dungeon" required><option value="">Choose a dungeon</option>${dungeonOptions}</select></label>
      <label>Item name <input name="item" maxlength="75" required></label>
      <label>Boss or loot note (optional) <input name="note" maxlength="150"></label>` };
  if (p.action === "event") return { title: p.eventId ? "Edit guild event" : "Schedule a guild event", fields: `
    <label>Event title <input name="title" maxlength="100" required></label>
    <label>Date and time ${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)} <input type="datetime-local" name="startsAt" required></label>
    <label>Dungeon (optional) <select name="dungeon"><option value="">Choose a dungeon</option>${dungeonOptions}</select></label>
    <label>Details (optional) <textarea name="details" maxlength="600" rows="3"></textarea></label>` };
  if (p.action === "rsvp") return { title: "RSVP", description: p.name, fields: `
    <label>Role <select name="role" required><option value="">Choose a role</option>${options(roles)}</select></label>
    <label>Response <select name="response" required>${options(rsvpStatuses)}</select></label>` };
  return { title: "Cancel guild event", description: p.name };
}

let publishingKey = "";

function localTimeValue(instant) {
  const date = new Date(instant);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function openPlanningDialog(dialog, payload, members, onSaved) {
  const view = labels(payload);
  const member = members.find(member => member.slug === payload.character);
  const memberField = member ? `<p class="subtle">Character · ${esc(member.name)}</p>` :
    `<label>Character <select name="character" required><option value="">Choose a character</option>${membershipOptions(members, payload.manageable)}</select></label>`;
  const confirmLabel = payload.action === "cancel-event" ? "Cancel event" : payload.remove || payload.manageable ? "Remove" : "Save";
  dialog.innerHTML = `<form>
    <h2 id="planner-dialog-title" class="section-title">${esc(view.title)}</h2>
    ${view.description ? `<p class="subtle">${esc(view.description)}</p>` : ""}
    ${memberField}${view.fields ?? ""}
    <label>Guild publishing key <input name="token" type="password" maxlength="256" autocomplete="off" required></label>
    <p class="form-status" role="status"></p>
    <div class="actions"><button type="submit" class="button primary">${confirmLabel}</button>
      ${view.importButton ? '<button type="submit" class="button" value="import-log">Import logged kills</button>' : ""}
      <button type="button" class="button" data-close-planning>Back</button></div>
    </form>`;
  const form = dialog.querySelector("form");
  for (const element of form.elements) {
    if (element.name && typeof payload[element.name] === "string") {
      element.value = element.name === "startsAt" ? localTimeValue(payload.startsAt) : payload[element.name];
    }
  }
  form.elements.token.value = publishingKey;
  if (payload.action === "rsvp") {
    form.elements.character.addEventListener("change", event => {
      const previous = payload.existing.find(entry => entry.character === event.currentTarget.value);
      form.elements.role.value = previous?.role ?? "";
      form.elements.response.value = previous?.response ?? "Going";
    });
  }
  const dismiss = dialog.querySelector("[data-close-planning]");
  dismiss.addEventListener("click", () => dialog.close());
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const { token, ...fields } = Object.fromEntries(new FormData(form));
    const data = { ...payload, ...fields };
    delete data.existing;
    if (payload.manageable) data.remove = true;
    if (event.submitter?.value === "import-log") data.action = "import-log";
    if (fields.startsAt) data.startsAt = new Date(fields.startsAt).toISOString();
    const feedback = form.querySelector(".form-status");
    const buttons = [...form.querySelectorAll('button[type="submit"]')];
    buttons.forEach(button => { button.disabled = true; });
    feedback.textContent = "Saving…";
    try {
      const res = await fetch("/api/planning", { method: "POST", headers: {
        "Content-Type": "application/json", Authorization: `Bearer ${token}`
      }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.status === 401) publishingKey = "";
      if (!res.ok) throw Error(result.error ?? "This update could not be saved.");
      publishingKey = token;
      dialog.close();
      onSaved(result.message || "Saved.");
    } catch (error) {
      feedback.textContent = error.message;
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
  const completedQuery = root.querySelector("[data-completed-query]");
  if (completedQuery) {
    const target = root.querySelector("[data-completed-results]");
    const count = root.querySelector("[data-completed-count]");
    let limit = 40;
    const update = () => {
      const query = completedQuery.value.trim().toLowerCase();
      const result = completed.filter(quest => quest.name.toLowerCase().includes(query) || String(quest.id).includes(query));
      const visible = result.slice(0, limit);
      count.textContent = `Showing ${visible.length} of ${result.length}`;
      target.innerHTML = visible.length ? questList(visible, null, false, new Set()) : empty("No matching quests.");
      if (result.length > limit) target.insertAdjacentHTML("beforeend", '<p class="panel-note"><button type="button" class="button quiet" data-more-completed>Show more</button></p>');
    };
    completedQuery.addEventListener("input", () => { limit = 40; update(); });
    target.addEventListener("click", event => { if (event.target.closest("[data-more-completed]")) { limit += 40; update(); } });
    update();
  }
  root.querySelector("[data-wishlist-filter]")?.addEventListener("change", event => {
    const id = event.target.value;
    let visible = 0;
    root.querySelectorAll("[data-dungeon-wishes]").forEach(element => {
      element.hidden = Boolean(id && element.dataset.dungeonWishes !== id);
      if (!element.hidden) visible++;
    });
    root.querySelector("[data-wishlist-empty]").hidden = visible !== 0;
  });
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
