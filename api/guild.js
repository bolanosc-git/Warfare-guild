import { demoMembers } from "../public/demo.js";
import { armoryConfigured, getGuild } from "../server/armory.js";
import { reportsWritable } from "../server/reports.js";
import { respond } from "../server/http.js";

export function GET() {
  return respond(async () => {
    if (!armoryConfigured()) return { mode: "demo", faction: "Horde", members: demoMembers, reportWritable: false };
    return { mode: "live", ...await getGuild(), reportWritable: reportsWritable() };
  }, "public, s-maxage=300, stale-while-revalidate=600");
}
