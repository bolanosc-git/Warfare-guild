import { getReports, importReport } from "../server/reports.js";
import { respond } from "../server/http.js";

export function GET() {
  return respond(async () => ({ reports: await getReports() }));
}
export function POST(request) {
  return respond(async () => ({ report: await importReport(request) }));
}
