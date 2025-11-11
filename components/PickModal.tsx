import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [reasoning, setReasoning] = useState('');
  const [pickType, setPickType] = useState('group'); // Default to group (Syndicate)
  const [showHelp, setShowHelp] = useState(false);

  const SYNDICATE = 'The Syndicate'; // Your brand name

  // Reset state when modal opens with new data
  useEffect(() => {
    if (visible) {
      setSelectedPick(currentPick || '');
      setSelectedOverUnder(currentOverUnderPick || '');
      setPickType('group'); // Always default to sharing with Syndicate
      setConfidence('Medium');
      setReasoning('');
    }
  }, [visible, currentPick, currentOverUnderPick, groups]);

  const confidenceLevels = [
    { level: 'Very Low', value: 20, color: '#FF3B30' },
    { level: 'Low', value: 40, color: '#FF9500' },
    { level: 'Medium', value: 60, color: '#FFCC00' },
    { level: 'High', value: 80, color: '#34C759' },
    { level: 'Very High', value: 95, color: '#00C7BE' },
  ];

  const handleSubmit = () => {
    onSubmit({
      pick: selectedPick,
      overUnderPick: selectedOverUnder,
      confidence,
      reasoning,
      groups: pickType === 'group' ? [SYNDICATE] : [],
      type: pickType,
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
                <Text style={styles.helpText}>• {SYNDICATE} picks are shared for discussion</Text>
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

            {/* OVER/UNDER PICK SECTION - NEW */}
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

            {/* SHARE TYPE SECTION */}
            <View style={styles.shareSection}>
              <View style={styles.shareSectionHeader}>
                <Text style={styles.sectionTitle}>How do you want to track this?</Text>
                <TouchableOpacity onPress={() => setShowHelp(true)}>
                  <Text style={styles.helpLink}>What's the difference?</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.shareOptions}>
                <TouchableOpacity
                  style={[styles.shareButton, pickType === 'solo' && styles.shareButtonSelected]}
                  onPress={() => setPickType('solo')}
                >
                  <Text style={styles.shareIcon}>🎯</Text>
                  <Text style={[styles.shareText, pickType === 'solo' && styles.shareTextSelected]}>
                    Just for me
                  </Text>
                  <Text style={styles.shareSubtext}>Private tracking</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.shareButton, pickType === 'group' && styles.shareButtonSelected]}
                  onPress={() => setPickType('group')}
                >
                  <Text style={styles.shareIcon}>👥</Text>
                  <Text style={[styles.shareText, pickType === 'group' && styles.shareTextSelected]}>
                    Share with {SYNDICATE}
                  </Text>
                  <Text style={styles.shareSubtext}>Discuss with everyone</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIDENCE LEVEL SECTION */}
            <View style={styles.confidenceSection}>
              <Text style={styles.sectionTitle}>Confidence Level</Text>
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

            {/* REASONING SECTION */}
            <View style={styles.reasoningSection}>
              <Text style={styles.sectionTitle}>Share Your Reasoning</Text>
              <Text style={styles.reasoningSubtitle}>
                This will be visible to all friends in "{SYNDICATE}"
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
                {pickType === 'solo' ? 'Save Pick' : 'Share Pick'}
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
  shareOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  shareIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  shareText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shareTextSelected: {
    color: '#FF6B35',
  },
  shareSubtext: {
    color: '#8E8E93',
    fontSize: 11,
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
    // Background color set dynamically in the component
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