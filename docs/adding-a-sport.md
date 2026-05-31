# Adding a new sport / league

Every place a sport is hardcoded. Work top to bottom; nothing here is auto-derived.
(Reference: the WNBA add, May 2026.)

## 1. App (JS — ships via `eas update` + Vercel)
- `services/pickrating.ts`
  - Add the key to the `Sport` type union.
  - Add a `SPORT_CONFIG` entry (name, shortName, scheduleModel, etc.).
  - Add it to any grouping arrays (e.g. `basketball: [...]`).
- `services/activeSport.ts`
  - Add an `APP_SPORTS` entry: `{ key, label, emoji, league, enabled, displayMode, season }`.
  - `league` must match the DB `games.league` value (UPPERCASE).
  - `season` = `[startMonth, startDay, endMonth, endDay]`, or omit for year-round.

## 2. Database (Supabase migration)
- `games.league` is free-text — no change needed.
- **`groups` has CHECK constraints that enumerate sports** — update both:
  - `groups_sport_check`
  - `groups_primary_sport_check` (also has `'multi'`)
  - See `supabase/migrations/20260531_add_wnba_to_groups_sport_checks.sql` for the pattern.
- Sanity check for any other enumerated lists:
  ```sql
  SELECT rel.relname, con.conname, pg_get_constraintdef(con.oid)
  FROM pg_constraint con JOIN pg_class rel ON rel.oid=con.conrelid
  JOIN pg_namespace n ON n.oid=rel.relnamespace
  WHERE n.nspname='public' AND con.contype='c'
    AND pg_get_constraintdef(con.oid) ILIKE '%boxing%';
  ```

## 3. Edge functions (Supabase)
- Clone an existing pair → `supabase/functions/fetch-<sport>-games` + `resolve-<sport>-games`.
  - Set the Odds API sport key (e.g. `basketball_wnba`), the `league` value, the game-id prefix, and the season model.
  - Team/logo map if it's a team sport.
- `supabase/functions/_shared/games.ts` → add the league to `isSaneSpread` `ceilingByLeague`.
- Register in the orchestrators:
  - `fetch-all-games` → `SPORT_FETCH_FUNCTIONS`.
  - `resolve-all-games` → `LEAGUE_ODDS_KEYS`.
- `supabase/config.toml` → add a `[functions.fetch-<sport>-games]` block if it uses an import_map.

## 4. Cron (Supabase SQL editor)
- Add the sport to a fetch job's `sports` array (`supabase/cron-fetch-all-games.sql`).
- Add a dedicated resolver cron (`supabase/cron-resolve-all-games.sql`).

## 5. Deploy
- `supabase functions deploy` the new + modified functions.
- App is JS-only → `eas update --channel production` (no App Store build) + push for the Vercel web build.

## Notes
- Season tagging is dynamic via `seasonForDate(date, 'cross-year' | 'calendar')` in `_shared`.
- De-listed games auto-prune via `pruneDelistedGames` (wired into the 8 league-complete fetchers; soccer/golf excluded).
