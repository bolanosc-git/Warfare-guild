import { demoCharacter } from "../public/demo.js";
import { armoryConfigured, getCharacter } from "../server/armory.js";
import { HttpError, respond } from "../server/http.js";

export function GET(request) {
  return respond(async () => {
    const slug = new URL(request.url).searchParams.get("slug");
    const character = armoryConfigured() ? await getCharacter(slug) : demoCharacter(slug);
    if (!character) throw new HttpError(404, "This character was not found in Warfare’s roster.");
    return character;
  }, "public, s-maxage=300, stale-while-revalidate=600");
}
