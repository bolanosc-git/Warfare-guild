const dateStyle = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
export function esc(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => entities[character]);
}

export function validUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.includes(url.hostname) ? esc(url.href) : "";
  } catch {
    return "";
  }
}

export function dateLabel(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? dateStyle.format(date) : "Date unavailable";
}

export function panel(title, description, body, action = "") {
  return `<section class="panel"><div class="panel-heading"><div><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ""}</div>${action}</div>${body}</section>`;
}

export function intro(title, subtitle, options = {}) {
  return `<section class="frame page-intro"><div class="intro-copy">
    ${options.back ? '<a class="back" href="/roster" data-nav>Back to roster</a>' : ""}
    ${options.eyebrow ? `<p class="eyebrow">${esc(options.eyebrow)}</p>` : ""}
    <div class="intro-title">${options.mark ?? ""}<h1>${esc(title)}</h1></div>
    <p class="intro-description">${esc(subtitle)}</p>
    ${options.action ? `<div class="actions">${options.action}</div>` : ""}
    </div></section>`;
}

