import { esc, validUrl, dateLabel, intro, panel } from "./ui.js";
import { bindPlanning, planningPage, profileTabs } from "./planning.js";
import { demoCharacter, demoMembers, demoReports } from "./demo.js";
import { tierPrepPage, simCoverage } from "./tier-prep.js";
import { flushQueuedMutations, queuedMutationCount } from "./offline.js";

const icons = {
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
  swords: '<path d="m3 3 5 1 12 12m-4 0 4 4m-7-2 5-5M21 3l-5 1-4.2 4.2M9.4 10.6 4 16m4 0-4 4m7-2-5-5"/>',
  pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  shield: '<path d="M12 22s7-3 7-9V5l-7-3-7 3v8c0 6 7 9 7 9Z"/>',
  flame: '<path d="M13 2c2 6-2 7 2 10 0-2 2-3 3-4 3 5 2 13-6 14-6 0-9-4-8-8 1-4 5-5 5-9 1 1 3 3 3 5 2-3 2-6 1-8Z"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6l1-8Z"/>',
  crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  leaf: '<path d="M21 3C6 2 2 7 4 15c6 7 17 2 17-12ZM3 21l11-11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'
};
const classStyles = {
  Warrior: ["#e5b287", "swords"], Rogue: ["#f3d579", "swords"], Mage: ["#88d9ed", "bolt"],
  Shaman: ["#96b7fa", "bolt"], Hunter: ["#aacf90", "crosshair"], Warlock: ["#c7a9ef", "flame"],
  Priest: ["#e5ded2", "plus"], Druid: ["#f6aa78", "leaf"], Paladin: ["#f4a7c5", "shield"]
};
const main = document.querySelector("#main");
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
let state;
let renderRequest = 0;
let lastFetch = 0;
let status = "";

function icon(name) {
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] ?? icons.shield}</svg>`;
}

async function get(path) {
  const response = await fetch(path);
  if (response.status === 404 && !response.headers.get("content-type")?.includes("application/json")) return null;
  const data = await response.json();
  if (!response.ok) throw Error(data.error ?? "The guild data is temporarily unavailable.");
  return data;
}

async function loadGuild() {
  const data = await get("/api/guild");
  state = data ?? { mode: "demo", faction: "Horde", members: demoMembers, reportWritable: false };
  document.querySelector(".faction").textContent = ["Horde", state.ruleset ? `Americas ${state.ruleset}` : ""].filter(Boolean).join(" · ");
  lastFetch = Date.now();
}

async function loadReports() {
  if (state.mode === "demo") return { reports: demoReports };
  try {
    return await get("/api/reports") ?? { reports: [] };
  } catch (error) {
    return { reports: [], reportError: error.message };
  }
}

function activeNav(path) {
  document.querySelectorAll(".site-header nav [data-nav]").forEach(link => {
    const href = link.getAttribute("href");
    if (href === path || (href === "/roster" && path.startsWith("/character/"))) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function notice(text) {
  return `<p class="notice">${icon("info")}<span>${esc(text)}</span></p>`;
}

function sourceNote() {
  return state.mode === "demo" ? notice("Preview data · The roster and DPS below are examples.") : "";
}

function classStyle(character) {
  return classStyles[character.className] ?? ["#cfad9d", "shield"];
}

function characterMark(character) {
  const [color, symbol] = classStyle(character);
  return `<span class="class-icon" style="--class:${color}">${icon(symbol)}</span>`;
}

function rosterRows(members, full = false, reports = []) {
  if (!members.length) return '<p class="empty">No matching characters.</p>';
  const reportByCharacter = new Map();
  for (const report of reports) {
    const previous = reportByCharacter.get(report.characterId);
    if (!previous || new Date(report.date ?? 0) > new Date(previous.date ?? 0)) reportByCharacter.set(report.characterId, report);
  }
  const header = full
    ? '<div class="roster-row roster-label" role="row"><span class="level" role="columnheader">Level</span><span role="columnheader">Character</span><span class="class-name" role="columnheader">Class</span><span class="rank" role="columnheader">Rank</span><span class="sim-cell" role="columnheader">Latest DPS</span><span class="sim-action" role="columnheader">Action</span></div>'
    : '<div class="roster-row roster-label"><span class="level">Level</span><span>Character</span><span>Class</span></div>';
  return header + members.map(character => {
    const [color] = classStyle(character);
    const rank = character.rank === 0 ? "Guild Master" : Number.isInteger(character.rank) ? `Rank ${character.rank}` : "—";
    const caption = full ? [character.className, rank === "—" ? character.race : rank].filter(Boolean).join(" · ") :
      character.rank === 0 ? rank : character.race || "Horde";
    const name = `<a class="person" href="/character/${encodeURIComponent(character.slug)}" data-nav style="--class:${color}">${characterMark(character)}<span><strong>${esc(character.name)}</strong><small${full ? ' class="mobile-caption"' : ""}>${esc(caption)}</small></span></a>`;
    if (!full) return `<div class="roster-row roster-entry line" style="--class:${color}"><span class="level">${esc(character.level ?? "—")}</span>${name}<span class="class-name">${esc(character.className)}</span></div>`;
    const report = reportByCharacter.get(character.id);
    const reportUrl = report ? validUrl(report.url, ["mythicsim.com", "www.mythicsim.com"]) : "";
    const result = report ? `<span class="roster-sim"><strong>${number.format(report.dps)}</strong><small>${esc(report.scenario)} · ${dateLabel(report.date)}</small></span>` : '<span class="roster-sim"><span class="subtle">No sim yet</span></span>';
    const runSim = `<a class="button quiet run-sim" href="https://mythicsim.com/wow-forever/sim" target="_blank" rel="noopener" aria-label="Run MythicSim for ${esc(character.name)}">Run Sim</a>`;
    const sim = reportUrl ? `<a class="roster-sim-link" href="${reportUrl}" target="_blank" rel="noopener" aria-label="View ${esc(character.name)}’s latest MythicSim result">${result}</a>` : result;
    return `<div class="roster-row roster-entry line" role="row" data-roster-row data-name="${esc(character.name.toLocaleLowerCase())}" data-class="${esc(character.className.toLocaleLowerCase())}" data-rank="${Number.isInteger(character.rank) ? character.rank : 999}" data-level="${Number(character.level) || 0}" data-dps="${report ? report.dps : -1}" data-sim-date="${report ? new Date(report.date ?? 0).getTime() : 0}">
      <span class="level" role="cell">${esc(character.level ?? "—")}</span><span role="cell">${name}</span><span class="class-name" role="cell">${esc(character.className)}</span><span class="rank" role="cell">${esc(rank)}</span><span class="sim-cell" role="cell">${sim}</span><span class="sim-action" role="cell">${runSim}</span>
    </div>`;
  }).join("");
}

function simRows(reports, detailed = false) {
  if (!reports.length) return '<p class="empty">No simulation reports yet.</p>';
  const members = new Map(state.members.map(character => [character.id, character]));
  const rows = [...reports].sort((left, right) => new Date(right.date ?? 0) - new Date(left.date ?? 0));
  return `<div class="${detailed ? "report-table" : ""}"${detailed ? ' data-report-list' : ""}>` + rows.map(report => {
    const member = members.get(report.characterId);
    const character = member
      ? `<a href="/character/${encodeURIComponent(member.slug)}" data-nav>${esc(member.name)}</a>`
      : esc(report.characterName ?? "Former guild member");
    const href = validUrl(report.url, ["mythicsim.com", "www.mythicsim.com", "www.raidbots.com", "raidbots.com", "mimiron.raidbots.com"]);
    return `<div class="sim-row line"${detailed ? ` data-report-row data-scenario="${esc((report.scenario ?? "").toLocaleLowerCase())}" data-dps="${Number(report.dps) || 0}" data-date="${new Date(report.date ?? 0).getTime()}"` : ""}>
      <div><strong>${character}</strong><p class="subtle">${report.provider ? `${esc(report.provider)} · ` : ""}${esc(report.scenario)} · ${report.dateKind === "imported" ? "Imported " : ""}${dateLabel(report.date)}</p></div>
      <span class="sim-number">${number.format(report.dps)}<small>DPS</small></span>
      ${detailed && href ? `<a class="link" href="${href}" target="_blank" rel="noopener">View report</a>` : ""}</div>`;
  }).join("") + "</div>";
}

function bindReportSorting(root) {
  root.querySelectorAll("[data-report-sort]").forEach(select => select.addEventListener("change", () => {
    const list = select.closest(".panel")?.querySelector("[data-report-list]");
    if (!list) return;
    const field = select.value;
    const rows = [...list.querySelectorAll("[data-report-row]")];
    rows.sort((left, right) => {
      const a = left.dataset[field] ?? "";
      const b = right.dataset[field] ?? "";
      return field === "scenario" ? a.localeCompare(b) : Number(b) - Number(a);
    });
    list.append(...rows);
  }));
}

function bindSortControls(root) {
  root.querySelectorAll("[data-sort-target]").forEach(select => {
    const sort = () => {
      const list = root.querySelector(`[data-sort-list="${select.dataset.sortTarget}"]`);
      if (!list) return;
      const [field, direction = "asc"] = select.value.split(":");
      const rows = [...list.querySelectorAll(":scope > [data-sort-row]")];
      rows.sort((left, right) => {
        const a = left.dataset[field] ?? "";
        const b = right.dataset[field] ?? "";
        const comparison = field === "name" ? a.localeCompare(b) : Number(a) - Number(b);
        return direction === "desc" ? -comparison : comparison;
      });
      list.append(...rows);
    };
    select.addEventListener("change", sort);
    sort();
  });
}

function latestReports(reports) {
  const latest = new Map();
  for (const report of reports) {
    const previous = latest.get(report.characterId);
    if (!previous || new Date(report.date ?? 0) > new Date(previous.date ?? 0)) latest.set(report.characterId, report);
  }
  return [...latest.values()].sort((left, right) => new Date(right.date ?? 0) - new Date(left.date ?? 0));
}

function atlasEntry(symbol, title, description, label, href) {
  return `<a class="atlas-entry line" href="${href}" data-nav>
    <span class="atlas-entry-icon">${icon(symbol)}</span>
    <div><h3>${title}</h3><p>${description}</p><span class="link">${label}</span></div>
  </a>`;
}

function overview() {
  const guildClassCount = new Set(state.members.map(member => member.className)).size;
  const guildSize = `${state.members.length} ${state.members.length === 1 ? "character" : "characters"} · ${guildClassCount} ${guildClassCount === 1 ? "class" : "classes"}`;
  return `
    <section class="frame stronghold">
      <div class="hero-content">
        <p class="eyebrow">World of Warcraft: Forever</p>
        <h1>Warfare</h1>
        <p class="intro-description">Choose your next dungeon, review character builds, and follow the progress of Warfare’s Horde roster.</p>
        <div class="actions">
          <a class="button primary" href="/dungeon-planner" data-nav>Plan next dungeon</a>
          <a class="button" href="/roster" data-nav>Browse roster</a>
        </div>
      </div>
    </section>
    <div class="frame content dashboard">
      ${sourceNote()}
      ${panel("Guild roster", guildSize, rosterRows(state.members.slice(0, 4)), '<a href="/roster" data-nav class="link">Full roster</a>')}
      ${panel("Guild tools", "", [
        atlasEntry("crosshair", "Dungeon planner", "Use shared quests and levels to choose what to tackle next.", "Open planner", "/dungeon-planner"),
        atlasEntry("users", "Character progress", "Active quests, dungeon clears, and attunements.", "Choose a character", "/roster"),
        atlasEntry("shield", "Tier 1 readiness", "Track level and sim coverage before the next tier.", "View prep", "/tier-prep")
      ].join(""))}
    </div>`;
}

function reportDialog() {
  const options = state.members.map(character => `<option value="${esc(character.slug)}">${esc(character.name)}</option>`).join("");
  return `<dialog aria-labelledby="import-title"><form data-report-form>
    <h2 id="import-title" class="section-title">Publish MythicSim result</h2>
    <p class="subtle">Run Quick Sim in MythicSim, then copy the result page URL from the address bar and enter its displayed DPS. The link and DPS are visible to site visitors.</p>
    <label>Character <select required name="character"><option value="">Choose a character</option>${options}</select></label>
    <label>MythicSim result URL <input type="url" name="url" placeholder="https://mythicsim.com/sims/…" maxlength="240" required></label>
    <label>Simulated DPS <input type="number" name="dps" inputmode="decimal" min="0.01" max="1000000000" step="any" placeholder="DPS shown on the result" required></label>
    <label>Encounter settings (optional) <input name="scenario" maxlength="100" placeholder="e.g. Single target, 2 minutes"></label>
    <p class="form-status" role="status"></p>
    <div class="actions"><button class="button primary" type="submit">Publish result</button><button class="button" type="button" data-report-close>Cancel</button></div>
  </form></dialog>`;
}

function roster(reports, reportError) {
  const classes = [...new Set(state.members.map(character => character.className))].sort();
  const importButton = state.reportWritable && state.members.length ? '<button class="button primary" data-report-open>Publish sim result</button>' : "";
  const openSimulator = '<a class="button" href="https://mythicsim.com/wow-forever/sim" target="_blank" rel="noopener">Run Sim on MythicSim</a>';
  const armoryLink = '<a class="button quiet" href="https://worldofwarcraft.blizzard.com/en-us/forever/us/armory/guild/warfare" target="_blank" rel="noopener">Blizzard Armory</a>';
  const coverage = simCoverage(state.members, reports);
  return intro("Guild roster", "Browse Warfare’s characters, gear, talents, professions, and latest DPS sims.", { action: openSimulator + importButton + armoryLink }) + `
    <div class="frame content">
      ${sourceNote()}
      ${reportError ? notice(reportError) : ""}${status ? notice(status) : ""}
      <p class="roster-sim-summary">${coverage.current} of ${coverage.total} characters have a sim from the last 30 days. Each row shows the latest published result.</p>
      <form class="page-toolbar" data-roster-filters>
        <label>Search characters <input type="search" name="search" placeholder="Search by character name" autocomplete="off"></label>
        <label>Class <select name="className"><option value="">All classes</option>${classes.map(name => `<option>${esc(name)}</option>`).join("")}</select></label>
        <label>Sort by <select name="sort"><option value="rank">Guild rank</option><option value="name">Character name</option><option value="class">Class</option><option value="level">Highest level</option><option value="dps">Highest DPS</option><option value="sim">Most recent sim</option></select></label>
      </form>
      <p class="result-count" aria-live="polite"></p>
      <section class="panel full-roster" data-roster-results aria-label="Characters" role="table"></section>
      ${importButton ? reportDialog() : ""}
    </div>`;
}

function updateRoster(form, reports) {
  const { search, className, sort } = Object.fromEntries(new FormData(form));
  const query = search.trim().toLocaleLowerCase();
  const members = state.members.filter(character => character.name.toLocaleLowerCase().includes(query) && (!className || character.className === className));
  const reportMap = new Map(latestReports(reports).map(report => [report.characterId, report]));
  const compareName = (left, right) => left.name.localeCompare(right.name);
  if (sort === "name") members.sort(compareName);
  if (sort === "class") members.sort((left, right) => left.className.localeCompare(right.className) || compareName(left, right));
  if (sort === "level") members.sort((left, right) => (right.level ?? 0) - (left.level ?? 0) || compareName(left, right));
  if (sort === "dps") members.sort((left, right) => (reportMap.get(right.id)?.dps ?? -1) - (reportMap.get(left.id)?.dps ?? -1) || compareName(left, right));
  if (sort === "sim") members.sort((left, right) => new Date(reportMap.get(right.id)?.date ?? 0) - new Date(reportMap.get(left.id)?.date ?? 0) || compareName(left, right));
  if (sort === "rank") members.sort((left, right) => (left.rank ?? Infinity) - (right.rank ?? Infinity) || compareName(left, right));
  document.querySelector(".result-count").textContent = `${members.length} of ${state.members.length} characters`;
  document.querySelector("[data-roster-results]").innerHTML = rosterRows(members, true, reports);
}

const empty = message => `<p class="empty">${esc(message)}</p>`;

function detailRow(name, subtitle, value) {
  return `<li class="detail-row line"><span class="gear-name"><span><strong>${esc(name)}</strong>
    ${subtitle ? `<small>${esc(subtitle)}</small>` : ""}</span></span><span class="level">${esc(value)}</span></li>`;
}

function wowheadLink(kind, id, name) {
  return `<a href="https://www.wowhead.com/forever/${kind}=${id}" data-wowhead="${kind}=${id}&amp;domain=forever" target="_blank" rel="noopener">${esc(name)}</a>`;
}

function detailMarkupRow(name, subtitle, value) {
  return `<li class="detail-row line"><span class="gear-name"><span><strong>${name}</strong>${subtitle ? `<small>${esc(subtitle)}</small>` : ""}</span></span><span class="level">${esc(value)}</span></li>`;
}

function detailList(items, mapper, message) {
  return items.length ? `<ul class="profile-list">${items.map(mapper).join("")}</ul>` : empty(message);
}

function characterPage(character, { reports, reportError }) {
  if (!character) return intro("Character unavailable", "This character could not be found in the current guild roster.", { back: true });
  const armory = validUrl(character.armoryUrl, ["worldofwarcraft.blizzard.com"]);
  const label = [character.level && `Level ${character.level}`, character.race, character.className].filter(Boolean).join(" · ");
  const history = reports.filter(report => report.characterId === character.id);
  const gear = detailList(character.gear, item => detailMarkupRow(item.id ? wowheadLink("item", item.id, item.name) : esc(item.name),
    [item.slot, item.qualityLabel, item.enchant].filter(Boolean).join(" · "), item.level ? `iLvl ${item.level}` : ""),
    "Equipment details are unavailable.");
  const talents = character.talents.length ? character.talents.map(tree => `<div class="tree-heading">${esc(tree.name)}${Number.isFinite(tree.points) ? ` · ${tree.points} points` : ""}</div>` +
    detailList(tree.talents, talent => detailMarkupRow(talent.spellId ? wowheadLink("spell", talent.spellId, talent.name) : esc(talent.name), "", talent.rank ? `Rank ${talent.rank}` : ""), "No ranked talents reported.")).join("") : empty("Talent details are unavailable.");
  const professions = detailList(character.professions, profession => detailRow(profession.name, [profession.group, profession.tier].filter(Boolean).join(" · "), Number.isFinite(profession.current) ? `${profession.current}${profession.max ? ` / ${profession.max}` : ""}` : ""), "Profession details are unavailable.");
  return intro(character.name, label, { back: true, mark: characterMark(character), action: armory ? `<a class="button" href="${armory}" target="_blank" rel="noopener">Blizzard Armory</a>` : "" }) + `
    <div class="frame content">
      ${sourceNote()}
      ${profileTabs(character, false)}
      ${character.profileUnavailable ? notice(character.profileUnavailable) : ""}
      <div class="profile-grid">
        ${panel("Equipment", character.itemLevel ? `Average item level ${character.itemLevel}` : "Equipped gear", gear)}
        <div class="profile-stack">
          ${panel("Talents", "", talents)}
          ${panel("Professions", "", professions)}
          ${panel("DPS history", "", reportError ? notice(reportError) : simRows(history, true), '<label class="compact-sort"><span>Sort</span><select data-report-sort aria-label="Sort DPS history"><option value="date">Newest</option><option value="dps">Highest DPS</option><option value="scenario">Encounter</option></select></label>')}
        </div>
      </div>
      ${character.updatedAt ? `<p class="subtle">Armory snapshot · ${dateLabel(character.updatedAt)}</p>` : ""}
    </div>`;
}

async function submitReport(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const { character, url, dps, scenario } = Object.fromEntries(new FormData(form));
  const button = form.querySelector('[type="submit"]');
  const feedback = form.querySelector(".form-status");
  button.disabled = true;
  feedback.textContent = "Saving MythicSim result…";
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character, url, dps: Number(dps), scenario })
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error ?? "The report could not be saved.");
    status = "MythicSim result saved.";
    await render(false);
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function render(moveFocus = true) {
  const request = ++renderRequest;
  if (/^\/simulations\/?$/.test(location.pathname)) history.replaceState({}, "", "/roster");
  const path = location.pathname.replace(/\/$/, "") || "/";
  activeNav(path);
  if (moveFocus) {
    main.innerHTML = '<div class="frame loading" role="status">Loading Warfare…</div>';
    main.focus({ preventScroll: true });
    scrollTo(0, 0);
  }
  try {
    if (!state || Date.now() - lastFetch > 300_000) await loadGuild();
    let result, title;
    let completed = [];
    let currentReports = [];
    if (path === "/") {
      result = overview();
      title = "Warfare";
    } else if (path === "/roster") {
      const reportData = await loadReports();
      currentReports = reportData.reports;
      result = roster(reportData.reports, reportData.reportError);
      title = "Guild Roster | Warfare";
    } else if (path === "/dungeon-planner" || /^\/character\/[^/]+\/progress$/.test(path)) {
      const view = path === "/dungeon-planner" ? "planner" : "character";
      const slug = view === "character" ? decodeURIComponent(path.split("/")[2]) : null;
      const character = slug ? state.members.find(member => member.slug === slug) : null;
      const query = view === "character" ? `character&slug=${encodeURIComponent(slug)}` : view;
      const data = slug && !character ? {} : await get(`/api/planning?view=${query}`) ?? {};
      ({ result, title, completed } = planningPage(view, data, character, status));
    } else if (path === "/tier-prep") {
      const { reports, reportError } = await loadReports();
      result = tierPrepPage(state.members, reports);
      if (reportError) result = result.replace('<div class="frame content tier-grid">', `<div class="frame content tier-grid">${notice(reportError)}`);
      title = "Tier 1 Readiness | Warfare";
    } else if (path.startsWith("/character/")) {
      const slug = decodeURIComponent(path.slice("/character/".length));
      const [character, reports] = await Promise.all([
        state.mode === "demo" ? demoCharacter(slug) : get(`/api/character?slug=${encodeURIComponent(slug)}`).catch(error => {
          if (!state.members.some(member => member.slug === slug)) return null;
          throw error;
        }),
        loadReports()
      ]);
      result = characterPage(character, reports);
      title = character ? `${character.name} | Warfare` : "Character Unavailable | Warfare";
    } else {
      result = intro("Page unavailable", "Return to the guild roster to find a character.", { back: true });
      title = "Warfare";
    }
    if (request !== renderRequest) return;
    document.title = `${title} · WoW Forever`;
    main.innerHTML = result;
    requestAnimationFrame(() => globalThis.WH?.Tooltips?.refreshLinks?.(true));
    const filters = main.querySelector("[data-roster-filters]");
    if (filters) {
      filters.addEventListener("input", () => updateRoster(filters, currentReports));
      filters.addEventListener("submit", event => event.preventDefault());
      updateRoster(filters, currentReports);
    }
    bindSortControls(main);
    bindReportSorting(main);
    if (main.querySelector("[data-planning]")) bindPlanning(main, state.members, message => {
      if (request !== renderRequest) return;
      status = message;
      render(false);
    }, completed);
    const dialog = main.querySelector("dialog");
    main.querySelector("[data-report-open]")?.addEventListener("click", () => dialog.showModal());
    main.querySelector("[data-report-close]")?.addEventListener("click", () => dialog.close());
    main.querySelector("[data-report-form]")?.addEventListener("submit", submitReport);
  } catch (error) {
    if (request !== renderRequest) return;
    main.innerHTML = intro("Guild data unavailable", error.message, { action: '<button class="button" id="reload">Try again</button>' });
    main.querySelector("#reload").addEventListener("click", () => render());
  }
}

function offlineIndicator() {
  const target = document.querySelector("#offline-status");
  if (!target) return;
  const queued = queuedMutationCount();
  target.textContent = !navigator.onLine ? "Offline · cached field guide" : queued ? `Online · ${queued} update${queued === 1 ? "" : "s"} waiting` : "Online";
  target.classList.toggle("is-offline", !navigator.onLine);
  target.classList.toggle("has-pending", Boolean(queued));
}

window.addEventListener("online", () => { flushQueuedMutations(); offlineIndicator(); });
window.addEventListener("offline", offlineIndicator);
window.addEventListener("warfare-offline-queue", offlineIndicator);
window.addEventListener("warfare-offline-synced", () => {
  localStorage.setItem("warfare-last-sync", new Date().toISOString());
  status = "Offline changes synced.";
  offlineIndicator();
  render(false);
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
offlineIndicator();
flushQueuedMutations();

document.addEventListener("click", event => {
  const link = event.target.closest("a[data-nav]");
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  status = "";
  if (location.pathname !== link.pathname) history.pushState({}, "", link.pathname);
  render();
});
window.addEventListener("popstate", () => {
  status = "";
  render();
});
render(false);
