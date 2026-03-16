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
import storage from '../lib/storage';
import { ONBOARDING_KEY } from '../onboarding';
import PushEnrollmentBanner from '../../components/PushEnrollmentBanner';
import FeedbackModal from '../../components/FeedbackModal';
import { Sport, getSportConfig } from '../../services/pickrating';
import { APP_SPORTS, AppSport, SPORT_EMOJI, getDefaultSport, getSport, isSportInSeason } from '../../services/activeSport';
import { useSortedSports } from '../../services/useSortedSports';

// Sport logos - uncomment as you add logo files to assets/images/
const SPORT_LOGOS: Partial<Record<Sport, ImageSourcePropType>> = {};

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
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  bestStreak: number;
}

export default function HomeScreen() {
  const [selectedSport, setSelectedSport] = useState<Sport>(getDefaultSport);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(14);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const sortedSports = useSortedSports(userId);

  const sportScrollRef = useRef<ScrollView>(null);

  // Get current sport config
  const sportConfig = getSportConfig(selectedSport);
  const selectedSportData = getSport(selectedSport);
  // Sports with no season tuple (UFC, PGA) are always "in season"
  const isSelectedSportInSeason = !selectedSportData.season || isSportInSeason(selectedSportData.season);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload when sport changes
  useEffect(() => {
    if (userId) {
      const league = getSport(selectedSport).league;
      loadUserStats(userId, league);
      loadSportData();
    }
  }, [selectedSport, userId]);

  const loadInitialData = async () => {
    try {
      // Get current user first — must be authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      setUserId(user.id);

      // Show onboarding once for new/first-time users
      const onboardingDone = await storage.getItem(ONBOARDING_KEY);
      if (!onboardingDone) {
        router.replace('/onboarding');
        return;
      }

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

      // Load stats for the initial sport
      const initialLeague = getSport(getDefaultSport()).league;
      await loadUserStats(user.id, initialLeague);

      // Load sport-specific data
      await loadSportData();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (uid: string, league?: string) => {
    try {
      // Get all picks for this user
      const { data: allPicks } = await supabase
        .from('picks')
        .select('correct, win_weight, game_id, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      if (!allPicks) return;

      let picks = allPicks;

      // Filter to the selected sport's league if provided
      if (league) {
        const { data: leagueGames } = await supabase
          .from('games')
          .select('id')
          .eq('league', league);
        const leagueGameIds = new Set(leagueGames?.map(g => g.id) || []);
        picks = allPicks.filter(p => leagueGameIds.has(p.game_id));
      }

      // Sum win_weight for correct picks (ML wins are fractional; ATS = 1.0)
      const correct = picks
        .filter(p => p.correct === true)
        .reduce((sum, p) => sum + ((p as any).win_weight ?? 1.0), 0);
      const wrong = picks.filter(p => p.correct === false).length;
      const decided = correct + wrong;
      const pending = picks.filter(p => p.correct === null).length;

      // Streak calculation on resolved picks (oldest→newest order)
      const resolved = picks.filter(p => p.correct !== null);
      let currentStreak = 0;
      let streakType: 'win' | 'loss' | 'none' = 'none';
      let bestStreak = 0;
      let runningWinStreak = 0;
      if (resolved.length > 0) {
        // Walk newest→oldest for current streak
        const newest = [...resolved].reverse();
        const first = newest[0].correct;
        streakType = first ? 'win' : 'loss';
        for (const p of newest) {
          if (p.correct === first) currentStreak++;
          else break;
        }
        // Walk oldest→newest for best win streak
        for (const p of resolved) {
          if (p.correct === true) {
            runningWinStreak++;
            if (runningWinStreak > bestStreak) bestStreak = runningWinStreak;
          } else {
            runningWinStreak = 0;
          }
        }
      }

      setUserStats({
        correct,
        wrong,
        pending,
        winRate: decided > 0 ? Math.round((correct / decided) * 100) : 0,
        currentStreak,
        streakType,
        bestStreak,
      });
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

    // Use activeSport as single source of truth for league mapping
    const league = getSport(selectedSport).league;

      // Get games for current week (for NFL) or upcoming games
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .eq('league', league)
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
        timeToLock: getTimeToLock(gameDateTime),
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

  const getTimeToLock = (gameDate: Date): string => {
    try {
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
  const currentSportEmoji = SPORT_EMOJI[selectedSport] || '🏈';

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
        {sortedSports.map(({ key: sport, enabled, emoji, label }) => {
          const isSelected = selectedSport === sport;
          const logo = SPORT_LOGOS[sport];

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
                {label}
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
        {/* Push notification enrollment banner */}
        <PushEnrollmentBanner />

        {/* Overall Stats Card */}
        {userStats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>{getSport(selectedSport).label} Prediction Accuracy</Text>
            <View style={styles.statsTopRow}>
              <Text style={styles.statsWinRate}>{userStats.winRate}%</Text>
              {userStats.currentStreak > 0 && (
                <View style={[
                  styles.streakBadge,
                  userStats.streakType === 'win' ? styles.streakBadgeWin : styles.streakBadgeLoss,
                ]}>
                  <Text style={styles.streakEmoji}>
                    {userStats.streakType === 'win' ? '🔥' : '🥶'}
                  </Text>
                  <Text style={[
                    styles.streakText,
                    userStats.streakType === 'win' ? styles.streakTextWin : styles.streakTextLoss,
                  ]}>
                    {userStats.currentStreak} {userStats.streakType === 'win' ? 'W' : 'L'} streak
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValueGreen}>
                  {Number.isInteger(userStats.correct) ? userStats.correct : userStats.correct.toFixed(1)}
                </Text>
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
            {userStats.bestStreak > 1 && (
              <Text style={styles.bestStreakText}>
                🏆 Best win streak: {userStats.bestStreak}
              </Text>
            )}
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
              {isSelectedSportInSeason
                ? (sportConfig.scheduleModel === 'week' ? `Week ${currentWeek} Games` : 'Upcoming Games')
                : 'Off Season'}
            </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/games', params: { sport: selectedSport } })}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingGames.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isSelectedSportInSeason
                  ? 'No upcoming games'
                  : `${selectedSportData.label} is currently out of season`}
              </Text>
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

      {/* Floating feedback button */}
      <TouchableOpacity
        style={styles.feedbackFab}
        onPress={() => setShowFeedback(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.feedbackFabText}>💬</Text>
      </TouchableOpacity>

      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
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
  statsTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsWinRate: {
    color: '#FF6B35',
    fontSize: 48,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginBottom: 6,
  },
  streakBadgeWin: {
    backgroundColor: '#34C75920',
    borderWidth: 1,
    borderColor: '#34C75960',
  },
  streakBadgeLoss: {
    backgroundColor: '#FF3B3020',
    borderWidth: 1,
    borderColor: '#FF3B3060',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakTextWin: {
    color: '#34C759',
  },
  streakTextLoss: {
    color: '#FF3B30',
  },
  bestStreakText: {
    color: '#636366',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
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
  feedbackFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackFabText: {
    fontSize: 22,
  },
});