import { useEffect, useState } from 'react';
import { 
  Animated, 
  Modal, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View,
  Dimensions 
} from 'react-native';

export interface TicketPick {
  gameId: string;
  gameLabel: string;        // e.g., "SEA @ ATL"
  homeTeam: string;         // e.g., "ATL"
  awayTeam: string;         // e.g., "SEA"
  betType: 'spread' | 'total' | 'moneyline';
  side: 'home' | 'away' | 'over' | 'under';
  line: string;             // e.g., "-7.5" or "O 43.5"
  odds: string;             // e.g., "-110"
  confidence: 'Low' | 'Medium' | 'High';
  notes?: string;           // Optional notes/reasoning
}

interface UserGroup {
  id: string;
  name: string;
}

interface PicksTicketProps {
  picks: TicketPick[];
  onUpdatePick: (gameId: string, betType: string, updates: Partial<TicketPick>) => void;
  onRemovePick: (gameId: string, betType: string) => void;
  onSave: (picks: TicketPick[], groupIds: string[], pickType: 'solo' | 'group') => void;
  onClear: () => void;
  userGroups: UserGroup[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PicksTicket({ 
  picks, 
  onUpdatePick, 
  onRemovePick, 
  onSave, 
  onClear,
  userGroups 
}: PicksTicketProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [pickType, setPickType] = useState<'solo' | 'group'>('solo');
  const [slideAnim] = useState(new Animated.Value(0));

  // Select all groups by default when userGroups loads
  useEffect(() => {
    if (userGroups.length > 0) {
      setSelectedGroups(userGroups.map(g => g.id));
      setPickType('group');
    }
  }, [userGroups]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [expanded]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSelection = prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      
      // If no groups selected, switch to solo mode
      if (newSelection.length === 0) {
        setPickType('solo');
      } else {
        setPickType('group');
      }
      
      return newSelection;
    });
  };

  const handleConfidenceChange = (gameId: string, betType: string, confidence: 'Low' | 'Medium' | 'High') => {
    onUpdatePick(gameId, betType, { confidence });
  };

  const handleNotesChange = (gameId: string, betType: string, notes: string) => {
    onUpdatePick(gameId, betType, { notes });
  };

  const handleSave = () => {
    onSave(picks, selectedGroups, pickType);
    setExpanded(false);
  };

  if (picks.length === 0) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT * 0.5],
  });

  return (
    <>
      {/* Backdrop when expanded */}
      {expanded && (
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={() => setExpanded(false)}
        />
      )}

      <Animated.View 
        style={[
          styles.container,
          { transform: [{ translateY: expanded ? 0 : 0 }] }
        ]}
      >
        {/* Collapsed Bar */}
        {!expanded && (
          <TouchableOpacity 
            style={styles.collapsedBar}
            onPress={() => setExpanded(true)}
          >
            <View style={styles.collapsedLeft}>
              <Text style={styles.ticketIcon}>🎫</Text>
              <Text style={styles.pickCount}>{picks.length} Pick{picks.length !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.expandText}>Review ▲</Text>
          </TouchableOpacity>
        )}

        {/* Expanded Ticket */}
        {expanded && (
          <View style={styles.expandedTicket}>
            {/* Handle Bar */}
            <View style={styles.handleBarContainer}>
              <View style={styles.handleBar} />
            </View>
            
            {/* Header */}
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>🎫 Picks Ticket</Text>
              <TouchableOpacity onPress={() => setExpanded(false)} style={styles.closeButtonContainer}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.ticketScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.ticketScrollContent}>
                {/* Picks List */}
                {picks.map((pick, index) => {
                  // Determine which team is picked
                  const pickedTeam = pick.side === 'home' ? pick.homeTeam : 
                                     pick.side === 'away' ? pick.awayTeam : null;
                  const isTotal = pick.betType === 'total';
                  const opponent = pick.side === 'home' ? pick.awayTeam : pick.homeTeam;
                  // @ when picking away team (playing at opponent), vs when picking home team
                  const vsText = pick.side === 'away' ? '@' : 'vs';
                  
                  return (
                  <View key={`${pick.gameId}-${pick.betType}`} style={styles.pickItem}>
                    <View style={styles.pickRow}>
                      {/* Pick Info */}
                      <View style={styles.pickInfoCompact}>
                        {isTotal ? (
                          // For O/U picks: "O 43.5 SEA @ ATL"
                          <>
                            <Text style={styles.pickLine}>{pick.line}</Text>
                            <Text style={styles.pickGame}>{pick.gameLabel}</Text>
                          </>
                        ) : (
                          // For spread/ML: highlight picked team
                          <>
                            <Text style={styles.pickLineTeam}>{pickedTeam}</Text>
                            <Text style={styles.pickLine}>{pick.line}</Text>
                            <Text style={styles.pickGameVs}>{vsText} {opponent}</Text>
                          </>
                        )}
                      </View>
                      
                      {/* Confidence Selector */}
                      <View style={styles.confidenceRow}>
                        <TouchableOpacity
                          style={[
                            styles.confidenceButton,
                            pick.confidence === 'Low' && styles.confidenceLow
                          ]}
                          onPress={() => handleConfidenceChange(pick.gameId, pick.betType, 'Low')}
                        >
                          <Text style={[
                            styles.confidenceText,
                            pick.confidence === 'Low' && styles.confidenceTextActive
                          ]}>Low</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.confidenceButton,
                            pick.confidence === 'Medium' && styles.confidenceMedium
                          ]}
                          onPress={() => handleConfidenceChange(pick.gameId, pick.betType, 'Medium')}
                        >
                          <Text style={[
                            styles.confidenceText,
                            pick.confidence === 'Medium' && styles.confidenceTextActive
                          ]}>Med</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.confidenceButton,
                            pick.confidence === 'High' && styles.confidenceHigh
                          ]}
                          onPress={() => handleConfidenceChange(pick.gameId, pick.betType, 'High')}
                        >
                          <Text style={[
                            styles.confidenceText,
                            pick.confidence === 'High' && styles.confidenceTextActive
                          ]}>High</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Remove Button */}
                      <TouchableOpacity 
                        onPress={() => onRemovePick(pick.gameId, pick.betType)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Notes Input */}
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add note (optional)..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={pick.notes || ''}
                      onChangeText={(text) => handleNotesChange(pick.gameId, pick.betType, text)}
                      maxLength={200}
                    />
                  </View>
                  );
                })}

                {/* Share Options */}
                <View style={styles.shareSection}>
                  <Text style={styles.shareSectionTitle}>Share to:</Text>
                  <View style={styles.shareOptions}>
                    <TouchableOpacity
                      style={[
                        styles.shareButton,
                        pickType === 'solo' && selectedGroups.length === 0 && styles.shareButtonActive
                      ]}
                      onPress={() => {
                        setPickType('solo');
                        setSelectedGroups([]);
                      }}
                    >
                      <Text style={[
                        styles.shareButtonText,
                        pickType === 'solo' && selectedGroups.length === 0 && styles.shareButtonTextActive
                      ]}>
                        🎯 Solo
                      </Text>
                    </TouchableOpacity>
                    
                    {userGroups.map(group => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.shareButton,
                          selectedGroups.includes(group.id) && styles.shareButtonActive
                        ]}
                        onPress={() => toggleGroup(group.id)}
                      >
                        <Text style={[
                          styles.shareButtonText,
                          selectedGroups.includes(group.id) && styles.shareButtonTextActive
                        ]}>
                          👥 {group.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons - Fixed at bottom */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  Save {picks.length} Pick{picks.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  collapsedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 90,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  pickCount: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  expandText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  expandedTicket: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  ticketTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeButtonContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  picksList: {
    maxHeight: SCREEN_HEIGHT * 0.35,
    paddingHorizontal: 20,
  },
  ticketScrollView: {
    height: SCREEN_HEIGHT * 0.45,
  },
  ticketScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    minHeight: 200,
  },
  pickItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pickInfo: {
    flex: 1,
  },
  pickLine: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  pickLineTeam: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  pickGame: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    flexShrink: 1,
  },
  pickGameVs: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  removeButton: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  removeText: {
    color: 'rgba(255,59,48,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceRow: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  confidenceButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confidenceLow: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    borderColor: 'rgba(255,59,48,0.3)',
  },
  confidenceMedium: {
    backgroundColor: 'rgba(255,149,0,0.9)',
    borderColor: 'rgba(255,149,0,0.3)',
  },
  confidenceHigh: {
    backgroundColor: 'rgba(52,199,89,0.9)',
    borderColor: 'rgba(52,199,89,0.3)',
  },
  confidenceText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  confidenceTextActive: {
    color: '#FFF',
  },
  notesInput: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#FFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shareSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  shareSectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  shareButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 8,
    marginBottom: 8,
  },
  shareButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  shareButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  shareButtonTextActive: {
    color: '#FFF',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,59,48,0.5)',
    alignItems: 'center',
    marginRight: 12,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#34C759',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});