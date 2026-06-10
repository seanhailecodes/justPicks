import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotificationContext } from '../../components/NotificationContext';
import { getSport, type Sport } from '../../services/activeSport';
import { getUserGroups } from '../lib/database';
import { supabase } from '../lib/supabase';

interface PublicGroup {
  id: string;
  name: string;
  created_by: string;
  visibility: string;
  require_approval: boolean;
  join_type: string;
  invite_code: string;
  created_at: string;
  sport: string;
  memberCount: number;
  ownerUsername: string;
  isMember: boolean;
  role: string | null;
  rating: number | null;
  weekAccuracy: number | null;
  monthAccuracy: number | null;
  allTimeAccuracy: number | null;
  trend?: 'up' | 'down' | 'neutral';
  totalGroupPicks?: number;
}

type Tab = 'public' | 'private';

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', wnba: '🏀', mlb: '⚾', nhl: '🏒',
  ncaab: '🏀', soccer: '⚽', ufc: '🥋', boxing: '🥊', pga: '⛳',
};
const getSportEmoji = (sport: string) => SPORT_EMOJI[sport] || '🏆';

export default function BrowseGroupsScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('public');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const { showNotification } = useNotificationContext();

  useEffect(() => {
    loadGroups();
  }, []);

  // Only groups the user is a member of, split by visibility.
  const tabGroups = useMemo(
    () => groups.filter(g => g.isMember && (
      tab === 'private' ? g.visibility !== 'public' : g.visibility === 'public'
    )),
    [groups, tab]
  );

  // Sport chips available in the current tab (only sports that have groups).
  const availableSports = useMemo(
    () => Array.from(new Set(tabGroups.map(g => g.sport || 'nfl'))).sort(),
    [tabGroups]
  );

  // Final list: tab → sport → search.
  const filteredGroups = useMemo(() => {
    let list = tabGroups;
    if (sportFilter !== 'all') list = list.filter(g => (g.sport || 'nfl') === sportFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter(g => g.name.toLowerCase().includes(q) || g.ownerUsername.toLowerCase().includes(q));
    return list;
  }, [tabGroups, sportFilter, searchQuery]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setSportFilter('all'); // a sport from the other tab may not exist here
  };

  const formatAccuracy = (accuracy: number | null | undefined) =>
    accuracy === null || accuracy === undefined ? '—' : `${accuracy}%`;

  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Member groups (public + private) with performance stats.
      const userGroups = await getUserGroups(user.id);
      if (userGroups.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Enrich with invite_code + owner username (not returned by getUserGroups).
      const ids = userGroups.map(g => g.id);
      const { data: meta } = await supabase
        .from('groups')
        .select('id, invite_code, created_by')
        .in('id', ids);
      const metaById = new Map((meta || []).map(m => [m.id, m]));

      const ownerIds = [...new Set((meta || []).map(m => m.created_by).filter(Boolean))];
      const { data: owners } = ownerIds.length
        ? await supabase.from('profiles').select('id, username, display_name').in('id', ownerIds)
        : { data: [] as any[] };
      const ownerById = new Map(
        (owners || []).map(o => [o.id, o.username || o.display_name || 'Unknown'])
      );

      const withDetails: PublicGroup[] = userGroups.map(g => {
        const m = metaById.get(g.id);
        return {
          id: g.id,
          name: g.name,
          created_by: m?.created_by || '',
          visibility: g.visibility,
          require_approval: g.joinType === 'request_to_join',
          join_type: g.joinType,
          invite_code: m?.invite_code || '',
          created_at: g.createdAt,
          sport: g.sport,
          memberCount: g.memberCount,
          ownerUsername: (m?.created_by && ownerById.get(m.created_by)) || 'Unknown',
          isMember: true,
          role: g.role,
          rating: g.rating,
          weekAccuracy: g.weekAccuracy,
          monthAccuracy: g.monthAccuracy,
          allTimeAccuracy: g.allTimeAccuracy,
          trend: g.trend,
          totalGroupPicks: g.totalGroupPicks,
        };
      });

      setGroups(withDetails);
    } catch (error) {
      console.error('Error loading groups:', error);
      showNotification('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (group: PublicGroup) => {
    try {
      const code = group.invite_code;
      if (!code) {
        Alert.alert('Error', 'No invite code found for this group');
        return;
      }
      await Share.share({
        message: `Join my group "${group.name}" on justPicks! 🏀\n\nUse code: ${code}`,
        url: `https://justpicks.app/join/${code}`,
        title: `Join ${group.name} on justPicks`,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', 'Failed to share invite link');
    }
  };

  const handleJoinGroup = async (group: PublicGroup) => {
    if (!currentUserId) {
      showNotification('Error', 'You must be logged in to join groups');
      return;
    }
    setJoiningGroupId(group.id);
    try {
      if (group.join_type === 'invite_only') {
        showNotification('Invite Only', 'This group is invite-only — you need an invite link from a member to join.');
        return;
      }
      if (group.join_type === 'request_to_join' || group.require_approval) {
        showNotification('Approval Required', 'This group requires owner approval. This feature is coming soon!');
        return;
      }
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: currentUserId, role: 'member' });
      const alreadyMember = error?.code === '23505';
      if (error && !alreadyMember) throw error;

      setGroups(prev =>
        prev.map(g =>
          g.id === group.id
            ? { ...g, isMember: true, memberCount: g.memberCount + (alreadyMember ? 0 : 1) }
            : g
        )
      );
      showNotification('Success!', `You've joined "${group.name}".`);
    } catch (error) {
      console.error('Error joining group:', error);
      showNotification('Error', 'Failed to join group. Please try again.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {embedded ? (
          <View style={styles.placeholder} />
        ) : (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{embedded ? 'My Groups' : 'Browse Groups'}</Text>
        {embedded ? (
          <TouchableOpacity onPress={() => router.push('/group/create')} style={styles.backButton}>
            <Text style={styles.createIcon}>＋</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Personal / Public toggle */}
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'public' && styles.segmentBtnActive]}
          onPress={() => switchTab('public')}
        >
          <Text style={[styles.segmentText, tab === 'public' && styles.segmentTextActive]}>🌐 My Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'private' && styles.segmentBtnActive]}
          onPress={() => switchTab('private')}
        >
          <Text style={[styles.segmentText, tab === 'private' && styles.segmentTextActive]}>🔒 My Private</Text>
        </TouchableOpacity>
      </View>

      {/* Sport filter (All + sports present in this tab) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sportChips}
        contentContainerStyle={styles.sportChipsContent}
      >
        <TouchableOpacity
          style={[styles.sportChip, sportFilter === 'all' && styles.sportChipActive]}
          onPress={() => setSportFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.sportChipText, sportFilter === 'all' && styles.sportChipTextActive]}>All</Text>
        </TouchableOpacity>
        {availableSports.map((s) => {
          const sp = getSport(s as Sport);
          const active = sportFilter === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.sportChip, active && styles.sportChipActive]}
              onPress={() => setSportFilter(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sportChipEmoji, sp.emoji === '🏀' && styles.sportChipEmojiBasketball]}>
                {sp.emoji}
              </Text>
              <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>{sp.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? 'No groups found'
                : tab === 'private'
                  ? "You're not in any private groups"
                  : "You're not in any public groups"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Create or join a group to get started!'}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupOwner}>by @{group.ownerUsername}</Text>
                  <View style={styles.groupBadges}>
                    <View style={styles.sportBadge}>
                      <Text style={styles.badgeText}>
                        {getSportEmoji(group.sport)} {(group.sport || 'nfl').toUpperCase()}
                      </Text>
                    </View>
                    {group.visibility === 'public' ? (
                      <View style={styles.publicBadge}>
                        <Text style={styles.badgeText}>🌐 Public</Text>
                      </View>
                    ) : (
                      <View style={styles.privateBadge}>
                        <Text style={styles.privateBadgeText}>🔒 Private</Text>
                      </View>
                    )}
                    {group.require_approval && (
                      <View style={styles.approvalBadge}>
                        <Text style={styles.badgeText}>✓ Approval Required</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.memberCount}>{group.memberCount} members</Text>
              </View>

              <Text style={styles.groupDate}>
                Created {new Date(group.created_at).toLocaleDateString()}
              </Text>

              {(group.totalGroupPicks ?? 0) > 0 ? (
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceValue}>
                      {formatAccuracy(group.rating)}
                      {group.trend === 'up' && <Text style={styles.trendUp}> ↑</Text>}
                      {group.trend === 'down' && <Text style={styles.trendDown}> ↓</Text>}
                    </Text>
                    <Text style={styles.performanceLabel}>Group Rating</Text>
                  </View>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceValue}>{formatAccuracy(group.weekAccuracy)}</Text>
                    <Text style={styles.performanceLabel}>Last Week</Text>
                  </View>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceValue}>{formatAccuracy(group.monthAccuracy)}</Text>
                    <Text style={styles.performanceLabel}>Last Month</Text>
                  </View>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceValue}>{formatAccuracy(group.allTimeAccuracy)}</Text>
                    <Text style={styles.performanceLabel}>All Time</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.makePicksButton}
                  onPress={() => router.push({ pathname: '/(tabs)/games', params: { sport: group.sport || 'nfl' } })}
                >
                  <Text style={styles.makePicksButtonText}>{getSportEmoji(group.sport)} Make Picks</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.openButton}
                onPress={() => router.push(`/group/group-picks?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
              >
                <Text style={styles.openButtonText}>📊 See Group Picks →</Text>
              </TouchableOpacity>

              {(group.role === 'primary_owner' || group.visibility === 'public') && (
                <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvite(group)}>
                  <Text style={styles.inviteButtonText}>📧 Invite Members</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push(`/group/settings?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
              >
                <Text style={styles.settingsButtonText}>
                  {group.role === 'primary_owner' ? '⚙️ Group Settings' : '👋 Leave Group'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  createIcon: {
    color: '#FF6B35',
    fontSize: 30,
    fontWeight: '600',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FF6B35',
  },
  segmentText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFF',
  },
  sportChips: {
    maxHeight: 32,
    marginTop: 12,
  },
  sportChipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    alignItems: 'center',
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 3,
  },
  sportChipActive: {
    backgroundColor: '#FF6B35',
  },
  sportChipEmoji: {
    fontSize: 12,
  },
  sportChipEmojiBasketball: {
    transform: [{ translateX: -1 }],
    marginRight: -1,
  },
  sportChipText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  sportChipTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupOwner: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  groupBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sportBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  publicBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  privateBadge: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#48484A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  privateBadgeText: {
    color: '#C7C7CC',
    fontSize: 11,
    fontWeight: '600',
  },
  approvalBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  memberCount: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  groupDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinedButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  joinedButtonText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  openButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  openButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '700',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  performanceStat: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  performanceValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  makePicksButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  makePicksButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trendUp: {
    color: '#34C759',
    fontSize: 20,
  },
  trendDown: {
    color: '#FF3B30',
    fontSize: 20,
  },
  inviteButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  settingsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
});
