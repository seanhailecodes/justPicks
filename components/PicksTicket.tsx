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
  Dimensions,
  Keyboard
} from 'react-native';
import { supabase } from '../app/lib/supabase';

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
  sport: string;
}

interface PicksTicketProps {
  picks: TicketPick[];
  onUpdatePick: (gameId: string, betType: string, updates: Partial<TicketPick>) => void;
  onRemovePick: (gameId: string, betType: string) => void;
  onSave: (picks: TicketPick[], groupIds: string[], pickType: 'solo' | 'group') => void;
  onClear: () => void;
  userGroups: UserGroup[];
  currentSport: string;  // Current sport being viewed (e.g., 'nfl', 'nba', 'ncaab', 'soccer')
  userId?: string;       // Optional - needed for autocomplete suggestions
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PicksTicket({ 
  picks, 
  onUpdatePick, 
  onRemovePick, 
  onSave, 
  onClear,
  userGroups,
  currentSport,
  userId
}: PicksTicketProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [pickType, setPickType] = useState<'solo' | 'group'>('solo');
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Autocomplete state
  const [pastReasonings, setPastReasonings] = useState<string[]>([]);
  const [focusedPickKey, setFocusedPickKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Filter groups to only show those matching current sport
  const filteredGroups = userGroups.filter(g => 
    g.sport.toLowerCase() === currentSport.toLowerCase()
  );

  // Fetch past reasonings when userId is available
  useEffect(() => {
    const fetchPastReasonings = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('picks')
          .select('reasoning')
          .eq('user_id', userId)
          .not('reasoning', 'is', null)
          .not('reasoning', 'eq', '')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error('Error fetching past reasonings:', error);
          return;
        }
        
        // Get unique reasonings, preserve order (most recent first)
        const uniqueReasonings = [...new Set(
          data
            ?.map(p => p.reasoning?.trim())
            .filter(r => r && r.length > 0)
        )] as string[];
        
        setPastReasonings(uniqueReasonings);
      } catch (err) {
        console.error('Error in fetchPastReasonings:', err);
      }
    };
    
    fetchPastReasonings();
  }, [userId]);

  // Select all matching groups by default when filteredGroups changes
  useEffect(() => {
    if (filteredGroups.length > 0) {
      setSelectedGroups(filteredGroups.map(g => g.id));
      setPickType('group');
    } else {
      setSelectedGroups([]);
      setPickType('solo');
    }
  }, [currentSport, userGroups]);

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
    
    // Update suggestions based on input
    if (notes.length >= 2) {
      const filtered = pastReasonings.filter(r => 
        r.toLowerCase().includes(notes.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleNotesFocus = (gameId: string, betType: string) => {
    setFocusedPickKey(`${gameId}-${betType}`);
    // Show recent suggestions when focusing (even if empty input)
    const currentPick = picks.find(p => p.gameId === gameId && p.betType === betType);
    if (!currentPick?.notes || currentPick.notes.length < 2) {
      setSuggestions(pastReasonings.slice(0, 5));
    }
  };

  const handleNotesBlur = () => {
    // Delay hiding suggestions to allow tap to register
    setTimeout(() => {
      setFocusedPickKey(null);
      setSuggestions([]);
    }, 200);
  };

  const handleSuggestionTap = (gameId: string, betType: string, suggestion: string) => {
    onUpdatePick(gameId, betType, { notes: suggestion });
    setSuggestions([]);
    setFocusedPickKey(null);
    Keyboard.dismiss();
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
                  const pickKey = `${pick.gameId}-${pick.betType}`;
                  const showSuggestions = focusedPickKey === pickKey && suggestions.length > 0;
                  
                  return (
                  <View key={pickKey} style={[styles.pickItem, showSuggestions && styles.pickItemWithSuggestions]}>
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
                    
                    {/* Notes Input with Autocomplete */}
                    <View style={styles.notesContainer}>
                      <TextInput
                        style={styles.notesInput}
                        placeholder="Add note (optional)..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={pick.notes || ''}
                        onChangeText={(text) => handleNotesChange(pick.gameId, pick.betType, text)}
                        onFocus={() => handleNotesFocus(pick.gameId, pick.betType)}
                        onBlur={handleNotesBlur}
                        maxLength={200}
                      />
                      
                      {/* Suggestions Dropdown */}
                      {showSuggestions && (
                        <View style={styles.suggestionsContainer}>
                          <Text style={styles.suggestionsHeader}>Recent notes:</Text>
                          {suggestions.map((suggestion, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.suggestionItem}
                              onPress={() => handleSuggestionTap(pick.gameId, pick.betType, suggestion)}
                            >
                              <Text style={styles.suggestionText} numberOfLines={1}>
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  );
                })}

                {/* Share Options */}
                <View style={styles.shareSection}>
                  <Text style={styles.shareSectionTitle}>SHARE TO:</Text>
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
                    
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map(group => (
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
                      ))
                    ) : (
                      <Text style={styles.noGroupsText}>
                        No {currentSport.toUpperCase()} groups yet
                      </Text>
                    )}
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
    zIndex: 1,
  },
  pickItemWithSuggestions: {
    zIndex: 100,
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
  notesContainer: {
    position: 'relative',
    zIndex: 10,
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
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.4)',
    overflow: 'hidden',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionsHeader: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  suggestionText: {
    color: '#FFF',
    fontSize: 13,
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
    alignItems: 'center',
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
  noGroupsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontStyle: 'italic',
    marginLeft: 8,
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