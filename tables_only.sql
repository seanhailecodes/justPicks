CREATE TABLE public.ai_recommendations (
CREATE TABLE public.app_state (
CREATE TABLE public.friendships (
CREATE TABLE public.games (
CREATE TABLE public.group_invites (
CREATE TABLE public.group_members (
CREATE TABLE public.group_picks (
CREATE TABLE public.groups (
CREATE TABLE public.matchup_history (
CREATE TABLE public.pick_groups (
CREATE TABLE public.picks (
CREATE TABLE public.profiles (
CREATE TABLE public.stadium_distances (
CREATE TABLE public.team_situations (
CREATE TABLE public.user_analytics (
CREATE TABLE public.user_game_views (
CREATE TABLE public.user_preferences (
ALTER TABLE ONLY public.ai_recommendations
ALTER TABLE ONLY public.app_state
ALTER TABLE ONLY public.friendships
ALTER TABLE ONLY public.friendships
ALTER TABLE ONLY public.games
ALTER TABLE ONLY public.group_invites
ALTER TABLE ONLY public.group_members
ALTER TABLE ONLY public.group_picks
ALTER TABLE ONLY public.group_picks
ALTER TABLE ONLY public.groups
ALTER TABLE ONLY public.matchup_history
ALTER TABLE ONLY public.matchup_history
ALTER TABLE ONLY public.pick_groups
ALTER TABLE ONLY public.picks
ALTER TABLE ONLY public.profiles
ALTER TABLE ONLY public.profiles
ALTER TABLE ONLY public.profiles
ALTER TABLE ONLY public.stadium_distances
ALTER TABLE ONLY public.stadium_distances
ALTER TABLE ONLY public.team_situations
ALTER TABLE ONLY public.team_situations
ALTER TABLE ONLY public.picks
ALTER TABLE ONLY public.user_analytics
ALTER TABLE ONLY public.user_analytics
ALTER TABLE ONLY public.user_game_views
ALTER TABLE ONLY public.user_game_views
ALTER TABLE ONLY public.user_preferences
ALTER TABLE ONLY public.user_preferences
CREATE INDEX idx_ai_recs_user ON public.ai_recommendations USING btree (user_id, created_at DESC);
CREATE INDEX idx_games_context ON public.games USING btree (is_primetime, is_divisional, day_of_week);
CREATE INDEX idx_games_week ON public.games USING btree (week, season);
CREATE INDEX idx_group_members_role ON public.group_members USING btree (role);
CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);
CREATE INDEX idx_groups_join_type ON public.groups USING btree (join_type);
CREATE INDEX idx_groups_search ON public.groups USING btree (visibility, primary_sport, accuracy_rating DESC, created_at);
CREATE INDEX idx_groups_sport ON public.groups USING btree (sport, visibility);
CREATE INDEX idx_groups_visibility ON public.groups USING btree (visibility);
CREATE INDEX idx_matchup_history_teams ON public.matchup_history USING btree (team1, team2);
CREATE INDEX idx_picks_analytics ON public.picks USING btree (user_id, correct, game_is_primetime, game_is_divisional, picked_favorite);
CREATE INDEX idx_picks_game_id ON public.picks USING btree (game_id);
CREATE INDEX idx_picks_user_id ON public.picks USING btree (user_id);
CREATE INDEX idx_team_situations_lookup ON public.team_situations USING btree (team, week, season);
CREATE INDEX idx_team_situations_week ON public.team_situations USING btree (week, season);
CREATE INDEX idx_user_game_views_game ON public.user_game_views USING btree (game_id);
CREATE INDEX idx_user_game_views_user ON public.user_game_views USING btree (user_id, week);
ALTER TABLE ONLY public.ai_recommendations
ALTER TABLE ONLY public.ai_recommendations
ALTER TABLE ONLY public.friendships
ALTER TABLE ONLY public.friendships
ALTER TABLE ONLY public.group_invites
ALTER TABLE ONLY public.group_invites
ALTER TABLE ONLY public.group_members
ALTER TABLE ONLY public.group_members
ALTER TABLE ONLY public.group_picks
ALTER TABLE ONLY public.group_picks
ALTER TABLE ONLY public.group_picks
ALTER TABLE ONLY public.groups
ALTER TABLE ONLY public.pick_groups
ALTER TABLE ONLY public.pick_groups
ALTER TABLE ONLY public.picks
ALTER TABLE ONLY public.profiles
ALTER TABLE ONLY public.user_analytics
ALTER TABLE ONLY public.user_game_views
ALTER TABLE ONLY public.user_game_views
ALTER TABLE ONLY public.user_preferences
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
