-- Add potential_win column to picks table
-- Stores the user-entered payout amount (profit if correct)
-- Replaces the hardcoded -110 juice assumption in P&L calculations

ALTER TABLE public.picks
  ADD COLUMN IF NOT EXISTS potential_win numeric(10, 2);
