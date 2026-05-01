# justPicks 1.2.0 — First Feature Release

**Date:** May 1, 2026
**Build:** iOS Build 14 (auto-incremented by EAS from prior 13)
**Version:** 1.2.0

## What's New (App Store "What's New" copy)

> 🥊 Boxing — pick fights from upcoming cards
> 🔍 Fighter search on Boxing/UFC tabs — find your fight in seconds
> 📅 Time-bucket grouping — This Weekend, Next Weekend, by month
> ⚖️ Fairer grading — picks now graded against the line YOU saw, not the closing line
> 📊 Pick history shows the line you actually took
> ✨ Polish, dedupe, and data-quality fixes throughout

## Changes Behind the Scenes (engineering)

### Pick fairness / data integrity
- **Pick snapshot** — every new pick stores `spread_line_at_pick`, `total_line_at_pick`, `ml_odds`. Resolvers grade against the line at pick time, not the live/closing/post-game line.
- **Locked-game guard** — fetch functions skip rows that are already locked, in-progress, final, or whose `game_date` has passed. Prevents live in-game spreads from polluting finished games.
- **Sane-spread rejection** — incoming spreads with absurd magnitudes (>±30 NBA/NFL, >±50 NCAAB, >±3.5 NHL, >±4 SOCCER) are rejected at fetch time as data-feed glitches.
- **One-time cleanup** — 255 historical games with polluted spreads (NBA: 205, NCAAB: 42, NHL: 8) had their spread fields nulled out so pick history doesn't show misleading lines. `correct` field on picks unchanged.
- **Game dedup** — fetch functions now use ET-date keying for US-league IDs (instead of UTC) so a commence-time shift across UTC midnight no longer creates a duplicate row. Self-healing sweep merges any historical duplicates by `external_id`.

### Combat sports UX
- **Boxing** — new sport in fetch chain (`fetch-boxing-games`) plus tab in the app, mirrors UFC pattern.
- **Time buckets** — Boxing/UFC tabs collapse fights into "Today / Tomorrow / This Weekend / Next Weekend / [Month] / Later" instead of one date header per fight. Tappable to expand/collapse, default-expanded for the next two weekends.
- **Fighter search** — search input above the fights list filters live by fighter name. Force-expands matching buckets.

### Resolver
- All sport resolvers (NBA, NFL, NHL, NCAAB, Soccer, all-games) now grade picks using `pick.spread_line_at_pick` / `pick.total_line_at_pick` first, falling back to the game row only for legacy picks without snapshot.

## Open Items / Tracking

### Apple Developer Support — TIN release
- **Case ID:** `102883935034`
- **Submitted:** May 1, 2026 via Email (Membership and Account → Agreements and Contracts)
- **Issue:** "The Tax ID entered already exists" error when submitting W-9 for IdentitySimpler LLC entity. TIN is locked to the prior individual entity.
- **Old entity (individual):** `93870724` — "Aradom Hailemelekot"
- **New entity (LLC):** `94262425` — "IdentitySimpler LLC"
- **Apple SLA:** 2 business days
- **Phone fallback (faster):** 1-800-633-2152, reference Case ID 102883935034.

Once the TIN is released:
1. Re-submit W-9 under IdentitySimpler LLC entity (sign under penalty of perjury — Sean only).
2. LLC Free Apps + Paid Apps Agreements should auto-flip from "Pending (New Legal Entity)" → "Active".
3. Public seller name on the App Store updates from "Aradom Hailemelekot" → "IdentitySimpler LLC".

### App Store Connect metadata
- **Drop "(85c601)" from app name** — done in this release as part of v1.2.0 metadata.
- (Optional) Subtitle and Keywords improvements for App Store Search Optimization.

### Android
- Still blocked on Sean creating a Google Play Developer account (Organization, IdentitySimpler LLC, $25). See prior handoff. Android submission resumes once verified.
