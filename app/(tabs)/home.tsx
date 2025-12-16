import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Sport, getSportConfig } from '../../services/pickrating';

// Sport logos - add your logo files to assets/images/
// If a logo file doesn't exist, set to null and it will show text only
const SPORT_LOGOS: Partial<Record<Sport, ImageSourcePropType>> = {
  // Uncomment these as you add logo files to assets/images/
  // nfl: require('../../assets/images/nfl.png'),
  // ncaaf: require('../../assets/images/ncaaf.png'),
  // nba: require('../../assets/images/nba.png'),
  // ncaab: require('../../assets/images/ncaab.png'),
  // wnba: require('../../assets/images/wnba.png'),
  // mlb: require('../../assets/images/mlb.png'),
  // nhl: require('../../assets/images/nhl.png'),
  // soccer_epl: require('../../assets/images/epl.png'),
  // ufc: require('../../assets/images/ufc.png'),
  // pga: require('../../assets/images/pga.png'),
};

// Fallback emojis when logos aren't available
const SPORT_EMOJIS: Partial<Record<Sport, string>> = {
  nfl: '🏈',
  nba: '🏀',
  ncaaf: '🏈',
  ncaab: '🏀',
  wnba: '🏀',
  mlb: '⚾',
  nhl: '🏒',
  soccer_epl: '⚽',
  soccer_laliga: '⚽',
  soccer_mls: '⚽',
  ufc: '🥊',
  boxing: '🥊',
  pga: '⛳',
  f1: '🏎️',
};

// Sports available in the app (add more as you expand)
const AVAILABLE_SPORTS: { sport: Sport; enabled: boolean }[] = [
  { sport: 'nfl', enabled: true },
  { sport: 'nba', enabled: true },
  { sport: 'ncaaf', enabled: false },
  { sport: 'ncaab', enabled: false },
  { sport: 'soccer_epl', enabled: false },
  { sport: 'ufc', enabled: false },
  { sport: 'pga', enabled: false },
];

interface UserGroup {
  id: string;
  name: string;
  sport: Sport;
  memberCount: number;
  userRank?: number;
  recentActivity?: string;
}

interface UpcomingGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  gameTime: string;
  timeToLock: string;
  userHasPicked: boolean;
  spread?: string;
  overUnder?: number;
}

interface UserStats {
  correct: number;
  wrong: number;
  pending: number;
  winRate: number;
}

export default function HomeScreen() {
  const [selectedSport, setSelectedSport] = useState<Sport>('nfl');
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(14);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  const sportScrollRef = useRef<ScrollView>(null);

  // Get current sport config
  const sportConfig = getSportConfig(selectedSport);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload when sport changes
  useEffect(() => {
    if (userId) {
      loadSportData();
    }
  }, [selectedSport, userId]);

  const loadInitialData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      setUserId(user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username || profile.display_name || 'Friend');
      }

      // Get current week
      const { data: appState } = await supabase
        .from('app_state')
        .select('current_week')
        .single();

      if (appState?.current_week) {
        setCurrentWeek(appState.current_week);
      }

      // Load user's overall stats
      await loadUserStats(user.id);
      
      // Load sport-specific data
      await loadSportData();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (uid: string) => {
    try {
      // Get all picks
      const { data: picks } = await supabase
        .from('picks')
        .select('correct, game_id, week, season')
        .eq('user_id', uid);

      if (picks) {
        const correct = picks.filter(p => p.correct === true).length;
        const wrong = picks.filter(p => p.correct === false).length;
        const decided = correct + wrong;

        // Get current week's unlocked games to calculate "upcoming" properly
        const { data: upcomingGames } = await supabase
          .from('games')
          .select('id')
          .eq('week', currentWeek)
          .eq('season', 2025)
          .eq('locked', false)
          .gt('game_date', new Date().toISOString());

        const upcomingGameIds = new Set(upcomingGames?.map(g => g.id) || []);
        
        // Upcoming = picks for current week games that haven't started
        const upcoming = picks.filter(p => 
          p.week === currentWeek && 
          p.season === 2025 && 
          upcomingGameIds.has(p.game_id)
        ).length;

        setUserStats({
          correct,
          wrong,
          pending: upcoming, // Now shows only current week upcoming
          winRate: decided > 0 ? Math.round((correct / decided) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadSportData = async () => {
    if (!userId) return;

    try {
      // Load groups for selected sport
      await loadUserGroups();
      
      // Load upcoming games for selected sport
      await loadUpcomingGames();
    } catch (error) {
      console.error('Error loading sport data:', error);
    }
  };

  const loadUserGroups = async () => {
    if (!userId) return;

    try {
      // Get group IDs user is member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (!memberships || memberships.length === 0) {
        setUserGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Get group details filtered by sport
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name, sport')
        .in('id', groupIds)
        .eq('sport', selectedSport);

      if (groups && groups.length > 0) {
        // Get actual member counts from group_members table
        const groupsWithCounts = await Promise.all(
          groups.map(async (group) => {
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            return {
              id: group.id,
              name: group.name,
              sport: group.sport || 'nfl',
              memberCount: count || 0,
            };
          })
        );

        setUserGroups(groupsWithCounts);
      } else {
        setUserGroups([]);
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  const loadUpcomingGames = async () => {
    if (!userId) return;
        console.log('Loading upcoming games for:', selectedSport);
    try {
    const now = new Date();
    
    // Map sport to league
    const leagueMap: Record<string, string> = {
      'nfl': 'NFL',
      'nba': 'NBA',
      'ncaaf': 'NCAAF',
      'ncaab': 'NCAAB',
    };
    
    const league = leagueMap[selectedSport] || 'NFL';

      // Get games for current week (for NFL) or upcoming games
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .eq('league', league) 
        .eq('season', 2025)
        .eq('locked', false)
        .gte('game_date', now.toISOString()) 
        .order('game_date', { ascending: true })
        .limit(5);

      if (!games) {
        setUpcomingGames([]);
        return;
      }

      // Get user's picks for these games
      const gameIds = games.map(g => g.id);
      const { data: userPicks } = await supabase
        .from('picks')
        .select('game_id')
        .eq('user_id', userId)
        .in('game_id', gameIds);

      const pickedGameIds = new Set(userPicks?.map(p => p.game_id) || []);

       const transformedGames: UpcomingGame[] = games.map(game => {
      // Parse as UTC
      const dateStr = game.game_date.endsWith('Z') 
        ? game.game_date 
        : game.game_date.replace(' ', 'T') + 'Z';
      const gameDateTime = new Date(dateStr);
      
      return {
        id: game.id,
        homeTeam: game.home_team_code || game.home_team,
        awayTeam: game.away_team_code || game.away_team,
        gameDate: formatGameDate(gameDateTime),
        gameTime: formatGameTime(gameDateTime),
        timeToLock: getTimeToLock(game.game_date),
        userHasPicked: pickedGameIds.has(game.id),
        spread: game.home_spread,
        overUnder: game.over_under_line
      };
    });

      setUpcomingGames(transformedGames);
    } catch (error) {
      console.error('Error loading upcoming games:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSportData();
    if (userId) {
      await loadUserStats(userId);
    }
    setRefreshing(false);
  };

    // Helper functions
  const formatGameDate = (date: Date): string => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      }
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return 'TBD';
    }
  };

  const formatGameTime = (date: Date): string => {
    try {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch {
      return 'TBD';
    }
  };

  const getTimeToLock = (dateStr: string): string => {
    try {
      const gameDate = new Date(dateStr);
      const now = new Date();
      const diffMs = gameDate.getTime() - now.getTime();

      if (diffMs <= 0) return 'LOCKED';

      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
      if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
      return `${diffMinutes}m`;
    } catch {
      return '';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  // Get the current sport emoji for Quick Actions
  const currentSportEmoji = SPORT_EMOJIS[selectedSport] || '🏈';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.username}>Hey {username}</Text>
        </View>
      </View>

      {/* Sport Tabs */}
      <ScrollView
        ref={sportScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sportTabsContainer}
        contentContainerStyle={styles.sportTabsContent}
      >
        {AVAILABLE_SPORTS.map(({ sport, enabled }) => {
          const config = getSportConfig(sport);
          const isSelected = selectedSport === sport;
          const logo = SPORT_LOGOS[sport];
          const emoji = SPORT_EMOJIS[sport];

          return (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportTab,
                isSelected && styles.sportTabActive,
                !enabled && styles.sportTabDisabled
              ]}
              onPress={() => enabled && setSelectedSport(sport)}
              disabled={!enabled}
            >
              {logo ? (
                <Image 
                  source={logo} 
                  style={[
                    styles.sportLogo,
                    !enabled && styles.sportLogoDisabled
                  ]} 
                  resizeMode="contain"
                />
              ) : emoji ? (
                <Text style={styles.sportEmoji}>{emoji}</Text>
              ) : null}
              <Text style={[
                styles.sportTabText,
                isSelected && styles.sportTabTextActive,
                !enabled && styles.sportTabTextDisabled
              ]}>
                {config.shortName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
        }
      >
        {/* Overall Stats Card */}
        {userStats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Prediction Accuracy</Text>
            <Text style={styles.statsWinRate}>{userStats.winRate}%</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValueGreen}>{userStats.correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValueRed}>{userStats.wrong}</Text>
                <Text style={styles.statLabel}>Wrong</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValueOrange}>{userStats.pending}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sport-specific Groups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your {sportConfig.shortName} Groups</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/group/create', params: { sport: selectedSport } })}>
              <Text style={styles.sectionAction}>+ New</Text>
            </TouchableOpacity>
          </View>

          {userGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No {sportConfig.shortName} groups yet</Text>
              <TouchableOpacity
                style={styles.createGroupButton}
                onPress={() => router.push({ pathname: '/group/create', params: { sport: selectedSport } })}
              >
                <Text style={styles.createGroupButtonText}>Create {sportConfig.shortName} Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.browseGroupsButton}
                onPress={() => router.push('/group/browse-groups')}
              >
                <Text style={styles.browseGroupsButtonText}>Browse Groups</Text>
              </TouchableOpacity>
            </View>
          ) : (
            userGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => router.push({
                  pathname: '/group/group-picks',
                  params: { groupId: group.id, groupName: group.name }
                })}
              >
                <View style={styles.groupCardLeft}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMeta}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.groupCardRight}>
                  <View style={styles.sportBadgeSmall}>
                    <Text style={styles.sportBadgeText}>{sportConfig.shortName}</Text>
                  </View>
                  <Text style={styles.groupArrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {sportConfig.scheduleModel === 'week' ? `Week ${currentWeek} Games` : 'Upcoming Games'}
            </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/games', params: { sport: selectedSport } })}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingGames.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming games</Text>
            </View>
          ) : (
            upcomingGames.slice(0, 3).map(game => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => router.push(`/game/${game.id}`)}
              >
                <View style={styles.gameCardLeft}>
                  <Text style={styles.gameMatchup}>{game.awayTeam} @ {game.homeTeam}</Text>
                  <Text style={styles.gameTime}>{game.gameDate} • {game.gameTime}</Text>
                </View>
                <View style={styles.gameCardRight}>
                  {game.userHasPicked ? (
                    <View style={styles.pickedBadge}>
                      <Text style={styles.pickedBadgeText}>✓ Picked</Text>
                    </View>
                  ) : (
                    <View style={styles.lockTimeBadge}>
                      <Text style={styles.lockTimeText}>⏰ {game.timeToLock}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push({ pathname: '/(tabs)/games', params: { sport: selectedSport } })}
            >
              <Text style={styles.quickActionEmoji}>{currentSportEmoji}</Text>
              <Text style={styles.quickActionTitle}>Make Picks</Text>
              <Text style={styles.quickActionSub}>View today's games</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push({ pathname: '/(tabs)/leaderboard', params: { sport: selectedSport } })}
            >
              <Text style={styles.quickActionEmoji}>🏆</Text>
              <Text style={styles.quickActionTitle}>Leaderboard</Text>
              <Text style={styles.quickActionSub}>See top performers</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  greeting: {
    color: '#8E8E93',
    fontSize: 14,
  },
  username: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sportTabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sportTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  sportTabActive: {
    backgroundColor: '#FF6B35',
  },
  sportTabDisabled: {
    opacity: 0.4,
  },
  sportLogo: {
    width: 24,
    height: 24,
  },
  sportLogoDisabled: {
    opacity: 0.4,
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  sportTabTextActive: {
    color: '#FFF',
  },
  sportTabTextDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  statsTitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  statsWinRate: {
    color: '#FF6B35',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValueGreen: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statValueRed: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statValueOrange: {
    color: '#FF9800',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionAction: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 16,
  },
  createGroupButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  createGroupButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  browseGroupsButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  browseGroupsButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupCardLeft: {
    flex: 1,
  },
  groupName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  groupMeta: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 4,
  },
  groupCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportBadgeSmall: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sportBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  groupArrow: {
    color: '#8E8E93',
    fontSize: 24,
  },
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameCardLeft: {
    flex: 1,
  },
  gameMatchup: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  gameTime: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 4,
  },
  gameCardRight: {
    alignItems: 'flex-end',
  },
  pickedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pickedBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lockTimeBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lockTimeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
});