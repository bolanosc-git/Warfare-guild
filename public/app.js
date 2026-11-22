import { esc, validUrl, dateLabel, intro, panel } from "./ui.js";
import { bindPlanning, planningPage, profileTabs } from "./planning.js";
import { demoCharacter, demoMembers, demoReports } from "./demo.js";

const icons = {
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
  swords: '<path d="m3 3 5 1 12 12m-4 0 4 4m-7-2 5-5M21 3l-5 1-4.2 4.2M9.4 10.6 4 16m4 0-4 4m7-2-5-5"/>',
  pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  flag: '<path d="M5 22V3c6-5 8 5 15 0v11c-7 5-9-5-15 0"/>',
  shield: '<path d="M12 22s7-3 7-9V5l-7-3-7 3v8c0 6 7 9 7 9Z"/>',
  flame: '<path d="M13 2c2 6-2 7 2 10 0-2 2-3 3-4 3 5 2 13-6 14-6 0-9-4-8-8 1-4 5-5 5-9 1 1 3 3 3 5 2-3 2-6 1-8Z"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6l1-8Z"/>',
  crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  leaf: '<path d="M21 3C6 2 2 7 4 15c6 7 17 2 17-12ZM3 21l11-11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'
};
const classStyles = {
  Warrior: ["#daaa80", "swords"], Rogue: ["#ecc771", "swords"], Mage: ["#8ad4ec", "bolt"],
  Shaman: ["#8bb1fa", "bolt"], Hunter: ["#aace8d", "crosshair"], Warlock: ["#bca1ef", "flame"],
  Priest: ["#f3e5da", "plus"], Druid: ["#f39760", "leaf"], Paladin: ["#f29ec0", "shield"]
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
  document.querySelectorAll("nav [data-nav]").forEach(link => {
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
  return classStyles[character.className] ?? ["#dbc0b2", "shield"];
}

function rosterRows(members, full = false) {
  if (!members.length) return '<p class="empty">No matching characters.</p>';
  return `<div class="roster-row roster-label"><span>Character</span><span>Class</span>${full ? "<span>Rank</span>" : ""}<span class="level">Lv</span></div>` +
    members.map(character => {
      const [color, symbol] = classStyle(character);
      const rank = character.rank === 0 ? "Guild Master" : Number.isInteger(character.rank) ? `Rank ${character.rank}` : "—";
      return `<a class="roster-row line" href="/character/${encodeURIComponent(character.slug)}" data-nav style="--class:${color}">
        <span class="person"><span class="class-icon">${icon(symbol)}</span><strong>${esc(character.name)}</strong></span>
        <span class="class-name">${esc(character.className)}</span>${full ? `<span class="rank">${rank}</span>` : ""}
        <span class="level">${esc(character.level ?? "—")}</span></a>`;
    }).join("");
}

function simRows(reports, detailed = false) {
  if (!reports.length) return '<p class="empty">No simulation reports yet.</p>';
  const members = new Map(state.members.map(character => [character.id, character]));
  return `<div class="${detailed ? "report-table" : ""}">` + reports.map(report => {
    const member = members.get(report.characterId);
    const character = member
      ? `<a href="/character/${encodeURIComponent(member.slug)}" data-nav>${esc(member.name)}</a>`
      : esc(report.characterName ?? "Former guild member");
    const href = validUrl(report.url, ["mythicsim.com", "www.mythicsim.com", "www.raidbots.com", "raidbots.com", "mimiron.raidbots.com"]);
    return `<div class="sim-row line">
      <div><strong>${character}</strong><p class="subtle">${report.provider ? `${esc(report.provider)} · ` : ""}${esc(report.scenario)} · ${report.dateKind === "imported" ? "Imported " : ""}${dateLabel(report.date)}</p></div>
      <span class="sim-number">${number.format(report.dps)}<small>DPS</small></span>
      ${detailed && href ? `<a class="link" href="${href}" target="_blank" rel="noopener">View report</a>` : ""}</div>`;
  }).join("") + "</div>";
}

function latestReports(reports) {
  const ids = new Set();
  return reports.filter(report => {
    if (ids.has(report.characterId)) return false;
    ids.add(report.characterId);
    return true;
  });
}

function metric(symbol, value, label) {
  return `<div class="metric"><span class="metric-icon">${icon(symbol)}</span>
    <span><strong>${esc(value)}</strong><small>${esc(label)}</small></span></div>`;
}

function overview({ reports, reportError }) {
  const guildClassCount = new Set(state.members.map(member => member.className)).size;
  const latest = latestReports(reports).slice(0, 4);
  const description = "Guild roster, character builds, and raid preparation.";
  return `
    <section class="hero"><div class="frame hero-content">
      <p class="eyebrow">World of Warcraft: Forever</p>
      <h1>Warfare</h1>
      <p class="hero-tagline">For the Horde</p>
      <p class="hero-description">${description}</p>
      <div class="actions">
        <a class="button primary" href="/roster" data-nav>${icon("users")} Explore roster</a>
        <a class="button" href="/simulations" data-nav>${icon("pulse")} View simulations</a>
      </div>
    </div></section>
    <div class="summary"><div class="frame summary-inner">
      ${metric("users", state.members.length, "Guild characters")}
      ${metric("shield", guildClassCount, "Classes represented")}
      ${metric("pulse", reportError ? "—" : reports.length, "Recent sim reports")}
      ${metric("flag", state.ruleset || "Horde", state.ruleset ? "Guild ruleset" : "Guild faction")}
    </div></div>
    <div class="frame content dashboard">
      ${sourceNote()}
      ${panel("Guild roster", "Browse characters and equipped builds", rosterRows(state.members.slice(0, 4)), '<a href="/roster" data-nav class="link">Full roster</a>')}
      ${panel("Recent DPS sims", "Latest report per character", reportError ? notice(reportError) : simRows(latest), '<a href="/simulations" data-nav class="link">Sim history</a>')}
    </div>`;
}

function roster() {
  const classes = [...new Set(state.members.map(character => character.className))].sort();
  const armoryLink = '<a class="button" href="https://worldofwarcraft.blizzard.com/en-us/forever/us/armory/guild/warfare" target="_blank" rel="noopener">View live roster on Blizzard Armory</a>';
  return intro("Guild roster", "Browse Warfare’s characters, gear, talents, and professions.", { action: armoryLink }) + `
    <div class="frame content">
      ${sourceNote()}
      <form class="page-toolbar" data-roster-filters>
        <label>Search characters <input type="search" name="search" placeholder="Search by character name" autocomplete="off"></label>
        <label>Class <select name="className"><option value="">All classes</option>${classes.map(name => `<option>${esc(name)}</option>`).join("")}</select></label>
        <label>Sort by <select name="sort"><option value="rank">Guild rank</option><option value="level">Highest level</option><option value="name">Character name</option></select></label>
      </form>
      <p class="result-count" aria-live="polite"></p>
      <section class="panel full-roster" data-roster-results aria-label="Characters"></section>
    </div>`;
}

function updateRoster(form) {
  const { search, className, sort } = Object.fromEntries(new FormData(form));
  const query = search.trim().toLocaleLowerCase();
  const members = state.members.filter(character => character.name.toLocaleLowerCase().includes(query) && (!className || character.className === className));
  if (sort === "name") members.sort((left, right) => left.name.localeCompare(right.name));
  if (sort === "level") members.sort((left, right) => right.level - left.level || left.name.localeCompare(right.name));
  document.querySelector(".result-count").textContent = `${members.length} of ${state.members.length} characters`;
  document.querySelector("[data-roster-results]").innerHTML = rosterRows(members, true);
}

const empty = message => `<p class="empty">${esc(message)}</p>`;

function detailRow(name, subtitle, value) {
  return `<li class="detail-row line"><span class="gear-name"><span><strong>${esc(name)}</strong>
    ${subtitle ? `<small>${esc(subtitle)}</small>` : ""}</span></span><span class="level">${esc(value)}</span></li>`;
}

function detailList(items, mapper, message) {
  return items.length ? `<ul class="profile-list">${items.map(mapper).join("")}</ul>` : empty(message);
}

function characterPage(character, { reports, reportError }) {
  if (!character) return intro("Character unavailable", "This character could not be found in the current guild roster.", { back: true });
  const armory = validUrl(character.armoryUrl, ["worldofwarcraft.blizzard.com"]);
  const label = [character.level && `Level ${character.level}`, character.race, character.className].filter(Boolean).join(" · ");
  const history = reports.filter(report => report.characterId === character.id);
  const gear = detailList(character.gear, item => detailRow(item.name,
    [item.slot, item.qualityLabel, item.enchant].filter(Boolean).join(" · "), item.level ? `iLvl ${item.level}` : ""),
    "Equipment details are unavailable.");
  const talents = character.talents.length ? character.talents.map(tree => `<div class="tree-heading">${esc(tree.name)}${Number.isFinite(tree.points) ? ` · ${tree.points} points` : ""}</div>` +
    detailList(tree.talents, talent => detailRow(talent.name, "", talent.rank ? `Rank ${talent.rank}` : ""), "No ranked talents reported.")).join("") : empty("Talent details are unavailable.");
  const professions = detailList(character.professions, profession => detailRow(profession.name, [profession.group, profession.tier].filter(Boolean).join(" · "), Number.isFinite(profession.current) ? `${profession.current}${profession.max ? ` / ${profession.max}` : ""}` : ""), "Profession details are unavailable.");
  return intro(character.name, label, { back: true, eyebrow: "Warfare armory", action: armory ? `<a class="button" href="${armory}" target="_blank" rel="noopener">Blizzard Armory</a>` : "" }) + `
    <div class="frame content">
      ${sourceNote()}
      ${profileTabs(character, false)}
      ${character.profileUnavailable ? notice(character.profileUnavailable) : ""}
      <div class="profile-grid">
        ${panel("Equipment", character.itemLevel ? `Average item level ${character.itemLevel}` : "Equipped gear", gear)}
        <div class="profile-stack">
          ${panel("Talents", "", talents)}
          ${panel("Professions", "", professions)}
          ${panel("DPS history", "", reportError ? notice(reportError) : simRows(history, true))}
        </div>
      </div>
      ${character.updatedAt ? `<p class="subtle">Armory snapshot · ${dateLabel(character.updatedAt)}</p>` : ""}
    </div>`;
}

function simulations({ reports, reportError }) {
  const importButton = state.reportWritable && state.members.length ? '<button class="button primary" data-report-open>Publish MythicSim result</button>' : "";
  const openSimulator = '<a class="button" href="https://mythicsim.com/wow-forever/sim" target="_blank" rel="noopener">Open MythicSim</a>';
  const options = state.members.map(character => `<option value="${esc(character.slug)}">${esc(character.name)}</option>`).join("");
  return intro("DPS simulations", "Use MythicSim Quick Sim for equipped DPS or Best Gear to compare items. Share completed Quick Sim results with Warfare.", { action: openSimulator + importButton }) + `
    <div class="frame content">
      ${sourceNote()}
      ${reportError ? notice(reportError) : ""}
      ${status ? notice(status) : ""}
      ${panel("Report history", "Newest first · Compare DPS using matching encounter settings", simRows(reports, true) +
      '<p class="panel-note">Saved DPS summaries remain available if the original result link expires.</p>')}
      ${importButton ? `<dialog aria-labelledby="import-title"><form data-report-form>
        <h2 id="import-title" class="section-title">Publish MythicSim result</h2>
        <p class="subtle">Run Quick Sim in MythicSim, then copy the result page URL from the address bar and enter its displayed DPS. The link and DPS are visible to site visitors.</p>
        <label>Character <select required name="character"><option value="">Choose a character</option>${options}</select></label>
        <label>MythicSim result URL <input type="url" name="url" placeholder="https://mythicsim.com/sims/…" maxlength="240" required></label>
        <label>Simulated DPS <input type="number" name="dps" inputmode="decimal" min="0.01" max="1000000000" step="any" placeholder="DPS shown on the result" required></label>
        <label>Encounter settings (optional) <input name="scenario" maxlength="100" placeholder="e.g. Single target, 2 minutes"></label>
        <label>Guild publishing key <input type="password" name="token" autocomplete="off" maxlength="256" required></label>
        <p class="form-status" role="status"></p>
        <div class="actions"><button class="button primary" type="submit">Publish report</button><button class="button" type="button" data-report-close>Cancel</button></div>
      </form></dialog>` : ""}
    </div>`;
}

async function submitReport(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const { character, token, url, dps, scenario } = Object.fromEntries(new FormData(form));
  const button = form.querySelector('[type="submit"]');
  const feedback = form.querySelector(".form-status");
  button.disabled = true;
  feedback.textContent = "Saving MythicSim result…";
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
    if (path === "/") {
      result = overview(await loadReports());
      title = "Warfare";
    } else if (path === "/roster") {
      result = roster();
      title = "Guild Roster | Warfare";
    } else if (path === "/simulations") {
      result = simulations(await loadReports());
      title = "DPS Simulations | Warfare";
    } else if (path === "/group-up" || /^\/character\/[^/]+\/progress$/.test(path)) {
      const view = path === "/group-up" ? "group" : "character";
      const slug = view === "character" ? decodeURIComponent(path.split("/")[2]) : null;
      const character = slug ? state.members.find(member => member.slug === slug) : null;
      const query = view === "character" ? `character&slug=${encodeURIComponent(slug)}` : view;
      const data = slug && !character ? {} : await get(`/api/planning?view=${query}`) ?? {};
      ({ result, title, completed } = planningPage(view, data, state.members, character, status));
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
    const filters = main.querySelector("[data-roster-filters]");
    if (filters) {
      filters.addEventListener("input", () => updateRoster(filters));
      filters.addEventListener("submit", event => event.preventDefault());
      updateRoster(filters);
    }
    if (main.querySelector("[data-planning]")) bindPlanning(main, state.members, get, message => {
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
