-- Feedback submitted by users in-app
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  category    text        NOT NULL DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'general')),
  message     text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit feedback (anonymous submissions also allowed)
CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Only service role can read feedback (you view it in the Supabase dashboard)
CREATE POLICY "Service role can read feedback"
  ON feedback FOR SELECT
  USING (auth.role() = 'service_role');
