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

Run a WoW Forever Quick Sim at [MythicSim](https://mythicsim.com/wow-forever/sim). Once it completes, copy the result URL from the address bar. On Warfare’s **Simulations** page, select **Publish MythicSim result**, choose the character, and enter the result URL, the displayed DPS, and encounter settings if available. The site saves the submitted DPS and a link to the source, deduplicates reports by their MythicSim result ID, and displays the date a report was added. Anyone with site access can publish a report for a roster character. Use the same encounter settings when comparing DPS.

The overview shows the newest report per character from the 250 most recent reports. Character pages show that character’s history from the same window. Previously saved reports keep their original source links. MythicSim links may expire under its [retention policy](https://mythicsim.com/privacy).

## Character progress and guild planning

For new deployments, apply the simulation schema and the [guild planning migration](supabase/migrations/20261122000000_guild_planning.sql). The planning tables use the same server-only Supabase connection. Anyone with site access can read and update shared plans for roster characters.

- **Character Progress** shows Blizzard’s active and completed quests with the latest available snapshot, a dungeon and wing checklist, and Horde unlock steps. Dungeon status can come from an Armory record or a guild entry. Members can attach a Warcraft Logs link to a manual record.
- **Group Up** shows shared guild requests. **Find shared quests** looks for overlaps in members’ active Armory quest logs.

To enable **Import logged kills**, add `WCL_CLIENT_ID` and `WCL_CLIENT_SECRET` from a [Warcraft Logs API client](https://www.warcraftlogs.com/api/docs) to Vercel and redeploy. Imports use public reports and require confirmed boss kills for the selected character and dungeon. A logged kill adds partial progress. Record a full clear in the checklist when the whole dungeon or wing was cleared.
