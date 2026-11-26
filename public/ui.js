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

const sortText = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function sortCompare(order, left, right) {
  const [key, direction] = order.split(":");
  const a = left[key];
  const b = right[key];
  const missing = value => value == null || value === "";
  if (missing(a) || missing(b)) return Number(missing(a)) - Number(missing(b));
  const result = typeof a === "number" && typeof b === "number" ? a - b : sortText.compare(a, b);
  return direction === "desc" ? -result : result;
}

export function sortData(values) {
  return `data-sort-values="${esc(JSON.stringify(values))}"`;
}

export function sortSelect(target, options, label) {
  return `<label class="compact-sort"><span>Sort by</span><select data-sort-target="${esc(target)}" aria-label="Sort ${esc(label)}">${options.map(([value, name]) => `<option value="${esc(value)}">${esc(name)}</option>`).join("")}</select></label>`;
}

export function bindSorting(root) {
  const controls = [...root.querySelectorAll("[data-sort-target]")];
  const columns = [...root.querySelectorAll("[data-sort-column]")];
  for (const list of root.querySelectorAll("[data-sort-list]")) {
    const target = list.dataset.sortList;
    const select = controls.find(control => control.dataset.sortTarget === target);
    const headings = columns.filter(button => button.dataset.sortColumn === target);
    if (!select && !headings.length) continue;
    const rows = [...list.children].filter(row => row.matches("[data-sort-values]"))
      .map(row => ({ row, values: JSON.parse(row.dataset.sortValues) }));

    let order;
    const update = next => {
      order = next;
      list.append(...[...rows].sort((a, b) => sortCompare(order, a.values, b.values)).map(entry => entry.row));
      const [key, direction] = order.split(":");
      for (const button of headings) {
        const header = button.closest('[role="columnheader"]');
        if (button.dataset.sortKey === key) {
          header.setAttribute("aria-sort", direction === "desc" ? "descending" : "ascending");
        } else {
          header.removeAttribute("aria-sort");
        }
      }
    };
    select?.addEventListener("change", () => update(select.value));
    for (const button of headings) {
      button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        const direction = order?.startsWith(`${key}:`)
          ? (order.endsWith(":asc") ? "desc" : "asc") : button.dataset.sortDirection;
        const next = `${key}:${direction}`;
        if (select) select.value = next;
        update(next);
      });
    }
    const initial = select?.value ?? list.dataset.sortDefault;
    if (initial) update(initial);
  }
}

