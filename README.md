# Warfare | WoW Forever

A responsive Horde guild field guide with a searchable roster, Wowhead-linked equipment and talents, character quest and dungeon progress, a dungeon party planner, profession skills, and archived MythicSim DPS results. The preview uses fictional characters and clearly labels them. The site can be installed as a PWA; after a successful visit it keeps the application shell and recent guild API snapshots available offline.

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

The API uses the regional Forever profile namespace. The roster and character responses refresh through Vercel’s edge cache with a five-minute TTL. Blizzard controls when character gear, talents, and professions become visible. Characters below level 10 can appear on the roster before their profile is available. Live connection problems display a status message. The offline cache stores successful GET responses in that browser; it is not shared between guild members.

## Share and archive MythicSim results

Apply [the schema](supabase/schema.sql) to a dedicated Supabase project. Add the following server-side environment variables and redeploy once the live Armory is configured.

| Environment variable | Value |
| --- | --- |
| `SUPABASE_URL` | The Supabase project URL. |
| `SUPABASE_SECRET_KEY` | A server-only Supabase secret key or legacy service-role key. |

Run a WoW Forever Quick Sim at [MythicSim](https://mythicsim.com/wow-forever/sim). MythicSim’s current Forever workflow uses its in-game exporter: run `/msim`, copy the export, paste it into the simulator, and then run Quick Sim or Best Gear. Copy the result URL from the address bar. On Warfare’s **Simulations** page, select **Publish MythicSim result**, choose the character, and enter the result URL, the displayed DPS, and encounter settings if available. The site saves the submitted DPS and a link to the source, deduplicates reports by their MythicSim result ID, and displays the date a report was added. Anyone with site access can publish a report for a roster character. Use the same encounter settings when comparing DPS.

The overview shows the newest report per character from the 250 most recent reports. Character pages show that character’s history from the same window. The Sim Coverage panel marks characters with a report in the last 30 days. The **Tier Prep** page tracks level 60 and sim coverage against MythicSim’s listed Tier 1 date of December 9, 2026. Previously saved reports keep their original source links. MythicSim links may expire under its [retention policy](https://mythicsim.com/privacy).

Warfare does not run the MythicSim engine itself or call an official public simulation API. Sim calculations and Best Gear comparisons remain on MythicSim; Warfare tracks the shared report URL, DPS, and scenario. MythicSim describes the engine as open source under the MIT license, but integrating and maintaining a direct local sim would require a separate engine integration and game-data compatibility work.

## Character progress and guild planning

For a new Supabase project, apply [the complete schema](supabase/schema.sql). For an existing deployment, apply the [guild planning migration](supabase/migrations/20261122000000_guild_planning.sql), then the [dungeon sign-up migration](supabase/migrations/20261125060731_guild_dungeon_signups.sql). All active tables have row-level security enabled and grant access only to the server-side role. The application API intentionally keeps shared planning updates open to site visitors, as requested; there is no publishing key or sign-in prompt.

- **Character Progress** shows Blizzard’s active and completed quests with the latest available snapshot, a dungeon and wing checklist, and Horde unlock steps. Dungeon status can come from an Armory record or a guild entry. Members can attach a Warcraft Logs link to a manual record.
- **Dungeon Planner** ranks runs by shared active quests, level range, and the highest roster level. It maps the Wowhead Forever guides currently indexed to the guild’s quest logs, links quest/item/spell details to Wowhead, and lets a character sign up as tank, healer, DPS, or flexible. Guide data is a best-effort index and links through to Wowhead for the authoritative guide; the two newest catalog dungeons without indexed guide records are shown as unindexed.
- **Group Up** shows shared guild requests. **Find shared quests** looks for overlaps in members’ active Armory quest logs.
- **Offline changes** to dungeon checklists, guild requests, and run sign-ups are saved in that browser and retried when connectivity returns. Successful offline GET snapshots are cached locally. Warcraft Logs imports and sim publishing still require an internet connection.

To enable **Import logged kills**, add `WCL_CLIENT_ID` and `WCL_CLIENT_SECRET` from a [Warcraft Logs API client](https://www.warcraftlogs.com/api/docs) to Vercel and redeploy. Imports use public reports and require confirmed boss kills for the selected character and dungeon. A logged kill adds partial progress. Record a full clear in the checklist when the whole dungeon or wing was cleared.
