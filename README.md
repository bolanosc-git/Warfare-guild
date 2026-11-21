# Warfare | WoW Forever

A responsive, Horde-themed guild site with a searchable roster, individual equipment and talent profiles, profession skills, and archived Raidbots DPS results. The preview uses fictional characters and clearly labels them.

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

## Share and archive Raidbots reports

Apply [the schema](supabase/schema.sql) to a dedicated Supabase project. Add the following server-side environment variables and redeploy once the live Armory is configured.

| Environment variable | Value |
| --- | --- |
| `SUPABASE_URL` | The Supabase project URL. |
| `SUPABASE_SECRET_KEY` | A server-only Supabase secret key or legacy service-role key. |
| `GUILD_REPORT_TOKEN` | A randomly generated key of at least 24 characters. Share it with the guild members who can publish reports. |

On **Simulations**, select **Import Raidbots report**, choose the character, and paste the share URL for a completed Quick Sim. The site reads the public Raidbots report, checks for a matching player and DPS result, and stores a deduplicated summary with encounter settings and a link. It uses the author-provided report date when available and labels the import date otherwise. The overview shows the newest report per character from the 250 most recent reports. Character pages show that character’s history from the same window. Source links can expire according to [Raidbots’ retention policy](https://support.raidbots.com/article/76-report-storage).

Raidbots documents [reading existing reports](https://www.raidbots.com/developers). Forever simulation support needs confirmation with a real report from the guild’s game version. Use results from the same game version and encounter settings when comparing DPS. Guild members run their own sims and share each new report for publication.
