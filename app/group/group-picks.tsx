import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase, getCurrentSeason, computeNflWeek } from '../../lib/supabase';
import GroupRatingsLeaderboard from '../../components/GroupRatingsLeaderboard';
import SeasonRecap from '../../components/SeasonRecap';
import { Sport } from '../../services/pickrating';
import { getSeasonOptions, SeasonOption, formatSeasonForSport } from '../../services/seasons';
import { isSportInSeason, getSport } from '../../services/activeSport';
import { getLatestGradedSeasonForGroup, getPickSeasonsForGroup } from '../../lib/database';
import { getPublicAlias } from '../../services/anonymity';

// How a graded leg of a pick came out. 'pending' = game not final yet, or
// final but the resolver hasn't graded it.
type PickResult = 'win' | 'loss' | 'push' | 'pending';

// One `picks` row. Since the ticket rewrite a row is ONE bet (bet_type
// spread | total | moneyline); older rows are a spread pick that can also
// carry an over/under on the same row, so `overUnderPick` is kept as a
// second, optional leg.
interface FriendPick {
  id: string;
  username: string;
  betType: 'spread' | 'total' | 'moneyline';
  side: 'home' | 'away' | null;        // spread / moneyline side; null on total rows
  homeLineAtPick: number | null;       // home spread when the pick was made
  mlOdds: number | null;
  confidence: string;
  reasoning?: string;
  timestamp: string;
  result: PickResult;                  // the row's main bet
  overUnderPick?: 'over' | 'under';
  overUnderConfidence?: string;
  totalLineAtPick: number | null;
  ouResult: PickResult | null;         // the O/U leg on legacy combined rows
}

interface GroupGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;                    // "HOU" — falls back to the full name
  awayCode: string;
  spread: { home: number | null; away: number | null };
  overUnder: number | null;
  gameDate: Date;
  time: string;
  date: string;
  dateGroup: string;
  timeToLock: string;
  locked: boolean;
  gameStatus: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;                     // final (or live) → shown under Results
}

interface GroupInfo {
  id: string;
  name: string;
  sport: Sport;
  visibility: string;
}

export default function GroupPicksScreen() {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string || '';
  const groupName = params.groupName as string || 'Group';

  // Tab state
  const [activeTab, setActiveTab] = useState<'picks' | 'ratings'>('picks');

  // Group info (including sport)
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // NFL week state
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Season-over-season state. When a sport is out of season we swap
  // the week strip for a season picker + the Season Recap.
  const [seasonOptions, setSeasonOptions] = useState<SeasonOption[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  // Seasons this group actually has picks in (null = not loaded yet).
  const [groupPickSeasons, setGroupPickSeasons] = useState<number[] | null>(null);

  // Shared state
  const [gamesData, setGamesData] = useState<GroupGame[]>([]);
  const [friendPicksByGame, setFriendPicksByGame] = useState<Record<string, FriendPick[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupMemberCount, setGroupMemberCount] = useState<number>(0);
  const weekScrollViewRef = useRef<ScrollView>(null);

  // Pulse animation for unanimous picks
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Fetch group info including sport
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!groupId) {
        setLoadError('No group was selected.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('groups')
        .select('id, name, sport, visibility')
        .eq('id', groupId)
        .maybeSingle();

      if (error || !data) {
        // RLS hides groups the user isn't a member of (and private groups from
        // non-members), so "not found" and "not allowed" look the same here.
        // Without this the games effect never fires and the spinner is permanent.
        console.error('Error loading group:', error);
        setLoadError("We couldn't open this group. It may have been deleted, or you may not be a member.");
        setLoading(false);
        return;
      }

      setLoadError(null);
      setGroupInfo({
        id: data.id,
        name: data.name,
        sport: (data.sport as Sport) || 'nfl',
        visibility: data.visibility || 'private',
      });
    };

    fetchGroupInfo();
  }, [groupId]);

  // Load current week from database on mount (for NFL)
  useEffect(() => {
    const loadCurrentWeek = async () => {
      const { data, error } = await supabase
        .from('app_state')
        .select('current_week')
        .maybeSingle();

      // NFL groups wait on selectedWeek before loading anything, so a failed
      // app_state read used to leave the screen on the spinner forever. Fall
      // back to the date-derived week instead.
      if (error || !data?.current_week) {
        console.warn('[group-picks] app_state unavailable, using computed NFL week:', error?.message);
      }
      const week: number = data?.current_week || computeNflWeek();

      setCurrentWeekNumber(week);
      setSelectedWeek(week);

      setTimeout(() => {
        // Chips are ~60px wide with a 6px gap; scroll so the current week
        // sits mid-screen once the row is wider than the viewport.
        if (weekScrollViewRef.current && week > 3) {
          const CHIP = 66;
          weekScrollViewRef.current.scrollTo({ x: Math.max(0, (week - 3) * CHIP), animated: true });
        }
      }, 300);
    };
    
    loadCurrentWeek();
  }, []);

  // Load the list of seasons that actually exist in the games table.
  useEffect(() => {
    getSeasonOptions().then(setSeasonOptions);
  }, []);

  // Load the seasons THIS group has picks in, to hide always-empty chips.
  useEffect(() => {
    if (!groupId) return;
    getPickSeasonsForGroup(groupId).then(setGroupPickSeasons);
  }, [groupId]);

  // Pick the default season once the seasons and the group's sport
  // are known. In season → the newest (live) season. Out of season →
  // the most recent season the group actually has graded results for,
  // so when a new season's schedule loads the recap never opens to an
  // empty upcoming season. Everything flows automatically from there.
  useEffect(() => {
    if (selectedSeason != null) return;
    if (seasonOptions.length === 0 || !groupInfo) return;

    const newest = seasonOptions.find(o => o.isCurrent)?.value ?? seasonOptions[0].value;
    if (isSportInSeason(getSport(groupInfo.sport).season)) {
      setSelectedSeason(newest);
      return;
    }
    getLatestGradedSeasonForGroup(groupId).then(graded => {
      setSelectedSeason(graded ?? newest);
    });
  }, [seasonOptions, groupInfo, selectedSeason, groupId]);

  // Load games when sport/week changes. NFL is week-based and needs
  // selectedWeek resolved first; every other sport loads directly.
  // (Previously this allow-listed only nfl/nba/ncaab/soccer, so
  // MLB/NHL/UFC/Boxing/Golf group pages hung on the loading spinner.)
  useEffect(() => {
    if (!groupInfo) return;
    if (groupInfo.sport === 'nfl') {
      if (selectedWeek !== null) loadGamesAndPicks();
    } else {
      loadGamesAndPicks();
    }
  }, [groupInfo, selectedWeek]);

  const loadGamesAndPicks = async () => {
    if (!groupInfo) return;
    
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Get group members
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      const memberIds = groupMembers?.map(m => m.user_id) || [];
      setGroupMemberCount(memberIds.length);

      if (memberIds.length === 0) {
        setGamesData([]);
        setFriendPicksByGame({});
        setLoading(false);
        return;
      }

      // Pick-driven: fetch picks shared to this group first, then load only those games
      const { data: groupPicks } = await supabase
        .from('picks')
        .select('game_id')
        .contains('groups', [groupId])
        .in('user_id', memberIds);

      const pickedGameIds = [...new Set(groupPicks?.map(p => p.game_id) || [])];

      if (pickedGameIds.length === 0) {
        setGamesData([]);
        setFriendPicksByGame({});
        setLoading(false);
        return;
      }

      // Load every picked game of the selected week — played ones included,
      // so Sunday's results stay on the screen for the rest of the week.
      // (This used to drop a game the moment it kicked off, which left the
      // Week view showing only whatever hadn't been played yet.)
      let gamesQuery = supabase
        .from('games')
        .select('*')
        .in('id', pickedGameIds)
        .order('game_date', { ascending: true });

      if (groupInfo.sport === 'nfl') {
        gamesQuery = gamesQuery
          .eq('week', selectedWeek)
          .eq('season', getCurrentSeason());
      } else {
        // Date-based sports have no "week": upcoming games plus the last 3 days.
        const lookback = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        gamesQuery = gamesQuery.gte('game_date', lookback.toISOString());
      }

      const { data: games, error: gamesError } = await gamesQuery;

      if (gamesError || !games || games.length === 0) {
        setGamesData([]);
        setFriendPicksByGame({});
        setLoading(false);
        return;
      }

      const transformedGames: GroupGame[] = games.map(game => {
        const isFinal = game.game_status === 'final';
        const isLive = game.game_status === 'in_progress';
        return {
          id: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeCode: game.home_team_code ? String(game.home_team_code).toUpperCase() : game.home_team,
          awayCode: game.away_team_code ? String(game.away_team_code).toUpperCase() : game.away_team,
          spread: { home: toNumber(game.home_spread), away: toNumber(game.away_spread) },
          overUnder: toNumber(game.over_under_line),
          gameDate: parseGameDate(game.game_date),
          time: formatGameTime(game.game_date),
          date: formatGameDate(game.game_date),
          dateGroup: getDateGroup(game.game_date),
          timeToLock: getTimeToLock(game.game_date),
          locked: game.locked,
          gameStatus: game.game_status,
          homeScore: toNumber(game.home_score),
          awayScore: toNumber(game.away_score),
          played: isFinal || isLive,
        };
      });

      setGamesData(transformedGames);

      const gameIds = games.map(g => g.id);
      
      // Get picks that were SHARED TO THIS GROUP
      // The 'groups' column is an array of group IDs - filter where this groupId is in that array
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .in('game_id', gameIds)
        .contains('groups', [groupId])  // Only picks shared to this specific group
        .order('created_at', { ascending: false });

      let pickWithUsernames = picks || [];
      if (picks && picks.length > 0) {
        const userIds = [...new Set(picks.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', userIds);

        const usernameMap = new Map(profiles?.map(p => [p.id, p.username || p.display_name || 'Unknown']) || []);
        const isPublicGroup = groupInfo?.visibility === 'public';

        pickWithUsernames = picks.map(pick => ({
          ...pick,
          username: pick.user_id === user.id
            ? 'You'
            : isPublicGroup
              ? getPublicAlias(pick.user_id)
              : (usernameMap.get(pick.user_id) || 'Unknown')
        }));
      }

      const allPicksByGame: Record<string, FriendPick[]> = {};
      const betTypeRank: Record<string, number> = { spread: 0, moneyline: 1, total: 2 };

      gameIds.forEach(gameId => {
        const gamePicks = pickWithUsernames.filter(p => p.game_id === gameId);

        const transformedPicks: FriendPick[] = gamePicks.map(pick => {
          const betType: FriendPick['betType'] =
            pick.bet_type === 'total' || pick.bet_type === 'moneyline' ? pick.bet_type : 'spread';
          const side: FriendPick['side'] =
            betType !== 'total' && (pick.pick === 'home' || pick.pick === 'away') ? pick.pick : null;
          const overUnderPick: FriendPick['overUnderPick'] =
            pick.over_under_pick === 'over' || pick.over_under_pick === 'under'
              ? pick.over_under_pick
              : betType === 'total' && (pick.pick === 'over' || pick.pick === 'under')
                ? pick.pick
                : undefined;
          // A totals row is graded into `correct` (older ones only into
          // over_under_correct); spread / ML rows into `correct`.
          const mainCorrect = betType === 'total' ? (pick.correct ?? pick.over_under_correct) : pick.correct;
          return {
            id: pick.id,
            username: pick.username,
            betType,
            side,
            homeLineAtPick: toNumber(pick.spread_line_at_pick),
            mlOdds: toNumber(pick.ml_odds),
            confidence: pick.confidence,
            reasoning: pick.reasoning,
            timestamp: formatTimeAgo(pick.created_at),
            result: gradeToResult(mainCorrect, pick.resolved_at),
            overUnderPick,
            overUnderConfidence: pick.over_under_confidence,
            totalLineAtPick: toNumber(pick.total_line_at_pick),
            ouResult: betType !== 'total' && overUnderPick
              ? gradeToResult(pick.over_under_correct, pick.resolved_at)
              : null,
          };
        });

        // Your own picks first, then each member's rows together
        // (spread, then ML, then total) so a person's ticket reads as one.
        transformedPicks.sort((a, b) => {
          const youA = a.username === 'You' ? 0 : 1;
          const youB = b.username === 'You' ? 0 : 1;
          if (youA !== youB) return youA - youB;
          if (a.username !== b.username) return a.username.localeCompare(b.username);
          return (betTypeRank[a.betType] ?? 9) - (betTypeRank[b.betType] ?? 9);
        });

        allPicksByGame[gameId] = transformedPicks;
      });
      
      setFriendPicksByGame(allPicksByGame);
    } catch (error) {
      console.error('Error loading group picks data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions

  // games.game_date is `timestamp without time zone` holding UTC wall clock,
  // and PostgREST returns it with no 'Z'. JS parses that as LOCAL time, which
  // put every kickoff hours off on this screen (and could file a late game
  // under the wrong day). Tag it UTC unless it already carries an offset —
  // same normalisation as the Games / Pick History screens.
  const parseGameDate = (raw: string): Date => {
    const withT = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const hasOffset = withT.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(withT);
    return new Date(hasOffset ? withT : withT + 'Z');
  };

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
  };

  // The resolver writes true / false, or leaves null but stamps resolved_at
  // for a push.
  const gradeToResult = (correct: boolean | null | undefined, resolvedAt: string | null | undefined): PickResult => {
    if (correct === true) return 'win';
    if (correct === false) return 'loss';
    return resolvedAt ? 'push' : 'pending';
  };

  const formatSpread = (line: number | null): string => {
    if (line === null) return '';
    if (line === 0) return 'PK';
    return line > 0 ? `+${line}` : `${line}`;
  };

  const formatOdds = (odds: number | null): string => {
    if (odds === null) return '';
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  // "HOU -3" / "CIN ML +124" / "OVER 45.5" — the line as it was when the
  // pick was made, falling back to the game's current line.
  const formatMainLeg = (pick: FriendPick, game: GroupGame): string => {
    if (pick.betType === 'total') {
      const line = pick.totalLineAtPick ?? game.overUnder;
      const dir = (pick.overUnderPick ?? '').toUpperCase();
      return line !== null ? `${dir} ${line}` : dir;
    }
    const team = pick.side === 'home' ? game.homeCode : game.awayCode;
    if (pick.betType === 'moneyline') {
      const odds = pick.mlOdds;
      return odds !== null ? `${team} ML ${formatOdds(odds)}` : `${team} ML`;
    }
    const homeLine = pick.homeLineAtPick ?? game.spread.home;
    const sideLine = homeLine === null ? null : pick.side === 'home' ? homeLine : -homeLine;
    const line = formatSpread(sideLine);
    return line ? `${team} ${line}` : team;
  };

  const formatOULeg = (pick: FriendPick, game: GroupGame): string => {
    const line = pick.totalLineAtPick ?? game.overUnder;
    const dir = (pick.overUnderPick ?? '').toUpperCase();
    return line !== null ? `${dir} ${line}` : dir;
  };

  const formatGameTime = (dateStr: string): string => {
    try {
      const gameDate = parseGameDate(dateStr);
      return gameDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'TBD';
    }
  };

  const formatGameDate = (dateStr: string): string => {
    try {
      const gameDate = parseGameDate(dateStr);
      return gameDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'TBD';
    }
  };

  const getDateGroup = (dateStr: string): string => {
    try {
      const gameDate = parseGameDate(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const gameDateOnly = gameDate.toDateString();
      
      if (gameDateOnly === today.toDateString()) return 'Today';
      if (gameDateOnly === tomorrow.toDateString()) return 'Tomorrow';
      if (gameDateOnly === yesterday.toDateString()) return 'Yesterday';
      
      return gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return 'TBD';
    }
  };

  const getTimeToLock = (dateStr: string): string => {
    try {
      const gameDate = parseGameDate(dateStr);
      const now = new Date();
      const diffMs = gameDate.getTime() - now.getTime();
      
      if (diffMs <= 0) return 'LOCKED';
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
      if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
      if (diffMinutes > 0) return `${diffMinutes}m`;
      
      return 'LOCKED';
    } catch {
      return 'Soon';
    }
  };

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence?.toLowerCase()) {
      case 'very high': return '#00C7BE';
      case 'high': return '#34C759';
      case 'medium': return '#FF9500';
      case 'low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const pickDate = new Date(dateStr);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - pickDate.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} min ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getConsensusColor = (percentage: number, isUnanimous: boolean = false) => {
    if (isUnanimous) return '#34C759';
    if (percentage === 100) return '#FFD700';
    if (percentage >= 70) return '#FF9500';
    if (percentage >= 55) return '#5A7BA8';
    return '#4B5563';
  };

  // Spread consensus counts spread rows only. Totals rows used to be counted
  // here as an away pick (their `pick` is over/under, not home), which
  // inflated one side of the bar; moneyline rows are a different bet and
  // are listed in the pick rows instead.
  const calculateGameConsensus = (picks: FriendPick[], totalMembers: number) => {
    const spreadPicks = picks.filter(p => p.betType === 'spread' && p.side);
    if (spreadPicks.length === 0) return null;

    let homeScore = 0;
    let awayScore = 0;

    spreadPicks.forEach(pick => {
      if (pick.side === 'home') {
        homeScore++;
      } else {
        awayScore++;
      }
    });

    const totalPicks = homeScore + awayScore;
    if (totalPicks === 0) return null;
    
    const homePercentage = Math.round((homeScore / totalPicks) * 100);
    const awayPercentage = 100 - homePercentage;
    
    const allMembersPicked = totalPicks >= totalMembers;
    const allAgree = homePercentage === 100 || awayPercentage === 100;
    const isUnanimous = allMembersPicked && allAgree && totalMembers > 1;
    
    const winningPercentage = Math.max(homePercentage, awayPercentage);

    return {
      homePercentage,
      awayPercentage,
      recommendation: homePercentage > 50 ? 'home' : 'away',
      homePicks: homeScore,
      awayPicks: awayScore,
      isUnanimous,
      consensusStrength: winningPercentage,
      consensusColor: getConsensusColor(winningPercentage, isUnanimous),
    };
  };

  const calculateOUConsensus = (picks: FriendPick[], totalMembers: number) => {
    const ouPicks = picks.filter(p => p.overUnderPick);
    if (ouPicks.length === 0) return null;

    let overCount = 0;
    let underCount = 0;

    ouPicks.forEach(pick => {
      if (pick.overUnderPick === 'over') {
        overCount++;
      } else {
        underCount++;
      }
    });

    const totalPicks = overCount + underCount;
    if (totalPicks === 0) return null;
    
    const overPercentage = Math.round((overCount / totalPicks) * 100);
    const underPercentage = 100 - overPercentage;
    
    const allMembersPicked = totalPicks >= totalMembers;
    const allAgree = overPercentage === 100 || underPercentage === 100;
    const isUnanimous = allMembersPicked && allAgree && totalMembers > 1;
    
    const winningPercentage = Math.max(overPercentage, underPercentage);

    return {
      overPercentage,
      underPercentage,
      recommendation: overPercentage > 50 ? 'over' : 'under',
      overPicks: overCount,
      underPicks: underCount,
      isUnanimous,
      consensusStrength: winningPercentage,
      consensusColor: getConsensusColor(winningPercentage, isUnanimous),
    };
  };

  // Upcoming games soonest-first; played games most-recent-first, so
  // yesterday's results sit right under whatever is still to come.
  const upcomingGames = gamesData.filter(g => !g.played);
  const playedGames = gamesData
    .filter(g => g.played)
    .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime());

  // [label, games] pairs in first-seen order ("Today", "Yesterday", "Sun, Sep 20" …).
  const groupByDate = (games: GroupGame[]): [string, GroupGame[]][] => {
    const groups: [string, GroupGame[]][] = [];
    games.forEach(game => {
      const existing = groups.find(([label]) => label === game.dateGroup);
      if (existing) existing[1].push(game);
      else groups.push([game.dateGroup, [game]]);
    });
    return groups;
  };
  const playedByDate = groupByDate(playedGames);

  // Week record across every graded leg in the played games.
  const weekRecord = (() => {
    const tally = { group: { w: 0, l: 0, p: 0 }, you: { w: 0, l: 0, p: 0 } };
    const add = (bucket: { w: number; l: number; p: number }, r: PickResult | null) => {
      if (r === 'win') bucket.w++;
      else if (r === 'loss') bucket.l++;
      else if (r === 'push') bucket.p++;
    };
    playedGames.forEach(game => {
      (friendPicksByGame[game.id] || []).forEach(pick => {
        add(tally.group, pick.result);
        add(tally.group, pick.ouResult);
        if (pick.username === 'You') {
          add(tally.you, pick.result);
          add(tally.you, pick.ouResult);
        }
      });
    });
    return tally;
  })();
  const formatRecord = (r: { w: number; l: number; p: number }) =>
    r.p > 0 ? `${r.w}-${r.l}-${r.p}` : `${r.w}-${r.l}`;
  const hasGroupRecord = weekRecord.group.w + weekRecord.group.l + weekRecord.group.p > 0;
  const hasYourRecord = weekRecord.you.w + weekRecord.you.l + weekRecord.you.p > 0;
  // NFL only: a week strictly before the current one is history.
  const isPastWeek =
    groupInfo?.sport === 'nfl' &&
    selectedWeek !== null &&
    currentWeekNumber !== null &&
    selectedWeek < currentWeekNumber;

  const getSportLabel = () => {
    return groupInfo?.sport?.toUpperCase() || 'NFL';
  };

  const getHeaderSubtitle = () => {
    if (recapMode) return `${recapSeasonLabel} Season`;
    if (groupInfo?.sport === 'nba' || groupInfo?.sport === 'ncaab' || groupInfo?.sport === 'ncaaf' || groupInfo?.sport === 'soccer') {
      return 'Recent & Upcoming';
    }
    return `Week ${selectedWeek}`;
  };

  // ---- Season-over-season view derivation ----
  // A sport that's out of season shows the Season Recap instead of
  // the upcoming-games list; an in-season group can also reach a
  // past season by tapping an older chip in the season picker.
  const sportConfig = groupInfo ? getSport(groupInfo.sport) : null;
  const sportInSeason = sportConfig ? isSportInSeason(sportConfig.season) : true;
  const currentSeasonValue =
    seasonOptions.find(o => o.isCurrent)?.value ?? getCurrentSeason();
  const recapSeason = selectedSeason ?? currentSeasonValue;
  const recapSeasonLabel = formatSeasonForSport(recapSeason, groupInfo?.sport ?? 'nfl');
  const recapMode =
    !!groupInfo && (!sportInSeason || recapSeason !== currentSeasonValue);
  // Hide season chips the group has no picks in. Always keep the current
  // season, the selected one, and (until loaded) fall back to all.
  const visibleSeasonOptions = seasonOptions.filter(o =>
    o.isCurrent ||
    groupPickSeasons == null ||
    groupPickSeasons.includes(o.value) ||
    o.value === recapSeason
  );
  const showSeasonPicker = visibleSeasonOptions.length > 1 || recapMode;

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadError}</Text>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/groups')}
            style={[styles.backButton, { marginTop: 16 }]}
          >
            <Text style={styles.loadingText}>← Back to Groups</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !recapMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00E676" />
          <Text style={styles.loadingText}>Loading group picks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderRatingsTab = () => {
    if (!groupId || !currentUserId) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {!groupId && 'Missing group ID. '}
            {!currentUserId && 'Not authenticated. '}
            Please try navigating to this screen from the groups list.
          </Text>
        </View>
      );
    }

    return (
      <GroupRatingsLeaderboard
        mode="group"
        userId={currentUserId}
        groupId={groupId}
        groupName={groupInfo?.name || groupName}
        sport={groupInfo?.sport || 'nfl'}
      />
    );
  };

  const renderResultMark = (result: PickResult | null) => {
    if (result === 'win') return <Text style={[styles.resultMark, styles.resultWin]}>✓</Text>;
    if (result === 'loss') return <Text style={[styles.resultMark, styles.resultLoss]}>✗</Text>;
    if (result === 'push') return <Text style={[styles.resultMark, styles.resultPush]}>PUSH</Text>;
    return null;
  };

  const renderGameCard = (game: GroupGame) => {
    const gamePicks = friendPicksByGame[game.id] || [];
    const spreadConsensus = calculateGameConsensus(gamePicks, groupMemberCount);
    const ouConsensus = calculateOUConsensus(gamePicks, groupMemberCount);
    const awayLabel = `${game.awayCode} ${formatSpread(game.spread.away)}`.trim();
    const homeLabel = `${game.homeCode} ${formatSpread(game.spread.home)}`.trim();
    const isFinal = game.gameStatus === 'final';
    const hasScore = game.homeScore !== null && game.awayScore !== null;

    return (
      <View key={game.id} style={styles.gameSection}>
        {/* Game Header */}
        <TouchableOpacity
          style={styles.gameHeader}
          onPress={() => router.push(`/game/${game.id}`)}
        >
          <View style={styles.gameHeaderLeft}>
            <Text style={styles.gameTitle} numberOfLines={2}>
              {game.awayTeam} @ {game.homeTeam}
            </Text>
            <Text style={styles.gameTime}>{game.date} • {game.time}</Text>
          </View>
          <View style={styles.gameHeaderRight}>
            {game.played && hasScore && (
              <Text style={styles.scoreText}>
                {game.awayCode} {game.awayScore} – {game.homeCode} {game.homeScore}
              </Text>
            )}
            {isFinal ? (
              <Text style={styles.finalText}>FINAL</Text>
            ) : game.played ? (
              <Text style={styles.lockTime}>LIVE</Text>
            ) : (
              <Text style={styles.lockTime}>⏰ {game.timeToLock}</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Spread Section */}
        <View style={styles.pickSection}>
          <Text style={styles.pickTypeLabel}>SPREAD</Text>
          
          {spreadConsensus && (
            <>
              {spreadConsensus.isUnanimous ? (
                <Animated.View 
                  style={[
                    styles.consensusBar,
                    styles.unanimousBar,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <View style={[styles.barFill, { backgroundColor: spreadConsensus.consensusColor }]}>
                    <Text style={styles.barText}>
                      ⭐ {spreadConsensus.recommendation === 'away' ? awayLabel : homeLabel} - UNANIMOUS
                    </Text>
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.consensusBar}>
                  <View 
                    style={[
                      styles.barFill,
                      { 
                        backgroundColor: spreadConsensus.awayPercentage > spreadConsensus.homePercentage 
                          ? spreadConsensus.consensusColor 
                          : '#2C2C2E',
                        flex: spreadConsensus.awayPercentage 
                      }
                    ]}
                  >
                    {spreadConsensus.awayPercentage > 0 && (
                      <Text style={styles.barText} numberOfLines={1}>
                        {awayLabel}
                      </Text>
                    )}
                  </View>
                  <View 
                    style={[
                      styles.barFill,
                      { 
                        backgroundColor: spreadConsensus.homePercentage > spreadConsensus.awayPercentage 
                          ? spreadConsensus.consensusColor 
                          : '#2C2C2E',
                        flex: spreadConsensus.homePercentage || 1 
                      }
                    ]}
                  >
                    {spreadConsensus.homePercentage > 0 && (
                      <Text style={styles.barText} numberOfLines={1}>
                        {homeLabel}
                      </Text>
                    )}
                  </View>
                </View>
              )}
              <Text style={styles.consensusText}>
                {spreadConsensus.awayPicks} - {spreadConsensus.homePicks} • {spreadConsensus.consensusStrength}% consensus
              </Text>
            </>
          )}
          
          {!spreadConsensus && (
            <Text style={styles.noPicksText}>No spread picks yet</Text>
          )}
        </View>

        {/* O/U Section */}
        {game.overUnder && (
          <View style={styles.pickSection}>
            <Text style={styles.pickTypeLabel}>OVER/UNDER {game.overUnder}</Text>
            
            {ouConsensus && (
              <>
                {ouConsensus.isUnanimous ? (
                  <Animated.View 
                    style={[
                      styles.consensusBar,
                      styles.unanimousBar,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <View style={[styles.barFill, { backgroundColor: ouConsensus.consensusColor }]}>
                      <Text style={styles.barText}>
                        ⭐ {ouConsensus.recommendation === 'over' ? 'OVER' : 'UNDER'} {game.overUnder} - UNANIMOUS
                      </Text>
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.consensusBar}>
                    <View 
                      style={[
                        styles.barFill,
                        { 
                          backgroundColor: ouConsensus.overPercentage > ouConsensus.underPercentage 
                            ? ouConsensus.consensusColor 
                            : '#2C2C2E',
                          flex: ouConsensus.overPercentage || 1 
                        }
                      ]}
                    >
                      {ouConsensus.overPercentage > 0 && (
                        <Text style={styles.barText}>
                          OVER {game.overUnder}
                        </Text>
                      )}
                    </View>
                    <View 
                      style={[
                        styles.barFill,
                        { 
                          backgroundColor: ouConsensus.underPercentage > ouConsensus.overPercentage 
                            ? ouConsensus.consensusColor 
                            : '#2C2C2E',
                          flex: ouConsensus.underPercentage || 1 
                        }
                      ]}
                    >
                      {ouConsensus.underPercentage > 0 && (
                        <Text style={styles.barText}>
                          UNDER {game.overUnder}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                <Text style={styles.consensusText}>
                  {ouConsensus.overPicks} over - {ouConsensus.underPicks} under • {ouConsensus.consensusStrength}% consensus
                </Text>
              </>
            )}
            
            {!ouConsensus && (
              <Text style={styles.noPicksText}>No O/U picks yet</Text>
            )}
          </View>
        )}

        {/* Top Picks Details */}
        <View style={styles.picksContainer}>
          {gamePicks.length > 0 ? (
            gamePicks.slice(0, 3).map((pick) => (
              <View key={pick.id} style={styles.miniPickCard}>
                <View style={styles.miniPickHeader}>
                  <Text style={[
                    styles.miniUsername,
                    pick.username === 'You' && styles.miniUsernameYou
                  ]}>
                    {pick.username}
                  </Text>
                </View>
                <View style={styles.miniPickDetails}>
                  <View style={styles.pickDetail}>
                    <Text style={styles.miniPickChoice}>{formatMainLeg(pick, game)}</Text>
                    <View style={[styles.miniConfidenceDot, { backgroundColor: getConfidenceColor(pick.confidence) }]} />
                    {game.played && renderResultMark(pick.result)}
                  </View>
                  {pick.betType !== 'total' && pick.overUnderPick && (
                    <View style={styles.pickDetail}>
                      <Text style={styles.miniPickChoice}>{formatOULeg(pick, game)}</Text>
                      <View style={[styles.miniConfidenceDot, { backgroundColor: getConfidenceColor(pick.overUnderConfidence || pick.confidence) }]} />
                      {game.played && renderResultMark(pick.ouResult)}
                    </View>
                  )}
                </View>
                {pick.reasoning && pick.reasoning.trim() !== '' && (
                  <View style={styles.reasoningContainer}>
                    <Text style={styles.reasoningText}>💬 {pick.reasoning}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noPicksText}>No picks yet for this game</Text>
          )}
          
          {gamePicks.length > 3 && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => router.push(`/game/${game.id}`)}
            >
              <Text style={styles.viewMoreText}>
                View all {gamePicks.length} picks →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Our Picks</Text>
          <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
        </View>
        <View style={styles.sportBadge}>
          <Text style={styles.sportBadgeText}>{getSportLabel()}</Text>
        </View>
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'picks' && styles.tabButtonActive]}
          onPress={() => setActiveTab('picks')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'picks' && styles.tabButtonTextActive]}>
            {groupInfo?.sport === 'nfl' ? "This Week's Picks" : 'Recent Picks'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ratings' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ratings')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'ratings' && styles.tabButtonTextActive]}>
            Group Ratings
          </Text>
        </TouchableOpacity>
      </View>

      {/* PICKS TAB CONTENT */}
      {activeTab === 'picks' && (
        <>
          {/* Group Name Row */}
          <View style={styles.groupNameRow}>
            <Text style={styles.groupNameText}>{groupInfo?.name || groupName}</Text>
            <View style={styles.sportBadgeSmall}>
              <Text style={styles.sportBadgeSmallText}>{getSportLabel()}</Text>
            </View>
          </View>

          {/* Season Picker — shown whenever multiple seasons exist
              or we're in the out-of-season Season Recap view. */}
          {showSeasonPicker && (
            <ScrollView
              horizontal
              style={styles.weekSelector}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekSelectorContent}
            >
              {visibleSeasonOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.seasonChip,
                    recapSeason === opt.value && styles.seasonChipActive,
                  ]}
                  onPress={() => setSelectedSeason(opt.value)}
                >
                  <Text style={[
                    styles.seasonChipText,
                    recapSeason === opt.value && styles.seasonChipTextActive,
                  ]}>
                    {formatSeasonForSport(opt.value, groupInfo?.sport ?? 'nfl')} Season
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Week Selector - NFL, in-season current view only */}
          {groupInfo?.sport === 'nfl' && !recapMode && (
            <ScrollView
              ref={weekScrollViewRef}
              horizontal
              style={styles.weekSelector}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekSelectorContent}
            >
              {Array.from({ length: 22 }, (_, i) => i + 1).map((weekNum) => (
                <TouchableOpacity
                  key={weekNum}
                  style={[
                    styles.weekChip,
                    selectedWeek === weekNum && styles.weekChipActive
                  ]}
                  onPress={() => setSelectedWeek(weekNum)}
                >
                  <Text style={[
                    styles.weekChipText,
                    selectedWeek === weekNum && styles.weekChipTextActive
                  ]}>
                    Wk {weekNum}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Body — Season Recap when out of season / viewing a past
              season, otherwise the live upcoming-games list. */}
          {recapMode ? (
            <SeasonRecap
              groupId={groupId}
              season={recapSeason}
              seasonLabel={recapSeasonLabel}
              resolveName={(uid, fallback) =>
                groupInfo?.visibility === 'public'
                  ? getPublicAlias(uid)
                  : fallback
              }
            />
          ) : (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Upcoming — NFL flat (the week IS the grouping), other
                  sports grouped by day. The section label only appears
                  once there are results to separate it from. */}
              {upcomingGames.length > 0 && playedGames.length > 0 && (
                <Text style={styles.sectionHeader}>UPCOMING</Text>
              )}
              {groupInfo?.sport !== 'nfl' ? (
                groupByDate(upcomingGames).map(([dateGroup, games]) => (
                  <View key={dateGroup}>
                    <Text style={styles.dateGroupHeader}>{dateGroup}</Text>
                    {games.map(game => renderGameCard(game))}
                  </View>
                ))
              ) : (
                upcomingGames.map(game => renderGameCard(game))
              )}

              {/* Results — most recent day first. A single day folds into
                  the section label ("RESULTS · YESTERDAY"). */}
              {playedGames.length > 0 && (
                <Text style={styles.sectionHeader}>
                  {playedByDate.length === 1
                    ? `RESULTS · ${playedByDate[0][0].toUpperCase()}`
                    : 'RESULTS'}
                </Text>
              )}
              {playedByDate.map(([dateGroup, games]) => (
                <View key={dateGroup}>
                  {playedByDate.length > 1 && (
                    <Text style={styles.dateGroupHeader}>{dateGroup}</Text>
                  )}
                  {games.map(game => renderGameCard(game))}
                </View>
              ))}

              {gamesData.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>🏟️</Text>
                  {/* A past week can't be picked any more, so don't invite it. */}
                  {isPastWeek ? (
                    <>
                      <Text style={styles.emptyText}>No picks in Week {selectedWeek}</Text>
                      <Text style={[styles.emptyText, { fontSize: 13, color: '#636366', marginBottom: 16 }]}>
                        Nobody shared a pick to this group that week
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyText}>No picks yet this week</Text>
                      <Text style={[styles.emptyText, { fontSize: 13, color: '#636366', marginBottom: 16 }]}>
                        Be the first to make picks for this group
                      </Text>
                      <TouchableOpacity
                        style={styles.makePicksButton}
                        onPress={() => router.push('/(tabs)/games')}
                      >
                        <Text style={styles.makePicksText}>Make Picks →</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* Summary Stats */}
              {gamesData.length > 0 && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    {groupInfo?.sport === 'nfl' ? `Week ${selectedWeek} Summary` : 'Recent Activity'}
                  </Text>
                  <Text style={styles.summaryText}>
                    {gamesData.length} games • {Object.values(friendPicksByGame).flat().length} total picks
                  </Text>
                  {hasGroupRecord && (
                    <Text style={styles.summaryRecord}>
                      Group {formatRecord(weekRecord.group)}
                      {hasYourRecord ? `  •  You ${formatRecord(weekRecord.you)}` : ''}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* RATINGS TAB CONTENT */}
      {activeTab === 'ratings' && renderRatingsTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#FFF',
    fontSize: 32,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  sportBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sportBadgeSmall: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sportBadgeSmallText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#FF6B35',
  },
  tabButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#FF6B35',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  groupNameText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Week / season strips share the Games screen's SportTabs look:
  // compact rounded rectangles (not pills), 12px semibold labels, and a
  // row that centers itself when everything fits, scrolling only when it
  // doesn't.
  weekSelector: {
    maxHeight: 34,
    marginVertical: 6,
  },
  weekSelectorContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  weekChip: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekChipActive: {
    backgroundColor: '#FF6B35',
  },
  weekChipText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  weekChipTextActive: {
    color: '#FFF',
  },
  seasonChip: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonChipActive: {
    backgroundColor: '#FF6B35',
  },
  seasonChipText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  seasonChipTextActive: {
    color: '#FFF',
  },
  sectionHeader: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 10,
  },
  dateGroupHeader: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gameSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2C2C2E',
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
  gameHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  gameHeaderRight: {
    alignItems: 'flex-end',
  },
  lockTime: {
    color: '#FF9500',
    fontSize: 11,
    marginBottom: 4,
  },
  finalText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultMark: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  resultWin: {
    color: '#34C759',
  },
  resultLoss: {
    color: '#FF3B30',
  },
  resultPush: {
    color: '#8E8E93',
  },
  pickSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pickTypeLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  consensusBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    marginBottom: 6,
  },
  unanimousBar: {
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  barFill: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    borderRadius: 16, 
  },
  barText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  consensusText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  picksContainer: {
    padding: 12,
  },
  miniPickCard: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  miniPickHeader: {
    marginBottom: 4,
  },
  miniUsername: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  miniUsernameYou: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  miniPickDetails: {
    gap: 4,
  },
  pickDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPickChoice: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  miniConfidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reasoningContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#3C3C3E',
  },
  reasoningText: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  noPicksText: {
    color: '#8E8E93',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  viewMoreButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  summaryTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    color: '#FFF',
    fontSize: 14,
  },
  summaryRecord: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  makePicksButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  makePicksText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});