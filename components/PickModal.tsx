import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface UserGroup {
  id: string;
  name: string;
  sport: string;
}

interface PickModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pick: any) => void;
  game: {
    homeTeam: string;
    awayTeam: string;
    spread: { home: string; away: string };
    gameDate?: Date;
    time?: string;
    overUnder?: number;
  };
  currentPick?: string;
  currentOverUnderPick?: string;
  groups?: string[];
}

export default function PickModal({ visible, onClose, onSubmit, game, currentPick, currentOverUnderPick, groups = [] }: PickModalProps) {
  const [selectedPick, setSelectedPick] = useState(currentPick || '');
  const [selectedOverUnder, setSelectedOverUnder] = useState(currentOverUnderPick || '');
  const [confidence, setConfidence] = useState('Medium');
  const [overUnderConfidence, setOverUnderConfidence] = useState('Medium');
  const [reasoning, setReasoning] = useState('');
  const [pickType, setPickType] = useState<'solo' | 'group'>('group');
  const [showHelp, setShowHelp] = useState(false);
  
  // Group selection state
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch user's groups when modal opens
  useEffect(() => {
    if (visible) {
      fetchUserGroups();
      // Reset state
      setSelectedPick(currentPick || '');
      setSelectedOverUnder(currentOverUnderPick || '');
      setPickType('group');
      setConfidence('Medium');
      setOverUnderConfidence('Medium');
      setReasoning('');
    }
  }, [visible, currentPick, currentOverUnderPick]);

  const fetchUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserGroups([]);
        return;
      }

      // Get group IDs user is member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setUserGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Get group details (only NFL groups for now, or filter by game sport)
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name, sport')
        .in('id', groupIds);

      if (groupsData) {
        setUserGroups(groupsData);
        // Pre-select all groups by default
        setSelectedGroups(new Set(groupsData.map(g => g.id)));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(groupId)) {
      newSelection.delete(groupId);
    } else {
      newSelection.add(groupId);
    }
    setSelectedGroups(newSelection);
    
    // If no groups selected, switch to solo
    if (newSelection.size === 0) {
      setPickType('solo');
    } else {
      setPickType('group');
    }
  };

  const selectAllGroups = () => {
    setSelectedGroups(new Set(userGroups.map(g => g.id)));
    setPickType('group');
  };

  const deselectAllGroups = () => {
    setSelectedGroups(new Set());
    setPickType('solo');
  };

  const confidenceLevels = [
    { level: 'Very Low', value: 20, color: '#FF3B30' },
    { level: 'Low', value: 40, color: '#FF9500' },
    { level: 'Medium', value: 60, color: '#FFCC00' },
    { level: 'High', value: 80, color: '#34C759' },
    { level: 'Very High', value: 95, color: '#00C7BE' },
  ];

  const handleSubmit = () => {
    const groupIds = Array.from(selectedGroups);
    const groupNames = userGroups
      .filter(g => selectedGroups.has(g.id))
      .map(g => g.name);

    onSubmit({
      pick: selectedPick,
      overUnderPick: selectedOverUnder,
      confidence,
      overUnderConfidence,
      reasoning,
      groups: groupNames, // For display
      groupIds: groupIds, // For database
      type: selectedGroups.size > 0 ? 'group' : 'solo',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Your Pick</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {showHelp && (
              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>How Picks Work:</Text>
                <Text style={styles.helpText}>• Solo picks are just for you to track</Text>
                <Text style={styles.helpText}>• Group picks are shared for discussion</Text>
                <Text style={styles.helpText}>• You can share to multiple groups at once</Text>
                <Text style={styles.helpText}>• All picks lock when the game starts</Text>
                <TouchableOpacity onPress={() => setShowHelp(false)}>
                  <Text style={styles.helpClose}>Got it!</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.awayTeam} @ {game.homeTeam}</Text>
              <Text style={styles.gameTime}>{game.time}</Text>
            </View>

            {/* SPREAD PICK SECTION */}
            <View style={styles.pickSection}>
              <Text style={styles.sectionTitle}>Who wins against the spread?</Text>
              <View style={styles.pickOptions}>
                <TouchableOpacity
                  style={[styles.pickButton, selectedPick === 'away' && styles.pickButtonSelected]}
                  onPress={() => setSelectedPick('away')}
                >
                  <Text style={[styles.pickButtonText, selectedPick === 'away' && styles.pickButtonTextSelected]}>
                    {game.spread.away}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickButton, selectedPick === 'home' && styles.pickButtonSelected]}
                  onPress={() => setSelectedPick('home')}
                >
                  <Text style={[styles.pickButtonText, selectedPick === 'home' && styles.pickButtonTextSelected]}>
                    {game.spread.home}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* OVER/UNDER PICK SECTION */}
            {game.overUnder && (
              <View style={styles.pickSection}>
                <Text style={styles.sectionTitle}>Over/Under Total: {game.overUnder}</Text>
                <View style={styles.pickOptions}>
                  <TouchableOpacity
                    style={[styles.pickButton, selectedOverUnder === 'over' && styles.pickButtonSelected]}
                    onPress={() => setSelectedOverUnder('over')}
                  >
                    <Text style={[styles.pickButtonText, selectedOverUnder === 'over' && styles.pickButtonTextSelected]}>
                      OVER {game.overUnder}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickButton, selectedOverUnder === 'under' && styles.pickButtonSelected]}
                    onPress={() => setSelectedOverUnder('under')}
                  >
                    <Text style={[styles.pickButtonText, selectedOverUnder === 'under' && styles.pickButtonTextSelected]}>
                      UNDER {game.overUnder}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SHARE TO GROUPS SECTION */}
            <View style={styles.shareSection}>
              <View style={styles.shareSectionHeader}>
                <Text style={styles.sectionTitle}>Share to Groups</Text>
                <TouchableOpacity onPress={() => setShowHelp(true)}>
                  <Text style={styles.helpLink}>How does this work?</Text>
                </TouchableOpacity>
              </View>

              {loadingGroups ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FF6B35" />
                  <Text style={styles.loadingText}>Loading your groups...</Text>
                </View>
              ) : userGroups.length === 0 ? (
                <View style={styles.noGroupsCard}>
                  <Text style={styles.noGroupsText}>You're not in any groups yet</Text>
                  <Text style={styles.noGroupsSubtext}>Your pick will be saved as solo</Text>
                </View>
              ) : (
                <>
                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity 
                      style={styles.quickActionButton}
                      onPress={selectAllGroups}
                    >
                      <Text style={styles.quickActionText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionButton}
                      onPress={deselectAllGroups}
                    >
                      <Text style={styles.quickActionText}>Solo Only</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Group List */}
                  <View style={styles.groupList}>
                    {userGroups.map(group => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.groupItem,
                          selectedGroups.has(group.id) && styles.groupItemSelected
                        ]}
                        onPress={() => toggleGroupSelection(group.id)}
                      >
                        <View style={styles.groupItemLeft}>
                          <View style={[
                            styles.checkbox,
                            selectedGroups.has(group.id) && styles.checkboxSelected
                          ]}>
                            {selectedGroups.has(group.id) && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                          <View>
                            <Text style={[
                              styles.groupName,
                              selectedGroups.has(group.id) && styles.groupNameSelected
                            ]}>
                              {group.name}
                            </Text>
                            <Text style={styles.groupSport}>{group.sport?.toUpperCase() || 'NFL'}</Text>
                          </View>
                        </View>
                        <Text style={styles.groupIcon}>👥</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Selection Summary */}
                  <View style={styles.selectionSummary}>
                    {selectedGroups.size === 0 ? (
                      <Text style={styles.summaryText}>🎯 Solo pick - only you will see this</Text>
                    ) : selectedGroups.size === 1 ? (
                      <Text style={styles.summaryText}>
                        👥 Sharing with {userGroups.find(g => selectedGroups.has(g.id))?.name}
                      </Text>
                    ) : (
                      <Text style={styles.summaryText}>
                        👥 Sharing with {selectedGroups.size} groups
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>

            {/* SPREAD CONFIDENCE LEVEL */}
            {selectedPick && (
              <View style={styles.confidenceSection}>
                <Text style={styles.sectionTitle}>Spread Pick Confidence</Text>
                <View style={styles.confidenceOptions}>
                  {confidenceLevels.map(({ level, value, color }) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.confidenceButton,
                        confidence === level && [styles.confidenceButtonSelected, { backgroundColor: color }]
                      ]}
                      onPress={() => setConfidence(level)}
                    >
                      <Text style={[
                        styles.confidenceText,
                        confidence === level && styles.confidenceTextSelected
                      ]}>
                        {level}
                      </Text>
                      <Text style={[
                        styles.confidenceValue,
                        confidence === level && styles.confidenceTextSelected
                      ]}>
                        {value}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* OVER/UNDER CONFIDENCE LEVEL */}
            {selectedOverUnder && (
              <View style={styles.confidenceSection}>
                <Text style={styles.sectionTitle}>Over/Under Confidence</Text>
                <View style={styles.confidenceOptions}>
                  {confidenceLevels.map(({ level, value, color }) => (
                    <TouchableOpacity
                      key={`ou-${level}`}
                      style={[
                        styles.confidenceButton,
                        overUnderConfidence === level && [styles.confidenceButtonSelected, { backgroundColor: color }]
                      ]}
                      onPress={() => setOverUnderConfidence(level)}
                    >
                      <Text style={[
                        styles.confidenceText,
                        overUnderConfidence === level && styles.confidenceTextSelected
                      ]}>
                        {level}
                      </Text>
                      <Text style={[
                        styles.confidenceValue,
                        overUnderConfidence === level && styles.confidenceTextSelected
                      ]}>
                        {value}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* REASONING SECTION */}
            <View style={styles.reasoningSection}>
              <Text style={styles.sectionTitle}>Share Your Reasoning</Text>
              <Text style={styles.reasoningSubtitle}>
                {selectedGroups.size > 0 
                  ? `Visible to members of ${selectedGroups.size} group${selectedGroups.size > 1 ? 's' : ''}`
                  : 'Only visible to you'}
              </Text>
              <TextInput
                style={styles.reasoningInput}
                placeholder="Why do you think this pick will hit? (optional)"
                placeholderTextColor="#8E8E93"
                value={reasoning}
                onChangeText={setReasoning}
                multiline
                maxLength={300}
              />
              <Text style={styles.characterCount}>{reasoning.length}/300</Text>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[styles.submitButton, (!selectedPick && !selectedOverUnder) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedPick && !selectedOverUnder}
            >
              <Text style={styles.submitButtonText}>
                {selectedGroups.size === 0 ? 'Save Pick' : `Share to ${selectedGroups.size} Group${selectedGroups.size > 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  scrollView: {
    maxHeight: '90%',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#FFF',
    fontSize: 24,
  },
  helpCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  helpTitle: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  helpClose: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  shareSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpLink: {
    color: '#FF6B35',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  shareSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  noGroupsCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  noGroupsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  noGroupsSubtext: {
    color: '#8E8E93',
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  groupList: {
    gap: 8,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupItemSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderColor: '#FF6B35',
  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  groupName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  groupNameSelected: {
    color: '#FF6B35',
  },
  groupSport: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  groupIcon: {
    fontSize: 18,
  },
  selectionSummary: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
  },
  summaryText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  gameInfo: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
  pickSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonSelected: {
    backgroundColor: '#FF6B35',
  },
  pickButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickButtonTextSelected: {
    color: '#FFF',
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  confidenceButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  confidenceButtonSelected: {
    // Background color set dynamically
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confidenceTextSelected: {
    color: '#FFF',
  },
  confidenceValue: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 2,
  },
  reasoningSection: {
    marginBottom: 20,
  },
  reasoningSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 8,
  },
  reasoningInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});