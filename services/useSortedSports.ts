/**
 * useSortedSports
 * Returns APP_SPORTS sorted by:
 *   1. In-season sports, ordered by the user's pick count in the last 30 days
 *   2. Out-of-season sports at the end (also ordered by recent pick count)
 *
 * Falls back to in-season-first order when the user has no recent picks.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../app/lib/supabase';
import { APP_SPORTS, AppSport, isSportInSeason } from './activeSport';

const inSeasonFirst = (): AppSport[] => [
  ...APP_SPORTS.filter(s => isSportInSeason(s.season)),
  ...APP_SPORTS.filter(s => !isSportInSeason(s.season)),
];

export function useSortedSports(userId: string | null): AppSport[] {
  const [sortedSports, setSortedSports] = useState<AppSport[]>(inSeasonFirst);

  useEffect(() => {
    if (!userId) {
      setSortedSports(inSeasonFirst());
      return;
    }

    (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const { data: recentPicks } = await supabase
          .from('picks')
          .select('game_id')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString());

        if (!recentPicks?.length) {
          setSortedSports(inSeasonFirst());
          return;
        }

        const gameIds = recentPicks.map(p => p.game_id);
        const { data: games } = await supabase
          .from('games')
          .select('id, league')
          .in('id', gameIds);

        const leagueCount: Record<string, number> = {};
        games?.forEach(g => {
          leagueCount[g.league] = (leagueCount[g.league] || 0) + 1;
        });

        const byCount = (a: AppSport, b: AppSport) =>
          (leagueCount[b.league] || 0) - (leagueCount[a.league] || 0);

        setSortedSports([
          ...APP_SPORTS.filter(s => isSportInSeason(s.season)).sort(byCount),
          ...APP_SPORTS.filter(s => !isSportInSeason(s.season)).sort(byCount),
        ]);
      } catch (e) {
        console.error('useSortedSports error:', e);
        setSortedSports(inSeasonFirst());
      }
    })();
  }, [userId]);

  return sortedSports;
}
