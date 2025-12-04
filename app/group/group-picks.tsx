import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import GroupRatingsLeaderboard from '../../components/GroupRatingsLeaderboard';
import { Sport } from '../../services/pickrating';

interface FriendPick {
  id: string;
  username: string;
  pick: 'home' | 'away';
  confidence: string;
  confidenceValue: number;
  confidenceColor: string;
  reasoning?: string;
  timestamp: string;
  winRate: number;
  totalPicks: number;
  weightedScore?: number;
  overUnderPick?: 'over' | 'under';
  overUnderConfidence?: string;
}

interface GroupInfo {
  id: string;
  name: string;
  sport: Sport;
}

export default function GroupPicksScreen() {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string || '';
  const groupName = params.groupName as string || 'Group';

  // Tab state
  const [activeTab, setActiveTab] = useState<'picks' | 'ratings'>('picks');

  // Group info (including sport)
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // Existing state
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [gamesData, setGamesData] = useState<any[]>([]);
  const [friendPicksByGame, setFriendPicksByGame] = useState<Record<string, FriendPick[]>>({});
  const [loading, setLoading] = useState(true);
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
      if (!groupId) return;

      const { data, error } = await supabase
        .from('groups')
        .select('id, name, sport')
        .eq('id', groupId)
        .single();

      if (data) {
        setGroupInfo({
          id: data.id,
          name: data.name,
          sport: (data.sport as Sport) || 'nfl'
        });
      }
    };

    fetchGroupInfo();
  }, [groupId]);

  // Load current week from database on mount
  useEffect(() => {
    const loadCurrentWeek = async () => {
      const { data } = await supabase
        .from('app_state')
        .select('current_week')
        .single();
      
      if (data?.current_week) {
        console.log('Setting week to:', data.current_week);
        setCurrentWeekNumber(data.current_week);
        setSelectedWeek(data.current_week);
        
        setTimeout(() => {
          if (weekScrollViewRef.current && data.current_week > 4) {
            weekScrollViewRef.current.scrollTo({ 
              x: (data.current_week - 2) * 90, 
              animated: true 
            });
          }
        }, 100);
      }
    };
    
    loadCurrentWeek();
  }, []);

  // Only load when selectedWeek is set
  useEffect(() => {
    if (selectedWeek !== null) {
      loadGamesAndPicks();
    }
  }, [selectedWeek]);

  const loadGamesAndPicks = async () => {
    console.log('Loading games for week:', selectedWeek);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // FIRST: Get group members so we only show their picks
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) {
        console.error('Error fetching group members:', membersError);
      }

      const memberIds = groupMembers?.map(m => m.user_id) || [];
      const memberCount = memberIds.length;
      setGroupMemberCount(memberCount);
      console.log('Group members:', memberCount);

      if (memberIds.length === 0) {
        console.log('No members in group');
        setGamesData([]);
        setFriendPicksByGame({});
        setLoading(false);
        return;
      }

      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('week', selectedWeek)
        .eq('season', 2025)
        .order('game_date', { ascending: true });

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        setLoading(false);
        return;
      }

      if (!games || games.length === 0) {
        console.log('No games found for week', selectedWeek);
        setGamesData([]);
        setFriendPicksByGame({});
        setLoading(false);
        return;
      }

      const transformedGames = games.map(game => ({
        id: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeTeamShort: game.home_team,
        awayTeamShort: game.away_team,
        spread: { home: game.home_spread, away: game.away_spread },
        overUnder: game.over_under_line,
        time: formatGameTime(game.game_date),
        date: formatGameDate(game.game_date),
        timeToLock: getTimeToLock(game.game_date),
        locked: game.locked
      }));

      setGamesData(transformedGames);

      const gameIds = games.map(g => g.id);
      
      // FIXED: Only get picks from GROUP MEMBERS
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .in('game_id', gameIds)
        .in('user_id', memberIds)  // <-- Filter by group membership!
        .order('created_at', { ascending: false });

      if (picksError) {
        console.error('Error fetching picks:', picksError);
      }

      console.log('Picks from group members:', picks?.length || 0);

      let pickWithUsernames = picks || [];
      if (picks && picks.length > 0) {
        const userIds = [...new Set(picks.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', userIds);

        const usernameMap = new Map(profiles?.map(p => [p.id, p.username || p.display_name || 'Unknown']) || []);

        pickWithUsernames = picks.map(pick => ({
          ...pick,
          username: pick.user_id === user.id ? 'You' : (usernameMap.get(pick.user_id) || 'Unknown')
        }));
      }

      const allPicksByGame: Record<string, FriendPick[]> = {};
      
      gameIds.forEach(gameId => {
        const gamePicks = pickWithUsernames.filter(p => p.game_id === gameId);
        
        const transformedPicks: FriendPick[] = gamePicks.map(pick => ({
          id: pick.id,
          username: pick.username,
          pick: pick.pick as 'home' | 'away',
          confidence: pick.confidence,
          confidenceValue: getConfidenceValue(pick.confidence),
          confidenceColor: getConfidenceColor(pick.confidence),
          reasoning: pick.reasoning,
          timestamp: formatTimeAgo(pick.created_at),
          winRate: 0,
          totalPicks: 0,
          weightedScore: 0,
          overUnderPick: pick.over_under_pick,
          overUnderConfidence: pick.over_under_confidence
        }));

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
  const formatGameTime = (dateStr: string): string => {
    try {
      const gameDate = new Date(dateStr);
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
      const gameDate = new Date(dateStr);
      return gameDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
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
      if (diffMinutes > 0) return `${diffMinutes}m`;
      
      return 'LOCKED';
    } catch {
      return 'Soon';
    }
  };

  const getConfidenceValue = (confidence: string): number => {
    switch (confidence?.toLowerCase()) {
      case 'very high': return 95;
      case 'high': return 85;
      case 'medium': return 60;
      case 'low': return 40;
      default: return 50;
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
    // Bright green only for unanimous
    if (isUnanimous) return '#34C759';
    
    // Muted colors for non-unanimous
    if (percentage >= 70) return '#6B7280';  // Muted gray
    if (percentage >= 55) return '#6B7280';  // Muted gray
    return '#4B5563';                         // Darker gray for split
  };

  const calculateGameConsensus = (picks: FriendPick[], totalMembers: number) => {
    if (!picks || picks.length === 0) return null;

    let homeScore = 0;
    let awayScore = 0;

    picks.forEach(pick => {
      if (pick.pick === 'home') {
        homeScore++;
      } else {
        awayScore++;
      }
    });

    const totalPicks = homeScore + awayScore;
    if (totalPicks === 0) return null;
    
    const homePercentage = Math.round((homeScore / totalPicks) * 100);
    const awayPercentage = 100 - homePercentage;
    
    // Unanimous requires: ALL members picked AND all agree
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
    
    // Unanimous requires: ALL members picked O/U AND all agree
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER - Generic "Our Picks" with week */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Our Picks</Text>
          <Text style={styles.headerSubtitle}>Week {selectedWeek}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'picks' && styles.tabButtonActive]}
          onPress={() => setActiveTab('picks')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'picks' && styles.tabButtonTextActive]}>
            This Week's Picks
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
          {/* Group Name Row for This Week's Picks */}
          <View style={styles.groupNameRow}>
            <Text style={styles.groupNameText}>{groupInfo?.name || groupName}</Text>
          </View>

          {/* Week Selector */}
          <ScrollView 
            ref={weekScrollViewRef}
            horizontal 
            style={styles.weekSelector}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekSelectorContent}
            scrollEnabled={true}
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map((weekNum) => (
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
                  Week {weekNum}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Games List */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {gamesData.map(game => {
              const gamePicks = friendPicksByGame[game.id] || [];
              const spreadConsensus = calculateGameConsensus(gamePicks, groupMemberCount);
              const ouConsensus = calculateOUConsensus(gamePicks, groupMemberCount);
              
              return (
                <View key={game.id} style={styles.gameSection}>
                  {/* Game Header */}
                  <TouchableOpacity 
                    style={styles.gameHeader}
                    onPress={() => router.push(`/game/${game.id}`)}
                  >
                    <View>
                      <Text style={styles.gameTitle}>
                        {game.awayTeamShort} @ {game.homeTeamShort}
                      </Text>
                      <Text style={styles.gameTime}>{game.date} • {game.time}</Text>
                    </View>
                    <View style={styles.gameHeaderRight}>
                      <Text style={styles.lockTime}>⏰ {game.timeToLock}</Text>
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
                                ⭐ {spreadConsensus.recommendation === 'away' 
                                  ? `${game.awayTeamShort} ${game.spread.away}` 
                                  : `${game.homeTeamShort} ${game.spread.home}`} - UNANIMOUS
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
                                  flex: spreadConsensus.awayPercentage || 1 
                                }
                              ]}
                            >
                              {spreadConsensus.awayPercentage > 0 && (
                                <Text style={styles.barText}>
                                  {game.awayTeamShort} {game.spread.away}
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
                                <Text style={styles.barText}>
                                  {game.homeTeamShort} {game.spread.home}
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
                              <Text style={styles.miniPickChoice}>
                                {pick.pick === 'home' ? game.homeTeamShort : game.awayTeamShort} {pick.pick === 'home' ? game.spread.home : game.spread.away}
                              </Text>
                              <View style={[styles.miniConfidenceDot, { backgroundColor: getConfidenceColor(pick.confidence) }]} />
                            </View>
                            {pick.overUnderPick && (
                              <View style={styles.pickDetail}>
                                <Text style={styles.miniPickChoice}>
                                  {pick.overUnderPick.toUpperCase()} {game.overUnder}
                                </Text>
                                <View style={[styles.miniConfidenceDot, { backgroundColor: getConfidenceColor(pick.overUnderConfidence || '') }]} />
                              </View>
                            )}
                          </View>
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
            })}

            {/* Summary Stats */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Week {selectedWeek} Summary</Text>
              <Text style={styles.summaryText}>
                {gamesData.length} games • {Object.values(friendPicksByGame).flat().length} total picks
              </Text>
            </View>
          </ScrollView>
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
  headerRight: {
    width: 48,
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
  weekSelector: {
    maxHeight: 40,
    marginVertical: 8,
  },
  weekSelectorContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  weekChip: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  weekChipActive: {
    backgroundColor: '#FF6B35',
  },
  weekChipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  weekChipTextActive: {
    color: '#FFF',
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
  gameHeaderRight: {
    alignItems: 'flex-end',
  },
  lockTime: {
    color: '#FF9500',
    fontSize: 11,
    marginBottom: 4,
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
    overflow: 'hidden',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
});