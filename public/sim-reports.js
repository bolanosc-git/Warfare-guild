const recentSimWindow = 30 * 24 * 60 * 60 * 1000;

export function reportTime(report) {
  const time = Date.parse(report?.date ?? report?.importedAt ?? "");
  return Number.isFinite(time) ? time : null;
}

export function latestReports(reports) {
  const latest = new Map();
  for (const report of reports) {
    const previous = latest.get(report.characterId);
    if (!previous || (reportTime(report) ?? -Infinity) > (reportTime(previous) ?? -Infinity)) {
      latest.set(report.characterId, report);
    }
  }
  return latest;
}

export function countRecentSims(members, latest, now = Date.now()) {
  return members.filter(member => {
    const time = reportTime(latest.get(member.id));
    return time != null && time <= now && now - time <= recentSimWindow;
  }).length;
}
