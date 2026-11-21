# Warfare | WoW Forever

A responsive, Horde-themed guild site with a searchable roster, individual equipment and talent profiles, profession skills, and archived MythicSim DPS results. The preview uses fictional characters and clearly labels them.

## Development

Use Node.js 22 or later. No package installation is required.

```sh
npm run dev
npm test
```

Open http://127.0.0.1:3000. The development server supports the same page links and API routes as Vercel.

## Vercel and the live Armory

Import the repository as a Vercel project using the **Other** framework preset. The checked-in Vercel configuration serves `public/` and the three Node.js functions in `api/`. Redeploy after changing environment variables. For local use, copy `.env.example` to `.env`.

| Environment variable | Value |
| --- | --- |
| `BLIZZARD_REGION` | Warfare’s Blizzard region. Defaults to `us`. `eu`, `kr`, and `tw` are supported. |
| `BLIZZARD_GUILD_SLUG` | Defaults to `warfare`. |
| `BLIZZARD_RULESET_ID` | Optional guild identity check. PvP uses `1`, Normal `2`, Roleplay `3`, and Roleplay PvP `15`. |
| `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET` | Client credentials from a [Battle.net developer application](https://develop.battle.net/). Add them server-side in Vercel. |

The API uses the regional Forever profile namespace. The roster and character responses refresh through Vercel’s edge cache with a five-minute TTL. Blizzard controls when character gear, talents, and professions become visible. Characters below level 10 can appear on the roster before their profile is available. Live connection problems display a status message.

## Share and archive MythicSim results

Apply [the schema](supabase/schema.sql) to a dedicated Supabase project. Add the following server-side environment variables and redeploy once the live Armory is configured.

| Environment variable | Value |
| --- | --- |
| `SUPABASE_URL` | The Supabase project URL. |
| `SUPABASE_SECRET_KEY` | A server-only Supabase secret key or legacy service-role key. |
| `GUILD_REPORT_TOKEN` | A randomly generated key of at least 24 characters. Share it with the guild members who can publish reports. |

Run a WoW Forever Quick Sim at [MythicSim](https://mythicsim.com/wow-forever). Once it completes, copy the result URL from the address bar. On Warfare’s **Simulations** page, select **Publish MythicSim result**, choose the character, and enter the result URL, the displayed DPS, encounter settings if available, and the guild publishing key. The site saves the submitted DPS and a link to the source, deduplicates reports by their MythicSim result ID, and displays the date a report was added. Guild members run their sims in MythicSim and enter each new result. Use the same encounter settings when comparing DPS.

The overview shows the newest report per character from the 250 most recent reports. Character pages show that character’s history from the same window. Previously saved reports keep their original source links. MythicSim links may expire under its [retention policy](https://mythicsim.com/privacy).
