-- Add Money Line pick support to picks table
-- bet_type: 'spread' | 'total' | 'moneyline'
-- ml_odds: American odds at time of pick (e.g. -900, +450)
-- win_weight: calculated at resolve time
--   ATS/total correct: 1.0
--   ML correct: payout ratio (ml_odds > 0 → ml_odds/100, ml_odds < 0 → 100/|ml_odds|)
--   Any wrong pick: 1.0

ALTER TABLE picks ADD COLUMN IF NOT EXISTS bet_type text DEFAULT 'spread';
ALTER TABLE picks ADD COLUMN IF NOT EXISTS ml_odds integer;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS win_weight float DEFAULT 1.0;

-- Backfill existing picks
UPDATE picks SET bet_type = 'spread' WHERE bet_type IS NULL;
UPDATE picks SET win_weight = 1.0 WHERE win_weight IS NULL;
