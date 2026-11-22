import { respond } from "../server/http.js";
import { getPlanning, updatePlanning } from "../server/planning.js";

export function GET(request) {
  const view = new URL(request.url).searchParams.get("view");
  return respond(() => getPlanning(request), view === "quests" ? "public, s-maxage=300, stale-while-revalidate=300" : "no-store");
}

export function POST(request) {
  return respond(() => updatePlanning(request));
}
