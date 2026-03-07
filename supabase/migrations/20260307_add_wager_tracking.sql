-- Add wager tracking columns to picks table
ALTER TABLE public.picks
  ADD COLUMN IF NOT EXISTS wager_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency varchar(3);

COMMENT ON COLUMN public.picks.wager_amount IS 'Optional real-money wager amount entered by user at pick time';
COMMENT ON COLUMN public.picks.currency IS 'ISO 4217 currency code (e.g. USD, CAD, GBP) detected from device locale';
