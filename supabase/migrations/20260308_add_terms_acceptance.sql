-- Add terms acceptance tracking to profiles
-- Records when a user explicitly accepted the Terms of Service and Privacy Policy

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_terms_version varchar(20);

-- Index for auditing
CREATE INDEX IF NOT EXISTS idx_profiles_accepted_terms_at
  ON public.profiles (accepted_terms_at);

COMMENT ON COLUMN public.profiles.accepted_terms_at IS 'Timestamp when user accepted Terms of Service and Privacy Policy';
COMMENT ON COLUMN public.profiles.accepted_terms_version IS 'Version of terms accepted, e.g. 2026-03-08';
