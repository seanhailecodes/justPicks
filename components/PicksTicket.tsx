import { useEffect, useState } from 'react';
import { 
  Animated, 
  Modal, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Dimensions 
} from 'react-native';

export interface TicketPick {
  gameId: string;
  gameLabel: string;        // e.g., "SEA @ ATL"
  betType: 'spread' | 'total' | 'moneyline';
  side: 'home' | 'away' | 'over' | 'under';
  line: string;             // e.g., "-7.5" or "O 43.5"
  odds: string;             // e.g., "-110"
  confidence: 'Low' | 'Medium' | 'High';
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

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [expanded]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
    setPickType('group');
  };

  const handleConfidenceChange = (gameId: string, betType: string, confidence: 'Low' | 'Medium' | 'High') => {
    onUpdatePick(gameId, betType, { confidence });
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
            {/* Header */}
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>🎫 Picks Ticket</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.closeButton}>▼</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.ticketScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.ticketScrollContent}>
                {/* Picks List */}
                {picks.map((pick, index) => (
                  <View key={`${pick.gameId}-${pick.betType}`} style={styles.pickItem}>
                    <View style={styles.pickRow}>
                      {/* Pick Info */}
                      <View style={styles.pickInfoCompact}>
                        <Text style={styles.pickLine}>{pick.line}</Text>
                        <Text style={styles.pickGame}>{pick.gameLabel}</Text>
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
                  </View>
                ))}

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
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 90, // Above tab bar
    borderRadius: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    fontWeight: 'bold',
  },
  expandText: {
    color: '#FFF',
    fontSize: 13,
    opacity: 0.9,
  },
  expandedTicket: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  ticketTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#8E8E93',
    fontSize: 18,
    padding: 4,
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
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
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
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  pickGame: {
    color: '#8E8E93',
    fontSize: 13,
    flexShrink: 1,
  },
  removeButton: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  removeText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceRow: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  confidenceButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#3A3A3C',
    marginLeft: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  confidenceLow: {
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FF6961',
  },
  confidenceMedium: {
    backgroundColor: '#FF9500',
    borderWidth: 2,
    borderColor: '#FFB340',
  },
  confidenceHigh: {
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#5DD67B',
  },
  confidenceText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceTextActive: {
    color: '#FFF',
  },
  shareSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  shareSectionTitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 12,
  },
  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  shareButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
    marginBottom: 8,
  },
  shareButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButtonTextActive: {
    color: '#FFF',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    marginRight: 12,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});